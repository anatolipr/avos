import Foo from "./foo";


export async function setFooAsync<T>(foo: Foo<T>, setter: () => Promise<T>): void {
    const result = await setter()
    foo.set(result)
}
