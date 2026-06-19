Você já passou por aquele momento em que muda um dado no código, tem certeza de que está tudo certo, mas a tela **simplesmente não atualiza**? Você abre o console, espalha alguns `console.log`, confirma que o valor mudou de verdade... e a interface continua exibindo o número antigo, te encarando.

Esse pequeno drama é, quase sempre, um problema de **reatividade**: como o framework descobre *o que* mudou e *o que* precisa ser redesenhado na tela. E é exatamente esse problema que os **Signals** resolvem, de um jeito tão direto que, depois de entender, é difícil voltar atrás.

Neste artigo eu quero te dar um **modelo mental claro** de Signals: o que são, como `signal()`, `computed()` e `effect()` funcionam juntos, e por que eles mudaram a forma de lidar com estado no Angular. Sem mágica, sem jargão desnecessário, com exemplos que você pode rodar hoje.

## O problema: como o Angular sabe que algo mudou?

Por anos, o Angular dependeu do **Zone.js** para detectar mudanças. A ideia era engenhosa: o Zone.js "envolvia" praticamente tudo que poderia alterar o estado da aplicação (cliques, timers, requisições HTTP) e, sempre que algo desses acontecia, avisava o Angular: *"ei, talvez algo tenha mudado, é melhor verificar"*.

O problema é o "**talvez**". Como o framework não sabia exatamente o que mudou, ele precisava percorrer a árvore de componentes e reavaliar tudo, por garantia. Funciona, mas é trabalho demais para uma informação de menos. É como tocar o alarme de incêndio do prédio inteiro toda vez que alguém acende o fogão.

Signals invertem essa lógica. Em vez de o framework *adivinhar* o que mudou, **o próprio valor avisa quem depende dele**. A informação que faltava passa a existir.

## O que é um Signal (o modelo mental)

A analogia mais útil aqui é a de uma **planilha**.

Numa planilha, você digita `10` na célula A1 e `5` na célula A2. Na célula A3, você escreve a fórmula `=A1+A2`, e ela mostra `15`. Agora, quando você troca o A1 para `20`, o que acontece? O A3 vira `25` **sozinho**. Você não precisou avisar a planilha para recalcular. Ela *sabia* que o A3 dependia do A1.

Um Signal é exatamente isso: uma **caixinha que guarda um valor e conhece quem depende dele**. Quando o valor muda, todo mundo que o consome é notificado automaticamente, e só esse "todo mundo", ninguém mais.

> Pense em Signals como células de planilha para o seu código: você descreve as relações entre os dados uma vez, e o recálculo acontece sozinho, na hora certa.

Com esse modelo na cabeça, o resto vira detalhe de sintaxe.

## signal(): criando e lendo estado

Criar um signal é uma linha. Você passa o valor inicial:

```ts
import { signal } from '@angular/core';

const contador = signal(0);
```

Para **ler** o valor, você chama o signal como se fosse uma função:

```ts
console.log(contador()); // 0
```

Esse par de parênteses não é decoração. Ele é o que permite ao Angular saber, no exato momento da leitura, que *aquele trecho de código depende daquele signal*. É assim que a "planilha" registra as dependências: na hora em que você lê.

## Mudando o valor: set() e update()

Existem duas formas de alterar um signal, e a diferença entre elas é simples:

```ts
// set(): quando o novo valor não depende do anterior
contador.set(10);

// update(): quando o novo valor é calculado a partir do atual
contador.update(valor => valor + 1); // agora é 11
```

Use `set()` quando você já tem o valor final em mãos. Use `update()` quando o novo valor é uma transformação do antigo, incrementar, alternar um booleano, adicionar um item a uma lista. É uma distinção pequena, mas que deixa a intenção do código clara para quem lê depois (inclusive você, daqui a três meses).

## computed(): estado derivado de graça

Aqui mora uma das partes mais bonitas. Lembra da célula A3 da planilha, com a fórmula `=A1+A2`? No Angular, ela é um `computed()`:

```ts
import { signal, computed } from '@angular/core';

const preco = signal(100);
const quantidade = signal(2);

const total = computed(() => preco() * quantidade());

console.log(total()); // 200
quantidade.set(3);
console.log(total()); // 300, recalculou sozinho
```

Repare que eu **nunca** atualizei o `total` manualmente. Ele se atualiza porque, ao ler `preco()` e `quantidade()` lá dentro, o computed *registrou* que depende dos dois. Quando qualquer um deles muda, o total fica "sujo" e recalcula na próxima leitura.

E tem dois detalhes que fazem diferença na prática:

- **É lazy (preguiçoso):** o computed só calcula quando alguém lê o valor. Se ninguém usa o `total()` naquele momento, ele nem se dá ao trabalho.
- **É memoizado:** se as dependências não mudaram, ele devolve o último valor calculado, sem refazer a conta.

Na prática, isso significa que você pode criar quantos `computed()` quiser para descrever seu estado derivado, sem medo de performance. Estado derivado deixa de ser algo que você sincroniza na mão e passa a ser algo que você simplesmente *declara*.

## effect(): quando você precisa reagir ao mundo de fora

`signal` e `computed` cuidam de **dados que viram outros dados**. Mas às vezes você precisa reagir a uma mudança fazendo algo que está *fora* do mundo dos dados: gravar no `localStorage`, disparar um log, atualizar manualmente um gráfico de uma biblioteca de terceiros. Para isso existe o `effect()`:

