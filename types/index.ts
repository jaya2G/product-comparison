export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: Date;
}

export interface Product {
  id: number;
  category_id: number;
  brand_id: number;
  name: string;
  slug: string;
  description?: string;
  release_year?: number;
  price?: number;
  rating: number;
  main_image_url?: string;
  popularity_score: number;
  created_at: Date;
  updated_at: Date;
  
  // Joined data
  category?: Category;
  brand?: Brand;
  specs?: ProductSpec[];
  media?: MediaAsset[];
}

export interface SpecDefinition {
  id: number;
  category_id: number;
  key: string;
  label: string;
  group_name: string;
  unit?: string;
  value_type: 'number' | 'text' | 'bool';
  created_at: Date;
}

export interface ProductSpec {
  id: number;
  product_id: number;
  spec_definition_id: number;
  value_number?: number;
  value_text?: string;
  value_bool?: boolean;
  
  // Joined data
  definition?: SpecDefinition;
}

export interface MediaAsset {
  id: number;
  product_id: number;
  type: 'image' | 'gallery' | '360' | '3d';
  url: string;
  sort_order: number;
  meta_json?: any;
  created_at: Date;
}

export interface Media360Meta {
  images: string[];
  fps?: number;
}

export interface Media3DMeta {
  model_url: string;
  thumbnail_url?: string;
  scale?: number;
}

export interface ComparisonResult {
  products: Product[];
  specs: {
    group_name: string;
    specs: {
      key: string;
      label: string;
      unit?: string;
      values: (string | number | boolean | null)[];
      winner_index?: number;
      is_different: boolean;
    }[];
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  timestamp: Date;
}

export interface SearchFilters {
  category?: string;
  brands?: string[];
  price_min?: number;
  price_max?: number;
  year_min?: number;
  year_max?: number;
  specs?: Record<string, any>;
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
}
