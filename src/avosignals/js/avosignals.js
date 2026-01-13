let __DEV__ = true; //TODO - add logic to detect debug query param
function safe_not_equal(a, b) {
    return a != a
        ? b == b
        : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function isWeakRef(value) {
    return value && typeof value.deref === 'function';
}
class Observable {
    static #nextId = 0;
    #value;
    #previousValue;
    #subs = new Set();
    #id = Observable.#nextId++;
    name;
    constructor(initial, name) {
        this.#value = initial;
        this.#previousValue = initial;
        this.name = name;
    }
    _get() {
        if (Signal.activeConsumer) {
            Signal.activeConsumer.track(this);
        }
        return this.#value;
    }
    _set(next) {
        if (!safe_not_equal(next, this.#value))
            return false;
        this.#previousValue = this.#value;
        this.#value = next;
        this._notify();
        return true;
    }
    subscribe(fn, weak = false) {
        let entry = fn;
        if (weak) {
            entry = new WeakRef(fn);
        }
        this.#subs.add(entry);
        return () => this.#subs.delete(entry);
    }
    _notify() {
        const subs = [...this.#subs];
        for (const entry of subs) {
            let job;
            if (isWeakRef(entry)) {
                job = entry.deref();
                // If the object is garbage collected, remove the dead link
                if (!job) {
                    this.#subs.delete(entry);
                    continue;
                }
            }
            else {
                job = entry;
            }
            job();
        }
    }
    get id() {
        return this.#id;
    }
    get previousValue() {
        return this.#previousValue;
    }
    toString() {
        return this.name
            ? `${this.constructor.name}(${this.name})`
            : `${this.constructor.name}#${this.id}`;
    }
}
export class Signal extends Observable {
    static #stack = [];
    constructor(initial, name) {
        super(initial, name);
    }
    static get activeConsumer() {
        return this.#stack[this.#stack.length - 1];
    }
    static push(consumer) {
        if (__DEV__) {
            consumer._debugParent = this.activeConsumer;
        }
        this.#stack.push(consumer);
    }
    static pop() {
        if (__DEV__ && !this.#stack.length) {
            throw new Error('Signal.pop() without matching push()');
        }
        this.#stack.pop();
    }
    get() {
        return this._get();
    }
    set(value) {
        if (__DEV__ && Signal.activeConsumer) {
            throw new Error(`Signal write during reactive evaluation:\n` +
                `  writing ${this}\n` +
                `  while computing ${Signal.activeConsumer}`);
        }
        this._set(value);
    }
    update(fn) {
        this.set(fn(this.get()));
    }
}
export class Computed extends Observable {
    #fn;
    #dirty = true;
    #computing = false;
    #deps = new Map();
    _debugParent;
    #weak;
    // 1. Create a stable, bound reference to the notification logic
    #notifyCallback = () => {
        if (this.#dirty)
            return;
        this.#dirty = true;
        this._notify();
    };
    constructor(fn, name, options) {
        super(undefined, name);
        this.#fn = fn;
        // Default to TRUE (Weak) for standard computeds to prevent leaks
        this.#weak = options?.weak ?? true;
    }
    track(signal) {
        if (this.#deps.has(signal))
            return;
        // 2. Subscribe using the STABLE callback and WEAK flag
        const unsub = signal.subscribe(this.#notifyCallback, this.#weak);
        this.#deps.set(signal, unsub);
    }
    dispose() {
        this.#cleanup();
    }
    #cleanup() {
        for (const unsub of this.#deps.values())
            unsub();
        this.#deps.clear();
    }
    get() {
        if (Signal.activeConsumer) {
            Signal.activeConsumer.track(this);
        }
        if (!this.#dirty)
            return this._get();
        if (this.#computing) {
            throw new Error(`Cycle detected in ${this}\n` +
                `↳ while computing ${this._debugParent ?? 'root'}`);
        }
        this.#computing = true;
        this.#cleanup();
        Signal.push(this);
        try {
            const value = this.#fn();
            this._set(value);
        }
        finally {
            Signal.pop();
            this.#dirty = false;
            this.#computing = false;
        }
        return this._get();
    }
    subscribe(fn, weak = false) {
        const unsub = super.subscribe(fn, weak);
        //ensure we don't affect tracking
        if (!Signal.activeConsumer)
            this.get();
        return unsub;
    }
}
export function effect(fn, name) {
    let cleanup;
    const computer = new Computed(() => {
        if (typeof cleanup === 'function')
            cleanup();
        cleanup = fn();
    }, name, { weak: false });
    const unsub = computer.subscribe(() => {
        computer.get();
    });
    computer.get();
    return () => {
        unsub();
        computer.dispose();
        if (typeof cleanup === 'function')
            cleanup();
    };
}
// Lit
export class SignalWatcher {
    #host;
    #deps = new Map();
    _debugParent;
    #active = false;
    constructor(host) {
        this.#host = host;
        host.addController(this);
    }
    track(signal) {
        if (this.#deps.has(signal))
            return;
        this.#deps.set(signal, signal.subscribe(() => this.#host.requestUpdate()));
    }
    hostUpdate() {
        for (const unsub of this.#deps.values())
            unsub();
        this.#deps.clear();
        Signal.push(this);
        this.#active = true;
    }
    hostUpdated() {
        if (this.#active) {
            Signal.pop();
            this.#active = false;
        }
    }
    hostDisconnected() {
        for (const unsub of this.#deps.values())
            unsub();
        this.#deps.clear();
        // optional safety if the component disconnects mid-render
        if (this.#active) {
            Signal.pop();
            this.#active = false;
        }
    }
}
//# sourceMappingURL=avosignals.js.map