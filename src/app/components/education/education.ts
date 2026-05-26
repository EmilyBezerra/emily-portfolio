import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  LucideDynamicIcon,
  LucideGraduationCap,
  LucideCode2,
  LucideFlaskConical,
  LucideLeaf,
  type LucideIconData,
} from '@lucide/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RevealService } from '../../shared/reveal.service';
import type { Course } from '../../shared/types';

interface CourseTranslation {
  period: string;
  degree: string;
  institution: string;
  desc: string;
}

interface CourseStyle {
  color: string;
  icon: LucideIconData;
}

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon, TranslateModule],
  templateUrl: './education.html',
  styleUrl: './education.scss'
})
export class Education implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly reveal = inject(RevealService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly staticCourses: CourseStyle[] = [
    { color: '#a5b4fc', icon: LucideGraduationCap.icon },
    { color: '#a7f3d0', icon: LucideCode2.icon },
    { color: '#a5b4fc', icon: LucideLeaf.icon },
    { color: '#86efac', icon: LucideLeaf.icon },
    { color: '#fde68a', icon: LucideFlaskConical.icon },
  ];

  courses: Course[] = [];
  private mutationObserver?: MutationObserver;

  ngOnInit() {
    this.translate.stream('education.items')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items: CourseTranslation[]) => {
        if (Array.isArray(items)) {
          this.courses = items.map((item, i) => ({
            ...item,
            color: this.staticCourses[i]?.color ?? '#a5b4fc',
            icon: this.staticCourses[i]?.icon ?? LucideGraduationCap.icon,
          }));
        }
      });

    this.mutationObserver = this.reveal.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }
}
