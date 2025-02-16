import { AGE } from "./lib/age";
import { DB } from "./lib/supabaseClient.ts";
import { Q } from "./lib/Q.ts";
import { Nomina } from './lib/nomina'
import { toString } from './lib/util'

const BASE_URL = import.meta.env.BASE_URL;

function getGrupos(p: Awaited<ReturnType<typeof AGE.getFullPuesto>>) {
  if (p == null) return [];
  if (p.grupo.length > 1) {
    const g = Q.getStr("grupo");
    if (p.grupo.includes(g)) return [g];
  }
  return p.grupo;
}

function addDd(id: string, ...args: (number|string|{id: string|number, txt:string}|null)[]) {
    const dt = document.getElementById(id);
    if (dt==null) return;
    args.reverse().forEach(x=>{
        if (x==null) return;
        if (typeof x == "string") x = link(x);
        else if (typeof x == "object") x = x.id+' '+link(x.txt)
        dt.insertAdjacentHTML("afterend", `<dd>${x}</dd>`);
    })
}

function link(txt: string) {
    if (txt!='¿?') return txt;
    return "<a target='_blank' href='https://github.com/s-nt-s/age-db/issues/1'>¿?</a>";
}


function showMain() {
    document.querySelectorAll("dd").forEach(dd=>{
        if ((dd.textContent??'').trim().length==0) dd.remove();
    })
    document.querySelectorAll("dt").forEach(dt=>{
      if (!dt.nextElementSibling || dt.nextElementSibling.tagName !== "DD") {
        dt.remove();
      }
    })
    document.body.classList.add("loaded");
  }

document.addEventListener("DOMContentLoaded", async () => {
  const id = Q.getNum("puesto");
  const p = await AGE.getFullPuesto(id);
  if (p == null) throw `Puesto ${id} no encontrado`;
  const [html, g, n] = await Promise.all([
    fetch(`${BASE_URL}puesto.html`).then(r=>r.text()),
    DB.get("grupo", ...getGrupos(p)),
    DB.safe_get_one("nivel", p.nivel),
  ]);
  document.title = (() => {
    const t = `Puesto ${id}`;
    const gr = (() => {
      if (g.length == 0) return null;
      return g.map(x=>x.id).join('')
    })();
    if (g == null && n == null) return t;
    return t + " (" + [gr, n?.id].filter((x) => x != null).join(" ") + ")";
  })();
  document.getElementById("main")!.innerHTML = html;
  addDd("puesto", p.id);
  if (g.length==1) {
    const gr = g[0];
    addDd("grupo", gr.id);
    const bruto = Nomina.getBrutoAnual(gr.base, gr.extra_base, (n?n.destino:0), p.especifico??0)
    addDd("sueldo", `<a title='${toString(bruto, 2)} €/año' href='../sueldo/?${id}&${gr.id}'>${toString(bruto)} €/año</a>`);
  } else {
    addDd("grupo", ...g.map(gr=>{
        const bruto = Nomina.getBrutoAnual(gr.base, gr.extra_base, (n?n.destino:0), p.especifico??0)
        return `<a href="?${id}&${gr.id}">${gr.id}</a> (<a title='${toString(bruto, 2)} €/año' href='../sueldo/?${id}&${gr.id}'>${toString(bruto)} €/año</a>)`
    }));
  }

  addDd("nivel", p.nivel);
  addDd("nivel", p.vacante?"Si":"No");
  addDd("cargo", p.cargo);
  addDd("tipo", p.tipo);
  addDd("provision", p.provision);
  addDd("formacion", p.formacion);
  addDd("lugar", p.lugar);
  addDd("administracion", p.administracion, ...p.organizacion.map(x=>x.txt))
  addDd("cuerpo", ...p.cuerpo);
  addDd("observacion", ...p.observacion);
  addDd("titulacion", ...p.titulacion);

  showMain();
});
