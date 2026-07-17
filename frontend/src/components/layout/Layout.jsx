import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from '../Header';
import EssaiBanner from '../EssaiBanner';
import MfaBanner from '../MfaBanner';  
import { colors, spacing, transitions } from '../../styles/theme';

export default function Layout({ children }) {
  const { user } = useAuth();

  if (user?.is_external) {
    return (
      <>
        <Header />
        <main style={styles.clientMain}>{children}</main>
      </>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        <Header />
        <MfaBanner />       
        <EssaiBanner />
        <main style={styles.main}>
          <div className="fade-in-up" style={styles.content}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colors.bg,
  },
  mainContent: {
    flex: 1,
    marginLeft: '240px',
    transition: `margin-left ${transitions.normal}`,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    padding: spacing.lg,
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
  },
  content: {
    animation: 'fadeInUp 0.4s ease forwards',
  },
  clientMain: {
    padding: spacing.lg,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    backgroundColor: colors.bg,
    minHeight: '100vh',
  },
};

// CSS pour l'animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);