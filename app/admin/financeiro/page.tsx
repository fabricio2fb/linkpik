import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { notFound } from "next/navigation"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { formatPrice } from "@/lib/utils"
import Card from "@/components/ui/Card"
import Link from "next/link"
import { DollarSign, TrendingUp, Users } from "lucide-react"
import MetricCard from "@/components/dashboard/MetricCard"
import MrrChart from "./_components/MrrChart"
import type { MrrPoint } from "./_components/MrrChart"

const PLATFORM_FEE_RATE: Record<string, number> = {
  free: 0.10,
  pro: 0.05,
}

const PRO_MONTHLY_PRICE = 2900

const PERIOD_OPTIONS = [
  { value: "", label: "Todo periodo" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "90d", label: "Ultimos 90 dias" },
  { value: "12m", label: "Ultimos 12 meses" },
]

export default async function AdminFinanceiroPage(props: {
  searchParams: Promise<{ period?: string }>
}) {
  const adminUser = await requireAdminUser()
  if (!adminUser) notFound()
  const adminSession = await getAdminSession()
  if (!adminSession) notFound()

  const searchParams = await props.searchParams
  const period = searchParams.period ?? ""

  const supabase = createSupabaseService()

  const now = Date.now()
  let dateFilter: Date | null = null
  if (period === "30d") dateFilter = new Date(now - 30 * 86400000)
  else if (period === "90d") dateFilter = new Date(now - 90 * 86400000)
  else if (period === "12m") dateFilter = new Date(now - 365 * 86400000)

  const sixMonthsAgo = new Date(now - 180 * 86400000)

  const [allCreatorsResult, ordersResult, subsResult] = await Promise.all([
    supabase.from("creators").select("id, plan, created_at"),
    supabase.from("orders").select("amount, platform_fee, creator_id, status, created_at").eq("status", "paid"),
    supabase.from("creator_subscriptions").select("creator_id, status").eq("status", "active"),
  ])

  const allCreators = allCreatorsResult.data ?? []
  const allOrders = ordersResult.data ?? []
  const activeSubs = subsResult.data ?? []

  const activeSubCreatorIds = new Set(activeSubs.map((s) => s.creator_id))
  const activePro = activeSubCreatorIds.size > 0
    ? activeSubCreatorIds.size
    : allCreators.filter((c) => c.plan === "pro").length

  const isUsingSubsTable = activeSubCreatorIds.size > 0

  const ordersInPeriod = dateFilter
    ? allOrders.filter((o) => new Date(o.created_at) >= dateFilter!)
    : allOrders

  const creatorMap = new Map(allCreators.map((c) => [c.id, c]))

  let feeFree = 0
  let feePro = 0
  let feeUnknown = 0

  for (const o of ordersInPeriod) {
    const c = creatorMap.get(o.creator_id)
    const plan = c?.plan ?? "unknown"
    const pf = Number(o.platform_fee || 0)
    if (plan === "free") feeFree += pf
    else if (plan === "pro") feePro += pf
    else feeUnknown += pf
  }

  const currentMrr = activePro * PRO_MONTHLY_PRICE

  const proCreatorIdsWithActiveSub = new Set(
    activeSubs.map((s) => s.creator_id)
  )

  const monthBuckets = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`
    monthBuckets.set(key, 0)
  }

  let cumulativePro = isUsingSubsTable
    ? allCreators.filter(
        (c) =>
          proCreatorIdsWithActiveSub.has(c.id) &&
          new Date(c.created_at) < sixMonthsAgo
      ).length
    : allCreators.filter(
        (c) => c.plan === "pro" && new Date(c.created_at) < sixMonthsAgo
      ).length

  const proByMonth: { month: string; count: number }[] = []
  for (const [monthLabel, _] of monthBuckets) {
    const [mStr, yStr] = monthLabel.split("/")
    const month = Number(mStr) - 1
    const year = 2000 + Number(yStr)
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 1)

    const joinedThisMonth = isUsingSubsTable
      ? allCreators.filter(
          (c) =>
            proCreatorIdsWithActiveSub.has(c.id) &&
            new Date(c.created_at) >= startOfMonth &&
            new Date(c.created_at) < endOfMonth
        ).length
      : allCreators.filter(
          (c) =>
            c.plan === "pro" &&
            new Date(c.created_at) >= startOfMonth &&
            new Date(c.created_at) < endOfMonth
        ).length

    cumulativePro += joinedThisMonth
    proByMonth.push({ month: monthLabel, count: cumulativePro })
  }

  const mrrData: MrrPoint[] = proByMonth.map((p) => ({
    month: p.month,
    mrr: p.count * PRO_MONTHLY_PRICE,
    subs: p.count,
  }))

  const mrrSubtitle = isUsingSubsTable
    ? `${activePro} assinaturas ativas no Mercado Pago`
    : `${activePro} criadores com plan=pro (fallback: sem tabela de assinaturas)`

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="mt-1 text-sm text-gray-500">Receitas da plataforma</p>
      </header>

      <Card className="p-4">
        <form className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
          <label className="grid gap-1 text-sm font-medium text-gray-700 sm:min-w-56">
            <span>Periodo</span>
            <select name="period" defaultValue={period} className="input-base h-11 px-3">
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FF4D6D] px-4 text-sm font-semibold text-white hover:bg-[#FF2D55]">
            Aplicar
          </button>
          <Link href="/admin/financeiro" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Limpar
          </Link>
        </form>
      </Card>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Taxa Free (10%)"
          value={formatPrice(feeFree)}
          delta="Receita de criadores Free"
          icon={DollarSign}
          color="#F59E0B"
        />
        <MetricCard
          label="Taxa Pro (5%)"
          value={formatPrice(feePro)}
          delta="Receita de criadores Pro"
          icon={DollarSign}
          color="#22C55E"
        />
        <MetricCard
          label="Assinantes Pro"
          value={String(activePro)}
          delta={`${activePro} x R$ 29 = ${formatPrice(currentMrr)}/mes`}
          icon={Users}
          color="#38BDF8"
        />
        <MetricCard
          label="MRR"
          value={formatPrice(currentMrr)}
          delta={mrrSubtitle}
          icon={TrendingUp}
          color="#FF4D6D"
        />
      </section>

      <section>
        <MrrChart data={mrrData} />
      </section>
    </div>
  )
}
