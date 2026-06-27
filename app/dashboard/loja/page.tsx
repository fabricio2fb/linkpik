"use client";

import Link from "next/link";
import { ExternalLink, Save } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import StoreEditor from "@/components/editor/StoreEditor";
import PhonePreview from "@/components/store/PhonePreview";
import { mapApiCreator, mapApiProduct } from "@/lib/api-mappers";
import { useSession } from "@/lib/hooks/use-session";
import type { Creator, Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";
import { THEME_PRESETS } from "@/lib/theme-presets";

export default function DashboardLojaPage() {
  const { session, loading: sessionLoading } = useSession();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<StoreTheme>(THEME_PRESETS.cards);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.creator) {
      setCreator(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch("/api/creators/me", { credentials: "include" }),
      fetch("/api/products", { credentials: "include" }),
      fetch("/api/links", { credentials: "include" }),
    ])
      .then((responses) => Promise.all(responses.map((response) => response.json())))
      .then(([creatorPayload, productsPayload, linksPayload]) => {
        const mappedCreator = mapApiCreator(creatorPayload.data, linksPayload.data);
        setCreator(mappedCreator);
        setTheme(mappedCreator.theme ?? THEME_PRESETS.cards);
        setProducts((productsPayload.data ?? []).map(mapApiProduct));
      })
      .catch(() => showToast("Erro ao carregar loja"))
      .finally(() => setLoading(false));
  }, [session, sessionLoading]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }

  function updateTheme(nextTheme: StoreTheme) {
    setTheme(nextTheme);
    setCreator((current) => current ? { ...current, theme: nextTheme, template: nextTheme.template, accentColor: nextTheme.accentColor, avatarColor: nextTheme.accentColor } : current);
  }

  async function saveChanges() {
    if (!creator) return;
    const presentationVideo = creator.presentationVideo?.url.trim()
      ? {
          url: creator.presentationVideo.url.trim(),
          showThumbnail: creator.presentationVideo.showThumbnail,
          title: creator.presentationVideo.title?.trim() || undefined,
          description: creator.presentationVideo.description?.trim() || undefined,
          caption: creator.presentationVideo.caption?.trim() || undefined,
          thumbnail: creator.presentationVideo.thumbnail?.trim() || undefined,
        }
      : null;
    const response = await fetch("/api/creators/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: creator.name,
        bio: creator.bio,
        username: creator.username,
        avatar_url: creator.avatarImage && /^https?:\/\//.test(creator.avatarImage) ? creator.avatarImage : null,
        cover_url: creator.coverImage && /^https?:\/\//.test(creator.coverImage) ? creator.coverImage : null,
        theme: {
          ...theme,
          presentationVideo,
        },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.data) {
      const mappedCreator = mapApiCreator(payload.data, creator.links);
      setCreator(mappedCreator);
      setTheme(mappedCreator.theme ?? theme);
    }
    showToast(response.ok ? "Loja atualizada" : payload.error ?? "Erro ao salvar loja");
  }

  function resetTheme() {
    updateTheme({ ...THEME_PRESETS[theme.template] });
    showToast("Tema resetado para o preset");
  }

  if (sessionLoading || loading) return null;

  if (!creator) {
    return <div className="p-6 text-sm text-[var(--text-secondary)]">Loja nao encontrada.</div>;
  }

  return (
    <div className="w-full min-w-0 space-y-5 overflow-x-hidden">
      <header className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Minha loja</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Edite conteudo, midia, links e aparencia da sua loja.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={saveChanges}><Save size={16} />Salvar alteracoes</Button>
          <Button variant="secondary" onClick={resetTheme}>Resetar tema</Button>
          <Link href={`/${creator.username}`} target="_blank"><Button variant="secondary"><ExternalLink size={16} />Ver loja</Button></Link>
        </div>
      </header>

      <div className="grid w-full min-w-0 gap-6 overflow-x-hidden xl:grid-cols-2">
        <StoreEditor
          creator={creator}
          products={products}
          theme={theme}
          onThemeChange={updateTheme}
          onCreatorChange={setCreator}
          onProductsChange={setProducts}
          onToast={showToast}
        />
        <aside className="hidden xl:block">
          <div className="sticky top-6">
            <PhonePreview creator={{ ...creator, theme }} products={products} theme={theme} />
          </div>
        </aside>
      </div>
      <Toast message={toast} />
    </div>
  );
}
