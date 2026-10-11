import axios from "axios";
import { clearToken } from "./auth";
import type {
  GalleryImage,
  GiftAccount,
  GiftConfirmation,
  Guest,
  GuestImportResult,
  InvitationData,
  Settings,
  StoryEvent,
  Wish,
  WishesResponse,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function mediaUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  // backend uploads live on the API host; anything else (e.g. /images/...)
  // is a static asset served by the frontend itself
  if (path.startsWith("/uploads")) return `${API_URL}${path}`;
  return path;
}

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      window.location.pathname.startsWith("/admin") &&
      window.location.pathname !== "/admin/login"
    ) {
      clearToken();
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export function authHeader(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ---- Public ----

export async function getInvitation(): Promise<InvitationData> {
  const res = await api.get("/invitation");
  return res.data.data;
}

/**
 * The invited guest behind a personal link, or null when no guest has that
 * code. Throws when the check itself failed (offline, rate limited).
 */
export async function getGuestByCode(
  code: string,
  preview = false
): Promise<{ name: string; code: string } | null> {
  try {
    const res = await api.get(`/guests/${encodeURIComponent(code)}`, {
      params: preview ? { preview: 1 } : undefined,
    });
    return res.data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function submitWish(payload: {
  name: string;
  attendance: string;
  guest_count: number;
  message: string;
  guest_code?: string;
}): Promise<Wish> {
  const res = await api.post("/wishes", payload);
  return res.data.data;
}

export async function getWishes(page = 1, limit = 10): Promise<WishesResponse> {
  const res = await api.get("/wishes", { params: { page, limit } });
  return res.data.data;
}

export async function submitGiftConfirmation(payload: {
  name: string;
  account_id?: number;
  amount?: number;
  message: string;
  file: File;
}): Promise<void> {
  const form = new FormData();
  form.append("name", payload.name);
  if (payload.account_id) form.append("account_id", String(payload.account_id));
  if (payload.amount) form.append("amount", String(payload.amount));
  form.append("message", payload.message);
  form.append("file", payload.file);
  await api.post("/gift-confirmations", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// ---- Admin ----

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await api.post("/admin/login", { username, password });
  return res.data.data.token;
}

export async function adminUpdateSettings(
  token: string,
  payload: Partial<Settings>
): Promise<Settings> {
  const res = await api.put("/admin/settings", payload, authHeader(token));
  return res.data.data;
}

export async function adminUpload(
  token: string,
  file: File,
  target: "hero" | "couple" | "groom" | "bride" | "akad_map" | "resepsi_map" | "akad_venue" | "resepsi_venue" | "gallery"
): Promise<{ url: string; target: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("target", target);
  const res = await api.post("/admin/upload", form, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.data;
}

export async function adminListStory(token: string): Promise<StoryEvent[]> {
  const res = await api.get("/admin/story", authHeader(token));
  return res.data.data;
}

export async function adminCreateStory(
  token: string,
  payload: Partial<StoryEvent>
): Promise<StoryEvent> {
  const res = await api.post("/admin/story", payload, authHeader(token));
  return res.data.data;
}

export async function adminUpdateStory(
  token: string,
  id: number,
  payload: Partial<StoryEvent>
): Promise<StoryEvent> {
  const res = await api.put(`/admin/story/${id}`, payload, authHeader(token));
  return res.data.data;
}

export async function adminDeleteStory(token: string, id: number): Promise<void> {
  await api.delete(`/admin/story/${id}`, authHeader(token));
}

export async function adminListGallery(token: string): Promise<GalleryImage[]> {
  const res = await api.get("/admin/gallery", authHeader(token));
  return res.data.data;
}

export async function adminUpdateGalleryImage(
  token: string,
  id: number,
  payload: Partial<Pick<GalleryImage, "caption" | "sort_order">>
): Promise<GalleryImage> {
  const res = await api.put(`/admin/gallery/${id}`, payload, authHeader(token));
  return res.data.data;
}

export async function adminDeleteGalleryImage(token: string, id: number): Promise<void> {
  await api.delete(`/admin/gallery/${id}`, authHeader(token));
}

export async function adminListWishes(
  token: string,
  page = 1,
  limit = 20
): Promise<WishesResponse> {
  const res = await api.get("/wishes", { params: { page, limit }, ...authHeader(token) });
  return res.data.data;
}

/** every RSVP, walking the API's 100-per-page cap */
export async function adminListAllWishes(token: string): Promise<Wish[]> {
  const limit = 100;
  const all: Wish[] = [];
  for (let page = 1; ; page++) {
    const res = await adminListWishes(token, page, limit);
    all.push(...res.items);
    if (res.items.length < limit || all.length >= res.total) return all;
  }
}

export async function adminDeleteWish(token: string, id: number): Promise<void> {
  await api.delete(`/admin/wishes/${id}`, authHeader(token));
}

export async function adminListGiftAccounts(token: string): Promise<GiftAccount[]> {
  const res = await api.get("/admin/gift-accounts", authHeader(token));
  return res.data.data;
}

export async function adminCreateGiftAccount(
  token: string,
  payload: Partial<GiftAccount>
): Promise<GiftAccount> {
  const res = await api.post("/admin/gift-accounts", payload, authHeader(token));
  return res.data.data;
}

export async function adminUpdateGiftAccount(
  token: string,
  id: number,
  payload: Partial<GiftAccount>
): Promise<GiftAccount> {
  const res = await api.put(`/admin/gift-accounts/${id}`, payload, authHeader(token));
  return res.data.data;
}

export async function adminDeleteGiftAccount(token: string, id: number): Promise<void> {
  await api.delete(`/admin/gift-accounts/${id}`, authHeader(token));
}

export async function adminListGiftConfirmations(token: string): Promise<GiftConfirmation[]> {
  const res = await api.get("/admin/gift-confirmations", authHeader(token));
  return res.data.data;
}

export async function adminSetGiftVerified(
  token: string,
  id: number,
  verified: boolean
): Promise<void> {
  await api.put(`/admin/gift-confirmations/${id}`, { verified }, authHeader(token));
}

export async function adminDeleteGiftConfirmation(token: string, id: number): Promise<void> {
  await api.delete(`/admin/gift-confirmations/${id}`, authHeader(token));
}

export type GuestInput = { name: string; phone: string; category: string };

export async function adminListGuests(
  token: string
): Promise<{ items: Guest[]; whatsapp_gateway: boolean }> {
  const res = await api.get("/admin/guests", authHeader(token));
  return res.data.data;
}

export async function adminCreateGuest(token: string, payload: GuestInput): Promise<Guest> {
  const res = await api.post("/admin/guests", payload, authHeader(token));
  return res.data.data;
}

export async function adminImportGuests(token: string, guests: GuestInput[]): Promise<GuestImportResult> {
  const res = await api.post("/admin/guests/import", { guests }, authHeader(token));
  return res.data.data;
}

export async function adminUpdateGuest(
  token: string,
  id: number,
  payload: Partial<GuestInput> & { sent?: boolean }
): Promise<Omit<Guest, "rsvp">> {
  const res = await api.put(`/admin/guests/${id}`, payload, authHeader(token));
  return res.data.data;
}

export async function adminDeleteGuest(token: string, id: number): Promise<void> {
  await api.delete(`/admin/guests/${id}`, authHeader(token));
}

export async function adminDeleteGuests(token: string, ids: number[]): Promise<void> {
  await api.post("/admin/guests/bulk-delete", { ids }, authHeader(token));
}

/** new personal link; the old one stops working */
export async function adminResetGuestLink(token: string, id: number): Promise<Omit<Guest, "rsvp">> {
  const res = await api.post(`/admin/guests/${id}/reset-link`, null, authHeader(token));
  return res.data.data;
}

/** send through the server's WhatsApp gateway (Fonnte) */
export async function adminSendGuestWhatsapp(
  token: string,
  id: number,
  message: string
): Promise<Omit<Guest, "rsvp">> {
  const res = await api.post(`/admin/guests/${id}/send`, { message }, authHeader(token));
  return res.data.data;
}

/** the API's error text, e.g. "nomor WhatsApp tidak valid" */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return msg || fallback;
}
