import type { Guest, Settings } from "./types";
import type { GuestInput } from "./api";

export const DEFAULT_WA_TEMPLATE = `Assalamu'alaikum Wr. Wb.

Kepada Yth.
Bapak/Ibu/Saudara/i *{nama}*

Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami, *{mempelai}*.

Informasi lengkap acara dapat dilihat melalui undangan berikut:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih.
Wassalamu'alaikum Wr. Wb.`;

export const TEMPLATE_TAGS = [
  { tag: "{nama}", hint: "nama tamu" },
  { tag: "{link}", hint: "link undangan pribadi" },
  { tag: "{mempelai}", hint: "nama kedua mempelai" },
] as const;

/** the guest's personal invitation link on this site */
export function guestLink(code: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/?u=${code}`;
}

export function fillTemplate(template: string, guest: Pick<Guest, "name" | "code">, settings: Settings) {
  const couple = [settings.groom_name, settings.bride_name].filter(Boolean).join(" & ");
  return (template.trim() || DEFAULT_WA_TEMPLATE)
    .replaceAll("{nama}", guest.name)
    .replaceAll("{link}", guestLink(guest.code))
    .replaceAll("{mempelai}", couple);
}

/** wa.me link with the message typed in; without a number WhatsApp asks who to send it to */
export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/** mirrors the API: 0812..., +62 812..., 812... → 62812...; null when it can't be a number */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/** +62 812-3456-7890 for display */
export function formatPhone(phone: string) {
  if (!phone.startsWith("62")) return phone ? `+${phone}` : "";
  const rest = phone.slice(2);
  return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`.replace(/-$/, "");
}

// ---- Excel ----

const HEADER_MATCH: Record<keyof GuestInput, RegExp> = {
  name: /^(nama|name|nama tamu|tamu)/i,
  // a bare "No" column is row numbering, not a phone number
  phone: /(whatsapp|\bwa\b|\bhp\b|telp|telepon|phone|ponsel|nomor|^no\.?\s+\S)/i,
  category: /(kategori|category|grup|group|kelompok|keterangan|ket)/i,
};

export type ParsedRow = GuestInput & { row: number; error?: string };

function rowError(name: string, phone: string | null) {
  if (!name) return "Nama kosong";
  if (name.length < 2) return "Nama terlalu pendek";
  if (phone === null) return "Nomor tidak valid";
  return undefined;
}

function cellText(v: unknown): string {
  // phone numbers often arrive as numbers (leading 0 dropped); toFixed avoids 6.28e+12
  if (typeof v === "number") return Number.isInteger(v) ? v.toFixed(0) : String(v);
  return v == null ? "" : String(v).trim();
}

/**
 * Reads the first sheet of an .xlsx/.xls/.csv file. Columns are found by
 * header (Nama / No WhatsApp / Kategori); without a header row the order is
 * name, phone, category.
 */
export async function parseGuestSheet(file: File): Promise<ParsedRow[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer());
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, blankrows: true });

  const cols: Record<keyof GuestInput, number> = { name: 0, phone: 1, category: 2 };
  let start = 0;
  const header = (rows[0] ?? []).map(cellText);
  const nameCol = header.findIndex((h) => HEADER_MATCH.name.test(h));
  if (nameCol >= 0) {
    start = 1;
    cols.name = nameCol;
    cols.phone = header.findIndex((h, i) => i !== nameCol && HEADER_MATCH.phone.test(h));
    cols.category = header.findIndex((h, i) => i !== nameCol && HEADER_MATCH.category.test(h));
  }

  const out: ParsedRow[] = [];
  rows.slice(start).forEach((r, i) => {
    const name = cellText(r[cols.name]).replace(/\s+/g, " ");
    const rawPhone = cols.phone >= 0 ? cellText(r[cols.phone]) : "";
    const category = cols.category >= 0 ? cellText(r[cols.category]) : "";
    if (!name && !rawPhone) return;
    const phone = normalizePhone(rawPhone);
    out.push({
      row: i + start + 1,
      name,
      phone: phone ?? rawPhone,
      category,
      error: rowError(name, phone),
    });
  });
  return out;
}

/** "Nama, 0812..." per line, as pasted from a chat or notes app */
export function parseGuestText(text: string): ParsedRow[] {
  return text
    .split(/\r?\n/)
    .map((line, i) => ({ line: line.trim(), row: i + 1 }))
    .filter(({ line }) => line)
    .map(({ line, row }) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      // a trailing number with no separator: "Budi Santoso 0812..."
      if (parts.length === 1) {
        const m = line.match(/^(.*?)[\s-]*(\+?[\d][\d\s-]{7,})$/);
        if (m) parts.splice(0, 1, m[1], m[2]);
      }
      const [name = "", rawPhone = "", category = ""] = parts;
      const phone = normalizePhone(rawPhone);
      return {
        row,
        name: name.replace(/\s+/g, " "),
        phone: phone ?? rawPhone,
        category,
        error: rowError(name, phone),
      };
    });
}

export async function downloadGuestTemplate() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([
    ["Nama", "No WhatsApp", "Kategori"],
    ["Budi Santoso", "081234567890", "Keluarga"],
    ["Siti & Keluarga", "6285712345678", "Teman Kantor"],
  ]);
  ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tamu");
  XLSX.writeFile(wb, "template-daftar-tamu.xlsx");
}

const fmt = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "";

const RSVP_LABEL = { hadir: "Hadir", tidak_hadir: "Tidak hadir", masih_ragu: "Masih ragu" } as const;

export async function exportGuests(guests: Guest[]) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([
    ["Nama", "No WhatsApp", "Kategori", "Link undangan", "Dikirim", "Dibuka", "RSVP", "Jumlah tamu"],
    ...guests.map((g) => [
      g.name,
      g.phone,
      g.category,
      guestLink(g.code),
      fmt(g.sent_at),
      fmt(g.opened_at),
      g.rsvp ? RSVP_LABEL[g.rsvp.attendance] : "",
      g.rsvp?.attendance === "hadir" ? g.rsvp.guest_count : "",
    ]),
  ]);
  ws["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tamu");
  XLSX.writeFile(wb, `daftar-tamu-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
