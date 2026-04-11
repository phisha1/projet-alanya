"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/toast"

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "chat" | "group"

interface ContactOption {
  id:       string
  name:     string
  initials: string
  color:    string
  online:   boolean
  email:    string
}

// ─── Mock data — TODO : GET /api/contacts ─────────────────────────────────────
const CONTACTS: ContactOption[] = [
  { id:"1", name:"Kevin Manga",      initials:"KM", color:"amber",  online:true,  email:"k.manga@enspy.cm"    },
  { id:"4", name:"Laure Ateba",      initials:"LA", color:"teal",   online:true,  email:"l.ateba@enspy.cm"    },
  { id:"3", name:"Dr. NANA BINKEU", initials:"NB", color:"violet", online:false, email:"nana.binkeu@enspy.cm" },
  { id:"5", name:"Paul Essomba",     initials:"PE", color:"rose",   online:false, email:"p.essomba@enspy.cm"  },
  { id:"6", name:"Nina Fouda",       initials:"NF", color:"amber",  online:false, email:"n.fouda@enspy.cm"    },
]

const COLORS: Record<string, {bg:string; fg:string}> = {
  amber:  { bg:"var(--av-0-bg)", fg:"var(--av-0-fg)" },
  blue:   { bg:"var(--av-1-bg)", fg:"var(--av-1-fg)" },
  violet: { bg:"var(--av-2-bg)", fg:"var(--av-2-fg)" },
  teal:   { bg:"var(--av-3-bg)", fg:"var(--av-3-fg)" },
  rose:   { bg:"var(--av-4-bg)", fg:"var(--av-4-fg)" },
}

