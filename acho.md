# Achados do RIFAZAP — coisas que o Pikbio pode adotar

Analisei o projeto **RIFAZAP** (Next.js 15 + Supabase + Genkit) e comparei com o Pikbio. Abaixo, o que ele **já tem de relevante** que o Pikbio **não tem** (ou tem de forma inferior), organizado por prioridade estimada.

---

## 1. JSON-LD (Schema.org) — Structured Data

**RIFAZAP:** Tem `src/lib/seo-schemas.ts` com 6 schemas diferentes (`Organization`, `WebSite`, `SoftwareApplication`, `FAQPage`, `HowTo`, + breadcrumbs nas páginas `/ia/`). Injetados via `<script type="application/ld+json">` no layout raiz e nas páginas específicas.

**Pikbio:** Zero schemas. Nenhuma página tem structured data.

**Ganho:** Rich snippets no Google (estrelas, FAQs expansíveis, breadcrumbs). Essencial para SEO de lojas de criador.

**O que fazer:** Criar `lib/seo-schemas.ts` com:
- `Organization` + `WebSite` no layout raiz
- `Product` + `Offer` nas páginas de produto público (`/[username]/[product-id]`)
- `FAQPage` nas landing pages institucionais
- `BreadcrumbList` nas páginas internas

---

## 2. Cookie Consent Banner (LGPD)

**RIFAZAP:** `CookieConsentBanner.tsx` — banner LGPD no rodapé fixo com "Aceitar todos" vs "Apenas essenciais". Tracking scripts (gtag, Meta Pixel) só carregam após consentimento `"all"`. Salva escolha no localStorage.

**Pikbio:** Tem páginas de privacidade e LGPD, mas **nenhum banner de consentimento**. Os pixels dos criadores disparam sem aviso/prévia autorização.

**Ganho:** Conformidade LGPD + evitar multas. Melhora信任 do visitante.

**O que fazer:** Copiar/adaptar o `CookieConsentBanner.tsx`:
- Exibir na primeira visita
- Bloquear Meta Pixel, GA, TikTok Pixel até consentimento
- Salvarnoprefixo `pikbio_cookie_consent` no localStorage

---

## 3. Content Security Policy (CSP)

**RIFAZAP:** CSP completo no `next.config.ts` com `default-src 'self'`, script-src, style-src, img-src, connect-src (inclui Supabase, GA, Google Ads), `frame-ancestors 'none'`.

**Pikbio:** Só tem `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` no proxy.ts. **Sem CSP.**

**Ganho:** Prevenção de XSS, mitigação de ataques de injeção. A Google recomenda CSP para ranqueamento.

**O que fazer:** Adicionar `Content-Security-Policy` no `next.config.ts` (headers) ou no `proxy.ts`. Exemplo mínimo:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com;
frame-ancestors 'none';
```

---

## 4. Sitemap Dinâmico

**RIFAZAP:** `src/app/sitemap.ts` com:
- Core pages (/, /como-funciona, /blog)
- Category pages (14 landing pages de rifa-*)
- IA pages (6 páginas /ia/*)
- Blog posts dinâmicos
- Prioridades, changeFrequencies, lastModified

**Pikbio:** Não achei sitemap. (O build gera `/sitemap.xml` automaticamente pelo Next.js, mas sem controle de prioridade ou inclusão de páginas dinâmicas.)

**Ganho:** Indexação completa no Google. Controle fino de prioridade.

**O que fazer:** Criar `app/sitemap.ts` com:
- Landing pages (/como-funciona, /contato, /privacidade, /termos)
- Páginas de criador (talvez o top N por visita)
- Blog posts (se houver)

---

## 5. Genkit / LLM Integration

**RIFAZAP:**
- `src/ai/dev.ts` — servidor de desenvolvimento Genkit
- 6 páginas `/ia/*` com conteúdo gerado/estruturado por IA (FAQ institucional, explicações)
- Script `genkit:dev` e `genkit:watch` no package.json

**Pikbio:** Zero integração com LLM.

**Ganho:**
- FAQ inteligente / busca semântica na loja
- Geração de descrições de produto
- Chatbot de suporte para criadores
- Resumo de vendas em linguagem natural

**O que fazer:** (Baixa prioridade vs as outras) Adicionar Genkit ou OpenAI:
- `npm install genkit @genkit-ai/google-genai`
- Criar `lib/ai/genkit.ts`
- Usar para: busca semântica de produtos, geração de meta descriptions, FAQ dinâmico

---

## 6. Middleware Rate Limiting (In-memory)

**RIFAZAP:** `middleware.ts` com rate limiting in-memory por IP:
- `/api/campanha_api`: 10 req/min
- `/api/webhooks`: 30 req/min
- `/api/upload`: 5 req/min
- Fallback: 60 req/min
- Headers `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`

**Pikbio:** Rate limiting via Upstash Redis apenas nas rotas específicas (não cobre todas as APIs no middleware).

**Ganho:** Camada extra de proteção contra abuso antes mesmo de bater nas rotas.

**O que fazer:** Adicionar rate limiting no `proxy.ts`:
- Verificar IP antes de qualquer rota `/api/`
- 429 com headers padronizados
- Usar Map em memória (leve) ou integrar com o Upstash já existente

---

## 8. SEO Metadata Builder Centralizado

**RIFAZAP:** `buildMetadata()` em `seo-metadata.ts` que centraliza:
- `metadataBase`
- `robots` (index/follow com googleBot config)
- `alternates.canonical`
- `openGraph` (type, siteName, locale, url, image 1200x630)
- `twitter` (summary_large_image)
- Fallback de imagem OG automática por slug

**Pikbio:** Cada página define seu `Metadata` manualmente, sem padronização OG.

**Ganho:** Consistência de OG images, canonical URLs, e robots tags. Evita páginas sem OG image.

**O que fazer:** Criar `lib/seo-metadata.ts` com função `buildMetadata()`. Refatorar `export const metadata` das páginas principais para usar a função.

---

## 9. PWA Install Support

**RIFAZAP:** `InstallPWA.tsx` — componente que exibe prompt de instalação do PWA.

**Pikbio:** Não tem.

**Ganho:** Criadores podem instalar o dashboard como app no celular.

**O que fazer:** Baixa prioridade. Adicionar `InstallPWA.tsx` no layout do dashboard se houver manifest.json.

---

## Sumário de Prioridades

| # | O que | Impacto | Esforço |
|---|-------|---------|---------|
| 1 | JSON-LD (Schema.org) | SEO alto | Médio |
| 2 | Cookie Consent Banner | Legal (LGPD) | Baixo |
| 3 | CSP Headers | Segurança/SEO | Baixo |
| 4 | Sitemap Dinâmico | SEO médio | Baixo |
| 5 | Genkit / LLM | Inovação | Alto |
| 6 | Rate Limit no Middleware | Segurança | Baixo |
| 7 | Heartbeat | Monitoramento | Baixo |
| 8 | SEO Metadata Builder | SEO médio | Médio |
| 9 | PWA Install | UX | Baixo |
