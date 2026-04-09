import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

type CallDirection = "in" | "out" | "missed"
type CallType = "audio" | "video"
type CallStatus = "ended" | "declined" | "no_answer"
type FilterType = "all" | "missed" | "audio" | "video"

interface CallRecord {
  id: string
  contactId: string
  contactName: string
  contactInitials: string
  contactColor: keyof typeof COLORS
  direction: CallDirection
  type: CallType
  status: CallStatus
  duration?: string
  ts: Date
  isGroup?: boolean
}

const MOCK_CALLS: CallRecord[] = [
  { id: "c1", contactId: "1", contactName: "Kevin Manga", contactInitials: "KM", contactColor: "amber", direction: "out", type: "video", status: "ended", duration: "14:23", ts: new Date(Date.now() - 86400000 * 0.3) },
  { id: "c2", contactId: "4", contactName: "Laure Ateba", contactInitials: "LA", contactColor: "teal", direction: "missed", type: "audio", status: "no_answer", ts: new Date(Date.now() - 86400000 * 0.5) },
  { id: "c3", contactId: "5", contactName: "Paul Essomba", contactInitials: "PE", contactColor: "rose", direction: "in", type: "audio", status: "ended", duration: "3:07", ts: new Date(Date.now() - 86400000 * 1.2) },
  { id: "c4", contactId: "1", contactName: "Kevin Manga", contactInitials: "KM", contactColor: "amber", direction: "out", type: "audio", status: "ended", duration: "8:44", ts: new Date(Date.now() - 86400000 * 2.1) },
  { id: "c5", contactId: "2", contactName: "Groupe Alanya II", contactInitials: "GA", contactColor: "blue", direction: "in", type: "video", status: "ended", duration: "42:11", ts: new Date(Date.now() - 86400000 * 2.8), isGroup: true },
  { id: "c6", contactId: "6", contactName: "Nina Fouda", contactInitials: "NF", contactColor: "amber", direction: "missed", type: "video", status: "no_answer", ts: new Date(Date.now() - 86400000 * 3.5) },
  { id: "c7", contactId: "5", contactName: "Paul Essomba", contactInitials: "PE", contactColor: "rose", direction: "out", type: "audio", status: "declined", ts: new Date(Date.now() - 86400000 * 4.0) },
  { id: "c8", contactId: "3", contactName: "Dr. NANA BINKEU", contactInitials: "NB", contactColor: "violet", direction: "in", type: "audio", status: "ended", duration: "6:58", ts: new Date(Date.now() - 86400000 * 5.2) },
  { id: "c9", contactId: "1", contactName: "Kevin Manga", contactInitials: "KM", contactColor: "amber", direction: "in", type: "video", status: "ended", duration: "22:05", ts: new Date(Date.now() - 86400000 * 6.9) },
  { id: "c10", contactId: "4", contactName: "Laure Ateba", contactInitials: "LA", contactColor: "teal", direction: "out", type: "audio", status: "ended", duration: "1:44", ts: new Date(Date.now() - 86400000 * 8.1) },
]

const COLORS = {
  amber: { bg: "#E8B84B22", fg: "#E8B84B" },
  blue: { bg: "#60a5fa22", fg: "#60a5fa" },
  violet: { bg: "#a78bfa22", fg: "#a78bfa" },
  teal: { bg: "#34d39922", fg: "#34d399" },
  rose: { bg: "#fb718522", fg: "#fb7185" },
}

function formatItemTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  if (days === 1) return "Hier"
  if (days < 7) return date.toLocaleDateString("fr-FR", { weekday: "long" })
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function formatGroupHeader(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return "Hier"
  if (diff < 7) return date.toLocaleDateString("fr-FR", { weekday: "long" })
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

function DirectionArrow({ direction }: { direction: CallDirection }) {
  const color = direction === "missed" ? "#ef4444" : direction === "in" ? "#4ade80" : "#60a5fa"
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ transform: direction === "out" ? "rotate(180deg)" : undefined }}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export default function CallsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>("all")
  const [search, setSearch] = useState("")

  const missedCount = useMemo(() => MOCK_CALLS.filter((call) => call.direction === "missed").length, [])

  const filtered = useMemo(() => {
    return MOCK_CALLS
      .filter((call) => {
        if (filter === "missed") return call.direction === "missed"
        if (filter === "audio") return call.type === "audio"
        if (filter === "video") return call.type === "video"
        return true
      })
      .filter((call) => call.contactName.toLowerCase().includes(search.toLowerCase()))
  }, [filter, search])

  const grouped = useMemo(() => {
    return filtered.reduce<Array<{ header: string; calls: CallRecord[] }>>((acc, call) => {
      const header = formatGroupHeader(call.ts)
      const last = acc[acc.length - 1]
      if (!last || last.header !== header) {
        acc.push({ header, calls: [call] })
      } else {
        last.calls.push(call)
      }
      return acc
    }, [])
  }, [filtered])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .calls-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #080C14;
          color: white;
          display: flex;
          flex-direction: column;
        }

        .calls-head { padding: 28px 32px 0; flex-shrink: 0; }
        .calls-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .calls-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -1px; }

        .new-call-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #E8B84B;
          color: #080C14;
          padding: 10px 20px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity .15s, transform .1s;
        }
        .new-call-btn:hover { opacity: .88; transform: translateY(-1px); }

        .calls-controls { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .search-wrap { position: relative; flex: 1; max-width: 320px; }
        .search-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #2d3748; pointer-events: none; }
        .search-wrap input {
          width: 100%;
          background: #0D1118;
          border: 1px solid #1E2736;
          border-radius: 9px;
          padding: 9px 12px 9px 34px;
          font-size: 13px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color .2s;
        }
        .search-wrap input::placeholder { color: #2d3748; }
        .search-wrap input:focus { border-color: #E8B84B40; }

        .filter-group { display: flex; gap: 5px; }
        .filter-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #1E2736;
          background: transparent;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all .15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .filter-btn:hover { border-color: #2a3444; color: #6B7280; }
        .filter-btn.on { background: #E8B84B15; border-color: #E8B84B50; color: #E8B84B; }

        .stats-strip { display: flex; gap: 12px; margin-bottom: 24px; }
        .stat-chip {
          background: #0D1118;
          border: 1px solid #1E2736;
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .stat-chip-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-chip-val {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .stat-chip-lbl { font-size: 11px; color: #374151; margin-top: 2px; }

        .calls-body { flex: 1; padding: 0 32px 32px; }

        .date-header {
          font-size: 11px;
          color: #374151;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 16px 0 8px;
          border-bottom: 1px solid #1E2736;
          margin-bottom: 4px;
        }

        .call-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 16px;
          border-radius: 12px;
          transition: background .15s;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .call-item:hover { background: #0D1118; border-color: #1E2736; }

        .call-av {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .call-info { flex: 1; min-width: 0; }
        .call-name {
          font-size: 14px;
          font-weight: 500;
          color: #E2E8F0;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .call-detail { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #374151; }

        .call-type-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 5px;
          background: #1E2736;
          color: #4B5563;
          font-weight: 500;
        }

        .call-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
        .call-ts { font-size: 11px; color: #2d3748; }

        .call-actions { display: flex; gap: 6px; }
        .call-action-btn {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid #1E2736;
          background: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .15s;
        }
        .call-action-btn.audio { color: #4B5563; }
        .call-action-btn.audio:hover { background: #34d39915; border-color: #34d39940; color: #34d399; }
        .call-action-btn.video { color: #4B5563; }
        .call-action-btn.video:hover { background: #60a5fa15; border-color: #60a5fa40; color: #60a5fa; }
        .call-action-btn.chat { color: #4B5563; }
        .call-action-btn.chat:hover { background: #E8B84B15; border-color: #E8B84B40; color: #E8B84B; }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          color: #2d3748;
          text-align: center;
        }

        .empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #0D1118;
          border: 1px solid #1E2736;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .empty-txt { font-size: 14px; color: #374151; line-height: 1.6; }

        .missed-badge {
          background: #ef444420;
          color: #ef4444;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 5px;
        }

        @media (max-width: 768px) {
          .calls-head, .calls-body { padding-left: 20px; padding-right: 20px; }
          .stats-strip { flex-wrap: wrap; }
          .calls-controls { flex-wrap: wrap; }
          .filter-group { flex-wrap: wrap; }
        }
      `}</style>

      <div className="calls-root">
        <div className="calls-head">
          <div className="calls-title-row">
            <h1 className="calls-title">Appels</h1>
            <button className="new-call-btn" onClick={() => navigate("/calls/new")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              Nouvel appel
            </button>
          </div>

          <div className="stats-strip">
            {[
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8B84B" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                ),
                iconBg: "#E8B84B15",
                val: MOCK_CALLS.length,
                lbl: "Total appels",
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                ),
                iconBg: "#ef444415",
                val: missedCount,
                lbl: "Appels manques",
                valColor: "#ef4444",
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                ),
                iconBg: "#60a5fa15",
                val: MOCK_CALLS.filter((call) => call.type === "video").length,
                lbl: "Appels video",
              },
            ].map((chip) => (
              <div className="stat-chip" key={chip.lbl}>
                <div className="stat-chip-icon" style={{ background: chip.iconBg }}>{chip.icon}</div>
                <div>
                  <div className="stat-chip-val" style={{ color: chip.valColor ?? "#E2E8F0" }}>{chip.val}</div>
                  <div className="stat-chip-lbl">{chip.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="calls-controls">
            <div className="search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                placeholder="Rechercher un contact..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="filter-group">
              {(["all", "missed", "audio", "video"] as FilterType[]).map((current) => (
                <button key={current} className={`filter-btn ${filter === current ? "on" : ""}`} onClick={() => setFilter(current)}>
                  {current === "all"
                    ? "Tous"
                    : current === "missed"
                      ? <>Manques {missedCount > 0 && <span style={{ background: "#ef444425", color: "#ef4444", fontSize: 10, padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>{missedCount}</span>}</>
                      : current === "audio"
                        ? "Audio"
                        : "Video"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="calls-body">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div className="empty-txt">Aucun appel trouve</div>
            </div>
          ) : (
            grouped.map(({ header, calls }) => (
              <div key={header}>
                <div className="date-header">{header}</div>
                {calls.map((call) => {
                  const color = COLORS[call.contactColor]
                  const isMissed = call.direction === "missed"
                  return (
                    <div className="call-item" key={call.id} onClick={() => navigate(`/calls/${call.id}`)}>
                      <div className="call-av" style={{ background: color.bg, color: color.fg }}>
                        {call.contactInitials}
                      </div>

                      <div className="call-info">
                        <div className="call-name">
                          {call.contactName}
                          {isMissed && <span className="missed-badge">Manque</span>}
                          {call.status === "declined" && (
                            <span style={{ fontSize: 10, background: "#37415120", color: "#4B5563", padding: "2px 7px", borderRadius: 5, fontWeight: 500 }}>
                              Refuse
                            </span>
                          )}
                        </div>
                        <div className="call-detail">
                          <DirectionArrow direction={call.direction} />

                          <div className="call-type-badge">
                            {call.type === "video" ? (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" />
                              </svg>
                            ) : (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                              </svg>
                            )}
                            {call.type === "video" ? "Video" : "Audio"}
                          </div>

                          {call.duration && <span style={{ color: "#4B5563" }}>{call.duration}</span>}
                        </div>
                      </div>

                      <div className="call-right">
                        <div className="call-ts">{formatItemTime(call.ts)}</div>
                        <div className="call-actions">
                          <button
                            className="call-action-btn audio"
                            title="Rappeler audio"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/calls/new?contact=${call.contactId}&type=audio`)
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                            </svg>
                          </button>
                          <button
                            className="call-action-btn video"
                            title="Rappeler video"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/calls/new?contact=${call.contactId}&type=video`)
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <polygon points="23 7 16 12 23 17 23 7" />
                              <rect x="1" y="5" width="15" height="14" rx="2" />
                            </svg>
                          </button>
                          <button
                            className="call-action-btn chat"
                            title="Ouvrir le chat"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/chats/${call.contactId}`)
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
