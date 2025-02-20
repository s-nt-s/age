import { sort, byId } from './lib/util'
import { AGE } from './lib/age'
import { DB } from "./lib/supabaseClient.ts";
import type { TableName } from './lib/supabaseClient'
import { Form } from "./lib/form";

const DEF_PAIS = 724;
const DEV_PROV = 28;
const DEV_LOC = 94;

class MyForm extends Form {
  get error() {
    return document.querySelector("#resultado p.error") as HTMLParagraphElement;
  }
  get msg() {
    return document.querySelector("#resultado div.msg") as HTMLDivElement;
  }
  get link() {
    return document.querySelector("#rpt a") as HTMLAnchorElement;
  }
  get grupo() {
    return this.__get(HTMLSelectElement, "grupo")!;
  }
  get nivel() {
    return this.__get(HTMLSelectElement, "nivel")!;
  }
  get provision() {
    return this.__get(HTMLInputElement, "provision")!;
  }
  get tipo() {
    return this.__get(HTMLInputElement, "tipo")!;
  }
  get pais() {
    return this.__get(HTMLSelectElement, "pais")!;
  }
  get provincia() {
    return this.__get(HTMLSelectElement, "provincia")!;
  }
  get localidad() {
    return this.__get(HTMLSelectElement, "localidad")!;
  }
  get ministerio() {
    return this.__get(HTMLSelectElement, "ministerio")!;
  }
  get centro() {
    return this.__get(HTMLSelectElement, "centro")!;
  }
  get unidad() {
    return this.__get(HTMLSelectElement, "unidad")!;
  }
  getMyData() {
    const fd = this.getData();
    const __get = (id: string) => {
      const v = fd.getNum(id);
      if (isNaN(v) || v<0) return null;
      return [id, v] as [string, number];
    }
    return {
      grupo: fd.getStrArr("grupo"),
      nivel: fd.getNumArr("nivel"),
      provision: fd.getStrArr("provision"),
      tipo: fd.getStrArr("tipo"),
      lugar: __get("localidad") || __get("provincia") || __get("pais"),
      organismo: __get("unidad") || __get("centro") || __get("ministerio"),
    }
  }
}

const F = new MyForm();

type IdTxt = {id: string|number; txt: string; table?:TableName, [key: string]: any;};
type IdTxtLike = string|number|IdTxt;
const toIdTxt = (x: IdTxtLike):IdTxt => {
  if (typeof x == "string") return {id:x, txt:x};
  if (typeof x == "number") return {id:isNaN(x)?'':x.toString(), txt:x.toString()};
  return x;
}
function doOptions<T extends IdTxtLike>(id: string, arr: T[], def?: string) {
  let w = 0;
  const e = byId(HTMLSelectElement, id)!;
  const v = e.value;
  e.innerHTML = '';
  arr.sort(sort).map(toIdTxt).forEach(x=>{
    if (x.txt.length>w) w=x.txt.length;
    const val =(typeof x.id == "number" && isNaN(x.id))?'':(x.table?`${x.table}_${x.id}`:x.id.toString());
    e.insertAdjacentHTML(
      "beforeend",
     `<option value="${val}">${x.txt}</option>`
    )
  });
  const vls = Array.from(e.options).map(e=>e.value);
  if (v.length>0 && vls.includes(v)) e.value = v;
  else if (def && vls.includes(def)) e.value = def.toString();
  const isSingle = e.options.length == 1;
  const isEmpty = e.options.length == 0;
  e.disabled = isEmpty;
  e.style.display = isSingle || isEmpty?'none':'';
}
function doOptionsGroups(id: string, group: [IdTxt, IdTxt[]][]) {
  const otros: IdTxt[] = [];
  group = group.filter(([g, arr])=>{
    if (arr.length==0) return false;
    if (arr.length>1) return true;
    const x = arr[0];
    otros.push({
      id: x.id,
      txt: g.txt + ' - ' + x.txt,
      table: x.table
    })
    return false;
  }).sort((a, b)=> sort(a[0], b[0]));

  if (otros.length>0) group.push([
    {id:"otros", txt:"Otros"},
    otros
  ])
  let size = group.length;
  const e = byId(HTMLSelectElement, id)!;
  group.forEach(([g, arr])=>{
    const gid = g.table?`${g.table}_${g.id}`:`${id}_${g.id}`;
    size = size + arr.length;
    e.insertAdjacentHTML(
      "beforeend",
      `<optgroup id="${gid}" label="${g.txt}"></option>`
    )
    doOptions(gid, arr);
  });
  if (e.tagName=="SELECT" && (<HTMLSelectElement>e).multiple) (<HTMLSelectElement>e).size=size;
}

