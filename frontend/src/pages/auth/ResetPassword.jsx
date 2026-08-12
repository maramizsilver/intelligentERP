import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ResetPassword() {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const token = searchParams.get('token');

    const [validating, setValidating] = useState(true);
    const [valid, setValid] = useState(false);
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setValid(false);
            setError(t('token_manquant'));
            setValidating(false);
            return;
        }

        const validate = async () => {
            try {
                const res = await API.get('/reset/validate', { params: { token } });

                if (res.data.valid) {
                    setValid(true);
                } else {
                    setError(res.data.message || t('token_invalide'));
                }
            } catch (err) {
                setError(t('erreur_validation_token'));
            } finally {
                setValidating(false);
            }
        };

        validate();
    }, [token, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError(t('mot_de_passe_min_8'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('mots_de_passe_correspondent_pas'));
            return;
        }

        setLoading(true);
        try {
            await API.post('/reset/reset', { token, password });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || t('erreur_reinitialisation_mot_passe'));
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div style={styles.container}>
                <LoadingSpinner size="lg" text={t('verification_token')} />
            </div>
        );
    }

    if (!valid) {
        return (
            <div style={styles.container}>
                <Card title={t('lien_invalide')} variant="danger">
                    <p style={styles.errorText}>{error || t('lien_reinitialisation_invalide')}</p>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        {t('retour_connexion')}
                    </Button>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div style={styles.container}>
                <Card title={t('mot_de_passe_reinitialise')} variant="success">
                    <p style={styles.text}>{t('mot_de_passe_reinitialise_succes')}</p>
                    <p style={styles.subText}>{t('connecter_nouveau_mot_de_passe')}</p>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        {t('se_connecter')}
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <Card title={t('nouveau_mot_de_passe_titre')} variant="primary">
                <p style={styles.infoText}>{t('creer_nouveau_mot_de_passe')}</p>

                {error && (
                    <div style={styles.errorContainer}>
                        <span style={styles.errorText}>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Input
                        label={t('nouveau_mot_de_passe')}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('mot_de_passe_min_8')}
                        required
                        minLength={8}
                        disabled={loading}
                    />
                    <Input
                        label={t('confirmer_mot_de_passe')}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('confirmer_mot_de_passe')}
                        required
                        disabled={loading}
                    />
                    <div style={styles.actions}>
                        <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                            {t('annuler')}
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            {t('reinitialiser')}
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
        flexDirection: 'column',
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