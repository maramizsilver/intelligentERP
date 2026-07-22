require('dotenv').config();

module.exports = {
  // EMAIL - GRATUIT
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'noreply@erp.com',
    fromName: process.env.SMTP_FROM_NAME || 'ERP Platform',
  },

  
  // WHATSAPP - GRATUIT (Twilio Sandbox)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
    environment: process.env.TWILIO_ENVIRONMENT || 'sandbox',
  },

  // WHATSAPP - GRATUIT (CallMeBot - Fallback)
  callmebot: {
    apiKey: process.env.CALLMEBOT_API_KEY || '',
    apiUrl: 'https://api.callmebot.com/whatsapp.php',
  },

  // CANAUX PAR DEFAUT
  defaultChannels: {
    alert: ['email', 'whatsapp'],
    info: ['email'],
    marketing: ['email', 'whatsapp'],
    commande: ['email', 'whatsapp'],
    securite: ['email', 'whatsapp'],
  },
};