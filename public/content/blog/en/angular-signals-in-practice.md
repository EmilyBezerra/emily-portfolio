You change a value in your code. You check. You check again. The screen keeps showing the old number, staring right back at you.

Sound familiar? It's happened to me more times than I'd like to admit. And there's one thing about me that explains why this post exists: I can't just slap a fix on it and move on. I need to understand where the problem comes from. A leftover habit from my lab days, I figure. I see a new gear and I want to pry it open and watch it turn.

That curiosity is what pulled me deep into Angular Signals. I tried them out in the ERP I build at work, read the official docs, ran a few experiments just to see where they'd lead. What follows is the gist of what I came to understand, focused on what actually matters in practice: when and how to use them.

## Where that screen bug was coming from

This kind of thing is rarely you being careless. Almost always, it's the framework not knowing **what** changed.

For a long time Angular handled this by brute force, with Zone.js. The idea was clever. Zone.js kept an eye on anything that might touch state (a click, a timer, a request) and, whenever something happened, it gave Angular a nudge: "heads up, something might have changed, better go check."

Check what? Everything. The whole component tree, just to be safe. It works, but it's wildly out of proportion. It's like pulling the fire alarm for the entire building because somebody turned on the stove.

Signals turn that whole thing inside out. Instead of the framework guessing, the value itself tells whoever depends on it. That missing piece of information now exists. Sounds like a small thing. It changes almost everything.

## The image that made it click: a spreadsheet

Before any code, let me hand you the analogy that made the concept stick in my head.

Picture a spreadsheet. You put `10` in cell A1 and `5` in A2. In A3 you write `=A1+A2`, and `15` shows up. Now change A1 to `20`. A3 turns into `25` instantly. You didn't hit recalculate. The spreadsheet already knew A3 depended on A1.

A Signal is exactly one of those cells. A little box that holds a value and knows who depends on it. It changes, and everyone who uses that value gets the heads-up. Only the ones who use it. Nobody else.

> Think of a Signal as a spreadsheet cell for your code. You describe the relationships once, and the recalculation takes care of itself, at the right moment.

With that image in your head, the rest is just syntax.

## signal(): create and read

One line. You pass the initial value:

```ts
import { signal } from '@angular/core';

const counter = signal(0);
```

To read it, call it like a function:

```ts
console.log(counter()); // 0
```

That pair of parentheses puzzled me at first, so I went looking. It's not decoration. It's at the exact moment of reading that Angular records "this spot right here depends on that signal." That's how the spreadsheet builds its dependency map: the instant you read.

## set() and update(): change the value

Two ways, and the difference is subtle:

```ts
// set(): you already have the new value
counter.set(10);

// update(): the new value comes from the current one
counter.update(value => value + 1); // now it's 11
```

Reach for `set` when you already know the result. Reach for `update` when you need the previous value to get to the next one: incrementing, flipping a boolean, adding an item to a list. A tiny detail, but it keeps your intent readable for whoever opens the code later.

## computed(): the part I found most elegant

Remember the `=A1+A2` in cell A3? In Angular, that's a `computed()`:

```ts
import { signal, computed } from '@angular/core';

const price = signal(100);
const quantity = signal(2);

const total = computed(() => price() * quantity());

console.log(total()); // 200
quantity.set(3);
console.log(total()); // 300
```

Here's the neat part: I never update `total`. It handles itself. Why? Because as it reads `price()` and `quantity()` inside, it makes a note that it depends on both. Change one of them, the total goes "dirty" and recalculates on the next read.

When I dug into why it's so efficient, I found two details that change things day to day:

- It's lazy. It only computes when someone reads it. Nobody using `total()` right now? It doesn't lift a finger.
- It's memoized. If the dependencies haven't changed, it hands back the last result without redoing the math.

The practical payoff here is liberating. Create as many `computed()` as you want to describe derived state. The stuff I used to sync by hand (and sometimes forgot to sync, which is where half my bugs came from) became a relationship I just declare. Once.

## effect(): the first thing I wanted to really understand

`signal` and `computed` deal with data that becomes other data. But what about when you need to react by doing something outside that world? Writing to `localStorage`, sending a log, updating a chart from some external library. That's what `effect()` is for:

```ts
import { signal, effect } from '@angular/core';

const theme = signal<'light' | 'dark'>('dark');

effect(() => {
  document.body.dataset['theme'] = theme();
});
```

It runs once when it's born, then again every time a signal it reads inside changes. It tracks the dependencies on its own, with no list for you to declare.

When I started studying this, the question that helped me most wasn't "how do I use effect," it was "when do I NOT use it." That answer is worth its weight in gold:

> [!WARNING]
> Don't use `effect()` to compute derived state. If the sentence is "when A changes, update B," what you want is a `computed()`. Almost always.

`effect()` is for side effects, for talking to the outside world. Using it to keep one value in sync with another is the shortest path to weird loops and bugs that are a pain to track down. That's why I treat it as a last resort, never a first one.

## And in the template?

Same logic as before. You call the signal, and Angular updates only the pieces of the screen that depend on that value:

```html
<button (click)="counter.update(v => v + 1)">
  Clicked {{ counter() }} times
</button>

@if (total() > 250) {
  <p>Free shipping! 🎉</p>
}
```

With the new control flow (`@if`, `@for`, `@switch`), the screen reacts with surgical precision. Change `counter`? Angular doesn't re-evaluate the whole page. It touches that one bit of text, and stops there.

## Even the component boundary became a signal

The deeper I dug, the more I saw the idea had spread across the entire framework. These days even communication between components is a signal. In place of `@Input()`, you declare the input like this:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class UserCard {
  name = input.required<string>();
  favorite = model(false); // two-way, in place of @Input + @Output
}
```

And from there, `name()` is a signal like any other. You can use it inside a `computed()`, react to it in an `effect()`, read it in the template. The component boundary stopped being the exception. It all became the same model, end to end. This shift has been settling in from Angular 17 onward.

## Why it's worth learning this now

Putting it all together, the big picture comes into focus:

1. Surgical change detection. Each signal knows who depends on it, so Angular updates only what's needed.
2. It's the road to *zoneless*. With Signals carrying the "what changed," Angular no longer needs Zone.js to guess. An app [without Zone.js](https://angular.dev/guide/zoneless) gets lighter, and the stack trace gets a lot cleaner when something breaks.
3. That screen bug disappears. Derived state with `computed()` is always up to date, by construction.

## The path I'd recommend

If you take one sentence away from here, take this one: state is `signal`, what derives from it is `computed`, a side effect is `effect`. Those three in the right places clear up most of the questions.

The rest is hands-on, and this is where it truly clicks. Open an empty project, make a counter, drop a `computed` on top, and just watch the thing update on its own. That's how it worked for me. Not from reading (not even from reading this).

To go further, the [official Signals documentation](https://angular.dev/guide/signals) is excellent and has examples you can edit right there on the spot. And if the topic grabbed you, in the next post I plan to show how to wire Signals up with async calls without the hacks.

Got stuck somewhere, or have a curious case that left you thinking? Reach out to me on [LinkedIn](https://linkedin.com/in/emilybezerra). I genuinely enjoy talking shop about this stuff.
