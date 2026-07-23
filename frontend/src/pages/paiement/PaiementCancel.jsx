import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function PaiementCancel() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <Card title="Paiement annule" variant="warning">
        <div style={styles.content}>
          <h2 style={styles.title}>Paiement annule</h2>
          <p style={styles.text}>
            Vous avez annule le paiement. Vous pouvez reessayer quand vous voulez.
          </p>
          <div style={styles.actions}>
            <Button variant="primary" onClick={() => navigate('/paiement/client')}>
              Reessayer
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Retour
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
    fontSize: '20px',
    fontWeight: 700,
    color: '#92400E',
    marginBottom: '8px',
  },
  text: {
    fontSize: '14px',
    color: '#64748B',
    marginBottom: '20px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
};