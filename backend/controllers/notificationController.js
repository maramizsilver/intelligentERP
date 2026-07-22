const notificationService = require('../services/notification.service');
const db = require('../config/db');

// TEST NOTIFICATION
exports.testNotification = async (req, res) => {
  const { email, phone } = req.body;

  try {
    const result = await notificationService.send({
      to: { email, phone },
      subject: 'Test Notification',
      message: 'Ceci est un test de notification depuis la plateforme ERP.',
      channels: ['email', 'whatsapp'],
    });

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// SEND LOGIN ALERT
exports.sendLoginAlert = async (req, res) => {
  const { userId } = req.body;

  try {
    const [users] = await db.promisePoolMaster.query(
      `SELECT u.*, e.nom AS entreprise_nom, e.id AS entreprise_id
       FROM users u
       LEFT JOIN entreprises e ON u.entreprise_id = e.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    }

    const user = users[0];

    const [prefs] = await db.promisePoolMaster.query(
      `SELECT * FROM user_notification_preferences WHERE user_id = ?`,
      [userId]
    );

    const preferences = prefs.length > 0 ? prefs[0] : {};

    const result = await notificationService.sendLoginAlert({
      user,
      entreprise: { nom: user.entreprise_nom, id: user.entreprise_id },
      device: {
        device_type: req.body.device_type || 'Inconnu',
        os: req.body.os || 'Inconnu',
        browser: req.body.browser || 'Inconnu',
      },
      location: {
        country: req.body.country || 'Inconnu',
        city: req.body.city || 'Inconnu',
      },
      ip: req.ip || req.connection.remoteAddress,
      userEmail: user.email,
      userPhone: preferences.phone || null,
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error('[Notification] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE PREFERENCES
exports.updatePreferences = async (req, res) => {
  const { phone, email_enabled, whatsapp_enabled } = req.body;
  const userId = req.user.id;

  try {
    await db.promisePoolMaster.query(
      `INSERT INTO user_notification_preferences 
       (user_id, phone, email_enabled, whatsapp_enabled)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       phone = VALUES(phone),
       email_enabled = VALUES(email_enabled),
       whatsapp_enabled = VALUES(whatsapp_enabled)`,
      [
        userId,
        phone || null,
        email_enabled !== undefined ? email_enabled : true,
        whatsapp_enabled !== undefined ? whatsapp_enabled : false,
      ]
    );

    res.json({ success: true, message: 'Preferences mises a jour' });
  } catch (err) {
    console.error('[Notification] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET PREFERENCES
exports.getPreferences = async (req, res) => {
  const userId = req.user.id;

  try {
    const [prefs] = await db.promisePoolMaster.query(
      `SELECT * FROM user_notification_preferences WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      preferences: prefs.length > 0 ? prefs[0] : {
        phone: null,
        email_enabled: true,
        whatsapp_enabled: false,
      },
    });
  } catch (err) {
    console.error('[Notification] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// TEST CANAL
exports.testCanal = async (req, res) => {
  const { canal, to, message } = req.body;
  
  console.log('[TEST] Canal:', canal);
  console.log('[TEST] To:', to);
  
  try {
    let result;
    
    switch (canal) {
      case 'whatsapp':
        if (!to) {
          return res.status(400).json({ 
            success: false, 
            error: 'Le numero de telephone est requis pour WhatsApp' 
          });
        }
        result = await notificationService.sendWhatsApp({
          to: to,
          message: message || 'Test WhatsApp depuis ERP',
        });
        break;
        
      case 'email':
        if (!to) {
          return res.status(400).json({ 
            success: false, 
            error: 'L\'email est requis' 
          });
        }
        result = await notificationService.sendEmail({
          to: to,
          subject: 'Test Notification',
          html: message || '<h1>Test</h1><p>Ceci est un test</p>',
          text: message || 'Test'
        });
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Canal invalide. Utilisez: email, whatsapp' 
        });
    }
    
    res.json({ 
      success: true, 
      canal, 
      result,
      test: true
    });
  } catch (err) {
    console.error('[TEST] Erreur:', err);
    res.status(500).json({ 
      success: false, 
      canal, 
      error: err.message 
    });
  }
};