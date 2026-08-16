"use client";

import { useState, useEffect } from "react";

type Props = {
  qty: number;
  min?: number;
  max?: number;
  onChange: (qty: number) => void;
};

export default function CartItemQuantity({ qty, min = 1, max = 99, onChange }: Props) {
  const [val, setVal] = useState(qty);

  useEffect(() => {
    setVal(qty);
  }, [qty]);

  function handleChange(v: number) {
    const clamped = Math.min(max, Math.max(min, v));
    setVal(clamped);
    onChange(clamped);
  }

  return (
    <div className="flex items-center rounded-lg border border-line bg-surface transition-colors">
      <button
        type="button"
        onClick={() => handleChange(val - 1)}
        disabled={val <= min}
        className="grid h-8 w-8 place-items-center rounded-lg font-bold text-fg transition-colors hover:bg-surface-2 disabled:text-muted/40"
        aria-label="نقص الكمية"
      >
        −
      </button>
      <input
        type="number"
        value={val}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) handleChange(v);
        }}
        onBlur={() => {
          if (val < min) handleChange(min);
          if (val > max) handleChange(max);
        }}
        className="tnum w-10 bg-transparent text-center text-sm font-bold text-fg outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        min={min}
        max={max}
      />
      <button
        type="button"
        onClick={() => handleChange(val + 1)}
        disabled={val >= max}
        className="grid h-8 w-8 place-items-center rounded-lg font-bold text-fg transition-colors hover:bg-surface-2 disabled:text-muted/40"
        aria-label="زود الكمية"
      >
        +
      </button>
    </div>
  );
}
