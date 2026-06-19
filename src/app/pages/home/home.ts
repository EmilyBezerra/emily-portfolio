import { Component, OnInit, inject } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { Manifesto } from '../../components/manifesto/manifesto';
import { CodePreview } from '../../components/code-preview/code-preview';
import { About } from '../../components/about/about';
import { Experience } from '../../components/experience/experience';
import { Skills } from '../../components/skills/skills';
import { Services } from '../../components/services/services';
import { Education } from '../../components/education/education';
import { Contact } from '../../components/contact/contact';
import { SeoService } from '../../shared/seo.service';
import { SITE_URL } from '../../shared/site';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero, Manifesto, CodePreview, About, Experience, Skills, Services, Education, Contact],
  templateUrl: './home.html'
})
export class Home implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit() {
    // Reconcilia as meta tags ao voltar para a home via navegação SPA.
    this.seo.apply({
      title: 'Emily de Jesus Bezerra · Portfolio · Desenvolvedora Full Stack .NET + Angular',
      description: 'Portfolio de Emily de Jesus Bezerra (Emily Bezerra), Desenvolvedora Full Stack Plena com foco em .NET, Angular e React. ERP SaaS multi-tenant em produção, arquitetura limpa e interfaces modernas. Santos, SP, Brasil.',
      url: `${SITE_URL}/`,
      type: 'website',
      image: `${SITE_URL}/emily.jpg`,
      imageAlt: 'Emily de Jesus Bezerra — Desenvolvedora Full Stack',
      locale: 'pt_BR',
      alternates: [
        { hreflang: 'pt-BR', href: `${SITE_URL}/` },
        { hreflang: 'x-default', href: `${SITE_URL}/` }
      ]
    });
  }
}
