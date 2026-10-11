import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Attendance } from "@/lib/types";

export const ATTENDANCE: Record<Attendance, { label: string; dot: string }> = {
  hadir: { label: "Hadir", dot: "bg-emerald-500" },
  tidak_hadir: { label: "Tidak hadir", dot: "bg-rose-500" },
  masih_ragu: { label: "Masih ragu", dot: "bg-amber-500" },
};

export function AttendanceBadge({ value }: { value: Attendance }) {
  const meta = ATTENDANCE[value] ?? { label: value, dot: "bg-muted-foreground" };
  return (
    <Badge variant="outline" className="gap-1.5 px-1.5 text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
