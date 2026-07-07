import { useEffect, useState } from "react"
import { getRealtimeState, type RealtimeState } from "../services/websocket-service"

/**
 * Indicateur d'etat du temps reel (Parametres > A propos). Trois verdicts :
 * - connecte ET confirme par le serveur ("ready")  -> tout va bien ;
 * - connecte mais jamais confirme                  -> serveur temps reel en panne ;
 * - deconnecte                                     -> reconnexion en cours.
 */
export default function RealtimeStatus() {
  const [state, setState] = useState<RealtimeState>(() => getRealtimeState())

  useEffect(() => {
    const id = setInterval(() => setState(getRealtimeState()), 2000)
    return () => clearInterval(id)
  }, [])

  let color = "var(--danger)"
  let label = "Deconnecte — reconnexion en cours..."
  if (state.connected && state.ready) {
    color = "var(--success)"
    label = "Connecte — temps reel operationnel"
  } else if (state.connected && !state.ready) {
    color = "#f59e0b"
    label = "Connecte mais le serveur ne repond pas (panne cote serveur temps reel)"
  }

  const secondsAgo =
    state.lastEventAt > 0 ? Math.round((Date.now() - state.lastEventAt) / 1000) : null

  return (
    <div
      className="about-row"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "11px 0",
        borderBottom: "1px solid var(--border-subtle)",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>
        Temps reel (messages)
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          textAlign: "right",
          color,
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        {label}
        {secondsAgo !== null && state.connected && state.ready && (
          <span style={{ color: "var(--text-faint)" }}>
            (dernier evenement il y a {secondsAgo} s)
          </span>
        )}
      </span>
    </div>
  )
}
