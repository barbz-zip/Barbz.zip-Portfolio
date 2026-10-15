# barbz-zip — conteúdo dos projetos

Schema preparado para o futuro Studio; nenhuma instância ou credencial está conectada nesta etapa. Importe `schemaTypes` de `schemaTypes/index.mjs` na configuração do Sanity.

Cada projeto tem nome, ano (`year`), slug, capa, texto do pop-up e uma página interna. `caseStudy.gallery` é uma lista ordenável de blocos; cada bloco define separadamente:

- `layout`: `single` (uma imagem) ou `pair` (duas imagens lado a lado).
- `orientation`: `portrait`, `landscape` ou `original`.
- `images`: uma ou duas imagens, com texto alternativo e hotspot.

Isso permite uma vertical sozinha, duas horizontais, uma horizontal ou duas verticais. A referência Nursegrid usa uma horizontal seguida de duas verticais. A validação impede publicar blocos com quantidade incorreta de imagens. A ordem dos blocos e das imagens é preservada no site.

O adaptador futuro deve transformar `_id` em `id`, `slug.current` em `slug`, `_key` dos blocos em `key` e os assets em `{ src, alt }`, usando crop/hotspot nas URLs das imagens. O resultado deve respeitar os tipos `Project` e `GalleryRow` em `src/data/projects.ts`. Home e index usam a mesma ordem; ano e descrição curta são compartilhados entre as páginas. O layout não depende do número de blocos e não cadastra duplicatas para o slider infinito.

## Tipografia animada da home

O documento `homeTypography` contém `fonts`, uma lista editável de URLs. Ao criar o documento no Studio, a lista começa com as 160 fontes fornecidas em `src/data/home-fonts.mjs`. É possível adicionar, remover e substituir links de `https://fonts.google.com/specimen/Nome+Da+Fonte`; links da API CSS do Google com uma única família também são aceitos. Links inválidos e famílias duplicadas impedem a publicação.

O futuro adaptador de `getHomeTypography()` em `src/data/home-typography.ts` deve retornar `{ fonts: string[] }` a partir desse documento. Consulta sugerida: `*[_type == "homeTypography"][0]{fonts}`. Nesta etapa, os dados continuam locais; nenhum documento remoto foi criado ou alterado. Com o site estático, uma publicação no CMS deverá disparar um novo build para atualizar a lista.

O navegador começa com IBM Plex Mono, conforme o layout, e prepara uma fonte aleatória da lista para a próxima colisão. As requisições usam `text=barbz.zip`, restringindo os arquivos aos caracteres exibidos. As trocas acontecem apenas nas bordas e somente com a fonte pronta; em uma falha ou conexão lenta, outra fonte já carregada é reutilizada. Se nenhuma alternativa estiver disponível, mantém a atual sem interromper o movimento. Até oito fontes já utilizadas ficam no cache em memória; a navegação encerra a animação, cancela requisições pendentes e remove as fontes desse componente. A preferência de movimento reduzido mantém o texto estático.
