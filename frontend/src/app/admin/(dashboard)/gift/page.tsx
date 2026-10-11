"use client";

import { ArrowDown, ArrowUp, Gift, Landmark, LoaderCircle, Pencil, Plus, Trash2, Wallet } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminCreateGiftAccount,
  adminDeleteGiftAccount,
  adminListGiftAccounts,
  adminUpdateGiftAccount,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { GiftAccount, GiftKind } from "@/lib/types";

type Draft = Pick<GiftAccount, "kind" | "provider" | "account_number" | "account_name">;
const EMPTY: Draft = { kind: "bank", provider: "", account_number: "", account_name: "" };

export default function GiftPage() {
  const [items, setItems] = useState<GiftAccount[] | null>(null);
  // null = closed, "new" = creating, otherwise the account being edited
  const [editing, setEditing] = useState<GiftAccount | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    adminListGiftAccounts(token)
      .then(setItems)
      .catch(() => toast.error("Gagal memuat rekening"));
  }, []);

  const openEditor = (item: GiftAccount | "new") => {
    setDraft(
      item === "new"
        ? EMPTY
        : {
            kind: item.kind,
            provider: item.provider,
            account_number: item.account_number,
            account_name: item.account_name,
          }
    );
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
        const created = await adminCreateGiftAccount(token, { ...draft, sort_order: maxOrder + 1 });
        setItems([...items, created]);
        toast.success("Rekening ditambahkan");
      } else {
        const updated = await adminUpdateGiftAccount(token, editing.id, draft);
        setItems(items.map((i) => (i.id === editing.id ? updated : i)));
        toast.success("Rekening diperbarui");
      }
      setEditing(null);
    } catch {
      toast.error("Gagal menyimpan rekening");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const token = getToken();
    if (!token || !items) return;
    try {
      await adminDeleteGiftAccount(token, id);
      setItems(items.filter((i) => i.id !== id));
      toast.success("Rekening dihapus");
    } catch {
      toast.error("Gagal menghapus rekening");
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
      await Promise.all(
        result.changed.map((i) => adminUpdateGiftAccount(token, i.id, { sort_order: i.sort_order }))
      );
    } catch {
      setItems(previous);
      toast.error("Gagal mengubah urutan");
    }
  };

  return (
    <>
      <PageHeader title="Hadiah" description="Rekening bank dan e-wallet yang tampil di kartu hadiah undangan.">
        <Button onClick={() => openEditor("new")}>
          <Plus />
          Tambah rekening
        </Button>
      </PageHeader>

      <Card className="py-0">
        <CardContent className="p-0">
          {items === null ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground">
              <Gift className="size-8" />
              Belum ada rekening. Undangan akan menampilkan “Info rekening menyusul”.
            </div>
          ) : (
            <ol className="divide-y">
              {items.map((item, i) => {
                const Icon = item.kind === "ewallet" ? Wallet : Landmark;
                return (
                  <li key={item.id} className="flex items-center gap-4 px-4 py-4 sm:px-6">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {item.provider || "Tanpa nama"}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {item.kind === "ewallet" ? "E-wallet" : "Bank"}
                        </span>
                      </p>
                      <p className="font-mono text-sm tabular-nums">{item.account_number || "—"}</p>
                      {item.account_name && (
                        <p className="text-sm text-muted-foreground">a.n. {item.account_name}</p>
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
                      <ConfirmDelete
                        title={`Hapus rekening ${item.provider || ""}?`}
                        description="Konfirmasi transfer yang sudah masuk tetap tersimpan."
                        onConfirm={() => remove(item.id)}
                      >
                        <Button variant="ghost" size="icon" aria-label="Hapus" className="text-destructive">
                          <Trash2 />
                        </Button>
                      </ConfirmDelete>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <form onSubmit={submit} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>{editing === "new" ? "Tambah rekening" : "Ubah rekening"}</DialogTitle>
              <DialogDescription>Tamu bisa menyalin nomornya dengan satu ketukan.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Jenis</Label>
                <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as GiftKind })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="ewallet">E-wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gift-provider">{draft.kind === "ewallet" ? "E-wallet" : "Bank"}</Label>
                <Input
                  id="gift-provider"
                  required
                  placeholder={draft.kind === "ewallet" ? "GoPay" : "BCA"}
                  value={draft.provider}
                  onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gift-number">{draft.kind === "ewallet" ? "Nomor HP" : "Nomor rekening"}</Label>
              <Input
                id="gift-number"
                required
                inputMode="numeric"
                value={draft.account_number}
                onChange={(e) => setDraft({ ...draft, account_number: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gift-name">Atas nama</Label>
              <Input
                id="gift-name"
                value={draft.account_name}
                onChange={(e) => setDraft({ ...draft, account_name: e.target.value })}
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
