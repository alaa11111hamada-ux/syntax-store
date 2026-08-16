"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function updateCustomerNotes(userId: string, notes: string) {
  await requireAdmin();
  return prisma.user.update({ where: { id: userId }, data: { notes } });
}

export async function toggleCustomerBlock(userId: string, blocked: boolean) {
  await requireAdmin();
  return prisma.user.update({ where: { id: userId }, data: { blocked } });
}
