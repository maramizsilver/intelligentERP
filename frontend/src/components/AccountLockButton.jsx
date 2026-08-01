import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function AccountLockButton() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLockAccount = async () => {
    if (!window.confirm('Voulez-vous verrouiller votre compte ? Toutes vos sessions seront deconnectees.')) {
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/account/lock', {
        reason: 'Verrouillage volontaire par l\'utilisateur'
      });
      alert('Compte verrouille avec succes.');
      logout();
      window.location.href = '/login?locked=true';
    } catch (err) {
      alert('Erreur lors du verrouillage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLockAccount}
      disabled={loading}
      style={{
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        opacity: loading ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {loading ? '...' : '🔒 Verrouiller'}
    </button>
  );
}