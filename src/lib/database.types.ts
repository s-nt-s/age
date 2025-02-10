export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      administracion: {
        Row: {
          id: string
          txt: string
        }
        Insert: {
          id: string
          txt: string
        }
        Update: {
          id?: string
          txt?: string
        }
        Relationships: []
      }
      cargo: {
        Row: {
          id: number
          txt: string
        }
        Insert: {
          id: number
          txt: string
        }
        Update: {
          id?: number
          txt?: string
        }
        Relationships: []
      }
      centro: {
        Row: {
          id: number
          ministerio: number
          txt: string
        }
        Insert: {
          id: number
          ministerio: number
          txt: string
        }
        Update: {
          id?: number
          ministerio?: number
          txt?: string
        }
        Relationships: [
          {
            foreignKeyName: "centro_ministerio_fkey"
            columns: ["ministerio"]
            isOneToOne: false
            referencedRelation: "ministerio"
            referencedColumns: ["id"]
          },
        ]
      }
      cuerpo: {
        Row: {
          id: string
          txt: string
        }
        Insert: {
          id: string
          txt: string
        }
        Update: {
          id?: string
          txt?: string
        }
        Relationships: []
      }
      formacion: {
        Row: {
          id: number
          txt: string
        }
        Insert: {
          id: number
          txt: string
        }
        Update: {
          id?: number
          txt?: string
        }
        Relationships: []
      }
      fuente: {
        Row: {
          fecha: string
          fuente: string
          id: string
          via: string
        }
        Insert: {
          fecha: string
          fuente: string
          id: string
          via: string
        }
        Update: {
          fecha?: string
          fuente?: string
          id?: string
          via?: string
        }
        Relationships: []
      }
      grupo: {
        Row: {
          base: number
          extra_base: number
          extra_trienio: number
          id: string
          muface_cotizacion: number
          trienio: number
        }
        Insert: {
          base: number
          extra_base: number
          extra_trienio: number
          id: string
          muface_cotizacion: number
          trienio: number
        }
        Update: {
          base?: number
          extra_base?: number
          extra_trienio?: number
          id?: string
          muface_cotizacion?: number
          trienio?: number
        }
        Relationships: []
      }
      localidad: {
        Row: {
          id: number
          localidad: number
          provincia: number
          txt: string
        }
        Insert: {
          id: number
          localidad: number
          provincia: number
          txt: string
        }
        Update: {
          id?: number
          localidad?: number
          provincia?: number
          txt?: string
        }
        Relationships: [
          {
            foreignKeyName: "localidad_provincia_fkey"
            columns: ["provincia"]
            isOneToOne: false
            referencedRelation: "provincia"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerio: {
        Row: {
          id: number
          txt: string
        }
        Insert: {
          id: number
          txt: string
        }
        Update: {
          id?: number
          txt?: string
        }
        Relationships: []
      }
      nivel: {
        Row: {
          destino: number
          id: number
        }
        Insert: {
          destino: number
          id: number
        }
        Update: {
          destino?: number
          id?: number
        }
        Relationships: []
      }
      observacion: {
        Row: {
          id: string
          txt: string
        }
        Insert: {
          id: string
          txt: string
        }
        Update: {
          id?: string
          txt?: string
        }
        Relationships: []
      }
      pais: {
        Row: {
          id: number
          txt: string
        }
        Insert: {
          id: number
          txt: string
        }
        Update: {
          id?: number
          txt?: string
        }
        Relationships: []
      }
      provincia: {
        Row: {
          id: number
          pais: number
          txt: string
        }
        Insert: {
          id: number
          pais: number
          txt: string
        }
        Update: {
          id?: number
          pais?: number
          txt?: string
        }
        Relationships: [
          {
            foreignKeyName: "provincia_pais_fkey"
            columns: ["pais"]
            isOneToOne: false
            referencedRelation: "pais"
            referencedColumns: ["id"]
          },
        ]
      }
      provision: {
        Row: {
          id: string
          txt: string
        }
        Insert: {
          id: string
          txt: string
        }
        Update: {
          id?: string
          txt?: string
        }
        Relationships: []
      }
      puesto: {
        Row: {
          administracion: string | null
          cargo: number
          especifico: number
          formacion: number | null
          id: number
          localidad: number
          nivel: number | null
          provision: string | null
          tipo: string | null
          unidad: number | null
          vacante: number
        }
        Insert: {
          administracion?: string | null
          cargo: number
          especifico: number
          formacion?: number | null
          id: number
          localidad: number
          nivel?: number | null
          provision?: string | null
          tipo?: string | null
          unidad?: number | null
          vacante: number
        }
        Update: {
          administracion?: string | null
          cargo?: number
          especifico?: number
          formacion?: number | null
          id?: number
          localidad?: number
          nivel?: number | null
          provision?: string | null
          tipo?: string | null
          unidad?: number | null
          vacante?: number
        }
        Relationships: [
          {
            foreignKeyName: "puesto_administracion_fkey"
            columns: ["administracion"]
            isOneToOne: false
            referencedRelation: "administracion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_cargo_fkey"
            columns: ["cargo"]
            isOneToOne: false
            referencedRelation: "cargo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_formacion_fkey"
            columns: ["formacion"]
            isOneToOne: false
            referencedRelation: "formacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_localidad_fkey"
            columns: ["localidad"]
            isOneToOne: false
            referencedRelation: "localidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_nivel_fkey"
            columns: ["nivel"]
            isOneToOne: false
            referencedRelation: "nivel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_nivel_fkey"
            columns: ["nivel"]
            isOneToOne: false
            referencedRelation: "nivel_complemento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_provision_fkey"
            columns: ["provision"]
            isOneToOne: false
            referencedRelation: "provision"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_tipo_fkey"
            columns: ["tipo"]
            isOneToOne: false
            referencedRelation: "tipo_puesto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidad"
            referencedColumns: ["id"]
          },
        ]
      }
      puesto_cuerpo: {
        Row: {
          cuerpo: string
          puesto: number
        }
        Insert: {
          cuerpo: string
          puesto: number
        }
        Update: {
          cuerpo?: string
          puesto?: number
        }
        Relationships: [
          {
            foreignKeyName: "puesto_cuerpo_cuerpo_fkey"
            columns: ["cuerpo"]
            isOneToOne: false
            referencedRelation: "cuerpo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_cuerpo_puesto_fkey"
            columns: ["puesto"]
            isOneToOne: false
            referencedRelation: "full_puesto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_cuerpo_puesto_fkey"
            columns: ["puesto"]
            isOneToOne: false
            referencedRelation: "puesto"
            referencedColumns: ["id"]
          },
        ]
      }
      puesto_grupo: {
        Row: {
          grupo: string
          puesto: number
        }
        Insert: {
          grupo: string
          puesto: number
        }
        Update: {
          grupo?: string
          puesto?: number
        }
        Relationships: [
          {
            foreignKeyName: "puesto_grupo_grupo_fkey"
            columns: ["grupo"]
            isOneToOne: false
            referencedRelation: "grupo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_grupo_puesto_fkey"
            columns: ["puesto"]
            isOneToOne: false
            referencedRelation: "full_puesto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_grupo_puesto_fkey"
            columns: ["puesto"]
            isOneToOne: false
            referencedRelation: "puesto"
            referencedColumns: ["id"]
          },
        ]
      }
      puesto_observacion: {
        Row: {
          observacion: string
          puesto: number
        }
        Insert: {
          observacion: string
          puesto: number
        }
        Update: {
          observacion?: string
          puesto?: number
        }
        Relationships: [
          {
            foreignKeyName: "puesto_observacion_observacion_fkey"
            columns: ["observacion"]
            isOneToOne: false
            referencedRelation: "observacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_observacion_puesto_fkey"
            columns: ["puesto"]
            isOneToOne: false
            referencedRelation: "full_puesto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_observacion_puesto_fkey"
            columns: ["puesto"]
            isOneToOne: false
            referencedRelation: "puesto"
            referencedColumns: ["id"]
          },
        ]
      }
      puesto_titulacion: {
        Row: {
          puesto: number
          titulacion: string
        }
        Insert: {
          puesto: number
          titulacion: string
        }
        Update: {
          puesto?: number
          titulacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "puesto_titulacion_puesto_fkey"
            columns: ["puesto"]
            isOneToOne: false
            referencedRelation: "full_puesto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_titulacion_puesto_fkey"
            columns: ["puesto"]
            isOneToOne: false
            referencedRelation: "puesto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_titulacion_titulacion_fkey"
            columns: ["titulacion"]
            isOneToOne: false
            referencedRelation: "titulacion"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_puesto: {
        Row: {
          id: string
          txt: string
        }
        Insert: {
          id: string
          txt: string
        }
        Update: {
          id?: string
          txt?: string
        }
        Relationships: []
      }
      titulacion: {
        Row: {
          id: string
          txt: string
        }
        Insert: {
          id: string
          txt: string
        }
        Update: {
          id?: string
          txt?: string
        }
        Relationships: []
      }
      unidad: {
        Row: {
          centro: number
          id: number
          localidad: number
          txt: string
        }
        Insert: {
          centro: number
          id: number
          localidad: number
          txt: string
        }
        Update: {
          centro?: number
          id?: number
          localidad?: number
          txt?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidad_centro_fkey"
            columns: ["centro"]
            isOneToOne: false
            referencedRelation: "centro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidad_localidad_fkey"
            columns: ["localidad"]
            isOneToOne: false
            referencedRelation: "localidad"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      full_puesto: {
        Row: {
          administracion: string | null
          cargo: string | null
          cuerpo: string | null
          especifico: number | null
          formacion: string | null
          grupo: string | null
          id: number | null
          localidad: number | null
          nivel: number | null
          observacion: string | null
          provision: string | null
          tipo: string | null
          titulacion: string | null
          unidad: number | null
          vacante: number | null
        }
        Relationships: [
          {
            foreignKeyName: "puesto_nivel_fkey"
            columns: ["nivel"]
            isOneToOne: false
            referencedRelation: "nivel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_nivel_fkey"
            columns: ["nivel"]
            isOneToOne: false
            referencedRelation: "nivel_complemento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidad"
            referencedColumns: ["id"]
          },
        ]
      }
      grupo_nivel: {
        Row: {
          grupo: string | null
          nivel: number | null
        }
        Relationships: [
          {
            foreignKeyName: "puesto_grupo_grupo_fkey"
            columns: ["grupo"]
            isOneToOne: false
            referencedRelation: "grupo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_nivel_fkey"
            columns: ["nivel"]
            isOneToOne: false
            referencedRelation: "nivel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puesto_nivel_fkey"
            columns: ["nivel"]
            isOneToOne: false
            referencedRelation: "nivel_complemento"
            referencedColumns: ["id"]
          },
        ]
      }
      nivel_complemento: {
        Row: {
          destino: number | null
          id: number | null
          max_especifico: number | null
          min_especifico: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
