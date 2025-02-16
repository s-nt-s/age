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

  private get_data(log: string, obj: PostgrestSingleResponse<any[]>) {
    if (obj.error) {
      console.error(log, obj);
      if (this.onerror) this.onerror(obj.error);
      throw obj.error;
    }
    console.log(log + ": " + obj.data.length + " resultados");
    return obj.data;
  }

  async all<T extends TableName>(table: T) {
    return this.get(table);
  }
  async dct<T extends TableName>(table: T) {
    const arr = await this.get(table);
    const kv = arr.map(t=>{
      if (!("id" in t)) return null;
      const k = t.id;
      if (typeof k == "string") return [k, t as Tables<T>];
      if (typeof k == "number") return [k, t as Tables<T>];
      return null;
    }).filter(x=>x!=null) as [string|number, Tables<T>][];
    return Object.fromEntries(kv);
  }

  private from(t: TableName) {
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
    let prm = this.from(table).select(field);
    if (where_field != undefined) {
      if (arr.length == 1) prm = prm.eq(where_field, arr[0]);
      else if (arr.length > 1) prm = prm.in(where_field, arr);
    }
    if (field != '*') prm = prm.order(field, { ascending: true });
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
}

export const DB = new Db();
