import React from 'react';
import { MapPin, Phone, Clock, Navigation, CheckCircle2, Coffee } from 'lucide-react';

export function BranchesSection() {
  const branches = [
    {
      id: 'branch-1',
      name: '456 Coffee - สาขาหลัก เมืองกาฬสินธุ์',
      badge: 'Flagship Store & Roastery',
      address: 'ใจกลางเมืองกาฬสินธุ์ ใกล้ศูนย์ราชการและย่านธุรกิจ อ.เมือง จ.กาฬสินธุ์',
      hours: '08:30 - 16:30 น. (เปิดบริการทุกวัน)',
      phone: '061-305-5625',
      features: [
        'สโลว์บาร์ & กาแฟดริป Specialty',
        'จำหน่ายเมล็ดกาแฟคั่วและอุปกรณ์ชง',
        'แอร์เย็นฉ่ำ มีปลั๊กไฟ & Wi-Fi ฟรี',
        'ที่จอดรถสะดวกสบาย',
      ],
      mapUrl: 'https://maps.google.com/?q=Kalasin+Thailand',
    },
    {
      id: 'branch-2',
      name: '456 Coffee - สาขา ศูนย์โอท็อปจังหวัดกาฬสินธุ์',
      badge: 'OTOP Center Kalasin',
      address: 'ศูนย์ส่งเสริมและจำหน่ายผลิตภัณฑ์ OTOP จังหวัดกาฬสินธุ์ อ.เมือง จ.กาฬสินธุ์',
      hours: '07:00 - 17:00 น. (เปิดบริการทุกวัน)',
      phone: '061-305-5625',
      features: [
        'จุดแวะพักนักท่องเที่ยวและผู้เดินทาง',
        'ครบครันสินค้าของฝากและผ้าไหมแพรวา',
        'เครื่องดื่ม Takeaway รวดเร็วทันใจ',
        'ของฝากกาแฟโรบัสต้าภูพานแท้',
      ],
      mapUrl: 'https://maps.google.com/?q=OTOP+Kalasin',
    },
  ];

  return (
    <section id="branches" className="py-24 bg-[#FBF9F5] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EA580C]/10 text-[#EA580C] uppercase tracking-wider">
            <MapPin size={14} />
            สาขาและจุดให้บริการ
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#231205] tracking-tight">
            แวะสัมผัสความหอมกรุ่น <br className="hidden sm:inline" />
            ได้ที่ 456 Coffee ทุกสาขา
          </h2>
          <p className="text-base text-[#7F5539]">
            พร้อมต้อนรับคุณด้วยกาแฟคุณภาพและรอยยิ้มอบอุ่น สั่งล่วงหน้าหรือเดินทางมาที่ร้านได้เลย
          </p>
        </div>

        {/* Branch Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-3xl p-8 border border-[#DDB892]/40 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div className="space-y-6">
                
                {/* Header */}
                <div>
                  <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#EA580C]/10 text-[#EA580C] mb-3">
                    {branch.badge}
                  </span>
                  <h3 className="font-heading font-bold text-xl text-[#231205]">
                    {branch.name}
                  </h3>
                </div>

                {/* Info List */}
                <div className="space-y-3.5 text-sm text-[#7F5539]">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#EA580C] shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-[#EA580C] shrink-0" />
                    <span className="font-medium text-[#231205]">{branch.hours}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-[#EA580C] shrink-0" />
                    <a
                      href={`tel:${branch.phone}`}
                      className="font-bold text-[#EA580C] hover:underline"
                    >
                      {branch.phone} (โทรสั่งล่วงหน้า)
                    </a>
                  </div>
                </div>

                {/* Features Highlights */}
                <div className="pt-4 border-t border-[#F5EBE0]">
                  <div className="text-xs font-semibold text-[#9C6644] uppercase tracking-wider mb-2.5">
                    สิ่งอำนวยความสะดวก:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#582F0E]">
                    {branch.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-[#F5EBE0] flex items-center gap-3">
                <a
                  href={`tel:${branch.phone}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white bg-[#EA580C] hover:bg-[#D94E06] shadow-md transition-all"
                >
                  <Phone size={14} />
                  โทรสั่งเลย
                </a>

                <a
                  href={branch.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-[#7F5539] hover:text-[#231205] bg-[#F5EBE0] hover:bg-[#E6CCB2] transition-colors"
                >
                  <Navigation size={14} />
                  นำทางแผนที่
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
