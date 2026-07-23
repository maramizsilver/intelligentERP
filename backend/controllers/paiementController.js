const paiementService = require('../services/paiement.service');
const db = require('../config/db');
const SequenceService = require('../services/sequence.service');

// ============================================================
// PAIEMENT CLIENT (COMMANDE)
// ============================================================
exports.createPaiement = async (req, res) => {
  const { commande_id, montant, description, mode_paiement } = req.body;

  if (!commande_id || !montant || montant <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Commande et montant requis',
    });
  }

  try {
    const clientDb = req.db;

    const [commande] = await clientDb.promise().query(
      `SELECT c.*, cl.email, cl.telephone 
       FROM commandes c
       JOIN clients cl ON c.client_id = cl.id
       WHERE c.id = ?`,
      [commande_id]
    );

    if (commande.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable',
      });
    }

    const result = await paiementService.createPayment({
      amount: montant,
      currency: 'eur',
      description: description || `Paiement commande #${commande_id}`,
      reference: `CMD-${commande_id}`,
      customerEmail: commande[0].email || req.user.email,
    });

    if (result.success) {
      const numero_transaction = await SequenceService.genererNumeroTransaction(clientDb, req.user.entreprise_id);

      await clientDb.promise().query(
        `INSERT INTO paiements 
         (numero_transaction, reference_type, reference_id, montant, mode_paiement, provider_ref, statut, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numero_transaction,
          'commande',
          commande_id,
          montant,
          mode_paiement || 'stripe',
          result.sessionId,
          'en_attente',
          req.user.id,
        ]
      );

      return res.json({
        success: true,
        sessionId: result.sessionId,
        paymentUrl: result.paymentUrl,
      });
    }

    return res.status(500).json({
      success: false,
      message: result.error,
    });
  } catch (error) {
    console.error('[Paiement] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============================================================
// PAIEMENT FOURNISSEUR (ACHAT)
// ============================================================
exports.createPaiementFournisseur = async (req, res) => {
  const { achat_id, montant, description, mode_paiement } = req.body;

  if (!achat_id || !montant || montant <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Achat et montant requis',
    });
  }

  try {
    const clientDb = req.db;

    const [achat] = await clientDb.promise().query(
      `SELECT a.*, f.nom AS fournisseur_nom, f.id AS fournisseur_id
       FROM achats a
       JOIN fournisseurs f ON a.fournisseur_id = f.id
       WHERE a.id = ?`,
      [achat_id]
    );

    if (achat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Achat introuvable',
      });
    }

    const result = await paiementService.createPaiementFournisseur({
      amount: montant,
      currency: 'eur',
      description: description || `Paiement fournisseur - ${achat[0].fournisseur_nom}`,
      reference: `ACHAT-${achat_id}`,
      fournisseurId: achat[0].fournisseur_id,
      achatId: achat_id,
    });

    if (result.success) {
      const numero_transaction = await SequenceService.genererNumeroTransaction(clientDb, req.user.entreprise_id);

      await clientDb.promise().query(
        `INSERT INTO paiements 
         (numero_transaction, reference_type, reference_id, montant, mode_paiement, provider_ref, statut, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numero_transaction,
          'achat',
          achat_id,
          montant,
          mode_paiement || 'stripe',
          result.sessionId,
          'en_attente',
          req.user.id,
        ]
      );

      return res.json({
        success: true,
        sessionId: result.sessionId,
        paymentUrl: result.paymentUrl,
      });
    }

    return res.status(500).json({
      success: false,
      message: result.error,
    });
  } catch (error) {
    console.error('[Paiement] Erreur paiement fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============================================================
// PAIEMENT ABONNEMENT (dans base MASTER)
// ============================================================
exports.createAbonnement = async (req, res) => {
  const { email, entreprise_nom, montant } = req.body;

  try {
    const result = await paiementService.createAbonnement({
      email: email,
      entrepriseNom: entreprise_nom,
      amount: montant || 100,
    });

    if (result.success) {
      await db.promisePoolMaster.query(
        `INSERT INTO paiements_abonnement 
         (entreprise_nom, email, montant, stripe_session_id, statut, reference)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          entreprise_nom,
          email,
          montant || 100,
          result.sessionId,
          'en_attente',
          `ABO-${Date.now()}`,
        ]
      );

      return res.json({
        success: true,
        sessionId: result.sessionId,
        paymentUrl: result.paymentUrl,
      });
    }

    return res.status(500).json({
      success: false,
      message: result.error,
    });
  } catch (error) {
    console.error('[Paiement] Erreur abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============================================================
// VERIFIER UN PAIEMENT
// ============================================================
exports.verifierPaiement = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const result = await paiementService.verifyPayment(sessionId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }

    const [abonnement] = await db.promisePoolMaster.query(
      'SELECT * FROM paiements_abonnement WHERE stripe_session_id = ?',
      [sessionId]
    );

    if (abonnement.length > 0) {
      await db.promisePoolMaster.query(
        `UPDATE paiements_abonnement 
         SET statut = ?, updated_at = NOW() 
         WHERE stripe_session_id = ?`,
        [result.status, sessionId]
      );

      return res.json({
        success: true,
        status: result.status,
        montant: result.amount,
        currency: result.currency,
        type: 'abonnement',
      });
    }

    const clientDb = req.db;

    const [paiement] = await clientDb.promise().query(
      'SELECT * FROM paiements WHERE provider_ref = ?',
      [sessionId]
    );

    if (paiement.length > 0) {
      await clientDb.promise().query(
        `UPDATE paiements 
         SET statut = ?, provider_ref = ? 
         WHERE id = ?`,
        [result.status, sessionId, paiement[0].id]
      );

      return res.json({
        success: true,
        status: result.status,
        montant: result.amount,
        currency: result.currency,
        reference_type: paiement[0].reference_type,
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Paiement non trouve',
    });
  } catch (error) {
    console.error('[Paiement] Erreur verification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============================================================
// CONFIRMER PAIEMENT FOURNISSEUR
// ============================================================
exports.confirmerPaiementFournisseur = async (req, res) => {
  const { sessionId } = req.body;

  try {
    const result = await paiementService.verifyPayment(sessionId);

    if (result.success && result.status === 'paid') {
      const clientDb = req.db;

      const [paiement] = await clientDb.promise().query(
        'SELECT reference_id FROM paiements WHERE provider_ref = ? AND reference_type = ?',
        [sessionId, 'achat']
      );

      if (paiement.length > 0 && paiement[0].reference_id) {
        await clientDb.promise().query(
          `UPDATE paiements SET statut = 'valide' WHERE provider_ref = ?`,
          [sessionId]
        );

        await clientDb.promise().query(
          `UPDATE achats SET statut = 'paye' WHERE id = ?`,
          [paiement[0].reference_id]
        );
      }

      return res.json({
        success: true,
        message: 'Paiement fournisseur confirme',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Paiement non valide',
    });
  } catch (error) {
    console.error('[Paiement] Erreur confirmation paiement fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============================================================
// CONFIRMER ABONNEMENT
// ============================================================
exports.confirmerAbonnement = async (req, res) => {
  const { sessionId } = req.body;

  try {
    const result = await paiementService.verifyPayment(sessionId);

    if (result.success && result.status === 'paid') {
      await db.promisePoolMaster.query(
        `UPDATE paiements_abonnement 
         SET statut = 'paye', updated_at = NOW() 
         WHERE stripe_session_id = ?`,
        [sessionId]
      );

      return res.json({
        success: true,
        message: 'Abonnement confirme',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Paiement non valide',
    });
  } catch (error) {
    console.error('[Paiement] Erreur confirmation abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};