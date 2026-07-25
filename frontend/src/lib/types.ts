export interface Settings {
  id: number;
  groom_name: string;
  groom_full_name: string;
  groom_parents: string;
  groom_instagram: string;

  bride_name: string;
  bride_full_name: string;
  bride_parents: string;
  bride_instagram: string;

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

  akad_time: string;
  akad_date: string;
  akad_location: string;
  akad_address: string;
  akad_maps_url: string;

  resepsi_time: string;
  resepsi_date: string;
  resepsi_location: string;
  resepsi_address: string;
  resepsi_maps_url: string;

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
  created_at: string;
}

export interface InvitationData {
  settings: Settings;
  story: StoryEvent[];
  gallery: GalleryImage[];
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
