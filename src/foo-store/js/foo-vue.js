import { getCurrentScope, onScopeDispose, ref, watch } from 'vue';

/**
 * Vue 3 ref wrapper for Foo
 * @param {Foo<T>} store Store to get as Ref
 * @param {string} [logMessage] Enables lifecycle log for subscribe / unsubscribe events and prints this message with each event. eg "main recipe list store"
 * @param {boolean} [readonly=false] Define if the ref will support writing - eg. this ref can be used for v-model
 * @template T
 * @returns {Ref<T>} Ref object
 */
export function storeAsRef(store, logMessage, readonly = false) {
  let state = ref();
  let updating = false;
  let unsubscribe = store.subscribe(
    (value) => {
      if (updating) return;
      if (Array.isArray(value)) {
        state.value = [...value];
      } else if (typeof value === 'object') {
        state.value = { ...value };
      }
      state.value = value;
    },
    true,
    logMessage
  );

  if (!readonly) {
    watch(state.value, (nv) => {
      updating = true;
      store.set(nv);
      updating = false;
    }, { immediate: true });
  }

  getCurrentScope() && onScopeDispose(unsubscribe);

  return state;
}
