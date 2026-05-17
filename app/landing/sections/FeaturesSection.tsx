"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, MapPin, Users, BarChart3, Shield, Terminal, Zap } from "lucide-react";

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

const features = [
  { icon: Radio, title: "Real-Time Sync", desc: "Every update from every team member propagates across the platform in under 200ms — no refreshing, no guessing.", color: "oklch(0.7 0.18 160)", bg: "oklch(0.7 0.18 160 / 0.08)" },
  { icon: MapPin, title: "Dynamic Zone Management", desc: "Draw zones, assign teams to them, and get alerts when boundaries are crossed. Full coverage visibility at a glance.", color: "oklch(0.65 0.2 250)", bg: "oklch(0.65 0.2 250 / 0.08)" },
  { icon: Users, title: "Role-Based Workspaces", desc: "Supervisors, team leaders, and field workers each see exactly what they need — purpose-built, not one-size-fits-all.", color: "oklch(0.75 0.18 65)", bg: "oklch(0.75 0.18 65 / 0.08)" },
  { icon: BarChart3, title: "Live Analytics", desc: "Real-time dashboards with task completion, field coverage, and team performance data ready to export.", color: "oklch(0.65 0.22 330)", bg: "oklch(0.65 0.22 330 / 0.08)" },
  { icon: Shield, title: "Secure by Default", desc: "OTP verification, role-enforced access, session monitoring, and a full audit trail on every important action.", color: "oklch(0.6 0.18 200)", bg: "oklch(0.6 0.18 200 / 0.08)" },
  { icon: Terminal, title: "Works Offline", desc: "Field workers can keep working without connectivity. Data queues locally and syncs the moment signal returns.", color: "oklch(0.7 0.15 140)", bg: "oklch(0.7 0.15 140 / 0.08)" },
];

export default function FeaturesSection() {
  const { ref, inView } = useInView();
  return (
    <section id="features" className="py-24 bg-[oklch(0.10_0.01_260)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/20] mb-4">
            <Zap className="w-3 h-3 text-[oklch(0.7_0.18_160)]" />
            <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium tracking-wide">What FieldSync Gives You</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Everything your team needs,<br className="hidden sm:block" /> nothing that slows them down.
          </h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-xl mx-auto">
            Built from the ground up for real field environments — not adapted from office software.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] p-6 hover:border-[oklch(0.35_0.01_260)] transition-all duration-300 hover:-translate-y-1"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: `opacity 0.5s ${i * 0.08}s, transform 0.5s ${i * 0.08}s, border-color 0.3s, translate 0.3s` }}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(ellipse at 50% 0%, ${f.color}08, transparent 70%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg, border: `1px solid ${f.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[oklch(0.52_0_0)] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
