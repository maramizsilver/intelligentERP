// frontend/src/pages/auth/ResetPassword.jsx
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

    console.log('[ResetPassword] Token reçu:', token);
    console.log('[ResetPassword] searchParams:', searchParams.toString());

    useEffect(() => {
        if (!token) {
            console.log('[ResetPassword] Token manquant');
            setValid(false);
            setError(t('token_manquant') || 'Token manquant');
            setValidating(false);
            return;
        }

        const validate = async () => {
            try {
                console.log('[ResetPassword] Envoi requête de validation...');
                const res = await API.get('/reset/validate', { params: { token } });
                console.log('[ResetPassword] Réponse reçue:', res.data);

                if (res.data.valid) {
                    console.log('[ResetPassword] Token valide !');
                    setValid(true);
                } else {
                    console.log('[ResetPassword] Token invalide:', res.data.message);
                    setError(res.data.message || t('token_invalide') || 'Token invalide');
                }
            } catch (err) {
                console.error('[ResetPassword] Erreur:', err);
                setError(t('erreur_validation_token') || 'Erreur lors de la validation');
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
            setError(t('mot_de_passe_min_8') || 'Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (password !== confirmPassword) {
            setError(t('mots_de_passe_correspondent_pas') || 'Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            await API.post('/reset/reset', { token, password });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || t('erreur_reinitialisation_mot_passe') || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div style={styles.container}>
                <LoadingSpinner size="lg" text={t('verification_token') || 'Vérification du token...'} />
                <p style={{ marginTop: '20px', fontSize: '12px', color: '#64748B' }}>
                    Token: {token ? token.substring(0, 20) + '...' : t('aucun_token') || 'Aucun token'}
                </p>
            </div>
        );
    }

    if (!valid) {
        return (
            <div style={styles.container}>
                <Card title={t('lien_invalide') || 'Lien invalide'} variant="danger">
                    <p style={styles.errorText}>{error || t('lien_reinitialisation_invalide') || 'Ce lien de réinitialisation est invalide ou a expiré.'}</p>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
                        Token: {token ? token.substring(0, 20) + '...' : t('aucun_token') || 'Aucun token'}
                    </p>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        {t('retour_connexion') || 'Retour à la connexion'}
                    </Button>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div style={styles.container}>
                <Card title={t('mot_de_passe_reinitialise') || 'Mot de passe réinitialisé'} variant="success">
                    <p style={styles.text}>{t('mot_de_passe_reinitialise_succes') || 'Votre mot de passe a été réinitialisé avec succès.'}</p>
                    <p style={styles.subText}>{t('connecter_nouveau_mot_de_passe') || 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'}</p>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        {t('se_connecter') || 'Se connecter'}
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <Card title={t('nouveau_mot_de_passe_titre') || 'Nouveau mot de passe'} variant="primary">
                <p style={styles.infoText}>{t('creer_nouveau_mot_de_passe') || 'Créez un nouveau mot de passe pour votre compte.'}</p>

                {error && (
                    <div style={styles.errorContainer}>
                        <span style={styles.errorText}>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Input
                        label={t('nouveau_mot_de_passe') || 'Nouveau mot de passe'}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('mot_de_passe_min_8') || 'Minimum 8 caractères'}
                        required
                        minLength={8}
                        disabled={loading}
                    />
                    <Input
                        label={t('confirmer_mot_de_passe') || 'Confirmer le mot de passe'}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('confirmer_mot_de_passe') || 'Confirmer le mot de passe'}
                        required
                        disabled={loading}
                    />
                    <div style={styles.actions}>
                        <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                            {t('annuler')}
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            {t('reinitialiser') || 'Réinitialiser'}
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