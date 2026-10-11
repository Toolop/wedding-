"use client";

import { ArrowDown, ArrowUp, BookHeart, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete, moveItem } from "@/components/admin/confirm-delete";
import { PageHeader } from "@/components/admin/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCreateStory,
  adminDeleteStory,
  adminListStory,
  adminUpdateStory,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { StoryEvent } from "@/lib/types";

type Draft = Pick<StoryEvent, "event_date" | "title" | "description">;
const EMPTY: Draft = { event_date: "", title: "", description: "" };

export default function StoryPage() {
  const [items, setItems] = useState<StoryEvent[] | null>(null);
  // null = closed, "new" = creating, otherwise the item being edited
  const [editing, setEditing] = useState<StoryEvent | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    adminListStory(token)
      .then(setItems)
      .catch(() => toast.error("Gagal memuat kisah"));
  }, []);

  const openEditor = (item: StoryEvent | "new") => {
    setDraft(item === "new" ? EMPTY : { event_date: item.event_date, title: item.title, description: item.description });
    setEditing(item);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !items || !editing) return;
    setSaving(true);
    try {
      if (editing === "new") {
        const maxOrder = Math.max(0, ...items.map((i) => i.sort_order));
        // icon is unused by the current invitation but kept for older layouts
        const created = await adminCreateStory(token, { ...draft, icon: "heart", sort_order: maxOrder + 1 });
        setItems([...items, created]);
        toast.success("Momen ditambahkan");
      } else {
        await adminUpdateStory(token, editing.id, draft);
        setItems(items.map((i) => (i.id === editing.id ? { ...i, ...draft } : i)));
        toast.success("Momen diperbarui");
      }
      setEditing(null);
    } catch {
      toast.error("Gagal menyimpan momen");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const token = getToken();
    if (!token || !items) return;
    try {
      await adminDeleteStory(token, id);
      setItems(items.filter((i) => i.id !== id));
      toast.success("Momen dihapus");
    } catch {
      toast.error("Gagal menghapus momen");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const token = getToken();
    if (!token || !items) return;
    const result = moveItem(items, index, dir);
    if (!result) return;
    const previous = items;
    setItems(result.items);
    try {
      await Promise.all(result.changed.map((i) => adminUpdateStory(token, i.id, { sort_order: i.sort_order })));
    } catch {
      setItems(previous);
      toast.error("Gagal mengubah urutan");
    }
  };

  return (
    <>
      <PageHeader title="Kisah Cinta" description="Momen-momen yang tampil berurutan di kartu “Kisah kami”.">
        <Button onClick={() => openEditor("new")}>
          <Plus />
          Tambah momen
        </Button>
      </PageHeader>

      <Card className="py-0">
        <CardContent className="p-0">
          {items === null ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground">
              <BookHeart className="size-8" />
              Belum ada momen. Undangan akan menampilkan “Kisah kami masih ditulis”.
            </div>
          ) : (
            <ol className="divide-y">
              {items.map((item, i) => (
                <li key={item.id} className="flex items-start gap-4 px-4 py-4 sm:px-6">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.event_date || "Tanpa tanggal"}
                    </p>
                    <p className="font-medium">{item.title || "Tanpa judul"}</p>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label="Naikkan" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Turunkan"
                      disabled={i === items.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Ubah" onClick={() => openEditor(item)}>
                      <Pencil />
                    </Button>
                    <ConfirmDelete title={`Hapus “${item.title || "momen ini"}”?`} onConfirm={() => remove(item.id)}>
                      <Button variant="ghost" size="icon" aria-label="Hapus" className="text-destructive">
                        <Trash2 />
                      </Button>
                    </ConfirmDelete>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <form onSubmit={submit} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>{editing === "new" ? "Tambah momen" : "Ubah momen"}</DialogTitle>
              <DialogDescription>Satu bab dalam kisah kalian.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="story-date">Kapan</Label>
              <Input
                id="story-date"
                placeholder="Januari 2020"
                value={draft.event_date}
                onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="story-title">Judul</Label>
              <Input
                id="story-title"
                required
                placeholder="Pertama bertemu"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="story-desc">Cerita</Label>
              <Textarea
                id="story-desc"
                rows={4}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <LoaderCircle className="animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
