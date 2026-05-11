/**
 * Database types for the Supabase typed client.
 *
 * Two ways to keep this in sync with the database:
 *   1. Manual: edit this file when schema changes.
 *   2. Generated (preferred once the project is provisioned): run
 *      `npx supabase gen types typescript --project-id <REF> > lib/supabase/types.ts`
 *
 * This file mirrors `supabase/migrations/20260511000001_initial_schema.sql`.
 */

export type Database = {
  public: {
    Tables: {
      settings: {
        Row: { key: string; value: unknown; updated_at: string };
        Insert: { key: string; value: unknown };
        Update: { value?: unknown };
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          display_order: number;
          is_visible: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menu_categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['menu_categories']['Insert']>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          long_description: string | null;
          price_gbp: number;
          image_path: string | null;
          gallery_paths: string[];
          is_available_today: boolean;
          is_cod_eligible: boolean;
          is_featured: boolean;
          is_hidden: boolean;
          dietary_tags: string[];
          allergen_tags: string[];
          badges: string[];
          variants: VariantsBlob;
          addons: AddonsBlob;
          display_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>;
        Relationships: [];
      };
      delivery_zones: {
        Row: {
          id: string;
          name: string;
          postcodes: string[];
          base_fee_gbp: number;
          min_order_gbp: number;
          prep_time_min: number;
          prep_time_max: number;
          is_quoted: boolean;
          allows_cod: boolean;
          is_active: boolean;
          display_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['delivery_zones']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['delivery_zones']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          phone: string | null;
          is_admin: boolean;
          marketing_opt_in: boolean;
          notify_status_changes: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Pick<Database['public']['Tables']['profiles']['Row'], 'id'> &
          Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          profile_id: string;
          label: string | null;
          recipient_name: string;
          line1: string;
          line2: string | null;
          city: string;
          postcode: string;
          phone: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          ref: string;
          profile_id: string | null;
          customer_first_name: string;
          customer_last_name: string;
          customer_email: string;
          customer_phone: string;
          delivery_line1: string;
          delivery_line2: string | null;
          delivery_city: string;
          delivery_postcode: string;
          delivery_zone_id: string | null;
          delivery_fee_gbp: number;
          delivery_date: string;
          delivery_window_start: string;
          delivery_window_end: string;
          delivery_notes: string | null;
          subtotal_gbp: number;
          total_gbp: number;
          payment_method: 'card' | 'cod';
          payment_status: 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';
          stripe_payment_intent_id: string | null;
          card_brand: string | null;
          card_last4: string | null;
          cod_status: 'uncollected' | 'collected' | null;
          cod_collected_at: string | null;
          cod_collected_by: string | null;
          refund_amount_gbp: number | null;
          refund_reason: string | null;
          status: 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';
          cancelled_at: string | null;
          cancelled_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          ref?: string;
          profile_id?: string | null;
          customer_first_name: string;
          customer_last_name: string;
          customer_email: string;
          customer_phone: string;
          delivery_line1: string;
          delivery_line2?: string | null;
          delivery_city: string;
          delivery_postcode: string;
          delivery_zone_id?: string | null;
          delivery_fee_gbp: number;
          delivery_date: string;
          delivery_window_start: string;
          delivery_window_end: string;
          delivery_notes?: string | null;
          subtotal_gbp: number;
          total_gbp: number;
          payment_method: 'card' | 'cod';
          payment_status?: 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';
          stripe_payment_intent_id?: string | null;
          card_brand?: string | null;
          card_last4?: string | null;
          cod_status?: 'uncollected' | 'collected' | null;
          cod_collected_at?: string | null;
          cod_collected_by?: string | null;
          refund_amount_gbp?: number | null;
          refund_reason?: string | null;
          status?: 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          name: string;
          unit_price_gbp: number;
          quantity: number;
          line_total_gbp: number;
          variants_chosen: Record<string, { label: string; deltaGbp: number }>;
          addons_chosen: Array<{ label: string; deltaGbp: number }>;
          special_instructions: string | null;
          image_path: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
        Relationships: [];
      };
      kitchen_notes: {
        Row: {
          id: string;
          order_id: string;
          author_id: string | null;
          author_name: string;
          status_at_time: 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled' | null;
          body: string;
          visible_to_customer: boolean;
          emailed: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kitchen_notes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kitchen_notes']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

/** Variants editor data shape — see admin-settings.md §4 */
export interface VariantsBlob {
  groups: {
    name: string;
    is_required: boolean;
    is_single_choice?: boolean;
    options: {
      label: string;
      price_delta_gbp: number;
    }[];
  }[];
}

/** Addons editor data shape */
export interface AddonsBlob {
  items: {
    label: string;
    description?: string;
    price_delta_gbp: number;
  }[];
}
