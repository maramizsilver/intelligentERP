// frontend/src/components/layout/Layout.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Sidebar from './Sidebar';
import Header from '../Header';
import EssaiBanner from '../EssaiBanner';
import ChatbotWidget from '../chatbot/ChatbotWidget';
import { colors, spacing, transitions, glassmorphism } from '../../styles/theme';

export default function Layout({ children }) {
  const { user } = useAuth();
  const { dir } = useLanguage();

  // L'animation fadeInUp utilise `transform`. Avec `animation-fill-mode: forwards`,
  // cette propriété `transform` reste appliquée EN PERMANENCE sur ce wrapper une fois
  // l'animation terminée (même translateY(0) scale(1) est un transform valide).
  // Or tout ancêtre avec un `transform` devient le "containing block" de ses
  // descendants en position:fixed (modals, dropdowns, tooltips...), qui se
  // retrouvent alors piégés SOUS le Header (sticky, zIndex:1000) quel que soit
  // leur propre z-index.
  // Solution : on retire `animation`/`transform` du style dès que l'animation
  // se termine (onAnimationEnd), pour que ce wrapper redevienne un simple <div>
  // sans containing block particulier.
  const [animationDone, setAnimationDone] = useState(false);

  if (user?.is_external) {
    return (
      <>
        <Header />
        <main
          style={{
            padding: spacing.lg,
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            backgroundColor: colors.bg,
            minHeight: '100vh',
            direction: dir,
          }}
        >
          {children}
        </main>
      </>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#0F172A',
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          marginLeft: '240px',
          transition: `margin-left ${transitions.normal}`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: '#F1F5F9',
          ...(dir === 'rtl' && {
            marginLeft: '0',
            marginRight: '240px',
          }),
        }}
      >
        <Header />
        <EssaiBanner />
        <main
          style={{
            flex: 1,
            padding: spacing.lg,
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto',
            direction: dir,
          }}
        >
          <div
            onAnimationEnd={() => setAnimationDone(true)}
            style={
              animationDone
                ? undefined
                : { animation: 'fadeInUp 0.4s ease forwards' }
            }
          >
            {children}
          </div>
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}