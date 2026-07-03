export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          is_paid: boolean
          paid_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          is_paid?: boolean
          paid_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          paid_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          is_received: boolean
          received_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          is_received?: boolean
          received_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          is_received?: boolean
          received_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "receivable_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          active: boolean
          balance: number
          category: string | null
          created_at: string
          id: string
          initial_balance: number | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          balance?: number
          category?: string | null
          created_at?: string
          id?: string
          initial_balance?: number | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          balance?: number
          category?: string | null
          created_at?: string
          id?: string
          initial_balance?: number | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          from_account_id: string | null
          id: string
          is_platform_withdrawal: boolean | null
          reference_id: string | null
          reference_type: string | null
          status: string | null
          to_account_id: string | null
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          from_account_id?: string | null
          id?: string
          is_platform_withdrawal?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          to_account_id?: string | null
          transaction_date?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          from_account_id?: string | null
          id?: string
          is_platform_withdrawal?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          to_account_id?: string | null
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          categoria: string
          criado_em: string
          data_lancamento: string
          descricao: string | null
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria: string
          criado_em?: string
          data_lancamento?: string
          descricao?: string | null
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          categoria?: string
          criado_em?: string
          data_lancamento?: string
          descricao?: string | null
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      mentoria_historico: {
        Row: {
          criado_em: string
          data_transacao: string
          descricao: string | null
          id: string
          mentoria_id: string
          tipo: string
          valor: number
        }
        Insert: {
          criado_em?: string
          data_transacao: string
          descricao?: string | null
          id?: string
          mentoria_id: string
          tipo: string
          valor: number
        }
        Update: {
          criado_em?: string
          data_transacao?: string
          descricao?: string | null
          id?: string
          mentoria_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentoria_historico_mentoria_id_fkey"
            columns: ["mentoria_id"]
            isOneToOne: false
            referencedRelation: "mentorias"
            referencedColumns: ["id"]
          },
        ]
      }
      mentoria_pagamentos: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_recebimento: string | null
          data_vencimento: string
          id: string
          mentoria_id: string
          status: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_recebimento?: string | null
          data_vencimento: string
          id?: string
          mentoria_id: string
          status?: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_recebimento?: string | null
          data_vencimento?: string
          id?: string
          mentoria_id?: string
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentoria_pagamentos_mentoria_id_fkey"
            columns: ["mentoria_id"]
            isOneToOne: false
            referencedRelation: "mentorias"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorias: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_venda: string
          id: string
          nome_cliente: string
          observacoes: string | null
          projeto: string
          valor_pendente: number | null
          valor_recebido: number
          valor_total: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_venda: string
          id?: string
          nome_cliente: string
          observacoes?: string | null
          projeto: string
          valor_pendente?: number | null
          valor_recebido?: number
          valor_total: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_venda?: string
          id?: string
          nome_cliente?: string
          observacoes?: string | null
          projeto?: string
          valor_pendente?: number | null
          valor_recebido?: number
          valor_total?: number
        }
        Relationships: []
      }
      pending_withdrawals: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          description: string
          fee_amount: number
          from_account_id: string
          id: string
          is_completed: boolean
          to_account_id: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          description: string
          fee_amount?: number
          from_account_id: string
          id?: string
          is_completed?: boolean
          to_account_id: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          description?: string
          fee_amount?: number
          from_account_id?: string
          id?: string
          is_completed?: boolean
          to_account_id?: string
          user_id?: string
        }
        Relationships: []
      }
      permission_group_items: {
        Row: {
          created_at: string
          group_id: string
          id: string
          permission_key: string
          resource_id: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          permission_key: string
          resource_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          permission_key?: string
          resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_group_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_group_items_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permission_keys"
            referencedColumns: ["key"]
          },
        ]
      }
      permission_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      permission_keys: {
        Row: {
          category: string
          created_at: string
          description: string | null
          is_dynamic: boolean
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          is_dynamic?: boolean
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          is_dynamic?: boolean
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean | null
          created_at: string
          email: string | null
          id: string
          modulos_permitidos: string[] | null
          nome: string | null
          parent_user_id: string | null
          tipo_de_usuario: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          email?: string | null
          id: string
          modulos_permitidos?: string[] | null
          nome?: string | null
          parent_user_id?: string | null
          tipo_de_usuario?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          modulos_permitidos?: string[] | null
          nome?: string | null
          parent_user_id?: string | null
          tipo_de_usuario?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_configurations: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          key: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          key: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          key?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      projetos: {
        Row: {
          criado_em: string
          id: string
          investimento: number
          nome: string
          receita: number
          tipo: string
        }
        Insert: {
          criado_em?: string
          id?: string
          investimento?: number
          nome: string
          receita?: number
          tipo: string
        }
        Update: {
          criado_em?: string
          id?: string
          investimento?: number
          nome?: string
          receita?: number
          tipo?: string
        }
        Relationships: []
      }
      receivable_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_types: {
        Row: {
          created_at: string
          id: string
          name: string
          project: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_permission_group: {
        Row: {
          assigned_at: string
          group_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          group_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_group_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission_key: string
          resource_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_key: string
          resource_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_key?: string
          resource_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permission_keys"
            referencedColumns: ["key"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_permissions: { Args: never; Returns: boolean }
      delete_user_completo: { Args: { uid: string }; Returns: undefined }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          permission_key: string
          resource_id: string
        }[]
      }
      has_perm: {
        Args: { _key: string; _resource_id?: string; _user_id: string }
        Returns: boolean
      }
      is_admin_user: { Args: never; Returns: boolean }
      recalculate_all_bank_balances: { Args: never; Returns: undefined }
      recalculate_bank_account_balance: {
        Args: { account_id: string }
        Returns: number
      }
      sync_bank_accounts_from_transactions: { Args: never; Returns: undefined }
    }
    Enums: {
      user_type: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_type: ["admin", "user"],
    },
  },
} as const
