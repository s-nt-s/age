class FData {
  readonly kv: { [key: string]: string | number | (string | number)[] };
  constructor(kv:{ [key: string]: string | number | (string | number)[] }) {
    this.kv = Object.freeze(kv);
  }
  get(k: string) {
    return this.kv[k];
  }
  getNum(k: string) {
    const v = this.get(k);
    return (typeof v == "number")?v:NaN;
  }
  getStr(k: string) {
    const v = this.get(k);
    return (typeof v == "string")?v:'';
  }
  getArr(k: string, tp: string) {
    const v = this.get(k);
    if (!Array.isArray(v)) return [];
    for (let i=0; i<v.length; i++) {
      if (typeof v[i] != tp) return [];
    }
    return v;
  }
  getNumArr(k: string) {
    return this.getArr(k, "number") as number[];
  }
  getStrArr(k: string) {
    return this.getArr(k, "string") as string[];
  }
}

type HTMLNameElement = (HTMLSelectElement|HTMLInputElement|HTMLTextAreaElement);

export class Form {
  get form() {
    return document.forms[0];
  }

  protected __get<T extends HTMLElement>(type: new () => T, s: string) {
    const e = this.form.elements.namedItem(s);
    if (e==null) return null;
    return e instanceof type ? e : null;
  }
  protected __toVal(v: FormDataEntryValue) {
    const _s = v.toString().trim();
    if (_s.length == 0) return null;
    const _v = parseFloat(_s);
    if (!Number.isNaN(_v)) return _v;
    return _s;
  }

  get inputs(): HTMLNameElement[] {
    const arr:HTMLNameElement[] = Array.from(this.form.elements).flatMap((e) => {
      if (e.tagName == "SELECT") return <HTMLSelectElement>e;
      if (e.tagName == "INPUT") return <HTMLInputElement>e;
      if (e.tagName == "TEXTAREA") return <HTMLTextAreaElement>e;
      return [];
    });
    return arr.filter(e=>{
      if (e.name == null || e.name.length == 0) return false;
      return true;
    });
  }

  getData() {
    const obj: { [key: string]: string | number | (string | number)[] } = {};
    const isArr = this.inputs.flatMap(e=>{
      return ((e instanceof HTMLSelectElement) && e.multiple)?e.name:[];
    })
    Array.from(new FormData(this.form)).forEach(([k, _v]) => {
      const v = this.__toVal(_v);
      if (v == null) return;
      const pre = obj[k];
      if (pre == null) {
        obj[k] = isArr.includes(k)?[v]:v;
        return;
      }
      if (Array.isArray(pre)) {
        pre.push(v);
        obj[k] = pre;
        return;
      }
      obj[k] = [pre, v];
    });
    return new FData(obj);
  }

  getQuery() {
    const fd = new FormData(this.form);
    const arr = Array.from(fd).map(([k, v]) => [k, v.toString()]).filter(([_, v])=>v.length>0);
    return new URLSearchParams(arr).toString();
  }

  checkValidity(silent: boolean) {
    if (!this.form.checkValidity()) {
      if (silent !== true) this.form.reportValidity();
      return false;
    }
    return true;
  }
}
