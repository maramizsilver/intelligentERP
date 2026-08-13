import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaCity, 
  FaGlobe, 
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaBuilding,
  FaHome,
  FaUserCircle
} from 'react-icons/fa';

export default function ClientProfil() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: 'Tunisie'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadProfil = async () => {
      try {
        const res = await API.get('/client/profil');
        const client = res.data.user;
        setForm({
          nom: client.nom || '',
          prenom: client.prenom || '',
          telephone: client.telephone || '',
          adresse: client.adresse || '',
          ville: client.ville || '',
          code_postal: client.code_postal || '',
          pays: client.pays || 'Tunisie'
        });
        if (updateUser) {
          updateUser(client);
        }
      } catch (err) {
        if (user) {
          setForm({
            nom: user.nom || '',
            prenom: user.prenom || '',
            telephone: user.telephone || '',
            adresse: user.adresse || '',
            ville: user.ville || '',
            code_postal: user.code_postal || '',
            pays: user.pays || 'Tunisie'
          });
        }
        console.error('Erreur chargement profil:', err.response?.data?.message || err.message);
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfil();
  }, []);

  useEffect(() => {
    if (user && !initialLoading) {
      setForm(prev => ({
        ...prev,
        nom: user.nom || prev.nom,
        prenom: user.prenom || prev.prenom,
        telephone: user.telephone || prev.telephone,
        adresse: user.adresse || prev.adresse,
        ville: user.ville || prev.ville,
        code_postal: user.code_postal || prev.code_postal,
        pays: user.pays || 'Tunisie'
      }));
    }
  }, [user, initialLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.put('/client/profil', form);
      if (updateUser && res.data.user) {
        updateUser(res.data.user);
      }
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setIsEditing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text:  (err.response?.data?.message || 'Erreur lors de la mise à jour') 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        nom: user.nom || '',
        prenom: user.prenom || '',
        telephone: user.telephone || '',
        adresse: user.adresse || '',
        ville: user.ville || '',
        code_postal: user.code_postal || '',
        pays: user.pays || 'Tunisie'
      });
    }
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  if (initialLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>
          <FaSpinner style={styles.spinnerIcon} />
          <p style={styles.loadingText}>Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header avec carte de profil */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.avatarContainer}>
            <FaUserCircle style={styles.avatarIcon} />
            <div style={styles.statusBadge}>
              <span style={styles.statusDot}></span>
              Actif
            </div>
          </div>
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>
              {form.prenom} {form.nom}
            </h1>
            <p style={styles.subtitle}>Client externe • Espace personnel</p>
            <div style={styles.headerStats}>
              <span style={styles.statItem}>
                <FaBuilding style={styles.statIcon} />
                Client depuis {new Date().getFullYear()}
              </span>
              <span style={styles.statItem}>
                <FaHome style={styles.statIcon} />
                {form.ville || 'Non renseigné'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message de notification */}
      {message.text && (
        <div style={{
          ...styles.messageContainer,
          borderLeft: `4px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`
        }}>
          <div style={styles.messageIcon}>
            {message.type === 'success' ? (
              <FaCheckCircle style={{ color: '#10B981', fontSize: '20px' }} />
            ) : (
              <FaExclamationCircle style={{ color: '#EF4444', fontSize: '20px' }} />
            )}
          </div>
          <p style={styles.messageText}>{message.text}</p>
        </div>
      )}

      {/* Carte du formulaire */}
      <div style={styles.cardWrapper}>
        <div style={styles.cardHeader}>
          <div style={styles.cardHeaderLeft}>
            <FaUser style={styles.cardHeaderIcon} />
            <h2 style={styles.cardTitle}>Informations personnelles</h2>
          </div>
          {!isEditing && !loading && (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
              style={styles.editButton}
            >
              Modifier
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            {/* Nom */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Nom <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <FaUser style={styles.inputIcon} />
                <input 
                  style={isEditing ? styles.input : styles.inputDisabled} 
                  value={form.nom} 
                  onChange={(e) => setForm({...form, nom: e.target.value})} 
                  required 
                  disabled={!isEditing || loading}
                  placeholder="Votre nom"
                />
              </div>
            </div>

            {/* Prénom */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Prénom <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <FaUser style={styles.inputIcon} />
                <input 
                  style={isEditing ? styles.input : styles.inputDisabled} 
                  value={form.prenom} 
                  onChange={(e) => setForm({...form, prenom: e.target.value})} 
                  required 
                  disabled={!isEditing || loading}
                  placeholder="Votre prénom"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Téléphone
              </label>
              <div style={styles.inputWrapper}>
                <FaPhone style={styles.inputIcon} />
                <input 
                  style={isEditing ? styles.input : styles.inputDisabled} 
                  value={form.telephone} 
                  onChange={(e) => setForm({...form, telephone: e.target.value})} 
                  placeholder="+216 XX XXX XXX" 
                  disabled={!isEditing || loading}
                />
              </div>
            </div>

            {/* Email (lecture seule) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Email
              </label>
              <div style={styles.inputWrapper}>
                <FaEnvelope style={styles.inputIcon} />
                <input 
                  style={styles.inputDisabled} 
                  value={user?.email || ''} 
                  disabled
                  placeholder="Email non disponible"
                />
              </div>
            </div>

            {/* Adresse */}
            <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
              <label style={styles.label}>
                Adresse
              </label>
              <div style={styles.inputWrapper}>
                <FaMapMarkerAlt style={styles.inputIcon} />
                <input 
                  style={isEditing ? styles.input : styles.inputDisabled} 
                  value={form.adresse} 
                  onChange={(e) => setForm({...form, adresse: e.target.value})} 
                  placeholder="Votre adresse" 
                  disabled={!isEditing || loading}
                />
              </div>
            </div>

            {/* Ville */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Ville
              </label>
              <div style={styles.inputWrapper}>
                <FaCity style={styles.inputIcon} />
                <input 
                  style={isEditing ? styles.input : styles.inputDisabled} 
                  value={form.ville} 
                  onChange={(e) => setForm({...form, ville: e.target.value})} 
                  placeholder="Votre ville" 
                  disabled={!isEditing || loading}
                />
              </div>
            </div>

            {/* Code postal */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Code postal
              </label>
              <div style={styles.inputWrapper}>
                <FaMapMarkerAlt style={styles.inputIcon} />
                <input 
                  style={isEditing ? styles.input : styles.inputDisabled} 
                  value={form.code_postal} 
                  onChange={(e) => setForm({...form, code_postal: e.target.value})} 
                  placeholder="Code postal" 
                  disabled={!isEditing || loading}
                />
              </div>
            </div>

            {/* Pays */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Pays
              </label>
              <div style={styles.inputWrapper}>
                <FaGlobe style={styles.inputIcon} />
                <input 
                  style={styles.inputDisabled} 
                  value={form.pays} 
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          {isEditing && (
            <div style={styles.actions}>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleCancel}
                disabled={loading}
                style={styles.cancelButton}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                loading={loading}
                style={styles.saveButton}
              >
                <FaSave style={{ marginRight: '8px' }} />
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          )}

          {!isEditing && !loading && (
            <div style={styles.readOnlyMessage}>
              <FaExclamationCircle style={{ color: '#94A3B8', fontSize: '14px', marginRight: '8px' }} />
              <span style={styles.readOnlyText}>
                Cliquez sur "Modifier" pour mettre à jour vos informations
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
  },
  loadingSpinner: {
    textAlign: 'center',
  },
  spinnerIcon: {
    fontSize: '48px',
    color: '#4F46E5',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#64748B',
    fontSize: '16px',
  },

  // Header
  header: {
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '32px',
    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarIcon: {
    fontSize: '80px',
    color: 'white',
    opacity: 0.9,
  },
  statusBadge: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    backgroundColor: '#10B981',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'white',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse 2s infinite',
  },
  headerInfo: {
    color: 'white',
    flex: 1,
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.8,
    margin: 0,
    marginBottom: '12px',
  },
  headerStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    opacity: 0.9,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  statIcon: {
    fontSize: '14px',
  },

  // Message
  messageContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'white',
    padding: '14px 20px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  messageIcon: {
    flexShrink: 0,
  },
  messageText: {
    margin: 0,
    color: '#1E293B',
    fontSize: '14px',
    fontWeight: 500,
  },

  // Card
  cardWrapper: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#FAFBFC',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardHeaderIcon: {
    fontSize: '20px',
    color: '#4F46E5',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#0F172A',
    margin: 0,
  },
  editButton: {
    border: '2px solid #E2E8F0',
    backgroundColor: 'transparent',
    color: '#475569',
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Form
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    padding: '32px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  required: {
    color: '#EF4444',
    fontWeight: 700,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94A3B8',
    fontSize: '16px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    color: '#0F172A',
    backgroundColor: 'white',
  },
  inputDisabled: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    borderRadius: '8px',
    border: '2px solid #F1F5F9',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#475569',
    backgroundColor: '#F8FAFC',
    cursor: 'not-allowed',
  },

  // Actions
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 32px 32px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#FAFBFC',
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: '#475569',
    border: '2px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  saveButton: {
    padding: '10px 24px',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },

  // Read only message
  readOnlyMessage: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 32px 32px',
    color: '#94A3B8',
    fontSize: '13px',
  },
  readOnlyText: {
    color: '#94A3B8',
  },
};

// Ajout des animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(styleSheet);