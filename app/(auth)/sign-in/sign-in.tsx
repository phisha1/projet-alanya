import { useState, useRef, useEffect, useCallback } from "react"
import "./sign-in-page.css"


// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// Toutes les "magic numbers" regroupées ici pour faciliter la maintenance.
// ══════════════════════════════════════════════════════════════════════════════

const OTP_LENGTH          = 6   // nombre de cases du code OTP
const MAX_OTP_ATTEMPTS    = 5   // tentatives max avant blocage
const RESEND_COOLDOWN_SEC = 60  // délai (secondes) avant de pouvoir renvoyer le code
const MIN_PASSWORD_SCORE  = 2   // score minimum accepté (sur 5) pour passer à l'étape suivante

// Liste noire côté client — vérification complémentaire faite aussi côté serveur
const COMMON_PASSWORDS = new Set([
  "password", "123456", "azerty", "qwerty", "motdepasse",
  "iloveyou", "admin", "welcome", "monkey", "dragon",
  "password1", "123456789", "12345678", "1234567890",
])


// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

type Step = 1 | 2 | 3

interface FormData {
  name:     string
  email:    string
  password: string
  confirm:  string
}

interface PasswordStrength {
  score: number    // 0 à 5
  label: string
  color: string
  tips:  string[]  // conseils affichés sous la barre de force
}


// ══════════════════════════════════════════════════════════════════════════════
// HELPERS PURS
// Fonctions sans état ni effets de bord — faciles à tester isolément.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Analyse la force d'un mot de passe et retourne un score (0–5),
 * un label coloré et des conseils d'amélioration.
 *
 * Règles de scoring :
 *  +1  ≥ 8 caractères
 *  +1  ≥ 14 caractères (bonus longueur)
 *  +1  contient une majuscule
 *  +1  contient un chiffre
 *  +1  contient un caractère spécial
 *  −3  mot de passe présent dans la liste noire
 *  −1  4 caractères identiques consécutifs ou plus
 */
function analyzePassword(pwd: string): PasswordStrength {
  if (pwd.length === 0) {
    return { score: 0, label: "", color: "#1E2736", tips: [] }
  }

  const tips: string[] = []
  let score = 0

  // ── Points positifs ──────────────────────────────────────────────────────
  if (pwd.length >= 8)          score++
  else                          tips.push("Au moins 8 caractères")

  if (pwd.length >= 14)         score++ // bonus longueur, pas de conseil associé

  if (/[A-Z]/.test(pwd))        score++
  else                          tips.push("Au moins une majuscule")

  if (/[0-9]/.test(pwd))        score++
  else                          tips.push("Au moins un chiffre")

  if (/[^A-Za-z0-9]/.test(pwd)) score++
  else                          tips.push("Un caractère spécial ( ! @ # $ … )")

  // ── Pénalités ────────────────────────────────────────────────────────────
  if (COMMON_PASSWORDS.has(pwd.toLowerCase())) {
    score = Math.max(0, score - 3)
    tips.push("Mot de passe trop courant — choisissez-en un autre")
  }

  if (/(.)\1{3,}/.test(pwd)) {
    score = Math.max(0, score - 1)
    tips.push("Évitez les répétitions de caractères")
  }

  // ── Niveaux ──────────────────────────────────────────────────────────────
  const levels: Record<number, { label: string; color: string }> = {
    0: { label: "Très faible", color: "#ef4444" },
    1: { label: "Faible",      color: "#f97316" },
    2: { label: "Moyen",       color: "#eab308" },
    3: { label: "Bon",         color: "#84cc16" },
    4: { label: "Fort",        color: "#22c55e" },
    5: { label: "Très fort",   color: "#E8B84B" },
  }

  const clamped = Math.min(5, score) as 0 | 1 | 2 | 3 | 4 | 5
  return { score: clamped, ...levels[clamped], tips }
}

