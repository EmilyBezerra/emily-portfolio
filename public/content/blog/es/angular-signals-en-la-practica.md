Cambias un valor en el código. Revisas. Revisas otra vez. La pantalla sigue mostrando el número viejo, mirándote fijo.

¿Ya te pasó? A mí sí, varias veces. Y hay algo sobre mí que explica este texto: no soy capaz de solo arreglarlo a las malas y seguir. Necesito entender de dónde viene el problema. Es herencia de la época del laboratorio, supongo. Veo un engranaje nuevo y quiero abrirlo para ver cómo gira.

Fue esa curiosidad la que me llevó hasta el fondo de los Signals de Angular. Los probé en el ERP que construyo en el trabajo, leí la documentación oficial, hice algunos experimentos solo para ver qué pasaba. Lo que viene aquí es el resumen de lo que entendí, con foco en lo que de verdad importa: cuándo y cómo usarlos.

## De dónde venía aquel bug de la pantalla

Este tipo de cosa rara vez es un descuido tuyo. Casi siempre es el framework que no sabe **qué** cambió.

Durante mucho tiempo Angular resolvió esto a pulso, con Zone.js. La idea era ingeniosa. Zone.js se quedaba vigilando todo lo que pudiera tocar el estado (un clic, un timer, una petición) y, cuando algo ocurría, le daba un toque a Angular: "oye, puede que algo haya cambiado, mejor revisa".

¿Revisar qué? Todo. El árbol entero de componentes, por las dudas. Funciona, pero es desproporcionado. Es como disparar la alarma de incendios de todo el edificio porque alguien encendió la cocina.

Los Signals le dan la vuelta a este juego. En vez de que el framework adivine, es el propio valor el que le avisa a quien depende de él. Aquella información que faltaba ahora existe. Parece poco. Cambia casi todo.

## La imagen que destrabó todo: la planilla

Antes de cualquier código, déjame pasarte la analogía que hizo que el concepto se me quedara pegado en la cabeza.

Piensa en una planilla. Pones `10` en la celda A1 y `5` en A2. En A3 escribes `=A1+A2`, y aparece `15`. Ahora cambia A1 a `20`. A3 se vuelve `25` al instante. No apretaste recalcular. La planilla ya sabía que A3 dependía de A1.

Un Signal es exactamente una de esas celdas. Una cajita que guarda un valor y conoce a quien depende de él. Cambió, y todos los que usan ese valor reciben el aviso. Solo los que lo usan. Nadie más.

> Piensa en un Signal como una celda de planilla para tu código. Describes las relaciones una vez, y el recálculo se las arregla solo, en el momento justo.

Con esa imagen en la cabeza, el resto es pura sintaxis.

## signal(): crear y leer

Una línea. Le pasas el valor inicial:

```ts
import { signal } from '@angular/core';

const contador = signal(0);
```

Para leer, lo llamas como función:

```ts
console.log(contador()); // 0
```

Ese par de paréntesis me intrigó al principio, así que fui a investigar. No es decoración. Es en el momento exacto de la lectura cuando Angular registra "este trozo de aquí depende de este signal". Así es como la planilla arma el mapa de dependencias: en el instante en que lees.

## set() y update(): cambiar el valor

Dos formas, y la diferencia es sutil:

```ts
// set(): ya tienes el valor nuevo
contador.set(10);

// update(): el valor nuevo nace del actual
contador.update(valor => valor + 1); // pasó a 11
```

`set` cuando ya sabes el resultado. `update` cuando necesitas el valor anterior para llegar al siguiente: incrementar, invertir un booleano, agregar un ítem a una lista. Un detalle mínimo, pero deja tu intención legible para quien abra el código después.

## computed(): la parte que me pareció más elegante

¿Te acuerdas del `=A1+A2` de la celda A3? En Angular, eso es un `computed()`:

```ts
import { signal, computed } from '@angular/core';

const precio = signal(100);
const cantidad = signal(2);

const total = computed(() => precio() * cantidad());

console.log(total()); // 200
cantidad.set(3);
console.log(total()); // 300
```

Mira qué interesante: yo nunca actualizo el `total`. Se las arregla solo. ¿Por qué? Porque, al leer `precio()` y `cantidad()` ahí dentro, anota que depende de los dos. Cambió uno de ellos, el total queda "sucio" y recalcula en la próxima lectura.

Cuando me puse a investigar por qué es tan eficiente, encontré dos detalles que cambian el juego en el día a día:

- Es perezoso. Solo calcula cuando alguien lo lee. ¿Nadie está usando `total()` ahora? Ni se mueve.
- Es memoizado. Si la dependencia no cambió, devuelve el último resultado sin rehacer la cuenta.