// ─── Composant modal (utilisé dans /chats depuis un bouton "+" ) ────────────
export function NewChatModal({ onClose }: { onClose: () => void }) {
  const router  = useRouter()
  const { success } = useToast()

  const [mode, setMode]         = useState<Mode>("chat")
  const [search, setSearch]     = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState("")
  const [groupDesc, setGroupDesc] = useState("")
  const [step, setStep]         = useState<1|2>(1)  // pour la création de groupe
  const [loading, setLoading]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return CONTACTS.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else              next.add(id)
      return next
    })
  }

  // ── Démarrer un chat 1:1 ──
  const startChat = (contactId: string) => {
    // TODO : POST /api/chats { contactId } → retourne { id }
    router.push(`/chats/${contactId}`)
    onClose()
  }

  // ── Créer un groupe ──
  const createGroup = async () => {
    if (!groupName.trim() || selected.size < 2) return
    setLoading(true)
    try {
      // TODO : POST /api/chats { type:"group", name:groupName, description:groupDesc, members:[...selected] }
      await new Promise(r => setTimeout(r, 900))
      success(`Groupe « ${groupName} » créé`, `${selected.size} membres ajoutés`)
      router.push("/chats/2")   // ← id retourné par l'API
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const selectedContacts = CONTACTS.filter(c => selected.has(c.id))
  const canCreateGroup = groupName.trim().length >= 2 && selected.size >= 2

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@300;400;500&display=swap');

        .ncm-overlay {
          position: fixed; inset: 0; z-index: 8000;
          background: var(--overlay, #00000080);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; animation: ncmFade .15s ease;
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes ncmFade { from{opacity:0;}to{opacity:1;} }

        .ncm-card {
          background: var(--bg-surface, #0D1118);
          border: 1px solid var(--border-subtle, #1E2736);
          border-radius: 20px; width: 100%; max-width: 460px;
          max-height: 90vh; display: flex; flex-direction: column;
          overflow: hidden; box-shadow: 0 24px 64px #00000080;
          animation: ncmSlide .2s ease;
        }
        @keyframes ncmSlide { from{transform:translateY(-8px);opacity:0;}to{transform:none;opacity:1;} }

        /* Header */
        .ncm-head {
          padding: 20px 22px 0; flex-shrink: 0;
        }
        .ncm-title-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .ncm-title { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; letter-spacing:-.3px; }
        .ncm-close { background:none; border:none; cursor:pointer; color:var(--text-muted,#4B5563); padding:4px; display:flex; border-radius:6px; transition:color .15s; }
        .ncm-close:hover { color:var(--text-primary,#E2E8F0); }

        /* Mode tabs */
        .ncm-tabs { display:flex; background:var(--bg-elevated,#10151F); border-radius:10px; padding:3px; margin-bottom:14px; }
        .ncm-tab {
          flex:1; padding:8px; border-radius:7px; border:none; cursor:pointer;
          font-size:12px; font-weight:500; font-family:'DM Sans',sans-serif;
          transition:all .2s;
          background:transparent; color:var(--text-muted,#4B5563);
        }
        .ncm-tab.on { background:var(--bg-surface,#0D1118); color:var(--text-primary,#E2E8F0); box-shadow:0 1px 4px #0000003a; }

        /* Search */
        .ncm-search { position:relative; margin-bottom:12px; }
        .ncm-search svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--text-ghost,#2d3748); pointer-events:none; }
        .ncm-search input {
          width:100%; background:var(--bg-input,#10151F);
          border:1px solid var(--border-subtle,#1E2736); border-radius:9px;
          padding:9px 12px 9px 34px; font-size:12px;
          color:var(--text-primary,#E2E8F0); font-family:'DM Sans',sans-serif;
          outline:none; transition:border-color .2s;
        }
        .ncm-search input::placeholder { color:var(--text-ghost,#2d3748); }
        .ncm-search input:focus { border-color:var(--accent-border,#E8B84B40); }

        /* Selected chips (mode groupe) */
        .ncm-chips { display:flex; flex-wrap:wrap; gap:6px; padding-bottom:10px; min-height:0; }
        .ncm-chip {
          display:flex; align-items:center; gap:5px;
          background:var(--accent-dim,#E8B84B20); border:1px solid var(--accent-border,#E8B84B40);
          border-radius:20px; padding:3px 10px 3px 4px; cursor:pointer;
          transition:all .15s;
        }
        .ncm-chip:hover { background:var(--danger-dim,#ef444415); border-color:var(--danger-border,#ef444430); }
        .ncm-chip-av { width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:700; flex-shrink:0; }
        .ncm-chip-name { font-size:11px; color:var(--text-primary,#E2E8F0); font-weight:500; }

        /* Liste */
        .ncm-list { flex:1; overflow-y:auto; padding:2px 0; }
        .ncm-list::-webkit-scrollbar { width:3px; }
        .ncm-list::-webkit-scrollbar-thumb { background:var(--border-subtle,#1E2736); border-radius:3px; }

        .ncm-item {
          display:flex; align-items:center; gap:12px;
          padding:10px 22px; cursor:pointer; transition:background .1s;
          position:relative;
        }
        .ncm-item:hover { background:var(--bg-hover,#161C28); }
        .ncm-item.checked { background:var(--accent-dim,#E8B84B20); }

        .ncm-av { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; position:relative; }
        .ncm-av-dot { position:absolute; bottom:1px; right:1px; width:10px; height:10px; border-radius:50%; background:var(--success,#4ade80); border:2px solid var(--bg-surface,#0D1118); }
        .ncm-info { flex:1; min-width:0; }
        .ncm-name { font-size:13px; font-weight:500; color:var(--text-primary,#E2E8F0); margin-bottom:2px; }
        .ncm-email { font-size:11px; color:var(--text-muted,#4B5563); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        /* Checkbox */
        .ncm-check {
          width:20px; height:20px; border-radius:50%; border:2px solid var(--border-default,#2a3444);
          background:transparent; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          transition:all .15s;
        }
        .ncm-item.checked .ncm-check { background:var(--accent,#E8B84B); border-color:var(--accent,#E8B84B); }

        /* Étape 2 groupe — infos */
        .ncm-group-form { padding:0 22px 8px; }
        .gf-label { font-size:10px; color:var(--text-muted,#4B5563); letter-spacing:.5px; text-transform:uppercase; margin-bottom:6px; font-weight:500; display:block; }
        .gf-input {
          width:100%; background:var(--bg-input,#10151F);
          border:1px solid var(--border-subtle,#1E2736); border-radius:9px;
          padding:11px 13px; font-size:13px;
          color:var(--text-primary,#E2E8F0); font-family:'DM Sans',sans-serif;
          outline:none; transition:border-color .2s; margin-bottom:12px;
        }
        .gf-input::placeholder { color:var(--text-ghost,#2d3748); }
        .gf-input:focus { border-color:var(--accent-border,#E8B84B40); }
        .gf-members { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:4px; }
        .gf-member { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-secondary,#9CA3AF); background:var(--bg-elevated,#10151F); padding:3px 9px 3px 4px; border-radius:20px; }
        .gf-mav { width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:700; flex-shrink:0; }

        /* Footer */
        .ncm-foot { padding:14px 22px; border-top:1px solid var(--border-subtle,#1E2736); flex-shrink:0; display:flex; gap:8px; }
        .ncm-foot-back { flex:0 0 auto; background:var(--bg-elevated,#10151F); border:1px solid var(--border-default,#2a3444); border-radius:9px; padding:11px 16px; font-size:13px; color:var(--text-secondary,#9CA3AF); cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:500; transition:all .15s; }
        .ncm-foot-back:hover { background:var(--bg-hover,#161C28); }
        .ncm-foot-main { flex:1; background:var(--accent,#E8B84B); border:none; border-radius:9px; padding:11px; font-size:14px; font-weight:700; color:var(--accent-text,#080C14); cursor:pointer; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:7px; transition:opacity .15s; }
        .ncm-foot-main:hover:not(:disabled) { opacity:.88; }
        .ncm-foot-main:disabled { opacity:.4; cursor:not-allowed; }
        .spinner { width:14px; height:14px; border:2px solid #080C1440; border-top-color:#080C14; border-radius:50%; animation:spin .65s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg);} }

        /* Empty */
        .ncm-empty { text-align:center; color:var(--text-ghost,#2d3748); padding:40px 16px; font-size:12px; }
      `}</style>

      <div className="ncm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="ncm-card" role="dialog" aria-label={mode === "chat" ? "Nouveau message" : "Créer un groupe"}>

          <div className="ncm-head">
            <div className="ncm-title-row">
              <h2 className="ncm-title">
                {mode === "chat" ? "Nouveau message"
                  : step === 1 ? "Créer un groupe" : `Groupe — ${selected.size} membre${selected.size > 1 ? "s" : ""}`}
              </h2>
              <button className="ncm-close" onClick={onClose} aria-label="Fermer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Tabs mode */}
            {step === 1 && (
              <div className="ncm-tabs">
                <button className={`ncm-tab ${mode === "chat" ? "on" : ""}`} onClick={() => { setMode("chat"); setSelected(new Set()) }}>
                  💬 Message direct
                </button>
                <button className={`ncm-tab ${mode === "group" ? "on" : ""}`} onClick={() => { setMode("group"); setSelected(new Set()) }}>
                  👥 Nouveau groupe
                </button>
              </div>
            )}

            {/* Chips membres sélectionnés */}
            {mode === "group" && step === 1 && selected.size > 0 && (
              <div className="ncm-chips">
                {selectedContacts.map(c => {
                  const col = COLORS[c.color]
                  return (
                    <div key={c.id} className="ncm-chip" onClick={() => toggle(c.id)} title="Retirer">
                      <div className="ncm-chip-av" style={{ background:col.bg, color:col.fg }}>{c.initials}</div>
                      <span className="ncm-chip-name">{c.name.split(" ")[0]}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Recherche */}
            {step === 1 && (
              <div className="ncm-search">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  ref={inputRef}
                  placeholder={mode === "chat" ? "Chercher un contact…" : "Ajouter des membres…"}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
              </div>
            )}
          </div>

          {/* ── Étape 1 : liste des contacts ── */}
          {step === 1 && (
            <div className="ncm-list">
              {filtered.length === 0 && (
                <div className="ncm-empty">Aucun contact trouvé pour « {search} »</div>
              )}
              {filtered.map(c => {
                const col     = COLORS[c.color]
                const isChecked = selected.has(c.id)
                return (
                  <div
                    key={c.id}
                    className={`ncm-item ${isChecked ? "checked" : ""}`}
                    onClick={() => mode === "chat" ? startChat(c.id) : toggle(c.id)}
                  >
                    <div className="ncm-av" style={{ background:col.bg, color:col.fg }}>
                      {c.initials}
                      {c.online && <div className="ncm-av-dot" />}
                    </div>
                    <div className="ncm-info">
                      <div className="ncm-name">{c.name}</div>
                      <div className="ncm-email">{c.email}</div>
                    </div>
                    {mode === "group" && (
                      <div className="ncm-check">
                        {isChecked && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text,#080C14)" strokeWidth="3.5" strokeLinecap="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Étape 2 : infos du groupe ── */}
          {step === 2 && (
            <div className="ncm-list" style={{ overflow:"visible" }}>
              <div className="ncm-group-form">
                <label className="gf-label">Nom du groupe *</label>
                <input
                  className="gf-input"
                  placeholder="Ex: Groupe Alanya II"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                <label className="gf-label">Description (optionnel)</label>
                <textarea
                  className="gf-input"
                  placeholder="À quoi sert ce groupe ?"
                  value={groupDesc}
                  onChange={e => setGroupDesc(e.target.value)}
                  maxLength={200}
                  rows={3}
                  style={{ resize:"none", lineHeight:1.6 }}
                />
                <label className="gf-label">Membres ({selected.size})</label>
                <div className="gf-members">
                  {selectedContacts.map(c => {
                    const col = COLORS[c.color]
                    return (
                      <div key={c.id} className="gf-member">
                        <div className="gf-mav" style={{ background:col.bg, color:col.fg }}>{c.initials}</div>
                        {c.name.split(" ")[0]}
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize:10, color:"var(--text-ghost)", marginTop:6 }}>
                  + Vous (administrateur du groupe)
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          {mode === "group" && (
            <div className="ncm-foot">
              {step === 2 && (
                <button className="ncm-foot-back" onClick={() => setStep(1)}>← Retour</button>
              )}
              {step === 1 ? (
                <button
                  className="ncm-foot-main"
                  disabled={selected.size < 2}
                  onClick={() => setStep(2)}
                >
                  Suivant → {selected.size > 0 && `(${selected.size} membres)`}
                </button>
              ) : (
                <button
                  className="ncm-foot-main"
                  disabled={loading || !canCreateGroup}
                  onClick={createGroup}
                >
                  {loading
                    ? <><div className="spinner" />Création…</>
                    : <>Créer le groupe</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Page /chats/new (route directe) ─────────────────────────────────────────
export default function NewChatPage() {
  const router = useRouter()
  return <NewChatModal onClose={() => router.push("/chats")} />
}
