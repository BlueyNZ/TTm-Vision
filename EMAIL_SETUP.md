# Email Service Setup Guide

This guide explains how to enable automatic email sending for password resets when creating new staff members.

## Quick Start (Choose One Option)

### Option 1: SendGrid (Recommended)

1. **Sign up for SendGrid** (Free tier: 100 emails/day)
   - Go to https://sendgrid.com/
   - Create account and verify email

2. **Get API Key**
   - Go to Settings → API Keys
   - Create new API key with "Full Access"
   - Copy the key

3. **Install Package**
   ```bash
   npm install @sendgrid/mail
   ```

4. **Add to `.env.local`**
   ```env
   SENDGRID_API_KEY=your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

5. **Uncomment SendGrid code** in `src/lib/email-service.ts` (lines 58-71)

### Option 2: Gmail SMTP (Free)

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Generate App Password**
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

3. **Install Package**
   ```bash
   npm install nodemailer
   ```

4. **Add to `.env.local`**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

5. **Uncomment SMTP code** in `src/lib/email-service.ts` (lines 119-143)

### Option 3: Mailgun

1. **Sign up for Mailgun** (Free tier: 5,000 emails/month)
   - Go to https://www.mailgun.com/
   - Verify domain or use sandbox

2. **Get API credentials**
   - Domain name
   - API key

3. **Install Package**
   ```bash
   npm install mailgun-js
   ```

4. **Add to `.env.local`**
   ```env
   MAILGUN_API_KEY=your_api_key_here
   MAILGUN_DOMAIN=your-domain.mailgun.org
   ```

5. **Uncomment Mailgun code** in `src/lib/email-service.ts` (lines 87-105)

## Testing

After setup:

1. Create a new staff member via Admin → Create Staff
2. Check the email inbox of the new staff member
3. They should receive a "Welcome" email with password reset link

## Troubleshooting

### Emails not sending
- Check environment variables are set correctly
- Restart dev server after adding .env.local
- Check email service dashboard for errors
- Verify sender email is verified/authorized

### Gmail "Less secure app" error
- Use App Password instead of regular password
- Make sure 2FA is enabled

### SendGrid domain authentication
- For production, verify your sending domain
- For testing, use verified single sender

## Custom Email Template

Edit the `getEmailTemplate()` function in `src/lib/email-service.ts` to customize:
- Logo
- Colors
- Branding
- Message content

## Production Checklist

- [ ] Choose email service
- [ ] Install required npm package
- [ ] Add environment variables
- [ ] Uncomment service code
- [ ] Test with real email
- [ ] Customize email template
- [ ] Verify sender domain (for SendGrid/Mailgun)
- [ ] Set up SPF/DKIM records (for better deliverability)
