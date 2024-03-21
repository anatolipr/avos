import {getCurrentScope, onScopeDispose} from 'vue'

/**
 * Trigger updates to store
 * @param {*} vm vue instance
 * @param {Foo} store Foo store to subscribe to
 * @param {*} field on vue instance - needs to exist in data()
 * @param {*} logMessage optional mount / unmount log message
 */
export const updateFromStore = (vm, store, field, logMessage) => {
  let unsubscribe = store.subscribe(
    (nv) => vm.$set(vm, field, nv), true, logMessage)
  getCurrentScope() && onScopeDispose(unsubscribe)
}
