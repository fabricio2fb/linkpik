"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";

type Props = {
  postId: string;
  postTitle: string;
};

export default function DeletePostButton({ postId, postTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText === "EXCLUIR";

  async function handleDelete() {
    if (!canDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToast("Post excluido");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 size={16} />
      </button>
      <Modal open={open} title="Excluir post" onClose={() => { setOpen(false); setConfirmText(""); }} maxWidth="max-w-md">
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Esta acao e permanente.</p>
            <p className="mt-1">
              O post &ldquo;{postTitle}&rdquo; sera excluido.
            </p>
          </div>

          <div className="text-sm text-gray-700">
            <p className="font-medium">Digite <span className="font-bold">EXCLUIR</span> para confirmar:</p>
          </div>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='EXCLUIR'
            className="input-base h-11 px-3"
            autoComplete="off"
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirmText(""); }}
              className="inline-flex h-11 items-center rounded-[10px] border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || loading}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Excluindo..." : "Excluir post"}
            </button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}
