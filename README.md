# Emily de Jesus Bezerra — Portfolio

Portfolio pessoal **e blog técnico** desenvolvido com **Angular 21**, apresentando trajetória, stack, experiência e artigos sobre tecnologia. Renderizado como site estático (SSG/prerender) e trilíngue (PT / EN / ES), com foco em performance, acessibilidade, SEO e qualidade de código.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Angular 21 (standalone components, signals, signal inputs, sem Zone.js / zoneless) |
| Linguagem | TypeScript 5.9 (strict mode) |
| Estilos | SCSS customizado + Tailwind CSS v4 (camada utilitária) |
| Renderização | SSG — prerender estático (`outputMode: "static"`) com hidratação |
| Internacionalização | @ngx-translate/core — PT / EN / ES |
| Blog | Markdown via `marked` + `marked-highlight` + `highlight.js` |
| Ícones | @lucide/angular |
| Formulário de contato | Web3Forms (sem backend) |

---

## Pré-requisitos

- Node.js 20+
- npm 11+

---

## Instalação e execução local

```bash
npm install
npm start
```

Acesse em `http://localhost:4200`.

---

## Build de produção

```bash
npm run build
```

O build gera o `sitemap.xml` (`scripts/generate-sitemap.mjs`) e **prerendeiza 8 rotas estáticas** (home, `/blog` e os 6 artigos — 2 artigos × 3 idiomas). O output vai para `dist/emily-portfolio/browser/` e é compatível com qualquer host estático (Vercel, Netlify, GitHub Pages, Azure Static Web Apps).

---

## Estrutura do projeto

```
emily-portfolio/
├── public/
│   ├── i18n/                  # Traduções (pt.json, en.json, es.json)
│   ├── content/blog/          # Corpo dos artigos em Markdown
│   │   ├── pt/  en/  es/      #   <slug>.md por idioma
│   ├── blog-assets/           # Capas dos artigos (cover.jpg)
│   ├── emily.jpg / emily.webp # Foto principal (hero)
│   ├── emily-evento.webp      # Foto secundária (about)
│   ├── robots.txt             # Diretivas para crawlers
│   ├── sitemap.xml            # Mapa do site (gerado no build)
│   └── manifest.webmanifest   # Metadados PWA
│
├── scripts/
│   └── generate-sitemap.mjs   # Gera o sitemap a partir de blog.data.json (roda no build)
│
├── src/
│   ├── index.html             # Meta tags, JSON-LD (Person + WebSite), Open Graph
│   ├── main.ts                # Bootstrap no browser
│   ├── main.server.ts         # Bootstrap do prerender (SSG)
│   ├── tailwind.css           # Import do Tailwind
│   ├── styles.scss            # Tokens globais, utilitários, .article-prose, callouts
│   │
│   ├── environments/          # web3formsKey (environment.ts / .development.ts)
│   │
│   └── app/
│       ├── app.ts             # Root — scroll progress, cursor spotlight, idioma persistido
│       ├── app.config.ts      # Providers: router, HTTP, i18n, hydration, markdown loader
│       ├── app.config.server.ts  # SSG: FileSystemTranslateLoader + ServerBlogContentLoader
│       ├── app.routes.ts         # Rotas: '', 'blog', 'blog/:slug' (lazy)
│       ├── app.routes.server.ts  # RenderMode.Prerender + getPrerenderParams
│       │
│       ├── pages/home/        # Home — todas as seções da landing
│       │
│       ├── components/        # Uma seção por componente
│       │   ├── navbar/  hero/  manifesto/  code-preview/  about/
│       │   ├── experience/  skills/  services/  education/
│       │   └── contact/  footer/  lang-switcher/
│       │
│       ├── blog/             # Blog técnico
│       │   ├── blog.data.json       # Metadados (1 entrada por artigo × idioma)
│       │   ├── blog.types.ts        # ArticleMeta
│       │   ├── blog.service.ts      # getByLang / getBySlug / getAlternates
│       │   ├── blog-content.loader.ts  # Loader dual (HTTP no browser / fs no SSG)
│       │   ├── markdown.service.ts     # marked + highlight.js (código, âncoras, callouts)
│       │   ├── blog-list/           # /blog
│       │   └── blog-article/        # /blog/:slug
│       │
│       └── shared/
│           ├── types.ts                 # Job, JourneyStep, Badge, SkillCategory, ServiceItem, Course, ContactChannel, NavLink, Lang
│           ├── seo.service.ts           # Title/Meta/canonical/hreflang/JSON-LD (via DOCUMENT, SSG-safe)
│           ├── site.ts                  # SITE_URL canônica
│           ├── scroll.util.ts           # scrollToAnchor() + prefersReducedMotion()
│           ├── reveal.service.ts        # IntersectionObserver para animações de entrada
│           └── magnetic.directive.ts    # Efeito magnético (signal input)
```

