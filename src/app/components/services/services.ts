import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  LucideDynamicIcon,
  LucideRocket,
  LucideServer,
  LucideLayoutDashboard,
  LucideNetwork,
  LucidePalette,
  LucidePlug,
  type LucideIconData,
} from '@lucide/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RevealService } from '../../shared/reveal.service';
import type { ServiceItem } from '../../shared/types';

interface ServiceTranslation {
  title: string;
  desc: string;
  tags: string[];
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon, TranslateModule],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class Services implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly reveal = inject(RevealService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly staticIcons: LucideIconData[] = [
    LucideServer.icon,
    LucideNetwork.icon,
    LucideLayoutDashboard.icon,
    LucidePalette.icon,
    LucideRocket.icon,
    LucidePlug.icon,
  ];

  services: ServiceItem[] = [];
  private mutationObserver?: MutationObserver;

  ngOnInit() {
    this.translate.stream('services.items')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items: ServiceTranslation[]) => {
        if (Array.isArray(items)) {
          this.services = items.map((item, i) => ({
            ...item,
            highlight: i === 0,
            icon: this.staticIcons[i] ?? LucideServer.icon,
          }));
        }
      });

    this.mutationObserver = this.reveal.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }
}
