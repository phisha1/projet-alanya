import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CONTACT_COLORS } from "../../../src/data/contacts"
import { useContacts } from "../../../src/hooks/use-contacts"
import "./calls-page.css"

export default function NewCallPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { contacts } = useContacts()

  const presetContact = searchParams.get("contact")
  const presetType = searchParams.get("type") === "video" ? "video" : "audio"
  const returnTo = searchParams.get("returnTo") || "/calls"

  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(presetContact)
  const [type, setType] = useState<"audio" | "video">(presetType)

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const q = query.toLowerCase()
      return contact.name.toLowerCase().includes(q) || contact.phone.includes(query)
    })
  }, [contacts, query])

  useEffect(() => {
    if (!presetContact) return
    const contactExists = contacts.some((contact) => contact.id === presetContact)
    if (!contactExists) return

    const callId = `n${Date.now()}`
    navigate(`/calls/${callId}?contact=${presetContact}&type=${presetType}&returnTo=${encodeURIComponent(returnTo)}`, { replace: true })
  }, [contacts, navigate, presetContact, presetType, returnTo])

  const startCall = () => {
    if (!selectedId) return
    const callId = `n${Date.now()}`
    navigate(`/calls/${callId}?contact=${selectedId}&type=${type}&returnTo=${encodeURIComponent(returnTo)}`)
  }

  return (
    <div className="calls-root" style={{ padding: "20px 0" }}>
      <div className="calls-head" style={{ marginBottom: 14 }}>
        <div className="calls-title-row">
          <h1 className="calls-title">Nouvel appel</h1>
        </div>

        <div className="calls-controls" style={{ marginTop: 14 }}>
          <div className="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              placeholder="Rechercher un contact..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="filter-group">
            <button className={`filter-btn ${type === "audio" ? "on" : ""}`} onClick={() => setType("audio")}>Audio</button>
            <button className={`filter-btn ${type === "video" ? "on" : ""}`} onClick={() => setType("video")}>Video</button>
          </div>
        </div>
      </div>

      <div className="calls-body">
        {filtered.map((contact) => {
          const color = CONTACT_COLORS[contact.color]
          const selected = selectedId === contact.id

          return (
            <div
              key={contact.id}
              className="call-item"
              onClick={() => setSelectedId(contact.id)}
              style={selected ? { borderColor: "var(--accent-border)", background: "var(--accent-dim)" } : undefined}
            >
              <div className="call-av" style={{ background: color.bg, color: color.fg }}>{contact.initials}</div>

              <div className="call-info">
                <div className="call-name">{contact.name}</div>
                <div className="call-detail">{contact.phone}</div>
              </div>

              <div className="call-right">
                {selected ? <span className="missed-badge">Selectionne</span> : null}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && <div className="empty-state"><div className="empty-txt">Aucun contact trouve</div></div>}
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button className="new-call-btn" onClick={startCall} disabled={!selectedId}>
          Demarrer appel {type}
        </button>
      </div>
    </div>
  )
}


