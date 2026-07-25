"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { adminUpdateSettings } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Settings } from "@/lib/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-[#8b7355]/60">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#c9a876]/30 bg-white px-4 py-2.5 text-sm text-[#8b7355] outline-none focus:border-[#c9a876]";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-[#c9a876]/30 bg-white"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </Field>
  );
}

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function SettingsForm({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: (s: Settings) => void;
}) {
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const updated = await adminUpdateSettings(token, form);
      onSaved(updated);
      toast.success("Pengaturan tersimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-[#8b7355]">
          Informasi Mempelai
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nama Panggilan Pria">
            <input
              className={inputClass}
              value={form.groom_name}
              onChange={(e) => set("groom_name", e.target.value)}
            />
          </Field>
          <Field label="Nama Panggilan Wanita">
            <input
              className={inputClass}
              value={form.bride_name}
              onChange={(e) => set("bride_name", e.target.value)}
            />
          </Field>
          <Field label="Nama Lengkap Pria">
            <input
              className={inputClass}
              value={form.groom_full_name}
              onChange={(e) => set("groom_full_name", e.target.value)}
            />
          </Field>
          <Field label="Nama Lengkap Wanita">
            <input
              className={inputClass}
              value={form.bride_full_name}
              onChange={(e) => set("bride_full_name", e.target.value)}
            />
          </Field>
          <Field label="Orang Tua Pria">
            <input
              className={inputClass}
              value={form.groom_parents}
              onChange={(e) => set("groom_parents", e.target.value)}
            />
          </Field>
          <Field label="Orang Tua Wanita">
            <input
              className={inputClass}
              value={form.bride_parents}
              onChange={(e) => set("bride_parents", e.target.value)}
            />
          </Field>
          <Field label="Instagram Pria">
            <input
              className={inputClass}
              value={form.groom_instagram}
              onChange={(e) => set("groom_instagram", e.target.value)}
              placeholder="@username"
            />
          </Field>
          <Field label="Instagram Wanita">
            <input
              className={inputClass}
              value={form.bride_instagram}
              onChange={(e) => set("bride_instagram", e.target.value)}
              placeholder="@username"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-[#8b7355]">
          Tanggal &amp; Kutipan
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal &amp; Waktu Pernikahan">
            <input
              type="datetime-local"
              className={inputClass}
              value={toDatetimeLocal(form.wedding_date)}
              onChange={(e) =>
                set("wedding_date", new Date(e.target.value).toISOString())
              }
            />
          </Field>
          <Field label="URL Musik Latar (opsional)">
            <input
              className={inputClass}
              value={form.music_url}
              onChange={(e) => set("music_url", e.target.value)}
              placeholder="https://... atau /uploads/xxx.mp3"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Kutipan">
              <textarea
                rows={3}
                className={inputClass}
                value={form.quote}
                onChange={(e) => set("quote", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Sumber Kutipan">
            <input
              className={inputClass}
              value={form.quote_author}
              onChange={(e) => set("quote_author", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-[#8b7355]">
          Tema &amp; Warna
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Warna Utama"
            value={form.primary_color}
            onChange={(v) => set("primary_color", v)}
          />
          <ColorField
            label="Warna Sekunder"
            value={form.secondary_color}
            onChange={(v) => set("secondary_color", v)}
          />
          <ColorField
            label="Warna Aksen"
            value={form.accent_color}
            onChange={(v) => set("accent_color", v)}
          />
          <ColorField
            label="Warna Latar"
            value={form.background_color}
            onChange={(v) => set("background_color", v)}
          />
          <Field label="Font Judul (CSS font-family)">
            <input
              className={inputClass}
              value={form.font_heading}
              onChange={(e) => set("font_heading", e.target.value)}
            />
          </Field>
          <Field label="Font Isi (CSS font-family)">
            <input
              className={inputClass}
              value={form.font_body}
              onChange={(e) => set("font_body", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-[#8b7355]">Akad Nikah</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal">
            <input
              className={inputClass}
              value={form.akad_date}
              onChange={(e) => set("akad_date", e.target.value)}
            />
          </Field>
          <Field label="Waktu">
            <input
              className={inputClass}
              value={form.akad_time}
              onChange={(e) => set("akad_time", e.target.value)}
            />
          </Field>
          <Field label="Lokasi">
            <input
              className={inputClass}
              value={form.akad_location}
              onChange={(e) => set("akad_location", e.target.value)}
            />
          </Field>
          <Field label="Link Google Maps">
            <input
              className={inputClass}
              value={form.akad_maps_url}
              onChange={(e) => set("akad_maps_url", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Alamat">
              <input
                className={inputClass}
                value={form.akad_address}
                onChange={(e) => set("akad_address", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-[#8b7355]">Resepsi</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal">
            <input
              className={inputClass}
              value={form.resepsi_date}
              onChange={(e) => set("resepsi_date", e.target.value)}
            />
          </Field>
          <Field label="Waktu">
            <input
              className={inputClass}
              value={form.resepsi_time}
              onChange={(e) => set("resepsi_time", e.target.value)}
            />
          </Field>
          <Field label="Lokasi">
            <input
              className={inputClass}
              value={form.resepsi_location}
              onChange={(e) => set("resepsi_location", e.target.value)}
            />
          </Field>
          <Field label="Link Google Maps">
            <input
              className={inputClass}
              value={form.resepsi_maps_url}
              onChange={(e) => set("resepsi_maps_url", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Alamat">
              <input
                className={inputClass}
                value={form.resepsi_address}
                onChange={(e) => set("resepsi_address", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-[#8b7355]">
          Info Hadiah (opsional)
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Nama Bank">
            <input
              className={inputClass}
              value={form.bank_name}
              onChange={(e) => set("bank_name", e.target.value)}
            />
          </Field>
          <Field label="Nomor Rekening">
            <input
              className={inputClass}
              value={form.bank_account_number}
              onChange={(e) => set("bank_account_number", e.target.value)}
            />
          </Field>
          <Field label="Atas Nama">
            <input
              className={inputClass}
              value={form.bank_account_name}
              onChange={(e) => set("bank_account_name", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 rounded-full bg-[#8b7355] px-6 py-2.5 text-sm font-medium text-white shadow-md disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}
