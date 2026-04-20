import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../../src/components/auth-provider"
import polytechLogo from "../../(public)/polytech.png"
import "./login-page.css"

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").replace(/[()-]/g, "")
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [phone, setPhone] = useState("")
  const [pwd, setPwd] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const canSubmit = useMemo(() => {
    const normalized = normalizePhone(phone)
    return /^\+?[0-9]{8,15}$/.test(normalized) && pwd.length >= 4
  }, [phone, pwd])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const redirectTo =
      (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard"

    setError("")
    setLoading(true)

    try {
      await login({ phone, password: pwd })
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Connexion impossible.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="left-panel">
        <div className="logo">
          <img src={polytechLogo} alt="Logo Polytech Yaounde" className="auth-school-logo" />
          <span className="logo-name">Alanya</span>
        </div>

        <div className="left-body">
          <h1 className="left-heading">
            Content de<br />
            te <em>revoir.</em>
          </h1>
          <p className="left-sub">Utilisez votre numero de telephone et votre mot de passe pour reprendre vos conversations.</p>
        </div>

        <div className="stat-row">
          <div>
            <div className="stat-num">2.8k</div>
            <div className="stat-lbl">en ligne maintenant</div>
          </div>
          <div>
            <div className="stat-num">50Mo</div>
            <div className="stat-lbl">taille max fichiers</div>
          </div>
          <div>
            <div className="stat-num">95%</div>
            <div className="stat-lbl">disponibilite</div>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-pretitle">Connexion</div>
          <h2 className="form-title">Bon retour.</h2>
          <p className="form-subtitle">Entrez vos identifiants pour acceder a votre compte.</p>

          {error ? (
            <div style={{
              marginBottom: 16,
              border: "1px solid var(--danger-border, #ef444430)",
              background: "var(--danger-dim, #ef444415)",
              color: "var(--danger, #ef4444)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
            }}>
              {error}
            </div>
          ) : null}

          <div className="field">
            <input
              id="phone"
              type="tel"
              placeholder=" "
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
            />
            <label htmlFor="phone">Numero de telephone</label>
          </div>

          <div className="field">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder=" "
              value={pwd}
              onChange={(event) => setPwd(event.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingRight: 52 }}
            />
            <label htmlFor="password">Mot de passe</label>
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPwd((value) => !value)}
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? "Masquer" : "Afficher"}
            </button>
          </div>

          <div className="forgot-row">
            <Link to="/sign-in" className="forgot-link">Mot de passe oublie ?</Link>
          </div>

          <button type="submit" className="btn-submit" disabled={loading || !canSubmit}>
            {loading ? <><div className="spinner" /> Connexion...</> : <>Se connecter -&gt;</>}
          </button>

          <p className="signup-txt">
            Pas encore de compte ? <Link to="/sign-in" className="signup-link">Creer un compte</Link>
          </p>
        </form>
      </div>
    </div>
  )
}


