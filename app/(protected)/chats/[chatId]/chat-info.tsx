import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useToast } from "../../../../src/components/toast"
import { findLocalGroup } from "../../../../src/data/local-groups"
import { loadContacts } from "../../../../src/data/contacts"
import { MOCK_CHAT_INFOS, CHAT_COLORS } from "../../../../src/mocks/chat-data"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Member {
  id:       string
  name:     string
  initials: string
  color:    string
  role:     "admin" | "member"
  online:   boolean
}

interface SharedFile {
  id:       string
  name:     string
  size:     string
  type:     "pdf" | "image" | "audio" | "other"
  ts:       string
  sender:   string
}

interface ConvInfo {
  id:         string
  name:       string
  initials:   string
  color:      string
  isGroup:    boolean
  description?: string
  members:    Member[]
  createdAt:  string
  files:      SharedFile[]
  online?:    boolean       // pour les 1:1
  statusMsg?: string
}

// ─── Mock data — TODO : GET /api/chats/:id ────────────────────────────────────
const MOCK_INFO: ConvInfo = {
  id: "2",
  name: "Groupe Alanya II",
  initials: "GA",
  color: "blue",
  isGroup: true,
  description: "Groupe de travail pour le projet de messagerie instantanée — Projet BD ENSPY 2025–2026",
  createdAt: "15 janvier 2026",
  members: [
    { id:"me",  name:"Arsène Nguemo",   initials:"AN", color:"amber",  role:"admin",  online:true  },
    { id:"1",   name:"Kevin Manga",     initials:"KM", color:"amber",  role:"admin",  online:true  },
    { id:"4",   name:"Laure Ateba",     initials:"LA", color:"teal",   role:"member", online:true  },
    { id:"5",   name:"Paul Essomba",    initials:"PE", color:"rose",   role:"member", online:false },
    { id:"6",   name:"Nina Fouda",      initials:"NF", color:"amber",  role:"member", online:false },
  ],
  files: [
    { id:"f1", name:"rapport_architecture.pdf", size:"1.2 Mo", type:"pdf",   ts:"Hier 10:41",  sender:"Kevin Manga"   },
    { id:"f2", name:"schema_bd_final.pdf",       size:"856 Ko", type:"pdf",   ts:"Lun. 14:22",  sender:"Paul Essomba"  },
    { id:"f3", name:"maquettes_ui.png",           size:"2.4 Mo", type:"image", ts:"Dim. 09:15",  sender:"Laure Ateba"   },
    { id:"f4", name:"reunion_notes.pdf",          size:"312 Ko", type:"pdf",   ts:"Sam. 16:30",  sender:"Arsène Nguemo" },
  ],
}

const COLORS: Record<string, {bg:string; fg:string}> = {
  amber:  { bg:"var(--av-0-bg)", fg:"var(--av-0-fg)" },
  blue:   { bg:"var(--av-1-bg)", fg:"var(--av-1-fg)" },
  violet: { bg:"var(--av-2-bg)", fg:"var(--av-2-fg)" },
  teal:   { bg:"var(--av-3-bg)", fg:"var(--av-3-fg)" },
  rose:   { bg:"var(--av-4-bg)", fg:"var(--av-4-fg)" },
}

