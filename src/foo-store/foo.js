/**
 * Foo store
 */
export default class Foo {

    constructor(val, id) {
        this.val = val;
        this.pausedVal = undefined;
        this.paused = false;
        this.listeners = {};
        this.idx = 0;
        if (id) {
            const win = window || global;
            const storesWindowKey = '_Foo_stores_';
            window[storesWindowKey] = win[storesWindowKey] || {};
            win[storesWindowKey][id] = this;
        }
    }

    set(val) {
        let oldVal = this.val;
        this.val = val;
        if (!this.paused) {
            this.publish(val, oldVal);
        }
    }

    update(fun) {
        this.set(fun(this.val));
    }

    get() {
        return this.val;
    }

    pause() {
        this.paused = true;
        this.pausedVal = this.val;
    }

    unpause(immediate = true) {
        this.paused = false;
        if (immediate) {
            this.publish(this.val, this.pausedVal);
        }
    }

    static derive(stores, fun, immediate = true, log) {
        const res = new Foo();

        stores.forEach(store => {
            store.subscribe(
                () => {
                    const values = stores.map(store => store.get());
                    res.set(fun(values, res));
                },
                immediate,
                log
            );
        });

        return res;
    }

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

    subscribe(listener, immediate = true, log) {
        this.idx++;
        const newIndex = this.idx.toString();
        this.listeners[newIndex] = listener;

        if (immediate) {
            listener(this.val, undefined);
        }
        if (log)
            console.log('subscribing: %c' + log, 'color: yellow; background: black');


        return () => {
            if (log)
                console.log(
                    'unsubscribing: %c' + log,
                    'color: yellow; background: black'
                );

            delete this.listeners[newIndex];
        };
    }

    publish(newValue, oldVal) {
        Object.values(this.listeners)
            .forEach((listener) => {
                try {
                    listener(newValue, oldVal)
                } catch (e) {
                    console.error('error calling listener', listener)
                }
            });
    }
}
