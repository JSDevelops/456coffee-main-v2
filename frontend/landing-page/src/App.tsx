import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroMapSection } from './components/HeroMapSection';
import { CafeLocationsSection } from './components/CafeLocationsSection';
import { PlantationSection } from './components/PlantationSection';
import { AcademySection } from './components/AcademySection';
import { Footer } from './components/Footer';
import CoffeeHubHomepage from './pages/CoffeeHubHomepage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname.replace(/\/+$/, '') || '/';
    const h = window.location.hash.replace(/^#\/?/, '');
    if (p === '/js-develop' || h === 'js-develop' || h === '/js-develop') {
      return '/js-develop';
    }
    // Default to 456 Coffee HUB for '/' and '/coffee-home'
    return '/coffee-home';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const p = window.location.pathname.replace(/\/+$/, '') || '/';
      const h = window.location.hash.replace(/^#\/?/, '');
      if (p === '/js-develop' || h === 'js-develop' || h === '/js-develop') {
        setCurrentPath('/js-develop');
      } else {
        setCurrentPath('/coffee-home');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // When visiting /js-develop, render the JS DEVELOP page
  if (currentPath === '/js-develop') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#231205]">
        {/* Banner leading back to 456 Coffee HUB */}
        <div className="bg-[#180D06] text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-white/10 z-50">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <span>✨ กำลังแสดงหน้าระบบเดิม (JS DEVELOP)</span>
            <a
              href="/"
              className="px-3.5 py-1 rounded-full bg-[#EA580C] hover:bg-[#D94E07] text-white font-semibold text-xs transition-all shrink-0 shadow-md"
            >
              &larr; กลับสู่หน้าหลัก 456 COFFEE HUB
            </a>
          </div>
        </div>

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

  // DEFAULT FOR ROOT `/` AND `/coffee-home`: 456 COFFEE HUB HOMEPAGE!
  return <CoffeeHubHomepage />;
}
