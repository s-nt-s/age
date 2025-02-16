import { DB, TableName } from "./lib/supabaseClient.ts";
import { getDom, toTable } from "./lib/util.ts";
import { AGE } from "./lib/age";
import type { Tables } from "./lib/database.types";

function showMain() {
    document.body.classList.add("loaded");
  }

document.addEventListener("DOMContentLoaded", async () => {
  const [r, m, g, n] = await Promise.all([
    DB.get_one("fuente", "Retribuciones"),
    DB.get_one("fuente", "Muface"),
    DB.all("grupo"),
    AGE.getNiveles(),
  ]);
  const f = document.getElementById("fuente")!;
  const [a1, a2] = f.querySelectorAll("a");
  a1.href = r.fuente;
  a2.href = r.via;
  a2.textContent = getDom(r.via);
  f.querySelector("span")!.textContent = r.fecha;

  __toTable(
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

  __toTable(
    [["Nivel", "Complemento<br/>destino"]],
    Object.values(n) as Tables<"nivel">[],
    (i: Tables<"nivel">) => [i.id, i.destino]
  );

  showMain();
});

function __toTable<N extends TableName, T extends Tables<N>>(head: string[][], rows: T[], toRow: (i: T) => (string|number|null)[]) {
  const table = toTable(head, rows, toRow);
  document.getElementById("main")!.insertAdjacentHTML('beforeend', table.join("\n"));
}

