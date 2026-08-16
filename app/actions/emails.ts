// Email system disabled by admin
"use server";

import { prisma } from "@/lib/prisma";
import {
  orderConfirmationEmail,
  orderStatusEmail,
  deliveryEmail,
} from "@/lib/email";

async function saveEmail(
  to: string,
  subject: string,
  htmlBody: string,
  type: string
) {
  return prisma.sentEmail.create({
    data: { to, subject, htmlBody, type },
  });
}

export async function sendOrderConfirmation(orderId: string) {
  return null;
}

export async function sendOrderStatusUpdate(
  orderId: string,
  newStatus: string
) {
  return null;
}

export async function sendDeliveryEmail(orderId: string) {
  return null;
}
