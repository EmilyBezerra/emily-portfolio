Você muda um valor no código. Salva. Olha pra tela. E ainda nada, o número velho continua lá, parado, te encarando. Salva de novo, só pra ter certeza, mas continua lá.

Já passou por isso? Comigo já aconteceu algumas vezes. E tem um traço meu que explica esse texto inteiro: eu não consigo só contornar o problema e seguir em frente. Preciso entender de onde ele veio, senão fica martelando na minha cabeça.

Foi essa teimosia que me fez buscar mais sobre os Signals do Angular. Fui testando no ERP que mantenho no trabalho, encarei a documentação oficial, montei uns exemplos meio bobos em projetos pessoais, só pra ver o que acontecia. O que vem abaixo é o resumo do que eu apreendi, escrito pensando em quem ainda tá meio perdido no assunto.

## De onde vinha aquele bug da tela

Boa notícia: nem sempre a culpa é sua. Boa parte das vezes é o framework que simplesmente não faz ideia do que mudou.

Durante anos o Angular resolveu isso com o Zone.js. A ideia era esperta. O Zone.js monitorava eventos que podiam alterar o estado, um clique, um `setTimeout`, uma requisição HTTP e, toda vez que algo acontecia, avisava o Angular: "ó, talvez tenha mudado alguma coisa aí, melhor conferir". Mas conferir o quê exatamente? Tudo, a árvore de componentes inteira era conferida por via das dúvidas. Funciona, só é desproporcional. Tipo evacuar o prédio no alarme de incêndio porque alguém deixou o pão torrar tempo demais.

Signal vira essa lógica de cabeça pra baixo. Ninguém fica adivinhando: o próprio valor avisa quem depende dele na hora em que muda. Entendeu a diferença? Aquela informação que faltava no esquema antigo agora existe. Parece detalhe pequeno, mas não é, isso é o que muda todo o resto.

## A analogia que destravou tudo: a planilha

Antes de cair no código, deixa eu te dar a analogia que fez sentido pra mim.

Abre uma planilha do Excel, Google Sheets ou apenas imagine essa planilha, tanto faz. Põe `10` na célula A1, `5` na A2. Na A3 você escreve `=A1+A2` e vai aparecer `15`, beleza. Agora muda o A1 pra `20`, automaticamente A3 vira `25`, na hora, sem você apertar nada. Ninguém mandou recalcular. A planilha já sabia, desde sempre, que o A3 dependia do A1 e do A2.

Um Signal é basicamente uma dessas células, só que dentro do seu código. Uma caixinha que guarda um valor e sabe exatamente quem está de olho nela. Mudou o valor? Quem depende dele é avisado no mesmo instante. E aqui mora o detalhe que importa: só quem depende de verdade. O resto do app nem fica sabendo.

> Signal é a célula de planilha do seu código. Você descreve as relações uma vez e o recálculo se vira sozinho, em tempo real.

Entendeu a ideia? Então o resto é só sintaxe.

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

Esse parzinho de parênteses me deixou na dúvida no começo, parecia firula. Fui atrás e não é. É instante exato da leitura que o Angular anota: "opa, esse pedaço de código aqui depende desse signal". É assim que a tal planilha desenha o mapa de dependências. No momento em que você lê, não antes.

## set() e update(): mudar o valor

Existem duas formas de mudar, e a diferença é sutil:

```ts
// set(): você já tem o valor novo
contador.set(10);

// update(): o valor novo nasce do atual
contador.update(valor => valor + 1); // virou 11
```

Deve usar `set` quando você já sabe onde quer chegar. Já o `update` quando precisa do valor anterior para calcular o próximo: incrementar um contador, inverter um booleano ou adicionar um item a uma lista. 

E aqui vai um detalhe importante. Signals não verificam se o conteúdo de um objeto mudou; eles verificam se a referência mudou. Por baixo dos panos, a comparação é feita com `Object.is`.

É aí que muita gente tropeça. Imagine um array armazenado em um signal:

`lista.update(l => { l.push(item); return l; })`

À primeira vista parece correto. O item foi adicionado, afinal. Só que o Angular continua vendo exatamente a mesma referência de array. Como a referência não mudou, o signal entende que não há nada novo para propagar, e a interface permanece igual.

O padrão correto é retornar uma nova referência:

`lista.update(l => [...l, item])`

Agora sim o signal enxerga uma mudança e notifica quem depende daquele estado.

Lendo isso no conforto de um artigo, parece óbvio. No meio de uma aplicação real, com requisições, componentes e vários fluxos de estado acontecendo ao mesmo tempo, é o tipo de detalhe que faz você investigar o lugar errado por muito mais tempo do que gostaria.

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

Repare em uma coisa: em nenhum momento eu atualizo o `total` manualmente. Ele é recalculado sozinho.

