const nodemailer = require('nodemailer');
const axios = require('axios');
const notificationConfig = require('../config/notification.config');

class NotificationService {
  constructor() {
    // EMAIL
    this.emailTransporter = null;
    if (notificationConfig.email.auth.user && notificationConfig.email.auth.pass) {
      this.emailTransporter = nodemailer.createTransport({
        host: notificationConfig.email.host,
        port: notificationConfig.email.port,
        secure: notificationConfig.email.secure,
        auth: {
          user: notificationConfig.email.auth.user,
          pass: notificationConfig.email.auth.pass,
        },
      });
    }

    // TWILIO - Ne s'initialise que si les cles sont presentes
    this.twilioClient = null;
    const twilioAccountSid = notificationConfig.twilio.accountSid;
    const twilioAuthToken = notificationConfig.twilio.authToken;
    
    if (twilioAccountSid && twilioAuthToken && twilioAccountSid.startsWith('AC')) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        console.log('[Notification] Twilio initialise avec succes');
      } catch (err) {
        console.warn('[Notification] Erreur Twilio:', err.message);
        this.twilioClient = null;
      }
    } else {
      console.warn('[Notification] Twilio non configure - cles manquantes');
    }

    // TELEGRAM
    this.telegramBotToken = notificationConfig.telegram.botToken;
    if (this.telegramBotToken) {
      console.log('[Notification] Telegram configure');
    } else {
      console.warn('[Notification] Telegram non configure');
    }
  }

  // ============================================================
  // EMAIL
  // ============================================================
  async sendEmail({ to, subject, html, text }) {
    if (!this.emailTransporter) {
      console.warn('[Notification] Email non configure');
      return { success: false, message: 'Email not configured' };
    }

    try {
      const info = await this.emailTransporter.sendMail({
        from: `"${notificationConfig.email.fromName}" <${notificationConfig.email.from}>`,
        to,
        subject,
        html: html || text,
        text: text || html?.replace(/<[^>]*>/g, '') || '',
      });

      console.log('[Notification] Email envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[Notification] Erreur email:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ============================================================
  // SMS (Twilio)
  // ============================================================
  async sendSMS({ to, message }) {
    if (!this.twilioClient) {
      console.warn('[Notification] Twilio non configure - SMS ignore');
      return { success: false, message: 'Twilio not configured' };
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: notificationConfig.twilio.phoneNumber,
        to,
      });

      console.log('[Notification] SMS envoyé:', result.sid);
      return { success: true, sid: result.sid };
    } catch (err) {
      console.error('[Notification] Erreur SMS:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ============================================================
  // WhatsApp (Twilio)
  // ============================================================
  async sendWhatsApp({ to, message }) {
    if (!this.twilioClient) {
      console.warn('[Notification] Twilio non configure - WhatsApp ignore');
      return { success: false, message: 'Twilio not configured' };
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${notificationConfig.twilio.whatsappNumber}`,
        to: `whatsapp:${to}`,
      });

      console.log('[Notification] WhatsApp envoyé:', result.sid);
      return { success: true, sid: result.sid };
    } catch (err) {
      console.error('[Notification] Erreur WhatsApp:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ============================================================
  // TELEGRAM
  // ============================================================
  async sendTelegram({ chatId, message, parseMode = 'HTML' }) {
    if (!this.telegramBotToken) {
      console.warn('[Notification] Telegram non configure');
      return { success: false, message: 'Telegram not configured' };
    }

    try {
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      const response = await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      });

      console.log('[Notification] Telegram envoyé:', response.data.result.message_id);
      return { success: true, messageId: response.data.result.message_id };
    } catch (err) {
      console.error('[Notification] Erreur Telegram:', err.response?.data || err.message);
      return { success: false, error: err.message };
    }
  }

  // ============================================================
  // METHODE UNIVERSELLE
  // ============================================================
  async send({
    to,
    subject,
    message,
    channels = ['email'],
    html,
    chatId,
  }) {
    const results = {};

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          if (to?.email) {
            results.email = await this.sendEmail({
              to: to.email,
              subject,
              html: html || message,
              text: message,
            });
          }
          break;

        case 'sms':
          if (to?.phone) {
            results.sms = await this.sendSMS({
              to: to.phone,
              message: message.replace(/<[^>]*>/g, ''),
            });
          }
          break;

        case 'whatsapp':
          if (to?.phone) {
            results.whatsapp = await this.sendWhatsApp({
              to: to.phone,
              message: message.replace(/<[^>]*>/g, ''),
            });
          }
          break;

        case 'telegram':
          if (chatId) {
            results.telegram = await this.sendTelegram({
              chatId,
              message,
            });
          }
          break;

        default:
          console.warn(`[Notification] Canal inconnu: ${channel}`);
      }
    }

    return results;
  }

  // ============================================================
  // ALERTE DE CONNEXION
  // ============================================================
  async sendLoginAlert({
    user,
    entreprise,
    device,
    location,
    ip,
    userEmail,
    userPhone,
    userTelegramChatId,
  }) {
    const date = new Date().toLocaleString('fr-FR');
    const message = `
[NEW LOGIN DETECTED]

User: ${user.nom} ${user.prenom}
Company: ${entreprise?.nom || 'N/A'}
Email: ${user.email}
Date/Time: ${date}

Device: ${device?.device_type || 'Unknown'}
OS: ${device?.os || 'Unknown'}
Browser: ${device?.browser || 'Unknown'}
Location: ${location?.country || 'Unknown'}${location?.city ? ` (${location.city})` : ''}
IP: ${ip || 'Unknown'}

If you do not recognize this login, contact your administrator immediately.
    `;

    const html = `
      <h2>New Login Detected</h2>
      <p><strong>User:</strong> ${user.nom} ${user.prenom}</p>
      <p><strong>Company:</strong> ${entreprise?.nom || 'N/A'}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Date/Time:</strong> ${date}</p>
      <hr>
      <p><strong>Device:</strong> ${device?.device_type || 'Unknown'}</p>
      <p><strong>OS:</strong> ${device?.os || 'Unknown'}</p>
      <p><strong>Browser:</strong> ${device?.browser || 'Unknown'}</p>
      <p><strong>Location:</strong> ${location?.country || 'Unknown'}${location?.city ? ` (${location.city})` : ''}</p>
      <p><strong>IP:</strong> ${ip || 'Unknown'}</p>
      <hr>
      <p style="color:red;"><strong>If you do not recognize this login, contact your administrator immediately.</strong></p>
    `;

    const channels = ['email'];
    if (userPhone) channels.push('sms', 'whatsapp');
    if (userTelegramChatId) channels.push('telegram');

    return this.send({
      to: {
        email: userEmail,
        phone: userPhone,
      },
      subject: `New Login - ${entreprise?.nom || 'ERP'}`,
      message,
      html,
      channels,
      chatId: userTelegramChatId,
    });
  }
}

module.exports = new NotificationService();