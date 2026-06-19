import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { TranslateModule } from '@ngx-translate/core';
import { LangSwitcher } from '../lang-switcher/lang-switcher';
import { scrollToAnchor } from '../../shared/scroll.util';
import type { NavLink } from '../../shared/types';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MagneticDirective, TranslateModule, LangSwitcher],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly scrolled = signal(false);
  readonly mobileOpen = signal(false);

  readonly navLinks: NavLink[] = [
    { key: 'nav.about',      href: '#about' },
    { key: 'nav.experience', href: '#experience' },
    { key: 'nav.stack',      href: '#skills' },
    { key: 'nav.services',   href: '#services' },
    { key: 'nav.contact',    href: '#contact' },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 40);
  }

  // Âncoras apontam para seções da home. Se já estamos na home, faz scroll suave;
  // caso contrário (ex.: numa página de artigo), navega para a home com o fragmento.
  scroll(e: Event, href: string) {
    e.preventDefault();
    this.mobileOpen.set(false);
    const fragment = href.replace('#', '');
    if (this.onHome()) {
      scrollToAnchor(href);
    } else {
      this.router.navigate(['/'], { fragment });
    }
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.mobileOpen()) this.mobileOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (this.mobileOpen() && !this.el.nativeElement.contains(e.target as Node)) {
      this.mobileOpen.set(false);
    }
  }

  private onHome(): boolean {
    return this.router.url.split('#')[0].split('?')[0] === '/';
  }
}
