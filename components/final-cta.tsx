import Link from "next/link";

import { Reveal } from "@/components/reveal";

export function FinalCta() {
  return (
    <section className="relative min-h-[78vh] overflow-hidden border-t border-border px-6 py-24 sm:py-28">
      <div
        className="pointer-events-none absolute -bottom-[16vw] -right-[2vw] font-display text-[50vw] font-normal leading-none text-accent/[0.045]"
        aria-hidden="true"
      >
        +
      </div>

      <div className="relative z-10 mx-auto flex min-h-[58vh] max-w-7xl items-center">
        <Reveal>
          <div className="max-w-6xl">
            <div className="mb-7 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.22em] text-accent">
              <span className="h-2 w-2 bg-accent" aria-hidden="true" />
              <span>DETI+ 2026 · registrations</span>
            </div>

            <h2 className="max-w-[10ch] font-display text-[clamp(4.8rem,11vw,11rem)] font-normal uppercase leading-[0.78] tracking-[-0.035em] text-primary">
              Your next opportunity could start here.
            </h2>

            <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-7">
              <Link
                href="/registration/"
                className="group inline-flex items-center gap-6 border-2 border-accent bg-accent px-8 py-4 font-display text-base uppercase tracking-widest text-background transition-[background-color,color,transform] hover:-translate-y-0.5 hover:bg-transparent hover:text-accent"
              >
                Register for DETI+
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <span className="font-display text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                September 29 — October 1
              </span>

              <span className="font-display text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                DETI · University of Aveiro
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
