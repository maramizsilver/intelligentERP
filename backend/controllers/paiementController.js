const paiementService = require('../services/paiement.service');
const db = require('../config/db');
const encryptionService = require('../services/encryption.service');
const SequenceService = require('../services/sequence.service');

exports.createPaiement = async (req, res) => {
  const { commande_id, description, mode_paiement } = req.body;
  if (!commande_id) return res.status(400).json({ success: false, message: 'Commande requise' });

  try {
    const clientDb = req.db;
    const [commande] = await clientDb.promise().query(
      `SELECT c.*, cl.email AS client_email FROM commandes c
       JOIN clients cl ON c.client_id = cl.id WHERE c.id = ?`, [commande_id]);
    if (commande.length === 0) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    const cmd = commande[0];
    if (req.user.is_external && cmd.client_id !== req.user.client_id) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    if (['livree', 'annulee'].includes(cmd.statut)) {
      return res.status(400).json({ success: false, message: 'Cette commande ne peut plus être payée' });
    }
    const montant = Number(cmd.total_ttc || cmd.total);
    if (!(montant > 0)) return res.status(400).json({ success: false, message: 'Montant invalide' });

    const result = await paiementService.createPayment({
      amount: montant,
      currency: process.env.PAIEMENT_DEVISE || 'eur',
      description: description || `Paiement commande #${commande_id}`,
      reference: `CMD-${commande_id}`,
      customerEmail: encryptionService.decryptSafe(cmd.client_email) || req.user.email   // l'email est chiffré en base
    });

    if (result.success) {
      const numero_transaction = await SequenceService.genererNumeroTransaction(clientDb, req.user.entreprise_id);
      await clientDb.promise().query(
        `INSERT INTO paiements (numero_transaction, reference_type, reference_id, montant, mode_paiement, provider_ref, statut, created_by)
         VALUES (?, 'commande', ?, ?, ?, ?, 'en_attente', ?)`,
        [numero_transaction, commande_id, montant, mode_paiement || 'stripe', result.sessionId, req.user.id]);
      return res.json({ success: true, sessionId: result.sessionId, paymentUrl: result.paymentUrl });
    }
    return res.status(500).json({ success: false, message: result.error });
  } catch (error) {
    console.error('[Paiement] Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PAIEMENT FOURNISSEUR : montant = total de l'achat
exports.createPaiementFournisseur = async (req, res) => {
  const { achat_id, description, mode_paiement } = req.body;
  if (!achat_id) return res.status(400).json({ success: false, message: 'Achat requis' });
  try {
    const clientDb = req.db;
    const [achat] = await clientDb.promise().query(
      `SELECT a.*, f.nom AS fournisseur_nom, f.id AS fournisseur_id
       FROM achats a JOIN fournisseurs f ON a.fournisseur_id = f.id WHERE a.id = ?`, [achat_id]);
    if (achat.length === 0) return res.status(404).json({ success: false, message: 'Achat introuvable' });

    const montant = Number(achat[0].total_ttc);
    if (!(montant > 0)) return res.status(400).json({ success: false, message: 'Montant invalide' });

    const result = await paiementService.createPaiementFournisseur({
      amount: montant,
      currency: process.env.PAIEMENT_DEVISE || 'eur',
      description: description || `Paiement fournisseur - ${achat[0].fournisseur_nom}`,
      reference: `ACHAT-${achat_id}`,
      fournisseurId: achat[0].fournisseur_id,
      achatId: achat_id
    });
    if (result.success) {
      const numero_transaction = await SequenceService.genererNumeroTransaction(clientDb, req.user.entreprise_id);
      await clientDb.promise().query(
        `INSERT INTO paiements (numero_transaction, reference_type, reference_id, montant, mode_paiement, provider_ref, statut, created_by)
         VALUES (?, 'achat', ?, ?, ?, ?, 'en_attente', ?)`,
        [numero_transaction, achat_id, montant, mode_paiement || 'stripe', result.sessionId, req.user.id]);
      return res.json({ success: true, sessionId: result.sessionId, paymentUrl: result.paymentUrl });
    }
    return res.status(500).json({ success: false, message: result.error });
  } catch (error) {
    console.error('[Paiement] Erreur paiement fournisseur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ABONNEMENT : l'entreprise doit exister, le prix vient du serveur
exports.createAbonnement = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ success: false, message: 'Email requis' });
  try {
    const [ent] = await db.promisePoolMaster.query(
      'SELECT id, nom FROM entreprises WHERE email = ? ORDER BY id DESC LIMIT 1', [email]);
    if (ent.length === 0) return res.status(404).json({ success: false, message: 'Entreprise introuvable' });

    const montant = Number(process.env.ABONNEMENT_PRIX || 100);
    const result = await paiementService.createAbonnement({
      email, entrepriseNom: ent[0].nom, entrepriseId: ent[0].id, amount: montant
    });
    if (!result.success) return res.status(500).json({ success: false, message: result.error });

    await db.promisePoolMaster.query(
      `INSERT INTO paiements_abonnement (entreprise_nom, email, montant, stripe_session_id, statut, reference)
       VALUES (?, ?, ?, ?, 'en_attente', ?)`,
      [ent[0].nom, email, montant, result.sessionId, `ABO-${Date.now()}`]);
    return res.json({ success: true, sessionId: result.sessionId, paymentUrl: result.paymentUrl });
  } catch (error) {
    console.error('[Paiement] Erreur abonnement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// WEBHOOK STRIPE : seule source de vérité du paiement d'abonnement
exports.webhookStripe = async (req, res) => {
  let event;
  try {
    event = paiementService.stripe.webhooks.constructEvent(
      req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe webhook] signature invalide:', err.message);
    return res.status(400).send('Signature invalide');
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      if (s.payment_status === 'paid' && s.metadata?.type === 'abonnement') {
        await db.promisePoolMaster.query(
          "UPDATE paiements_abonnement SET statut='paye', updated_at=NOW() WHERE stripe_session_id = ?", [s.id]);
        if (s.metadata.entreprise_id) {
          await db.promisePoolMaster.query(
            `UPDATE entreprises SET plan_type='payant',
               statut = CASE WHEN statut='en_attente' THEN 'actif' ELSE statut END
             WHERE id = ?`, [s.metadata.entreprise_id]);
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe webhook] erreur traitement:', err);
    res.status(500).send('Erreur');
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

    // Conversion statut Stripe -> statut interne
    // Master : ENUM paiements_abonnement ('en_attente','paye',...)
    // Tenant : ENUM paiements ('en_attente','valide',...)
    const statutInterne = result.status === 'paid' ? 'valide' : 'en_attente';
    const statutMaster  = result.status === 'paid' ? 'paye'   : 'en_attente';

    const [abonnement] = await db.promisePoolMaster.query(
      'SELECT * FROM paiements_abonnement WHERE stripe_session_id = ?',
      [sessionId]
    );

    if (abonnement.length > 0) {
      await db.promisePoolMaster.query(
        `UPDATE paiements_abonnement 
         SET statut = ?, updated_at = NOW() 
         WHERE stripe_session_id = ?`,
        [statutMaster, sessionId]
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
        [statutInterne, sessionId, paiement[0].id]
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