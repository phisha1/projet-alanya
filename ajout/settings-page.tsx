"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter }   from "next/navigation"
import { useToast }    from "@/components/toast"

// ─── Types ────────────────────────────────────────────────────────────────────
type SettingsSection =
  | "profile"
  | "security"
  | "notifications"
  | "appearance"
  | "privacy"
  | "about"

interface Profile {
  name:      string
  email:     string
  phone:     string
  statusMsg: string
  avatar:    string | null   // base64 ou URL
}

interface SecurityForm {
  currentPwd: string
  newPwd:     string
  confirmPwd: string
}

// ─── Mock data — TODO : GET /api/users/me ─────────────────────────────────────
const INITIAL_PROFILE: Profile = {
  name:      "Arsène Nguemo",
  email:     "a.nguemo@enspy.cm",
  phone:     "+237 6 90 12 34 56",
  statusMsg: "Ingénieur en formation 🚀",
  avatar:    null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function analyzePassword(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score:0, label:"", color:"#1E2736" }
  let score = 0
  if (pwd.length >= 8)           score++
  if (pwd.length >= 14)          score++
  if (/[A-Z]/.test(pwd))         score++
  if (/[0-9]/.test(pwd))         score++
  if (/[^A-Za-z0-9]/.test(pwd))  score++
  const levels = [
    { label:"Très faible", color:"#ef4444" },
    { label:"Faible",      color:"#f97316" },
    { label:"Moyen",       color:"#eab308" },
    { label:"Bon",         color:"#84cc16" },
    { label:"Fort",        color:"#22c55e" },
    { label:"Très fort",   color:"#E8B84B" },
  ]
  return { score, ...levels[Math.min(5, score)] }
}

// ─── Composants internes ───────────────────────────────────────────────────────

function SectionLink({
  id, label, icon, active, badge, onClick,
}: {
  id: SettingsSection; label: string; icon: React.ReactNode
  active: boolean; badge?: number; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            11,
        width:          "100%",
        padding:        "10px 12px",
        borderRadius:   9,
        background:     active ? "#E8B84B12" : "none",
        border:         `1px solid ${active ? "#E8B84B40" : "transparent"}`,
        cursor:         "pointer",
        color:          active ? "#E8B84B" : "#4B5563",
        fontSize:       13,
        fontWeight:     500,
        fontFamily:     "'DM Sans', sans-serif",
        textAlign:      "left",
        transition:     "all .15s",
        position:       "relative",
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#0D1118"; e.currentTarget.style.color = "#9CA3AF" } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "none";    e.currentTarget.style.color = "#4B5563" } }}
    >
      <span style={{ flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{ background:"#ef4444", color:"white", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:20 }}>
          {badge}
        </span>
      )}
      {active && (
        <div style={{
          position:"absolute", left:0, top:"20%", bottom:"20%",
          width:3, borderRadius:"0 2px 2px 0", background:"#E8B84B",
        }} />
      )}
    </button>
  )
}

function Field({
  label, value, onChange, type = "text", placeholder, maxLength, helper, error, disabled,
}: {
  label: string; value: string; onChange?: (v: string) => void
  type?: string; placeholder?: string; maxLength?: number
  helper?: string; error?: string; disabled?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display:"block", fontSize:11, color:"#4B5563", letterSpacing:".5px", textTransform:"uppercase", marginBottom:7, fontWeight:500 }}>
        {label}
        {maxLength && value && (
          <span style={{ float:"right", color: value.length > maxLength*0.9 ? "#fbbf24" : "#374151" }}>
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <div style={{ position:"relative" }}>
        <input
          type={type === "password" && showPwd ? "text" : type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:       "100%",
            background:  disabled ? "#0A0E17" : "#0D1118",
            border:      `1px solid ${error ? "#ef444460" : focused ? "#E8B84B50" : "#1E2736"}`,
            borderRadius: 10,
            padding:     type === "password" ? "12px 48px 12px 14px" : "12px 14px",
            fontSize:    13, color: disabled ? "#374151" : "white",
            fontFamily:  "'DM Sans', sans-serif",
            outline:     "none",
            transition:  "border-color .2s",
            boxSizing:   "border-box",
            cursor:      disabled ? "not-allowed" : "text",
          }}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{
              position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer",
              color:"#374151", fontSize:11, fontFamily:"'DM Sans', sans-serif",
              transition:"color .15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#E8B84B")}
            onMouseLeave={e => (e.currentTarget.style.color = "#374151")}
          >
            {showPwd ? "Masquer" : "Afficher"}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize:11, color:"#f87171", marginTop:5, display:"flex", alignItems:"center", gap:5 }}>
          <span>⚠</span>{error}
        </p>
      )}
      {helper && !error && (
        <p style={{ fontSize:11, color:"#374151", marginTop:5 }}>{helper}</p>
      )}
    </div>
  )
}

