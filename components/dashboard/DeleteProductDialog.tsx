import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useEffect } from "react";

type DeleteProductDialogProps = {
  open: boolean;
  productName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteProductDialog({
  open,
  productName,
  loading,
  onConfirm,
  onCancel,
}: DeleteProductDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-3" onMouseDown={onCancel}>
      <div
        className="w-full max-w-sm animate-slide-up overflow-hidden rounded-none border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">Excluir produto</h2>
          <button
            type="button"
            onClick={onCancel}
            className="grid size-9 place-items-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)] transition hover:opacity-80"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-red-400/10 text-red-400">
            <AlertTriangle size={28} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Tem certeza que deseja excluir <strong className="text-[var(--text-primary)]">{productName}</strong>?
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="flex gap-3 border-t border-[var(--border-subtle)] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-[10px] border border-[var(--border-subtle)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-elevated)] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
