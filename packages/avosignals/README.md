# avosignals

A lightweight, type-safe reactive state management library for TypeScript. It features automatic dependency tracking, efficient updates, and first-class support for **Lit** components.

# Features

- ⚡️ **Fine-Grained Reactivity**: Updates only what needs to change.
- 🛡️ **Circular Dependency Protection**: Detects and prevents infinite loops during computation.

- 🧹**Automatic Garbage Collection**: Uses `WeakRef` for internal computed subscriptions to prevent memory leaks in derived state graphs.

- 🔒 **Safety Guardrails**: Prevents state mutations during reactive evaluations to ensure data consistency.

- 🔥 **Lit Integration**: Includes a specific controller (`SignalWatcher`) to make Lit components reactive automatically.

# Instalation

### Node / NPM
```bash
npm install avosignals
```

### Browser / Esm.sh
```html
<script type="module">
    import { Signal, Computed, effect } from "https://esm.sh/avosignals"
</script>
```

# Core Concepts
1. Signals

Signals are the atoms of state. They hold a value and notify subscribers when that value changes.

```Typescript
import { Signal } from 'avosignals';

const count = new Signal(0, 'count');

console.log(count.get()); // 0

count.set(1);
count.update(c => c + 1); // 2
```

2. Computed

Computed values are derived signals. They depend on other signals and re-evaluate only when their dependencies change. They are lazy—they only recalculate when read.

```Typescript
import { Signal, Computed } from 'avosignals';

const count = new Signal(1);
const double = new Computed(() => count.get() * 2, 'double');

console.log(double.get()); // 2

count.set(10);
console.log(double.get()); // 20
```

3. Effects

Effects are side effects that run automatically whenever the signals they access change. Useful for logging, manual DOM manipulation, or syncing with external APIs.

```Typescript
import { Signal, effect } from 'avosignals';

const count = new Signal(0);

const dispose = effect(() => {
    console.log(`The count is now ${count.get()}`);
    
    // Optional cleanup function (runs before next execution or on dispose)
    return () => console.log('Cleaning up...');
});

count.set(1); 
// Logs: "The count is now 1"

dispose();
// Logs: 'Cleaning up...'
```

4. Manual Subscription

If you need to listen to changes without creating an automatic effect (for example, to integrate with a legacy API or one-off logic), you can subscribe directly to any `Signal` or `Computed`.

*Note: Unlike `effect`, manual subscriptions do not track dependencies automatically; they only fire when the specific signal you subscribed to changes.*

```Typescript
import { Signal } from 'avosignals';

const theme = new Signal('light');

// Returns an unsubscribe function
const unsubscribe = theme.subscribe(() => {
    console.log(`Theme changed to: ${theme.get()}`);
});

theme.set('dark'); // Logs: "Theme changed to: dark"

// Stop listening
unsubscribe();
```

# Usage with Lit

`avosignals` was built with Lit in mind. The `SignalWatcher` class hooks into the Lit lifecycle to automatically track signals accessed during render. Its core design is to allow for production ready signals which can be easily replaced with Lit's official signals once **TC39 signals** becomes mainstream and production ready.

## The `SignalWatcher` Controller

You do not need to manually subscribe to signals. simply add the controller, and any signal read inside `render()` will trigger a component update when it changes.

```Typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Signal, SignalWatcher } from 'avosignals';

// Shared state
const counter = new Signal(0);

@customElement('my-counter')
export class MyCounter extends LitElement {
    // 1. Register the watcher
    private watcher = new SignalWatcher(this);

    render() {
        // 2. Access signals directly. 
        // The component now auto-subscribes to 'counter'.
        return html`
            <p>Count: ${counter.get()}</p>
            <button @click=${() => counter.update(c => c + 1)}>
                Increment
            </button>
        `;
    }
}
```

# Usage with Vanilla Web Components

You can easily use `avosignals` with standard HTML Web Components. Since vanilla components don't have a built-in reactive render cycle, the best pattern is to use an `effect` inside `connectedCallback` to update the DOM, and clean it up in `disconnectedCallback`.

```TypeScript
import { Signal, effect } from 'avosignals';

const count = new Signal(0);

class VanillaCounter extends HTMLElement {
    private dispose?: () => void;
    private label = document.createElement('span');
    private button = document.createElement('button');

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.button.textContent = 'Increment';
        this.button.onclick = () => count.update(c => c + 1);
        
        // Initial layout
        this.shadowRoot?.append(this.label, this.button);
    }

    connectedCallback() {
        // Use 'effect' to bind the signal state to the DOM text.
        // This runs immediately and whenever 'count' changes.
        this.dispose = effect(() => {
            this.label.textContent = `Current count: ${count.get()} `;
        });
    }

    disconnectedCallback() {
        // ⚠️ Important: Always clean up effects when the element 
        // is removed from the DOM to prevent memory leaks.
        if (this.dispose) this.dispose();
    }
}

customElements.define('vanilla-counter', VanillaCounter);
```

# Advanced Architecture

### Memory Management (WeakRefs)

Unlike many other signal libraries, `Computed` nodes in avosignals hold weak references to their subscribers where possible. This means if you create a derived signal but stop referencing it in your application, JavaScript's Garbage Collector can clean it up, even if the source signal is still active. This prevents the common "detached listener" memory leaks found in observer patterns.

### Cycle Detection

`avosignals` maintains a stack of active consumers. If a computed value attempts to read itself during its own evaluation **(A -> B -> A)**, the library throws a descriptive error helping you identify the cycle immediately.

### Read/Write Consistency

To ensure unidirectional data flow, `avosignals` forbids writing to a `Signal` while a `Computed` value is currently being evaluated. This prevents side-effects from occurring during the "read" phase of your application loop.

# API Reference

`Signal<T>`

- `constructor(initial: T, name?: string)`
- `get(): T`: Returns current value and tracks dependency.
- `set(value: T)`: Updates value and notifies listeners.
- `update(fn: (prev: T) => T)`: Convenience method for updating based on previous value.

`Computed<T>`
- `constructor(fn: () => T, name?: string)`
- `get(): T`: Evaluates (if dirty) and returns the value.

`effect`
- `effect(fn: () => void | cleanupFn)`: Runs immediately and tracks dependencies. Returns a dispose function.

# License
MIT