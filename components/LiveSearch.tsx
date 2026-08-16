"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
} from "./SearchHistory";

type Product = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  category: string;
  images: string[];
};

export default function LiveSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const totalItems = results.length;

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const fetchResults = useCallback(async (term: string) => {
    if (term.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.products ?? []);
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setActiveIdx(-1);
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 300);
  }

  function handleSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory(addToSearchHistory(trimmed));
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        setOpen(false);
        router.push(`/products/${results[activeIdx].slug}`);
      } else if (query.trim()) {
        handleSearch(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showHistory = open && query.length === 0 && history.length > 0;
  const showResults = open && query.length >= 1;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="ابحث عن منتجات..."
        aria-label="بحث عن منتجات"
        className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 pr-10 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        autoComplete="off"
      />
      <svg
        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {showHistory && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-xs font-bold text-muted">عمليات البحث الأخيرة</span>
            <button
              type="button"
              onClick={() => { clearSearchHistory(); setHistory([]); }}
              className="text-xs font-semibold text-muted transition-colors hover:text-red-400"
            >
              مسح السجل
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto pb-2">
            {history.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  handleSearch(term);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-right transition-colors hover:bg-surface-2"
              >
                <svg className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate text-sm text-fg">{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/40">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted">جاري البحث...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">لا توجد نتائج</div>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto">
                {results.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    onClick={() => {
                      setHistory(addToSearchHistory(query));
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                      i === activeIdx ? "bg-brand-500/10" : "hover:bg-surface-2"
                    }`}
                  >
                    <Image
                      src={p.images[0] ?? "/products/placeholder.svg"}
                      alt={`صورة ${p.name}`}
                      unoptimized
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="tnum text-xs font-bold text-brand-400">
                          {formatPrice(p.priceCents, p.currency)}
                        </span>
                        {p.category && (
                          <span className="text-[10px] text-muted">{p.category}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setHistory(addToSearchHistory(query));
                  setOpen(false);
                }}
                className="block border-t border-line bg-surface-2 px-4 py-2.5 text-center text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                عرض كل النتائج
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
