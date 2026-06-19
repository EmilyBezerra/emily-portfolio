export type ArticleLang = 'pt' | 'en' | 'es';

// Metadados de uma versão de artigo (um artigo × um idioma).
// As 3 versões de um mesmo artigo compartilham o mesmo `group` (usado para hreflang).
export interface ArticleMeta {
  group: string;          // id que liga as versões PT/EN/ES (ex.: 'angular-signals')
  lang: ArticleLang;
  slug: string;           // único por idioma; compõe a URL /blog/:slug
  title: string;
  description: string;    // meta description / excerpt (até ~160 caracteres)
  date: string;           // publicação, ISO 'YYYY-MM-DD'
  updated?: string;       // última atualização, ISO 'YYYY-MM-DD'
  category: string;
  tags: string[];
  cover: string;          // caminho a partir da raiz, ex.: '/blog-assets/angular-signals/cover.svg'
  coverAlt: string;
  readingMinutes: number;
}
