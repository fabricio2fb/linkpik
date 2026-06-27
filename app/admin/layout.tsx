import { notFound } from "next/navigation"
import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import PinTotpGate from "./_components/PinTotpGate"
import AdminSidebar from "./_components/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await requireAdminUser()
  if (!adminUser) notFound()

  const adminSessionUserId = await getAdminSession()
  if (!adminSessionUserId) {
    return <PinTotpGate adminEmail={adminUser.email} totpConfigured={adminUser.totp_configured} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="md:ml-60">{children}</main>
    </div>
  )
}
