import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WhatsAppMessageRequest {
  phoneNumber: string;
  message: string;
  ticketId?: string;
  messageType?: string;
}

interface WhatsAppSettings {
  business_phone_number_id: string;
  access_token: string;
  is_enabled: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { phoneNumber, message, ticketId, messageType = 'notification' }: WhatsAppMessageRequest = await req.json();

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: "Phone number and message are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_settings?select=*`, {
      headers: {
        "apikey": supabaseKey!,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    const settings: WhatsAppSettings[] = await supabaseResponse.json();

    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ error: "WhatsApp settings not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const whatsappSettings = settings[0];

    if (!whatsappSettings.is_enabled) {
      return new Response(
        JSON.stringify({ error: "WhatsApp integration is disabled" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!whatsappSettings.business_phone_number_id || !whatsappSettings.access_token) {
      return new Response(
        JSON.stringify({ error: "WhatsApp credentials not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${whatsappSettings.business_phone_number_id}/messages`;

    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${whatsappSettings.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhoneNumber,
        type: "text",
        text: {
          body: message,
        },
      }),
    });

    const whatsappResult = await whatsappResponse.json();

    const logStatus = whatsappResponse.ok ? 'sent' : 'failed';
    const errorMessage = whatsappResponse.ok ? null : JSON.stringify(whatsappResult);
    const whatsappMessageId = whatsappResult.messages?.[0]?.id || null;

    if (ticketId) {
      await fetch(`${supabaseUrl}/rest/v1/whatsapp_message_log`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey!,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          customer_phone: cleanPhoneNumber,
          message_text: message,
          message_type: messageType,
          whatsapp_message_id: whatsappMessageId,
          status: logStatus,
          error_message: errorMessage,
        }),
      });
    }

    if (!whatsappResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to send WhatsApp message",
          details: whatsappResult
        }),
        {
          status: whatsappResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: whatsappMessageId,
        message: "WhatsApp message sent successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
