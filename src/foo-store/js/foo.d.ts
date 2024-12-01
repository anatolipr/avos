type SubscriberReturnType = any | 'unsubscribe';
/**
 * Foo store
 */
export default class Foo<T> {
    static UNSUBSCRIBE: string;
    /** @private */
    private val?;
    /** @private */
    private pausedVal?;
    /** @private */
    private paused;
    /** @private */
    private listeners;
    /** @private */
    private idx;
    /**
     * @constructor
     * @param val initial value for the store
     * @param id identifier for the store allowing access to it via global._Foo_stores_
     */
    constructor(val?: T, id?: string);
    /**
     * set store value and publish it to all subscribers
     * @param val value to save in the store
     */
    set(val: T): void;
    /** @private
     * from Svelte's equality.js
    */
    private safeNotEquals;
    update(fun: (val: T) => T): void;
    /**
     * get store value
     */
    get(): T;
    /**
     * pause all subscribers from triggering when you call set()
     */
    pause(): void;
    /**
     * resume subscribers (including derived stores)
     * @param immediate should the un-pausing immediately trigger publish to all subscribers
     */
    unpause(immediate?: boolean): void;
    /**
     * derive a value based on few others
     * @param stores list of stores to subscribe to
     * @param fun function defining the logic of the derived value; takes also a second parameter - the store which it updates
     * @param immediate should the result store value be populated immediately, or when a change to source stores occur
     * @param logMessage log to print when source stores are unmounted
     */
    static derive<M>(stores: Foo<any>[], fun: (values: any[], resultStore: Foo<M>) => M, immediate?: boolean, logMessage?: string): Foo<M>;
    /**
     * derive a computed store based on this one
     * @param fun - function returning the derived value based on this store's new value
     * @param immediate - should the derived store get immediately or lazily updated. when false your derived will only update on next change
     * @param logMessage enables lifecycle log for subscribe / unsubscribe events and prints this message with each event. eg "main recipe list store"
     */
    derive<M>(fun: (newValue: T, oldValue: T, resultStore: Foo<M>) => M, immediate?: boolean, logMessage?: string): Foo<M>;
    /**
     * subscribe to this store updates - every time set() is called
     * @param listener function to be called - takes parameters value, oldValue.
     * unsubscribe() is called if it returns Foo.UNSUBSCRIBE
     * @param immediate should the listener function be called immediately
     * @param log a string to be logged when unsubscribing
     */
    subscribe(listener: (value: T, oldValue: T) => SubscriberReturnType, immediate?: boolean, log?: string): () => void;
    /** @private */
    private unsubscribe;
    /**
     * publish new value to listeners
     * @private
     */
    private publish;
    /** @private */
    private callListener;
}
export {};
