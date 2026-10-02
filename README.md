# barbz-zip

## Desenvolvimento

Projeto em Astro, TypeScript e CSS. Ambiente: Node.js 24 e pnpm 11.25.0.

```sh
pnpm install
pnpm dev
```

Servidor local: http://127.0.0.1:4321.

```sh
pnpm check   # Checagem de tipos
pnpm test    # Testes
pnpm build   # Build de produção
pnpm preview # Prévia local do build
```

O arquivo `pnpm-lock.yaml` mantém as versões das dependências reproduzíveis.

Para validar o build com o prefixo do GitHub Pages:

```sh
GITHUB_PAGES=true pnpm build
GITHUB_PAGES=true pnpm preview
```

## Estrutura

- `src/pages/`: rotas da home, index, about e páginas de projeto em `[slug].astro`.
- `src/layouts/Layout.astro`: estrutura compartilhada, metadados, tipografia e navegação entre páginas.
- `src/components/`: cabeçalho, galeria, capas, cards e diálogo dos projetos.
- `src/data/`: conteúdo local e contrato dos projetos, acessado por `getProjects()`.
- `src/lib/gallery.ts`: slider infinito, autoplay de 50 px/s, drag e scroll; saída do hover e scroll sem espera adicional para retomar o autoplay.
- `src/lib/gallery-math.ts`: normalização do loop e cálculo de cópias da galeria.
- `src/lib/project-dialog.ts`: abertura e fechamento do pop-up e texto que acompanha o cursor.
- `src/lib/project-index.ts`: interação da lista e prévia das capas junto ao cursor.
- `src/lib/project-return.ts`: retorno à home ou ao index conforme a origem da navegação.
- `src/lib/case-study.ts`: expansão das imagens na página do projeto.
- `src/lib/menu.ts`: movimento do indicador do menu.
- `src/lib/site.ts`: inicialização e limpeza das interações com o ClientRouter do Astro.
- `src/lib/paths.ts`: caminhos de rotas e imagens compatíveis com o prefixo de publicação.
- `src/styles/global.css`: estilos, responsividade e transições.
- `src/assets/`: fontes processadas pelo Astro.
- `public/images/`: imagens locais.
- `sanity/schemaTypes/index.mjs`: schemas para a futura integração com Sanity, incluindo blocos de uma ou duas imagens e suas orientações. O front-end utiliza os dados locais enquanto o CMS não está conectado.
- `tests/`: testes da galeria e dos blocos das páginas de projeto.
- `astro.config.mjs`: configuração do Astro e do prefixo de publicação.
- `.github/workflows/deploy.yml`: validação, testes, build e publicação da branch `main` no GitHub Pages.
