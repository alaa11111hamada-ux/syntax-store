import type { Metadata } from "next";
import EnhancedTrackForm from "@/components/EnhancedTrackForm";
import TrackIcon from "@/components/TrackIcon";

export const metadata: Metadata = { title: "تتبّع طلب" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center">
        <TrackIcon />
        <h1 className="mt-6 text-2xl font-extrabold text-fg">تتبّع طلبك</h1>
        <p className="mt-2 text-muted">
          اكتب رقم الطلب (بيبدأ بـ SYX-) وشوف حالته على طول.
        </p>
      </div>
      <div className="mt-8">
        <EnhancedTrackForm />
      </div>
    </div>
  );
}
