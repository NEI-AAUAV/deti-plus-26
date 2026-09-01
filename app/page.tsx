import { Associations } from "@/components/associations";
import { BackgroundDecorations } from "@/components/background-decorations";
import { Contacts } from "@/components/contacts";
import { Countdown } from "@/components/countdown";
import { EventMarquee } from "@/components/event-marquee";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { Sponsors } from "@/components/sponsors";
import { Timeline } from "@/components/timeline";
import { WhyAttend } from "@/components/why-attend";

export default function Page() {
  return (
    <>
      <BackgroundDecorations />

      <Navbar />

      <main
        id="main"
        tabIndex={-1}
        className="relative z-10 overflow-x-clip"
      >
        <Hero />
        <EventMarquee />
        <Countdown />
        <WhyAttend />
        <Sponsors />
        <Timeline />
        <Associations />
        <Contacts />
        <FinalCta />
      </main>

      <Footer />
    </>
  );
}