---

## Blog

- Rotas **lazy** `/blog` (lista) e `/blog/:slug` (artigo) em `app.routes.ts` — mantêm o `marked`/`highlight.js` fora do bundle inicial.
- Conteúdo trilíngue em Markdown: `public/content/blog/<idioma>/<slug>.md`. Metadados em `blog/blog.data.json` (uma entrada por artigo × idioma, ligadas por `group`).
- Renderização via `MarkdownService`: blocos de código com botão **copiar**, âncoras nos títulos, e callouts `> [!TIP]` / `> [!WARNING]`.
- **Loader dual** (`BLOG_CONTENT_LOADER`): HttpClient no browser, filesystem no SSG (espelha o `FileSystemTranslateLoader`), com TransferState — o corpo do artigo já sai no HTML prerenderizado.
- **SEO por idioma**: cada artigo tem URL própria por idioma com `hreflang` (x-default → pt), `<html lang>` correto no prerender, `og:image` = capa do artigo, e JSON-LD `BlogPosting` + `BreadcrumbList` com `inLanguage` em BCP-47.

**Para adicionar um artigo:** criar os `.md` em `public/content/blog/<idioma>/`, adicionar uma entrada por idioma em `blog/blog.data.json` (com `cover` em `public/blog-assets/<group>/`), e rodar o build (o sitemap e o prerender se atualizam sozinhos).

---

## Internacionalização (i18n)

Traduções em `public/i18n/`. Idioma padrão: português (`pt`). Disponíveis: PT, EN, ES. O idioma escolhido é **persistido em `localStorage`** e o `<html lang>` é definido por rota.

**Para adicionar um novo idioma:**
1. Criar `public/i18n/<código>.json` seguindo a estrutura de `pt.json`.
2. Registrar o locale em `src/app/components/lang-switcher/lang-switcher.ts`.

---

## Configuração do formulário de contato

