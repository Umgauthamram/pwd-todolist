import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"Beginning Notes" <no-reply@beginning.app>';

/**
 * Returns a configured Nodemailer transporter or null if SMTP credentials are missing.
 */
function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Common HTML wrapper with Poppins font and dark gray/slate theme.
 */
function renderDarkEmailLayout(title: string, contentHtml: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #0F172A;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #F8FAFC;
        -webkit-font-smoothing: antialiased;
      }
      .container {
        max-width: 540px;
        margin: 40px auto;
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
      }
      .header {
        padding: 32px 32px 24px;
        text-align: center;
        border-bottom: 1px solid #334155;
        background: linear-gradient(180deg, #1E293B 0%, #0F172A 100%);
      }
      .logo-title {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.5px;
        color: #F8FAFC;
        margin: 0;
      }
      .logo-tag {
        font-size: 11px;
        color: #38BDF8;
        background-color: rgba(56, 189, 248, 0.1);
        border: 1px solid rgba(56, 189, 248, 0.2);
        padding: 2px 8px;
        border-radius: 9999px;
        display: inline-block;
        margin-top: 6px;
        font-weight: 500;
      }
      .body-content {
        padding: 32px;
      }
      .otp-box {
        margin: 28px 0;
        text-align: center;
        background-color: #0F172A;
        border: 1px dashed #38BDF8;
        border-radius: 12px;
        padding: 20px;
      }
      .otp-code {
        font-size: 34px;
        font-weight: 700;
        letter-spacing: 8px;
        color: #38BDF8;
        margin: 0;
      }
      .btn {
        display: inline-block;
        background-color: #38BDF8;
        color: #0F172A !important;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 10px;
        margin: 24px 0 12px;
        text-align: center;
      }
      .footer {
        padding: 20px 32px;
        background-color: #0F172A;
        border-top: 1px solid #334155;
        text-align: center;
        font-size: 12px;
        color: #94A3B8;
      }
      p {
        font-size: 14px;
        line-height: 1.6;
        color: #94A3B8;
        margin: 0 0 16px;
      }
      strong {
        color: #F8FAFC;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="logo-title">Beginning</h1>
        <div class="logo-tag">Notes &amp; Secure Private Space</div>
      </div>
      <div class="body-content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0;">This is an automated security transmission from Beginning Notes.</p>
        <p style="margin: 4px 0 0; font-size: 11px;">If you did not request this email, you can safely disregard it.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Send 6-digit OTP verification email for Registration or Login.
 */
export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  const subject = `Your Verification Code: ${otp} — Beginning`;
  const content = `
    <h2 style="font-size: 18px; font-weight: 600; color: #F8FAFC; margin-top: 0;">Verify Your Email Address</h2>
    <p>Thank you for signing up for <strong>Beginning</strong>. Please use the following 6-digit One-Time Password (OTP) to complete your verification.</p>
    
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 8px;">Valid for 10 minutes</div>
    </div>

    <p style="font-size: 13px;">Never share this verification code with anyone. Our team will never ask for your OTP.</p>
  `;

  const html = renderDarkEmailLayout("Verification Code", content);

  const transporter = getTransporter();
  if (!transporter) {
    console.log("=================================================");
    console.log(`[DEV MODE] Nodemailer SMTP not configured in .env.local.`);
    console.log(`[DEV MODE] OTP Email to: ${to}`);
    console.log(`[DEV MODE] 6-Digit OTP Code: >>> ${otp} <<<`);
    console.log("=================================================");
    return true;
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error dispatching OTP email via Nodemailer:", error);
    return false;
  }
}

/**
 * Send Password Reset OTP & link.
 */
export async function sendPasswordResetEmail(to: string, otp: string): Promise<boolean> {
  const subject = `Reset Your Password: ${otp} — Beginning`;
  const content = `
    <h2 style="font-size: 18px; font-weight: 600; color: #F8FAFC; margin-top: 0;">Password Reset Request</h2>
    <p>We received a request to reset the password for your account (<strong>${to}</strong>).</p>
    <p>Use the following 6-digit verification code to choose a new password:</p>
    
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 8px;">Code expires in 15 minutes</div>
    </div>

    <p style="font-size: 13px;">If you did not request a password reset, please secure your account immediately.</p>
  `;

  const html = renderDarkEmailLayout("Reset Password", content);

  const transporter = getTransporter();
  if (!transporter) {
    console.log("=================================================");
    console.log(`[DEV MODE] Nodemailer SMTP not configured in .env.local.`);
    console.log(`[DEV MODE] Password Reset Email to: ${to}`);
    console.log(`[DEV MODE] Password Reset OTP: >>> ${otp} <<<`);
    console.log("=================================================");
    return true;
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error dispatching password reset email:", error);
    return false;
  }
}

/**
 * Send Private Space PIN Reset link & token.
 */
export async function sendPinResetEmail(to: string, resetUrl: string, token: string): Promise<boolean> {
  const subject = `Private Space PIN Reset — Beginning`;
  const content = `
    <h2 style="font-size: 18px; font-weight: 600; color: #F8FAFC; margin-top: 0;">Private Space PIN Reset</h2>
    <p>You requested to reset the 4-digit security PIN for your <strong>Private Space</strong>.</p>
    <p>Click the secure link below to establish a new 4-digit PIN for your isolated notes:</p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset 4-Digit PIN</a>
    </div>

    <div class="otp-box" style="margin-top: 20px; padding: 12px;">
      <p style="margin: 0; font-size: 11px; color: #94A3B8;">Or paste this token directly into the PIN reset dialog:</p>
      <code style="font-size: 13px; color: #38BDF8; word-break: break-all;">${token}</code>
    </div>

    <p style="font-size: 12px; margin-top: 16px;">This single-use reset token expires in 15 minutes.</p>
  `;

  const html = renderDarkEmailLayout("Reset Private PIN", content);

  const transporter = getTransporter();
  if (!transporter) {
    console.log("=================================================");
    console.log(`[DEV MODE] Nodemailer SMTP not configured in .env.local.`);
    console.log(`[DEV MODE] Private Space PIN Reset to: ${to}`);
    console.log(`[DEV MODE] Reset URL: ${resetUrl}`);
    console.log(`[DEV MODE] Reset Token: >>> ${token} <<<`);
    console.log("=================================================");
    return true;
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error dispatching PIN reset email:", error);
    return false;
  }
}
