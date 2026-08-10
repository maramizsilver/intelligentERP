import React, { useState } from 'react';
import documentActionsApi from '../../services/documentActions.api';

// Styles pour les boutons
const buttonStyles = {
  primary: {
    background: '#3B82F6',
    color: 'white',
    hover: '#2563EB'
  },
  success: {
    background: '#10B981',
    color: 'white',
    hover: '#059669'
  },
  warning: {
    background: '#F59E0B',
    color: 'white',
    hover: '#D97706'
  },
  danger: {
    background: '#EF4444',
    color: 'white',
    hover: '#DC2626'
  },
  purple: {
    background: '#8B5CF6',
    color: 'white',
    hover: '#7C3AED'
  },
  pink: {
    background: '#EC4899',
    color: 'white',
    hover: '#DB2777'
  },
  indigo: {
    background: '#6366F1',
    color: 'white',
    hover: '#4F46E5'
  },
  gray: {
    background: '#6B7280',
    color: 'white',
    hover: '#4B5563'
  },
  outline: {
    background: 'transparent',
    color: '#374151',
    border: '1px solid #D1D5DB',
    hover: '#F3F4F6'
  },
  ghost: {
    background: 'transparent',
    color: '#6B7280',
    hover: '#F3F4F6'
  }
};

const Button = ({ children, onClick, disabled, loading, variant = 'primary', className = '' }) => {
  const style = buttonStyles[variant] || buttonStyles.primary;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: variant === 'outline' ? '1px solid #D1D5DB' : 'none',
        background: loading ? '#9CA3AF' : style.background,
        color: style.color,
        fontSize: '13px',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled || loading ? 0.6 : 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        ...(variant === 'ghost' && {
          background: 'transparent',
          color: '#6B7280',
          boxShadow: 'none'
        })
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          if (variant === 'outline') {
            e.currentTarget.style.background = '#F3F4F6';
          } else if (variant === 'ghost') {
            e.currentTarget.style.background = '#F3F4F6';
          } else {
            e.currentTarget.style.background = style.hover || style.background;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          if (variant === 'outline' || variant === 'ghost') {
            e.currentTarget.style.background = 'transparent';
          } else {
            e.currentTarget.style.background = style.background;
          }
        }
      }}
    >
      {loading ? (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
      ) : (
        children
      )}
    </button>
  );
};

