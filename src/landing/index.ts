import { Navigation, Hero, ModulesSection, FeaturesSection, SecuritySection, SocialProof, CTASection, Footer } from './components';

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950">
      <Navigation />
      <main>
        <Hero />
        <ModulesSection />
        <FeaturesSection />
        <SecuritySection />
        <SocialProof />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export { BentoCard, BentoGrid } from './components/BentoGrid';
export { Navigation } from './components/Navigation';
export { Hero } from './components/Hero';
export { ModulesSection } from './components/ModulesSection';
export { FeaturesSection } from './components/FeaturesSection';
export { SecuritySection } from './components/SecuritySection';
export { SocialProof } from './components/SocialProof';
export { CTASection } from './components/CTASection';
export { Footer } from './components/Footer';
