import { DB } from './supabaseClient'
import type { TableName, TableColumn } from './supabaseClient'
import type { Tables } from "./database.types";
import { toNum } from './util'


class Age {
    static eventDataContentLoaded = "DATAContentLoaded"
    readonly mei;

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

    async getPuesto(idPuesto: string|number) {
        const id = toNum(idPuesto);
        if (id == null) return null;
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

    async getFullPuesto(idPuesto: number) {
        const id = toNum(idPuesto);
        if (id == null) return null;
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

        const full = {
            ...p,
            id: p.id!,
            grupo: __toArr(p.grupo),
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