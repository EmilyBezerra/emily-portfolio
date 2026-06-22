Ever opened a website on your phone and watched it fall apart? Text spilling off the side, a button that vanishes, a horizontal scrollbar that has no business being there. Or maybe you split your computer screen in two to follow a tutorial, and the site on one side just stopped working.

It happens to everyone. And it's exactly what I ran into during my internship, back in 2024: some screens wouldn't adjust on smaller devices, and on big monitors the layout sprawled all over the place, making no sense. I had no idea how to fix it, so I dug in: read the docs, scoured forums, tested a ton of things, until the screens finally behaved at any size. Ever since, it's become second nature, every screen I ship is born responsive. I put together here what I learned, the article I wish I'd read back then.

## What responsiveness really is

Responsiveness is a website's ability to adapt to any screen size, from a phone to a giant monitor, without losing usability. The layout rearranges itself: elements resize, images shrink, columns turn into rows. Sometimes you even redesign part of the screen so it makes sense in that space.

The idea isn't new, and it even has a birthday. Back in 2010, Ethan Marcotte published ["Responsive Web Design"](https://alistapart.com/article/responsive-web-design/) on A List Apart and named the concept by bringing together three pieces: a fluid grid, flexible images, and media queries. Fifteen years later, that's still the foundation.

## The first step almost everyone forgets: the viewport

Before any media query, there's one line of HTML you can't skip on a phone:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Without it, the phone pretends it has the width of a desktop and shrinks the whole page down (that tiny website that forces you to pinch-zoom just to read it). With it, the browser uses the device's actual width. It's the starting point of responsiveness, as the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport) explain. I once burned a whole lot of time chasing a bug that turned out to be just this one missing line.

## Start by thinking about the phone, not the desktop

A mistake I used to make: design everything for the big monitor and then try to squeeze it onto the phone. The smoother path is the other way around, what people call mobile-first. You write the base styles with the small screen in mind and add adjustments as the screen grows.

It means less rework, and the site stays lighter where most people actually visit, which is the phone.

## Media queries: different styles per screen size

The main tool is `@media`. It applies a block of CSS only when the screen meets a condition:

```css
/* base styles: applies to everyone (phone first) */
.container {
  display: flex;
  flex-direction: column;
}

/* from 768px up (tablet and desktop), switch to a row */
@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}
```

In plain terms: by default the items are stacked, one below the other, which is ideal on a phone. Once the screen is 768px or wider, they sit side by side.

The difference between the two limits is simple: `min-width` applies the style from the chosen width **up**; `max-width`, from the chosen width **down**. With mobile-first you almost always use `min-width`, layering styles on as the screen grows.

You can combine conditions with `and` to target a specific range:

```css
/* only between 768px and 1024px (tablet range) */
@media (min-width: 768px) and (max-width: 1024px) {
  .container {
    padding: 20px;
  }
}
```

And modern CSS already accepts a far more readable range syntax, described in the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using):

```css
@media (768px <= width <= 1024px) {
  .container { padding: 20px; }
}
```

## Breakpoints: don't memorize numbers, watch the content

There are a few common ranges that work as a starting point:

- Phone: up to around 600px
- Tablet: around 600px to 1024px
- Desktop: above 1024px

But the advice that flipped a switch for me (and that both [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) and [Google's web.dev](https://web.dev/articles/responsive-web-design-basics) keep repeating) is this: the best breakpoint isn't the size of some device, it's the point where **your** layout starts to look bad. Slowly shrink your browser window; when something breaks, that's a breakpoint. A new device comes out every year. Your content doesn't.

## Before you cram everything full of media queries

Here's what saved me half my media queries: a good chunk of responsiveness happens without any, if you use the right tools.

Swap fixed pixels for relative units (`%`, `rem`, `em`) and, for typography, `clamp()`, which makes the size vary on its own within a limit:

```css
h1 {
  font-size: clamp(1.75rem, 5vw, 3rem);
}
```

The heading never gets smaller than `1.75rem` or larger than `3rem`, and it scales smoothly in between. Zero media queries.

Flexbox and Grid were also built for fluid layout. A grid that rearranges itself:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 1rem;
}
```

This fits as many columns as will go and drops to a single one on a phone, without you writing a single breakpoint. [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) itself treats Flexbox, Grid, and fluid typography as the heart of responsive design today.

## The next step: container queries

A media query looks at the size of the **screen**. But the same component, a card for example, might show up in a wide column or in a narrow sidebar on the very same screen. The container query is what solves this: it reacts to the size of the **container**, not the window.

```css
.list {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

Now the card adapts to the space it actually has, no matter the screen around it. It already works in every current browser and, for reusable components, it changed the way I think about layout. It's all in the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries).

## Wrapping up

Responsiveness isn't memorizing three breakpoints. It's starting from the phone, using relative units, Flexbox, and Grid to keep the layout fluid, and reaching for a media query (or a container query) only when the content asks for it. Start with the meta viewport, shrink the window, and fix each point where it breaks.

To go further, you can read [MDN's foundation on responsive design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design), the [web.dev guide](https://web.dev/articles/responsive-web-design-basics) and, to understand where it all came from, [Marcotte's original article](https://alistapart.com/article/responsive-web-design/). If you like reading the source of everything, the current spec lives at the [W3C](https://www.w3.org/TR/mediaqueries-5/).

Got a screen that stubbornly refuses to adjust? Reach out to me on [LinkedIn](https://linkedin.com/in/emilybezerra). I genuinely love this topic.
