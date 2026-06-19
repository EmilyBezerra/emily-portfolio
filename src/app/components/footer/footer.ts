import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { scrollToAnchor } from '../../shared/scroll.util';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  private readonly router = inject(Router);
  readonly year = new Date().getFullYear();

  // Seções da home: scroll suave se já na home, senão navega com fragmento.
  scroll(href: string) {
    const fragment = href.replace('#', '');
    if (this.router.url.split('#')[0].split('?')[0] === '/') {
      scrollToAnchor(href);
    } else {
      this.router.navigate(['/'], { fragment });
    }
  }
}
