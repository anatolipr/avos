import {debounce, nthItem, randomNumber, sliceToSubArrays, 
    getCurrentEpoch, crop} from "./util.js";

import {expect, test} from "vitest";


test('randomNumber', ()=> {
    expect(randomNumber(5)).toBeLessThanOrEqual(5)
})

test('sliceToSubArrays', () => {
    expect(sliceToSubArrays([1,2,3,4], 20)).toStrictEqual([[1,2,3,4]])
    expect(sliceToSubArrays([1,2,3,4], 2)).toStrictEqual([[1,2], [3,4]])
    expect(sliceToSubArrays([1,2,3,4], 3)).toStrictEqual([[1,2,3], [4]])
})

test('debounnce', () => {

    let a: number = 0;
    debounce(() => {
        a = 100
    }, 200)

    debounce(() => {
        a = 200
    }, 200)

    setTimeout(() => {
        expect(a).toStrictEqual(0)
    }, 100)

    setTimeout(() => {
        expect(a).toStrictEqual(200)
    }, 500)


})

test('nthItem', () => {
    expect(nthItem(['one','two','three'], 0)).toBe('one')
    expect(nthItem(['one','two','three'], 1)).toBe('two')
    expect(nthItem(['one','two','three'], 2)).toBe('three')
    expect(nthItem(['one','two','three'], 3)).toBe('one')
    expect(nthItem(['one','two','three'], 4)).toBe('two')
})

test('crop', () => {

    expect(crop(''))
    .toBe('')

    expect(crop('abc'))
    .toBe('abc')

    expect(crop('abc ... 123\nfoo'))
    .toBe('abc ...')

    expect(crop('abc … 123\nfoo'))
    .toBe('abc ...')
    
  });
  
  test('epo', () => {
    expect(getCurrentEpoch())
    .toBe(Math.floor(new Date().getTime() / 1000))
  })