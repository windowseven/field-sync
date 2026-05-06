import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { GuestRoute } from "@/components/features/auth/ProtectedRoute";
import { BrandLogo } from "@/components/shared/branding/brand-logo";

export const metadata: Metadata = {
  title: "FieldSync | Access",
  description: "Sign in to FieldSync — real-time field operations management.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestRoute>
      <div className="min-h-screen flex bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 overflow-y-auto">
          {/* Logo */}
          <BrandLogo href="/" className="mb-8" />

          {/* Form card */}
          <div className="w-full max-w-[440px]">
            <div className="rounded-xl border border-border bg-card shadow-lg shadow-black/5 overflow-hidden">
              {children}
            </div>

            {/* Security note */}
            <p className="mt-8 text-center text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secured with end-to-end encryption
            </p>
          </div>
        </div>
      </div>
    </GuestRoute>
  );
}

