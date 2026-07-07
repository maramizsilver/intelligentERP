import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Fournisseurs() {
  const { hasPermission } = useAuth();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const peutCreer = hasPermission('Achats', 'creation');
  const peutModifier = hasPermission('Achats', 'modification');
  const peutSupprimer = hasPermission('Achats', 'suppression');

  const load = async () => {
    try {
      const res = await API.get('/fournisseurs');
      setFournisseurs(res.data.fournisseurs);
    } catch (err) {
      setError('Impossible de charger les fournisseurs');
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await API.put(`/fournisseurs/${editingId}`, form);
      } else {
        await API.post('/fournisseurs', form);
      }
      setForm({ nom: '', email: '', telephone: '', adresse: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (f) => {
    setForm({ nom: f.nom, email: f.email || '', telephone: f.telephone || '', adresse: f.adresse || '' });
    setEditingId(f.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce fournisseur ?')) return;
    try {
      await API.delete(`/fournisseurs/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate('/dashboard')}>&larr; Retour</button>
      <h2> Gestion des Fournisseurs</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {(peutCreer || editingId) && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} required />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="telephone" placeholder="Téléphone" value={form.telephone} onChange={handleChange} />
          <input name="adresse" placeholder="Adresse" value={form.adresse} onChange={handleChange} />
          <button type="submit">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
        </form>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', background: 'white' }}>
        <thead>
          <tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Adresse</th>{(peutModifier || peutSupprimer) && <th>Actions</th>}</tr>
        </thead>
        <tbody>
          {fournisseurs.map(f => (
            <tr key={f.id}>
              <td>{f.nom}</td><td>{f.email}</td><td>{f.telephone}</td><td>{f.adresse}</td>
              {(peutModifier || peutSupprimer) && (
                <td>
                  {peutModifier && <button onClick={() => handleEdit(f)}>Éditer</button>}
                  {peutSupprimer && <button onClick={() => handleDelete(f.id)}>Supprimer</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