O formulário usa [Web3Forms](https://web3forms.com/) — gratuito, sem backend. O `Contact` consome `environment.web3formsKey`.

> **Nota:** a *access key* do Web3Forms é **pública por design** — ela vai para o bundle do browser de qualquer forma e serve apenas para rotear o envio. Não é um segredo; está versionada intencionalmente em `src/environments/`. Para usar outra conta, substitua o valor em `environment.ts`.

---

## SEO e performance

- **Meta tags por rota** (title, description, canonical, robots, keywords), **Open Graph** e **Twitter Card** via `SeoService`.
- **JSON-LD**: `Person` + `WebSite` (`index.html`); `BlogPosting` + `BreadcrumbList` nos artigos; `Blog` + `BreadcrumbList` na lista.
- **`hreflang`** por idioma nos artigos (x-default → pt); **`sitemap.xml`** gerado no build; **`robots.txt`**; **`manifest.webmanifest`**.
- **Prerender estático (SSG) com hidratação** — o conteúdo (inclusive o corpo dos artigos) já vem no HTML para os crawlers.
- **Hero** com `NgOptimizedImage` (`priority`) para LCP; imagens secundárias com `loading="lazy"`/`decoding="async"`; capas com `aspect-ratio` + `object-fit`.
- Animações com **IntersectionObserver** (sem layout shift), com fallback sem-JS para o conteúdo `.reveal`.

---

## Segurança

- **Links externos** com `rel="noopener noreferrer"`.
- **`[innerHTML]` apenas com conteúdo autoral e estático** — o corpo dos artigos vem de arquivos Markdown versionados no repositório (sem CMS, comentários ou entrada de terceiros) e é renderizado pelo `marked`. Não há vetor de XSS por entrada de usuário.
- **Validação defensiva no formulário** — `trim()`, regex de e-mail e limites de tamanho (`name: 100`, `email: 254`, `subject: 200`, `message: 2000`) no HTML (`maxlength`) e re-checados no `onSubmit`; honeypot anti-spam.
- Atributos `autocomplete`/`inputmode` corretos; `npm audit` limpo; sem `console.log` de produção.

---

## Acessibilidade

- HTML semântico (`<nav>`, `<section>`, `<article>`, `<ul>`, `<label>`) e `<html lang>` correto por rota.
- **Foco de teclado visível** global (`:focus-visible`).
- **Formulário**: labels com `for`; erro com `role="alert"` e sucesso com `role="status"`/`aria-live` (anunciados por leitores de tela).
- **Seletor de idioma**: botões com `aria-expanded`/`aria-controls`/`aria-current`; fecha com **Escape** e clique fora (o menu mobile também).
- **Artigo**: índice (TOC) com `aria-current` na seção ativa.
- `@media (prefers-reduced-motion)` e `@media (scripting: none)` respeitados; `alt` descritivo em todas as imagens.

---

## Padrões de código

- **DI com `inject()`** em componentes, serviços e diretivas.
- **`DestroyRef` + `takeUntilDestroyed`** para cancelar subscrições.
- **Signals** (`signal()`, `computed()`) para estado reativo e **signal inputs** (`input()` na `MagneticDirective`).
- **Standalone components** — sem `NgModule`; **zoneless** — sem Zone.js.
- **Tipos explícitos** — interfaces em `shared/types.ts`; sem `any`.
- **SSR-safe** — acesso a APIs do browser (`window`, `document`, `localStorage`, `IntersectionObserver`) sob `isPlatformBrowser`, ou via `DOCUMENT` quando precisa rodar no prerender.
- **Reutilização** — `scrollToAnchor()`/`prefersReducedMotion()` partilhados; `RevealService` para animações; `SeoService` para metadados.
- Sem dead code; comentários apenas quando o motivo não é óbvio.

---

## Design system

Paleta pastel editorial com inspiração em Linear / Anthropic / Vercel:

| Token | Valor | Uso |
|---|---|---|
| `--accent-primary` | `#a5b4fc` | Lavanda — destaque primário |
| `--accent-secondary` | `#c4b5fd` | Violet — ênfase serif italic |
| `--accent-mint` | `#a7f3d0` | Verde sutil — gradientes frios |
| `--accent-champagne` | `#fde68a` | Amarelo champagne |
| `--accent-blush` | `#fbcfe8` | Rosa pastel |
| `--accent-sage` | `#86efac` | Verde sage |

**Fontes:**
- `Inter` — corpo (300, 400, 500, 600, 700, 900)
- `Instrument Serif` — ênfase editorial italic (`.serif-em`, `.copy-name`)
- `JetBrains Mono` — código, marquee, marcas de capítulo

**Easings padrão:**
- `--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)`
- `--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1)`

---

## Contato

**Emily de Jesus Bezerra** — Desenvolvedora Full Stack
Santos, SP, Brasil
[emily.bezerra9343@gmail.com](mailto:emily.bezerra9343@gmail.com) · [LinkedIn](https://www.linkedin.com/in/emilybezerra) · [GitHub](https://github.com/EmilyBezerra)
