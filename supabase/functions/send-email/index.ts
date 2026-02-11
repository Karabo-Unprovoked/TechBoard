import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

// Get email settings from database
async function getEmailSettings() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Loading email settings from database...')
  
  const { data, error } = await supabase
    .from('email_settings')
    .select('*')
    .maybeSingle()

  if (error || !data) {
    console.error('Error loading email settings:', error)
    return {
      hostname: 'computerguardian.co.za',
      port: 465,
      username: 'info@computerguardian.co.za',
      password: Deno.env.get('SMTP_PASSWORD') || '',
      secure: true,
    }
  }

  console.log('Email settings loaded from database:', {
    host: data.smtp_host,
    port: data.smtp_port,
    username: data.smtp_username,
    passwordSet: data.smtp_password ? 'Yes' : 'No',
    passwordLength: data.smtp_password?.length || 0
  })

  return {
    hostname: data.smtp_host,
    port: data.smtp_port,
    username: data.smtp_username,
    password: data.smtp_password || Deno.env.get('SMTP_PASSWORD') || '',
    secure: data.use_ssl,
  }
}

// Simple SMTP client implementation
async function sendSMTPEmail(to: string, subject: string, htmlContent: string, textContent: string, smtpConfig: any) {
  let tlsConn: Deno.TlsConn | null = null;

  try {
    console.log('Connecting to SMTP server:', smtpConfig.hostname, smtpConfig.port);

    // For port 465 (SMTPS), connect directly with TLS
    // For other ports, use regular connect then STARTTLS
    const conn = await Deno.connect({
      hostname: smtpConfig.hostname,
      port: smtpConfig.port,
    })

    // Upgrade to TLS/SSL immediately for port 465
    tlsConn = await Deno.startTls(conn, {
      hostname: smtpConfig.hostname,
    })

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    // Helper function to send command and read response with timeout
    async function sendCommand(command: string, timeout = 10000): Promise<string> {
      await tlsConn!.write(encoder.encode(command + '\r\n'))

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP command timeout')), timeout)
      )

      const readPromise = (async () => {
        const buffer = new Uint8Array(4096)
        const bytesRead = await tlsConn!.read(buffer)
        return decoder.decode(buffer.subarray(0, bytesRead || 0))
      })()

      return await Promise.race([readPromise, timeoutPromise])
    }

    // Read initial greeting from server
    console.log('Reading initial greeting...');
    const buffer = new Uint8Array(4096)
    const bytesRead = await tlsConn.read(buffer)
    let response = decoder.decode(buffer.subarray(0, bytesRead || 0))
    console.log('Initial response:', response)

    response = await sendCommand('EHLO computerguardian.co.za')
    console.log('EHLO response:', response)

    response = await sendCommand('AUTH LOGIN')
    console.log('AUTH response:', response)

    // Send username (base64 encoded)
    const username = btoa(smtpConfig.username)
    response = await sendCommand(username)
    console.log('Username response:', response)

    // Send password (base64 encoded)
    const password = btoa(smtpConfig.password)
    console.log('Sending password (length:', smtpConfig.password.length, ')')
    response = await sendCommand(password)
    console.log('Password response:', response)

    // Check if authentication succeeded (235 = Authentication successful)
    if (!response.startsWith('235')) {
      if (tlsConn) tlsConn.close()
      return {
        success: false,
        message: `SMTP Authentication failed: ${response.trim()}`
      }
    }

    console.log('Authentication successful');

    response = await sendCommand(`MAIL FROM:<${smtpConfig.username}>`)
    console.log('MAIL FROM response:', response)

    if (!response.startsWith('250')) {
      if (tlsConn) tlsConn.close()
      return {
        success: false,
        message: `MAIL FROM failed: ${response.trim()}`
      }
    }

    response = await sendCommand(`RCPT TO:<${to}>`)
    console.log('RCPT TO response:', response)

    if (!response.startsWith('250')) {
      if (tlsConn) tlsConn.close()
      return {
        success: false,
        message: `RCPT TO failed: ${response.trim()}`
      }
    }

    response = await sendCommand('DATA')
    console.log('DATA response:', response)

    if (!response.startsWith('354')) {
      if (tlsConn) tlsConn.close()
      return {
        success: false,
        message: `DATA command failed: ${response.trim()}`
      }
    }

    // Generate unique Message-ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const messageId = `<${timestamp}.${random}@computerguardian.co.za>`;

    // Current date in RFC 2822 format
    const emailDate = new Date().toUTCString();

    // Email headers and content with anti-spam headers
    const emailContent = [
      `Date: ${emailDate}`,
      `From: Computer Guardian <${smtpConfig.username}>`,
      `Reply-To: ${smtpConfig.username}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Message-ID: ${messageId}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="boundary123"',
      'X-Mailer: Guardian Assist Repair System',
      'X-Priority: 3',
      'Importance: Normal',
      `List-Unsubscribe: <mailto:${smtpConfig.username}?subject=Unsubscribe>`,
      '',
      '--boundary123',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      textContent,
      '',
      '--boundary123',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      htmlContent,
      '',
      '--boundary123--',
      '.',
    ].join('\r\n')

    response = await sendCommand(emailContent)
    console.log('Email content response:', response)

    if (!response.startsWith('250')) {
      if (tlsConn) tlsConn.close()
      return {
        success: false,
        message: `Email sending failed: ${response.trim()}`
      }
    }

    response = await sendCommand('QUIT')
    console.log('QUIT response:', response)

    if (tlsConn) tlsConn.close()

    console.log('Email sent successfully to:', to);

    return {
      success: true,
      message: 'Email sent successfully via SMTP'
    }

  } catch (error) {
    console.error('SMTP Error:', error)
    if (tlsConn) {
      try {
        tlsConn.close()
      } catch (e) {
        console.error('Error closing connection:', e)
      }
    }
    return {
      success: false,
      message: `SMTP Error: ${error.message}`
    }
  }
}

// Embedded logo as base64 data URI
const LOGO_DATA_URI = 'data:image/png;base64,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oLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLeEKQAAAAAAAAAAAAAAAKC3hCkAAAAAAAAAAAAAAACgt4QpAAAAAAAAAAAAAAAAoLf+P6WRAABTpCOFAAAAAElFTkSuQmCC';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, content, ticketNumber, isTest } = await req.json()

    // Create email content with professional branded template (table-based for Outlook compatibility)
    const emailHtml = isTest ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="650" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 650px;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 40px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <img src="${LOGO_DATA_URI}" alt="Computer Guardian" style="max-width: 300px; width: 100%; height: auto; display: block; margin: 0 auto 20px auto;" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="color: #ffb400; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                          COMPUTER GUARDIAN
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px; background-color: #ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #28a745; color: #ffffff; padding: 12px 24px; text-align: center; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 20px;">
                          ✓ TEST EMAIL
                        </td>
                      </tr>
                      <tr><td style="height: 20px;"></td></tr>
                      <tr>
                        <td style="color: #1a1a1a; font-size: 24px; font-weight: bold; padding-bottom: 20px;">
                          Email Configuration Test
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
                          ${content}
                        </td>
                      </tr>
                      <tr><td style="height: 30px;"></td></tr>
                      <tr>
                        <td style="background-color: #f0f9f4; border-left: 4px solid #28a745; padding: 20px;">
                          <p style="margin: 0 0 10px 0; color: #1a1a1a;"><strong>✓ Success!</strong> Your SMTP configuration is working correctly.</p>
                          <p style="margin: 0; color: #1a1a1a;"><strong>Server:</strong> computerguardian.co.za:465 (SSL)<br><strong>From:</strong> info@computerguardian.co.za</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #1a1a1a; color: #999999; padding: 30px 40px; text-align: center; font-size: 12px; line-height: 1.8;">
                    <p style="margin: 0 0 10px 0; color: #ffb400; font-weight: bold;">COMPUTER GUARDIAN</p>
                    <p style="margin: 0 0 10px 0;">📧 info@computerguardian.co.za | 📞 +27 86 120 3203</p>
                    <p style="margin: 0 0 20px 0;">🌐 <a href="https://computerguardian.co.za" style="color: #ffb400; text-decoration: none;">computerguardian.co.za</a></p>
                    <p style="margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #333333;">
                      © ${new Date().getFullYear()} Computer Guardian. All rights reserved.<br>
                      This is a test email from your repair management system.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="650" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 650px;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 40px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <img src="${LOGO_DATA_URI}" alt="Computer Guardian" style="max-width: 300px; width: 100%; height: auto; display: block; margin: 0 auto 20px auto;" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="color: #ffb400; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                          COMPUTER GUARDIAN
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Banner -->
                <tr>
                  <td style="background-color: #ffb400; color: #1a1a1a; padding: 12px; text-align: center; font-weight: bold; font-size: 13px; text-transform: uppercase;">
                    ✓ OFFICIAL SERVICE DOCUMENT - KEEP FOR YOUR RECORDS
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px; background-color: #ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${ticketNumber ? `
                      <tr>
                        <td style="background-color: #ffb400; color: #1a1a1a; padding: 12px 24px; text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 25px;">
                          📋 Ticket #${ticketNumber}
                        </td>
                      </tr>
                      <tr><td style="height: 25px;"></td></tr>
                      ` : ''}
                      <tr>
                        <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
                          ${content}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #1a1a1a; color: #999999; padding: 30px 40px; text-align: center; font-size: 12px; line-height: 1.8;">
                    <p style="margin: 0 0 10px 0; color: #ffb400; font-weight: bold; font-size: 20px;">COMPUTER GUARDIAN</p>
                    <p style="margin: 0 0 10px 0;">Professional Computer Repair Services</p>
                    <p style="margin: 0 0 10px 0;">📧 info@computerguardian.co.za | 📞 +27 86 120 3203</p>
                    <p style="margin: 0 0 20px 0;">🌐 <a href="https://computerguardian.co.za" style="color: #ffb400; text-decoration: none;">computerguardian.co.za</a></p>
                    <p style="margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #333333;">
                      © ${new Date().getFullYear()} Computer Guardian. All rights reserved.<br>
                      This email serves as official documentation of your repair service.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // Convert HTML to plain text for the text version
    const textContent = content.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n')

    // Get email settings from database
    const smtpConfig = await getEmailSettings()

    console.log('Sending email via SMTP:', {
      to: to,
      from: smtpConfig.username,
      subject: subject,
      server: `${smtpConfig.hostname}:${smtpConfig.port}`,
      ssl: smtpConfig.secure,
      passwordSet: smtpConfig.password ? 'Yes' : 'No',
      passwordLength: smtpConfig.password?.length || 0
    })

    // Send email via SMTP
    const result = await sendSMTPEmail(to, subject, emailHtml, textContent, smtpConfig)

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully via SMTP',
          details: {
            to: to,
            subject: subject,
            timestamp: new Date().toISOString(),
            server: `${smtpConfig.hostname}:${smtpConfig.port} (SSL)`
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

  } catch (error) {
    console.error('Email sending error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})