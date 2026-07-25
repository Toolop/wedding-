"use client";

import { useEffect, useState } from "react";
import { getInvitation, adminUpdateSettings } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Settings } from "@/lib/types";
import AdminNav, { type Tab } from "@/components/admin/AdminNav";
import SettingsForm from "@/components/admin/SettingsForm";
import PhotosManager from "@/components/admin/PhotosManager";
import StoryManager from "@/components/admin/StoryManager";
import GalleryManager from "@/components/admin/GalleryManager";
import WishesManager from "@/components/admin/WishesManager";

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("settings");
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getInvitation().then((d) => setSettings(d.settings));
  }, []);

  const patchSettings = async (partial: Partial<Settings>) => {
    const token = getToken();
    if (!token || !settings) return;
    const updated = await adminUpdateSettings(token, partial);
    setSettings(updated);
  };

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#8b7355]/60">
        Memuat data...
      </div>
    );
  }

  return (
    <div>
      <AdminNav active={tab} onChange={setTab} />
      <div className="mx-auto max-w-5xl px-6 py-8">
        {tab === "settings" && (
          <SettingsForm settings={settings} onSaved={setSettings} />
        )}
        {tab === "photos" && (
          <PhotosManager settings={settings} onChange={patchSettings} />
        )}
        {tab === "story" && <StoryManager />}
        {tab === "gallery" && <GalleryManager />}
        {tab === "wishes" && <WishesManager />}
      </div>
    </div>
  );
}
