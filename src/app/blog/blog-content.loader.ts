import { InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { ArticleLang } from './blog.types';

// Carrega o corpo Markdown de um artigo. Tem duas implementações que espelham
// o padrão já usado para as traduções (FileSystemTranslateLoader):
//  - browser → HttpClient
//  - servidor (SSG/prerender) → leitura do filesystem (ver app.config.server.ts)
export interface BlogContentLoader {
  load(lang: ArticleLang, slug: string): Observable<string>;
}

export const BLOG_CONTENT_LOADER = new InjectionToken<BlogContentLoader>('BLOG_CONTENT_LOADER');

export class BrowserBlogContentLoader implements BlogContentLoader {
  private readonly http = inject(HttpClient);

  load(lang: ArticleLang, slug: string): Observable<string> {
    return this.http
      .get(`/content/blog/${lang}/${slug}.md`, { responseType: 'text' })
      .pipe(catchError(() => of('')));
  }
}
