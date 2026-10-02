# barbz-zip — conteúdo dos projetos

Schema preparado para o futuro Studio; nenhuma instância ou credencial está conectada nesta etapa. Importe `schemaTypes` de `schemaTypes/index.mjs` na configuração do Sanity.

Cada projeto tem nome, ano (`year`), slug, capa, texto do pop-up e uma página interna. `caseStudy.gallery` é uma lista ordenável de blocos; cada bloco define separadamente:

- `layout`: `single` (uma imagem) ou `pair` (duas imagens lado a lado).
- `orientation`: `portrait`, `landscape` ou `original`.
- `images`: uma ou duas imagens, com texto alternativo e hotspot.

Isso permite uma vertical sozinha, duas horizontais, uma horizontal ou duas verticais. A referência Nursegrid usa uma horizontal seguida de duas verticais. A validação impede publicar blocos com quantidade incorreta de imagens. A ordem dos blocos e das imagens é preservada no site.

O adaptador futuro deve transformar `_id` em `id`, `slug.current` em `slug`, `_key` dos blocos em `key` e os assets em `{ src, alt }`, usando crop/hotspot nas URLs das imagens. O resultado deve respeitar os tipos `Project` e `GalleryRow` em `src/data/projects.ts`. Home e index usam a mesma ordem; ano e descrição curta são compartilhados entre as páginas. O layout não depende do número de blocos e não cadastra duplicatas para o slider infinito.
