import nodemailer from 'nodemailer';

export interface WelcomeEmailPayload {
  email: string;
  name: string;
  role?: string;
  phone?: string;
}

/**
 * Sends welcome email to newly registered user via Resend API, SMTP, or test transport
 */
export async function sendAccountCreationEmail(payload: WelcomeEmailPayload): Promise<boolean> {
  const { email, name, role = 'passenger', phone } = payload;

  if (!email) {
    console.warn('[Email Service] Cannot send registration email: email address is missing');
    return false;
  }

  const fromAddress = process.env.EMAIL_FROM || '"OmniBus Sri Lanka" <no-reply@omnibus.lk>';
  const registeredDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Colombo',
  });

  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
  const subject = `🎉 New Account Created Successfully - Welcome to OmniBus!`;

  const textBody = `
Dear ${name},

Welcome to OmniBus! Your account has been registered successfully.

Account Details:
- Name: ${name}
- Email: ${email}
- Account Type: ${formattedRole}
${phone ? `- Phone: ${phone}\n` : ''}- Date Registered: ${registeredDate}

You can now log in to search bus routes, choose seats, and book tickets across Sri Lanka.

Thank you for choosing OmniBus!
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Account Created Successfully</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      margin: 0;
      padding: 20px;
      color: #1e293b;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #0284c7 100%);
      padding: 36px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 32px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .intro-text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 14px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 14px;
    }
    .detail-label {
      color: #64748b;
      font-weight: 500;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .badge-success {
      background-color: #dcfce7;
      color: #15803d;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .button-container {
      text-align: center;
      margin: 28px 0 20px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 30px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-badge">OmniBus SL</div>
      <h1>Account Created Successfully! 🎉</h1>
      <p>Welcome to Sri Lanka's Modern Bus Ticketing Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      <div class="intro-text">
        Great news! Your OmniBus account has been registered successfully. You're all set to discover routes, reserve your favorite seats, and manage your bus travel across Sri Lanka with ease.
      </div>
      
      <div class="card">
        <div class="card-title">Registration Summary</div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value"><span class="badge-success">Account Active</span></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Full Name</span>
          <span class="detail-value">${name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email Address</span>
          <span class="detail-value">${email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Account Role</span>
          <span class="detail-value">${formattedRole}</span>
        </div>
        ${phone ? `
        <div class="detail-row">
          <span class="detail-label">Mobile Phone</span>
          <span class="detail-value">${phone}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Registration Date</span>
          <span class="detail-value">${registeredDate}</span>
        </div>
      </div>
      
      <div class="button-container">
        <a href="http://localhost:5173" class="btn" target="_blank">Book Bus Tickets Now</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>OmniBus LK Bus Ticketing System</strong></p>
      <p>If you did not create this account, please ignore this email or contact support.</p>
      <p>© ${new Date().getFullYear()} OmniBus LK. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // 1. Check if Resend API Key is configured
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    try {
      const apiKey = process.env.RESEND_API_KEY.trim();
      const resendFrom = process.env.EMAIL_FROM || 'OmniBus LK <onboarding@resend.dev>';
      console.log(`[Email Service] Sending welcome email to ${email} via Resend HTTP API...`);

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [email],
          subject,
          html: htmlBody,
          text: textBody,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        console.log(`[Email Service] ✅ Welcome email delivered successfully to ${email} via Resend API! ID: ${data.id}`);
        return true;
      } else {
        const errorText = await res.text();
        console.error(`[Email Service] Resend API error (HTTP ${res.status}):`, errorText);
      }
    } catch (err: any) {
      console.error('[Email Service] Error connecting to Resend API:', err?.message || err);
    }
  }

  // 2. Check if SMTP credentials (Brevo, SendGrid, Gmail, Mailtrap, etc.) are configured
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';

  if (host && user && pass) {
    try {
      console.log(`[Email Service] Sending welcome email to ${email} via SMTP (${host})...`);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[Email Service] ✅ Welcome email delivered successfully to ${email} via SMTP! ID: ${info.messageId}`);
      return true;
    } catch (err: any) {
      console.error(`[Email Service] Failed to send email via SMTP (${host}):`, err?.message || err);
    }
  }

  // 3. Fallback: Local Ethereal test account for development preview
  try {
    console.log(`[Email Service] No real SMTP/Resend API credentials found in .env. Creating Ethereal test preview for ${email}...`);
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[Email Service] Ethereal preview generated for ${email}. Message ID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Service] 📧 Click to preview test email in browser: ${previewUrl}`);
    }
    return true;
  } catch (err: any) {
    console.error('[Email Service] Fallback test email failed:', err?.message || err);
    return false;
  }
}
