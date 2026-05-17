"use client";

import { useEffect, useRef, useState } from "react";
import { FolderOpen, UserCheck, Navigation, LayoutDashboard, TrendingUp } from "lucide-react";

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

const steps = [
  { step: "01", title: "Supervisor creates the project", desc: "Set up your project, define zones on the map, invite team leaders, and configure forms — all from the Supervisor workspace.", icon: FolderOpen },
  { step: "02", title: "Teams get assigned and briefed", desc: "Team leaders receive their assignments, review their zone, and know exactly which tasks their members need to complete.", icon: UserCheck },
  { step: "03", title: "Field workers execute on the ground", desc: "Workers start their session, share their location, complete assigned tasks, fill forms, and submit data in real time.", icon: Navigation },
  { step: "04", title: "Everyone stays in the picture", desc: "Live dashboards, instant notifications, and drill-down analytics give supervisors and leaders a complete operational picture.", icon: LayoutDashboard },
];

export default function HowItWorksSection() {
  const { ref, inView } = useInView();
  return (
    <section id="how-it-works" className="py-24 bg-[oklch(0.08_0.015_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.65_0.2_250)/10] border border-[oklch(0.65_0.2_250)/20] mb-4">
            <TrendingUp className="w-3 h-3 text-[oklch(0.65_0.2_250)]" />
            <span className="text-xs text-[oklch(0.65_0.2_250)] font-medium tracking-wide">How FieldSync Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            From project setup<br className="hidden sm:block" /> to field execution in four steps.
          </h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-lg mx-auto">No training weeks, no complex onboarding. Your team can be operational in minutes.</p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.6s ${i * 0.12}s, transform 0.6s ${i * 0.12}s` }}
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[oklch(0.28_0.01_260)] to-transparent z-0" />
                )}
                <div className="relative z-10 bg-[oklch(0.13_0.01_260)] border border-[oklch(0.22_0.01_260)] rounded-2xl p-6 h-full hover:border-[oklch(0.35_0.01_260)] transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold text-[oklch(0.7_0.18_160)] font-mono">{s.step}</span>
                    <div className="w-8 h-8 rounded-lg bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/15] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-[oklch(0.52_0_0)] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
