Você troca um valor no código. Confere. Confere de novo. A tela continua mostrando o número velho, te encarando.

Já passou por isso? Eu já, várias vezes. E aqui vai uma coisa sobre mim: eu não consigo só dar um jeito e seguir. Preciso entender de onde vem. Sobrou da época em que eu trabalhava em laboratório, acho. Vejo uma engrenagem nova e quero abrir pra ver como gira.

Foi essa curiosidade que me levou fundo nos Signals do Angular. Testei no ERP que eu construo no trabalho, li a documentação oficial, fiz uns experimentos só pra ver o que acontecia. Este texto é o resumo do que eu entendi, com foco no que importa de verdade: quando e como usar.

## De onde vinha aquele bug da tela

Esse tipo de coisa raramente é distração sua. Quase sempre é o framework não sabendo **o que** mudou.

Por muito tempo o Angular resolveu isso na marra, com o Zone.js. A ideia era engenhosa. O Zone.js ficava de olho em tudo que pudesse mexer no estado (clique, timer, requisição) e, quando algo rolava, avisava o Angular: "olha, pode ter mudado alguma coisa, melhor conferir".

Conferir o quê? Tudo. A árvore inteira de componentes, por garantia. Funciona, mas é desproporcional. É tipo disparar o alarme de incêndio do prédio porque alguém acendeu o fogão.

Os Signals invertem isso. Em vez de o framework adivinhar, o próprio valor avisa quem depende dele. Aquela informação que faltava passou a existir. Parece pouco. Muda muita coisa.

## A imagem que destravou tudo: planilha

Antes de qualquer código, deixa eu te dar a analogia que fez o conceito grudar na minha cabeça.

Pensa numa planilha. Você põe `10` na célula A1 e `5` na A2. Na A3 escreve `=A1+A2`, aparece `15`. Agora muda o A1 pra `20`. O A3 vira `25` na hora. Você não apertou recalcular. A planilha sabia que o A3 dependia do A1.

Um Signal é exatamente uma célula dessas. Uma caixinha que guarda um valor e conhece quem depende dele. Mudou, todo mundo que usa aquele valor recebe o aviso. Só quem usa. Mais ninguém.

> Pensa em Signal como célula de planilha pro seu código. Você descreve as relações uma vez, e o recálculo se vira sozinho, na hora certa.

Com essa imagem na cabeça, o resto vira sintaxe.

## signal(): criar e ler

Uma linha. Você passa o valor inicial:

```ts
import { signal } from '@angular/core';

const contador = signal(0);
```

Pra ler, chama como função:

```ts
console.log(contador()); // 0
```

Esse par de parênteses me intrigou no começo, então fui atrás. Ele não é decoração. É no exato momento da leitura que o Angular registra "esse trecho aqui depende desse signal". É assim que a planilha monta o mapa de dependências: na hora em que você lê.

## set() e update(): mudar o valor

Dois jeitos, e a diferença é sutil:

```ts
// set(): você já tem o valor novo
contador.set(10);

// update(): o valor novo nasce do atual
contador.update(valor => valor + 1); // virou 11
```

`set` quando você já sabe o resultado. `update` quando precisa do valor anterior pra chegar no próximo: incrementar, inverter um booleano, adicionar item numa lista. Mínimo detalhe, mas deixa sua intenção legível pra quem abrir o código depois.

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

Olha que interessante: eu nunca atualizo o `total`. Ele se vira. Por quê? Porque, ao ler `preco()` e `quantidade()` lá dentro, ele anota que depende dos dois. Mudou um deles, o total fica "sujo" e recalcula na próxima leitura.

Quando fui investigar o porquê de ser tão eficiente, achei dois detalhes que mudam o jogo no dia a dia:

- Ele é preguiçoso. Só calcula quando alguém lê. Ninguém usando `total()` agora? Ele nem se mexe.
- Ele é memoizado. Dependência não mudou, ele devolve o último resultado sem refazer a conta.

O efeito prático disso é libertador. Pode criar quantos `computed()` quiser pra descrever estado derivado. Aquilo que antes eu sincronizava na mão (e às vezes esquecia de sincronizar, que é onde nascia metade dos meus bugs) virou uma relação que eu só declaro. Uma vez.

