/**
 * Slice an array in sub-arrays with specific size
 * @param array - array to slice
 * @param sliceSize - how many elements will be in a slice
 */
export function sliceToSubArrays<T>(array: T[], sliceSize: number): T[][] {
    if (sliceSize >= array.length) {
        return [array];
    }
    const re: T[][] = [];
    for (let i = 0; i < array.length; i += sliceSize) {
        re.push(array.slice(i, i + sliceSize));
    }
    return re;
}

/**
 * Returns a random integer from [0 - number]. Useful to pick a random element of an array
 * @param number - range for the number
 */
export function randomNumber(number: number): number {
    return Math.floor(Math.random() * number)
}

/**
 * debounce frequent calls until wait time s reached
 * @param callback
 * @param wait
 */
export const debounce = (callback: Function, wait = 300): ((...args: any[]) => void) => {
    let timeout: ReturnType<typeof setTimeout>;

    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), wait);
    };
};


/**
 * get an item for n-th index assuming that we loop through the items if n > items.length
 * @param items - a list to pick from
 * @param n - some index
 */
export function nthItem<T>(items: T[], n: number): T {
    return items[ n % items.length ];
}
