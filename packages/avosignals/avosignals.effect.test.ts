import { Signal, effect } from './avosignals'

import { expect, test } from 'vitest'

test('test simple effect', () => {
    const signal = new Signal(0);

    let val: number = -1;
    effect(() => {
        val = signal.get()
    });
    expect(val).toBe(0);
    
    signal.set(2);
    expect(val).toBe(2);
});

test('test multiple signals effect', () => {
    const signal1 = new Signal(0);
    const signal2 = new Signal(0);
    let val: number = -1;

    effect(() => {
        val = signal1.get() + signal2.get();
    });

    expect(val).toBe(0);
    signal1.set(1);
    expect(val).toBe(1);
    signal2.set(1);
    expect(val).toBe(2);
    signal1.set(2);
    signal2.set(2);
    expect(val).toBe(4);
});

//cleanup function
test('test dispose effect function', () => {
    let message = '';
    const userId = new Signal(1);

    const disposeEffect = effect(() => {
        message = `Logged in user is ${userId.get()}`;
        return () => {
            message = 'Logged out'
        }
    });
    expect(message).toBe('Logged in user is 1');
    disposeEffect();

    expect(message).toBe('Logged out');
});