/**
 * Validation email côté client (RFC 5322 simplifié).
 * La validation définitive est effectuée côté serveur.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/**
 * Accorde un mot en nombre : "1 tentative", "2 tentatives".
 */
function pluralize(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? "s" : ""}`
}


// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT OtpInput
// 6 cases indépendantes avec navigation clavier et support du coller.
// ══════════════════════════════════════════════════════════════════════════════

interface OtpInputProps {
  value:    string[]
  onChange: (digits: string[]) => void
  disabled: boolean
}

function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const focusAt = (index: number) => inputRefs.current[index]?.focus()

  function handleDigitChange(index: number, rawInput: string) {
    // On ne garde que les chiffres, et uniquement le dernier saisi
    const digit = rawInput.replace(/\D/g, "").slice(-1)

    const updated = [...value]
    updated[index] = digit
    onChange(updated)

    // Avancer automatiquement à la case suivante
    if (digit && index < OTP_LENGTH - 1) focusAt(index + 1)
  }

  function handleKeyNavigation(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (value[index]) {
        // Effacer la case courante
        const updated = [...value]
        updated[index] = ""
        onChange(updated)
      } else if (index > 0) {
        // Case déjà vide → revenir à la précédente
        focusAt(index - 1)
      }
    }

    if (e.key === "ArrowLeft"  && index > 0)              focusAt(index - 1)
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) focusAt(index + 1)
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
    if (!pasted) return

    const updated = Array(OTP_LENGTH).fill("")
    pasted.split("").forEach((char, i) => { updated[i] = char })
    onChange(updated)

    // Focus sur la dernière case remplie par le collage
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  return (
    <div className="otp-inputs">
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          disabled={disabled}
          autoComplete="one-time-code"
          aria-label={`Chiffre ${i + 1} du code OTP`}
          onChange={e  => handleDigitChange(i, e.target.value)}
          onKeyDown={e => handleKeyNavigation(i, e)}
          onPaste={handlePaste}
          className="otp-digit"
          style={{
            // Ces deux propriétés dépendent de value[i] → elles restent en inline style
            background: value[i] ? "#E8B84B15" : "#10151F",
            border:     `1px solid ${value[i] ? "#E8B84B60" : "#1E2736"}`,
          }}
        />
      ))}
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT StepHeader
// En-tête réutilisable affiché en haut de chaque étape.
// ══════════════════════════════════════════════════════════════════════════════

interface StepHeaderProps {
  stepNumber: Step
  title:      React.ReactNode
  subtitle:   React.ReactNode
}

function StepHeader({ stepNumber, title, subtitle }: StepHeaderProps) {
  return (
    <div className="step-head">
      <div className="step-pre">Étape {stepNumber} sur 3</div>
      <h1 className="step-title">{title}</h1>
      <p className="step-sub">{subtitle}</p>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — SignInPage
// ══════════════════════════════════════════════════════════════════════════════

export default function SignInPage() {
  // ── État global ───────────────────────────────────────────────────────────
  const [step,        setStep]        = useState<Step>(1)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState("")

  // ── État du formulaire ────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>({
    name: "", email: "", password: "", confirm: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  // ── État de l'étape OTP ───────────────────────────────────────────────────
  const [otp,         setOtp]         = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [countdown,   setCountdown]   = useState(0)            // secondes avant de pouvoir renvoyer
  const [otpAttempts, setOtpAttempts] = useState(0)

  // ── Valeurs dérivées ──────────────────────────────────────────────────────
  const strength       = analyzePassword(form.password)
  const passwordsMatch = form.password === form.confirm && form.confirm.length > 0
  const otpComplete    = otp.every(digit => digit !== "")
  const remainingAttempts = MAX_OTP_ATTEMPTS - otpAttempts

  // Classes CSS calculées avant le JSX pour garder le rendu lisible
  const emailInputClass = !form.email
    ? ""
    : isValidEmail(form.email) ? "ok" : "err"

  const confirmInputClass = [
    "input-with-toggle",
    !form.confirm ? "" : passwordsMatch ? "ok" : "err",
  ].filter(Boolean).join(" ")


  // ── Décompte "Renvoyer le code" ───────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])


  // ── Helper : mettre à jour un champ du formulaire ─────────────────────────
  function handleField(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("")
      setForm(prev => ({ ...prev, [key]: e.target.value }))
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // SOUMISSIONS PAR ÉTAPE
  // ══════════════════════════════════════════════════════════════════════════

  // ── Étape 1 : nom + email ─────────────────────────────────────────────────
  function submitStep1(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const name  = form.name.trim()
    const email = form.email.trim().toLowerCase()

    if (name.length < 2)      return setError("Le nom doit contenir au moins 2 caractères.")
    if (name.length > 60)     return setError("Le nom est trop long.")
    if (!isValidEmail(email)) return setError("Adresse e-mail invalide.")

    // On normalise les valeurs avant de passer à l'étape suivante
    setForm(prev => ({ ...prev, name, email }))
    setStep(2)
  }

  // ── Étape 2 : mot de passe → création du compte + envoi OTP ──────────────
  async function submitStep2(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (strength.score < MIN_PASSWORD_SCORE) return setError("Mot de passe trop faible. Renforcez-le.")
    if (!passwordsMatch)                     return setError("Les mots de passe ne correspondent pas.")

    setLoading(true)
    try {
      // ① Créer le compte — le mot de passe sera haché BCrypt côté serveur
      const registerRes = await fetch("/api/auth/register", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        credentials: "same-origin",
      })

      if (!registerRes.ok) {
        // On efface les mots de passe de la mémoire en cas d'échec
        setForm(prev => ({ ...prev, password: "", confirm: "" }))
        const { message } = await registerRes.json().catch(() => ({}))
        throw new Error(message ?? "Erreur lors de la création du compte.")
      }

      // ② Envoyer le code OTP par email
      await fetch("/api/auth/send-otp", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ email: form.email }),
        credentials: "same-origin",
      })

      setCountdown(RESEND_COOLDOWN_SEC)
      setStep(3)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Étape 3 : vérification du code OTP ───────────────────────────────────
  const submitOtp = useCallback(async () => {
    if (!otpComplete || loading) return

    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      return setError("Trop de tentatives. Demandez un nouveau code.")
    }

    setLoading(true)
    setError("")

    try {
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ email: form.email, otp: otp.join("") }),
        credentials: "same-origin",
      })

      if (!verifyRes.ok) {
        setOtpAttempts(n => n + 1)
        setOtp(Array(OTP_LENGTH).fill(""))
        const { message } = await verifyRes.json().catch(() => ({}))
        throw new Error(message ?? "Code incorrect. Réessayez.")
      }

      // Succès — redirection côté client
      window.location.assign("/dashboard")

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [otp, otpComplete, loading, otpAttempts, form.email])

  // Auto-submit dès que les 6 chiffres sont saisis
  useEffect(() => {
    if (otpComplete) submitOtp()
  }, [otpComplete, submitOtp])

  // Renvoyer un nouveau code (avec remise à zéro des tentatives)
  async function resendOtp() {
    if (countdown > 0) return

    setOtp(Array(OTP_LENGTH).fill(""))
    setOtpAttempts(0)
    setError("")

    await fetch("/api/auth/send-otp", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ email: form.email }),
      credentials: "same-origin",
    })

    setCountdown(RESEND_COOLDOWN_SEC)
  }


  // ══════════════════════════════════════════════════════════════════════════
  // DONNÉES DU STEPPER (panneau gauche)
  // ══════════════════════════════════════════════════════════════════════════

  const STEPS: { label: string; description: string }[] = [
    { label: "Informations", description: "Nom et adresse e-mail"  },
    { label: "Mot de passe", description: "Mot de passe sécurisé"  },
    { label: "Vérification", description: "Code à 6 chiffres"      },
  ]

  const SECURITY_PROMISES = [
    { icon: "🔐", text: "Mot de passe haché avec BCrypt avant tout stockage"  },
    { icon: "🔑", text: "Authentification par JWT — Access 15 min / Refresh 7 j" },
    { icon: "🛡️", text: "HTTPS obligatoire sur tous les endpoints"            },
    { icon: "⏱️", text: "Rate limiting : 5 tentatives / minute par IP"        },
  ]


  // ══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="si-root">

      {/* ── Panneau gauche : branding + stepper + promesses ─────────────── */}
      <aside className="si-left">

        <div className="logo">
          <div className="hex" />
          <span className="logo-txt">Alanya</span>
        </div>

        {/* Stepper — montre la progression en 3 étapes */}
        <div className="stepper">
          {STEPS.map(({ label, description }, idx) => {
            const stepNumber = (idx + 1) as Step
            const state =
              step > stepNumber ? "done" :
              step === stepNumber ? "active" : "todo"

            return (
              <div className="step-item" key={stepNumber}>
                <div className="step-track">
                  <div className={`step-circle ${state}`}>
                    {state === "done" ? <CheckIcon /> : stepNumber}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`step-line ${state === "done" ? "done" : ""}`} />
                  )}
                </div>
                <div className="step-info">
                  <div className={`step-label ${state}`}>{label}</div>
                  <div className="step-desc">{description}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Promesses de sécurité */}
        <div className="sec-promises">
          <div className="sec-title">Sécurité</div>
          {SECURITY_PROMISES.map(({ icon, text }) => (
            <div className="sec-item" key={text}>
              <div className="sec-icon">{icon}</div>
              <div className="sec-txt">{text}</div>
            </div>
          ))}
        </div>

      </aside>

      {/* ── Panneau droit : formulaire ──────────────────────────────────── */}
      <main className="si-right">
        <div className="form-wrap">

          {/* Bannière d'erreur globale */}
          {error && (
            <div className="error-banner" role="alert">
              <span aria-hidden>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Étape 1 : nom + email ──────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={submitStep1} noValidate>
              <StepHeader
                stepNumber={1}
                title="Créer un compte."
                subtitle="Commencez par vos informations de base."
              />

              <div className="field">
                <input
                  id="name"
                  type="text"
                  placeholder=" "
                  value={form.name}
                  onChange={handleField("name")}
                  autoComplete="name"
                  required
                  maxLength={60}
                  className={form.name.length > 1 ? "ok" : ""}
                />
                <label htmlFor="name">Nom complet</label>
              </div>

              <div className="field">
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  value={form.email}
                  onChange={handleField("email")}
                  autoComplete="email"
                  required
                  // Normalise en minuscules à la sortie du champ (onBlur)
                  onBlur={e => setForm(prev => ({ ...prev, email: e.target.value.trim().toLowerCase() }))}
                  className={emailInputClass}
                />
                <label htmlFor="email">Adresse e-mail</label>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={!form.name.trim() || !isValidEmail(form.email)}
              >
                Continuer →
              </button>

              <div className="login-link">
                Déjà un compte ? <a href="/login">Se connecter</a>
              </div>
            </form>
          )}

          {/* ── Étape 2 : mot de passe ─────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={submitStep2} noValidate>
              <StepHeader
                stepNumber={2}
                title={<>Sécurisez<br />votre compte.</>}
                subtitle={<>Pour <strong>{form.email}</strong></>}
              />

              {/* Champ mot de passe */}
              <div className="field">
                <input
                  id="pwd"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={form.password}
                  onChange={handleField("password")}
                  autoComplete="new-password"
                  required
                  className="input-with-toggle"
                />
                <label htmlFor="pwd">Mot de passe</label>
                <div className="field-icon">
                  <button
                    type="button"
                    className="tog"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>

              {/* Barre de force — apparaît dès le premier caractère saisi */}
              {form.password.length > 0 && (
                <div className="strength-wrap">
                  <div className="strength-bar-track">
                    <div
                      className="strength-bar-fill"
                      style={{
                        // Largeur et couleur sont calculées dynamiquement → inline style
                        width:      `${(strength.score / 5) * 100}%`,
                        background: strength.color,
                      }}
                    />
                  </div>
                  <div className="strength-meta">
                    <span
                      className="strength-label"
                      style={{ color: strength.color }} // couleur dynamique → inline
                    >
                      {strength.label}
                    </span>
                    <div className="strength-tips">
                      {strength.tips.slice(0, 2).map(tip => (
                        <div key={tip}>↳ {tip}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Champ confirmation */}
              <div className="field">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder=" "
                  value={form.confirm}
                  onChange={handleField("confirm")}
                  autoComplete="new-password"
                  required
                  className={confirmInputClass}
                />
                <label htmlFor="confirm">Confirmer le mot de passe</label>
                <div className="field-icon field-icon--gap">
                  {form.confirm.length > 0 && (
                    <span className="match-icon" aria-hidden>
                      {passwordsMatch ? "✓" : "✗"}
                    </span>
                  )}
                  <button
                    type="button"
                    className="tog"
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
                  >
                    {showConfirm ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>

              <div className="btn-row">
                <button
                  type="button"
                  className="btn-submit btn-back"
                  onClick={() => { setError(""); setStep(1) }}
                  aria-label="Retour à l'étape précédente"
                >
                  ←
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading || strength.score < MIN_PASSWORD_SCORE || !passwordsMatch}
                >
                  {loading
                    ? <><div className="spinner" /> Création du compte…</>
                    : <>Créer le compte →</>
                  }
                </button>
              </div>
            </form>
          )}

          {/* ── Étape 3 : code OTP ─────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <StepHeader
                stepNumber={3}
                title={<>Vérifiez<br />votre e-mail.</>}
                subtitle={<>Un code à 6 chiffres a été envoyé à <strong>{form.email}</strong></>}
              />

              <div className="otp-wrap">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading || otpAttempts >= MAX_OTP_ATTEMPTS}
                />

                {/* Lien de renvoi avec décompte */}
                <div className="resend-row">
                  {countdown > 0 ? (
                    <span>
                      Renvoyer le code dans{" "}
                      <strong className="countdown-accent">{countdown}s</strong>
                    </span>
                  ) : (
                    <>
                      Vous n'avez pas reçu le code ?{" "}
                      <button className="resend-btn" onClick={resendOtp}>
                        Renvoyer
                      </button>
                    </>
                  )}
                </div>

                {/* Avertissement tentatives restantes */}
                {otpAttempts > 0 && otpAttempts < MAX_OTP_ATTEMPTS && (
                  <div className="attempts-warn">
                    <span>
                      {pluralize(remainingAttempts, "tentative")} restante{remainingAttempts > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Blocage après trop de tentatives */}
                {otpAttempts >= MAX_OTP_ATTEMPTS && (
                  <div className="attempts-warn">
                    <span>Trop de tentatives.</span>{" "}
                    <button
                      className="resend-btn resend-btn--gold"
                      onClick={resendOtp}
                      disabled={countdown > 0}
                    >
                      {countdown > 0
                        ? `Attendre ${countdown}s`
                        : "Demander un nouveau code"
                      }
                    </button>
                  </div>
                )}
              </div>

              {loading && (
                <div className="spinner-center">
                  <div className="spinner spinner--gold" />
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// ICÔNE CHECKMARK — extraite pour ne pas alourdir le JSX du stepper
// ══════════════════════════════════════════════════════════════════════════════

function CheckIcon() {
  return (
    <svg
      width="13" height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
