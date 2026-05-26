import { Component, ElementRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideDynamicIcon,
  LucideMail,
  LucideCheckCircle2,
} from '@lucide/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RevealService } from '../../shared/reveal.service';
import { environment } from '../../../environments/environment';
import type { ContactChannel } from '../../shared/types';

interface Web3FormsResponse {
  success: boolean;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FIELD_LIMITS = {
  name: 100,
  email: 254,
  subject: 200,
  message: 2000,
} as const;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideDynamicIcon, TranslateModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly reveal = inject(RevealService);

  readonly SuccessIcon = LucideCheckCircle2.icon;
  readonly MailIcon = LucideMail.icon;
  readonly limits = FIELD_LIMITS;

  name = '';
  email = '';
  subject = '';
  message = '';
  /** Honeypot — visualmente escondido. Se vier preenchido, request é silenciosamente descartado (bot). */
  botcheck = false;
  readonly sent = signal(false);
  readonly sending = signal(false);
  readonly error = signal('');

  readonly contactInfo: ContactChannel[] = [
    { key: 'mail',     label: 'Email',    value: 'emily.bezerra9343@gmail.com',  href: 'mailto:emily.bezerra9343@gmail.com',   iconBg: 'rgba(165,180,252,0.14)', iconColor: '#a5b4fc' },
    { key: 'whatsapp', label: 'WhatsApp', value: '(13) 99194-1321',              href: 'https://wa.me/5513991941321',          iconBg: 'rgba(134,239,172,0.14)', iconColor: '#86efac' },
    { key: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/emilybezerra', href: 'https://linkedin.com/in/emilybezerra', iconBg: 'rgba(253,230,138,0.14)', iconColor: '#fde68a' },
    { key: 'github',   label: 'GitHub',   value: 'github.com/EmilyBezerra',      href: 'https://github.com/EmilyBezerra',      iconBg: 'rgba(255,255,255,0.07)', iconColor: '#b4b3cc' },
  ];

  private mutationObserver?: MutationObserver;

  async onSubmit(e: Event) {
    e.preventDefault();
    if (this.sending()) return;

    const name = this.name.trim();
    const email = this.email.trim();
    const subject = this.subject.trim();
    const message = this.message.trim();

    if (!name || !email || !message) {
      this.error.set('Preencha nome, e-mail e mensagem.');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      this.error.set('E-mail inválido.');
      return;
    }
    if (
      name.length > FIELD_LIMITS.name ||
      email.length > FIELD_LIMITS.email ||
      subject.length > FIELD_LIMITS.subject ||
      message.length > FIELD_LIMITS.message
    ) {
      this.error.set('Um dos campos excede o tamanho permitido.');
      return;
    }

    // Honeypot — bots tendem a preencher TODOS os campos. Humano nunca toca neste.
    if (this.botcheck) {
      this.sent.set(true);
      return;
    }

    this.sending.set(true);
    this.error.set('');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: environment.web3formsKey,
          name,
          email,
          subject: subject || 'Contato via Portfólio — Emily Bezerra',
          message,
          from_name: 'Portfólio Emily Bezerra',
          replyto: email,
          botcheck: this.botcheck,
        }),
      });
      const data: Web3FormsResponse = await res.json();
      if (data.success) {
        this.sent.set(true);
      } else {
        this.error.set('Não foi possível enviar. Tente pelo WhatsApp ou e-mail direto.');
      }
    } catch {
      this.error.set('Erro de conexão. Tente pelo WhatsApp ou e-mail direto.');
    } finally {
      this.sending.set(false);
    }
  }

  ngOnInit() {
    this.mutationObserver = this.reveal.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }
}
