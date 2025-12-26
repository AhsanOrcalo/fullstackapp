import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter;

  constructor() {
    // Get SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@freshdata.com';

    // Log configuration status
    if (!smtpUser || !smtpPass) {
      this.logger.warn('SMTP credentials not configured. Email sending will fail.');
      this.logger.warn('Please set SMTP_USER and SMTP_PASS environment variables.');
      this.logger.warn('In development mode, temporary passwords will be logged to console.');
    } else {
      this.logger.log(`Email service configured for ${smtpHost}:${smtpPort}`);
    }

    // Create transporter - using Gmail as default, can be configured via environment variables
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: smtpUser && smtpPass ? {
        user: smtpUser,
        pass: smtpPass,
      } : undefined,
      // Add connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async sendPasswordResetEmail(email: string, temporaryPassword: string): Promise<void> {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@freshdata.com';

    // Always log temporary password in development mode for testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      this.logger.log('========================================');
      this.logger.log('PASSWORD RESET EMAIL (Development Mode)');
      this.logger.log('========================================');
      this.logger.log(`To: ${email}`);
      this.logger.log(`Subject: Password Reset - Temporary Password`);
      this.logger.log(`Temporary Password: ${temporaryPassword}`);
      this.logger.log('========================================');
    }

    // If SMTP credentials are not configured, skip sending email
    if (!smtpUser || !smtpPass) {
      this.logger.warn('SMTP credentials not configured. Email not sent.');
      this.logger.warn('Temporary password logged above (development mode).');
      return;
    }

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: 'Password Reset - Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password. Please use the following temporary password to log in:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1f2937; text-align: center;">
              ${temporaryPassword}
            </p>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This is a temporary password. Please change it after logging in.</li>
            <li>For security reasons, do not share this password with anyone.</li>
            <li>If you did not request this password reset, please contact support immediately.</li>
          </ul>
          <p>Best regards,<br>FreshData Team</p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello,
        
        You have requested to reset your password. Please use the following temporary password to log in:
        
        ${temporaryPassword}
        
        Important:
        - This is a temporary password. Please change it after logging in.
        - For security reasons, do not share this password with anyone.
        - If you did not request this password reset, please contact support immediately.
        
        Best regards,
        FreshData Team
      `,
    };

    try {
      // Verify transporter connection first
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent successfully to ${email}`);
      this.logger.debug(`Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Error sending email:', error);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        this.logger.error('SMTP authentication failed. Please check SMTP_USER and SMTP_PASS.');
      } else if (error.code === 'ECONNECTION') {
        this.logger.error('SMTP connection failed. Please check SMTP_HOST and SMTP_PORT.');
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('SMTP connection timed out. Please check your network connection.');
      }

      // In development, don't throw - just log
      if (isDevelopment) {
        this.logger.warn('Email sending failed, but temporary password is logged above.');
      } else {
        // In production, throw error so it can be handled upstream
        throw new Error('Failed to send email. Please try again later.');
      }
    }
  }
}

