"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const links = {
  Platform: ["Features", "How it works", "Roles", "Demo"],
  Company: ["About", "Careers", "Blog", "FAQ", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

const hrefMap: Record<string, string> = {
  About: "/about", Careers: "/careers", Blog: "/blog", FAQ: "/faq", Contact: "/contact",
  "Privacy Policy": "/privacy", "Terms of Service": "/terms", "Cookie Policy": "/cookies",
  Features: "#features", "How it works": "#how-it-works", Roles: "#roles", Demo: "#demo",
};

export default function FooterSection() {
  return (
    <footer className="bg-[oklch(0.08_0.015_260)] border-t border-[oklch(0.18_0.01_260)] pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 overflow-hidden">
                <img src="/logo.svg" alt="FieldSync" className="w-7 h-7" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">FieldSync</span>
            </Link>
            <p className="text-sm text-[oklch(0.48_0_0)] max-w-xs leading-relaxed">
              Real-time field operations management for teams that can&apos;t afford to work blind.
            </p>
            <div className="flex items-center gap-2 text-xs text-[oklch(0.4_0_0)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.7_0.18_160)] animate-pulse" />
              All systems operational
            </div>
          </div>
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-[oklch(0.55_0_0)] uppercase tracking-wider mb-4">{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => {
                  const href = hrefMap[item] || "#";
                  return (
                    <li key={item}>
                      <a href={href} className="text-sm text-[oklch(0.45_0_0)] hover:text-white transition-colors">{item}</a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-[oklch(0.18_0.01_260)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.38_0_0)]">&copy; {new Date().getFullYear()} FieldSync. All rights reserved.</p>
          <p className="text-xs text-[oklch(0.38_0_0)] flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[oklch(0.7_0.18_160)]" />
            Secured with end-to-end encryption
          </p>
        </div>
      </div>
    </footer>
  );
}
