import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { BLOG_CONTENT_LOADER, BlogContentLoader } from './blog/blog-content.loader';
import type { ArticleLang } from './blog/blog.types';

// Lê os arquivos de tradução do filesystem durante a pré-renderização (SSG)
class FileSystemTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    try {
      const filePath = join(process.cwd(), 'public', 'i18n', `${lang}.json`);
      return of(JSON.parse(readFileSync(filePath, 'utf-8')) as TranslationObject);
    } catch {
      return of({});
    }
  }
}

// Mesma estratégia para o corpo Markdown dos artigos: lê do filesystem no SSG,
// garantindo que o HTML do artigo já saia no prerender (sem fetch HTTP no servidor).
class ServerBlogContentLoader implements BlogContentLoader {
  load(lang: ArticleLang, slug: string): Observable<string> {
    try {
      const filePath = join(process.cwd(), 'public', 'content', 'blog', lang, `${slug}.md`);
      return of(readFileSync(filePath, 'utf-8'));
    } catch {
      return of('');
    }
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: TranslateLoader, useClass: FileSystemTranslateLoader },
    { provide: BLOG_CONTENT_LOADER, useClass: ServerBlogContentLoader },
  ]
};

export const AppServerConfig = mergeApplicationConfig(appConfig, serverConfig);
