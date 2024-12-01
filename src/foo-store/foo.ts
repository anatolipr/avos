type SubscriberReturnType = any | 'unsubscribe';

/**
 * Foo store
 */
export default class Foo<T> {

    public static UNSUBSCRIBE = 'unsubscribe';

    /** @private */
    private val?: T;
    /** @private */
    private pausedVal?: T;
    /** @private */
    private paused: boolean = false;
    /** @private */
    private listeners:{[k: string]: ((value: T, oldValue: T) => SubscriberReturnType)} = {};
    /** @private */
    private idx: number = 0;

    /**
     * @constructor
     * @param val initial value for the store
     * @param id identifier for the store allowing access to it via global._Foo_stores_
     */
    constructor(val?: T, id?: string) {
        this.val = val;
        let win: { [k: string]: any } | undefined = window || globalThis;
        if (id && win) {
            const storesWindowKey: any = '_Foo_stores_';
            window[storesWindowKey] = win[storesWindowKey] || {};
            win[storesWindowKey][id] = this;
        }
    }

    /**
     * set store value and publish it to all subscribers
     * @param val value to save in the store
     */
    public set(val: T) {
        let oldVal = this.val;
        this.val = val;
        if (!this.paused) {
            this.publish(<T>val, <T>oldVal);
        }
    }

    /** @private 
     * from Svelte's equality.js
    */
    private safeNotEquals(a: any, b: any): boolean {
        return a != a ? b == b
            : a !== b 
            || (a !== null && typeof a === 'object') 
            || typeof a === 'function';
    }

    public update(fun: (val: T) => T): void {
        this.set(fun(this.val as T))
    }

    /**
     * get store value
     */
    get(): T {
        return <T>this.val;
    }

    /**
     * pause all subscribers from triggering when you call set()
     */
    public pause() {
        this.paused = true;
        this.pausedVal = this.val;
    }

    /**
     * resume subscribers (including derived stores)
     * @param immediate should the un-pausing immediately trigger publish to all subscribers
     */
    public unpause(immediate: boolean = true) {
        this.paused = false;
        if (immediate) {
            this.publish(<T>this.val, <T>this.pausedVal);
        }
    }

    /**
     * derive a value based on few others
     * @param stores list of stores to subscribe to
     * @param fun function defining the logic of the derived value; takes also a second parameter - the store which it updates
     * @param immediate should the result store value be populated immediately, or when a change to source stores occur
     * @param logMessage log to print when source stores are unmounted
     */
    public static derive<M>(
        stores: Foo<any>[],
        fun: (values: any[], resultStore: Foo<M>) => M,
        immediate: boolean = true,
        logMessage?: string
    ): Foo<M> {
        const res: Foo<M> = new Foo();

        stores.forEach(store => {
            store.subscribe(
                () => {
                    const values: any[] = stores.map(store => store.get());
                    res.set(fun(values, res));
                },
                immediate,
                logMessage
            );
        });

        return res;
    }

    /**
     * derive a computed store based on this one
     * @param fun - function returning the derived value based on this store's new value
     * @param immediate - should the derived store get immediately or lazily updated. when false your derived will only update on next change
     * @param logMessage enables lifecycle log for subscribe / unsubscribe events and prints this message with each event. eg "main recipe list store"
     */
    public derive<M>(
        fun: (newValue: T, oldValue: T, resultStore: Foo<M>) => M,
        immediate: boolean = true,
        logMessage?: string
    ): Foo<M> {
        const res: Foo<M> = new Foo();

        this.subscribe(
            (newValue: T, oldValue: T) => {
                const v: M = fun(newValue, oldValue, res);
                res.set(v);
            },
            immediate,
            logMessage
        );

        return res;
    }

    /**
     * subscribe to this store updates - every time set() is called
     * @param listener function to be called - takes parameters value, oldValue.
     * unsubscribe() is called if it returns Foo.UNSUBSCRIBE
     * @param immediate should the listener function be called immediately
     * @param log a string to be logged when unsubscribing
     */
    public subscribe(
        listener: (value: T, oldValue: T) => SubscriberReturnType,
        immediate: boolean = true,
        log?: string
    ): () => void {
        this.idx++;
        const newIndex: string = this.idx.toString();
        this.listeners[newIndex.toString()] = listener;

        if (immediate) {
            this.callListener([newIndex, listener], <T>this.val, <T>undefined)
        }
        if (log)
            console.log('subscribing: %c' + log, 'color: yellow; background: black');


        return () => {
            if (log)
                console.log(
                    'unsubscribing: %c' + log,
                    'color: yellow; background: black'
                );

            this.unsubscribe(newIndex);
        };
    }

    /** @private */
    private unsubscribe(idx: string) {
        delete this.listeners[idx];
    }

    /**
     * publish new value to listeners
     * @private
     */
    private publish(newValue: T, oldVal: T): void {
        if (this.safeNotEquals(newValue, oldVal)) {
            Object.entries(this.listeners)
                .forEach(listener =>
                    this.callListener(listener, newValue, oldVal));
        }
    }

    /** @private */
    private callListener(listener: [string, (oldVal: T, newVal : T) => SubscriberReturnType], newValue: T, oldVal: T) {
        try {
            if (listener[1](newValue, oldVal) === Foo.UNSUBSCRIBE) {
                this.unsubscribe(listener[0])
            }
        } catch (e) {
            console.error('error calling listener', listener[1], e)
        }
    }
}
