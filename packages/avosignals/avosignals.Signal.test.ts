import { Signal } from './avosignals'

import { expect, test } from 'vitest'

test('Signal basic set / and get', () => {
    const signal = new Signal(0);
    expect(signal.get()).toBe(0);
    signal.set(1);
    expect(signal.get()).toBe(1);
});

test('Signal basic set / and get using value', () => {
    const signal = new Signal(0);
    let derived = signal.value;
    signal.subscribe(() => {
        derived = signal.value;
    });
    expect(derived).toBe(0);

    signal.value = 1;
    expect(derived).toBe(1);
});


test('Signal basic subscribe with immediate effect', () => {
    const signal = new Signal(0);
    let derived = signal.get();
    signal.subscribe(() => {
        derived = signal.get();
    });
    expect(derived).toBe(0);

    signal.set(1);
    expect(derived).toBe(1);
});

test('Ensure unsubscribe', () => {
    const signal = new Signal(0);
    let derived = signal.get();
    const unsub = signal.subscribe(() => {
        derived = signal.get();
    });
    expect(derived).toBe(0);

    signal.set(1);
    expect(derived).toBe(1);

    unsub();

    signal.set(2);
    expect(derived).toBe(1);
});

test('test subscriber not immediately fired', () => {
    const signal = new Signal(0);
    let effect = -1;
    signal.subscribe(() => {
        effect = signal.get();
    });

    expect(effect).toBe(-1);

    signal.set(2);
    expect(effect).toBe(2);
})