## effect(): a primeira coisa que eu quis entender direito

`signal` e `computed` cuidam de dado que vira outro dado. Mas e quando você precisa reagir fazendo algo fora desse mundo? Gravar no `localStorage`, mandar um log, atualizar um gráfico de uma biblioteca externa. Pra isso existe o `effect()`:

```ts
import { signal, effect } from '@angular/core';

const tema = signal<'claro' | 'escuro'>('escuro');

effect(() => {
  document.body.dataset['theme'] = tema();
});
```

Roda uma vez ao nascer e depois sempre que algum signal lido lá dentro mudar. As dependências ele rastreia sozinho, sem você declarar lista.

Quando comecei a estudar isso, a pergunta que mais me ajudou não foi "como uso effect", e sim "quando NÃO usar". A resposta vale ouro:

> [!WARNING]
> Não use `effect()` pra calcular estado derivado. Se a frase é "quando A mudar, atualiza o B", o que você quer é um `computed()`. Quase sempre.

`effect()` é pra efeito colateral, pra falar com o mundo de fora. Usá-lo pra manter um valor em sincronia com outro é o atalho mais curto pros loops estranhos e pros bugs difíceis de rastrear. Por isso eu o trato como último recurso, não como primeiro.

## E no template?

Mesma lógica. Você chama o signal, e o Angular atualiza só os pedaços da tela que dependem daquele valor:

```html
<button (click)="contador.update(v => v + 1)">
  Cliquei {{ contador() }} vezes
</button>

@if (total() > 250) {
  <p>Frete grátis! 🎉</p>
}
```

Com o control flow novo (`@if`, `@for`, `@switch`), a tela reage com precisão de bisturi. Mudou o `contador`, o Angular não reavalia a página toda. Mexe naquele texto, e para por aí.

## Até a fronteira do componente virou signal

Conforme fui me aprofundando, percebi que a ideia se espalhou pelo framework inteiro. Hoje até a comunicação entre componentes é signal. No lugar do `@Input()`, você declara a entrada assim:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class CardUsuario {
  nome = input.required<string>();
  favorito = model(false); // mão dupla, no lugar de @Input + @Output
}
```

E aí `nome()` é um signal como outro qualquer. Dá pra usar dentro de `computed()`, reagir num `effect()`, ler no template. A fronteira do componente deixou de ser exceção. Virou tudo o mesmo modelo, de ponta a ponta. Essa evolução foi se firmando do Angular 17 pra cá.

## Por que vale a pena aprender isso agora

Reunindo o que entendi, o quadro grande aparece:

1. Detecção de mudança cirúrgica. Cada signal sabe quem depende dele, então o Angular atualiza só o necessário.
2. É o caminho pro *zoneless*. Com os Signals carregando o "o que mudou", o Angular não precisa mais do Zone.js pra adivinhar. App [sem Zone.js](https://angular.dev/guide/zoneless) fica mais leve, e o stack trace fica bem mais limpo quando algo quebra.
3. Aquele bug da tela some. Estado derivado com `computed()` está sempre em dia, por construção.

## O caminho que eu recomendo

Se for levar uma frase só daqui, leva esta: estado é `signal`, o que deriva dele é `computed`, efeito colateral é `effect`. Esses três no lugar certo resolvem a maior parte das dúvidas.

O resto é mão na massa, e é aqui que a ficha cai de verdade. Abre um projeto vazio, cria um contador, põe um `computed` em cima, e fica olhando o negócio se atualizar sozinho. Foi assim que entendeu pra mim. Não foi lendo (nem mesmo lendo isto aqui).

Pra ir além, a [documentação oficial de Signals](https://angular.dev/guide/signals) é ótima e tem exemplos que você edita ali na hora. E se o assunto te pegou, no próximo texto eu pretendo mostrar como conectar Signals com chamada assíncrona sem gambiarra.

Travou em algum ponto, ou tem um caso curioso que te deixou pensando? Me chama no [LinkedIn](https://linkedin.com/in/emilybezerra). Curto demais trocar ideia sobre isso.
