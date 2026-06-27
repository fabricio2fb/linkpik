"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface SessionData {
  id: string;
  email: string;
  creator: {
    id: string;
    username: string;
    name?: string;
    avatar_url?: string | null;
    plan?: "free" | "pro";
    payment_enabled?: boolean;
  } | null;
}

type SessionState = {
  session: SessionData | null;
  loading: boolean;
  refresh: () => Promise<SessionData | null>;
};

const SessionContext = createContext<SessionState | null>(null);
let cachedSession: SessionData | null = null;
let cacheLoaded = false;
let pendingSessionRequest: Promise<SessionData | null> | null = null;

async function fetchSession() {
  if (!pendingSessionRequest) {
    pendingSessionRequest = fetch("/api/auth/session", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => {
        cachedSession = payload.data ?? null;
        cacheLoaded = true;
        return cachedSession;
      })
      .catch(() => {
        cachedSession = null;
        cacheLoaded = true;
        return null;
      })
      .finally(() => {
        pendingSessionRequest = null;
      });
  }

  return pendingSessionRequest;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(cachedSession);
  const [loading, setLoading] = useState(!cacheLoaded);

  async function refresh() {
    setLoading(true);
    const nextSession = await fetchSession();
    setSession(nextSession);
    setLoading(false);
    return nextSession;
  }

  useEffect(() => {
    if (cacheLoaded) return;
    refresh();
  }, []);

  const value = useMemo(() => ({ session, loading, refresh }), [session, loading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  const [session, setSession] = useState<SessionData | null>(cachedSession);
  const [loading, setLoading] = useState(!cacheLoaded);

  useEffect(() => {
    if (context) return;
    if (cacheLoaded) return;
    fetchSession()
      .then(setSession)
      .finally(() => setLoading(false));
  }, [context]);

  if (context) return context;
  return { session, loading, refresh: fetchSession };
}
