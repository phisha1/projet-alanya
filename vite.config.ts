import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  // sockjs-client utilise `global` (API Node) qui n'existe pas dans le navigateur.
  // On le pointe sur `globalThis` pour le faire fonctionner cote front.
  define: {
    global: "globalThis",
  },
})
