"use client";

import { useEffect, useState } from "react";

import { Reveal } from "@/components/reveal";

const EVENT_DATE = new Date("2026-09-29T17:00:00+01:00");

const ZERO = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isOver: false,
};

function calculateTimeLeft() {
  const diff = EVENT_DATE.getTime() - Date.now();

  if (diff <= 0) {
    return {
      ...ZERO,
      isOver: true,
    };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isOver: false,
  };
}

function TimeUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="border border-border bg-background/65 px-3 py-5 text-center transition-colors hover:border-accent/40 sm:px-5 sm:py-6">
      <strong className="block font-display text-4xl font-normal leading-none text-primary sm:text-5xl lg:text-6xl">
        {String(value).padStart(2, "0")}
      </strong>
      <span className="mt-2 block font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

const stats = [
  { value: "03", label: "Days" },
  { value: "03", label: "Student associations" },
  { value: "01", label: "Event" },
  { value: "05", label: "Partnership tiers" },
];

export function Countdown() {
  const [time, setTime] = useState(ZERO);

  useEffect(() => {
    setTime(calculateTimeLeft());

    const id = setInterval(() => {
      setTime(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="countdown"
      aria-labelledby="countdown-heading"
      className="overflow-hidden border-t border-border px-6 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex items-center gap-4 font-display text-[10px] uppercase tracking-[0.22em]">
          <div className="flex items-center gap-2 text-accent">
            <span className="h-2 w-2 bg-accent" aria-hidden="true" />
            <span>{time.isOver ? "Recap" : "Countdown"}</span>
          </div>

          <div className="h-px flex-1 bg-border" aria-hidden="true" />

          <span className="text-muted-foreground">01 / 05</span>
        </div>

        <div className="grid gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <Reveal>
            <div>
              <p className="font-display text-[clamp(5.5rem,14vw,12rem)] font-normal leading-[0.72] tracking-[-0.045em] text-primary">
                29—01
              </p>
              <p className="mt-8 font-display text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs">
                SEP / OCT · 2026 · AVEIRO
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="grid grid-cols-2 border-l border-t border-border">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-h-36 border-b border-r border-border bg-card/25 p-5 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-accent/[0.04] sm:min-h-44 sm:p-7"
                >
                  <strong className="font-display text-5xl font-normal leading-none text-primary sm:text-6xl">
                    {stat.value}
                  </strong>
                  <span className="mt-4 block font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
                    {stat.label}
                  </span>
                </div>
              ))}

              <div className="col-span-2 border-b border-r border-border p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
                  <span id="countdown-heading">
                    {time.isOver ? "DETI+ 2026" : "the event starts in"}
                  </span>
                  <span>29 Sep · 17:00</span>
                </div>

                {time.isOver ? (
                  <p
                    className="max-w-2xl text-balance leading-relaxed text-muted-foreground"
                    suppressHydrationWarning
                  >
                    DETI+ 2026 took place on September 29&ndash;October 1,
                    2026 at DETI, Universidade de Aveiro. Thank you to everyone
                    who joined us &mdash; details for the next edition will be
                    announced here.
                  </p>
                ) : (
                  <div
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    suppressHydrationWarning
                  >
                    <TimeUnit value={time.days} label="Days" />
                    <TimeUnit value={time.hours} label="Hours" />
                    <TimeUnit value={time.minutes} label="Min" />
                    <TimeUnit value={time.seconds} label="Sec" />
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
