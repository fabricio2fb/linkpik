import Link from "next/link";

type AccessResponse = {
  data?: {
    product: {
      title: string;
      type: string;
      cover_url?: string | null;
    };
    download_url?: string | null;
    delivery_url?: string | null;
    delivery_message?: string | null;
    thank_you_message?: string | null;
    thank_you_url?: string | null;
    buyer_name: string;
  };
  error?: string;
};

async function getAccess(token: string): Promise<AccessResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pik.bio";
  const response = await fetch(`${baseUrl}/api/access/${token}`, {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { error: payload?.error ?? "Nao foi possivel acessar este produto." };
  return payload;
}

export default async function AccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await getAccess(token);

  if (!access.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--bg-primary)] px-6 text-[var(--text-primary)]">
        <section className="w-full max-w-md text-center">
          <p className="font-heading text-3xl font-black">Acesso indisponivel</p>
          <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{access.error ?? "Este link esta invalido ou expirou."}</p>
          <Link href="/" className="mt-6 inline-flex rounded-[10px] bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white">
            Voltar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg-primary)] px-6 text-[var(--text-primary)]">
      <section className="w-full max-w-md">
        {access.data.product.cover_url && (
          <img src={access.data.product.cover_url} alt="" className="mb-6 aspect-video w-full rounded-2xl bg-[var(--bg-elevated)] object-contain" />
        )}
        <p className="text-sm font-semibold text-[var(--text-secondary)]">Ola, {access.data.buyer_name}</p>
        <h1 className="mt-2 font-heading text-3xl font-black">{access.data.product.title}</h1>
        <p className="mt-3 text-sm capitalize text-[var(--text-secondary)]">{access.data.product.type}</p>
        {access.data.delivery_message && (
          <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            {access.data.delivery_message}
          </div>
        )}
        {access.data.thank_you_message && (
          <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            {access.data.thank_you_message}
          </div>
        )}
        {access.data.download_url && (
          <a
            href={access.data.download_url}
            className="mt-7 inline-flex w-full justify-center rounded-[10px] bg-[#7c3aed] px-5 py-4 text-sm font-bold text-white"
          >
            Baixar produto
          </a>
        )}
        {access.data.delivery_url && (
          <a
            href={access.data.delivery_url}
            rel="noreferrer"
            className="mt-4 inline-flex w-full justify-center rounded-[10px] bg-[#7c3aed] px-5 py-4 text-sm font-bold text-white"
          >
            Acessar conteúdo
          </a>
        )}
        {access.data.thank_you_url && (
          <a
            href={access.data.thank_you_url}
            rel="noreferrer"
            className="mt-4 inline-flex w-full justify-center rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 text-sm font-bold text-[var(--text-primary)]"
          >
            Abrir página de agradecimento
          </a>
        )}
        {access.data.download_url && <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">Este link de download expira em 30 minutos.</p>}
      </section>
    </main>
  );
}
