import { loadLocalConversations } from "../data/local-conversations"
import { loadLocalGroups, toConversationMock } from "../data/local-groups"
import { type ConversationMock, MOCK_CONVERSATIONS } from "../mocks/chat-data"
import { isApiOnlyMode } from "../config/runtime"

export function getChatConversations(): ConversationMock[] {
  // Until backend endpoints are connected, we keep one stable fallback source.
  // Pages consume this service instead of reading mocks directly.
  const localConversations = loadLocalConversations()
  const groupFallbacks = loadLocalGroups()
    .map(toConversationMock)
    .filter((conversation) => !localConversations.some((localConversation) => localConversation.id === conversation.id))
  const mockFallbacks = MOCK_CONVERSATIONS.filter((conversation) => (
    !localConversations.some((localConversation) => localConversation.id === conversation.id)
    && !groupFallbacks.some((groupConversation) => groupConversation.id === conversation.id)
  ))

  const merged = [...localConversations, ...groupFallbacks, ...mockFallbacks]

  if (isApiOnlyMode()) {
    // Keep UI functional while warning future maintainers that API mode is not yet wired here.
    // Real API integration will replace this branch with server data.
    return merged
  }

  return merged
}
