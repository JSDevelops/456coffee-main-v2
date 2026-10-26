import React from 'react';
import { Coffee, Sparkles, MapPin, ArrowRight, Star, Heart, Award, ShieldCheck } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-b from-[#231205] via-[#2E1808] to-[#1A0C04] text-white">
      {/* Background Decorative Glows & Grid */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#EA580C]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#D97706]/15 rounded-full blur-[120px] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Origin Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-[#FDE047] shadow-lg animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
              <Sparkles size={14} className="text-[#EA580C]" />
              <span>กาแฟโรบัสต้าแท้ โครงการปลูกกาแฟเทือกเขาภูพาน กาฬสินธุ์</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.15]">
              รสชาติเข้มข้น หอมกรุ่น <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#F59E0B] to-[#FDE047]">
                เอกลักษณ์แห่งภูพาน
              </span>{' '}
              สู่แก้วโปรดคุณ
            </h1>

            {/* Subtitle description */}
            <p className="text-base sm:text-lg text-[#E6CCB2] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              456 Coffee ยกระดับกาแฟสายพันธุ์โรบัสต้าจากผืนดินภูพาน จังหวัดกาฬสินธุ์
              ผ่านกรรมวิธีการคั่วแบบเฉพาะ เข้ม กลมกล่อม หอมคาราเมล อิ่มสัมผัสแบบ Full Body 
              เพื่อประสบการณ์ดื่มกาแฟไทยที่ดีที่สุดในทุกวัน
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#menu"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#C86432] hover:from-[#D94E06] hover:to-[#B05322] shadow-xl shadow-[#EA580C]/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Coffee size={18} />
                ดูเมนูซิกเนเจอร์
                <ArrowRight size={16} />
              </a>

              <a
                href="#branches"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold text-[#E6CCB2] hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all"
              >
                <MapPin size={18} className="text-[#EA580C]" />
                ค้นหาสาขา & สั่งล่วงหน้า
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 max-w-xl mx-auto lg:mx-0">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-heading font-black text-white">100%</div>
                <div className="text-xs text-[#B08968]">โรบัสต้าแท้ภูพาน</div>
              </div>
              <div className="space-y-1 border-x border-white/10 px-2 sm:px-4">
                <div className="text-2xl sm:text-3xl font-heading font-black text-[#F59E0B] flex items-center justify-center lg:justify-start gap-1">
                  <span>4.9</span>
                  <Star size={18} className="fill-[#F59E0B] text-[#F59E0B]" />
                </div>
                <div className="text-xs text-[#B08968]">ความพึงพอใจลูกค้า</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-heading font-black text-white">2 สาขา</div>
                <div className="text-xs text-[#B08968]">ในเมืองกาฬสินธุ์</div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase Card */}
          <div className="lg:col-span-5 relative">
            {/* Ambient Back Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#EA580C]/30 to-[#F59E0B]/20 rounded-3xl blur-2xl transform rotate-3" />

            {/* Main Showcase Card */}
            <div className="relative rounded-3xl bg-[#2D1B10]/80 border border-[#DDB892]/20 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Card Header & Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EA580C]/20 text-[#F97316] border border-[#EA580C]/30">
                  <Award size={14} />
                  เมนูขายดีประจำสาขา
                </span>
                <span className="text-xs font-medium text-[#B08968] flex items-center gap-1">
                  <Heart size={14} className="text-[#EF4444] fill-[#EF4444]" />
                  ยอดนิยม 2,500+ แก้ว
                </span>
              </div>

              {/* Product Visual Container */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#3D2516] to-[#1F0E05] p-6 text-center border border-white/5">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F59E0B] p-1 shadow-2xl shadow-[#EA580C]/40 mb-4">
                  <div className="w-full h-full rounded-full bg-[#1A0C04] flex items-center justify-center">
                    <Coffee size={56} className="text-[#FDE047]" />
                  </div>
                </div>

                <h3 className="font-heading font-bold text-xl text-white">
                  Phu Phan Signature Dirty
                </h3>
                <p className="text-xs text-[#DDB892] mt-1">
                  นมสดเย็นจัด เลเยอร์เอสเปรสโซ่ช็อตเข้มข้น โรบัสต้าภูพาน 100%
                </p>

                {/* Taste Profile Tags */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 text-[#E6CCB2]">
                    🍫 Dark Chocolate Note
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 text-[#E6CCB2]">
                    🥜 Roasted Nutty
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#EA580C]/20 text-[#F97316]">
                    ✨ Full Body
                  </span>
                </div>
              </div>

              {/* Bottom Feature Box */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#B08968]">รอบคั่วเมล็ดกาแฟ</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    คั่วสดใหม่ทุกสัปดาห์ (Fresh Roast)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#B08968]">เริ่มต้นเพียง</div>
                  <div className="text-xl font-heading font-black text-[#F59E0B]">฿45.-</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
