"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

// ════════════════════════════════════════════════════════════
// 1. APPEL ENTRANT — overlay plein écran
// ════════════════════════════════════════════════════════════

interface IncomingCallProps {
  caller: { name: string; initials: string; color: { bg: string; fg: string } }
  type: "audio" | "video"
  onAccept: () => void
  onDecline: () => void
}

export function IncomingCallOverlay({ caller, type, onAccept, onDecline }: IncomingCallProps) {
  const [ringCount, setRingCount] = useState(0)

  // Sonner 30s puis auto-décliner
  useEffect(() => {
    const interval = setInterval(() => setRingCount(c => c + 1), 1000)
    const timeout  = setTimeout(onDecline, 30000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [onDecline])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500&display=swap');
        .ical-overlay {
          position: fixed; inset: 0; z-index: 9000;
          background: #050810f0;
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif;
          animation: icalIn .3s ease;
        }
        @keyframes icalIn { from { opacity:0; } to { opacity:1; } }
        .ical-card {
          background: #080C14; border: 1px solid #1E2736;
          border-radius: 24px; padding: 40px 36px;
          text-align: center; max-width: 320px; width: 90%;
        }
        .ical-av-wrap { position: relative; display: inline-flex; margin-bottom: 22px; }
        .ical-av {
          width: 88px; height: 88px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 28px; font-weight: 800; position: relative; z-index: 1;
        }
        .ical-ring {
          position: absolute; inset: -10px; border-radius: 50%;
          border: 2px solid currentColor; opacity: 0;
          animation: icalRing 2s ease-out infinite;
        }
        .ical-ring:nth-child(2) { animation-delay: .6s; }
        .ical-ring:nth-child(3) { animation-delay: 1.2s; }
        @keyframes icalRing { 0%{opacity:.35;transform:scale(1);}100%{opacity:0;transform:scale(1.7);} }
        .ical-type-badge {
          position: absolute; bottom: -2px; right: -2px;
          width: 26px; height: 26px; border-radius: 50%;
          background: #E8B84B; border: 2px solid #080C14;
          display: flex; align-items: center; justify-content: center;
          z-index: 2;
        }
        .ical-label { font-size: 12px; color: #E8B84B; font-weight: 500; margin-bottom: 8px; letter-spacing: .5px; text-transform: uppercase; }
        .ical-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          letter-spacing: -.5px; margin-bottom: 4px;
        }
        .ical-sub { font-size: 12px; color: #4B5563; margin-bottom: 32px; }
        .ical-timer { font-size: 11px; color: #374151; margin-top: 16px; }
        .ical-btns { display: flex; justify-content: center; gap: 32px; }
        .ical-btn {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
        }
        .ical-btn-icon {
          width: 60px; height: 60px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform .1s, opacity .15s;
        }
        .ical-btn:hover .ical-btn-icon { transform: scale(1.07); }
        .ical-btn:active .ical-btn-icon { transform: scale(.95); }
        .ical-btn-label { font-size: 12px; color: #4B5563; }
        .ical-btn.accept .ical-btn-icon { background: #4ade80; }
        .ical-btn.decline .ical-btn-icon { background: #ef4444; }
      `}</style>

      <div className="ical-overlay" role="dialog" aria-label="Appel entrant" aria-modal="true">
        <div className="ical-card">
          <div className="ical-av-wrap">
            <div className="ical-av" style={{ background: caller.color.bg, color: caller.color.fg }}>
              <div className="ical-ring" style={{ color: caller.color.fg }} />
              <div className="ical-ring" style={{ color: caller.color.fg }} />
              <div className="ical-ring" style={{ color: caller.color.fg }} />
              {caller.initials}
            </div>
            <div className="ical-type-badge">
              {type === "video"
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#080C14" strokeWidth="2.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#080C14" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              }
            </div>
          </div>

          <div className="ical-label">Appel {type === "video" ? "vidéo" : "audio"} entrant</div>
          <div className="ical-name">{caller.name}</div>
          <div className="ical-sub">{type === "video" ? "Veut vous faire un appel vidéo" : "Vous appelle"}</div>

          <div className="ical-btns">
            <button className="ical-btn decline" onClick={onDecline} aria-label="Refuser">
              <div className="ical-btn-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 18.92v3a2 2 0 01-2 2 17 17 0 01-17-17 2 2 0 012-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.49 10a16 16 0 001.19 3.31z"
                    style={{ transform:"rotate(135deg)", transformOrigin:"center" }}
                  />
                </svg>
              </div>
              <span className="ical-btn-label">Refuser</span>
            </button>

            <button className="ical-btn accept" onClick={onAccept} aria-label="Accepter">
              <div className="ical-btn-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <span className="ical-btn-label">Accepter</span>
            </button>
          </div>

          <div className="ical-timer">Décline automatiquement dans {30 - ringCount}s</div>
        </div>
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// 2. OFFLINE BANNER — détecte la connexion réseau
// ════════════════════════════════════════════════════════════

export function OfflineBanner() {
  const [offline, setOffline]   = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    const handleOffline = () => { setOffline(true);  setVisible(true) }
    const handleOnline  = () => {
      setOffline(false)
      setTimeout(() => setVisible(false), 2500) // laisser le "Reconnecté" visible 2.5s
    }
    window.addEventListener("offline", handleOffline)
    window.addEventListener("online",  handleOnline)
    // Check initial
    if (!navigator.onLine) handleOffline()
    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online",  handleOnline)
    }
  }, [])

  const retry = async () => {
    setRetrying(true)
    try {
      await fetch("/api/health", { method:"HEAD", cache:"no-store" })
      // Si ça passe, la reconnexion est réelle
    } catch {}
    finally { setRetrying(false) }
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        .offline-banner {
          position: fixed; top: 0; left: 0; right: 0; z-index: 8000;
          padding: 10px 20px;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          transition: background .4s;
        }
        .offline-banner.off { background: #ef444420; border-bottom: 1px solid #ef444440; color: #fca5a5; }
        .offline-banner.on  { background: #4ade8015; border-bottom: 1px solid #4ade8030; color: #4ade80; }
        .retry-btn {
          background: #ef444420; border: 1px solid #ef444440;
          border-radius: 6px; padding: 4px 12px;
          font-size: 11px; font-weight: 600; color: #fca5a5;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .15s;
        }
        .retry-btn:hover { background: #ef444430; }
        .retry-btn:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
      <div className={`offline-banner ${offline ? "off" : "on"}`} role="status">
        {offline ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
            </svg>
            Pas de connexion internet
            <button className="retry-btn" onClick={retry} disabled={retrying}>
              {retrying ? "Connexion…" : "Réessayer"}
            </button>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Reconnecté
          </>
        )}
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// 3. SKELETON LOADERS
// ════════════════════════════════════════════════════════════

function SkeletonPulse({ width = "100%", height = 14, radius = 6, style }: {
  width?: string | number; height?: number; radius?: number; style?: React.CSSProperties
}) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "#1E2736",
      position: "relative", overflow: "hidden",
      ...style,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, transparent, #2a3444, transparent)",
        animation: "skelPulse 1.4s ease-in-out infinite",
      }} />
      <style>{`@keyframes skelPulse { 0%{transform:translateX(-100%);}100%{transform:translateX(100%);} }`}</style>
    </div>
  )
}

// Skeleton liste de conversations
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, padding:"8px 8px" }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 10px", borderRadius:10 }}>
          <SkeletonPulse width={42} height={42} radius={21} />
          <div style={{ flex:1 }}>
            <SkeletonPulse width="55%" height={12} radius={6} style={{ marginBottom:7 }} />
            <SkeletonPulse width="80%" height={10} radius={5} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
            <SkeletonPulse width={32} height={9} radius={4} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Skeleton messages dans le chat
export function MessagesSkeleton() {
  const rows = [
    { me:false, width:"62%" },
    { me:false, width:"45%" },
    { me:true,  width:"55%" },
    { me:true,  width:"40%" },
    { me:false, width:"70%" },
    { me:true,  width:"48%" },
  ]
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"20px 20px" }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display:"flex", justifyContent: r.me ? "flex-end" : "flex-start" }}>
          <SkeletonPulse width={r.width} height={36} radius={r.me ? "14px 3px 14px 14px" as any : "3px 14px 14px 14px"} />
        </div>
      ))}
    </div>
  )
}

// Skeleton dashboard stats
export function DashboardSkeleton() {
  return (
    <div style={{ padding:"32px 36px" }}>
      <SkeletonPulse width="40%" height={14} radius={6} style={{ marginBottom:10 }} />
      <SkeletonPulse width="60%" height={30} radius={8} style={{ marginBottom:28 }} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
        {Array(4).fill(0).map((_,i) => <SkeletonPulse key={i} width="100%" height={88} radius={12} />)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
        <SkeletonPulse width="100%" height={320} radius={14} />
        <SkeletonPulse width="100%" height={320} radius={14} />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 4. CONTEXT MENU CONVERSATION (clic droit / long press)
// ════════════════════════════════════════════════════════════

interface ContextMenuItem {
  label:       string
  icon:        ReactNode
  onClick:     () => void
  destructive?: boolean
  divider?:    boolean   // séparateur avant cet item
}

interface ContextMenuProps {
  x: number; y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ConvContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", keyHandler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", keyHandler)
    }
  }, [onClose])

  // Ajuster position si trop proche du bord
  const [pos, setPos] = useState({ x, y })
  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth; const vh = window.innerHeight
    setPos({
      x: x + rect.width  > vw ? x - rect.width  : x,
      y: y + rect.height > vh ? y - rect.height  : y,
    })
  }, [x, y])

  return (
    <>
      <style>{`
        .ctx-menu {
          position: fixed; z-index: 7000;
          background: #0D1118; border: 1px solid #1E2736;
          border-radius: 12px; padding: 5px;
          min-width: 200px;
          box-shadow: 0 8px 32px #00000060;
          animation: ctxIn .15s ease;
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes ctxIn { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .ctx-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          cursor: pointer; font-size: 13px; font-weight: 500;
          transition: background .1s; width: 100%;
          background: none; border: none; text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .ctx-item:hover { background: #1E2736; }
        .ctx-item.danger { color: #f87171; }
        .ctx-item.danger:hover { background: #ef444415; }
        .ctx-item:not(.danger) { color: #E2E8F0; }
        .ctx-divider { height: 1px; background: #1E2736; margin: 4px 5px; }
      `}</style>
      <div
        ref={ref}
        className="ctx-menu"
        style={{ top: pos.y, left: pos.x }}
        role="menu"
      >
        {items.map((item, i) => (
          <div key={i}>
            {item.divider && <div className="ctx-divider" />}
            <button
              className={`ctx-item ${item.destructive ? "danger" : ""}`}
              role="menuitem"
              onClick={() => { item.onClick(); onClose() }}
            >
              <span style={{ flexShrink:0, opacity:.7 }}>{item.icon}</span>
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// 5. UPLOAD PROGRESS — dans le chat
// ════════════════════════════════════════════════════════════

interface UploadItem {
  id:       string
  fileName: string
  size:     string
  progress: number   // 0-100
  status:   "uploading" | "done" | "error"
}

export function UploadProgressBubble({ upload }: { upload: UploadItem }) {
  return (
    <>
      <style>{`
        .upload-bubble {
          background: #1A2030; border: 1px solid #1E2736;
          border-radius: 14px 14px 14px 3px;
          padding: 11px 14px; max-width: 280px;
          font-family: 'DM Sans', sans-serif;
        }
        .upload-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .upload-file-ic {
          width: 34px; height: 34px; border-radius: 8px;
          background: #2a3444; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: #9CA3AF;
        }
        .upload-name { font-size: 12px; font-weight: 500; color: #E2E8F0; margin-bottom:2px; overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .upload-size { font-size: 10px; color: #4B5563; }
        .upload-bar-wrap { height: 4px; background: #2a3444; border-radius: 99px; overflow:hidden; margin-bottom:6px; }
        .upload-bar-fill {
          height: 100%; border-radius: 99px;
          transition: width .3s ease;
        }
        .upload-meta { display: flex; justify-content: space-between; font-size: 10px; color: #4B5563; }
      `}</style>
      <div className="upload-bubble">
        <div className="upload-top">
          <div className="upload-file-ic">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="upload-name">{upload.fileName}</div>
            <div className="upload-size">{upload.size}</div>
          </div>
          {upload.status === "done" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
          {upload.status === "error" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </div>

        {upload.status !== "done" && (
          <>
            <div className="upload-bar-wrap">
              <div
                className="upload-bar-fill"
                style={{
                  width: `${upload.progress}%`,
                  background: upload.status === "error" ? "#ef4444" : "#E8B84B",
                }}
              />
            </div>
            <div className="upload-meta">
              <span>{upload.status === "error" ? "Échec de l'envoi" : `${upload.progress}%`}</span>
              <span>{upload.status === "error" ? "Réessayer" : "En cours…"}</span>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// 6. RECHERCHE GLOBALE — modal Cmd+K
// ════════════════════════════════════════════════════════════

interface GlobalSearchProps {
  onClose: () => void
}

const MOCK_RESULTS = {
  contacts: [
    { id:"1", name:"Kevin Manga",     initials:"KM", color:"#E8B84B", sub:"En ligne" },
    { id:"4", name:"Laure Ateba",     initials:"LA", color:"#34d399", sub:"Hors ligne" },
    { id:"3", name:"Dr. NANA BINKEU",initials:"NB", color:"#a78bfa", sub:"Hors ligne" },
  ],
  messages: [
    { id:"m1", conv:"Kevin Manga", content:"T'as envoyé le TP de BD ?", ts:"10:43" },
    { id:"m2", conv:"Groupe Alanya II", content:"Réunion demain à 14h sur Teams", ts:"09:12" },
  ],
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const filteredContacts = MOCK_RESULTS.contacts.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )
  const filteredMessages = MOCK_RESULTS.messages.filter(m =>
    m.content.toLowerCase().includes(query.toLowerCase()) ||
    m.conv.toLowerCase().includes(query.toLowerCase())
  )

  const hasResults = filteredContacts.length > 0 || filteredMessages.length > 0

  return (
    <>
      <style>{`
        .gsearch-overlay {
          position: fixed; inset: 0; z-index: 8500;
          background: #00000070; backdrop-filter: blur(4px);
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 80px; font-family: 'DM Sans', sans-serif;
          animation: gsFadeIn .15s ease;
        }
        @keyframes gsFadeIn { from{opacity:0;}to{opacity:1;} }
        .gsearch-card {
          background: #0D1118; border: 1px solid #1E2736;
          border-radius: 16px; width: 100%; max-width: 520px;
          overflow: hidden; box-shadow: 0 24px 64px #00000080;
          animation: gsSlideIn .2s ease;
        }
        @keyframes gsSlideIn { from{transform:translateY(-8px);}to{transform:translateY(0);} }
        .gsearch-input-wrap {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px; border-bottom: 1px solid #1E2736;
        }
        .gsearch-input {
          flex: 1; background: none; border: none; outline: none;
          font-size: 15px; color: white; font-family: 'DM Sans', sans-serif;
        }
        .gsearch-input::placeholder { color: #374151; }
        .gsearch-esc {
          font-size: 10px; color: #374151; background: #1E2736;
          border-radius: 5px; padding: 2px 7px; flex-shrink:0;
        }
        .gsearch-body { max-height: 420px; overflow-y: auto; }
        .gsearch-body::-webkit-scrollbar { width: 3px; }
        .gsearch-body::-webkit-scrollbar-thumb { background: #1E2736; }
        .gsearch-section { padding: 10px 14px 4px; font-size: 10px; color: #374151; letter-spacing: 1px; text-transform: uppercase; font-weight: 500; }
        .gsearch-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 16px; cursor: pointer; transition: background .1s;
        }
        .gsearch-item:hover { background: #1E2736; }
        .gsearch-av {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
        .gsearch-name { font-size: 13px; font-weight: 500; color: #E2E8F0; margin-bottom:1px; }
        .gsearch-sub  { font-size: 11px; color: #4B5563; }
        .gsearch-empty { padding: 48px 24px; text-align: center; color: #374151; font-size: 13px; }
        .gsearch-footer { padding: 10px 16px; border-top: 1px solid #1E2736; display: flex; gap: 16px; }
        .gs-kbd { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #374151; }
        .gs-key { background: #1E2736; border-radius: 4px; padding: 2px 6px; font-size: 10px; color: #4B5563; }
      `}</style>

      <div className="gsearch-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="gsearch-card" role="dialog" aria-label="Recherche globale">
          <div className="gsearch-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              className="gsearch-input"
              placeholder="Rechercher des contacts, messages…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
            />
            <span className="gsearch-esc">Échap</span>
          </div>

          <div className="gsearch-body">
            {!query && (
              <div className="gsearch-empty">Commencez à taper pour rechercher</div>
            )}
            {query && !hasResults && (
              <div className="gsearch-empty">Aucun résultat pour « {query} »</div>
            )}
            {query && filteredContacts.length > 0 && (
              <>
                <div className="gsearch-section">Contacts</div>
                {filteredContacts.map(c => (
                  <div key={c.id} className="gsearch-item" onClick={() => { router.push(`/chats/${c.id}`); onClose() }}>
                    <div className="gsearch-av" style={{ background: c.color + "22", color: c.color }}>{c.initials}</div>
                    <div>
                      <div className="gsearch-name">{c.name}</div>
                      <div className="gsearch-sub">{c.sub}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {query && filteredMessages.length > 0 && (
              <>
                <div className="gsearch-section">Messages</div>
                {filteredMessages.map(m => (
                  <div key={m.id} className="gsearch-item" onClick={() => { router.push(`/chats/1`); onClose() }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:"#1E2736", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="gsearch-name">{m.conv}</div>
                      <div className="gsearch-sub" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.content}</div>
                    </div>
                    <span style={{ fontSize:10, color:"#2d3748", flexShrink:0 }}>{m.ts}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="gsearch-footer">
            <div className="gs-kbd"><span className="gs-key">↵</span> Ouvrir</div>
            <div className="gs-kbd"><span className="gs-key">↑↓</span> Naviguer</div>
            <div className="gs-kbd"><span className="gs-key">Échap</span> Fermer</div>
          </div>
        </div>
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// 7. HOOK — Cmd+K pour ouvrir la recherche globale
// ════════════════════════════════════════════════════════════

export function useGlobalSearch() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return { open, setOpen }
}
