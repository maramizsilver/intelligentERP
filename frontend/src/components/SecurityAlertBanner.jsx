import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import Button from './common/Button';

export default function SecurityAlertBanner() {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!user?.is_super_admin) return;

        const loadAlerts = async () => {
            try {
                const res = await API.get('/superadmin/alerts', {
                    params: { is_read: false, limit: 5 }
                });
                const newAlerts = res.data.alerts || [];
                if (newAlerts.length > 0) {
                    setAlerts(newAlerts);
                    setShow(true);
                }
            } catch (err) {
                console.error('Erreur chargement alertes:', err);
            }
        };

        loadAlerts();
        const interval = setInterval(loadAlerts, 60000);

        return () => clearInterval(interval);
    }, [user]);

    if (!show || alerts.length === 0) return null;

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <span style={styles.icon}>⚠</span>
                <div style={styles.message}>
                    <strong>Alertes de securite ({alerts.length})</strong>
                    <span style={styles.detail}>
                        {alerts.slice(0, 2).map((a, i) => (
                            <span key={i}>
                                {a.alert_type}: {a.message}
                            </span>
                        ))}
                        {alerts.length > 2 && (
                            <span>+{alerts.length - 2} autres</span>
                        )}
                    </span>
                </div>
            </div>
            <Button 
                variant="primary" 
                size="sm" 
                onClick={() => window.location.href = '/superadmin/sessions'}
            >
                Voir les alertes
            </Button>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
    },
    content: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1,
    },
    icon: {
        fontSize: '20px',
        color: '#DC2626',
    },
    message: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        fontSize: '13px',
        color: '#991B1B',
    },
    detail: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        fontSize: '12px',
        color: '#7F1D1D',
    },
};