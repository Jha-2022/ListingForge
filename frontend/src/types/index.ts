export type Marketplace = 'etsy' | 'amazon' | 'meesho';
export type Language = 'english' | 'hindi' | 'hinglish';

export interface ListingImage {
  id: string;
  listing_id: string;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
}

export interface Listing {
  id: string;
  marketplace: Marketplace;
  language: Language;
  voice_profile_id?: string | null;
  status: 'generating' | 'done' | 'error';
  product_name_hint?: string;
  material?: string;
  size?: string;
  price?: string;
  target_buyer?: string;
  keywords?: string; // JSON array string
  product_analysis?: string; // JSON string
  title?: string;
  bullets?: string; // JSON array string
  description?: string;
  tags?: string; // JSON array string
  backend_search_terms?: string;
  materials_field?: string;
  attributes?: string; // JSON string
  alt_texts?: string; // JSON array string
  error_message?: string;
  created_at: string;
  updated_at: string;
  images?: ListingImage[];
}

export interface VoiceProfile {
  id: string;
  name: string;
  style_description?: string;
  sample_listings?: string; // JSON array string or array
  created_at: string;
  updated_at: string;
}

export interface BatchItem {
  id: string;
  job_id: string;
  folder_name: string;
  product_name_hint?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  listing_id?: string;
  error_message?: string;
}

export interface BatchJob {
  id: string;
  marketplace: Marketplace;
  language: Language;
  voice_profile_id?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  total_items: number;
  processed_items: number;
  failed_items: number;
  created_at: string;
  items?: BatchItem[];
}
