# Emily de Jesus Bezerra — Portfolio

Portfolio pessoal desenvolvido com **Angular 21**, apresentando trajetória, stack técnica, experiência profissional e áreas de atuação. Construído com foco em performance, acessibilidade, SEO e qualidade de código.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Angular 21 (standalone components, signals, signal inputs) |
| Linguagem | TypeScript 5.9 (strict mode) |
| Estilos | SCSS customizado + Tailwind CSS v4 (camada utilitária) |
| Internacionalização | @ngx-translate/core — PT / EN / ES |
| Ícones | @lucide/angular |
| Formulário de contato | Web3Forms (sem backend) |
| Renderização | Browser (infraestrutura SSG disponível para ativação futura) |

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

O output vai para `dist/emily-portfolio/browser/`. O `index.html` gerado é servido como página estática — compatível com qualquer host estático (Vercel, Netlify, GitHub Pages, Azure Static Web Apps).

---

## Estrutura do projeto

```
emily-portfolio/
├── public/
│   ├── i18n/                  # Arquivos de tradução (pt.json, en.json, es.json)
│   ├── emily.jpg              # Foto principal (hero)
│   ├── emily-evento.jpg       # Foto secundária (about)
│   ├── robots.txt             # Diretivas para crawlers
│   ├── sitemap.xml            # Mapa do site para SEO
│   └── manifest.webmanifest   # Metadados PWA
│
├── src/
│   ├── index.html             # Entry point — meta tags, JSON-LD, Open Graph
│   ├── main.ts                # Bootstrap do app no browser
│   ├── main.server.ts         # Bootstrap SSG (infraestrutura disponível)
│   ├── tailwind.css           # Import do Tailwind
│   ├── styles.scss            # Design tokens globais, utilitários, animações
│   │
│   ├── environments/
│   │   ├── environment.ts             # Config de produção (web3formsKey)
│   │   └── environment.development.ts # Config de desenvolvimento (file replacement)
│   │
│   └── app/
│       ├── app.ts             # Root component — scroll progress, cursor spotlight
│       ├── app.html           # Template raiz com todos os componentes
│       ├── app.config.ts      # Providers: router, HTTP, i18n, hydration
│       ├── app.config.server.ts  # Config SSG — FileSystemTranslateLoader
│       │
│       ├── components/        # Um componente por seção
│       │   ├── navbar/        # Navegação principal com menu mobile
│       │   ├── hero/          # Seção de apresentação com ticker animado
│       │   ├── manifesto/     # Bloco de filosofia de trabalho
│       │   ├── code-preview/  # Preview interativo de código com syntax highlight
│       │   ├── about/         # Trajetória pessoal e timeline
│       │   ├── experience/    # Experiência profissional
│       │   ├── skills/        # Stack técnica com marquee animado
│       │   ├── services/      # Áreas de atuação técnica
│       │   ├── education/     # Formação acadêmica
│       │   ├── contact/       # Formulário de contato via Web3Forms
│       │   ├── footer/        # Rodapé com assinatura editorial e socials
│       │   └── lang-switcher/ # Seletor de idioma com dropdown
│       │
│       └── shared/
│           ├── types.ts                 # Interfaces partilhadas (Job, JourneyStep, SkillCategory, …)
│           ├── scroll.util.ts           # scrollToAnchor() — smooth scroll para âncoras
│           ├── reveal.service.ts        # IntersectionObserver para animações de entrada
│           └── magnetic.directive.ts    # Efeito magnético (signal input)
```

---

## Internacionalização (i18n)

Os arquivos de tradução ficam em `public/i18n/`. O idioma padrão é português (`pt`).

**Idiomas disponíveis:** Português (`pt`), Inglês (`en`), Espanhol (`es`).

**Para adicionar um novo idioma:**
1. Crie `public/i18n/<código>.json` seguindo a estrutura de `pt.json`
2. Adicione o novo locale em `src/app/components/lang-switcher/lang-switcher.ts`

---

## Configuração do formulário de contato

