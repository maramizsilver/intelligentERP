// ---------------------------------------------------------------------------
// Recherche globale transversale (CRM, Ventes, Achats, Stock, RH...), pensée
// pour vivre dans le Header, à côté de LanguageSwitcher. Reprend les tokens
// de src/styles/theme.js pour rester visuellement identique au reste de l'app.
// ---------------------------------------------------------------------------
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, borderRadius } from '../../styles/theme';
import documentIntelligenceApi from '../../services/documentIntelligence.api';

// Route de destination par table, pour ouvrir directement la bonne fiche.
// À compléter au fil de l'ajout de nouveaux modules de recherche côté back
// (backend/services/globalSearch.service.js -> SEARCH_TARGETS).
const ROUTES_PAR_TABLE = {
    clients: '/clients',
    fournisseurs: '/fournisseurs',
    produits: '/produits',
    devis: '/devis',
    commandes: '/commandes',
    documents: '/documents',
    users: '/utilisateurs'
};

export default function GlobalSearchBar({ isMobile = false }) {
    const [terme, setTerme] = useState('');
    const [resultats, setResultats] = useState([]);
    const [chargement, setChargement] = useState(false);
    const [ouvert, setOuvert] = useState(false);
    const conteneurRef = useRef(null);
    const navigate = useNavigate();

    const lancerRecherche = useCallback((valeur) => {
        if (!valeur || valeur.trim().length < 2) {
            setResultats([]);
            return;
        }
        setChargement(true);
        documentIntelligenceApi.rechercheGlobale(valeur)
            .then(res => setResultats(res.data.resultats || []))
            .catch(() => setResultats([]))
            .finally(() => setChargement(false));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => lancerRecherche(terme), 300);
        return () => clearTimeout(timer);
    }, [terme, lancerRecherche]);

    useEffect(() => {
        function onClickExterieur(e) {
            if (conteneurRef.current && !conteneurRef.current.contains(e.target)) setOuvert(false);
        }
        document.addEventListener('mousedown', onClickExterieur);
        return () => document.removeEventListener('mousedown', onClickExterieur);
    }, []);

    const allerVersResultat = (resultat) => {
        const route = ROUTES_PAR_TABLE[resultat.table] || '/dashboard';
        navigate(`${route}/${resultat.id}`);
        setOuvert(false);
        setTerme('');
    };

    return (
        <div ref={conteneurRef} style={{ position: 'relative', width: isMobile ? '100%' : '260px' }}>
            <input
                type="text"
                value={terme}
                onChange={(e) => { setTerme(e.target.value); setOuvert(true); }}
                onFocus={() => setOuvert(true)}
                placeholder="🔍 Rechercher (nom, CIN, tél, matricule...)"
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#F8FAFC',
                    outline: 'none',
                    boxSizing: 'border-box'
                }}
            />

            {ouvert && terme.trim().length >= 2 && (
                <div style={{
                    position: 'absolute', top: '110%', left: 0, right: 0,
                    backgroundColor: colors.white, border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    maxHeight: 360, overflowY: 'auto', zIndex: 1200
                }}>
                    {chargement && (
                        <div style={{ padding: 12, fontSize: 13, color: colors.textMuted }}>Recherche en cours...</div>
                    )}
                    {!chargement && resultats.length === 0 && (
                        <div style={{ padding: 12, fontSize: 13, color: colors.textMuted }}>Aucun résultat.</div>
                    )}
                    {!chargement && resultats.map((r) => (
                        <button
                            key={`${r.table}-${r.id}`}
                            onClick={() => allerVersResultat(r)}
                            style={{
                                display: 'block', width: '100%', textAlign: 'left',
                                padding: '10px 14px', border: 'none',
                                borderBottom: `1px solid ${colors.borderLight}`,
                                background: 'transparent', cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.primaryBg)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{r.libelle}</div>
                            <div style={{ fontSize: 12, color: colors.textMuted }}>{r.module} · {r.extrait}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
