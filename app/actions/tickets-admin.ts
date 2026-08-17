"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cleanStr } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/upload";

export type AdminTicketState = { error?: string; ok?: boolean };

export async function replyTicketAdminAction(
  _prev: AdminTicketState,
  formData: FormData
): Promise<AdminTicketState> {
  await requireAdmin();
  const ticketId = cleanStr(formData.get("ticketId"), 50);
  const content = cleanStr(formData.get("content"), 2000);
  const attachment = formData.get("attachment") as File | null;

  if (!ticketId) return { error: "تذكرة غير معروفة." };
  if (content.length < 2 && (!attachment || attachment.size === 0)) return { error: "اكتب ردك أو أرفق صورة." };

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "تذكرة غير موجودة." };

  let attachmentUrl: string | null = null;
  if (attachment && attachment.size > 0) {
    try {
      attachmentUrl = await saveImage(attachment, "tickets");
    } catch (e) {
      return { error: e instanceof Error ? e.message : "فشل رفع المرفق." };
    }
  }

  await prisma.ticketMessage.create({
    data: { ticketId, content, attachment: attachmentUrl },
  });

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "replied" },
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  return { ok: true };
}

export async function updateTicketStatusAction(
  ticketId: string,
  status: string
): Promise<AdminTicketState> {
  await requireAdmin();
  if (!["open", "replied", "closed"].includes(status))
    return { error: "حالة غير صالحة." };

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "تذكرة غير موجودة." };

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  return { ok: true };
}

export async function updateTicketPriorityAction(
  ticketId: string,
  priority: string
): Promise<AdminTicketState> {
  await requireAdmin();
  if (!["low", "normal", "high", "urgent"].includes(priority))
    return { error: "أولوية غير صالحة." };

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "تذكرة غير موجودة." };

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { priority },
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  return { ok: true };
}
