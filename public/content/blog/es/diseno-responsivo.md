¿Alguna vez abriste un sitio en el celular y apareció todo roto? Texto que se sale por el costado, un botón que desaparece, una barra de scroll horizontal que no debería existir. O dividiste la pantalla de la computadora en dos para seguir un tutorial, y el sitio de al lado simplemente dejó de funcionar.

Le pasa a todo el mundo. Y fue exactamente eso lo que me encontré en mi pasantía, en 2024: algunas pantallas no se ajustaban en los dispositivos más chicos, y en los monitores grandes el diseño quedaba desparramado, sin sentido. Yo no sabía cómo resolverlo, así que me puse a investigar: leí documentación, revolví foros, probé un montón de cosas, hasta que las pantallas se comportaron en cualquier tamaño. De ahí en adelante se volvió costumbre, cada pantalla que entrego ya nace responsiva. Junté aquí lo que aprendí, el texto que me hubiera gustado leer en aquel momento.

## Qué es la responsividad, de verdad

La responsividad es que un sitio se adapte a cualquier tamaño de pantalla, del celular al monitor gigante, sin volverse incómodo de usar. El diseño se reorganiza solo: los elementos cambian de tamaño, las imágenes se achican, las columnas se vuelven filas. A veces incluso rediseñas un pedazo de la pantalla para que tenga sentido en ese espacio.

