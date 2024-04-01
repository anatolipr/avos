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

/**
 * get epoch seconds
 * @returns current epoch seconds
 */
export function getCurrentEpoch(): number {
    return Math.floor(new Date().getTime() / 1000);
}

export function crop(s: string) {
    const matched = s?.match(/…|\.\.\./);

    if (matched) {
      return s.split(matched[0])[0] + '...'
    } else {
      return s;
    }
}

export async function copyToClipboard(input: string | null) {
  if (!input) return;

  const type = "text/plain";
  const blob = new Blob([input], { type });
  const data = [new ClipboardItem({ [type]: blob })];
  await navigator.clipboard.write(data);

  alert("Copied.");
}

export async function paste(): Promise<string> {
  return navigator.clipboard.readText()
}



export function saveFile(content: string, suggestedFileName: string = 'untitled', contentType: string = 'application/json') {
    const blob = new Blob([content], { type: contentType });

    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = suggestedFileName;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}


export async function readFile(): Promise<string> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';

        input.onchange = function() {
            const fileReader = new FileReader();

            fileReader.onload = function(event) {
                resolve(event.target!.result as string);
            };

            fileReader.onerror = function(error) {
                reject(error);
            };

            fileReader.readAsText((<HTMLInputElement>input).files![0]);
        };

        input.click();
    });
}
