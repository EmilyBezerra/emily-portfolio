import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/ssr';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { appConfig } from './app.config';

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

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: TranslateLoader, useClass: FileSystemTranslateLoader },
  ]
};

export const AppServerConfig = mergeApplicationConfig(appConfig, serverConfig);
