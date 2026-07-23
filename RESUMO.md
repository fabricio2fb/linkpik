# Pikbio  Documento completo do site

## 1. Resumo executivo

O Pikbio é uma plataforma web brasileira, construída em Next.js com Supabase, para transformar o link da bio de um criador em uma loja digital. A proposta principal identificada no projeto é reunir página pública, vitrine de produtos, links sociais, checkout, upsell, entrega digital, painel de vendas e analytics em um fluxo único.

O público principal são criadores digitais, infoprodutores, profissionais autônomos, vendedores de materiais digitais e pessoas que divulgam produtos pelas redes sociais. O problema central resolvido é reduzir a dependência de conversas manuais, links espalhados e processos improvisados para vender produtos digitais a partir da bio.

O funcionamento geral confirmado pelo código é:

- o criador cria uma conta;
- o sistema cria ou garante um registro em `creators`;
- o criador configura sua loja pública, tema, perfil, links e produtos;
- a loja fica disponível em `/:username`;
- cada produto pode ter uma página em `/:username/:product-id`;
- o comprador informa nome, e-mail e CPF no checkout;
- o pedido é criado em `orders`;
- o pagamento é processado por Mercado Pago ou Efí Bank, quando o gateway estiver conectado;
- webhooks atualizam o status do pedido;
- para produto digital pago, o sistema gera um token de acesso e envia e-mail com link para `/acesso/[token]`;
- analytics registram visitas, visualizações de produto, início de checkout e checkout completo.

Diferenciais identificados de forma real no projeto:

- loja pública por username com visual personalizável;
- produtos digitais com checkout e entrega por token;
- planos Free e Pro no código, com limites e taxas diferentes;
- integração real de pagamento com Mercado Pago e Efí Bank no backend;
- upload assinado de imagens via Cloudinary;
- tracking próprio de eventos básicos;
- pixels externos opcionais na loja pública;
- webhooks configuráveis pelo criador;
- painel administrativo protegido por lista de admins e TOTP.

Ponto importante: existem páginas, componentes e APIs para produtos físicos, frete, estoque, rastreio e entregas, mas `FEATURE_PHYSICAL_PRODUCT` está definido como `false`. Portanto, essa parte deve ser tratada como código existente desativado por feature flag, não como funcionalidade ativa para artigos.

## 2. Descrição da empresa e do produto

O produto principal do Pikbio é uma loja na bio para criadores venderem produtos digitais. O projeto combina:

- página pública do criador;
- vitrine de produtos;
- páginas individuais de produto;
- checkout;
- pagamento;
- entrega digital;
- painel do criador;
- analytics;
- configurações de integrações;
- blog público;
- painel administrativo.

A experiência entregue ao criador é a de gerenciar uma loja simples, mobile-first, com preview visual e configurações de marca. A experiência entregue ao comprador é entrar em uma página pública, escolher um produto, visualizar detalhes, preencher dados básicos e seguir para pagamento.

A proposta de valor confirmada pelo código e textos é: substituir um link de bio genérico por uma loja digital com produto, pagamento e entrega, especialmente para quem vende infoprodutos e depende de redes sociais para atrair compradores.

Não identificado com segurança no projeto: dados formais da empresa, razão social, CNPJ, endereço comercial, equipe, número de clientes, garantias comerciais ou estatísticas reais de resultado.

## 3. Público-alvo

### Criadores digitais

São o público mais evidente nos textos da landing, dashboard e fluxos de cadastro. O produto foi desenhado para pessoas que vendem ou querem vender para seguidores, especialmente pelo Instagram, TikTok, YouTube e outros canais de social media.

Necessidades:

- ter um link único e organizado na bio;
- apresentar produtos com preço, imagem e descrição;
- receber pagamentos sem conversar manualmente com cada cliente;
- entregar acesso digital depois da aprovação;
- acompanhar vendas e visitas.

Nível de conhecimento provável: intermediário baixo a intermediário. A interface evita termos muito técnicos e usa expressões como "Criar minha loja grátis", "Minha loja", "Produtos digitais" e "Acessos liberados".

### Infoprodutores

O projeto usa explicitamente termos como `infoprodutos`, `produtos digitais`, `ebook`, `planilha`, `template`, `curso`, `mentoria`, `pack` e `comunidade`. O código permite cadastrar produtos com campos específicos para esses formatos dentro de `details`.

Casos de uso:

- vender e-book com link externo;
- vender planilha ou arquivo;
- vender template;
- vender curso hospedado fora do Pikbio;
- vender mentoria com link de agendamento;
- vender acesso a comunidade.

### Profissionais autônomos e especialistas

Textos de landing e templates mencionam personal trainers, consultores, mentores, profissionais de bem-estar, coaches e serviços digitais. Esses usuários podem vender materiais digitais ou sessões de mentoria.

Necessidades:

- construir autoridade em uma página simples;
- apresentar uma oferta clara;
- capturar pagamento e dados do comprador;
- entregar instruções, link ou mensagem pós-compra.

### Vendedores de produtos físicos

Há código extenso para produtos físicos, estoque, frete, endereço e rastreamento. Porém, como `FEATURE_PHYSICAL_PRODUCT = false`, esse público não deve ser tratado como público ativo da plataforma em artigos, salvo se o texto deixar claro que a funcionalidade existe no código mas está desativada.

### Administradores do Pikbio

O projeto tem painel `/admin` para operação interna. Esse público usa áreas de criadores, vendas, financeiro, blog e exclusão de dados. O acesso exige que o e-mail esteja em `admin_users` e que haja sessão admin com TOTP.

## 4. Problemas que o Pikbio resolve

### Centralização de links

O Pikbio permite cadastrar links sociais e personalizados em `links`, com tipo, rótulo, URL, posição e status ativo. A loja pública exibe esses links com ícones e estilos controlados pelo tema.

Problema resolvido: evitar que o criador distribua vários links soltos ou dependa de uma ferramenta que apenas lista URLs sem fluxo de venda.

### Apresentação de produtos digitais

Produtos cadastrados aparecem na loja pública e em páginas individuais. O produto pode ter título, descrição, preço, imagem/capa, status, destaque, detalhes e seções customizadas de página.

Problema resolvido: apresentar uma oferta de forma mais clara do que apenas mandar o comprador para um link de pagamento.

### Checkout

O modal de compra coleta nome completo, e-mail e CPF. A API `/api/orders` cria pedidos com idempotência, calcula taxa da plataforma e inicia pagamento no gateway conectado.

Problema resolvido: transformar interesse do seguidor em pedido rastreável.

### Entrega digital

Quando Mercado Pago ou Efí Bank confirmam pagamento, o sistema cria um `access_token`, envia e-mail por Resend e libera acesso por `/acesso/[token]`.

Problema resolvido: evitar entrega manual de links, arquivos ou instruções depois da compra.

### Upsell

O produto pode ter `upsell_id` e detalhes de upsell. No checkout de produto digital, aparece uma oferta complementar com checkbox. O código bloqueia upsell no plano Free na criação de produto; o plano Pro habilita `upsell`.

Problema resolvido: oferecer produto complementar antes do pagamento.

### Personalização visual

O criador pode editar tema, cores, fontes, layout, avatar, capa, links e vídeo de apresentação. A página `/dashboard/loja` inclui preview mobile.

Problema resolvido: permitir que a loja reflita a identidade do criador.

### Acompanhamento de resultados

O projeto registra eventos em `analytics_events` e consulta pedidos pagos para gerar métricas de visitas, produto, checkout, conversão, receita, séries diárias e top produtos.

Problema resolvido: dar ao criador dados básicos para entender o desempenho da loja.

## 5. Como o Pikbio funciona

### Visitante

O visitante pode acessar:

- `/`;
- `/como-funciona`;
- `/demo`;
- `/blog`;
- `/blog/[slug]`;
- `/contato`;
- `/privacidade`;
- `/termos`;
- lojas públicas em `/:username`;
- produtos públicos em `/:username/:product-id`;
- páginas de checkout de retorno;
- página de acesso por token.

Na loja pública, o visitante vê perfil, bio, links, vídeo se configurado, aviso se configurado, produtos e marca Pikbio, exceto quando o criador é Pro.

### Usuário sem conta

Pode visitar a landing, abrir a demo, ler blog, solicitar contato, criar conta em `/registro`, fazer login em `/login` ou recuperar senha em `/recuperar-senha`.

