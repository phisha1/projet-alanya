import { Link } from "react-router-dom"
import "./not-found-page.css"

export default function NotFoundPage() {
  return (
    <main className="nf-root">
      <div className="nf-card">
        <div className="nf-code">404</div>
        <h1 className="nf-title">Page introuvable</h1>
        <p className="nf-sub">
          Le lien que vous avez suivi n'existe pas ou n'est plus disponible.
        </p>
        <div className="nf-actions">
          <Link to="/welcome" className="nf-btn nf-btn--ghost">Accueil</Link>
          <Link to="/dashboard" className="nf-btn">Dashboard</Link>
        </div>
      </div>
    </main>
  )
}
