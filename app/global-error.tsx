"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "sans-serif", background: "#0a0a0f", color: "#e8e8f0", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>حدث خطأ غير متوقع</h2>
          <p style={{ color: "#8888a0", marginBottom: "1.5rem" }}>{error.message || "خطأ غير معروف"}</p>
          <button
            onClick={() => reset()}
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "white", padding: "0.75rem 1.5rem", borderRadius: "12px", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