### Usuário cadastrado

Após login, acessa `/dashboard`. O dashboard carrega sessão em `/api/auth/session` e usa o creator vinculado ao usuário. O usuário pode:

- editar loja;
- criar e gerenciar produtos digitais;
- gerenciar links;
- acompanhar vendas;
- acompanhar acessos liberados;
- visualizar analytics;
- configurar conta, pagamentos, notificações, integrações e plano.

### Criador ou vendedor

O criador configura uma loja pública em `/:username`, conecta gateway de pagamento, publica produtos e divulga o link. Quando um comprador faz pedido, o criador acompanha receita, pedidos e status no dashboard.

### Comprador

O comprador acessa a loja pública, escolhe produto, abre a página do produto, clica em comprar, informa nome, e-mail e CPF, e segue para o pagamento. Em caso de produto digital pago, recebe o acesso por e-mail.

### Administrador

O administrador acessa `/admin` se seu e-mail estiver na tabela `admin_users`. O layout admin exige sessão admin via cookie JWT `admin_session`; se não houver sessão, exibe o gate de TOTP. O admin pode visualizar métricas gerais, criadores, vendas, financeiro, blog e solicitações de exclusão de dados.

## 6. Cadastro, login e autenticação

Formas de cadastro confirmadas:

- e-mail e senha em `/registro`;
- Google OAuth em `/registro`;
- Google OAuth em `/login`.

Cadastro por e-mail/senha:

- campos: nome completo, e-mail, username, senha, confirmação de senha e aceite dos termos;
- a API `/api/auth/register` valida nome, e-mail, senha e username;
- cria usuário no Supabase Auth via `auth.admin.createUser`;
- usa `email_confirm: true`;
- cria ou garante registro em `creators` via `ensureCreatorAccount`;
- envia e-mail de boas-vindas via Resend.

Login:

- e-mail e senha por Supabase Auth (`signInWithPassword`);
- Google OAuth com callback para `/api/auth/callback?next=/dashboard`;
- após login, a página consulta `/api/auth/session`.

Recuperação de senha:

- página `/recuperar-senha`;
- fluxo em três passos: e-mail, código, nova senha;
- usa `supabase.auth.resetPasswordForEmail`;
- valida código por `supabase.auth.verifyOtp` com tipo `recovery`;
- atualiza senha por `supabase.auth.updateUser`;
- há rate check em `/api/auth/rate-check`.

Confirmação de e-mail:

- no cadastro próprio, o usuário é criado com `email_confirm: true`;
- alteração de e-mail em `/api/auth/account` usa `supabase.auth.updateUser`, e a interface avisa para conferir o e-mail.

Papéis e permissões:

- usuário autenticado comum, associado a um `creator`;
- admin identificado por e-mail na tabela `admin_users`;
- admin precisa passar pelo TOTP para sessão administrativa.

Proteção de rotas:

- `proxy.ts` libera rotas públicas e APIs públicas;
- protege `/dashboard` redirecionando para `/login` se não houver usuário;
- APIs privadas retornam `401` quando não autenticadas;
- slugs públicos são detectados por regex;
- `/admin` é protegido no layout por `requireAdminUser` e `getAdminSession`.

## 7. Dashboard

### Visão geral

- Rota: `/dashboard`
- Objetivo: mostrar resumo de vendas, receita e funil.
- Dados usados: `/api/analytics/[username]`, `/api/orders`, `/api/creators/me/onboarding`, `/api/dashboard/payment-status`, `/api/dashboard/overview`.
- Informações exibidas: receita bruta, pedidos pagos, ticket médio, líquido, gráfico de vendas, link da bio, funil da loja, top produtos, últimas vendas.
- Ações: copiar link público, abrir loja, ir para configurações de pagamento quando gateway pendente.
- Limitações: depende de eventos de analytics e pedidos reais; se não houver dados, exibe estados vazios.

### Minha loja

- Rota: `/dashboard/loja`
- Objetivo: editar conteúdo, mídia, links e aparência da loja.
- Dados usados: `/api/creators/me`, `/api/products`, `/api/links`.
- Ações: salvar perfil/tema, resetar tema, ver loja pública, editar links e produtos via componentes internos.
- Componentes: `StoreEditor`, `PhonePreview`.
- Limitações: salva apresentação de vídeo dentro de `store_theme.presentationVideo`; anúncio aparece com estrutura no tipo, mas não foi identificado com segurança um editor ativo para anúncio.

### Produtos

- Rota legada/geral: `/dashboard/produtos`
- Objetivo: gerenciar produtos em cards.
- Ações: criar, editar, remover, filtrar, reordenar por drag and drop.
- Observação: filtra produtos físicos quando a feature flag está desativada.

### Painel digital

- Rota: `/dashboard/infoprodutos`
- Objetivo: resumo específico de infoprodutos.
- Dados usados: `/api/dashboard/infoprodutos/overview`.
- Métricas exibidas: receita digital, vendas digitais, produtos ativos, acessos liberados, acessos pendentes, taxa automática.
- Limitações: depende das consultas de pedidos e tokens; não identifica vendas fora do sistema.

### Produtos digitais

- Rota: `/dashboard/infoprodutos/produtos`
- Objetivo: gerenciar infoprodutos, arquivos, links e entregas automáticas.
- Dados usados: `/api/dashboard/infoprodutos/produtos`.
- Ações: criar novo infoproduto, editar produto, editar página do produto.

Rotas relacionadas:

- `/dashboard/infoprodutos/produtos/novo`;
- `/dashboard/infoprodutos/produtos/[id]/editar`;
- `/dashboard/infoprodutos/produtos/[id]/pagina`.

### Vendas digitais

- Rota: `/dashboard/infoprodutos/vendas`
- Objetivo: acompanhar vendas de infoprodutos e liberação de acesso.
- Dados usados: `/api/dashboard/infoprodutos/vendas`.
- Informações: pedido, cliente, produto, valor, pagamento, acesso, canal, data.
- Ações: ver pedido, reenviar acesso quando permitido.

### Acessos liberados

- Rota: `/dashboard/infoprodutos/acessos`
- Objetivo: controlar links, tokens e entregas digitais.
- Dados usados: `/api/dashboard/infoprodutos/acessos`.
- Informações: cliente, produto, e-mail, token mascarado, status, liberado em, último acesso.
- Ações: ver acesso, reenviar acesso.

### Analytics

- Rota: `/dashboard/analytics`
- Objetivo: visualizar tráfego, conversão e receita.
- Dados usados: `/api/analytics/[username]`.
- Filtros: 7, 30 e 90 dias, limitados pelo plano.
- Métricas: visitas na loja, views de produto, conversão, receita, gráfico, comparativo, funil, top produtos, eventos do período.

### Configurações

- Rota: `/dashboard/configuracoes`
- Abas reais: Conta, Pagamentos, Notificações, Integrações, Plano.
- Conta: editar perfil, e-mail, senha e avatar.
- Pagamentos: conectar/desconectar Mercado Pago, conectar/desconectar Efí Bank, escolher gateway ativo quando houver mais de um.
- Notificações: novas vendas, resumo diário/semanal, push; WhatsApp está atrás de `FEATURE_WHATSAPP_NOTIFICATIONS = false`.
- Integrações: Meta Pixel, Google Analytics, TikTok Pixel, webhook URL/eventos/secret, logs de webhook.
- Plano: mostra Free e Pro, upgrade via Mercado Pago, cancelamento de assinatura.

### Produtos físicos

Rotas como `/dashboard/fisicos`, `/dashboard/fisicos/produtos`, `/dashboard/fisicos/pedidos`, `/dashboard/fisicos/estoque`, `/dashboard/fisicos/entregas` e `/dashboard/fisicos/frete` existem, mas estão desativadas por `FEATURE_PHYSICAL_PRODUCT = false` no `proxy.ts` e no menu. Devem ser tratadas como funcionalidade desativada.

## 8. Loja ou página pública

A loja pública usa a estrutura `/:username`. O arquivo `app/[username]/page.tsx` chama `getPublicStore(username)` e renderiza `StorePage`.

Dados exibidos:

- nome do criador;
- username;
- bio;
- avatar;
- capa, quando configurada;
- vídeo de apresentação, quando configurado;
- links ativos;
- produtos ativos;
- branding "Criado com Pikbio", exceto para criador Pro;
- scripts de tracking externos, quando configurados.

