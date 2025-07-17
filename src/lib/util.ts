import { TableName } from "./supabaseClient.ts";
import type { Tables } from "./database.types";

export function getDom(url: string): string {
  const urlObj = new URL(url);
  const dom = urlObj.hostname;
  return dom.replace(/^www\./, "");
}

export function toNum(s: unknown) {
  if (s == null) return null;
  if (typeof s === "number") return s;
  if (typeof s !== "string") return null;
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return n;
}

export function sort<T extends string|number|{txt:string}>(a: T, b: T): number {
  if (typeof a == "number" && typeof b == "number") {
    if (isNaN(a) && isNaN(b)) return 0;
    if (isNaN(a)) return -Infinity;
    if (isNaN(b)) return Infinity;
    return a-b;
  }
  if (typeof a == "string" && typeof b == "string") return a.toLowerCase().localeCompare(b.toLowerCase());
  if (typeof a == "object" && typeof b == "object") {
    if (("txt" in a) && ("txt" in b)) {
      if (("id" in a) && ("id" in b) && (typeof a.id == "number" && typeof b.id == "number")) {
        const c = sort(a.id, b.id);
        if ([Infinity, -Infinity].includes(c)) return c;
      }
      return sort(a.txt, b.txt);
    }
  }
  return 0;
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


export function byId<T extends HTMLElement>(type: new () => T, id: string, thrw?: boolean): T | null {
  const e = document.getElementById(id);
  if (e==null) {
    if (thrw) throw `${id} not exists`;
    return null;
  }
  if (e instanceof type) return e;
  if (thrw) throw `${id} is not a ${type}`;
  return null;
};

export function mapObject<T extends Record<string|number, any>, U>(
  obj: T,
  fn: (key: string|number, value: T[keyof T]) => U
): Record<string, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(key, value)]).filter(([_, v])=>v!=null)
  );
}
export function toTable<N extends TableName, T extends Tables<N>>(head: string[][], rows: T[], toRow: (i: T) => (string|number|null)[]) {
  const table = [
    "<table>",
    "<thead>"
  ];
  head.forEach(h=>{
    table.push("<tr>" + h.map(t=>/^<th/.test(t)?t:`<th>${t}</th>`).join("") + "</tr>")
  })
  table.push("</thead>");
  table.push("</tbody>");
  rows.forEach(r=>{
    const _row = toRow(r).map(x=>{
      if (x==null) return '<td></td>';
      if (typeof x == "string") {
        if (/^<td/.test(x)) return x;
        return '<td>'+x+'</td>';
      }
      return `<td style='text-align: right' title='${toString(x, 2)}'>${toString(x)}</td>`
    }).join('');
    table.push("<tr>" + _row + "</tr>")
  })
  table.push("</tbody>");
  table.push("</table>");
  return table;
}

export function executeWhen(
  condition: (tries: number) => boolean|null,
  action: () => void,
  seconds = 1
): void {
  let tries = 0;
  const timer = setInterval(() => {
    const ok = condition(++tries);
    console.log("executeWhen", tries, ok);
    if (ok === false) return;
    if (ok === null || ok === true) {
      clearInterval(timer);
    }
    if (ok === true) action();
  }, seconds*1000);
}