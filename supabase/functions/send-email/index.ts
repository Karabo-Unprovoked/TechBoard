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

    // Email headers and content
    const emailContent = [
      `From: Guardian Assist <${smtpConfig.username}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="boundary123"',
      '',
      '--boundary123',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      textContent,
      '',
      '--boundary123',
      'Content-Type: text/html; charset=UTF-8',
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

    // Create email content with professional template
    const emailHtml = isTest ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffb400; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .test-badge { background: #28a745; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Guardian Assist</h1>
            <p>Computer Repair Services</p>
          </div>
          <div class="content">
            <div class="test-badge">✅ TEST EMAIL</div>
            <h2>Email Configuration Test</h2>
            <div style="white-space: pre-line;">${content}</div>
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-left: 4px solid #28a745; border-radius: 4px;">
              <p><strong>✅ Success!</strong> Your SMTP configuration is working correctly.</p>
              <p>Server: computerguardian.co.za:465 (SSL)</p>
              <p>From: info@computerguardian.co.za</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Guardian Assist. All rights reserved.</p>
            <p>This is a test email from your repair management system.</p>
          </div>
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffb400; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .ticket-number { background: #ffb400; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; display: inline-block; margin: 10px 0; }
          .contact-info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Guardian Assist</h1>
            <p>Computer Repair Services</p>
          </div>
          <div class="content">
            ${ticketNumber ? `<div class="ticket-number">Ticket: ${ticketNumber}</div>` : ''}
            <div style="white-space: pre-line;">${content}</div>
            <div class="contact-info">
              <p><strong>Need assistance?</strong></p>
              <p>📧 Email: info@computerguardian.co.za</p>
              <p>📞 Phone: +27 86 120 3203</p>
              <p>🌐 Website: computerguardian.co.za</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Guardian Assist. All rights reserved.</p>
            <p>This email was sent regarding your computer repair service.</p>
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