Produtos são ordenados visualmente com destaque para `featured`, depois seguem a ordem retornada pelo banco. A página filtra produtos físicos se a feature flag estiver desativada.

Estrutura responsiva:

- mobile: layout em coluna, largura compacta, produtos em grid responsivo;
- desktop: perfil à esquerda e produtos à direita.

Personalização:

- tema com presets;
- cores;
- fontes;
- avatar;
- capa;
- layout de cards;
- estilo de botões e links;
- largura máxima da página;
- modo claro/escuro por tema da loja.

URL de produto:

- `/:username/:product-id`
- usa o `id` do produto, não um slug textual.

Se a loja estiver suspensa (`creator.suspended`), a página mostra "Loja indisponível".

## 9. Produtos

Tipos de produto presentes nos tipos e schemas:

- `infoproduto`;
- `fisico`;
- `ebook`;
- `planilha`;
- `template`;
- `curso`;
- `mentoria`;
- `pack`;
- `comunidade`.

Tipos ativos no seletor principal:

- `infoproduto`;
- `fisico`, mas oculto quando `FEATURE_PHYSICAL_PRODUCT = false`.

Campos principais confirmados:

- `id`;
- `creator_id`;
- `title`;
- `description`;
- `price`;
- `type`;
- `product_kind`;
- `cover_url`;
- `image_provider`;
- `image_public_id`;
- `image_url`;
- `is_active`;
- `status`;
- `is_featured`;
- `details`;
- `upsell_id`;
- `position`;
- campos físicos como SKU, estoque, medidas e CEP de origem, mas desativados pela feature flag.

Campos em `details`:

- preço original;
- descrição curta;
- itens incluídos;
- avaliações;
- cor/gradiente;
- nível;
- plataforma ou URL de entrega;
- páginas;
- idioma;
- compatibilidade;
- plataforma de template;
- link de acesso;
- instruções de uso;
- aulas, duração, plataforma e URL de curso;
- módulos;
- pré-requisitos;
- certificado;
- duração/formato/agendamento de mentoria;
- disponibilidade;
- gravação incluída;
- vagas;
- quantidade/tipos/tamanho de arquivos;
- licença;
- comunidade;
- frequência de conteúdo;
- membros;
- renovação;
- tipo de cobrança;
- período de assinatura;
- dias de teste grátis;
- campos de lead;
- parcelas;
- mensagem de entrega;
- mensagem de obrigado;
- Instagram pós-compra;
- upsell;
- campos físicos.

Status:

- `active`;
- `draft`;
- `hidden`.

Publicação:

- `status = active` torna `is_active = true`;
- produtos públicos são buscados com `is_active = true`.

Exclusão:

- `DELETE /api/products/[id]` remove o produto do banco, desde que pertença ao criador autenticado.

Limites:

- Free: até 3 produtos em `PLAN_LIMITS`;
- Pro: até 999 produtos em `PLAN_LIMITS`;
- a landing menciona "Até 5 produtos" no Free, o que é inconsistente com `lib/api/plans.ts`.

## 10. Processo de compra

Fluxo real para produto digital:

1. Comprador acessa a loja pública.
2. Abre a página do produto.
3. Clica em comprar.
4. `BuyModal` coleta nome completo, e-mail e CPF.
5. Se houver upsell associado e o produto não for físico, o comprador pode marcar a oferta complementar.
6. O frontend chama `POST /api/orders`.
7. A API valida dados por `CreateOrderSchema`.
8. A API verifica produto ativo, creator ativo, loja não suspensa e `payment_enabled`.
9. Calcula valor total, taxa de plataforma e valor do criador.
10. Cria pedido em `orders` com status `pending`.
11. Resolve gateway: Mercado Pago ou Efí Bank.
12. Cria checkout, PIX ou boleto conforme gateway e preferência.
13. Atualiza o pedido com dados do gateway.
14. Dispara webhook do criador `order.pending`.
15. O frontend redireciona para checkout externo, exibe PIX, ou boleto.
16. Webhook do gateway atualiza pedido.
17. Quando o status vira `paid`, gera token de acesso e envia e-mail.

Informações solicitadas ao comprador:

- nome completo;
- e-mail;
- CPF sem pontuação.

Produto físico:

- o modal e a API têm campos para endereço, CEP, frete e status público;
- porém está desativado por feature flag.

Falhas possíveis:

- dados inválidos;
- produto inexistente ou inativo;
- loja suspensa;
- loja sem pagamento habilitado;
- nenhum gateway conectado;
- erro ao criar pedido;
- erro ao criar preferência/cobrança no gateway;
- pagamento com valor divergente;
- webhook inválido;
- acesso expirado.

## 11. Pagamentos

### Mercado Pago

Integração confirmada.

Usos:

- OAuth de conexão do criador;
- conta em `creator_marketplace_accounts`;
- checkout preference;
- pagamento PIX via `/v1/payments`;
- assinatura Pro via `/preapproval`;
- webhook em `/api/webhooks/mercadopago`;
- split/taxa por `marketplace_fee` em preference e `application_fee` em PIX.

Variáveis:

- `MERCADO_PAGO_CLIENT_ID`;
- `MERCADO_PAGO_CLIENT_SECRET`;
- `MERCADO_PAGO_ACCESS_TOKEN`;
- `MERCADO_PAGO_PUBLIC_KEY`;
- `MERCADO_PAGO_WEBHOOK_SECRET`;
- `MERCADO_PAGO_REDIRECT_URI`.

Status mapeados:

- `approved` -> `paid`;
- `pending` e `in_process` -> `pending`;
- `rejected` -> `failed`;
- `cancelled` -> `canceled`;
- `refunded` e `charged_back` -> `refunded`.

Limitações:

- depende de OAuth/token conectado por criador;
- webhook exige validação de assinatura;
- assinatura Pro usa valor `29.9` no backend, enquanto a interface exibe `R$ 29/mês`.

### Efí Bank

Integração confirmada.

Usos:

- conexão manual por Client ID e Client Secret;
- PIX com chave Pix;
- fallback para boleto quando PIX não está disponível;
- webhook em `/api/webhooks/efipay`;
- split quando `EFIPAY_PIKBIO_ACCOUNT_CODE` está configurado;
- token cache com Upstash Redis ou memória.

Variáveis:

- `EFIPAY_WEBHOOK_SECRET`;
- `EFIPAY_PIKBIO_ACCOUNT_CODE`;
- `EFIPAY_API_BASE_URL`;
- `EFIPAY_TOKEN_CACHE_TTL_SECONDS`.

Status mapeados:

- `CONCLUIDA` ou `paid` -> `paid`;
- `ATIVA` ou `active` -> `pending`;
- `REMOVIDA`, `canceled`, `cancelled` -> `canceled`;
- `DEVOLVIDA`, `refunded` -> `refunded`;
- `EXPIRADA`, `expired` -> `failed`.

Limitações:

- valida webhook por HMAC na URL;
- faz alerta se IP não for o IP Efí documentado, mas não bloqueia apenas por IP;
- uso real depende das credenciais do criador.

### Métodos de pagamento

O schema aceita preferência `pix`, `boleto` ou `card`. No código:

- Mercado Pago suporta PIX e checkout externo;
- Efí suporta PIX e boleto;
- cartão aparece como preferência aceita no schema, mas não foi identificado com segurança um fluxo específico de cartão separado no frontend.

## 12. Entrega dos produtos

Entrega digital ativa:

- após pagamento confirmado, o webhook gera token com `generateAccessToken`;
- salva `token_hash`, `order_id` e `expires_at` em `access_tokens`;
- expiração padrão: 7 dias;
- envia e-mail pelo Resend com link `/acesso/[token]`;
- a rota `/api/access/[token]` valida hash, expiração e status pago;
- marca `used_at`;
- registra `audit_log` com ação `product_accessed`.

Conteúdo entregue:

- link externo de `deliveryUrl`, `accessLink` ou `courseUrl`;
- mensagem de entrega com tokens como `{nome}`, `{produto}`, `{link}`;
- mensagem ou URL de agradecimento em `thankYouMessage`.

Se não houver link ou mensagem configurada, a API retorna erro "Arquivo nao encontrado".

Entrega por arquivo hospedado diretamente no Pikbio: Não identificado com segurança no projeto. O código usa links e mensagens, não um bucket de arquivos digitais.

Entrega por e-mail: confirmada para link de acesso.

