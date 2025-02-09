import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { PostgrestSingleResponse, PostgrestError } from "@supabase/supabase-js";

type TableName = "puesto" | "fuente" | "grupo" | "nivel";

export class Db {
  private readonly onerror: ((e:PostgrestError)=>void) | null;
  private readonly db;

  constructor(onerror: ((e:PostgrestError)=>void) |null = null) {
    this.db = createClient<Database>(
      "https://yzdhmjrzdywlzbhmhmst.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZGhtanJ6ZHl3bHpiaG1obXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzQ1NDIsImV4cCI6MjA1Mjk1MDU0Mn0.UJAf3qUL2bt5NTS-1koXUATbuLKMMBc5_1okDsmuGvc",
    );
    this.onerror = onerror;
  }

  private get_data(log: string, obj: PostgrestSingleResponse<any[]>) {
    if (obj.error) {
      console.error(log, obj);
      if (this.onerror) this.onerror(obj.error);
      throw obj.error;
    }
    console.log(log+': '+obj.data.length+' resultados');
    return obj.data;
  }

  async all(table: TableName) {
    return this.get(table);
  }

  async selectWhere(table_field: string, where_field: string, ...arr: (number|string)[]) {
    let [table, field] = table_field.split(".");
    let prm = (()=>{
      const x = this.db.from(<TableName>table);
      return field?x.select(field):x.select()
    })();
    if (arr.length == 1) prm = prm.eq(where_field, arr[0]);
    else if (arr.length>1) prm = prm.in(where_field, arr);
    if (field!=null) prm = prm.order(field, { ascending: true });
    const r = this.get_data(
      arr.length==0?table_field:`${table_field}[${where_field}=${arr}]`,
      await prm
    );
    if (field == null) {
      if (r.length==0) return r;
      if (typeof r[0].id == "number") return r.sort((a, b)=>b.id-a.id);
      if (typeof r[0].id == "string") return r.sort((a, b)=>b.id.localeCompare(a.id));
      return r;
    }
    return r.map(i=>i[field]);
  }

  async get_one(table: TableName, id: number | string) {
    const r = await this.selectWhere(table, 'id', id);
    if (r.length == 1) return r[0];
    throw `${table}[id=${id}] devuelve ${r.length} resultados`;
  }

  private async get(table: TableName, ...ids: (number | string)[]) {
    return await this.selectWhere(table, 'id', ...ids);
  }

}

export const DB = new Db();