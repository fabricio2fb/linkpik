import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { notFound } from "next/navigation"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { formatPrice } from "@/lib/utils"
import { maskEmail } from "@/lib/admin/mask"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import DataTable from "@/components/dashboard/DataTable"
import Link from "next/link"
import type { TableColumn, TableRow } from "@/lib/dashboard/types"

const PAGE_SIZE = 20

const STATUS_MAP: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  failed: "Recusado",
  canceled: "Recusado",
  refunded: "Reembolsado",
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "paid", label: "Pago" },
  { value: "pending", label: "Pendente" },
  { value: "failed", label: "Recusado" },
  { value: "refunded", label: "Reembolsado" },
]

const GATEWAY_OPTIONS = [
  { value: "", label: "Todos os gateways" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "efipay", label: "Efi" },
]

const PERIOD_OPTIONS = [
  { value: "", label: "Todo periodo" },
  { value: "7d", label: "Ultimos 7 dias" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "90d", label: "Ultimos 90 dias" },
]

function maskBuyerName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return name
  const first = parts[0]
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + "." : ""
  return lastInitial ? `${first} ${lastInitial}` : first
}

export default async function AdminVendasPage(props: {
  searchParams: Promise<{ q?: string; period?: string; status?: string; gateway?: string; start_date?: string; end_date?: string; page?: string }>
}) {
  const adminUser = await requireAdminUser()
  if (!adminUser) notFound()
  const adminSession = await getAdminSession()
  if (!adminSession) notFound()

  const sp = await props.searchParams
  const q = sp.q?.trim() ?? ""
  const period = sp.period ?? ""
  const statusFilter = sp.status ?? ""
  const gatewayFilter = sp.gateway ?? ""
  const startDate = sp.start_date ?? ""
  const endDate = sp.end_date ?? ""
  const page = Math.max(1, Number(sp.page) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const supabase = createSupabaseService()

  let creatorIds: string[] = []
  if (q) {
    const { data: matched } = await supabase
      .from("creators")
      .select("id")
      .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
    creatorIds = (matched ?? []).map((c) => c.id)
  }

  let orderQuery = supabase.from("orders").select("*", { count: "exact" })

  if (q) {
    const conditions = [`id.ilike.%${q}%`]
    if (creatorIds.length) {
      conditions.push(`creator_id.in.(${creatorIds.join(",")})`)
    }
    orderQuery = orderQuery.or(conditions.join(","))
  }

  if (statusFilter && STATUS_MAP[statusFilter]) {
    orderQuery = orderQuery.eq("status", statusFilter)
  }

  if (gatewayFilter) {
    orderQuery = orderQuery.eq("gateway", gatewayFilter)
  }

  if (period === "7d") {
    const d = new Date(Date.now() - 7 * 86400000).toISOString()
    orderQuery = orderQuery.gte("created_at", d)
  } else if (period === "30d") {
    const d = new Date(Date.now() - 30 * 86400000).toISOString()
    orderQuery = orderQuery.gte("created_at", d)
  } else if (period === "90d") {
    const d = new Date(Date.now() - 90 * 86400000).toISOString()
    orderQuery = orderQuery.gte("created_at", d)
  }

  if (startDate) orderQuery = orderQuery.gte("created_at", new Date(startDate).toISOString())
  if (endDate) orderQuery = orderQuery.lte("created_at", new Date(endDate + "T23:59:59").toISOString())

  orderQuery = orderQuery.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1)

  const { data: orders, count: total } = await orderQuery

  const safeOrders = orders ?? []
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))

  const creatorIdsFromOrders = [...new Set(safeOrders.map((o) => o.creator_id))]
  const productIds = [...new Set(safeOrders.map((o) => o.product_id))]

  const [{ data: creators }, { data: products }] = await Promise.all([
    supabase.from("creators").select("id, name, username").in("id", creatorIdsFromOrders),
    supabase.from("products").select("id, title").in("id", productIds),
  ])

  const creatorMap = new Map((creators ?? []).map((c) => [c.id, c]))
  const productMap = new Map((products ?? []).map((p) => [p.id, p.title]))

  const columns: TableColumn[] = [
    { key: "order_id", label: "Pedido" },
    { key: "creator", label: "Criador" },
    { key: "buyer", label: "Comprador" },
    { key: "product", label: "Produto" },
    { key: "amount", label: "Valor", tone: "accent" },
    { key: "fee", label: "Taxa" },
    { key: "gateway", label: "Gateway" },
    { key: "status", label: "Status" },
    { key: "date", label: "Data" },
  ]

  const rows: TableRow[] = safeOrders.map((o) => {
    const c = creatorMap.get(o.creator_id)
    const creatorName = c?.name || c?.username || "—"
    return {
      order_id: o.id.slice(0, 8),
      creator: (
        <Link href={`/admin/criadores/${o.creator_id}`} className="font-semibold text-[#FF4D6D] hover:underline">
          {creatorName}
        </Link>
      ),
      buyer: (
        <span className="text-xs">
          <span>{maskBuyerName(o.buyer_name)}</span>
          <br />
          <span className="text-[var(--text-tertiary)]">{maskEmail(o.buyer_email)}</span>
        </span>
      ),
      product: productMap.get(o.product_id) ?? o.product_id.slice(0, 8),
      amount: formatPrice(Number(o.amount)),
      fee: formatPrice(Number(o.platform_fee || 0)),
      gateway: o.gateway === "mercadopago" ? "Mercado Pago" : "Efi",
      status: (() => {
        const label = STATUS_MAP[o.status] ?? o.status
        if (o.status === "paid") return <Badge tone="success">{label}</Badge>
        if (o.status === "pending") return <Badge tone="warning">{label}</Badge>
        if (o.status === "refunded") return <Badge tone="danger">{label}</Badge>
        return <Badge tone="danger">{label}</Badge>
      })(),
      date: new Date(o.created_at).toLocaleDateString("pt-BR"),
    }
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <p className="mt-1 text-sm text-gray-500">{total ?? 0} pedidos no total</p>
      </header>

      <Card className="p-4">
        <form className="grid gap-3 lg:grid-cols-[1.5fr_160px_160px_160px_auto]">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Busca</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Pedido ID ou nome do criador..."
              className="input-base h-11 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Periodo</span>
            <select name="period" defaultValue={period} className="input-base h-11 px-3">
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Status</span>
            <select name="status" defaultValue={statusFilter} className="input-base h-11 px-3">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Gateway</span>
            <select name="gateway" defaultValue={gatewayFilter} className="input-base h-11 px-3">
              {GATEWAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:flex sm:items-end">
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FF4D6D] px-4 text-sm font-semibold text-white hover:bg-[#FF2D55]">
              Filtrar
            </button>
            <Link href="/admin/vendas" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Limpar
            </Link>
          </div>
        </form>
        {(startDate || endDate) && (
          <div className="mt-3 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <label className="grid gap-1 text-sm font-medium text-gray-700">
              <span>Data inicio</span>
              <input name="start_date" type="date" defaultValue={startDate} className="input-base h-11 px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-gray-700">
              <span>Data fim</span>
              <input name="end_date" type="date" defaultValue={endDate} className="input-base h-11 px-3" />
            </label>
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-gray-100 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-200 sm:mt-5">
              Aplicar datas
            </button>
          </div>
        )}
      </Card>

      <DataTable columns={columns} rows={rows} />

      {totalPages > 1 && (
        <div className="flex items-center justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams()
            if (q) params.set("q", q)
            if (period) params.set("period", period)
            if (statusFilter) params.set("status", statusFilter)
            if (gatewayFilter) params.set("gateway", gatewayFilter)
            if (startDate) params.set("start_date", startDate)
            if (endDate) params.set("end_date", endDate)
            params.set("page", String(p))
            return (
              <Link
                key={p}
                href={`/admin/vendas?${params.toString()}`}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${
                  p === page
                    ? "bg-[#FF4D6D] text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
