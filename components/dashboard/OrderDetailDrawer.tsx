"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Timeline from "@/components/dashboard/Timeline";

type OrderDetailDrawerProps = {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
};

export default function OrderDetailDrawer({ orderId, open, onClose }: OrderDetailDrawerProps) {
  const [order, setOrder] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<"tracking" | "status" | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [carrier, setCarrier] = useState("");
  const [nextStatus, setNextStatus] = useState("posted");
  const [message, setMessage] = useState("");

  async function loadOrder() {
    if (!orderId) return;
    setLoading(true);
    setMessage("");
    fetch(`/api/dashboard/fisicos/pedidos/${orderId}`, { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => {
        setOrder(payload.data ?? null);
        const shipment = Array.isArray(payload.data?.order_shipments) ? payload.data.order_shipments[0] : payload.data?.order_shipments;
        setTrackingCode(shipment?.tracking_code ?? "");
        setTrackingUrl(shipment?.tracking_url ?? "");
        setCarrier(shipment?.shipping_carrier ?? "");
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!open || !orderId) return;
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  const product = Array.isArray(order?.products) ? order?.products[0] : order?.products;
  const address = Array.isArray(order?.order_shipping_addresses) ? order?.order_shipping_addresses[0] : order?.order_shipping_addresses;
  const shipment = Array.isArray(order?.order_shipments) ? order?.order_shipments[0] : order?.order_shipments;
  const events = Array.isArray(order?.order_tracking_events) ? order?.order_tracking_events : [];
  const timeline = events.map((event: Record<string, unknown>) => String(event.title ?? event.status ?? "Evento"));

  async function saveTracking() {
    if (!orderId || !trackingCode.trim()) {
      setMessage("Informe o codigo de rastreio.");
      return;
    }
    setSaving("tracking");
    setMessage("");
    try {
      const response = await fetch(`/api/dashboard/fisicos/pedidos/${orderId}/tracking`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_code: trackingCode.trim(),
          tracking_url: trackingUrl.trim() || null,
          carrier: carrier.trim() || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error ?? "Nao foi possivel salvar o rastreio.");
        return;
      }
      setMessage("Rastreio salvo.");
      await loadOrder();
    } finally {
      setSaving(null);
    }
  }

  async function updateStatus() {
    if (!orderId) return;
    setSaving("status");
    setMessage("");
    try {
      const response = await fetch(`/api/dashboard/fisicos/pedidos/${orderId}/shipping-status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, description: "Status atualizado pelo criador." }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error ?? "Nao foi possivel atualizar o status.");
        return;
      }
      setMessage("Status atualizado.");
      await loadOrder();
    } finally {
      setSaving(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do pedido fisico" maxWidth="max-w-2xl">
      <div className="grid max-h-[82vh] gap-4 overflow-y-auto p-5 store-scrollbar">
        {loading && <p className="text-sm text-[var(--text-secondary)]">Carregando pedido...</p>}
        {!loading && !order && <p className="text-sm text-[var(--text-secondary)]">Pedido nao encontrado.</p>}
        {order && (
          <>
            <Card className="border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-4">
              <p className="text-sm font-bold text-[var(--text-primary)]">Voce e responsavel por embalar e postar este pedido.</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Depois de postar, adicione o codigo de rastreio para o cliente acompanhar pelo link seguro.
              </p>
            </Card>
            <div className="grid gap-3 md:grid-cols-2">
              <Info title="Cliente" lines={[String(order.buyer_name ?? "Cliente"), String(order.buyer_email ?? "Email nao informado")]} />
              <Info title="Endereco" lines={address ? [`${address.street}, ${address.number}`, `${address.neighborhood}, ${address.city}/${address.state}`, `CEP ${address.zipcode}`] : ["Endereco nao informado"]} />
              <Info title="Produto" lines={[String(product?.title ?? "Produto"), "1 unidade", `Total: R$ ${Number(order.amount ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]} />
              <Info title="Pagamento e frete" lines={[`Pagamento: ${order.status}`, `Frete: ${shipment?.shipping_method ?? "-"}`, `Rastreio: ${shipment?.tracking_code ?? "Nao informado"}`]} />
            </div>
            <Card className="p-4">
              <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">Timeline do pedido</h3>
              <div className="mt-4">
                {timeline.length ? <Timeline steps={timeline} activeIndex={timeline.length - 1} /> : <p className="text-sm text-[var(--text-secondary)]">Nenhum evento de rastreio ainda.</p>}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">Rastreio manual</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Input label="Codigo de rastreio" value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="PKB123456789BR" />
                <Input label="Transportadora" value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="Correios" />
                <Input label="URL de rastreio" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://..." />
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" disabled={!shipment} loading={saving === "tracking"} onClick={saveTracking}>Adicionar codigo de rastreio</Button>
                <select
                  className="h-11 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm font-semibold text-[var(--text-primary)]"
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                >
                  <option value="posted">Marcar como postado</option>
                  <option value="in_transit">Marcar em transporte</option>
                  <option value="out_for_delivery">Marcar saiu para entrega</option>
                  <option value="delivered">Marcar como entregue</option>
                  <option value="delivery_issue">Problema na entrega</option>
                </select>
                <Button variant="secondary" disabled={!shipment} loading={saving === "status"} onClick={updateStatus}>Atualizar status</Button>
              </div>
              {message && <p className="mt-3 text-sm font-semibold text-[var(--text-secondary)]">{message}</p>}
            </Card>
          </>
        )}
      </div>
    </Modal>
  );
}

function Info({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase text-[var(--text-tertiary)]">{title}</p>
      <div className="mt-3 grid gap-1">
        {lines.map((line) => <p key={line} className="text-sm font-semibold text-[var(--text-primary)]">{line}</p>)}
      </div>
    </Card>
  );
}
