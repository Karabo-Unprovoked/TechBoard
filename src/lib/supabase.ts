import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key';

if (!isConfigured) {
  console.warn('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Export configuration status
export const isSupabaseConfigured = isConfigured;
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
  repair_notes?: string;
  priority?: string;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  notes?: TicketNote[];
  emails?: TicketEmail[];
  attachments?: TicketAttachment[];
}

export type TicketNote = {
  id: string;
  ticket_id: string;
  note_type: string;
  content: string;
  created_by?: string;
  created_at: string;
}

export type TicketEmail = {
  id: string;
  ticket_id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  content: string;
  sent_at: string;
  sent_by?: string;
}

export type TicketAttachment = {
  id: string;
  ticket_id: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_url: string;
  uploaded_by?: string;
  uploaded_at: string;
}