/**
 * Email Service
 * Handles all email communications for company lifecycle management
 * Ready for integration with email providers like SendGrid, Mailgun, AWS SES, etc.
 */

class EmailService {
  constructor() {
    this.apiKey = process.env.REACT_APP_EMAIL_API_KEY;
    this.fromEmail = process.env.REACT_APP_FROM_EMAIL || 'noreply@yourcompany.com';
    this.fromName = process.env.REACT_APP_FROM_NAME || 'Construction Blocker Platform';
    this.supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@yourcompany.com';
  }

  // Send company setup email with temporary credentials
  async sendCompanySetupEmail({ to, companyName, adminName, tempPassword, loginUrl, expiresAt }) {
    const template = this.generateCompanySetupTemplate({
      companyName,
      adminName,
      tempPassword,
      loginUrl,
      expiresAt
    });

    return this.sendEmail({
      to,
      subject: `Welcome to Construction Blocker Platform - Set up ${companyName}`,
      html: template.html,
      text: template.text
    });
  }

  // Send suspension notification
  async sendSuspensionNotification({ to, userName, companyName, reason, supportEmail }) {
    const template = this.generateSuspensionTemplate({
      userName,
      companyName,
      reason,
      supportEmail
    });

    return this.sendEmail({
      to,
      subject: `Important: ${companyName} Account Temporarily Suspended`,
      html: template.html,
      text: template.text
    });
  }

  // Send reactivation notification
  async sendReactivationNotification({ to, userName, companyName, loginUrl }) {
    const template = this.generateReactivationTemplate({
      userName,
      companyName,
      loginUrl
    });

    return this.sendEmail({
      to,
      subject: `Welcome Back! ${companyName} Account Reactivated`,
      html: template.html,
      text: template.text
    });
  }

  // Send password change notification
  async sendPasswordChangeNotification({ to, userName, companyName }) {
    const template = this.generatePasswordChangeTemplate({
      userName,
      companyName
    });

    return this.sendEmail({
      to,
      subject: 'Password Changed Successfully',
      html: template.html,
      text: template.text
    });
  }

