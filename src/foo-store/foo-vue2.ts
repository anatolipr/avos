import {getCurrentScope, onScopeDispose} from 'vue'
import Foo from "./foo";

/**
 * Trigger updates to store
 * @param vm vue instance
 * @param store Foo store to subscribe to
 * @param {*} field on vue instance - needs to exist in data()
 * @param {*} logMessage optional mount / unmount log message
 */
export const updateFromStore = (vm: any, store: Foo<any>, field: string, logMessage: string): void => {
    let unsubscribe: () => void = store.subscribe(
        (nv) => vm.$set(vm, field, nv), true, logMessage)
    getCurrentScope() && onScopeDispose(unsubscribe)
}
