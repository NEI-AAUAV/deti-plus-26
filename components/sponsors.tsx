import { PixelCross } from "./pixel-elements";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

const tiers = [
  {
    name: "main",
    price: "800\u20AC",
    perks: "Main sponsor branding + CV access + company fair + interviews + larger stand",
    slots: 1,
    size: "lg" as const,
  },
  {
    name: "gold",
    price: "600\u20AC",
    perks: "Advertising + CV access + company fair + interviews",
    slots: 2,
    size: "md" as const,
  },
  {
    name: "silver",
    price: "400\u20AC",
    perks: "Advertising + CV access + company fair",
    slots: 3,
    size: "md" as const,
  },
  {
    name: "bronze",
    price: "200\u20AC",
    perks: "Advertising + CV access",
    slots: 4,
    size: "sm" as const,
  },
  {
    name: "basic",
    price: "100\u20AC",
    perks: "Advertising",
    slots: 6,
    size: "sm" as const,
  },
];

const sizeMap = {
  lg: { box: "w-36 h-36 sm:w-44 sm:h-44", icon: "h-10 w-10", text: "text-sm" },
  md: { box: "w-28 h-28 sm:w-36 sm:h-36", icon: "h-8 w-8", text: "text-xs" },
  sm: { box: "w-24 h-24 sm:w-28 sm:h-28", icon: "h-6 w-6", text: "text-[10px]" },
};

export function Sponsors() {
  return (
    <section
      id="sponsors"
      aria-label="Sponsors"
      className="border-t border-border py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Partners" title="our sponsors" index="04 / 05" description={<>
            Sponsors will be announced soon. Interested in sponsoring?{" "}
            <a
              href="#contacts"
              className="text-accent underline underline-offset-4 transition-colors hover:text-accent/80"
            >
              Talk to our External Relations team
            </a>
          </>} />

        <div className="flex flex-col gap-16">
          {tiers.map((tier, tierIndex) => {
            const s = sizeMap[tier.size];
            return (
              <Reveal key={tier.name} delay={Math.min(tierIndex * 70, 210)}>
                <div className="group border-t border-border pt-7 transition-colors hover:border-accent/40">
                  <div className="mb-8 grid gap-3 md:grid-cols-[160px_90px_1fr] md:items-start md:gap-6">
                    <h3 className={`font-display lowercase tracking-[0.15em] text-primary ${tier.name === "main" ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
                      {tier.name}
                    </h3>
                    <span className="font-display text-xs tracking-[0.15em] text-accent">
                      {tier.price}
                    </span>
                  <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {tier.perks}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {Array.from({ length: tier.slots }).map((_, i) => (
                    <div
                      key={i}
                      className={`${s.box} flex flex-col items-center justify-center gap-2 bg-card/50 transition-[border-color,transform,background-color] duration-200 hover:-translate-y-1 hover:border-accent/50 hover:bg-card ${tier.name === "main" ? "border border-accent/30" : "border border-dashed border-border"}`}
                    >
                      <PixelCross
                        className={`${s.icon} text-muted-foreground/40`}
                        aria-hidden="true"
                      />
                      <span
                        className={`${s.text} font-display tracking-[0.1em] text-muted-foreground`}
                      >
                        TBA
                      </span>
                    </div>
                  ))}
                </div></div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
