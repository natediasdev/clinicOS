import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import { usePlanLimits } from "../hooks/usePlanLimits"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [clinicId, setClinicId] = useState(null)
  const [clinic, setClinic] = useState(null)
  const [role, setRole] = useState("admin")
  const [onboardingCompleted, setOnboardingCompleted] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionActive, setSubscriptionActive] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
      setLoading(false)
    }
    initialize()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

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

    if (cid) {
      const { data: clinicData } = await supabase
        .from("clinics").select("*").eq("id", cid).single()
      setClinic(clinicData ?? null)

      if (clinicData?.plan === "pro") {
        await checkSubscriptionAccess(cid)
      }
    }
  }

  async function checkSubscriptionAccess(cid) {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription-status", {
        body: { clinic_id: cid },
      })

      if (error) throw error

      if (data?.active === false) {
        setSubscriptionActive(false)
      } else {
        setSubscriptionActive(true)
      }
    } catch (err) {
      console.error("Check subscription error:", err)
      setSubscriptionActive(true)
    }
  }

  const login = async (email, password) =>
    await supabase.auth.signInWithPassword({ email, password })

  const logout = async () => await supabase.auth.signOut()

  const refreshClinic = async () => {
    if (!clinicId) return
    const { data } = await supabase.from("clinics").select("*").eq("id", clinicId).single()
    if (data) {
      setClinic(data)
      if (data.plan === "pro") {
        await checkSubscriptionAccess(clinicId)
      }
    }
  }

  const refreshOnboarding = async () => {
    if (!user) return
    const { data: profile } = await supabase
      .from("profiles").select("onboarding_completed").eq("id", user.id).single()
    setOnboardingCompleted(profile?.onboarding_completed ?? false)
  }

  return (
    <AuthContext.Provider value={{
      user, clinicId, clinic, role, onboardingCompleted,
      login, logout, loading, refreshClinic, refreshOnboarding,
      subscriptionActive, checkSubscriptionAccess,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
