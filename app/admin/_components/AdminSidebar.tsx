"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Shield,
  DollarSign,
  FileText,
  Bot,
  LogOut,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/criadores", label: "Criadores", icon: Users },
  { href: "/admin/vendas", label: "Vendas", icon: ShoppingBag },
  { href: "/admin/exclusao-dados", label: "Privacidade", icon: Shield },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/blogauto", label: "Blog Auto", icon: Bot },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white md:hidden">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#FF4D6D] text-sm font-bold text-white">
            P
          </div>
          <span className="truncate font-heading text-base font-bold text-gray-900">Admin</span>
        </Link>
        <button
          onClick={handleLogout}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = isActivePath(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#FF4D6D]/10 text-[#FF4D6D]"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>

    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <div className="grid size-9 place-items-center rounded-lg bg-[#FF4D6D] text-sm font-bold text-white">
          P
        </div>
        <span className="font-heading text-base font-bold text-gray-900">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = isActivePath(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#FF4D6D]/10 text-[#FF4D6D]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
    </>
  )
}
