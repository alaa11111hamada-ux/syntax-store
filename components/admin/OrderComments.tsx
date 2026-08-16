"use client";

import { useState, useActionState } from "react";
import { addOrderCommentAction, editOrderCommentAction, deleteOrderCommentAction } from "@/app/actions/admin";
import React from "react";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  content: string;
  visible: boolean;
  createdAt: string;
  userName: string;
};

export default function OrderComments({
  orderId,
  comments,
}: {
  orderId: string;
  comments: Comment[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="mb-4 font-bold text-fg">التعليقات ({comments.length})</h3>

      <CommentForm orderId={orderId} />

      {comments.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl border p-3 ${
                c.visible
                  ? "border-brand-500/30 bg-brand-500/5"
                  : "border-line bg-bg"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                <span className="font-semibold">{c.userName}</span>
                <div className="flex items-center gap-2">
                  {c.visible && (
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-green-300">
                      مرئي للعميل
                    </span>
                  )}
                  <span>
                    {new Date(c.createdAt).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              {editingId === c.id ? (
                <EditCommentForm
                  commentId={c.id}
                  orderId={orderId}
                  initialContent={c.content}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm text-fg">{c.content}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(c.id)}
                      className="text-xs text-brand-300 hover:underline"
                    >
                      تعديل
                    </button>
                    <DeleteCommentButton commentId={c.id} orderId={orderId} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditCommentForm({
  commentId,
  orderId,
  initialContent,
  onCancel,
}: {
  commentId: string;
  orderId: string;
  initialContent: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      try {
        await editOrderCommentAction(formData);
        router.refresh();
        return {};
      } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : "حدث خطأ" };
      }
    },
    {} as { error?: string }
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="commentId" value={commentId} />
      <textarea
        name="content"
        rows={3}
        defaultValue={initialContent}
        required
        className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? "جاري الحفظ..." : "حفظ"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-fg hover:bg-surface-2"
        >
          إلغاء
        </button>
      </div>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}

function DeleteCommentButton({ commentId, orderId }: { commentId: string; orderId: string }) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await deleteOrderCommentAction(formData);
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="commentId" value={commentId} />
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-400 hover:underline disabled:opacity-50"
      >
        {pending ? "جاري الحذف..." : "حذف"}
      </button>
    </form>
  );
}

function CommentForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      try {
        await addOrderCommentAction(formData);
        router.refresh();
        return {};
      } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : "حدث خطأ" };
      }
    },
    {} as { error?: string }
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <textarea
        name="content"
        rows={3}
        placeholder="اكتب تعليقاً..."
        required
        className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="visible"
            className="h-4 w-4 accent-brand-600"
          />
          مرئي للعميل
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? "جاري الإضافة..." : "إضافة تعليق"}
        </button>
      </div>
      {state.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
    </form>
  );
}
