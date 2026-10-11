"use client";

import { LoaderCircle, Save, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Settings } from "@/lib/types";
import { useAdminData } from "./admin-data";

/** settings keys that hold plain strings (everything an editor form can bind to) */
export type TextKey = {
  [K in keyof Settings]: Settings[K] extends string ? K : never;
}[keyof Settings];

type Draft<K extends TextKey> = Pick<Settings, K>;

function pick<K extends TextKey>(settings: Settings, keys: readonly K[]): Draft<K> {
  return Object.fromEntries(keys.map((k) => [k, settings[k] ?? ""])) as Draft<K>;
}

/**
 * Local draft of a slice of settings. Only changed keys are sent on save, so
 * two pages editing different slices never overwrite each other.
 * Pass a module-level `keys` array.
 */
export function useSettingsDraft<K extends TextKey>(keys: readonly K[]) {
  const { settings, updateSettings } = useAdminData();
  const [draft, setDraft] = useState<Draft<K>>(() => pick(settings, keys));
  const [saving, setSaving] = useState(false);

  const changed = keys.filter((k) => draft[k] !== settings[k]);
  const dirty = changed.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (key: K, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const reset = () => setDraft(pick(settings, keys));

  const save = async () => {
    setSaving(true);
    try {
      const patch = Object.fromEntries(changed.map((k) => [k, draft[k]]));
      const updated = await updateSettings(patch);
      // re-pick so server-normalised values (e.g. dates) don't read as unsaved edits
      setDraft(pick(updated, keys));
      toast.success("Perubahan tersimpan");
    } catch {
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  return { draft, set, dirty, saving, save, reset };
}

export type FieldDef<K extends TextKey> = {
  key: K;
  label: string;
  placeholder?: string;
  hint?: string;
  type?: "text" | "url" | "color" | "datetime" | "textarea";
  /** span both columns of the grid */
  wide?: boolean;
};

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function FieldGrid<K extends TextKey>({
  fields,
  draft,
  set,
}: {
  fields: FieldDef<K>[];
  draft: Draft<K>;
  set: (key: K, value: string) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((f) => {
        const id = `field-${f.key}`;
        const value = draft[f.key] as string;
        let control: React.ReactNode;

        if (f.type === "textarea") {
          control = (
            <Textarea
              id={id}
              rows={3}
              value={value}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
            />
          );
        } else if (f.type === "color") {
          control = (
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`${f.label} (pemilih warna)`}
                value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-9 w-11 shrink-0 cursor-pointer rounded-md border bg-background p-1"
              />
              <Input
                id={id}
                value={value}
                placeholder="#000000"
                className="font-mono"
                onChange={(e) => set(f.key, e.target.value)}
              />
            </div>
          );
        } else if (f.type === "datetime") {
          control = (
            <Input
              id={id}
              type="datetime-local"
              value={toDatetimeLocal(value)}
              // an empty date can't be stored, so clearing the picker keeps the old value
              onChange={(e) => e.target.value && set(f.key, new Date(e.target.value).toISOString())}
            />
          );
        } else {
          control = (
            <Input
              id={id}
              type={f.type === "url" ? "url" : "text"}
              value={value}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
            />
          );
        }

        return (
          <div key={f.key} className={cn("grid gap-2", f.wide && "sm:col-span-2")}>
            <Label htmlFor={id}>{f.label}</Label>
            {control}
            {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

/** floating bar that appears while a settings page has unsaved edits */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-4 z-10 mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur transition-all duration-200",
        dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
      aria-hidden={!dirty}
    >
      <p className="text-sm text-muted-foreground">Ada perubahan yang belum disimpan</p>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onReset} disabled={saving} tabIndex={dirty ? 0 : -1}>
          <Undo2 />
          Batal
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving} tabIndex={dirty ? 0 : -1}>
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
          Simpan
        </Button>
      </div>
    </div>
  );
}
