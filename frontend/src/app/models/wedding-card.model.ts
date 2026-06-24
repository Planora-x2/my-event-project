export interface Venue {
  id: number;
  name: string;
  address: string;
  country: string;
  state: string;
  district?: string;
  capacity: number;
  image?: string;
}

export interface WeddingCard {
  id?: string;
  user?: number;
  bride_name: string;
  groom_name: string;
  bride_parents?: string;
  groom_parents?: string;
  bride_address?: string;
  groom_address?: string;
  date: string | Date;
  venue: number | null; // Venue ID for creation
  venue_details?: Venue; // Populated from backend on read
  is_custom_venue?: boolean;
  custom_venue_name?: string;
  custom_venue_address?: string;
  custom_venue_lat?: number;
  custom_venue_lng?: number;
  template_id: string;
  message?: string;
  
  // Customization
  primary_color?: string;
  background_color?: string;
  font_family?: string;
  cover_image?: string | File;
  
  created_at?: string;
  updated_at?: string;
  is_save_the_date?: boolean;
  rsvps?: any[];
}
