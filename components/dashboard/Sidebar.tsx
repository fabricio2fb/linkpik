"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MonitorDown,
  Package,
  Route,
  Settings,
  ShoppingBag,
  Store,
  Truck,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { clsx } from "clsx";
import BrandLogo from "@/components/BrandLogo";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";

function getInitials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

type SidebarItemConfig = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

type SidebarGroupConfig = {
  title: string;
  items: SidebarItemConfig[];
};

const sidebarGroups: SidebarGroupConfig[] = [
  {
    title: "Principal",
    items: [
      { label: "Visao geral", href: "/dashboard", icon: LayoutDashboard },
      { label: "Minha loja", href: "/dashboard/loja", icon: Store },
    ],
  },
  {
    title: "Infoprodutos",
    items: [
      { label: "Painel digital", href: "/dashboard/infoprodutos", icon: MonitorDown },
      { label: "Produtos digitais", href: "/dashboard/infoprodutos/produtos", icon: FileArchive },
      { label: "Vendas digitais", href: "/dashboard/infoprodutos/vendas", icon: Download },
      { label: "Acessos liberados", href: "/dashboard/infoprodutos/acessos", icon: KeyRound },
    ],
  },
  ...(FEATURE_PHYSICAL_PRODUCT
    ? [
        {
          title: "Produtos fisicos",
          items: [
            { label: "Painel fisico", href: "/dashboard/fisicos", icon: Boxes },
            { label: "Produtos fisicos", href: "/dashboard/fisicos/produtos", icon: Package },
            { label: "Pedidos fisicos", href: "/dashboard/fisicos/pedidos", icon: ShoppingBag },
            { label: "Estoque", href: "/dashboard/fisicos/estoque", icon: Warehouse },
            { label: "Entregas", href: "/dashboard/fisicos/entregas", icon: Truck },
            { label: "Frete e rastreio", href: "/dashboard/fisicos/frete", icon: Route },
          ],
        },
      ]
    : []),
  {
    title: "Crescimento",
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Configuracoes", href: "/dashboard/configuracoes", icon: Settings },
    ],
  },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  creator?: {
    username?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    plan?: "free" | "pro";
  } | null;
};

export default function Sidebar({ mobileOpen = false, onClose, creator }: SidebarProps) {
  const pathname = usePathname();
  const isPro = creator?.plan === "pro";
  const storeHref = creator?.username ? `/${creator.username}` : "/dashboard/loja";
  const creatorName = creator?.name || creator?.username || "Minha loja";
  const initialOpen = useMemo(() => Object.fromEntries(sidebarGroups.map((group) => [group.title, true])), []);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);

  function toggleGroup(title: string) {
    setOpenGroups((current) => ({ ...current, [title]: !current[title] }));
  }

  const content = (
    <div className="flex h-full flex-col bg-[var(--bg-primary)] p-4">
      <div className="flex h-12 items-center justify-between px-2">
        <BrandLogo href="/dashboard" className="md:hidden xl:flex" textClassName="text-[var(--text-primary)]" />
        <BrandLogo href="/dashboard" compact className="hidden md:flex xl:hidden" imageClassName="size-9" />
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-[10px] bg-[var(--bg-elevated)] text-[var(--text-primary)] md:hidden"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm font-bold text-[var(--text-primary)] md:hidden">
        Dashboard Pikbio
      </div>

      <nav className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1 store-scrollbar">
        <div className="grid gap-4">
          {sidebarGroups.map((group) => (
            <div key={group.title}>
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="group flex h-7 w-full items-center justify-between rounded-[8px] px-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] md:justify-center xl:justify-between"
              >
                <span className="md:hidden xl:inline">{group.title}</span>
                <span className="hidden h-px flex-1 bg-[var(--border-subtle)] md:block xl:hidden" />
                <ChevronDown size={14} className={clsx("hidden transition md:block xl:block", !openGroups[group.title] && "-rotate-90")} />
              </button>
              {openGroups[group.title] && (
                <div className="mt-1 grid gap-1">
                  {group.items.map((item, index) => (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      active={pathname === item.href}
                      nested={index > 0}
                      onClose={onClose}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-4 space-y-4">
        {isPro ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 md:grid md:place-items-center xl:block xl:place-items-stretch">
            <div className="flex items-center gap-3 md:justify-center xl:justify-start">
              <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#FF4D6D] text-sm font-black text-white ring-2 ring-[#22C55E]/35">
                {creator?.avatar_url ? <Image src={creator.avatar_url} alt="" fill sizes="40px" className="object-contain" unoptimized={!creator.avatar_url.startsWith("http")} /> : getInitials(creatorName)}
              </div>
              <div className="min-w-0 md:hidden xl:block">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-[var(--text-primary)]">{creatorName}</p>
                  <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-black text-[#22C55E]">PRO</span>
                </div>
                <p className="truncate text-xs text-[var(--text-secondary)]">@{creator?.username ?? "loja"}</p>
              </div>
            </div>
            <Link
              href={storeHref}
              target={creator?.username ? "_blank" : undefined}
              onClick={onClose}
              className="mt-3 flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#22C55E] px-3 text-sm font-bold text-[#06130A] transition hover:brightness-110 md:mt-0 md:size-10 md:px-0 xl:mt-3 xl:size-auto xl:px-3"
              aria-label="Ir para loja"
            >
              <ExternalLink size={16} />
              <span className="md:hidden xl:inline">Ir para loja</span>
            </Link>
          </div>
        ) : (
          <Link
            href="/dashboard/configuracoes"
            onClick={onClose}
            className="block rounded-2xl border border-[#FF4D6D]/20 bg-[#FF4D6D]/10 p-4 transition hover:bg-[#FF4D6D]/15 md:hidden xl:block"
          >
            <p className="text-sm font-bold text-[var(--text-primary)]">Upgrade para Pro</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">Remova a marca d&apos;agua</p>
          </Link>
        )}
        <Link
          href="/login"
          className="flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        >
          <LogOut size={18} />
          <span className="md:hidden xl:inline">Sair</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] md:block xl:w-72">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fechar overlay" />
          <aside className="relative h-full w-[300px] animate-slide-up border-r border-[var(--border-subtle)] bg-[var(--bg-primary)]">{content}</aside>
        </div>
      )}
    </>
  );
}

function SidebarItem({ item, active, nested, onClose }: { item: SidebarItemConfig; active: boolean; nested?: boolean; onClose?: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={clsx(
        "group relative flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition",
        nested && "xl:ml-3",
        active
          ? "bg-[#FF4D6D] text-white"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
      )}
    >
      <Icon size={18} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate md:hidden xl:inline">{item.label}</span>
      {item.badge && <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-white xl:inline">{item.badge}</span>}
      <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] opacity-0 shadow-xl transition group-hover:opacity-100 md:group-hover:block xl:group-hover:hidden">
        {item.label}
      </span>
    </Link>
  );
}
