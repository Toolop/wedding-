import axios from "axios";
import { clearToken } from "./auth";
import type {
  GalleryImage,
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

export async function submitWish(payload: {
  name: string;
  attendance: string;
  guest_count: number;
  message: string;
}): Promise<Wish> {
  const res = await api.post("/wishes", payload);
  return res.data.data;
}

export async function getWishes(page = 1, limit = 10): Promise<WishesResponse> {
  const res = await api.get("/wishes", { params: { page, limit } });
  return res.data.data;
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
  target: "hero" | "couple" | "gallery"
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

export async function adminDeleteWish(token: string, id: number): Promise<void> {
  await api.delete(`/admin/wishes/${id}`, authHeader(token));
}
