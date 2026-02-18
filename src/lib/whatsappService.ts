import { supabase } from './supabase';

interface WhatsAppMessageParams {
  phoneNumber: string;
  message: string;
  ticketId?: string;
  messageType?: string;
}

export const sendWhatsAppMessage = async ({
  phoneNumber,
  message,
  ticketId,
  messageType = 'notification'
}: WhatsAppMessageParams): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching WhatsApp settings:', settingsError);
      return { success: false, error: 'Failed to load WhatsApp settings' };
    }

    if (!settings || !settings.is_enabled) {
      return { success: false, error: 'WhatsApp integration is not enabled' };
    }

    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber,
        message,
        ticketId,
        messageType
      }
    });

    if (error) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, error: error.message || 'Failed to send WhatsApp message' };
    }

    return {
      success: data.success,
      error: data.error,
      messageId: data.messageId
    };
  } catch (error: any) {
    console.error('WhatsApp service error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

export const sendTicketCreatedMessage = async (
  customerPhone: string,
  customerName: string,
  ticketNumber: string,
  ticketId: string
): Promise<{ success: boolean; error?: string }> => {
  const message = `Hi ${customerName}, your device has been received. Ticket #${ticketNumber}. We'll update you on progress.`;

  return sendWhatsAppMessage({
    phoneNumber: customerPhone,
    message,
    ticketId,
    messageType: 'ticket_created'
  });
};

export const sendStatusUpdateMessage = async (
  customerPhone: string,
  ticketNumber: string,
  newStatus: string,
  ticketId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> => {
  let message = `Update for Ticket #${ticketNumber}: Status changed to ${newStatus}.`;

  if (notes) {
    message += ` ${notes}`;
  }

  return sendWhatsAppMessage({
    phoneNumber: customerPhone,
    message,
    ticketId,
    messageType: 'status_update'
  });
};

export const sendReadyForPickupMessage = async (
  customerPhone: string,
  ticketNumber: string,
  ticketId: string
): Promise<{ success: boolean; error?: string }> => {
  const message = `Great news! Your device (Ticket #${ticketNumber}) is ready for collection. Please visit us during business hours.`;

  return sendWhatsAppMessage({
    phoneNumber: customerPhone,
    message,
    ticketId,
    messageType: 'ready_for_pickup'
  });
};

export const getWhatsAppMessageLogs = async (ticketId: string) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_message_log')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('sent_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching WhatsApp message logs:', error);
    return { success: false, error: error.message };
  }
};
