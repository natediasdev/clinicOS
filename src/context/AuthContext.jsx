import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user,                setUser]                = useState(null)
  const [clinicId,            setClinicId]            = useState(null)
  const [clinic,              setClinic]              = useState(null)
  const [role,                setRole]                = useState("admin")
  const [onboardingCompleted, setOnboardingCompleted] = useState(null)
  const [loading,             setLoading]             = useState(true)
  const [subscriptionActive,  setSubscriptionActive]  = useState(true)

  // ── Inicialização ──────────────────────────────────────────────────────────
  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      setLoading(false)
    }
    initialize()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Carrega perfil quando o usuário muda ───────────────────────────────────
  useEffect(() => {
    if (!user) {
      setClinicId(null)
      setClinic(null)
      setRole("admin")
      setOnboardingCompleted(null)
      setSubscriptionActive(true)
      return
    }
    fetchProfile(user.id)
  }, [user])

  async function fetchProfile(userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id, onboarding_completed, role")
      .eq("id", userId)
      .single()

    const cid = profile?.clinic_id ?? null
    setClinicId(cid)
    setRole(profile?.role ?? "admin")
    setOnboardingCompleted(profile?.onboarding_completed ?? false)

    if (!cid) return

    const { data: clinicData } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", cid)
      .single()

    setClinic(clinicData ?? null)

    // Só checa assinatura se for pro — evita chamada desnecessária no free
    if (clinicData?.plan === "pro") {
      await checkSubscriptionAccess(cid)
    }
  }

  // ── checkSubscriptionAccess ────────────────────────────────────────────────
  // JWT Verification está enabled na edge function, então precisamos enviar
  // o token explicitamente no header Authorization.
  async function checkSubscriptionAccess(cid) {
    try {
      // Obter sessão atual para pegar o token JWT
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Se não tiver sessão ou erro, pula a verificação
      if (sessionError || !session?.access_token) {
        console.warn("No valid session, skipping subscription check")
        setSubscriptionActive(true)
        return
      }

      const headers = { 
        Authorization: `Bearer ${session.access_token}` 
      }

      const { data, error } = await supabase.functions.invoke(
        "check-subscription-status",
        { 
          body: { clinic_id: cid },
          headers
        }
      )

      if (error) throw error

      setSubscriptionActive(data?.active !== false)
    } catch (err) {
      console.error("Check subscription error:", err)
      // Em caso de erro, não bloqueia o acesso — evita tela preta por falha de rede
      setSubscriptionActive(true)
    }
  }

  // ── Login / Logout ─────────────────────────────────────────────────────────
  const login  = async (email, password) =>
    await supabase.auth.signInWithPassword({ email, password })

  const logout = async () => await supabase.auth.signOut()

  // ── refreshClinic ──────────────────────────────────────────────────────────
  const refreshClinic = async () => {
    if (!clinicId) return
    const { data } = await supabase
      .from("clinics").select("*").eq("id", clinicId).single()
    if (data) {
      setClinic(data)
      if (data.plan === "pro") {
        await checkSubscriptionAccess(clinicId)
      } else {
        setSubscriptionActive(true)
      }
    }
  }

  // ── refreshOnboarding ──────────────────────────────────────────────────────
  const refreshOnboarding = async () => {
    if (!user) return
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()
    setOnboardingCompleted(profile?.onboarding_completed ?? false)
  }

  return (
    <AuthContext.Provider value={{
      user, clinicId, clinic, role, onboardingCompleted,
      login, logout, loading,
      refreshClinic, refreshOnboarding,
      subscriptionActive, checkSubscriptionAccess,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
