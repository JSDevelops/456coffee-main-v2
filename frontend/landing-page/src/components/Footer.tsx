import React from 'react';
import { Coffee, MapPin, Phone, ShieldCheck, ExternalLink, Heart } from 'lucide-react';

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
                  HQ
                </span>
              </div>
            </div>

            <p className="text-sm text-[#DDB892] max-w-sm leading-relaxed">
              กาแฟโรบัสต้าแท้จากแหล่งปลูกเทือกเขาภูพาน จังหวัดกาฬสินธุ์ 
              ยกระดับผลผลิตเกษตรกรไทยสู่กาแฟคุณภาพระดับสากล หอม เข้ม กลมกล่อมทุกแก้ว
            </p>

            <div className="pt-2 text-xs text-[#A68A78] space-y-1">
              <div>📍 สำนักงานใหญ่ & สาขาหลัก: อ.เมือง จ.กาฬสินธุ์</div>
              <div>📞 เบอร์โทรศัพท์: 061-305-5625</div>
              <div>🌐 โดเมนหลัก: coffee-cafe.shop</div>
            </div>
          </div>

          {/* Col 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              เมนูแนะนำ
            </h4>
            <ul className="space-y-2 text-xs text-[#DDB892]">
              <li>
                <a href="#story" className="hover:text-[#EA580C] transition-colors">เรื่องราวขุนเขาภูพาน</a>
              </li>
              <li>
                <a href="#menu" className="hover:text-[#EA580C] transition-colors">เมนูซิกเนเจอร์ & เบเกอรี่</a>
              </li>
              <li>
                <a href="#rewards" className="hover:text-[#EA580C] transition-colors">ระบบสะสมแต้ม 456 Rewards</a>
              </li>
              <li>
                <a href="#branches" className="hover:text-[#EA580C] transition-colors">สาขาเมืองกาฬสินธุ์ & ศูนย์โอท็อป</a>
              </li>
              <li>
                <a href="#franchise" className="hover:text-[#EA580C] transition-colors">บริการออกบูธ & แฟรนไชส์</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Ecosystem & Admin Access (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              ระบบดิจิทัลในเครือ 456
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
                    <div className="text-xs font-bold text-white group-hover:text-[#EA580C] transition-colors">
                      โครงการกาแฟโรบัสต้าภูพาน
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
          <div className="flex items-center gap-1">
            <span>© {currentYear} 456 Coffee. ลิขสิทธิ์ถูกต้องทุกประการ.</span>
          </div>

          <div className="flex items-center gap-2">
            <span>กาแฟไทยคุณภาพ จากเทือกเขาภูพาน สู่สายตาคนทั้งโลก</span>
            <Heart size={12} className="text-[#EF4444] fill-[#EF4444]" />
          </div>
        </div>

      </div>
    </footer>
  );
}
