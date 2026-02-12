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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          clicked_at: string
          converted: boolean | null
          converted_at: string | null
          id: string
          notes: string | null
          referrer: string | null
          tool_name: string
          tool_url: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          notes?: string | null
          referrer?: string | null
          tool_name: string
          tool_url: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          notes?: string | null
          referrer?: string | null
          tool_name?: string
          tool_url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          api_key_required: boolean | null
          category: string
          cost_per_month: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          internal_notes: string | null
          name: string
          rating: number | null
          status: Database["public"]["Enums"]["tool_status"] | null
          updated_at: string | null
          url: string | null
          use_case: string | null
        }
        Insert: {
          api_key_required?: boolean | null
          category: string
          cost_per_month?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          name: string
          rating?: number | null
          status?: Database["public"]["Enums"]["tool_status"] | null
          updated_at?: string | null
          url?: string | null
          use_case?: string | null
        }
        Update: {
          api_key_required?: boolean | null
          category?: string
          cost_per_month?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          name?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["tool_status"] | null
          updated_at?: string | null
          url?: string | null
          use_case?: string | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          bio: string | null
          created_at: string | null
          credentials: Json | null
          expertise_areas: string[] | null
          id: string
          is_reviewer: boolean | null
          linkedin_url: string | null
          name: string
          photo_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          credentials?: Json | null
          expertise_areas?: string[] | null
          id?: string
          is_reviewer?: boolean | null
          linkedin_url?: string | null
          name: string
          photo_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          credentials?: Json | null
          expertise_areas?: string[] | null
          id?: string
          is_reviewer?: boolean | null
          linkedin_url?: string | null
          name?: string
          photo_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          citations: Json | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          funnel_stage: Database["public"]["Enums"]["funnel_stage"] | null
          group_id: string | null
          hreflang: string | null
          id: string
          image_alt_text: string | null
          image_caption: string | null
          language: string | null
          meta_description: string | null
          published_at: string | null
          reading_time: number | null
          reviewed_by: string | null
          schema_data: Json | null
          seo_score: number | null
          slug: string
          spell_checked: boolean | null
          status: Database["public"]["Enums"]["content_status"] | null
          tags: string[] | null
          title: string
          tone_validated: boolean | null
          translated_from: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          citations?: Json | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          funnel_stage?: Database["public"]["Enums"]["funnel_stage"] | null
          group_id?: string | null
          hreflang?: string | null
          id?: string
          image_alt_text?: string | null
          image_caption?: string | null
          language?: string | null
          meta_description?: string | null
          published_at?: string | null
          reading_time?: number | null
          reviewed_by?: string | null
          schema_data?: Json | null
          seo_score?: number | null
          slug: string
          spell_checked?: boolean | null
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          title: string
          tone_validated?: boolean | null
          translated_from?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          citations?: Json | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          funnel_stage?: Database["public"]["Enums"]["funnel_stage"] | null
          group_id?: string | null
          hreflang?: string | null
          id?: string
          image_alt_text?: string | null
          image_caption?: string | null
          language?: string | null
          meta_description?: string | null
          published_at?: string | null
          reading_time?: number | null
          reviewed_by?: string | null
          schema_data?: Json | null
          seo_score?: number | null
          slug?: string
          spell_checked?: boolean | null
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          title?: string
          tone_validated?: boolean | null
          translated_from?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_translated_from_fkey"
            columns: ["translated_from"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          address_city: string
          address_state: string
          address_street: string
          address_zip: string
          business_name: string
          email: string
          facebook_url: string | null
          hours_monday_friday: string
          hours_saturday: string
          hours_sunday: string
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phone_local: string
          phone_toll_free: string
          timezone: string
          twitter_url: string | null
          updated_at: string | null
          updated_by: string | null
          youtube_url: string | null
        }
        Insert: {
          address_city?: string
          address_state?: string
          address_street?: string
          address_zip?: string
          business_name?: string
          email?: string
          facebook_url?: string | null
          hours_monday_friday?: string
          hours_saturday?: string
          hours_sunday?: string
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_local?: string
          phone_toll_free?: string
          timezone?: string
          twitter_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          youtube_url?: string | null
        }
        Update: {
          address_city?: string
          address_state?: string
          address_street?: string
          address_zip?: string
          business_name?: string
          email?: string
          facebook_url?: string | null
          hours_monday_friday?: string
          hours_saturday?: string
          hours_sunday?: string
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_local?: string
          phone_toll_free?: string
          timezone?: string
          twitter_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      citations: {
        Row: {
          authority_score: number | null
          created_at: string | null
          id: string
          last_checked: string | null
          status: Database["public"]["Enums"]["citation_status"] | null
          title: string | null
          updated_at: string | null
          url: string
          used_in_posts: number | null
        }
        Insert: {
          authority_score?: number | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          status?: Database["public"]["Enums"]["citation_status"] | null
          title?: string | null
          updated_at?: string | null
          url: string
          used_in_posts?: number | null
        }
        Update: {
          authority_score?: number | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          status?: Database["public"]["Enums"]["citation_status"] | null
          title?: string | null
          updated_at?: string | null
          url?: string
          used_in_posts?: number | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          email: string
          ghl_contact_id: string | null
          id: string
          ip_address: string | null
          message: string | null
          name: string
          phone: string | null
          service: string | null
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          email: string
          ghl_contact_id?: string | null
          id?: string
          ip_address?: string | null
          message?: string | null
          name: string
          phone?: string | null
          service?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          email?: string
          ghl_contact_id?: string | null
          id?: string
          ip_address?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          service?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      content_clusters: {
        Row: {
          article_count: number
          created_at: string
          created_by: string | null
          id: string
          language: string
          primary_keyword: string
          progress: Json | null
          status: string
          target_audience: string | null
          topic: string
        }
        Insert: {
          article_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string
          primary_keyword: string
          progress?: Json | null
          status?: string
          target_audience?: string | null
          topic: string
        }
        Update: {
          article_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string
          primary_keyword?: string
          progress?: Json | null
          status?: string
          target_audience?: string | null
          topic?: string
        }
        Relationships: []
      }
      content_updates: {
        Row: {
          change_type: string | null
          changed_at: string | null
          changed_by: string | null
          description: string | null
          id: string
          post_id: string | null
          post_type: string | null
        }
        Insert: {
          change_type?: string | null
          changed_at?: string | null
          changed_by?: string | null
          description?: string | null
          id?: string
          post_id?: string | null
          post_type?: string | null
        }
        Update: {
          change_type?: string | null
          changed_at?: string | null
          changed_by?: string | null
          description?: string | null
          id?: string
          post_id?: string | null
          post_type?: string | null
        }
        Relationships: []
      }
      custom_quotes: {
        Row: {
          client_business: string | null
          client_email: string
          client_name: string
          client_revenue_range: string | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          discount_percent: number | null
          expiration_date: string | null
          id: string
          line_items: Json | null
          notes: string | null
          package_id: string | null
          responded_at: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          total: number
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          client_business?: string | null
          client_email: string
          client_name: string
          client_revenue_range?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expiration_date?: string | null
          id?: string
          line_items?: Json | null
          notes?: string | null
          package_id?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          total: number
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          client_business?: string | null
          client_email?: string
          client_name?: string
          client_revenue_range?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expiration_date?: string | null
          id?: string
          line_items?: Json | null
          notes?: string | null
          package_id?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_quotes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_diagrams: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          mermaid_code: string
          svg_url: string | null
          title: string
          used_in_posts: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mermaid_code: string
          svg_url?: string | null
          title: string
          used_in_posts?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mermaid_code?: string
          svg_url?: string | null
          title?: string
          used_in_posts?: string[] | null
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          created_by: string | null
          filename: string
          id: string
          prompt_used: string | null
          storage_url: string | null
          tool_used: string | null
          used_in_posts: string[] | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          created_by?: string | null
          filename: string
          id?: string
          prompt_used?: string | null
          storage_url?: string | null
          tool_used?: string | null
          used_in_posts?: string[] | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          created_by?: string | null
          filename?: string
          id?: string
          prompt_used?: string | null
          storage_url?: string | null
          tool_used?: string | null
          used_in_posts?: string[] | null
        }
        Relationships: []
      }
      internal_links: {
        Row: {
          anchor_text: string | null
          created_at: string | null
          funnel_direction: string | null
          id: string
          is_valid: boolean | null
          last_verified: string | null
          link_type: string | null
          source_page: string | null
          source_post_id: string | null
          target_post_id: string | null
          target_url: string
        }
        Insert: {
          anchor_text?: string | null
          created_at?: string | null
          funnel_direction?: string | null
          id?: string
          is_valid?: boolean | null
          last_verified?: string | null
          link_type?: string | null
          source_page?: string | null
          source_post_id?: string | null
          target_post_id?: string | null
          target_url: string
        }
        Update: {
          anchor_text?: string | null
          created_at?: string | null
          funnel_direction?: string | null
          id?: string
          is_valid?: boolean | null
          last_verified?: string | null
          link_type?: string | null
          source_page?: string | null
          source_post_id?: string | null
          target_post_id?: string | null
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_links_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_links_target_post_id_fkey"
            columns: ["target_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      master_prompts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          prompt_text: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          prompt_text: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          prompt_text?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      page_health_scores: {
        Row: {
          cluster_category: string | null
          created_at: string | null
          funnel_stage: string | null
          has_article_schema: boolean | null
          has_author_schema: boolean | null
          has_breadcrumb_schema: boolean | null
          has_canonical: boolean | null
          has_eeat_block: boolean | null
          has_faq_schema: boolean | null
          has_internal_links: boolean | null
          has_meta_description: boolean | null
          has_og_tags: boolean | null
          has_organization_schema: boolean | null
          has_speakable_schema: boolean | null
          has_title: boolean | null
          id: string
          internal_link_count: number | null
          last_scanned: string | null
          linking_score: number | null
          overall_score: number | null
          page_type: string | null
          page_url: string
          post_id: string | null
          schema_score: number | null
          seo_score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cluster_category?: string | null
          created_at?: string | null
          funnel_stage?: string | null
          has_article_schema?: boolean | null
          has_author_schema?: boolean | null
          has_breadcrumb_schema?: boolean | null
          has_canonical?: boolean | null
          has_eeat_block?: boolean | null
          has_faq_schema?: boolean | null
          has_internal_links?: boolean | null
          has_meta_description?: boolean | null
          has_og_tags?: boolean | null
          has_organization_schema?: boolean | null
          has_speakable_schema?: boolean | null
          has_title?: boolean | null
          id?: string
          internal_link_count?: number | null
          last_scanned?: string | null
          linking_score?: number | null
          overall_score?: number | null
          page_type?: string | null
          page_url: string
          post_id?: string | null
          schema_score?: number | null
          seo_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cluster_category?: string | null
          created_at?: string | null
          funnel_stage?: string | null
          has_article_schema?: boolean | null
          has_author_schema?: boolean | null
          has_breadcrumb_schema?: boolean | null
          has_canonical?: boolean | null
          has_eeat_block?: boolean | null
          has_faq_schema?: boolean | null
          has_internal_links?: boolean | null
          has_meta_description?: boolean | null
          has_og_tags?: boolean | null
          has_organization_schema?: boolean | null
          has_speakable_schema?: boolean | null
          has_title?: boolean | null
          id?: string
          internal_link_count?: number | null
          last_scanned?: string | null
          linking_score?: number | null
          overall_score?: number | null
          page_type?: string | null
          page_url?: string
          post_id?: string | null
          schema_score?: number | null
          seo_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_health_scores_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_settings: {
        Row: {
          default_cta_text: string | null
          default_display_type: string | null
          id: string
          pricing_philosophy: string | null
          quote_request_enabled: boolean | null
          quote_request_redirect_url: string | null
          show_pricing_publicly: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          default_cta_text?: string | null
          default_display_type?: string | null
          id?: string
          pricing_philosophy?: string | null
          quote_request_enabled?: boolean | null
          quote_request_redirect_url?: string | null
          show_pricing_publicly?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          default_cta_text?: string | null
          default_display_type?: string | null
          id?: string
          pricing_philosophy?: string | null
          quote_request_enabled?: boolean | null
          quote_request_redirect_url?: string | null
          show_pricing_publicly?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      qa_articles: {
        Row: {
          answer: string
          author_id: string | null
          citations: Json | null
          created_at: string | null
          faq_schema: Json | null
          funnel_stage: Database["public"]["Enums"]["funnel_stage"] | null
          group_id: string | null
          hreflang: string | null
          id: string
          language: string | null
          meta_description: string | null
          published_at: string | null
          question: string
          reviewed_by: string | null
          slug: string
          source_blog_id: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          tags: string[] | null
          translated_from: string | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          author_id?: string | null
          citations?: Json | null
          created_at?: string | null
          faq_schema?: Json | null
          funnel_stage?: Database["public"]["Enums"]["funnel_stage"] | null
          group_id?: string | null
          hreflang?: string | null
          id?: string
          language?: string | null
          meta_description?: string | null
          published_at?: string | null
          question: string
          reviewed_by?: string | null
          slug: string
          source_blog_id?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          translated_from?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          author_id?: string | null
          citations?: Json | null
          created_at?: string | null
          faq_schema?: Json | null
          funnel_stage?: Database["public"]["Enums"]["funnel_stage"] | null
          group_id?: string | null
          hreflang?: string | null
          id?: string
          language?: string | null
          meta_description?: string | null
          published_at?: string | null
          question?: string
          reviewed_by?: string | null
          slug?: string
          source_blog_id?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          translated_from?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_articles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_articles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_articles_source_blog_id_fkey"
            columns: ["source_blog_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_articles_translated_from_fkey"
            columns: ["translated_from"]
            isOneToOne: false
            referencedRelation: "qa_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          cta_link: string | null
          cta_text: string | null
          description: string | null
          display_type: string | null
          features: Json | null
          id: string
          is_addon: boolean | null
          name: string
          price_range_max: number | null
          price_range_min: number | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          display_type?: string | null
          features?: Json | null
          id?: string
          is_addon?: boolean | null
          name: string
          price_range_max?: number | null
          price_range_min?: number | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          display_type?: string | null
          features?: Json | null
          id?: string
          is_addon?: boolean | null
          name?: string
          price_range_max?: number | null
          price_range_min?: number | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          anti_hallucination_rules: string | null
          brand_voice: string | null
          canonical_domain: string | null
          eeat_authority_block: string | null
          enforce_hreflang: boolean | null
          faq_rules: string | null
          id: string
          master_prompt: string | null
          mission_statement: string | null
          speakable_rules: string | null
          spelling_enforcement: boolean | null
          supported_languages: Json | null
          target_audience_rules: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          anti_hallucination_rules?: string | null
          brand_voice?: string | null
          canonical_domain?: string | null
          eeat_authority_block?: string | null
          enforce_hreflang?: boolean | null
          faq_rules?: string | null
          id?: string
          master_prompt?: string | null
          mission_statement?: string | null
          speakable_rules?: string | null
          spelling_enforcement?: boolean | null
          supported_languages?: Json | null
          target_audience_rules?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          anti_hallucination_rules?: string | null
          brand_voice?: string | null
          canonical_domain?: string | null
          eeat_authority_block?: string | null
          enforce_hreflang?: boolean | null
          faq_rules?: string | null
          id?: string
          master_prompt?: string | null
          mission_statement?: string | null
          speakable_rules?: string | null
          spelling_enforcement?: boolean | null
          supported_languages?: Json | null
          target_audience_rules?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      app_role: "admin" | "editor"
      citation_status: "valid" | "broken" | "outdated"
      content_status: "draft" | "review" | "published" | "archived"
      funnel_stage: "TOFU" | "MOFU" | "BOFU"
      tool_status: "active" | "testing" | "deprecated"
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
      app_role: ["admin", "editor"],
      citation_status: ["valid", "broken", "outdated"],
      content_status: ["draft", "review", "published", "archived"],
      funnel_stage: ["TOFU", "MOFU", "BOFU"],
      tool_status: ["active", "testing", "deprecated"],
    },
  },
} as const
