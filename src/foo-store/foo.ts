/**
 * Foo store
 */
export default class Foo<T> {

    private val?: T;
    private pausedVal?: T;
    private paused: boolean = false;
    private listeners: ((value: T, oldValue: T) => void)[] = [];

    /**
     * @constructor
     * @param val initial value for the store
     * @param id identifier for the store allowing access to it via global._Foo_stores_
     */
    constructor(val?: T, id?: string) {
        this.val = val;
        let win: { [k: string]: any } | undefined = window || global;
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

    /**
     * get store value
     */
    get(): T {
        return <T>this.val;
    }

    /**
     * pause all subscribers from triggering when we you call set()
     */
    public pause() {
        this.paused = true;
        this.pausedVal = this.val;
    }

    /**
     * resume subscribers (including derived stores)
     * @param immediate should the unpausing immediately trigger publish to all subscribers
     */
    public unpause(immediate: boolean = true) {
        this.paused = false;
        if (immediate) {
            this.publish(<T>this.val, <T>this.pausedVal);
        }
    }

    /**
     * derive a value based on few others
     */
    public static derive<M>(
        stores: Foo<any>[],
        fun: (values: any[], resultStore: Foo<M>) => M,
        immediate: boolean = true,
        log?: string
    ): Foo<M> {
        const res: Foo<M> = new Foo();

        stores.forEach(store => {
            store.subscribe(
                () => {
                    const values: any[] = stores.map(store => store.get());
                    res.set(fun(values, res));
                },
                immediate,
                log
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
     * subscribe to this store updates - ever time set() is called
     */
    public subscribe(
        listener: (value: T, oldValue: T) => void,
        immediate: boolean = true,
        log?: string
    ): () => void {
        this.listeners = [...this.listeners, listener];
        if (immediate) {
            listener(<T>this.val, <T>undefined);
        }
        if (log)
            console.log('subscribing: %c' + log, 'color: yellow; background: black');

        return () => {
            if (log)
                console.log(
                    'unsubscribing: %c' + log,
                    'color: yellow; background: black'
                );
            this.listeners.splice(this.listeners.length - 1, 1);
        };
    }

    /**
     * publish new value to listeners
     */
    private publish(newValue: T, oldVal: T): void {
        this.listeners.forEach((listener) => listener(newValue, oldVal));
    }
}
