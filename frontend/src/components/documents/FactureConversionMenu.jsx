import React, { useState } from 'react';
import documentActionsApi from '../../services/documentActions.api';

const OPTIONS = [
  { value: 'devis', label: 'Devis' },
  { value: 'facture_proforma', label: 'Facture pro forma' },
  { value: 'facture_electronique', label: 'Facture électronique' },
  { value: 'facture_avoir', label: "Facture d'avoir" },
  { value: 'bon_livraison', label: 'Bon de livraison' },
  { value: 'bon_preparation', label: 'Bon de préparation' },
  { value: 'bon_sortie', label: 'Bon de sortie' },
  { value: 'recu', label: 'Reçu de paiement' }
];

export default function FactureConversionMenu({ factureId, onConverted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const convertir = async (type_cible) => {
    setLoading(true);
    setError('');
    try {
      const res = await documentActionsApi.convertirFacture(factureId, type_cible);
      alert(res.data.message);
      onConverted && onConverted(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la conversion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {OPTIONS.map((o) => (
          <button 
            key={o.value} 
            className="btn btn-sm btn-outline" 
            disabled={loading} 
            onClick={() => convertir(o.value)}
          >
            → {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}