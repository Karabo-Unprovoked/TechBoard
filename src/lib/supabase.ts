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
    },
    global: {
      headers: {
        'X-Client-Info': 'guardian-assist-v1.0'
      }
    }
  }
);

// Export configuration status
export const isSupabaseConfigured = isConfigured;

// User role management
export const getUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.role || 'viewer';
};

export const hasPermission = async (requiredRole: 'admin' | 'technician' | 'viewer') => {
  const userRole = await getUserRole();
  
  const roleHierarchy = {
    'admin': 3,
    'technician': 2,
    'viewer': 1
  };
  
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
};

export type Customer = {
  id: string;
  customer_number: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  referral_source?: string;
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
  device_accessories?: string[];
  status: string;
  internal_status?: string;
  outsourced_to?: string;
  pending_customer_action_type?: string;
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

export type TicketStatus = {
  id: string;
  status_key: string;
  status_label: string;
  status_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sub_statuses?: TicketSubStatus[];
}

export type TicketSubStatus = {
  id: string;
  parent_status_id: string;
  sub_status_key: string;
  sub_status_label: string;
  sub_status_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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