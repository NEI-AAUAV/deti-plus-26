import { PixelCross } from "./pixel-elements";

import { Reveal } from "@/components/reveal";

const tiers = [
  {
    name: "main",
    price: "800€",
    perks:
      "Main sponsor branding + CV access + company fair + interviews + larger stand",
    slots: 1,
    slotClass: "h-36 w-36 sm:h-44 sm:w-44",
    iconClass: "h-10 w-10",
  },
  {
    name: "gold",
    price: "600€",
    perks: "Advertising + CV access + company fair + interviews",
    slots: 2,
    slotClass: "h-28 w-28 sm:h-36 sm:w-36",
    iconClass: "h-8 w-8",
  },
  {
    name: "silver",
    price: "400€",
    perks: "Advertising + CV access + company fair",
    slots: 3,
    slotClass: "h-28 w-28 sm:h-36 sm:w-36",
    iconClass: "h-8 w-8",
  },
  {
    name: "bronze",
    price: "200€",
    perks: "Advertising + CV access",
    slots: 4,
    slotClass: "h-24 w-24 sm:h-28 sm:w-28",
    iconClass: "h-6 w-6",
  },
  {
    name: "basic",
    price: "100€",
    perks: "Advertising",
    slots: 6,
    slotClass: "h-24 w-24 sm:h-28 sm:w-28",
    iconClass: "h-6 w-6",
  },
];

export function Sponsors() {
  return (
    <section
      id="sponsors"
      aria-labelledby="sponsors-heading"
      className="border-t border-border px-6 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex items-center gap-4 font-display text-[10px] uppercase tracking-[0.22em]">
          <div className="flex items-center gap-2 text-accent">
            <span className="h-2 w-2 bg-accent" aria-hidden="true" />
            <span>Partners</span>
          </div>

          <div className="h-px flex-1 bg-border" aria-hidden="true" />

          <span className="text-muted-foreground">02 / 05</span>
        </div>

        <div className="mb-16 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <Reveal>
            <h2
              id="sponsors-heading"
              className="font-display text-[clamp(4rem,8vw,8rem)] font-normal lowercase leading-[0.84] tracking-[-0.03em] text-primary"
            >
              our sponsors
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <p className="max-w-xl leading-relaxed text-muted-foreground lg:ml-auto">
              Sponsors will be announced soon. Interested in sponsoring?{" "}
              <a
                href="#contacts"
                className="text-accent underline underline-offset-4 transition-colors hover:text-accent/80"
              >
                Talk to our External Relations team
              </a>
            </p>
          </Reveal>
        </div>

        <div>
          {tiers.map((tier, tierIndex) => (
            <Reveal key={tier.name} delay={Math.min(tierIndex * 70, 210)}>
              <article className="grid gap-7 border-t border-border py-8 lg:grid-cols-[150px_80px_1fr] lg:gap-8">
                <div>
                  <h3
                    className={`font-display font-normal lowercase tracking-[0.08em] text-primary ${
                      tier.name === "main"
                        ? "text-4xl sm:text-5xl"
                        : "text-3xl"
                    }`}
                  >
                    {tier.name}
                  </h3>
                </div>

                <span className="font-display text-xs tracking-[0.15em] text-accent">
                  {tier.price}
                </span>

                <div>
                  <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {tier.perks}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {Array.from({ length: tier.slots }).map((_, slotIndex) => (
                      <div
                        key={slotIndex}
                        className={`${tier.slotClass} group flex flex-col items-center justify-center gap-2 bg-card/50 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-1 hover:border-accent/50 hover:bg-card ${
                          tier.name === "main"
                            ? "border border-accent/30"
                            : "border border-dashed border-border"
                        }`}
                      >
                        <PixelCross
                          className={`${tier.iconClass} text-muted-foreground/35 transition-colors group-hover:text-accent/60`}
                        />
                        <span className="font-display text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                          TBA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
