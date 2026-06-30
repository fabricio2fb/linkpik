"use client";

import { AlertTriangle, Bell, CheckCircle2, CreditCard, ExternalLink, Globe, ImagePlus, KeyRound, Link2, Lock, Mail, Save, User, X, Zap } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { uploadSignedCloudinaryImage, validateImageFile } from "@/lib/client/cloudinary-upload";
import { FEATURE_CUSTOM_DOMAIN, FEATURE_WHATSAPP_NOTIFICATIONS } from "@/lib/feature-flags";
import { useSession } from "@/lib/hooks/use-session";

type Creator = {
  name: string;
  username: string;
  bio?: string | null;
  avatar_url?: string | null;
};

type PaymentGateway = "mercadopago" | "efipay";

type Settings = {
  bank_name?: string | null;
  bank_account_type?: "Corrente" | "Poupanca" | null;
  bank_agency?: string | null;
  bank_account?: string | null;
  bank_document?: string | null;
  bank_holder?: string | null;
  notify_new_sale?: boolean;
  notify_pix_expired?: boolean;
  notify_daily_summary?: boolean;
  notify_weekly_summary?: boolean;
  notify_product_news?: boolean;
  notify_whatsapp_enabled?: boolean;
  notify_whatsapp_number?: string | null;
  notify_push_enabled?: boolean;
  meta_pixel_id?: string | null;
  meta_pixel_token?: string | null;
  google_analytics_measurement_id?: string | null;
  tiktok_pixel_id?: string | null;
  tiktok_pixel_token?: string | null;
  webhook_url?: string | null;
  webhook_events?: string[];
  webhook_secret?: string | null;
  custom_domain?: string | null;
  domain_verified?: boolean;
  default_gateway?: PaymentGateway;
  default_payment_gateway?: PaymentGateway | null;
};

type Billing = {
  plan: "free" | "pro";
  is_pro: boolean;
  plan_expires_at?: string | null;
  subscription?: {
    id: string;
    status: string;
    mercado_pago_preapproval_id?: string | null;
    next_payment_date?: string | null;
    amount?: number | null;
  } | null;
};

type SectionKey = "account" | "payments" | "notifications" | "integrations" | "domain" | "plan";
type MercadoPagoStatus = {
  connected: boolean;
  status: "pending" | "active" | "disconnected" | "expired" | "error";
  external_user_id?: string | null;
  connected_at?: string | null;
};

type EfipayStatus = {
  connected: boolean;
  status: "pending" | "active" | "disconnected" | "expired" | "error";
  connected_at?: string | null;
  has_pix_key?: boolean;
};

const emptySettings: Settings = {
  notify_new_sale: true,
  notify_pix_expired: true,
  notify_daily_summary: false,
  notify_weekly_summary: false,
  notify_product_news: true,
  notify_whatsapp_enabled: false,
  notify_push_enabled: false,
  webhook_events: [],
};

