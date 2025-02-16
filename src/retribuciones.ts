import { DB, TableName } from "./lib/supabaseClient.ts";
import { getDom, toString } from "./lib/util.ts";
import type { Tables } from "./lib/database.types";

function showMain() {
    document.body.classList.add("loaded");
  }

document.addEventListener("DOMContentLoaded", async () => {
  const [r, m, g, n] = await Promise.all([
    DB.get_one("fuente", "Retribuciones"),
    DB.get_one("fuente", "Muface"),
    DB.all("grupo"),
    DB.all("nivel"),
  ]);
  const f = document.getElementById("fuente")!;
  const [a1, a2] = f.querySelectorAll("a");
  a1.href = r.fuente;
  a2.href = r.via;
  a2.textContent = getDom(r.via);
  f.querySelector("span")!.textContent = r.fecha;

  toTable(
    [
      [
        "<th rowspan='2'>Grupo</th>",
        "<th colspan='2'>Base</th>",
        "<th colspan='2'>Extra</th>",
        `<th rowspan='2'><a title='Cotización Muface' href="${m.fuente}">Muface</a></th>`,
      ],
      ["Sueldo", "Trienio", "Sueldo", "Trienio"]
    ],
    g,
    (i: Tables<"grupo">) => [i.id, i.base, i.trienio, i.extra_base, i.extra_trienio, i.muface_cotizacion]
  );

  toTable(
    [["Nivel", "Complemento<br/>destino"]],
    n,
    (i: Tables<"nivel">) => [i.id, i.destino]
  );

  showMain();
});
function toTable<N extends TableName, T extends Tables<N>>(head: string[][], rows: T[], toRow: (i: T) => (string|number|null)[]) {
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
  table.push("</tbody>")
  table.push("</table>")
  document.getElementById("main")!.insertAdjacentHTML('beforeend', table.join("\n"));
}

