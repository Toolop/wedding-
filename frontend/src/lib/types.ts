export interface Settings {
  id: number;
  groom_name: string;
  groom_full_name: string;
  groom_parents: string;
  groom_instagram: string;
  groom_photo: string;

  bride_name: string;
  bride_full_name: string;
  bride_parents: string;
  bride_instagram: string;
  bride_photo: string;

  wedding_date: string;
  quote: string;
  quote_author: string;

  hero_image: string;
  couple_image: string;

  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  font_heading: string;
  font_body: string;

  music_url: string;

  /** WhatsApp invitation text with {nama}, {link} and {mempelai} placeholders */
  wa_template: string;

  akad_time: string;
  akad_date: string;
  akad_location: string;
  akad_address: string;
  akad_maps_url: string;
  akad_map_image: string;
  /** JSON MapMeta, see lib/map-meta.ts */
  akad_map_meta: string;
  akad_venue_photo: string;

  resepsi_time: string;
  resepsi_date: string;
  resepsi_location: string;
  resepsi_address: string;
  resepsi_maps_url: string;
  resepsi_map_image: string;
  resepsi_map_meta: string;
  resepsi_venue_photo: string;

  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;

  created_at: string;
  updated_at: string;
}

export interface StoryEvent {
  id: number;
  event_date: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface GalleryImage {
  id: number;
  image_url: string;
  caption: string;
  sort_order: number;
}

export type Attendance = "hadir" | "tidak_hadir" | "masih_ragu";

export interface Wish {
  id: number;
  name: string;
  attendance: Attendance;
  guest_count: number;
  message: string;
  /** set when sent through a guest's personal link */
  guest_id?: number | null;
  created_at: string;
}

export type GiftKind = "bank" | "ewallet";

export interface GiftAccount {
  id: number;
  kind: GiftKind;
  provider: string;
  account_number: string;
  account_name: string;
  sort_order: number;
}

export interface GiftConfirmation {
  id: number;
  name: string;
  account_id: number | null;
  account_label: string;
  amount: number;
  message: string;
  proof_url: string;
  verified: boolean;
  created_at: string;
}

export interface InvitationData {
  settings: Settings;
  story: StoryEvent[];
  gallery: GalleryImage[];
  /** older backends don't send it */
  gifts?: GiftAccount[];
}

export interface Guest {
  id: number;
  /** token in the guest's personal link (/?u=<code>) */
  code: string;
  name: string;
  /** digits only, 62..., or "" when unknown */
  phone: string;
  category: string;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
  /** latest RSVP sent through their personal link */
  rsvp: { attendance: Attendance; guest_count: number; at: string } | null;
}

export interface GuestImportResult {
  created: number;
  skipped: { row: number; name: string; reason: string }[];
}

export interface WishesResponse {
  items: Wish[];
  total: number;
  page: number;
  limit: number;
  summary: {
    hadir: number;
    tidak_hadir: number;
    masih_ragu: number;
    /** sum of guest_count over "hadir" RSVPs */
    guests: number;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}
