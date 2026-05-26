import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  LucideDynamicIcon,
  LucideSparkles,
  LucideMapPin,
  LucideGraduationCap,
  LucideMail,
  LucideZap,
  LucideLayers,
} from '@lucide/angular';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { scrollToAnchor } from '../../shared/scroll.util';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon, MagneticDirective, TranslateModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly SparklesIcon = LucideSparkles.icon;
  readonly MapPinIcon = LucideMapPin.icon;
  readonly GraduationCapIcon = LucideGraduationCap.icon;
  readonly MailIcon = LucideMail.icon;
  readonly ZapIcon = LucideZap.icon;
  readonly LayersIcon = LucideLayers.icon;

  readonly displayText = signal('');
  tickerItems: string[] = [];

  private phrases: string[] = [];
  private phraseIdx = 0;
  private charIdx = 0;
  private deleting = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.translate.stream('hero.roles')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((roles: string[]) => {
        if (Array.isArray(roles)) {
          this.phrases = roles;
          this.phraseIdx = 0;
          this.charIdx = 0;
          this.deleting = false;
          if (this.timer) clearTimeout(this.timer);
          this.tick();
        }
      });

    this.translate.stream('hero.ticker')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items: string[]) => {
        if (Array.isArray(items)) {
          this.tickerItems = items;
        }
      });
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  scroll(href: string) {
    scrollToAnchor(href);
  }

  private tick() {
    if (!this.phrases.length) return;
    const current = this.phrases[this.phraseIdx];
    if (!this.deleting) {
      this.displayText.set(current.slice(0, this.charIdx + 1));
      this.charIdx++;
      if (this.charIdx === current.length) {
        this.deleting = true;
        this.timer = setTimeout(() => this.tick(), 2200);
        return;
      }
    } else {
      this.displayText.set(current.slice(0, this.charIdx - 1));
      this.charIdx--;
      if (this.charIdx === 0) {
        this.deleting = false;
        this.phraseIdx = (this.phraseIdx + 1) % this.phrases.length;
      }
    }
    this.timer = setTimeout(() => this.tick(), this.deleting ? 55 : 95);
  }
}
