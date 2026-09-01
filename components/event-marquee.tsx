const ITEMS = [
  "DETI+ 2026",
  "Connect",
  "Discover",
  "Build",
  "Learn",
  "Network",
];

export function EventMarquee() {
  const repeated = [...ITEMS, ...ITEMS];

  return (
    <div
      className="overflow-hidden border-y border-border bg-card/30"
      aria-hidden="true"
    >
      <div className="animate-sponsor-scroll flex w-max items-center py-3 font-display text-[10px] uppercase tracking-[0.2em] text-secondary-foreground sm:text-xs">
        {repeated.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center">
            <span className="px-7 sm:px-10">{item}</span>
            <span className="text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
