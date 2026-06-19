import {
  Component, DestroyRef, ElementRef, OnDestroy, OnInit, PLATFORM_ID,
  TransferState, makeStateKey, inject, signal
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BlogService } from '../blog.service';
import { BLOG_CONTENT_LOADER } from '../blog-content.loader';
import { MarkdownService } from '../markdown.service';
import { SeoService } from '../../shared/seo.service';
import { RevealService } from '../../shared/reveal.service';
import { SITE_URL } from '../../shared/site';
import { prefersReducedMotion } from '../../shared/scroll.util';
import { formatDate } from '../blog.util';
import type { ArticleMeta } from '../blog.types';

const HREFLANG: Record<string, string> = { pt: 'pt-BR', en: 'en', es: 'es' };
const OG_LOCALE: Record<string, string> = { pt: 'pt_BR', en: 'en_US', es: 'es_ES' };

interface TocItem {
  id: string;
  text: string;
}

@Component({
  selector: 'app-blog-article',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './blog-article.html',
  styleUrl: './blog-article.scss',
  providers: [MarkdownService]
})
export class BlogArticle implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blog = inject(BlogService);
  private readonly loader = inject(BLOG_CONTENT_LOADER);
  private readonly markdown = inject(MarkdownService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly translate = inject(TranslateService);
  private readonly seo = inject(SeoService);
  private readonly reveal = inject(RevealService);
  private readonly state = inject(TransferState);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly doc = inject(DOCUMENT);

  readonly post = signal<ArticleMeta | null>(null);
  readonly body = signal<SafeHtml | null>(null);
  readonly toc = signal<TocItem[]>([]);
  readonly activeId = signal<string>('');

  private revealObserver?: MutationObserver;
  private tocObserver?: IntersectionObserver;

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const post = this.blog.getBySlug(params.get('slug') ?? '');
          if (!post) {
            this.router.navigate(['/blog']);
            return of(null);
          }
          // Carrega o Markdown e só então as traduções, para que os rótulos
          // (botão copiar, breadcrumb) saiam no idioma do artigo.
          return this.loadBody(post).pipe(
            switchMap(({ md }) => this.translate.use(post.lang).pipe(map(() => ({ post, md }))))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        if (result) this.render(result.post, result.md);
      });

    this.revealObserver = this.reveal.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.revealObserver?.disconnect();
    this.tocObserver?.disconnect();
  }

  fmtDate(iso: string, lang: string): string {
    return formatDate(iso, lang);
  }

  // Cliques no conteúdo: âncora "#" do título (copia link da seção) e botão
  // copiar dos blocos de código — via delegação no container.
  onProseClick(e: Event) {
    if (!this.isBrowser) return;
    const target = e.target as HTMLElement;

    const anchor = target.closest('.heading-anchor') as HTMLElement | null;
    if (anchor) {
      // Com <base href="/">, um link #id iria para a home. Rolamos por JS.
      e.preventDefault();
      const id = anchor.getAttribute('href')?.slice(1) ?? '';
      const slug = this.post()?.slug ?? '';
      this.el.nativeElement.querySelector(`[id="${id}"]`)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `/blog/${slug}#${id}`);
      navigator.clipboard?.writeText(`${SITE_URL}/blog/${slug}#${id}`);
      anchor.classList.add('copied');
      setTimeout(() => anchor.classList.remove('copied'), 1500);
      return;
    }

    const btn = target.closest('.code-block__copy') as HTMLElement | null;
    if (!btn) return;
    const code = btn.closest('.code-block')?.querySelector('pre code')?.textContent ?? '';
    navigator.clipboard?.writeText(code).then(() => {
      btn.classList.add('is-copied');
      setTimeout(() => btn.classList.remove('is-copied'), 1800);
    });
  }

  shareLink(network: 'linkedin' | 'whatsapp'): string {
    const post = this.post();
    if (!post) return '#';
    const url = encodeURIComponent(`${SITE_URL}/blog/${post.slug}`);
    const text = encodeURIComponent(post.title);
    const map = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`
    };
    return map[network];
  }

  copyLink(e: Event) {
    const post = this.post();
    if (!post || !this.isBrowser) return;
    navigator.clipboard?.writeText(`${SITE_URL}/blog/${post.slug}`).then(() => {
      const btn = e.currentTarget as HTMLElement;
      btn.classList.add('is-copied');
      setTimeout(() => btn.classList.remove('is-copied'), 1800);
    });
  }

  scrollToHeading(e: Event, id: string) {
    e.preventDefault();
    this.el.nativeElement.querySelector(`[id="${id}"]`)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    this.activeId.set(id);
  }

  private loadBody(post: ArticleMeta) {
    const key = makeStateKey<string>(`blog:${post.lang}:${post.slug}`);
    if (this.isBrowser && this.state.hasKey(key)) {
      const md = this.state.get(key, '');
      this.state.remove(key);
      return of({ post, md });
    }
    return this.loader.load(post.lang, post.slug).pipe(
      map(md => {
        if (!this.isBrowser) this.state.set(key, md);
        return { post, md };
      })
    );
  }

  private render(post: ArticleMeta, md: string) {
    this.post.set(post);
    const labels = {
      copy: this.translate.instant('blog.copy'),
      copied: this.translate.instant('blog.copied'),
      sectionLink: this.translate.instant('blog.section_link')
    };
    this.body.set(this.sanitizer.bypassSecurityTrustHtml(this.markdown.render(md, labels)));

    // Fora do guard de browser: roda também no prerender (SSG), garantindo
    // <html lang> correto no HTML estático de cada idioma.
    this.doc.documentElement.lang = post.lang === 'pt' ? 'pt-BR' : post.lang;

    if (this.isBrowser) {
      const fragment = this.route.snapshot.fragment;
      window.scrollTo({ top: 0, behavior: 'auto' });
      setTimeout(() => {
        this.buildToc();
        // Deep-link para uma seção (/blog/slug#id): rola até o título depois
        // que o corpo do markdown foi injetado no DOM.
        if (fragment) {
          const target = this.el.nativeElement.querySelector(`[id="${fragment}"]`) as HTMLElement | null;
          if (target) {
            target.scrollIntoView({ behavior: 'auto', block: 'start' });
            this.activeId.set(fragment);
          }
        }
      }, 0);
    }
    this.applySeo(post);
  }

  // Constrói o índice a partir dos títulos renderizados + scrollspy (browser).
  private buildToc() {
    const root = this.el.nativeElement as HTMLElement;
    const headings = Array.from(root.querySelectorAll('.article-prose h2[id]')) as HTMLElement[];
    this.toc.set(headings.map(h => {
      const clone = h.cloneNode(true) as HTMLElement;
      clone.querySelector('.heading-anchor')?.remove();
      return { id: h.id, text: (clone.textContent ?? '').trim() };
    }));

    this.tocObserver?.disconnect();
    if (!('IntersectionObserver' in window) || !headings.length) return;
    this.tocObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.activeId.set((entry.target as HTMLElement).id);
        }
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 }
    );
    headings.forEach(h => this.tocObserver!.observe(h));
  }

  private applySeo(post: ArticleMeta) {
    const url = `${SITE_URL}/blog/${post.slug}`;
    const siblings = this.blog.getAlternates(post.group);
    const alternates = siblings.map(a => ({
      hreflang: HREFLANG[a.lang] ?? a.lang,
      href: `${SITE_URL}/blog/${a.slug}`
    }));
    const ptVersion = siblings.find(a => a.lang === 'pt');
    if (ptVersion) {
      alternates.push({ hreflang: 'x-default', href: `${SITE_URL}/blog/${ptVersion.slug}` });
    }

    this.seo.apply({
      title: `${post.title} · Emily Bezerra`,
      description: post.description,
      url,
      type: 'article',
      image: `${SITE_URL}${post.cover}`,
      imageAlt: post.coverAlt,
      locale: OG_LOCALE[post.lang] ?? 'pt_BR',
      alternates,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      author: 'Emily de Jesus Bezerra',
      tags: post.tags,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          '@id': `${url}#article`,
          mainEntityOfPage: url,
          url,
          headline: post.title,
          description: post.description,
          inLanguage: HREFLANG[post.lang] ?? post.lang,
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          articleSection: post.category,
          keywords: post.tags.join(', '),
          image: `${SITE_URL}${post.cover}`,
          author: { '@type': 'Person', '@id': `${SITE_URL}/#emily`, name: 'Emily de Jesus Bezerra', url: SITE_URL },
          publisher: { '@id': `${SITE_URL}/#emily` }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: this.translate.instant('blog.home'), item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: this.translate.instant('nav.blog'), item: `${SITE_URL}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: url }
          ]
        }
      ]
    });
  }
}