function Toggle({ value, onChange, label, description }: {
  value: boolean; onChange: (v: boolean) => void; label: string; description?: string
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid #1E2736" }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:"#E2E8F0", marginBottom:description?2:0 }}>{label}</div>
        {description && <div style={{ fontSize:11, color:"#374151", lineHeight:1.5 }}>{description}</div>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width:44, height:24, borderRadius:20, flexShrink:0,
          background:  value ? "#E8B84B" : "#1E2736",
          border:      "none", cursor:"pointer",
          position:    "relative", transition:"background .2s",
        }}
      >
        <div style={{
          position:   "absolute", top:3,
          left:       value ? 23 : 3,
          width:      18, height:18, borderRadius:"50%",
          background: value ? "#080C14" : "#374151",
          transition: "left .2s",
        }} />
      </button>
    </div>
  )
}

function DangerZoneItem({ label, description, buttonLabel, onClick, destructive = false }: {
  label: string; description: string; buttonLabel: string
  onClick: () => void; destructive?: boolean
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", background:"#0D1118", border:"1px solid #1E2736", borderRadius:10, marginBottom:10 }}>
      <div style={{ flex:1, minWidth:0, marginRight:20 }}>
        <div style={{ fontSize:13, fontWeight:500, color: destructive ? "#f87171" : "#E2E8F0", marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:11, color:"#374151", lineHeight:1.5 }}>{description}</div>
      </div>
      <button
        onClick={onClick}
        style={{
          background:  destructive ? "#ef444415" : "#1E2736",
          border:      `1px solid ${destructive ? "#ef444440" : "#2a3444"}`,
          borderRadius: 8,
          padding:     "8px 14px",
          fontSize:    12, fontWeight:600,
          color:       destructive ? "#f87171" : "#9CA3AF",
          cursor:      "pointer",
          fontFamily:  "'DM Sans', sans-serif",
          whiteSpace:  "nowrap",
          transition:  "all .15s",
          flexShrink:  0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = destructive ? "#ef444425" : "#2a3444" }}
        onMouseLeave={e => { e.currentTarget.style.background = destructive ? "#ef444415" : "#1E2736" }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router  = useRouter()
  const { success, error: toastError, info, warning } = useToast()

  const [section, setSection] = useState<SettingsSection>("profile")
  const [saving, setSaving]   = useState(false)
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE)
  const [draft, setDraft]     = useState<Profile>(INITIAL_PROFILE)
  const [security, setSecurity] = useState<SecurityForm>({ currentPwd:"", newPwd:"", confirmPwd:"" })

  // Notifications
  const [notifMessages, setNotifMessages]   = useState(true)
  const [notifCalls, setNotifCalls]         = useState(true)
  const [notifSounds, setNotifSounds]       = useState(true)
  const [notifPreview, setNotifPreview]     = useState(true)

  // Confidentialité
  const [readReceipts, setReadReceipts]     = useState(true)
  const [onlineStatus, setOnlineStatus]     = useState(true)
  const [lastSeen, setLastSeen]             = useState(true)
  const [profileVisible, setProfileVisible] = useState(true)

  // Apparence
  const [fontSize, setFontSize]             = useState<"small"|"medium"|"large">("medium")
  const [language, setLanguage]             = useState("fr")

  const fileRef = useRef<HTMLInputElement>(null)
  const isDirty = JSON.stringify(profile) !== JSON.stringify(draft)
  const pwdStrength = analyzePassword(security.newPwd)

  const setD = (k: keyof Profile) => (v: string) => setDraft(prev => ({ ...prev, [k]: v }))

  // ── Sauvegarder le profil ──
  const saveProfile = async () => {
    if (!draft.name.trim()) return toastError("Nom invalide", "Le nom ne peut pas être vide.")
    if (draft.statusMsg.length > 100) return toastError("Message trop long", "Maximum 100 caractères.")
    setSaving(true)
    try {
      // TODO : PATCH /api/users/me
      await new Promise(r => setTimeout(r, 900))
      setProfile(draft)
      success("Profil mis à jour", "Vos informations ont bien été enregistrées.")
    } catch {
      toastError("Erreur", "Impossible de sauvegarder. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  // ── Upload avatar ──
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) return toastError("Fichier trop volumineux", "L'avatar ne doit pas dépasser 5 Mo.")
    if (!file.type.startsWith("image/")) return toastError("Format invalide", "Choisissez une image (JPEG, PNG, WebP).")
    const reader = new FileReader()
    reader.onload = () => {
      setDraft(prev => ({ ...prev, avatar: reader.result as string }))
      info("Avatar sélectionné", "Cliquez sur 'Sauvegarder' pour confirmer.")
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  // ── Changer le mot de passe ──
  const changePassword = async () => {
    if (!security.currentPwd)     return toastError("Mot de passe actuel requis")
    if (pwdStrength.score < 2)    return toastError("Mot de passe trop faible", "Choisissez un mot de passe plus sécurisé.")
    if (security.newPwd !== security.confirmPwd) return toastError("Les mots de passe ne correspondent pas")
    if (security.newPwd === security.currentPwd) return toastError("Mot de passe identique", "Choisissez un mot de passe différent.")
    setSaving(true)
    try {
      // TODO : POST /api/auth/change-password
      await new Promise(r => setTimeout(r, 1000))
      setSecurity({ currentPwd:"", newPwd:"", confirmPwd:"" })
      success("Mot de passe modifié", "Votre nouveau mot de passe est actif.")
    } catch {
      toastError("Erreur", "Mot de passe actuel incorrect.")
    } finally {
      setSaving(false)
    }
  }

  // ── Déconnexion de tous les appareils ──
  const logoutAll = async () => {
    if (!confirm("Déconnecter tous vos appareils ?")) return
    // TODO : POST /api/auth/logout-all (révoque tous les refresh tokens)
    await fetch("/api/auth/logout-all", { method:"POST", credentials:"same-origin" })
    router.push("/login")
  }

  // ── Supprimer le compte ──
  const deleteAccount = () => {
    const confirm1 = window.prompt('Tapez "SUPPRIMER" pour confirmer la suppression définitive de votre compte.')
    if (confirm1 !== "SUPPRIMER") return toastError("Suppression annulée")
    // TODO : DELETE /api/users/me
    warning("Compte supprimé", "Vos données seront effacées dans 30 jours.")
    setTimeout(() => router.push("/welcome"), 2000)
  }

  // ─── Navigation sections ───────────────────────────────────────────────────
  const NAV: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id:"profile", label:"Profil", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id:"security", label:"Sécurité", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { id:"notifications", label:"Notifications", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
    { id:"privacy", label:"Confidentialité", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id:"appearance", label:"Apparence", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> },
    { id:"about", label:"À propos", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .settings-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh; background: #080C14; color: white;
          display: grid; grid-template-columns: 230px 1fr;
        }

        /* ── Sidebar ── */
        .s-sidebar {
          border-right: 1px solid #1E2736;
          padding: 28px 14px;
          display: flex; flex-direction: column; gap: 4px;
          position: sticky; top: 0; height: 100vh;
          overflow-y: auto;
        }
        .s-back {
          display: flex; align-items: center; gap: 8px;
          color: #4B5563; font-size: 12px; cursor: pointer;
          background: none; border: none; padding: 8px 10px;
          border-radius: 8px; font-family: 'DM Sans', sans-serif;
          transition: color .15s, background .15s; margin-bottom: 16px;
          width: 100%; text-align: left;
        }
        .s-back:hover { color: #9CA3AF; background: #0D1118; }
        .s-nav-title {
          font-size: 9px; color: #2d3748; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 8px 12px 4px; font-weight: 500;
        }

        /* ── Main ── */
        .s-main { padding: 36px 48px; max-width: 680px; }

        .s-page-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 26px; font-weight: 800; letter-spacing: -1px;
          color: #fff; margin-bottom: 6px;
        }
        .s-page-sub { font-size: 13px; color: #374151; margin-bottom: 32px; line-height: 1.6; }

        /* ── Section card ── */
        .s-card {
          background: #0D1118; border: 1px solid #1E2736;
          border-radius: 14px; padding: 22px 24px; margin-bottom: 16px;
        }
        .s-card-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 14px; font-weight: 700; color: #fff;
          letter-spacing: -.3px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .s-card-title-badge {
          font-size: 9px; background: #1E2736; color: #4B5563;
          padding: 2px 8px; border-radius: 5px; font-weight: 500;
          font-family: 'DM Sans', sans-serif; letter-spacing: .3px;
        }

        /* avatar */
        .avatar-section {
          display: flex; align-items: center; gap: 20px; margin-bottom: 24px;
        }
        .avatar-wrap { position: relative; cursor: pointer; }
        .avatar-circle {
          width: 72px; height: 72px; border-radius: 50%;
          background: #E8B84B22; color: #E8B84B;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px; font-weight: 800;
          overflow: hidden;
        }
        .avatar-edit-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: #00000070; display: flex; align-items: center;
          justify-content: center; opacity: 0; transition: opacity .15s;
          cursor: pointer;
        }
        .avatar-wrap:hover .avatar-edit-overlay { opacity: 1; }
        .avatar-info { flex: 1; }
        .avatar-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 18px; font-weight: 800; color: #fff;
          letter-spacing: -.3px; margin-bottom: 3px;
        }
        .avatar-email { font-size: 12px; color: #374151; margin-bottom: 10px; }
        .avatar-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #1E2736; border: 1px solid #2a3444;
          border-radius: 8px; padding: 7px 14px;
          font-size: 12px; color: #9CA3AF; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          transition: all .15s;
        }
        .avatar-btn:hover { background: #2a3444; color: #E2E8F0; }

        /* save bar */
        .save-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; background: #E8B84B12;
          border: 1px solid #E8B84B30; border-radius: 10px;
          margin-bottom: 16px;
          animation: fadeIn .2s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
        .save-bar-txt { font-size: 13px; color: #E8B84B; font-weight: 500; }
        .save-btns { display: flex; gap: 8px; }
        .btn-discard {
          background: none; border: 1px solid #2a3444; border-radius: 8px;
          padding: 8px 16px; font-size: 12px; color: "#4B5563"; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 500; color: #4B5563;
          transition: all .15s;
        }
        .btn-discard:hover { background: #1E2736; color: #9CA3AF; }
        .btn-save {
          background: #E8B84B; border: none; border-radius: 8px;
          padding: 8px 18px; font-size: 12px; color: #080C14;
          font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 6px; transition: opacity .15s;
        }
        .btn-save:hover:not(:disabled) { opacity: .88; }
        .btn-save:disabled { opacity: .5; cursor: not-allowed; }

        /* strength meter */
        .strength-bar { height: 3px; background: #1E2736; border-radius: 99px; overflow: hidden; margin-bottom: 5px; }
        .strength-fill { height: 100%; border-radius: 99px; transition: width .35s, background .35s; }

        /* font size selector */
        .font-opts { display: flex; gap: 8px; }
        .font-opt {
          flex: 1; padding: 10px 12px; border-radius: 9px;
          border: 1px solid #1E2736; background: #0D1118;
          cursor: pointer; text-align: center; transition: all .15s;
          font-family: 'DM Sans', sans-serif;
        }
        .font-opt:hover { border-color: #2a3444; }
        .font-opt.on { border-color: #E8B84B50; background: #E8B84B12; }
        .font-opt-label { font-size: 11px; color: #4B5563; margin-top: 4px; }
        .font-opt.on .font-opt-label { color: #E8B84B; }

        @media (max-width: 860px) {
          .settings-root { grid-template-columns: 1fr; }
          .s-sidebar { display: none; }
          .s-main { padding: 24px 20px; }
        }
      `}</style>

      <input ref={fileRef} type="file" style={{ display:"none" }} accept="image/*" onChange={handleAvatarUpload} />

      <div className="settings-root">

        {/* ── Sidebar navigation ── */}
        <aside className="s-sidebar">
          <button className="s-back" onClick={() => router.back()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Retour
          </button>

          <div className="s-nav-title">Paramètres</div>

          {NAV.map(n => (
            <SectionLink
              key={n.id} id={n.id} label={n.label} icon={n.icon}
              active={section === n.id}
              onClick={() => setSection(n.id)}
            />
          ))}
        </aside>

        {/* ── Contenu principal ── */}
        <main className="s-main">

          {/* ══ PROFIL ════════════════════════════════════════════════════════ */}
          {section === "profile" && (
            <>
              <div className="s-page-title">Mon profil</div>
              <p className="s-page-sub">Ces informations sont visibles par vos contacts sur Alanya.</p>

              {/* Barre de sauvegarde */}
              {isDirty && (
                <div className="save-bar">
                  <span className="save-bar-txt">⚡ Modifications non sauvegardées</span>
                  <div className="save-btns">
                    <button className="btn-discard" onClick={() => setDraft(profile)}>Annuler</button>
                    <button className="btn-save" onClick={saveProfile} disabled={saving}>
                      {saving && <div style={{ width:12, height:12, border:"2px solid #080C1440", borderTopColor:"#080C14", borderRadius:"50%", animation:"spin .65s linear infinite" }} />}
                      {saving ? "Sauvegarde…" : "Sauvegarder"}
                    </button>
                  </div>
                </div>
              )}

              <div className="s-card">
                {/* Avatar */}
                <div className="avatar-section">
                  <div className="avatar-wrap" onClick={() => fileRef.current?.click()}>
                    <div className="avatar-circle">
                      {draft.avatar
                        ? <img src={draft.avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : draft.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                      }
                    </div>
                    <div className="avatar-edit-overlay">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  </div>
                  <div className="avatar-info">
                    <div className="avatar-name">{profile.name}</div>
                    <div className="avatar-email">{profile.email}</div>
                    <button className="avatar-btn" onClick={() => fileRef.current?.click()}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                      </svg>
                      Changer la photo
                    </button>
                  </div>
                </div>

                <Field label="Nom complet"       value={draft.name}      onChange={setD("name")}      maxLength={60}  placeholder="Votre nom" />
                <Field label="Message de statut"  value={draft.statusMsg} onChange={setD("statusMsg")} maxLength={100} placeholder="Ce que vous faites en ce moment…" helper="Visible par tous vos contacts." />
              </div>

              <div className="s-card">
                <div className="s-card-title">Informations de contact <span className="s-card-title-badge">Non modifiables ici</span></div>
                <Field label="Adresse e-mail" value={draft.email} disabled helper="Contactez le support pour modifier votre e-mail." />
                <Field label="Téléphone"      value={draft.phone} disabled helper="Le numéro est lié à votre compte et ne peut pas être changé." />
              </div>
            </>
          )}

          {/* ══ SÉCURITÉ ══════════════════════════════════════════════════════ */}
          {section === "security" && (
            <>
              <div className="s-page-title">Sécurité</div>
              <p className="s-page-sub">Gérez votre mot de passe et la sécurité de votre compte.</p>

              <div className="s-card">
                <div className="s-card-title">Changer le mot de passe</div>
                <Field label="Mot de passe actuel" value={security.currentPwd} onChange={v => setSecurity(p=>({...p,currentPwd:v}))} type="password" placeholder="••••••••" />
                <Field label="Nouveau mot de passe" value={security.newPwd}     onChange={v => setSecurity(p=>({...p,newPwd:v}))}     type="password" placeholder="Choisissez un mot de passe fort" />

                {security.newPwd && (
                  <div style={{ marginTop:-10, marginBottom:16 }}>
                    <div className="strength-bar">
                      <div className="strength-fill" style={{ width:`${(pwdStrength.score/5)*100}%`, background:pwdStrength.color }} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                      <span style={{ color:pwdStrength.color, fontWeight:500 }}>{pwdStrength.label}</span>
                    </div>
                  </div>
                )}

                <Field
                  label="Confirmer le nouveau mot de passe" value={security.confirmPwd}
                  onChange={v => setSecurity(p=>({...p,confirmPwd:v}))} type="password"
                  placeholder="Répétez le mot de passe"
                  error={security.confirmPwd && security.newPwd !== security.confirmPwd ? "Les mots de passe ne correspondent pas" : undefined}
                />

                <button
                  onClick={changePassword}
                  disabled={saving || !security.currentPwd || !security.newPwd || security.newPwd !== security.confirmPwd || pwdStrength.score < 2}
                  style={{
                    background:"#E8B84B", border:"none", borderRadius:9, padding:"12px 24px",
                    fontSize:14, fontWeight:700, color:"#080C14", cursor:"pointer",
                    fontFamily:"'DM Sans', sans-serif", display:"flex", alignItems:"center", gap:7,
                    opacity: saving || !security.currentPwd || !security.newPwd || security.newPwd !== security.confirmPwd || pwdStrength.score < 2 ? .4 : 1,
                    transition:"opacity .15s",
                  }}
                >
                  {saving ? "Modification…" : "Modifier le mot de passe"}
                </button>
              </div>

              <div className="s-card">
                <div className="s-card-title">Sessions actives</div>
                {[
                  { device:"Chrome · Windows 11",         location:"Yaoundé, CM", current:true,  ts:"Maintenant" },
                  { device:"Firefox · Ubuntu 22",          location:"Yaoundé, CM", current:false, ts:"Il y a 2 h"  },
                  { device:"Alanya Mobile · Android 13",   location:"Douala, CM",  current:false, ts:"Hier 20:14"  },
                ].map((s, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom: i < 2 ? "1px solid #1E2736" : "none" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:"#1E2736", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round">
                          {s.device.includes("Mobile") ? <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></> : <><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/></>}
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:"#E2E8F0", display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                          {s.device}
                          {s.current && <span style={{ fontSize:9, background:"#4ade8020", color:"#4ade80", padding:"2px 7px", borderRadius:4, fontWeight:600 }}>Appareil actuel</span>}
                        </div>
                        <div style={{ fontSize:11, color:"#374151" }}>{s.location} · {s.ts}</div>
                      </div>
                    </div>
                    {!s.current && (
                      <button onClick={() => { warning("Session fermée", `${s.device} a été déconnecté.`) }} style={{ background:"#ef444415", border:"1px solid #ef444430", borderRadius:7, padding:"6px 12px", fontSize:11, color:"#f87171", cursor:"pointer", fontFamily:"'DM Sans', sans-serif", fontWeight:500, transition:"all .15s" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="#ef444425")} onMouseLeave={e=>(e.currentTarget.style.background="#ef444415")}>
                        Déconnecter
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="s-card">
                <div className="s-card-title" style={{ color:"#f87171", display:"flex", alignItems:"center", gap:8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Zone dangereuse
                </div>
                <DangerZoneItem label="Déconnecter tous les appareils" description="Invalide tous les refresh tokens actifs sur tous vos appareils." buttonLabel="Déconnecter tout" onClick={logoutAll} />
                <DangerZoneItem label="Supprimer mon compte" description="Action irréversible. Toutes vos données seront effacées définitivement après 30 jours." buttonLabel="Supprimer le compte" onClick={deleteAccount} destructive />
              </div>
            </>
          )}

          {/* ══ NOTIFICATIONS ═════════════════════════════════════════════════ */}
          {section === "notifications" && (
            <>
              <div className="s-page-title">Notifications</div>
              <p className="s-page-sub">Choisissez ce que vous voulez recevoir et comment.</p>
              <div className="s-card">
                <div className="s-card-title">Notifications push</div>
                <Toggle value={notifMessages} onChange={setNotifMessages} label="Messages" description="Recevoir une notification pour chaque nouveau message." />
                <Toggle value={notifCalls}    onChange={setNotifCalls}    label="Appels entrants" description="Être notifié des appels audio et vidéo." />
                <Toggle value={notifSounds}   onChange={setNotifSounds}   label="Sons" description="Jouer un son à la réception d'un message." />
                <Toggle value={notifPreview}  onChange={setNotifPreview}  label="Aperçu du message" description="Afficher le début du message dans la notification." />
              </div>
            </>
          )}

          {/* ══ CONFIDENTIALITÉ ═══════════════════════════════════════════════ */}
          {section === "privacy" && (
            <>
              <div className="s-page-title">Confidentialité</div>
              <p className="s-page-sub">Contrôlez ce que les autres peuvent voir sur vous.</p>
              <div className="s-card">
                <div className="s-card-title">Visibilité</div>
                <Toggle value={readReceipts}  onChange={v => { setReadReceipts(v); v ? info("Confirmations de lecture activées") : info("Confirmations de lecture désactivées") }}  label="Confirmations de lecture" description="Envoyer les ✓✓ bleus quand vous lisez un message." />
                <Toggle value={onlineStatus}  onChange={v => { setOnlineStatus(v); v ? info("Statut en ligne visible") : info("Statut en ligne masqué") }}                           label="Statut en ligne" description="Afficher 'En ligne' quand vous utilisez Alanya." />
                <Toggle value={lastSeen}      onChange={v => { setLastSeen(v); v ? info("Dernière connexion visible") : info("Dernière connexion masquée") }}                        label="Dernière connexion" description="Afficher quand vous avez été vu pour la dernière fois." />
                <Toggle value={profileVisible} onChange={v => { setProfileVisible(v); v ? info("Photo de profil visible") : info("Photo de profil masquée") }}                     label="Photo de profil" description="Rendre votre avatar visible par vos contacts." />
              </div>
            </>
          )}

          {/* ══ APPARENCE ═════════════════════════════════════════════════════ */}
          {section === "appearance" && (
            <>
              <div className="s-page-title">Apparence</div>
              <p className="s-page-sub">Personnalisez l'interface selon vos préférences.</p>
              <div className="s-card">
                <div className="s-card-title">Taille du texte</div>
                <div className="font-opts">
                  {(["small","medium","large"] as const).map(size => (
                    <button key={size} className={`font-opt ${fontSize===size?"on":""}`} onClick={() => { setFontSize(size); info(`Taille ${size === "small" ? "petite" : size === "medium" ? "normale" : "grande"} activée`) }}>
                      <div style={{ fontSize: size==="small"?14:size==="medium"?17:21, color: fontSize===size?"#E8B84B":"#E2E8F0", fontFamily:"'Bricolage Grotesque', sans-serif", fontWeight:700, lineHeight:1 }}>Aa</div>
                      <div className="font-opt-label">{size==="small"?"Petite":size==="medium"?"Normale":"Grande"}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="s-card">
                <div className="s-card-title">Langue</div>
                <select value={language} onChange={e => { setLanguage(e.target.value); info("Langue modifiée") }}
                  style={{ width:"100%", background:"#0D1118", border:"1px solid #1E2736", borderRadius:10, padding:"12px 14px", fontSize:13, color:"white", fontFamily:"'DM Sans', sans-serif", outline:"none" }}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </>
          )}

          {/* ══ À PROPOS ══════════════════════════════════════════════════════ */}
          {section === "about" && (
            <>
              <div className="s-page-title">À propos</div>
              <p className="s-page-sub">Informations sur l'application Alanya.</p>
              <div className="s-card">
                {[
                  { label:"Application",     value:"Alanya" },
                  { label:"Version",         value:"1.0.0-beta" },
                  { label:"Environnement",   value:"Production" },
                  { label:"Projet",          value:"Projet BD — ENSPY 2025–2026" },
                  { label:"Encadrant",       value:"Dr. NANA BINKEU" },
                  { label:"Groupe",          value:"Alanya II" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid #1E2736" }}>
                    <span style={{ fontSize:13, color:"#4B5563" }}>{label}</span>
                    <span style={{ fontSize:13, color:"#E2E8F0", fontWeight:500 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="s-card">
                <div className="s-card-title">Stack technique</div>
                {[
                  { label:"Front-end",   value:"Next.js 14 · React Native (Expo)" },
                  { label:"Back-end",    value:"Spring Boot 3 · Microservices" },
                  { label:"Base de données", value:"PostgreSQL 15" },
                  { label:"Temps réel",  value:"WebSocket (STOMP) · Apache Kafka" },
                  { label:"Appels A/V",  value:"WebRTC + serveur TURN/STUN" },
                  { label:"Auth",        value:"JWT (Access 15 min · Refresh 7 j)" },
                  { label:"Déploiement", value:"Docker · Vercel · Cloudflare Tunnel" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid #1E2736", gap:16 }}>
                    <span style={{ fontSize:12, color:"#4B5563", flexShrink:0 }}>{label}</span>
                    <span style={{ fontSize:12, color:"#9CA3AF", fontWeight:500, textAlign:"right" }}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
