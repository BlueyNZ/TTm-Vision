# Firebase Email Template Customization

## Current Issue
Emails are showing "studio-4955279472-f5d23" instead of "TTM Vision"

## Solution

### 1. Update Project Public-Facing Name

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview"
4. Go to "Project settings"
5. Under "Public-facing name", change it to: **TTM Vision**
6. Click "Save"

### 2. Customize Email Templates

#### Password Reset Email Template

1. In Firebase Console, go to **Authentication**
2. Click on the **Templates** tab
3. Select **Password reset**
4. Click the pencil icon ✏️ to edit
5. Use the template below:

**Subject:**
```
Reset your password for TTM Vision
```

**Email body:**
```html
<p>Hello,</p>

<p>We received a request to reset your TTM Vision password for your account: <strong>%EMAIL%</strong></p>

<p>Click the button below to set a new password:</p>

<p><a href="%LINK%" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a></p>

<p>Or copy and paste this link into your browser:</p>
<p style="font-size: 12px; color: #666; word-break: break-all;">%LINK%</p>

<p><strong>This link will expire in 1 hour.</strong></p>

<p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>

<p>Thanks,<br>
<strong>TTM Vision Team</strong></p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
<p style="font-size: 12px; color: #9ca3af;">This is an automated message from TTM Vision. Please do not reply to this email.</p>
```

6. Click **Save**

#### Email Verification Template

1. Select **Email address verification**
2. Use this template:

**Subject:**
```
Verify your email for TTM Vision
```

**Email body:**
```html
<p>Hello,</p>

<p>Thank you for creating an account with TTM Vision!</p>

<p>Please verify your email address (<strong>%EMAIL%</strong>) by clicking the button below:</p>

<p><a href="%LINK%" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a></p>

<p>Or copy and paste this link into your browser:</p>
<p style="font-size: 12px; color: #666; word-break: break-all;">%LINK%</p>

<p>If you didn't create an account with TTM Vision, you can safely ignore this email.</p>

<p>Thanks,<br>
<strong>TTM Vision Team</strong></p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
<p style="font-size: 12px; color: #9ca3af;">This is an automated message from TTM Vision. Please do not reply to this email.</p>
```

### 3. Customize Sender Name (Optional but Recommended)

To change the sender from "noreply@ttmvision.com" to a custom display name:

1. In Firebase Console, go to **Authentication → Settings**
2. Click **Customize**
3. Under "From name", enter: **TTM Vision**
4. Click **Save**

### 4. Test the Changes

1. Go to your app and create a test staff member
2. Check the email - it should now say "TTM Vision" instead of the studio name
3. The reset password link will now show "Reset your password for TTM Vision"

### Available Variables in Templates

Firebase provides these variables you can use in email templates:

- `%EMAIL%` - The user's email address
- `%LINK%` - The action link (reset password, verify email, etc.)
- `%DISPLAY_NAME%` - The user's display name (if set)
- `%APP_NAME%` - Your app name (from project settings)

### Notes

- Changes to email templates take effect immediately
- The sender email (noreply@...) cannot be changed unless you use a custom SMTP server
- For production, consider setting up a custom domain for emails using Firebase's SMTP relay or a third-party service like SendGrid

## Additional Customization

For more advanced customization, you can:
1. Use custom email templates with your own SMTP server
2. Integrate with services like SendGrid, Mailgun, or AWS SES
3. Create custom email handlers in your application

See `EMAIL_SETUP.md` for more details on email configuration.