O motivo está no sistema de rastreamento de dependências dos signals. Quando o `computed()` executa e lê `preco()` e `quantidade()`, ele registra automaticamente que depende desses dois valores. Se qualquer um deles mudar, o Angular marca o `computed` como *dirty* (desatualizado) e agenda um novo cálculo para a próxima vez que alguém solicitar seu valor.

Quando fui entender por que isso é tão eficiente, encontrei dois detalhes importantes:

- **É lazy (preguiçoso).** O cálculo só acontece quando alguém lê `total()`. Se ninguém precisa daquele valor naquele momento, nenhum processamento é feito.
- **É memoizado.** Se as dependências não mudaram desde a última execução, o Angular reutiliza o resultado armazenado em vez de recalcular tudo novamente.

Na prática, isso muda bastante a forma de modelar estado. Você pode criar vários `computed()` para representar valores derivados sem precisar se preocupar com sincronização manual ou cálculos desnecessários.

Aquilo que antes eu mantinha "na mão" atualizando valores derivados sempre que alguma dependência mudava, passa a ser apenas uma relação declarada. Você descreve uma vez como um valor depende do outro, e o Angular cuida do restante. Além de deixar o código mais simples, isso elimina uma categoria inteira de bugs causada por estados que saem de sincronia.

## effect(): a primeira coisa que eu quis entender direito

`signal` e `computed` resolvem muito bem o problema de transformar estado em mais estado dentro da sua árvore reativa. Mas nem toda reação termina aí.

Às vezes você precisa produzir um efeito colateral (*side effect*): persistir dados no `localStorage`, enviar informações para uma ferramenta de analytics, registrar logs ou sincronizar uma biblioteca externa que não faz ideia do que é um signal. É exatamente para isso que existe o `effect()`:

```ts
import { signal, effect } from '@angular/core';

const tema = signal<'claro' | 'escuro'>('escuro');

effect(() => {
  document.body.dataset['theme'] = tema();
});
```

Ele roda uma vez assim que nasce e, depois, toda vez que algum signal lido lá dentro mudar. E você não declara lista de dependência nenhuma, ele rastreia isso sozinho, do mesmo jeito que o `computed` faz.

Quando eu estava estudando isso, a pergunta que mais rendeu não foi "como eu uso o effect". Foi "quando é que eu NÃO devo usar". A resposta me poupou de muita dor de cabeça lá na frente:

> [!WARNING]
> Não use `effect()` pra calcular estado derivado. Se a frase na sua cabeça é "quando o A mudar, eu atualizo o B", o que você quer é um `computed()`. Quase sempre é isso.

`effect()` é pra efeito colateral, pra conversar com o mundo de fora. Sair usando ele pra manter um valor em sincronia com outro é o caminho mais curto pros loops esquisitos e pros bugs daqueles de ficar arrancando cabelo. Por isso, na minha cabeça, ele é sempre último recurso.

## E no template?

Mesma lógica de sempre. Você chama o signal e o Angular atualiza só os pedacinhos da tela que dependem daquele valor:

```html
<button (click)="contador.update(v => v + 1)">
  Cliquei {{ contador() }} vezes
</button>

@if (total() > 250) {
  <p>Frete grátis!</p>
}
```

Com o control flow novo (`@if`, `@for`, `@switch`), a tela reage só no ponto que mudou. Clicou e o `contador` subiu? Com signals, o Angular não sai reavaliando a página inteira atrás do que mudou. Ele troca aquele texto ali e para.

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

1. Detecção de mudança cirúrgica. Cada signal sabe quem depende dele, então o Angular mexe só no que precisa, não vai varrer a árvore toda, com isso temos ganho de perfomance.
2. É a estrada pro *zoneless*. Com os Signals já carregando a informação de "o que mudou", o Angular para de depender do Zone.js pra adivinhar. Um app [sem Zone.js](https://angular.dev/guide/zoneless) fica mais leve e, de quebra, o stack trace fica bem mais limpo quando algo explode quem já debugou um erro enterrado no meio do Zone.js sabe a diferença.
3. Aquele bug chato da tela fica muito mais raro. Estado derivado com `computed()` está sempre em dia. Não por sorte: por construção.

## O caminho que eu recomendo

Se for pra resumir em uma frase, seria essa: estado é `signal`, o que deriva do estado é `computed`, efeito colateral é `effect`. Esses três no lugar certo já resolvem a maioria das suas dúvidas.

O resto é mão na massa. Abre um projeto do zero, faz um contador simples, joga um `computed` em cima e fica olhando o ele se atualizar sozinho. Brinca, quebra, conserta. Foi assim que ficou intuitivo pra mim, não foi apenas lendo e assistindo tutoriais.

Pra ir mais fundo, a [documentação oficial de Signals](https://angular.dev/guide/signals) é muito boa e tem exemplos que você edita ali mesmo, na hora.
