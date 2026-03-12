import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OverdueTicket {
  id: string;
  ticket_number: string;
  status: string;
  customer_name: string;
  device_type: string;
  sla_hours: number;
  status_changed_at: string;
  hours_overdue: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: overdueTickets, error: ticketsError } = await supabase
      .rpc("get_overdue_tickets");

    if (ticketsError) {
      console.error("Error fetching overdue tickets:", ticketsError);
      throw ticketsError;
    }

    if (!overdueTickets || overdueTickets.length === 0) {
      return new Response(
        JSON.stringify({ message: "No overdue tickets found", count: 0 }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const notifications = [];
    for (const ticket of overdueTickets as OverdueTicket[]) {
      const { data: lastNotification } = await supabase
        .from("sla_notifications")
        .select("id, notified_at")
        .eq("ticket_id", ticket.id)
        .eq("notification_type", "overdue")
        .order("notified_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastNotification) {
        const hoursSinceLastNotification =
          (Date.now() - new Date(lastNotification.notified_at).getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastNotification < 24) {
          continue;
        }
      }

      const { data: adminSettings } = await supabase
        .from("admin_settings")
        .select("admin_email")
        .limit(1)
        .maybeSingle();

      if (!adminSettings?.admin_email) {
        console.warn("No admin email configured");
        continue;
      }

      const emailPayload = {
        to: adminSettings.admin_email,
        subject: `URGENT: Ticket ${ticket.ticket_number} is OVERDUE`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ SLA BREACH ALERT</h2>
            <p>The following ticket has exceeded its SLA deadline and requires immediate attention:</p>

            <div style="background-color: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px;"><strong>Ticket Number:</strong></td>
                  <td style="padding: 5px;">${ticket.ticket_number}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>Customer:</strong></td>
                  <td style="padding: 5px;">${ticket.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>Device:</strong></td>
                  <td style="padding: 5px;">${ticket.device_type}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>Status:</strong></td>
                  <td style="padding: 5px;">${ticket.status}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>SLA Limit:</strong></td>
                  <td style="padding: 5px;">${ticket.sla_hours} hours</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>Hours Overdue:</strong></td>
                  <td style="padding: 5px; color: #dc2626; font-weight: bold;">${ticket.hours_overdue.toFixed(1)} hours</td>
                </tr>
              </table>
            </div>

            <p style="margin-top: 20px;">Please take immediate action to address this ticket.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated alert from your Repair Ticket System.</p>
          </div>
        `,
      };

      try {
        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify(emailPayload),
          }
        );

        if (emailResponse.ok) {
          await supabase.from("sla_notifications").insert({
            ticket_id: ticket.id,
            notification_type: "overdue",
          });

          notifications.push({
            ticket_number: ticket.ticket_number,
            status: "sent",
          });
        } else {
          const errorText = await emailResponse.text();
          console.error(
            `Failed to send email for ticket ${ticket.ticket_number}:`,
            errorText
          );
          notifications.push({
            ticket_number: ticket.ticket_number,
            status: "failed",
            error: errorText,
          });
        }
      } catch (emailError) {
        console.error(
          `Error sending email for ticket ${ticket.ticket_number}:`,
          emailError
        );
        notifications.push({
          ticket_number: ticket.ticket_number,
          status: "failed",
          error: String(emailError),
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Overdue ticket check completed",
        overdue_count: overdueTickets.length,
        notifications_sent: notifications.filter((n) => n.status === "sent")
          .length,
        notifications,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in check-overdue-tickets:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
