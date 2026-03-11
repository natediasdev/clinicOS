import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LandingPage from "./pages/public/LandingPage"
import Dashboard from "./pages/app/Dashboard"
import Patients from "./pages/app/Patients"
import PatientRecord from "./pages/app/PatientRecord"
import Appointments from "./pages/auth/Appointments"
import ClinicProfile from "./pages/app/ClinicProfile"
import Team from "./pages/app/Team"
import Financial from "./pages/app/Financial"
import PrivacyPolicy from "./pages/public/PrivacyPolicy"
import TermsOfUse from "./pages/public/TermsOfUse"
import Onboarding from "./pages/onboarding/Onboarding"
import Login from "./pages/auth/Login"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword from "./pages/auth/ResetPassword"
import { useAuth } from "./context/AuthContext"

// Detecta se está rodando como app nativo (Android/iOS via Capacitor)
const isNative = window?.Capacitor?.isNativePlatform?.() ?? false

function PrivateRoute({ children }) {
  const { user, loading, onboardingCompleted } = useAuth()
  if (loading) return <p style={{ color: "#94a3b8", padding: 40, fontFamily: "sans-serif" }}>Carregando...</p>
  if (!user) return <Navigate to="/login" replace />
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ color: "#94a3b8", padding: 40, fontFamily: "sans-serif" }}>Carregando...</p>
  return !user ? children : <Navigate to="/dashboard" replace />
}

function OnboardingRoute() {
  const { user, loading, onboardingCompleted } = useAuth()
  if (loading) return <p style={{ color: "#94a3b8", padding: 40, fontFamily: "sans-serif" }}>Carregando...</p>
  if (!user) return <Navigate to="/login" replace />
  if (onboardingCompleted) return <Navigate to="/dashboard" replace />
  return <Onboarding />
}

function App() {
  const { loading } = useAuth()
  if (loading) return <p style={{ color: "#94a3b8", padding: 40, fontFamily: "sans-serif" }}>Carregando...</p>

  return (
    <BrowserRouter>
      <Routes>
        {/*
          Rota raiz:
          - Web/PC  → LandingPage
          - Mobile  → redireciona direto para /login
        */}
        <Route
          path="/"
          element={isNative ? <Navigate to="/login" replace /> : <LandingPage />}
        />

        <Route path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />
        <Route path="/forgot-password"
          element={<PublicRoute><ForgotPassword /></PublicRoute>}
        />

        {/* Reset password não usa PublicRoute — o usuário chega via link de email com sessão temporária */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Onboarding — requer auth mas não verifica onboarding_completed */}
        <Route path="/onboarding" element={<OnboardingRoute />} />

        <Route path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />
        <Route path="/patients"
          element={<PrivateRoute><Patients /></PrivateRoute>}
        />
        <Route path="/patients/:id"
          element={<PrivateRoute><PatientRecord /></PrivateRoute>}
        />
        <Route path="/appointments"
          element={<PrivateRoute><Appointments /></PrivateRoute>}
        />
        <Route path="/profile"
          element={<PrivateRoute><ClinicProfile /></PrivateRoute>}
        />
        <Route path="/team"
          element={<PrivateRoute><Team /></PrivateRoute>}
        />
        <Route path="/financeiro"
          element={<PrivateRoute><Financial /></PrivateRoute>}
        />

        {/*
          Páginas públicas:
          - Web → acessíveis normalmente
          - Mobile → redireciona para login (não fazem sentido no app)
        */}
        <Route
          path="/privacy"
          element={isNative ? <Navigate to="/login" replace /> : <PrivacyPolicy />}
        />
        <Route
          path="/terms"
          element={isNative ? <Navigate to="/login" replace /> : <TermsOfUse />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
