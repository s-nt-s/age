import { toString } from "./lib/util";
import { Form } from "./lib/form";
import { AGE } from "./lib/age";
import { Nomina, Ingreso } from "./lib/nomina";
import { MKQ, Q } from "./lib/Q";

const CONFIG = {
  grupo: null! as Awaited<ReturnType<typeof AGE.getGrupoNivel>>,
  nivel: null! as Awaited<ReturnType<typeof AGE.getNiveles>>,
};

class MyForm extends Form {
  get error() {
    return document.querySelector("#resultado p.error") as HTMLParagraphElement;
  }
  get msg() {
    return document.querySelector("#resultado div.msg") as HTMLDivElement;
  }
  get link() {
    return document.querySelector("#sueldo a") as HTMLAnchorElement;
  }
  get grupo() {
    return this.__get(HTMLSelectElement, "grupo")!;
  }
  get nivel() {
    return this.__get(HTMLSelectElement, "nivel")!;
  }
  get especifico() {
    return this.__get(HTMLInputElement, "especifico")!;
  }
}

const F = new MyForm();

function do_round(v: number) {
  if (isNaN(v) || v == Infinity) return "-";
  return `<code title="${toString(v, 2)}"><span class="nm">${toString(
    v,
    0
  )}</span></code>`;
}

function safe_div(n: number, x: number) {
  const aux = Math.pow(10, n.toString().length);
  n = (n * aux) / (x * aux);
  return n;
}
function safe_sum(...arr: number[]) {
  if (arr.length == 0) return 0;
  if (arr.length == 1) return arguments[0];
  let aux = arr.map((i) => {
    return i.toString().length;
  });
  const mx = Math.max(...aux);
  const pw = Math.pow(10, mx);
  const sum = arr.reduce((t, c) => {
    return t + c * pw;
  }, 0);
  return sum / pw;
}

async function parseForm(silent: boolean) {
  if (!F.checkValidity(silent)) return null;

  const fd = F.getData();
  const g = CONFIG.grupo[fd.getStr("grupo")];
  const n = CONFIG.nivel[fd.getNum("nivel")];
  if (g == null || n == null) return null;

  const trienios = {
    base: [] as number[],
    extra: [] as number[],
  };
  Object.values(CONFIG.grupo).forEach((gr) => {
    const tri = fd.getNum("tri" + gr.id);
    if (Number.isNaN(tri)) return;
    if (tri == 0) return;
    (<any>trienios)[gr.id] = tri;
    trienios.base.push(tri * gr.trienio);
    trienios.extra.push(tri * gr.extra_trienio);
  });

  const d = {
    irpf: safe_div(fd.getNum("irpf"), 100),
    ss: safe_div(fd.getNum("ss"), 100),
    mei: safe_div(AGE.mei.val, 100),
    especifico: fd.getNum("especifico"),
    productividad: fd.getNum("productividad"),
    grupo: g.id,
    nivel: n.id,
    muface: g.muface_cotizacion,
    base: g.base,
    extra: g.extra_base,
    destino: n.destino,
    trienios: {
      ...trienios,
      base: safe_sum(...trienios.base),
      extra: safe_sum(...trienios.extra),
    },
  };

  console.log("D", d);

  return d;
}

async function _do_salary(silent: boolean) {
  const d = await parseForm(silent);
  if (d == null) return false;

  const n = new Nomina({
    base: new Ingreso({ anual: d.base + d.trienios.base, pagas: 12 }),
    extra: new Ingreso({ mensual: d.extra + d.trienios.extra, pagas: 2 }),
    destino: new Ingreso({ anual: d.destino??undefined, pagas: 14 }),
    especifico: new Ingreso({ anual: d.especifico, pagas: 14 }),
    productividad: new Ingreso({ anual: d.productividad, pagas: 12 }),
    muface: d.muface,
    irpf: d.irpf,
    ss: d.ss,
    mei: d.mei,
  });

  const idval = {
    bruto_anual: n.bruto.anual,
    neto_anual: n.neto.anual,
    bruto_mes: n.bruto.normal.mensual,
    neto_mes: n.neto.normal.mensual,
    bruto_extra: n.bruto.normal.mensual + n.bruto.extra.mensual,
    neto_extra: n.neto.normal.mensual + n.neto.extra.mensual,
    bruto_media: n.bruto.anual / 12,
    neto_media: n.neto.anual / 12,
  };

  Object.entries(idval).forEach(([id, val]) => {
    document.getElementById(id)!.innerHTML = do_round(val);
  });

  return true;
}

