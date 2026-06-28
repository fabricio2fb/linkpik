import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { notFound } from "next/navigation"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { formatPrice } from "@/lib/utils"
import { maskCpf, maskEmail, maskSecret, maskBankAccount } from "@/lib/admin/mask"
import { getEmailsByUserId } from "@/lib/admin/auth-users"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import DataTable from "@/components/dashboard/DataTable"
import CreatorActions from "./_components/CreatorActions"
import Link from "next/link"
import type { TableColumn, TableRow } from "@/lib/dashboard/types"

export default async function AdminCreatorDetailPage(props: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdminUser()
  if (!adminUser) notFound()
  const adminSession = await getAdminSession()
  if (!adminSession) notFound()

  const { id } = await props.params

  const supabase = createSupabaseService()

  const [creatorResult, settingsResult, productsResult, ordersResult, auditResult] = await Promise.all([
    supabase.from("creators").select("*").eq("id", id).single(),
    supabase.from("creator_settings").select("*").eq("creator_id", id).maybeSingle(),
    supabase.from("products").select("*").eq("creator_id", id).order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, buyer_name, buyer_email, amount, platform_fee, status, gateway, created_at")
      .eq("creator_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("admin_audit_log")
      .select("*")
      .eq("target_table", "creators")
      .eq("target_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  if (creatorResult.error || !creatorResult.data) notFound()

  const creator = creatorResult.data
  const settings = settingsResult.data
  const products = productsResult.data ?? []
  const recentOrders = ordersResult.data ?? []
  const auditLogs = auditResult.data ?? []

  const emailMap = creator.user_id ? await getEmailsByUserId([creator.user_id]) : new Map()
  const creatorEmail = emailMap.get(creator.user_id) ?? ""

  const productColumns: TableColumn[] = [
    { key: "title", label: "Produto" },
    { key: "type", label: "Tipo" },
    { key: "status", label: "Status" },
    { key: "price", label: "Preco", tone: "accent" },
  ]

  const productRows: TableRow[] = products.map((p) => ({
    title: p.title,
    type: p.type,
    status: p.status === "active" ? "Ativo" : p.status === "draft" ? "Rascunho" : "Oculto",
    price: formatPrice(Number(p.price) * 100),
  }))

  const orderColumns: TableColumn[] = [
    { key: "id_short", label: "Pedido" },
    { key: "buyer", label: "Comprador" },
    { key: "amount", label: "Valor", tone: "accent" },
    { key: "fee", label: "Taxa" },
    { key: "gateway", label: "Gateway" },
    { key: "status", label: "Status" },
    { key: "date", label: "Data" },
  ]

  function maskBuyerName(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return name
    const first = parts[0]
    const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + "." : ""
    return lastInitial ? `${first} ${lastInitial}` : first
  }

  const orderRows: TableRow[] = recentOrders.map((o) => ({
    id_short: o.id.slice(0, 8),
    buyer: `${maskBuyerName(o.buyer_name)} (${maskEmail(o.buyer_email)})`,
    amount: formatPrice(Number(o.amount)),
    fee: formatPrice(Number(o.platform_fee || 0)),
    gateway: o.gateway === "mercadopago" ? "Mercado Pago" : "Efi",
    status: o.status === "paid" ? "Pago" : o.status === "pending" ? "Pendente" : o.status === "refunded" ? "Reembolsado" : "Recusado",
    date: new Date(o.created_at).toLocaleDateString("pt-BR"),
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <header className="grid gap-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/criadores" className="text-sm font-semibold text-[#FF4D6D] hover:underline">&larr; Criadores</Link>
          <h1 className="mt-1 break-words text-2xl font-bold text-gray-900">{creator.name || creator.username}</h1>
          <p className="break-all text-sm text-gray-500">@{creator.username}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {creator.suspended ? <Badge tone="danger">Suspenso</Badge> : <Badge tone="success">Ativo</Badge>}
          {creator.plan === "pro" ? <Badge tone="accent">Pro</Badge> : <Badge tone="neutral">Free</Badge>}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 space-y-4">
          <h2 className="font-heading text-lg font-bold text-gray-900">Perfil</h2>
          {creator.avatar_url && (
            <img src={creator.avatar_url} alt="" className="size-16 rounded-full object-cover" />
          )}
          <p className="text-sm text-gray-600"><span className="font-semibold">Bio:</span> {creator.bio || "—"}</p>
          <p className="break-words text-sm text-gray-600">
            <span className="font-semibold">Loja:</span>{" "}
            <a href={`/${creator.username}`} target="_blank" rel="noopener noreferrer" className="break-all text-[#FF4D6D] hover:underline">
              pik.bio/{creator.username} &nearr;
            </a>
          </p>
          <p className="break-words text-sm text-gray-600">
            <span className="font-semibold">E-mail:</span> {maskEmail(creatorEmail) || "—"}
          </p>
          <p className="break-words text-sm text-gray-600">
            <span className="font-semibold">Cadastro:</span>{" "}
            {new Date(creator.created_at).toLocaleDateString("pt-BR")}
          </p>
          <p className="break-words text-sm text-gray-600">
            <span className="font-semibold">Plano:</span> {creator.plan === "pro" ? "Pro" : "Free"}
          </p>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-heading text-lg font-bold text-gray-900">Configuracoes</h2>
          <SettingsField label="Banco" value={settings?.bank_name} />
          <SettingsField label="Tipo conta" value={settings?.bank_account_type} />
          <SettingsField label="Agencia" value={settings?.bank_agency} />
          <SettingsField label="Conta" value={settings?.bank_account ? maskBankAccount(settings.bank_account) : null} />
          <SettingsField label="Documento" value={settings?.bank_document ? maskCpf(settings.bank_document) : null} />
          <SettingsField label="Titular" value={settings?.bank_holder} />
          <hr className="border-gray-100" />
          <SettingsField label="Webhook URL" value={settings?.webhook_url} />
          <SettingsField label="Webhook Secret" value={settings?.webhook_secret ? maskSecret(settings.webhook_secret) : null} />
          <SettingsField label="Meta Pixel ID" value={settings?.meta_pixel_id} />
          <SettingsField label="Meta Pixel Token" value={settings?.meta_pixel_token ? maskSecret(settings.meta_pixel_token) : null} />
          <SettingsField label="TikTok Pixel ID" value={settings?.tiktok_pixel_id} />
          <SettingsField label="TikTok Pixel Token" value={settings?.tiktok_pixel_token ? maskSecret(settings.tiktok_pixel_token) : null} />
          <SettingsField label="Google Analytics" value={settings?.google_analytics_measurement_id} />
          <SettingsField label="Gateway padrao" value={settings?.default_gateway} />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-gray-900">Produtos ({products.length})</h2>
        <DataTable columns={productColumns} rows={productRows} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-gray-900">Ultimas vendas</h2>
        {recentOrders.length ? (
          <DataTable columns={orderColumns} rows={orderRows} />
        ) : (
          <Card className="p-5 text-sm text-gray-500">Nenhuma venda encontrada.</Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-gray-900">Acoes</h2>
        <Card className="p-5">
          <CreatorActions creatorId={id} isSuspended={!!creator.suspended} />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-gray-900">Historico de auditoria</h2>
        {auditLogs.length ? (
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="grid gap-3 px-4 py-3 text-sm sm:flex sm:items-start sm:justify-between sm:gap-4 sm:px-5">
                  <div className="min-w-0">
                    <span className="break-words font-semibold text-gray-900">{log.action}</span>
                    {log.metadata && Object.keys(log.metadata as Record<string, unknown>).length > 0 && (
                      <span className="mt-1 block break-all text-xs text-gray-400 sm:ml-2 sm:mt-0 sm:inline">
                        {JSON.stringify(log.metadata)}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-left text-xs text-gray-400 sm:text-right">
                    <div className="break-all">{log.admin_email}</div>
                    <div>{new Date(log.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-5 text-sm text-gray-500">Nenhum registro de auditoria.</Card>
        )}
      </section>
    </div>
  )
}

function SettingsField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1 text-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
      <span className="font-semibold text-gray-700">{label}</span>
      <span className="text-gray-600">{value || "—"}</span>
    </div>
  )
}
