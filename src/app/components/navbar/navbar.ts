import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MagneticDirective } from '../../shared/magnetic.directive';
import { TranslateModule } from '@ngx-translate/core';
import { LangSwitcher } from '../lang-switcher/lang-switcher';
import { scrollToAnchor } from '../../shared/scroll.util';
import type { NavLink } from '../../shared/types';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MagneticDirective, TranslateModule, LangSwitcher],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
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

  scroll(e: Event, href: string) {
    e.preventDefault();
    this.mobileOpen.set(false);
    scrollToAnchor(href);
  }
}
