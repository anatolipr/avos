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
