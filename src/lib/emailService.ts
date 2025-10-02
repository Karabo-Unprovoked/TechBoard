// EmailJS configuration for free email sending
import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: 'service_guardian', // You'll get this from EmailJS
  templateId: 'template_repair', // You'll create this template
  publicKey: 'YOUR_PUBLIC_KEY', // You'll get this from EmailJS
};

// Initialize EmailJS
export const initEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.publicKey);
};

// Send email using EmailJS
export const sendEmail = async (emailData: {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  ticket_number?: string;
  from_name?: string;
  from_email?: string;
}) => {
  try {
    const templateParams = {
      to_email: emailData.to_email,
      to_name: emailData.to_name,
      subject: emailData.subject,
      message: emailData.message,
      ticket_number: emailData.ticket_number || '',
      from_name: emailData.from_name || 'Guardian Assist',
      from_email: emailData.from_email || 'info@computerguardian.co.za',
      reply_to: 'info@computerguardian.co.za',
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    return {
      success: true,
      message: 'Email sent successfully',
      response
    };
  } catch (error: any) {
    console.error('EmailJS Error:', error);
    return {
      success: false,
      message: error.text || 'Failed to send email',
      error
    };
  }
};

// Test email function
export const sendTestEmail = async (testEmail: string, subject: string, message: string) => {
  return await sendEmail({
    to_email: testEmail,
    to_name: 'Test User',
    subject: subject,
    message: message,
    from_name: 'Guardian Assist',
    from_email: 'info@computerguardian.co.za'
  });
};