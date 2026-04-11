export interface SessionUser {
  name: string
  phone: string
  email?: string
  statusMsg?: string
  avatar?: string | null
}

const STORAGE_KEY = "alanya-session-user-v1"

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function normalizePhoneNumber(phone: string) {
  return phone.replace(/\s+/g, "").replace(/[()-]/g, "")
}

export function toInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "UA"
}

export function loadSessionUser(): SessionUser | null {
  if (!hasStorage()) return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    if (!parsed?.name || !parsed?.phone) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSessionUser(user: SessionUser) {
  if (!hasStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

