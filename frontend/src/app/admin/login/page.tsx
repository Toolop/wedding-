"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await adminLogin(username, password);
      setToken(token);
      router.push("/admin");
    } catch {
      toast.error("Username atau password salah");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-sm overflow-hidden p-0 md:max-w-3xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">Admin Undangan</h1>
              <p className="text-sm text-balance text-muted-foreground">
                Masuk untuk mengelola isi undangan pernikahan
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <LoaderCircle className="animate-spin" />}
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <div className="relative hidden bg-muted md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/illustrations/cafe.jpeg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
