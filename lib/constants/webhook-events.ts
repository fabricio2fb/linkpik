export const WEBHOOK_EVENTS = {
  ORDER_PENDING: "order.pending",
  ORDER_PAID: "order.paid",
  ORDER_REFUSED: "order.refused",
  ORDER_CANCELED: "order.canceled",
  ORDER_REFUNDED: "order.refunded",
  ACCESS_GRANTED: "access.granted",
  WEBHOOK_TEST: "webhook.test",
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  [WEBHOOK_EVENTS.ORDER_PENDING]: "Pagamento pendente",
  [WEBHOOK_EVENTS.ORDER_PAID]: "Pagamento confirmado",
  [WEBHOOK_EVENTS.ORDER_REFUSED]: "Pagamento recusado",
  [WEBHOOK_EVENTS.ORDER_CANCELED]: "Pedido cancelado",
  [WEBHOOK_EVENTS.ORDER_REFUNDED]: "Reembolso realizado",
  [WEBHOOK_EVENTS.ACCESS_GRANTED]: "Acesso liberado",
  [WEBHOOK_EVENTS.WEBHOOK_TEST]: "Teste de webhook",
};

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  WEBHOOK_EVENTS.ORDER_PENDING,
  WEBHOOK_EVENTS.ORDER_PAID,
  WEBHOOK_EVENTS.ORDER_REFUSED,
  WEBHOOK_EVENTS.ORDER_CANCELED,
  WEBHOOK_EVENTS.ORDER_REFUNDED,
  WEBHOOK_EVENTS.ACCESS_GRANTED,
];
