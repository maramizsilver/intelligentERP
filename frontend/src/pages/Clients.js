import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Clients() {
  const { hasPermission } = useAuth();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const peutCreer = hasPermission('Ventes', 'creation');
  const peutModifier = hasPermission('Ventes', 'modification');
  const peutSupprimer = hasPermission('Ventes', 'suppression');

  const loadClients = async () => {
    try {
      const res = await API.get('/clients');
      setClients(res.data.clients);
    } catch (err) {
      setError('Impossible de charger les clients');
    }
  };

  useEffect(() => { loadClients(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await API.put(`/clients/${editingId}`, form);
      } else {
        await API.post('/clients', form);
      }
      setForm({ nom: '', email: '', telephone: '', adresse: '' });
      setEditingId(null);
      loadClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (client) => {
    setForm({ nom: client.nom, email: client.email || '', telephone: client.telephone || '', adresse: client.adresse || '' });
    setEditingId(client.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    try {
      await API.delete(`/clients/${id}`);
      loadClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate('/dashboard')}>&larr; Retour</button>
      <h2>👥 Gestion des Clients</h2>
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
          {clients.map(c => (
            <tr key={c.id}>
              <td>{c.nom}</td><td>{c.email}</td><td>{c.telephone}</td><td>{c.adresse}</td>
              {(peutModifier || peutSupprimer) && (
                <td>
                  {peutModifier && <button onClick={() => handleEdit(c)}>Éditer</button>}
                  {peutSupprimer && <button onClick={() => handleDelete(c.id)}>Supprimer</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
