import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue';

import Foo from './foo';

/**
 * Vue 3 ref wrapper for Foo
 * @param store store to get as Ref
 * @param logMessage enables lifecycle log for subscribe / unsubscribe events and prints this message with each event. eg "main recipe list store"
 */
export function storeAsRef<T>(
    store: Foo<T>,
    logMessage?: string
): Ref<T> {
    let state: Ref<T> = ref() as Ref<T>;

    let unsubscribe = store.subscribe(
        function (value: T) {
            if (Array.isArray(value)) {
                state.value = <T>[...value];
            } else if (typeof value === 'object') {
                state.value = <T>{ ...value };
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
