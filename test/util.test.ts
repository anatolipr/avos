import {randomNumber} from "../src/util.js";

import {expect, test} from "vitest";


test('randomNumber', ()=> {
    expect(randomNumber(5)).toBeLessThanOrEqual(5)
})
