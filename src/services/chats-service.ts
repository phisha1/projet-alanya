import { loadLocalConversations } from "../data/local-conversations"
import { loadLocalGroups, toConversationMock } from "../data/local-groups"
import { type ConversationMock } from "../mocks/chat-data"
import { apiRequest } from "../lib/api-client"

/**
 * Aggregation purement locale (localStorage + groupes crees en local).
 * Conserve pour le dashboard tant qu'il n'a pas son propre endpoint.
 * NOTE : ne renvoie plus les mocks MOCK_CONVERSATIONS.
 */
export function getChatConversations(): ConversationMock[] {
  const localConversations = loadLocalConversations()
  const groupFallbacks = loadLocalGroups()
    .map(toConversationMock)
    .filter(
      (conversation) =>
        !localConversations.some((localConversation) => localConversation.id === conversation.id)
    )
  return [...localConversations, ...groupFallbacks]
}

/**
 * GET /api/chats — Liste des conversations de l'utilisateur depuis le backend.
 * En cas d'erreur, retombe sur les conversations locales (pas sur des mocks).
 */
export async function fetchChatConversations(): Promise<ConversationMock[]> {
  try {
    const response = await apiRequest<{ conversations: ConversationMock[] }>("/api/chats")
    return response.conversations ?? []
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[chats] fetch a echoue", error)
    return getChatConversations()
  }
}

interface BackendConversation {
  id: string
  name: string
  initials?: string
  isGroup?: boolean
  members?: string[]
  lastMessage?: string
  lastMessageType?: string
  time?: string
  unread?: number
  online?: boolean
  isPinned?: boolean
  colorIdx?: number
}

interface CreateChatResponse {
  conversation: BackendConversation
}

/**
 * POST /api/chats — Cree (ou recupere si elle existe deja) une conversation 1-to-1
 * avec le contact specifie. Renvoie l'id de la conversation cote backend.
 */
export async function createPrivateChat(contactId: string): Promise<BackendConversation> {
  const response = await apiRequest<CreateChatResponse>("/api/chats", {
    method: "POST",
    body: { contactId },
  })
  return response.conversation
}

/**
 * POST /api/chats — Cree un groupe avec les membres listes (en plus du current user).
 */
export async function createGroupChat(
  name: string,
  memberIds: string[]
): Promise<BackendConversation> {
  const response = await apiRequest<CreateChatResponse>("/api/chats", {
    method: "POST",
    body: { name, memberIds },
  })
  return response.conversation
}

/**
 * Recupere une conversation precise par son id en filtrant la liste backend.
 * Utilise par la page chat pour reconstituer les infos d'une conv ouverte.
 */
export async function fetchConversationById(
  conversationId: string
): Promise<ConversationMock | null> {
  const all = await fetchChatConversations()
  return all.find((c) => c.id === conversationId) ?? null
}
