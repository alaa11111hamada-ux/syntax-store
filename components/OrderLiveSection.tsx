"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText } from "lucide-react";

type DownloadFile = {
  name: string;
  url: string;
};

type Comment = {
  id: string;
  content: string;
  visible: boolean;
  createdAt: string;
  userName: string;
};

type Props = {
  orderId: string;
  initialStatus: string;
  orderNumber: string;
  downloadFiles: DownloadFile[];
  onStatusChange?: (newStatus: string) => void;
  onCommentsChange?: (comments: Comment[]) => void;
};

const POLL_INTERVAL = 10_000;

export default function OrderLiveSection({
  orderId,
  initialStatus,
  downloadFiles: initialFiles,
  onStatusChange,
  onCommentsChange,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const prevStatus = useRef(initialStatus);
  const [files, setFiles] = useState(initialFiles);

  // No dynamic fetch needed — files are passed from server with auth-based URLs

  // Polling — تحديث الحالة تلقائياً + التعليقات
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [statusRes, commentsRes] = await Promise.all([
          fetch(`/api/order-status/${orderId}`, { cache: "no-store" }),
          fetch(`/api/order-comments/${orderId}`, { cache: "no-store" }),
        ]);
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.status && data.status !== prevStatus.current) {
            setStatus(data.status);
            onStatusChange?.(data.status);
            setToastMsg(
              data.status === "delivered"
                ? "تم تسليم طلبك! يمكنك تحميل المنتجات الآن."
                : `تم تحديث حالة الطلب إلى: ${statusLabel(data.status)}`
            );
            setShowToast(true);
            prevStatus.current = data.status;
          }
        }
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          if (data.comments) {
            onCommentsChange?.(data.comments);
          }
        }
      } catch {}
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [orderId]);

  // Toast auto-hide
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(t);
  }, [showToast]);

  const isDelivered = status === "delivered";

  return (
    <>
      {/* Toast */}
      {showToast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl border border-brand-500/40 bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* قسم التحميل */}
      {isDelivered && files.length > 0 && (
        <section className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-fg"><Download className="h-5 w-5" /> تحميل المنتجات الرقمية</h2>
          <p className="mb-4 text-sm text-muted">
            اضغط على الزر لتحميل الملف مباشرة.
          </p>
          <div className="flex flex-col gap-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-400" />
                  <p className="text-sm font-semibold text-fg">{file.name}</p>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" />
                  تحميل
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {isDelivered && files.length === 0 && (
        <section className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-fg"><Download className="h-5 w-5" /> تحميل المنتجات الرقمية</h2>
          <p className="text-sm text-muted">تم تسليم طلبك بنجاح.</p>
        </section>
      )}

      {/* مؤشّر التحديث الحي */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        تحديث مباشر كل {POLL_INTERVAL / 1000} ثانية
      </div>
    </>
  );
}

function statusLabel(s: string): string {
  const labels: Record<string, string> = {
    pending: "قيد المراجعة",
    confirmed: "مؤكّد",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    returned: "مرتجع",
  };
  return labels[s] ?? s;
}
