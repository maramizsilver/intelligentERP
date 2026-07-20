import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function SessionMonitor({ children }) {
    const { user, logout } = useAuth();

    const checkSession = async () => {
        if (!user) return;
        try {
            await API.get('/auth/me');
        } catch (err) {
            if (err.response?.status === 401) {
                console.log('[SESSION] Session invalidee, deconnexion...');
                logout();
                window.location.href = '/';
            }
        }
    };

    useEffect(() => {
        if (!user) return;

        // Verifier toutes les 5 secondes
        const interval = setInterval(checkSession, 5000);

        // Verifier quand l'utilisateur revient sur la page
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[SESSION] Page visible, verification...');
                checkSession();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, logout]);

    return children;
}