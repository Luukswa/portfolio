import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBranding } from '../context/BrandingContext'
import { useDarkMode } from '../context/DarkModeContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const { appName, logoUrl } = useBranding()
  const { dark, toggleDark } = useDarkMode()
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
          <div className="login-sub">Open deze app via het portaal.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header>
        <div className="header-left">
          <div className="logo-mark">
            {logoUrl
              ? <div className="logo-icon"><img src={logoUrl} alt="" style={{ height: '28px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /></div>
              : null
            }
            <span className="logo-text">{appName}</span>
          </div>
        </div>
        <div className="header-right">
          <span className="header-name">{user.display_name}</span>
          {user.is_admin && <span className="role-chip">Admin</span>}
          <button className="btn-signout" onClick={toggleDark} title={dark ? 'Lichte modus' : 'Donkere modus'}>
            {dark ? '☀' : '☾'}
          </button>
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
          {/* Nav items — add .nav-item elements here as pages are built */}
        </nav>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
