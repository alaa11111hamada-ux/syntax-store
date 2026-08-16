import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getSettings();
  const message = settings.maintenance_message || "المتجر تحت الصيانة — هنرجع قريب إن شاء الله!";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-600/15">
        <svg className="h-10 w-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.384 3.08A1 1 0 014.6 17.3V5.7a1 1 0 011.44-.95l5.384 3.08a1 1 0 010 1.74z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.84 10.11a1 1 0 01-.13 1.41l-5.38 3.08a1 1 0 01-1.01 0l-5.38-3.08A1 1 0 016 10.42" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-fg">المتجر تحت الصيانة</h1>
      <p className="mt-3 max-w-md text-muted">{message}</p>
      <p className="mt-6 text-sm text-muted">حاول تاني بعد شوية إن شاء الله.</p>
    </div>
  );
}
