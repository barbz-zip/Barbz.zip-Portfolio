# barbz-zip

Portfólio local em Astro, TypeScript e CSS: home, index, about, pop-ups e páginas de projeto. Referências: [home no Figma](https://www.figma.com/design/hq8oTrHB9tLa9YQDKwNl9A/Barbz-zip_Portfolio?node-id=2213-2210), [menu no Figma](https://www.figma.com/design/hq8oTrHB9tLa9YQDKwNl9A/Barbz-zip_Portfolio?node-id=2213-2638), [página de projeto](https://www.figma.com/design/hq8oTrHB9tLa9YQDKwNl9A/Barbz-zip_Portfolio?node-id=2213-2212) e [galeria do Aparelho Studio](https://aparelho.studio/).

## Desenvolvimento

Node.js 24 e pnpm 11.25.0.

```sh
pnpm install
pnpm dev
```

Abra http://127.0.0.1:4321. Para validar:

```sh
pnpm check
pnpm test
pnpm build
```

`pnpm preview` serve o build localmente. `pnpm-lock.yaml` mantém as versões reproduzíveis.

## Estrutura

- `src/pages/index.astro`: home.
- `src/pages/about.astro` e `src/data/about.ts`: retrato, biografia, reconhecimentos e imprensa do Figma; imagem fixa no desktop e fluxo único no mobile.
- `src/pages/index/index.astro`: lista de projetos em `/index/`, usando os mesmos dados e ordem da home.
- `src/lib/project-index.ts`: capas acompanhando o cursor, com limites da janela e alternativa para foco por teclado.
- `src/pages/[slug].astro`: páginas acessíveis diretamente em `/nursegrid/`, `/ginga/`, `/chelsea-film-festival/`, `/gunga/` e `/fruittella/`.
- `src/layouts/Layout.astro`: metadados, tipografia, cabeçalho e rodapé.
- `src/components/Header.astro`: menu central. Home, index e about estão ativos; o indicador acompanha hover, foco e rota atual.
- `src/components/Gallery.astro` e `ProjectCard.astro`: apresentação dos projetos.
- `src/lib/gallery.ts`: interação do slider; velocidade em `AUTO_SPEED`, intervalo após gestos em `RESUME_DELAY`; a saída do hover retoma imediatamente.
- `src/lib/project-dialog.ts`: pop-up, fechamento e texto `open case study` que acompanha o cursor.
- `src/lib/menu.ts`: indicador branco único com deslocamento e ajuste de largura em 150 ms, por hover ou foco de teclado.
- `src/lib/project-return.ts`: Back retorna ao index ou à home conforme a origem, preservada por entrada do histórico e após recarregar; acesso direto tem a home como destino.
- `src/lib/case-study.ts`: alternância entre descrição fixa e imagens expandidas.
- `src/lib/site.ts`: inicialização e limpeza de eventos/animações ao navegar com o ClientRouter do Astro.
- `src/data/projects.ts`: contrato `Project` e conteúdo local acessado por `getProjects()`.
- `src/styles/global.css`: medidas, breakpoints e microinterações.
- `public/images/`: imagens originais baixadas do Figma, sem URLs temporárias.

## Comportamento da galeria

A lista contém cinco capas diferentes do Figma, cadastradas uma única vez. O slider cria cópias visuais conforme a largura da tela; qualquer quantidade de projetos usa o mesmo mecanismo. A posição é normalizada por ciclo, nos dois sentidos, sem voltar abruptamente ao primeiro card. Os testes cobrem os limites do loop, gestos longos e quantidade de cópias em telas de até 5120 px.

- Movimento automático de 50 px/s.
- Drag com mouse/toque, captura do ponteiro e inércia.
- Rolagem vertical do mouse e horizontal do trackpad movem a galeria, inclusive sobre o espaço vazio da home. Gestos diagonais usam o eixo dominante; zoom preservado.
- Pausa apenas sobre a imagem do projeto, sem incluir o espaço vazio do slider, e durante navegação por teclado. Cursor pointer sobre os cards; grabbing durante drag.
- Setas esquerda/direita e Home/End quando a galeria está focada; Enter/espaço abre o projeto central.
- Hover revela o nome precedido de ↗ e desfoca os outros cards (blur de 6 px e opacidade de 40%), conforme o Figma. O efeito é suspenso durante o drag.
- Sem controle manual de pausar/reproduzir.
- Clique/toque abre um diálogo central com imagem, título e descrição. Imagem e cápsulas seguem os layouts desktop/mobile do Figma. Entrada com opacidade e deslocamento vertical de 18 px; a preferência por movimento reduzido remove a animação.
- A galeria para e fica desfocada enquanto o diálogo está aberto. Fechamento pelo botão, Esc ou clique fora; foco contido no diálogo e devolvido à galeria. Arrastes acima de 6 px não disparam abertura. A roda do mouse fica livre para rolar conteúdos do diálogo.
- A imagem e toda a bolha do nome no pop-up são links para a página do projeto. `open case study` acompanha o cursor sobre ela como texto simples, sem cápsula ou colchetes; dispositivos sem hover recebem uma indicação estática.
- `prefers-reduced-motion` desativa o autoplay inicialmente e a inércia.
- Cópias visuais ocultas da árvore de acessibilidade. Sem JavaScript, a lista mantém rolagem horizontal nativa.

## Páginas dos projetos e CMS

A navegação usa transição de opacidade com deslocamento sutil. No desktop, as informações ficam fixas à esquerda enquanto as imagens rolam à direita, passando livremente por trás do menu e do botão de expansão. `full screen` esconde as informações e expande a galeria; `Description` ou Esc restaura o layout. No mobile, as informações precedem a galeria, sem fullscreen; o botão Back permanece fixo durante a rolagem. O menu mobile tem quatro opções e o botão de contato separado à direita, conforme as telas do Figma. O estado de foco por teclado usa fundo/underline discretos, sem contorno preto.

Os blocos da galeria têm quantidade (`single` ou `pair`) e orientação (`portrait`, `landscape` ou `original`) independentes. O schema em `sanity/schemaTypes/index.mjs` permite montar/reordenar esses blocos e valida a quantidade de imagens. Veja `sanity/README.md` para o contrato de integração.

Sanity ainda não está conectado, conforme o escopo front-end primeiro. O futuro adaptador deve retornar `Project[]` em `getProjects()`, com id estável, slug, título, ano, descrição, imagem e texto alternativo; a galeria independe da origem e quantidade dos documentos. Nenhuma chave ou SDK do CMS é necessário nesta versão.

Read e contato aguardam os próximos layouts/links. Nursegrid usa texto e montagem de imagens do Figma; os demais cases têm página funcional com a capa e conteúdo editorial provisório. O repositório remoto é `barbz-zip/Barbz.zip-Portfolio`. Contato aguarda o endereço definitivo.

A fonte local é a ABC Diatype Mono Variable **Trial**, a mesma indicada pelo Figma, disponível na biblioteca local do usuário. Antes da publicação, substituir pelo arquivo web licenciado. As imagens e nomes provisórios vêm das capas do layout; revisar o conteúdo editorial junto da integração com o CMS.

O index apresenta nome, ano e os atributos da descrição curta do pop-up no desktop. No mobile, exibe apenas nome e ano em 16 px, com linhas de 44 px e margem lateral de 21 px. Os anos dos cases provisórios usam 2025 nesta prévia, seguindo a referência visual, e devem ser revisados no CMS. As capas compartilham o componente da home, com 320 × 213 px no desktop. Clique ou toque na linha abre o case. No mobile, o menu começa a 25 px do topo, como no desktop; contato e Back mantêm os intervalos entre as duas linhas do header.

O about preserva o texto de demonstração do Figma (incluindo a biografia que menciona Cooke), os reconhecimentos e os destinos dos links, sem assumir que a biografia seja o conteúdo editorial final de Barbara. O retrato é local, com o enquadramento original da referência. Index e about mobile seguem o header sem botão de contato externo, como nesses layouts.

## GitHub Pages

O workflow `.github/workflows/deploy.yml` valida, testa e publica a branch `main` no GitHub Pages. Na configuração do repositório, selecione **Settings → Pages → Source: GitHub Actions** (requer acesso administrativo).

Endereço previsto: https://barbz-zip.github.io/Barbz.zip-Portfolio/

A variável `GITHUB_PAGES=true` habilita o prefixo `/Barbz.zip-Portfolio/` no build. `src/lib/paths.ts` aplica esse prefixo às rotas e imagens; o desenvolvimento local continua na raiz `/`. A fonte é processada pelo Astro a partir de `src/assets/`.

```sh
GITHUB_PAGES=true pnpm build
GITHUB_PAGES=true pnpm preview
```

A licença original do repositório está preservada em `LICENSE`. Imagens e fonte mantêm suas licenças próprias.
