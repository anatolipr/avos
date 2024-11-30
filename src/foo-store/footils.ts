import Foo from "./foo";


export async function setFooAsync<T>(foo: Foo<T>, setter: () => Promise<T>): Promise<void> {
    const result = await setter()
    foo.set(result)
}
