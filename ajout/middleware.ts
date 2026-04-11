import { NextRequest, NextResponse } from "next/server"
import { jwtVerify }                 from "jose"

// ─── Config des routes ────────────────────────────────────────────────────────

// Routes accessibles sans session
const PUBLIC_ROUTES  = ["/welcome"]

// Routes accessibles uniquement si NON connecté
// (si connecté → redirect /dashboard)
const AUTH_ROUTES    = ["/login", "/sign-in", "/reset-password"]

// Tout le reste est protégé (dashboard, chats, calls, settings…)
// Si non connecté → redirect /login

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Vérifie et décode le JWT depuis le cookie httpOnly.
 * On utilise jose (edge-compatible) — jamais jsonwebtoken côté middleware
 * car celui-ci ne tourne pas dans le Edge Runtime de Next.js.
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
    )
    await jwtVerify(token, secret)
    return true
  } catch {
    // Token expiré, malformé ou signature invalide
    return false
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Ignorer les fichiers statiques et les routes API internes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")   ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // ── Lire le token depuis le cookie httpOnly ──
  // Le serveur Spring Boot pose ce cookie à la connexion :
  // Set-Cookie: session_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/
  const tokenCookie = req.cookies.get("session_token")
  const token = tokenCookie?.value ?? null

  // Vérifier la validité du token
  const isAuthenticated = token ? await verifyToken(token) : false

  // ── 1. Route publique : laisser passer ──────────────────────────────────────
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // ── 2. Route d'auth : si déjà connecté → dashboard ─────────────────────────
  if (AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // ── 3. Route protégée : si non connecté → login ─────────────────────────────
  if (!isAuthenticated) {
    // Sauvegarder l'URL cible pour rediriger après connexion
    // Ex : /chats/1 → après login → retourne sur /chats/1
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ── 4. Connecté sur route protégée : continuer ───────────────────────────────
  // Injecter l'info "authentifié" dans les headers
  // pour que les layouts serveur puissent le lire sans re-vérifier
  const response = NextResponse.next()
  response.headers.set("x-is-authenticated", "true")
  return response
}

// ─── Matcher : sur quelles routes le middleware tourne ────────────────────────
// On exclut les fichiers statiques au niveau du matcher pour la performance
export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     * - _next/static  (fichiers statiques Next.js)
     * - _next/image   (optimisation images)
     * - favicon.ico
     * - fichiers avec extension (.png, .jpg, .svg…)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
