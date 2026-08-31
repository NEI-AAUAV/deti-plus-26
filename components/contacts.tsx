import { PixelCross } from "./pixel-elements";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/section-heading";

const teams = [
  {
    department: "Coordination",
    members: [
      { name: "Hugo Correia", role: "Coordinator", email: "hf.correia@ua.pt", phone: "+351 911584192" },
      { name: "Miguel Paiva", role: "Coordinator", email: "miguelpaiva@ua.pt", phone: "+351 912294394" },
      { name: "Rafael Caçador", role: "Coordinator", email: "rafaelcacador17@ua.pt", phone: "+351 915738409" },
    ],
  },
  {
    department: "External Relations",
    members: [
      { name: "Raquel Tarelho", role: "Team Leader", email: "raqueltarelho@ua.pt", phone: "+351 965470428" },
      { name: "Catarina Gomes", role: "Member", email: "catarinacgomes@ua.pt", phone: "+351 969005943" },
      { name: "Dinis Cunha", role: "Member", email: "diniscunha@ua.pt", phone: "+351 961586846" },
      { name: "Francisco Correia", role: "Member", email: "francisco.correia23@ua.pt", phone: "+351 968449779" },
      { name: "Francisco Ribeiro", role: "Member", email: "franciscomribeiro05@ua.pt", phone: "+351 936684741" },
      { name: "Inês Gonçalves", role: "Member", email: "m.ines.goncalves@ua.pt", phone: "+351 927601914" },
      { name: "Inês Lourenço", role: "Member", email: "inesglourenco@ua.pt", phone: "+351 924034343" },
      { name: "Luís Leal", role: "Member", email: "lecl@ua.pt", phone: "+351 962265686" },
      { name: "Madalena Diogo", role: "Member", email: "madalenadiogo@ua.pt", phone: "+351 961850566" },
      { name: "Margarida Castro", role: "Member", email: "margaridacastro@ua.pt", phone: "+351 911141824" },
      { name: "Sofia Fernandes", role: "Member", email: "scf@ua.pt", phone: "+351 918691066" },
    ],
  },
  {
    department: "Finance",
    members: [
      { name: "Beatriz Francisco", role: "Member", email: "beatriz.francisco26@ua.pt", phone: "+351 913481904" },
      { name: "José Santos", role: "Member", email: "josedanielsantos@ua.pt", phone: "+351 926439345" },
    ],
  },
  {
    department: "Communication & Marketing",
    members: [
      { name: "Hugo Castro", role: "Team Leader", email: "hugocastro@ua.pt", phone: "+351 911797422" },
      { name: "André Dora", role: "Member", email: "andrevasquesdora@ua.pt", phone: "+351 961889625" },
      { name: "Guilherme Amaral", role: "Member", email: "guilherme.a@ua.pt", phone: "+351 968841263" },
      { name: "Joana Gião", role: "Member", email: "joanagiao@ua.pt", phone: "+351 939207968" },
      { name: "Tiago Coelho", role: "Member", email: "trs.coelho@ua.pt", phone: "+351 966955012" },
    ],
  },
  {
    department: "Platform Management",
    members: [
      { name: "Marta Cruz", role: "Team Leader", email: "marta.dias.cruz@ua.pt", phone: "+351 936103605" },
      { name: "Martim Pinheiro", role: "Member", email: "martim@ua.pt", phone: "+351 961258422" },
    ],
  },
  {
    department: "Logistics",
    members: [
      { name: "José Jordão", role: "Team Leader", email: "josemmjordao@ua.pt", phone: "+351 911861333"  },
      { name: "Diogo Santos", role: "Team Leader", email: "diogo.santos20@ua.pt", phone: "+351 966421495"  },
      { name: "Adriana Rocha", role: "Member", email: "adrianarocha@ua.pt", phone: "+351 927224285" },
      { name: "Angela Ribeiro", role: "Member", email: "angelammaribeiro@ua.pt", phone: "+351 967392099" },
      { name: "Bernardo Marçal", role: "Member", email: "bernardo.marcal@ua.pt", phone: "+351 917151007" },
      { name: "Eduardo Moreno", role: "Member", email: "moreno21@ua.pt", phone: "+351 939056519" },
      { name: "Gabriel Coelho", role: "Member", email: "gabriel.coelho@ua.pt", phone: "+351 936697563" },
      { name: "Henrique Lopes", role: "Member", email: "henriquelopes@ua.pt", phone: "+351 963455322" },
      { name: "Miguel Simões", role: "Member", email: "miguel.simoes40@ua.pt", phone: "+351 961059468" },
      { name: "Rodrigo Sampaio", role: "Member", email: "rsampaio@ua.pt", phone: "+351 962960783" },
      { name: "Simão Santos", role: "Member", email: "simaosilvasantos@ua.pt", phone: "+351 962457504" },
      { name: "Vasco Vouzela", role: "Member", email: "vascovouzela@ua.pt", phone: "+351 924348506" },
    ],
  },
];

export function Contacts() {
  return (
    <section id="contacts" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="The Team" title="get in touch" index="05 / 05" />

        <Accordion type="single" collapsible className="flex w-full flex-col gap-3">
          {teams.map((team) => (
            <AccordionItem 
              key={team.department} 
              value={team.department}
              className="group border border-border bg-card px-4 transition-colors data-[state=open]:border-accent/30 sm:px-6" 
            >
              <AccordionTrigger className="py-6 hover:no-underline">
                <div className="flex w-full items-center justify-between gap-6 pr-4">
                  <div className="flex items-center gap-4"><PixelCross className="h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-data-[state=open]:rotate-45" />
                  <h3 className="font-display text-xl lowercase tracking-wide text-primary sm:text-2xl">
                    {team.department}
                  </h3>
                  </div><span className="hidden font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">{team.members.length} {team.members.length === 1 ? "person" : "people"}</span>
                </div>
              </AccordionTrigger>
              
              <AccordionContent>
                <div className="grid gap-4 pb-6 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {team.members.map((member) => (
                    <div
                      key={member.name}
                    className="group/member flex flex-col gap-3 border border-border bg-background p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/40"
                    >
                      <div>
                        <p className="font-bold text-primary">{member.name}</p>
                        <p className="text-xs uppercase tracking-wider text-accent">
                          {member.role}
                        </p>
                      </div>
                      
                      <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                        <a 
                          href={`mailto:${member.email || "placeholder@ua.pt"}`} 
                          className="transition-colors hover:text-primary"
                        >
                          {member.email || "first.last@ua.pt"}
                        </a>
                        <a 
                          href={`tel:${member.phone?.replace(/\s+/g, '') || "+351900000000"}`} 
                          className="transition-colors hover:text-primary"
                        >
                          {member.phone || "+351 9XX XXX XXX"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
