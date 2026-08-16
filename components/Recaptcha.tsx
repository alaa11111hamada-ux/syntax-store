"use client";

import { useState, useEffect, useCallback } from "react";

type MathProblem = {
  a: number;
  b: number;
  operator: "+" | "-" | "×";
  answer: number;
  displayA: string;
  displayB: string;
  displayAnswer: string;
};

const ARABIC_NUMBERS: Record<number, string> = {
  0: "٠",
  1: "١",
  2: "٢",
  3: "٣",
  4: "٤",
  5: "٥",
  6: "٦",
  7: "٧",
  8: "٨",
  9: "٩",
};

function toArabicNumeral(n: number): string {
  return String(n)
    .split("")
    .map((d) => ARABIC_NUMBERS[parseInt(d)] ?? d)
    .join("");
}

function generateProblem(): MathProblem {
  const operators: ("+" | "-" | "×")[] = ["+", "-", "×"];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let a: number, b: number, answer: number;

  switch (operator) {
    case "+":
      a = Math.floor(Math.random() * 15) + 1;
      b = Math.floor(Math.random() * 15) + 1;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * Math.min(a, 10)) + 1;
      answer = a - b;
      break;
    case "×":
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  return {
    a,
    b,
    operator,
    answer,
    displayA: toArabicNumeral(a),
    displayB: toArabicNumeral(b),
    displayAnswer: toArabicNumeral(answer),
  };
}

type Props = {
  onVerified: (verified: boolean) => void;
  className?: string;
};

export default function Recaptcha({ onVerified, className = "" }: Props) {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setProblem(generateProblem());
  }, []);

  const verify = useCallback(() => {
    if (!problem) return;
    const trimmed = userAnswer.trim();
    const arabicToLatin = trimmed
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    const num = parseInt(arabicToLatin, 10);
    if (num === problem.answer) {
      setVerified(true);
      setError(false);
      onVerified(true);
    } else {
      setError(true);
      setVerified(false);
      onVerified(false);
      // Regenerate after wrong answer
      setTimeout(() => {
        setProblem(generateProblem());
        setUserAnswer("");
        setError(false);
      }, 800);
    }
  }, [problem, userAnswer, onVerified]);

  if (verified) {
    return (
      <div className={`flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-300 ${className}`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        تم التحقق بنجاح
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className={`rounded-xl border border-line bg-bg p-4 ${className}`}>
      <label className="mb-2 block text-sm font-semibold text-fg">
        أثبت أنك لست روبوت 🤖
      </label>
      <div className="flex items-center gap-3">
        <span className="rounded-lg border border-brand-500/40 bg-brand-600/10 px-4 py-2 text-lg font-bold text-fg">
          {problem.displayA} {problem.operator === "+" ? "+" : problem.operator === "-" ? "-" : "×"} {problem.displayB} = ؟
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={userAnswer}
          onChange={(e) => {
            setUserAnswer(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && verify()}
          placeholder="الإجابة"
          className={`w-20 rounded-lg border bg-bg px-3 py-2 text-center text-fg outline-none focus:border-brand-500 ${
            error ? "border-red-500 animate-pulse" : "border-line"
          }`}
          maxLength={4}
        />
        <button
          type="button"
          onClick={verify}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
        >
          تحقق
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400">إجابة خاطئة، جرّب تاني.</p>
      )}
    </div>
  );
}
