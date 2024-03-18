import { onDestroy } from 'svelte';
import Foo from './foo.js'
import { writable, type Writable } from 'svelte/store'

export function asSvelteStore<T>(store: Foo<T>, log?: string): Writable<T> {
    const res: Writable<T> = writable();
    const unsubscribe = store.subscribe(res.set, true, log)
    onDestroy(unsubscribe)
    return res;
}
