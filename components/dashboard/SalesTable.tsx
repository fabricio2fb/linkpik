import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import type { Sale } from "@/lib/types";
import { formatPrice, maskEmail } from "@/lib/utils";

type SalesTableProps = {
  sales: Sale[];
  compact?: boolean;
};

export default function SalesTable({ sales, compact = false }: SalesTableProps) {
  function upsellName(productId?: string) {
    return productId ? "produto upsell" : undefined;
  }

  return (
    <Card className="overflow-hidden">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-elevated)] text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            <tr>
              {!compact && <th className="px-5 py-4">#ID</th>}
              <th className="px-5 py-4">Produto</th>
              <th className="px-5 py-4">Comprador</th>
              <th className="px-5 py-4">{compact ? "Valor" : "Bruto"}</th>
              {!compact && <th className="px-5 py-4">Taxa Pikbio</th>}
              {!compact && <th className="px-5 py-4">Liquido</th>}
              {!compact && <th className="px-5 py-4">Metodo</th>}
              <th className="px-5 py-4">{compact ? "Data" : "Data/Hora"}</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {sales.map((sale) => (
              <tr key={sale.id}>
                {!compact && <td className="px-5 py-4 font-semibold text-[var(--text-secondary)]">{sale.id}</td>}
                <td className="px-5 py-4 font-semibold text-[var(--text-primary)]">
                  {sale.product}
                  {sale.upsellProductId && (
                    <span title={`Comprou tambem: ${upsellName(sale.upsellProductId) ?? "produto upsell"}`} className="ml-2 inline-flex rounded-full bg-[#FF4D6D]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF4D6D]">
                      + upsell
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{maskEmail(sale.buyer)}</td>
                <td className="px-5 py-4 font-bold text-[var(--text-primary)]">{formatPrice(sale.value)}</td>
                {!compact && <td className="px-5 py-4 font-bold text-[#FF4D6D]">{formatPrice(sale.fee ?? 0)}</td>}
                {!compact && <td className="px-5 py-4 font-bold text-[#22C55E]">{formatPrice(sale.net ?? sale.value - (sale.fee ?? 0))}</td>}
                {!compact && <td className="px-5 py-4 text-[var(--text-secondary)]">{sale.method}</td>}
                <td className="px-5 py-4 text-[var(--text-secondary)]">{sale.date}</td>
                <td className="px-5 py-4">
                  <Badge tone={sale.status === "Pago" ? "success" : "warning"}>{sale.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {sales.map((sale) => (
          <div key={sale.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-[var(--text-primary)]">
                  {sale.product}
                  {sale.upsellProductId && <span className="ml-2 rounded-full bg-[#FF4D6D]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF4D6D]">+ upsell</span>}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{maskEmail(sale.buyer)}</p>
              </div>
              <Badge tone={sale.status === "Pago" ? "success" : "warning"}>{sale.status}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Amount label="Bruto" value={sale.value} />
              <Amount label="Taxa" value={sale.fee ?? 0} tone="fee" />
              <Amount label="Liquido" value={sale.net ?? sale.value - (sale.fee ?? 0)} tone="net" />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{sale.method}</span>
              <span className="text-[var(--text-secondary)]">{sale.date}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Amount({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "fee" | "net" }) {
  const className = tone === "fee" ? "text-[#FF4D6D]" : tone === "net" ? "text-[#22C55E]" : "text-[var(--text-primary)]";

  return (
    <div>
      <p className="text-xs font-bold uppercase text-[var(--text-tertiary)]">{label}</p>
      <p className={`mt-1 font-bold ${className}`}>{formatPrice(value)}</p>
    </div>
  );
}
