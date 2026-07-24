import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';

export default function RequestReset() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await API.post('/reset/request', { email });
            setSent(true);
            setMessage('Un email de reinitialisation a ete envoye');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div style={styles.container}>
                <Card title="Email envoye" variant="success">
                    <p style={styles.text}>{message}</p>
                    <p style={styles.subText}>Verifiez votre boite mail et suivez les instructions.</p>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        Retour a la connexion
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <Card title="Reinitialiser mon mot de passe" variant="primary">
                <p style={styles.infoText}>
                    Saisissez votre email professionnel. Vous recevrez un lien pour creer un nouveau mot de passe.
                </p>

                {error && (
                    <div style={styles.errorContainer}>
                        <span style={styles.errorText}>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        disabled={loading}
                    />
                    <div style={styles.actions}>
                        <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                            Retour
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            Envoyer
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#F0F4F8',
        padding: '20px',
    },
    text: { fontSize: '16px', color: '#065F46', marginBottom: '8px' },
    subText: { fontSize: '14px', color: '#64748B', marginBottom: '20px' },
    infoText: { fontSize: '14px', color: '#64748B', marginBottom: '16px', lineHeight: '1.6' },
    errorContainer: {
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
    },
    errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
    actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' },
};