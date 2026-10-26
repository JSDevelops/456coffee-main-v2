import React, { useState, useEffect } from 'react';
import { Coffee, Menu, X, ArrowUpRight, MapPin, Sparkles, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'เรื่องราวภูพาน', href: '#story' },
    { label: 'เมนูซิกเนเจอร์', href: '#menu' },
    { label: 'สะสมแต้ม 456', href: '#rewards' },
    { label: 'สาขาของเรา', href: '#branches' },
    { label: 'แฟรนไชส์ & ออกบูธ', href: '#franchise' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-nav shadow-lg border-b border-[#DDB892]/30 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#9C6644] flex items-center justify-center text-white shadow-md shadow-[#EA580C]/25 group-hover:scale-105 transition-transform">
              <Coffee size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-2xl tracking-tight text-[#231205]">
                  456 <span className="text-[#EA580C]">COFFEE</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EA580C]/10 text-[#EA580C] uppercase tracking-wider">
                  HQ
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#7F5539] flex items-center gap-1">
                <Sparkles size={11} className="text-[#D97706]" />
                โรบัสต้าแท้ เทือกเขาภูพาน กาฬสินธุ์
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-[#582F0E] hover:text-[#EA580C] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#EA580C] hover:after:w-full after:transition-all"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="https://456.coffee-cafe.shop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-[#7F5539] hover:text-[#231205] bg-[#F5EBE0] hover:bg-[#E6CCB2] transition-colors"
              title="เข้าสู่ระบบศูนย์ควบคุม Admin HQ"
            >
              <ShieldCheck size={14} className="text-[#EA580C]" />
              พอร์ทัล HQ
            </a>

            <a
              href="#branches"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#C86432] hover:from-[#D94E06] hover:to-[#B05322] shadow-md shadow-[#EA580C]/25 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MapPin size={14} />
              สั่งกาแฟ & ค้นหาสาขา
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#231205] bg-[#F5EBE0] hover:bg-[#E6CCB2] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-nav border-b border-[#DDB892]/30 px-6 py-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-4">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-[#582F0E] hover:text-[#EA580C] py-1 border-b border-[#DDB892]/20"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href="#branches"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#C86432] shadow-md"
              >
                <MapPin size={16} />
                สั่งกาแฟ & ค้นหาสาขา
              </a>
              <a
                href="https://456.coffee-cafe.shop"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-[#7F5539] bg-[#F5EBE0]"
              >
                <ShieldCheck size={14} className="text-[#EA580C]" />
                เข้าสู่ระบบ HQ Admin (456.coffee-cafe.shop)
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
