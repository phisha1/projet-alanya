import { Link } from "react-router-dom"
import { MOCK_CONVERSATIONS } from "../../../src/mocks/chat-data"
import { loadSessionUser, toInitials } from "../../../src/data/session-user"
import "./dashboard-page.css"


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface Call {
  id:        string
  name:      string
  initials:  string
  type:      "audio" | "video"
  direction: "in" | "out" | "missed"
  duration:  string
  time:      string
}

interface Contact {
  id:       string
  name:     string
  initials: string
  status:   string
  online:   boolean
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONSTANTES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Palette de couleurs cyclique pour les avatars (un par contact)
const AVATAR_COLORS = ["var(--accent)", "var(--info)", "#a78bfa", "var(--success)", "var(--danger)"]

// TODO : remplacer par les appels API reels
// GET /api/users/me
// GET /api/chats?limit=5
// GET /api/calls?limit=5
// GET /api/contacts

const MOCK_USER = {
  name:        "Arsene Nguemo",
  initials:    "AN",
  email:       "a.nguemo@enspy.cm",
  statusMsg:   "Ingenieur en formation ðŸš€",
  memberSince: "Avril 2026",
}

const MOCK_CALLS: Call[] = [
  { id: "1", name: "Kevin Manga",  initials: "KM", type: "video", direction: "out",    duration: "14 min", time: "Hier 20:30"  },
  { id: "2", name: "Laure Ateba", initials: "LA", type: "audio", direction: "missed",  duration: "-",      time: "Hier 18:05"  },
  { id: "3", name: "Paul Essomba",initials: "PE", type: "audio", direction: "in",      duration: "3 min",  time: "Lun. 11:20" },
  { id: "4", name: "Kevin Manga", initials: "KM", type: "audio", direction: "out",     duration: "8 min",  time: "Dim. 16:44" },
]

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Kevin Manga",  initials: "KM", status: "En train de coder",    online: true  },
  { id: "2", name: "Laure Ateba", initials: "LA", status: "Revisions en cours ðŸ“š", online: true  },
  { id: "3", name: "Paul Essomba",initials: "PE", status: "Disponible",            online: false },
  { id: "4", name: "Nina Fouda",  initials: "NF", status: "En reunion",           online: false },
]


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** Retourne la couleur d'avatar correspondant a la position dans la liste. */
function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

/** Determine la salutation selon l'heure de la journee. */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Bonjour"
  if (hour < 18) return "Bon apres-midi"
  return "Bonsoir"
}

/** Formate la date du jour en francais (ex : "jeudi 10 avril"). */
function getTodayLabel(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  })
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SOUS-COMPOSANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * Carte de statistique rapide.
 * La variante `accent` (messages non lus) s'affiche en dore.
 */
function StatCard({ label, value, sub, accent = false }: {
  label:   string
  value:   string
  sub:     string
  accent?: boolean
}) {
  return (
    <div className={`stat-card ${accent ? "stat-card--accent" : ""}`}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__sub">{sub}</div>
    </div>
  )
}

/**
 * Icone de direction d'appel (entrant / sortant / manque).
 * La couleur et la rotation sont gerees par des classes CSS (.call-icon--*).
 */
