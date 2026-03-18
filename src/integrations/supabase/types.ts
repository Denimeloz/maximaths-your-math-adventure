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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          correction_url: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          level: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          level: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          level?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          allow_late_submission: boolean
          chapter_id: string | null
          correction_url: string | null
          course_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          file_url: string | null
          id: string
          instructions: string | null
          is_published: boolean
          level: string | null
          max_points: number
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          allow_late_submission?: boolean
          chapter_id?: string | null
          correction_url?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          level?: string | null
          max_points?: number
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          allow_late_submission?: boolean
          chapter_id?: string | null
          correction_url?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          level?: string | null
          max_points?: number
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      class_info: {
        Row: {
          content: string | null
          created_at: string
          file_url: string | null
          file_urls: Json | null
          id: string
          is_published: boolean
          level: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          file_urls?: Json | null
          id?: string
          is_published?: boolean
          level: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          file_urls?: Json | null
          id?: string
          is_published?: boolean
          level?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_urls: Json | null
          is_published: boolean
          level: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: Json | null
          is_published?: boolean
          level: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: Json | null
          is_published?: boolean
          level?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_activities: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_published: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_subjects: {
        Row: {
          activity_id: string
          correction_url: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_subjects_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "club_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      course_files: {
        Row: {
          chapter_id: string | null
          course_id: string | null
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_published: boolean
          order_index: number
          title: string
        }
        Insert: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
        }
        Update: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_files_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          level: Database["public"]["Enums"]["course_level"]
          order_index: number
          pdf_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          level: Database["public"]["Enums"]["course_level"]
          order_index?: number
          pdf_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          order_index?: number
          pdf_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dnb_content: {
        Row: {
          category: string
          content: string | null
          correction_url: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          order_index: number
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string
          content?: string | null
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string
          content?: string | null
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      evaluation_submissions: {
        Row: {
          content: string | null
          evaluation_id: string
          feedback: string | null
          file_url: string | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          evaluation_id: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          evaluation_id?: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_submissions_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          chapter_id: string | null
          correction_url: string | null
          course_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          file_url: string | null
          id: string
          instructions: string | null
          is_published: boolean
          level: string | null
          max_points: number
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          chapter_id?: string | null
          correction_url?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          level?: string | null
          max_points?: number
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string | null
          correction_url?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          level?: string | null
          max_points?: number
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          answer: string | null
          chapter_id: string | null
          correction_url: string | null
          course_id: string | null
          created_at: string
          difficulty: number
          explanation: string | null
          file_url: string | null
          id: string
          is_published: boolean
          order_index: number
          points: number
          question: string | null
          title: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          chapter_id?: string | null
          correction_url?: string | null
          course_id?: string | null
          created_at?: string
          difficulty?: number
          explanation?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          points?: number
          question?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          chapter_id?: string | null
          correction_url?: string | null
          course_id?: string | null
          created_at?: string
          difficulty?: number
          explanation?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          points?: number
          question?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_resolved: boolean
          lesson_id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          lesson_id: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          lesson_id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          lesson_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          lesson_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          lesson_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          chapter_id: string | null
          content: string
          course_id: string | null
          created_at: string
          id: string
          is_published: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          chapter_id?: string | null
          content: string
          course_id?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string | null
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          level: string | null
          profession: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          level?: string | null
          profession?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          level?: string | null
          profession?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_exercises: {
        Row: {
          correction_url: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          level: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          level: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          level?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_tests: {
        Row: {
          correction_url: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          level: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          level: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          correction_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          level?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          chapter_id: string | null
          course_id: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean
          order_index: number
          title: string
          video_url: string
        }
        Insert: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
          video_url: string
        }
        Update: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      course_level:
        | "6eme"
        | "5eme"
        | "4eme"
        | "3eme"
        | "seconde"
        | "premiere"
        | "terminale"
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
      app_role: ["admin", "user"],
      course_level: [
        "6eme",
        "5eme",
        "4eme",
        "3eme",
        "seconde",
        "premiere",
        "terminale",
      ],
    },
  },
} as const