export default function DocumentActionsToolbar({ type, id }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState('');
  const [showHistorique, setShowHistorique] = useState(false);
  const [historique, setHistorique] = useState([]);

  const telecharger = async (getBlob, extension) => {
    setLoadingAction(extension);
    setError('');
    try {
      const res = await getBlob(type, id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${id}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement');
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const imprimer = async () => {
    setLoadingAction('print');
    try {
      const res = await documentActionsApi.telechargerPDF(type, id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const w = window.open(url);
      w.onload = () => w.print();
    } catch (err) {
      setError("Erreur lors de l'impression");
    } finally {
      setLoadingAction(null);
    }
  };

  const envoyerEmail = async () => {
    const email = prompt('Adresse e-mail du destinataire :');
    if (!email) return;
    setLoadingAction('email');
    try {
      const result = await documentActionsApi.envoyerEmail(type, id, email);
      if (result.data.simulated) {
        alert(' Envoi simulé ! Vérifiez la console pour les logs.');
      } else {
        alert('✅ Document envoyé par e-mail avec succès');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally {
      setLoadingAction(null);
    }
  };

  const partagerWhatsapp = async () => {
    const telephone = prompt('Numéro WhatsApp (+216...) :');
    if (!telephone) return;
    setLoadingAction('whatsapp');
    try {
      const result = await documentActionsApi.partagerWhatsapp(type, id, telephone);
      if (result.data.simulated) {
        alert(' Envoi simulé ! Vérifiez la console pour les logs.');
      } else {
        alert('✅ Document partagé via WhatsApp');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du partage');
    } finally {
      setLoadingAction(null);
    }
  };

  const signer = async () => {
    setLoadingAction('sign');
    try {
      await documentActionsApi.signer(type, id);
      alert('✅ Document signé électroniquement');
    } catch (err) {
      setError('Erreur lors de la signature');
    } finally {
      setLoadingAction(null);
    }
  };

  const archiver = async () => {
    if (!window.confirm(' Archiver ce document ?')) return;
    setLoadingAction('archive');
    try {
      await documentActionsApi.archiver(type, id);
      alert('✅ Document archivé avec succès');
    } catch (err) {
      setError("Erreur lors de l'archivage");
    } finally {
      setLoadingAction(null);
    }
  };

  const voirHistorique = async () => {
    if (showHistorique) {
      setShowHistorique(false);
      return;
    }
    setLoadingAction('history');
    try {
      const res = await documentActionsApi.historique(type, id);
      setHistorique(res.data.historique || []);
      setShowHistorique(true);
    } catch (err) {
      setError("Erreur lors du chargement de l'historique");
    } finally {
      setLoadingAction(null);
    }
  };

  // Ajout des styles d'animation
  const styles = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <style>{styles}</style>

      {error && (
        <div style={{
          background: '#FEE2E2',
          color: '#DC2626',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          border: '1px solid #FCA5A5'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '8px',
        background: '#F8FAFC',
        borderRadius: '12px',
        border: '1px solid #E2E8F0'
      }}>
        {/* Imprimer */}
        <Button variant="primary" onClick={imprimer} loading={loadingAction === 'print'}>
          Imprimer
        </Button>

        {/* PDF */}
        <Button variant="danger" onClick={() => telecharger(documentActionsApi.telechargerPDF, 'pdf')} loading={loadingAction === 'pdf'}>
           PDF
        </Button>

        {/* Word */}
        <Button variant="primary" onClick={() => telecharger(documentActionsApi.telechargerWord, 'docx')} loading={loadingAction === 'docx'}>
           Word
        </Button>

        {/* Excel */}
        <Button variant="success" onClick={() => telecharger(documentActionsApi.telechargerExcel, 'xlsx')} loading={loadingAction === 'xlsx'}>
           Excel
        </Button>

        {/* Email */}
        <Button variant="indigo" onClick={envoyerEmail} loading={loadingAction === 'email'}>
           E-mail
        </Button>

        {/* WhatsApp */}
        <Button variant="success" onClick={partagerWhatsapp} loading={loadingAction === 'whatsapp'}>
           WhatsApp
        </Button>

        {/* Signer */}
        <Button variant="purple" onClick={signer} loading={loadingAction === 'sign'}>
           Signer
        </Button>

        {/* Archiver */}
        <Button variant="warning" onClick={archiver} loading={loadingAction === 'archive'}>
           Archiver
        </Button>

        {/* Historique */}
        <Button 
          variant={showHistorique ? 'pink' : 'gray'} 
          onClick={voirHistorique} 
          loading={loadingAction === 'history'}
        >
           Historique
        </Button>
      </div>

      {showHistorique && (
        <div style={{
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <strong style={{ fontSize: '15px', color: '#1E293B' }}>
               Historique du document
            </strong>
            <button
              onClick={() => setShowHistorique(false)}
              style={{
                border: 'none',
                background: '#F1F5F9',
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#64748B'
              }}
            >
              ✕ Fermer
            </button>
          </div>

          {historique.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '12px' }}>
              Aucune action enregistrée.
            </p>
          ) : (
            <ul style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {historique.map((h) => {
                const actionColors = {
                  'export_pdf': { bg: '#FEF2F2', color: '#DC2626', icon: '📄' },
                  'export_word': { bg: '#EFF6FF', color: '#2563EB', icon: '📝' },
                  'export_excel': { bg: '#F0FDF4', color: '#16A34A', icon: '📊' },
                  'envoi_email': { bg: '#EEF2FF', color: '#4F46E5', icon: '✉️' },
                  'partage_whatsapp': { bg: '#ECFDF5', color: '#059669', icon: '💬' },
                  'signature_electronique': { bg: '#F5F3FF', color: '#7C3AED', icon: '✍️' },
                  'archivage': { bg: '#FFFBEB', color: '#D97706', icon: '🗄️' },
                  'generation_etiquette': { bg: '#FDF4FF', color: '#DB2777', icon: '🏷️' }
                };
                const colors = actionColors[h.action] || { bg: '#F1F5F9', color: '#64748B', icon: '📌' };
                
                return (
                  <li key={h.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: colors.bg,
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{colors.icon}</span>
                    <span style={{ fontWeight: 500, color: colors.color, flex: 1 }}>
                      {h.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>
                      {h.prenom || ''} {h.nom || ''}
                    </span>
                    <span style={{ color: '#94A3B8', fontSize: '12px' }}>
                      {new Date(h.created_at).toLocaleString('fr-FR')}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}