Have you ever had that moment where you change a piece of data in your code, you're *sure* everything is right, but the screen **simply won't update**? You open the console, scatter a few `console.log` calls, confirm that the value really did change... and the UI keeps showing the old number, staring back at you.

That little drama is almost always a **reactivity** problem: how the framework figures out *what* changed and *what* needs to be redrawn on screen. And that's exactly the problem **Signals** solve, in a way so direct that, once it clicks, it's hard to go back.

In this article I want to give you a **clear mental model** of Signals: what they are, how `signal()`, `computed()` and `effect()` work together, and why they changed the way we handle state in Angular. No magic, no unnecessary jargon, with examples you can run today.

## The problem: how does Angular know something changed?

For years, Angular relied on **Zone.js** to detect changes. The idea was clever: Zone.js "wrapped" almost anything that could change the application's state (clicks, timers, HTTP requests) and whenever one of those happened, it nudged Angular: *"hey, something might have changed, better check"*.

The problem is the "**might**". Since the framework didn't know exactly what changed, it had to walk the component tree and re-evaluate everything, just in case. It works, but it's too much work for too little information. It's like pulling the whole building's fire alarm every time someone turns on the stove.

Signals flip that logic. Instead of the framework *guessing* what changed, **the value itself notifies whoever depends on it**. The missing piece of information now exists.

## What is a Signal (the mental model)

The most useful analogy here is a **spreadsheet**.

In a spreadsheet, you type `10` into cell A1 and `5` into cell A2. In cell A3, you write the formula `=A1+A2`, and it shows `15`. Now, when you change A1 to `20`, what happens? A3 becomes `25` **on its own**. You didn't have to tell the spreadsheet to recalculate. It *knew* A3 depended on A1.

A Signal is exactly that: a **little box that holds a value and knows who depends on it**. When the value changes, everyone consuming it is notified automatically, and only those, nobody else.

> Think of Signals as spreadsheet cells for your code: you describe the relationships between your data once, and the recalculation happens on its own, at the right time.

With that model in your head, the rest is just syntax.

## signal(): creating and reading state

Creating a signal is one line. You pass the initial value:

```ts
import { signal } from '@angular/core';

const counter = signal(0);
```

To **read** the value, you call the signal as if it were a function:

```ts
console.log(counter()); // 0
```

Those parentheses aren't decoration. They're what lets Angular know, at the exact moment of reading, that *this piece of code depends on that signal*. That's how the "spreadsheet" registers dependencies: at read time.

## Changing the value: set() and update()

There are two ways to change a signal, and the difference between them is simple:

```ts
// set(): when the new value doesn't depend on the previous one
counter.set(10);

// update(): when the new value is derived from the current one
counter.update(value => value + 1); // now it's 11
```

Use `set()` when you already have the final value in hand. Use `update()` when the new value is a transformation of the old one, incrementing, toggling a boolean, adding an item to a list. It's a small distinction, but it makes the intent clear to whoever reads it later (including you, three months from now).

## computed(): derived state for free

Here lives one of the most beautiful parts. Remember cell A3 in the spreadsheet, with its `=A1+A2` formula? In Angular, that's a `computed()`:

```ts
import { signal, computed } from '@angular/core';

const price = signal(100);
const quantity = signal(2);

const total = computed(() => price() * quantity());

console.log(total()); // 200
quantity.set(3);
console.log(total()); // 300, recalculated on its own
```

Notice that I **never** updated `total` manually. It updates itself because, by reading `price()` and `quantity()` inside it, the computed *registered* that it depends on both. When either of them changes, the total becomes "dirty" and recomputes on the next read.

And there are two details that make a real difference in practice:

- **It's lazy:** the computed only calculates when someone reads the value. If nobody is using `total()` at that moment, it doesn't even bother.
- **It's memoized:** if the dependencies haven't changed, it returns the last computed value without redoing the math.

In practice, this means you can create as many `computed()` as you want to describe your derived state, with no performance worries. Derived state stops being something you sync by hand and becomes something you simply *declare*.

## effect(): when you need to react to the outside world

`signal` and `computed` handle **data that turns into other data**. But sometimes you need to react to a change by doing something *outside* the world of data: writing to `localStorage`, firing a log, manually updating a chart from a third-party library. That's what `effect()` is for:

