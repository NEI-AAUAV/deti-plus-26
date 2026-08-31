import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, index, className }: { eyebrow: string; title: string; description?: React.ReactNode; index?: string; className?: string }) {
  return <div className={cn("mb-16", className)}>
    {index ? <Reveal><div className="mb-12 flex items-center gap-4"><div className="flex items-center gap-2"><div className="h-2 w-2 bg-accent" /><span className="font-display text-[10px] uppercase tracking-[0.25em] text-accent">{eyebrow}</span></div><div className="h-px flex-1 bg-border" /><span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{index}</span></div></Reveal> : null}
    <Reveal><div className="text-center">{!index ? <div className="mb-4 flex items-center justify-center gap-2"><div className="h-2 w-2 bg-accent" /><p className="font-display text-sm uppercase tracking-[0.3em] text-accent">{eyebrow}</p></div> : null}<h2 className="text-balance font-display text-3xl lowercase tracking-[0.15em] text-primary sm:text-4xl">{title}</h2>{description ? <div className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">{description}</div> : null}</div></Reveal>
  </div>;
}
