import { Signal } from "./avosignals";
//TODO - function which returns JSON with possibly nested Signals resolved
export function singalToJSON(value) {
    const result = {};
    const val = value.get();
    if (Array.isArray(val)) {
        return val.map(item => {
            if (item instanceof Signal) {
                return singalToJSON(item);
            }
            else {
                return item;
            }
        });
    }
    else if (typeof val === 'object' && val !== null) {
        for (const key in val) {
            const item = val[key];
            if (item instanceof Signal) {
                result[key] = singalToJSON(item);
            }
            else {
                result[key] = item;
            }
        }
        return result;
    }
    else {
        return val;
    }
}
//# sourceMappingURL=avosignals-util.js.map