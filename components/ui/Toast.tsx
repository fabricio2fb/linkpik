type ToastProps = {
  message: string | null;
};

export default function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[90] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 animate-slide-up rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 px-5 py-3 text-center text-sm font-semibold text-[var(--text-primary)] shadow-2xl backdrop-blur">
      {message}
    </div>
  );
}