function FileIcon({ type }: { type: SharedFile["type"] }) {
  const paths: Record<SharedFile["type"], React.ReactNode> = {
    pdf:   <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    audio: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    other: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  }
  const colors: Record<SharedFile["type"], string> = {
    pdf:"var(--danger)", image:"#a78bfa", audio:"var(--success)", other:"var(--text-secondary)",
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={colors[type]} strokeWidth="1.8" strokeLinecap="round">
      {paths[type]}
    </svg>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────
interface ConvInfoPanelProps {
  convId?:  string
  onClose?: () => void
  info?:    ConvInfo   // si déjà chargé
}

export function ConvInfoPanel({ convId, onClose, info: propInfo }: ConvInfoPanelProps) {
  const navigate = useNavigate()
  const { success, warning, info } = useToast()

  // TODO : si propInfo est undefined → fetch GET /api/chats/:convId
  const conv = propInfo ?? MOCK_INFO

  const [tab, setTab]           = useState<"membres"|"fichiers">("membres")
  const [muteNotifs, setMute]   = useState(false)
  const [members, setMembers]   = useState<Member[]>(conv.members)
  const [addMember, setAddMember] = useState("")

  const color = COLORS[conv.color]
  const isAdmin = members.find(m => m.id === "me")?.role === "admin"

  const removeMember = (id: string) => {
    const m = members.find(m => m.id === id)!
    if (!confirm(`Exclure ${m.name} du groupe ?`)) return
    setMembers(prev => prev.filter(m => m.id !== id))
    warning(`${m.name} retiré du groupe`)
    // TODO : DELETE /api/chats/:convId/members/:memberId
  }

  const leaveGroup = () => {
    if (!confirm("Quitter le groupe ?")) return
    // TODO : POST /api/chats/:convId/leave
    success("Vous avez quitté le groupe")
    navigate("/chats")
  }

  const deleteConv = () => {
    if (!confirm("Supprimer cette conversation ? Cette action est irréversible.")) return
    // TODO : DELETE /api/chats/:convId
    warning("Conversation supprimée")
    navigate("/chats")
  }

  const promoteAdmin = (id: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role:"admin" } : m))
    const m = members.find(m => m.id === id)!
    info(`${m.name} est maintenant administrateur`)
    // TODO : PATCH /api/chats/:convId/members/:memberId { role:"admin" }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .cip-root {
          font-family: 'DM Sans', sans-serif;
          width: 320px; height: 100vh;
          background: var(--bg-surface, var(--bg-surface));
          border-left: 1px solid var(--border-subtle, var(--border-subtle));
          display: flex; flex-direction: column;
          color: var(--text-primary, var(--text-primary));
          flex-shrink: 0;
        }

        /* Header */
        .cip-head {
          padding: 16px 18px;
          border-bottom: 1px solid var(--border-subtle, var(--border-subtle));
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }
        .cip-back {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted, var(--text-muted)); padding: 5px;
          border-radius: 7px; display: flex; transition: all .15s;
        }
        .cip-back:hover { background:var(--bg-elevated,var(--bg-elevated)); color:var(--text-primary,var(--text-primary)); }
        .cip-head-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; letter-spacing:-.3px; }

        /* Avatar + nom */
        .cip-hero { padding:24px 18px 16px; text-align:center; flex-shrink:0; }
        .cip-av { width:68px; height:68px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; margin:0 auto 14px; position:relative; }
        .cip-av-dot { position:absolute; bottom:2px; right:2px; width:13px; height:13px; border-radius:50%; background:var(--success,var(--success)); border:3px solid var(--bg-surface,var(--bg-surface)); }
        .cip-name { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; letter-spacing:-.5px; margin-bottom:5px; }
        .cip-sub { font-size:12px; color:var(--text-muted,var(--text-muted)); line-height:1.5; margin-bottom:16px; }
        .cip-actions { display:flex; justify-content:center; gap:16px; }
        .ca-btn { display:flex; flex-direction:column; align-items:center; gap:5px; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .ca-icon { width:42px; height:42px; border-radius:50%; background:var(--bg-elevated,var(--bg-elevated)); border:1px solid var(--border-subtle,var(--border-subtle)); display:flex; align-items:center; justify-content:center; transition:all .15s; color:var(--accent,var(--accent)); }
        .ca-btn:hover .ca-icon { background:var(--accent-dim,var(--accent-dim)); border-color:var(--accent-border,var(--accent-border)); }
        .ca-label { font-size:10px; color:var(--text-muted,var(--text-muted)); }

        /* Body scrollable */
        .cip-body { flex:1; overflow-y:auto; }
        .cip-body::-webkit-scrollbar { width:3px; }
        .cip-body::-webkit-scrollbar-thumb { background:var(--border-subtle,var(--border-subtle)); border-radius:3px; }

        /* Section */
        .cip-section { padding:14px 18px; border-bottom:1px solid var(--border-subtle,var(--border-subtle)); }
        .cip-section-title { font-size:10px; color:var(--text-muted,var(--text-muted)); letter-spacing:1px; text-transform:uppercase; font-weight:500; margin-bottom:10px; }

        /* Toggle notifs */
        .notif-row { display:flex; align-items:center; justify-content:space-between; }
        .notif-label { font-size:13px; color:var(--text-primary,var(--text-primary)); }
        .tgl { width:38px; height:21px; border-radius:20px; border:none; cursor:pointer; position:relative; transition:background .2s; }
        .tgl-knob { position:absolute; top:2.5px; width:16px; height:16px; border-radius:50%; transition:left .2s; }

        /* Tabs */
        .cip-tabs { display:flex; background:var(--bg-elevated,var(--bg-elevated)); border-radius:8px; padding:2px; margin:0 18px 12px; }
        .cip-tab { flex:1; padding:6px; border-radius:6px; border:none; cursor:pointer; font-size:11px; font-weight:500; font-family:'DM Sans',sans-serif; transition:all .2s; background:transparent; color:var(--text-muted,var(--text-muted)); }
        .cip-tab.on { background:var(--bg-surface,var(--bg-surface)); color:var(--text-primary,var(--text-primary)); }

        /* Members */
        .member-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-subtle,var(--border-subtle)); }
        .member-item:last-child { border-bottom:none; }
        .m-av { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; position:relative; }
        .m-dot { position:absolute; bottom:0; right:0; width:8px; height:8px; border-radius:50%; background:var(--success,var(--success)); border:2px solid var(--bg-surface,var(--bg-surface)); }
        .m-info { flex:1; min-width:0; }
        .m-name { font-size:12px; font-weight:500; color:var(--text-primary,var(--text-primary)); display:flex; align-items:center; gap:5px; }
        .m-role { font-size:9px; background:var(--accent-dim,var(--accent-dim)); color:var(--accent,var(--accent)); padding:1px 6px; border-radius:4px; font-weight:600; }
        .m-role.me-badge { background:var(--info-dim,var(--info-dim)); color:var(--info,var(--info)); }
        .m-actions { display:flex; gap:3px; }
        .m-action { background:none; border:none; cursor:pointer; color:var(--text-muted,var(--text-muted)); padding:4px; border-radius:5px; display:flex; transition:all .15s; }
        .m-action:hover { background:var(--bg-elevated,var(--bg-elevated)); color:var(--text-primary,var(--text-primary)); }
        .m-action.danger:hover { color:var(--danger,var(--danger)); background:var(--danger-dim,var(--danger-dim)); }

        /* Files */
        .file-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-subtle,var(--border-subtle)); cursor:pointer; transition:opacity .15s; }
        .file-item:last-child { border-bottom:none; }
        .file-item:hover { opacity:.8; }
        .f-icon { width:34px; height:34px; border-radius:8px; background:var(--bg-elevated,var(--bg-elevated)); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .f-info { flex:1; min-width:0; }
        .f-name { font-size:12px; font-weight:500; color:var(--text-primary,var(--text-primary)); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:2px; }
        .f-meta { font-size:10px; color:var(--text-muted,var(--text-muted)); }
        .f-dl { background:none; border:none; cursor:pointer; color:var(--text-muted,var(--text-muted)); padding:4px; border-radius:5px; display:flex; transition:color .15s; flex-shrink:0; }
        .f-dl:hover { color:var(--accent,var(--accent)); }

        /* Danger zone */
        .danger-item { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid var(--border-subtle,var(--border-subtle)); cursor:pointer; transition:opacity .15s; }
        .danger-item:last-child { border-bottom:none; padding-bottom:0; }
        .danger-item:hover { opacity:.75; }
        .di-icon { width:30px; height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .danger-label { font-size:13px; font-weight:500; }
        .danger-sub { font-size:10px; margin-top:1px; color:var(--text-muted,var(--text-muted)); }
      `}</style>

      <div className="cip-root">
        {/* Header */}
        <div className="cip-head">
          {onClose && (
            <button className="cip-back" onClick={onClose} aria-label="Fermer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          <span className="cip-head-title">Infos de la conversation</span>
        </div>

        <div className="cip-body">
          {/* Hero */}
          <div className="cip-hero">
            <div className="cip-av" style={{ background:color.bg, color:color.fg }}>
              {conv.initials}
              {!conv.isGroup && conv.online && <div className="cip-av-dot" />}
            </div>
            <div className="cip-name">{conv.name}</div>
            {conv.isGroup && (
              <div className="cip-sub">
                {conv.description ?? `${members.length} membres`}
              </div>
            )}
            {!conv.isGroup && conv.statusMsg && (
              <div className="cip-sub">{conv.statusMsg}</div>
            )}

            {/* Actions rapides */}
            <div className="cip-actions">
              <button className="ca-btn" onClick={() => navigate(`/chats/${conv.id}`)} aria-label="Message">
                <div className="ca-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <span className="ca-label">Message</span>
              </button>
              <button className="ca-btn" onClick={() => navigate(`/calls/new?contact=${conv.id}&type=audio&returnTo=${encodeURIComponent(`/chats/${conv.id}/info`)}`)} aria-label="Audio">
                <div className="ca-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                </div>
                <span className="ca-label">Audio</span>
              </button>
              <button className="ca-btn" onClick={() => navigate(`/calls/new?contact=${conv.id}&type=video&returnTo=${encodeURIComponent(`/chats/${conv.id}/info`)}`)} aria-label="Vidéo">
                <div className="ca-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                </div>
                <span className="ca-label">Vidéo</span>
              </button>
              <button className="ca-btn" aria-label="Rechercher">
                <div className="ca-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                </div>
                <span className="ca-label">Recherche</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="cip-section">
            <div className="notif-row">
              <span className="notif-label">Mettre en sourdine</span>
              <button
                className="tgl"
                style={{ background: muteNotifs ? "var(--accent,var(--accent))" : "var(--border-default,var(--border-default))" }}
                onClick={() => { setMute(v => !v); info(muteNotifs ? "Notifications réactivées" : "Conversation mise en sourdine") }}
                aria-checked={muteNotifs}
                role="switch"
              >
                <div className="tgl-knob" style={{
                  left: muteNotifs ? "20px" : "2.5px",
                  background: muteNotifs ? "var(--accent-text,var(--bg-base))" : "var(--text-muted,var(--text-muted))",
                }} />
              </button>
            </div>
          </div>

          {/* Membres / Fichiers */}
          {conv.isGroup && (
            <div className="cip-tabs" style={{ marginTop:14 }}>
              <button className={`cip-tab ${tab==="membres"?"on":""}`} onClick={() => setTab("membres")}>
                👥 Membres ({members.length})
              </button>
              <button className={`cip-tab ${tab==="fichiers"?"on":""}`} onClick={() => setTab("fichiers")}>
                📎 Fichiers ({conv.files.length})
              </button>
            </div>
          )}

          {/* ── MEMBRES ── */}
          {(tab === "membres" || !conv.isGroup) && (
            <div className="cip-section">
              {!conv.isGroup && <div className="cip-section-title">Fichiers partagés</div>}
              {conv.isGroup && members.map(m => {
                const col = COLORS[m.color]
                const isMe = m.id === "me"
                return (
                  <div className="member-item" key={m.id}>
                    <div className="m-av" style={{ background:col.bg, color:col.fg }}>
                      {m.initials}
                      {m.online && <div className="m-dot" />}
                    </div>
                    <div className="m-info">
                      <div className="m-name">
                        {m.name}
                        {m.role === "admin" && <span className={`m-role ${isMe?"me-badge":""}`}>{isMe?"Vous (admin)":"Admin"}</span>}
                        {isMe && m.role !== "admin" && <span className="m-role me-badge">Vous</span>}
                      </div>
                    </div>
                    {!isMe && isAdmin && (
                      <div className="m-actions">
                        {m.role !== "admin" && (
                          <button className="m-action" title="Nommer administrateur" onClick={() => promoteAdmin(m.id)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                          </button>
                        )}
                        <button className="m-action danger" title="Exclure du groupe" onClick={() => removeMember(m.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              {conv.isGroup && isAdmin && (
                <button
                  style={{
                    width:"100%", marginTop:10,
                    background:"var(--bg-elevated,var(--bg-elevated))", border:"1px dashed var(--border-default,var(--border-default))",
                    borderRadius:9, padding:"9px", fontSize:12, color:"var(--text-muted,var(--text-muted))",
                    cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center",
                    justifyContent:"center", gap:7, transition:"all .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent-border,var(--accent-border))"; e.currentTarget.style.color="var(--accent,var(--accent))" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border-default,var(--border-default))"; e.currentTarget.style.color="var(--text-muted,var(--text-muted))" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter un membre
                </button>
              )}
            </div>
          )}

          {/* ── FICHIERS ── */}
          {(tab === "fichiers" || !conv.isGroup) && (
            <div className="cip-section">
              {!conv.isGroup && <div className="cip-section-title">Fichiers partagés</div>}
              {conv.files.map(f => (
                <div className="file-item" key={f.id} onClick={() => info("Téléchargement", f.name)}>
                  <div className="f-icon"><FileIcon type={f.type} /></div>
                  <div className="f-info">
                    <div className="f-name">{f.name}</div>
                    <div className="f-meta">{f.size} · {f.sender} · {f.ts}</div>
                  </div>
                  <button className="f-dl" aria-label="Télécharger">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                  </button>
                </div>
              ))}
              {conv.files.length === 0 && (
                <div style={{ textAlign:"center", color:"var(--text-ghost)", fontSize:12, padding:"20px 0" }}>Aucun fichier partagé</div>
              )}
            </div>
          )}

          {/* Infos */}
          {conv.isGroup && (
            <div className="cip-section">
              <div className="cip-section-title">Informations</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
                  <span style={{ color:"var(--text-ghost)" }}>Créé le</span>
                  <span>{conv.createdAt}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
                  <span style={{ color:"var(--text-ghost)" }}>Membres</span>
                  <span>{members.length} / 256</span>
                </div>
              </div>
            </div>
          )}

          {/* Zone dangereuse */}
          <div className="cip-section">
            <div className="cip-section-title">Actions</div>
            {conv.isGroup && (
              <div className="danger-item" onClick={leaveGroup}>
                <div className="di-icon" style={{ background:"var(--warning-dim,#fbbf2415)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning,#fbbf24)" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                </div>
                <div>
                  <div className="danger-label" style={{ color:"var(--warning,#fbbf24)" }}>Quitter le groupe</div>
                  <div className="danger-sub">Vous ne recevrez plus les messages</div>
                </div>
              </div>
            )}
            <div className="danger-item" onClick={deleteConv}>
              <div className="di-icon" style={{ background:"var(--danger-dim,var(--danger-dim))" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger,var(--danger))" strokeWidth="1.8" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div>
                <div className="danger-label" style={{ color:"var(--danger,var(--danger))" }}>
                  {conv.isGroup ? "Supprimer le groupe" : "Supprimer la conversation"}
                </div>
                <div className="danger-sub">Action irréversible</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Helper pour convertir ChatInfoMock → ConvInfo ────────────────────────────
function buildConvInfoFromMock(chatId: string): ConvInfo | null {
  const chat = MOCK_CHAT_INFOS[chatId]
  if (!chat) return null

  const color = CHAT_COLORS[chat.colorIdx % CHAT_COLORS.length]
  const colorNames = ["amber", "blue", "violet", "teal", "rose"] as const
  const colorName = colorNames[chat.colorIdx % colorNames.length]

  return {
    id: chat.id,
    name: chat.name,
    initials: chat.initials,
    color: colorName,
    isGroup: chat.isGroup,
    online: chat.online,
    statusMsg: chat.online ? "En ligne" : "Hors ligne",
    members: chat.isGroup
      ? (chat.members?.map((m, i) => ({
          id: String(i),
          name: `Membre ${m}`,
          initials: m,
          color: colorNames[i % colorNames.length],
          role: i === 0 ? "admin" : "member",
          online: Math.random() > 0.5,
        })) ?? [])
      : [{ id: chat.id, name: chat.name, initials: chat.initials, color: colorName, role: "member", online: chat.online }],
    files: [],
    createdAt: "Date inconnue",
  }
}

function buildConvInfoFromLocalData(chatId: string): ConvInfo | null {
  const group = findLocalGroup(chatId)

  if (group) {
    const colorNames = ["amber", "blue", "violet", "teal", "rose"] as const
    return {
      id: group.id,
      name: group.name,
      initials: group.initials,
      color: colorNames[group.name.length % colorNames.length],
      isGroup: true,
      members: group.memberIds.map((memberId, index) => ({
        id: memberId,
        name: `Membre ${index + 1}`,
        initials: memberId.slice(0, 2).toUpperCase(),
        color: colorNames[index % colorNames.length],
        role: index === 0 ? "admin" : "member",
        online: false,
      })),
      files: [],
      createdAt: new Date(group.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      description: `${group.memberIds.length} membres`,
    }
  }

  const contact = loadContacts().find((entry) => entry.id === chatId)
  if (!contact) return null

  return {
    id: contact.id,
    name: contact.name,
    initials: contact.initials,
    color: contact.color,
    isGroup: false,
    online: contact.online,
    statusMsg: contact.online ? "En ligne" : "Hors ligne",
    members: [
      {
        id: contact.id,
        name: contact.name,
        initials: contact.initials,
        color: contact.color,
        role: "member",
        online: contact.online,
      },
    ],
    files: [],
    createdAt: "Date inconnue",
  }
}

// ─── Page route directe /chats/[chatId]/info ─────────────────────────────────
export default function ConvInfoPage() {
  const navigate = useNavigate()
  const { chatId } = useParams<{ chatId: string }>()

  const convInfo = useMemo(() => {
    if (!chatId) return null
    return buildConvInfoFromMock(chatId) ?? buildConvInfoFromLocalData(chatId)
  }, [chatId])

  if (!convInfo) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>❓</div>
          <div>Conversation introuvable</div>
          <button onClick={() => navigate("/chats")} style={{ marginTop: 16, padding: "8px 16px" }}>
            Retour aux chats
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", justifyContent: "center" }}>
      <ConvInfoPanel info={convInfo} onClose={() => navigate(-1)} />
    </div>
  )
}



