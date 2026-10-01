/**
 * GrantKit Main Application Entry
 * Decentralized Intelligent Grants Platform on GenLayer
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar, PageId } from './components/nav/Navbar';
import { OverviewPage } from './components/pages/OverviewPage';
import { ApplyPage } from './components/pages/ApplyPage';
import { MyGrantPage } from './components/pages/MyGrantPage';
import { AllProposalsPage } from './components/pages/AllProposalsPage';
import { AdminPage } from './components/pages/AdminPage';
import { Footer } from './components/footer/Footer';
import { WalletProvider } from '@/lib/genlayer/WalletProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


function MainApp() {
  const [activePage, setActivePage] = useState<PageId>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['overview', 'apply', 'my-grant', 'proposals', 'admin'].includes(hash)) {
      return hash as PageId;
    }
    return 'overview';
  });

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'apply', 'my-grant', 'proposals', 'admin'].includes(hash)) {
        setActivePage(hash as PageId);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-app)]">
      {/* Top Bar Contract compliant Navigation */}
      <Navbar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main Viewport Container: max-w-[1120px], generous 8px grid whitespace */}
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-6 pt-6">
        {activePage === 'overview' && <OverviewPage onNavigate={handleNavigate} />}
        {activePage === 'apply' && <ApplyPage onNavigate={handleNavigate} />}
        {activePage === 'my-grant' && <MyGrantPage onNavigate={handleNavigate} />}
        {activePage === 'proposals' && <AllProposalsPage onNavigate={handleNavigate} />}
        {activePage === 'admin' && <AdminPage onNavigate={handleNavigate} />}
      </main>

      {/* Minimal Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
    <ThemeProvider>
      <ToastProvider>
        <WalletProvider>
          <MainApp />
        </WalletProvider>
      </ToastProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}
