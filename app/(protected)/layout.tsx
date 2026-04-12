import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../src/components/auth-provider"
import { ThemeToggle } from "../../src/components/theme-toggle"
import IncomingCallOverlay from "../../src/components/incoming-call-overlay"
import { toInitials } from "../../src/data/session-user"
import "./layout.css"


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface NavItem {
  href:  string
  label: string
  icon:  React.ReactNode
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ICONES SVG
// Aucune dependance externe â€” les SVG sont inlines et reutilisables.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3"  y="3"  width="7" height="7" rx="1" />
      <rect x="14" y="3"  width="7" height="7" rx="1" />
      <rect x="3"  y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Chat: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  Call: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  ),
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DONNEES DE NAVIGATION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <Icons.Dashboard /> },
  { href: "/chats",     label: "Messages",  icon: <Icons.Chat />      },
  { href: "/calls",     label: "Appels",    icon: <Icons.Call />      },
]

// Nombre de messages non lus par section â€” sera alimente par WebSocket
const UNREAD_COUNTS: Record<string, number> = {
  "/chats": 3,
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// COMPOSANT Sidebar
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface SidebarProps {
  onClose?: () => void
}

function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user: sessionUser } = useAuth()
  const pathname = location.pathname

  // Donnees utilisateur fictives â€” seront remplacees par GET /api/users/me
  const user = {
    name:     sessionUser?.name ?? "Utilisateur Alanya",
    email:    sessionUser?.email ?? "",
    initials: toInitials(sessionUser?.name ?? "Utilisateur Alanya"),
    status:   "En ligne",
  }

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <aside className="sidebar">

      {/* Logo + bouton fermeture (mobile) */}
      <div className="sb-logo">
        <div className="sb-hex" />
        <span className="sb-logo-txt">Alanya</span>
        {onClose && (
          <button className="sb-close" onClick={onClose} aria-label="Fermer le menu">
            <Icons.Close />
          </button>
        )}
      </div>

      {/* Navigation principale */}
      <nav className="sb-nav">
        <div className="sb-nav-section">Navigation</div>

        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive    = pathname.startsWith(href)
          const unreadCount = UNREAD_COUNTS[href]

          return (
            <Link
              key={href}
              to={href}
              className={`sb-link ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              {icon}
              {label}
              {unreadCount && (
                <span className="sb-badge">{unreadCount}</span>
              )}
            </Link>
          )
        })}

        <div className="sb-nav-section">Compte</div>

        <Link
          to="/settings"
          className={`sb-link ${pathname === "/settings" ? "active" : ""}`}
          onClick={onClose}
        >
          <Icons.Settings />
          Parametres
        </Link>
      </nav>

      {/* Profil + deconnexion */}
      <div className="sb-footer">
        <div className="sb-theme-row">
          <span className="sb-theme-label">Theme</span>
          <ThemeToggle />
        </div>
        <div className="sb-profile" onClick={() => navigate("/settings")}>
          <div className="sb-avatar">
            {user.initials}
            <div className="sb-avatar-dot" />
          </div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user.name}</div>
            <div className="sb-user-status">{user.status}</div>
          </div>
          <button
            className="sb-logout"
            onClick={e => { e.stopPropagation(); handleLogout() }}
            aria-label="Se deconnecter"
            title="Se deconnecter"
          >
            <Icons.Logout />
          </button>
        </div>
      </div>

    </aside>
  )
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LAYOUT PROTEGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="layout-root">

      {/* Sidebar fixe â€” desktop uniquement */}
      <div className="layout-sidebar-static">
        <Sidebar />
      </div>

      {/* Overlay semi-transparent â€” ferme la sidebar mobile au clic */}
      <div
        className={`mobile-overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar mobile â€” slide depuis la gauche */}
      <div className={`sidebar-mobile-wrap ${mobileOpen ? "open" : ""}`}>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Zone de contenu principale */}
      <div className="layout-main">

        {/* Topbar mobile (cache la sidebar sur petit ecran) */}
        <header className="topbar">
          <button
            className="topbar-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Icons.Menu />
          </button>
          <span className="topbar-title">Alanya</span>
          <ThemeToggle />
        </header>

        {children}
      </div>

      {/* Overlay d'appel entrant (demo) */}
      <IncomingCallDemo />
    </div>
  )
}

// Composant demo pour simuler un appel entrant
function IncomingCallDemo() {
  const [showCall, setShowCall] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Simuler un appel entrant après 10 secondes (pour la démo)
    const timer = setTimeout(() => {
      setShowCall(true) 
    }, 10000)
    return () => clearTimeout(timer)
  }, [])

  if (!showCall) return null

  return (
    <IncomingCallOverlay
      caller={{
        id: "1",
        name: "Kevin Manga",
        initials: "KM",
        color: { bg: "#E8B84B22", fg: "#E8B84B" }
      }}
      type="video"
      onAccept={() => {
        setShowCall(false)
        navigate("/calls/new?contact=1&type=video")
      }}
      onDecline={() => setShowCall(false)}
    />
  )
}