Entrega manual: pode existir como mensagem/instrução do criador, mas não foi identificado um fluxo operacional manual formal para infoprodutos.

Produto físico: há e-mail de pedido confirmado e página de status, mas a funcionalidade está desativada por flag.

## 13. Upsell, order bump e ofertas

Upsell confirmado:

- produto pode ter `upsell_id`;
- `details.upsell` pode conter produto, preço, preço original, texto de botão e desconto;
- o checkout mostra checkbox "Adicionar [produto]";
- upsell é permitido apenas para produtos digitais;
- API soma o preço do produto de upsell quando ativo e do mesmo criador;
- plano Free não permite criar produto com upsell; Pro permite.

Order bump:

- Não identificado com segurança como conceito separado. O comportamento de checkbox no checkout funciona como oferta adicional, mas o código usa o termo upsell.

Ofertas:

- preço original riscado (`originalPrice`);
- produto destacado (`is_featured`);
- texto de botão de upsell;
- seções customizadas da página de produto.

## 14. Personalização visual

Temas/presets:

- `minimal`;
- `cards`;
- `glass`;
- `bold`;
- `magazine`;
- `retro`;
- `soft`;
- `cleanpro`.

Opções de tema confirmadas:

- cor de destaque;
- cor de fundo;
- cor de superfície;
- cor de texto primário/secundário;
- cor de texto do botão;
- fundo sólido, gradiente ou mesh;
- fonte de título;
- fonte de corpo;
- tamanho, peso, transformação e espaçamento do nome;
- formato, tamanho, borda e sombra do avatar;
- layout da loja: lista, grid de 1, grid de 2;
- largura máxima da página;
- raio, borda e sombra dos cards;
- exibir descrição do produto;
- exibir avaliação;
- layout do card;
- altura da capa;
- estilo, raio, tamanho, peso e transformação de botão;
- estilo e tamanho de links;
- separador;
- modo claro/escuro.

Fontes:

- Plus Jakarta Sans;
- DM Sans;
- Inter;
- Syne;
- Space Grotesk;
- Playfair Display;
- Nunito;
- Oswald;
- Bebas Neue;
- Lora.

Mídia:

- avatar;
- capa/banner;
- imagem do produto;
- vídeo de apresentação com URL, thumbnail, título, descrição e legenda.

Domínio próprio:

- há `FEATURE_CUSTOM_DOMAIN = false`;
- schema de configurações aceita `custom_domain`;
- existe rota `/api/creators/me/domain/verify`;
- não deve ser tratado como funcionalidade ativa, pois a flag está desativada e não aparece como recurso ativo confirmado.

## 15. Analytics e métricas

Eventos rastreados:

- `store_view`;
- `product_view`;
- `checkout_start`;
- `checkout_complete`.

Origem dos dados:

- eventos inseridos em `analytics_events`;
- pedidos pagos em `orders`;
- produtos em `products`.

Métricas calculadas:

- visitas na loja;
- views de produto;
- checkout iniciado;
- checkout completo;
- taxa de conversão;
- receita;
- pedidos;
- funil;
- comparação com período anterior;
- deltas percentuais;
- série diária de vendas;
- receita de upsell;
- top produtos por receita/views;
- conversão por produto.

Períodos:

- dashboard de analytics permite 7, 30 e 90 dias;
- limite real vem de `PLAN_LIMITS`: Free 7 dias, Pro 90 dias.

Limitações:

- eventos dependem de chamadas client-side;
- origem/canal detalhado de tráfego não foi identificado;
- não há filtros avançados por UTM confirmados;
- não há integração server-side com Meta CAPI confirmada, apesar de existir campo `meta_pixel_token`.

## 16. Planos, preços e limites

Planos identificados:

| Plano | Mensalidade | Produtos | Links | Analytics | Upsell | Domínio próprio | Taxa por venda |
|---|---:|---:|---:|---:|---|---|---:|
| Free | R$ 0/mês | 3 no código | 5 | 7 dias | não | não | 10% |
| Pro | R$ 29/mês na UI; 29.9 no backend | 999 | 999 | 90 dias | sim | true em `PLAN_LIMITS`, mas feature flag desligada | 5% |

Inconsistências:

- `lib/api/plans.ts` define Free com `max_products: 3`;
- a landing em `LandingBelowFold.tsx` menciona "Até 5 produtos";
- a tela de plano exibe "R$ 29/mês";
- `createCreatorSubscription` cria assinatura com `amount = 29.9`.

Recursos citados na UI:

- Free: loja com checkout, Mercado Pago e Efí Bank, notificações por e-mail, taxa de 10%;
- Pro: tudo do Free, taxa de 5%, notificações WhatsApp, suporte prioritário.

Atenção: notificações WhatsApp estão com `FEATURE_WHATSAPP_NOTIFICATIONS = false`; portanto, não devem ser prometidas como ativas.

## 17. Administração

Áreas administrativas identificadas:

- `/admin`: visão geral da plataforma;
- `/admin/criadores`: lista e filtros de criadores;
- `/admin/criadores/[id]`: detalhe do criador, produtos, pedidos e logs;
- `/admin/vendas`: vendas/pedidos;
- `/admin/financeiro`: taxas, MRR e assinaturas;
- `/admin/blog`: gestão de posts;
- `/admin/blog/novo`: criação de post;
- `/admin/blog/[id]`: edição;
- `/admin/exclusao-dados`: solicitações de privacidade/exclusão.

Segurança:

- `admin_users` define quem é admin;
- TOTP é configurado e verificado;
- sessão admin usa JWT assinado em cookie HTTP-only por 4 horas.

Métricas admin:

- total de criadores;
- criadores Free e Pro;
- GMV total;
- taxa Pikbio;
- produtos ativos;
- novos cadastros em 7/30 dias;
- MRR estimado por assinaturas Pro.

## 18. Banco de dados

Não há migrations versionadas identificadas em `supabase/migrations` pela listagem do projeto. As tabelas abaixo foram inferidas exclusivamente por consultas Supabase, schemas e código.

### creators

- Objetivo: representar a loja/criador.
- Campos importantes: `id`, `user_id`, `username`, `name`, `bio`, `avatar_url`, `cover_url`, `store_theme`, `plan`, `plan_expires_at`, `payment_enabled`, `is_active`, `suspended`, `created_at`.
- Relacionamentos: produtos, links, pedidos, configurações, assinaturas.
- Usos: sessão, loja pública, dashboard, admin, pagamentos.

### creator_settings

- Objetivo: configurações do criador.
- Campos: notificações, banco, pixels, webhook, gateway padrão, domínio.
- Campos identificados: `notify_new_sale`, `notify_daily_summary`, `notify_weekly_summary`, `notify_push_enabled`, `notify_whatsapp_enabled`, `notify_whatsapp_number`, `custom_domain`, `bank_name`, `bank_account_type`, `bank_agency`, `bank_account`, `bank_document`, `bank_holder`, `meta_pixel_id`, `meta_pixel_token`, `google_analytics_measurement_id`, `tiktok_pixel_id`, `tiktok_pixel_token`, `webhook_url`, `webhook_events`, `webhook_secret`, `default_gateway`, `default_payment_gateway`.
- Usos: configurações, loja pública, scripts de tracking, webhooks, gateway.

### products

- Objetivo: armazenar produtos da loja.
- Campos: `id`, `creator_id`, `title`, `description`, `price`, `type`, `product_kind`, `cover_url`, `image_provider`, `image_public_id`, `image_url`, `is_active`, `status`, `is_featured`, `details`, `upsell_id`, `position`, campos físicos, `page_sections`.
- Status: `active`, `draft`, `hidden`.
- Usos: loja pública, página de produto, checkout, dashboard, admin.

### links

- Objetivo: links da loja.
- Campos: `id`, `creator_id`, `type`, `label`, `url`, `position`, `is_active`.
- Usos: loja pública e editor da loja.

### orders

- Objetivo: pedidos.
- Campos: `id`, `product_id`, `upsell_id`, `creator_id`, `buyer_email`, `buyer_name`, `buyer_cpf_hash`, `amount`, `platform_fee`, `creator_amount`, `payment_method`, `payment_method_preference`, `status`, `gateway`, `currency`, `idempotency_key`, `gateway_preference_id`, `gateway_payment_id`, `gateway_merchant_order_id`, `checkout_url`, `gateway_status`, `payment_expires_at`, `pix_copia_cola`, `pix_qr_code`, `boleto_url`, `boleto_barcode`, `paid_at`, `created_at`.
- Status identificados: `pending`, `paid`, `failed`, `canceled`, `refunded`.
- Usos: checkout, webhooks, dashboard, analytics, entrega.

