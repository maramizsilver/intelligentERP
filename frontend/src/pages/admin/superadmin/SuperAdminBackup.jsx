import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import API from '../../../utils/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';

export default function SuperAdminBackup() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [backups, setBackups] = useState([]);
    const [total, setTotal] = useState(0);
    const [backupLoading, setBackupLoading] = useState(false);
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.is_super_admin) {
            navigate('/dashboard');
            return;
        }
        loadBackups();
    }, []);

    const loadBackups = async () => {
        try {
            setLoading(true);
            const res = await API.get('/superadmin/backup/history');
            setBackups(res.data.backups || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Erreur chargement backups:', err);
            setError(t('erreur_chargement_backups') || 'Impossible de charger l\'historique des sauvegardes');
        } finally {
            setLoading(false);
        }
    };

    const triggerBackup = async () => {
        if (!window.confirm(t('confirmation_lancer_sauvegarde') || 'Lancer une sauvegarde manuelle de toutes les bases de données ?')) return;
        setBackupLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await API.post('/superadmin/backup');
            setMessage(`${res.data.total} ${t('bases_sauvegardees') || 'bases de données sauvegardées avec succès'}`);
            loadBackups();
        } catch (err) {
            setError(t('erreur_sauvegarde') || 'Erreur lors de la sauvegarde');
        } finally {
            setBackupLoading(false);
        }
    };

    const cleanupBackups = async () => {
        const days = prompt(`${t('nettoyage_confirmation') || 'Nombre de jours à conserver (défaut: 30)'} :`, '30');
        if (days === null) return;
        setCleanupLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await API.delete('/superadmin/backup/cleanup?days=' + (parseInt(days) || 30));
            setMessage(`${res.data.deleted} ${t('sauvegardes_supprimees') || 'sauvegardes supprimées'}`);
            loadBackups();
        } catch (err) {
            setError(t('erreur_nettoyage') || 'Erreur lors du nettoyage');
        } finally {
            setCleanupLoading(false);
        }
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(t('supprimer_sauvegarde_confirmation') || 'Supprimer ce backup ?')) return;
        setDeleteLoading(filename);
        setMessage('');
        setError('');
        try {
            const res = await API.delete('/superadmin/backup/' + filename);
            setMessage(res.data.message);
            loadBackups();
        } catch (err) {
            setError(t('erreur_suppression_sauvegarde') || 'Erreur lors de la suppression');
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleDownload = async (filename) => {
        try {
            const response = await API.get('/superadmin/backup/download/' + filename, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(t('erreur_telechargement_sauvegarde') || 'Erreur lors du téléchargement');
            console.error(err);
        }
    };

    const handleDownloadEncrypted = async (filename) => {
        try {
            const encryptedFilename = filename.replace('.sql', '.enc');
            const response = await API.get('/superadmin/backup/download/encrypted/' + encryptedFilename, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', encryptedFilename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(t('erreur_telechargement_sauvegarde') || 'Erreur lors du téléchargement');
            console.error(err);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 o';
        if (bytes < 1024) return bytes + ' o';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
        return (bytes / 1048576).toFixed(1) + ' Mo';
    };

    const columns = [
        {
            key: 'created_at',
            label: t('date'),
            render: (row) => new Date(row.created_at).toLocaleString('fr-FR')
        },
        { key: 'dbName', label: t('base_donnees') || 'Base de données' },
        {
            key: 'filename',
            label: t('fichier') || 'Fichier',
            render: (row) => (
                <span style={{ fontSize: '12px', color: '#64748B' }}>{row.filename}</span>
            )
        },
        {
            key: 'size',
            label: t('taille_fichier') || 'Taille',
            render: (row) => formatFileSize(row.size)
        },
        {
            key: 'encrypted',
            label: t('chiffre') || 'Chiffré',
            render: (row) => (
                <Badge variant={row.encrypted ? 'success' : 'danger'}>
                    {row.encrypted ? (t('oui') || 'Oui') : (t('non') || 'Non')}
                </Badge>
            )
        },
        {
            key: 'signed',
            label: t('signe') || 'Signé',
            render: (row) => (
                <Badge variant={row.signed ? 'success' : 'outline'}>
                    {row.signed ? (t('oui') || 'Oui') : (t('non') || 'Non')}
                </Badge>
            )
        }
    ];

    const actions = [
        {
            label: t('telecharger_sql') || 'Télécharger SQL',
            variant: 'primary',
            onClick: (row) => handleDownload(row.filename),
            disabled: (row) => row.size === 0
        },
        {
            label: t('telecharger_chiffre') || 'Télécharger chiffré',
            variant: 'secondary',
            onClick: (row) => handleDownloadEncrypted(row.filename),
            disabled: (row) => !row.encrypted
        },
        {
            label: t('supprimer_sauvegarde') || 'Supprimer',
            variant: 'danger',
            onClick: (row) => handleDelete(row.filename),
            loading: (row) => deleteLoading === row.filename
        }
    ];

    return (
        <div>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>{t('sauvegarde_donnees') || 'Sauvegarde des données'}</h1>
                    <p style={styles.subtitle}>{t('gerer_sauvegardes') || 'Gérez les sauvegardes automatiques de la plateforme'}</p>
                </div>
                <div style={styles.headerActions}>
                    <Button variant="secondary" onClick={() => navigate('/superadmin/dashboard')}>
                        {t('retour')}
                    </Button>
                </div>
            </div>

            {message && (
                <div style={styles.successContainer}>
                    <span style={styles.successText}>{message}</span>
                </div>
            )}
            {error && (
                <div style={styles.errorContainer}>
                    <span style={styles.errorText}>{error}</span>
                </div>
            )}

            <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
                    <span style={styles.statNumber}>{total}</span>
                    <span style={styles.statLabel}>{t('sauvegardes_disponibles') || 'Sauvegardes disponibles'}</span>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #0EA5E9' }}>
                    <span style={styles.statNumber}>{backups.filter(b => b.encrypted).length}</span>
                    <span style={styles.statLabel}>{t('sauvegardes_chiffrees') || 'Sauvegardes chiffrées'}</span>
                </div>
            </div>

            <div style={styles.actionRow}>
                <Button
                    variant="primary"
                    onClick={triggerBackup}
                    loading={backupLoading}
                >
                    {t('lancer_sauvegarde') || 'Lancer une sauvegarde'}
                </Button>
                <Button
                    variant="secondary"
                    onClick={cleanupBackups}
                    loading={cleanupLoading}
                >
                    {t('nettoyer_sauvegardes') || 'Nettoyer les anciennes sauvegardes'}
                </Button>
                <Button
                    variant="outline"
                    onClick={loadBackups}
                    loading={loading}
                >
                    {t('actualiser_liste') || 'Actualiser'}
                </Button>
            </div>

            <Card title={t('historique_sauvegardes') || 'Historique des sauvegardes'} variant="primary" style={{ marginTop: '20px' }}>
                {backups.length === 0 ? (
                    <EmptyState
                        title={t('aucune_sauvegarde') || 'Aucune sauvegarde'}
                        description={t('aucune_sauvegarde_description') || 'Aucune sauvegarde n\'a encore été effectuée.'}
                    />
                ) : (
                    <Table columns={columns} data={backups} loading={loading} actions={actions} />
                )}
            </Card>
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
    headerActions: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
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
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        padding: '18px 20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #E8EDF2',
        display: 'flex',
        flexDirection: 'column',
    },
    statNumber: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#0F172A',
    },
    statLabel: {
        color: '#64748B',
        fontSize: '13px',
        marginTop: '4px',
    },
    actionRow: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '20px',
    },
    successContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
    errorContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
};