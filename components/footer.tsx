export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl lowercase tracking-wide text-primary">
            deti
          </span>
          <span className="font-display text-2xl text-accent">+</span>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          A company fair organized by NEEETA, NEI and NEECT at DETI,
          Universidade de Aveiro.
        </p>
        <div className="flex items-center gap-6 font-display text-xs uppercase tracking-widest text-muted-foreground">
          <span>NEEETA</span>
          <div className="h-3 w-px bg-accent/40" />
          <span>NEI</span>
          <div className="h-3 w-px bg-accent/40" />
          <span>NEECT</span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} deti+. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
