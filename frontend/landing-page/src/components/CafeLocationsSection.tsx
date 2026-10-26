import React from 'react';
import { Coffee, MapPin, Phone, Clock, Navigation, CheckCircle2, Star, Sparkles } from 'lucide-react';

export function CafeLocationsSection() {
  const branches = [
    {
      id: 'main',
      name: '456 Coffee - สาขาหลัก เมืองกาฬสินธุ์',
      badge: 'Flagship Cafe & Roastery',
      address: 'ใจกลางเมืองกาฬสินธุ์ ใกล้ศูนย์ราชการและย่านธุรกิจ อ.เมือง จ.กาฬสินธุ์',
      hours: '08:30 - 16:30 น. (เปิดบริการทุกวัน)',
      phone: '061-305-5625',
      features: [
        'Slow Bar ดริปกาแฟโรบัสต้าภูพาน',
        'เมล็ดกาแฟคั่วสดใหม่ทุกสัปดาห์',
        'แอร์เย็นฉ่ำ Wi-Fi ฟรี พร้อมปลั๊กทำงาน',
        'ที่จอดรถสะดวกสบายหน้าร้าน',
      ],
      popularDrinks: ['Phu Phan Dirty', 'Classic Espresso เย็น', 'Orange Americano'],
      mapUrl: 'https://maps.google.com/?q=Kalasin+Thailand',
    },
    {
      id: 'otop',
      name: '456 Coffee - สาขา ศูนย์ OTOP กาฬสินธุ์',
      badge: 'Tourist Station & Souvenir Hub',
      address: 'ศูนย์ส่งเสริมและจำหน่ายผลิตภัณฑ์ OTOP จังหวัดกาฬสินธุ์ อ.เมือง จ.กาฬสินธุ์',
      hours: '07:00 - 17:00 น. (เปิดบริการทุกวัน)',
      phone: '061-305-5625',
      features: [
        'จุดแวะพักนักท่องเที่ยวและผู้เดินทาง',
        'ของฝากกาแฟดริปแบ็ก & เมล็ดคั่วแท้',
        'ศูนย์รวมผ้าไหมแพรวาและสินค้าชุมชน',
        'เสิร์ฟเครื่องดื่มรวดเร็วทันใจ',
      ],
      popularDrinks: ['ชาไทยพรีเมียม', 'Coconut Latte', 'ดาร์กโกโก้ภูพาน'],
      mapUrl: 'https://maps.google.com/?q=OTOP+Kalasin',
    },
  ];

  return (
    <section id="cafes" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EA580C]/10 text-[#EA580C] uppercase tracking-wider">
            <Coffee size={15} />
            ร้านค้าคาเฟ่ 456 Coffee
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#231205] tracking-tight">
            แวะสัมผัสความหอมกรุ่น <br className="hidden sm:inline" />
            ได้ที่หน้าร้านคาเฟ่ทุกสาขา
          </h2>
          <p className="text-base text-[#7F5539]">
            กาแฟทุกแก้วชงจากเมล็ดโรบัสต้าภูพานคั่วสด รสเข้ม บอดี้แน่น กลมกล่อม โทรสั่งล่วงหน้าหรือแวะนั่งดื่มได้ทันที
          </p>
        </div>

        {/* Branches Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {branches.map((b) => (
            <div
              key={b.id}
              className="bg-[#FBF9F5] rounded-3xl p-8 border border-[#DDB892]/40 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div className="space-y-6">
                
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EA580C]/10 text-[#EA580C]">
                      {b.badge}
                    </span>
                    <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                      <Star size={14} className="fill-amber-500 text-amber-500" />
                      4.9 ดาว
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-[#231205]">
                    {b.name}
                  </h3>
                </div>

                {/* Details list */}
                <div className="space-y-3 text-sm text-[#7F5539]">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#EA580C] shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-[#EA580C] shrink-0" />
                    <span className="font-medium text-[#231205]">{b.hours}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-[#EA580C] shrink-0" />
                    <a
                      href={`tel:${b.phone}`}
                      className="font-bold text-[#EA580C] hover:underline"
                    >
                      {b.phone} (โทรสั่งล่วงหน้า)
                    </a>
                  </div>
                </div>

                {/* Signature Drinks pills */}
                <div>
                  <div className="text-xs font-bold text-[#582F0E] uppercase tracking-wider mb-2">
                    เมนูยอดนิยมประจำสาขา:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {b.popularDrinks.map((drink, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#582F0E] border border-[#DDB892]/40 shadow-2xs"
                      >
                        ☕ {drink}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="pt-4 border-t border-[#DDB892]/30">
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#7F5539]">
                    {b.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-[#DDB892]/30 flex items-center gap-3">
                <a
                  href={`tel:${b.phone}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold text-white bg-[#EA580C] hover:bg-[#D94E06] shadow-md shadow-[#EA580C]/25 transition-all"
                >
                  <Phone size={14} />
                  โทรสั่งกาแฟล่วงหน้า
                </a>

                <a
                  href={b.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-2xl text-xs font-bold text-[#7F5539] hover:text-[#231205] bg-[#F5EBE0] hover:bg-[#E6CCB2] transition-colors"
                >
                  <Navigation size={14} />
                  แผนที่นำทาง
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
