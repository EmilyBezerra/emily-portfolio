import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
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
    this.translate.use(lang.code);
    this.open.set(false);
  }

  toggle() {
    this.open.update(v => !v);
  }
}
