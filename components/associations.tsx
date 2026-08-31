import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

interface Association {
  name: string;
  fullName: string;
  description: string;
  logo: string;
}

const associations: Association[] = [
  { name: "NEEETA", fullName: "Electronic, Telecommunications and Aerospace Engineering Student Association", description: "Founded in 2011 and recently expanded to include Aerospace Engineering, NEEETA defends student interests while promoting extracurricular training, industry networking, and social activities to enrich the academic experience.", logo: "/deti-plus-26/associations/neeeta.png" },
  { name: "NEI", fullName: "Informatics Student Association", description: "Created in 2013, NEI supports Informatics, Data Science, and Digital Games students. Known for organizing programming competitions and tech events, NEI focuses on community building, extracurricular learning, and bringing students closer to the job market.", logo: "/deti-plus-26/associations/nei.png" },
  { name: "NEECT", fullName: "Computer and Telematics Engineering Student Association", description: "Founded in 2006, NEECT represents its students by promoting pedagogical activities like workshops and tech events. It fosters community interaction, organizes large-scale events, and actively connects students with academia and the industry.", logo: "/deti-plus-26/associations/neect.png" },
];

export function Associations() { return <section id="associations" className="border-t border-border px-6 py-24 sm:py-28"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Organized by" title="three associations, one mission" index="01 / 05" /><div className="grid gap-5 md:grid-cols-3">{associations.map((association, index) => <Reveal key={association.name} delay={index * 90}><div className="group h-full border border-border bg-card p-8 transition-[border-color,transform,background-color] duration-200 hover:-translate-y-1 hover:border-accent/50 hover:bg-card/80"><div className="mb-6 flex h-24 items-center justify-start"><Image src={association.logo} alt={`${association.name} logo`} width={300} height={100} className="max-h-20 max-w-[280px] w-auto object-contain" /></div><h3 className="mb-1 font-display text-3xl lowercase tracking-tight text-primary">{association.name}</h3><p className="mb-5 min-h-[3rem] text-xs uppercase leading-relaxed tracking-widest text-accent">{association.fullName}</p><p className="text-sm leading-7 text-muted-foreground">{association.description}</p></div></Reveal>)}</div></div></section>; }
