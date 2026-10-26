import React from 'react';
import { Gift, Phone, Sparkles, Award, CheckCircle, ArrowRight } from 'lucide-react';

export function LoyaltySection() {
  return (
    <section id="rewards" className="py-24 bg-[#231205] text-white relative overflow-hidden">
      {/* Decorative Lights */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#EA580C]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-[#D97706]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text & Benefits */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EA580C]/20 text-[#F97316] border border-[#EA580C]/30 uppercase tracking-wider">
              <Gift size={14} />
              456 Coffee Member Rewards
            </span>

            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">
              สะสมแต้มง่ายๆ ทุกแก้ว <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#F59E0B] to-[#FDE047]">
                เพียงบอกเบอร์โทรศัพท์
              </span>
            </h2>

            <p className="text-base text-[#DDB892] max-w-xl font-normal leading-relaxed">
              ไม่ต้องโหลดแอปพลิเคชันให้ยุ่งยาก เพียงแจ้งเบอร์โทรศัพท์กับบาริสต้าหน้าเคาน์เตอร์ 
              รับ 1 แต้มทันทีในทุกเมนูเครื่องดื่ม สะสมครบแลกรับแก้วโปรดฟรี!
            </p>

            {/* Benefit Bullets */}
            <div className="space-y-4 pt-2">
              {[
                {
                  title: 'สะสมครบ 10 แต้ม แลกฟรี 1 แก้ว',
                  desc: 'เลือกรับเมนูเครื่องดื่มมาตรฐานได้ฟรีทันที ไม่มีเงื่อนไขซับซ้อน',
                },
                {
                  title: 'สิทธิพิเศษวันเกิด (Birthday Special)',
                  desc: 'รับส่วนลดพิเศษ 50% หรือเมนูของขวัญฟรีในเดือนเกิดของคุณ',
                },
                {
                  title: 'ส่วนลดพิเศษสำหรับเมล็ดกาแฟ OTOP ภูพาน',
                  desc: 'นำแต้มสะสมมาใช้เป็นส่วนลดซื้อเมล็ดกาแฟคั่วและสินค้าชุมชนได้',
                },
              ].map((b, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#EA580C] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{b.title}</h4>
                    <p className="text-xs text-[#A68A78] mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a
                href="#branches"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-white bg-[#EA580C] hover:bg-[#D94E06] shadow-lg shadow-[#EA580C]/30 transition-all hover:scale-105"
              >
                เริ่มสะสมแต้มได้ที่หน้าร้านวันนี้
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* Right Virtual Membership Card Showcase */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Backglow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#EA580C] to-[#D97706] rounded-3xl blur-xl opacity-30 transform -rotate-2" />

              {/* Digital Card Preview */}
              <div className="relative rounded-3xl bg-gradient-to-br from-[#3D2516] via-[#2A170C] to-[#1A0C04] border border-[#DDB892]/30 p-7 sm:p-8 shadow-2xl space-y-6">
                
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F59E0B] flex items-center justify-center text-white font-black text-lg">
                      456
                    </div>
                    <div>
                      <div className="font-heading font-black text-white text-base">456 REWARDS</div>
                      <div className="text-[10px] text-[#DDB892] tracking-wider uppercase">VIP Coffee Club</div>
                    </div>
                  </div>
                  <Sparkles size={20} className="text-[#FDE047]" />
                </div>

                {/* Simulated Stamp Card (10 Stamped slots) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#DDB892]">
                    <span>บัตรสะสมแก้วกาแฟ</span>
                    <span className="font-bold text-[#FDE047]">7 / 10 แก้ว</span>
                  </div>

                  {/* Stamp slots */}
                  <div className="grid grid-cols-5 gap-2.5 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
                      const isStamped = slot <= 7;
                      const isReward = slot === 10;
                      return (
                        <div
                          key={slot}
                          className={`aspect-square rounded-xl flex items-center justify-center border text-xs font-bold transition-all ${
                            isStamped
                              ? 'bg-gradient-to-tr from-[#EA580C] to-[#F59E0B] text-white border-transparent shadow-md'
                              : isReward
                              ? 'bg-[#FDE047]/10 text-[#FDE047] border-[#FDE047]/40 animate-pulse'
                              : 'bg-white/5 text-[#7F5539] border-white/10'
                          }`}
                        >
                          {isStamped ? (
                            '☕'
                          ) : isReward ? (
                            <Gift size={16} />
                          ) : (
                            slot
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#E6CCB2]">
                    <Phone size={14} className="text-[#EA580C]" />
                    <span>08X-XXX-XXXX</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
                    Active Member
                  </span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
