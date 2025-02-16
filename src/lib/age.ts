import { DB } from './supabaseClient'
import type { TableName, TableColumn } from './supabaseClient'
import type { Tables } from "./database.types";
import { byId } from './util'


class Age {
    readonly mei;
    private __minnivel: number|undefined;

    constructor() {
        const mei = (()=>{
            const y = new Date().getFullYear();
            if (y>=2029 && y<=2050) return 0.2;
            const mei = {
                2023: 0.1,
                2024: 0.12,
                2025: 0.13,
                2026: 0.15,
                2027: 0.17,
                2028: 0.18,
            }[y];
            return mei??0;
        })();
        this.mei = {
            fuente: 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-6967',
            via: 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-6967',
            fecha: '2023-04-01',
            val: mei
        }
    }

    async getFuentes(toDom: boolean) {
        const arr = await DB.all("fuente")
        arr.push({
            id: "MEI",
            fuente: this.mei.fuente,
            via: this.mei.fuente,
            fecha: this.mei.fecha
        });
        if (toDom) this.setFuentes(arr);
        return arr;
    }
    setFuentes(fuente: Tables<"fuente">[]) {
        fuente.forEach((i) => {
          const a1 = byId(HTMLAnchorElement, i.id.toLowerCase() + "_url");
          const a2 = byId(HTMLAnchorElement, i.id.toLowerCase() + "_via");
          const a = a1 || a2;
          if (a1) a1.href = i.fuente;
          if (a2) a2.href = i.via;
          if (a != null) {
            const t = (a.title || "").trim();
            if (t.length == 0) a.title = "Datos de " + i.fecha;
            else a.title = t + " (datos de " + i.fecha + ")";
          }
        });
    }

    async getPuesto(id: number) {
        if (id == null || isNaN(id)) return null;
        const [p, g]
        = await Promise.all([
            DB.get_one("puesto", id),
            DB.selectColumnWhere("puesto_grupo", "grupo", "puesto", id)
        ]);
        const puesto = {
            ...p,
            grupo: <string[]>g
        };
        return puesto;
    }

    async getNiveles() {
        if (this.__minnivel==undefined) {
            this.__minnivel = await DB.min("puesto", "nivel");
        }
        const nvl = await DB.selectTableWhere("nivel_complemento", "id", ">="+this.__minnivel);
        if (nvl[0].min_especifico == null) nvl[0].min_especifico = 0;
        if (nvl[nvl.length-1].max_especifico == null) nvl[nvl.length-1].max_especifico = Infinity;
        nvl.forEach((n, x)=>{
            if (n.min_especifico == null) n.min_especifico = nvl[x-1].max_especifico;
            if (n.max_especifico == null) n.max_especifico = nvl[x+1].min_especifico;
        })
        return Object.fromEntries(nvl.map(n=>[n.id!, n]));
    }

    async getGrupoNivel() {
        const [gr, gn]
        = await Promise.all([
            DB.all("grupo"),
            DB.all("grupo_nivel")
        ]);
        const obj = Object.fromEntries(
            gr.map(g=>[
                g.id, {
                    ...g,
                    nivel: gn.flatMap(n=>n.grupo==g.id && n.nivel!=null?n.nivel:[])
                }
            ])
        )
        return obj;
    }

    async getFullPuesto(id: number) {
        if (id==null || isNaN(id)) return null;
        const p = await this.__getFullPuesto(id);

        const __toArr = (v: string|null) => (v||'').split(/\t/).filter(x=>x.length>0);
        const __getFromPuesto = async <
            T extends TableColumn<"full_puesto"> & TableName
        >(table: T) => {
            const arr = __toArr(p[table] as string|null);
            if (arr.length==0) return [] as Tables<T>[];
            const vals = <Tables<T>[]> await DB.get(table, ...arr);
            return vals;
        }
        const
        [
            cuerpo,
            observacion,
            titulacion,
            unidad,
            localidad
        ] = await Promise.all([
            __getFromPuesto("cuerpo"),
            __getFromPuesto("observacion"),
            __getFromPuesto("titulacion"),
            DB.get_one("unidad", p.unidad!),
            DB.get_one("localidad", p.localidad!)
        ]);

        const
        [
            provincia,
            centro
        ] = await Promise.all([
            DB.get_one("provincia", localidad!.provincia),
            DB.get_one("centro", unidad!.centro)
        ]);

        const
        [
            pais,
            ministerio
        ] = await Promise.all([
            DB.get_one("pais", provincia!.pais),
            DB.get_one("ministerio", centro!.ministerio)
        ]);
        let grupo = __toArr(p.grupo);
        const singrupo = grupo.length==0;
        if (grupo.length == 0 && p.nivel!=null) {
            grupo = <string[]>await DB.selectColumnWhere("grupo_nivel", "grupo", "nivel", p.nivel);
        }

        const full = {
            ...p,
            singrupo: singrupo,
            id: p.id!,
            grupo: grupo,
            cuerpo: cuerpo,
            observacion: observacion,
            titulacion: titulacion,
            provincia: provincia,
            centro: centro,
            pais:pais,
            ministerio:ministerio,
            lugar: [localidad, provincia, pais]
            .filter(x=>x.id>0)
            .map(x=>{
                const arr = x.txt.split(/, /);
                if (arr.length!=2) return x.txt;
                return arr[1]+' '+arr[0];
            })
            .filter((txt, i, arr) => (i==0) || (arr[i-1]!=txt))
            .join(", "),
            organizacion: [unidad, centro, ministerio].filter(x=>x.id>0)
        }
        return full;
    }

    private async __getFullPuesto(id: number) {
        return <Tables<"full_puesto">> await DB.get_one("full_puesto", id);
    }
}

export const AGE = new Age();