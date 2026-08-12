// frontend/src/components/chatbot/ChatbotWidget.jsx
// ---------------------------------------------------------------------------
// Widget flottant de l'assistant IA (chatbot conversationnel), affiché sur
// toutes les pages authentifiées via Layout.jsx. Se contente d'appeler
// chatbot.api.js ; toute l'intelligence (accès aux données ERP via function
// calling) vit côté backend.
// ---------------------------------------------------------------------------
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext'; // AJOUTÉ
import chatbotApi from '../../services/chatbot.api';
import { colors, spacing, typography, borderRadius, shadows, transitions } from '../../styles/theme';

export default function ChatbotWidget() {
    const { user } = useAuth();
    const { t, dir } = useLanguage(); // AJOUTÉ - dir pour RTL
    const [ouvert, setOuvert] = useState(false);
    const [messages, setMessages] = useState([]);
    const [saisie, setSaisie] = useState('');
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [historiqueCharge, setHistoriqueCharge] = useState(false);
    const finDesMessagesRef = useRef(null);

    useEffect(() => {
        if (ouvert && !historiqueCharge) {
            chatbotApi.getHistorique()
                .then((res) => {
                    setMessages(res.data.historique.map((m) => ({ role: m.role, contenu: m.contenu })));
                    setHistoriqueCharge(true);
                })
                .catch(() => setHistoriqueCharge(true));
        }
    }, [ouvert, historiqueCharge]);

    useEffect(() => {
        finDesMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, envoiEnCours]);

    // Le chatbot interroge des données transversales à l'entreprise (tous les
    // clients, toutes les commandes...) : réservé au staff interne. Le
    // SuperAdmin et le portail client externe ne le voient pas.
    if (user?.is_super_admin || user?.is_external) return null;

    const envoyer = async (e) => {
        e.preventDefault();
        const texte = saisie.trim();
        if (!texte || envoiEnCours) return;

        setMessages((prev) => [...prev, { role: 'user', contenu: texte }]);
        setSaisie('');
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            const res = await chatbotApi.envoyerMessage(texte);
            setMessages((prev) => [...prev, { role: 'assistant', contenu: res.data.reponse }]);
        } catch (err) {
            setErreur(err.response?.data?.message || t('assistant_indisponible'));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    const effacer = async () => {
        try {
            await chatbotApi.viderHistorique();
        } catch {
            // pas bloquant pour l'utilisateur
        }
        setMessages([]);
    };

    // Styles avec support RTL
    const panelStyle = {
        position: 'fixed',
        bottom: '88px',
        [dir === 'rtl' ? 'left' : 'right']: spacing.lg, // RTL support
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        height: '520px',
        maxHeight: 'calc(100vh - 120px)',
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.xl,
        boxShadow: shadows.xxl,
        border: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 2000,
        fontFamily: typography.fontFamily,
    };

    const buttonStyle = {
        position: 'fixed',
        bottom: spacing.lg,
        [dir === 'rtl' ? 'left' : 'right']: spacing.lg, // RTL support
        width: '56px',
        height: '56px',
        borderRadius: borderRadius.full,
        border: 'none',
        background: colors.gradientPrimary,
        color: colors.white,
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: shadows.glowPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        transition: `transform ${transitions.bounce}`,
    };

    return (
        <>
            {/* Bulle flottante */}
            <button
                onClick={() => setOuvert((o) => !o)}
                aria-label={t('assistant_ia')}
                style={buttonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                {ouvert ? '🤖' : '🤖'}
            </button>

            {/* Panneau de conversation */}
            {ouvert && (
                <div style={panelStyle}>
                    {/* En-tête */}
                    <div
                        style={{
                            background: colors.gradientPrimary,
                            color: colors.white,
                            padding: spacing.md,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div>
                            <div style={typography.bodyBold}>{t('assistant_ia')}</div>
                            <div style={{ ...typography.small, opacity: 0.85 }}>{t('toujours_pret_aider')}</div>
                        </div>
                        <button
                            onClick={effacer}
                            title={t('effacer_conversation')}
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                border: 'none',
                                color: colors.white,
                                borderRadius: borderRadius.sm,
                                padding: `${spacing.xs} ${spacing.sm}`,
                                cursor: 'pointer',
                                ...typography.small,
                            }}
                        >
                            {t('effacer_conversation')}
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: spacing.md,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: spacing.sm,
                            backgroundColor: colors.bg,
                        }}
                    >
                        {messages.length === 0 && (
                            <div style={{ ...typography.small, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg }}>
                                {t('poser_question_stocks')}
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div
                                key={i}
                                style={{
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    backgroundColor: m.role === 'user' ? colors.primary : colors.white,
                                    color: m.role === 'user' ? colors.white : colors.text,
                                    border: m.role === 'user' ? 'none' : `1px solid ${colors.border}`,
                                    borderRadius: borderRadius.lg,
                                    padding: `${spacing.sm} ${spacing.md}`,
                                    whiteSpace: 'pre-wrap',
                                    ...typography.body,
                                    textAlign: dir === 'rtl' ? 'right' : 'left', // RTL support
                                }}
                            >
                                {m.contenu}
                            </div>
                        ))}

                        {envoiEnCours && (
                            <div
                                style={{
                                    alignSelf: 'flex-start',
                                    backgroundColor: colors.white,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: borderRadius.lg,
                                    padding: `${spacing.sm} ${spacing.md}`,
                                    color: colors.textMuted,
                                    ...typography.small,
                                }}
                            >
                                {t('assistant_reflechit')}
                            </div>
                        )}

                        {erreur && (
                            <div
                                style={{
                                    alignSelf: 'center',
                                    color: colors.danger,
                                    backgroundColor: colors.dangerBg,
                                    border: `1px solid ${colors.dangerBorder}`,
                                    borderRadius: borderRadius.md,
                                    padding: `${spacing.xs} ${spacing.sm}`,
                                    ...typography.small,
                                }}
                            >
                                {erreur}
                            </div>
                        )}

                        <div ref={finDesMessagesRef} />
                    </div>

                    {/* Saisie */}
                    <form onSubmit={envoyer} style={{ display: 'flex', gap: spacing.xs, padding: spacing.sm, borderTop: `1px solid ${colors.border}` }}>
                        <input
                            type="text"
                            value={saisie}
                            onChange={(e) => setSaisie(e.target.value)}
                            placeholder={t('ecrivez_question')}
                            maxLength={2000}
                            disabled={envoiEnCours}
                            style={{
                                flex: 1,
                                border: `1px solid ${colors.border}`,
                                borderRadius: borderRadius.md,
                                padding: `${spacing.sm} ${spacing.md}`,
                                outline: 'none',
                                ...typography.body,
                                textAlign: dir === 'rtl' ? 'right' : 'left', // RTL support
                            }}
                        />
                        <button
                            type="submit"
                            disabled={envoiEnCours || !saisie.trim()}
                            style={{
                                border: 'none',
                                borderRadius: borderRadius.md,
                                padding: `0 ${spacing.md}`,
                                background: !saisie.trim() || envoiEnCours ? colors.borderDark : colors.gradientPrimary,
                                color: colors.white,
                                cursor: !saisie.trim() || envoiEnCours ? 'not-allowed' : 'pointer',
                                ...typography.bodyBold,
                            }}
                        >
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}