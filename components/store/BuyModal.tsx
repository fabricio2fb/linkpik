"use client";

import { Check, Copy, ExternalLink, MapPin, PackageCheck, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { PRODUCT_TYPES } from "@/lib/product-types";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type BuyModalProps = {
  product: Product | null;
  products?: Product[];
  username?: string;
  accentColor: string;
  onClose: () => void;
  onToast: (message: string) => void;
  stayInModal?: boolean;
  embedded?: boolean;
};

type Step = "form" | "redirect" | "pix" | "success";
type ShippingQuote = {
  id: "pac" | "sedex" | "jadlog";
  method: string;
  carrier: string;
  priceCents: number;
  deadlineDays: number;
};

const emptyAddress = {
  zipcode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  buyer_phone: "",
};

export default function BuyModal({ product, products = [], username, accentColor, onClose, onToast, stayInModal = false, embedded = false }: BuyModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [selectedUpsellId, setSelectedUpsellId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [statusUrl, setStatusUrl] = useState<string | null>(null);
  const [gateway, setGateway] = useState<"mercadopago" | "efipay">("mercadopago");
  const [pixCopiaECola, setPixCopiaECola] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<ShippingQuote["id"] | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [zipcodeLoading, setZipcodeLoading] = useState(false);
  const [zipcodeMessage, setZipcodeMessage] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const upsellProduct = useMemo(() => {
    if (!product?.upsell?.productId) return null;
    return products.find((item) => item.id === product.upsell?.productId) ?? null;
  }, [product, products]);

  const isPhysical = product?.type === "fisico";
  const selectedShipping = shippingQuotes.find((quote) => quote.id === selectedShippingId) ?? null;
  const totalAmount = (product?.price ?? 0)
    + (!isPhysical && selectedUpsellId && upsellProduct ? upsellProduct.price : 0)
    + (selectedShipping ? selectedShipping.priceCents / 100 : 0);

  useEffect(() => {
    if (!product) return;
    clearPolling();
    setStep("form");
    setBuyerName("");
    setBuyerEmail("");
    setBuyerCpf("");
    setSelectedUpsellId(null);
    setError("");
    setOrderId(null);
    setCheckoutUrl(null);
    setStatusUrl(null);
    setGateway("mercadopago");
    setPixCopiaECola(null);
    setQrCodeImage(null);
    setBoletoUrl(null);
    setCopied(false);
    setAddress(emptyAddress);
    setShippingQuotes([]);
    setSelectedShippingId(null);
    setZipcodeMessage("");
  }, [product]);

  useEffect(() => () => clearPolling(), []);

  if (!product) return null;
  const activeProduct = product;

  function clearPolling() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  function close() {
    clearPolling();
    onClose();
  }

  function startPolling(id: string, email: string, productId: string) {
    clearPolling();
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${id}/status?email=${encodeURIComponent(email)}`);
        const payload = await response.json();
        if (payload.data?.status === "paid") {
          clearPolling();
          setStep("success");
          if (username) {
            fetch("/api/analytics/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ event: "checkout_complete", username, product_id: productId }),
            }).catch(() => {});
          }
        }
      } catch {
        // Polling silencioso.
      }
    }, 5000);
    window.setTimeout(clearPolling, 60 * 60 * 1000);
  }

  async function calculateShipping() {
    const zipcode = address.zipcode.replace(/\D/g, "");
    setError("");
    if (zipcode.length !== 8) {
      setError("Informe um CEP valido para calcular o frete.");
      return;
    }
    setShippingLoading(true);
    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: activeProduct.id, destination_zipcode: zipcode }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Nao foi possivel calcular o frete.");
        return;
      }
      setShippingQuotes(payload.data.quotes ?? []);
      setSelectedShippingId(payload.data.quotes?.[0]?.id ?? null);
    } catch {
      setError("Erro ao calcular frete.");
    } finally {
      setShippingLoading(false);
    }
  }

  function updateAddress(field: keyof typeof emptyAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    if (field === "zipcode") setZipcodeMessage("");
  }

  function formatZipcode(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }

  async function lookupZipcode() {
    const zipcode = address.zipcode.replace(/\D/g, "");
    setError("");
    setZipcodeMessage("");
    if (zipcode.length !== 8) {
      setError("Informe um CEP valido.");
      return;
    }

    setZipcodeLoading(true);
    try {
      const response = await fetch(`/api/address/zipcode?cep=${encodeURIComponent(zipcode)}`);
      const payload = await response.json();
      if (!response.ok) {
        setZipcodeMessage(payload.error ?? "Nao conseguimos encontrar esse CEP. Preencha manualmente.");
        return;
      }
      setAddress((current) => ({
        ...current,
        zipcode: formatZipcode(payload.data.zipcode ?? zipcode),
        street: payload.data.street ?? current.street,
        neighborhood: payload.data.neighborhood ?? current.neighborhood,
        city: payload.data.city ?? current.city,
        state: payload.data.state ?? current.state,
      }));
      setZipcodeMessage("Endereco encontrado. Complete numero e complemento.");
    } catch {
      setZipcodeMessage("Nao conseguimos buscar esse CEP agora. Preencha manualmente.");
    } finally {
      setZipcodeLoading(false);
    }
  }

  async function handleSubmit() {
    const cpfClean = buyerCpf.replace(/\D/g, "");
    setError("");

    if (!buyerName.trim() || !buyerEmail.includes("@")) {
      setError("Informe nome e email validos.");
      return;
    }
    if (cpfClean.length !== 11) {
      setError("CPF invalido.");
      return;
    }
    if (isPhysical) {
      const requiredAddress = [address.zipcode, address.street, address.number, address.neighborhood, address.city, address.state];
      if (requiredAddress.some((value) => !value.trim())) {
        setError("Preencha o endereco de entrega.");
        return;
      }
      if (!selectedShippingId) {
        setError("Escolha uma opcao de frete.");
        return;
      }
    }

    setLoading(true);
    try {
      if (username) {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "checkout_start", username, product_id: activeProduct.id }),
        }).catch(() => {});
      }

      if (stayInModal) {
        setOrderId(`DEMO-${Date.now().toString().slice(-6)}`);
        setCheckoutUrl(null);
        setStatusUrl(null);
        setGateway("mercadopago");
        setStep("redirect");
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: activeProduct.id,
          upsell_id: selectedUpsellId,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          buyer_cpf: cpfClean,
          shipping_option_id: isPhysical ? selectedShippingId : undefined,
          shipping_address: isPhysical ? {
            ...address,
            zipcode: address.zipcode.replace(/\D/g, ""),
            buyer_phone: address.buyer_phone || undefined,
            complement: address.complement || undefined,
          } : undefined,
          idempotency_key: crypto.randomUUID(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Erro ao iniciar checkout.");
        return;
      }

      const gw = payload.data.gateway ?? "mercadopago";
      setOrderId(payload.data.order_id);
      setCheckoutUrl(payload.data.checkout_url);
      setStatusUrl(payload.data.order_status_url ?? null);
      setGateway(gw);

      if (payload.data.pix_copia_cola) {
        setPixCopiaECola(payload.data.pix_copia_cola);
        setQrCodeImage(payload.data.qr_code_image ?? null);
        setBoletoUrl(null);
        setStep("pix");
        startPolling(payload.data.order_id, buyerEmail, activeProduct.id);
      } else if (gw === "efipay" && payload.data.boleto_url) {
        setPixCopiaECola(null);
        setQrCodeImage(null);
        setBoletoUrl(payload.data.boleto_url);
        setStep("redirect");
        startPolling(payload.data.order_id, buyerEmail, activeProduct.id);
        if (!stayInModal) window.location.href = payload.data.boleto_url;
      } else {
        setStep("redirect");
        startPolling(payload.data.order_id, buyerEmail, activeProduct.id);
        if (!stayInModal) window.location.href = payload.data.checkout_url;
      }
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const content = (
      <div className={`${embedded ? "h-full" : "max-h-[82vh]"} overflow-y-auto p-5 store-scrollbar`}>
        {step === "form" && (
          <div className="space-y-5">
            <ProductSummary product={product} accentColor={accentColor} />
            {upsellProduct && (
              <label className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 accent-[#FF4D6D]"
                  checked={selectedUpsellId === upsellProduct.id}
                  onChange={(event) => setSelectedUpsellId(event.target.checked ? upsellProduct.id : null)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-[var(--text-primary)]">Adicionar {upsellProduct.name}</span>
                  <span className="text-[var(--text-secondary)]">{formatPrice(upsellProduct.price)}</span>
                </span>
              </label>
            )}
            <Input label="Nome completo" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Seu nome" />
            <Input label="Email" type="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} placeholder="voce@email.com" />
            <Input label="CPF" value={buyerCpf} onChange={(event) => setBuyerCpf(event.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="Somente numeros" />
            {isPhysical && (
              <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                  <MapPin size={16} />
                  Endereco de entrega
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input label="CEP" value={address.zipcode} onChange={(event) => updateAddress("zipcode", formatZipcode(event.target.value))} placeholder="00000-000" />
                      <Button variant="secondary" className="self-end" loading={zipcodeLoading} onClick={lookupZipcode}>
                        Buscar endereco
                      </Button>
                    </div>
                    {zipcodeMessage && <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">{zipcodeMessage}</p>}
                  </div>
                  <Input label="Celular" value={address.buyer_phone} onChange={(event) => updateAddress("buyer_phone", event.target.value)} placeholder="(00) 00000-0000" />
                  <Input label="Rua" value={address.street} onChange={(event) => updateAddress("street", event.target.value)} placeholder="Rua" />
                  <Input label="Numero" value={address.number} onChange={(event) => updateAddress("number", event.target.value)} placeholder="123" />
                  <Input label="Complemento" value={address.complement} onChange={(event) => updateAddress("complement", event.target.value)} placeholder="Opcional" />
                  <Input label="Bairro" value={address.neighborhood} onChange={(event) => updateAddress("neighborhood", event.target.value)} placeholder="Centro" />
                  <Input label="Cidade" value={address.city} onChange={(event) => updateAddress("city", event.target.value)} placeholder="Cidade" />
                  <Input label="UF" value={address.state} onChange={(event) => updateAddress("state", event.target.value.toUpperCase().slice(0, 2))} placeholder="RJ" />
                </div>
                <Button variant="secondary" className="w-full" loading={shippingLoading} onClick={calculateShipping}>
                  <Truck size={16} />
                  Calcular frete
                </Button>
                <p className="text-xs leading-5 text-[var(--text-secondary)]">
                  Apos a confirmacao do pagamento, o criador recebera seus dados de entrega e sera responsavel por postar o produto. O codigo de rastreio sera informado quando o pedido for enviado.
                </p>
                {shippingQuotes.length > 0 && (
                  <div className="space-y-2">
                    {shippingQuotes.map((quote) => (
                      <label key={quote.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 text-sm">
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            className="accent-[#FF4D6D]"
                            checked={selectedShippingId === quote.id}
                            onChange={() => setSelectedShippingId(quote.id)}
                          />
                          <span>
                            <span className="block font-bold text-[var(--text-primary)]">{quote.method}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{quote.deadlineDays} dias uteis</span>
                          </span>
                        </span>
                        <span className="font-bold text-[var(--text-primary)]">{formatPrice(quote.priceCents / 100)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="rounded-xl bg-[var(--bg-elevated)] p-3 text-sm">
              {isPhysical && selectedShipping && (
                <div className="mb-2 flex justify-between text-[var(--text-secondary)]">
                  <span>Frete {selectedShipping.method}</span>
                  <span>{formatPrice(selectedShipping.priceCents / 100)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[var(--text-primary)]">
                <span>Total</span>
                <span style={{ color: accentColor }}>{formatPrice(totalAmount)}</span>
              </div>
            </div>
            {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
            <Button className="w-full" loading={loading} onClick={handleSubmit}>
              Ir para pagamento
            </Button>
          </div>
        )}

        {step === "redirect" && (
          <div className="space-y-5 text-center">
            <ProductSummary product={product} accentColor={accentColor} />
            <div className="mx-auto grid size-16 place-items-center rounded-full" style={{ backgroundColor: `${accentColor}22`, color: accentColor }}>
              <ExternalLink size={30} />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-[var(--text-primary)]">
                {stayInModal ? "Pagamento de demonstracao" : gateway === "mercadopago" ? "Redirecionando para o checkout" : "Redirecionando para o boleto"}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {stayInModal ? "Nesta loja de exemplo, o checkout continua dentro do modal." : gateway === "mercadopago" ? "Finalize o pagamento na pagina segura do checkout." : "Finalize o pagamento do boleto."}
              </p>
            </div>
            {stayInModal ? (
              <Button className="w-full" onClick={() => setStep("success")}>Confirmar pagamento de teste</Button>
            ) : (
              <>
                {checkoutUrl && gateway === "mercadopago" && <Button className="w-full" onClick={() => { window.location.href = checkoutUrl; }}><ExternalLink size={16} />Abrir checkout</Button>}
                {boletoUrl && <Button className="w-full" onClick={() => { window.location.href = boletoUrl; }}><ExternalLink size={16} />Abrir boleto</Button>}
              </>
            )}
            <p className="text-xs text-[var(--text-secondary)]">A confirmacao e automatica apos aprovacao. Pedido: {orderId}</p>
            {!stayInModal && statusUrl && (
              <Button variant="secondary" className="w-full" onClick={() => { window.open(statusUrl, "_blank", "noopener,noreferrer"); }}>
                Acompanhar meu pedido
              </Button>
            )}
          </div>
        )}

        {step === "pix" && (
          <div className="space-y-5 text-center">
            <ProductSummary product={product} accentColor={accentColor} />
            <div className="mx-auto grid size-20 place-items-center rounded-full" style={{ backgroundColor: `${accentColor}22`, color: accentColor }}>
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='4'/%3E%3Cpath d='M7 7h10v10H7z'/%3E%3C/svg%3E" alt="PIX" className="size-10" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-[var(--text-primary)]">Pagamento via PIX</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Escaneie o QR Code ou copie o codigo PIX para pagar.</p>
            </div>
            {qrCodeImage && (
              <div className="flex justify-center">
                <img src={qrCodeImage} alt="QR Code PIX" className="size-48 rounded-xl border border-[var(--border-subtle)]" />
              </div>
            )}
            {pixCopiaECola && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                <p className="mb-2 text-left text-xs font-bold text-[var(--text-secondary)]">Codigo PIX (Copia e Cola)</p>
                <div className="flex gap-2">
                  <code className="flex-1 truncate rounded-lg bg-[var(--bg-primary)] px-3 py-2 text-left text-xs text-[var(--text-secondary)]">{pixCopiaECola}</code>
                  <Button variant="secondary" onClick={() => {
                    navigator.clipboard.writeText(pixCopiaECola);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  }}>
                    <Copy size={14} />
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-[var(--text-secondary)]">Aguardando confirmacao do pagamento. Pedido: {orderId}</p>
            {!stayInModal && statusUrl && (
              <Button variant="secondary" className="w-full" onClick={() => { window.open(statusUrl, "_blank", "noopener,noreferrer"); }}>
                Acompanhar meu pedido
              </Button>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full" style={{ backgroundColor: `${accentColor}22`, color: accentColor }}>
              <Check size={38} strokeWidth={3} />
            </div>
            <h3 className="mt-5 font-heading text-xl font-extrabold text-[var(--text-primary)]">Pagamento confirmado</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {stayInModal ? "Compra de demonstracao concluida sem sair da landing." : isPhysical ? `Voce pode acompanhar o envio pelo link do pedido.` : `O link de acesso foi enviado para ${buyerEmail}.`}
            </p>
            {!stayInModal && isPhysical && statusUrl && (
              <Button className="mt-6 w-full" onClick={() => { window.location.href = statusUrl; }}>
                Acompanhar meu pedido
              </Button>
            )}
            <Button className="mt-6 w-full" onClick={close}>Fechar</Button>
          </div>
        )}
      </div>
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-full flex-col bg-[var(--bg-surface)] text-[var(--text-primary)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
          <h2 className="font-heading text-sm font-bold">Finalizar compra</h2>
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] transition hover:opacity-80"
          >
            Voltar
          </button>
        </div>
        <div className="min-h-0 flex-1">{content}</div>
      </div>
    );
  }

  return (
    <Modal open={!!product} onClose={close} title="Finalizar compra" maxWidth="max-w-md">
      {content}
    </Modal>
  );
}

function ProductSummary({ product, accentColor }: { product: Product; accentColor: string }) {
  const typeMeta = PRODUCT_TYPES[product.type];
  return (
    <div className="flex gap-3 rounded-xl bg-[var(--bg-elevated)] p-3 text-left">
      <div className="grid size-12 shrink-0 place-items-center rounded-xl text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${product.coverGradient?.[0] ?? typeMeta.gradient[0]}, ${product.coverGradient?.[1] ?? typeMeta.gradient[1]})` }}>
        <PackageCheck size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-[var(--text-primary)]">{product.name}</h3>
        <p className="text-sm font-extrabold" style={{ color: accentColor }}>{formatPrice(product.price)}</p>
      </div>
    </div>
  );
}
