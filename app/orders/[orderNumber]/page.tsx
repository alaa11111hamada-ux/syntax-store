import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getOrderByNumber } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatusBadge, OrderTimeline } from "@/components/OrderStatus";
import PurchaseTracker from "@/components/PurchaseTracker";
import OrderDetailClient from "@/components/OrderDetailClient";
import { getPaymentMethodById } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `الطلب ${decodeURIComponent(orderNumber)}` };
}

export default async function OrderPage({ params }: Params) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(decodeURIComponent(orderNumber));

  if (!order) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-surface">
          <Search className="h-8 w-8 text-muted" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-fg">
          مفيش طلب بالرقم ده
        </h1>
        <p className="mt-2 text-muted">اتأكد من رقم الطلب وجرّب تاني.</p>
        <Link
          href="/track"
          className="mt-6 rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white transition-opacity hover:opacity-95"
        >
          تتبّع طلب
        </Link>
      </div>
    );
  }

  const { prisma } = await import("@/lib/prisma");
  const allComments = await prisma.orderComment.findMany({
    where: { orderId: order.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const user = await getCurrentUser();
  const isOwnerOrAdmin =
    (order.userId && user?.id === order.userId) || user?.role === "admin" || user?.role === "manager";

  const paymentMethod = await getPaymentMethodById(order.paymentMethod);

  // جلب ملفات المنتجات للتحميل المباشر — روابط مربطة بالحساب والطلب
  let downloadFiles: { name: string; url: string }[] = [];
  if (isOwnerOrAdmin) {
    const productIds = order.items
      .map((i) => i.productId)
      .filter((id): id is string => !!id);
    if (productIds.length > 0) {
      const products = await import("@/lib/prisma").then((m) =>
        m.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { name: true, fileUrl: true, fileName: true, files: true },
        })
      );
      for (const p of products) {
        if (p.fileUrl) {
          downloadFiles.push({
            name: p.fileName || p.name,
            url: `/api/download?orderId=${order.id}&productName=${encodeURIComponent(p.fileName || p.name)}&fileUrl=${encodeURIComponent(p.fileUrl)}`,
          });
        }
        try {
          const extraFiles = JSON.parse(p.files);
          if (Array.isArray(extraFiles)) {
            for (const f of extraFiles) {
              if (f && typeof f.name === "string" && typeof f.url === "string") {
                downloadFiles.push({
                  name: f.name,
                  url: `/api/download?orderId=${order.id}&productName=${encodeURIComponent(f.name)}&fileUrl=${encodeURIComponent(f.url)}`,
                });
              }
            }
          }
        } catch {}
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* حدث Purchase للبكسلات — بيطلق مرة واحدة بعد إتمام الطلب مباشرة */}
      <PurchaseTracker
        orderNumber={order.orderNumber}
        valueEgp={(order.totalCents || order.subtotalCents) / 100}
      />

      <OrderDetailClient
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          address: order.address,
          paymentMethod: order.paymentMethod,
          proofImage: order.proofImage,
          note: order.note,
          subtotalCents: order.subtotalCents,
          totalCents: order.totalCents,
          discountCents: order.discountCents,
          couponCode: order.couponCode,
          items: order.items.map((i) => ({ id: i.id, name: i.name, priceCents: i.priceCents, qty: i.qty })),
          comments: allComments.filter((c) => c.visible).map((c) => ({
            id: c.id,
            content: c.content,
            visible: c.visible,
            createdAt: c.createdAt.toISOString(),
            userName: c.user?.name ?? "المتجر",
          })),
        }}
        paymentMethod={paymentMethod ? { name: paymentMethod.name, fields: paymentMethod.fields } : null}
        downloadFiles={downloadFiles}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />
    </div>
  );
}
