import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AtmosNavbar } from '../landing/AtmosNavbar';
import { ScrollStoryStage } from '../landing/ScrollStoryStage';
import { ProductShowcase, MainProductModuleId } from '../landing/ProductShowcase';
import { FeatureExploration } from '../landing/FeatureExploration';
import { HowItWorksSteps } from '../landing/HowItWorksSteps';
import { BenefitsGrid } from '../landing/BenefitsGrid';
import { FaqAccordion } from '../landing/FaqAccordion';
import { AtmosCtaFooter } from '../landing/AtmosCtaFooter';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
}) => {
  const { switchDemoUser } = useApp();
  const [selectedShowcaseTab, setSelectedShowcaseTab] = useState<MainProductModuleId>('habit_tracker');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 84;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = Math.max(0, elementPosition - navOffset);
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleSelectMiniCard = (cardId: string) => {
    // Map mini card ID directly to the six main product modules
    if (cardId === 'assignments') {
      setSelectedShowcaseTab('assignments');
    } else if (cardId === 'notes') {
      setSelectedShowcaseTab('academic_progress');
    } else if (cardId === 'money') {
      setSelectedShowcaseTab('money_manager');
    } else if (cardId === 'focus') {
      setSelectedShowcaseTab('focus_pomodoro');
    } else if (cardId === 'habits') {
      setSelectedShowcaseTab('habit_tracker');
    } else if (cardId === 'timetable') {
      setSelectedShowcaseTab('timetable_calendar');
    } else {
      setSelectedShowcaseTab('habit_tracker');
    }
    scrollToSection('showcase');
  };

  const handleExploreDemo = () => {
    switchDemoUser('usr_aarav_sharma');
  };

  return (
    <div className="min-h-screen bg-atmos-navy text-atmos-white flex flex-col selection:bg-atmos-purple/30 relative overflow-x-clip">
      {/* Global Cinematic Atmospheric Background Gradients */}
      <div className="fixed inset-0 pointer-events-none -z-20 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(32,22,62,0.6),transparent_80%)]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-atmos-purple/15 via-atmos-periwinkle/10 to-transparent blur-3xl pointer-events-none -z-20" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-atmos-violet/20 blur-3xl pointer-events-none -z-20" />

      {/* Atmospheric Glass Navigation */}
      <AtmosNavbar
        onGoToLogin={onGoToLogin}
        onGoToRegister={onGoToRegister}
        onExploreDemo={handleExploreDemo}
        onScrollToSection={scrollToSection}
      />

      <main className="flex-1 w-full flex flex-col">
        {/* 1 & 2. Hero & Signature Scroll-Driven Transformation Stage (Fixed, Smooth, Reversible) */}
        <ScrollStoryStage
          onGoToRegister={onGoToRegister}
          onGoToLogin={onGoToLogin}
          onExploreDemo={handleExploreDemo}
          onSelectMiniCard={handleSelectMiniCard}
          onScrollToExplore={() => scrollToSection('showcase')}
        />

        {/* 3. Interactive Product Reveal (Exactly 6 Modules in Order) */}
        <ProductShowcase
          onExploreDemo={handleExploreDemo}
          onGoToRegister={onGoToRegister}
          initialTab={selectedShowcaseTab}
        />

        {/* 4. Interactive Feature Exploration */}
        <FeatureExploration onExploreDemo={handleExploreDemo} />

        {/* 5. How UniFlow Works (3-Step Connected Visual Sequence) */}
        <HowItWorksSteps />

        {/* 6. Core Student-Centric Benefits */}
        <BenefitsGrid />

        {/* 7. Frequently Asked Questions Accordion */}
        <FaqAccordion />

        {/* 8. Final CTA & Atmospheric Footer */}
        <AtmosCtaFooter
          onGoToRegister={onGoToRegister}
          onGoToLogin={onGoToLogin}
          onExploreDemo={handleExploreDemo}
          onScrollToSection={scrollToSection}
        />
      </main>
    </div>
  );
};
