import { Form } from './lib/form'
import { sort, toString, byId } from './lib/util'
import { AGE } from './lib/age'
import { DB, TableName } from "./lib/supabaseClient.ts";
import type { Tables } from "./lib/database.types";

type IdTxt = {id: string|number; txt: string};


function doOptions<T extends string|number|IdTxt>(id: string, arr: T[]) {
  let w = 0;
  const e = byId(HTMLSelectElement, id)!;
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
    nivel,
    ministerio,
    centro,
    unidad,
    pais,
    provincia,
    localidad,
    provision
  ] = await Promise.all([
    AGE.getFuentes(true),
    DB.all("grupo"),
    DB.all("nivel"),
    DB.get("ministerio"),
    DB.get("centro"),
    DB.get("unidad"),
    DB.get("pais"),
    DB.get("provincia"),
    DB.get("localidad"),
    DB.get("provision")
  ]);

  const toIdTxt = <T extends IdTxt>(x:T):IdTxt => {return {id: x.id, txt: x.txt}};
  const organismo:[IdTxt, IdTxt[]][] = ministerio.map((p)=>{
    return [
      toIdTxt(p),
      centro.flatMap((i)=>{
        if (i.ministerio!=p.id) return [];
        if (i.id>0) return toIdTxt(i);
        return unidad.flatMap(x=>x.centro==i.id?toIdTxt(x):[]);
      })
    ]
  })
  const lugar:[IdTxt, IdTxt[]][] = pais.map((p)=>{
    return [
      toIdTxt(p),
      provincia.flatMap((i)=>{
        if (i.pais!=p.id) return [];
        if (i.id>0) return [{id: i.id, txt: i.txt}];
        return localidad.flatMap(x=>x.provincia==i.id?toIdTxt(x):[]);
      })
    ]
  })

  doOptions("grupo", grupo.map(n=>n.id));
  doOptions("nivel", nivel.map(n=>n.id));
  doOptionsGroups("organismo", organismo);
  doOptionsGroups("lugar", lugar);
  doOptions("provision", provision);

  document.body.classList.remove("loading");
}
