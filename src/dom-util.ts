/**
 * get type of an object
 * @param obj
 * @returns "array", "object", "undefined", "null", etc
 */
function getType(obj: any) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}
