"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { approveReview, deleteReview } from "@/lib/reviews";
import { logAudit } from "@/lib/audit";
import { cleanStr } from "@/lib/validation";

export async function approveReviewAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = cleanStr(formData.get("id"), 40);
  if (id) {
    await approveReview(id);
    await logAudit(admin.id, "approve", "review", id);
    revalidatePath("/admin/reviews");
    revalidatePath("/", "layout");
  }
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = cleanStr(formData.get("id"), 40);
  if (id) {
    await deleteReview(id);
    await logAudit(admin.id, "delete", "review", id);
    revalidatePath("/admin/reviews");
    revalidatePath("/", "layout");
  }
}
