import { Injectable } from '@angular/core';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';

// Apenas as linguagens usadas nos artigos — mantém o bundle do chunk do blog enxuto.
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);

export interface MarkdownLabels {
  copy: string;
  copied: string;
  sectionLink: string;
}

const COPY_ICON =
  '<svg class="ico copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
  '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const CHECK_ICON =
  '<svg class="ico check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
  '<polyline points="20 6 9 17 4 12"/></svg>';

// Ícones dos callouts (dica / nota / aviso / importante).
const CALLOUT_ICONS: Record<string, string> = {
  tip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18h6M10 21h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  important: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  caution: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
};

const ALERT_RE = /\[!(TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]/i;
const ALERT_STRIP_RE = /\[!(?:TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?\s*/i;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface RendererThis {
  parser: { parse(tokens: unknown[]): string };
}

// Converte Markdown em HTML. O realce é feito por função pura (highlight.js,
// sem DOM), então funciona igual no SSG e no browser. Um renderer customizado
// adiciona: barra premium nos blocos de código (linguagem + copiar), id +
// âncora "#" nos títulos, e callouts (> [!TIP] / [!WARNING] ...).
// Provido no componente blog-article (fica no chunk lazy do blog).
@Injectable()
export class MarkdownService {
  render(markdown: string, labels: MarkdownLabels): string {
    if (!markdown) return '';
    const marked = new Marked(
      markedHighlight({
        langPrefix: 'hljs language-',
        highlight: (code, lang) => {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return escapeHtml(code);
        }
      }),
      { renderer: this.buildRenderer(labels) }
    );
    return marked.parse(markdown, { async: false, gfm: true }) as string;
  }

  private buildRenderer(labels: MarkdownLabels) {
    const copy = escapeHtml(labels.copy);
    const copied = escapeHtml(labels.copied);
    const sectionLink = escapeHtml(labels.sectionLink);

    return {
      code(token: { text: string; lang?: string; escaped?: boolean }) {
        const rawLang = (token.lang || '').trim().split(/\s+/)[0];
        const lang = rawLang.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const body = token.escaped ? token.text : escapeHtml(token.text);
        const label = lang ? lang.toUpperCase() : 'CODE';
        return (
          '<div class="code-block">' +
            '<div class="code-block__bar">' +
              '<span class="code-block__dots" aria-hidden="true"></span>' +
              `<span class="code-block__lang">${label}</span>` +
              `<button class="code-block__copy" type="button" aria-label="${copy}">` +
                COPY_ICON + CHECK_ICON +
                `<span class="code-block__copy-label label-copy">${copy}</span>` +
                `<span class="code-block__copy-label label-copied">${copied}</span>` +
              '</button>' +
            '</div>' +
            `<pre><code class="hljs language-${lang}">${body}</code></pre>` +
          '</div>'
        );
      },
      heading(token: { text: string; depth: number }) {
        const id = slugify(token.text);
        return (
          `<h${token.depth} id="${id}">` +
            escapeHtml(token.text) +
            `<a class="heading-anchor" href="#${id}" aria-label="${sectionLink}">#</a>` +
          `</h${token.depth}>`
        );
      },
      blockquote(this: RendererThis, token: { tokens: unknown[]; text: string }) {
        const inner = this.parser.parse(token.tokens);
        const match = ALERT_RE.exec(token.text);
        if (match) {
          const type = match[1].toLowerCase();
          const icon = CALLOUT_ICONS[type] ?? CALLOUT_ICONS['note'];
          const cleaned = inner.replace(ALERT_STRIP_RE, '');
          return (
            `<div class="callout callout--${type}">` +
              `<span class="callout__icon" aria-hidden="true">${icon}</span>` +
              `<div class="callout__body">${cleaned}</div>` +
            '</div>'
          );
        }
        return `<blockquote>${inner}</blockquote>`;
      }
    };
  }
}
