import { Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

type CodeLanguage = 'csharp' | 'typescript';

interface CodeTab {
  label: string;
  language: CodeLanguage;
  lines: string[];
}

interface Token {
  text: string;
  cls: string;
}

@Component({
  selector: 'app-code-preview',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './code-preview.html',
  styleUrl: './code-preview.scss'
})
export class CodePreview implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer: IntersectionObserver | null = null;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private rotateTimer: ReturnType<typeof setTimeout> | null = null;

  readonly activeTab = signal(0);
  readonly visibleLines = signal<string[]>([]);
  readonly caretLine = signal(0);

  readonly tabs: CodeTab[] = [
    {
      label: 'Developer.cs',
      language: 'csharp',
      lines: [
        'public sealed class Emily : Developer',
        '{',
        '    public string Role     => "Full Stack";',
        '    public string Stack    => ".NET 10 + Angular 21";',
        '    public string Focus    => "ERP SaaS multi-tenant";',
        '    public bool   AlwaysLearning => true;',
        '',
        '    public Task<Product> Ship(Idea idea) =>',
        '        idea.WithCare().WithCraft().Deliver();',
        '}',
      ],
    },
    {
      label: 'portfolio.ts',
      language: 'typescript',
      lines: [
        'export const emily = {',
        '  name: \'Emily Bezerra\',',
        '  role: \'Full Stack Developer\',',
        '  base: \'Santos, SP, Brasil\',',
        '  stack: [\'.NET\', \'Angular\', \'Azure\', \'SQL Server\'],',
        '  loves: [\'arquitetura limpa\', \'UI bem feita\'],',
        '  curious: true,',
        '} satisfies Developer;',
      ],
    },
  ];

  ngOnInit() {
    if (!this.isBrowser) return;
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.typeLines();
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.25 }
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    if (this.typingTimer) clearTimeout(this.typingTimer);
    if (this.rotateTimer) clearTimeout(this.rotateTimer);
  }

  selectTab(idx: number) {
    if (idx === this.activeTab()) return;
    this.activeTab.set(idx);
    this.visibleLines.set([]);
    this.caretLine.set(0);
    if (this.typingTimer) clearTimeout(this.typingTimer);
    if (this.rotateTimer) clearTimeout(this.rotateTimer);
    this.typeLines();
  }

  private typeLines() {
    const lines = this.tabs[this.activeTab()].lines;
    const next: string[] = [];
    let i = 0;

    const tick = () => {
      if (i >= lines.length) {
        this.rotateTimer = setTimeout(() => {
          const nextIdx = (this.activeTab() + 1) % this.tabs.length;
          this.selectTab(nextIdx);
        }, 6500);
        return;
      }
      next.push(lines[i]);
      this.visibleLines.set([...next]);
      this.caretLine.set(i);
      i++;
      this.typingTimer = setTimeout(tick, 90);
    };

    tick();
  }

  tokenize(line: string, language: CodeLanguage): Token[] {
    const kwCs = ['public', 'sealed', 'class', 'string', 'bool', 'true', 'false', 'Task', 'return'];
    const kwTs = ['export', 'const', 'satisfies', 'true', 'false'];
    const kws = language === 'csharp' ? kwCs : kwTs;

    const tokens: Token[] = [];
    const regex = /(".*?"|'.*?'|\/\/.*$|[A-Za-z_][A-Za-z0-9_]*|=>|[{}();,=:]|\s+)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      const tok = match[0];
      let cls = 'tok-plain';
      if (/^\s+$/.test(tok)) cls = 'tok-ws';
      else if (/^["']/.test(tok)) cls = 'tok-string';
      else if (/^\/\//.test(tok)) cls = 'tok-comment';
      else if (kws.includes(tok)) cls = 'tok-kw';
      else if (/^[A-Z]/.test(tok)) cls = 'tok-type';
      else if (/^[{}();,=:]$|=>/.test(tok)) cls = 'tok-punct';
      tokens.push({ text: tok, cls });
    }
    return tokens;
  }
}
