export function Hero() {
  return (
    <section
      id="about"
      aria-labelledby="hero-heading"
      className="relative flex min-h-screen flex-col items-start justify-center overflow-hidden px-6 pt-20 pb-20 md:px-12 lg:px-20"
    >
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-start gap-8">
        <div className="flex items-center gap-3">
          <span className="font-display text-5xl lowercase tracking-wide text-primary sm:text-6xl">
            deti
          </span>
          <span className="font-display text-5xl text-accent sm:text-6xl">
            +
          </span>
          <div className="ml-4 flex gap-1" aria-hidden="true">
            <div className="h-8 w-8 bg-primary sm:h-10 sm:w-10" />
            <div className="h-8 w-8 bg-accent sm:h-10 sm:w-10" />
          </div>
        </div>

        <h1
          id="hero-heading"
          className="text-balance font-display text-6xl lowercase leading-[0.95] text-primary sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem]"
        >
          connecting students with the future
        </h1>

        <p className="font-display text-xl lowercase text-accent sm:text-2xl md:text-3xl">
          dynamic company fair 2026
        </p>

        <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
          Born from the collaboration of DETI&apos;s student associations, DETI+ aims to strengthen the connection between students and the corporate world. Over three days, you will have the opportunity to directly contact leading engineering, technology, and innovation companies, explore internships and job offers, and bridge the gap between academic training and the job market.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
          <div className="flex items-center gap-4">
            <div className="h-4 w-4 bg-accent sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="font-display text-lg uppercase tracking-widest text-primary sm:text-xl">
              May 19 &ndash; 21, 2026
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-4 bg-accent sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="font-display text-lg uppercase tracking-widest text-primary sm:text-xl">
              DETI, University of Aveiro
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}