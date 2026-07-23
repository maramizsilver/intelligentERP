import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function PaiementFournisseur() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    achat_id: '',
    montant: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!form.achat_id || !form.montant || form.montant <= 0) {
      setError('Veuillez saisir un achat et un montant valide');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/paiement/fournisseur/create', {
        achat_id: parseInt(form.achat_id),
        montant: parseFloat(form.montant),
        description: form.description || `Paiement fournisseur #${form.achat_id}`,
      });

      if (response.data.success) {
        setSuccess('Redirection vers la page de paiement...');
        window.location.href = response.data.paymentUrl;
      } else {
        setError(response.data.message || 'Erreur lors de la creation du paiement');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Paiement Fournisseur</h1>
        <p style={styles.subtitle}>Payez vos factures fournisseurs en toute securite</p>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <Card title="Informations de paiement" variant="primary">
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <Input
              label="Numero d'achat"
              name="achat_id"
              type="number"
              placeholder="Ex: 1"
              value={form.achat_id}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <Input
              label="Montant (DT)"
              name="montant"
              type="number"
              step="0.01"
              placeholder="Ex: 500.00"
              value={form.montant}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <div style={styles.fullWidth}>
              <Input
                label="Description"
                name="description"
                placeholder="Description du paiement (optionnel)"
                value={form.description}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              Paiement securise via Stripe. Vous serez redirige vers la page de paiement.
            </p>
          </div>

          <div style={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Retour
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {loading ? 'Creation...' : 'Payer maintenant'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  errorText: {
    color: '#991B1B',
    fontSize: '13px',
    fontWeight: 500,
  },
  successContainer: {
    backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  successText: {
    color: '#065F46',
    fontSize: '13px',
    fontWeight: 500,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  infoBox: {
    backgroundColor: '#F0F9FF',
    border: '1px solid #BAE6FD',
    borderRadius: '8px',
    padding: '12px 16px',
    margin: '16px 0',
  },
  infoText: {
    fontSize: '13px',
    color: '#0369A1',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '16px',
  },
};