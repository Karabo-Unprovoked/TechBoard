import { supabase } from './supabase';

export interface ErrorLog {
  error_type: string;
  error_message: string;
  error_details?: Record<string, any>;
  user_email?: string;
  source: string;
}

export const logError = async (errorLog: ErrorLog): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('error_logs')
      .insert({
        error_type: errorLog.error_type,
        error_message: errorLog.error_message,
        error_details: errorLog.error_details || {},
        user_email: user?.email || errorLog.user_email,
        source: errorLog.source,
      });

    if (error) {
      console.error('Failed to log error to database:', error);
    }
  } catch (err) {
    console.error('Error logging to database:', err);
  }
};

export const getErrorLogs = async (limit: number = 100, offset: number = 0) => {
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data;
};

export const getErrorLogsByType = async (errorType: string, limit: number = 100) => {
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .eq('error_type', errorType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
};

export const clearOldErrorLogs = async (daysOld: number = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { error } = await supabase
    .from('error_logs')
    .delete()
    .lt('created_at', cutoffDate.toISOString());

  if (error) {
    throw error;
  }
};
