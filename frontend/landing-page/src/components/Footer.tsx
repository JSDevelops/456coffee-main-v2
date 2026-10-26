import React from 'react';
import { Coffee, MapPin, Phone, GraduationCap, Sprout, ShieldCheck, ExternalLink, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1A0C04] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 left-1/3 w-80 h-80 bg-[#EA580C]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#9C6644] flex items-center justify-center text-white shadow-md">
                <Coffee size={22} />
              </div>
              <div>
                <span className="font-heading font-black text-2xl tracking-tight text-white">
                  456 <span className="text-[#EA580C]">COFFEE</span>
                </span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EA580C]/20 text-[#EA580C]">
                  ECOSYSTEM
                </span>
              </div>
            </div>

            <p className="text-sm text-[#DDB892] max-w-sm leading-relaxed">
              ระบบนิเวศกาแฟโรบัสต้าภูพานครบวงจร: เชื่อมโยงเกษตรกรแปลงปลูก สถาบันอบรมบาริสต้า 
              และร้านค้าคาเฟ่คุณภาพ เพื่อการเติบโตที่ยั่งยืนของกาแฟไทย
            </p>

            <div className="pt-2 text-xs text-[#A68A78] space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#EA580C]" />
                <span>สำนักงานใหญ่ & สาขาหลัก: อ.เมือง จ.กาฬสินธุ์</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#EA580C]" />
                <span>เบอร์โทรศัพท์: 061-305-5625</span>
              </div>
            </div>
          </div>

          {/* Col 2: 3 Pillars Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              3 เสาหลัก 456
            </h4>
            <ul className="space-y-2.5 text-xs text-[#DDB892]">
              <li>
                <a href="#map" className="hover:text-[#EA580C] transition-colors flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#EA580C]" />
                  แผนที่ปักหมุดระบบนิเวศ
                </a>
              </li>
              <li>
                <a href="#cafes" className="hover:text-[#EA580C] transition-colors flex items-center gap-1.5">
                  <Coffee size={13} className="text-[#EA580C]" />
                  ร้านค้าคาเฟ่ 456 Coffee
                </a>
              </li>
              <li>
                <a href="#plantations" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Sprout size={13} className="text-emerald-400" />
                  พื้นที่ปลูก & จองต้นพันธุ์
                </a>
              </li>
              <li>
                <a href="#academy" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-amber-400" />
                  456 Academy อบรมเปิดร้าน
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Ecosystem & Admin Access (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              ระบบดิจิทัลในเครือข่าย
            </h4>

            {/* Admin HQ Card */}
            <a
              href="https://456.coffee-cafe.shop"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-[#EA580C]" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#EA580C] transition-colors">
                      ระบบจัดการหลังบ้าน 456 HQ
                    </div>
                    <div className="text-[10px] text-[#A68A78]">
                      456.coffee-cafe.shop
                    </div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-[#A68A78] group-hover:text-white" />
              </div>
            </a>

            {/* Coffee Phupan Network Card */}
            <a
              href="https://coffee-phupan.ai.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">🌿</span>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      เครือข่ายผู้ปลูกกาแฟภูพาน
                    </div>
                    <div className="text-[10px] text-[#A68A78]">
                      coffee-phupan.ai.studio
                    </div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-[#A68A78] group-hover:text-white" />
              </div>
            </a>
          </div>

        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A68A78]">
          <div>
            <span>© {currentYear} 456 Coffee Ecosystem. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>จากเทือกเขาภูพานสู่แก้วกาแฟคุณภาพของคุณ</span>
            <Heart size={12} className="text-[#EF4444] fill-[#EF4444]" />
          </div>
        </div>

      </div>
    </footer>
  );
}
