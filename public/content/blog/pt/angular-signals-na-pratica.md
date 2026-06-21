Você troca um valor no código. Confere. Confere de novo. A tela continua mostrando o número velho, te encarando.

Já passou por isso? Eu já, várias vezes. E tem uma coisa sobre mim que explica este texto: eu não consigo só dar um jeito e seguir. Preciso entender de onde vem o problema. É herança da época de laboratório, acho. Vejo uma engrenagem nova e quero abrir pra ver como gira.

Foi essa curiosidade que me jogou fundo nos Signals do Angular. Testei no ERP que construo no trabalho, li a documentação oficial, fiz uns experimentos só pra ver no que dava. O que vem aqui é o resumo do que entendi, focado no que pega de verdade: quando e como usar.

## De onde vinha aquele bug da tela

Esse tipo de coisa raramente é distração sua. Quase sempre é o framework sem saber **o que** mudou.

Por muito tempo o Angular resolveu isso no braço, com o Zone.js. A ideia era engenhosa. O Zone.js ficava de olho em tudo que pudesse mexer no estado (clique, timer, requisição) e, quando algo acontecia, cutucava o Angular: "olha, pode ter mudado alguma coisa, melhor conferir".

Conferir o quê? Tudo. A árvore inteira de componentes, por garantia. Funciona, mas é desproporcional. É tipo disparar o alarme de incêndio do prédio inteiro porque alguém acendeu o fogão.

Os Signals viram esse jogo do avesso. Em vez de o framework adivinhar, o próprio valor avisa quem depende dele. Aquela informação que faltava agora existe. Parece pouco. Muda quase tudo.

## A imagem que destravou tudo: a planilha

Antes de qualquer código, deixa eu te passar a analogia que fez o conceito grudar na minha cabeça.

Pense numa planilha. Você põe `10` na célula A1 e `5` na A2. Na A3 escreve `=A1+A2`, e aparece `15`. Agora troque o A1 pra `20`. O A3 vira `25` na hora. Você não apertou recalcular. A planilha já sabia que o A3 dependia do A1.

Um Signal é exatamente uma célula dessas. Uma caixinha que guarda um valor e conhece quem depende dele. Mudou, todo mundo que usa aquele valor recebe o aviso. Só quem usa. Mais ninguém.

> Pense em Signal como uma célula de planilha pro seu código. Você descreve as relações uma vez, e o recálculo se vira sozinho, na hora certa.

Com essa imagem na cabeça, o resto é só sintaxe.

## signal(): criar e ler

Uma linha. Você passa o valor inicial:

```ts
import { signal } from '@angular/core';

const contador = signal(0);
```

Pra ler, chame como função:

```ts
console.log(contador()); // 0
```

Esse par de parênteses me intrigou no começo, então fui investigar. Ele não é enfeite. É no exato momento da leitura que o Angular registra "esse trecho aqui depende desse signal". É assim que a planilha monta o mapa de dependências: na hora em que você lê.

## set() e update(): mudar o valor

São dois jeitos, e a diferença é sutil:

```ts
// set(): você já tem o valor novo
contador.set(10);

// update(): o valor novo nasce do atual
contador.update(valor => valor + 1); // virou 11
```

`set` quando você já sabe o resultado. `update` quando precisa do valor anterior pra chegar no próximo: incrementar, inverter um booleano, somar item numa lista. Detalhe mínimo, mas deixa sua intenção legível pra quem abrir o código depois.

## computed(): a parte que eu achei mais elegante

Lembra do `=A1+A2` da célula A3? No Angular, isso é um `computed()`:

```ts
import { signal, computed } from '@angular/core';

const preco = signal(100);
const quantidade = signal(2);

const total = computed(() => preco() * quantidade());

console.log(total()); // 200
quantidade.set(3);
console.log(total()); // 300
```

Olha que interessante: eu nunca atualizo o `total`. Ele se vira sozinho. Por quê? Porque, ao ler `preco()` e `quantidade()` lá dentro, ele anota que depende dos dois. Mudou um deles, o total fica "sujo" e recalcula na próxima leitura.

Quando fui atrás do porquê de ser tão eficiente, achei dois detalhes que mudam o jogo no dia a dia:

- Ele é preguiçoso. Só calcula quando alguém lê. Ninguém usando `total()` agora? Ele nem se mexe.
- Ele é memoizado. Se a dependência não mudou, devolve o último resultado sem refazer a conta.

