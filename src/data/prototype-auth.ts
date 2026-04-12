import { normalizePhoneNumber, type SessionUser } from "./session-user"

interface PrototypeAuthAccount extends SessionUser {
  password: string
}

const STORAGE_KEY = "alanya-prototype-auth-v1"

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function loadAccounts() {
  if (!hasStorage()) return [] as PrototypeAuthAccount[]

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PrototypeAuthAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAccounts(accounts: PrototypeAuthAccount[]) {
  if (!hasStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

function sanitizeSessionUser(account: PrototypeAuthAccount): SessionUser {
  return {
    name: account.name,
    phone: account.phone,
    email: account.email ?? "",
    statusMsg: account.statusMsg ?? "Disponible",
    avatar: account.avatar ?? null,
  }
}

export function restorePrototypeSession(phone: string) {
  const account = findPrototypeAccount(phone)
  return account ? sanitizeSessionUser(account) : null
}

export function findPrototypeAccount(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone)
  return loadAccounts().find((account) => account.phone === normalizedPhone) ?? null
}

export function registerPrototypeAccount(user: SessionUser, password: string) {
  const normalizedPhone = normalizePhoneNumber(user.phone)
  const accounts = loadAccounts().filter((account) => account.phone !== normalizedPhone)

  const nextAccount: PrototypeAuthAccount = {
    name: user.name.trim(),
    phone: normalizedPhone,
    email: user.email ?? "",
    statusMsg: user.statusMsg ?? "Disponible",
    avatar: user.avatar ?? null,
    password,
  }

  accounts.push(nextAccount)
  saveAccounts(accounts)

  return sanitizeSessionUser(nextAccount)
}

export function loginPrototypeAccount(phone: string, password: string) {
  const account = findPrototypeAccount(phone)

  if (!account) {
    throw new Error("Aucun compte ne correspond a ce numero. Creez un compte d'abord.")
  }

  if (account.password !== password) {
    throw new Error("Mot de passe incorrect.")
  }

  return sanitizeSessionUser(account)
}

export function updatePrototypeAccountProfile(user: SessionUser) {
  const normalizedPhone = normalizePhoneNumber(user.phone)
  const accounts = loadAccounts()
  const index = accounts.findIndex((account) => account.phone === normalizedPhone)

  if (index === -1) return

  accounts[index] = {
    ...accounts[index],
    name: user.name.trim(),
    email: user.email ?? "",
    statusMsg: user.statusMsg ?? "Disponible",
    avatar: user.avatar ?? null,
  }

  saveAccounts(accounts)
}

export function deletePrototypeAccount(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone)
  const accounts = loadAccounts().filter((account) => account.phone !== normalizedPhone)
  saveAccounts(accounts)
}
