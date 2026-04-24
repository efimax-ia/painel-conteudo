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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contents: {
        Row: {
          captured_at: string | null
          comments: number | null
          conteudo: string
          created_at: string
          id: string
          likes: number | null
          platform: Database["public"]["Enums"]["content_platform"] | null
          source_profile: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["approval_status"]
          thumbnail_url: string | null
          updated_at: string
          used_at: string | null
          views: number | null
        }
        Insert: {
          captured_at?: string | null
          comments?: number | null
          conteudo: string
          created_at?: string
          id?: string
          likes?: number | null
          platform?: Database["public"]["Enums"]["content_platform"] | null
          source_profile?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          thumbnail_url?: string | null
          updated_at?: string
          used_at?: string | null
          views?: number | null
        }
        Update: {
          captured_at?: string | null
          comments?: number | null
          conteudo?: string
          created_at?: string
          id?: string
          likes?: number | null
          platform?: Database["public"]["Enums"]["content_platform"] | null
          source_profile?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          thumbnail_url?: string | null
          updated_at?: string
          used_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      generated_contents: {
        Row: {
          agent_name: string | null
          cover_ideas: Json | null
          created_at: string
          generated_at: string | null
          hashtags: string | null
          id: string
          legenda: string | null
          observations: string | null
          platform: Database["public"]["Enums"]["content_platform"] | null
          rating: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          roteiro: string
          source_content_id: string | null
          status: Database["public"]["Enums"]["approval_status"]
          tema: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          cover_ideas?: Json | null
          created_at?: string
          generated_at?: string | null
          hashtags?: string | null
          id?: string
          legenda?: string | null
          observations?: string | null
          platform?: Database["public"]["Enums"]["content_platform"] | null
          rating?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roteiro: string
          source_content_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          tema?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          cover_ideas?: Json | null
          created_at?: string
          generated_at?: string | null
          hashtags?: string | null
          id?: string
          legenda?: string | null
          observations?: string | null
          platform?: Database["public"]["Enums"]["content_platform"] | null
          rating?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roteiro?: string
          source_content_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          tema?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_contents_source_content_id_fkey"
            columns: ["source_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      notify_edge_function: {
        Args: { _function_name: string; _payload: Json }
        Returns: undefined
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      content_platform:
        | "instagram"
        | "tiktok"
        | "youtube"
        | "twitter"
        | "linkedin"
        | "facebook"
        | "other"
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
      approval_status: ["pending", "approved", "rejected"],
      content_platform: [
        "instagram",
        "tiktok",
        "youtube",
        "twitter",
        "linkedin",
        "facebook",
        "other",
      ],
    },
  },
} as const
