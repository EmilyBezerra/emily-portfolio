import type { ArticleLang } from './blog.types';

const LOCALES: Record<ArticleLang, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };

// Formata 'YYYY-MM-DD' como data legível no idioma do artigo. Funciona no
// servidor (SSG) e no browser via Intl. Usa meio-dia UTC para evitar que o
// fuso empurre a data para o dia anterior.
export function formatDate(iso: string, lang: string): string {
  const locale = LOCALES[(lang as ArticleLang)] ?? 'pt-BR';
  const date = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
