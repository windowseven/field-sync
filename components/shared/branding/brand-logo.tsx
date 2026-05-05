import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
};

export function BrandLogo({
  href = "/",
  subtitle,
  className,
  compact = false,
}: BrandLogoProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-3", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 shadow-md shadow-emerald-500/20 overflow-hidden">
        <Image src="/logo.svg" alt="FieldSync" width={28} height={28} className="h-7 w-7" />
      </div>
      {!compact && (
        <div className="grid leading-tight">
          <span className="font-semibold text-sm">FieldSync</span>
          {subtitle ? (
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {subtitle}
            </span>
          ) : null}
        </div>
      )}
    </Link>
  );
}
