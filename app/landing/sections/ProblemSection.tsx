"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, ClipboardList, Users, AlertTriangle, Clock, Wifi, ArrowRight } from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const iconMap: Record<string, React.ElementType> = {
  Eye, ClipboardList, Users, AlertTriangle, Clock, Wifi,
};

const problems = [
  { icon: "Eye", label: "No real-time visibility", desc: "You can't see where your teams are." },
  { icon: "ClipboardList", label: "Inconsistent data collection", desc: "Paper forms mean data is always incomplete." },
  { icon: "Users", label: "Poor team coordination", desc: "Teams overlap zones and can't communicate." },
  { icon: "AlertTriangle", label: "Weak accountability", desc: "No way to track contributions." },
  { icon: "Clock", label: "Delayed decisions", desc: "Reports take hours to reach supervisors." },
  { icon: "Wifi", label: "Network dependency", desc: "Operations halt without connectivity." },
];

export default function ProblemSection() {
  const { ref, inView } = useInView();
  return (
    <section id="problem" className="py-24 bg-[oklch(0.10_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.5_0.2_25)/10] border border-[oklch(0.5_0.2_25)/20] mb-4">
            <AlertTriangle className="w-3 h-3 text-[oklch(0.5_0.2_25)]" />
            <span className="text-xs text-[oklch(0.5_0.2_25)] font-medium tracking-wide">The Problem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Coordinating field teams shouldn&apos;t be this hard.
          </h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-lg mx-auto">
            Most field operations run on a patchwork of spreadsheets, messages, and guesswork.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p, i) => {
            const Icon = iconMap[p.icon] || Users;
            return (
              <div
                key={p.label}
                className="group rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] p-6 hover:border-[oklch(0.35_0.01_260)] transition-all duration-300"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${i * 0.08}s, transform 0.5s ${i * 0.08}s, border-color 0.3s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-[oklch(0.5_0.2_25)/10] border border-[oklch(0.5_0.2_25)/15] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[oklch(0.5_0.2_25)]" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{p.label}</h3>
                <p className="text-sm text-[oklch(0.52_0_0)] leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10" style={{ opacity: inView ? 1 : 0, transition: "opacity 0.6s 0.5s" }}>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-all shadow-lg shadow-[oklch(0.7_0.18_160)/25]">
            There&apos;s a better way <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
