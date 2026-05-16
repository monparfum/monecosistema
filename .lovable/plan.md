# Studio MON PARFUM — CMS Editorial Visual

O escopo descrito (page builder estilo Webflow/Framer + media library + drag-and-drop + autosave + versionamento + preview em tempo real + edição inline) equivale a construir um produto completo de CMS. Não cabe em uma única entrega sem comprometer a qualidade editorial que a marca exige.

Proponho entregar em **3 fases**, começando por uma base sólida e funcional que já entrega 80% do valor real — sem virar um "ERP pesado".

---

## Fase 1 — Studio v1 (esta entrega)

Núcleo funcional do CMS. Tudo persistido em Lovable Cloud, todas as páginas públicas passam a ler conteúdo do banco em vez de strings hardcoded.

**Rota** `/studio` (protegida por role `admin`, layout próprio, fora do `/admin` atual).

**Seções:**

1. **Páginas** — lista editorial de páginas do site (Home, Sobre, Experiências, Workshops, Cursos, Comunidade, Ebooks, Corporativo). Status draft/publicado. Botão "Editar".
2. **Editor de página** — colunão único, lista vertical de blocos com:
   - Adicionar bloco (modal com galeria visual dos tipos)
   - Reordenar (drag-and-drop com `@dnd-kit`)
   - Duplicar / excluir
   - Editar inline (form lateral à direita)
   - Salvar rascunho / Publicar
3. **Biblioteca de mídia** — grid de imagens do bucket `products` (renomeio futuro), upload drag-and-drop, copiar URL, busca por nome.
4. **Preview** — botão que abre a página pública em nova aba (sem live preview ainda).

**Blocos disponíveis na v1 (6, suficientes para refazer Home + Sobre):**
- Hero editorial (imagem full-bleed + eyebrow + título serif + subtítulo + CTA)
- Texto editorial (manifesto centralizado)
- Grid editorial (3 chapitres com imagem + título + link)
- Produtos em destaque (puxa do catálogo, escolhe 3–4)
- CTA editorial (faixa com chamada + botão)
- Imagem + texto (split 50/50)

**Páginas públicas afetadas:** `/`, `/sobre` passam a renderizar a partir dos blocos do banco. As demais páginas continuam estáticas e serão migradas na Fase 2.

---

## Fase 2 — Expansão (próxima conversa)

- Blocos adicionais: Banner cinematográfico, Workshops, Cursos, Depoimentos, FAQ, Carrossel, Newsletter
- Migrar Experiências, Workshops, Cursos, Comunidade, Ebooks, Corporativo para o Studio
- Duplicar página / salvar como template
- Autosave (debounce 2s)
- Landing page builder (criar páginas com slug livre, ex: `/campanha/edition-02`)

## Fase 3 — Refinamento avançado

- Preview em tempo real (split view com iframe)
- Versionamento (snapshot a cada publicação, restaurar versão anterior)
- Edição inline direto sobre o preview (estilo Framer)
- Histórico de alterações com diff
- Permissões granulares (editor / revisor / admin)

---

## Detalhes técnicos (Fase 1)

**Schema novo** (migration):

```text
pages
  id, slug (unique), title, status (draft|published),
  seo_title, seo_description, created_at, updated_at

page_blocks
  id, page_id (fk pages), type (enum), position (int),
  content (jsonb), created_at, updated_at

media_assets
  id, url, filename, mime_type, width, height,
  uploaded_by, created_at
```

RLS: leitura pública apenas para `pages.status = 'published'` e seus blocks; escrita só para `has_role(admin)`. Media assets: leitura pública, escrita admin.

**Rotas TanStack novas:**
- `src/routes/_studio.tsx` — layout protegido (redirect se não-admin), sidebar editorial clara, tipografia Instrument Serif no topo
- `src/routes/_studio/studio.tsx` — overview (cards: páginas / mídia / atalhos)
- `src/routes/_studio/studio.paginas.tsx` — lista de páginas
- `src/routes/_studio/studio.paginas.$slug.tsx` — editor de blocos
- `src/routes/_studio/studio.midia.tsx` — biblioteca

**Renderização pública:**
- `src/components/blocks/` — um componente por tipo de bloco
- `src/components/page-renderer.tsx` — recebe array de blocks, despacha pelo `type`
- `src/routes/index.tsx` e `src/routes/sobre.tsx` passam a usar `PageRenderer` com loader buscando blocks pela slug

**Estética do Studio:** segue a identidade clara da marca (creme, nude, dourado suave) — não é dark dashboard. Sidebar fina, muito respiro, tipografia serif para títulos de seção, sans 300 para campos. Sem cards pesados, sem badges coloridos agressivos.

**Seed:** os blocos da Home atual e da página Sobre são inseridos no banco via migration `INSERT`, para que ao abrir o Studio a equipe já veja o conteúdo existente — nada se perde visualmente.

---

Confirma a Fase 1 assim como descrita? Se preferir começar por outro recorte (ex: só media library, ou só editor da Home), me diz.