import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, family: 4 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('Admin@12345', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@syntax.eg' },
    update: { role: 'admin', passwordHash: hash },
    create: { name: 'أدمن المتجر', email: 'admin@syntax.eg', passwordHash: hash, role: 'admin' },
  });
  console.log('Admin:', user.id);
  
  const products = [
    { slug: 'course-fullstack', name: 'كورس فُل-ستاك من الصفر للاحتراف', shortDesc: 'أكتر من 40 ساعة عملي + مشاريع حقيقية', description: 'كورس شامل يمشي معاك خطوة بخطوة من أساسيات الويب لحد ما تبني وتنشر مشاريع كاملة.', priceCents: 79900, compareAtCents: 149900, images: '[]', featured: true },
    { slug: 'ebook-freelance', name: 'كتاب: دليل الفريلانسر المصري', shortDesc: 'PDF عملي لبدء دخلك بالدولار', description: 'دليل عملي (PDF) بيشرح إزاي تبدأ شغل حر.', priceCents: 14900, compareAtCents: 24900, images: '[]', featured: true },
    { slug: 'notebook-dev', name: 'نوتة المبرمج الأنيقة', shortDesc: 'نوتة A5 غلاف صلب + تصميم خاص', description: 'نوتة عملية بغلاف صلب وورق فاخر.', priceCents: 18000, compareAtCents: null, images: '[]', featured: true },
    { slug: 'tshirt-code', name: 'تيشيرت It works on my machine', shortDesc: 'قطن 100% — مقاسات متعددة', description: 'تيشيرت قطن مريح بطبعة عالية الجودة.', priceCents: 29900, compareAtCents: 39900, images: '[]', featured: true },
    { slug: 'template-portfolio', name: 'قالب بورتفوليو جاهز (Next.js)', shortDesc: 'قالب احترافي تنشره في دقايق', description: 'قالب بورتفوليو جاهز بتقنية Next.js + Tailwind.', priceCents: 24900, compareAtCents: null, images: '[]', featured: true },
    { slug: 'mug-coffee', name: 'مج القهوة while(alive) code()', shortDesc: 'سيراميك 350ml — يدخل الميكروويف', description: 'مج سيراميك بجودة عالية وطبعة ثابتة.', priceCents: 12000, compareAtCents: 16000, images: '[]', featured: false },
  ];
  
  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: p, create: p });
    console.log('  ✓', p.name);
  }
  console.log('All seeded!');
  
  await prisma['$disconnect']();
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
