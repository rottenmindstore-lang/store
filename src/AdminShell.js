import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import logoMark from './assets/logo-mark.png';
import LojaAdmin from './LojaAdmin';
import AdminDashboard from './AdminDashboard';
import AdminPersonalizacao from './AdminPersonalizacao';

const NAV_SECTIONS = [
  {
    label: 'Geral',
    items: [
      { id: 'dashboard',      label: 'Dashboard',      icon: (
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      )},
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { id: 'loja',           label: 'Produtos',       icon: (
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
          <path d="M2 2h2l1.5 7h7l1.5-5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="7" cy="13" r="1" fill="currentColor"/>
          <circle cx="12" cy="13" r="1" fill="currentColor"/>
        </svg>
      )},
      { id: 'personalizacao', label: 'Personalização', icon: (
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
          <path d="M9.5 2.5l4 4-7 7H2.5v-4l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M7.5 4.5l4 4" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      )},
    ],
  },
];

export default function AdminShell() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    if (!window.confirm('Sair do painel?')) return;
    await signOut(auth);
  }

  function navigate(id) {
    setPage(id);
    setSidebarOpen(false);
  }

  return (
    <div className="adm">

      {/* ── topbar ── */}
      <header className="adm-topbar">
        <button
          type="button"
          className="adm-hamburger"
          aria-label="Menu"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
        <img src={logoMark} alt="" className="adm-topbar-logo" />
        <span className="adm-topbar-brand">Admin</span>
        <div style={{ flex: 1 }} />
        <button type="button" className="adm-topbar-btn" onClick={handleLogout}>
          Sair
        </button>
      </header>

      {/* ── sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="adm-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── sidebar ── */}
      <nav className={`adm-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Navegação admin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="adm-sidebar-section-label">{section.label}</div>
            <div className="adm-nav">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`adm-nav-item${page === item.id ? ' is-active' : ''}`}
                  onClick={() => navigate(item.id)}
                >
                  <span className="adm-nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── conteúdo ── */}
      <main className="adm-main">
        <div className="adm-content">
          {page === 'dashboard' && (
            <>
              <h2 className="admin-h2" style={{ marginBottom: 24 }}>Dashboard</h2>
              <AdminDashboard />
            </>
          )}
          {page === 'loja'           && <LojaAdmin />}
          {page === 'personalizacao' && <AdminPersonalizacao />}
        </div>
      </main>
    </div>
  );
}
