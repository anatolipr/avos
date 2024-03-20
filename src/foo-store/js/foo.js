/**
 * Foo store
 */
export default class Foo {
    /**
     * @constructor
     * @param {T} val initial value for the store
     * @param {string} id identifier for the store allowing access to it via global._Foo_stores_
     */
    constructor(val, id) {
        /** @private */
        this.val = val;
        /** @private */
        this.pausedVal = undefined;
        /** @private */
        this.paused = false;
        /** @private */
        this.listeners = {};
        /** @private */
        this.idx = 0;

        let win = window || global;
        if (id && win) {
            const storesWindowKey = '_Foo_stores_';
            window[storesWindowKey] = win[storesWindowKey] || {};
            win[storesWindowKey][id] = this;
        }
    }

    /**
     * Set store value and publish it to all subscribers
     * @param {T} val value to save in the store
     */
    set(val) {
        let oldVal = this.val;
        this.val = val;
        if (!this.paused) {
            this.publish(val, oldVal);
        }
    }

    /**
     * Update store value by applying a function to the current value
     * @param {(val: T) => T} fun Function to update the value
     */
    update(fun) {
        this.set(fun(this.val));
    }

    /**
     * Get store value
     * @returns {T} Current value of the store
     */
    get() {
        return this.val;
    }

    /**
     * Pause all subscribers from triggering when set() is called
     */
    pause() {
        this.paused = true;
        this.pausedVal = this.val;
    }

    /**
     * Resume subscribers (including derived stores)
     * @param {boolean} immediate Should the unpausing immediately trigger publish to all subscribers
     */
    unpause(immediate = true) {
        this.paused = false;
        if (immediate) {
            this.publish(this.val, this.pausedVal);
        }
    }

    /**
     * Derive a value based on few others
     * @param {Foo<any>[]} stores List of stores to subscribe to
     * @param {(values: any[], resultStore: Foo<M>) => M} fun Function defining the logic of the derived value
     * @param {boolean} [immediate=true] Should the result store value be populated immediately
     * @param {string} [logMessage] Log message to print when source stores are unmounted
     * @returns {Foo<M>} Derived store
     */
    static derive(stores, fun, immediate = true, logMessage) {
        const res = new Foo();

        stores.forEach(store => {
            store.subscribe(
              () => {
                  const values = stores.map(store => store.get());
                  res.set(fun(values, res));
              },
              immediate,
              logMessage
            );
        });

        return res;
    }

    /**
     * Derive a computed store based on this one
     * @param {(newValue: T, oldValue: T, resultStore: Foo<M>) => M} fun Function returning the derived value based on this store's new value
     * @param {boolean} [immediate=true] Should the derived store get immediately or lazily updated
     * @param {string} [logMessage] Enables lifecycle log for subscribe / unsubscribe events and prints this message with each event
     * @returns {Foo<M>} Derived store
     */
    derive(fun, immediate = true, logMessage) {
        const res = new Foo();

        this.subscribe(
          (newValue, oldValue) => {
              const v = fun(newValue, oldValue, res);
              res.set(v);
          },
          immediate,
          logMessage
        );

        return res;
    }

    /**
     * Subscribe to this store updates - every time set() is called
     * @param {(value: T, oldValue: T) => 'unsubscribe' | void} listener Function to be called
     * @param {boolean} [immediate=true] Should the listener function be called immediately
     * @param {string} [log] Log message to be logged when unsubscribing
     * @returns {() => void} Unsubscribe function
     */
    subscribe(listener, immediate = true, log) {
        this.idx++;
        const newIndex = this.idx.toString();
        this.listeners[newIndex] = listener;

        if (immediate) {
            this.callListener([newIndex, listener], this.val, undefined);
        }
        if (log) {
            console.log('subscribing: %c' + log, 'color: yellow; background: black');
        }

        return () => {
            if (log) {
                console.log('unsubscribing: %c' + log, 'color: yellow; background: black');
            }

            this.unsubscribe(newIndex);
        };
    }

    /** @private */
    unsubscribe(idx) {
        delete this.listeners[idx];
    }

    /** @private */
    publish(newValue, oldVal) {
        Object.entries(this.listeners).forEach(listener =>
          this.callListener(listener, newValue, oldVal));
    }

    /** @private */
    callListener(listener, newValue, oldVal) {
        try {
            if (listener[1](newValue, oldVal) === 'unsubscribe') {
                this.unsubscribe(listener[0]);
            }
        } catch (e) {
            console.error('error calling listener', listener[1], e);
        }
    }
}