O formulário usa [Web3Forms](https://web3forms.com/) — gratuito, sem backend necessário.

1. Acesse web3forms.com e obtenha sua chave de acesso (enviada por e-mail)
2. Abra `src/environments/environment.ts` (e `environment.development.ts` se quiser uma chave separada para dev)
3. Substitua o valor `'SUA_CHAVE_AQUI'` pela sua chave

A chave nunca aparece hardcoded no componente — o `Contact` consome `environment.web3formsKey`.

---

## SEO e performance

O projeto implementa um conjunto completo de otimizações para ranqueamento e performance:

- **Meta tags** — title, description, canonical, robots, keywords (nome completo + variações)
- **Open Graph** — tipo `profile`, com `profile:first_name` e `profile:last_name`, plus locales alternativos
- **Twitter Card** — summary_large_image
- **JSON-LD `Person`** — `name` completo + `alternateName` (variações para indexação), `givenName`, `additionalName`, `familyName`, cargo, localização, links sociais, formação, habilidades e empregador
- **sitemap.xml** — indexação pelos crawlers
- **robots.txt** — permissão total de rastreamento + referência ao sitemap
- **manifest.webmanifest** — sinais PWA para navegadores
- **Preload da imagem hero** — `fetchpriority="high"` para LCP otimizado
- **Lazy loading** — `loading="lazy" decoding="async"` nas imagens secundárias
- **Animações com IntersectionObserver** — sem layout shift, sem performance penalty

---

## Segurança

O projeto adota um conjunto de práticas defensivas, mesmo sendo um site estático:

- **Sem `target="_blank"` desprotegido** — todos os links externos usam `rel="noopener noreferrer"` para impedir `window.opener` hijacking e vazamento do `Referer`
- **`innerHTML` apenas com conteúdo controlado** — bindings `[innerHTML]` só recebem strings vindas dos arquivos i18n (controlados pela autora); ainda assim, o Angular `DomSanitizer` sanitiza automaticamente
- **Sem segredos hardcoded** — chave do Web3Forms vive em `src/environments/environment.ts` (substituído em build de dev via `fileReplacements`); commitar com `'SUA_CHAVE_AQUI'` mantém o repositório limpo
- **Validação defensiva no formulário de contato** — `trim()` em todos os campos, regex de e-mail, limites de tamanho (`name: 100`, `email: 254`, `subject: 200`, `message: 2000`) tanto via `maxlength` no HTML quanto re-checados no `onSubmit`
- **Atributos `autocomplete` e `inputmode`** corretos nos inputs do formulário (`name`, `email`)
- **`npm audit`** roda limpo: zero vulnerabilidades em dependências de produção
- **Sem `console.log` de produção** — apenas um `console.error` no bootstrap (`main.ts`)
- **Sem non-null assertions (`!`)** — `RevealService` usa guards explícitos em vez de afirmações inseguras

---

## Acessibilidade

- Elementos semânticos HTML5 em todos os componentes (`<nav>`, `<section>`, `<article>`, `<ul>`, `<label>`)
- Labels com `for` associados a todos os inputs do formulário de contato
- Botão do menu mobile com `aria-expanded`, `aria-controls` e `aria-label`
- Seletor de idioma com `aria-haspopup`, `aria-expanded`, `role="listbox"` e `aria-selected`
- Marquee decorativo com `aria-hidden="true"` para não poluir leitores de tela
- Atributos `alt` descritivos em todas as imagens
- `@media (prefers-reduced-motion: reduce)` desativa animações para quem precisa

---

## Padrões de código

Todo o código segue um conjunto coerente de práticas modernas Angular 21:

- **Dependency Injection com `inject()`** — em vez de constructor DI, em todos os componentes, serviços e diretivas
- **`DestroyRef` + `takeUntilDestroyed`** — para cancelar subscrições (substitui o padrão clássico `Subscription` + `unsubscribe()`)
- **Signal inputs (`input()`)** — usado nas diretivas `MagneticDirective` e `TiltDirective` em vez do decorator `@Input()`
- **Signals (`signal()`)** — estado reativo local nos componentes (ex.: `mobileOpen`, `displayText`, `sent`, `sending`)
- **Standalone components** — sem `NgModule`, cada componente declara os próprios `imports`
- **Tipos explícitos** — `any` foi eliminado; interfaces em `shared/types.ts` (`Job`, `JourneyStep`, `Project`, `SkillCategory`, etc.)
- **Reutilização** — `scrollToAnchor()` partilhado em vez de duplicar `scrollIntoView`; `RevealService` para animações de entrada em todas as seções
- **Environment files** — segredos e configuração fora dos componentes (`environment.ts` / `environment.development.ts` com `fileReplacements` no `angular.json`)
- **SSR-safe** — todo acesso a APIs do browser (`window`, `document`, `IntersectionObserver`) usa `isPlatformBrowser(PLATFORM_ID)`
- **Sem dead code** — classes CSS, componentes e campos não utilizados foram removidos
- **Comentários** — apenas quando o motivo não é óbvio pelo código — nunca blocos multilinha desnecessários

---

## Design system

A paleta segue um estilo pastel editorial com inspiração em Linear / Anthropic / Vercel:

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
