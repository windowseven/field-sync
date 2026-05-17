"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

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

const testimonials = [
  { quote: "FieldSync cut our coordination time significantly. The real-time zone map alone saved us from multiple coverage failures this quarter.", author: "Amara Diallo", title: "Field Operations Lead", stars: 5 },
  { quote: "Our supervisors can now spin up a project, invite a team, and assign zones in under five minutes. Previously that took hours of back-and-forth messages.", author: "Kofi Mensah", title: "Senior Supervisor, Community Outreach", stars: 5 },
  { quote: "The role-based dashboards are brilliant. Every team member sees exactly what they need and nothing they don't — no confusion, just clarity.", author: "Fatima Al-Rashid", title: "Operations Manager", stars: 5 },
];

export default function TestimonialsSection() {
  const { ref, inView } = useInView();
  return (
    <section id="testimonials" className="py-24 bg-[oklch(0.10_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/20] mb-4">
            <Star className="w-3 h-3 text-[oklch(0.7_0.18_160)]" />
            <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium tracking-wide">What Teams Say</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Trusted in the field.</h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.author}
              className="relative rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] p-6 hover:border-[oklch(0.35_0.01_260)] transition-all duration-300"
              style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${i * 0.12}s, transform 0.5s ${i * 0.12}s` }}
            >
              <div className="flex gap-1 mb-4">
                {Array(t.stars).fill(0).map((_, si) => (
                  <Star key={si} className="w-3.5 h-3.5 text-[oklch(0.75_0.18_65)] fill-[oklch(0.75_0.18_65)]" />
                ))}
              </div>
              <p className="text-sm text-[oklch(0.65_0_0)] leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-sm font-semibold text-white">{t.author}</p>
                <p className="text-xs text-[oklch(0.48_0_0)] mt-0.5">{t.title}</p>
              </div>
              <div className="absolute top-4 right-4 text-5xl text-[oklch(0.7_0.18_160)/8] font-serif leading-none select-none">❝</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
