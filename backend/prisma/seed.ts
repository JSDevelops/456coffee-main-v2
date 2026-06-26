import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting 456 Cafe Menu Seeding...');

  // 1. Categories
  const catCoffee = await prisma.category.upsert({ where: { id: 'cat-coffee' }, update: {}, create: { id: 'cat-coffee', name: 'กาแฟ (Coffee)', icon: '☕', sortOrder: 1 } });
  const catTeaMilk = await prisma.category.upsert({ where: { id: 'cat-tea-milk' }, update: {}, create: { id: 'cat-tea-milk', name: 'ชาและนม (Tea & Milk)', icon: '🍵', sortOrder: 2 } });
  const catRefresh = await prisma.category.upsert({ where: { id: 'cat-refresh' }, update: {}, create: { id: 'cat-refresh', name: 'สดชื่น (Refreshment)', icon: '🍋', sortOrder: 3 } });
  const catSignature = await prisma.category.upsert({ where: { id: 'cat-sig' }, update: {}, create: { id: 'cat-sig', name: 'ซิกเนเจอร์ (Signature)', icon: '✨', sortOrder: 4 } });

  // 2. Common Option Groups Helper
  const createOptions = async (productId: string) => {
    // Type: Hot/Cold/Frappe
    await prisma.menuOptionGroup.create({
      data: {
        productId, name: 'ประเภท (Type)', isRequired: true, maxSelect: 1, sortOrder: 1,
        options: {
          create: [
            { label: 'ร้อน (Hot)', priceAddon: 0, isDefault: true, sortOrder: 1 },
            { label: 'เย็น (Cold)', priceAddon: 10, sortOrder: 2 },
            { label: 'ปั่น (Frappe)', priceAddon: 20, sortOrder: 3 },
          ]
        }
      }
    });

    // Sweetness
    await prisma.menuOptionGroup.create({
      data: {
        productId, name: 'ความหวาน (Sweetness)', isRequired: true, maxSelect: 1, sortOrder: 2,
        options: {
          create: [
            { label: '0% (ไม่หวาน)', priceAddon: 0, sortOrder: 1 },
            { label: '25% (หวานน้อย)', priceAddon: 0, sortOrder: 2 },
            { label: '50% (หวานกลาง)', priceAddon: 0, sortOrder: 3 },
            { label: '100% (ปกติ)', priceAddon: 0, isDefault: true, sortOrder: 4 },
          ]
        }
      }
    });
  };

  // 3. Products Data
  const products = [
    // Standard Coffee
    { id: 'p-ameri', name: 'อเมริกาโน่ (Americano)', price: 40, categoryId: catCoffee.id },
    { id: 'p-espresso', name: 'เอสเพรสโซ่ (Espresso)', price: 40, categoryId: catCoffee.id },
    { id: 'p-cappu', name: 'คาปูชิโน่ (Cappuccino)', price: 40, categoryId: catCoffee.id },
    { id: 'p-latte', name: 'ลาเต้ (Latte)', price: 40, categoryId: catCoffee.id },
    { id: 'p-mocha', name: 'มอคค่า (Mocha)', price: 40, categoryId: catCoffee.id },
    
    // Tea & Milk
    { id: 'p-thai-tea', name: 'ชาไทย (Thai Tea)', price: 40, categoryId: catTeaMilk.id },
    { id: 'p-green-tea-milk', name: 'ชาเขียวนม (Green Tea Milk)', price: 40, categoryId: catTeaMilk.id },
    { id: 'p-green-tea-lemon', name: 'ชาเขียวมะนาว (Green Tea Lemon)', price: 40, categoryId: catTeaMilk.id },
    { id: 'p-green-tea-honey', name: 'ชาเขียวน้ำผึ้ง (Green Tea Honey)', price: 40, categoryId: catTeaMilk.id },
    { id: 'p-matcha-latte', name: 'มัทฉะลาเต้ (Matcha Latte)', price: 40, categoryId: catTeaMilk.id },
    { id: 'p-pure-matcha', name: 'เพียวมัทฉะ (Pure Matcha)', price: 40, categoryId: catTeaMilk.id },
    { id: 'p-fresh-milk', name: 'นมสด (Fresh Milk)', price: 40, categoryId: catTeaMilk.id },
    { id: 'p-green-tea', name: 'ชาเขียว (Green Tea)', price: 40, categoryId: catTeaMilk.id },
    { id: 'p-cocoa', name: 'โกโก้ (Cocoa)', price: 40, categoryId: catTeaMilk.id },
    
    // Refreshment
    { id: 'p-red-soda', name: 'แดงโซดา (Red Soda)', price: 40, categoryId: catRefresh.id },
    { id: 'p-red-lemon', name: 'แดงมะนาว (Red Lemon)', price: 40, categoryId: catRefresh.id },
    { id: 'p-ameri-orange', name: 'อเมริกาโน่น้ำส้ม (Orange Americano)', price: 40, categoryId: catRefresh.id },
    { id: 'p-ameri-honey-lemon', name: 'อเมริกาโน่น้ำผึ้งมะนาว (Honey Lemon Americano)', price: 40, categoryId: catRefresh.id },
    { id: 'p-ameri-sugarcane', name: 'อเมริกาโน่น้ำอ้อย (Sugarcane Americano)', price: 40, categoryId: catRefresh.id },
    { id: 'p-ameri-coconut-flower', name: 'อเมริกาโน่ช่อดอกมะพร้าว (Coconut Flower Americano)', price: 40, categoryId: catRefresh.id },
    { id: 'p-ameri-coconut', name: 'อเมริกาโน่มะพร้าว (Coconut Americano)', price: 40, categoryId: catRefresh.id },
    { id: 'p-matcha-strawberry', name: 'ชามัทฉะสตรอว์เบอร์รี่ (Strawberry Matcha)', price: 40, categoryId: catRefresh.id },
    { id: 'p-matcha-sugarcane', name: 'ชามัทฉะน้ำอ้อย (Sugarcane Matcha)', price: 40, categoryId: catRefresh.id },
    
    // Signature (Assume same base price for simplicity or adjust as needed)
    { id: 'p-sig-coffee-cocoa', name: 'สามสหาย กาแฟท็อปโกโก้', price: 40, categoryId: catSignature.id, tags: JSON.stringify(['Signature']) },
    { id: 'p-sig-coffee-green-tea', name: 'สามสหาย กาแฟท็อปชาเขียว', price: 40, categoryId: catSignature.id, tags: JSON.stringify(['Signature']) },
    { id: 'p-sig-coffee-matcha', name: 'สามสหาย กาแฟท็อปมัทฉะ', price: 40, categoryId: catSignature.id, tags: JSON.stringify(['Signature']) },
    { id: 'p-sig-milk-strawberry', name: 'สามสหาย นมสดสตรอว์เบอร์รี่', price: 40, categoryId: catSignature.id, tags: JSON.stringify(['Signature']) },
  ];

  // 4. Upsert Products and Add Options
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { id: p.id },
      update: { ...p, status: 'AVAILABLE' },
      create: { ...p, status: 'AVAILABLE' }
    });

    // Clear old options to avoid duplicates
    await prisma.menuOption.deleteMany({ where: { group: { productId: p.id } } });
    await prisma.menuOptionGroup.deleteMany({ where: { productId: p.id } });
    
    await createOptions(p.id);
  }

  // 5. Create default branches if not exist
  const branches = [
    { id: 'branch-1', name: '456 Cafe - สาขาหลัก', location: 'Bangkok', address: '123 Coffee St.', isOpen: true },
  ];
  for (const b of branches) {
    await prisma.branch.upsert({ where: { id: b.id }, update: b, create: b });
  }

  console.log('✅ Seeding complete! All 27 items added.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
