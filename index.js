import Foo from './src/foo-store/js/foo.js'
import { updateFromStore } from './src/foo-store/js/foo-vue2.js'
import { asSvelteStore } from './src/foo-store/js/foo-svelte.js'
import { storeAsRef } from "./src/foo-store/js/foo-vue.js";

export { Foo, updateFromStore, asSvelteStore, storeAsRef };
