import { Link } from "react-router-dom"
import { ThemeToggle } from "../../../src/components/theme-toggle"
import polytechLogo from "../polytech.png"
import "./welcome-page.css"

export default function WelcomePage() {
  return (
    <>
      <div className="alanya-root">
        {/* Navbar */}
        <nav className="nav">
          <div className="nav-logo">
            <img src={polytechLogo} alt="Logo Polytech Yaounde" className="school-logo" />
            <div className="brand-copy">
              <span className="display-font brand-name">Alanya</span>
              <span className="brand-subtitle">Messagerie ENSPY</span>
            </div>
          </div>
          <div className="nav-links">
            <div className="welcome-theme-row">
              <span className="welcome-theme-label">Theme</span>
              <ThemeToggle className="welcome-theme-toggle" />
            </div>
            <a href="#features">Fonctionnalités</a>
            <Link to="/login" className="btn-nav">Se connecter</Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="hero">
          <div className="hero-left">
            <div className="badge">
              <div className="badge-dot" />
              <span>2 746 utilisateurs en ligne maintenant</span>
            </div>

            <h1 className="headline">
              <span>Parle.</span>
              <span>Partage.</span>
              <span className="overflow-word"><em>Connecte.</em></span>
            </h1>

            <p className="subline">
              La messagerie pensée pour les ingénieurs de demain.
              Sécurisée, rapide, et taillée pour les esprits brillants de l'ENSPY.
            </p>

            <div className="cta-row">
              <Link to="/sign-in" className="btn-primary">
                Commencer gratuitement
                <span style={{ fontSize: 18 }}>→</span>
              </Link>
              <a href="#features" className="btn-ghost">
                Voir les fonctionnalites
                <span style={{ fontSize: 14 }}>↗</span>
              </a>
            </div>

            <div id="features" className="features">
              <div className="feat">
                <div className="feat-label">Latence</div>
                <div className="feat-val"><strong>&lt; 500ms</strong> livraison</div>
              </div>
              <div className="feat">
                <div className="feat-label">Fichiers</div>
                <div className="feat-val">Jusqu'à <strong>50 Mo</strong></div>
              </div>
              <div className="feat">
                <div className="feat-label">Appels</div>
                <div className="feat-val">Audio <strong>&amp;</strong> Vidéo</div>
              </div>
            </div>
          </div>

          {/* Chat preview */}
          <div id="about" className="hero-right">
            <div className="phone">
              <div className="phone-bar">
                <div className="avatar-sm">KM</div>
                <div>
                  <div className="phone-name">Kevin Manga</div>
                  <div className="phone-status">en ligne</div>
                </div>
              </div>
              <div className="chat-body">
                <div>
                  <div className="bubble them">T'as envoyé le TP de BD ?</div>
                  <div className="meta">10:42</div>
                </div>
                <div>
                  <div className="bubble me">Oui, je viens de l'uploader 📎</div>
                  <div className="meta right">10:43 ✓✓</div>
                </div>
                <div>
                  <div className="bubble them">Merci frère, tu gères vraiment</div>
                  <div className="meta">10:43</div>
                </div>
                <div className="typing">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
              <div className="phone-input">
                <div className="phone-input-field">Message…</div>
                <div className="send-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--bg-base)">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="var(--bg-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


