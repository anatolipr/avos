import { test, expect, vi, afterAll } from 'vitest';
import Foo from '../../src/foo-store/foo';

global.window = <any>{};

test('store create', () => {
    expect(new Foo('sss').get()).toBe('sss');
    expect(new Foo().get()).toBeUndefined();
});

test('store registered on window', () => {
    new Foo('value', 'foo');
    let win: { [k: string]: any } | undefined = window || global;
    expect(win['_Foo_stores_']['foo']).toBeDefined();
    expect(win['_Foo_stores_']['foo'].get()).toBe('value');

});

test('store set get', () => {
    const foo = new Foo();
    expect(foo.get()).toBeUndefined();

    foo.set('xyz');
    expect(foo.get()).toBe('xyz');
});

test('single store derived', () => {
    const foo: Foo<string> = new Foo();
    const fooLen: Foo<number> = foo.derive((val) => val?.length);
    expect(fooLen.get()).toBe(undefined);
    foo.set('123');
    expect(fooLen.get()).toBe(3);
});

test('test subscribe', () => {
    const foo: Foo<string> = new Foo('current');
    let reactive: string = ''
    let reactiveBefore: string = '';
    foo.subscribe((newValue: string, oldValue: string) => {
        reactive = newValue;
        reactiveBefore = oldValue;
    })
    foo.set('new')
    expect(reactive).toBe('new')
    expect(reactiveBefore).toBe('current')
});

test('test derived with condition', () => {
    //todo - come up with a better test

    const foo: Foo<string> = new Foo('one');

    const fooLen: Foo<number> = foo.derive((v, _o, s) => v.length < 5 ? v.length : s.get())

    expect(fooLen.get()).toBe(foo.get().length)

    foo.set(foo.get() + 'x')
    expect(foo.get()).toBe('onex')

    expect(fooLen.get()).toBe(foo.get().length)

    foo.set(foo.get() + 'x')
    expect(fooLen.get()).toBe(4)

})

test('multi derived', () => {

    const flag: Foo<boolean> = new Foo(false);
    const foo: Foo<string> = new Foo('one');

    const derived: Foo<string> = Foo.derive([flag, foo], ([flagValue, fooValue]) => {
        console.log(flagValue, fooValue)
        if (flagValue) {
            return fooValue + 'X'
        } else {
            return fooValue
        }
    })

    expect(derived.get()).toBe('one')
    flag.set(true)
    expect(derived.get()).toStrictEqual('oneX')

})

test('test pause unpause', () => {
    const foo: Foo<number> = new Foo(1);

    let deriverd: Foo<number> = foo.derive(v => v);

    expect(deriverd.get()).toBe(1);

    foo.pause();

    foo.set(2);

    expect(deriverd.get()).toBe(1);

    foo.unpause(false);

    expect(deriverd.get()).toBe(1);

    foo.set(3);

    expect(deriverd.get()).toBe(3);

    foo.pause();

    foo.set(4);

    expect(deriverd.get()).toBe(3);

    foo.unpause()

    expect(deriverd.get()).toBe(4);

})


test('console logging', () => {
    const foo: Foo<number> = new Foo(1);
    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    let unsubscribe = foo.subscribe(() => {}, true, "foo log");

    afterAll(() => {
        consoleMock.mockReset();
    });

    foo.set(2);
    expect(consoleMock).toHaveBeenCalledOnce();

    unsubscribe()
    expect(consoleMock).toHaveBeenCalledTimes(2)

})

test('test unsubscribe', () => {
    const foo: Foo<number> = new Foo(1);
    let calls = 0;
    let unsubscribe = foo.subscribe(() => calls++);

    expect(calls).toBe(1);

    foo.set(2)

    expect(calls).toBe(2);

    unsubscribe();

    foo.set(3)
    expect(calls).toBe(2);
    foo.set(4)
    expect(calls).toBe(2);
    //...

})
