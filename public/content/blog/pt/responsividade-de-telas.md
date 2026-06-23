Já tentou abrir um site no celular e ele veio todo quebrado? Texto saindo pela lateral, botão que some, uma barra de rolagem horizontal que não devia existir. Ou então você dividiu a tela do computador em duas pra acompanhar um tutorial, e o site do lado simplesmente parou de funcionar como deveria.

Acontece com todo mundo. E foi exatamente isso que eu encontrei no meu estágio, em 2024: a maioria das telas não se ajustavam nos aparelhos menores e monitores maiores ela não conseguia se ajustar para usar todo o espaço da tela. Eu não sabia resolver, então fui atrás: li documentação, vasculhei uns fóruns, testei muita coisa, até as telas se comportarem em qualquer tamanho. De lá pra cá virou rotina, toda tela que eu entrego já nasce responsiva. Resolvi juntar aqui o que aprendi, o texto que eu queria ter lido naquela época.

## O que é responsividade, de verdade

Responsividade é o site conseguir se adaptar a qualquer tamanho de tela, do celular aos grandes monitores, sem ficar ruim de usar e sem perder o seu design. O layout se reorganiza sozinho: os elementos mudam de tamanho, as imagens encolhem, as colunas viram linhas. Às vezes você até redesenha um pedaço da tela pra fazer sentido naquele espaço, isso é muito comum quando vamos configurar para o mobile (celulares), as vezes precisamos esconder alguns elementos ou redesenhar ele.

