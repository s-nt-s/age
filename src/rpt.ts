import { sort, byId } from './lib/util'
import { AGE } from './lib/age'
import { DB } from "./lib/supabaseClient.ts";

type IdTxt = {id: string|number; txt: string};


function doOptions<T extends string|number|IdTxt>(id: string, arr: T[]) {
  let w = 0;
  const e = byId(HTMLElement, id)!;
  const toObj = (x: T):IdTxt => {
    if (typeof x == "string") return {id:x, txt:x};
    if (typeof x == "number") return {id:x, txt:x.toString()};
    return x;
  }
  arr.sort(sort).map(toObj).forEach(x=>{
    if (x.txt.length>w) w=x.txt.length;
    e.insertAdjacentHTML(
      "beforeend",
      `<option value="${x.id}">${x.txt}</option>`
    )
  });
  if (e.tagName=="SELECT") (<HTMLSelectElement>e).size=arr.length;
}
function doOptionsGroups(id: string, group: [IdTxt, IdTxt[]][]) {
  const otros: IdTxt[] = [];
  group = group.filter(([g, arr])=>{
    if (arr.length==0) return false;
    if (arr.length>1) return true;
    const x = arr[0];
    otros.push({
      id: x.id,
      txt: g.txt + ' - ' + x.txt
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
    size = size + arr.length;
    e.insertAdjacentHTML(
      "beforeend",
      `<optgroup id="${id}_${g.id}" label="${g.txt}"></option>`
    )
    doOptions(`${id}_${g.id}`, arr);
  });
  if (e.tagName=="SELECT") (<HTMLSelectElement>e).size=size;
}

const doMain = async function () {
  const [
    _,
    grupo,
    ministerio,
    pais,
    provincia,
    provision
  ] = await Promise.all([
    AGE.getFuentes(true),
    AGE.getGrupoNivel(),
    DB.get("ministerio"),
    DB.get("pais"),
    DB.get("provincia"),
    DB.get("provision")
  ]);
  const prv = provincia.flatMap(i=>{
    if (i.id>0) return [];
    return i.id
  })
  const localidad = await DB.selectTableWhere("localidad", "provincia", ...prv);
  const toIdTxt = <T extends IdTxt>(x:T):IdTxt => {return {id: x.id, txt: x.txt}};
  const lugar: [IdTxt, IdTxt[]][] = pais.map((p)=>{
    return [
      toIdTxt(p),
      provincia.flatMap((i)=>{
        if (i.pais!=p.id) return [];
        if (i.id>0) return [{id: i.id, txt: i.txt}];
        return localidad.flatMap(x=>x.provincia==i.id?toIdTxt(x):[]);
      })
    ]
  })
  const nivel:Set<number> = new Set();
  Object.values(grupo).forEach(g=>{
    g.nivel.forEach(n=>nivel.add(n))
  })
  doOptions("grupo", Object.keys(grupo));
  doOptions("nivel", [...nivel].sort());
  doOptions("organismo", ministerio);
  //doOptionsGroups("organismo", organismo);
  doOptionsGroups("lugar", lugar);
  doOptions("provision", provision);

  document.body.classList.add("loaded");
}

document.addEventListener("DOMContentLoaded", doMain);