import { onDestroy } from 'svelte';
import { writable } from 'svelte/store'

export function asSvelteStore(store, log) {
  const res = writable();
  const unsubscribe = store.subscribe(res.set, true, log)
  onDestroy(unsubscribe)
  return res;
}
