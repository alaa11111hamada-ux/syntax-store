"use client";

import { useState, useEffect } from "react";

type Props = {
  userId: string;
  vapidPublicKey: string;
};

export default function PushNotificationManager({ userId, vapidPublicKey }: Props) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      setSubscribed(false);
    }
  }

  async function subscribe() {
    setLoading(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setMsg("تم رفض الإذن. ممكن تفعّله من إعدادات المتصفح.");
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      });

      setSubscribed(true);
      setMsg("تم تفعيل الإشعارات بنجاح!");
    } catch (e) {
      setMsg("حدث خطأ أثناء تفعيل الإشعارات.");
    }
    setLoading(false);
  }

  async function unsubscribe() {
    setLoading(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("تم إلغاء تفعيل الإشعارات.");
    } catch {
      setMsg("حدث خطأ أثناء إلغاء الإشعارات.");
    }
    setLoading(false);
  }

  if (!supported) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        المتصفح الحالي لا يدعم الإشعارات.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-fg">إشعارات الدفع (Push)</h3>
          <p className="mt-1 text-sm text-muted">
            احصل على إشعارات فورية لحالات طلبك والعروض الخاصة.
          </p>
        </div>
        {subscribed ? (
          <button
            type="button"
            onClick={unsubscribe}
            disabled={loading}
            className="shrink-0 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
          >
            {loading ? "جاري..." : "إيقاف"}
          </button>
        ) : (
          <button
            type="button"
            onClick={subscribe}
            disabled={loading}
            className="shrink-0 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "جاري..." : "تفعيل الإشعارات"}
          </button>
        )}
      </div>

      {msg && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
          {msg}
        </p>
      )}
    </div>
  );
}
