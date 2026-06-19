You change a value in your code. You check. You check again. The screen keeps showing the old number, staring right back at you.

Been there? I have, plenty of times. And here's a thing about me: I can't just patch it and move on. I need to know where it comes from. Leftover habit from my lab days, I think. I see a new gear and I want to pop it open and watch it spin.

That curiosity is what pulled me deep into Angular Signals. I tried them out in the ERP I build at work, read the official docs, ran a few experiments just to see what would happen. This post is the gist of what I figured out, focused on what actually matters: when and how to use them.

## Where that screen bug was coming from

This kind of thing is rarely you being careless. It's almost always the framework not knowing **what** changed.

For a long time Angular solved this the brute-force way, with Zone.js. The idea was clever. Zone.js kept an eye on anything that could touch state (a click, a timer, a request) and, whenever something happened, it nudged Angular: "hey, something might have changed, better go check."

Check what? Everything. The whole component tree, just to be safe. It works, but it's overkill. It's like setting off the building's fire alarm because somebody lit the stove.

Signals flip that around. Instead of the framework guessing, the value itself tells whoever depends on it. That missing piece of information finally exists. Sounds small. Changes a lot.

## The image that made it all click: a spreadsheet

Before any code, let me give you the analogy that made the concept stick in my head.

Picture a spreadsheet. You put `10` in cell A1 and `5` in A2. In A3 you write `=A1+A2`, and `15` shows up. Now change A1 to `20`. A3 turns into `25` right away. You didn't hit recalculate. The spreadsheet knew A3 depended on A1.

A Signal is exactly one of those cells. A little box that holds a value and knows who depends on it. It changes, and everyone who uses that value gets the heads-up. Only the ones who use it. Nobody else.

> Think of a Signal as a spreadsheet cell for your code. You describe the relationships once, and the recalculation sorts itself out, at the right time.

With that image in your head, the rest is just syntax.

## signal(): create and read

One line. You pass the initial value:

```ts
import { signal } from '@angular/core';

const counter = signal(0);
```

To read it, you call it like a function:

```ts
console.log(counter()); // 0
```

That pair of parentheses puzzled me at first, so I went digging. It's not decoration. It's at the exact moment of reading that Angular records "this bit right here depends on that signal." That's how the spreadsheet builds its dependency map: the moment you read.

## set() and update(): change the value

Two ways, and the difference is subtle:

```ts
// set(): you already have the new value
counter.set(10);

// update(): the new value comes from the current one
counter.update(value => value + 1); // now it's 11
```

`set` when you already know the result. `update` when you need the previous value to get to the next one: incrementing, flipping a boolean, adding an item to a list. Tiny detail, but it keeps your intent readable for whoever opens the code later.

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

Look how interesting this is: I never update `total`. It handles itself. Why? Because when it reads `price()` and `quantity()` inside, it notes that it depends on both. Change one of them, the total goes "dirty" and recalculates on the next read.

When I went digging into why it's so efficient, I found two details that change the game day to day:

- It's lazy. It only computes when someone reads it. Nobody using `total()` right now? It doesn't even budge.
- It's memoized. If the dependencies haven't changed, it hands back the last result without redoing the math.

The practical effect of this is freeing. You can create as many `computed()` as you want to describe derived state. The stuff I used to sync by hand (and sometimes forgot to sync, which is where half my bugs were born) became a relationship I just declare. Once.

## effect(): the first thing I wanted to really understand

`signal` and `computed` deal with data that turns into other data. But what about when you need to react by doing something outside that world? Writing to `localStorage`, sending a log, updating a chart from some external library. That's what `effect()` is for:

```ts
import { signal, effect } from '@angular/core';

const theme = signal<'light' | 'dark'>('dark');

effect(() => {
  document.body.dataset['theme'] = theme();
});
```

It runs once when it's born, then again every time a signal it reads inside changes. It tracks the dependencies on its own, no list to declare.

When I started studying this, the question that helped me most wasn't "how do I use effect," it was "when do I NOT use it." That answer is worth its weight in gold:

> [!WARNING]
> Don't use `effect()` to compute derived state. If the sentence is "when A changes, update B," what you want is a `computed()`. Almost always.

`effect()` is for side effects, for talking to the outside world. Using it to keep one value in sync with another is the shortest path to weird loops and bugs that are a pain to track down. That's why I treat it as a last resort, not a first one.

## And in the template?

Same logic. You call the signal, and Angular updates only the pieces of the screen that depend on that value:

```html
<button (click)="counter.update(v => v + 1)">
  Clicked {{ counter() }} times
</button>

@if (total() > 250) {
  <p>Free shipping! 🎉</p>
}
```

With the new control flow (`@if`, `@for`, `@switch`), the screen reacts with surgical precision. Change `counter`, and Angular doesn't re-evaluate the whole page. It touches that one piece of text, and stops there.

## Even the component boundary became a signal

The deeper I went, the more I realized the idea had spread across the whole framework. These days even communication between components is a signal. Instead of `@Input()`, you declare the input like this:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class UserCard {
  name = input.required<string>();
  favorite = model(false); // two-way, in place of @Input + @Output
}
```

And then `name()` is a signal like any other. You can use it inside a `computed()`, react to it in an `effect()`, read it in the template. The component boundary stopped being the exception. It all became the same model, end to end. This evolution has been settling in from Angular 17 onward.

## Why it's worth learning this now

Pulling together what I figured out, the big picture shows up:

1. Surgical change detection. Each signal knows who depends on it, so Angular updates only what's needed.
2. It's the road to *zoneless*. With Signals carrying the "what changed," Angular doesn't need Zone.js to guess anymore. An app [without Zone.js](https://angular.dev/guide/zoneless) gets lighter, and the stack trace gets way cleaner when something breaks.
3. That screen bug goes away. Derived state with `computed()` is always up to date, by construction.

## The path I'd recommend

If you take one sentence away from here, take this one: state is `signal`, what derives from it is `computed`, a side effect is `effect`. Those three in the right spots clear up most of the questions.

The rest is hands-on, and this is where it really clicks. Open an empty project, make a counter, drop a `computed` on top, and just watch the thing update on its own. That's how it clicked for me. Not from reading (not even from reading this).

To go further, the [official Signals documentation](https://angular.dev/guide/signals) is great and has examples you edit right there on the spot. And if the topic grabbed you, in the next post I plan to show how to wire Signals up with async calls without the hacks.

Got stuck somewhere, or have a curious case that left you thinking? Hit me up on [LinkedIn](https://linkedin.com/in/emilybezerra). I really enjoy talking shop about this stuff.
