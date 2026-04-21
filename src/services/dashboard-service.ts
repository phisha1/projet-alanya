import { loadContacts } from "../data/contacts"
import { loadSessionUser, toInitials } from "../data/session-user"
import { type ConversationMock } from "../mocks/chat-data"
import { getChatConversations } from "./chats-service"

export interface DashboardCall {
  id: string
  contactId: string
  name: string
  initials: string
  type: "audio" | "video"
  direction: "in" | "out" | "missed"
  duration: string
  time: string
}

export interface DashboardContact {
  id: string
  name: string
  initials: string
  status: string
  online: boolean
}

const FALLBACK_USER = {
  name: "Arsene Nguemo",
  initials: "AN",
  email: "a.nguemo@enspy.cm",
  statusMsg: "Ingenieur en formation",
  memberSince: "Avril 2026",
}

const FALLBACK_CALLS: DashboardCall[] = [
  { id: "1", contactId: "1", name: "Kevin Manga", initials: "KM", type: "video", direction: "out", duration: "14 min", time: "Hier 20:30" },
  { id: "2", contactId: "4", name: "Laure Ateba", initials: "LA", type: "audio", direction: "missed", duration: "-", time: "Hier 18:05" },
  { id: "3", contactId: "5", name: "Paul Essomba", initials: "PE", type: "audio", direction: "in", duration: "3 min", time: "Lun. 11:20" },
  { id: "4", contactId: "1", name: "Kevin Manga", initials: "KM", type: "audio", direction: "out", duration: "8 min", time: "Dim. 16:44" },
]

export function getDashboardData() {
  const sessionUser = loadSessionUser()
  const contactsFromStore = loadContacts()
  const contacts: DashboardContact[] = contactsFromStore.slice(0, 4).map((contact) => ({
    id: contact.id,
    name: contact.name,
    initials: contact.initials,
    status: contact.online ? "En ligne" : "Disponible",
    online: contact.online,
  }))

  const currentUser = {
    ...FALLBACK_USER,
    name: sessionUser?.name ?? FALLBACK_USER.name,
    email: sessionUser?.email ?? "",
    initials: toInitials(sessionUser?.name ?? FALLBACK_USER.name),
    statusMsg: sessionUser?.statusMsg ?? FALLBACK_USER.statusMsg,
  }

  const recentChats: ConversationMock[] = getChatConversations().slice(0, 5)

  return {
    currentUser,
    recentChats,
    recentCalls: FALLBACK_CALLS,
    contacts,
  }
}