El efecto práctico de esto es liberador. Crea cuantos `computed()` quieras para describir estado derivado. Aquello que antes sincronizaba a mano (y a veces me olvidaba de sincronizar, que era donde nacía la mitad de mis bugs) se volvió una relación que solo declaro. Una vez.

## effect(): lo primero que quise entender en serio

`signal` y `computed` se encargan de dato que se vuelve otro dato. Pero ¿y cuando necesitas reaccionar haciendo algo fuera de ese mundo? Guardar en `localStorage`, mandar un log, actualizar un gráfico de una librería externa. Para eso existe el `effect()`:

```ts
import { signal, effect } from '@angular/core';

const tema = signal<'claro' | 'oscuro'>('oscuro');

effect(() => {
  document.body.dataset['theme'] = tema();
});
```

Corre una vez al nacer y después siempre que algún signal leído ahí dentro cambie. Las dependencias las rastrea solo, sin que tengas que declarar ninguna lista.

Cuando empecé a estudiar esto, la pregunta que más me ayudó no fue "cómo uso effect", sino "cuándo NO usarlo". La respuesta vale oro:

> [!WARNING]
> No uses `effect()` para calcular estado derivado. Si la frase es "cuando A cambie, actualiza B", lo que quieres es un `computed()`. Casi siempre.

`effect()` es para efecto colateral, para hablar con el mundo de afuera. Usarlo para mantener un valor en sincronía con otro es el atajo más corto hacia los loops raros y los bugs difíciles de rastrear. Por eso lo trato como último recurso, nunca como primero.

## ¿Y en el template?

La misma lógica de antes. Llamas al signal, y Angular actualiza solo los pedazos de la pantalla que dependen de ese valor:

```html
<button (click)="contador.update(v => v + 1)">
  Hice clic {{ contador() }} veces
</button>

@if (total() > 250) {
  <p>¡Envío gratis! 🎉</p>
}
```

Con el control flow nuevo (`@if`, `@for`, `@switch`), la pantalla reacciona con precisión de bisturí. ¿Cambió el `contador`? Angular no reevalúa la página entera. Toca ese texto, y ahí se detiene.

## Hasta la frontera del componente se volvió signal

Cuanto más cavaba, más veía que la idea se había esparcido por el framework entero. Hoy hasta la comunicación entre componentes es signal. En lugar del `@Input()`, declaras la entrada así:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class CardUsuario {
  nombre = input.required<string>();
  favorito = model(false); // doble vía, en lugar de @Input + @Output
}
```

Y entonces `nombre()` es un signal como cualquier otro. Lo puedes usar dentro de un `computed()`, reaccionar a él en un `effect()`, leerlo en el template. La frontera del componente dejó de ser la excepción. Pasó a ser todo el mismo modelo, de punta a punta. Esa vuelta se fue afianzando de Angular 17 en adelante.

## Por qué vale la pena aprender esto ahora

Juntando todo, aparece el cuadro grande:

1. Detección de cambios quirúrgica. Cada signal sabe quién depende de él, así que Angular actualiza solo lo necesario.
2. Es el camino hacia el *zoneless*. Con los Signals cargando el "qué cambió", Angular ya no necesita a Zone.js para adivinar. Una app [sin Zone.js](https://angular.dev/guide/zoneless) queda más liviana, y el stack trace queda mucho más limpio cuando algo se rompe.
3. Aquel bug de la pantalla desaparece. El estado derivado con `computed()` está siempre al día, por construcción.

## El camino que te recomiendo

Si te vas a llevar una sola frase de aquí, llévate esta: estado es `signal`, lo que deriva de él es `computed`, efecto colateral es `effect`. Esos tres en el lugar correcto resuelven la mayor parte de las dudas.

El resto es ponerse manos a la obra, y es ahí donde de verdad cae la ficha. Abre un proyecto vacío, crea un contador, ponle un `computed` encima, y quédate mirando cómo la cosa se actualiza sola. Así fue como funcionó conmigo. No fue leyendo (ni siquiera leyendo esto).

Para ir más allá, la [documentación oficial de Signals](https://angular.dev/guide/signals) es buenísima y tiene ejemplos que editas ahí mismo, al instante. Y si el tema te enganchó, en el próximo texto pienso mostrar cómo conectar Signals con llamadas asíncronas sin enredos.

¿Te trabaste en algún punto, o tienes un caso curioso que te dejó pensando? Escríbeme por [LinkedIn](https://linkedin.com/in/emilybezerra). Me encanta intercambiar ideas sobre esto.