A ideia não é nova, e tem até data de nascimento. Em 2010, o Ethan Marcotte publicou ["Responsive Web Design"](https://alistapart.com/article/responsive-web-design/) na A List Apart e batizou o conceito juntando três peças: grid fluido, imagens flexíveis e media queries. Quinze anos depois, ainda é essa a base.

## O primeiro passo que quase todo mundo esquece: a viewport

Antes de qualquer media query, tem uma linha de HTML que, sem ela, nada funciona direito no celular:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Sem ela, o celular finge que tem a largura de um desktop e encolhe a página inteira, aquele site minúsculo que te obriga a dar zoom pra ler e muitas vezes os botões deixam de funcionar. Com ela, o navegador usa a largura real do aparelho. É o ponto de partida da responsividade, como é explicado na [documentação da MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport). Eu já perdi um tempão caçando um bug que era só essa linha faltando.

## Comece pensando no celular, não no desktop

Um erro que eu cometia: desenhar tudo pensando no monitor grande e depois tentar espremer aquilo no celular. Quase sempre virava retrabalho.

Mas caminho que costuma ser mais tranquilo é o contrário, o que chamam de mobile-first. Você escreve o estilo base pensando na tela pequena e vai somando ajustes (com min-width) conforme a tela cresce, em vez de ficar removendo coisa conforme ela encolhe. De brinde a tela pequena te obriga a decidir logo o que é essencial: não cabe tudo, então você prioriza o que importa.

Só que mobile-first não é uma regra universal, é um bom padrão, mas não pode ser a regra simplementes por ser o caminho mais tranquilo. A pergunta certa não é "mobile ou desktop primeiro?", e sim "onde meus usuários realmente acessam isso?". Site público, landing page, produto pro consumidor final? Quase sempre o acesso é pelo celular. Já ERP, painel administrativo, ferramenta interna cheia de tabela e dado denso, como alguns sistemas que eu desenvolvo, são mais acessado no desktop, e aí faz mais sentido pensar nele primeiro.

Em qualquer um dos casos eu tento não esquecer o outro lado: mesmo desenhando primeiro pro desktop, vale imaginar e testar como aquela tela se comporta se alguém abrir no celular, nem que seja pra garantir que ela funcione e seja fácil de usar.

## Media queries: estilo diferente por tamanho de tela

A ferramenta principal é a `@media`. Ela aplica um bloco de CSS só quando a tela bate uma condição:

```css
/* estilo base: vale pra todo mundo (celular primeiro) */
.container {
  display: flex;
  flex-direction: column;
}

/* de 768px pra cima (tablet e desktop), vira linha */
@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}
```

Traduzindo: por padrão os itens ficam empilhados, um embaixo do outro, que é o ideal no celular. Quando a tela tem 768px ou mais, eles passam a ficar lado a lado.

A diferença entre os dois limites é simples: `min-width` aplica o estilo da largura escolhida **pra cima**; `max-width`, da largura escolhida **pra baixo**. No mobile-first você usa quase sempre `min-width`, somando camadas conforme a tela cresce.

Dá pra combinar condições com `and` pra mirar uma faixa específica:

```css
/* só entre 768px e 1024px (faixa de tablet) */
@media (min-width: 768px) and (max-width: 1024px) {
  .container {
    padding: 20px;
  }
}
```

E o CSS atual já aceita uma sintaxe de intervalo bem mais legível, descrita na [referência da MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using):

```css
@media (768px <= width <= 1024px) {
  .container { padding: 20px; }
}
```

## Breakpoints: não decore números, observe o conteúdo

Tem umas faixas comuns que servem de ponto de partida:

- Celular: até cerca de 600px
- Tablet: cerca de 600px a 1024px
- Desktop: acima de 1024px

Mas o conselho que virou a minha chave (e que tanto a [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) quanto o [web.dev do Google](https://web.dev/articles/responsive-web-design-basics) repetem) é este: o melhor breakpoint não é o tamanho de um aparelho, é o ponto em que o **seu** layout começa a ficar feio. Vá diminuindo a janela do navegador devagar; quando algo quebrar, ali é um breakpoint. Sai aparelho novo com outra resolução todo ano, e você não vai correr atrás de cada um; o seu conteúdo, esse continua o mesmo.

## Antes de encher tudo de media query

Aqui vai o que me poupou metade das media queries: boa parte da responsividade acontece sem nenhuma, se você usar as ferramentas certas.

Troque pixel fixo por unidades relativas (`%`, `rem`, `em`) e, pra tipografia, o `clamp()`, que faz o tamanho variar sozinho dentro de um limite:

```css
h1 {
  font-size: clamp(1.75rem, 5vw, 3rem);
}
```

O título nunca fica menor que `1.75rem` nem maior que `3rem`, e varia suave no meio. Zero media query.

Flexbox e Grid também foram feitos pra layout fluido. Um grid que se reorganiza sozinho:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 1rem;
}
```

Isso encaixa quantas colunas couberem e cai pra uma só no celular, sem você escrever um breakpoint sequer. A própria [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) trata Flexbox, Grid e tipografia fluida como o coração do design responsivo de hoje.

## O 100vh que mente no celular

Essa aqui me consumiu uma tarde antes de eu sacar o que estava acontecendo. Você põe uma seção com `height: 100vh` pra ela ocupar a tela toda, testa no desktop, lindo. Abre no celular e o rodapé fica escondido atrás da barra de endereço do navegador, ou sobra um pedaço quando a barra some na rolagem.

O motivo é meio chato: no mobile, `100vh` conta a altura da tela *sem* a barra do navegador, que aparece e some conforme você rola. A solução mais nova é trocar por `100dvh` (a versão *dinâmica*, que acompanha a barra):

```css
.hero {
  min-height: 100dvh;
}
```

Funciona bem nos navegadores atuais. Demorei pra cair a ficha de que não era erro meu: era o `vh` se comportando exatamente como foi especificado, só que ninguém te avisa disso quando você aprende `vh`.

## A evolução: container queries

A media query olha o tamanho da **tela**. Só que um mesmo componente, um card por exemplo, pode aparecer numa coluna larga ou numa barra lateral estreita na mesma tela. Quem resolve isso é a container query: ela reage ao tamanho do **contêiner**, não da janela.

```css
.lista {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

Agora o card se adapta ao espaço que ele realmente tem, não importa a tela em volta. Já funciona em todos os navegadores atuais e, pra componente reutilizável, mudou meu jeito de pensar layout. Tem tudo na [documentação da MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries).

## Pra fechar

Responsividade não é decorar três breakpoints. É partir do celular, usar unidades relativas, Flexbox e Grid pra deixar o layout fluido, e chamar a media query (ou a container query) só quando o conteúdo pedir. Comece pela meta viewport, vá diminuindo a janela e conserte cada ponto que quebrar.

Pra ir além, dá pra ler a [base da MDN sobre design responsivo](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design), o [guia do web.dev](https://web.dev/articles/responsive-web-design-basics) e, pra entender de onde tudo veio, o [artigo original do Marcotte](https://alistapart.com/article/responsive-web-design/). Se você curte ler a fonte de tudo, a especificação atual está na [W3C](https://www.w3.org/TR/mediaqueries-5/).

