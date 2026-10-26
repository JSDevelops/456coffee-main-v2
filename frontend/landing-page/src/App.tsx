import React from 'react';
import { Navbar } from './components/Navbar';
import { HeroMapSection } from './components/HeroMapSection';
import { CafeLocationsSection } from './components/CafeLocationsSection';
import { PlantationSection } from './components/PlantationSection';
import { AcademySection } from './components/AcademySection';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#231205]">
      <Navbar />
      <main className="flex-grow">
        {/* 1. Hero & Interactive Pin Map (Cafes, Plantations, Academy) */}
        <HeroMapSection />

        {/* 2. Cafe Locations Section */}
        <CafeLocationsSection />

        {/* 3. Coffee Plantation & Seedling Booking / Pinning Section */}
        <PlantationSection />

        {/* 4. 456 Coffee Academy: Barista & Cafe Business Management */}
        <AcademySection />
      </main>
      <Footer />
    </div>
  );
}
