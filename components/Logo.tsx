import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { getSettings } from "@/lib/settings";

export default async function Logo({ className = "" }: { className?: string }) {
  const settings = await getSettings();
  const name = settings.store_name || site.name;

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="text-lg font-extrabold leading-none">
        <span className="text-gradient">{name}</span>
      </span>
      <Image src="/logo.png" alt={`شعار ${name}`} width={48} height={48} className="h-12 w-12 rounded-lg object-contain" />
    </Link>
  );
}
