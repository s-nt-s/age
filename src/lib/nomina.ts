export class Ingreso {
    readonly anual:number;
    readonly mensual:number;
    readonly pagas:number;

    constructor({anual, mensual, pagas}: { anual?: number; mensual?: number; pagas?: number; } = {}) {
        if (pagas != null) {
            if (anual == null && mensual!=null) anual = mensual * pagas;
            if (mensual == null && anual!=null) mensual = anual / pagas;
        }
        if (typeof anual != "number") throw `Anual debe ser un número`;
        if (typeof mensual != "number") throw `Mensual debe ser un número`;
        if (typeof pagas != "number") throw `Pagas debe ser un número`;
        this.anual = anual;
        this.mensual = mensual;
        this.pagas = pagas;
    }

}

class Paga {
    readonly normal: Ingreso;
    readonly extra: Ingreso;

    constructor({normal, extra}: {normal: Ingreso; extra: Ingreso;}) {
        this.normal = normal;
        this.extra = extra;
    }

    get anual()  {
        return this.normal.anual + this.extra.anual;
    }
}

export class Nomina {
    readonly base: Ingreso;
    readonly extra: Ingreso;
    readonly destino: Ingreso;
    readonly especifico: Ingreso;
    readonly productividad: Ingreso;
    readonly muface: number;
    readonly irpf: number;
    readonly ss: number;
    readonly mei: number;

    static getBrutoAnual(base: number, extra_base: number, destino: number, especifico: number) {
        const sueldo = new Nomina({
            base: new Ingreso({ anual: base, pagas: 12 }),
            extra: new Ingreso({ mensual: extra_base, pagas: 2 }),
            destino: new Ingreso({ anual: destino, pagas: 14 }),
            especifico: new Ingreso({ anual: especifico, pagas: 14 }),
            productividad: new Ingreso({ anual: 0, pagas: 12 }),
            muface: 0,
            irpf: 0,
            ss: 0,
            mei: 0,
        });
        return sueldo.bruto.anual;
    }

    constructor({
        base,
        extra,
        destino,
        especifico,
        productividad,
        muface,
        irpf,
        ss,
        mei
    }:{
        base: Ingreso;
        extra: Ingreso;
        destino: Ingreso;
        especifico: Ingreso;
        productividad: Ingreso|undefined;
        muface: number|undefined;
        irpf: number|undefined;
        ss: number|undefined;
        mei: number|undefined;
    }) {
        this.base = base;
        this.extra = extra;
        this.destino = destino;
        this.especifico = especifico;
        this.productividad = productividad??new Ingreso({anual: 0, mensual: 0, pagas: 12});
        this.muface = muface??0;
        this.irpf = irpf??0;
        this.ss = ss??0;
        this.mei = mei??0;
    }

    get bruto() {
        const normal = new Ingreso({
            pagas: 12,
            mensual: (
                this.base.mensual + 
                this.destino.mensual + 
                this.especifico.mensual + 
                this.productividad.mensual
            )
        });
        const extra = new Ingreso({
            pagas: 2,
            mensual: (
                this.extra.mensual + 
                this.destino.mensual + 
                this.especifico.mensual
            )
        });

        return new Paga({
            normal: normal, 
            extra: extra
        });
    }

    get neto() {
        const normal = new Ingreso({
            pagas: 12,
            mensual: (
                this.bruto.normal.mensual * (1-this.irpf-this.ss-this.mei) +
                -this.muface +
                // la SS y MEI de la extra se paga mensualmente
                -(this.bruto.extra.anual/12)*(this.ss+this.mei)
            )
        });
        const extra = new Ingreso ({
            pagas: 2,
            mensual: (
                // solo se paga el irpf porque la SS y MEI de la extra
                // ya se han pagado durante el resto del año
                this.bruto.extra.mensual * (1-this.irpf) +
                -this.muface
            )
        });

        return new Paga({
            normal: normal, 
            extra: extra
        });
    }
}