const doMain = async function () {
  const [
    _,
    subgrupo,
    ministerio,
    pais,
    provision,
    tipo
  ] = await Promise.all([
    AGE.getFuentes(true),
    AGE.getGrupoNivel(),
    DB.get("ministerio"),
    DB.get("pais"),
    DB.get("provision"),
    DB.get("tipo_puesto")
  ]);
  const nivel:Set<number> = new Set();
  const grupo: string[] = [];
  Object.values(subgrupo).forEach(g=>{
    const gid = g.id.charAt(0);
    if (!grupo.includes(gid)) grupo.push(gid);
    g.nivel.forEach(n=>nivel.add(n))
  })
  ministerio.unshift({id:NaN, txt:'Todos'})
  doOptions("pais", pais, DEF_PAIS.toString());
  doOptions("ministerio", ministerio);
  doOptions("grupo", ([{id:'NULL', txt:'Sin grupo'}] as any[]).concat(grupo.map(toIdTxt)));
  //doOptions("nivel", [...nivel].sort());
  doOptions("provision", provision);
  doOptions("tipo", tipo);

    /*
  document.querySelectorAll("select").forEach(e=>{
    if (e.options.length==0) return e.remove();
    if (e.multiple) e.size=3;
  })
    */

  F.inputs.forEach(e=>e.addEventListener("change", doSynch));

  new SelectTree(
    "pais",
    {
    "provincia": async (idparent: string) => {
      const parent = parseInt(idparent);
      const arr = await DB.selectTableWhere("provincia", "pais", parent);
      if (arr.length>1) {
        arr.unshift({id: NaN, txt:'Todo el territorio', pais: parent});
      }
      return arr;
    },
    "localidad": async (idparent: string) => {
      const parent = parseInt(idparent);
      const arr = await DB.selectTableWhere("localidad", "provincia", parent);
      if (arr.length>1) {
        arr.unshift({id: NaN, txt:'Todo el territorio', provincia: parent, localidad: NaN});
      }
      return arr;
    },
  })
  new SelectTree(
    "ministerio",
    {
    "centro": async (idparent: string) => {
      const parent = parseInt(idparent);
      const arr = await DB.selectTableWhere("centro", "ministerio", parent);
      if (arr.length>1) {
        arr.unshift({id: NaN, txt:'Cualquiera', ministerio: parent});
      }
      return arr;
    },
    "unidad": async (idparent: string) => {
      const parent = parseInt(idparent);
      const arr = await DB.selectTableWhere("unidad", "centro", parent);
      if (arr.length>1) {
        arr.unshift({id: NaN, txt:'Cualquiera', centro: parent, localidad: NaN});
      }
      return arr;
    },
  })
  new SelectTree(
    "grupo",
    {
    "subgrupo": async (parent: string) => {
      const arr = Object.values(subgrupo).flatMap(g=>{
        if (!g.id.startsWith(parent)) return [];
        return {id: g.id, txt: g.id}
      })
      if (arr.length>1) {
        arr.unshift({id: '', txt: 'Todos'})
      }
      return arr;
    },
    "nivel": async (parent: number|string) => {
      const g = subgrupo[parent];
      if (g == null) return [];
      return g.nivel.map(n=>{return {id: n, txt: n.toString()}});
    },
  })

  document.forms[0].addEventListener("submit", (e) => {
    doSearch();
    e.preventDefault();
    return false;
  })
  document.body.classList.add("loaded");
}


class SelectTree {
  private root: HTMLSelectElement;
  private selects: {[key: string]: (parent:string)=>Promise<IdTxt[]>};
  constructor(rootid: string, selects: {[key: string]: (parent:string)=>Promise<IdTxt[]>}) {
    this.root = byId(HTMLSelectElement, rootid, true)!;
    this.selects = selects;
    Object.entries(this.selects).forEach(([id, fn], i, arr)=> {
      const me = byId(HTMLSelectElement, id, true)!;
      const parent = i==0?this.root:byId(HTMLSelectElement, arr[i-1][0], true)!;
      parent.addEventListener("change", async() => {
        const meLength = me.options.length;
        const oldParent = me.getAttribute("data-parent")??'';
        const pId = parent.value;
        if (pId == oldParent) return;
        me.setAttribute("data-val-in-"+oldParent, me.value);
        me.setAttribute("data-parent", pId.toString())
        const arr = pId.length==0?[]:await fn(pId);
        const oldVal = me.getAttribute("data-val-in-"+pId)??'';
        const val = oldVal.length?oldVal:me.value;
        doOptions(me.id, arr);
        if (me.value!=val || meLength!=me.options.length) {
          me.value = val;
          me.dispatchEvent(new Event("change"));
        }
      })
    });
    this.root.dispatchEvent(new Event("change"));
  }
}


async function doSynch() {


}

async function doSearch() {
  if (!F.checkValidity(true)) return false;
  const fd = F.getMyData();
  console.log(fd);
  let prm = DB.from("rpt").select();
  const _w = (f: string, arr: any[]) => {
    if (arr.length==0) return prm;
    if (arr.length==1) return prm.eq(f, arr[0])
    return prm.in(f, arr)
  }
  prm = _w("grupo", fd.grupo);
  prm = _w("nivel", fd.nivel);
  prm = _w("tipo", fd.tipo);
  prm = _w("provision", fd.provision);
  if (fd.lugar) _w(fd.lugar[0], [fd.lugar[1]]);
  if (fd.organismo) _w(fd.organismo[0], [fd.organismo[1]]);
  DB.get_data(
    `rpt`,
    await prm
  );
}

document.addEventListener("DOMContentLoaded", doMain);
