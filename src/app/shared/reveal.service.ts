import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class RevealService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly intersectionObserver: IntersectionObserver | null = this.createObserver();

  observe(container: HTMLElement): MutationObserver | undefined {
    if (!this.intersectionObserver) return undefined;
    this.scanAndWatch(container);
    const mutationObserver = new MutationObserver(() => this.scanAndWatch(container));
    mutationObserver.observe(container, { childList: true, subtree: true });
    return mutationObserver;
  }

  private createObserver(): IntersectionObserver | null {
    if (!this.isBrowser) return null;
    return new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add('visible');
        this.intersectionObserver?.unobserve(entry.target);
      }),
      { threshold: 0.08 }
    );
  }

  private scanAndWatch(container: HTMLElement): void {
    const observer = this.intersectionObserver;
    if (!observer) return;
    container.querySelectorAll<HTMLElement>('.reveal:not(.visible)').forEach(el => observer.observe(el));
  }
}
