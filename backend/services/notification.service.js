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
      console.log('[Notification] Email configure avec succes');
    } else {
      console.warn('[Notification] Email non configure');
    }

    // TWILIO - WhatsApp
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

    // CALLMEBOT - WhatsApp (Fallback gratuit)
    this.callmebotApiKey = notificationConfig.callmebot?.apiKey || process.env.CALLMEBOT_API_KEY;
    if (this.callmebotApiKey) {
      console.log('[Notification] CallMeBot configure');
    }
  }


  // EMAIL
  async sendEmail({ to, subject, html, text }) {
    if (!this.emailTransporter) {
      console.warn('[Email] Email non configure');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const info = await this.emailTransporter.sendMail({
        from: `"${notificationConfig.email.fromName}" <${notificationConfig.email.from}>`,
        to,
        subject,
        html: html || text,
        text: text || html?.replace(/<[^>]*>/g, '') || '',
      });

      console.log('[Email] Envoye:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[Email] Erreur:', err.message);
      return { success: false, error: err.message };
    }
  }

  // WHATSAPP - Twilio + CallMeBot (Fallback)
  async sendWhatsApp({ to, message }) {
    // 1. Twilio Sandbox
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

    // 2. CallMeBot (Fallback gratuit)
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

  // METHODE UNIVERSELLE
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

  // ALERTE DE CONNEXION
  async sendLoginAlert({
    user,
    entreprise,
    device,
    location,
    ip,
    userEmail,
    userPhone,
  }) {
    const date = new Date().toLocaleString('fr-FR');
    const message = `
Nouvelle connexion detectee

Utilisateur: ${user.nom} ${user.prenom}
Entreprise: ${entreprise?.nom || 'N/A'}
Email: ${user.email}
Date: ${date}

Appareil: ${device?.device_type || 'Inconnu'}
OS: ${device?.os || 'Inconnu'}
Navigateur: ${device?.browser || 'Inconnu'}
Localisation: ${location?.country || 'Inconnu'}${location?.city ? ` (${location.city})` : ''}
IP: ${ip || 'Inconnu'}

Si vous ne reconnaissez pas cette connexion, contactez votre administrateur.
    `;

    const html = `
      <h2>Nouvelle connexion detectee</h2>
      <p><strong>Utilisateur:</strong> ${user.nom} ${user.prenom}</p>
      <p><strong>Entreprise:</strong> ${entreprise?.nom || 'N/A'}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Date:</strong> ${date}</p>
      <hr>
      <p><strong>Appareil:</strong> ${device?.device_type || 'Inconnu'}</p>
      <p><strong>OS:</strong> ${device?.os || 'Inconnu'}</p>
      <p><strong>Navigateur:</strong> ${device?.browser || 'Inconnu'}</p>
      <p><strong>Localisation:</strong> ${location?.country || 'Inconnu'}${location?.city ? ` (${location.city})` : ''}</p>
      <p><strong>IP:</strong> ${ip || 'Inconnu'}</p>
      <hr>
      <p style="color:red;"><strong>Si vous ne reconnaissez pas cette connexion, contactez votre administrateur.</strong></p>
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