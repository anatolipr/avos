import { getCurrentScope, onScopeDispose, ref, Ref, watch } from 'vue';

import Foo from './foo';

/**
 * Vue 3 ref wrapper for Foo
 * @param store store to get as Ref
 * @param logMessage enables lifecycle log for subscribe / unsubscribe events and prints this message with each event. eg "main recipe list store"
 * @param readonly define if the ref will support writing - eg. this ref can be used for v-model
 */
export function storeAsRef<T>(
    store: Foo<T>,
    logMessage?: string,
    readonly: boolean = false
): Ref<T> {
    let state: Ref<T> = ref() as Ref<T>;
    let updating = false;
    let unsubscribe = store.subscribe(
        (value: T) => {
            if (updating) return;
            if (Array.isArray(value)) {
                state.value = <T>[...value];
            } else if (typeof value === 'object') {
                state.value = <T>{ ...value };
            }
            state.value = value;
        },
        true,
        logMessage
    );

    if (! readonly) {
        watch(state.value, (nv: any) => {
            updating = true;
            store.set(nv);
            updating = false;
        }, {immediate: true})
    }

    getCurrentScope() && onScopeDispose(unsubscribe);

    return state;
}
