¿Alguna vez te pasó ese momento en que cambias un dato en el código, estás *seguro* de que todo está bien, pero la pantalla **simplemente no se actualiza**? Abres la consola, esparces algunos `console.log`, confirmas que el valor cambió de verdad... y la interfaz sigue mostrando el número viejo, mirándote fijo.

Ese pequeño drama es, casi siempre, un problema de **reactividad**: cómo el framework descubre *qué* cambió y *qué* hay que volver a dibujar en la pantalla. Y es exactamente ese problema el que resuelven los **Signals**: de una forma tan directa que, una vez que lo entiendes, es difícil volver atrás.

En este artículo quiero darte un **modelo mental claro** de Signals: qué son, cómo funcionan juntos `signal()`, `computed()` y `effect()`, y por qué cambiaron la forma de manejar el estado en Angular. Sin magia, sin jerga innecesaria, con ejemplos que puedes ejecutar hoy.

## El problema: ¿cómo sabe Angular que algo cambió?

Durante años, Angular dependió de **Zone.js** para detectar cambios. La idea era ingeniosa: Zone.js "envolvía" casi todo lo que podía alterar el estado de la aplicación (clics, temporizadores, peticiones HTTP) y, cada vez que ocurría algo de eso, avisaba a Angular: *"oye, quizás algo cambió, mejor revisa"*.

El problema es el "**quizás**". Como el framework no sabía exactamente qué cambió, tenía que recorrer el árbol de componentes y reevaluar todo, por las dudas. Funciona, pero es demasiado trabajo para tan poca información. Es como activar la alarma de incendios de todo el edificio cada vez que alguien enciende la cocina.

Los Signals invierten esa lógica. En lugar de que el framework *adivine* qué cambió, **el propio valor avisa a quien depende de él**. La información que faltaba ahora existe.

## Qué es un Signal (el modelo mental)

La analogía más útil aquí es la de una **hoja de cálculo**.

En una hoja de cálculo, escribes `10` en la celda A1 y `5` en la celda A2. En la celda A3, escribes la fórmula `=A1+A2`, y muestra `15`. Ahora, cuando cambias A1 a `20`, ¿qué pasa? A3 se vuelve `25` **solo**. No tuviste que avisarle a la hoja que recalculara. *Sabía* que A3 dependía de A1.

Un Signal es exactamente eso: una **cajita que guarda un valor y conoce a quién depende de él**. Cuando el valor cambia, todos los que lo consumen son notificados automáticamente, y solo esos, nadie más.

> Piensa en los Signals como celdas de una hoja de cálculo para tu código: describes las relaciones entre los datos una vez, y el recálculo ocurre solo, en el momento justo.

Con ese modelo en la cabeza, lo demás es solo sintaxis.

## signal(): crear y leer estado

Crear un signal es una línea. Le pasas el valor inicial:

```ts
import { signal } from '@angular/core';

const contador = signal(0);
```

Para **leer** el valor, llamas al signal como si fuera una función:

```ts
console.log(contador()); // 0
```

Esos paréntesis no son decoración. Son lo que le permite a Angular saber, en el momento exacto de la lectura, que *ese trozo de código depende de ese signal*. Así es como la "hoja de cálculo" registra las dependencias: en el momento de leer.

## Cambiar el valor: set() y update()

Hay dos formas de modificar un signal, y la diferencia entre ellas es simple:

```ts
// set(): cuando el nuevo valor no depende del anterior
contador.set(10);

// update(): cuando el nuevo valor se deriva del actual
contador.update(valor => valor + 1); // ahora es 11
```

Usa `set()` cuando ya tienes el valor final en la mano. Usa `update()` cuando el nuevo valor es una transformación del anterior, incrementar, alternar un booleano, agregar un elemento a una lista. Es una distinción pequeña, pero deja la intención del código clara para quien lo lea después (incluido tú, dentro de tres meses).

## computed(): estado derivado gratis

Aquí vive una de las partes más bonitas. ¿Recuerdas la celda A3 de la hoja de cálculo, con la fórmula `=A1+A2`? En Angular, eso es un `computed()`:

```ts
import { signal, computed } from '@angular/core';

const precio = signal(100);
const cantidad = signal(2);

const total = computed(() => precio() * cantidad());

console.log(total()); // 200
cantidad.set(3);
console.log(total()); // 300, recalculó solo
```

Fíjate que **nunca** actualicé `total` manualmente. Se actualiza porque, al leer `precio()` y `cantidad()` dentro de él, el computed *registró* que depende de ambos. Cuando cualquiera de los dos cambia, el total queda "sucio" y se recalcula en la próxima lectura.

Y hay dos detalles que marcan la diferencia en la práctica:

- **Es lazy (perezoso):** el computed solo calcula cuando alguien lee el valor. Si nadie usa `total()` en ese momento, ni se molesta.
- **Es memoizado:** si las dependencias no cambiaron, devuelve el último valor calculado, sin rehacer la cuenta.

En la práctica, esto significa que puedes crear tantos `computed()` como quieras para describir tu estado derivado, sin miedo al rendimiento. El estado derivado deja de ser algo que sincronizas a mano y pasa a ser algo que simplemente *declaras*.

## effect(): cuando necesitas reaccionar al mundo exterior

`signal` y `computed` se encargan de **datos que se convierten en otros datos**. Pero a veces necesitas reaccionar a un cambio haciendo algo *fuera* del mundo de los datos: escribir en `localStorage`, disparar un log, actualizar manualmente un gráfico de una librería de terceros. Para eso existe `effect()`:

```ts
import { signal, effect } from '@angular/core';

const tema = signal<'claro' | 'oscuro'>('oscuro');

effect(() => {
  // se ejecuta ahora y cada vez que `tema` cambie
  document.body.dataset['theme'] = tema();
});
```

Un `effect()` se ejecuta una vez al crearse y, después, **cada vez que algún signal que lee por dentro cambia**. Las dependencias se rastrean automáticamente. No declaras una lista, como hacías en otros frameworks.

Aquí va el consejo más importante de este artículo:

> [!WARNING]
> No uses `effect()` para calcular estado derivado. Si tu reacción es "cuando A cambia, actualiza B", lo que quieres es un `computed()`, no un `effect()`.

`effect()` es para **efectos secundarios**: interacciones con el mundo externo. Usarlo para mantener un valor sincronizado con otro suele llevar a bugs sutiles y bucles difíciles de depurar. Resérvalo para cuando realmente necesitas "salir" del grafo reactivo.

## Signals en la plantilla

En la plantilla, la lectura es igual: llamas al signal. Angular entonces actualiza **solo** las partes de la pantalla que dependen de ese valor.

```html
<button (click)="contador.update(v => v + 1)">
  Hice clic {{ contador() }} veces
</button>

@if (total() > 250) {
  <p>¡Envío gratis desbloqueado! 🎉</p>
}
```

Combinado con el nuevo control flow (`@if`, `@for`, `@switch`), obtienes una plantilla que reacciona con precisión quirúrgica: cuando `contador` cambia, Angular no reevalúa toda la página: actualiza ese texto, y solo eso.

## input() y model(): signals en la frontera del componente

La idea de los Signals fue creciendo por el framework. Hoy, hasta la comunicación entre componentes se volvió un signal. En lugar del antiguo decorador `@Input()`, puedes declarar las entradas como signals:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class TarjetaUsuario {
  // entrada de solo lectura, se vuelve un signal
  nombre = input.required<string>();

  // entrada de doble vía (reemplaza el @Input + @Output del "banana in a box")
  favorito = model(false);
}
```

Ahora `nombre()` es un signal como cualquier otro: puedes usarlo dentro de un `computed()`, reaccionar a él en un `effect()`, leerlo en la plantilla. La frontera del componente dejó de ser un caso especial. Es todo el mismo modelo reactivo, de punta a punta. Vale la pena notar que esta evolución se fue consolidando desde Angular 17 hasta las versiones más recientes.

## Por qué esto cambia el juego

Juntando las piezas, aparece el panorama completo:

1. **Detección de cambios quirúrgica.** Como cada signal sabe exactamente quién depende de él, Angular actualiza solo lo necesario, no todo el árbol "por las dudas".
2. **El camino hacia *zoneless*.** Con los Signals cargando la información de "qué cambió", Angular ya no necesita Zone.js para adivinar. Las aplicaciones [sin Zone.js](https://angular.dev/guide/zoneless) son más ligeras y dan un stack trace mucho más limpio cuando algo sale mal.
3. **Menos bugs del tipo "la pantalla no se actualizó".** El estado derivado declarado con `computed()` siempre está sincronizado, por construcción. Ese drama del comienzo del artículo simplemente deja de ocurrir.

No es un cambio cosmético de sintaxis. Es una forma diferente (y más honesta) de describir cómo se relacionan los datos de tu aplicación.

## Buenas prácticas (y algunas trampas)

Después de usar Signals en el día a día, algunos principios se repiten:

- **El estado derivado es `computed`, siempre.** Si un valor puede calcularse a partir de otros, no lo guardes en un `signal` aparte para "mantenerlo actualizado a mano". Eso es un imán de bugs. Declara el `computed` y sigue adelante.
- **`effect()` es la excepción, no la regla.** La mayor parte de tu lógica reactiva cabe en `signal` + `computed`. Si recurres a `effect()` con frecuencia, vale la pena detenerse y preguntar si no hay un `computed` escondido ahí.
- **Mantén los signals pequeños y específicos.** Varios signals enfocados reaccionan mejor (y de forma más fina) que un único objetón gigante que cambia entero en cada edición.
- **Actualiza objetos y listas de forma inmutable.** Cambia la referencia (`update(lista => [...lista, item])`) en lugar de mutar en el lugar, para que el signal detecte el cambio de forma confiable.

## Conclusión

Los Signals traen a Angular un modelo de reactividad que siempre estuvo a la vista, pero al que le faltaba sintaxis para expresarlo: el de la **hoja de cálculo**. Describes las relaciones entre los datos una vez (con `signal()` para el estado, `computed()` para lo que se deriva de él, y `effect()` para hablar con el mundo exterior) y dejas que el recálculo ocurra solo, en el momento justo y en el lugar justo.

Si solo te llevas una frase de este texto, que sea esta: **el estado es `signal`, lo derivado es `computed`, el efecto secundario es `effect`.** Con esos tres en el lugar correcto, esa pantalla que no se actualizaba pasa a la historia.

Para profundizar, la [documentación oficial de Signals](https://angular.dev/guide/signals) es excelente y tiene ejemplos interactivos. Y si los Signals te interesaron, en el próximo artículo pienso mostrar cómo conectar Signals con llamadas asíncronas de forma elegante.

¿Te quedó alguna duda, o tienes un caso de uso curioso? Escríbeme por [LinkedIn](https://linkedin.com/in/emilybezerra), me encanta charlar sobre esto.