### access_tokens

- Objetivo: acesso digital pós-compra.
- Campos: `id`, `token_hash`, `order_id`, `expires_at`, `used_at`.
- Usos: `/acesso/[token]`, reenvio de acesso, dashboard de acessos.

### analytics_events

- Objetivo: registrar eventos do funil.
- Campos: `event`, `username`, `product_id`, `ip_hash`, `created_at`.
- Eventos: `store_view`, `product_view`, `checkout_start`, `checkout_complete`.

### creator_marketplace_accounts

- Objetivo: contas de gateway por criador.
- Campos: `creator_id`, `gateway`, `external_user_id`, `access_token_encrypted`, `refresh_token_encrypted`, `public_key`, `scope`, `status`, `connected_at`, `expires_at`.
- Gateways: `mercadopago`, `efipay`.

### payment_events

- Objetivo: registrar eventos recebidos de gateway.
- Campos: `gateway`, `event_id`, `event_type`, `event_action`, `payment_id`, `preapproval_id`, `payload`, `processing_status`, `processing_error`, `processed_at`, `order_id`, `creator_id`, `subscription_id`.
- Usos: webhooks Mercado Pago e Efí.

### creator_subscriptions

- Objetivo: assinatura Pro.
- Campos: `creator_id`, `gateway`, `mercado_pago_preapproval_id`, `payer_email`, `plan_slug`, `status`, `amount`, `currency`, `frequency`, `frequency_type`, `next_payment_date`, `last_payment_date`, `started_at`, `canceled_at`, `created_at`.
- Status: `active`, `pending`, `paused`, `cancelled`, `cancelled_pending_expiration`, `rejected`, `expired`.

### onboarding_steps

- Objetivo: progresso inicial.
- Campos identificados: `creator_id`, `profile_done`, `pix_done`, `product_done`, `completed_at`.

### notifications

- Objetivo: notificações do criador.
- Campos identificados: `id`, `creator_id`, `type`, `title`, `body`, `read_at`, dados de comprador/produto.

### web_push_subscriptions

- Objetivo: inscrições push.
- Campos: `id`, `creator_id`, `user_id`, `endpoint`, chaves de assinatura.

### webhook_logs

- Objetivo: logs de webhooks enviados ao criador.
- Campos: `creator_id`, `event_type`, `webhook_url`, `request_payload`, `response_status`, `response_body`, `response_time_ms`, `success`, `error_message`, `is_test`, `created_at`.

### admin_users

- Objetivo: autorizar admin.
- Campos: `id`, `email`, `totp_configured`, `totp_secret_encrypted`.

### audit_log

- Objetivo: auditoria.
- Campos identificados: `action`, `resource`, `resource_id`, `metadata`.

### blog_posts

- Objetivo: blog público/admin.
- Campos: `id`, `slug`, `title`, `excerpt`, `content`, `cover_image_url`, `status`, `published_at`, `updated_at`, `metadata`.

### privacy_requests

- Objetivo: solicitações LGPD/exclusão.
- Campos identificados: `id`, `email`, `status`, dados da solicitação, resultados de processamento.

### Tabelas físicas desativadas por flag

Identificadas no código:

- `order_shipping_addresses`;
- `order_shipments`;
- `order_tracking_events`;
- `public_order_status_tokens`;
- RPC `decrement_product_stock_safely`.

Essas estruturas existem no código, mas a funcionalidade de produto físico está desativada.

## 19. APIs e rotas internas

Rotas principais:

| Método | Caminho | Objetivo | Auth | Tabelas |
|---|---|---|---|---|
| GET | `/api/auth/session` | obter usuário e creator | Supabase | `creators`, `creator_settings`, `onboarding_steps` |
| POST | `/api/auth/register` | criar usuário e loja | pública | `creators` |
| PATCH | `/api/auth/account` | alterar e-mail/senha | sim | Supabase Auth |
| GET/PATCH | `/api/creators/me` | ler/editar creator | sim | `creators` |
| GET/PATCH | `/api/creators/me/settings` | configurações | sim | `creator_settings` |
| GET | `/api/creators/me/billing` | plano/assinatura | sim | `creators`, `creator_subscriptions` |
| POST | `/api/creators/me/settings/payment-gateway` | gateway ativo | sim | `creator_settings` |
| GET/POST | `/api/products` | listar/criar produtos | sim | `products` |
| GET/PATCH/DELETE | `/api/products/[id]` | produto específico | sim | `products` |
| PATCH | `/api/products/reorder` | reordenar produtos | sim | `products` |
| GET/POST | `/api/links` | listar/criar links | sim | `links` |
| PATCH/DELETE | `/api/links/[id]` | editar/remover link | sim | `links` |
| PATCH | `/api/links/reorder` | reordenar links | sim | `links` |
| POST | `/api/orders` | criar pedido | pública | `orders`, `products`, `creators` |
| GET | `/api/orders` | listar pedidos do criador | sim | `orders` |
| GET | `/api/orders/[id]/status` | status público por e-mail | pública | `orders` |
| POST | `/api/webhooks/mercadopago` | webhook MP | pública com assinatura | `payment_events`, `orders`, `access_tokens` |
| POST | `/api/webhooks/efipay` | webhook Efí | pública com HMAC | `payment_events`, `orders`, `access_tokens` |
| GET | `/api/access/[token]` | resolver acesso digital | pública por token | `access_tokens`, `orders`, `products` |
| POST | `/api/access/renew` | renovar acesso | pública/controlada | `access_tokens`, `orders` |
| POST | `/api/analytics/track` | registrar evento | pública | `analytics_events` |
| GET | `/api/analytics/[username]` | analytics do criador | sim | `analytics_events`, `orders`, `products` |
| POST | `/api/uploads/cloudinary/sign` | assinar upload | sim | Cloudinary |
| POST | `/api/mercadopago/connect` | iniciar OAuth | sim | `creator_marketplace_accounts` |
| GET | `/api/mercadopago/callback` | retorno OAuth | sim | `creator_marketplace_accounts` |
| GET | `/api/mercadopago/status` | status MP | sim | `creator_marketplace_accounts` |
| POST | `/api/efipay/connect` | conectar Efí | sim | `creator_marketplace_accounts` |
| GET | `/api/efipay/status` | status Efí | sim | `creator_marketplace_accounts` |
| POST | `/api/subscriptions/mercadopago/create` | assinar Pro | sim | `creator_subscriptions` |
| POST | `/api/subscriptions/mercadopago/cancel` | cancelar Pro | sim | `creator_subscriptions`, `creators` |
| GET | `/api/dashboard/overview` | resumo dashboard | sim | `orders`, `products` |
| GET | `/api/dashboard/infoprodutos/overview` | painel digital | sim | `orders`, `products`, `access_tokens` |
| GET | `/api/dashboard/infoprodutos/produtos` | produtos digitais | sim | `products`, `orders` |
| GET | `/api/dashboard/infoprodutos/vendas` | vendas digitais | sim | `orders`, `access_tokens` |
| GET | `/api/dashboard/infoprodutos/acessos` | acessos digitais | sim | `access_tokens`, `orders` |
| POST | `/api/dashboard/infoprodutos/access/resend` | reenviar acesso | sim | `access_tokens`, `orders` |
| GET/POST | `/api/admin/blog` | blog admin | admin | `blog_posts` |
| PUT/DELETE | `/api/admin/blog/[id]` | editar/remover post | admin | `blog_posts` |
| POST | `/api/privacy/request` | solicitação LGPD | pública | `privacy_requests` |

Rotas físicas existem, mas estão desativadas por flag:

- `/api/dashboard/fisicos/*`;
- `/api/shipping/quote`;
- `/api/public/order-status/[token]`;
- `/api/address/zipcode`;
- páginas `/pedido/status/[token]`.

## 20. Integrações externas

### Supabase

Objetivo:

- autenticação;
- banco de dados;
- sessão server/client.

