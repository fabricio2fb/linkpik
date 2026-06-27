import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { notFound } from "next/navigation"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { maskEmail } from "@/lib/admin/mask"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import PrivacyConfirmModal from "./_components/PrivacyConfirmModal"
import ManualAddModal from "./_components/ManualAddModal"

type PrivacyRequestRow = {
  id: string
  email: string
  user_type: string
  status: string
  request_type: string
  notes: string | null
  created_at: string
  processed_at: string | null
  processed_by: string | null
}

export default async function AdminExclusaoPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const adminUser = await requireAdminUser()
  if (!adminUser) notFound()
  const adminSession = await getAdminSession()
  if (!adminSession) notFound()

  const searchParams = await props.searchParams
  const statusFilter = searchParams.status ?? ""

  const supabase = createSupabaseService()

  let pendingQuery = supabase
    .from("privacy_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  const doneStatuses =
    statusFilter === "done" ? ["done"] :
    statusFilter === "cancelled" ? ["cancelled"] :
    statusFilter === "processing" ? ["processing"] :
    ["done", "cancelled", "processing"]

  const doneQuery = supabase
    .from("privacy_requests")
    .select("*")
    .in("status", doneStatuses)
    .order("created_at", { ascending: false })
    .limit(50)

  const [pendingResult, doneResult] = await Promise.all([
    pendingQuery,
    doneQuery,
  ])

  const pendingRequests = (pendingResult.data ?? []) as PrivacyRequestRow[]
  const doneRequests = (doneResult.data ?? []) as PrivacyRequestRow[]

  const statusOptions = [
    { value: "", label: "Todos" },
    { value: "done", label: "Concluidos" },
    { value: "processing", label: "Em andamento" },
    { value: "cancelled", label: "Cancelados" },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacidade (LGPD)</h1>
          <p className="mt-1 text-sm text-gray-500">Central de tratamento de dados pessoais</p>
        </div>
        <ManualAddModal />
      </header>

      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-gray-900">
            Pedidos pendentes ({pendingRequests.length})
          </h2>
          <Card className="overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Tipo usuario</th>
                    <th className="px-5 py-4">Tipo pedido</th>
                    <th className="px-5 py-4">Data</th>
                    <th className="px-5 py-4">Acao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-semibold text-gray-900">{maskEmail(req.email)}</td>
                      <td className="px-5 py-4">
                        <Badge tone={req.user_type === "creator" ? "accent" : "neutral"}>
                          {req.user_type === "creator" ? "Creator" : "Comprador"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={req.request_type === "delete" ? "danger" : "warning"}>
                          {req.request_type === "delete" ? "Exclusao" : "Exportacao"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(req.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-4">
                        <PrivacyConfirmModal
                          requestId={req.id}
                          email={req.email}
                          requestType={req.request_type}
                          userType={req.user_type}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-3 md:hidden">
              {pendingRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900">{maskEmail(req.email)}</span>
                    {req.user_type === "creator" ? <Badge tone="accent">Creator</Badge> : <Badge tone="neutral">Comprador</Badge>}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {req.request_type === "delete" ? "Exclusao" : "Exportacao"} &middot;{" "}
                    {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="mt-3">
                    <PrivacyConfirmModal
                      requestId={req.id}
                      email={req.email}
                      requestType={req.request_type}
                      userType={req.user_type}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {pendingRequests.length === 0 && (
        <Card className="p-6 text-center text-sm text-gray-500">
          Nenhum pedido pendente no momento.
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-gray-900">Historico</h2>
          <div className="flex gap-2">
            {statusOptions.map((o) => {
              const params = new URLSearchParams()
              if (o.value) params.set("status", o.value)
              const href = o.value ? `/admin/exclusao-dados?${params.toString()}` : "/admin/exclusao-dados"
              return (
                <a
                  key={o.value}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    statusFilter === o.value || (!statusFilter && !o.value)
                      ? "bg-[#FF4D6D] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {o.label}
                </a>
              )
            })}
          </div>
        </div>
        {doneRequests.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Tipo</th>
                    <th className="px-5 py-4">Pedido</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Processado por</th>
                    <th className="px-5 py-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doneRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-semibold text-gray-900">{maskEmail(req.email)}</td>
                      <td className="px-5 py-4">
                        <Badge tone={req.user_type === "creator" ? "accent" : "neutral"}>
                          {req.user_type === "creator" ? "Creator" : "Comprador"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={req.request_type === "delete" ? "danger" : "warning"}>
                          {req.request_type === "delete" ? "Exclusao" : "Exportacao"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {req.status === "done" ? <Badge tone="success">Concluido</Badge> :
                         req.status === "processing" ? <Badge tone="warning">Processando</Badge> :
                         <Badge tone="danger">Cancelado</Badge>}
                      </td>
                      <td className="px-5 py-4 text-gray-500">{req.processed_by || "—"}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {req.processed_at
                          ? new Date(req.processed_at).toLocaleDateString("pt-BR")
                          : new Date(req.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-3 md:hidden">
              {doneRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900">{maskEmail(req.email)}</span>
                    <Badge tone={req.status === "done" ? "success" : req.status === "processing" ? "warning" : "danger"}>
                      {req.status === "done" ? "Concluido" : req.status === "processing" ? "Processando" : "Cancelado"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {req.user_type === "creator" ? "Creator" : "Comprador"} &middot;{" "}
                    {req.request_type === "delete" ? "Exclusao" : "Exportacao"}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {req.processed_by ? `${req.processed_by} em ` : ""}
                    {req.processed_at
                      ? new Date(req.processed_at).toLocaleDateString("pt-BR")
                      : new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-gray-500">
            Nenhum pedido processado ainda.
          </Card>
        )}
      </section>
    </div>
  )
}
