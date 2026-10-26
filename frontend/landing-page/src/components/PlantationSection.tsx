import React, { useState } from 'react';
import { Sprout, MapPin, ShieldCheck, CheckCircle2, Send, Mountain, TrendingUp, HandCoins, ExternalLink } from 'lucide-react';

export function PlantationSection() {
  const [submitted, setSubmitted] = useState(false);
  const [assignedFarmId, setAssignedFarmId] = useState('');
  const [formData, setFormData] = useState({
    farmerName: '',
    phone: '',
    lineId: '',
    saplingCount: '300',
    district: '',
    province: 'กาฬสินธุ์',
    landArea: '1 ไร่',
    gpsLocation: '',
    experienceLevel: 'beginner',
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const randomId = 'PP-' + Math.floor(1000 + Math.random() * 9000);
    setAssignedFarmId(randomId);
    setSubmitted(true);
  };

  const getMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          setFormData((prev) => ({ ...prev, gpsLocation: coords }));
        },
        () => {
          setFormData((prev) => ({ ...prev, gpsLocation: '16.4322, 103.5061 (ตัวเมืองกาฬสินธุ์)' }));
        }
      );
    } else {
      setFormData((prev) => ({ ...prev, gpsLocation: '16.4322, 103.5061 (ตัวเมืองกาฬสินธุ์)' }));
    }
  };

  return (
    <section id="plantations" className="py-24 bg-[#1F2937]/5 bg-gradient-to-b from-[#F5EBE0]/80 via-[#FBF9F5] to-[#F5EBE0]/80 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 uppercase tracking-wider">
            <Sprout size={15} />
            โครงการปลูกกาแฟโรบัสต้าภูพาน • เครือข่ายเกษตรกร
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#231205] tracking-tight">
            สนใจปลูกกาแฟ จองต้นพันธุ์แท้ <br className="hidden sm:inline" />
            พร้อมปักหมุดแปลงปลูกเข้าสู่เครือข่าย 456
          </h2>
          <p className="text-base text-[#7F5539] leading-relaxed">
            เปลี่ยนพื้นที่ว่างเปล่าสู่พืชเศรษฐกิจยั่งยืน ต้นกล้าโรบัสต้าภูพานแข็งแรง ดูแลง่าย ทนแล้ง 
            มีตลาดและโรงคั่ว 456 Coffee รับซื้อผลผลิตเมล็ดเชอร์รี่สุกคืนในราคาที่เป็นธรรม
          </p>
        </div>

        {/* 4 Value Pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: Mountain,
              title: 'สายพันธุ์แท้ภูพาน',
              desc: 'คัดสรรจากแม่พันธุ์ทนแล้ง รากแข็งแรง ปรับตัวดีเยี่ยมกับสภาพดินอีสานและภูพาน',
            },
            {
              icon: TrendingUp,
              title: 'ผลผลิตดก เริ่มเก็บปีที่ 3',
              desc: 'ให้ผลเชอร์รี่ดก เมล็ดโต บอดี้แน่น กลิ่นหอมช็อกโกแลตและถั่ว ไม่เปรี้ยว',
            },
            {
              icon: HandCoins,
              title: 'ประกันราคารับซื้อผลผลิต',
              desc: 'โรงคั่ว 456 รับซื้อผลสุก (Red Cherry) โดยตรง ตัดปัญหาโดนกดราคา',
            },
            {
              icon: MapPin,
              title: 'ปักหมุดเข้าระบบ Traceability',
              desc: 'มีรหัสแปลงปลูกในระบบ สามารถตรวจสอบย้อนกลับและโปรโมทแหล่งปลูกได้',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-[#DDB892]/40 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon size={24} />
                </div>
                <h4 className="font-heading font-bold text-base text-[#231205] mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-[#7F5539] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Booking & Pinning Form Container */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-emerald-500/30 shadow-2xl p-8 sm:p-12 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {submitted ? (
            <div className="text-center py-12 space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 size={44} />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                  จองต้นพันธุ์ & ปักหมุดสำเร็จ
                </span>
                <h3 className="font-heading font-bold text-2xl sm:text-3xl text-[#231205]">
                  ยินดีต้อนรับสู่เครือข่ายผู้ปลูกกาแฟภูพาน
                </h3>
              </div>

              {/* Digital Certificate Badge */}
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-[#1A0C04] text-white border border-emerald-500/40 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="text-xs text-emerald-300">รหัสแปลงเครือข่าย (Farm ID)</div>
                  <div className="font-heading font-black text-lg text-[#FDE047]">{assignedFarmId}</div>
                </div>
                <div className="text-xs text-[#E6CCB2] space-y-1">
                  <div>👤 ผู้ปลูก: <strong>{formData.farmerName}</strong> ({formData.phone})</div>
                  <div>🌱 จำนวนต้นกล้าที่จอง: <strong>{formData.saplingCount} ต้น</strong></div>
                  <div>📍 ที่ตั้งแปลง: <strong>{formData.district} {formData.province}</strong> ({formData.landArea})</div>
                  {formData.gpsLocation && (
                    <div className="text-emerald-400">🌐 พิกัด GPS: {formData.gpsLocation}</div>
                  )}
                </div>
              </div>

              <p className="text-sm text-[#7F5539] max-w-md mx-auto">
                เจ้าหน้าที่แปลงเพาะชำจะติดต่อกลับเพื่อนัดหมายการรับต้นกล้าพันธุ์แท้ 
                และบันทึกพิกัดแปลงปลูกของคุณลงบนแผนที่เครือข่าย 456 ครับ
              </p>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    farmerName: '',
                    phone: '',
                    lineId: '',
                    saplingCount: '300',
                    district: '',
                    province: 'กาฬสินธุ์',
                    landArea: '1 ไร่',
                    gpsLocation: '',
                    experienceLevel: 'beginner',
                  });
                }}
                className="inline-flex px-6 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                จองแปลงอื่นเพิ่มเติม
              </button>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="space-y-6">
              
              <div className="border-b border-[#F5EBE0] pb-4">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sprout size={16} />
                  แบบฟอร์มจองต้นพันธุ์ & ปักหมุดแปลงปลูก
                </div>
                <h3 className="font-heading font-bold text-2xl text-[#231205]">
                  ร่วมเป็นส่วนหนึ่งของเครือข่ายกาแฟโรบัสต้าภูพาน
                </h3>
                <p className="text-xs sm:text-sm text-[#7F5539] mt-1">
                  พร้อมให้คำปรึกษาตลอดระยะเวลาปลูก ตั้งแต่การเตรียมดิน การวางระบบน้ำ จนถึงฤดูกาลเก็บเกี่ยว
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                    ชื่อ-นามสกุล ผู้สนใจปลูก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายบุญมี กาฬสินธุ์"
                    value={formData.farmerName}
                    onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                    เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="08X-XXX-XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                    จำนวนต้นกล้าพันธุ์ที่ต้องการจอง
                  </label>
                  <select
                    value={formData.saplingCount}
                    onChange={(e) => setFormData({ ...formData, saplingCount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm bg-white"
                  >
                    <option value="50">50 ต้น (สำหรับทดลองปลูก 1 งาน)</option>
                    <option value="100">100 ต้น (ประมาณ 2 งาน)</option>
                    <option value="300">300 ต้น (แปลงมาตรฐาน 1 ไร่)</option>
                    <option value="500">500 ต้น (ประมาณ 1.5 - 2 ไร่)</option>
                    <option value="1000">1,000+ ต้น (แปลงใหญ่ 3 ไร่ขึ้นไป)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                    LINE ID (เพื่อรับคู่มือการปลูก)
                  </label>
                  <input
                    type="text"
                    placeholder="LINE ID"
                    value={formData.lineId}
                    onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                    อำเภอที่ตั้งแปลงปลูก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น อ.สมเด็จ หรือ อ.เมือง"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                    จังหวัดที่ตั้งแปลง
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กาฬสินธุ์, สกลนคร"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                    ขนาดพื้นที่แปลงปลูก
                  </label>
                  <select
                    value={formData.landArea}
                    onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm bg-white"
                  >
                    <option value="1-2 งาน">1 - 2 งาน</option>
                    <option value="1 ไร่">1 ไร่</option>
                    <option value="2-3 ไร่">2 - 3 ไร่</option>
                    <option value="4-5 ไร่">4 - 5 ไร่</option>
                    <option value="มากกว่า 5 ไร่">มากกว่า 5 ไร่</option>
                  </select>
                </div>
              </div>

              {/* Pin GPS Location Row */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-500/20 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <MapPin size={15} className="text-emerald-600" />
                    ปักหมุดพิกัดแปลงปลูกลงแผนที่เครือข่าย
                  </div>
                  <button
                    type="button"
                    onClick={getMyLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-500/30 hover:bg-emerald-100 transition-colors shrink-0"
                  >
                    📍 ดึงพิกัดจากตำแหน่งปัจจุบัน
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="เช่น ละติจูด, ลองจิจูด หรือชื่อตำบล/จุดสังเกตของแปลงปลูก"
                  value={formData.gpsLocation}
                  onChange={(e) => setFormData({ ...formData, gpsLocation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-emerald-500/30 text-xs text-[#231205] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.01]"
              >
                <Send size={16} />
                ยืนยันการจองต้นพันธุ์ & ปักหมุดแปลงปลูก
              </button>

            </form>
          )}

        </div>

      </div>
    </section>
  );
}