La idea no es nueva, y hasta tiene fecha de nacimiento. En 2010, Ethan Marcotte publicó ["Responsive Web Design"](https://alistapart.com/article/responsive-web-design/) en A List Apart y bautizó el concepto juntando tres piezas: grid fluido, imágenes flexibles y media queries. Quince años después, esa sigue siendo la base.

## El primer paso que casi todos olvidan: el viewport

Antes de cualquier media query, hay una línea de HTML que, si falta, nada funciona bien en el celular:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Sin ella, el celular finge que tiene el ancho de un escritorio y achica la página entera (ese sitio diminuto que te obliga a hacer zoom para poder leer). Con ella, el navegador usa el ancho real del dispositivo. Es el punto de partida de la responsividad, como lo explica la [documentación de MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport). Yo ya perdí un montón de tiempo cazando un bug que era solo esa línea faltante.

## Empieza pensando en el celular, no en el escritorio

Un error que yo cometía: diseñar todo para el monitor grande y después tratar de exprimirlo en el celular. El camino más tranquilo es el contrario, lo que la gente llama mobile-first. Escribes el estilo base pensando en la pantalla chica y vas sumando ajustes a medida que la pantalla crece.

Da menos retrabajo, y el sitio queda más liviano justo donde la mayoría de la gente entra, que es el celular.

## Media queries: estilo distinto según el tamaño de pantalla

La herramienta principal es la `@media`. Aplica un bloque de CSS solo cuando la pantalla cumple una condición:

```css
/* estilo base: vale para todos (el celular primero) */
.container {
  display: flex;
  flex-direction: column;
}

/* de 768px para arriba (tablet y escritorio), pasa a fila */
@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}
```

Traducido: por defecto los elementos quedan apilados, uno debajo del otro, que es lo ideal en el celular. Cuando la pantalla tiene 768px o más, pasan a quedar uno al lado del otro.

La diferencia entre los dos límites es simple: `min-width` aplica el estilo del ancho elegido **hacia arriba**; `max-width`, del ancho elegido **hacia abajo**. En mobile-first usas casi siempre `min-width`, sumando capas a medida que la pantalla crece.

Puedes combinar condiciones con `and` para apuntar a un rango específico:

```css
/* solo entre 768px y 1024px (rango de tablet) */
@media (min-width: 768px) and (max-width: 1024px) {
  .container {
    padding: 20px;
  }
}
```

Y el CSS actual ya acepta una sintaxis de intervalo bastante más legible, descrita en la [referencia de MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using):

```css
@media (768px <= width <= 1024px) {
  .container { padding: 20px; }
}
```

## Breakpoints: no memorices números, observa el contenido

Hay algunos rangos comunes que sirven como punto de partida:

- Celular: hasta unos 600px
- Tablet: cerca de 600px a 1024px
- Escritorio: por encima de 1024px

Pero el consejo que me cambió la cabeza (y que repiten tanto [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) como el [web.dev de Google](https://web.dev/articles/responsive-web-design-basics)) es este: el mejor breakpoint no es el tamaño de un dispositivo, es el punto en que **tu** diseño empieza a verse feo. Ve achicando la ventana del navegador poco a poco; cuando algo se rompa, ahí tienes un breakpoint. Sale un dispositivo nuevo con otra resolución todos los años, y no vas a andar detrás de cada uno; tu contenido, en cambio, sigue siendo el mismo.

## Antes de llenar todo de media queries

Aquí va lo que me ahorró la mitad de las media queries: buena parte de la responsividad ocurre sin ninguna, si usas las herramientas correctas.

Cambia el pixel fijo por unidades relativas (`%`, `rem`, `em`) y, para la tipografía, el `clamp()`, que hace que el tamaño varíe solo dentro de un límite:

```css
h1 {
  font-size: clamp(1.75rem, 5vw, 3rem);
}
```

El título nunca queda más chico que `1.75rem` ni más grande que `3rem`, y varía suave en el medio. Cero media query.

Flexbox y Grid también fueron pensados para el layout fluido. Un grid que se reorganiza solo:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 1rem;
}
```

Esto encaja todas las columnas que quepan y cae a una sola en el celular, sin que escribas un solo breakpoint. La propia [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) trata Flexbox, Grid y la tipografía fluida como el corazón del diseño responsivo de hoy.

## El 100vh que miente en el celular

Esta me comió una tarde antes de entender qué pasaba. Le pones a una sección `height: 100vh` para que ocupe la pantalla entera, la pruebas en el escritorio, hermoso. La abres en el celular y el pie de página queda escondido detrás de la barra de direcciones del navegador, o sobra un pedazo cuando la barra desaparece al hacer scroll.

El motivo es medio molesto: en mobile, `100vh` cuenta la altura de la pantalla *sin* la barra del navegador, que aparece y desaparece a medida que haces scroll. La solución más nueva es cambiarlo por `100dvh` (la versión *dinámica*, que acompaña a la barra):

```css
.hero {
  min-height: 100dvh;
}
```

Funciona bien en los navegadores actuales. Tardé en darme cuenta de que no era error mío: era el `vh` comportándose exactamente como está especificado, solo que nadie te avisa eso cuando aprendes `vh`.

## La evolución: container queries

La media query mira el tamaño de la **pantalla**. Pero un mismo componente, una tarjeta por ejemplo, puede aparecer en una columna ancha o en una barra lateral angosta dentro de la misma pantalla. Quien resuelve eso es la container query: reacciona al tamaño del **contenedor**, no de la ventana.

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

Ahora la tarjeta se adapta al espacio que realmente tiene, sin importar la pantalla alrededor. Ya funciona en todos los navegadores actuales y, para un componente reutilizable, me cambió la forma de pensar el layout. Está todo en la [documentación de MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries).

## Para cerrar

La responsividad no es memorizar tres breakpoints. Es partir del celular, usar unidades relativas, Flexbox y Grid para dejar el layout fluido, y llamar a la media query (o a la container query) solo cuando el contenido lo pida. Empieza por la meta viewport, ve achicando la ventana y arregla cada punto que se rompa.

Para ir más allá, puedes leer la [base de MDN sobre diseño responsivo](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design), la [guía de web.dev](https://web.dev/articles/responsive-web-design-basics) y, para entender de dónde vino todo, el [artículo original de Marcotte](https://alistapart.com/article/responsive-web-design/). Si te gusta leer la fuente de todo, la especificación actual está en la [W3C](https://www.w3.org/TR/mediaqueries-5/).

¿Tienes alguna pantalla que se empeña en no ajustarse? Escríbeme por [LinkedIn](https://linkedin.com/in/emilybezerra). Me encanta este tema.
