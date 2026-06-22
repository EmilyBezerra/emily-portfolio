Você muda um valor no código. Salva. Olha pra tela. Nada — o número velho continua lá, paradão, te encarando. Salva de novo, só pra ter certeza. Continua lá.

Já passou por isso? Comigo, umas boas vezes. E tem um traço meu que explica esse texto inteiro: eu não consigo só contornar o problema e seguir em frente. Trava aqui. Preciso entender de onde ele veio, senão fica martelando na minha cabeça. Deve ser resquício da época de laboratório — eu vim da química, e lá a mania era a mesma: aparecia um equipamento novo e eu já queria abrir pra ver como funcionava por dentro.

Foi essa teimosia que me empurrou fundo nos Signals do Angular. Fui testando no ERP que mantenho no trabalho, encarei a documentação oficial, montei uns exemplos meio bobos só pra ver o que acontecia. O que vem abaixo é o resumo do que eu consegui entender — escrito pensando em quem ainda tá meio perdido no assunto.

## De onde vinha aquele bug da tela

Boa notícia: nem sempre a culpa é sua. Boa parte das vezes é o framework que simplesmente não faz ideia do **que** mudou.

Durante anos o Angular resolveu isso na marra, com o Zone.js. E olha, a ideia era esperta. O Zone.js monitorava qualquer coisa capaz de mexer no estado — um clique, um `setTimeout`, uma requisição HTTP — e, toda vez que algo disparava, dava aquele toque no Angular: "ó, talvez tenha mudado alguma coisa aí, melhor conferir".

Conferir o quê, exatamente? Tudo. A árvore de componentes inteira, por via das dúvidas. Funciona — só é desproporcional. Tipo evacuar o prédio no alarme de incêndio porque alguém deixou o pão torrar tempo demais.

Signal vira essa lógica de cabeça pra baixo. Ninguém fica adivinhando: o próprio valor avisa quem depende dele na hora em que muda. Sacou a diferença? Aquela informação que faltava no esquema antigo agora existe, explícita. Parece detalhe pequeno. Não é. É o que muda todo o resto.

## A imagem que destravou tudo: a planilha

Antes de cair no código, deixa eu te dar a analogia que fez a ficha cair pra mim.

Abre uma planilha na cabeça. Excel, Google Sheets, tanto faz. Põe `10` na célula A1, `5` na A2. Na A3 você escreve `=A1+A2` e aparece `15`, beleza. Agora muda o A1 pra `20`. O A3 vira `25` sozinho, na hora, sem você apertar nada. Ninguém mandou recalcular. A planilha já sabia, desde sempre, que o A3 bebia do A1.

Um Signal é basicamente uma dessas células, só que dentro do seu código. Uma caixinha que guarda um valor e sabe exatamente quem está de olho nela. Mudou o valor? Quem depende dele é avisado. E aqui mora o detalhe que importa: só quem depende de verdade. O resto do app nem fica sabendo.

> Signal é a célula de planilha do seu código. Você descreve as relações uma vez e larga. O recálculo se vira sozinho, na hora exata.

Guardou essa imagem? Então o resto é só sintaxe.

## signal(): criar e ler

Uma linha. Passa o valor inicial e pronto:

```ts
import { signal } from '@angular/core';

const contador = signal(0);
```

Pra ler, você chama igual função:

```ts
console.log(contador()); // 0
```

Esse parzinho de parênteses me incomodou no começo — parecia firula. Fui atrás e não é. É no instante exato da leitura que o Angular anota: "opa, esse pedaço de código aqui depende desse signal". É assim que a tal planilha desenha o mapa de dependências. No momento em que você lê, não antes.

## set() e update(): mudar o valor

Dois jeitos de mudar, e a diferença é sutil:

```ts
// set(): você já tem o valor novo
contador.set(10);

// update(): o valor novo nasce do atual
contador.update(valor => valor + 1); // virou 11
```

Usa `set` quando você já sabe onde quer chegar. Usa `update` quando precisa do valor de antes pra calcular o de agora — incrementar um contador, inverter um booleano, empurrar um item numa lista. É firula? Quase. Mas deixa sua intenção na cara pra próxima pessoa que abrir esse arquivo, que muitas vezes é você mesma, três meses depois.

E aqui vai a pegadinha que me roubou uma tarde inteira da vida. O signal compara o valor novo com o antigo por referência — `Object.is`, pra ser exata. Aí você guarda um array num signal e faz `lista.update(l => { l.push(item); return l; })` achando que está tudo certo. A tela não se mexe. Faz sentido, se parar pra pensar: é o mesmo array de antes, mesma referência, então pro Angular nada mudou. O certo é devolver um array novo: `lista.update(l => [...l, item])`. Lendo assim, no friozinho do texto, parece óbvio. No meio do código real, com mais umas dez coisas acontecendo ao redor, eu passei um tempão procurando o bug no lugar errado.

## computed(): a parte que eu achei mais elegante

Lembra do `=A1+A2` lá na célula A3? No Angular, isso tem nome: `computed()`.

```ts
import { signal, computed } from '@angular/core';

const preco = signal(100);
const quantidade = signal(2);

const total = computed(() => preco() * quantidade());

console.log(total()); // 200
quantidade.set(3);
console.log(total()); // 300
```

Repara numa coisa: eu nunca, em momento nenhum, atualizo o `total` na mão. Ele se vira. Por quê? Porque, na hora de ler `preco()` e `quantidade()` ali dentro, ele já anota que depende dos dois. Mexeu num deles, o total se marca como "sujo" (dirty, no jargão) e recalcula na próxima vez que alguém pedir o valor.

