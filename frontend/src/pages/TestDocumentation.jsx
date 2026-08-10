import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DocumentActionsToolbar from '../components/documents/DocumentActionsToolbar';
import FactureConversionMenu from '../components/documents/FactureConversionMenu';

export default function TestDocumentation() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour création de document
  const [newDoc, setNewDoc] = useState({
    type_document: 'bon_livraison',
    tiers_nom: '',
    montant_ht: 0,
    montant_ttc: 0,
    donnees: { lignes: [] }
  });
  
  const [newLigne, setNewLigne] = useState({
    designation: '',
    quantite: 1,
    prix_unitaire: 0,
    total: 0
  });

  // États pour les factures
  const [factures, setFactures] = useState([]);
  const [selectedFacture, setSelectedFacture] = useState(null);

  // Récupérer les documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/documents-metier', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data.documents || []);
    } catch (err) {
      setError('Erreur chargement documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les factures
  const fetchFactures = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/factures', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFactures(res.data.factures || []);
    } catch (err) {
      console.error('Erreur chargement factures:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchFactures();
  }, []);

  // Créer un document
  const createDocument = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/documents-metier', newDoc, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Document créé avec succès ! Numéro: ${res.data.numero}`);
      fetchDocuments();
      // Réinitialiser le formulaire
      setNewDoc({
        type_document: 'bon_livraison',
        tiers_nom: '',
        montant_ht: 0,
        montant_ttc: 0,
        donnees: { lignes: [] }
      });
      setNewLigne({ designation: '', quantite: 1, prix_unitaire: 0, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur création');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une ligne
  const addLigne = () => {
    const lignes = newDoc.donnees.lignes || [];
    const total = newLigne.quantite * newLigne.prix_unitaire;
    setNewDoc({
      ...newDoc,
      donnees: {
        ...newDoc.donnees,
        lignes: [...lignes, { ...newLigne, total }]
      }
    });
    setNewLigne({ designation: '', quantite: 1, prix_unitaire: 0, total: 0 });
  };

  // Supprimer une ligne
  const removeLigne = (index) => {
    const lignes = newDoc.donnees.lignes || [];
    lignes.splice(index, 1);
    setNewDoc({
      ...newDoc,
      donnees: { ...newDoc.donnees, lignes }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Test Gestion Documentaire
      </h1>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          ✅ {success}
        </div>
      )}

      {/* SECTION 1: Création de document */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
           Créer un document métier
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Type de document</label>
            <select
              value={newDoc.type_document}
              onChange={(e) => setNewDoc({ ...newDoc, type_document: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            >
              <option value="bon_livraison">Bon de livraison</option>
              <option value="bon_preparation">Bon de préparation</option>
              <option value="bon_reception">Bon de réception</option>
              <option value="bon_entree">Bon d'entrée</option>
              <option value="bon_sortie">Bon de sortie</option>
              <option value="bon_transfert">Bon de transfert</option>
              <option value="demande_achat">Demande d'achat</option>
              <option value="recu">Reçu de paiement</option>
              <option value="facture_proforma">Facture pro forma</option>
              <option value="facture_avoir">Facture d'avoir</option>
              <option value="facture_electronique">Facture électronique</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Tiers (Client/Fournisseur)</label>
            <input
              type="text"
              value={newDoc.tiers_nom}
              onChange={(e) => setNewDoc({ ...newDoc, tiers_nom: e.target.value })}
              placeholder="Nom du client ou fournisseur"
              style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Montant HT</label>
            <input
              type="number"
              value={newDoc.montant_ht}
              onChange={(e) => setNewDoc({ ...newDoc, montant_ht: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Montant TTC</label>
            <input
              type="number"
              value={newDoc.montant_ttc}
              onChange={(e) => setNewDoc({ ...newDoc, montant_ttc: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Ajout de lignes */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Lignes du document</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px auto', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Désignation"
              value={newLigne.designation}
              onChange={(e) => setNewLigne({ ...newLigne, designation: e.target.value })}
              style={{ padding: '6px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            />
            <input
              type="number"
              placeholder="Qté"
              value={newLigne.quantite}
              onChange={(e) => setNewLigne({ ...newLigne, quantite: parseInt(e.target.value) })}
              style={{ padding: '6px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            />
            <input
              type="number"
              placeholder="P.U."
              value={newLigne.prix_unitaire}
              onChange={(e) => setNewLigne({ ...newLigne, prix_unitaire: parseFloat(e.target.value) })}
              style={{ padding: '6px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            />
            <span style={{ padding: '6px', background: '#F3F4F6', borderRadius: '4px', textAlign: 'center' }}>
              Total: {(newLigne.quantite * newLigne.prix_unitaire).toFixed(2)}
            </span>
            <button
              onClick={addLigne}
              style={{ padding: '6px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              +
            </button>
          </div>

          {/* Liste des lignes */}
          {(newDoc.donnees.lignes || []).length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {newDoc.donnees.lignes.map((ligne, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px auto', gap: '8px', padding: '4px 0', borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}>
                  <span>{ligne.designation}</span>
                  <span>{ligne.quantite}</span>
                  <span>{ligne.prix_unitaire}</span>
                  <span>{ligne.total}</span>
                  <button
                    onClick={() => removeLigne(index)}
                    style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={createDocument}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Création...' : ' Créer le document'}
        </button>
      </div>

      {/* SECTION 2: Liste des documents avec Toolbar */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
           Liste des documents métier
        </h2>

        {loading ? (
          <p>Chargement...</p>
        ) : documents.length === 0 ? (
          <p style={{ color: '#6B7280' }}>Aucun document créé</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Type</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Numéro</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Tiers</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Total TTC</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Statut</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '8px' }}>{doc.id}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ background: '#E0F2FE', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                        {doc.type_document}
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontWeight: '500' }}>{doc.numero}</td>
                    <td style={{ padding: '8px' }}>{doc.tiers_nom || '-'}</td>
                    <td style={{ padding: '8px' }}>{doc.montant_ttc} DT</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ 
                        background: doc.statut === 'brouillon' ? '#FEF3C7' : '#D1FAE5',
                        color: doc.statut === 'brouillon' ? '#92400E' : '#065F46',
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px' 
                      }}>
                        {doc.statut}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
                        style={{ padding: '4px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        {selectedDoc === doc.id ? 'Masquer' : 'Actions'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Affichage de la Toolbar pour le document sélectionné */}
        {selectedDoc && (
          <div style={{ marginTop: '16px', padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#F8FAFC' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
               Actions - Document #{selectedDoc}
            </h3>
            <DocumentActionsToolbar type="documents_metier" id={selectedDoc} />
          </div>
        )}
      </div>

      {/* SECTION 3: Conversion de facture */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
           Conversion de facture
        </h2>

        {factures.length === 0 ? (
          <p style={{ color: '#6B7280' }}>Aucune facture trouvée. Créez d'abord une facture.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {factures.map((facture) => (
              <div key={facture.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Facture #{facture.numero_facture}</strong>
                    <span style={{ marginLeft: '12px', color: '#6B7280' }}>
                      Client: {facture.client_nom || facture.client_id}
                    </span>
                    <span style={{ marginLeft: '12px', color: '#6B7280' }}>
                      Total: {facture.total_ttc} DT
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedFacture(selectedFacture === facture.id ? null : facture.id)}
                    style={{ padding: '6px 12px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {selectedFacture === facture.id ? 'Masquer' : '🔄 Convertir'}
                  </button>
                </div>

                {selectedFacture === facture.id && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    <FactureConversionMenu 
                      factureId={facture.id}
                      onConverted={(data) => {
                        setSuccess(`Facture convertie en ${data.type_cible} avec succès !`);
                        fetchDocuments();
                        setSelectedFacture(null);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}