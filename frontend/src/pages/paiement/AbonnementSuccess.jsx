import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function AbonnementSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate('/');
    }, 4000);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <Card title="Abonnement active" variant="success">
        <div style={styles.content}>
          <h2 style={styles.title}>Votre abonnement est active !</h2>
          <p style={styles.text}>
            Votre entreprise est maintenant active. Vous pouvez vous connecter.
          </p>
          <p style={styles.text}>
            Redirection vers la page de connexion...
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Se connecter
          </Button>
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
    marginBottom: '8px',
  },
};