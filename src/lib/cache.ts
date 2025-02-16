export function asyncCache<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    const cacheMap = new Map<string, ReturnType<T>>();

    async function x(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
        const key = JSON.stringify(args);
        if (cacheMap.has(key)) return cacheMap.get(key)!;
        const result: ReturnType<T> = await fn.apply(this, args);
        cacheMap.set(key, result);
        return result;
    }
    return x as T;
}
export function cache<T extends (...args: any[]) => any>(fn: T): T {
    const cacheMap = new Map<string, ReturnType<T>>();
    function x(this: any, ...args: Parameters<T>): ReturnType<T> {
        const key = JSON.stringify(args);
        if (cacheMap.has(key)) return cacheMap.get(key)!;
        const result: ReturnType<T> = fn.apply(this, args);
        cacheMap.set(key, result);
        return result;
    };
    return x as T;
}
