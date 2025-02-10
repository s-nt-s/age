import { DB } from './lib/supabaseClient'
import type { Tables } from "./lib/database.types";
import { getDom } from "./lib/util.ts";

document.addEventListener("DOMContentLoaded", () => {
    const ol = document.getElementsByTagName("ol")[0]!;
    DB.all("fuente").then((arr: Tables<"fuente">[])=>{
        arr.forEach((f)=>{
            const via = f.fuente==f.via?'':`, via <a href="${f.via}">${getDom(f.via)}</a>`
            ol.insertAdjacentHTML('beforeend', `
                <li><a href="${f.fuente}">${f.id}</a> de ${f.fecha}${via}</li>
            `)
        })
        document.body.classList.add("loaded");
    })
});