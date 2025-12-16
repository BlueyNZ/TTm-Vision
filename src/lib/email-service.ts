/**
 * Email Service for sending password reset emails
 * 
 * This uses Firebase's built-in email service through Cloud Functions
 * Alternative: Integrate with SendGrid, Mailgun, or other email services
 */

interface SendPasswordResetEmailParams {
  email: string;
  resetLink: string;
  name: string;
  companyName?: string;
}

/**
 * Send password reset email to new staff member
 * 
 * Note: Firebase Admin SDK generates links but doesn't send emails automatically.
 * You have two options:
 * 
 * 1. Use Firebase Auth client SDK (triggers automatic emails)
 * 2. Integrate with third-party email service (SendGrid, Mailgun, etc.)
 * 
 * For now, this returns the link for manual distribution.
 * To enable automatic emails, set up one of the above options.
 */
export async function sendPasswordResetEmail({
  email,
  resetLink,
  name,
  companyName = 'Traffic Management',
}: SendPasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Option 1: Use SendGrid (requires API key)
    if (process.env.SENDGRID_API_KEY) {
      return await sendWithSendGrid({ email, resetLink, name, companyName });
    }

    // Option 2: Use Mailgun (requires API key)
    if (process.env.MAILGUN_API_KEY) {
      return await sendWithMailgun({ email, resetLink, name, companyName });
    }

    // Option 3: Use custom SMTP
    if (process.env.SMTP_HOST) {
      return await sendWithSMTP({ email, resetLink, name, companyName });
    }

    // No email service configured
    console.warn('No email service configured. Password reset link not sent.');
    return { success: false, error: 'No email service configured' };

  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(params: SendPasswordResetEmailParams) {
  // To enable SendGrid:
  // 1. npm install @sendgrid/mail
  // 2. Add SENDGRID_API_KEY to .env.local
  // 3. Uncomment the code below
  
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: params.email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
    subject: `Welcome to ${params.companyName}`,
    html: getEmailTemplate(params),
  };

  await sgMail.send(msg);
  return { success: true };
  */

  return { success: false, error: 'SendGrid not configured' };
}

/**
 * Send email using Mailgun
 */
async function sendWithMailgun(params: SendPasswordResetEmailParams) {
  // To enable Mailgun:
  // 1. npm install mailgun-js
  // 2. Add MAILGUN_API_KEY and MAILGUN_DOMAIN to .env.local
  // 3. Uncomment the code below
  
  /*
  const mailgun = require('mailgun-js');
  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });

  const data = {
    from: `${params.companyName} <noreply@${process.env.MAILGUN_DOMAIN}>`,
    to: params.email,
    subject: `Welcome to ${params.companyName}`,
    html: getEmailTemplate(params),
  };

  await mg.messages().send(data);
  return { success: true };
  */

  return { success: false, error: 'Mailgun not configured' };
}

/**
 * Send email using SMTP (e.g., Gmail, Outlook)
 */
async function sendWithSMTP(params: SendPasswordResetEmailParams) {
  // To enable SMTP:
  // 1. npm install nodemailer
  // 2. Add SMTP credentials to .env.local
  // 3. Uncomment the code below
  
  /*
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"${params.companyName}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: params.email,
    subject: `Welcome to ${params.companyName}`,
    html: getEmailTemplate(params),
  });

  return { success: true };
  */

  return { success: false, error: 'SMTP not configured' };
}

/**
 * Email template for password reset
 */
function getEmailTemplate({ name, resetLink, companyName }: SendPasswordResetEmailParams): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${companyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to ${companyName}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${name},</p>
        
        <p style="font-size: 16px;">
          Your account has been created! To get started, you'll need to set your password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Set Your Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          This link will expire in 24 hours. If you didn't expect this email, please contact your administrator.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}
