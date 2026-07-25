"use client";

import { CheckCircle2, HelpCircle, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminDeleteWish, adminListWishes } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { WishesResponse } from "@/lib/types";

export default function WishesManager() {
  const [data, setData] = useState<WishesResponse | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const load = async () => {
    const token = getToken();
    if (!token) return;
    setData(await adminListWishes(token, page, limit));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount/page change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const remove = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await adminDeleteWish(token, id);
      load();
      toast.success("Ucapan dihapus");
    } catch {
      toast.error("Gagal menghapus ucapan");
    }
  };

  if (!data) return <p className="text-sm text-[#8b7355]/50">Memuat...</p>;

  const totalPages = Math.max(1, Math.ceil(data.total / limit));

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
          <p className="mt-1 text-xl font-semibold text-[#8b7355]">
            {data.summary.hadir}
          </p>
          <p className="text-xs text-[#8b7355]/50">Hadir</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <XCircle className="mx-auto h-5 w-5 text-red-500" />
          <p className="mt-1 text-xl font-semibold text-[#8b7355]">
            {data.summary.tidak_hadir}
          </p>
          <p className="text-xs text-[#8b7355]/50">Tidak Hadir</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <HelpCircle className="mx-auto h-5 w-5 text-yellow-600" />
          <p className="mt-1 text-xl font-semibold text-[#8b7355]">
            {data.summary.masih_ragu}
          </p>
          <p className="text-xs text-[#8b7355]/50">Masih Ragu</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {data.items.map((w) => (
          <div key={w.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#8b7355]">{w.name}</p>
                <p className="text-xs text-[#8b7355]/50">
                  {w.attendance.replace("_", " ")} · {w.guest_count} tamu ·{" "}
                  {new Date(w.created_at).toLocaleString("id-ID")}
                </p>
                {w.message && (
                  <p className="mt-2 text-sm text-[#8b7355]/80">{w.message}</p>
                )}
              </div>
              <button
                onClick={() => remove(w.id)}
                className="flex-none text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-8 w-8 rounded-full text-xs ${
                page === i + 1
                  ? "bg-[#c9a876] text-white"
                  : "bg-white text-[#8b7355]/60"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
