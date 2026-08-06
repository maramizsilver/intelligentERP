// frontend/src/pages/profil/Profil.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ACTIONS = [
  { key: 'consultation', label: 'Voir' },
  { key: 'creation', label: 'Créer' },
  { key: 'modification', label: 'Modifier' },
  { key: 'suppression', label: 'Supprimer' },
  { key: 'validation', label: 'Valider' },
  { key: 'export', label: 'Exporter' }
];

export default function Profil() {
  const { user, permissions, hasPermission } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const [form, setForm] = useState({ nom: '', prenom: '', email: '' });
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    chargerProfil();
    chargerStatutMFA();
  }, []);

  const chargerProfil = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/me');
      setDetail(res.data.user);
      setForm({
        nom: res.data.user.nom || '',
        prenom: res.data.user.prenom || '',
        email: res.data.user.email || ''
      });
    } catch (err) {
      setError("Impossible de charger votre profil");
    } finally {
      setLoading(false);
    }
  };

  const chargerStatutMFA = async () => {
    try {
      const res = await API.get('/auth/mfa/status');
      setMfaEnabled(res.data.data?.enabled || false);
    } catch (err) {
      setMfaEnabled(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setFormLoading(true);

    try {
      const payload = { ...form };
      if (password) payload.password = password;

      await API.put('/auth/me', payload);
      setMessage('Profil mis à jour avec succès');
      setPassword('');
      chargerProfil();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(apiErrors ? apiErrors.join(', ') : (err.response?.data?.message || 'Erreur'));
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Chargement de votre profil..." />;

  const initiales = `${(detail?.prenom || '?')[0] || ''}${(detail?.nom || '?')[0] || ''}`.toUpperCase();

  // Regroupe les permissions du rôle de l'utilisateur pour affichage
  const modulesAvecAcces = permissions.filter((m) =>
    ACTIONS.some((a) => m[a.key])
  );

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mon espace</h1>
          <p style={styles.subtitle}>
            Vos informations, votre rôle et vos accès dans l'application
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
          {t('retour')}
        </Button>
      </div>

      {message && (
        <div style={styles.successContainer}>
          <span>✅</span>
          <span style={styles.successText}>{message}</span>
        </div>
      )}
      {error && (
        <div style={styles.errorContainer}>
          <span>❌</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {/* En-tête profil */}
      <Card variant="primary" style={{ marginBottom: '24px' }}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>{initiales}</div>
          <div style={styles.profileInfo}>
            <div style={styles.profileName}>
              {detail?.prenom} {detail?.nom}
            </div>
            <div style={styles.profileEmail}>{detail?.email}</div>
            <div style={styles.badgesRow}>
              <Badge variant="primary">
                {user?.is_super_admin
                  ? 'SuperAdmin'
                  : user?.is_external
                  ? 'Client externe'
                  : user?.role || 'Utilisateur'}
              </Badge>
              {detail?.entreprise_nom && (
                <Badge variant="secondary">{detail.entreprise_nom}</Badge>
              )}
              <Badge variant={mfaEnabled ? 'success' : 'warning'}>
                {mfaEnabled ? '🔐 MFA activée' : '🔓 MFA désactivée'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div style={styles.grid}>
        {/* Formulaire d'édition */}
        <Card title="Informations personnelles" variant="primary">
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <Input
                label="Nom"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                disabled={formLoading}
              />
            </div>
            <div style={styles.formGroup}>
              <Input
                label="Prénom"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                required
                disabled={formLoading}
              />
            </div>
            <div style={styles.formGroup}>
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={formLoading}
              />
            </div>
            <div style={styles.formGroup}>
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laisser vide si inchangé"
                disabled={formLoading}
              />
            </div>
            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              Enregistrer les modifications
            </Button>
          </form>
        </Card>

        {/* Sécurité */}
        <Card title="Sécurité du compte" variant="warning">
          <div style={styles.securityRow}>
            <div>
              <div style={styles.securityLabel}>Authentification à deux facteurs</div>
              <div style={styles.securityDesc}>
                {mfaEnabled
                  ? 'Votre compte est protégé par un code à usage unique.'
                  : 'Activez la MFA pour renforcer la sécurité de votre compte.'}
              </div>
            </div>
            <Button variant={mfaEnabled ? 'secondary' : 'primary'} onClick={() => navigate('/securite/mfa')}>
              {mfaEnabled ? 'Gérer' : 'Activer'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Permissions (lecture seule) — masqué pour SuperAdmin / externes */}
      {!user?.is_super_admin && !user?.is_external && (
        <Card title="Mes accès par module" variant="secondary" style={{ marginTop: '24px' }}>
          {modulesAvecAcces.length === 0 ? (
            <p style={styles.emptyText}>
              Aucun accès particulier ne vous a été attribué. Contactez votre administrateur.
            </p>
          ) : (
            <div style={styles.permGrid}>
              {modulesAvecAcces.map((m) => (
                <div key={m.module_nom} style={styles.moduleBlock}>
                  <div style={styles.moduleTitle}>{m.module_nom}</div>
                  <div style={styles.actionsRow}>
                    {ACTIONS.filter((a) => m[a.key]).map((a) => (
                      <span key={a.key} style={styles.actionPill}>
                        {a.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0' },
  errorContainer: {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
  },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  successContainer: {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: '#F0FDF4', border: '1px solid #86EFAC',
    borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
  },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  avatar: {
    width: '64px', height: '64px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', fontWeight: 700, flexShrink: 0,
  },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  profileName: { fontSize: '20px', fontWeight: 700, color: '#0F172A' },
  profileEmail: { fontSize: '14px', color: '#64748B' },
  badgesRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  formGroup: { marginBottom: '16px' },
  securityRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '16px', flexWrap: 'wrap',
  },
  securityLabel: { fontSize: '14px', fontWeight: 600, color: '#0F172A' },
  securityDesc: { fontSize: '13px', color: '#64748B', marginTop: '4px', maxWidth: '320px' },
  emptyText: { fontSize: '14px', color: '#94A3B8' },
  permGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  moduleBlock: {
    border: '1px solid #F1F5F9', borderRadius: '10px', padding: '12px 16px',
  },
  moduleTitle: { fontWeight: 600, color: '#0F172A', fontSize: '14px', marginBottom: '8px' },
  actionsRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  actionPill: {
    padding: '4px 10px', borderRadius: '20px', backgroundColor: '#DCFCE7',
    color: '#166534', fontSize: '12px', border: '1px solid #86EFAC',
  },
};