import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
const apiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY || "default-key";
mailService.setApiKey(apiKey);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (apiKey === "default-key") {
      console.log('Email would be sent:', params);
      return true; // Return success for development
    }
    
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
