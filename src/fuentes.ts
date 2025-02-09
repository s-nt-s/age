import { DB } from './lib/supabaseClient'
import type { Tables } from "./lib/database.types";

document.addEventListener("DOMContentLoaded", () => {
    const ol = document.getElementsByTagName("ol")[0]!;
    DB.all("fuente").then((arr: Tables<"fuente">[])=>{
        arr.forEach((f)=>{
            ol.insertAdjacentHTML('beforeend', `
                <li><a href="${f.fuente}">${f.id}</a></li>
            `)
        })
        document.body.classList.add("loaded");
    })
});