Variáveis:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`.

### Mercado Pago

Objetivo:

- checkout;
- PIX;
- marketplace fee;
- OAuth do criador;
- assinatura Pro;
- webhooks.

### Efí Bank

Objetivo:

- PIX;
- boleto;
- split;
- webhooks;
- alternativa ao Mercado Pago.

### Resend

Objetivo:

- e-mail de acesso digital;
- e-mail de pedido físico confirmado;
- notificações;
- boas-vindas;
- nova venda.

Variáveis:

- `RESEND_API_KEY`;
- `RESEND_FROM_EMAIL`.

### Cloudinary

Objetivo:

- upload assinado de imagens.

Usos:

- imagem de produto;
- avatar;
- banner;
- capa de blog.

### Upstash Redis

Objetivo:

- rate limit;
- bloqueio/admin;
- cache de token Efí.

Variáveis:

- `UPSTASH_REDIS_REST_URL`;
- `UPSTASH_REDIS_REST_TOKEN`.

### Web Push

Objetivo:

- notificações push no navegador.

Variáveis:

- `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`;
- `WEB_PUSH_PUBLIC_KEY`;
- `WEB_PUSH_PRIVATE_KEY`.

### Pixels externos

Confirmados:

- Meta Pixel;
- Google Analytics / gtag;
- TikTok Pixel.

São injetados apenas na loja pública quando o criador configura IDs válidos.

## 21. Uploads e armazenamento

Upload confirmado via Cloudinary:

- rota `/api/uploads/cloudinary/sign`;
- helper client `uploadSignedCloudinaryImage`;
- assinatura gerada no backend;
- tipos: `product_image`, `creator_avatar`, `store_banner`, `blog_cover`;
- formatos aceitos: JPEG, PNG, WebP.

Limites em schema:

- imagem de produto: 5 MB;
- avatar: 2 MB;
- banner: 8 MB;
- capa de blog: 5 MB;
- validação geral da rota aceita até 10 MB, mas schema específico de `lib/schemas/upload.schema.ts` define limites menores por tipo.

Segurança:

- exige usuário autenticado;
- valida extensão e MIME;
- `public_id` tem regex restritiva;
- imagens públicas são usadas por URL.

Armazenamento Supabase para arquivos digitais:

- Não identificado com segurança no projeto.

Buckets Supabase:

- Não identificado com segurança no projeto.

## 22. SEO

Metadata global:

- `metadataBase`: `https://pik.bio`;
- título padrão: "Pikbio  Transforme sua bio em uma loja digital";
- template: `%s | Pikbio`;
- descrição fala de página de vendas, link na bio, checkout, upsell e entrega digital;
- keywords: link na bio, loja na bio, checkout mercado pago, produtos digitais, linktree brasileiro;
- Open Graph com siteName Pikbio e imagem `/og-image.png`;
- Twitter card `summary_large_image`;
- JSON-LD de `SoftwareApplication`.

Home:

- título: "Transforme sua bio em uma loja digital";
- descrição focada em transformar bio em loja.

Blog:

- `/blog`: metadata específica;
- `/blog/[slug]`: título por post e description com excerpt.

Sitemap:

- rotas estáticas: `/`, `/como-funciona`, `/demo`, `/blog`, `/contato`, `/privacidade`, `/termos`;
- posts publicados em `blog_posts` entram no sitemap.

Robots:

- permite `/`;
- bloqueia `/admin/`, `/api/`, `/dashboard/`, `/checkout/`, `/acesso/`, `/pedido/status/`, `/login`, `/registro`, `/criar`, `/privacidade/solicitar`, `/lojaexemplo`, `/landingpage2`;
- expõe sitemap em `/sitemap.xml`.

Canonical:

- Não identificado com segurança no projeto.

Dados estruturados:

- apenas global `SoftwareApplication` identificado.

Slugs:

- lojas usam `username`;
- produtos usam `id`;
- blog usa `slug`.

## 23. Identidade visual

Cores principais:

- rosa/acento: `#FF4D6D` / `#ff4d6d`;
- hover rosa: `#FF2D55`;
- verde sucesso: `#22C55E`;
- azul/ciano: `#38BDF8`;
- amarelo/alerta: `#F59E0B`;
- roxo: `#7C3AED`;
- fundo escuro: `#080808`, `#070707`, `#0A0A0A`, `#111111`;
- fundo claro: `#ffffff`, `#f8f8f8`, `#f7f8fb`;
- texto escuro: `#0a0a0a`, `#111827`;
- texto secundário: `#555555`, `#888888`, `#999999`.

Tipografia:

- títulos com Plus Jakarta Sans por padrão;
- corpo com DM Sans;
- presets permitem outras fontes.

Estilo visual:

- interface moderna;
- cards com bordas sutis;
- botões arredondados;
- acento rosa forte;
- dashboard utilitário;
- landing mais promocional e visual;
- loja pública mobile-first e personalizável.

Ícones:

- `lucide-react`.

## 24. Tom de voz da marca

Tom predominante:

- direto;
- comercial;
- orientado a criadores;
- informal moderado;
- usa "você";
- foco em ação e venda.

Padrões reais:

- "Transforme sua bio em uma loja digital";
- "Venda pelo seu link da bio";
- "Criar minha loja grátis";
- "Loja na bio";
- "Produtos digitais";
- "Acessos liberados";
- "Pare de vender no improviso";
- "Monte sua loja, cole o link na bio e teste sua primeira oferta digital".

Vocabulário recorrente:

- criador;
- loja;
- bio;
- checkout;
- produto digital;
- infoproduto;
- venda;
- acesso;
- entrega automática;
- Mercado Pago;
- upsell;
- analytics.

Cuidados:

- textos da landing usam afirmações fortes como "vende sozinha"; para artigos, isso deve ser tratado como linguagem de marketing, não promessa de resultado garantido.

## 25. Diferenciais reais

- A loja pública não é apenas lista de links: ela exibe produtos, preço, páginas de produto e checkout.
- O checkout cria pedido real e integra com gateways reais quando conectados.
- A entrega digital usa token seguro e expira em 7 dias.
- O criador pode configurar pixels externos diretamente na loja.
- O painel separa gestão digital: produtos, vendas e acessos.
- O sistema calcula taxa da plataforma por plano.
- O Pro remove branding da loja pública.
- Webhooks permitem o criador receber eventos em URL própria.
- Admin interno inclui TOTP e visão financeira.

## 26. Limitações e pontos de atenção

- Produtos físicos estão desativados por `FEATURE_PHYSICAL_PRODUCT = false`.
- WhatsApp notifications estão desativadas por `FEATURE_WHATSAPP_NOTIFICATIONS = false`.
- Domínio próprio aparece em código, mas `FEATURE_CUSTOM_DOMAIN = false`.
- Não há migrations versionadas identificadas.
- A landing contém FAQ dizendo que o pagamento da demo não é real; porém há backend real de pagamento. Artigos devem diferenciar demo de produção.
- Free tem limite inconsistente: 3 produtos no código de planos, 5 produtos na landing.
- Pro tem preço inconsistente: UI mostra R$ 29/mês, backend cria assinatura de 29.9.
- Entrega digital depende de link ou mensagem configurada; não há armazenamento próprio de arquivos confirmado.
- Cartão é aceito no schema como preferência, mas não há fluxo específico documentado com segurança.
- Campos de avaliações existem e aparecem em tipos, mas não foi identificado sistema público de compradores criarem reviews.
- Suporte prioritário é citado na tela de plano, mas não foi identificado fluxo de suporte prioritário.
- "Notificações via WhatsApp" é citado para Pro, mas a flag está desligada.
- Não foram identificadas garantias, reembolsos, termos financeiros detalhados ou obrigações fiscais além das páginas legais.

## 27. Funcionalidades que não devem ser inventadas

- Não foi identificado suporte ativo a produtos físicos em produção.
- Não foi identificado frete ativo para usuários finais enquanto a flag física está desligada.
- Não foi confirmado domínio próprio ativo.
- Não foi confirmado envio de arquivos digitais para armazenamento interno.
- Não foi identificado marketplace público de lojas/produtos.
- Não foi identificado afiliados.
- Não foi identificado cupom de desconto.
- Não foi identificado recuperação de carrinho.
- Não foi identificado split bancário fora dos gateways citados.
- Não foi identificada integração com Stripe, PayPal, Hotmart, Eduzz, Kiwify ou Monetizze.
- Não foi identificado suporte ativo a WhatsApp.
- Não foi identificado CRM interno.
- Não foi identificado disparo de e-mail marketing.
- Não foi identificado construtor avançado de landing pages fora das seções de produto.
- Não foi identificado domínio ou subdomínio customizado ativo.
- Não foi identificado app mobile nativo.
- Não foi identificado suporte multiusuário por loja.
- Não foi identificado sistema de afiliados.
- Não foi identificado recurso de área de membros hospedada no Pikbio.
- Não foi identificado certificado emitido pela plataforma.
- Não foi identificado cálculo fiscal, emissão de nota fiscal ou integração contábil.
- Não foi identificado SLA, garantia de venda, promessa de renda ou estatísticas reais.

