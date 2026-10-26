import React, { useState } from 'react';
import { Briefcase, Send, CheckCircle, Sparkles, Building, Coffee, PhoneCall } from 'lucide-react';

export function FranchiseSection() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    interest: 'event_booth',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <section id="franchise" className="py-24 bg-[#F5EBE0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EA580C]/10 text-[#EA580C] uppercase tracking-wider">
            <Briefcase size={14} />
            บริการออกบูธ & ร่วมธุรกิจกับเรา
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#231205] tracking-tight">
            จัดเลี้ยงนอกสถานที่ สั่งชุดเบรค <br className="hidden sm:inline" />
            และโอกาสทางธุรกิจกับ 456 Coffee
          </h2>
          <p className="text-base text-[#7F5539]">
            เติมเต็มทุกงานสัมมนา อีเวนต์องค์กร และงานมงคล ด้วยบาร์กาแฟสดมาตรฐาน Specialty 
            หรือต่อยอดความสำเร็จร่วมกับเรา
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          
          {/* Left Service Highlights */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              {[
                {
                  icon: Coffee,
                  title: 'Mobile Coffee Bar (ออกบูธกาแฟสด)',
                  desc: 'ยกบาร์กาแฟสดพร้อมบาริสต้ามืออาชีพไปเสิร์ฟถึงที่ในงานประชุม สัมมนา งานแต่งงาน หรืองานอีเวนต์เปิดตัว',
                },
                {
                  icon: Sparkles,
                  title: 'ชุด Snack Box & กาแฟกล่อง',
                  desc: 'เซ็ตของว่างคู่เครื่องดื่ม บรรจุภัณฑ์สวยงาม สะอาด ถูกหลักอนามัย พร้อมจัดส่งตามเวลานัดหมาย',
                },
                {
                  icon: Building,
                  title: 'ตัวแทนจำหน่ายเมล็ดกาแฟ & แฟรนไชส์',
                  desc: 'ร่วมขยายสาขาร้านกาแฟ 456 หรือสั่งซื้อเมล็ดกาแฟคั่วราคาส่งสำหรับร้านกาแฟและโรงแรม',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-[#DDB892]/40 shadow-sm flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center shrink-0">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-[#231205]">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#7F5539] mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct Contact Bar */}
            <div className="p-5 rounded-2xl bg-[#231205] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <div className="text-xs text-[#DDB892]">สายด่วนติดต่องานด่วน</div>
                  <div className="font-heading font-black text-lg">061-305-5625</div>
                </div>
              </div>
              <a
                href="tel:0613055625"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                โทรทันที
              </a>
            </div>
          </div>

          {/* Right Inquiry Form */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#DDB892]/40 shadow-xl">
              {formSubmitted ? (
                <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-[#231205]">
                    ขอบพระคุณสำหรับข้อมูล
                  </h3>
                  <p className="text-sm text-[#7F5539] max-w-sm mx-auto">
                    ทีมงาน 456 Coffee ได้รับข้อมูลเรียบร้อยแล้ว และจะติดต่อกลับไปยังเบอร์{' '}
                    <strong className="text-[#231205]">{formData.phone}</strong> โดยเร็วที่สุด
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', phone: '', interest: 'event_booth', message: '' });
                    }}
                    className="inline-flex px-6 py-2.5 rounded-xl text-xs font-bold text-[#EA580C] bg-[#EA580C]/10 hover:bg-[#EA580C]/20 transition-colors"
                  >
                    ส่งข้อความอื่นเพิ่มเติม
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="font-heading font-bold text-xl text-[#231205]">
                      ส่งข้อมูลติดต่อสอบถาม
                    </h3>
                    <p className="text-xs text-[#7F5539] mt-1">
                      กรอกรายละเอียดด้านล่าง เจ้าหน้าที่จะติดต่อกลับเพื่อให้ข้อมูลและเสนอราคาพิเศษ
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                      ชื่อ-นามสกุล หรือชื่อหน่วยงาน
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจดี / สำนักงานจังหวัดกาฬสินธุ์"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                      เบอร์โทรศัพท์ที่ติดต่อได้สะดวก
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="08X-XXX-XXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                      เรื่องที่ท่านสนใจติดต่อ
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20 outline-none text-sm bg-white"
                    >
                      <option value="event_booth">จองบาร์กาแฟสดออกงานอีเวนต์ (Mobile Bar)</option>
                      <option value="snack_box">สั่งชุดเบรคประชุม / Snack Box ล่วงหน้า</option>
                      <option value="beans_wholesale">สั่งซื้อเมล็ดกาแฟคั่วราคาส่ง</option>
                      <option value="franchise">สนใจแฟรนไชส์ / เปิดสาขา 456 Coffee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#582F0E] mb-1.5">
                      รายละเอียดเพิ่มเติม (วัน เวลา สถานที่ หรือจำนวนแก้ว)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="ระบุรายละเอียดงาน วันที่จัดงาน หรือความต้องการพิเศษ..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#DDB892]/60 focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#C86432] hover:from-[#D94E06] hover:to-[#B05322] shadow-lg shadow-[#EA580C]/30 transition-all hover:scale-[1.01]"
                  >
                    <Send size={16} />
                    ส่งข้อมูลขอรับใบเสนอราคา
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
