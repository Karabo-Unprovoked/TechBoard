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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, content, ticketNumber, isTest } = await req.json()

    // Create email content with professional branded template
    const emailHtml = isTest ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f5f5;
            padding: 20px;
          }
          .email-wrapper { max-width: 650px; margin: 0 auto; background: white; }
          .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 40px;
            text-align: center;
          }
          .logo-img {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
          }
          .logo-text {
            color: #ffb400;
            font-size: 28px;
            font-weight: 700;
            margin: 15px 0 0 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .tagline {
            color: #ffffff;
            font-size: 14px;
            margin-top: 5px;
            letter-spacing: 1px;
          }
          .content {
            padding: 40px;
            background: white;
          }
          .test-badge {
            background: #28a745;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 20px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .success-box {
            margin-top: 30px;
            padding: 20px;
            background: #f0f9f4;
            border-left: 4px solid #28a745;
            border-radius: 6px;
          }
          .footer {
            background: #1a1a1a;
            color: #999;
            padding: 30px 40px;
            text-align: center;
            font-size: 12px;
            line-height: 1.8;
          }
          .footer a { color: #ffb400; text-decoration: none; }
          h2 { color: #1a1a1a; margin-bottom: 20px; }
          p { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <img src="https://computerguardian.co.za/wp-content/uploads/2023/10/Horizontal_White.png" alt="Computer Guardian Logo" class="logo-img">
          </div>
          <div class="content">
            <div class="test-badge">✓ TEST EMAIL</div>
            <h2>Email Configuration Test</h2>
            <div>${content}</div>
            <div class="success-box">
              <p><strong>✓ Success!</strong> Your SMTP configuration is working correctly.</p>
              <p style="margin-bottom: 0;"><strong>Server:</strong> computerguardian.co.za:465 (SSL)<br>
              <strong>From:</strong> info@computerguardian.co.za</p>
            </div>
          </div>
          <div class="footer">
            <p style="margin-bottom: 10px;"><strong style="color: #ffb400;">COMPUTER GUARDIAN</strong></p>
            <p>📧 info@computerguardian.co.za | 📞 +27 86 120 3203</p>
            <p>🌐 <a href="https://computerguardian.co.za">computerguardian.co.za</a></p>
            <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
              © ${new Date().getFullYear()} Computer Guardian. All rights reserved.<br>
              This is a test email from your repair management system.
            </p>
          </div>
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f5f5;
            padding: 20px;
          }
          .email-wrapper {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 40px;
            text-align: center;
            position: relative;
          }
          .logo-img {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
          }
          .logo-text {
            color: #ffb400;
            font-size: 28px;
            font-weight: 700;
            margin: 15px 0 0 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .tagline {
            color: #ffffff;
            font-size: 14px;
            margin-top: 5px;
            letter-spacing: 1px;
          }
          .proof-banner {
            background: #ffb400;
            color: #1a1a1a;
            padding: 12px;
            text-align: center;
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .content {
            padding: 40px;
            background: white;
          }
          .ticket-badge {
            background: #ffb400;
            color: #1a1a1a;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 25px;
            font-size: 16px;
            letter-spacing: 0.5px;
          }
          .info-box {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-box h3 {
            color: #ffb400;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .ticket-details {
            background: white;
            border: 2px solid #ffb400;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .ticket-details h3 {
            color: #ffb400;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .contact-section {
            margin-top: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: center;
          }
          .contact-section h4 {
            color: #1a1a1a;
            margin-bottom: 15px;
          }
          .contact-grid {
            display: table;
            width: 100%;
            margin-top: 15px;
          }
          .contact-item {
            display: table-row;
          }
          .contact-item > span {
            display: table-cell;
            padding: 8px;
            text-align: left;
          }
          .footer {
            background: #1a1a1a;
            color: #999;
            padding: 30px 40px;
            text-align: center;
            font-size: 12px;
            line-height: 1.8;
          }
          .footer a { color: #ffb400; text-decoration: none; }
          .footer-logo {
            color: #ffb400;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 15px;
          }
          h2 { color: #1a1a1a; margin-bottom: 20px; font-size: 24px; }
          p { margin-bottom: 12px; }
          strong { color: #1a1a1a; }
          @media only screen and (max-width: 600px) {
            .email-wrapper { margin: 0; }
            .header, .content, .footer { padding: 20px !important; }
            .logo-text { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <img src="https://computerguardian.co.za/wp-content/uploads/2023/10/Horizontal_White.png" alt="Computer Guardian Logo" class="logo-img">
          </div>
          <div class="proof-banner">
            ✓ Official Service Document - Keep for Your Records
          </div>
          <div class="content">
            ${ticketNumber ? `<div class="ticket-badge">📋 Ticket #${ticketNumber}</div>` : ''}
            <div>${content}</div>
          </div>
          <div class="footer">
            <p class="footer-logo">COMPUTER GUARDIAN</p>
            <p>Professional Computer Repair Services</p>
            <p>📧 info@computerguardian.co.za | 📞 +27 86 120 3203</p>
            <p>🌐 <a href="https://computerguardian.co.za">computerguardian.co.za</a></p>
            <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
              © ${new Date().getFullYear()} Computer Guardian. All rights reserved.<br>
              This email serves as official documentation of your repair service.
            </p>
          </div>
        </div>
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