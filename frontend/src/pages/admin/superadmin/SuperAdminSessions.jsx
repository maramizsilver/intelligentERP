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

export default function SuperAdminSessions() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('sessions');

    useEffect(() => {
        if (!user?.is_super_admin) {
            navigate('/dashboard');
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            
            const [sessionsRes, statsRes, alertsRes] = await Promise.all([
                API.get('/superadmin/sessions/active'),
                API.get('/superadmin/stats/security'),
                API.get('/superadmin/alerts', { params: { limit: 20 } })
            ]);
            
            setSessions(sessionsRes.data.sessions || []);
            setStats(statsRes.data || {});
            setAlerts(alertsRes.data.alerts || []);
        } catch (err) {
            setError(t('erreur_chargement_donnees'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (sessionId) => {
        if (!window.confirm(t('confirmation_deconnexion_session'))) return;
        try {
            await API.post(`/superadmin/sessions/${sessionId}/revoke`);
            setSuccess(t('session_deconnectee'));
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(t('erreur_deconnexion'));
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleBlockDevice = async (deviceId) => {
        const reason = prompt(t('raison_blocage') + ' :');
        if (reason === null) return;
        try {
            await API.post(`/superadmin/devices/${deviceId}/block`, { reason });
            setSuccess(t('appareil_bloque'));
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(t('erreur_blocage'));
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleResolveAlert = async (alertId) => {
        try {
            await API.post(`/superadmin/alerts/${alertId}/resolve`);
            setSuccess(t('alerte_resolue'));
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(t('erreur_resolution'));
            setTimeout(() => setError(''), 3000);
        }
    };

    const getSeverityBadge = (severity) => {
        const severities = {
            critical: { label: t('critique'), variant: 'danger' },
            high: { label: t('elevee'), variant: 'danger' },
            medium: { label: t('moyenne'), variant: 'warning' },
            low: { label: t('basse'), variant: 'primary' }
        };
        return severities[severity] || severities.low;
    };

    const sessionColumns = [
        { 
            key: 'id', 
            label: t('id'),
            render: (row) => `#${row.id}`
        },
        { 
            key: 'entreprise_nom', 
            label: t('entreprise'),
            render: (row) => (
                <span style={{ fontWeight: 500, color: '#0F172A' }}>{row.entreprise_nom}</span>
            )
        },
        { 
            key: 'nom', 
            label: t('utilisateur'),
            render: (row) => `${row.prenom} ${row.nom}`
        },
        { key: 'email', label: t('email') },
        { 
            key: 'device_type', 
            label: t('appareil'),
            render: (row) => (
                <Badge variant="secondary">
                    {row.device_type || t('inconnu')}
                </Badge>
            )
        },
        { key: 'os', label: t('systeme') },
        { key: 'browser', label: t('navigateur') },
        { 
            key: 'country', 
            label: t('localisation'),
            render: (row) => (
                <span>
                    {row.country || t('inconnu')}
                    {row.city && ` (${row.city})`}
                </span>
            )
        },
        { 
            key: 'last_activity', 
            label: t('derniere_activite'),
            render: (row) => new Date(row.last_activity).toLocaleString('fr-FR')
        },
        { 
            key: 'user_session_count', 
            label: t('sessions'),
            render: (row) => (
                <Badge variant={row.user_session_count > 1 ? 'warning' : 'success'}>
                    {row.user_session_count}
                </Badge>
            )
        }
    ];

    const alertColumns = [
        { 
            key: 'alert_type', 
            label: t('type_alerte'),
            render: (row) => {
                const types = {
                    new_country: t('nouveau_pays'),
                    multiple_sessions: t('multiples_sessions'),
                    new_device: t('nouvel_appareil')
                };
                return types[row.alert_type] || row.alert_type;
            }
        },
        { 
            key: 'severity', 
            label: t('severite'),
            render: (row) => {
                const severity = getSeverityBadge(row.severity);
                return <Badge variant={severity.variant}>{severity.label}</Badge>;
            }
        },
        { key: 'message', label: t('message') },
        { 
            key: 'entreprise_nom', 
            label: t('entreprise'),
            render: (row) => row.entreprise_nom || '—'
        },
        { 
            key: 'created_at', 
            label: t('date'),
            render: (row) => new Date(row.created_at).toLocaleString('fr-FR')
        },
        {
            key: 'is_resolved',
            label: t('resolue'),
            render: (row) => (
                <Badge variant={row.is_resolved ? 'success' : 'danger'}>
                    {row.is_resolved ? t('oui') : t('non')}
                </Badge>
            )
        }
    ];

    const sessionActions = [
        {
            label: t('deconnecter'),
            variant: 'danger',
            onClick: (row) => handleRevoke(row.id)
        }
    ];

    const alertActions = [
        {
            label: t('resoudre_alerte'),
            variant: 'success',
            onClick: (row) => handleResolveAlert(row.id),
            disabled: (row) => row.is_resolved
        }
    ];

    if (loading) {
        return <LoadingSpinner size="lg" text={t('chargement')} />;
    }

    return (
        <div>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>{t('supervision_sessions')}</h1>
                    <p style={styles.subtitle}>{t('consulter_gerer_sessions')}</p>
                </div>
                <div style={styles.headerActions}>
                    <Button variant="secondary" onClick={loadData}>
                        {t('actualiser')}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/superadmin/dashboard')}
                    >
                        {t('retour')}
                    </Button>
                </div>
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

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <span style={styles.statNumber}>{stats.active_sessions || 0}</span>
                    <span style={styles.statLabel}>{t('sessions_actives')}</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statNumber}>{stats.blocked_devices || 0}</span>
                    <span style={styles.statLabel}>{t('appareils_bloques')}</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statNumber}>{stats.total_alerts || 0}</span>
                    <span style={styles.statLabel}>{t('alertes_securite')}</span>
                </div>
            </div>

            <div style={styles.tabContainer}>
                <button
                    style={{ ...styles.tab, ...(activeTab === 'sessions' ? styles.tabActive : {}) }}
                    onClick={() => setActiveTab('sessions')}
                >
                    {t('sessions_actives')} ({sessions.length})
                </button>
                <button
                    style={{ ...styles.tab, ...(activeTab === 'alerts' ? styles.tabActive : {}) }}
                    onClick={() => setActiveTab('alerts')}
                >
                    {t('alertes_securite')} ({alerts.filter(a => !a.is_resolved).length})
                </button>
            </div>

            {activeTab === 'sessions' ? (
                <Card title={t('sessions_actives')} variant="primary">
                    {sessions.length === 0 ? (
                        <EmptyState
                            title={t('aucune_session_active')}
                            description={t('aucune_session_active_description')}
                        />
                    ) : (
                        <Table 
                            columns={sessionColumns} 
                            data={sessions} 
                            actions={sessionActions}
                        />
                    )}
                </Card>
            ) : (
                <Card title={t('alertes_securite')} variant="danger">
                    {alerts.length === 0 ? (
                        <EmptyState
                            title={t('aucune_alerte')}
                            description={t('aucune_alerte_description')}
                        />
                    ) : (
                        <Table 
                            columns={alertColumns} 
                            data={alerts} 
                            actions={alertActions}
                        />
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
    tabContainer: {
        display: 'flex',
        gap: '4px',
        backgroundColor: '#E2E8F0',
        borderRadius: '10px',
        padding: '4px',
        marginBottom: '20px',
        width: 'fit-content',
    },
    tab: {
        padding: '8px 20px',
        border: 'none',
        backgroundColor: 'transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        color: '#475569',
        transition: 'all 0.2s ease',
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
};