## 28. Regras editoriais para o blog

- Mencionar a marca como Pikbio.
- Usar "loja na bio" e "link da bio" como conceitos principais.
- Dizer que o Pikbio ajuda criadores a organizar produtos digitais, links e checkout.
- Dizer que há entrega digital por link/token após pagamento aprovado.
- Citar Mercado Pago e Efí Bank somente como integrações identificadas no projeto.
- Evitar prometer que o criador vai vender mais, ganhar renda específica ou ter resultado garantido.
- Evitar dizer que o Pikbio hospeda arquivos digitais, pois isso não foi confirmado.
- Evitar dizer que produtos físicos estão disponíveis, salvo com nota de que o código existe mas está desativado.
- Evitar prometer WhatsApp, domínio próprio e suporte prioritário como recursos ativos sem confirmação.
- Ao falar de pagamentos, explicar que o criador precisa conectar gateway.
- Ao falar de renda, usar linguagem educativa: "pode ajudar", "facilita", "organiza", "reduz etapas".
- Ao falar de questões jurídicas, fiscais, CPF, CNPJ, nota fiscal ou impostos, recomendar validação com contador ou especialista.
- Não usar números de clientes, faturamento médio, taxa de conversão média ou cases reais se não estiverem no projeto.

## 29. Público e intenção dos artigos

Intenção informacional:

- explicar o que é loja na bio;
- explicar infoprodutos;
- explicar checkout para criadores;
- explicar entrega digital.

Intenção tutorial:

- como criar uma loja na bio;
- como cadastrar produto digital;
- como organizar links sociais;
- como configurar uma oferta;
- como acompanhar vendas.

Intenção comparativa:

- loja na bio vs lista de links;
- vender por DM vs checkout;
- página de produto vs link direto de pagamento.

Intenção comercial:

- por que criadores precisam de uma loja na bio;
- quando usar checkout integrado;
- como simplificar vendas digitais.

Intenção de solução de problema:

- como parar de enviar links manualmente;
- como organizar vários produtos na bio;
- como entregar acesso digital com mais controle;
- como acompanhar funil de vendas.

## 30. Temas recomendados para o blog

### Loja na bio

- O que é uma loja na bio.
- Como transformar seguidores em visitantes de uma página de produtos.
- Diferença entre link na bio e loja na bio.
- Como organizar links e produtos em uma única página.
- Como escolher um username para sua loja.

### Produtos digitais

- Como vender e-book pela bio.
- Como vender planilhas digitais.
- Como vender templates.
- Como vender cursos hospedados externamente.
- Como vender mentorias com link de agendamento.
- Como descrever um produto digital.
- Como definir o que está incluído em um infoproduto.

### Página de produto

- Como escrever uma descrição curta.
- Como usar preço original e preço atual com responsabilidade.
- Como criar uma lista de benefícios sem promessas exageradas.
- Como escolher imagem de produto.
- Como organizar seções de uma oferta digital.

### Checkout

- Por que reduzir etapas antes do pagamento.
- Quais dados pedir no checkout.
- Como CPF e e-mail entram no fluxo de compra.
- Como explicar checkout seguro sem prometer garantias indevidas.

### Entrega digital

- Como entregar link de acesso após pagamento.
- Como escrever uma mensagem de entrega.
- Como evitar envio manual de links.
- Como orientar compradores após a compra.

### Upsell

- O que é upsell em produtos digitais.
- Como oferecer produto complementar sem atrito.
- Quando usar um upsell.
- Como evitar ofertas confusas.

### Analytics

- Como acompanhar visitas na loja.
- Como interpretar visualizações de produto.
- Como entender início de checkout.
- Como calcular conversão básica.
- Como identificar produtos com melhor resultado.

### Personalização

- Como escolher tema para uma loja digital.
- Como cores e fontes influenciam a percepção da oferta.
- Como usar avatar, capa e vídeo de apresentação.
- Como manter uma loja mobile-first.

### Pagamentos

- Como conectar gateway de pagamento.
- Diferenças gerais entre PIX, boleto e checkout externo.
- Como lidar com pedido pendente.
- Por que o gateway precisa confirmar pagamento por webhook.

### Conteúdo para criadores

- Como sair da venda manual por DM.
- Como montar uma primeira oferta digital.
- Como divulgar uma loja na bio.
- Como organizar produtos por prioridade.

## 31. Categorias recomendadas

- Loja na Bio: artigos sobre página pública, links, vitrine e organização.
- Produtos Digitais: criação, descrição e venda de infoprodutos.
- Checkout e Pagamentos: fluxo de compra, gateways, PIX, boleto e pedidos.
- Entrega Digital: acesso, links, e-mails, mensagens pós-compra.
- Conversão e Analytics: funil, visitas, visualizações, checkout e receita.
- Personalização da Loja: temas, identidade visual, mobile e experiência.
- Criadores e Negócios Digitais: estratégia para criadores venderem com mais estrutura.

## 32. Palavras e termos preferidos

- Pikbio;
- loja na bio;
- link da bio;
- criador;
- criador digital;
- produto digital;
- infoproduto;
- checkout;
- venda digital;
- página de produto;
- vitrine;
- acesso digital;
- entrega digital;
- token de acesso;
- Mercado Pago;
- Efí Bank;
- PIX;
- boleto;
- upsell;
- analytics;
- funil;
- visitas;
- conversão;
- produtos digitais;
- links sociais.

## 33. Palavras e afirmações proibidas

Evitar ou proibir:

- "venda garantida";
- "renda garantida";
- "ganhe dinheiro automaticamente";
- "sem risco";
- "100% garantido";
- "checkout próprio do Pikbio" se o contexto sugerir gateway próprio, pois usa gateways externos;
- "hospedagem de arquivos" sem confirmação;
- "produtos físicos disponíveis" sem mencionar a flag desativada;
- "WhatsApp integrado" como recurso ativo;
- "domínio próprio ativo" como recurso ativo;
- "emissão de nota fiscal";
- "afiliados";
- "recuperação de carrinho";
- "CRM completo";
- "área de membros";
- "suporte 24h";
- "milhares de usuários";
- qualquer número de faturamento, conversão ou clientes não presente no código.

## 34. Chamadas para ação recomendadas

- Crie sua loja na bio no Pikbio.
- Organize seus produtos digitais em uma página simples.
- Monte sua vitrine e compartilhe o link na bio.
- Comece com uma loja gratuita.
- Cadastre seu primeiro produto digital.
- Transforme seu link da bio em uma página de vendas.
- Configure sua loja, conecte o pagamento e acompanhe os pedidos.
- Publique uma oferta digital com checkout e entrega por acesso.

Evitar CTAs com pressão ou promessa financeira.

## 35. Perguntas que o documento consegue responder

- O que é o Pikbio?
- Para quem o Pikbio foi criado?
- Como funciona uma loja na bio no Pikbio?
- Como criar uma conta no Pikbio?
- Quais formas de login existem?
- Como recuperar senha?
- Como a loja pública é estruturada?
- Qual é a URL da loja pública?
- Como os produtos aparecem na loja?
- Como cadastrar um produto digital?
- Quais campos um produto digital pode ter?
- Quais tipos de produto aparecem no projeto?
- Como funciona o checkout?
- Quais dados o comprador informa?
- Como o pedido é criado?
- Como funciona a confirmação de pagamento?
- Quais gateways são usados?
- Como funciona a entrega digital?
- O que é o token de acesso?
- Quanto tempo o acesso expira?
- Como funciona o upsell?
- Quais métricas o dashboard mostra?
- Quais eventos de analytics são rastreados?
- Quais planos existem?
- Quais são os limites do plano Free?
- Quais são os benefícios do Pro identificados?
- Quais funcionalidades estão desativadas?
- O Pikbio tem produtos físicos ativos?
- O Pikbio tem domínio próprio ativo?
- O Pikbio hospeda arquivos digitais?
- Quais integrações externas existem?
- Como o admin acessa o painel?
- Quais temas são recomendados para o blog?

