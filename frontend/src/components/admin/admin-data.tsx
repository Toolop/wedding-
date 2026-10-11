"use client";

import { LoaderCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminUpdateSettings, getInvitation } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Settings } from "@/lib/types";

type AdminData = {
  settings: Settings;
  /** PUT a partial settings patch and keep the shared copy in sync */
  updateSettings: (patch: Partial<Settings>) => Promise<Settings>;
  /** re-read settings after something else changed them (e.g. a photo upload) */
  refresh: () => Promise<void>;
};

const AdminDataContext = createContext<AdminData | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getInvitation();
      setSettings(data.settings);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refresh();
  }, [refresh]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const token = getToken();
    if (!token) throw new Error("not signed in");
    const updated = await adminUpdateSettings(token, patch);
    setSettings(updated);
    return updated;
  }, []);

  if (!settings) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        {failed ? (
          <>
            <p>Gagal memuat data undangan. Pastikan backend berjalan.</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Coba lagi
            </Button>
          </>
        ) : (
          <>
            <LoaderCircle className="size-5 animate-spin" />
            Memuat data...
          </>
        )}
      </div>
    );
  }

  return (
    <AdminDataContext.Provider value={{ settings, updateSettings, refresh }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used inside AdminDataProvider");
  return ctx;
}
