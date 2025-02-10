import { DB } from './lib/supabaseClient'
import { AGE } from './lib/age'
import { getDom } from "./lib/util.ts";

document.addEventListener("DOMContentLoaded", () => {
    const ol = document.getElementsByTagName("ol")[0]!;
    
    DB.all("fuente").then((arr)=>{
        arr.forEach((f)=>{
            const via = f.fuente==f.via?'':`, via <a href="${f.via}">${getDom(f.via)}</a>`
            ol.insertAdjacentHTML('beforeend', `
                <li><a href="${f.fuente}">${f.id}</a> de ${f.fecha}${via}</li>
            `)
        })
        ol.insertAdjacentHTML('beforeend', `
            <li><a href="${AGE.mei.fuente}" title="Mecanismo de Equidad Intergeneracional">MEI</a> de ${AGE.mei.fecha}</li>
        `)
        document.body.classList.add("loaded");
    })
});