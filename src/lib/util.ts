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

export function toNum(s: unknown) {
  if (s == null) return null;
  if (typeof s === "number") return s;
  if (typeof s !== "string") return null;
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return n;
}


export function toString(n: number, dec?: number) {
  if (dec == null) dec = 0;
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    useGrouping: true
  });
}

export function toElement(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.firstElementChild as HTMLElement;
}