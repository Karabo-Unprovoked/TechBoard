import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please configure Supabase connection.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
};

export type RepairTicket = {
  id: string;
  ticket_number: string;
  customer_id: string;
  device_type: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  issue_description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;