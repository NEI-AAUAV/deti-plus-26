import { Reveal } from "@/components/reveal";

const days = [
  {
    date: "Sep 29",
    day: "Day 1",
    events: [{ time: "17:00 - 20:00", title: "Lectures & Workshops" }],
  },
  {
    date: "Sep 30",
    day: "Day 2",
    events: [
      { time: "All Day", title: "Company Fair" },
      {
        time: "Morning & Afternoon",
        title: "Interviews & Speed Interviews",
      },
      {
        time: "End of Day",
        title: "Informal Business Networking Snack",
      },
    ],
  },
  {
    date: "Oct 1",
    day: "Day 3",
    events: [
      { time: "17:00 - 20:00", title: "Lectures & Workshops" },
      { time: "After 20:00", title: "Closing Session & Networking" },
    ],
  },
];

export function Timeline() {
  return (
    <section
      id="timeline"
      aria-labelledby="timeline-heading"
      className="border-t border-border bg-card/20 px-6 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex items-center gap-4 font-display text-[10px] uppercase tracking-[0.22em]">
          <div className="flex items-center gap-2 text-accent">
            <span className="h-2 w-2 bg-accent" aria-hidden="true" />
            <span>Schedule</span>
          </div>

          <div className="h-px flex-1 bg-border" aria-hidden="true" />

          <span className="text-muted-foreground">03 / 05</span>
        </div>

        <div className="mb-16 grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <Reveal>
            <h2
              id="timeline-heading"
              className="font-display text-[clamp(4rem,8vw,7rem)] font-normal lowercase leading-[0.86] tracking-[-0.025em] text-primary"
            >
              event timeline
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <p className="max-w-xl leading-relaxed text-muted-foreground lg:ml-auto">
              The full detailed schedule is coming soon. Stay tuned!
            </p>
          </Reveal>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-[7px] hidden h-px bg-border md:block"
          />

          <div
            aria-hidden="true"
            className="absolute left-0 top-[7px] hidden h-px w-2/3 bg-accent/60 md:block"
          />

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {days.map((day, index) => (
              <Reveal key={day.day} delay={index * 120}>
                <article className="group relative">
                  <div
                    aria-hidden="true"
                    className="relative z-10 mb-8 hidden h-4 w-4 border-[3px] border-accent bg-background transition-[background-color,transform] duration-200 group-hover:scale-125 group-hover:bg-accent md:block"
                  />

                  <div className="border-t border-border pt-6 md:border-t-0 md:pt-0">
                    <p className="font-display text-xs uppercase tracking-[0.2em] text-accent">
                      {day.day}
                    </p>

                    <h3 className="mt-2 font-display text-5xl font-normal lowercase tracking-[-0.02em] text-primary lg:text-6xl">
                      {day.date}
                    </h3>

                    <ul className="mt-8 space-y-6">
                      {day.events.map((event) => (
                        <li
                          key={event.title}
                          className="border-l-2 border-accent/25 pl-4 transition-colors duration-200 group-hover:border-accent/55"
                        >
                          <span className="font-display text-base text-muted-foreground">
                            {event.time}
                          </span>
                          <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">
                            {event.title}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
