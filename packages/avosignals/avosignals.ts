import type { LitElement } from "lit";

let __DEV__ = true; //TODO - add logic to detect debug query param

type Job = () => void;

type Unsubscribe = () => void;

interface Debuggable {
    _debugParent?: Watcher;
}

interface Watcher extends Debuggable {
    track(signal: Observable<unknown>): void;
}

function safe_not_equal(a: unknown, b: unknown) {
    return a != a 
        ? b == b 
        : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}


function isWeakRef(value: any): value is WeakRef<any> {
    return value && typeof value.deref === 'function';
}

abstract class Observable<T> {
    static #nextId = 0;

    #value: T;
    #previousValue: T | undefined;
    #subs = new Set<Job | WeakRef<Job>>();

    #id = Observable.#nextId++;
    name?: string;

    constructor(initial: T, name?: string) {
        this.#value = initial;
        this.#previousValue = initial;
        this.name = name;
    }

    protected _get(): T {
        if (Signal.activeConsumer) {
            Signal.activeConsumer.track(this);
        }
        return this.#value;
    }

    protected _set(next: T) {
        if (!safe_not_equal(next, this.#value)) return false;
        this.#previousValue = this.#value;
        this.#value = next;
        this._notify();
        return true;
    }

    subscribe(fn: Job, weak = false): Unsubscribe {
        let entry: Job | WeakRef<Job> = fn;
        if (weak) {
            entry = new WeakRef(fn);
        }
        this.#subs.add(entry);
        return () => this.#subs.delete(entry);
    }

    _notify() {
        const subs = [...this.#subs];

        for (const entry of subs) {
            let job: Job | undefined;

            if (isWeakRef(entry)) {
                job = entry.deref();
                // If the object is garbage collected, remove the dead link
                if (!job) {
                    this.#subs.delete(entry);
                    continue;
                }
            } else {
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

export class Signal<T> extends Observable<T> {
    static #stack: Watcher[] = [];

    constructor(initial: T, name?: string) {
        super(initial, name);
    }

    static get activeConsumer() {
        return this.#stack[this.#stack.length - 1];
    }

    static push(consumer: Watcher) {
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

    get(): T {
        return this._get();
    }

    set(value: T) {
        if (__DEV__ && Signal.activeConsumer) {
            throw new Error(
                `Signal write during reactive evaluation:\n` +
                `  writing ${this}\n` +
                `  while computing ${Signal.activeConsumer}`
            );
        }
        this._set(value);
    }

    update(fn: (current: T) => T) {
        this.set(fn(this.get()));
    }
}

export class Computed<T> extends Observable<T> implements Watcher {
    #fn: () => T;
    #dirty = true;
    #computing = false;
    #deps = new Map<Observable<unknown>, Unsubscribe>();
    _debugParent: Watcher | undefined;
    #weak;

    // 1. Create a stable, bound reference to the notification logic
    #notifyCallback = () => {
        if (this.#dirty) return;
        this.#dirty = true;
        this._notify();
    };

    constructor(fn: () => T, name?: string, options?: { weak?: boolean }) {
        super(undefined as T, name);
        this.#fn = fn;
        // Default to TRUE (Weak) for standard computeds to prevent leaks
        this.#weak = options?.weak ?? true;
    }

    track(signal: Observable<unknown>) {
        if (this.#deps.has(signal)) return;

        // 2. Subscribe using the STABLE callback and WEAK flag
        const unsub = signal.subscribe(this.#notifyCallback, this.#weak);

        this.#deps.set(signal, unsub);
    }

    dispose() {
        this.#cleanup();
    }

    #cleanup() {
        for (const unsub of this.#deps.values()) unsub();
        this.#deps.clear();
    }

    get() {
        if (Signal.activeConsumer) {
            Signal.activeConsumer.track(this);
        }

        if (!this.#dirty) return this._get();

        if (this.#computing) {
            throw new Error(
                `Cycle detected in ${this}\n` +
                `↳ while computing ${this._debugParent ?? 'root'}`
            );
        }

        this.#computing = true;
        this.#cleanup();

        Signal.push(this);
        try {
            const value = this.#fn();
            this._set(value);
        } finally {
            Signal.pop();
            this.#dirty = false;
            this.#computing = false;
        }

        return this._get();
    }

    override subscribe(fn: Job, weak = false): Unsubscribe {
        const unsub = super.subscribe(fn, weak);
        //ensure we don't affect tracking
        if (!Signal.activeConsumer) this.get();
        
        return unsub;
    }
}

export function effect(fn: () => (void | (() => void)), name?: string) {
    let cleanup: (() => void) | void;

    const computer = new Computed(() => {
        if (typeof cleanup === 'function') cleanup();
        cleanup = fn();
    }, name, { weak: false });

    const unsub = computer.subscribe(() => {
        computer.get();
    });

    computer.get();
    
    return () => {
        unsub();
        computer.dispose();
        if (typeof cleanup === 'function') cleanup();
    };
}

// Lit

export class SignalWatcher implements Watcher {
    #host: LitElement;
    #deps = new Map<Observable<unknown>, Unsubscribe>();
    _debugParent: Watcher | undefined;
    #active = false;

    constructor(host: LitElement) {
        this.#host = host;
        host.addController(this);
    }

    track(signal: Observable<unknown>) {
        if (this.#deps.has(signal)) return;
        
        this.#deps.set(
            signal,
            signal.subscribe(() => this.#host.requestUpdate())
        );
        
    }

    hostUpdate() {
        for (const unsub of this.#deps.values()) unsub();
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
        for (const unsub of this.#deps.values()) unsub();
        this.#deps.clear();
        // optional safety if the component disconnects mid-render
        if (this.#active) {
            Signal.pop();
            this.#active = false;
        }
    }
}