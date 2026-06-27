"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: string;
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  maxWidth = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-3" onMouseDown={onClose}>
      <div
        className={`w-full ${maxWidth} animate-slide-up overflow-hidden rounded-none border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl sm:rounded-2xl`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
            <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)] transition hover:opacity-80"
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

