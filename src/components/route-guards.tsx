import { type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./auth-provider"

function RouteGuardFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg-base)",
        color: "var(--text-muted)",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
      }}
    >
      Chargement...
    </div>
  )
}

export function AppEntryRoute() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return <RouteGuardFallback />
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/welcome"} replace />
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return <RouteGuardFallback />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return <RouteGuardFallback />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
