const nodemailer = require('nodemailer');
const axios = require('axios');
const notificationConfig = require('../config/notification.config');

class NotificationService {
  constructor() {
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
      console.log('[Notification] Email configure avec succes');
    } else {
      console.warn('[Notification] Email non configure');
    }

    this.twilioClient = null;
    const twilioAccountSid = notificationConfig.twilio?.accountSid;
    const twilioAuthToken = notificationConfig.twilio?.authToken;
    
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
      console.warn('[Notification] Twilio non configure');
    }

    this.callmebotApiKey = notificationConfig.callmebot?.apiKey || process.env.CALLMEBOT_API_KEY;
    if (this.callmebotApiKey) {
      console.log('[Notification] CallMeBot configure');
    }
  }


  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.emailTransporter) {
      console.warn('[Email] Email non configure');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const mailOptions = {
        from: `"${notificationConfig.email.fromName}" <${notificationConfig.email.from}>`,
        to,
        subject,
        html: html || text,
        text: text || html?.replace(/<[^>]*>/g, '') || '',
      };

      // Ajouter les pièces jointes si présentes
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map(att => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content, 'base64'),
          contentType: att.contentType || 'application/octet-stream'
        }));
      }

      const info = await this.emailTransporter.sendMail(mailOptions);

      console.log('[Email] Envoye:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[Email] Erreur:', err.message);
      return { success: false, error: err.message };
    }
  }

  async sendWhatsApp({ to, message }) {
    if (this.twilioClient) {
      try {
        const whatsappNumber = notificationConfig.twilio.whatsappNumber || '+14155238886';
        
        console.log('[WhatsApp] Envoi a:', to);
        console.log('[WhatsApp] From:', `whatsapp:${whatsappNumber}`);

        const result = await this.twilioClient.messages.create({
          body: message,
          from: `whatsapp:${whatsappNumber}`,
          to: `whatsapp:${to}`,
        });

        console.log('[WhatsApp] Envoye via Twilio:', result.sid);
        return { success: true, provider: 'twilio', sid: result.sid };
      } catch (err) {
        console.error('[WhatsApp] Erreur Twilio:', err.message);
      }
    }

    if (this.callmebotApiKey) {
      try {
        const url = 'https://api.callmebot.com/whatsapp.php';
        const response = await axios.get(url, {
          params: {
            phone: to.replace(/\+/g, ''),
            text: message,
            apikey: this.callmebotApiKey,
          },
          timeout: 10000,
        });

        console.log('[WhatsApp] Envoye via CallMeBot:', response.data);
        if (response.data && response.data.success !== false) {
          return { success: true, provider: 'callmebot', data: response.data };
        }
      } catch (err) {
        console.error('[WhatsApp] Erreur CallMeBot:', err.message);
      }
    }

    console.warn('[WhatsApp] Aucun service WhatsApp configure');
    return { success: false, error: 'Aucun service WhatsApp configure' };
  }

  async send({
    to,
    subject,
    message,
    channels = ['email'],
    html,
  }) {
    console.log('[Notification] Canaux:', channels);
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

        case 'whatsapp':
          if (to?.phone) {
            results.whatsapp = await this.sendWhatsApp({
              to: to.phone,
              message: message.replace(/<[^>]*>/g, ''),
            });
          }
          break;

        default:
          console.warn(`[Notification] Canal inconnu: ${channel}`);
      }
    }

    return results;
  }

  async sendLoginAlert({
    user,
    entreprise,
    device,
    location,
    ip,
    userEmail,
    userPhone,
    customData = {}
  }) {
    const date = new Date().toLocaleString('fr-FR');
    const message = `
Nouvelle connexion detectee

Utilisateur: ${user.nom || user.prenom || 'Utilisateur'} ${user.prenom || ''}
Entreprise: ${entreprise?.nom || 'N/A'}
Email: ${user.email}
Date: ${date}

Appareil: ${device?.device_type || customData.device_type || 'Inconnu'}
OS: ${device?.os || customData.os || 'Inconnu'}
Version OS: ${device?.os_version || customData.os_version || 'N/A'}
Navigateur: ${device?.browser || customData.browser || 'Inconnu'}
Version Navigateur: ${device?.browser_version || customData.browser_version || 'N/A'}
Localisation: ${location?.country || customData.location || 'Inconnu'}${location?.city ? ` (${location.city})` : ''}
IP: ${ip || customData.ip || 'Inconnu'}
Resolution ecran: ${device?.screen_resolution || customData.screen_resolution || 'N/A'}
Langue: ${device?.language || customData.language || 'N/A'}

Si vous ne reconnaissez pas cette connexion, connectez-vous et signalez-la depuis vos sessions actives.
    `;

    const html = `
      <h2>Nouvelle connexion detectee</h2>
      <p><strong>Utilisateur:</strong> ${user.nom || user.prenom || 'Utilisateur'} ${user.prenom || ''}</p>
      <p><strong>Entreprise:</strong> ${entreprise?.nom || 'N/A'}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Date:</strong> ${date}</p>
      <hr>
      <p><strong>Appareil:</strong> ${device?.device_type || customData.device_type || 'Inconnu'}</p>
      <p><strong>OS:</strong> ${device?.os || customData.os || 'Inconnu'}</p>
      <p><strong>Version OS:</strong> ${device?.os_version || customData.os_version || 'N/A'}</p>
      <p><strong>Navigateur:</strong> ${device?.browser || customData.browser || 'Inconnu'}</p>
      <p><strong>Version Navigateur:</strong> ${device?.browser_version || customData.browser_version || 'N/A'}</p>
      <p><strong>Localisation:</strong> ${location?.country || customData.location || 'Inconnu'}${location?.city ? ` (${location.city})` : ''}</p>
      <p><strong>IP:</strong> ${ip || customData.ip || 'Inconnu'}</p>
      <p><strong>Resolution ecran:</strong> ${device?.screen_resolution || customData.screen_resolution || 'N/A'}</p>
      <p><strong>Langue:</strong> ${device?.language || customData.language || 'N/A'}</p>
      <hr>
      <p style="color:red;"><strong>Si vous ne reconnaissez pas cette connexion, connectez-vous et signalez-la depuis vos sessions actives.</strong></p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/sessions">Gerer mes sessions</a></p>
    `;

    const channels = ['email'];
    if (userPhone) channels.push('whatsapp');

    return this.send({
      to: {
        email: userEmail,
        phone: userPhone,
      },
      subject: `Nouvelle connexion - ${entreprise?.nom || 'ERP'}`,
      message,
      html,
      channels,
    });
  }
}

module.exports = new NotificationService();