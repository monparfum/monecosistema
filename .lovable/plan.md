## Objetivo

Expandir a plataforma adicionando 5 novos módulos (Operações, CRM, Academy, Marketing, Administração) totalmente integrados ao ecossistema Commerce + Studio existente, sem alterar arquitetura ou módulos atuais.

## Escopo desta entrega — Fase 1 (Estrutura)

Criar **apenas a estrutura visual e de rotas** de cada módulo, seguindo o mesmo Design System editorial (Instrument Serif + Inter, paleta clara, radius=0). Os dados que já existem no Commerce (pedidos, clientes) serão **lidos** — nada duplicado. Áreas sem dados exibem *empty states* elegantes preparados para receber informação futura.

Não faz parte desta fase: implementação de IA, integrações de transportadoras, gateways de email/WhatsApp, criação de novas tabelas grandes de negócio. Estrutura pronta para receber tudo isso.

## Arquitetura

```text
src/routes/
  _admin/                          [já existe — não mexer nos submódulos atuais]
    admin.modulos.tsx              [atualizar: passar de 4 para 7 cards]
  _ops/                            [NOVO — módulo Operações]
    route.tsx                      layout com sidebar própria
    ops.index.tsx                  dashboard
    ops.pedidos.tsx                lê orders do Commerce
    ops.pedidos.$id.tsx            timeline do pedido
    ops.expedicao.tsx
    ops.producao.tsx
  _crm/                            [NOVO]
    route.tsx
    crm.index.tsx                  dashboard
    crm.clientes.tsx               lista com LTV, última compra
    crm.clientes.$id.tsx           ficha 360º (pedidos, cursos, exp, obs)
    crm.segmentos.tsx
  _academy/                        [NOVO — área do admin p/ gerir cursos + libera acesso]
    route.tsx
    academy.index.tsx
    academy.cursos.tsx
    academy.alunos.tsx
    academy.certificados.tsx
  _marketing/                      [NOVO]
    route.tsx
    marketing.index.tsx            dashboard: seguidores, leads, ROI
    marketing.campanhas.tsx
    marketing.calendario.tsx
    marketing.social.tsx           placeholders IG/TikTok/etc
    marketing.automacoes.tsx
    marketing.ia.tsx               shell preparado p/ IA (sem implementar)
  _administracao/                  [NOVO]
    route.tsx
    administracao.index.tsx
    administracao.usuarios.tsx     usa profiles + user_roles
    administracao.papeis.tsx
    administracao.integracoes.tsx
    administracao.logs.tsx
    administracao.empresa.tsx
```

Todos os layouts de módulo reutilizam o mesmo padrão do `_admin.tsx` atual: sidebar 240px + `← Módulos`, header do módulo, área de conteúdo com breadcrumb.

**Core (invisível)** — criar dois arquivos utilitários compartilhados, sem tabelas novas nesta fase:

- `src/lib/core/events.ts` — barramento in-memory (`emit`, `on`) para os módulos comunicarem no cliente (ex.: Commerce emite `order.created`, Ops/CRM ouvem). Documentado para ser trocado por Postgres NOTIFY / edge function no futuro.
- `src/lib/core/module-registry.ts` — fonte única dos 7 módulos (id, label, ícone, rota, permissões requeridas). `admin.modulos.tsx` e o header passam a ler daqui. Facilita adicionar módulo futuro em 1 lugar só.

**Permissões** — sem migração agora. Cada `route.tsx` de módulo faz `beforeLoad` só verificando `admin` (igual aos existentes). O registry já declara `requiredRoles` de cada módulo para quando for expandido.

## Componentes de UI compartilhados (novos)

- `src/components/module-shell.tsx` — layout genérico (sidebar + main + breadcrumb + botão voltar Módulos). Cada `route.tsx` novo usa isso, evita repetir markup.
- `src/components/empty-state.tsx` — estado vazio editorial (eyebrow + display + texto + CTA opcional).
- `src/components/stat-card.tsx` — card de métrica do dashboard.
- `src/components/data-table.tsx` — tabela leve com busca + filtros básicos (não substitui shadcn; é um wrapper mínimo no estilo da casa).
- `src/components/skeleton-row.tsx` — skeleton loading no tom da paleta.

## Integrações de dados (reutilizando o que já existe)

- **Ops → Pedidos**: `select * from orders` (mesma query do `_admin/admin.pedidos.tsx`), agrupado por status operacional.
- **CRM → Clientes**: `profiles` join com agregados de `orders` (LTV = sum(total_cents), última compra = max(created_at), total de pedidos).
- **Academy → Alunos**: por enquanto lista `order_items` cujo `product` tenha categoria "cursos" (placeholder; matrícula real fica p/ fase 2).
- **Administração → Usuários**: `profiles` + `user_roles` (leitura). Alteração de papel via update em `user_roles` (já existe).
- **Marketing**: 100% dashboard com valores placeholder + empty states rotulados "Conectar Instagram", "Configurar automação", etc. Nada quebra, nada mente.

## Atualizações em arquivos existentes

- `src/routes/_admin/admin.modulos.tsx` — passa a mapear `module-registry`. Ganha os 5 novos cards.
- `src/components/site-header.tsx` — link "Módulos" continua igual (aponta pra `/admin/modulos`).
- `src/routes/login.tsx` — sem mudanças (admin já cai em `/admin/modulos`).

Nada em Commerce (`_admin/admin.produtos`, `.categorias`, `.pedidos`, `.clientes`) ou Studio (`_studio/*`) é tocado.

## Design

Mantém o vocabulário editorial atual: eyebrow uppercase tracked, display Instrument Serif com itálico de destaque, muito respiro, grades com `gap-px bg-border`, sem sombras pesadas, hover discreto (`bg-[color:var(--muted)]`). Dashboards com no máximo 4 stat cards por linha; tabelas com hairlines superior/inferior, sem zebra.

## Fora de escopo (fica documentado no code para fase 2)

- Emissão de etiqueta / integração Correios / Melhor Envio.
- Provider de IA real em `marketing.ia.tsx`.
- Player de vídeo / progresso de aula em Academy (a fase 1 só lista cursos e alunos).
- Provider de email/WhatsApp em automações.
- Tabelas novas de `courses`, `lessons`, `campaigns`, `automations` — serão adicionadas quando cada feature for ativada; nesta fase os módulos operam sobre dados existentes e placeholders bem sinalizados.

## Confirmação necessária

Confirma que posso seguir por essa Fase 1 (estrutura + integrações de leitura sobre o que já existe, sem novas tabelas)? Se sim, entrego tudo de uma vez e depois abrimos ticket a ticket para "acender" cada submódulo com dados/integrações reais.