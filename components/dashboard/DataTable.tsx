import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import type { TableColumn, TableRow } from "@/lib/dashboard/types";

type DataTableProps = {
  columns: TableColumn[];
  rows: TableRow[];
  onRowClick?: (row: TableRow) => void;
};

export default function DataTable({ columns, rows, onRowClick }: DataTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-elevated)] text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {rows.map((row, index) => (
              <tr
                key={index}
                className={onRowClick ? "cursor-pointer transition hover:bg-[var(--bg-elevated)]" : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4">
                    {column.render ? column.render(row) : <Cell value={row[column.key]} tone={column.tone} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row, index) => (
          <div
            key={index}
            className={`min-w-0 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 ${onRowClick ? "cursor-pointer" : ""}`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((column) => (
              <div key={column.key} className="flex min-w-0 items-start justify-between gap-4 border-b border-[var(--border-subtle)] py-2 last:border-0">
                <span className="shrink-0 text-xs font-bold uppercase text-[var(--text-tertiary)]">{column.label}</span>
                {column.render ? column.render(row) : <Cell value={row[column.key]} tone={column.tone} compact />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

function Cell({ value, tone = "default", compact = false }: { value: TableRow[string]; tone?: TableColumn["tone"]; compact?: boolean }) {
  if (typeof value !== "string" && typeof value !== "number") return <>{value}</>;
  const text = String(value ?? "");
  if (["Ativo", "Pago", "Acesso liberado", "Liberado", "Ok", "Entregue", "Conectado"].includes(text)) return <Badge tone="success">{text}</Badge>;
  if (["Rascunho", "Pendente", "Acesso pendente", "Baixo estoque", "Aguardando etiqueta", "Em transporte", "Preparando envio"].includes(text)) return <Badge tone="warning">{text}</Badge>;
  if (["Esgotado", "Problema na entrega", "Falhou", "Cancelado", "Reembolsado", "Desconectado"].includes(text)) return <Badge tone="danger">{text}</Badge>;
  if (tone === "success") return <Badge tone="success">{text}</Badge>;
  if (tone === "warning") return <Badge tone="warning">{text}</Badge>;
  if (tone === "danger") return <Badge tone="danger">{text}</Badge>;
  if (tone === "accent") return <span className="min-w-0 break-words text-right font-bold text-[#FF4D6D]">{text}</span>;
  return <span className={`${compact ? "text-right" : ""} min-w-0 break-words font-semibold text-[var(--text-primary)]`}>{text}</span>;
}
