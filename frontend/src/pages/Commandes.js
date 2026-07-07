import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Commandes() {
  const { hasPermission } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clientId, setClientId] = useState('');
  const [lignes, setLignes] = useState([{ produit_id: '', quantite: 1 }]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const peutCreer = hasPermission('Ventes', 'creation');
  const peutValider = hasPermission('Ventes', 'validation');
  const peutSupprimer = hasPermission('Ventes', 'suppression');

  const load = async () => {
    try {
      const [resCmd, resCli, resProd] = await Promise.all([
        API.get('/commandes'),
        API.get('/clients'),
        API.get('/produits')
      ]);
      setCommandes(resCmd.data.commandes);
      setClients(resCli.data.clients);
      setProduits(resProd.data.produits);
    } catch (err) {
      setError('Impossible de charger les données');
    }
  };

  useEffect(() => { load(); }, []);

  const handleLigneChange = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index][field] = value;
    setLignes(newLignes);
  };

  const addLigne = () => setLignes([...lignes, { produit_id: '', quantite: 1 }]);
  const removeLigne = (index) => setLignes(lignes.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!clientId) return setError('Veuillez choisir un client');

    try {
      await API.post('/commandes', {
        client_id: clientId,
        lignes: lignes.filter(l => l.produit_id && l.quantite > 0)
      });
      setClientId('');
      setLignes([{ produit_id: '', quantite: 1 }]);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleStatutChange = async (id, statut) => {
    try {
      await API.put(`/commandes/${id}/statut`, { statut });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    try {
      await API.delete(`/commandes/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate('/dashboard')}>&larr; Retour</button>
      <h2>🛒 Gestion des Commandes</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {peutCreer && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">-- Choisir un client --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>

          {lignes.map((ligne, i) => (
            <div key={i} style={{ margin: '8px 0' }}>
              <select value={ligne.produit_id} onChange={(e) => handleLigneChange(i, 'produit_id', e.target.value)} required>
                <option value="">-- Produit --</option>
                {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.prix} DT)</option>)}
              </select>
              <input
                type="number" min="1" value={ligne.quantite}
                onChange={(e) => handleLigneChange(i, 'quantite', e.target.value)}
                style={{ width: 60, marginLeft: 8 }}
              />
              {lignes.length > 1 && (
                <button type="button" onClick={() => removeLigne(i)} style={{ marginLeft: 8 }}>✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addLigne}> + Ajouter un produit</button>
          <br /><br />
          <button type="submit">Créer la commande</button>
        </form>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', background: 'white' }}>
        <thead>
          <tr><th>Client</th><th>Date</th><th>Total</th><th>Statut</th>{(peutValider || peutSupprimer) && <th>Actions</th>}</tr>
        </thead>
        <tbody>
          {commandes.map(c => (
            <tr key={c.id}>
              <td>{c.client_nom}</td>
              <td>{new Date(c.date_commande).toLocaleDateString()}</td>
              <td>{c.total} DT</td>
              <td>
                {peutValider ? (
                  <select value={c.statut} onChange={(e) => handleStatutChange(c.id, e.target.value)}>
                    <option value="en_attente">En attente</option>
                    <option value="confirmee">Confirmée</option>
                    <option value="livree">Livrée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                ) : (
                  c.statut
                )}
              </td>
              {(peutValider || peutSupprimer) && (
                <td>{peutSupprimer && <button onClick={() => handleDelete(c.id)}>Supprimer</button>}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
