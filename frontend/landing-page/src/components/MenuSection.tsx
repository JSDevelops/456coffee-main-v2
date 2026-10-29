import React, { useState, useEffect } from 'react';
import { Coffee, Flame, Sparkles, ShoppingBag, Check } from 'lucide-react';
import { fetchMenuApi, PublicMenuItem } from '../api';

interface MenuItem {
  id: string;
  name: string;
  category: 'coffee' | 'tea' | 'bakery' | 'beans';
  price: number;
  description: string;
  tag?: string;
  isPopular?: boolean;
}

export function MenuSection() {
  const [activeTab, setActiveTab] = useState<'all' | 'coffee' | 'tea' | 'bakery' | 'beans'>('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fallbackMenuItems: MenuItem[] = [
    {
      id: 'm1',
      name: 'Phu Phan Dirty',
      category: 'coffee',
      price: 65,
      description: 'เอสเปรสโซ่ช็อตเข้มข้นโรบัสต้าภูพาน เทราดบนนมสดเย็นจัด เลเยอร์แยกชั้น กลมกล่อมหอมมัน',
      tag: 'Signature Must-Try',
      isPopular: true,
    },
    {
      id: 'm2',
      name: '456 Classic Iced Espresso',
      category: 'coffee',
      price: 50,
      description: 'เอสเพรสโซ่เย็นสูตร 456 รสเข้ม หอมกลิ่นคั่ว ชงสดใหม่ หวานมันกำลังดี โดนใจคอกาแฟตัวจริง',
      tag: 'Best Seller',
      isPopular: true,
    },
    {
      id: 'm3',
      name: 'Phu Phan Orange Americano',
      category: 'coffee',
      price: 55,
      description: 'กาแฟช็อตเข้มผสมผสานน้ำส้มเข้มข้น รสชาติเปรี้ยวอมหวาน สดชื่น เติมพลังตลอดวัน',
      tag: 'Refreshing',
    },
    {
      id: 'm4',
      name: 'Coconut Cloud Latte',
      category: 'coffee',
      price: 60,
      description: 'ลาเต้น้ำมะพร้าวแท้ กลิ่นหอมธรรมชาติละมุน ผสมผสานกาแฟโรบัสต้าภูพานอย่างลงตัว',
      tag: 'Seasonal',
    },
    {
      id: 'm5',
      name: 'ชาไทยพรีเมียม 456',
      category: 'tea',
      price: 45,
      description: 'ชาไทยคัดเกรดพิเศษ หอมกลิ่นชาแท้ อบอวลด้วยนมสด ไม่แต่งสีจัด หวานกลมกล่อม',
      tag: 'Tea Lovers',
      isPopular: true,
    },
    {
      id: 'm6',
      name: 'มัทฉะลาเต้แท้เข้มข้น',
      category: 'tea',
      price: 55,
      description: 'ผงมัทฉะแท้เกรดพรีเมียม ชงแบบพิถีพิถัน รสชาติอูมามิ หอมมันเข้ากับนมสดสด',
    },
    {
      id: 'm7',
      name: 'ดาร์กโกโก้ภูพาน',
      category: 'tea',
      price: 50,
      description: 'โกโก้ดาร์กเข้มพิเศษ ไม่หวานเลี่ยน รสสัมผัสเข้มเต็มปาก ดื่มง่ายทั้งร้อนและเย็น',
    },
    {
      id: 'm8',
      name: 'ครัวซองต์เนยสดฝรั่งเศส',
      category: 'bakery',
      price: 45,
      description: 'แป้งพัฟฟ์กรอบนอกนุ่มใน หอมเนยสดแท้ อบใหม่ทุกวัน ทานคู่กาแฟเข้ากันที่สุด',
      tag: 'Fresh Baked',
    },
    {
      id: 'm9',
      name: 'บราวนี่ดาร์กช็อกโกแลตฟัดจ์',
      category: 'bakery',
      price: 40,
      description: 'เนื้อแน่น หนึบ ช็อกโกแลตเข้มข้น หวานน้อย เหมาะสำหรับทานคู่กับอเมริกาโน่',
    },
    {
      id: 'm10',
      name: 'เมล็ดกาแฟคั่วโรบัสต้าภูพาน (250g)',
      category: 'beans',
      price: 180,
      description: 'เมล็ดกาแฟคั่วสดส่งตรงจากเกษตรกรกาฬสินธุ์ บรรจุซองฟอยล์มีวาล์วรักษาความสดใหม่ มีระดับคั่วกลาง/เข้ม',
      tag: 'OTOP Specialty',
      isPopular: true,
    },
    {
      id: 'm11',
      name: 'กาแฟดริปแบ็ก ภูพาน (กล่อง 5 ซอง)',
      category: 'beans',
      price: 150,
      description: 'กาแฟดริปแบบพกพา ฉีกซองเติมน้ำร้อน สะดวก หอมสดชื่นได้ทุกที่ทุกเวลา',
      tag: 'Travel Friendly',
    },
  ];

  useEffect(() => {
    async function loadMenu() {
      try {
        const liveMenu = await fetchMenuApi();
        if (liveMenu && liveMenu.length > 0) {
          const mapped: MenuItem[] = liveMenu.map((m, idx) => {
            let cat: 'coffee' | 'tea' | 'bakery' | 'beans' = 'coffee';
            const catName = m.category?.name?.toLowerCase() || '';
            const itemName = m.name.toLowerCase();
            if (catName.includes('tea') || catName.includes('ชา') || itemName.includes('ชา') || itemName.includes('โกโก้')) {
              cat = 'tea';
            } else if (catName.includes('bakery') || catName.includes('เบเกอรี่') || catName.includes('เค้ก') || itemName.includes('ขนม')) {
              cat = 'bakery';
            } else if (catName.includes('bean') || catName.includes('เมล็ด') || itemName.includes('เมล็ด') || itemName.includes('ดริป')) {
              cat = 'beans';
            }
            return {
              id: m.id,
              name: m.name,
              category: cat,
              price: m.price,
              description: m.description || `เครื่องดื่มสดชื่นชงสดใหม่ คุณภาพระดับพรีเมียมจาก 456 Coffee`,
              tag: idx < 3 ? 'Best Seller' : undefined,
              isPopular: idx < 4,
            };
          });
          setMenuItems(mapped);
        } else {
          setMenuItems(fallbackMenuItems);
        }
      } catch {
        setMenuItems(fallbackMenuItems);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const filteredItems = activeTab === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeTab);

  return (
    <section id="menu" className="py-24 bg-[#F5EBE0]/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EA580C]/10 text-[#EA580C] uppercase tracking-wider">
            <Coffee size={14} />
            เมนูเครื่องดื่มและของว่าง
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#231205] tracking-tight">
            คัดสรรความอร่อยทุกเมนู <br className="hidden sm:inline" />
            เพื่อความสุขในทุกแก้วของคุณ
          </h2>
          <p className="text-base text-[#7F5539]">
            กาแฟทุกแก้วชงสดใหม่ด้วยวัตถุดิบคุณภาพ พร้อมเสิร์ฟที่หน้าร้าน และสั่งล่วงหน้าได้ทันที
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'coffee', label: '☕ กาแฟซิกเนเจอร์' },
            { id: 'tea', label: '🍵 ชาและเครื่องดื่มนม' },
            { id: 'bakery', label: '🥐 เบเกอรี่ & ของว่าง' },
            { id: 'beans', label: '🌿 เมล็ดกาแฟ & OTOP' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#231205] text-white shadow-lg shadow-black/20 scale-105'
                  : 'bg-white text-[#7F5539] hover:bg-[#E6CCB2]/50 border border-[#DDB892]/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Menu Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-[#DDB892]/30 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-heading font-bold text-lg text-[#231205] group-hover:text-[#EA580C] transition-colors">
                    {item.name}
                  </h3>
                  <div className="shrink-0 text-right">
                    <span className="font-heading font-black text-xl text-[#EA580C]">
                      ฿{item.price}
                    </span>
                  </div>
                </div>

                {item.tag && (
                  <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EA580C]/10 text-[#EA580C] mb-2.5">
                    {item.tag}
                  </span>
                )}

                <p className="text-xs sm:text-sm text-[#7F5539] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-[#F5EBE0] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#9C6644] flex items-center gap-1">
                  <Check size={14} className="text-emerald-500" />
                  พร้อมเสิร์ฟทุกวัน
                </span>
                <a
                  href="#branches"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#EA580C] hover:text-[#C86432] group/btn"
                >
                  สั่งหน้าร้าน / โทร
                  <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Catering & Bulk Orders Note */}
        <div className="mt-14 rounded-2xl bg-white border border-[#DDB892]/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h4 className="font-heading font-bold text-base text-[#231205]">
                ต้องการสั่งชุดเบรคประชุม สัมมนา หรือออเดอร์จำนวนมาก?
              </h4>
              <p className="text-xs text-[#7F5539] mt-0.5">
                456 Coffee รับจัดชุด Snack Box พร้อมกาแฟสด ส่งตรงถึงหน่วยงานใน จ.กาฬสินธุ์
              </p>
            </div>
          </div>
          <a
            href="#franchise"
            className="shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#231205] hover:bg-[#3D2516] text-white shadow-md transition-all"
          >
            สอบถามราคาชุดเบรค
          </a>
        </div>

      </div>
    </section>
  );
}
