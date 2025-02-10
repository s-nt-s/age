import { createClient } from "@supabase/supabase-js";
import type { Database, Tables } from "./database.types";
import type {
  PostgrestSingleResponse,
  PostgrestError,
} from "@supabase/supabase-js";

type _TableName = keyof Database["public"]["Tables"];
type TableName = _TableName | keyof Database["public"]["Views"];
type TableColumn<T extends TableName> = keyof Tables<T>;

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

  async all(table: TableName) {
    return this.get(table);
  }

  private unpack(
    table_field: string
  ): readonly [TableName, TableColumn<TableName> | undefined] {
    if (typeof table_field !== "string") throw `${table_field} no es un string`;
    const arr = table_field.split(".");
    if (arr.length == 0 || arr.length > 2)
      throw `${table_field} no cumple el formato`;
    const table = <TableName>arr[0];
    if (arr.length == 1) return [table, undefined] as const;
    const field = <TableColumn<TableName>>arr[1];
    return [table, field] as const;
  }

  async _selectWhere<T extends TableName, C extends TableColumn<T>>(
    table: T,
    fieldName?: C,
    where_fieldName?: C,
    ...arr: (number | string)[]
  ): Promise<Tables<T>[]> {
    //let [table, field] = this.unpack(table_field);
    const field = <string | undefined>fieldName ?? "*";
    const where_field = <string | undefined>where_fieldName;
    const table_field = table + "." + field;
    let prm = this.db.from(<_TableName>table).select(field);
    if (where_field != undefined) {
      if (arr.length == 1) prm = prm.eq(where_field, arr[0]);
      else if (arr.length > 1) prm = prm.in(where_field, arr);
    }
    if (field != null) prm = prm.order(field, { ascending: true });
    const r = <Tables<T>[]>(
      this.get_data(
        arr.length == 0 ? table_field : `${table_field}[${where_field}=${arr}]`,
        await prm
      )
    );
    return r;
  }

  async selectWhere(
    table_field: string,
    where_fieldName?: string,
    ...arr: (number | string)[]
  ) {
    const tf = this.unpack(table_field);
    const table: TableName = tf[0];
    const field = <TableColumn<typeof table>|undefined>tf[1];
    const where_field = <typeof field>where_fieldName;
    const r = await this._selectWhere(table, field, where_field, ...arr);
    if (field == null) {
      if (r.length == 0) return r;
      const id = "id" in r[0]?r[0]['id']:null;
      if (typeof id == "number") return (<{ id: number}[]>r).sort((a, b) => b.id - a.id);
      if (typeof id == "string") return (<{ id: string}[]>r).sort((a, b) => b.id.localeCompare(a.id));
      return r;
    }
    return r.map((i) => i[field]);
  }
  async get_one(table: TableName, id: number | string) {
    const r = await this.selectWhere(table, "id", id);
    if (r.length == 1) return r[0];
    throw `${table}[id=${id}] devuelve ${r.length} resultados`;
  }

  private async get(table: TableName, ...ids: (number | string)[]) {
    return await this.selectWhere(table, "id", ...ids);
  }
}

export const DB = new Db();