function CallDirectionIcon({ direction }: { direction: Call["direction"] }) {
  return (
    <svg
      width="12" height="12"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      className={`call-icon--${direction}`}
      style={{ flexShrink: 0 }}
    >
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" />
    </svg>
  )
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PAGE PRINCIPALE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export default function DashboardPage() {
  const sessionUser = loadSessionUser()
  const currentUser = {
    ...MOCK_USER,
    name: sessionUser?.name ?? MOCK_USER.name,
    email: sessionUser?.email ?? "",
    initials: toInitials(sessionUser?.name ?? MOCK_USER.name),
    statusMsg: sessionUser?.statusMsg ?? MOCK_USER.statusMsg,
  }
  const recentChats = MOCK_CONVERSATIONS.slice(0, 5)
  const totalUnread   = recentChats.reduce((acc, chat) => acc + chat.unread, 0)
  const onlineCount   = MOCK_CONTACTS.filter(c => c.online).length
  const firstName     = currentUser.name.split(" ")[0]

  return (
    <main className="dash">

      {/* â”€â”€ En-tete : salutation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="dash-header">
        <div className="greeting">{getTodayLabel()}</div>
        <h1 className="dash-title">
          {getGreeting()}, <span>{firstName}.</span>
        </h1>
      </div>

      {/* â”€â”€ Statistiques rapides â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="stats-grid">
        <StatCard
          label="Messages non lus"
          value={String(totalUnread)}
          sub="dans 2 conversations"
          accent
        />
        <StatCard
          label="Conversations"
          value={String(recentChats.length)}
          sub="actives ce mois"
        />
        <StatCard
          label="Appels recents"
          value={String(MOCK_CALLS.length)}
          sub="les 7 derniers jours"
        />
        <StatCard
          label="Contacts"
          value={String(MOCK_CONTACTS.length)}
          sub="dans votre reseau"
        />
      </div>

      {/* â”€â”€ Conversations recentes + Profil â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="dash-grid">

        {/* Conversations */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Conversations recentes</span>
            <Link to="/chats" className="card-link">Tout voir</Link>
          </div>

          {recentChats.map((chat, i) => {
            const color = avatarColor(i)
            return (
              <Link to={`/chats/${chat.id}`} className="chat-item" key={chat.id}>
                <div
                  className="avatar"
                  // background et color restent inline : calcules dynamiquement
                  style={{ background: color + "30", color }}
                >
                  {chat.initials}
                  {chat.online && <div className="av-dot" />}
                </div>

                <div className="chat-meta">
                  <div className="chat-name">
                    {chat.name}
                    {chat.isGroup && <span className="group-pill">groupe</span>}
                  </div>
                  <div className="chat-preview">{chat.lastMessage}</div>
                </div>

                <div className="chat-right">
                  <div className="chat-time">{chat.time}</div>
                  {chat.unread > 0 && (
                    <div className="unread-badge">{chat.unread}</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Profil utilisateur */}
        <div className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar">
              {currentUser.initials}
              <div className="profile-avatar-dot" />
            </div>
            <div>
              <div className="profile-name">{currentUser.name}</div>
              {currentUser.email ? <div className="profile-email">{currentUser.email}</div> : null}
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-row">
            <span className="profile-row-label">Statut</span>
            <span className="profile-row-val profile-row-val--online">En ligne</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">Message</span>
            <span className="profile-row-val">{currentUser.statusMsg}</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">Membre depuis</span>
            <span className="profile-row-val">{currentUser.memberSince}</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">Contacts</span>
            <span className="profile-row-val">{MOCK_CONTACTS.length} contacts</span>
          </div>

          <button className="profile-edit">Modifier le profil</button>
        </div>

      </div>

      {/* â”€â”€ Appels recents + Contacts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="dash-grid-3">

        {/* Appels recents */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Appels recents</span>
            <Link to="/calls" className="card-link">Tout voir</Link>
          </div>

          {MOCK_CALLS.map((call, i) => {
            const color = avatarColor(i)
            return (
              <div className="call-item" key={call.id}>
                <div
                  className="avatar avatar--sm"
                  style={{ background: color + "20", color }}
                >
                  {call.initials}
                </div>

                <div className="call-info">
                  <div className="call-name">{call.name}</div>
                  <div className="call-meta">
                    <CallDirectionIcon direction={call.direction} />
                    <span className="type-badge">
                      {call.type === "video" ? "Video" : "Audio"}
                    </span>
                    {call.duration !== "-" && <span>{call.duration}</span>}
                    {call.direction === "missed" && (
                      <span className="call-missed-label">Manque</span>
                    )}
                  </div>
                </div>

                <div className="call-right">
                  <div className="call-time">{call.time}</div>
                  <div className="call-btn" title="Rappeler">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Contacts */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Contacts</span>
            <span className="contacts-online">{onlineCount} en ligne</span>
          </div>

          {MOCK_CONTACTS.map((contact, i) => {
            const color = avatarColor(i)
            return (
              <div className="contact-item" key={contact.id}>
                <div
                  className="avatar avatar--sm"
                  style={{ background: color + "20", color }}
                >
                  {contact.initials}
                  {contact.online && <div className="av-dot av-dot--sm" />}
                </div>

                <div className="contact-info">
                  <div className="contact-name">{contact.name}</div>
                  <div className="contact-status">{contact.status}</div>
                </div>

                <Link to={`/chats?contact=${contact.id}`} className="contact-write">
                  Ecrire
                </Link>
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}


