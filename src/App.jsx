import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LandingPage      from "./pages/public/LandingPage"
import Dashboard        from "./pages/app/Dashboard"
import Patients         from "./pages/app/Patients"
import Appointments     from "./pages/auth/Appointments"
import ClinicProfile    from "./pages/app/ClinicProfile"
import Team             from "./pages/app/Team"
import PrivacyPolicy    from "./pages/public/PrivacyPolicy"
import TermsOfUse       from "./pages/public/TermsOfUse"
import Onboarding       from "./pages/onboarding/Onboarding"
import Login            from "./pages/auth/Login"
import ForgotPassword   from "./pages/auth/ForgotPassword"
import ResetPassword    from "./pages/auth/ResetPassword"
import PatientRecord    from "./pages/app/PatientRecord"
import Financial        from "./pages/app/Financial"
import LoadingScreen    from "./components/LoadingScreen"
import { useAuth }      from "./context/AuthContext"

function PrivateRoute({ children }) {
  const { user, loading, onboardingCompleted } = useAuth()
  if (loading) return <LoadingScreen message="Verificando sessão..." />
  if (!user) return <Navigate to="/login" replace />
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen message="Carregando..." />
  return !user ? children : <Navigate to="/dashboard" replace />
}

function OnboardingRoute() {
  const { user, loading, onboardingCompleted } = useAuth()
  if (loading) return <LoadingScreen message="Preparando..." />
  if (!user) return <Navigate to="/login" replace />
  if (onboardingCompleted) return <Navigate to="/dashboard" replace />
  return <Onboarding />
}

function App() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen message="Iniciando ClinicOS..." />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />
        <Route path="/forgot-password"
          element={<PublicRoute><ForgotPassword /></PublicRoute>}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="/financeiro"
          element={<PrivateRoute><Financial /></PrivateRoute>}
        />
        <Route path="/profile"
          element={<PrivateRoute><ClinicProfile /></PrivateRoute>}
        />
        <Route path="/team"
          element={<PrivateRoute><Team /></PrivateRoute>}
        />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms"   element={<TermsOfUse />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
