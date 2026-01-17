import { Signal, Computed } from './avosignals'

import { expect, test } from 'vitest'

test('Basic computed with single immediate signal dependency', () => {
    const signal = new Signal(0);

    const computed = new Computed(() => {
        return signal.get() + 1;
    });

    expect(computed.get()).toBe(1);

    signal.update(old => old + 1);
    expect(computed.get()).toBe(2);
});

test('Derived computed', () => {
    const signal = new Signal(0);

    const computed1 = new Computed(() => {
        return signal.get() + 1;
    });

    const computed2 = new Computed(() => {
        return computed1!.get() + 1;
    });

    expect(computed1.get()).toBe(1);
    expect(computed2.get()).toBe(2);
})

test('No zombie subscribers', () => {
    const count = new Signal(0);
    const double = new Computed(() => count.get() * 2);
    let effect = '';
    double.subscribe(() => effect = 'double changed');

    count.set(1);
    expect(effect).toBe('double changed');
})