Fui cavar por que isso é tão eficiente e esbarrei em dois detalhes que mudam o dia a dia:

- É preguiçoso (lazy). Só faz a conta quando alguém lê. Se ninguém está usando `total()` neste instante, ele nem levanta da cadeira.
- É memoizado. Se as dependências não mudaram desde a última leitura, ele devolve o resultado guardado e não refaz conta nenhuma.

Na prática, isso é um alívio enorme. Pode criar quantos `computed()` quiser pra descrever estado derivado, sem peso na consciência. Aquilo que eu antes sincronizava no braço — e, sejamos honestas, às vezes esquecia de sincronizar, que era de onde saía metade dos meus bugs — virou uma relação que eu declaro uma vez e nunca mais penso a respeito.

## effect(): a primeira coisa que eu quis entender direito

`signal` e `computed` cuidam de dado virando outro dado, dentro da sua bolha reativa. Mas e quando você precisa reagir fazendo algo lá fora, no mundo de verdade? Salvar no `localStorage`, cuspir um log, atualizar um gráfico de alguma biblioteca externa que nem sabe o que é signal. Pra isso existe o `effect()`:

```ts
import { signal, effect } from '@angular/core';

const tema = signal<'claro' | 'escuro'>('escuro');

effect(() => {
  document.body.dataset['theme'] = tema();
});
```

Ele roda uma vez assim que nasce e, depois, toda vez que algum signal lido lá dentro mudar. E você não declara lista de dependência nenhuma — ele rastreia isso sozinho, do mesmo jeito que o `computed` faz.

Quando eu estava estudando isso, a pergunta que mais rendeu não foi "como eu uso o effect". Foi "quando é que eu NÃO devo usar". A resposta me poupou de muita dor de cabeça lá na frente:

> [!WARNING]
> Não use `effect()` pra calcular estado derivado. Se a frase na sua cabeça é "quando o A mudar, eu atualizo o B", o que você quer é um `computed()`. Quase sempre é isso.

`effect()` é pra efeito colateral, pra conversar com o mundo de fora. Sair usando ele pra manter um valor em sincronia com outro é o caminho mais curto pros loops esquisitos e pros bugs daqueles de ficar arrancando cabelo. Por isso, na minha cabeça, ele é sempre último recurso. Nunca o primeiro que eu saco do bolso.

## E no template?

Mesma lógica de sempre. Você chama o signal e o Angular atualiza só os pedacinhos da tela que dependem daquele valor:

```html
<button (click)="contador.update(v => v + 1)">
  Cliquei {{ contador() }} vezes
</button>

@if (total() > 250) {
  <p>Frete grátis! 🎉</p>
}
```

Com o control flow novo (`@if`, `@for`, `@switch`), a tela reage só no ponto que mudou. Clicou e o `contador` subiu? Com signals, o Angular não sai reavaliando a página inteira atrás do que mudou. Ele troca aquele texto ali e para. Fim.

## Até a fronteira do componente virou signal

Quanto mais eu cavava, mais percebia que essa ideia tinha se alastrado pelo framework todo. Hoje até a conversa entre componentes virou signal. No lugar do velho `@Input()`, a entrada se declara assim:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class CardUsuario {
  nome = input.required<string>();
  favorito = model(false); // mão dupla, no lugar de @Input + @Output
}
```

E aí o `nome()` é um signal igualzinho aos outros. Dá pra jogar dentro de um `computed()`, reagir a ele num `effect()`, ler no template, o que você quiser. A borda do componente, que antes era um capítulo à parte, deixou de ser exceção. Virou tudo o mesmo modelo, de ponta a ponta. Essa virada foi engrenando do Angular 17 pra cá.

## Por que vale a pena aprender isso agora

Junta tudo e o desenho aparece:

1. Detecção de mudança cirúrgica. Cada signal sabe quem depende dele, então o Angular mexe só no que precisa — nada de varrer a árvore toda no chute.
2. É a estrada pro *zoneless*. Com os Signals já carregando a informação de "o que mudou", o Angular para de depender do Zone.js pra adivinhar. Um app [sem Zone.js](https://angular.dev/guide/zoneless) fica mais leve e, de quebra, o stack trace fica bem mais limpo quando algo explode — quem já debugou um erro enterrado no meio do Zone.js sabe a diferença.
3. Aquele bug chato da tela fica muito mais raro. Estado derivado com `computed()` está sempre em dia. Não por sorte: por construção.

## O caminho que eu recomendo

Se for levar uma frase só embora, leve essa: estado é `signal`, o que deriva do estado é `computed`, efeito colateral é `effect`. Esses três no lugar certo já resolvem a esmagadora maioria das suas dúvidas.

O resto é mão na massa — e é aqui que a ficha cai pra valer. Abre um projeto do zero, faz um contador besta, joga um `computed` em cima e fica olhando o troço se atualizar sozinho. Brinca, quebra, conserta. Foi assim que pegou pra mim. Não foi lendo (nem mesmo lendo isto aqui).

Pra ir mais fundo, a [documentação oficial de Signals](https://angular.dev/guide/signals) é muito boa e tem exemplos que você edita ali mesmo, na hora.

Empacou em algum ponto, ou tem um caso esquisito que te deixou com a pulga atrás da orelha? Me chama no [LinkedIn](https://linkedin.com/in/emilybezerra). Curto demais trocar ideia sobre esse tipo de coisa.
