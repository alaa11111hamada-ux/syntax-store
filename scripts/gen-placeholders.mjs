// يولّد صور SVG بديلة للمنتجات (للتطوير فقط)
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "products");
mkdirSync(outDir, { recursive: true });

const items = [
  { file: "course-fullstack", label: "كورس فُل-ستاك", icon: "🎓", a: "#6d28d9", b: "#4c1d95" },
  { file: "ebook-freelance", label: "دليل الفريلانسر", icon: "📘", a: "#2563eb", b: "#1e3a8a" },
  { file: "notebook-dev", label: "نوتة المبرمج", icon: "📓", a: "#0d9488", b: "#134e4a" },
  { file: "tshirt-code", label: "تيشيرت", icon: "👕", a: "#db2777", b: "#831843" },
  { file: "template-portfolio", label: "قالب بورتفوليو", icon: "🧩", a: "#ea580c", b: "#7c2d12" },
  { file: "mug-coffee", label: "مج القهوة", icon: "☕", a: "#ca8a04", b: "#713f12" },
];

for (const it of items) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${it.a}"/>
      <stop offset="1" stop-color="${it.b}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="400" cy="320" r="150" fill="rgba(255,255,255,0.10)"/>
  <text x="400" y="380" font-size="180" text-anchor="middle" dominant-baseline="middle">${it.icon}</text>
  <text x="400" y="560" font-size="52" font-family="Tahoma, Arial, sans-serif" fill="#ffffff" text-anchor="middle" font-weight="bold">${it.label}</text>
</svg>`;
  writeFileSync(join(outDir, `${it.file}.svg`), svg, "utf8");
  console.log("✓", it.file);
}
console.log("Done.");
