import {test, expect} from "vitest";
import {getContrastColor} from "../src/color-util";

test('getContrastColor', () => {
    expect(getContrastColor('#000000')).toBe('white')
    expect(getContrastColor('#ffffff')).toBe('black')
})
