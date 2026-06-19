import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoAlternate {
  hreflang: string;
  href: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  url: string;                  // absoluta — canonical / og:url
  type?: 'website' | 'article';
  image?: string;               // absoluta
  imageAlt?: string;
  locale?: string;              // og:locale, ex.: 'pt_BR'
  alternates?: SeoAlternate[];  // links hreflang
  publishedTime?: string;       // ISO (artigo)
  modifiedTime?: string;        // ISO (artigo)
  author?: string;              // nome do autor (artigo)
  tags?: string[];              // article:tag
  jsonLd?: object[];            // blocos JSON-LD geridos por rota
}

// Atualiza title, meta tags, canonical, hreflang e JSON-LD por rota.
// Manipula o <head> via DOCUMENT, então funciona também no SSG/prerender.
// As tags estáticas do index.html (JSON-LD Person/WebSite) são preservadas;
// só os blocos marcados com data-seo-jsonld são substituídos a cada navegação.
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  apply(cfg: SeoConfig): void {
    const type = cfg.type ?? 'website';

    this.title.setTitle(cfg.title);
    this.meta.updateTag({ name: 'description', content: cfg.description });

    this.meta.updateTag({ property: 'og:title', content: cfg.title });
    this.meta.updateTag({ property: 'og:description', content: cfg.description });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:url', content: cfg.url });
    if (cfg.locale) {
      this.meta.updateTag({ property: 'og:locale', content: cfg.locale });
    }
    if (cfg.image) {
      this.meta.updateTag({ property: 'og:image', content: cfg.image });
      this.meta.updateTag({ name: 'twitter:image', content: cfg.image });
      if (cfg.imageAlt) {
        this.meta.updateTag({ property: 'og:image:alt', content: cfg.imageAlt });
      }
    }

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: cfg.title });
    this.meta.updateTag({ name: 'twitter:description', content: cfg.description });

    this.setOrRemove('property', 'article:published_time', type === 'article' ? cfg.publishedTime : undefined);
    this.setOrRemove('property', 'article:modified_time', type === 'article' ? cfg.modifiedTime : undefined);
    this.setOrRemove('property', 'article:author', type === 'article' ? cfg.author : undefined);

    this.meta.getTags('property="article:tag"').forEach(t => this.meta.removeTagElement(t));
    if (type === 'article' && cfg.tags) {
      cfg.tags.forEach(tag => this.meta.addTag({ property: 'article:tag', content: tag }));
    }

    this.setCanonical(cfg.url);
    this.setAlternates(cfg.alternates ?? []);
    this.setJsonLd(cfg.jsonLd ?? []);
  }

  private setOrRemove(attr: 'name' | 'property', key: string, value?: string): void {
    if (value) {
      this.meta.updateTag(attr === 'property' ? { property: key, content: value } : { name: key, content: value });
    } else {
      this.meta.removeTag(`${attr}="${key}"`);
    }
  }

  private setCanonical(href: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setAlternates(alts: SeoAlternate[]): void {
    this.doc.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    for (const a of alts) {
      const link = this.doc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', a.hreflang);
      link.setAttribute('href', a.href);
      this.doc.head.appendChild(link);
    }
  }

  private setJsonLd(blocks: object[]): void {
    this.doc.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
    for (const block of blocks) {
      const script = this.doc.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo-jsonld', '');
      script.textContent = JSON.stringify(block);
      this.doc.head.appendChild(script);
    }
  }
}
