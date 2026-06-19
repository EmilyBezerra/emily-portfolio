import { Component, ElementRef, HostListener, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BlogService } from '../../blog/blog.service';
import type { Lang } from '../../shared/types';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang-switcher.html',
  styleUrl: './lang-switcher.scss'
})
export class LangSwitcher {
  readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly blog = inject(BlogService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly langs: Lang[] = [
    { code: 'pt', flag: 'br', label: 'PT' },
    { code: 'en', flag: 'us', label: 'EN' },
    { code: 'es', flag: 'es', label: 'ES' },
  ];

  readonly open = signal(false);

  get current(): Lang {
    return this.langs.find(l => l.code === this.translate.currentLang) ?? this.langs[0];
  }

  select(lang: Lang) {
    this.open.set(false);
    if (this.isBrowser) localStorage.setItem('lang', lang.code);

    // Numa página de artigo, troca para a URL da versão naquele idioma (o
    // BlogArticle aplica translate.use e o lang do documento ao carregar).
    const slug = this.currentArticleSlug();
    if (slug) {
      const post = this.blog.getBySlug(slug);
      const sibling = post && this.blog.getAlternates(post.group).find(p => p.lang === lang.code);
      if (sibling) {
        this.router.navigate(['/blog', sibling.slug]);
        return;
      }
    }

    this.translate.use(lang.code);
    if (this.isBrowser) {
      document.documentElement.lang = lang.code === 'pt' ? 'pt-BR' : lang.code;
    }
  }

  private currentArticleSlug(): string | null {
    const match = this.router.url.split('?')[0].split('#')[0].match(/^\/blog\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  toggle() {
    this.open.update(v => !v);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open()) this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (this.open() && !this.el.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }
}
