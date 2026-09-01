import Image from "next/image";
import Link from "next/link";

const FOOTER_MAP =
  "/deti-plus-26/footer/map-black.png";

const organizers = [
  {
    name: "NEEETA",
    logo: "/deti-plus-26/associations/neeeta.png",
  },
  {
    name: "NEI",
    logo: "/deti-plus-26/associations/nei.png",
  },
  {
    name: "NEECT",
    logo: "/deti-plus-26/associations/neect.png",
  },
];

const footerLinks = [
  { label: "About", href: "/#about" },
  { label: "Countdown", href: "/#countdown" },
  { label: "Sponsors", href: "/#sponsors" },
  { label: "Timeline", href: "/#timeline" },
  { label: "Associations", href: "/#associations" },
  { label: "Contacts", href: "/#contacts" },
];

export function Footer() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-border bg-[#080808]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-100"
        style={{ backgroundImage: `url("${FOOTER_MAP}")` }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.74)_0%,rgba(5,5,5,0.48)_42%,rgba(5,5,5,0.2)_72%,rgba(5,5,5,0.5)_100%),linear-gradient(180deg,rgba(5,5,5,0),rgba(5,5,5,0.5))]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-accent/[0.12] blur-[110px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-36 -top-48 h-96 w-96 rounded-full bg-accent/[0.14] blur-[120px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute bottom-[-12rem] right-[22%] h-96 w-96 rounded-full bg-accent/[0.1] blur-[130px]"
        aria-hidden="true"
      />

      <span
        className="pointer-events-none absolute -right-5 -top-20 font-display text-[19rem] leading-none text-accent/[0.07]"
        aria-hidden="true"
      >
        +
      </span>

      <div className="relative h-3 border-b border-border">
        <div className="h-[3px] w-1/4 bg-accent" />
        <div
          className="absolute right-[7%] top-1 flex gap-1"
          aria-hidden="true"
        >
          <span className="h-2 w-2 bg-primary" />
          <span className="h-2 w-2 bg-accent" />
          <span className="h-2 w-2 bg-primary/30" />
        </div>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-7 px-6 py-8 md:grid-cols-2 lg:grid-cols-[1.05fr_0.9fr_0.65fr_0.8fr] lg:gap-8">
        <section>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline">
              <span className="font-display text-6xl font-normal lowercase leading-none tracking-[-0.04em] text-primary">
                deti
              </span>
              <span className="font-display text-6xl font-normal leading-none text-accent">
                +
              </span>
            </div>

            <div className="flex gap-1" aria-hidden="true">
              <span className="h-5 w-5 bg-primary" />
              <span className="h-5 w-5 bg-accent" />
              <span className="h-5 w-5 bg-primary/25" />
            </div>
          </div>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A company fair organized by NEEETA, NEI and NEECT at DETI,
            Universidade de Aveiro.
          </p>

          <div className="mt-5 flex items-center gap-3 font-display text-[9px] uppercase tracking-[0.2em] text-accent">
            <span className="h-px w-9 bg-accent" aria-hidden="true" />
            career connections
            <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
            2026
          </div>

          <div className="mt-5 flex flex-col gap-2 font-display text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
              September 29 — October 1, 2026
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
              DETI · Universidade de Aveiro
            </span>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Organized by
          </h2>

          <div className="space-y-2">
            {organizers.map((organizer) => (
              <div
                key={organizer.name}
                className="flex h-14 w-full items-center justify-center"
              >
                <Image
                  src={organizer.logo}
                  alt={organizer.name}
                  width={180}
                  height={64}
                  className={`mx-auto max-h-12 w-[180px] max-w-full object-contain object-center ${
                    organizer.name === "NEI" ? "-translate-x-2" : ""
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        <nav aria-label="Footer navigation">
          <h2 className="mb-4 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            DETI+ 2026
          </h2>

          <ul className="space-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group inline-flex items-center gap-0 text-sm text-secondary-foreground transition-colors hover:text-primary"
                >
                  <span className="h-px w-0 bg-accent transition-[width,margin] group-hover:mr-2 group-hover:w-3" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section>
          <h2 className="mb-4 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Venue
          </h2>

          <div className="border border-border bg-card/20 p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="text-primary">DETI · Universidade de Aveiro</p>
            <p className="mt-2">September 29 — October 1, 2026</p>
            <a
              href="https://goo.gl/maps/JZY6mi3T9T6UxE3z6"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-block transition-colors hover:text-accent"
            >
              3810-193 Aveiro, Portugal
            </a>
            <a
              href="#contacts"
              className="mt-2 block transition-colors hover:text-accent"
            >
              Contacts
            </a>
          </div>
        </section>
      </div>

      <div className="relative border-t border-border bg-black/20">
        <div className="mx-auto grid min-h-14 max-w-7xl items-center gap-2 px-6 py-4 font-display text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-[1fr_auto_1fr]">
          <span>&copy; {new Date().getFullYear()} deti+. All rights reserved.</span>

          <span className="flex items-center gap-2 sm:justify-center">
            <span className="relative block h-4 w-4" aria-hidden="true">
              <span className="absolute left-[7px] top-0 h-4 w-[2px] bg-accent" />
              <span className="absolute left-0 top-[7px] h-[2px] w-4 bg-accent" />
            </span>
            NEEETA · NEI · NEECT
          </span>

          <span className="sm:text-right">Aveiro · Portugal</span>
        </div>
      </div>
    </footer>
  );
}
