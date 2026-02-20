
import { useRef } from "react";
import Navbar from "@/components/Navbar";
import LandingHero from "@/components/landing/LandingHero";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";

const Index = () => {
  const howItWorksRef = useRef<HTMLElement>(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <LandingHero onLearnMore={scrollToHowItWorks} />
      <HowItWorksSection sectionRef={howItWorksRef} />
      <BenefitsSection />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
};

export default Index;

