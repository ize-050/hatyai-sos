import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type DbSOSRequest = {
  id: string;
  name: string | null;
  phone: string;
  help_type: 'food' | 'medical' | 'evacuation' | 'boat';
  severity: 'low' | 'medium' | 'high';
  description: string | null;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
};

export type DbUpdate = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  created_at: string;
};
