import { Reveal } from "@/components/reveal";

const reasons = [
  {
    number: "01",
    title: "Meet",
    description:
      "Talk directly with companies from engineering, technology and innovation — without the distance of a traditional recruitment process.",
  },
  {
    number: "02",
    title: "Discover",
    description:
      "Explore internships, jobs, projects and different professional realities while understanding what the market expects.",
  },
  {
    number: "03",
    title: "Learn",
    description:
      "Join talks and workshops designed to complement your academic path with practical knowledge and industry perspectives.",
  },
  {
    number: "04",
    title: "Connect",
    description:
      "Build meaningful relationships with recruiters, engineers, students and the academic community in a more informal environment.",
  },
];

export function WhyAttend() {
  return (
    <section
      id="why"
      className="relative z-20 bg-[#f5f5f1] px-6 py-24 text-[#050505] sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <Reveal>
            <div>
              <div className="mb-6 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.22em] text-[#006a69]">
                <span className="h-2 w-2 bg-[#006a69]" aria-hidden="true" />
                <span>Why DETI+</span>
              </div>

              <h2 className="max-w-[9ch] font-display text-[clamp(4.4rem,9vw,9rem)] font-normal uppercase leading-[0.8] tracking-[-0.03em]">
                More than a company fair.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <p className="max-w-xl text-base leading-[1.8] text-[#4c4c49] sm:text-lg lg:ml-auto">
              A direct bridge between academic life and the professional world:
              explore real opportunities, understand what companies are building
              and create contacts that can shape what comes next.
            </p>
          </Reveal>
        </div>

        <div className="border-t border-[#bfbfba]">
          {reasons.map((reason, index) => (
            <Reveal key={reason.number} delay={Math.min(index * 70, 210)}>
              <article className="group grid gap-4 border-b border-[#bfbfba] py-8 transition-[padding,background-color] hover:bg-black/[0.025] sm:grid-cols-[70px_0.7fr_1fr] sm:gap-7 sm:py-9 sm:hover:px-4">
                <span className="font-display text-[10px] tracking-[0.18em] text-[#70706d]">
                  {reason.number}
                </span>

                <h3 className="font-display text-4xl font-normal uppercase leading-none tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                  {reason.title}
                </h3>

                <p className="max-w-xl leading-[1.75] text-[#4d4d4a] sm:pt-1">
                  {reason.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
