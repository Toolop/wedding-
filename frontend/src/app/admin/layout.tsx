import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Admin · Undangan",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // .admin-shell switches on the shadcn theme in styles/admin-theme.css
    <div className="admin-shell min-h-svh">
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      <Toaster position="top-center" />
    </div>
  );
}
