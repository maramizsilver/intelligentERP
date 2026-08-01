// ---------------------------------------------------------------------------
// Numérisation intelligente : scanner/téléverser une image ou un PDF (CIN,
// carte grise, facture papier...), extraire le texte et les champs probables
// (CIN, matricule fiscal, téléphone, e-mail), puis proposer de créer/mettre
// à jour directement une fiche client ou fournisseur avec ces données.
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import documentIntelligenceApi from '../../services/documentIntelligence.api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { colors } from '../../styles/theme';

const CHAMPS_LABELS = {
    email: 'E-mail',
    telephone: 'Téléphone',
    numero_cin: 'Numéro CIN',
    matricule_fiscal: 'Matricule fiscal',
    date_detectee: 'Date détectée'
};

export default function NumerisationOCR() {
    const navigate = useNavigate();

    const [fichier, setFichier] = useState(null);
    const [apercu, setApercu] = useState(null);
    const [langue, setLangue] = useState('fr');
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState('');
    const [resultat, setResultat] = useState(null);

    const handleFichierChange = (e) => {
        const f = e.target.files[0];
        setFichier(f);
        setResultat(null);
        setErreur('');
        if (f && f.type.startsWith('image/')) {
            setApercu(URL.createObjectURL(f));
        } else {
            setApercu(null);
        }
    };

    const lancerNumerisation = async () => {
        if (!fichier) { setErreur('Veuillez sélectionner un fichier à numériser.'); return; }
        setChargement(true);
        setErreur('');
        try {
            const res = await documentIntelligenceApi.numeriser(fichier, langue);
            setResultat(res.data);
        } catch (err) {
            setErreur(err.response?.data?.message || "Erreur lors de l'analyse OCR");
        } finally {
            setChargement(false);
        }
    };

    // Redirige vers la création de fiche client en préremplissant via l'URL
    // (à adapter selon la manière dont Clients.jsx lit les paramètres de départ).
    const creerFicheAvecDonnees = (type) => {
        const params = new URLSearchParams();
        Object.entries(resultat.champsDetectes).forEach(([cle, valeur]) => params.set(cle, valeur));
        navigate(`/${type}?${params.toString()}&nouveau=1`);
    };

    return (
        <div>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Numérisation intelligente (OCR)</h1>
                    <p style={styles.subtitle}>Scannez une pièce d'identité ou un document papier pour en extraire automatiquement les données</p>
                </div>
                <Button variant="secondary" icon="←" onClick={() => navigate('/documents')}>Retour</Button>
            </div>

            {erreur && <div style={styles.alertError}>{erreur}</div>}

            <Card title="Document à numériser" variant="primary" style={{ marginBottom: 20 }}>
                <div style={styles.grid}>
                    <div>
                        <label style={styles.fileLabel}>
                            📎 Choisir une image ou un PDF
                            <input type="file" accept="image/*,application/pdf" onChange={handleFichierChange} style={{ display: 'none' }} />
                        </label>
                        {fichier && <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>{fichier.name}</p>}

                        <div style={{ marginTop: 16 }}>
                            <label style={styles.label}>Langue du document</label>
                            <select style={styles.select} value={langue} onChange={(e) => setLangue(e.target.value)}>
                                <option value="fr">Français</option>
                                <option value="en">Anglais</option>
                                <option value="ar">Arabe</option>
                            </select>
                        </div>

                        <Button variant="primary" onClick={lancerNumerisation} loading={chargement} style={{ marginTop: 16 }}>
                            🔍 Analyser le document
                        </Button>
                    </div>

                    {apercu && (
                        <div>
                            <img src={apercu} alt="Aperçu du document" style={{ maxWidth: '100%', borderRadius: 8, border: `1px solid ${colors.border}` }} />
                        </div>
                    )}
                </div>
            </Card>

            {chargement && <LoadingSpinner text="Analyse OCR en cours (cela peut prendre quelques secondes)..." />}

            {resultat && (
                <Card title="Résultat de la numérisation" variant="success">
                    <div style={{ marginBottom: 16 }}>
                        <span style={styles.confianceBadge}>
                            Confiance OCR : {Math.round(resultat.confiance)}%
                        </span>
                    </div>

                    <h4 style={styles.sousTitre}>Champs détectés</h4>
                    {Object.keys(resultat.champsDetectes).length === 0 ? (
                        <p style={{ fontSize: 13, color: colors.textMuted }}>Aucun champ structuré détecté automatiquement.</p>
                    ) : (
                        <div style={styles.grid2}>
                            {Object.entries(resultat.champsDetectes).map(([cle, valeur]) => (
                                <div key={cle} style={styles.champDetecte}>
                                    <span style={{ fontSize: 12, color: colors.textMuted }}>{CHAMPS_LABELS[cle] || cle}</span>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{valeur}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {Object.keys(resultat.champsDetectes).length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                            <Button variant="success" size="sm" onClick={() => creerFicheAvecDonnees('clients')}>
                                Créer une fiche client avec ces données
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => creerFicheAvecDonnees('fournisseurs')}>
                                Créer une fiche fournisseur avec ces données
                            </Button>
                        </div>
                    )}

                    <details style={{ marginTop: 20 }}>
                        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.primary }}>
                            Voir le texte brut extrait
                        </summary>
                        <pre style={styles.textePre}>{resultat.texte}</pre>
                    </details>
                </Card>
            )}
        </div>
    );
}

const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 },
    subtitle: { fontSize: 14, color: '#64748B', margin: '4px 0 0' },
    alertError: { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#991B1B', fontSize: 13, fontWeight: 500 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#0F172A', marginBottom: 4 },
    select: { padding: '8px 12px', borderRadius: 8, border: '2px solid #E2E8F0', fontSize: 14, width: '100%', boxSizing: 'border-box' },
    fileLabel: { display: 'inline-block', padding: '10px 20px', backgroundColor: '#E2E8F0', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
    confianceBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600, backgroundColor: '#F0FDF4', color: '#22C55E' },
    sousTitre: { fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 },
    champDetecte: { display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' },
    textePre: { whiteSpace: 'pre-wrap', fontSize: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginTop: 8, maxHeight: 240, overflowY: 'auto' }
};
