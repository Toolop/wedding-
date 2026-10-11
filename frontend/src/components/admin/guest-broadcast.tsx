"use client";

import { CheckCircle2, CircleAlert, LoaderCircle, Pause, Play, SkipForward } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminSendGuestWhatsapp, adminUpdateGuest, apiErrorMessage } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { fillTemplate, formatPhone, waLink } from "@/lib/guests";
import type { Guest, Settings } from "@/lib/types";

type Sent = Omit<Guest, "rsvp">;

// a pause between gateway sends so WhatsApp doesn't flag the number as spam
const MIN_GAP_MS = 5000;
const MAX_GAP_MS = 10000;

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <div className="grid gap-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {done} dari {total} tamu
      </p>
    </div>
  );
}

export function BroadcastDialog({
  open,
  onOpenChange,
  guests,
  settings,
  template,
  gateway,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** who to send to, in order; snapshotted when the dialog opens */
  guests: Guest[];
  settings: Settings;
  template: string;
  /** the server can send by itself (FONNTE_TOKEN is set) */
  gateway: boolean;
  onSent: (guest: Sent) => void;
}) {
  const [queue, setQueue] = useState<Guest[]>([]);
  const [index, setIndex] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failures, setFailures] = useState<{ guest: Guest; reason: string }[]>([]);
  const [running, setRunning] = useState(false);
  const stop = useRef(false);

  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      // the gateway can only reach guests with a number; by hand WhatsApp lets you pick the contact
      setQueue(gateway ? guests.filter((g) => g.phone) : guests);
      setIndex(0);
      setSentCount(0);
      setFailures([]);
    }
  }

  const close = (next: boolean) => {
    if (!next) stop.current = true;
    onOpenChange(next);
  };

  const finished = index >= queue.length;
  const current = queue[index];

  const runGateway = async () => {
    const token = getToken();
    if (!token) return;
    stop.current = false;
    setRunning(true);
    for (let i = index; i < queue.length && !stop.current; i++) {
      const g = queue[i];
      try {
        onSent(await adminSendGuestWhatsapp(token, g.id, fillTemplate(template, g, settings)));
        setSentCount((n) => n + 1);
      } catch (err) {
        setFailures((f) => [...f, { guest: g, reason: apiErrorMessage(err, "gagal mengirim") }]);
      }
      setIndex(i + 1);
      if (i + 1 < queue.length) {
        const until = Date.now() + MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
        while (Date.now() < until && !stop.current) await new Promise((r) => setTimeout(r, 250));
      }
    }
    setRunning(false);
  };

  // manual: the click opens WhatsApp (a user gesture, so no popup blocker), then we mark and advance
  const sendManual = (g: Guest) => {
    setIndex((i) => i + 1);
    setSentCount((n) => n + 1);
    const token = getToken();
    if (!token) return;
    adminUpdateGuest(token, g.id, { sent: true })
      .then(onSent)
      .catch(() => undefined);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => running && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Kirim undangan ke {queue.length} tamu</DialogTitle>
          <DialogDescription>
            {gateway
              ? "Pesan dikirim otomatis satu per satu dengan jeda 5–10 detik. Biarkan halaman ini terbuka sampai selesai."
              : "Setiap tamu mendapat pesan dengan nama dan link pribadinya. Klik kirim, WhatsApp terbuka dengan pesan siap kirim, lalu kembali ke sini untuk tamu berikutnya."}
          </DialogDescription>
        </DialogHeader>

        <Progress done={index} total={queue.length} />

        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada tamu dengan nomor WhatsApp untuk dikirimi.</p>
        ) : finished ? (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-medium">Selesai</p>
              <p className="text-muted-foreground">
                {sentCount} undangan terkirim{failures.length ? `, ${failures.length} gagal` : ""}
                {sentCount < queue.length - failures.length && `, ${queue.length - failures.length - sentCount} dilewati`}.
              </p>
            </div>
          </div>
        ) : gateway ? (
          <p className="text-sm">
            {running ? (
              <>
                <LoaderCircle className="mr-1.5 inline size-4 animate-spin" />
                Mengirim ke <b>{current?.name}</b>…
              </>
            ) : index > 0 ? (
              <>Dijeda. Berikutnya: <b>{current?.name}</b></>
            ) : (
              <>Mulai dari <b>{current?.name}</b></>
            )}
          </p>
        ) : (
          current && (
            <div className="grid gap-2 rounded-lg border p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-medium">{current.name}</p>
                <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {current.phone ? formatPhone(current.phone) : "tanpa nomor — pilih kontak di WhatsApp"}
                </p>
              </div>
              <p className="line-clamp-4 whitespace-pre-line text-xs text-muted-foreground">
                {fillTemplate(template, current, settings)}
              </p>
            </div>
          )
        )}

        {failures.length > 0 && (
          <div className="max-h-32 overflow-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
            {failures.map((f) => (
              <p key={f.guest.id} className="flex gap-1.5">
                <CircleAlert className="mt-px size-3.5 shrink-0 text-destructive" />
                <span>
                  <b>{f.guest.name}</b>: {f.reason}
                </span>
              </p>
            ))}
          </div>
        )}

        <DialogFooter>
          {finished || queue.length === 0 ? (
            <Button onClick={() => close(false)}>Tutup</Button>
          ) : gateway ? (
            running ? (
              <Button variant="outline" onClick={() => (stop.current = true)}>
                <Pause />
                Jeda
              </Button>
            ) : (
              <Button onClick={runGateway}>
                <Play />
                {index > 0 ? "Lanjutkan" : "Mulai kirim"}
              </Button>
            )
          ) : (
            current && (
              <>
                <Button variant="ghost" onClick={() => setIndex((i) => i + 1)}>
                  <SkipForward />
                  Lewati
                </Button>
                <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                  <a
                    href={waLink(current.phone, fillTemplate(template, current, settings))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sendManual(current)}
                  >
                    Kirim ke {current.name.split(" ")[0]}
                  </a>
                </Button>
              </>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
