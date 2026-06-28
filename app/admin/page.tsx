import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { notFound } from "next/navigation"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { Users, DollarSign, Percent, Package, UserPlus, TrendingUp } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import MetricCard from "@/components/dashboard/MetricCard"
import AdminGrowthChart from "./_components/AdminGrowthChart"
import type { GrowthPoint } from "./_components/AdminGrowthChart"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dec"]

function monthLabel(date: Date): string {
  return MONTHS[date.getMonth()] + "/" + String(date.getFullYear()).slice(2)
}

export default async function AdminDashboardPage() {
  const adminUser = await requireAdminUser()
  if (!adminUser) notFound()

  const adminSession = await getAdminSession()
  if (!adminSession) notFound()

  const supabase = createSupabaseService()

  const [creatorsResult, ordersResult, productsResult] = await Promise.all([
    supabase.from("creators").select("plan, created_at"),
    supabase.from("orders").select("amount, platform_fee, paid_at").eq("status", "paid"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
  ])

  const creators = creatorsResult.data ?? []
  const orders = ordersResult.data ?? []
  const activeProducts = productsResult.count ?? 0

  const totalCreators = creators.length
  const freeCreators = creators.filter((c) => c.plan === "free").length
  const proCreators = creators.filter((c) => c.plan === "pro").length

  const now = Date.now()
  const sevenDaysAgo = new Date(now - 7 * 86400000)
  const thirtyDaysAgo = new Date(now - 30 * 86400000)
  const sixMonthsAgo = new Date(now - 180 * 86400000)

  const newLast7 = creators.filter((c) => new Date(c.created_at) >= sevenDaysAgo).length
  const newLast30 = creators.filter((c) => new Date(c.created_at) >= thirtyDaysAgo).length

  const totalGmv = orders.reduce((s, o) => s + Number(o.amount || 0), 0)
  const totalPlatformFee = orders.reduce((s, o) => s + Number(o.platform_fee || 0), 0)

  const monthBuckets = new Map<string, { creators: number; gmv: number }>()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = monthLabel(d)
    monthBuckets.set(key, { creators: 0, gmv: 0 })
  }

  for (const c of creators) {
    const d = new Date(c.created_at)
    if (d >= sixMonthsAgo) {
      const key = monthLabel(d)
      if (monthBuckets.has(key)) {
        monthBuckets.get(key)!.creators++
      }
    }
  }

  for (const o of orders) {
    if (!o.paid_at) continue
    const d = new Date(o.paid_at)
    if (d >= sixMonthsAgo) {
      const key = monthLabel(d)
      if (monthBuckets.has(key)) {
        monthBuckets.get(key)!.gmv += Number(o.amount || 0)
      }
    }
  }

  const growthData: GrowthPoint[] = Array.from(monthBuckets.entries()).map(([month, data]) => ({
    month,
    creators: data.creators,
    gmv: data.gmv,
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Visao geral da plataforma</p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Criadores"
          value={String(totalCreators)}
          delta={`${freeCreators} Free · ${proCreators} Pro`}
          icon={Users}
          color="#38BDF8"
        />
        <MetricCard
          label="GMV Total"
          value={formatPrice(totalGmv)}
          delta="Soma de vendas pagas"
          icon={DollarSign}
          color="#22C55E"
        />
        <MetricCard
          label="Taxa Pikbio"
          value={formatPrice(totalPlatformFee)}
          delta="Comissoes retidas"
          icon={Percent}
          color="#FF4D6D"
        />
        <MetricCard
          label="Produtos Ativos"
          value={String(activeProducts)}
          delta="Cross-creator"
          icon={Package}
          color="#F59E0B"
        />
        <MetricCard
          label="Novos Cadastros"
          value={`${newLast7} / ${newLast30}`}
          delta="7 / 30 dias"
          icon={UserPlus}
          color="#A855F7"
        />
      </section>

      <section>
        <AdminGrowthChart data={growthData} />
      </section>
    </div>
  )
}
