const Stripe = require('stripe');

class PaiementService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createPayment({ amount, currency = 'eur', description, reference, customerEmail }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: description || 'Paiement ERP',
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/paiement/client/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/paiement/cancel`,
        metadata: {
          reference: reference,
          type: 'commande',
        },
        customer_email: customerEmail,
      });

      return {
        success: true,
        sessionId: session.id,
        paymentUrl: session.url,
      };
    } catch (error) {
      console.error('[Stripe] Erreur:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createPaiementFournisseur({ amount, currency = 'eur', description, reference, fournisseurId, achatId }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: `Paiement fournisseur - ${reference || 'Achat #' + achatId}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/paiement/fournisseur/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/paiement/fournisseur/cancel`,
        metadata: {
          type: 'fournisseur',
          achat_id: achatId,
          fournisseur_id: fournisseurId,
        },
      });

      return {
        success: true,
        sessionId: session.id,
        paymentUrl: session.url,
      };
    } catch (error) {
      console.error('[Stripe] Erreur paiement fournisseur:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createAbonnement({ email, entrepriseNom, amount = 100 }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Abonnement ERP - ${entrepriseNom}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/paiement/abonnement-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/paiement/abonnement-cancel`,
        metadata: {
          entreprise_nom: entrepriseNom,
          type: 'abonnement',
        },
        customer_email: email,
      });

      return {
        success: true,
        sessionId: session.id,
        paymentUrl: session.url,
      };
    } catch (error) {
      console.error('[Stripe] Erreur abonnement:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyPayment(sessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      return {
        success: true,
        status: session.payment_status,
        amount: session.amount_total / 100,
        currency: session.currency,
        customer: session.customer_details,
        metadata: session.metadata,
        data: session,
      };
    } catch (error) {
      console.error('[Stripe] Erreur verification:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new PaiementService();