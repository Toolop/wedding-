import {
  BookHeart,
  CalendarDays,
  Gift,
  Heart,
  Images,
  LayoutDashboard,
  MessageSquareHeart,
  Palette,
  ReceiptText,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { title: string; url: string; icon: LucideIcon };

export const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Ringkasan",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Isi Undangan",
    items: [
      { title: "Mempelai", url: "/admin/couple", icon: Heart },
      { title: "Acara", url: "/admin/event", icon: CalendarDays },
      { title: "Kisah Cinta", url: "/admin/story", icon: BookHeart },
      { title: "Foto & Galeri", url: "/admin/photos", icon: Images },
      { title: "Hadiah", url: "/admin/gift", icon: Gift },
    ],
  },
  {
    label: "Tamu",
    items: [
      { title: "Daftar Tamu", url: "/admin/guest-list", icon: Users },
      { title: "RSVP & Ucapan", url: "/admin/guests", icon: MessageSquareHeart },
      { title: "Konfirmasi Hadiah", url: "/admin/gift-confirmations", icon: ReceiptText },
    ],
  },
  {
    label: "Pengaturan",
    items: [{ title: "Tampilan", url: "/admin/appearance", icon: Palette }],
  },
];

export const NAV_ITEMS = NAV.flatMap((g) => g.items);
