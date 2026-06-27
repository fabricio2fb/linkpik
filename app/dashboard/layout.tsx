"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useTheme } from "@/components/ThemeProvider";
import { useLocalStorageMigration } from "@/lib/hooks/use-localstorage-migration";
import { SessionProvider, useSession } from "@/lib/hooks/use-session";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { session } = useSession();

  useLocalStorageMigration(session?.id ?? null);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} creator={session?.creator} />
      <TopBar onMenuClick={() => setMenuOpen(true)} />
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed right-6 top-5 z-30 hidden size-10 place-items-center rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:rotate-[360deg] md:grid"
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <main className="px-4 py-6 md:ml-16 md:px-6 xl:ml-72 xl:px-8">{children}</main>
    </div>
  );
}

