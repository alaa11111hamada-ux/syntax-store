import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-extrabold text-fg">العملاء</h2>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          لسه مفيش عملاء مسجّلين.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="font-bold text-fg">
                  {u.name}
                  {u.role === "admin" && (
                    <span className="ms-2 rounded-full bg-brand-600/20 px-2 py-0.5 text-xs text-brand-200">
                      أدمن
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted">
                  {u.email}
                  {u.phone && <span className="tnum"> · {u.phone}</span>}
                </p>
              </div>
              <span className="tnum shrink-0 rounded-full border border-line bg-bg px-3 py-1 text-sm text-fg">
                {u._count.orders} طلب
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
