import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Devis() {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const [devis, setDevis] = useState([]);
    const [clients, setClients] = useState([]);
    const [produits, setProduits] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        client_id: '',
        date_validite: '',
        remise: 0,
        notes: '',
        lignes: [{ produit_id: '', quantite: 1, remise_ligne: 0 }]
    });
    const [error, setError] = useState('');

    const peutCreer = hasPermission('Ventes', 'creation');
    const peutValider = hasPermission('Ventes', 'validation');
    const peutSupprimer = hasPermission('Ventes', 'suppression');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [devisRes, clientsRes, produitsRes] = await Promise.all([
                API.get('/devis'),
                API.get('/clients'),
                API.get('/produits')
            ]);
            setDevis(devisRes.data.devis || []);
            setClients(clientsRes.data.clients || []);
            setProduits(produitsRes.data.produits || []);
        } catch (err) {
            setError('Impossible de charger les données');
        }
    };

    const handleLigneChange = (index, field, value) => {
        const newLignes = [...form.lignes];
        newLignes[index][field] = value;
        setForm({ ...form, lignes: newLignes });
    };

    const addLigne = () => {
        setForm({ ...form, lignes: [...form.lignes, { produit_id: '', quantite: 1, remise_ligne: 0 }] });
    };

    const removeLigne = (index) => {
        setForm({ ...form, lignes: form.lignes.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await API.post('/devis', form);
            setShowForm(false);
            setForm({
                client_id: '',
                date_validite: '',
                remise: 0,
                notes: '',
                lignes: [{ produit_id: '', quantite: 1, remise_ligne: 0 }]
            });
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur');
        }
    };

    const handleStatutChange = async (id, statut) => {
        try {
            await API.put(`/devis/${id}/statut`, { statut });
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur');
        }
    };

    const handleConvertToCommande = async (id) => {
        if (!window.confirm('Convertir ce devis en commande ?')) return;
        try {
            await API.post(`/devis/${id}/convertir-commande`);
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce devis ?')) return;
        try {
            await API.delete(`/devis/${id}`);
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur');
        }
    };

    const getStatutStyle = (statut) => {
        const styles = {
            brouillon: { bg: '#e2e8f0', color: '#475569' },
            envoye: { bg: '#dbeafe', color: '#1d2542' },
            accepte: { bg: '#d1fae5', color: '#065f46' },
            refuse: { bg: '#fee2e2', color: '#991b1b' },
            expire: { bg: '#fef3c7', color: '#92400e' }
        };
        return styles[statut] || styles.brouillon;
    };

    const getStatutLabel = (statut) => ({
        brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé', expire: 'Expiré'
    })[statut] || statut;

    return (
        <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ color: '#0f172a' }}> Gestion des Devis</h2>
                <div>
                    <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
                    {peutCreer && (
                        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
                            {showForm ? '✕ Fermer' : '+ Nouveau devis'}
                        </button>
                    )}
                </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {/* Formulaire de création */}
            {showForm && (
                <form onSubmit={handleSubmit} style={styles.formCard}>
                    <h3>Nouveau devis</h3>
                    <div style={styles.formGrid}>
                        <select
                            style={styles.input}
                            value={form.client_id}
                            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                            required
                        >
                            <option value="">-- Choisir un client --</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                        <input
                            style={styles.input}
                            type="date"
                            value={form.date_validite}
                            onChange={(e) => setForm({ ...form, date_validite: e.target.value })}
                            required
                        />
                        <input
                            style={styles.input}
                            type="number"
                            placeholder="Remise (%)"
                            value={form.remise}
                            onChange={(e) => setForm({ ...form, remise: e.target.value })}
                        />
                    </div>

                    <div style={styles.lignesContainer}>
                        <h4>Produits</h4>
                        {form.lignes.map((ligne, i) => (
                            <div key={i} style={styles.ligneRow}>
                                <select
                                    style={styles.inputSmall}
                                    value={ligne.produit_id}
                                    onChange={(e) => handleLigneChange(i, 'produit_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Produit --</option>
                                    {produits.map(p => (
                                        <option key={p.id} value={p.id}>{p.nom} ({p.prix} DT)</option>
                                    ))}
                                </select>
                                <input
                                    style={styles.inputSmall}
                                    type="number"
                                    min="1"
                                    placeholder="Qté"
                                    value={ligne.quantite}
                                    onChange={(e) => handleLigneChange(i, 'quantite', e.target.value)}
                                />
                                <input
                                    style={styles.inputSmall}
                                    type="number"
                                    min="0"
                                    placeholder="Remise %"
                                    value={ligne.remise_ligne}
                                    onChange={(e) => handleLigneChange(i, 'remise_ligne', e.target.value)}
                                />
                                {form.lignes.length > 1 && (
                                    <button type="button" style={styles.removeBtn} onClick={() => removeLigne(i)}>✕</button>
                                )}
                            </div>
                        ))}
                        <button type="button" style={styles.addLigneBtn} onClick={addLigne}>+ Ajouter un produit</button>
                    </div>

                    <textarea
                        style={styles.textarea}
                        placeholder="Notes"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />

                    <button type="submit" style={styles.submitBtn}>Créer le devis</button>
                </form>
            )}

            {/* Liste des devis */}
            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Validité</th>
                            <th>Total</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devis.map(d => {
                            const statutStyle = getStatutStyle(d.statut);
                            return (
                                <tr key={d.id}>
                                    <td>{d.numero_devis}</td>
                                    <td>{d.client_nom}</td>
                                    <td>{new Date(d.date_devis).toLocaleDateString('fr-FR')}</td>
                                    <td>{new Date(d.date_validite).toLocaleDateString('fr-FR')}</td>
                                    <td>{d.total_ttc} DT</td>
                                    <td>
                                        {peutValider ? (
                                            <select
                                                style={{ ...styles.statusSelect, backgroundColor: statutStyle.bg, color: statutStyle.color }}
                                                value={d.statut}
                                                onChange={(e) => handleStatutChange(d.id, e.target.value)}
                                            >
                                                <option value="brouillon">Brouillon</option>
                                                <option value="envoye">Envoyé</option>
                                                <option value="accepte">Accepté</option>
                                                <option value="refuse">Refusé</option>
                                                <option value="expire">Expiré</option>
                                            </select>
                                        ) : (
                                            <span style={{ ...styles.statusBadge, backgroundColor: statutStyle.bg, color: statutStyle.color }}>
                                                {getStatutLabel(d.statut)}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {d.statut === 'accepte' && (
                                            <button style={styles.convertBtn} onClick={() => handleConvertToCommande(d.id)}>
                                                ➜ Commande
                                            </button>
                                        )}
                                        {peutSupprimer && d.statut === 'brouillon' && (
                                            <button style={styles.deleteBtn} onClick={() => handleDelete(d.id)}>suppr</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    backBtn: { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '8px' },
    addBtn: { padding: '8px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
    formCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    inputSmall: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', minWidth: '100px' },
    lignesContainer: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' },
    ligneRow: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' },
    removeBtn: { padding: '6px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    addLigneBtn: { padding: '6px 14px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', minHeight: '60px', boxSizing: 'border-box', marginBottom: '16px' },
    submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
    tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    statusBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    statusSelect: { padding: '4px 8px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    convertBtn: { padding: '4px 12px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontSize: '12px' },
    deleteBtn: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
};