export function getDom(url: string): string {
  const urlObj = new URL(url);
  const dom = urlObj.hostname;
  return dom.replace(/^www\./, "");
}

export function cache<T extends (...args: unknown[]) => unknown>(
  target: unknown,
  key: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const cacheMap = new Map<string, unknown>();

  descriptor.value = function (...args: unknown[]) {
    const cacheKey = JSON.stringify(args);
    if (cacheMap.has(cacheKey)) return cacheMap.get(cacheKey);

    const result = originalMethod.apply(this, args);
    cacheMap.set(cacheKey, result);
    return result;
  };

  return descriptor;
}

export function cacheAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  target: unknown,
  key: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const cacheMap = new Map<string, unknown>();

  descriptor.value = async function (...args: unknown[]) {
    const cacheKey = JSON.stringify(args);
    if (cacheMap.has(cacheKey)) return cacheMap.get(cacheKey);

    const result = await originalMethod.apply(this, args);
    cacheMap.set(cacheKey, result);
    return result;
  };

  return descriptor;
}