```ts
import { signal, effect } from '@angular/core';

const theme = signal<'light' | 'dark'>('dark');

effect(() => {
  // runs now and whenever `theme` changes
  document.body.dataset['theme'] = theme();
});
```

An `effect()` runs once when created and, after that, **every time a signal it reads inside changes**. Dependencies are tracked automatically. You don't declare a list, the way you did in other frameworks.

Here's the most important advice in this article:

> [!WARNING]
> Don't use `effect()` to compute derived state. If your reaction is "when A changes, update B", what you want is a `computed()`, not an `effect()`.

`effect()` is for **side effects**: interactions with the outside world. Using it to keep one value in sync with another tends to lead to subtle bugs and hard-to-debug loops. Save it for when you genuinely need to "step out" of the reactive graph.

## Signals in the template

In the template, reading is the same: you call the signal. Angular then updates **only** the parts of the screen that depend on that value.

```html
<button (click)="counter.update(v => v + 1)">
  Clicked {{ counter() }} times
</button>

@if (total() > 250) {
  <p>Free shipping unlocked! 🎉</p>
}
```

Combined with the new control flow (`@if`, `@for`, `@switch`), you get a template that reacts with surgical precision: when `counter` changes, Angular doesn't re-evaluate the whole page: it updates that text, and only that.

## input() and model(): signals at the component boundary

The Signals idea kept growing across the framework. Today, even communication between components became a signal. Instead of the old `@Input()` decorator, you can declare inputs as signals:

```ts
import { Component, input, model } from '@angular/core';

@Component({ /* ... */ })
export class UserCard {
  // read-only input, becomes a signal
  name = input.required<string>();

  // two-way input (replaces the @Input + @Output "banana in a box")
  favorite = model(false);
}
```

Now `name()` is a signal like any other: you can use it inside a `computed()`, react to it in an `effect()`, read it in the template. The component boundary stopped being a special case. It's all the same reactive model, end to end. It's worth noting this evolution has been consolidating from Angular 17 through the most recent versions.

## Why this changes the game

Putting the pieces together, the bigger picture comes into view:

1. **Surgical change detection.** Since each signal knows exactly who depends on it, Angular updates only what's needed, not the whole tree "just in case".
2. **The path to *zoneless*.** With Signals carrying the "what changed" information, Angular no longer needs Zone.js to guess. [Zoneless](https://angular.dev/guide/zoneless) apps are lighter and give you a much cleaner stack trace when something goes wrong.
3. **Fewer "the screen didn't update" bugs.** Derived state declared with `computed()` is always in sync, by construction. That drama from the start of the article simply stops happening.

This isn't a cosmetic syntax change. It's a different (and more honest) way to describe how your application's data relates to itself.

## Best practices (and a few pitfalls)

After using Signals day to day, a few principles keep coming up:

- **Derived state is `computed`, always.** If a value can be calculated from others, don't store it in a separate `signal` to "keep it updated by hand". That's a bug magnet. Declare the `computed` and move on.
- **`effect()` is the exception, not the rule.** Most of your reactive logic fits in `signal` + `computed`. If you're reaching for `effect()` often, it's worth pausing to ask whether there's a hidden `computed` in there.
- **Keep signals small and specific.** Several focused signals react better (and more finely) than one giant object that changes entirely on every edit.
- **Update objects and lists immutably.** Swap the reference (`update(list => [...list, item])`) instead of mutating in place, so the signal reliably notices the change.

## Conclusion

Signals bring to Angular a reactivity model that was always in plain sight, but lacked the syntax to express it: the **spreadsheet** model. You describe the relationships between your data once (with `signal()` for state, `computed()` for what derives from it, and `effect()` for talking to the outside world) and let the recalculation happen on its own, at the right time and in the right place.

If you only keep one sentence from this text, let it be this: **state is `signal`, derived is `computed`, side effect is `effect`.** With those three in the right place, that screen that wouldn't update becomes history.

To go deeper, the [official Signals documentation](https://angular.dev/guide/signals) is excellent and has interactive examples. And if Signals caught your interest, in the next article I plan to show how to connect Signals with async calls elegantly.

Got a question, or a curious use case? Reach out on [LinkedIn](https://linkedin.com/in/emilybezerra), I love chatting about this stuff.
