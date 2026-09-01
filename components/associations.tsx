import Image from "next/image";

import { Reveal } from "@/components/reveal";

interface Association {
  name: string;
  fullName: string;
  description: string;
  logo: string;
}

const associations: Association[] = [
  {
    name: "NEEETA",
    fullName:
      "Electronic, Telecommunications and Aerospace Engineering Student Association",
    description:
      "Founded in 2011 and recently expanded to include Aerospace Engineering, NEEETA defends student interests while promoting extracurricular training, industry networking, and social activities to enrich the academic experience.",
    logo: "/deti-plus-26/associations/neeeta.png",
  },
  {
    name: "NEI",
    fullName: "Informatics Student Association",
    description:
      "Created in 2013, NEI supports Informatics, Data Science, and Digital Games students. Known for organizing programming competitions and tech events, NEI focuses on community building, extracurricular learning, and bringing students closer to the job market.",
    logo: "/deti-plus-26/associations/nei.png",
  },
  {
    name: "NEECT",
    fullName: "Computer and Telematics Engineering Student Association",
    description:
      "Founded in 2006, NEECT represents its students by promoting pedagogical activities like workshops and tech events. It fosters community interaction, organizes large-scale events, and actively connects students with academia and the industry.",
    logo: "/deti-plus-26/associations/neect.png",
  },
];

export function Associations() {
  return (
    <section
      id="associations"
      aria-labelledby="associations-heading"
      className="border-t border-border px-6 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex items-center gap-4 font-display text-[10px] uppercase tracking-[0.22em]">
          <div className="flex items-center gap-2 text-accent">
            <span className="h-2 w-2 bg-accent" aria-hidden="true" />
            <span>Organized by</span>
          </div>

          <div className="h-px flex-1 bg-border" aria-hidden="true" />

          <span className="text-muted-foreground">04 / 05</span>
        </div>

        <div className="mb-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <Reveal>
            <h2
              id="associations-heading"
              className="max-w-[12ch] font-display text-[clamp(4rem,8vw,7.5rem)] font-normal lowercase leading-[0.84] tracking-[-0.03em] text-primary"
            >
              three associations, one mission
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <div className="flex items-center gap-3 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground lg:justify-end">
              <span>NEEETA</span>
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
              <span>NEI</span>
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
              <span>NEECT</span>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {associations.map((association, index) => (
            <Reveal key={association.name} delay={index * 90}>
              <article className="group flex h-full flex-col border border-border bg-card/70 p-7 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-1 hover:border-accent/50 hover:bg-card sm:p-8">
                <div className="mb-8 flex h-24 items-center">
                  <Image
                    src={association.logo}
                    alt={`${association.name} logo`}
                    width={300}
                    height={100}
                    className="max-h-20 w-auto max-w-[260px] object-contain"
                  />
                </div>

                <h3 className="font-display text-4xl font-normal lowercase tracking-[-0.02em] text-primary">
                  {association.name}
                </h3>

                <p className="mt-2 min-h-[3.5rem] text-xs uppercase leading-relaxed tracking-widest text-accent">
                  {association.fullName}
                </p>

                <div className="my-6 h-px bg-border transition-colors group-hover:bg-accent/25" />

                <p className="text-sm leading-7 text-muted-foreground">
                  {association.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
