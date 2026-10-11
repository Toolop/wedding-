"use client";

import { createContext, useContext } from "react";
import { getGuestByCode } from "@/lib/api";
import { getToken } from "@/lib/auth";

/** who the invitation was sent to; `code` is set when it came from the guest list */
export type InvitedGuest = { name: string; code?: string };

const GuestContext = createContext<InvitedGuest | null>(null);

export const GuestProvider = GuestContext.Provider;

export function useInvitedGuest() {
  return useContext(GuestContext);
}

/**
 * Whether this visit may open the invitation. Only a personal link from the
 * guest list (`?u=<code>`) opens it; the admin can preview without one.
 */
export type GuestAccess =
  | { status: "ok"; guest: InvitedGuest | null }
  | { status: "missing" | "invalid" }
  /** the check itself failed (offline, too many attempts); worth retrying */
  | { status: "error" };

export async function resolveGuestAccess(): Promise<GuestAccess> {
  const params = new URLSearchParams(window.location.search);
  const preview = params.has("preview");
  const code = params.get("u")?.trim();
  if (!code) {
    // the admin's "Lihat undangan" button
    return preview && getToken() ? { status: "ok", guest: null } : { status: "missing" };
  }
  try {
    const guest = await getGuestByCode(code, preview);
    return guest ? { status: "ok", guest } : { status: "invalid" };
  } catch {
    return { status: "error" };
  }
}

/**
 * Stands in for a name input when the guest is already known: shows the name
 * with a "bukan saya?" escape hatch for someone using a forwarded link.
 */
export function KnownName({
  labelClass,
  name,
  onChange,
}: {
  labelClass: string;
  name: string;
  onChange: () => void;
}) {
  return (
    <div>
      <span className={labelClass}>Nama</span>
      <div className="mt-1 flex items-baseline justify-between gap-3 border-b-2 border-dashed border-[#2B2522]/25 px-0.5 pb-1.5 pt-1">
        <p className="font-heading min-w-0 truncate text-xl">{name}</p>
        <button
          type="button"
          onClick={onChange}
          className="flex-none font-code text-[10px] underline decoration-dashed underline-offset-2 opacity-60 transition-opacity hover:opacity-100"
        >
          bukan saya?
        </button>
      </div>
    </div>
  );
}
