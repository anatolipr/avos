import { getCurrentScope, onScopeDispose, ref } from 'vue';

/**
 * Vue 3 ref wrapper for Foo
 * @param {Foo<T>} store - store to get as Ref
 * @param {string} [logMessage] - enables lifecycle log for subscribe / unsubscribe events and prints this message with each event. eg "main recipe list store"
 * @returns {Ref<T>} - Ref object
 */
export function storeAsRef(store, logMessage) {
  let state = ref();

  let unsubscribe = store.subscribe(
    function (value) {
      if (Array.isArray(value)) {
        state.value = [...value];
      } else if (typeof value === 'object') {
        state.value = { ...value };
      } else {
        state.value = value;
      }
    },
    true,
    logMessage
  );

  getCurrentScope() && onScopeDispose(unsubscribe);

  return state;
}
