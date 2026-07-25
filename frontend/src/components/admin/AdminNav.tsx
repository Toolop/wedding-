"use client";

import { LogOut, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export type Tab = "settings" | "photos" | "story" | "gallery" | "wishes";

const TABS: { id: Tab; label: string }[] = [
  { id: "settings", label: "Pengaturan" },
  { id: "photos", label: "Foto Utama" },
  { id: "story", label: "Kisah Cinta" },
  { id: "gallery", label: "Galeri" },
  { id: "wishes", label: "Ucapan & RSVP" },
];

export default function AdminNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const router = useRouter();

  return (
    <div className="border-b border-[#c9a876]/20 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="font-semibold text-[#8b7355]">Wedding Admin</h1>
          <p className="text-xs text-[#8b7355]/50">Kelola undangan pernikahan</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-[#c9a876]/40 px-3 py-1.5 text-xs text-[#8b7355] hover:bg-[#f5f0e8]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Lihat Undangan
          </a>
          <button
            onClick={() => {
              clearToken();
              router.push("/admin/login");
            }}
            className="flex items-center gap-1.5 rounded-full bg-[#8b7355] px-3 py-1.5 text-xs text-white hover:opacity-90"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ${
              active === tab.id
                ? "bg-[#c9a876] text-white"
                : "text-[#8b7355]/70 hover:bg-[#f5f0e8]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