  // Core email sending function
  async sendEmail({ to, subject, html, text }) {
    try {
      // In development/demo mode, log the email instead of sending
      if (!this.apiKey || process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent (Demo Mode):');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Content:', text);
        console.log('---');
        return { success: true, messageId: 'demo-' + Date.now() };
      }

      // Implementation for SendGrid
      if (process.env.REACT_APP_EMAIL_PROVIDER === 'sendgrid') {
        return this.sendWithSendGrid({ to, subject, html, text });
      }

      // Implementation for Mailgun
      if (process.env.REACT_APP_EMAIL_PROVIDER === 'mailgun') {
        return this.sendWithMailgun({ to, subject, html, text });
      }

      // Implementation for AWS SES
      if (process.env.REACT_APP_EMAIL_PROVIDER === 'aws-ses') {
        return this.sendWithAWSSES({ to, subject, html, text });
      }

      // Default: throw error if no provider configured
      throw new Error('No email provider configured');

    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  // SendGrid implementation
  async sendWithSendGrid({ to, subject, html, text }) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }]
        }],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }

    return { success: true, provider: 'sendgrid' };
  }

  // Mailgun implementation
  async sendWithMailgun({ to, subject, html, text }) {
    const formData = new FormData();
    formData.append('from', `${this.fromName} <${this.fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', text);
    formData.append('html', html);

    const response = await fetch(`https://api.mailgun.net/v3/${process.env.REACT_APP_MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${this.apiKey}`)}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.status}`);
    }

    return { success: true, provider: 'mailgun' };
  }

  // AWS SES implementation (would need AWS SDK)
  async sendWithAWSSES({ to, subject, html, text }) {
    // This would require AWS SDK integration
    // For now, just log that it would be sent via AWS SES
    console.log('Would send via AWS SES:', { to, subject });
    return { success: true, provider: 'aws-ses' };
  }

  // Email templates
  generateCompanySetupTemplate({ companyName, adminName, tempPassword, loginUrl, expiresAt }) {
    const expiryDate = new Date(expiresAt).toLocaleString();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .credentials { background: #fff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; color: #991b1b; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Construction Blocker Platform</h1>
        </div>

        <div class="content">
            <h2>Hello ${adminName},</h2>

            <p>Congratulations! Your company <strong>${companyName}</strong> has been successfully set up on our Construction Blocker Platform.</p>

            <p>To complete your setup and access your dashboard, please use the temporary credentials below:</p>

            <div class="credentials">
                <h3>🔐 Temporary Login Credentials</h3>
                <p><strong>Email:</strong> ${tempPassword.split('@')[0]}@***</p>
                <p><strong>Temporary Password:</strong> <code style="font-size: 16px; background: #f3f4f6; padding: 2px 6px;">${tempPassword}</code></p>
            </div>

            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                    <li>This is a temporary password that expires on <strong>${expiryDate}</strong></li>
                    <li>You will be required to set a new password on your first login</li>
                    <li>Keep these credentials secure and don't share them</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" class="button">Complete Company Setup</a>
            </div>

            <h3>What happens next?</h3>
            <ol>
                <li>Click the setup button above or visit the login page</li>
                <li>Log in using your email and temporary password</li>
                <li>Create a new secure password</li>
                <li>Start inviting your team members</li>
                <li>Begin managing your construction projects!</li>
            </ol>

            <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a>.</p>
        </div>

        <div class="footer">
            <p>© 2024 Construction Blocker Platform. All rights reserved.</p>
            <p>This email was sent to you because a company account was created for ${companyName}.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Welcome to Construction Blocker Platform

Hello ${adminName},

Congratulations! Your company ${companyName} has been successfully set up on our Construction Blocker Platform.

TEMPORARY LOGIN CREDENTIALS:
Email: [Your registered email]
Temporary Password: ${tempPassword}

SECURITY NOTICE:
- This temporary password expires on ${expiryDate}
- You will be required to set a new password on your first login
- Keep these credentials secure and don't share them

Complete your setup: ${loginUrl}

What happens next?
1. Visit the setup link above
2. Log in using your email and temporary password
3. Create a new secure password
4. Start inviting your team members
5. Begin managing your construction projects!

Need help? Contact us at ${this.supportEmail}

© 2024 Construction Blocker Platform. All rights reserved.
`;

    return { html, text };
  }

  generateSuspensionTemplate({ userName, companyName, reason, supportEmail }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; color: #991b1b; margin: 20px 0; }
        .support { background: #fff; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Account Temporarily Suspended</h1>
        </div>

        <div class="content">
            <h2>Hello ${userName},</h2>

            <div class="alert">
                <h3>Important Notice</h3>
                <p>Your company account for <strong>${companyName}</strong> has been temporarily suspended.</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>

            <p>During this suspension period:</p>
            <ul>
                <li>Access to the platform is temporarily restricted</li>
                <li>All your data remains safe and secure</li>
                <li>No data will be lost or deleted</li>
                <li>Your team members are also temporarily unable to access the system</li>
            </ul>

            <div class="support">
                <h3>🤝 Need Assistance?</h3>
                <p>If you believe this suspension is in error or if you'd like to resolve any outstanding issues, please contact our support team immediately.</p>
                <p><strong>Support Email:</strong> <a href="mailto:${supportEmail}">${supportEmail}</a></p>
                <p>Our team is here to help you resolve this matter as quickly as possible.</p>
            </div>

            <p>We apologize for any inconvenience this may cause and look forward to restoring your access soon.</p>
        </div>

        <div class="footer">
            <p>© 2024 Construction Blocker Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
ACCOUNT TEMPORARILY SUSPENDED

Hello ${userName},

Important Notice:
Your company account for ${companyName} has been temporarily suspended.
${reason ? `Reason: ${reason}` : ''}

During this suspension period:
- Access to the platform is temporarily restricted
- All your data remains safe and secure
- No data will be lost or deleted
- Your team members are also temporarily unable to access the system

Need Assistance?
If you believe this suspension is in error or if you'd like to resolve any outstanding issues, please contact our support team immediately.

Support Email: ${supportEmail}

Our team is here to help you resolve this matter as quickly as possible.

We apologize for any inconvenience this may cause and look forward to restoring your access soon.

© 2024 Construction Blocker Platform. All rights reserved.
`;

    return { html, text };
  }

  generateReactivationTemplate({ userName, companyName, loginUrl }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .welcome-back { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 5px; color: #065f46; margin: 20px 0; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome Back!</h1>
        </div>

        <div class="content">
            <h2>Hello ${userName},</h2>

            <div class="welcome-back">
                <h3>✅ Account Reactivated</h3>
                <p>Great news! Your company account for <strong>${companyName}</strong> has been successfully reactivated.</p>
            </div>

            <p>You and your team can now:</p>
            <ul>
                <li>Access your dashboard and all project data</li>
                <li>Create and manage blockers</li>
                <li>Upload and view site drawings</li>
                <li>Collaborate with your team members</li>
                <li>Use all platform features as before</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" class="button">Access Your Dashboard</a>
            </div>

            <p>All your data has been preserved during the suspension period, so you can pick up right where you left off.</p>

            <p>Thank you for your patience, and welcome back to Construction Blocker Platform!</p>
        </div>

        <div class="footer">
            <p>© 2024 Construction Blocker Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
WELCOME BACK!

Hello ${userName},

Great news! Your company account for ${companyName} has been successfully reactivated.

You and your team can now:
- Access your dashboard and all project data
- Create and manage blockers
- Upload and view site drawings
- Collaborate with your team members
- Use all platform features as before

Access your dashboard: ${loginUrl}

All your data has been preserved during the suspension period, so you can pick up right where you left off.

Thank you for your patience, and welcome back to Construction Blocker Platform!

© 2024 Construction Blocker Platform. All rights reserved.
`;

    return { html, text };
  }

  generatePasswordChangeTemplate({ userName, companyName }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .success { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 5px; color: #065f46; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Changed</h1>
        </div>

        <div class="content">
            <h2>Hello ${userName},</h2>

            <div class="success">
                <h3>✅ Password Successfully Changed</h3>
                <p>Your password for <strong>${companyName}</strong> has been successfully updated.</p>
            </div>

            <p>If you did not make this change, please contact our support team immediately at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a>.</p>

            <p>For your security:</p>
            <ul>
                <li>Never share your password with anyone</li>
                <li>Use a unique password that you don't use elsewhere</li>
                <li>Consider using a password manager</li>
                <li>Change your password regularly</li>
            </ul>
        </div>

        <div class="footer">
            <p>© 2024 Construction Blocker Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
PASSWORD CHANGED

Hello ${userName},

Your password for ${companyName} has been successfully updated.

If you did not make this change, please contact our support team immediately at ${this.supportEmail}.

For your security:
- Never share your password with anyone
- Use a unique password that you don't use elsewhere
- Consider using a password manager
- Change your password regularly

© 2024 Construction Blocker Platform. All rights reserved.
`;

    return { html, text };
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;