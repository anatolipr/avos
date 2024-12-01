/**
 * Foo store
 */
export default class Foo {
    static UNSUBSCRIBE = 'unsubscribe';
    /** @private */
    val;
    /** @private */
    pausedVal;
    /** @private */
    paused = false;
    /** @private */
    listeners = {};
    /** @private */
    idx = 0;
    /**
     * @constructor
     * @param val initial value for the store
     * @param id identifier for the store allowing access to it via global._Foo_stores_
     */
    constructor(val, id) {
        this.val = val;
        let win = window || globalThis;
        if (id && win) {
            const storesWindowKey = '_Foo_stores_';
            window[storesWindowKey] = win[storesWindowKey] || {};
            win[storesWindowKey][id] = this;
        }
    }
    /**
     * set store value and publish it to all subscribers
     * @param val value to save in the store
     */
    set(val) {
        let oldVal = this.val;
        this.val = val;
        if (!this.paused) {
            this.publish(val, oldVal);
        }
    }
    /** @private
     * from Svelte's equality.js
    */
    safeNotEquals(a, b) {
        return a != a ? b == b
            : a !== b
                || (a !== null && typeof a === 'object')
                || typeof a === 'function';
    }
    update(fun) {
        this.set(fun(this.val));
    }
    /**
     * get store value
     */
    get() {
        return this.val;
    }
    /**
     * pause all subscribers from triggering when you call set()
     */
    pause() {
        this.paused = true;
        this.pausedVal = this.val;
    }
    /**
     * resume subscribers (including derived stores)
     * @param immediate should the un-pausing immediately trigger publish to all subscribers
     */
    unpause(immediate = true) {
        this.paused = false;
        if (immediate) {
            this.publish(this.val, this.pausedVal);
        }
    }
    /**
     * derive a value based on few others
     * @param stores list of stores to subscribe to
     * @param fun function defining the logic of the derived value; takes also a second parameter - the store which it updates
     * @param immediate should the result store value be populated immediately, or when a change to source stores occur
     * @param logMessage log to print when source stores are unmounted
     */
    static derive(stores, fun, immediate = true, logMessage) {
        const res = new Foo();
        stores.forEach(store => {
            store.subscribe(() => {
                const values = stores.map(store => store.get());
                res.set(fun(values, res));
            }, immediate, logMessage);
        });
        return res;
    }
    /**
     * derive a computed store based on this one
     * @param fun - function returning the derived value based on this store's new value
     * @param immediate - should the derived store get immediately or lazily updated. when false your derived will only update on next change
     * @param logMessage enables lifecycle log for subscribe / unsubscribe events and prints this message with each event. eg "main recipe list store"
     */
    derive(fun, immediate = true, logMessage) {
        const res = new Foo();
        this.subscribe((newValue, oldValue) => {
            const v = fun(newValue, oldValue, res);
            res.set(v);
        }, immediate, logMessage);
        return res;
    }
    /**
     * subscribe to this store updates - every time set() is called
     * @param listener function to be called - takes parameters value, oldValue.
     * unsubscribe() is called if it returns Foo.UNSUBSCRIBE
     * @param immediate should the listener function be called immediately
     * @param log a string to be logged when unsubscribing
     */
    subscribe(listener, immediate = true, log) {
        this.idx++;
        const newIndex = this.idx.toString();
        this.listeners[newIndex.toString()] = listener;
        if (immediate) {
            this.callListener([newIndex, listener], this.val, undefined);
        }
        if (log)
            console.log('subscribing: %c' + log, 'color: yellow; background: black');
        return () => {
            if (log)
                console.log('unsubscribing: %c' + log, 'color: yellow; background: black');
            this.unsubscribe(newIndex);
        };
    }
    /** @private */
    unsubscribe(idx) {
        delete this.listeners[idx];
    }
    /**
     * publish new value to listeners
     * @private
     */
    publish(newValue, oldVal) {
        if (this.safeNotEquals(newValue, oldVal)) {
            Object.entries(this.listeners)
                .forEach(listener => this.callListener(listener, newValue, oldVal));
        }
    }
    /** @private */
    callListener(listener, newValue, oldVal) {
        try {
            if (listener[1](newValue, oldVal) === Foo.UNSUBSCRIBE) {
                this.unsubscribe(listener[0]);
            }
        }
        catch (e) {
            console.error('error calling listener', listener[1], e);
        }
    }
}
