const notificationService = require('../services/notification.service');
const db = require('../config/db');

exports.testNotification = async (req, res) => {
  const { email, phone, telegramChatId } = req.body;

  try {
    const result = await notificationService.send({
      to: { email, phone },
      subject: 'Test Notification',
      message: 'This is a test notification from the ERP platform.',
      channels: ['email', 'sms', 'whatsapp', 'telegram'],
      chatId: telegramChatId,
    });

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendLoginAlert = async (req, res) => {
  const { userId, entrepriseId } = req.body;

  try {
    const [users] = await db.promisePoolMaster.query(
      `SELECT u.*, e.nom AS entreprise_nom, e.id AS entreprise_id
       FROM users u
       LEFT JOIN entreprises e ON u.entreprise_id = e.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
        device_type: req.body.device_type || 'Unknown',
        os: req.body.os || 'Unknown',
        browser: req.body.browser || 'Unknown',
      },
      location: {
        country: req.body.country || 'Unknown',
        city: req.body.city || 'Unknown',
      },
      ip: req.ip || req.connection.remoteAddress,
      userEmail: user.email,
      userPhone: preferences.phone || null,
      userTelegramChatId: preferences.telegram_chat_id || null,
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error('[Notification] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePreferences = async (req, res) => {
  const { phone, telegram_chat_id, email_enabled, sms_enabled, whatsapp_enabled, telegram_enabled } = req.body;
  const userId = req.user.id;

  try {
    await db.promisePoolMaster.query(
      `INSERT INTO user_notification_preferences 
       (user_id, phone, telegram_chat_id, email_enabled, sms_enabled, whatsapp_enabled, telegram_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       phone = VALUES(phone),
       telegram_chat_id = VALUES(telegram_chat_id),
       email_enabled = VALUES(email_enabled),
       sms_enabled = VALUES(sms_enabled),
       whatsapp_enabled = VALUES(whatsapp_enabled),
       telegram_enabled = VALUES(telegram_enabled)`,
      [
        userId,
        phone || null,
        telegram_chat_id || null,
        email_enabled !== undefined ? email_enabled : true,
        sms_enabled !== undefined ? sms_enabled : false,
        whatsapp_enabled !== undefined ? whatsapp_enabled : false,
        telegram_enabled !== undefined ? telegram_enabled : false,
      ]
    );

    res.json({ success: true, message: 'Preferences updated' });
  } catch (err) {
    console.error('[Notification] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

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
        telegram_chat_id: null,
        email_enabled: true,
        sms_enabled: false,
        whatsapp_enabled: false,
        telegram_enabled: false,
      },
    });
  } catch (err) {
    console.error('[Notification] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};