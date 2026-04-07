import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import LandingPage    from "./pages/public/LandingPage"
import Dashboard      from "./pages/app/Dashboard"
import Patients       from "./pages/app/Patients"
import PatientRecord  from "./pages/app/PatientRecord"
import Appointments   from "./pages/auth/Appointments"
import ClinicProfile  from "./pages/app/ClinicProfile"
import Financial      from "./pages/app/Financial"
import Team           from "./pages/app/Team"
import PrivacyPolicy  from "./pages/public/PrivacyPolicy"
import TermsOfUse     from "./pages/public/TermsOfUse"
import Onboarding     from "./pages/onboarding/Onboarding"
import Groups         from "./pages/app/Groups"
import Login          from "./pages/auth/Login"
import Register       from "./pages/auth/Register"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword  from "./pages/auth/ResetPassword"
import Subscription        from "./pages/app/Subscription"
import SubscriptionBlocked from "./pages/app/SubscriptionBlocked"
import LoadingScreen       from "./components/LoadingScreen"
import { useAuth }    from "./context/AuthContext"

function PrivateRoute({ children }) {
  const { user, loading, onboardingCompleted, clinic, subscriptionActive } = useAuth()
  if (loading) return <LoadingScreen message="Verificando sessão..." />
  if (!user) return <Navigate to="/login" replace />
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />
  if (clinic?.plan === "pro" && !subscriptionActive) return <Navigate to="/subscription" replace />
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

function SubscriptionRoute() {
  const { user, loading, clinic, subscriptionActive } = useAuth()
  
  if (loading) {
    return <LoadingScreen message="Carregando..." />
  }
  
  if (!user) {
    return <LoadingScreen message="Verificando sessão..." />
  }
  
  if (clinic?.plan && clinic.plan !== "pro" && clinic.plan !== "free") {
    return <Navigate to="/dashboard" replace />
  }
  
  if (clinic?.plan === "pro" && !subscriptionActive) {
    return <SubscriptionBlocked />
  }
  
  return <Subscription />
}

// AnimatePresence precisa de useLocation dentro do BrowserRouter
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/privacy"        element={<PrivacyPolicy />} />
        <Route path="/terms"          element={<TermsOfUse />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/onboarding"     element={<OnboardingRoute />} />
        <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/patients"       element={<PrivateRoute><Patients /></PrivateRoute>} />
        <Route path="/groups"         element={<PrivateRoute><Groups /></PrivateRoute>} />
        <Route path="/patients/:id"   element={<PrivateRoute><PatientRecord /></PrivateRoute>} />
        <Route path="/appointments"   element={<PrivateRoute><Appointments /></PrivateRoute>} />
        <Route path="/financeiro"     element={<PrivateRoute><Financial /></PrivateRoute>} />
        <Route path="/profile"        element={<PrivateRoute><ClinicProfile /></PrivateRoute>} />
        <Route path="/team"           element={<PrivateRoute><Team /></PrivateRoute>} />
        <Route path="/subscription"   element={<SubscriptionRoute />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen message="Iniciando ClinicOS..." />
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
