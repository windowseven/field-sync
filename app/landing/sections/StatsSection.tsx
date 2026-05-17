"use client";

import { useEffect, useRef, useState } from "react";

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

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(to / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const items = [
  { value: 50000, suffix: "+", label: "Field workers managed" },
  { value: 99.9, suffix: "%", label: "Platform uptime SLA" },
  { value: 200, suffix: "ms", label: "Average sync latency" },
  { value: 1200, suffix: "+", label: "Operations completed" },
];

export default function StatsSection() {
  const { ref, inView } = useInView();
  return (
    <section id="stats" className="py-20 bg-[oklch(0.08_0.015_260)] border-y border-[oklch(0.18_0.01_260)]">
      <div ref={ref} className="max-w-5xl mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {items.map((item, i) => (
          <div key={item.label} className="space-y-1" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s` }}>
            <p className="text-3xl sm:text-4xl font-bold text-[oklch(0.7_0.18_160)]">
              {inView ? <Counter to={item.value} suffix={item.suffix} /> : "0"}
            </p>
            <p className="text-sm text-[oklch(0.5_0_0)]">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