```ts
import { signal, effect } from '@angular/core';

const tema = signal<'claro' | 'escuro'>('escuro');

effect(() => {
  // roda agora e sempre que `tema` mudar
  document.body.dataset['theme'] = tema();
});
```

Um `effect()` roda uma vez ao ser criado e, depois, **toda vez que algum signal que ele lê por dentro mudar**. As dependências são rastreadas automaticamente. Você não declara uma lista, igual fazia em outros frameworks.

Aqui vai o conselho mais importante deste artigo:

> [!WARNING]
> Não use `effect()` para calcular estado derivado. Se a sua reação é "quando A muda, atualize B", o que você quer é um `computed()`, não um `effect()`.

`effect()` é para **efeitos colaterais**: interações com o mundo externo. Usá-lo para manter um valor em sincronia com outro costuma levar a bugs sutis e loops difíceis de depurar. Guarde-o para quando você realmente precisa "sair" do grafo reativo.

## Signals no template

No template, a leitura é igual: você chama o signal. O Angular passa a atualizar **só** as partes da tela que dependem daquele valor.

```html
<button (click)="contador.update(v => v + 1)">
  Cliquei {{ contador() }} vezes
</button>

@if (total() > 250) {
  <p>Frete grátis liberado! 🎉</p>
}
```

Combinando com o novo control flow (`@if`, `@for`, `@switch`), você tem um template que reage com precisão cirúrgica: quando `contador` muda, o Angular não reavalia a página inteira: ele atualiza aquele texto, e só.

## input() e model(): signals na fronteira do componente

A ideia de Signals foi crescendo pelo framework. Hoje, até a comunicação entre componentes virou signal. Em vez do antigo decorador `@Input()`, você pode declarar entradas como signals:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class CardUsuario {
  // entrada somente leitura, vira um signal
  nome = input.required<string>();

  // entrada de mão dupla (substitui @Input + @Output do "banana in a box")
  favorito = model(false);
}
```

Agora `nome()` é um signal como qualquer outro: dá para usar dentro de um `computed()`, reagir a ele num `effect()`, ler no template. A fronteira do componente deixou de ser um caso especial. É tudo o mesmo modelo reativo, de ponta a ponta. Vale notar que essa evolução veio se consolidando desde o Angular 17 até as versões mais recentes.

## Por que isso muda o jogo

Reunindo as peças, dá para ver o quadro maior:

1. **Detecção de mudança cirúrgica.** Como cada signal sabe exatamente quem depende dele, o Angular atualiza só o necessário, não a árvore inteira "por garantia".
2. **O caminho para o *zoneless*.** Com Signals carregando a informação de "o que mudou", o Angular não precisa mais do Zone.js para adivinhar. Aplicações [sem Zone.js](https://angular.dev/guide/zoneless) ficam mais leves e com um stack trace bem mais limpo quando algo dá errado.
3. **Menos bugs daquele tipo "a tela não atualizou".** Estado derivado declarado com `computed()` está sempre em sincronia, por construção. Aquele drama do começo do artigo simplesmente deixa de acontecer.

Não é uma mudança cosmética de sintaxe. É uma forma diferente (e mais honesta) de descrever como os dados da sua aplicação se relacionam.

## Boas práticas (e algumas armadilhas)

Depois de usar Signals no dia a dia, alguns princípios se repetem:

- **Estado derivado é `computed`, sempre.** Se um valor pode ser calculado a partir de outros, não o guarde num `signal` separado para "manter atualizado na mão". Isso é fonte de bug. Declare o `computed` e siga em frente.
- **`effect()` é a exceção, não a regra.** A maior parte da sua lógica reativa cabe em `signal` + `computed`. Se você está alcançando `effect()` com frequência, vale parar e perguntar se não há um `computed` escondido ali.
- **Mantenha os signals pequenos e específicos.** Vários signals focados reagem melhor (e mais finamente) do que um único objetão gigante que muda inteiro a cada alteração.
- **Atualize objetos e listas de forma imutável.** Troque a referência (`update(lista => [...lista, novo])`) em vez de mutar no lugar, para o signal perceber a mudança de forma confiável.

## Conclusão

Signals trazem para o Angular um modelo de reatividade que sempre esteve à vista, mas que faltava sintaxe para expressar: o da **planilha**. Você descreve as relações entre os dados uma vez (com `signal()` para o estado, `computed()` para o que deriva dele, e `effect()` para falar com o mundo lá fora) e deixa o recálculo acontecer sozinho, na hora certa e no lugar certo.

Se você só for guardar uma frase deste texto, que seja esta: **estado é `signal`, derivado é `computed`, efeito colateral é `effect`.** Com esses três no lugar certo, aquela tela que não atualizava vira história.

Para se aprofundar, a [documentação oficial de Signals](https://angular.dev/guide/signals) é excelente e tem exemplos interativos. E se Signals te interessou, no próximo artigo eu pretendo mostrar como conectar Signals com chamadas assíncronas de forma elegante.

Ficou com alguma dúvida, ou tem um caso de uso curioso? Me chama no [LinkedIn](https://linkedin.com/in/emilybezerra), adoro trocar ideia sobre isso.
