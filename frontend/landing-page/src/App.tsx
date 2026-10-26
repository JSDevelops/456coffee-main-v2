import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StorySection } from './components/StorySection';
import { MenuSection } from './components/MenuSection';
import { LoyaltySection } from './components/LoyaltySection';
import { BranchesSection } from './components/BranchesSection';
import { FranchiseSection } from './components/FranchiseSection';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#231205]">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <StorySection />
        <MenuSection />
        <LoyaltySection />
        <BranchesSection />
        <FranchiseSection />
      </main>
      <Footer />
    </div>
  );
}