## 36. Glossário

- Loja na bio: página pública associada ao username do criador.
- Link da bio: URL que o criador divulga em redes sociais.
- Creator/criador: usuário dono de uma loja.
- Infoproduto: produto digital vendido pela internet.
- Produto digital: oferta sem envio físico, entregue por link, mensagem ou acesso externo.
- Checkout: etapa em que comprador informa dados e segue para pagamento.
- Pedido: registro em `orders` criado antes do pagamento.
- Gateway: provedor externo de pagamento, como Mercado Pago ou Efí Bank.
- PIX: método de pagamento instantâneo usado nos gateways.
- Boleto: método de pagamento suportado via Efí no código.
- Upsell: oferta complementar adicionada antes do pagamento.
- Access token: token usado para liberar conteúdo digital depois do pagamento.
- Webhook: notificação automática enviada ou recebida por APIs.
- Analytics: métricas de tráfego, checkout e vendas.
- Feature flag: constante que liga/desliga uma funcionalidade.
- TOTP: código temporário usado para autenticação admin.

## 37. Resumo mestre para geração de conteúdo

O Pikbio é uma plataforma de loja na bio para criadores brasileiros venderem produtos digitais. Ele combina perfil público, links sociais, vitrine de produtos, páginas de produto, checkout, pagamento externo, upsell, entrega digital por token, dashboard e analytics. O foco ativo do produto é infoprodutos: e-books, planilhas, templates, cursos, mentorias, packs, comunidades e materiais digitais entregues por link ou mensagem.

O criador cria uma conta por e-mail/senha ou Google. O sistema usa Supabase Auth e garante um registro em `creators`. Depois, o criador edita sua loja em `/dashboard/loja`, define nome, bio, username, avatar, capa, tema, vídeo de apresentação e links. A loja pública fica em `/:username`, e cada produto pode ser acessado em `/:username/:product-id`.

O comprador entra na loja, escolhe um produto, abre o checkout, informa nome, e-mail e CPF, e segue para pagamento. O backend cria um pedido em `orders`, calcula taxa do Pikbio de acordo com o plano do criador e usa Mercado Pago ou Efí Bank quando conectados. Webhooks confirmam o pagamento. Quando um pedido digital é aprovado, o sistema cria um token de acesso com expiração de 7 dias e envia por e-mail um link para `/acesso/[token]`. Esse link libera uma URL de entrega, uma mensagem de entrega ou uma mensagem/URL de obrigado configurada no produto.

O dashboard mostra visão geral, loja, produtos digitais, vendas digitais, acessos liberados, analytics e configurações. Analytics rastreia visitas na loja, visualizações de produto, início de checkout e checkout completo. Também calcula receita, pedidos, conversão, funil, série de vendas e top produtos com base em `analytics_events` e `orders`.

Existem planos Free e Pro no código. O Free tem taxa de 10%, limite de 3 produtos, 5 links e analytics de 7 dias. O Pro tem taxa de 5%, 999 produtos, 999 links, analytics de 90 dias e upsell. A interface mostra Pro por R$ 29/mês, mas o backend cria assinatura Mercado Pago de 29.9; essa diferença deve ser tratada como inconsistência. A landing também fala em até 5 produtos no Free, enquanto o código de limites fala em 3.

Recursos que não devem ser tratados como ativos: produtos físicos, WhatsApp, domínio próprio, hospedagem interna de arquivos digitais, afiliados, emissão fiscal, recuperação de carrinho, CRM e área de membros. Produtos físicos têm bastante código, mas estão desligados por `FEATURE_PHYSICAL_PRODUCT = false`.

O tom da marca é direto, comercial e voltado a criadores. A comunicação pode falar em organizar a bio, montar uma loja, cadastrar produtos digitais, conectar pagamento, vender com checkout e entregar acesso digital. Não deve prometer renda garantida, resultados automáticos ou números não comprovados. Artigos devem ser educativos e práticos, mostrando como estruturar ofertas digitais, organizar links, melhorar a página de produto, entender checkout e acompanhar métricas básicas.

## 38. Informações não identificadas

- Razão social, CNPJ e endereço da empresa.
- Políticas comerciais detalhadas de reembolso.
- SLA de suporte.
- Número real de usuários.
- Faturamento real.
- Taxa média real de conversão.
- Cases reais.
- Migrations do Supabase.
- Estrutura completa real do banco fora das consultas do código.
- Buckets Supabase.
- Hospedagem interna de arquivos digitais.
- Domínio próprio ativo.
- WhatsApp ativo.
- Produtos físicos ativos.
- Recurso de cupom.
- Afiliados.
- Nota fiscal.
- Integração fiscal/contábil.
- Recuperação de carrinho.
- CRM completo.
- Automação de e-mail marketing.
- Regras jurídicas/fiscais além das páginas legais.

## 39. Fontes internas analisadas

Principais fontes analisadas:

- `package.json`;
- `.env.example`;
- `app/layout.tsx`;
- `app/page.tsx`;
- `app/globals.css`;
- `app/sitemap.ts`;
- `app/robots.ts`;
- `proxy.ts`;
- `lib/types.ts`;
- `lib/product-types.ts`;
- `lib/link-types.ts`;
- `lib/theme.ts`;
- `lib/theme-presets.ts`;
- `lib/feature-flags.ts`;
- `lib/public-store.ts`;
- `lib/api-mappers.ts`;
- `lib/api/plans.ts`;
- `lib/api/mercadopago.ts`;
- `lib/api/efipay.ts`;
- `lib/api/mailer.ts`;
- `lib/api/creator-provisioning.ts`;
- `lib/api/creator-webhooks.ts`;
- `lib/api/dashboard-overview.ts`;
- `lib/schemas/product.schema.ts`;
- `lib/schemas/order.schema.ts`;
- `lib/schemas/creator.schema.ts`;
- `lib/schemas/physical.schema.ts`;
- `lib/schemas/analytics.schema.ts`;
- `lib/schemas/upload.schema.ts`;
- `components/landing/LandingPage.tsx`;
- `components/landing/LandingBelowFold.tsx`;
- `components/landing/landing-content.ts`;
- `components/store/StorePage.tsx`;
- `components/store/ProductPage.tsx`;
- `components/store/BuyModal.tsx`;
- `components/store/StoreTrackingScripts.tsx`;
- `components/editor/ProductForm.tsx`;
- `components/editor/StoreEditor.tsx`;
- `components/dashboard/Sidebar.tsx`;
- `app/[username]/page.tsx`;
- `app/[username]/[product-id]/page.tsx`;
- `app/login/page.tsx`;
- `app/registro/page.tsx`;
- `app/recuperar-senha/page.tsx`;
- `app/dashboard/layout.tsx`;
- `app/dashboard/page.tsx`;
- `app/dashboard/loja/page.tsx`;
- `app/dashboard/configuracoes/page.tsx`;
- `app/dashboard/analytics/page.tsx`;
- `app/dashboard/infoprodutos/page.tsx`;
- `app/dashboard/infoprodutos/produtos/page.tsx`;
- `app/dashboard/infoprodutos/vendas/page.tsx`;
- `app/dashboard/infoprodutos/acessos/page.tsx`;
- `app/api/auth/register/route.ts`;
- `app/api/auth/session/route.ts`;
- `app/api/auth/account/route.ts`;
- `app/api/products/route.ts`;
- `app/api/products/[id]/route.ts`;
- `app/api/links/route.ts`;
- `app/api/links/[id]/route.ts`;
- `app/api/orders/route.ts`;
- `app/api/webhooks/mercadopago/route.ts`;
- `app/api/webhooks/efipay/route.ts`;
- `app/api/access/[token]/route.ts`;
- `app/api/analytics/track/route.ts`;
- `app/api/analytics/[username]/route.ts`;
- `app/api/uploads/cloudinary/sign/route.ts`;
- `app/api/subscriptions/mercadopago/create/route.ts`;
- `app/admin/layout.tsx`;
- `app/admin/page.tsx`;
- `app/admin/criadores/page.tsx`;
- `app/admin/financeiro/page.tsx`;
- `lib/admin/guard.ts`;
- `lib/admin/session.ts`.

Não foram analisados `node_modules`, `.env.local`, arquivos de build em `.next` ou segredos.