O efeito prático disso é libertador. Crie quantos `computed()` quiser pra descrever estado derivado. Aquilo que antes eu sincronizava na mão (e às vezes esquecia de sincronizar, que era onde nascia metade dos meus bugs) virou uma relação que eu só declaro. Uma vez.

## effect(): a primeira coisa que eu quis entender direito

`signal` e `computed` cuidam de dado que vira outro dado. Mas e quando você precisa reagir fazendo algo fora desse mundo? Gravar no `localStorage`, mandar um log, atualizar um gráfico de uma biblioteca externa. É pra isso que existe o `effect()`:

```ts
import { signal, effect } from '@angular/core';

const tema = signal<'claro' | 'escuro'>('escuro');

effect(() => {
  document.body.dataset['theme'] = tema();
});
```

Roda uma vez ao nascer e depois toda vez que algum signal lido lá dentro mudar. As dependências ele rastreia sozinho, sem você declarar lista nenhuma.

Quando comecei a estudar isso, a pergunta que mais me ajudou não foi "como uso effect", e sim "quando NÃO usar". A resposta vale ouro:

> [!WARNING]
> Não use `effect()` pra calcular estado derivado. Se a frase é "quando A mudar, atualiza o B", o que você quer é um `computed()`. Quase sempre.

`effect()` é pra efeito colateral, pra falar com o mundo de fora. Usar ele pra manter um valor em sincronia com outro é o atalho mais curto pros loops estranhos e pros bugs difíceis de rastrear. Por isso trato como último recurso, nunca como primeiro.

## E no template?

Mesma lógica de antes. Você chama o signal, e o Angular atualiza só os pedaços da tela que dependem daquele valor:

```html
<button (click)="contador.update(v => v + 1)">
  Cliquei {{ contador() }} vezes
</button>

@if (total() > 250) {
  <p>Frete grátis! 🎉</p>
}
```

Com o control flow novo (`@if`, `@for`, `@switch`), a tela reage com precisão de bisturi. Mudou o `contador`? O Angular não reavalia a página toda. Mexe naquele texto, e para por aí.

## Até a fronteira do componente virou signal

Quanto mais eu cavava, mais via que a ideia tinha se espalhado pelo framework inteiro. Hoje até a comunicação entre componentes é signal. No lugar do `@Input()`, você declara a entrada assim:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class CardUsuario {
  nome = input.required<string>();
  favorito = model(false); // mão dupla, no lugar de @Input + @Output
}
```

E aí `nome()` é um signal como outro qualquer. Dá pra usar dentro de `computed()`, reagir num `effect()`, ler no template. A fronteira do componente deixou de ser exceção. Virou tudo o mesmo modelo, de ponta a ponta. Essa virada foi se firmando do Angular 17 pra cá.

## Por que vale a pena aprender isso agora

Juntando tudo, o quadro grande aparece:

1. Detecção de mudança cirúrgica. Cada signal sabe quem depende dele, então o Angular atualiza só o necessário.
2. É o caminho pro *zoneless*. Com os Signals carregando o "o que mudou", o Angular não precisa mais do Zone.js pra adivinhar. App [sem Zone.js](https://angular.dev/guide/zoneless) fica mais leve, e o stack trace fica bem mais limpo quando algo quebra.
3. Aquele bug da tela some. Estado derivado com `computed()` está sempre em dia, por construção.

## O caminho que eu recomendo

Se for levar uma frase só daqui, leve esta: estado é `signal`, o que deriva dele é `computed`, efeito colateral é `effect`. Esses três no lugar certo resolvem a maior parte das dúvidas.

O resto é mão na massa, e é aqui que a ficha cai de verdade. Abra um projeto vazio, crie um contador, ponha um `computed` em cima e fique olhando o negócio se atualizar sozinho. Foi assim que funcionou comigo. Não foi lendo (nem mesmo lendo isto aqui).

Pra ir além, a [documentação oficial de Signals](https://angular.dev/guide/signals) é ótima e tem exemplos que você edita ali na hora. E se o assunto te pegou, no próximo texto pretendo mostrar como conectar Signals com chamada assíncrona sem gambiarra.

Travou em algum ponto, ou tem um caso curioso que te deixou pensando? Me chame no [LinkedIn](https://linkedin.com/in/emilybezerra). Curto demais trocar ideia sobre isso.
