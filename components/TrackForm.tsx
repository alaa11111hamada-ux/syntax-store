"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = value.trim().toUpperCase();
    if (num) router.push(`/orders/${encodeURIComponent(num)}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="SYX-XXXXXX"
        aria-label="رقم الطلب"
        className="tnum flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-center text-fg outline-none focus:border-brand-500 sm:text-right"
      />
      <button
        type="submit"
        className="rounded-xl bg-brand-gradient px-6 py-3 font-bold text-white transition-opacity hover:opacity-95"
      >
        تتبّع
      </button>
    </form>
  );
}
