import React, { useState, useMemo } from 'react';
import {
  Coffee,
  Sprout,
  GraduationCap,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Menu as MenuIcon,
  X,
  Calendar,
  Users,
  FileText,
  ExternalLink,
  Phone,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import './CoffeeHubHomepage.css';

// Types
type FilterCategory = 'all' | 'cafe' | 'plantation' | 'academy';

interface LocationCardData {
  id: string;
  type: 'cafe' | 'plantation' | 'academy';
  name: string;
  badge?: string;
  location: string;
  hours: string;
  phone?: string;
  imageUrl: string;
  description: string;
  isFlagship?: boolean;
}

interface NewsItemData {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  imageUrl: string;
}

export default function CoffeeHubHomepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [selectedLocation, setSelectedLocation] = useState<LocationCardData | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Real verified business data
  const locations: LocationCardData[] = [
    {
      id: 'loc-1',
      type: 'cafe',
      name: '456 Coffee สาขาหลัก',
      badge: 'Flagship Store',
      location: 'อำเภอเมืองกาฬสินธุ์',
      hours: '08:30 - 16:30 น. (เปิดทุกวัน)',
      phone: '061-305-5625',
      imageUrl: '/cafe-main.jpg',
      description: 'คาเฟ่เรือนไม้ 2 ชั้น บาร์กาแฟโรบัสต้าภูพานคั่วสด Slow bar และพื้นที่แลกเปลี่ยนคนรักกาแฟ',
      isFlagship: true,
    },
    {
      id: 'loc-2',
      type: 'plantation',
      name: 'แปลงวิจัยสายพันธุ์กาแฟภูพาน 456',
      badge: 'ต้นน้ำกาแฟ',
      location: 'เทือกเขาภูพาน อำเภอสมเด็จ จังหวัดกาฬสินธุ์',
      hours: '09:00 - 16:00 น. (กรุณานัดหมายล่วงหน้า)',
      phone: '061-305-5625',
      imageUrl: 'https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=800&auto=format&fit=crop',
      description: 'แหล่งปลูกกาแฟโรบัสต้าคัดสรรภายใต้ร่มเงาป่าธรรมชาติ แหล่งศึกษาดูงานต้นน้ำและกระจายต้นกล้าพันธุ์แท้',
    },
    {
      id: 'loc-3',
      type: 'academy',
      name: '456 Coffee Academy กาฬสินธุ์',
      badge: 'ศูนย์อบรมมาตรฐาน',
      location: 'อำเภอเมืองกาฬสินธุ์',
      hours: 'เปิดรับลงทะเบียนตามรอบอบรม',
      phone: '061-305-5625',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop',
      description: 'หลักสูตร Barista Professional, Sensory และบริหารธุรกิจร้านกาแฟแบบครบวงจรจากผู้เชี่ยวชาญ',
    },
  ];

  // News items matching reference images
  const newsList: NewsItemData[] = [
    {
      id: 'news-1',
      title: 'ฤดูกาลเก็บเกี่ยวกาแฟกาฬสินธุ์',
      summary: 'อัปเดตสถานการณ์ ผลผลิต และกิจกรรมในชุมชนกาแฟ',
      date: '12 พ.ย. 2567',
      category: 'ผลผลิตชุมชน',
      imageUrl: 'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'news-2',
      title: 'เทคนิคการปลูกกาแฟคุณภาพ',
      summary: 'แนวทางการดูแล การจัดการดิน และสายพันธุ์ที่เหมาะสม',
      date: '28 ต.ค. 2567',
      category: 'เกษตรกรรมยั่งยืน',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'news-3',
      title: 'ส่องเทรนด์กาแฟไทย ปี 2025',
      summary: 'โอกาสและความท้าทายของร้านกาแฟในยุคใหม่',
      date: '15 ต.ค. 2567',
      category: 'เทรนด์ธุรกิจ',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop',
    },
  ];

  // Search filtering logic
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchType = activeFilter === 'all' || loc.type === activeFilter;
      const matchQuery =
        !searchQuery.trim() ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchQuery;
    });
  }, [locations, activeFilter, searchQuery]);

  const filteredNews = useMemo(() => {
    return newsList.filter((n) => {
      return (
        !searchQuery.trim() ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [newsList, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mapSection = document.getElementById('ch-network-map');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const setChipSearch = (query: string) => {
    setSearchQuery(query);
    const mapSection = document.getElementById('ch-network-map');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="ch-page-wrapper">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#140A04]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <a
            href="/coffee-home"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg p-1"
            aria-label="456 COFFEE HUB หน้าแรก"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center shadow-lg shadow-orange-950/40 group-hover:scale-105 transition-transform">
              <Coffee className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-orange-400 transition-colors">
                  456 COFFEE
                </span>
                <span className="px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#F97316] border border-[#F97316]/50 rounded-full bg-[#EA580C]/15">
                  HUB
                </span>
              </div>
              <span className="text-xs text-[#C8B8A6] font-medium tracking-wide">
                คาเฟ่ · แปลงปลูก · Academy
              </span>
            </div>
          </a>

          {/* Desktop Horizontal Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => setActiveTab('home')}
              className={`relative py-2 transition-colors ${
                activeTab === 'home' ? 'text-white font-semibold' : 'text-[#C5B3A1] hover:text-white'
              }`}
            >
              หน้าแรก
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#EA580C] rounded-full" />
              )}
            </button>
            <a
              href="#pathway-plantation"
              className="text-[#C5B3A1] hover:text-white transition-colors"
            >
              แหล่งปลูกกาแฟ
            </a>
            <a
              href="#ch-network-map"
              onClick={() => setActiveFilter('cafe')}
              className="text-[#C5B3A1] hover:text-white transition-colors"
            >
              ร้านกาแฟ
            </a>
            <a
              href="#pathway-academy"
              className="text-[#C5B3A1] hover:text-white transition-colors"
            >
              Coffee Academy
            </a>
            <a
              href="#ch-news-section"
              className="text-[#C5B3A1] hover:text-white transition-colors"
            >
              ข่าวสาร
            </a>
            <a
              href="#ch-footer-section"
              className="text-[#C5B3A1] hover:text-white transition-colors"
            >
              เกี่ยวกับเรา
            </a>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => {
                const searchEl = document.getElementById('ch-search-input');
                if (searchEl) searchEl.focus();
              }}
              className="p-2.5 text-[#C5B3A1] hover:text-white rounded-full hover:bg-white/5 transition-colors"
              aria-label="ค้นหาข้อมูล"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <a
              href="/#cafes"
              className="px-4 py-2 rounded-full text-sm font-semibold text-white/90 border border-white/20 hover:border-orange-500 hover:text-orange-400 bg-white/5 hover:bg-white/10 transition-all"
            >
              ระบบ JS DEVELOP
            </a>

            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#D94E07] shadow-md shadow-orange-900/30 transition-all transform active:scale-95"
            >
              เข้าสู่ระบบ
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/90 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10 bg-[#160B05] px-2 space-y-2 animate-fadeIn">
            <a
              href="/coffee-home"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-medium text-white bg-white/10 text-base"
            >
              หน้าแรก
            </a>
            <a
              href="#pathway-plantation"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-medium text-[#D8C7B6] hover:bg-white/5 text-base"
            >
              แหล่งปลูกกาแฟ
            </a>
            <a
              href="#ch-network-map"
              onClick={() => {
                setActiveFilter('cafe');
                setMobileMenuOpen(false);
              }}
              className="block px-4 py-2.5 rounded-xl font-medium text-[#D8C7B6] hover:bg-white/5 text-base"
            >
              ร้านกาแฟ
            </a>
            <a
              href="#pathway-academy"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-medium text-[#D8C7B6] hover:bg-white/5 text-base"
            >
              Coffee Academy
            </a>
            <a
              href="#ch-news-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-medium text-[#D8C7B6] hover:bg-white/5 text-base"
            >
              ข่าวสาร
            </a>
            <a
              href="/#cafes"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-medium text-orange-400 hover:bg-white/5 text-base"
            >
              ไปยังหน้า JS DEVELOP
            </a>
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setJoinModalOpen(true);
                }}
                className="w-full py-3 rounded-xl font-bold text-center text-white bg-gradient-to-r from-[#EA580C] to-[#C2410C] shadow-lg"
              >
                เข้าสู่ระบบ / เข้าร่วมเครือข่าย
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-14 sm:pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Description & Search Bar (Desktop) */}
          <div className="lg:col-span-7 space-y-6 z-10">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.2] tracking-tight">
                ทุกเรื่องของกาแฟ <br />
                <span className="ch-hero-gradient-text">เริ่มต้นได้ที่นี่</span>
              </h1>
              <p className="text-[#C8B8A6] text-base sm:text-lg max-w-xl font-normal leading-relaxed">
                เชื่อมโยงคนรักกาแฟ เกษตรกร คาเฟ่ และองค์ความรู้ สู่ระบบนิเวศกาแฟไทยที่ยั่งยืน
              </p>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* 3. SEARCH BAR COMPONENT */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="pt-2">
              <form
                onSubmit={handleSearchSubmit}
                className="ch-search-container flex items-center rounded-full p-1.5 sm:p-2 max-w-2xl"
              >
                <div className="pl-3 sm:pl-4 text-[#A89887]">
                  <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <label htmlFor="ch-search-input" className="sr-only">
                  ค้นหาร้านกาแฟ แหล่งปลูก หลักสูตร
                </label>
                <input
                  id="ch-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาร้านกาแฟ แหล่งปลูก หลักสูตร"
                  className="w-full bg-transparent text-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base placeholder-[#8A7969] focus:outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[#A89887] hover:text-white mr-1"
                    aria-label="ล้างคำค้นหา"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] flex items-center justify-center shrink-0 shadow-lg shadow-orange-950/50 text-white transition-transform active:scale-90"
                  aria-label="เริ่มการค้นหา"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>

              {/* Quick Search Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-[#A89887]">
                <span className="font-medium">คำค้นแนะนำ:</span>
                {['กาฬสินธุ์', 'สาขาหลัก', 'โรบัสต้า', 'Academy', 'แปลงปลูก'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setChipSearch(chip)}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#C8B8A6] hover:text-orange-300 transition-colors border border-white/5"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual - Ripe Coffee Cherries & Roasted Beans */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md lg:max-w-none aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden border border-white/15 shadow-2xl shadow-black/80 group">
              <img
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop"
                alt="เมล็ดกาแฟ ใบกาแฟ และผลกาแฟเชอรี่สุกบนกิ่งธรรมชาติ"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#160B05]/90 via-[#160B05]/20 to-transparent pointer-events-none" />
              
              {/* Badge overlay on Hero image */}
              <div className="absolute bottom-4 left-4 right-4 p-3 sm:p-4 rounded-2xl bg-[#1A0E07]/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Robusta Phu Phan Origin
                  </div>
                  <div className="text-white text-sm font-semibold">
                    กาแฟอัตลักษณ์เทือกเขาภูพาน กาฬสินธุ์
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-600/30 flex items-center justify-center text-orange-400">
                  <Coffee className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. THREE PATHWAY CARDS */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Pathway 1: ต้นน้ำ · การปลูกกาแฟ */}
          <div
            id="pathway-plantation"
            onClick={() => {
              setActiveFilter('plantation');
              const el = document.getElementById('ch-network-map');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="ch-pathway-plantation ch-card p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="ต้นน้ำ · การปลูกกาแฟ"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <h2 className="text-white font-bold text-base sm:text-lg group-hover:text-emerald-300 transition-colors">
                  ต้นน้ำ · การปลูกกาแฟ
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#A5C2AE] font-normal line-clamp-1">
                แหล่งปลูก สายพันธุ์ ความรู้เกษตรกรกาแฟ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 sm:w-20 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-emerald-500/30">
                <img
                  src="https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=400&auto=format&fit=crop"
                  alt="ไร่กาแฟและแปลงปลูกบนภูเขา"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pathway 2: คาเฟ่ · ร้านกาแฟ */}
          <div
            id="pathway-cafe"
            onClick={() => {
              setActiveFilter('cafe');
              const el = document.getElementById('ch-network-map');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="ch-pathway-cafe ch-card p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="คาเฟ่ · ร้านกาแฟ"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Coffee className="w-4 h-4" />
                </div>
                <h2 className="text-white font-bold text-base sm:text-lg group-hover:text-orange-300 transition-colors">
                  คาเฟ่ · ร้านกาแฟ
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#CDB7A3] font-normal line-clamp-1">
                ค้นหาร้านกาแฟทั่วไทย
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 sm:w-20 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-orange-500/30">
                <img
                  src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop"
                  alt="แก้วกาแฟลาเต้อาร์ตในคาเฟ่"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <ChevronRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pathway 3: Coffee Academy */}
          <div
            id="pathway-academy"
            onClick={() => {
              setActiveFilter('academy');
              const el = document.getElementById('ch-network-map');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="ch-pathway-academy ch-card p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Coffee Academy"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h2 className="text-white font-bold text-base sm:text-lg group-hover:text-amber-300 transition-colors">
                  Coffee Academy
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#D7C2A9] font-normal line-clamp-1">
                คอร์สเรียน องค์ความรู้ และงานอบรม
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 sm:w-20 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-amber-500/30">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop"
                  alt="สมุดบันทึกและเมล็ดกาแฟคั่วสำหรับการเรียนรู้"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. COFFEE NETWORK MAP & LOCATIONS SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="ch-network-map" className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="ch-card p-5 sm:p-7 space-y-6">
          
          {/* Section Header with Title and Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-[#EA580C] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#EA580C]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  แผนที่เครือข่ายกาแฟ
                </h2>
                <p className="text-xs text-[#A89887]">
                  ค้นหาจุดเชื่อมโยง 456 Coffee สาขา แหล่งปลูก และสถาบันอบรม
                </p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`ch-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('cafe')}
                className={`ch-filter-btn ${activeFilter === 'cafe' ? 'active' : ''}`}
              >
                ร้านกาแฟ
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('plantation')}
                className={`ch-filter-btn ${activeFilter === 'plantation' ? 'active' : ''}`}
              >
                พื้นที่ปลูก
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('academy')}
                className={`ch-filter-btn ${activeFilter === 'academy' ? 'active' : ''}`}
              >
                หลักสูตร
              </button>

              <a
                href="#ch-network-map"
                onClick={() => setActiveFilter('all')}
                className="hidden sm:inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-semibold ml-2"
              >
                ดูแผนที่ทั้งหมด <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Map & Location Card Container (2-Column Desktop, Stacked Mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Column 1: Interactive Google Maps Frame */}
            <div className="lg:col-span-7 ch-map-frame h-[300px] sm:h-[380px] lg:h-[420px] bg-[#1a0f07] relative">
              <iframe
                title="Google Maps - 456 Coffee สาขาหลัก กาฬสินธุ์"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3826.305607062402!2d103.50428487588147!3d16.434444584299865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313d0fc70b804567%3A0xb35fa3cae1870198!2z4LiB4Liy4Lis4Lix4LiZ4Liq4Li04LiZ4LiX4Li44LmM!5e0!3m2!1sth!2sth!4v1714000000000!5m2!1sth!2sth"
                className="w-full h-full border-0 filter contrast-[1.05] brightness-[0.92]"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Map Floating Pin Overlay Indicator */}
              <div className="absolute top-4 left-4 bg-[#140A04]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg text-xs pointer-events-none">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-white font-medium">อำเภอเมืองกาฬสินธุ์ (ทางหลวง 213)</span>
              </div>
            </div>

            {/* Column 2: Location Recommendation Cards List */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3 ch-no-scrollbar max-h-[420px] overflow-y-auto pr-1">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        loc.isFlagship
                          ? 'bg-[#23140A] border-orange-500/40 hover:border-orange-500'
                          : 'bg-[#180E07] border-white/10 hover:border-white/25'
                      }`}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex gap-4 items-center">
                        {/* Real Photo Thumbnail */}
                        <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-black/40">
                          <img
                            src={loc.imageUrl}
                            alt={loc.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop';
                            }}
                          />
                          {loc.badge && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EA580C] text-white">
                              {loc.badge}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h3 className="text-white font-bold text-base sm:text-lg truncate">
                            {loc.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#D8C7B6]">
                            <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            <span className="truncate">{loc.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[#A89887]">
                            <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            <span className="truncate">{loc.hours}</span>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-orange-400 shrink-0" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-[#1A0E07] border border-white/10 space-y-2">
                    <Info className="w-8 h-8 text-[#A89887] mx-auto" />
                    <p className="text-white font-medium">ไม่พบผลลัพธ์ที่ตรงกับการค้นหา</p>
                    <p className="text-xs text-[#A89887]">
                      ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองเป็น "ทั้งหมด"
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('all');
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 text-white mt-2"
                    >
                      ล้างตัวกรอง
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Call / Contact action button */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-[#D8C7B6]">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-400" />
                  <span>โทรสอบถามข้อมูลสาขาหลัก:</span>
                  <a
                    href="tel:0613055625"
                    className="text-white font-bold hover:text-orange-300"
                  >
                    061-305-5625
                  </a>
                </div>
                <span className="hidden sm:inline text-[11px] text-[#8E7E6E]">เปิดให้บริการทุกวัน</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. NEWS FROM COFFEE HUB SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="ch-news-section" className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-[#EA580C] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#EA580C]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  ข่าวสารจาก Coffee HUB
                </h2>
                <p className="text-xs text-[#A89887]">
                  อัปเดตความเคลื่อนไหว กิจกรรมชุมชน และบทความความรู้เรื่องกาแฟ
                </p>
              </div>
            </div>

            <a
              href="#ch-news-section"
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
            >
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* News Cards Grid (3 Columns on Desktop, Stacked on Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredNews.map((news) => (
              <article
                key={news.id}
                onClick={() => alert(`ข่าวสาร: ${news.title}\n\n${news.summary}\nวันที่: ${news.date}`)}
                className="ch-card p-4 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer group"
                tabIndex={0}
              >
                <div className="space-y-3">
                  <div className="aspect-[16/10] rounded-xl overflow-hidden border border-white/10 relative">
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#140A04]/80 backdrop-blur-md text-orange-400 border border-white/10">
                      {news.category}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-white font-bold text-base group-hover:text-orange-400 transition-colors line-clamp-2">
                      {news.title}
                    </h3>
                    <p className="text-xs text-[#C8B8A6] font-normal line-clamp-2 leading-relaxed">
                      {news.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-[#8A7969]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span>{news.date}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. GOOGLE ADSENSE PLACEHOLDER BANNER */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
        <div
          className="ch-adsense-banner"
          role="region"
          aria-label="พื้นที่โฆษณา Google AdSense"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#A89887] bg-black/5 px-2 py-0.5 rounded">
              Sponsored
            </span>
            <span>พื้นที่โฆษณา Google AdSense (รองรับขนาด Responsive Desktop & Mobile)</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. JOIN NETWORK CTA BUTTON & BANNER */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <button
          onClick={() => setJoinModalOpen(true)}
          className="ch-join-btn w-full text-base sm:text-lg group"
          aria-label="เข้าร่วมเครือข่าย 456 COFFEE HUB"
        >
          <Users className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          <span>เข้าร่วมเครือข่าย 456 COFFEE HUB</span>
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 9. FOOTER SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <footer id="ch-footer-section" className="bg-[#0B0401] border-t border-white/10 mt-12 py-10 px-4 sm:px-6 lg:px-8 text-[#A89887]">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white">456 COFFEE</span>
                  <span className="px-1.5 py-0.2 text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded bg-orange-600/10">
                    HUB
                  </span>
                </div>
                <p className="text-xs text-[#8A7969]">Good Coffee · Better People · Stronger Communities</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#C8B8A6]">
              <a href="#pathway-plantation" className="hover:text-white transition-colors">แปลงปลูก</a>
              <a href="#ch-network-map" className="hover:text-white transition-colors">ร้านกาแฟ</a>
              <a href="#pathway-academy" className="hover:text-white transition-colors">Academy</a>
              <a href="#ch-news-section" className="hover:text-white transition-colors">ข่าวสาร</a>
              <a href="/#cafes" className="text-orange-400 hover:text-orange-300 font-semibold">
                หน้าหลัก JS DEVELOP
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} 456 COFFEE HUB. สงวนลิขสิทธิ์ทุกประการ.</p>
            <p className="text-[#8A7969]">
              ขับเคลื่อนระบบนิเวศกาแฟไทย จากยอดภูพานสู่ร้านกาแฟทั่วประเทศ
            </p>
          </div>

        </div>
      </footer>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: JOIN NETWORK */}
      {/* ────────────────────────────────────────────────────────── */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#180D06] border border-orange-500/30 rounded-2xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl relative">
            <button
              onClick={() => setJoinModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#A89887] hover:text-white hover:bg-white/10"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                เข้าร่วมเครือข่าย 456 COFFEE HUB
              </h3>
              <p className="text-xs text-[#C8B8A6]">
                ยินดีต้อนรับเจ้าของร้านกาแฟ เกษตรกรผู้ปลูกกาแฟ และผู้สนใจพัฒนาทักษะบาริสต้า
              </p>
            </div>

            <div className="space-y-3 pt-2 text-sm">
              <a
                href="tel:0613055625"
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 font-semibold text-center flex items-center justify-center gap-2 text-white shadow-lg shadow-orange-950/40"
              >
                <Phone className="w-4 h-4" /> โทร 061-305-5625
              </a>
              <a
                href="/#academy"
                onClick={() => setJoinModalOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 font-semibold text-center flex items-center justify-center gap-2 text-white"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" /> ลงทะเบียน 456 Academy
              </a>
              <a
                href="/#plantations"
                onClick={() => setJoinModalOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 hover:bg-emerald-900/50 font-semibold text-center flex items-center justify-center gap-2 text-emerald-300"
              >
                <Sprout className="w-4 h-4" /> สั่งจองต้นกล้ากาแฟภูพาน
              </a>
            </div>

            <p className="text-[11px] text-center text-[#8A7969]">
              456 Coffee สาขาหลัก อำเภอเมืองกาฬสินธุ์
            </p>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: LOCATION DETAIL */}
      {/* ────────────────────────────────────────────────────────── */}
      {selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#180D06] border border-orange-500/30 rounded-2xl max-w-lg w-full p-6 space-y-4 text-white shadow-2xl relative">
            <button
              onClick={() => setSelectedLocation(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#A89887] hover:text-white hover:bg-white/10"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-[16/9] rounded-xl overflow-hidden border border-white/10">
              <img
                src={selectedLocation.imageUrl}
                alt={selectedLocation.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-bold bg-orange-600 rounded text-white">
                  {selectedLocation.badge || 'สถานที่'}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedLocation.name}</h3>
              </div>
              <p className="text-xs text-[#D8C7B6] leading-relaxed">
                {selectedLocation.description}
              </p>
              <div className="pt-2 space-y-1 text-xs text-[#A89887]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>{selectedLocation.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>{selectedLocation.hours}</span>
                </div>
                {selectedLocation.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>โทรติดต่อ: {selectedLocation.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              {selectedLocation.phone && (
                <a
                  href={`tel:${selectedLocation.phone}`}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-center font-bold text-sm text-white"
                >
                  โทรติดต่อทันที
                </a>
              )}
              <button
                onClick={() => setSelectedLocation(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-white"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
