import { z } from "zod";

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().max(40).optional(),
  type: z.string().max(40).optional(),
  period: z.enum(["7", "30", "90", "all"]).default("30"),
  search: z.string().trim().max(120).optional(),
}).strict();

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export function startDateForPeriod(period: PaginationQuery["period"]) {
  if (period === "all") return null;
  const date = new Date();
  date.setDate(date.getDate() - Number(period));
  return date.toISOString();
}

export function isPhysicalProduct(product?: { product_kind?: string | null; type?: string | null } | null) {
  return product?.product_kind === "physical" || product?.type === "fisico";
}

export function isDigitalProduct(product?: { product_kind?: string | null; type?: string | null } | null) {
  return !isPhysicalProduct(product);
}

export function maskEmail(value?: string | null) {
  if (!value || !value.includes("@")) return "";
  const [name, domain] = value.split("@");
  const safeName = name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
  return `${safeName}@${domain}`;
}

export function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function orderStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    failed: "Falhou",
    canceled: "Cancelado",
    refunded: "Reembolsado",
  };
  return labels[status ?? ""] ?? "Pendente";
}

export function shipmentStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    awaiting_payment: "Aguardando pagamento",
    paid: "Pago",
    awaiting_preparation: "Preparando envio",
    awaiting_label: "Aguardando etiqueta",
    label_generated: "Etiqueta gerada",
    awaiting_postage: "Aguardando postagem",
    posted: "Postado",
    in_transit: "Em transporte",
    out_for_delivery: "Saiu para entrega",
    delivered: "Entregue",
    delivery_issue: "Problema na entrega",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };
  return labels[status ?? ""] ?? "Aguardando pagamento";
}
