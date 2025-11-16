import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UserManagementRequest {
  action: 'list' | 'create' | 'update' | 'delete' | 'reset-password';
  email?: string;
  role?: 'admin' | 'technician' | 'viewer';
  userId?: string;
  password?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl) {
      console.error('SUPABASE_URL environment variable is not set');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: SUPABASE_URL not configured' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not configured' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { action, email, role, userId, password }: UserManagementRequest = await req.json();

    switch (action) {
      case 'list': {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        
        // Transform users to include role from metadata
        const users = data.users.map(user => ({
          id: user.id,
          email: user.email || '',
          role: (user.user_metadata?.role || 'viewer') as 'admin' | 'technician' | 'viewer',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        }));

        return new Response(
          JSON.stringify({ success: true, users }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        if (!email || !role) {
          throw new Error('Email and role are required for user creation');
        }

        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password: password || 'TempPassword123!',
          email_confirm: true,
          user_metadata: { role }
        });

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User created successfully',
            user: data.user,
            tempPassword: password || 'TempPassword123!'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!userId || !role) {
          throw new Error('User ID and role are required for user update');
        }

        const { error } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { role }
        });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: 'User role updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!userId) {
          throw new Error('User ID is required for user deletion');
        }

        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: 'User deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'reset-password': {
        if (!userId) {
          throw new Error('User ID is required for password reset');
        }

        // Generate a new temporary password
        const newTempPassword = 'TempPassword' + Math.floor(Math.random() * 10000) + '!';

        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: newTempPassword
        });

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Password reset successfully',
            tempPassword: newTempPassword
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('User management error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});