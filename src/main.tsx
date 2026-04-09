import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import LoginPage from "../app/(auth)/login/login"
import ProtectedLayout from "../app/(protected)/layout"
import DashboardPage from "../app/(protected)/dashboard/dashboard"
import SignInPage from "../app/(auth)/sign-in/sign-in"
import WelcomePage from "../app/(public)/welcome/welcome"

function ProtectedPlaceholder({ title }: { title: string }) {
  return (
    <ProtectedLayout>
      <main style={{ padding: "32px 36px", color: "#E2E8F0", fontFamily: "'DM Sans', sans-serif" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>{title}</h1>
        <p style={{ color: "#9CA3AF" }}>Cette section sera branchée dans la prochaine étape.</p>
      </main>
    </ProtectedLayout>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/chats" element={<ProtectedPlaceholder title="Messages" />} />
        <Route path="/chats/:chatId" element={<ProtectedPlaceholder title="Conversation" />} />
        <Route path="/calls" element={<ProtectedPlaceholder title="Appels" />} />
        <Route path="/calls/:callId" element={<ProtectedPlaceholder title="Détail appel" />} />
        <Route path="/settings" element={<ProtectedPlaceholder title="Paramètres" />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
