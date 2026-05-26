import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  LucideDynamicIcon,
  LucideServer,
  LucidePalette,
  LucideCloud,
  LucideDatabase,
  LucideNetwork,
  LucideWrench,
  type LucideIconData,
} from '@lucide/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RevealService } from '../../shared/reveal.service';
import type { SkillCategory } from '../../shared/types';

interface SkillCategoryTranslation {
  name: string;
  tag?: string;
}

interface SkillCategoryStatic {
  color: string;
  icon: LucideIconData;
  skills: string[];
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon, TranslateModule],
  templateUrl: './skills.html',
  styleUrl: './skills.scss'
})
export class Skills implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly reveal = inject(RevealService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly staticCategories: SkillCategoryStatic[] = [
    {
      color: '#a5b4fc',
      icon: LucideServer.icon,
      skills: ['C#', '.NET 10', '.NET 8', 'ASP.NET Core', 'Minimal APIs', 'Entity Framework Core', 'SignalR', 'Web API REST', 'Python'],
    },
    {
      color: '#a7f3d0',
      icon: LucidePalette.icon,
      skills: ['Angular 21', 'Angular 18+', 'TypeScript', 'JavaScript', 'React', 'PrimeNG', 'Tailwind CSS', 'SCSS', 'HTML5', 'CSS3'],
    },
    {
      color: '#fde68a',
      icon: LucideDatabase.icon,
      skills: ['SQL Server', 'PostgreSQL', 'T-SQL', 'Stored Procedures', 'EF Migrations', 'Multi-tenancy', 'Query Optimization'],
    },
    {
      color: '#86efac',
      icon: LucideCloud.icon,
      skills: ['Azure DevOps', 'App Services', 'Azure Functions', 'Blob Storage', 'SendGrid', 'Docker', 'Docker Compose', 'Git'],
    },
    {
      color: '#a5b4fc',
      icon: LucideNetwork.icon,
      skills: ['Monólito Modular', 'Multi-tenant SaaS', 'Clean Architecture', 'APIs REST', 'SOLID', 'Domain-Driven Design', 'Scrum', 'Kanban'],
    },
    {
      color: '#c4b5fd',
      icon: LucideWrench.icon,
      skills: ['Git', 'GitHub', 'VS Code', 'Visual Studio', 'Postman', 'Swagger', 'ClickUp', 'Microsoft Teams', 'Excel', 'Word', 'Figma'],
    },
  ];

  categories: SkillCategory[] = [];

  readonly marqueeTechs = [
    'C#', '.NET 10', 'Angular 21', 'TypeScript', 'Tailwind CSS', 'SignalR',
    'EF Core', 'SQL Server', 'PostgreSQL', 'Azure', 'Docker', 'PrimeNG',
    'Clean Architecture', 'Multi-tenant SaaS', 'Minimal APIs', 'React',
    'JavaScript', 'Python', 'REST API'
  ];

  private mutationObserver?: MutationObserver;

  ngOnInit() {
    this.translate.stream('skills.categories')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cats: SkillCategoryTranslation[]) => {
        if (Array.isArray(cats)) {
          this.categories = cats.map((cat, i) => ({
            ...this.staticCategories[i],
            name: cat.name,
            tag: cat.tag,
          }));
        }
      });

    this.mutationObserver = this.reveal.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }
}
