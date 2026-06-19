import { Component, HostListener, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private rafId: number | null = null;
  private pendingCursorX = 0;
  private pendingCursorY = 0;

  ngOnInit() {
    this.translate.use('pt');
    if (this.isBrowser) {
      this.updateScrollProgress();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.pendingCursorX = e.clientX;
    this.pendingCursorY = e.clientY;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--cursor-x', `${this.pendingCursorX}px`);
        document.documentElement.style.setProperty('--cursor-y', `${this.pendingCursorY}px`);
        this.updateCardSpotlight(e);
        this.rafId = null;
      });
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.updateScrollProgress();
  }

  private updateScrollProgress() {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    doc.style.setProperty('--scroll-progress', `${progress}%`);
  }

  private updateCardSpotlight(e: MouseEvent) {
    const target = (e.target as HTMLElement | null)?.closest('.glass-hover') as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    target.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }
}
