"use client";

import { Bell, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

type TopBarProps = {
  onMenuClick: () => void;
};

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications?limit=10", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => {
        const unread = (payload.data?.notifications ?? []).filter((item: { read_at?: string | null }) => !item.read_at).length;
        setUnreadCount(unread);
      })
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 px-4 backdrop-blur md:hidden">
      <BrandLogo href="/dashboard" imageClassName="size-8" textClassName="text-lg text-[var(--text-primary)]" />
      <div className="flex items-center gap-2">
        <div className="relative grid size-11 place-items-center rounded-[10px] bg-[var(--bg-elevated)] text-[var(--text-primary)]">
          <Bell size={19} />
          {unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[#FF4D6D]" />}
        </div>
        <button type="button" onClick={onMenuClick} className="grid size-11 place-items-center rounded-[10px] bg-[var(--bg-elevated)] text-[var(--text-primary)]" aria-label="Abrir menu">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}


