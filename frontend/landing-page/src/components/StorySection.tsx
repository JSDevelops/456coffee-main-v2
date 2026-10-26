import React from 'react';
import { Mountain, Sprout, Flame, HeartHandshake, CheckCircle2, ExternalLink } from 'lucide-react';

export function StorySection() {
  const steps = [
    {
      icon: Mountain,
      title: 'แหล่งปลูกเทือกเขาภูพาน',
      desc: 'พื้นที่สูงระดับเหมาะสมใน จ.กาฬสินธุ์ ดินภูเขาแร่ธาตุสูง อากาศชุ่มชื้น ให้เชอร์รี่กาแฟสะสมสารอาหารได้เต็มที่',
      tag: 'Origin & Terroir',
    },
    {
      icon: Sprout,
      title: 'คัดเก็บเฉพาะผลสุกสีแดง',
      desc: 'สนับสนุนกลุ่มเกษตรกรท้องถิ่น คัดสรรเมล็ดกาแฟสุกเต็มที่ด้วยมือ (Hand Picked) เพื่อความหวานและความสมบูรณ์',
      tag: 'Hand Picked 100%',
    },
    {
      icon: Flame,
      title: 'การคั่วแบบ Signature Profile',
      desc: 'เทคนิคการคั่วเฉพาะของ 456 Coffee ดึงเอกลักษณ์ความเข้ม ช็อกโกแลต คาราเมล และบอดี้แน่น กลมกล่อม ไม่ขมไหม้',
      tag: 'Artisan Roasting',
    },
    {
      icon: HeartHandshake,
      title: 'ส่งต่อคุณค่าสู่ชุมชนกาฬสินธุ์',
      desc: 'รับซื้อผลผลิตในราคาเป็นธรรม สร้างรายได้ยั่งยืน และขับเคลื่อนเศรษฐกิจท้องถิ่นร่วมกับเครือข่ายผู้ปลูกกาแฟภูพาน',
      tag: 'Fair Trade & Local First',
    },
  ];

  return (
    <section id="story" className="py-24 bg-[#FBF9F5] relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#DDB892]/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EA580C]/10 text-[#EA580C] uppercase tracking-wider">
            <Mountain size={14} />
            เรื่องราวจากขุนเขาภูพาน สู่แก้วกาแฟของคุณ
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#231205] tracking-tight">
            กาแฟโรบัสต้าอัตลักษณ์ภูพาน <br className="hidden sm:inline" />
            ความภาคภูมิใจแห่งเมืองกาฬสินธุ์
          </h2>
          <p className="text-base text-[#7F5539] leading-relaxed">
            เราไม่ได้เพียงแค่ชงกาแฟ แต่เราคือสะพานเชื่อมโยงความมุ่งมั่นของเกษตรกรบนเทือกเขาภูพาน 
            สู่ผู้ดื่มที่หลงใหลในเสน่ห์ของกาแฟไทยคุณภาพระดับสากล
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 border border-[#DDB892]/30 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-[#F5EBE0] text-[#EA580C] group-hover:bg-[#EA580C] group-hover:text-white transition-colors flex items-center justify-center shadow-inner">
                      <Icon size={24} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-md bg-[#F5EBE0] text-[#7F5539]">
                      0{idx + 1}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-[#EA580C] uppercase tracking-wider block mb-1">
                    {step.tag}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#231205] mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#7F5539] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#F5EBE0] flex items-center gap-1.5 text-xs font-semibold text-[#9C6644]">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  มาตรฐานคุณภาพ 456
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Banner: Connected to Kalasin Coffee Network */}
        <div className="rounded-3xl bg-gradient-to-r from-[#231205] to-[#43281C] text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-96 h-96 bg-[#EA580C]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🌿 เครือข่ายผู้ปลูกกาแฟ จ.กาฬสินธุ์
              </span>
              <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                โครงการพัฒนาและส่งเสริมการปลูกกาแฟโรบัสต้าภูพาน
              </h3>
              <p className="text-sm sm:text-base text-[#DDB892] leading-relaxed max-w-2xl">
                456 Coffee ร่วมสนับสนุนโครงการปลูกกาแฟโรบัสต้าภูพานอย่างใกล้ชิด 
                เพื่อสร้างองค์ความรู้ พัฒนาสายพันธุ์ และขยายเครือข่ายแปลงปลูกกาแฟคุณภาพในพื้นที่จังหวัดกาฬสินธุ์
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center lg:items-end">
              <a
                href="https://coffee-phupan.ai.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-[#231205] bg-[#FDE047] hover:bg-[#FACC15] shadow-lg shadow-black/30 transition-all hover:scale-105"
              >
                เยี่ยมชมเว็บไซต์โครงการภูพาน
                <ExternalLink size={14} />
              </a>
              <span className="text-[11px] text-[#A68A78] text-center lg:text-right">
                coffee-phupan.ai.studio
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
