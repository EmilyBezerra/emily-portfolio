import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RevealService } from '../../shared/reveal.service';
import type { Job } from '../../shared/types';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss'
})
export class Experience implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly reveal = inject(RevealService);
  private readonly destroyRef = inject(DestroyRef);

  jobs: Job[] = [];
  private mutationObserver?: MutationObserver;

  ngOnInit() {
    this.translate.stream('experience.jobs')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((jobs: Job[]) => {
        if (Array.isArray(jobs)) {
          this.jobs = jobs.map((job, i) => ({ ...job, current: i === 0 }));
        }
      });

    this.mutationObserver = this.reveal.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }
}
