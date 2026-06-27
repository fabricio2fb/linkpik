import Badge from "@/components/ui/Badge";

export default function StatusBadge({ value }: { value: string }) {
  if (["Ok", "Ativo", "Pago", "Liberado", "Acesso liberado", "Entregue"].includes(value)) {
    return <Badge tone="success">{value}</Badge>;
  }
  if (["Baixo estoque", "Pendente", "Acesso pendente", "Aguardando etiqueta", "Aguardando postagem", "Em transporte", "Rascunho"].includes(value)) {
    return <Badge tone="warning">{value}</Badge>;
  }
  if (["Esgotado", "Atrasado", "Problema na entrega"].includes(value)) {
    return <Badge tone="danger">{value}</Badge>;
  }
  return <Badge tone="neutral">{value}</Badge>;
}
