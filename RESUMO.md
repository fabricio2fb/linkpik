# RESUMO — Ajustes pré-patch login via Google

## 1. Username reservado — `app/api/auth/complete-profile/route.ts`

Criado o arquivo com:

- Lista `RESERVED_USERNAMES` impedindo colisão com rotas reais do sistema:
  `admin, api, dashboard, login, registro, blog, checkout, acesso, pedido, privacidade, termos, contato, afiliado, www, app, static, public, assets, _next`
- Validação acontece **antes** da consulta ao banco: se o username está na lista, retorna `ApiError(409, "Este nome de usuário não está disponível.")` (mesma mensagem genérica de username em uso)
- Schema Zod: regex `^[a-z0-9._-]+$`, 3–30 caracteres
- Sanitização: `.toLowerCase()`, replace espaços, remove caracteres inválidos, slice(30)
- Busca usuário autenticado via `supabase.auth.getUser()`
- Cria conta do creator via `ensureCreatorAccount`

## 2. Ícone do Facebook sem link — `components/landing/LandingFooter.tsx`

- Import do `Facebook` (lucide-react) removido
- `<Facebook size={18} />` solto (sem `href`) removido
- Instagram e TikTok permanecem como estavam
