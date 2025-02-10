import { DB } from './supabaseClient'
import type { Tables } from "./database.types";


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

    async getPuesto(id: string) {
        if (typeof id !== "string") return null;
        const i = parseInt(id);
        if (isNaN(i)) return null;
        const [p, g]:
        [Tables<"puesto">, string[]]
        = await Promise.all([
            DB.get_one("puesto", id),
            DB.selectWhere("puesto_grupo.grupo", "puesto", id)
        ]);
        const puesto = {...p, grupo: g};
        return puesto;
    }

    async getFullPuesto(id: string) {
        if (typeof id !== "string") return null;
        const i = parseInt(id);
        if (isNaN(i)) return null;
        const p = await DB.get_one("full_puesto", id);

        const __get = async (t, id) => id==null?null:await this.db.get_one(t, id);
        const __toArr = (v) => (v||'').split(/\t/).filter(x=>x.length>0);
        const __getFromPuesto = async (table) => {
            //const arr = await this.#db.selectWhere("puesto_"+table+"."+table, "puesto", id);
            const arr = __toArr(p[table]);
            if (arr.length==0) return [];
            const vals = await this.#db.get(table, ...arr);
            return vals;
        }
        p.grupo = __toArr(p.grupo);
        [
            p.cuerpo,
            p.observacion,
            p.titulacion,
            //p.grupo,
            //p.cargo,
            //p.administracion,
            //p.tipo,
            //p.provision,
            //p.formacion,
            p.unidad,
            p.localidad
        ] = await Promise.all([
            __getFromPuesto("cuerpo"),
            __getFromPuesto("observacion"),
            __getFromPuesto("titulacion"),
            //this.#db.selectWhere("puesto_grupo.grupo", "puesto", id),
            //__get("cargo.txt", p.cargo),
            //__get("administracion.txt", p.administracion),
            //__get("tipo_puesto.txt", p.tipo),
            //__get("provision.txt", p.provision),
            //__get("formacion.txt", p.formacion),
            __get("unidad", p.unidad),
            __get("localidad", p.localidad)
        ]);
        //if (p.localidad==null) p.localidad = await __get("localidad", unidad.localidad);

        [
            p.provincia,
            p.centro
        ] = await Promise.all([
            __get("provincia", p.localidad.provincia),
            __get("centro", p.unidad.centro),
        ]);

        [
            p.pais,
            p.ministerio
        ] = await Promise.all([
            __get("pais", p.provincia.pais),
            __get("ministerio", p.centro.ministerio),
        ]);

        return new FullPuesto(p);
    }
}

class FullPuesto extends Item {
    /** @type {string[]} */
    get grupo() {
        return this._obj.grupo;
    }
    /** @type {number} */
    get nivel() {
        return this._obj.nivel;
    }
    /** @type {number} */
    get especifico() {
        return this._obj.especifico;
    }
    /** @type {string} */
    get cargo() {
        return this._obj.cargo;
    }
    /** @type {string} */
    get administracion() {
        return this._obj.administracion;
    }
    /** @type {string} */
    get tipo() {
        return this._obj.tipo;
    }
    /** @type {string} */
    get provision() {
        return this._obj.provision;
    }
    /** @type {string} */
    get formacion() {
        return this._obj.formacion;
    }
    /** @type {boolean} */
    get vacante() {
        return this._obj.vacante;
    }
    /** @type {id: number, txt: number}[] */
    get organizacion() {
        return [this._obj.unidad, this._obj.centro, this._obj.ministerio].filter(x=>x.id>0)
    }
    /** @type {string}[] */
    get lugar() {
        return [this._obj.localidad, this._obj.provincia, this._obj.pais]
        .filter(x=>x.id>0)
        .map(x=>{
            const arr = x.txt.split(/, /);
            if (arr.length!=2) return x.txt;
            return arr[1]+' '+arr[0];
        })
        .filter((txt, i, arr) => (i==0) || (arr[i-1]!=txt))
        .join(", ");
    }
    /** @type {id: number, txt: number}[] */
    get cuerpo() {
        return this._obj.cuerpo;
    }
    /** @type {id: number, txt: number}[] */
    get observacion() {
        return this._obj.observacion;
    }
    /** @type {id: number, txt: number}[] */
    get titulacion() {
        return this._obj.titulacion;
    }
}