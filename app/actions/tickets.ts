"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanStr } from "@/lib/validation";

export type TicketState = { error?: string; ok?: boolean };

function genTicketNumber(): string {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TK-";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export async function createTicketAction(
  _prev: TicketState,
  formData: FormData
): Promise<TicketState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const subject = cleanStr(formData.get("subject"), 200);
  const category = cleanStr(formData.get("category"), 50) || "general";
  const message = cleanStr(formData.get("message"), 2000);

  if (subject.length < 3) return { error: "اكتب موضوع التذكرة." };
  if (message.length < 5) return { error: "اكتب رسالتك." };

  const ticketNumber = genTicketNumber();

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId: user.id,
      subject,
      category,
      status: "open",
      priority: "normal",
      messages: {
        create: { userId: user.id, content: message },
      },
    },
  });

  revalidatePath("/account/tickets");
  redirect(`/account/tickets/${ticket.id}`);
}

export async function replyTicketAction(
  _prev: TicketState,
  formData: FormData
): Promise<TicketState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const ticketId = cleanStr(formData.get("ticketId"), 50);
  const content = cleanStr(formData.get("content"), 2000);
  const attachment = formData.get("attachment") as File | null;

  if (!ticketId) return { error: "تذكرة غير معروفة." };
  if (content.length < 2 && (!attachment || attachment.size === 0)) return { error: "اكتب ردك أو أرفق صورة." };

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.userId !== user.id) return { error: "تذكرة غير موجودة." };
  if (ticket.status === "closed") return { error: "التذكرة مغلقة." };

  let attachmentUrl: string | null = null;
  if (attachment && attachment.size > 0) {
    if (attachment.size > 5 * 1024 * 1024) {
      return { error: "حجم الصورة كبير (الحد الأقصى 5 ميجا)." };
    }
    const ext = attachment.name.split(".").pop() || "jpg";
    const rand = Array.from({ length: 16 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
    ).join("");
    const filename = `ticket-${Date.now()}-${rand}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "tickets");
    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await attachment.arrayBuffer());
    await writeFile(path.join(dir, filename), bytes);
    attachmentUrl = `/uploads/tickets/${filename}`;
  }

  await prisma.ticketMessage.create({
    data: { ticketId, userId: user.id, content, attachment: attachmentUrl },
  });

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "replied" },
  });

  revalidatePath(`/account/tickets/${ticketId}`);
  return { ok: true };
}

export async function closeTicketAction(ticketId: string): Promise<TicketState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.userId !== user.id) return { error: "تذكرة غير موجودة." };

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "closed" },
  });

  revalidatePath(`/account/tickets/${ticketId}`);
  return { ok: true };
}

export async function createOrderTicketAction(orderId: string): Promise<{ ok?: boolean; ticketId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "الطلب غير موجود." };
  if (order.userId !== user.id && user.role !== "admin") return { error: "غير مصرح." };

  // التحقق من وجود تذكرة مفتوحة لنفس الطلب
  const existing = await prisma.supportTicket.findFirst({
    where: { userId: user.id, subject: { contains: order.orderNumber } },
  });
  if (existing) {
    return { ok: true, ticketId: existing.id };
  }

  const ticketNumber = genTicketNumber();
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId: user.id,
      subject: `طلب ${order.orderNumber}`,
      category: "order",
      status: "open",
      priority: "normal",
      messages: {
        create: {
          userId: user.id,
          content: `مرحباً، عندى استفسار بخصوص الطلب ${order.orderNumber}.\n\nالاسم: ${order.customerName}\nالموبايل: ${order.customerPhone}`,
        },
      },
    },
  });

  revalidatePath("/account/tickets");
  return { ok: true, ticketId: ticket.id };
}