async function do_salary(silent: boolean) {
  const r = await _do_salary(silent);
  if (r) {
    F.error.style.display = "none";
    F.msg.style.display = "";
  } else {
    F.error.style.display = "";
    F.msg.style.display = "none";
  }
  const Q = new MKQ(F.getQuery(), 0);
  F.link.href = "?" + Q.toString() + "#sueldo";
}

function syncInputs() {
  const gr = CONFIG.grupo[F.grupo.value];
  if (gr != null && gr.nivel.length > 0) {
    const mn = gr.nivel[0];
    const mx = gr.nivel[gr.nivel.length - 1];
    F.nivel.querySelectorAll("option").forEach((o) => {
      const n = parseInt(o.value);
      const ko = !isNaN(n) && (n < mn || n > mx);
      o.disabled = ko;
      o.style.display = ko ? "none" : "";
      if (ko && o.selected) o.selected = false;
    });
  }
  const rg = (() => {
    const nv = CONFIG.nivel[parseInt(F.nivel.value)];
    if (nv != null)
      return {
        min: nv.min_especifico,
        max: nv.max_especifico,
      };
    const grps = gr == null ? Object.values(CONFIG.grupo) : [gr];
    let mn = Infinity;
    let mx = -Infinity;
    grps.forEach((g) => {
      g.nivel.forEach((i) => {
        const es = CONFIG.nivel[i];
        if (es.min_especifico != null && es.min_especifico < mn)
          mn = es.min_especifico;
        if (es.max_especifico != null && es.max_especifico > mx)
          mx = es.max_especifico;
      });
    });
    return {
      min: mn,
      max: mx,
    };
  })();
  if (rg.min) F.especifico.min = rg.min.toString();
  if (rg.max) F.especifico.max = rg.max.toString();
  if (rg.min != null && rg.min == rg.max)
    F.especifico.value = rg.min.toString();
  else {
    const e = parseFloat(F.especifico.value);
    if (isNaN(e) || e > (rg.max ?? -Infinity) || e < (rg.min ?? Infinity))
      F.especifico.value = "";
  }
}
const doMain = async function () {
  const [_, grupo, nivel, puesto] = await Promise.all([
    AGE.getFuentes(true),
    AGE.getGrupoNivel(),
    AGE.getNiveles(),
    AGE.getPuesto(Q.getNum("puesto")),
  ]);
  CONFIG.grupo = grupo;
  CONFIG.nivel = nivel;

  const slot = document.getElementById("slot_trienios")!;
  Object.values(grupo).forEach((g) => {
    F.grupo.insertAdjacentHTML(
      "beforeend",
      `<option value="${g.id}">${g.id}</option>`
    );
    slot.insertAdjacentHTML(
      "beforeend",
      `
      <div>
      <label for="tri${g.id}">${g.id}</label>
      <input
        id="tri${g.id}"
        max="20"
        min="0"
        name="tri${g.id}"
        required
        step="1"
        style="width: 3em"
        type="number"
        value="0"
      />
      </div>
    `
    );
  });
  Object.values(nivel).forEach((n) => {
    F.nivel.insertAdjacentHTML(
      "beforeend",
      `<option value="${n.id}">${n.id}</option>`
    );
  });
  F.grupo.addEventListener("change", () => syncInputs());
  F.nivel.addEventListener("change", () => syncInputs());

  F.inputs.forEach((e) => {
    const v = Q.get(e.name);
    if (typeof v == "string") e.value = v;
    if (typeof v == "number") e.value = v.toString();
    e.addEventListener("change", async () => await do_salary(false));
  });
  if (puesto != null) {
    if (puesto.nivel != null) F.nivel.value = puesto.nivel.toString();
    F.especifico.value = puesto.especifico.toString();
    if (puesto.grupo.length == 1) F.grupo.value = puesto.grupo[0];
    if (F.grupo.value.length > 0) {
      document
        .querySelectorAll(".hide_if_puesto")
        .forEach((n) => ((<HTMLElement>n).style.display = "none"));
      document
        .querySelectorAll(".show_if_puesto")
        .forEach((n) => ((<HTMLElement>n).style.display = ""));
      document.querySelector(".show_if_puesto")!.insertAdjacentHTML(
        "beforeend",
        `
        Puesto <a href='../puesto/?${puesto.id}'>${puesto.id}</a> (${F.grupo.value} ${F.nivel.value})
        `
      );
    }
  }

  syncInputs();
  document.body.classList.add("loaded");
  do_salary(true);
};

document.addEventListener("DOMContentLoaded", doMain);
