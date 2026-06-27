import type { Product } from "@/lib/types";

export type PhysicalOrderStatus =
  | "pending_payment"
  | "paid"
  | "awaiting_label"
  | "label_generated"
  | "awaiting_postage"
  | "posted"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delivery_issue";

export type ShippingOption = {
  id: string;
  name: string;
  price: number;
  days: number;
  description: string;
};

export type PhysicalAddress = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
};

export type PhysicalOrder = {
  buyer: string;
  product: string;
  productValue: number;
  shipping: number;
  total: number;
  status: PhysicalOrderStatus;
  trackingCode: string;
  address: PhysicalAddress;
};

export const physicalDemoProduct: Product & {
  stock: number;
  weight: string;
  width: string;
  height: string;
  length: string;
  originPostalCode: string;
  preparationTime: string;
} = {
  id: "camiseta-pikbio-creator",
  name: "Camiseta Pikbio Creator",
  price: 79.9,
  type: "fisico",
  coverColor: "#22C55E",
  coverGradient: ["#052e16", "#166534"],
  description: "Camiseta premium para criadores que vendem seus produtos com uma loja propria no Pikbio.",
  shortDescription: "Camiseta premium para criadores Pikbio.",
  includes: ["Malha confortavel", "Estampa Pikbio Creator", "Envio com rastreamento"],
  reviews: [],
  active: true,
  status: "active",
  stock: 24,
  weight: "300g",
  width: "20cm",
  height: "5cm",
  length: "25cm",
  originPostalCode: "01001-000",
  preparationTime: "2 dias úteis",
};

export const physicalDemoShippingOptions: ShippingOption[] = [
  { id: "pac", name: "PAC", price: 22.9, days: 7, description: "Entrega econômica dos Correios" },
  { id: "sedex", name: "SEDEX", price: 38.5, days: 3, description: "Entrega rápida dos Correios" },
  { id: "jadlog", name: "Jadlog", price: 26.4, days: 5, description: "Transportadora parceira" },
];

export const physicalDemoOrder: PhysicalOrder = {
  buyer: "Mariana Souza",
  product: "Camiseta Pikbio Creator",
  productValue: 79.9,
  shipping: 22.9,
  total: 102.8,
  status: "in_transit",
  trackingCode: "PKB123456789BR",
  address: {
    street: "Rua das Flores",
    number: "123",
    neighborhood: "Centro",
    city: "São Gonçalo",
    state: "RJ",
    postalCode: "24000-000",
  },
};

export const physicalStatusLabels: Record<PhysicalOrderStatus, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pagamento aprovado",
  awaiting_label: "Preparando envio",
  label_generated: "Etiqueta gerada",
  awaiting_postage: "Aguardando postagem",
  posted: "Pedido postado",
  in_transit: "Em transporte",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  delivery_issue: "Problema na entrega",
};

export const physicalDemoTrackingTimeline: Array<{ status: PhysicalOrderStatus; title: string; description: string; date: string }> = [
  { status: "paid", title: "Pedido pago", description: "Pagamento aprovado e pedido criado.", date: "10/06/2026 10:12" },
  { status: "label_generated", title: "Etiqueta gerada", description: "Etiqueta de envio criada pelo criador.", date: "10/06/2026 15:40" },
  { status: "posted", title: "Produto postado", description: "Pacote entregue ao operador logístico.", date: "11/06/2026 09:20" },
  { status: "in_transit", title: "Em transporte", description: "Pedido em rota para a cidade de destino.", date: "12/06/2026 18:05" },
  { status: "out_for_delivery", title: "Saiu para entrega", description: "Pedido saiu para entrega ao destinatário.", date: "Previsto" },
  { status: "delivered", title: "Entregue", description: "Pedido entregue ao comprador.", date: "Pendente" },
];
