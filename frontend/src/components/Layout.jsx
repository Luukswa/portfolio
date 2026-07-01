import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBranding } from '../context/BrandingContext'
import { useDarkMode } from '../context/DarkModeContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const { appName, logoUrl } = useBranding()
  useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1')

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0')
  }, [collapsed])

  if (user === undefined) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (user === null) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          {logoUrl && <img src={logoUrl} alt="" className="login-logo-img" />}
          <div className="login-logo">{appName}</div>
          <div className="login-org">OSG Twente</div>
          <div className="login-sub">Open deze app via het portaal, of log direct in.</div>
          <a href="/api/auth/login" className="btn btn-primary btn-full">Inloggen met Microsoft</a>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header>
        <div className="header-left" onClick={() => navigate('/')}>
          <div className="logo-mark">
            {logoUrl
              ? <div className="logo-icon"><img src={logoUrl} alt="" style={{ height: '28px', maxWidth: '64px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /></div>
              : null
            }
            <span className="logo-text">{appName}</span>
          </div>
        </div>
        <div className="header-right">
          <span className="header-name">{user.display_name}</span>
          {user.is_admin && <span className="role-chip">Beheerder</span>}
          {user.is_teacher && !user.is_admin && <span className="role-chip">Docent</span>}
          <button className="btn-signout" onClick={() => navigate('/hulp')} title="Hulp">❓</button>
          {user.is_admin && (
            <button className="btn-signout" onClick={() => navigate('/beheer')} title="Gebruikersbeheer">⚙</button>
          )}
          <button className="btn-signout" onClick={logout}>Afmelden</button>
        </div>
      </header>

      <div className="app-body">
        <nav className={collapsed ? 'collapsed' : ''}>
          <div className="nav-toggle">
            <button
              className="nav-toggle-btn"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Uitklappen' : 'Inklappen'}
            >
              {collapsed ? '▶' : '◀'}
            </button>
          </div>
          <div
            className={`nav-item${location.pathname === '/' ? ' active' : ''}`}
            onClick={() => navigate('/')}
          >
            <span className="ni">🏠</span>
            <span className="ni-label">Home</span>
          </div>
          <div
            className={`nav-item${location.pathname === '/over-mij' ? ' active' : ''}`}
            onClick={() => navigate('/over-mij')}
          >
            <span className="ni">👤</span>
            <span className="ni-label">Over mij</span>
          </div>
          <div
            className={`nav-item${location.pathname === '/mijn-cijfers' ? ' active' : ''}`}
            onClick={() => navigate('/mijn-cijfers')}
          >
            <span className="ni">📊</span>
            <span className="ni-label">Mijn cijfers</span>
          </div>
          <div
            className={`nav-item${location.pathname === '/doelen' ? ' active' : ''}`}
            onClick={() => navigate('/doelen')}
          >
            <span className="ni">🎯</span>
            <span className="ni-label">Doelen</span>
          </div>
          <div
            className={`nav-item${location.pathname === '/mijn-cv' ? ' active' : ''}`}
            onClick={() => navigate('/mijn-cv')}
          >
            <span className="ni">📄</span>
            <span className="ni-label">Mijn CV</span>
          </div>
          <div
            className={`nav-item${location.pathname === '/mijn-referenties' ? ' active' : ''}`}
            onClick={() => navigate('/mijn-referenties')}
          >
            <span className="ni">📝</span>
            <span className="ni-label">Referenties</span>
          </div>
          <div
            className={`nav-item${location.pathname === '/mijn-werkstukken' ? ' active' : ''}`}
            onClick={() => navigate('/mijn-werkstukken')}
          >
            <span className="ni">🖼️</span>
            <span className="ni-label">Werkstukken</span>
          </div>
          {(user.is_teacher || user.is_admin) && (
            <>
              <div className="nav-section-label" style={{ marginTop: '12px' }}>Docenten</div>
              <div
                className={`nav-item${location.pathname.startsWith('/overzicht') ? ' active' : ''}`}
                onClick={() => navigate('/overzicht')}
              >
                <span className="ni">📋</span>
                <span className="ni-label">Overzicht</span>
              </div>
            </>
          )}
        </nav>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
