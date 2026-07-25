"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  adminCreateStory,
  adminDeleteStory,
  adminListStory,
  adminUpdateStory,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { StoryEvent } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-[#c9a876]/30 bg-white px-3 py-2 text-sm text-[#8b7355] outline-none focus:border-[#c9a876]";

const ICON_OPTIONS = ["sparkles", "heart", "gem", "church", "star"];

export default function StoryManager() {
  const [items, setItems] = useState<StoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = getToken();
    if (!token) return;
    const data = await adminListStory(token);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const update = (id: number, patch: Partial<StoryEvent>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const save = async (item: StoryEvent) => {
    const token = getToken();
    if (!token) return;
    try {
      await adminUpdateStory(token, item.id, item);
      toast.success("Kisah tersimpan");
    } catch {
      toast.error("Gagal menyimpan kisah");
    }
  };

  const remove = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await adminDeleteStory(token, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Gagal menghapus kisah");
    }
  };

  const addNew = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const created = await adminCreateStory(token, {
        event_date: "",
        title: "Momen Baru",
        description: "",
        icon: "heart",
        sort_order: items.length + 1,
      });
      setItems((prev) => [...prev, created]);
    } catch {
      toast.error("Gagal menambah kisah");
    }
  };

  if (loading) return <p className="text-sm text-[#8b7355]/50">Memuat...</p>;

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              className={inputClass}
              placeholder="Tanggal (mis. Januari 2020)"
              value={item.event_date}
              onChange={(e) => update(item.id, { event_date: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Judul"
              value={item.title}
              onChange={(e) => update(item.id, { title: e.target.value })}
            />
            <select
              className={inputClass}
              value={item.icon}
              onChange={(e) => update(item.id, { icon: e.target.value })}
            >
              {ICON_OPTIONS.map((ic) => (
                <option key={ic} value={ic}>
                  {ic}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className={`${inputClass} mt-3`}
            rows={2}
            placeholder="Deskripsi"
            value={item.description}
            onChange={(e) => update(item.id, { description: e.target.value })}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => save(item)}
              className="flex items-center gap-1.5 rounded-full bg-[#8b7355] px-4 py-1.5 text-xs text-white"
            >
              <Save className="h-3.5 w-3.5" />
              Simpan
            </button>
            <button
              onClick={() => remove(item.id)}
              className="flex items-center gap-1.5 rounded-full border border-red-300 px-4 py-1.5 text-xs text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addNew}
        className="flex items-center gap-2 rounded-full border border-dashed border-[#c9a876] px-4 py-2 text-sm text-[#8b7355] hover:bg-white"
      >
        <Plus className="h-4 w-4" />
        Tambah Momen
      </button>
    </div>
  );
}
