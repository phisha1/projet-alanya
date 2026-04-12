import {
  loadSessionUser,
  normalizePhoneNumber,
  type SessionUser,
} from "../data/session-user"
import {
  findPrototypeAccount,
  loginPrototypeAccount,
  registerPrototypeAccount,
  restorePrototypeSession,
} from "../data/prototype-auth"
import { ApiError, apiRequest } from "../lib/api-client"

export interface LoginPayload {
  phone: string
  password: string
}

export interface RegistrationDraft {
  name: string
  phone: string
  email: string
  password: string
}

export interface RegistrationOtpResponse {
  delivery: "debug" | "sms"
  debugOtp?: string
}

interface AuthUserResponse {
  user?: Partial<SessionUser>
  name?: string
  phone?: string
  email?: string
  statusMsg?: string
  avatar?: string | null
}

function shouldUsePrototypeFallback(error: unknown) {
  return error instanceof ApiError && [0, 404, 405, 501].includes(error.status)
}

function toSessionUser(user: Partial<SessionUser> | undefined, fallback: SessionUser): SessionUser {
  return {
    name: user?.name?.trim() || fallback.name,
    phone: user?.phone ? normalizePhoneNumber(user.phone) : fallback.phone,
    email: user?.email ?? fallback.email ?? "",
    statusMsg: user?.statusMsg ?? fallback.statusMsg ?? "Disponible",
    avatar: user?.avatar ?? fallback.avatar ?? null,
  }
}

function buildPrototypeUser(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone)
  const existing = loadSessionUser()

  return {
    name: existing?.name ?? "Utilisateur Alanya",
    phone: normalizedPhone,
    email: existing?.email ?? "",
    statusMsg: existing?.statusMsg ?? "Disponible",
    avatar: existing?.avatar ?? null,
  } satisfies SessionUser
}

export async function loginWithPassword(payload: LoginPayload) {
  const fallbackUser = buildPrototypeUser(payload.phone)

  try {
    const response = await apiRequest<AuthUserResponse>("/api/auth/login", {
      method: "POST",
      body: {
        phone: normalizePhoneNumber(payload.phone),
        password: payload.password,
      },
    })

    return toSessionUser(response.user ?? response, fallbackUser)
  } catch (error) {
    if (!shouldUsePrototypeFallback(error)) throw error
    return loginPrototypeAccount(fallbackUser.phone, payload.password)
  }
}

export async function restoreAuthenticatedUser() {
  const existing = loadSessionUser()
  if (!existing) return null

  try {
    const response = await apiRequest<AuthUserResponse>("/api/users/me")
    return toSessionUser(response.user ?? response, existing)
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      return null
    }

    if (!shouldUsePrototypeFallback(error)) {
      return existing
    }

    return restorePrototypeSession(existing.phone)
  }
}

export async function requestRegistrationOtp(draft: RegistrationDraft) {
  try {
    const response = await apiRequest<RegistrationOtpResponse>("/api/auth/register/request-otp", {
      method: "POST",
      body: {
        ...draft,
        phone: normalizePhoneNumber(draft.phone),
        email: draft.email.trim().toLowerCase(),
      },
    })

    return response
  } catch (error) {
    if (!shouldUsePrototypeFallback(error)) throw error

    if (findPrototypeAccount(draft.phone)) {
      throw new Error("Un compte existe deja avec ce numero. Connectez-vous a la place.")
    }

    return {
      delivery: "debug" as const,
      debugOtp: String(Math.floor(100000 + Math.random() * 900000)),
    }
  }
}

export async function completeRegistration(draft: RegistrationDraft, otp: string) {
  const fallbackUser: SessionUser = {
    name: draft.name.trim(),
    phone: normalizePhoneNumber(draft.phone),
    email: draft.email.trim().toLowerCase(),
    statusMsg: "Disponible",
    avatar: null,
  }

  try {
    const response = await apiRequest<AuthUserResponse>("/api/auth/register/verify", {
      method: "POST",
      body: {
        ...draft,
        phone: normalizePhoneNumber(draft.phone),
        email: draft.email.trim().toLowerCase(),
        otp,
      },
    })

    return toSessionUser(response.user ?? response, fallbackUser)
  } catch (error) {
    if (!shouldUsePrototypeFallback(error)) throw error
    return registerPrototypeAccount(fallbackUser, draft.password)
  }
}

export async function logoutCurrentSession() {
  try {
    await apiRequest<void>("/api/auth/logout", { method: "POST" })
  } catch (error) {
    if (!shouldUsePrototypeFallback(error)) throw error
  }
}

export async function logoutAllSessions() {
  try {
    await apiRequest<void>("/api/auth/logout-all", { method: "POST" })
  } catch (error) {
    if (!shouldUsePrototypeFallback(error)) throw error
  }
}

export async function deleteCurrentAccount() {
  try {
    await apiRequest<void>("/api/users/me", { method: "DELETE" })
  } catch (error) {
    if (!shouldUsePrototypeFallback(error)) throw error
  }
}
