import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Countdown } from "@/components/countdown";
import { Associations } from "@/components/associations";
import { Timeline } from "@/components/timeline";
import { Sponsors } from "@/components/sponsors";
import { Contacts } from "@/components/contacts";
import { Footer } from "@/components/footer";
import { BackgroundDecorations } from "@/components/background-decorations";

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
        <Countdown />
        <Associations />
        <Timeline />
        <Sponsors />
        <Contacts />
      </main>

      <Footer />
    </>
  );
}
