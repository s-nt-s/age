import { sort, byId, toString, toTable } from './lib/util'
import { AGE } from './lib/age'
import { DB } from "./lib/supabaseClient.ts";
import type { TableName } from './lib/supabaseClient'
import { Form } from "./lib/form";
import { MKQ, Q } from "./lib/Q";
import type { Tables } from "./lib/database.types";

const SPAIN = 724;
//const DEV_PROV = 28;
//const DEV_LOC = 94;

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
    const __getSubgrupo = () => {
      const s = fd.getStr("subgrupo");
      if (s.length>0) return [s];
      const g = fd.getStr("grupo");
      if (g.length==0) return [];
      const arr = getValsOptions(byId(HTMLSelectElement, "subgrupo", true)!).filter(x=>x.startsWith(g));
      return arr;
    }
    const obj = {
      region: fd.getStr("region"),
      lugar: __get("localidad") || __get("provincia") || __get("pais"),
      organismo: __get("unidad") || __get("centro") || __get("ministerio"),
      grupo:__getSubgrupo(),
      nivel: fd.getNum("nivel"),
      vacante: fd.getNum("vacante"),
      provision: fd.getStr("provision"),
      tipo: fd.getStr("tipo"),
    }
    return obj;
  }
  getMyQuery() {
    const arr = this.inputs.map(i=>{
      const v = i.value;
      if (v.length == 0) return null;
      if (getComputedStyle(i).display == 'none') return null;
      return [i.name, v];
    }).filter(x=>x!=null)
    return new URLSearchParams(arr).toString();
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
const getValsOptions = (e: HTMLSelectElement) => Array.from(e.options).map(e=>e.value);

function doOptions<T extends IdTxtLike>(id: string, options: T[], def?: string) {
  let w = 0;
  const e = byId(HTMLSelectElement, id)!;
  const v = e.value;
  e.innerHTML = '';
  const arr = options.sort(sort).map(toIdTxt);
  if (arr.length > 1 && !e.multiple) {
    arr.unshift({id: '', txt: '-- Cualquiera --'});
  }
  arr.forEach(x=>{
    if (x.txt.length>w) w=x.txt.length;
    const val =(typeof x.id == "number" && isNaN(x.id))?'':(x.table?`${x.table}_${x.id}`:x.id.toString());
    e.insertAdjacentHTML(
      "beforeend",
     `<option value="${val}">${x.txt}</option>`
    )
  });
  const vls = getValsOptions(e);
  if (v.length>0 && vls.includes(v)) e.value = v;
  else if (def && vls.includes(def)) e.value = def.toString();
  const isSingle = e.options.length == 1;
  const isEmpty = e.options.length == 0;
  e.disabled = isEmpty;
  e.style.display = isSingle || isEmpty?'none':'';
}

const doMain = async function () {
  const [
    _,
    subgrupo,
    ministerio,
    provision,
    tipo,
    provision_tipo,
  ] = await Promise.all([
    AGE.getFuentes(true),
    AGE.getGrupoNivel(),
    DB.get("ministerio"),
    DB.get("provision"),
    DB.dct("tipo_puesto"),
    DB.get("provision_tipo")
  ]);
  const nivel:Set<number> = new Set();
  const grupo: string[] = [];
  Object.values(subgrupo).forEach(g=>{
    const gid = g.id.charAt(0);
    if (!grupo.includes(gid)) grupo.push(gid);
    g.nivel.forEach(n=>nivel.add(n))
  })
  if (provision_tipo.some(pt=>pt.provision==null)) {
    provision.unshift({id: 'NULL', txt: '-- Sin información --'})
  }
  doOptions("region", [
    {id: 'ES', txt: 'España'},
    {id: 'EX', txt: 'Extranjero'}
  ], Q.getStr("region")??'ES');
  doOptions("ministerio", ministerio);
  doOptions("grupo", ([{id:'NULL', txt:'Sin grupo'}] as any[]).concat(grupo.map(toIdTxt)));
  doOptions("provision", provision);
  doOptions("vacante", [
    {id: 1, txt: 'Vacante'},
    {id: 0, txt: 'Ocupado'}
  ])

  new SelectTree(
    "region",
    {
    "pais": async (...vals: string[]) => {
      const parent = vals[0];
      if (parent.length==0) return [];
      if (parent=="ES") return await DB.selectTableWhere("pais", "id", SPAIN);
      return await DB.selectTableWhere("pais", "id", "!"+SPAIN);
    },
    "provincia": async (...vals: string[]) => {
      const parent = parseInt(vals[0]);
      if (isNaN(parent)) return [];
      const arr = await DB.selectTableWhere("provincia", "pais", parent);
      return arr;
    },
    "localidad": async (...vals: string[]) => {
      const parent = parseInt(vals[0]);
      if (isNaN(parent)) return [];
      const arr = await DB.selectTableWhere("localidad", "provincia", parent);
      return arr;
    },
  })
  new SelectTree(
    "ministerio",
    {
    "centro": async (...vals: string[]) => {
      const parent = parseInt(vals[0]);
      if (isNaN(parent)) return [];
      const arr = await DB.selectTableWhere("centro", "ministerio", parent);
      return arr;
    },
    "unidad": async (...vals: string[]) => {
      const parent = parseInt(vals[0]);
      if (isNaN(parent)) return [];
      const arr = await DB.selectTableWhere("unidad", "centro", parent);
      return arr;
    },
  })
  new SelectTree(
    "grupo",
    {
    "subgrupo": async (...vals: string[]) => {
      const parent = vals[0];
      if (parent.length == 0) return [];
      const arr = Object.values(subgrupo).flatMap(g=>{
        if (!g.id.startsWith(parent)) return [];
        return {id: g.id, txt: g.id}
      })
      return arr;
    },
    "nivel": async (...vals: string[]) => {
      const parent = vals[0];
      const g = subgrupo[parent];
      if (g!=null) {
        return g.nivel.map(toIdTxt);
      }
      const grandp = vals[1];
      if (grandp == null || grandp.length==0) return [];
      const nvls: Set<number> = new Set();
      Object.values(subgrupo).forEach(g=>{
        if (g.id.startsWith(grandp)) g.nivel.forEach(n=>nvls.add(n));
      })
      return [...nvls].sort().map(toIdTxt);
    },
  })
  new SelectTree(
    "provision",
    {
    "tipo": async (...vals: string[]) => {
      const parent = vals[0];
      if (parent.length == 0) return [];
      const arr = provision_tipo.flatMap(pt=>{
        if ((pt.provision??'NULL')!=parent) return [];
        if (pt.tipo==null) return [{id: 'NULL', txt:'-- Sin información --'}];
        return [tipo[pt.tipo]];
      })
      if (arr.length==1) return [];
      return arr;
    },
  })

  F.inputs.forEach((e) => {
    const v = Q.get(e.name);
    const old = e.value;
    if (typeof v == "string") e.value = v;
    if (typeof v == "number") e.value = v.toString();
    if (old != e.value) e.dispatchEvent(new Event("change"));
  });

  document.forms[0].addEventListener("submit", (e) => {
    doSearch();
    e.preventDefault();
    return false;
  })
  document.body.classList.add("loaded");
}


class SelectTree {
  private root: HTMLSelectElement;
  private selects: {[key: string]: (...parent:string[])=>Promise<IdTxt[]>};
  constructor(rootid: string, selects: {[key: string]: (...parent:string[])=>Promise<IdTxt[]>}) {
    this.root = byId(HTMLSelectElement, rootid, true)!;
    this.selects = selects;
    const walk = [this.root];
    Object.entries(this.selects).forEach(([id, fn], i, arr)=> {
      const me = byId(HTMLSelectElement, id, true)!;
      const qVal = (()=>{
        const v = Q.get(me.name);
        if (typeof v == "number") return v.toString();
        if (typeof v == "string") return v;
        return '';
      })();
      if (i>0) {
        walk.push(byId(HTMLSelectElement, arr[i-1][0], true)!)
      }
      const parents = walk.slice();
      walk[walk.length-1].addEventListener("change", async() => {
        const bak = getValsOptions(me).join("\n");
        const oldParent = me.getAttribute("data-parent")??'';
        const pId = parents.map(x=>x.value).join("____");
        if (pId == oldParent) return;
        me.setAttribute("data-val-in-"+oldParent, me.value);
        me.setAttribute("data-parent", pId)
        const arr = pId.length==0?[]:await fn(...parents.map(p=>p.value).reverse());
        const oldVal = me.getAttribute("data-val-in-"+pId)??qVal;
        const val = oldVal.length?oldVal:me.value;
        doOptions(me.id, arr);
        if (me.value!=val || bak!=getValsOptions(me).join("\n")) {
          if (getValsOptions(me).includes(val)) me.value = val;
          me.dispatchEvent(new Event("change"));
        }
      })
    });
    this.root.dispatchEvent(new Event("change"));
  }
}


function getPrm(fd: ReturnType<MyForm["getMyData"]>, count: boolean) {
  const log:string[] = [];
  let prm = DB.from("rpt").select('*', count?{ count: 'exact', head: true }:undefined);
  const _w = (f: string, obj: unknown, oposite?: boolean) => {
    if (obj==null) return prm;
    const arr = (Array.isArray(obj)?obj:[obj]).filter(x=>{
      if (typeof x == "number") return !isNaN(x);
      if (typeof x == "string") return x.length>0;
      return true;
    })
    if (arr.length==0) return prm;
    if (arr.length==1) {
      const val =  arr[0];
      if (oposite) {
        log.push(`${f}!=${val}`);
        return prm.neq(f,val)
      }
      log.push(`${f}=${val}`);
      return prm.eq(f, val)
    }
    if (oposite) {
      log.push(`${f} not in (${arr.join(', ')})`);
      return prm.not(f, "in", arr);
    }
    log.push(`${f} in (${arr.join(', ')})`);
    return prm.in(f, arr)
  }
  if (fd.lugar) _w(fd.lugar[0], [fd.lugar[1]]);
  else if (fd.region=="EX") prm =_w("pais", SPAIN, true);
  if (fd.organismo) prm =_w(fd.organismo[0], [fd.organismo[1]]);
  prm = _w("grupo", fd.grupo);
  prm = _w("nivel", fd.nivel);
  prm = _w("vacante", fd.vacante);
  prm = _w("provision", fd.provision);
  prm = _w("tipo", fd.tipo);
  return {
    log: log,
    prm: prm
  };
}


async function doSearch() {
  const div = byId(HTMLDivElement, "result", true)!;
  new MKQ(F.getMyQuery()).redirect(true);
  if (!F.checkValidity(true)) return false;
  div.innerHTML = `
    <p class="loading">
      <span class="loader"></span>Buscando...
    </p>
  `;
  const fd = F.getMyData();
  console.log(fd);
  const {log, prm} = getPrm(fd, true);
  const count = DB.get_data(
    'rpt['+log.join(',')+']',
    await prm
  ) as number;
  const MAX_COUNT = 3000;
  if (count>=MAX_COUNT) {
    div.innerHTML = `<p>Demasiados resultados (${toString(count)}). Refina la búsqueda para dejarlo en menos de ${toString(MAX_COUNT)}.</p>`
    return;
  }
  if (count==0) {
    div.innerHTML = `<p>No hay resultados</p>`;
    return;
  }
  const rpt = DB.get_data(
    'rpt['+log.join(',')+']',
    await getPrm(fd, false).prm
  ) as Tables<"rpt">[];

  const ids: {[key: string]: Set<number|string>} = {}
  const __add = (k: string, v:string|number|null, kk?: string) => {
    if (v==null) return;
    if (typeof v=="number" && (isNaN(v) || v<0)) return;
    if (typeof v=="string" && v.length==0) return;
    if (kk==undefined) kk = k;
    if (!(kk in ids)) ids[kk]=new Set();
    ids[kk].add(v);
  }
  rpt.forEach(r=>{
    __add("pais", r.pais);
    __add("provincia", r.provincia);
    __add("localidad", r.localidad);
    __add("ministerio", r.ministerio);
    __add("centro", r.centro);
    __add("unidad", r.unidad);
    __add("tipo", r.tipo, 'tipo_puesto');
    __add("provision", r.provision);
    __add("cargo", r.cargo);
  })

  const __dct = async (k: TableName) => {
    const vls = ids[k];
    if (vls == null || vls.size == 0) return {};
    const obj = await DB.dct(k, ...<Set<number>>vls);
    return Object.fromEntries(
      Object.entries(obj).map(([k, v])=>[k, ("txt" in v)?v.txt:''])
    );
  }

  const [
    pais,
    provincia,
    localidad,
    ministerio,
    centro,
    unidad,
    tipo,
    provision,
    cargo
  ]:{[key: string]: string}[] = await Promise.all([
    __dct("pais"),
    __dct("provincia"),
    __dct("localidad"),
    __dct("ministerio"),
    __dct("centro"),
    __dct("unidad"),
    __dct("tipo_puesto"),
    __dct("provision"),
    __dct("cargo"),
  ]);

  const brJoin = (...args: (string|null)[]) => {
    const arr: string[] = []
    args.forEach((a)=> {
      if (a==null) return;
      if (arr.length>0 && arr[arr.length-1]==a) return;
      arr.push(a);
    })
    if (arr.length==0) return '';
    return arr.join("<br/>");
  }

  const table = toTable(
    [[
      "<abbr title='Vacante'>V</abbr>",
      "ID",
      "<abbr title='Grupo'>Gr</abbr>",
      "<abbr title='Nivel'>Nv</abbr>",
      "<abbr title='Sueldo bruto anual'>€</abbr>",
      "Organismo",
      "Lugar",
      "<abbr title='Información adiciona'>Info</abbr>",
    ]],
    rpt,
    (i: Tables<"rpt">) => [
      i.vacante?"<abbr title='Vacante'>V</abbr>": "",
      `<td style='text-align: right'><a href='../puesto/?${i.id}' target='_blank'>${i.id}</a></td>`,
      i.grupo,
      i.nivel,
      i.sueldo,
      brJoin(ministerio[i.ministerio??''], centro[i.centro??''], unidad[i.unidad??'']),
      brJoin(pais[i.pais??''], provincia[i.provincia??''], localidad[i.localidad??'']),
      brJoin(cargo[i.cargo??''], tipo[i.tipo??''], provision[i.provision??'']),
    ]
  );
  div.innerHTML = table.join('\n');
}

document.addEventListener("DOMContentLoaded", doMain);
