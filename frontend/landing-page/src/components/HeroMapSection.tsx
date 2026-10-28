import React, { useState, useEffect } from 'react';
import { Coffee, Sprout, GraduationCap, MapPin, Phone, Clock, ExternalLink, Sparkles, Navigation, Layers, ChevronRight, CheckCircle2 } from 'lucide-react';
import { fetchLocationsApi } from '../api';

export type PinType = 'all' | 'cafe' | 'plantation' | 'academy';

export interface LocationItem {
  id: string;
  type: 'cafe' | 'plantation' | 'academy';
  name: string;
  badge: string;
  district: string;
  province: string;
  coords: { x: number; y: number }; // percentage position on map canvas
  hoursOrCapacity: string;
  phone?: string;
  details: string;
  stats?: string;
  actionText: string;
  actionHref: string;
}

export function HeroMapSection() {
  const [filter, setFilter] = useState<PinType>('all');
  const [selectedPin, setSelectedPin] = useState<LocationItem | null>(null);
  const [dynamicLocations, setDynamicLocations] = useState<LocationItem[]>([]);

  const locations: LocationItem[] = [
    // 1. Cafes
    {
      id: 'c1',
      type: 'cafe',
      name: '456 Coffee สาขาหลัก เมืองกาฬสินธุ์',
      badge: 'Flagship Cafe & Roastery',
      district: 'อ.เมือง',
      province: 'จ.กาฬสินธุ์',
      coords: { x: 48, y: 52 },
      hoursOrCapacity: '08:30 - 16:30 น. (เปิดทุกวัน)',
      phone: '061-305-5625',
      details: 'บาร์กาแฟสดโรบัสต้าภูพาน มี Slow Bar คั่วสด มีพื้นที่นั่งทำงาน และจำหน่ายเมล็ดกาแฟ',
      stats: 'ยอดนิยม 2,500+ แก้ว/เดือน',
      actionText: 'ดูข้อมูลร้าน & โทรสั่ง',
      actionHref: '#cafes',
    },
    {
      id: 'c2',
      type: 'cafe',
      name: '456 Coffee สาขา ศูนย์ OTOP กาฬสินธุ์',
      badge: 'Tourist & Gift Station',
      district: 'อ.เมือง',
      province: 'จ.กาฬสินธุ์',
      coords: { x: 44, y: 58 },
      hoursOrCapacity: '07:00 - 17:00 น. (เปิดทุกวัน)',
      phone: '061-305-5625',
      details: 'จุดแวะพักนักท่องเที่ยว ของฝากกาแฟภูพาน ขนมเบเกอรี่ และผลิตภัณฑ์ผ้าไหมแพรวา',
      stats: 'บริการรวดเร็ว Takeaway',
      actionText: 'ดูข้อมูลสาขา',
      actionHref: '#cafes',
    },
    {
      id: 'c3',
      type: 'cafe',
      name: '456 Cafe สาขา พาร์ทเนอร์สมเด็จ',
      badge: 'Phu Phan Mountain Gate',
      district: 'อ.สมเด็จ',
      province: 'จ.กาฬสินธุ์',
      coords: { x: 62, y: 40 },
      hoursOrCapacity: '08:00 - 17:00 น.',
      phone: '061-305-5625',
      details: 'คาเฟ่บรรยากาศเชิงเขาภูพาน เสิร์ฟกาแฟสดจากแปลงปลูกใกล้เคียง',
      stats: 'จุดชมวิวเชิงเขา',
      actionText: 'ดูข้อมูลสาขา',
      actionHref: '#cafes',
    },

    // 2. Plantations
    {
      id: 'p1',
      type: 'plantation',
      name: 'แปลงต้นแบบโรบัสต้า เทือกเขาภูพาน',
      badge: 'Certified Model Farm',
      district: 'อ.สมเด็จ',
      province: 'จ.กาฬสินธุ์',
      coords: { x: 68, y: 34 },
      hoursOrCapacity: 'เนื้อที่ 30 ไร่ (6,000 ต้น)',
      details: 'แปลงปลูกระดับความสูงธรรมชาติ ดินภูเขาแร่ธาตุสูง คัดเก็บผลสุก Hand Picked 100%',
      stats: 'ผลผลิต 12+ ตัน/ปี',
      actionText: 'จองต้นพันธุ์จากแปลงนี้',
      actionHref: '#plantations',
    },
    {
      id: 'p2',
      type: 'plantation',
      name: 'ศูนย์เพาะชำต้นกล้าพันธุ์แท้ 456',
      badge: 'Sapling Nursery Hub',
      district: 'อ.เมือง',
      province: 'จ.กาฬสินธุ์',
      coords: { x: 53, y: 64 },
      hoursOrCapacity: 'พร้อมส่งมอบ 15,000+ ต้นกล้า',
      details: 'เพาะขยายพันธุ์โรบัสต้าภูพานแท้ แข็งแรง ทนแล้ง ต้านทานโรค เหมาะกับดินอีสาน',
      stats: 'ประกันราคารับซื้อผลผลิต',
      actionText: 'จองต้นพันธุ์ทันที',
      actionHref: '#plantations',
    },
    {
      id: 'p3',
      type: 'plantation',
      name: 'แปลงเครือข่ายเกษตรกร อ.ห้วยผึ้ง',
      badge: 'Network Partner Farm',
      district: 'อ.ห้วยผึ้ง',
      province: 'จ.กาฬสินธุ์',
      coords: { x: 74, y: 48 },
      hoursOrCapacity: 'เนื้อที่ 18 ไร่ (3,500 ต้น)',
      details: 'แปลงเกษตรกรในโครงการความร่วมมือ ปลูกแบบปลอดภัย ไร้สารเคมีตกค้าง',
      stats: 'สมาชิกเครือข่ายภูพาน',
      actionText: 'ดูโครงการเครือข่าย',
      actionHref: '#plantations',
    },

    // 3. Academy
    {
      id: 'a1',
      type: 'academy',
      name: '456 Coffee Academy & Barista School',
      badge: 'Main Training Campus',
      district: 'อ.เมือง',
      province: 'จ.กาฬสินธุ์',
      coords: { x: 42, y: 45 },
      hoursOrCapacity: 'รองรับรุ่นละ 8 - 12 ท่าน',
      phone: '061-305-5625',
      details: 'ศูนย์อบรมหลักสูตรบาริสต้ามืออาชีพ และการบริหารจัดการร้านคาเฟ่ครบวงจร พร้อมห้องแล็บเครื่องชงและอุปกรณ์จริง',
      stats: 'ผู้สำเร็จการศึกษา 150+ คน',
      actionText: 'ลงทะเบียนเรียนเปิดร้าน',
      actionHref: '#academy',
    },
  ];

  useEffect(() => {
    fetchLocationsApi()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // Normalize API pins
          const dynamicPins: LocationItem[] = res.data.map((item: any, idx: number) => ({
            id: item.id || `dyn-${idx}`,
            type: (item.type?.toLowerCase() === 'cafe' ? 'cafe' : item.type?.toLowerCase() === 'plantation' ? 'plantation' : 'academy') as any,
            name: item.name,
            badge: item.badge || (item.type === 'CAFE' ? 'Cafe Branch' : item.type === 'PLANTATION' ? 'เครือข่ายภูพาน' : 'Academy Hub'),
            district: item.district || 'อ.เมือง',
            province: item.province || 'จ.กาฬสินธุ์',
            // Default coords if needed
            coords: {
              x: 35 + ((idx * 17) % 50),
              y: 30 + ((idx * 23) % 45),
            },
            hoursOrCapacity: item.hoursOrCapacity || 'เปิดบริการ',
            phone: item.phone,
            details: item.details || item.name,
            stats: item.stats,
            actionText: item.actionText || 'ดูข้อมูล',
            actionHref: item.actionHref || '#map',
          }));
          setDynamicLocations(dynamicPins);
        }
      })
      .catch((err) => {
        console.warn('Using default locations:', err);
      });
  }, []);

  const activeLocationsList = dynamicLocations.length > 0 ? dynamicLocations : locations;

  const filteredLocations = filter === 'all' 
    ? activeLocationsList 
    : activeLocationsList.filter(l => l.type === filter);

  // Set default selected pin
  const currentSelected = selectedPin || activeLocationsList[0];

  return (
    <section id="map" className="relative pt-28 pb-20 md:pt-36 md:pb-28 bg-[#231205] text-white overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#EA580C]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-[#FDE047] shadow-lg">
            <Sparkles size={14} className="text-[#EA580C]" />
            <span>456 Coffee Ecosystem Location Map</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight leading-tight">
            แผนที่ปักหมุด <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#F59E0B] to-[#FDE047]">
              คาเฟ่ • แปลงปลูก • Academy
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#DDB892] max-w-2xl mx-auto">
            เชื่อมโยงทุกจุดสัมผัสของวงการกาแฟ: แวะจิบกาแฟที่สาขาคาเฟ่, จองต้นพันธุ์ปักหมุดแปลงปลูก 
            หรือมาเรียนหลักสูตรบาริสต้าเพื่อเปิดร้านกาแฟของตัวเอง
          </p>

          {/* 3 Interactive Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2.5 pt-3">
            {[
              { id: 'all', label: 'ทั้งหมด (7 จุดปักหมุด)', icon: Layers, color: 'bg-white/10 hover:bg-white/20' },
              { id: 'cafe', label: '☕ ร้านค้าคาเฟ่', icon: Coffee, color: 'bg-[#EA580C]/20 text-[#F97316] border-[#EA580C]/40' },
              { id: 'plantation', label: '🌿 พื้นที่แปลงปลูก', icon: Sprout, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
              { id: 'academy', label: '🎓 456 Academy', icon: GraduationCap, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setFilter(tab.id as PinType);
                    const match = tab.id === 'all' 
                      ? locations[0] 
                      : locations.find(l => l.type === tab.id);
                    if (match) setSelectedPin(match);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#EA580C] to-[#C86432] text-white border-transparent shadow-lg scale-105'
                      : 'bg-[#2D1B10]/90 text-[#DDB892] border-white/10 hover:border-white/30'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Canvas + Selected Pin Details Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Interactive Visual Map Stage (7 cols) */}
          <div className="lg:col-span-7 bg-[#1A0C04] rounded-3xl border border-[#DDB892]/20 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            
            {/* Top Bar on Map */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2 text-[#DDB892]">
                <MapPin size={15} className="text-[#EA580C]" />
                <span className="font-semibold text-white">พื้นที่โซนเทือกเขาภูพาน & จ.กาฬสินธุ์</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-[#FDE047]">
                คลิกที่หมุดเพื่อดูข้อมูล
              </span>
            </div>

            {/* Map Canvas with SVG Contour & Pins */}
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#2D1B10] via-[#24130A] to-[#170A03] border border-white/5 overflow-hidden flex items-center justify-center p-4">
              
              {/* Background Topographic / Mountain Contour Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <path d="M 50,150 Q 150,50 300,120 T 550,80" fill="none" stroke="#EA580C" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 20,280 Q 200,200 400,260 T 600,180" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 100,380 Q 250,300 450,350 T 650,300" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>

              {/* Mountain Silhouette Indicator */}
              <div className="absolute top-4 right-5 text-right pointer-events-none">
                <div className="text-[10px] uppercase tracking-wider text-[#A68A78]">แนวเทือกเขาภูพาน</div>
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                  <span>⛰️ แหล่งกำเนิดเมล็ดกาแฟ</span>
                </div>
              </div>

              {/* Pins rendered dynamically based on filter */}
              {locations.map((item) => {
                const isVisible = filter === 'all' || filter === item.type;
                const isSelected = currentSelected.id === item.id;

                let pinColor = 'bg-[#EA580C] text-white ring-[#EA580C]/40';
                let PinIcon = Coffee;
                if (item.type === 'plantation') {
                  pinColor = 'bg-emerald-600 text-white ring-emerald-500/40';
                  PinIcon = Sprout;
                } else if (item.type === 'academy') {
                  pinColor = 'bg-amber-500 text-[#231205] ring-amber-400/40';
                  PinIcon = GraduationCap;
                }

                if (!isVisible) return null;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPin(item)}
                    style={{ left: `${item.coords.x}%`, top: `${item.coords.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all z-20 ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                    title={item.name}
                  >
                    {/* Pulsing ring on selected */}
                    {isSelected && (
                      <span className="absolute -inset-2 rounded-full bg-white/20 animate-ping" />
                    )}

                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-xl ring-4 ${pinColor} transition-transform`}>
                      <PinIcon size={18} />
                    </div>

                    {/* Tooltip Label */}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md transition-opacity pointer-events-none ${
                      isSelected 
                        ? 'bg-white text-[#231205] opacity-100' 
                        : 'bg-[#231205]/90 text-[#DDB892] opacity-0 group-hover:opacity-100'
                    }`}>
                      {item.name.replace('456 Coffee ', '').replace('456 Cafe ', '')}
                    </div>
                  </button>
                );
              })}

              {/* Bottom Map Legend */}
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-[#1A0C04]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <span className="text-[#A68A78]">สัญลักษณ์หมุด:</span>
                <span className="flex items-center gap-1 text-[#F97316]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" /> คาเฟ่
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> แปลงปลูก
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Academy
                </span>
              </div>

            </div>

            {/* Quick selector buttons below map */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <a
                href="#cafes"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-[#EA580C] flex items-center justify-center gap-1">
                  <Coffee size={14} className="text-[#EA580C]" />
                  ร้านคาเฟ่
                </div>
                <div className="text-[10px] text-[#A68A78] mt-0.5">2 สาขาบริการ</div>
              </a>

              <a
                href="#plantations"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center justify-center gap-1">
                  <Sprout size={14} className="text-emerald-400" />
                  จองต้นพันธุ์
                </div>
                <div className="text-[10px] text-[#A68A78] mt-0.5">โรบัสต้าภูพาน</div>
              </a>

              <a
                href="#academy"
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center justify-center gap-1">
                  <GraduationCap size={14} className="text-amber-400" />
                  อบรมเปิดร้าน
                </div>
                <div className="text-[10px] text-[#A68A78] mt-0.5">หลักสูตรบาริสต้า</div>
              </a>
            </div>

          </div>

          {/* Right: Selected Location Detail Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-gradient-to-br from-[#2D1B10] to-[#1C0F06] border border-[#DDB892]/30 p-6 sm:p-7 shadow-2xl space-y-6">
              
              {/* Card Header & Badge */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    currentSelected.type === 'cafe'
                      ? 'bg-[#EA580C]/20 text-[#F97316] border border-[#EA580C]/30'
                      : currentSelected.type === 'plantation'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {currentSelected.type === 'cafe' && <Coffee size={13} />}
                    {currentSelected.type === 'plantation' && <Sprout size={13} />}
                    {currentSelected.type === 'academy' && <GraduationCap size={13} />}
                    {currentSelected.badge}
                  </span>
                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-white mt-2 leading-tight">
                    {currentSelected.name}
                  </h3>
                </div>
              </div>

              {/* Location Meta Details */}
              <div className="space-y-3 rounded-2xl bg-white/5 border border-white/10 p-4 text-xs sm:text-sm text-[#DDB892]">
                <div className="flex items-start gap-3">
                  <MapPin size={17} className="text-[#EA580C] shrink-0 mt-0.5" />
                  <span>
                    พิกัด: {currentSelected.district} {currentSelected.province}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={17} className="text-[#EA580C] shrink-0" />
                  <span className="text-white font-medium">
                    {currentSelected.hoursOrCapacity}
                  </span>
                </div>

                {currentSelected.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={17} className="text-[#EA580C] shrink-0" />
                    <a href={`tel:${currentSelected.phone}`} className="text-white hover:text-[#EA580C] font-bold">
                      {currentSelected.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Details Paragraph */}
              <p className="text-sm text-[#E6CCB2] leading-relaxed">
                {currentSelected.details}
              </p>

              {/* Highlight Stats Pill */}
              {currentSelected.stats && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#FDE047]">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>{currentSelected.stats}</span>
                </div>
              )}

              {/* Main Action Button for Selected Pin */}
              <a
                href={currentSelected.actionHref}
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#C86432] hover:from-[#D94E06] hover:to-[#B05322] shadow-xl shadow-[#EA580C]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {currentSelected.actionText}
                <ChevronRight size={18} />
              </a>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
