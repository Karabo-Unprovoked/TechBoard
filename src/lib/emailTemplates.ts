export function generateStatusUpdateEmail(
  customerName: string,
  ticketNumber: string,
  deviceType: string,
  statusLabel: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #2d2d2d;
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      color: #ffb400;
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 0;
    }
    .subtitle {
      background-color: #ffb400;
      padding: 12px 20px;
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: #2d2d2d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #2d2d2d;
      margin-bottom: 20px;
    }
    .message {
      font-size: 15px;
      color: #555;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .ticket-box {
      background-color: #fff8e6;
      border-left: 4px solid #ffb400;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .ticket-title {
      color: #2d2d2d;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #ffe9b3;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #2d2d2d;
      min-width: 120px;
      font-size: 14px;
    }
    .info-value {
      color: #555;
      font-size: 14px;
    }
    .status-badge {
      display: inline-block;
      background-color: #ffb400;
      color: #2d2d2d;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 13px;
    }
    .footer {
      background-color: #2d2d2d;
      padding: 30px 20px;
      text-align: center;
      color: #aaa;
    }
    .footer-logo {
      color: #ffb400;
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .footer-tagline {
      color: #aaa;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .contact-info {
      margin: 15px 0;
      font-size: 13px;
    }
    .contact-info a {
      color: #ffb400;
      text-decoration: none;
    }
    .contact-info a:hover {
      text-decoration: underline;
    }
    .divider {
      height: 1px;
      background-color: #444;
      margin: 20px 0;
    }
    .copyright {
      font-size: 12px;
      color: #888;
      margin-top: 15px;
    }
    .note {
      font-size: 12px;
      color: #999;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 class="logo">COMPUTER GUARDIAN</h1>
    </div>

    <div class="subtitle">
      ✓ OFFICIAL SERVICE DOCUMENT - KEEP FOR YOUR RECORDS
    </div>

    <div class="content">
      <div class="greeting">
        Hello ${customerName},
      </div>

      <div class="message">
        We wanted to update you on the progress of your device repair. Your ticket status has been updated and we're keeping you informed every step of the way.
      </div>

      <div class="ticket-box">
        <div class="ticket-title">
          📋 Ticket #${ticketNumber}
        </div>

        <div class="info-row">
          <div class="info-label">Current Status:</div>
          <div class="info-value">
            <span class="status-badge">${statusLabel}</span>
          </div>
        </div>

        <div class="info-row">
          <div class="info-label">Device:</div>
          <div class="info-value">${deviceType}</div>
        </div>

        <div class="info-row">
          <div class="info-label">Ticket Number:</div>
          <div class="info-value">${ticketNumber}</div>
        </div>
      </div>

      <div class="message">
        If you have any questions or concerns about your repair, please don't hesitate to contact us. We're here to help!
      </div>
    </div>

    <div class="footer">
      <div class="footer-logo">COMPUTER GUARDIAN</div>
      <div class="footer-tagline">Professional Computer Repair Services</div>

      <div class="contact-info">
        📧 <a href="mailto:info@computerguardian.co.za">info@computerguardian.co.za</a>
      </div>

      <div class="contact-info">
        📞 012 001 8530
      </div>

      <div class="contact-info">
        🌐 <a href="https://computerguardian.co.za">computerguardian.co.za</a>
      </div>

      <div class="divider"></div>

      <div class="copyright">
        © 2026 Computer Guardian. All rights reserved.
      </div>

      <div class="note">
        This email serves as official documentation of your repair service.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
