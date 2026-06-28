import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { notFound } from "next/navigation"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { formatPrice } from "@/lib/utils"
import { maskEmail } from "@/lib/admin/mask"
import { getEmailsByUserId } from "@/lib/admin/auth-users"
import Badge from "@/components/ui/Badge"
import Card from "@/components/ui/Card"
import Link from "next/link"
import type { TableColumn, TableRow } from "@/lib/dashboard/types"
import DataTable from "@/components/dashboard/DataTable"

const PAGE_SIZE = 20

export default async function AdminCriadoresPage(props: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string; page?: string }>
}) {
  const adminUser = await requireAdminUser()
  if (!adminUser) notFound()
  const adminSession = await getAdminSession()
  if (!adminSession) notFound()

  const searchParams = await props.searchParams
  const q = searchParams.q?.trim() ?? ""
  const plan = searchParams.plan ?? ""
  const status = searchParams.status ?? ""
  const page = Math.max(1, Number(searchParams.page) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const supabase = createSupabaseService()

  let query = supabase.from("creators").select("*", { count: "exact" })

  if (q) {
    query = query.or(`name.ilike.%${q}%,username.ilike.%${q}%`)
  }
  if (plan === "free" || plan === "pro") {
    query = query.eq("plan", plan)
  }
  if (status === "suspended") {
    query = query.eq("suspended", true)
  } else if (status === "active") {
    query = query.eq("suspended", false)
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1)

  const { data: creators, count: total } = await query

  const safeCreators = creators ?? []
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))

  const userIds = safeCreators.map((c) => c.user_id).filter(Boolean)
  const emailMap = await getEmailsByUserId(userIds)

  const creatorIds = safeCreators.map((c) => c.id)
  const { data: ordersData } = await supabase
    .from("orders")
    .select("creator_id, amount")
    .eq("status", "paid")
    .in("creator_id", creatorIds)

  const salesByCreator: Record<string, number> = {}
  for (const o of ordersData ?? []) {
    salesByCreator[o.creator_id] = (salesByCreator[o.creator_id] || 0) + Number(o.amount || 0)
  }

  const columns: TableColumn[] = [
    { key: "name", label: "Nome" },
    { key: "username", label: "Username" },
    { key: "email", label: "E-mail" },
    { key: "plan", label: "Plano" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Cadastro" },
    { key: "total_sold", label: "Total Vendido", tone: "accent" },
  ]

  const rows: TableRow[] = safeCreators.map((c) => ({
    name: c.name ?? c.username,
    username: c.username,
    email: maskEmail(emailMap.get(c.user_id) ?? ""),
    plan: c.plan === "pro" ? "Pro" : "Free",
    status: c.suspended ? "Suspenso" : "Ativo",
    created_at: new Date(c.created_at).toLocaleDateString("pt-BR"),
    total_sold: formatPrice(salesByCreator[c.id] || 0),
    _id: c.id,
  }))

  const planOptions = [
    { value: "", label: "Todos os planos" },
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
  ]

  const statusOptions = [
    { value: "", label: "Todos os status" },
    { value: "active", label: "Ativo" },
    { value: "suspended", label: "Suspenso" },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Criadores</h1>
        <p className="mt-1 text-sm text-gray-500">{total ?? 0} criadores cadastrados</p>
      </header>

      <Card className="p-4">
        <form className="grid gap-3 lg:grid-cols-[1.5fr_180px_180px_auto]">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Busca</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Nome ou username..."
              className="input-base h-11 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Plano</span>
            <select name="plan" defaultValue={plan} className="input-base h-11 px-3">
              {planOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Status</span>
            <select name="status" defaultValue={status} className="input-base h-11 px-3">
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:flex sm:items-end">
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FF4D6D] px-4 text-sm font-semibold text-white hover:bg-[#FF2D55]">
              Filtrar
            </button>
            <Link href="/admin/criadores" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      <DataTable
        columns={columns}
        rows={rows.map((r) => ({
          ...r,
          name: (
            <Link href={`/admin/criadores/${r._id}`} className="font-semibold text-[#FF4D6D] hover:underline">
              {r.name}
            </Link>
          ),
          plan: r.plan === "Pro" ? <Badge tone="accent">Pro</Badge> : <Badge tone="neutral">Free</Badge>,
          status: r.status === "Ativo" ? <Badge tone="success">Ativo</Badge> : <Badge tone="danger">Suspenso</Badge>,
        }))}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams()
            if (q) params.set("q", q)
            if (plan) params.set("plan", plan)
            if (status) params.set("status", status)
            params.set("page", String(p))
            return (
              <Link
                key={p}
                href={`/admin/criadores?${params.toString()}`}
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
