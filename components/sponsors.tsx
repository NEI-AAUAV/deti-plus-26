import { PixelCross } from "./pixel-elements";

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
      aria-labelledby="sponsors-heading"
      className="border-t border-border py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-2 w-2 bg-accent" />
            <p className="font-display text-sm uppercase tracking-[0.3em] text-accent">
              Partners
            </p>
          </div>
          <h2
            id="sponsors-heading"
            className="mb-4 text-balance font-display text-3xl lowercase tracking-[0.15em] text-primary sm:text-4xl"
          >
            our sponsors
          </h2>
          <p className="text-muted-foreground">
            Sponsors will be announced soon. Interested in sponsoring?{" "}
            <a
              href="#contacts"
              className="text-accent underline underline-offset-4 transition-colors hover:text-accent/80"
            >
              Talk to our External Relations team
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-16">
          {tiers.map((tier) => {
            const s = sizeMap[tier.size];
            return (
              <div key={tier.name} className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-border sm:w-12" aria-hidden="true" />
                    <h3 className="font-display text-lg lowercase tracking-[0.2em] text-primary sm:text-xl">
                      {tier.name}
                    </h3>
                    <span className="font-display text-xs tracking-[0.15em] text-accent">
                      {tier.price}
                    </span>
                    <div className="h-px w-8 bg-border sm:w-12" aria-hidden="true" />
                  </div>
                  <p className="max-w-md text-balance text-center text-sm text-muted-foreground">
                    {tier.perks}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {Array.from({ length: tier.slots }).map((_, i) => (
                    <div
                      key={i}
                      className={`${s.box} flex flex-col items-center justify-center gap-2 border border-dashed border-border bg-card/50 transition-colors hover:border-accent/30`}
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
