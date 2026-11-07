import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Features, FinalCTA, Hero, InfoCards, Plans, StatsStrip } from '@/components/landing/LandingSections';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsStrip />
        <Features />
        <Plans />
        <InfoCards />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
