import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BlogService } from '../blog.service';
import { SeoService } from '../../shared/seo.service';
import { RevealService } from '../../shared/reveal.service';
import { SITE_URL } from '../../shared/site';
import { formatDate } from '../blog.util';
import type { ArticleMeta } from '../blog.types';

const OG_LOCALE: Record<string, string> = { pt: 'pt_BR', en: 'en_US', es: 'es_ES' };

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss'
})
export class BlogList implements OnInit, OnDestroy {
  private readonly blog = inject(BlogService);
  private readonly translate = inject(TranslateService);
  private readonly seo = inject(SeoService);
  private readonly reveal = inject(RevealService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly posts = signal<ArticleMeta[]>([]);
  private mutationObserver?: MutationObserver;

  ngOnInit() {
    this.refresh(this.translate.currentLang || 'pt');
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(e => this.refresh(e.lang));

    this.mutationObserver = this.reveal.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }

  fmtDate(iso: string, lang: string): string {
    return formatDate(iso, lang);
  }

  private refresh(lang: string) {
    this.posts.set(this.blog.getByLang(lang));
    this.applySeo(lang);
  }

  private applySeo(lang: string) {
    this.translate
      .get(['blog.meta_title', 'blog.meta_desc', 'blog.home', 'nav.blog'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((t: Record<string, string>) => {
        const url = `${SITE_URL}/blog`;
        this.seo.apply({
          title: t['blog.meta_title'],
          description: t['blog.meta_desc'],
          url,
          type: 'website',
          image: `${SITE_URL}/emily.jpg`,
          locale: OG_LOCALE[lang] ?? 'pt_BR',
          alternates: [{ hreflang: 'x-default', href: url }],
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'Blog',
              '@id': `${url}#blog`,
              url,
              name: t['blog.meta_title'],
              description: t['blog.meta_desc'],
              inLanguage: lang,
              author: { '@id': `${SITE_URL}/#emily` },
              blogPost: this.posts().map(p => ({
                '@type': 'BlogPosting',
                headline: p.title,
                url: `${SITE_URL}/blog/${p.slug}`,
                datePublished: p.date
              }))
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: t['blog.home'], item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: t['nav.blog'], item: url }
              ]
            }
          ]
        });
      });
  }
}
