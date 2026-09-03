const ITEMS = [
  "DETI+ 2026",
  "Connect",
  "Discover",
  "Build",
  "Learn",
  "Network",
];

export function EventMarquee() {
  // Keep each sequence wider than the viewport. The second identical sequence
  // takes over exactly when the first one has travelled out of view.
  const sequence = Array.from({ length: 4 }, () => ITEMS).flat();

  return (
    <div
      className="overflow-hidden border-y border-border bg-card/30"
      aria-hidden="true"
    >
      <div className="animate-sponsor-scroll flex w-max items-center font-display text-[10px] uppercase tracking-[0.2em] text-secondary-foreground sm:text-xs">
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0 items-center py-3">
            {sequence.map((item, index) => (
              <span key={`${group}-${item}-${index}`} className="flex items-center">
                <span className="px-7 sm:px-10">{item}</span>
                <span className="text-accent">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