export default function ConfiguracoesPage() {
  const { session, refresh: refreshSession } = useSession();
  const [activeSection, setActiveSection] = useState<SectionKey>("account");
  const [creator, setCreator] = useState<Creator>({ name: "", username: "", bio: "", avatar_url: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [mercadoPago, setMercadoPago] = useState<MercadoPagoStatus>({ connected: false, status: "pending" });
  const [efipay, setEfipay] = useState<EfipayStatus>({ connected: false, status: "pending" });
  const [defaultGateway, setDefaultGateway] = useState<PaymentGateway | null>(null);
  const [showEfipayModal, setShowEfipayModal] = useState(false);
  const [efipayClientId, setEfipayClientId] = useState("");
  const [efipayClientSecret, setEfipayClientSecret] = useState("");
  const [efipayPixKey, setEfipayPixKey] = useState("");
  const [efipayError, setEfipayError] = useState("");
  const [billing, setBilling] = useState<Billing | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [domainRemoveConfirm, setDomainRemoveConfirm] = useState(false);
  const [domainState, setDomainState] = useState<{
    domain: string | null;
    hostnameId: string | null;
    status: string | null;
    sslStatus: string | null;
  }>({ domain: null, hostnameId: null, status: null, sslStatus: null });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const section = params.get("section");
    if (tab === "pagamentos" || section === "payments") setActiveSection("payments");
    if (tab === "plan" || section === "plan") setActiveSection("plan");
    if (tab === "notifications" || section === "notifications") setActiveSection("notifications");
    if (tab === "integrations" || section === "integrations") setActiveSection("integrations");
    if (FEATURE_CUSTOM_DOMAIN && (tab === "domain" || section === "domain")) {
      setActiveSection("domain");
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/creators/me", { credentials: "include" }),
      fetch("/api/creators/me/settings", { credentials: "include" }),
      fetch("/api/creators/me/billing", { credentials: "include" }),
      fetch("/api/mercadopago/status", { credentials: "include" }),
      fetch("/api/efipay/status", { credentials: "include" }),
      fetch("/api/custom-domain", { credentials: "include" }),
    ])
      .then((responses) => Promise.all(responses.map((response) => response.json())))
      .then(([creatorPayload, settingsPayload, billingPayload, mercadoPagoPayload, efipayPayload, domainPayload]) => {
        setCreator({
          name: creatorPayload.data?.name ?? "",
          username: creatorPayload.data?.username ?? "",
          bio: creatorPayload.data?.bio ?? "",
          avatar_url: creatorPayload.data?.avatar_url ?? "",
        });
        setEmail(session?.email ?? creatorPayload.data?.email ?? "");
        const mergedSettings = { ...emptySettings, ...(settingsPayload.data ?? {}) };
        setSettings(mergedSettings);
        setDefaultGateway(mergedSettings.default_payment_gateway ?? mergedSettings.default_gateway ?? null);
        setBilling(billingPayload.data ?? null);
        setMercadoPago({
          connected: Boolean(mercadoPagoPayload.data?.connected),
          status: mercadoPagoPayload.data?.status ?? "pending",
          external_user_id: mercadoPagoPayload.data?.external_user_id ?? null,
          connected_at: mercadoPagoPayload.data?.connected_at ?? null,
        });
        setEfipay({
          connected: Boolean(efipayPayload.data?.connected),
          status: efipayPayload.data?.status ?? "pending",
          connected_at: efipayPayload.data?.connected_at ?? null,
          has_pix_key: Boolean(efipayPayload.data?.has_pix_key),
        });
        if (domainPayload?.data?.hostnameId) {
          setDomainState(domainPayload.data);
          setDomainInput(domainPayload.data.domain ?? "");
        }
      })
      .catch(() => showToast("Erro ao carregar configuracoes"));
  }, []);

  useEffect(() => {
    if (session?.email) setEmail(session.email);
  }, [session?.email]);

  useEffect(() => {
    if (activeSection !== "plan") return;
    let cancelled = false;

    fetch("/api/subscriptions/mercadopago/status", {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload.data) setBilling(payload.data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "domain") return;
    fetch("/api/custom-domain", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.data) {
          setDomainState(payload.data);
          setDomainInput(payload.data.domain ?? "");
        }
      })
      .catch(() => undefined);
  }, [activeSection]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function normalizeNullable(value?: string | null) {
    const next = value?.trim() ?? "";
    return next || null;
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploadError("");

    const fileError = validateImageFile(file, 2 * 1024 * 1024);
    if (fileError) {
      setAvatarUploadError(fileError);
      event.target.value = "";
      return;
    }

    setAvatarUploading(true);
    try {
      const uploaded = await uploadSignedCloudinaryImage({ file, uploadType: "creator_avatar" });
      setCreator((current) => ({ ...current, avatar_url: uploaded.url }));
      showToast("Foto enviada. Salve o perfil para confirmar.");
    } catch (error) {
      setAvatarUploadError(error instanceof Error ? error.message : "Nao conseguimos enviar a imagem agora.");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  }

  async function patchCreator() {
    setSaving("profile");
    const response = await fetch("/api/creators/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: creator.name,
        username: creator.username,
        bio: creator.bio ?? "",
        avatar_url: normalizeNullable(creator.avatar_url),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) return showToast(payload.error ?? "Erro ao salvar perfil");
    setCreator({
      name: payload.data?.name ?? creator.name,
      username: payload.data?.username ?? creator.username,
      bio: payload.data?.bio ?? creator.bio,
      avatar_url: payload.data?.avatar_url ?? creator.avatar_url,
    });
    showToast("Perfil salvo");
  }

  async function patchAccount() {
    if (password && password !== confirmPassword) {
      showToast("As senhas nao conferem");
      return;
    }
    if (password && password.length < 6) {
      showToast("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    const body: Record<string, string> = {};
    if (email.trim() && email.trim() !== session?.email) body.email = email.trim();
    if (password) body.password = password;
    if (!Object.keys(body).length) {
      showToast("Nada para salvar");
      return;
    }

    setSaving("account-access");
    const response = await fetch("/api/auth/account", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) {
      showToast(payload.error ?? "Erro ao atualizar acesso");
      return;
    }
    setPassword("");
    setConfirmPassword("");
    await refreshSession();
    showToast(body.email ? "Confira seu email para confirmar a alteracao" : "Senha atualizada");
  }

  async function patchSettings(body: Record<string, unknown>, success: string, key: string) {
    setSaving(key);
    const response = await fetch("/api/creators/me/settings", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) {
      showToast(payload.error ?? "Erro ao salvar");
      return null;
    }
    setSettings({ ...emptySettings, ...(payload.data ?? {}) });
    showToast(success);
    return payload.data as Settings;
  }

  function urlBase64ToUint8Array(value: string) {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  async function enablePushNotifications() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      showToast("Push nao suportado neste navegador");
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showToast("Permissao de push negada");
      return false;
    }
    const keyResponse = await fetch("/api/notifications/push/public-key", { credentials: "include" });
    const keyPayload = await keyResponse.json().catch(() => ({}));
    if (!keyResponse.ok || !keyPayload.data?.public_key) {
      showToast(keyPayload.error ?? "Push nao configurado");
      return false;
    }

    const registration = await navigator.serviceWorker.register("/pikbio-push-sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyPayload.data.public_key),
    });
    const response = await fetch("/api/notifications/push/subscribe", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      showToast(payload.error ?? "Erro ao ativar push");
      return false;
    }
    return true;
  }

  async function disablePushNotifications() {
    const registration = await navigator.serviceWorker?.getRegistration("/pikbio-push-sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
    await fetch("/api/notifications/push/subscribe", { method: "DELETE", credentials: "include" }).catch(() => undefined);
  }

  async function togglePushNotifications(checked: boolean) {
    if (checked) {
      const enabled = await enablePushNotifications();
      if (!enabled) return;
    } else {
      await disablePushNotifications();
    }
    setSettings((current) => ({ ...current, notify_push_enabled: checked }));
  }

  async function verifyDomain() {
    setSaving("domain-verify");
    const response = await fetch("/api/creators/me/domain/verify", { method: "POST", credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    showToast(payload.data?.message ?? payload.error ?? "Verificacao concluida");
    if (payload.data?.verified) setSettings((current) => ({ ...current, domain_verified: true }));
  }

  async function upgrade() {
    setSaving("upgrade");
    const response = await fetch("/api/subscriptions/mercadopago/create", { method: "POST", credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (payload.data?.checkout_url) window.location.href = payload.data.checkout_url;
    else showToast(payload.error ?? "Erro ao iniciar upgrade");
  }

  async function cancelSubscription() {
    setSaving("subscription-cancel");
    const response = await fetch("/api/subscriptions/mercadopago/cancel", { method: "POST", credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) return showToast(payload.error ?? "Erro ao cancelar assinatura");
    setBilling((current) => current ? { ...current, plan: "free", is_pro: false, subscription: { ...(current.subscription ?? { id: "" }), status: "cancelled" } } : current);
    showToast("Assinatura cancelada");
  }

  async function connectMercadoPago() {
    setSaving("mercadopago-connect");
    const response = await fetch("/api/mercadopago/connect", { method: "POST", credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok || !payload.data?.url) return showToast(payload.error ?? "Erro ao conectar Mercado Pago");
    window.location.href = payload.data.url;
  }

  async function disconnectMercadoPago() {
    setSaving("mercadopago-disconnect");
    const response = await fetch("/api/mercadopago/disconnect", { method: "POST", credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) return showToast(payload.error ?? "Erro ao desconectar Mercado Pago");
    setMercadoPago({ connected: false, status: "disconnected" });
    setDefaultGateway((current) => current === "mercadopago" ? (efipay.connected ? "efipay" : null) : current);
    showToast("Mercado Pago desconectado");
  }

  async function connectEfipay() {
    setSaving("efipay-connect");
    setEfipayError("");
    const response = await fetch("/api/efipay/connect", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: efipayClientId.trim(),
        clientSecret: efipayClientSecret.trim(),
        pixKey: efipayPixKey.trim() || undefined,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) {
      setEfipayError(payload.error ?? "Credenciais invalidas");
      return;
    }
    setEfipay({ connected: true, status: "active", connected_at: new Date().toISOString(), has_pix_key: Boolean(efipayPixKey) });
    setDefaultGateway((current) => current ?? (mercadoPago.connected ? "mercadopago" : "efipay"));
    setShowEfipayModal(false);
    setEfipayClientId("");
    setEfipayClientSecret("");
    setEfipayPixKey("");
    showToast("Efi Bank conectado com sucesso");
  }

  async function disconnectEfipay() {
    setSaving("efipay-disconnect");
    const response = await fetch("/api/efipay/disconnect", { method: "POST", credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) return showToast(payload.error ?? "Erro ao desconectar Efi Bank");
    setEfipay({ connected: false, status: "disconnected" });
    setDefaultGateway((current) => current === "efipay" ? (mercadoPago.connected ? "mercadopago" : null) : current);
    showToast("Efi Bank desconectado");
  }

  async function saveDefaultGateway(gateway: PaymentGateway) {
    if (saving === "default-gateway") return;
    setSaving("default-gateway");
    const response = await fetch("/api/creators/me/settings/payment-gateway", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gateway }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) return showToast(payload.error ?? "Erro ao salvar gateway ativo");
    setDefaultGateway(payload.data?.default_payment_gateway ?? gateway);
    showToast(`Gateway ativo alterado para ${gateway === "mercadopago" ? "Mercado Pago" : "Efi Bank"}`);
  }

  const connectedGatewaysCount = Number(mercadoPago.connected) + Number(efipay.connected);
  const effectiveDefaultGateway: PaymentGateway | null =
    connectedGatewaysCount === 1
      ? mercadoPago.connected
        ? "mercadopago"
        : "efipay"
      : defaultGateway;
  const canChooseGateway = connectedGatewaysCount > 1;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Configuracoes</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Conta, pagamentos, notificacoes, dominio, integracoes e plano.</p>
        </div>
        <Badge tone={billing?.is_pro ? "success" : "neutral"}>{billing?.is_pro ? "Plano Pro" : "Plano Free"}</Badge>
      </header>

      <SettingsNav active={activeSection} onChange={setActiveSection} />

      {activeSection === "account" && <Card className="p-5">
        <SectionTitle icon={User} title="Conta" text="Perfil publico e acesso da sua conta." />
        <div className="mt-5 grid gap-6">
          <section className="grid gap-4 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-center gap-3">
              <ImagePlus size={18} className="text-[#FF4D6D]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Perfil publico</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-[96px_1fr]">
              <div className="grid content-start justify-items-center gap-2">
                <div className={`grid size-20 place-items-center overflow-hidden rounded-full text-lg font-black text-white ${creator.avatar_url ? "" : "bg-[#FF4D6D]"}`}>
                  {creator.avatar_url ? <img src={creator.avatar_url} alt="" className="size-full object-contain" /> : creator.name.slice(0, 2).toUpperCase()}
                </div>
                <label className="grid cursor-pointer justify-items-center gap-1 text-center text-xs font-bold text-[#FF4D6D]">
                  {avatarUploading ? "Enviando..." : "Alterar foto"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadAvatar} disabled={avatarUploading} />
                </label>
                {avatarUploadError && <span className="text-center text-xs text-red-400">{avatarUploadError}</span>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Nome" value={creator.name} onChange={(event) => setCreator((current) => ({ ...current, name: event.target.value }))} />
                <Input label="Username" value={creator.username} onChange={(event) => setCreator((current) => ({ ...current, username: event.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "") }))} />
                <Input className="md:col-span-2" label="Bio" value={creator.bio ?? ""} onChange={(event) => setCreator((current) => ({ ...current, bio: event.target.value }))} />
              </div>
            </div>
            <Button className="w-full md:w-fit" loading={saving === "profile"} onClick={patchCreator}><Save size={16} />Salvar perfil</Button>
          </section>

          <section className="grid gap-4 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-[#FF4D6D]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Acesso e seguranca</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Email da conta" type="email" value={email} onChange={(event) => setEmail(event.target.value)} suffix={<Mail size={16} />} />
              <div className="hidden md:block" />
              <Input label="Nova senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimo 6 caracteres" />
              <Input label="Confirmar nova senha" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <Button className="w-full md:w-fit" variant="secondary" loading={saving === "account-access"} onClick={patchAccount}><Save size={16} />Salvar acesso</Button>
          </section>
        </div>
      </Card>}

      {activeSection === "payments" && <div className="space-y-6">
        <Card className="p-5">
          <SectionTitle icon={KeyRound} title="Pagamentos" text="Conecte um gateway de pagamento para começar a receber vendas." />
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className={`grid size-11 shrink-0 place-items-center rounded-full ${mercadoPago.connected ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#F59E0B]/10 text-[#F59E0B]"}`}>
                {mercadoPago.connected ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                    {mercadoPago.connected ? "Mercado Pago conectado" : "Mercado Pago nao conectado"}
                  </h2>
                  <Badge tone={mercadoPago.connected ? "success" : "warning"}>{mercadoPago.connected ? "Ativo" : "Pendente"}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {mercadoPago.connected
                    ? `Conta marketplace ${mercadoPago.external_user_id ?? "conectada"} pronta para receber vendas.`
                    : "Conecte sua conta para liberar o checkout dos seus produtos."}
                </p>
                {mercadoPago.connected_at && <p className="mt-1 text-xs text-[var(--text-tertiary)]">Conectado em {new Date(mercadoPago.connected_at).toLocaleString("pt-BR")}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {mercadoPago.connected ? (
                <Button variant="secondary" loading={saving === "mercadopago-disconnect"} onClick={disconnectMercadoPago}>
                  Desconectar Mercado Pago
                </Button>
              ) : (
                <Button loading={saving === "mercadopago-connect"} onClick={connectMercadoPago}>
                  <ExternalLink size={16} />
                  Conectar Mercado Pago
                </Button>
              )}
            </div>
          </div>
          {mercadoPago.connected && (
            <PaymentGatewayToggle
              className="mt-4"
              checked={effectiveDefaultGateway === "mercadopago"}
              disabled={!canChooseGateway || saving === "default-gateway"}
              label="Usar como gateway ativo"
              onChange={() => saveDefaultGateway("mercadopago")}
            />
          )}
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className={`grid size-11 shrink-0 place-items-center rounded-full ${efipay.connected ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#F59E0B]/10 text-[#F59E0B]"}`}>
                {efipay.connected ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                    {efipay.connected ? "Efi Bank conectado" : "Efi Bank nao conectado"}
                  </h2>
                  <Badge tone={efipay.connected ? "success" : "warning"}>{efipay.connected ? "Ativo" : "Pendente"}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {efipay.connected
                    ? `Conta Efi Bank pronta para receber vendas via PIX, boleto e cartao.${efipay.has_pix_key ? "" : " Configure uma chave PIX."}`
                    : "Conecte sua conta Efi Bank via Client ID e Client Secret para receber vendas."}
                </p>
                {efipay.connected_at && <p className="mt-1 text-xs text-[var(--text-tertiary)]">Conectado em {new Date(efipay.connected_at).toLocaleString("pt-BR")}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {efipay.connected ? (
                <Button variant="secondary" loading={saving === "efipay-disconnect"} onClick={disconnectEfipay}>
                  Desconectar Efi Bank
                </Button>
              ) : (
                <Button loading={saving === "efipay-connect"} onClick={() => setShowEfipayModal(true)}>
                  <KeyRound size={16} />
                  Conectar Efi Bank
                </Button>
              )}
            </div>
          </div>
          {efipay.connected && (
            <PaymentGatewayToggle
              className="mt-4"
              checked={effectiveDefaultGateway === "efipay"}
              disabled={!canChooseGateway || saving === "default-gateway"}
              label="Usar como gateway ativo"
              onChange={() => saveDefaultGateway("efipay")}
            />
          )}
        </Card>
      </div>}

      {activeSection === "notifications" && <Card className="p-5">
        <SectionTitle icon={Bell} title="Notificacoes" text="Eventos enviados para voce e para a operacao." />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Toggle label="Nova venda" checked={Boolean(settings.notify_new_sale)} onChange={(checked) => setSettings((current) => ({ ...current, notify_new_sale: checked }))} />
          <Toggle label="Pagamento pendente" checked={Boolean(settings.notify_pix_expired)} onChange={(checked) => setSettings((current) => ({ ...current, notify_pix_expired: checked }))} />
          <Toggle label="Resumo diario" checked={Boolean(settings.notify_daily_summary)} onChange={(checked) => setSettings((current) => ({ ...current, notify_daily_summary: checked }))} />
          <Toggle label="Resumo semanal" checked={Boolean(settings.notify_weekly_summary)} onChange={(checked) => setSettings((current) => ({ ...current, notify_weekly_summary: checked }))} />
          <Toggle label="Novidades de produto" checked={Boolean(settings.notify_product_news)} onChange={(checked) => setSettings((current) => ({ ...current, notify_product_news: checked }))} />
          <Toggle label="Push no navegador" checked={Boolean(settings.notify_push_enabled)} onChange={togglePushNotifications} />
        </div>
        {FEATURE_WHATSAPP_NOTIFICATIONS && (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
            <Input label="WhatsApp" value={settings.notify_whatsapp_number ?? ""} onChange={(event) => setSettings((current) => ({ ...current, notify_whatsapp_number: event.target.value }))} placeholder="+55 11 99999-9999" />
            <div className="flex items-end">
              <Toggle label="WhatsApp ativo" checked={Boolean(settings.notify_whatsapp_enabled)} onChange={(checked) => setSettings((current) => ({ ...current, notify_whatsapp_enabled: checked }))} />
            </div>
          </div>
        )}
        <Button className="mt-5" loading={saving === "notifications"} onClick={() => patchSettings({
          notify_new_sale: settings.notify_new_sale,
          notify_pix_expired: settings.notify_pix_expired,
          notify_daily_summary: settings.notify_daily_summary,
          notify_weekly_summary: settings.notify_weekly_summary,
          notify_product_news: settings.notify_product_news,
          notify_push_enabled: settings.notify_push_enabled,
          ...(FEATURE_WHATSAPP_NOTIFICATIONS ? {
            notify_whatsapp_enabled: settings.notify_whatsapp_enabled,
            notify_whatsapp_number: normalizeNullable(settings.notify_whatsapp_number),
          } : {}),
        }, "Notificacoes salvas", "notifications")}><Save size={16} />Salvar notificacoes</Button>
      </Card>}

      {activeSection === "integrations" && <Card className="p-5">
        <SectionTitle icon={Link2} title="Integracoes" text="Pixels, analytics e webhook externo." />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="Meta Pixel ID" value={settings.meta_pixel_id ?? ""} onChange={(event) => setSettings((current) => ({ ...current, meta_pixel_id: event.target.value }))} />
          <Input label="Google Analytics Measurement ID" value={settings.google_analytics_measurement_id ?? ""} onChange={(event) => setSettings((current) => ({ ...current, google_analytics_measurement_id: event.target.value }))} />
          <Input label="TikTok Pixel ID" value={settings.tiktok_pixel_id ?? ""} onChange={(event) => setSettings((current) => ({ ...current, tiktok_pixel_id: event.target.value }))} />
          <Input label="Webhook URL" value={settings.webhook_url ?? ""} onChange={(event) => setSettings((current) => ({ ...current, webhook_url: event.target.value }))} placeholder="https://..." />
          <div className="grid gap-2 md:col-span-2">
            <Input label="Eventos do webhook" value={(settings.webhook_events ?? []).join(", ")} onChange={(event) => setSettings((current) => ({ ...current, webhook_events: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="order.paid, order.pending, order.refused, order.canceled, order.refunded, access.granted" />
            <div className="flex flex-wrap gap-2">
              {["order.paid", "order.pending", "order.refused", "order.canceled", "order.refunded", "access.granted"].map((event) => (
                <Badge key={event} tone="neutral">{event}</Badge>
              ))}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Deixe vazio para enviar todos os eventos suportados.</p>
          </div>
          <Input label="Webhook secret" value={settings.webhook_secret ?? ""} onChange={(event) => setSettings((current) => ({ ...current, webhook_secret: event.target.value }))} />
        </div>
        <Button className="mt-5" loading={saving === "integrations"} onClick={() => patchSettings({
          meta_pixel_id: normalizeNullable(settings.meta_pixel_id),
          google_analytics_measurement_id: normalizeNullable(settings.google_analytics_measurement_id),
          tiktok_pixel_id: normalizeNullable(settings.tiktok_pixel_id),
          webhook_url: normalizeNullable(settings.webhook_url),
          webhook_events: settings.webhook_events ?? [],
          webhook_secret: normalizeNullable(settings.webhook_secret),
        }, "Integracoes salvas", "integrations")}><Save size={16} />Salvar integracoes</Button>
      </Card>}

      {FEATURE_CUSTOM_DOMAIN && activeSection === "domain" && (
        billing?.is_pro ? (
          <Card className="p-5">
            <SectionTitle icon={Globe} title="Dominio" text="Dominio proprio para sua loja." />

            {domainState.hostnameId ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{domainState.domain}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {domainState.status === "active" ? (
                          <Badge tone="success">Conectado</Badge>
                        ) : (
                          <Badge tone="warning">Aguardando configuracao de DNS</Badge>
                        )}
                        {(() => {
                          const ssl = (domainState.sslStatus ?? "").toLowerCase();
                          if (ssl.includes("active")) {
                            return <span className="text-xs text-[var(--text-secondary)]"><CheckCircle2 size={12} className="mr-1 inline text-green-400" />Certificado SSL: ativo</span>;
                          }
                          if (ssl.includes("initializing") || ssl.includes("pending")) {
                            return <span className="text-xs text-[var(--text-secondary)]"><Zap size={12} className="mr-1 inline animate-pulse text-yellow-400" />Certificado SSL: gerando...</span>;
                          }
                          return <span className="text-xs text-[var(--text-secondary)]">Certificado SSL: pendente</span>;
                        })()}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      loading={saving === "domain-verify"}
                      onClick={async () => {
                        setSaving("domain-verify");
                        const response = await fetch("/api/creators/me/domain/verify", { method: "POST", credentials: "include" });
                        const payload = await response.json().catch(() => ({}));
                        setSaving(null);
                        if (payload.data?.verified) {
                          setDomainState((current) => ({ ...current, status: "active" }));
                          showToast("Dominio verificado!");
                        } else {
                          showToast(payload.data?.message ?? payload.error ?? "Aguardando configuracao de DNS");
                        }
                      }}
                    >
                      Verificar status
                    </Button>
                  </div>
                </div>

                <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Como conectar seu dominio</p>
                  <ol className="mt-4 list-inside list-decimal space-y-3 text-sm text-[var(--text-secondary)] [counter-reset:step]">
                    <li className="[counter-increment:step]">Acesse o painel onde voce registrou o dominio (ex: Registro.br, GoDaddy, Namecheap, Hostinger).</li>
                    <li className="[counter-increment:step]">Va ate a secao de DNS ou &quot;Gerenciar Zona DNS&quot;.</li>
                    <li className="[counter-increment:step]">Se ja existir um registro do tipo A apontando para a raiz do dominio, remova-o primeiro (nao e possivel ter dois registros diferentes no mesmo nome).</li>
                    <li className="[counter-increment:step]">Crie um novo registro com os dados abaixo:</li>
                  </ol>
                  <table className="mt-4 w-full border-collapse text-xs font-medium">
                    <thead>
                      <tr className="text-left text-[var(--text-tertiary)]">
                        <th className="pb-1 pr-4">Tipo</th>
                        <th className="pb-1 pr-4">Nome</th>
                        <th className="pb-1 pr-4">Valor</th>
                        <th className="pb-1">TTL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-mono text-[var(--text-primary)]">
                        <td className="py-1 pr-4">CNAME</td>
                        <td className="py-1 pr-4">{domainState.domain}</td>
                        <td className="py-1 pr-4">pik.bio</td>
                        <td className="py-1 text-[var(--text-tertiary)]">Automatico (padrao)</td>
                      </tr>
                    </tbody>
                  </table>
                  <ol className="mt-4 list-inside list-decimal space-y-3 text-sm text-[var(--text-secondary)]" start={5}>
                    <li>Salve e aguarde a propagacao (de 5 minutos a algumas horas).</li>
                    <li>Clique em &quot;Verificar status&quot; abaixo.</li>
                  </ol>
                  {(() => {
                    const cleanDomain = (domainState.domain ?? "").replace(/^www\./, "");
                    const parts = cleanDomain.split(".");
                    const isRoot = parts.length <= 2 || (parts.length === 3 && parts[2].length <= 3);
                    if (!isRoot) return null;
                    return (
                      <div className="mt-4 flex gap-2.5 rounded-[6px] border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs leading-relaxed text-yellow-300">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-400" />
                        <span>
                          Alguns provedores nao permitem CNAME na raiz do dominio. Se aparecer erro ao salvar, procure pela opcao <strong>ALIAS</strong> ou <strong>ANAME</strong> no lugar de CNAME &mdash; elas funcionam da mesma forma para dominios raiz (ex: seudominio.com). Se for um subdominio (ex: loja.seudominio.com), CNAME funciona normalmente em qualquer provedor.
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <p className="text-xs text-[var(--text-tertiary)]">
                  <Zap size={12} className="mr-1 inline text-yellow-400" />
                  O certificado de seguranca (SSL) e emitido automaticamente apos a verificacao do DNS &mdash; pode levar alguns minutos extras.
                </p>

                <div>
                  <Button
                    variant="secondary"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => setDomainRemoveConfirm(true)}
                  >
                    Remover dominio
                  </Button>
                  <Modal
                    open={domainRemoveConfirm}
                    onClose={() => setDomainRemoveConfirm(false)}
                    title="Desconectar dominio"
                    maxWidth="max-w-sm"
                  >
                    <div className="space-y-4 p-1 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-3 rounded-[6px] border border-red-500/20 bg-red-500/5 p-3">
                        <AlertTriangle size={20} className="shrink-0 text-red-400" />
                        <span>Tem certeza que deseja desconectar este dominio? A loja voltara a usar o endereco pik.bio/{creator?.username ?? "..."}.</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setDomainRemoveConfirm(false)}>Cancelar</Button>
                        <Button
                          loading={saving === "domain-remove"}
                          onClick={async () => {
                            setSaving("domain-remove");
                            await fetch("/api/custom-domain", { method: "DELETE", credentials: "include" });
                            setSaving(null);
                            setDomainRemoveConfirm(false);
                            setDomainState({ domain: null, hostnameId: null, status: null, sslStatus: null });
                            setDomainInput("");
                            showToast("Dominio removido");
                          }}
                        >
                          Sim, desconectar
                        </Button>
                      </div>
                    </div>
                  </Modal>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  Conecte um dominio proprio para sua loja. Apos conectar, configure o CNAME no seu provedor de DNS.
                </p>
                <div className="flex gap-3">
                  <Input
                    label="Seu dominio"
                    value={domainInput}
                    onChange={(event) => setDomainInput(event.target.value.toLowerCase())}
                    placeholder="seudominio.com.br"
                    className="min-w-0 flex-1"
                  />
                  <div className="flex items-end">
                    <Button
                      loading={saving === "domain-connect"}
                      disabled={!domainInput.match(/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/)}
                      onClick={async () => {
                        setSaving("domain-connect");
                        const response = await fetch("/api/custom-domain", {
                          method: "POST",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ domain: domainInput }),
                        });
                        const payload = await response.json().catch(() => ({}));
                        setSaving(null);
                        if (!response.ok) {
                          showToast(payload.error ?? "Erro ao conectar dominio");
                          return;
                        }
                        setDomainState(payload.data);
                        showToast("Dominio conectado! Configure o DNS para ativar.");
                      }}
                    >
                      Conectar dominio
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-5">
            <SectionTitle icon={Globe} title="Dominio" text="Dominio proprio para sua loja." />
            <div className="mt-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <p className="text-sm font-bold text-[var(--text-primary)]">Disponivel no Plano Pro</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                Faça upgrade para o Plano Pro para conectar seu proprio dominio e remover a marca d&apos;agua.
              </p>
              <Button className="mt-4" onClick={() => setActiveSection("plan")}>
                Fazer upgrade
              </Button>
            </div>
          </Card>
        )
      )}

      {activeSection === "plan" && (
        billing?.is_pro ? (
          <Card className="p-5">
            <SectionTitle icon={CreditCard} title="Plano Pro" text="Sua assinatura esta ativa." />
            <div className="mt-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-lg font-bold text-[var(--text-primary)]">Pikbio Pro</p>
                    <Badge tone="success">{billing?.subscription?.status ?? "active"}</Badge>
                  </div>
                  {billing?.subscription?.mercado_pago_preapproval_id && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Assinatura Mercado Pago {billing.subscription.mercado_pago_preapproval_id}
                    </p>
                  )}
                  {billing?.subscription?.next_payment_date && (
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Proxima cobranca: {new Date(billing.subscription.next_payment_date).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                <Button variant="secondary" loading={saving === "subscription-cancel"} onClick={cancelSubscription}>
                  Cancelar assinatura
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#FF4D6D] to-[#7C3AED] shadow-lg shadow-[#FF4D6D]/20">
                  <Zap size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">Desbloqueie todo o potencial do Pikbio</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Com o plano Pro voce reduz suas taxas pela metade e ganha ferramentas para escalar suas vendas.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Free</p>
                <p className="mt-1 font-heading text-3xl font-black text-[var(--text-primary)]">Gratuito</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Para comecar</p>
                <ul className="mt-5 space-y-2.5 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#22C55E]">&#10003;</span>
                    <span>Loja virtual com checkout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#22C55E]">&#10003;</span>
                    <span>Mercado Pago e Efi Bank</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#22C55E]">&#10003;</span>
                    <span>Notificacoes por e-mail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#FF4D6D] font-bold">10%</span>
                    <span>Taxa por venda</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-400">&#10007;</span>
                    <span className="text-[var(--text-tertiary)]">Dominio personalizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-400">&#10007;</span>
                    <span className="text-[var(--text-tertiary)]">Notificacoes WhatsApp</span>
                  </li>
                </ul>
              </div>

              <div className="relative rounded-2xl border-2 border-[#FF4D6D] bg-gradient-to-b from-[#FF4D6D]/5 to-transparent p-6 shadow-lg shadow-[#FF4D6D]/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-block rounded-full bg-[#FF4D6D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                    Mais escolhido
                  </span>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#FF4D6D]">Pro</p>
                <p className="mt-1 font-heading text-3xl font-black text-[var(--text-primary)]">
                  R$ 29
                  <span className="text-base font-bold text-[var(--text-tertiary)]">/mes</span>
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Vale cada venda</p>
                <ul className="mt-5 space-y-2.5 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#22C55E]">&#10003;</span>
                    <span>Tudo do Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#22C55E]">&#10003;</span>
                    <span>Taxa de apenas <span className="font-bold text-[#22C55E]">5%</span> por venda</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#22C55E]">&#10003;</span>
                    <span>Dominio personalizado (seudominio.com.br)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#22C55E]">&#10003;</span>
                    <span>Notificacoes via WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#22C55E]">&#10003;</span>
                    <span>Suporte prioritario</span>
                  </li>
                </ul>
              </div>
            </div>

            <Card className="overflow-hidden border-[#FF4D6D]/20 bg-gradient-to-r from-[#FF4D6D]/5 to-transparent p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FF4D6D]/10">
                    <Zap size={20} className="text-[#FF4D6D]" />
                  </div>
                  <div>
                    <p className="font-heading text-base font-bold text-[var(--text-primary)]">
                      {billing?.is_pro ? "Voce ja e Pro!" : "Migre agora e pague metade da taxa"}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                      {billing?.is_pro
                        ? "Aproveite todos os beneficios."
                        : "Se voce vende R$ 500/mes, o Pro ja se paga com a economia nas taxas."}
                    </p>
                  </div>
                </div>
                <Button loading={saving === "upgrade"} onClick={upgrade} className="shrink-0">
                  <Zap size={16} />
                  Assinar Pro — R$ 29/mes
                </Button>
              </div>
            </Card>

            <p className="text-xs text-[var(--text-tertiary)] text-center">
              Assinatura processada pelo Mercado Pago. Cancele quando quiser sem fidelidade.
            </p>
          </div>
        )
      )}

      <Modal open={showEfipayModal} onClose={() => setShowEfipayModal(false)} title="Conectar Efi Bank" maxWidth="max-w-md">
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Insira suas credenciais do Efi Bank. Os dados sao criptografados e armazenados com seguranca.
          </p>
          <Input
            label="Client ID"
            value={efipayClientId}
            onChange={(event) => setEfipayClientId(event.target.value)}
            placeholder="Cole seu Client ID"
          />
          <Input
            label="Client Secret"
            type="password"
            value={efipayClientSecret}
            onChange={(event) => setEfipayClientSecret(event.target.value)}
            placeholder="Cole seu Client Secret"
          />
          <Input
            label="Chave PIX (opcional)"
            value={efipayPixKey}
            onChange={(event) => setEfipayPixKey(event.target.value)}
            placeholder="CPF, CNPJ, email, telefone ou aleatoria"
          />
          {efipayError && <p className="text-sm font-semibold text-red-400">{efipayError}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowEfipayModal(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" loading={saving === "efipay-connect"} onClick={connectEfipay}>
              Validar e conectar
            </Button>
          </div>
        </div>
      </Modal>

      <Toast message={toast} />
    </div>
  );
}

const settingsSections: Array<{ key: SectionKey; label: string; icon: typeof User }> = [
  { key: "account", label: "Conta", icon: User },
  { key: "payments", label: "Pagamentos", icon: KeyRound },
  { key: "notifications", label: "Notificacoes", icon: Bell },
  { key: "integrations", label: "Integracoes", icon: Link2 },
  ...(FEATURE_CUSTOM_DOMAIN ? [{ key: "domain" as const, label: "Dominio", icon: Globe }] : []),
  { key: "plan", label: "Plano", icon: CreditCard },
];

function SettingsNav({ active, onChange }: { active: SectionKey; onChange: (section: SectionKey) => void }) {
  return (
    <nav className="sticky top-0 z-10 -mx-4 overflow-x-auto border-y border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 md:static md:mx-0 md:rounded-[8px] md:border md:bg-[var(--bg-card)]" aria-label="Configuracoes">
      <div className="flex min-w-max gap-2">
        {settingsSections.map(({ key, label, icon: Icon }) => {
          const selected = active === key;
          return (
            <button
              key={key}
              type="button"
              className={`inline-flex min-h-11 items-center gap-2 rounded-[8px] px-3 text-sm font-bold transition ${
                selected
                  ? "bg-[#FF4D6D] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              }`}
              aria-current={selected ? "page" : undefined}
              onClick={() => onChange(key)}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SectionTitle({ icon: Icon, title, text }: { icon: typeof User; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="text-[#FF4D6D]" />
      <div>
        <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{text}</p>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-14 items-center justify-between gap-4 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-sm font-bold text-[var(--text-primary)]">
      <span>{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-[#FF4D6D]" : "bg-[var(--bg-primary)]"}`} aria-pressed={checked}>
        <span className={`absolute top-1 size-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </button>
    </label>
  );
}

function PaymentGatewayToggle({
  checked,
  disabled,
  label,
  onChange,
  className = "",
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
        <p className={`mt-1 text-xs font-semibold ${checked ? "text-[#22C55E]" : "text-[var(--text-tertiary)]"}`}>
          {checked ? "Ativo - processando vendas" : "Conectado, mas nao esta recebendo vendas"}
        </p>
      </div>
      <button
        type="button"
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#FF4D6D]" : "bg-[var(--bg-primary)]"
        } ${disabled ? "cursor-not-allowed opacity-70" : "hover:scale-105"}`}
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => {
          if (!checked) onChange();
        }}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}
