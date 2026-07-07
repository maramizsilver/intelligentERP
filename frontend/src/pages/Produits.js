import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Produits() {
  const { hasPermission } = useAuth();
  const [produits, setProduits] = useState([]);
  const [form, setForm] = useState({ nom: '', description: '', prix: '', quantite_stock: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const peutCreer = hasPermission('Stock', 'creation');
  const peutModifier = hasPermission('Stock', 'modification');
  const peutSupprimer = hasPermission('Stock', 'suppression');

  const load = async () => {
    try {
      const res = await API.get('/produits');
      setProduits(res.data.produits);
    } catch (err) {
      setError('Impossible de charger les produits');
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await API.put(`/produits/${editingId}`, form);
      } else {
        await API.post('/produits', form);
      }
      setForm({ nom: '', description: '', prix: '', quantite_stock: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (p) => {
    setForm({ nom: p.nom, description: p.description || '', prix: p.prix, quantite_stock: p.quantite_stock });
    setEditingId(p.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await API.delete(`/produits/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate('/dashboard')}>&larr; Retour</button>
      <h2>📦 Gestion des Produits</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {(peutCreer || editingId) && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} required />
          <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
          <input name="prix" type="number" step="0.01" min="0" placeholder="Prix" value={form.prix} onChange={handleChange} required />
          <input name="quantite_stock" type="number" min="0" placeholder="Stock" value={form.quantite_stock} onChange={handleChange} />
          <button type="submit">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
        </form>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', background: 'white' }}>
        <thead>
          <tr><th>Nom</th><th>Description</th><th>Prix</th><th>Stock</th>{(peutModifier || peutSupprimer) && <th>Actions</th>}</tr>
        </thead>
        <tbody>
          {produits.map(p => (
            <tr key={p.id}>
              <td>{p.nom}</td><td>{p.description}</td><td>{p.prix} DT</td><td>{p.quantite_stock}</td>
              {(peutModifier || peutSupprimer) && (
                <td>
                  {peutModifier && <button onClick={() => handleEdit(p)}>Éditer</button>}
                  {peutSupprimer && <button onClick={() => handleDelete(p.id)}>Supprimer</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
