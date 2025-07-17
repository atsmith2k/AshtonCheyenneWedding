export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      guests: {
        Row: {
          id: string
          email: string | null
          first_name: string
          last_name: string
          phone: string | null
          invitation_code: string
          group_id: string | null
          rsvp_status: 'pending' | 'attending' | 'not_attending'
          meal_preference: 'chicken' | 'beef' | 'fish' | 'vegetarian' | 'vegan' | 'kids_meal' | null
          dietary_restrictions: string | null
          plus_one_allowed: boolean
          plus_one_name: string | null
          plus_one_meal: 'chicken' | 'beef' | 'fish' | 'vegetarian' | 'vegan' | 'kids_meal' | null
          notes: string | null
          rsvp_submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          first_name: string
          last_name: string
          phone?: string | null
          invitation_code: string
          group_id?: string | null
          rsvp_status?: 'pending' | 'attending' | 'not_attending'
          meal_preference?: 'chicken' | 'beef' | 'fish' | 'vegetarian' | 'vegan' | 'kids_meal' | null
          dietary_restrictions?: string | null
          plus_one_allowed?: boolean
          plus_one_name?: string | null
          plus_one_meal?: 'chicken' | 'beef' | 'fish' | 'vegetarian' | 'vegan' | 'kids_meal' | null
          notes?: string | null
          rsvp_submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string
          last_name?: string
          phone?: string | null
          invitation_code?: string
          group_id?: string | null
          rsvp_status?: 'pending' | 'attending' | 'not_attending'
          meal_preference?: 'chicken' | 'beef' | 'fish' | 'vegetarian' | 'vegan' | 'kids_meal' | null
          dietary_restrictions?: string | null
          plus_one_allowed?: boolean
          plus_one_name?: string | null
          plus_one_meal?: 'chicken' | 'beef' | 'fish' | 'vegetarian' | 'vegan' | 'kids_meal' | null
          notes?: string | null
          rsvp_submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      guest_groups: {
        Row: {
          id: string
          group_name: string
          max_guests: number
          invitation_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_name: string
          max_guests?: number
          invitation_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_name?: string
          max_guests?: number
          invitation_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wedding_events: {
        Row: {
          id: string
          name: string
          description: string | null
          date_time: string
          location: string
          address: string | null
          dress_code: string | null
          additional_info: string | null
          order_index: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          date_time: string
          location: string
          address?: string | null
          dress_code?: string | null
          additional_info?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          date_time?: string
          location?: string
          address?: string | null
          dress_code?: string | null
          additional_info?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          guest_id: string
          subject: string
          message: string
          response: string | null
          status: 'new' | 'responded' | 'archived'
          is_urgent: boolean
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          guest_id: string
          subject: string
          message: string
          response?: string | null
          status?: 'new' | 'responded' | 'archived'
          is_urgent?: boolean
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          guest_id?: string
          subject?: string
          message?: string
          response?: string | null
          status?: 'new' | 'responded' | 'archived'
          is_urgent?: boolean
          created_at?: string
          responded_at?: string | null
        }
      }
      photos: {
        Row: {
          id: string
          uploaded_by_guest_id: string | null
          uploaded_by_admin_id: string | null
          file_path: string
          thumbnail_path: string | null
          original_filename: string | null
          caption: string | null
          alt_text: string | null
          approved: boolean
          featured: boolean
          file_size: number | null
          mime_type: string | null
          width: number | null
          height: number | null
          album_id: string | null
          tags: string[] | null
          sort_order: number
          moderation_notes: string | null
          created_at: string
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id?: string
          uploaded_by_guest_id?: string | null
          uploaded_by_admin_id?: string | null
          file_path: string
          thumbnail_path?: string | null
          original_filename?: string | null
          caption?: string | null
          alt_text?: string | null
          approved?: boolean
          featured?: boolean
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          album_id?: string | null
          tags?: string[] | null
          sort_order?: number
          moderation_notes?: string | null
          created_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          uploaded_by_guest_id?: string | null
          uploaded_by_admin_id?: string | null
          file_path?: string
          thumbnail_path?: string | null
          original_filename?: string | null
          caption?: string | null
          alt_text?: string | null
          approved?: boolean
          featured?: boolean
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          album_id?: string | null
          tags?: string[] | null
          sort_order?: number
          moderation_notes?: string | null
          created_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
      }
      photo_albums: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_photo_id: string | null
          published: boolean
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cover_photo_id?: string | null
          published?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cover_photo_id?: string | null
          published?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wedding_info: {
        Row: {
          id: string
          section: string
          title: string
          content: string
          plain_text_content: string | null
          order_index: number
          published: boolean
          featured: boolean
          meta_description: string | null
          seo_keywords: string | null
          version: number
          created_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          section: string
          title: string
          content: string
          plain_text_content?: string | null
          order_index?: number
          published?: boolean
          featured?: boolean
          meta_description?: string | null
          seo_keywords?: string | null
          version?: number
          created_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          section?: string
          title?: string
          content?: string
          plain_text_content?: string | null
          order_index?: number
          published?: boolean
          featured?: boolean
          meta_description?: string | null
          seo_keywords?: string | null
          version?: number
          created_by?: string | null
          updated_at?: string
          created_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          role?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          is_active?: boolean
          created_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          template_type: string
          subject: string
          html_content: string
          text_content: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_type: string
          subject: string
          html_content: string
          text_content?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_type?: string
          subject?: string
          html_content?: string
          text_content?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      access_requests: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          message: string | null
          status: 'pending' | 'approved' | 'denied'
          admin_notes: string | null
          invitation_code: string | null
          invitation_sent_at: string | null
          created_at: string
          updated_at: string
          approved_by: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          address: string
          message?: string | null
          status?: 'pending' | 'approved' | 'denied'
          admin_notes?: string | null
          invitation_code?: string | null
          invitation_sent_at?: string | null
          created_at?: string
          updated_at?: string
          approved_by?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          message?: string | null
          status?: 'pending' | 'approved' | 'denied'
          admin_notes?: string | null
          invitation_code?: string | null
          invitation_sent_at?: string | null
          created_at?: string
          updated_at?: string
          approved_by?: string | null
          approved_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rsvp_status: 'pending' | 'attending' | 'not_attending'
      message_status: 'new' | 'responded' | 'archived'
      meal_option: 'chicken' | 'beef' | 'fish' | 'vegetarian' | 'vegan' | 'kids_meal'
      access_request_status: 'pending' | 'approved' | 'denied'
    }
  }
}
