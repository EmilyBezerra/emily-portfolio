import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  LucideDynamicIcon,
  LucideFlaskConical,
  LucideLeaf,
  LucideTestTube,
  LucideCode2,
  LucideGraduationCap,
  LucideRocket,
  LucideBrain,
  LucideTarget,
  LucideSparkles,
  LucideCoffee,
  type LucideIconData,
} from '@lucide/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RevealService } from '../../shared/reveal.service';
import type { Badge, JourneyStep } from '../../shared/types';

interface JourneyTranslation {
  year: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon, TranslateModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly reveal = inject(RevealService);
  private readonly destroyRef = inject(DestroyRef);

  readonly BrainIcon = LucideBrain.icon;
  readonly TargetIcon = LucideTarget.icon;
  readonly SparklesIcon = LucideSparkles.icon;
  readonly CoffeeIcon = LucideCoffee.icon;

  private readonly journeyIcons: LucideIconData[] = [
    LucideRocket.icon,
    LucideGraduationCap.icon,
    LucideCode2.icon,
    LucideTestTube.icon,
    LucideLeaf.icon,
    LucideFlaskConical.icon,
  ];

  private readonly journeyColors = [
    '#a5b4fc',
    '#c4b5fd',
    '#a5b4fc',
    '#fde68a',
    '#a7f3d0',
    '#86efac',
  ];

  private readonly badgeIcons: LucideIconData[] = [
    LucideBrain.icon,
    LucideTarget.icon,
    LucideSparkles.icon,
    LucideCoffee.icon,
  ];

  journey: JourneyStep[] = [];
  badges: Badge[] = [];

  private mutationObserver?: MutationObserver;

  ngOnInit() {
    this.translate.stream('about.journey')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items: JourneyTranslation[]) => {
        if (Array.isArray(items)) {
          this.journey = items.map((item, i) => ({
            ...item,
            icon: this.journeyIcons[i] ?? LucideRocket.icon,
            color: this.journeyColors[i] ?? '#a5b4fc',
          }));
        }
      });

    this.translate.stream('about.badges')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items: string[]) => {
        if (Array.isArray(items)) {
          this.badges = items.map((label, i) => ({
            label,
            icon: this.badgeIcons[i] ?? LucideSparkles.icon,
          }));
        }
      });

    this.mutationObserver = this.reveal.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }
}
