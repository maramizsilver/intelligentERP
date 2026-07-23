import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PaiementFournisseurSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [paiement, setPaiement] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifier = async () => {
      if (!sessionId) {
        setError('Session de paiement non trouvee');
        setLoading(false);
        return;
      }

      try {
        const response = await API.get(`/paiement/verify/${sessionId}`);
        setPaiement(response.data);

        if (response.data.status === 'paid') {
          await API.post('/paiement/fournisseur/confirmer', { sessionId });
        }
      } catch (err) {
        setError('Erreur lors de la verification du paiement');
      } finally {
        setLoading(false);
      }
    };

    verifier();
  }, [sessionId]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Verification du paiement..." />;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Card title="Erreur" variant="danger">
          <p style={styles.errorText}>{error}</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Card title="Paiement fournisseur reussi" variant="success">
        <div style={styles.content}>
          <h2 style={styles.title}>Paiement fournisseur effectue !</h2>
          <p style={styles.text}>La facture fournisseur a ete payee avec succes.</p>

          {paiement && (
            <div style={styles.details}>
              <p><strong>Montant :</strong> {paiement.montant} {paiement.currency}</p>
              <p><strong>Statut :</strong> {paiement.status}</p>
            </div>
          )}

          <div style={styles.actions}>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Retour au tableau de bord
            </Button>
            <Button variant="secondary" onClick={() => navigate('/achats')}>
              Voir les achats
            </Button>
          </div>
        </div>
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
  content: {
    textAlign: 'center',
    padding: '20px 0',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#065F46',
    marginBottom: '8px',
  },
  text: {
    fontSize: '14px',
    color: '#64748B',
    marginBottom: '20px',
  },
  details: {
    backgroundColor: '#F8FAFC',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  errorText: {
    color: '#991B1B',
    fontSize: '14px',
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
};