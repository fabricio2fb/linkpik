import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/dashboard/StatusBadge";
import type { KanbanColumn } from "@/lib/dashboard/types";

export default function KanbanBoard({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[980px] grid-cols-5 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{column.title}</h3>
              <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-1 text-xs font-bold text-[var(--text-secondary)]">{column.cards.length}</span>
            </div>
            <div className="grid gap-3">
              {column.cards.length ? column.cards.map((card) => (
                <Card key={card.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-[var(--text-primary)]">{card.title}</p>
                    <StatusBadge value={card.meta} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{card.subtitle}</p>
                  {card.action && <Button variant="secondary" className="mt-3 h-9 w-full">{card.action}</Button>}
                </Card>
              )) : (
                <p className="rounded-[8px] border border-dashed border-[var(--border-subtle)] p-4 text-sm text-[var(--text-secondary)]">Nenhum item.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
