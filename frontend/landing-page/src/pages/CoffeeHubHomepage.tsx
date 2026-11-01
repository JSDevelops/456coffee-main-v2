import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Coffee,
  Sprout,
  GraduationCap,
  MapPin,
  Clock,
  ChevronRight,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Calendar,
  Users,
  ExternalLink,
  Phone,
  ArrowRight,
  Sparkles,
  Info,
  Navigation,
  Copy,
  Check,
  Bot,
  Smartphone,
  Monitor,
  ShieldCheck,
  Layers,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import './CoffeeHubHomepage.css';
import { fetchBranchesApi, PublicBranch } from '../api';

// Types
interface NewsItemData {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  imageUrl: string;
}

interface SubMenuItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string;
  isExternal?: boolean;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  items: SubMenuItem[];
}

export default function CoffeeHubHomepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>('ecosystem');
  const [copiedCoordinates, setCopiedCoordinates] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const dropdownTimeoutRef = useRef<any>(null);

  // Fallback branch list if offline
  const defaultBranches = [
    {
      id: 'main',
      name: '456 Coffee สาขาหลัก',
      englishName: '456 Coffee Flagship Store & Roastery',
      badge: 'ร้านจริง · สาขาหลัก',
      tagline: 'Flagship Cafe & Roastery',
      address: 'ตรงข้ามศูนย์ราชการจังหวัดกาฬสินธุ์ ถนนทางหลวง 213 ต.กาฬสินธุ์ อ.เมือง จ.กาฬสินธุ์ 46000',
      shortAddress: 'ตรงข้ามศูนย์ราชการจังหวัดกาฬสินธุ์ (ถ.ทางหลวง 213)',
      coordinates: '16.43444, 103.50428',
      latitude: 16.43444,
      longitude: 103.50428,
      hours: '08:30 - 16:30 น. (เปิดให้บริการทุกวัน)',
      phone: '061-305-5625',
      imageUrl: '/cafe-main.jpg',
      description: 'คาเฟ่เรือนไม้ 2 ชั้น บรรยากาศร่มรื่น โปร่งสบาย เสิร์ฟกาแฟโรบัสต้าภูพานคั่วสด เมนู Specialty Coffee, Slow bar บาริสต้ามืออาชีพ มีมุมทำงานพร้อม Wi-Fi และที่จอดรถสะดวกสบาย',
      googleMapsDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=16.43444,103.50428',
      googleMapsSearchUrl: 'https://maps.google.com/?q=16.43444,103.50428',
      embedMapUrl: 'https://maps.google.com/maps?q=16.43444,103.50428&hl=th&z=16&output=embed'
    },
    {
      id: 'otop',
      name: '456 Cafe - สาขา 2 (ศูนย์ OTOP)',
      englishName: '456 Cafe Kalasin OTOP Center',
      badge: 'สาขา 2 · ศูนย์ OTOP',
      tagline: 'Tourist Station & Souvenir Hub',
      address: 'ศูนย์โอท็อปจังหวัดกาฬสินธุ์ ศาลากลางกาฬสินธุ์ หลังเก่า อ.เมือง จ.กาฬสินธุ์',
      shortAddress: 'ศูนย์โอท็อปจังหวัดกาฬสินธุ์',
      coordinates: '16.434233, 103.507347',
      latitude: 16.434233,
      longitude: 103.507347,
      hours: '07:00 - 17:00 น. (เปิดให้บริการทุกวัน)',
      phone: '061-305-5625',
      imageUrl: '/cafe-main.jpg',
      description: 'จุดแวะพักนักท่องเที่ยวและผู้เดินทาง ของฝากกาแฟดริปแบ็ก & เมล็ดคั่วแท้โรบัสต้าภูพาน ศูนย์รวมผ้าไหมแพรวาและสินค้าชุมชน เสิร์ฟเครื่องดื่มรวดเร็วทันใจ',
      googleMapsDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=16.434233,103.507347',
      googleMapsSearchUrl: 'https://maps.google.com/?q=16.434233,103.507347',
      embedMapUrl: 'https://maps.google.com/maps?q=16.434233,103.507347&hl=th&z=16&output=embed'
    }
  ];

  const [branchesList, setBranchesList] = useState(defaultBranches);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);

  useEffect(() => {
    fetchBranchesApi().then((data) => {
      if (data && data.length > 0) {
        const formatted = data.map((b, idx) => {
          const lat = b.latitude || (idx === 0 ? 16.43444 : 16.434233);
          const lng = b.longitude || (idx === 0 ? 103.50428 : 103.507347);
          const coordsStr = `${lat}, ${lng}`;
          return {
            id: b.id,
            name: b.name,
            englishName: idx === 0 ? '456 Coffee Flagship Store & Roastery' : `456 Coffee Branch ${idx + 1}`,
            badge: idx === 0 ? 'ร้านจริง · สาขาหลัก' : `สาขา ${idx + 1}`,
            tagline: idx === 0 ? 'Flagship Cafe & Roastery' : 'Active Branch Station',
            address: b.address || b.location || 'อ.เมือง จ.กาฬสินธุ์',
            shortAddress: b.location || b.address || 'สาขาใน จ.กาฬสินธุ์',
            coordinates: coordsStr,
            latitude: lat,
            longitude: lng,
            hours: `${b.openTime || '07:00'} - ${b.closeTime || '17:00'} น. (${b.isOpen !== false ? 'เปิดให้บริการ' : 'ปิดชั่วคราว'})`,
            phone: b.phone || '061-305-5625',
            imageUrl: b.imageUrl && b.imageUrl.startsWith('http') ? b.imageUrl : '/cafe-main.jpg',
            description: idx === 0 
              ? 'คาเฟ่เรือนไม้ 2 ชั้น บรรยากาศร่มรื่น โปร่งสบาย เสิร์ฟกาแฟโรบัสต้าภูพานคั่วสด เมนู Specialty Coffee, Slow bar บาริสต้ามืออาชีพ มีมุมทำงานพร้อม Wi-Fi และที่จอดรถสะดวกสบาย'
              : 'สาขาให้บริการเครื่องดื่มคุณภาพ เมล็ดกาแฟโรบัสต้าภูพานคั่วสด ชงเสิร์ฟรวดเร็ว พร้อมบริการ Takeaway และเดลิเวอรี',
            googleMapsDirectionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
            googleMapsSearchUrl: `https://maps.google.com/?q=${lat},${lng}`,
            embedMapUrl: `https://maps.google.com/maps?q=${lat},${lng}&hl=th&z=16&output=embed`
          };
        });
        setBranchesList(formatted);
      }
    }).catch((e) => console.warn('Could not load live branches:', e));
  }, []);

  const realStore = branchesList[selectedBranchIndex] || defaultBranches[0];

  const copyCoordinates = () => {
    navigator.clipboard.writeText(realStore.coordinates);
    setCopiedCoordinates(true);
    setTimeout(() => setCopiedCoordinates(false), 2500);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.ch-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Dropdown hover handling with buffer delay
  const handleDropdownEnter = (id: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(id);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  // Categorized Navigation Submenus
  const navCategories: NavCategory[] = [
    {
      id: 'about',
      label: 'เกี่ยวกับเรา',
      icon: Compass,
      items: [
        {
          title: 'เรื่องราวกาแฟภูพาน',
          description: 'อัตลักษณ์กาแฟโรบัสต้าบนเทือกเขาภูพาน จ.กาฬสินธุ์',
          href: '#story-origin',
          icon: Coffee
        },
        {
          title: 'วิสัยทัศน์ระบบนิเวศ 456',
          description: 'เชื่อมโยงต้นน้ำ กลางน้ำ ปลายน้ำ เพื่อชุมชนที่ยั่งยืน',
          href: '#ecosystem-pillars',
          icon: Layers
        },
        {
          title: 'ข่าวสาร & กิจกรรม',
          description: 'อัปเดตผลผลิตชุมชน เทคนิคการปลูก และงานอบรม',
          href: '#ch-news-section',
          icon: Calendar
        }
      ]
    },
    {
      id: 'ecosystem',
      label: 'ระบบนิเวศ 3 เสาหลัก',
      icon: Layers,
      items: [
        {
          title: 'ต้นน้ำ · แหล่งปลูก & จองต้นพันธุ์',
          description: 'แปลงปลูกกาแฟคุณภาพสูงบนภูพาน พร้อมระบบจองต้นกล้าพันธุ์แท้',
          href: '#pathway-plantation',
          icon: Sprout,
          badge: 'ต้นน้ำ'
        },
        {
          title: 'กลางน้ำ · Coffee Academy',
          description: 'สถาบันอบรมบาริสต้า เทคนิคการคั่ว และการบริหารจัดการร้านกาแฟ',
          href: '#pathway-academy',
          icon: GraduationCap,
          badge: 'กลางน้ำ'
        },
        {
          title: 'ปลายน้ำ · คาเฟ่ 456 Coffee',
          description: 'สาขาหลักกาฬสินธุ์ และเครือข่ายร้านกาแฟ Specialty ในชุมชน',
          href: '#ch-network-map',
          icon: Coffee,
          badge: 'ปลายน้ำ'
        }
      ]
    },
    {
      id: 'tech',
      label: 'เทคโนโลยี & AI',
      icon: Bot,
      items: [
        {
          title: 'AI Studio กาแฟภูพาน',
          description: 'ระบบ AI อัจฉริยะวิเคราะห์สายพันธุ์และแนะนำการเพาะปลูก',
          href: 'https://coffee-phupan.ai.studio/',
          icon: Sparkles,
          badge: 'AI Studio',
          isExternal: true
        },
        {
          title: 'แอปสั่งซื้อลูกค้าออนไลน์',
          description: 'สั่งกาแฟล่วงหน้า สะสมแต้ม ไม่ต้องรอคิว (order.coffee-cafe.shop)',
          href: 'https://order.coffee-cafe.shop',
          icon: Smartphone,
          badge: 'LIFF App',
          isExternal: true
        },
        {
          title: 'ระบบแคชเชียร์สาขา (Branch POS)',
          description: 'ระบบขายหน้าร้าน จอสองฝั่ง พร้อมเชื่อมต่อออเดอร์ทันที',
          href: 'https://pos.coffee-cafe.shop',
          icon: Monitor,
          isExternal: true
        },
        {
          title: 'ระบบบริหารหลังบ้าน (HQ Admin)',
          description: 'ศูนย์กลางควบคุมสต็อก วัตถุดิบ บัญชี และวิเคราะห์ยอดขาย',
          href: 'https://456.coffee-cafe.shop',
          icon: ShieldCheck,
          isExternal: true
        }
      ]
    },
    {
      id: 'contact',
      label: 'ติดต่อ & เครือข่าย',
      icon: MapPin,
      items: [
        {
          title: 'แผนที่ & ตำแหน่งสาขาหลัก',
          description: 'ตรงข้ามศูนย์ราชการจังหวัดกาฬสินธุ์ พร้อมระบบนำทาง',
          href: '#ch-network-map',
          icon: MapPin
        },
        {
          title: 'สมัครร่วมเครือข่าย 456',
          description: 'สำหรับร้านกาแฟ เกษตรกรผู้ปลูก และผู้สนใจเปิดร้าน',
          href: '#join-network',
          icon: Users,
          badge: 'ยินดีต้อนรับ'
        },
        {
          title: 'โทรสอบถาม 061-305-5625',
          description: 'สายด่วนติดต่อทีมงาน 456 Coffee ประจำสาขาหลัก',
          href: 'tel:0613055625',
          icon: Phone
        }
      ]
    }
  ];

  // News items
  const newsList: NewsItemData[] = [
    {
      id: 'news-1',
      title: 'ฤดูกาลเก็บเกี่ยวกาแฟโรบัสต้าภูพาน กาฬสินธุ์',
      summary: 'ผลผลิตเชอรี่สุกเต็มที่ เกษตรกรส่งมอบเข้าสู่กระบวนการแปรรูปคุณภาพสูง',
      date: '12 พ.ย. 2567',
      category: 'ผลผลิตชุมชน',
      imageUrl: 'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'news-2',
      title: 'เปิดอบรมบาริสต้ารุ่นใหม่ โดย 456 Coffee Academy',
      summary: 'เรียนรู้ทักษะการสกัดกาแฟ การสตีมนม และการจัดการหน้าร้านอย่างมืออาชีพ',
      date: '28 ต.ค. 2567',
      category: 'การศึกษา & อาชีพ',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'news-3',
      title: 'เปิดตัวระบบ AI Studio วิเคราะห์สายพันธุ์กาแฟภูพาน',
      summary: 'นวัตกรรมดิจิทัลช่วยเกษตรกรยกระดับคุณภาพผลผลิตสู่มาตรฐานสากล',
      date: '15 ต.ค. 2567',
      category: 'นวัตกรรม AI',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop',
    },
  ];

  return (
    <div className="ch-page-wrapper selection:bg-orange-600 selection:text-white">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. TOP NAVIGATION WITH CATEGORIZED SUBMENUS */}
      {/* ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#120803]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <a
            href="/"
            className="flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl p-1"
            aria-label="456COFFEE CAFE หน้าแรก"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EA580C] via-[#C2410C] to-[#9A3412] flex items-center justify-center shadow-lg shadow-orange-950/40 group-hover:scale-105 transition-transform border border-orange-400/30">
              <Coffee className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl tracking-tight text-white group-hover:text-orange-400 transition-colors">
                  456COFFEE <span className="text-[#EA580C]">CAFE</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-orange-400 border border-orange-500/40 rounded-md bg-orange-600/15">
                  HUB
                </span>
              </div>
              <span className="text-[11px] text-[#A68A78] font-medium tracking-wide">
                ระบบนิเวศกาแฟโรบัสต้าภูพาน
              </span>
            </div>
          </a>

          {/* Desktop Submenu Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
            <a
              href="/"
              className="px-3.5 py-2 rounded-xl text-white font-semibold hover:bg-white/5 transition-colors"
            >
              หน้าแรก
            </a>

            {/* Categorized Dropdown Items */}
            {navCategories.map((cat) => {
              const isOpen = openDropdown === cat.id;
              const IconComponent = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="relative ch-dropdown-container"
                  onMouseEnter={() => handleDropdownEnter(cat.id)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isOpen
                        ? 'text-orange-400 bg-white/10'
                        : 'text-[#C5B3A1] hover:text-white hover:bg-white/5'
                    }`}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                  >
                    <span>{cat.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-orange-400' : 'text-[#8A7969]'
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Panel */}
                  {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 rounded-2xl ch-dropdown-menu p-3 z-50 animate-fadeIn">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400/90 px-3 py-1.5 flex items-center gap-1.5 border-b border-white/5 mb-1.5">
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>หมวดหมู่: {cat.label}</span>
                      </div>

                      <div className="space-y-1">
                        {cat.items.map((item, idx) => {
                          const ItemIcon = item.icon;
                          const isModalTrigger = item.href.startsWith('#join-network');

                          if (isModalTrigger) {
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setOpenDropdown(null);
                                  setJoinModalOpen(true);
                                }}
                                className="w-full text-left p-2.5 rounded-xl ch-sub-item flex items-start gap-3 group/sub"
                              >
                                <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 group-hover/sub:bg-orange-600 group-hover/sub:text-white transition-colors">
                                  <ItemIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold text-sm group-hover/sub:text-orange-300 transition-colors">
                                      {item.title}
                                    </span>
                                    {item.badge && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#9B8C7E] mt-0.5 line-clamp-1">
                                    {item.description}
                                  </p>
                                </div>
                              </button>
                            );
                          }

                          return (
                            <a
                              key={idx}
                              href={item.href}
                              target={item.isExternal ? '_blank' : undefined}
                              rel={item.isExternal ? 'noopener noreferrer' : undefined}
                              onClick={() => setOpenDropdown(null)}
                              className="p-2.5 rounded-xl ch-sub-item flex items-start gap-3 group/sub"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/5 text-[#D8C7B6] flex items-center justify-center shrink-0 mt-0.5 group-hover/sub:bg-orange-600 group-hover/sub:text-white transition-colors">
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-semibold text-sm group-hover/sub:text-orange-300 transition-colors">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.isExternal && (
                                    <ArrowUpRight className="w-3.5 h-3.5 text-[#8A7969] group-hover/sub:text-white transition-colors ml-auto" />
                                  )}
                                </div>
                                <p className="text-xs text-[#9B8C7E] mt-0.5 line-clamp-1">
                                  {item.description}
                                </p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://coffee-phupan.ai.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full text-xs font-bold text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 hover:text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/60 transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Studio กาแฟภูพาน</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#F97316] hover:to-[#EA580C] shadow-md shadow-orange-900/30 transition-all transform active:scale-95"
            >
              ร่วมเครือข่าย / เข้าสู่ระบบ
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/90 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer with Accordion Submenus */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10 bg-[#160B05] px-3 space-y-2 animate-fadeIn max-h-[85vh] overflow-y-auto">
            <a
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-semibold text-white bg-white/10 text-base"
            >
              หน้าแรก
            </a>

            {/* Mobile Accordion Categories */}
            {navCategories.map((cat) => {
              const isExpanded = mobileExpandedCat === cat.id;
              const CatIcon = cat.icon;
              return (
                <div key={cat.id} className="rounded-xl border border-white/5 overflow-hidden bg-white/[0.02]">
                  <button
                    onClick={() => setMobileExpandedCat(isExpanded ? null : cat.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-white/90 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <CatIcon className="w-4 h-4 text-orange-400" />
                      <span>{cat.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-orange-400' : 'text-[#8A7969]'
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1 bg-black/20 border-t border-white/5">
                      {cat.items.map((sub, sIdx) => {
                        const SubIcon = sub.icon;
                        if (sub.href.startsWith('#join-network')) {
                          return (
                            <button
                              key={sIdx}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setJoinModalOpen(true);
                              }}
                              className="w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between text-[#D8C7B6] hover:bg-white/5"
                            >
                              <span className="flex items-center gap-2">
                                <SubIcon className="w-3.5 h-3.5 text-orange-400" />
                                {sub.title}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                            </button>
                          );
                        }
                        return (
                          <a
                            key={sIdx}
                            href={sub.href}
                            target={sub.isExternal ? '_blank' : undefined}
                            rel={sub.isExternal ? 'noopener noreferrer' : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-lg text-xs text-[#D8C7B6] hover:bg-white/5"
                          >
                            <span className="flex items-center gap-2">
                              <SubIcon className="w-3.5 h-3.5 text-orange-400" />
                              {sub.title}
                            </span>
                            {sub.isExternal ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                            )}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2 space-y-2">
              <a
                href="https://coffee-phupan.ai.studio/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                เข้าใช้งาน AI Studio กาแฟภูพาน
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setJoinModalOpen(true);
                }}
                className="w-full py-3 rounded-xl font-bold text-center text-white bg-gradient-to-r from-[#EA580C] to-[#C2410C] shadow-lg"
              >
                ร่วมเครือข่าย / เข้าสู่ระบบ
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION - CLEAN, VIBRANT, INSPIRING */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-16 sm:pb-20 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Origin Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-600/20 via-orange-600/10 to-transparent border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>ระบบนิเวศกาแฟโรบัสต้าภูพาน • Kalasin Origin</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                456COFFEE <span className="ch-hero-gradient-text">CAFE</span>
              </h1>
              <p className="text-lg sm:text-xl text-[#E8D8C8] font-semibold leading-relaxed">
                จากยอดภูพาน สู่คาเฟ่มาตรฐานสากล ขับเคลื่อนด้วยเทคโนโลยี AI
              </p>
            </div>

            {/* Uncluttered Narrative Paragraph */}
            <p className="text-sm sm:text-base text-[#B8A796] leading-relaxed max-w-2xl font-normal">
              เชื่อมโยงเกษตรกรแปลงปลูก สถาบันอบรมบาริสต้ามืออาชีพ และเครือข่ายร้านกาแฟ 456 Coffee 
              ด้วยการวิเคราะห์สายพันธุ์และเทคนิคการเพาะปลูกอัจฉริยะ เพื่อสร้างคุณค่าและรสชาติกาแฟไทยที่ยั่งยืน
            </p>

            {/* Direct Dual CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a
                href="#ecosystem-pillars"
                className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#F97316] hover:to-[#EA580C] shadow-lg shadow-orange-950/50 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <span>สำรวจ 3 เสาหลัก</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <a
                href="https://coffee-phupan.ai.studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 rounded-xl font-bold text-sm text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 hover:border-emerald-400 hover:text-emerald-200 transition-all flex items-center gap-2 shadow-sm hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>เปิดใช้งาน AI Studio</span>
                <ArrowUpRight className="w-4 h-4 opacity-80" />
              </a>
            </div>

            {/* 4 Clean Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="ch-stat-pill p-3 rounded-xl">
                <div className="text-lg sm:text-xl font-black text-white">1,200+</div>
                <div className="text-[11px] text-[#A68A78] font-medium">ไร่แปลงปลูกภูพาน</div>
              </div>
              <div className="ch-stat-pill p-3 rounded-xl">
                <div className="text-lg sm:text-xl font-black text-emerald-400">100%</div>
                <div className="text-[11px] text-[#A68A78] font-medium">โรบัสต้าคั่วสดแท้</div>
              </div>
              <div className="ch-stat-pill p-3 rounded-xl">
                <div className="text-lg sm:text-xl font-black text-amber-400">1 สถาบัน</div>
                <div className="text-[11px] text-[#A68A78] font-medium">Academy อบรมคาเฟ่</div>
              </div>
              <div className="ch-stat-pill p-3 rounded-xl">
                <div className="text-lg sm:text-xl font-black text-orange-400">AI Model</div>
                <div className="text-[11px] text-[#A68A78] font-medium">วิเคราะห์เพาะปลูก</div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md lg:max-w-none aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl shadow-black/80 group">
              <img
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop"
                alt="เมล็ดกาแฟและผลกาแฟเชอรี่สุกบนกิ่งธรรมชาติ"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120904]/90 via-[#120904]/30 to-transparent pointer-events-none" />
              
              {/* Badge overlay on Hero image */}
              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-[#1A0E07]/85 backdrop-blur-md border border-white/15 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Robusta Phu Phan
                  </div>
                  <div className="text-white text-sm font-bold">
                    กาแฟอัตลักษณ์เทือกเขาภูพาน กาฬสินธุ์
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <Coffee className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. THREE CORE PILLARS OF ECOSYSTEM (สะอาด ชัดเจน ไม่ซับซ้อน) */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="ecosystem-pillars" className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <div className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> 3 เสาหลัก 456 COFFEE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            ระบบนิเวศกาแฟครบวงจร
          </h2>
          <p className="text-sm text-[#A89887]">
            เชื่อมโยงกระบวนการผลิตตั้งแต่แปลงปลูกสู่ถ้วยกาแฟคุณภาพ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Pillar 1: ต้นน้ำ · แหล่งปลูก */}
          <div
            id="pathway-plantation"
            className="ch-card ch-pathway-plantation p-6 rounded-2xl flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <Sprout className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  ต้นน้ำ (Origin)
                </div>
                <h3 className="text-xl font-bold text-white">
                  แหล่งปลูก & พันธุ์กาแฟ
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#B7D2BF] leading-relaxed">
                พื้นที่ปลูกกาแฟโรบัสต้าบนแนวเทือกเขาภูพาน กาฬสินธุ์ ดินอุดมสมบูรณ์และสภาพอากาศจำเพาะ ส่งเสริมเกษตรกรด้วยต้นกล้าสายพันธุ์ดี
              </p>
            </div>
            
            <button
              onClick={() => setJoinModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>สั่งจองต้นกล้ากาแฟ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pillar 2: กลางน้ำ · Coffee Academy */}
          <div
            id="pathway-academy"
            className="ch-card ch-pathway-academy p-6 rounded-2xl flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  กลางน้ำ (Academy)
                </div>
                <h3 className="text-xl font-bold text-white">
                  456 Coffee Academy
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#DFCEA7] leading-relaxed">
                สถาบันพัฒนาทักษะบาริสต้า เทคนิคการสกัด การคั่ว Cupping และการบริหารต้นทุนร้านกาแฟอย่างมืออาชีพ เพื่อสร้างอาชีพที่มั่นคง
              </p>
            </div>
            
            <button
              onClick={() => setJoinModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>ลงทะเบียนหลักสูตรอบรม</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pillar 3: ปลายน้ำ · ร้านคาเฟ่ 456 Coffee */}
          <div
            id="pathway-cafe"
            className="ch-card ch-pathway-cafe p-6 rounded-2xl flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center">
                <Coffee className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                  ปลายน้ำ (Cafe)
                </div>
                <h3 className="text-xl font-bold text-white">
                  ร้าน 456 Coffee & สาขา
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#D7C2B2] leading-relaxed">
                คาเฟ่เรือนไม้ 2 ชั้น สาขาหลัก อ.เมือง จ.กาฬสินธุ์ บรรยากาศร่มรื่น เสิร์ฟเมนูกาแฟโรบัสต้าคั่วสดและ Specialty Coffee หลากหลาย
              </p>
            </div>
            
            <a
              href="#ch-network-map"
              className="w-full py-2.5 rounded-xl bg-orange-600/30 hover:bg-orange-600 border border-orange-500/40 text-orange-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>ดูตำแหน่งสาขา & แผนที่</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </section>



      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. STORE LOCATION & INTERACTIVE MAP (ข้อมูลจริง สบายตา) */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="ch-network-map" className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
        <div className="ch-card p-6 sm:p-8 space-y-6">
          
          {/* Header & Branch Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-400" /> แผนที่และที่ตั้งร้านค้า
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                สาขา 456 Coffee ในจังหวัดกาฬสินธุ์
              </h2>
            </div>

            {/* Branch Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {branchesList.map((branch, index) => (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranchIndex(index)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedBranchIndex === index
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40'
                      : 'bg-white/5 text-[#A68A78] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {branch.name}
                </button>
              ))}
            </div>
          </div>

          {/* Branch Details & Embedded Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Detail Panel */}
            <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-orange-600/20 text-orange-400 border border-orange-500/30">
                    {realStore.badge}
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {realStore.name}
                  </h3>
                  <p className="text-xs text-[#A68A78]">
                    {realStore.englishName}
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-[#C8B8A6] pt-1">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span>{realStore.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{realStore.hours}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{realStore.phone}</span>
                  </div>
                </div>

                <p className="text-xs text-[#9B8C7E] leading-relaxed pt-2 border-t border-white/5">
                  {realStore.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <a
                    href={realStore.googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-xs text-white text-center flex items-center justify-center gap-2 shadow-md shadow-orange-950/40 transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>นำทางด้วย Google Maps</span>
                  </a>

                  <button
                    onClick={copyCoordinates}
                    className="py-3 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="คัดลอกพิกัด GPS"
                  >
                    {copiedCoordinates ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCoordinates ? 'คัดลอกแล้ว' : 'พิกัด GPS'}</span>
                  </button>
                </div>

                <a
                  href={`tel:${realStore.phone.replace(/[^0-9]/g, '')}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#C8B8A6] hover:text-white font-medium text-xs text-center flex items-center justify-center gap-2 transition-colors border border-white/5"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-400" />
                  <span>โทรสอบถามหน้าร้าน: {realStore.phone}</span>
                </a>
              </div>

            </div>

            {/* Right Map Embed */}
            <div className="lg:col-span-7 h-72 sm:h-96 rounded-2xl overflow-hidden border border-white/10 ch-map-frame">
              <iframe
                title={`แผนที่ ${realStore.name}`}
                src={realStore.embedMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. LATEST STORIES & COMMUNITY NEWS */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="ch-news-section" className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> ข่าวสารและเรื่องราวชุมชน
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              อัปเดตความเคลื่อนไหวกาแฟภูพาน
            </h2>
          </div>
          <span className="text-xs text-[#8A7969]">
            บทความ เทคนิค และกิจกรรมล่าสุด
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {newsList.map((item) => (
            <div
              key={item.id}
              className="ch-card overflow-hidden rounded-2xl group flex flex-col justify-between"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#140A04]/80 text-orange-300 border border-white/10 backdrop-blur-md">
                  {item.category}
                </span>
              </div>
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[#8A7969]">{item.date}</div>
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#9B8C7E] line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. JOIN NETWORK CALL TO ACTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="join-network" className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-orange-950/60 via-[#1C0F08] to-[#120803] border border-orange-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ร่วมเป็นส่วนหนึ่งของเครือข่าย 456COFFEE CAFE
            </h2>
            <p className="text-xs sm:text-sm text-[#C8B8A6] max-w-xl">
              ยินดีต้อนรับเจ้าของร้านกาแฟ เกษตรกรผู้ปลูกกาแฟ และผู้สนใจเริ่มต้นธุรกิจร้านกาแฟทั่วประเทศ
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Users className="w-4 h-4" />
              <span>เข้าร่วมเครือข่ายทันที</span>
            </button>

            <a
              href="tel:0613055625"
              className="px-5 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-orange-400" />
              <span>061-305-5625</span>
            </a>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. FOOTER - STRUCTURED ACCORDING TO SUBMENUS */}
      {/* ────────────────────────────────────────────────────────── */}
      <footer id="ch-footer-section" className="bg-[#0A0402] border-t border-white/10 pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-[#A89887]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-black text-lg text-white">
                      456COFFEE <span className="text-[#EA580C]">CAFE</span>
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold text-orange-400 border border-orange-500/40 rounded bg-orange-600/10">
                      HUB
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A7969]">ระบบนิเวศกาแฟโรบัสต้าภูพาน</p>
                </div>
              </div>
              <p className="text-xs text-[#9B8C7E] leading-relaxed max-w-sm">
                เชื่อมโยงเกษตรกรแปลงปลูก สถาบันอบรม และคาเฟ่คุณภาพ เพื่อยกระดับกาแฟไทยอย่างยั่งยืน
              </p>
              <div className="text-xs text-[#8A7969] space-y-1 pt-1">
                <div>สำนักงานใหญ่ & สาขาหลัก: อ.เมือง จ.กาฬสินธุ์</div>
                <div>โทรศัพท์: 061-305-5625</div>
              </div>
            </div>

            {/* Col 2: เกี่ยวกับเรา */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                เกี่ยวกับเรา
              </h4>
              <ul className="space-y-2 text-xs text-[#C5B3A1]">
                <li><a href="#story-origin" className="hover:text-orange-400 transition-colors">เรื่องราวกาแฟภูพาน</a></li>
                <li><a href="#ecosystem-pillars" className="hover:text-orange-400 transition-colors">วิสัยทัศน์ 456</a></li>
                <li><a href="#ch-news-section" className="hover:text-orange-400 transition-colors">ข่าวสาร & กิจกรรม</a></li>
                <li><a href="/js-develop" className="hover:text-orange-400 transition-colors text-orange-400">ระบบเดิม (JS DEVELOP)</a></li>
              </ul>
            </div>

            {/* Col 3: 3 เสาหลัก */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                ระบบนิเวศ 3 เสาหลัก
              </h4>
              <ul className="space-y-2 text-xs text-[#C5B3A1]">
                <li><a href="#pathway-plantation" className="hover:text-emerald-400 transition-colors">🌿 แปลงปลูก & ต้นพันธุ์</a></li>
                <li><a href="#pathway-academy" className="hover:text-amber-400 transition-colors">🎓 456 Coffee Academy</a></li>
                <li><a href="#ch-network-map" className="hover:text-orange-400 transition-colors">☕ คาเฟ่ 456 Coffee</a></li>
                <li><a href="#ch-network-map" className="hover:text-white transition-colors">🗺️ แผนที่ร้านค้าสาขา</a></li>
              </ul>
            </div>

            {/* Col 4: แพลตฟอร์มดิจิทัล & AI */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                เทคโนโลยีดิจิทัล & AI
              </h4>
              <ul className="space-y-2 text-xs text-[#C5B3A1]">
                <li>
                  <a
                    href="https://coffee-phupan.ai.studio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-300 text-emerald-400 font-semibold transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Studio กาแฟภูพาน
                  </a>
                </li>
                <li>
                  <a href="https://order.coffee-cafe.shop" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    แอปสั่งซื้อลูกค้า (LIFF)
                  </a>
                </li>
                <li>
                  <a href="https://pos.coffee-cafe.shop" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    ระบบขายหน้าร้าน (Branch POS)
                  </a>
                </li>
                <li>
                  <a href="https://456.coffee-cafe.shop" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    ระบบหลังบ้าน (HQ Admin)
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A7969]">
            <p>© {new Date().getFullYear()} 456COFFEE CAFE / 456 COFFEE HUB. สงวนลิขสิทธิ์ทุกประการ.</p>
            <p>Good Coffee · Better People · Stronger Communities</p>
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
                เข้าร่วมเครือข่าย 456COFFEE CAFE
              </h3>
              <p className="text-xs text-[#C8B8A6]">
                ยินดีต้อนรับเจ้าของร้านกาแฟ เกษตรกรผู้ปลูกกาแฟ และผู้สนใจพัฒนาทักษะบาริสต้า
              </p>
            </div>

            <div className="space-y-3 pt-2 text-sm">
              <a
                href="https://coffee-phupan.ai.studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 font-semibold text-center flex items-center justify-center gap-2 text-white shadow-lg shadow-emerald-950/40"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" /> เข้าสู่ระบบ AI Studio กาแฟภูพาน
              </a>

              <a
                href="tel:0613055625"
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 font-semibold text-center flex items-center justify-center gap-2 text-white shadow-lg shadow-orange-950/40"
              >
                <Phone className="w-4 h-4" /> โทร 061-305-5625
              </a>

              <a
                href="/js-develop#academy"
                onClick={() => setJoinModalOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 font-semibold text-center flex items-center justify-center gap-2 text-white"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" /> ลงทะเบียน 456 Academy
              </a>

              <a
                href="/js-develop#plantations"
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

    </div>
  );
}
