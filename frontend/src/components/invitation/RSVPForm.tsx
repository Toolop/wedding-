"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import { submitWish } from "@/lib/api";
import SectionHeading from "./SectionHeading";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  attendance: z.enum(["hadir", "tidak_hadir", "masih_ragu"]),
  guest_count: z.coerce.number().min(1).max(10),
  message: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  "mt-1.5 w-full rounded-sm border border-gold/40 bg-surface px-4 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent";
const labelClass = "font-label text-[10px] text-primary/60";

export default function RSVPForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { attendance: "hadir", guest_count: 1, message: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await submitWish({ ...values, message: values.message || "" });
      toast.success("Terima kasih! Konfirmasi Anda telah terkirim.");
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#4a7fa5", "#b7995f", "#2e3237"],
      });
      reset();
      onSubmitted?.();
    } catch {
      toast.error("Gagal mengirim. Silakan coba lagi.");
    }
  };

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-lg">
        <SectionHeading label="RSVP" title="Konfirmasi Kehadiran" />

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit(onSubmit)}
          className="frame-elegant relative mt-12 space-y-4 rounded-sm bg-secondary/30 p-6 backdrop-blur-md sm:p-8"
        >
          <div>
            <label className={labelClass}>Nama</label>
            <input
              {...register("name")}
              placeholder="Nama lengkap Anda"
              className={fieldClass}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Kehadiran</label>
            <select {...register("attendance")} className={fieldClass}>
              <option value="hadir">Hadir</option>
              <option value="tidak_hadir">Tidak Hadir</option>
              <option value="masih_ragu">Masih Ragu</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Jumlah Tamu</label>
            <input
              type="number"
              min={1}
              max={10}
              {...register("guest_count")}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Ucapan &amp; Doa</label>
            <textarea
              {...register("message")}
              rows={3}
              placeholder="Tuliskan ucapan dan doa untuk kedua mempelai..."
              className={`${fieldClass} resize-none`}
            />
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-3.5 font-label text-[11px] text-surface shadow-md shadow-primary/20 transition-shadow hover:shadow-lg disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Mengirim..." : "Kirim Konfirmasi"}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}
