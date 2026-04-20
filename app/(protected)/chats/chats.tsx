import { useState, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { loadLocalConversations } from "../../../src/data/local-conversations"
import { loadLocalGroups, toConversationMock } from "../../../src/data/local-groups"
import { CHAT_COLORS, MOCK_CONVERSATIONS, type ConversationMock } from "../../../src/mocks/chat-data"
import "./chats-page.css"

// ─── Types ────────────────────────────────────────────────────────────────────
// TODO : GET /api/chats?page=1&limit=20

function lastMsgIcon(type: ConversationMock["lastMessageType"]) {
  if (type === "file")  return "📎 "
  if (type === "audio") return "🎵 "
  if (type === "image") return "📷 "
  return ""
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all")

  const conversations = useMemo(() => {
    const localConversations = loadLocalConversations()
    const groupFallbacks = loadLocalGroups()
      .map(toConversationMock)
      .filter((conversation) => !localConversations.some((localConversation) => localConversation.id === conversation.id))
    const mockFallbacks = MOCK_CONVERSATIONS.filter((conversation) => (
      !localConversations.some((localConversation) => localConversation.id === conversation.id)
      && !groupFallbacks.some((groupConversation) => groupConversation.id === conversation.id)
    ))

    return [...localConversations, ...groupFallbacks, ...mockFallbacks]
  }, [])

  const filtered = useMemo(() => {
    return conversations
      .filter(c => {
        if (filter === "unread") return c.unread > 0
        if (filter === "groups") return c.isGroup
        return true
      })
      .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
  }, [conversations, query, filter])

  const pinned  = filtered.filter(c => c.isPinned)
  const regular = filtered.filter(c => !c.isPinned)

  return (
    <div className="chats-root">
        <div className="ch-header">
          <div className="ch-title-row">
            <h1 className="ch-title">Messages</h1>
            <button className="new-chat-btn" onClick={() => navigate("/chats/new")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nouveau chat
            </button>
          </div>

          {/* Recherche */}
          <div className="search-wrap">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              className="search-input"
              type="search"
              placeholder="Rechercher une conversation…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Filtres */}
          <div className="filter-row">
    {(["all", "unread", "groups"] as const).map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Tous" : f === "unread" ? `Non lus (${conversations.reduce((a, c) => a + (c.unread > 0 ? 1 : 0), 0)})` : "Groupes"}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div className="ch-list">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💬</div>
              <div className="empty-txt">Aucune conversation trouvée<br/>pour « {query} »</div>
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <>
                  <div className="section-label">📌 Épinglés</div>
                  {pinned.map(conv => <ConvItem key={conv.id} conv={conv} />)}
                </>
              )}
              {regular.length > 0 && (
                <>
                  {pinned.length > 0 && <div className="section-label">Récents</div>}
                  {regular.map(conv => <ConvItem key={conv.id} conv={conv} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
  )
}

function ConvItem({ conv }: { conv: ConversationMock }) {
  const color = CHAT_COLORS[conv.colorIdx % CHAT_COLORS.length]
  return (
    <Link to={`/chats/${conv.id}`} className="conv-item">
      <div className="av" style={{ background: color.bg, color: color.text }}>
        {conv.initials}
        {conv.online && !conv.isGroup && <div className="av-dot" />}
        {conv.isGroup && (
          <div className="group-stack">{conv.members?.length ?? "+"}</div>
        )}
      </div>
      <div className="conv-meta">
        <div className="conv-name">
          {conv.name}
          {conv.isPinned && <span className="pin-icon">📌</span>}
          {conv.isGroup && (
            <span style={{ fontSize: 9, background: "var(--border-subtle)", color: "var(--text-muted)", padding: "1px 5px", borderRadius: 3, fontWeight: 500 }}>groupe</span>
          )}
        </div>
        <div className={`conv-preview ${conv.unread > 0 ? "unread" : ""}`}>
          {lastMsgIcon(conv.lastMessageType)}{conv.lastMessage}
        </div>
      </div>
      <div className="conv-right">
        <div className={`conv-time ${conv.unread > 0 ? "unread" : ""}`}>{conv.time}</div>
        {conv.unread > 0 && <div className="unread-badge">{conv.unread}</div>}
      </div>
    </Link>
  )
}


