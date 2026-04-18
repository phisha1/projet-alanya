import { CHAT_COLORS, type ChatInfoMock, type ConversationMock } from "../mocks/chat-data"

export interface LocalGroup {
  id: string
  name: string
  initials: string
  memberIds: string[]
  createdAt: string
}

const STORAGE_KEY = "alanya-local-groups-v1"

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readGroups() {
  if (!hasStorage()) return [] as LocalGroup[]

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalGroup[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeGroups(groups: LocalGroup[]) {
  if (!hasStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
}

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NG"
}

export function loadLocalGroups() {
  return readGroups()
}

export function createLocalGroup(name: string, memberIds: string[]) {
  const groups = readGroups()
  const nextGroup: LocalGroup = {
    id: `g-${Date.now()}`,
    name: name.trim(),
    initials: toInitials(name),
    memberIds,
    createdAt: new Date().toISOString(),
  }

  writeGroups([nextGroup, ...groups])
  return nextGroup
}

export function findLocalGroup(groupId: string) {
  return readGroups().find((group) => group.id === groupId) ?? null
}

export function toConversationMock(group: LocalGroup): ConversationMock {
  return {
    id: group.id,
    name: group.name,
    initials: group.initials,
    colorIdx: group.name.length % CHAT_COLORS.length,
    lastMessage: "Groupe cree",
    lastMessageType: "text",
    time: "Maintenant",
    unread: 0,
    online: false,
    isGroup: true,
    members: group.memberIds,
  }
}

export function toChatInfoMock(group: LocalGroup): ChatInfoMock {
  return {
    id: group.id,
    name: group.name,
    initials: group.initials,
    colorIdx: group.name.length % CHAT_COLORS.length,
    online: false,
    isGroup: true,
    members: group.memberIds,
  }
}
