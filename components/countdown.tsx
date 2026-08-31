"use client";

import { useEffect, useState } from "react";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

// Explicit UTC+01:00 (WEST, Portugal in May) so every visitor counts down to
// the same instant regardless of the visitor's own timezone.
const EVENT_DATE = new Date(
  "2026-05-19T09:00:00+01:00",
);

const ZERO = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isOver: false,
};

function calculateTimeLeft() {
  const diff =
    EVENT_DATE.getTime() -
    Date.now();

  if (diff <= 0) {
    return {
      ...ZERO,
      isOver: true,
    };
  }

  return {
    days: Math.floor(
      diff /
      (1000 * 60 * 60 * 24),
    ),

    hours: Math.floor(
      (diff /
        (1000 * 60 * 60)) %
      24,
    ),

    minutes: Math.floor(
      (diff /
        (1000 * 60)) %
      60,
    ),

    seconds: Math.floor(
      (diff / 1000) % 60,
    ),

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
    <div className="group flex min-w-0 flex-col items-center gap-2 sm:gap-3">
      <div className="flex h-12 w-12 items-center justify-center border border-border bg-card transition-[border-color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-accent/40 min-[360px]:h-14 min-[360px]:w-14 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
        <span className="font-display text-2xl text-primary min-[360px]:text-3xl sm:text-5xl">
          {String(
            value,
          ).padStart(
            2,
            "0",
          )}
        </span>
      </div>

      <span className="font-display text-[9px] uppercase tracking-[0.14em] text-muted-foreground min-[360px]:text-[10px] min-[360px]:tracking-[0.2em] sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span
      aria-hidden="true"
      className="-mt-5 shrink-0 font-display text-base text-accent min-[360px]:text-lg sm:-mt-6 sm:text-2xl"
    >
      :
    </span>
  );
}

export function Countdown() {
  /*
   * Server render and first client paint both show 00:00:00:00, then the
   * real value swaps in after mount.
   *
   * Keeping the section in the DOM avoids a layout shift and keeps the
   * #countdown anchor available before hydration.
   */
  const [time, setTime] =
    useState(ZERO);

  useEffect(() => {
    setTime(
      calculateTimeLeft(),
    );

    const id =
      setInterval(
        () =>
          setTime(
            calculateTimeLeft(),
          ),
        1000,
      );

    return () =>
      clearInterval(id);
  }, []);

  return (
    <section
      id="countdown"
      aria-labelledby="countdown-heading"
      className="overflow-hidden border-t border-border px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-4xl text-center">
        <SectionHeading
          eyebrow={
            time.isOver
              ? "Recap"
              : "Countdown"
          }
          title={
            time.isOver
              ? "this edition has wrapped"
              : "the event starts in"
          }
          index="02 / 05"
          titleId="countdown-heading"
        />

        {time.isOver ? (
          <p
            className="mx-auto max-w-xl text-balance text-muted-foreground"
            suppressHydrationWarning
          >
            DETI+ 2026 took
            place on May
            19&ndash;21,
            2026 at DETI,
            Universidade de
            Aveiro. Thank you
            to everyone who
            joined us
            &mdash; details
            for the next
            edition will be
            announced here.
          </p>
        ) : (
          <Reveal>
            <div
              className="mx-auto flex max-w-full items-center justify-center gap-1 min-[360px]:gap-2 sm:gap-6"
              suppressHydrationWarning
            >
              <TimeUnit
                value={
                  time.days
                }
                label="Days"
              />

              <Colon />

              <TimeUnit
                value={
                  time.hours
                }
                label="Hours"
              />

              <Colon />

              <TimeUnit
                value={
                  time.minutes
                }
                label="Min"
              />

              <Colon />

              <TimeUnit
                value={
                  time.seconds
                }
                label="Sec"
              />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
