import { createClient } from "@supabase/supabase-js";
import type { Database, Tables } from "./database.types";
import type {
  PostgrestSingleResponse,
  PostgrestError,
} from "@supabase/supabase-js";

type _TableName = keyof Database["public"]["Tables"];
type _ViewName = keyof Database["public"]["Views"];
export type TableName = _TableName | _ViewName;
export type TableColumn<T extends TableName> = keyof Tables<T>;

export class Db {
  private readonly onerror: ((e: PostgrestError) => void) | null;
  private readonly db;

  constructor(onerror: ((e: PostgrestError) => void) | null = null) {
    this.db = createClient<Database>(
      "https://yzdhmjrzdywlzbhmhmst.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZGhtanJ6ZHl3bHpiaG1obXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzQ1NDIsImV4cCI6MjA1Mjk1MDU0Mn0.UJAf3qUL2bt5NTS-1koXUATbuLKMMBc5_1okDsmuGvc"
    );
    this.onerror = onerror;
  }

  get_data(log: string, obj: PostgrestSingleResponse<any[]>) {
    if (obj.error) {
      console.error(log, obj);
      if (this.onerror) this.onerror(obj.error);
      throw obj.error;
    }
    if (obj.data == null && ("count" in obj)) {
      const count = (<any>obj).count;
      if (typeof count === "number" && !isNaN(count)) {
        console.log(log + ": count(*) = " + count);
        return count;
      }
    }
    console.log(log + ": " + obj.data.length + " resultados");
    return obj.data;
  }

  async all<T extends TableName>(table: T) {
    return this.get(table);
  }
  async dct<T extends TableName>(table: T, ...ids: string[]|number[]) {
    const arr = await this.get(table, ...ids);
    const kv = arr.map((t:Tables<T>)=>{
      if (!("id" in t)) return null;
      const k = t.id;
      if (typeof k == "string") return [k, t];
      if (typeof k == "number") return [k, t];
      return null;
    }).filter(x=>x!=null) as [string|number, Tables<T>][];
    return Object.fromEntries(kv);
  }

  public from(t: TableName) {
    return this.db.from(<_TableName>t);
  }

  async selectColumnWhere<T extends TableName, C extends TableColumn<T>>(
    table: T,
    fieldName: C,
    where_fieldName?: C,
    ...arr: (number | string)[]
  ): Promise<Tables<T>[C][]> {
    const r = await this.__selectWhere(table, fieldName, where_fieldName, ...arr);
    return r.map((i) => i[fieldName]);
  }

  async selectTableWhere<T extends TableName, C extends TableColumn<T>>(
    table: T,
    where_fieldName?: C,
    ...arr: (number | string)[]
  ): Promise<Tables<T>[]> {
    const r = await this.__selectWhere(table, undefined, where_fieldName, ...arr);
    return r;
  }

  private async __selectWhere<T extends TableName, C extends TableColumn<T>>(
    table: T,
    fieldName?: C,
    where_fieldName?: C,
    ...arr: (number | string)[]
  ): Promise<Tables<T>[]> {
    const field = (fieldName ?? "*").toString();
    const where_field = where_fieldName==undefined?undefined:where_fieldName.toString();
    const table_field = table + "." + field;
    const prm = this.__buildSelectWhere(table, fieldName, where_fieldName, ...arr);
    const r = <Tables<T>[]>(
      this.get_data(
        arr.length == 0 ? table_field : `${table_field}[${where_field}=${arr}]`,
        await prm
      )
    );
    if (r.length == 0) return r;
    if (field != '*') {
      const id = "id" in r[0]?r[0]['id']:null;
      type N = { id: number} & Tables<T>;
      type S = { id: string} & Tables<T>;
      if (typeof id == "number") return (<N[]>r).sort((a, b) => b.id - a.id);
      if (typeof id == "string") return (<S[]>r).sort((a, b) => b.id.localeCompare(a.id));
    }
    return r;
  }

  private __unpackWhereArg(v: number|string): [string, number]|null {
    if (typeof v != "string") return null;
    const m = v.match(/^(<|>|<=|>=|\!)(\d+)$/);
    if (m == null) return null;
    const n = parseInt(m[2]);
    if (n==null) return null;
    return [m[1], n]
  }

  private __buildSelectWhere<T extends TableName, C extends TableColumn<T>>(
    table: T,
    fieldName?: C,
    where_fieldName?: C,
    ...arr: (number | string)[]
  ) {
    const field = (fieldName ?? "*").toString();
    const where_field = where_fieldName==undefined?undefined:where_fieldName.toString();
    let prm = this.from(table).select(field);
    if (where_field != undefined && arr.length > 0) {
      const _in_ = [] as typeof arr;
      arr.forEach(a=>{
        const unpack = this.__unpackWhereArg(a);
        if (unpack == null) return _in_.push(a);
        const [s, v] = unpack;
        if (s==">") return (prm=prm.gt(where_field, v));
        if (s=="<") return (prm=prm.lt(where_field, v));
        if (s=="<=") return (prm=prm.lte(where_field, v));
        if (s==">=") return (prm=prm.gte(where_field, v));
        if (s=="!") return (prm=prm.neq(where_field, v));
        throw "Bad argument: "+s;
      })
      if (_in_.length == 1) prm = prm.eq(where_field, _in_[0]);
      else if (_in_.length > 1) prm = prm.in(where_field, _in_);
    }
    return prm;
  }

  async get_one<T extends TableName>(table: T, id: number | string) {
    const r = <Tables<T>[]>await this.selectTableWhere(table, "id" as TableColumn<T>, id);
    if (r.length == 1) return r[0];
    throw `${table}[id=${id}] devuelve ${r.length} resultados`;
  }

  async safe_get_one<T extends TableName>(table: T, id: number | string | null) {
    if (id == null) return null;
    return this.get_one(table, id);
  }

  async get<T extends TableName>(table: T, ...ids: (number | string)[]) {
    return <Tables<T>[]>await this.selectTableWhere(table, "id" as TableColumn<T>, ...ids);
  }

  private async __minmax<T extends TableName, C extends TableColumn<T>>(
    ascending: boolean,
    table: T,
    field: C,
    where_fieldName?: C,
    ...arr: (number | string)[]
  ): Promise<Tables<T>[C]>{
    const table_field = table + "." + field.toString();
    const prm = this.__buildSelectWhere(table, field, where_fieldName, ...arr)
      .order(field.toString(), { ascending: ascending, nullsFirst: false }).limit(1)

    const log = arr.length == 0 || !where_fieldName? table_field : `${table_field}[${where_fieldName.toString()}=${arr}]`;
    const logline = `${ascending?'min':'max'}(${log})`;
    const tval = this.get_data(
      logline,
      await prm
    ) as Tables<T>[];
    const val = tval[0][field];
    console.log(logline + ' = '+val);
    return val;
  }
  async min<T extends TableName, C extends TableColumn<T>>(
    table: T,
    field: C,
    where_fieldName?: C,
    ...arr: (number | string)[]
  ) {
    return await this.__minmax(true, table, field, where_fieldName, ...arr);
  }
  async max<T extends TableName, C extends TableColumn<T>>(
    table: T,
    field: C,
    where_fieldName?: C,
    ...arr: (number | string)[]
  ) {
    return await this.__minmax(false, table, field, where_fieldName, ...arr);
  }
}

export const DB = new Db();

