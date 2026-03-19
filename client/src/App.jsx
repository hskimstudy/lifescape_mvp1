import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

// Public Components
import Auth from './components/Auth'
import ImageEditor from './components/ImageEditor'
import Landing from './components/Landing'
import Onboarding from './components/Onboarding'
import Toast from './components/Toast'

// Admin Components
import AdminLayout from './components/admin/AdminLayout'
import DashboardOverview from './components/admin/DashboardOverview'
import InquiryManagement from './components/admin/InquiryManagement'
import FeedbackManagement from './components/admin/FeedbackManagement'
import UserManagement from './components/admin/UserManagement'
import PaymentHistory from './components/admin/PaymentHistory'
import GeneratedImages from './components/admin/GeneratedImages'

// ===== Admin Access Control =====
// Only these email addresses can access the /admin dashboard.
// Add or remove emails below to manage admin access.
const ADMIN_EMAILS = [
  'lifescape.ls.kr@gmail.com',
  'hskimstudy@gmail.com',
  'woghkszhf@ajou.ac.kr',
  'woghkszhf@naver.com',
]

const RequireAdmin = ({ session, isAuthChecked, children }) => {
  if (!isAuthChecked) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>보안 확인 중...</div>
  }

  if (!session) {
    console.log("RequireAdmin - Not authenticated, returning to Landing")
    return <Navigate to="/" replace />
  }

  const userEmail = (session.user?.email || session.user?.user_metadata?.email)?.toLowerCase()
  console.log("RequireAdmin - Detected User Email:", userEmail)

  const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail)
  console.log("RequireAdmin - Is Admin List Member:", isAdmin)

  if (!isAdmin) {
    console.warn("RequireAdmin - Access Denied: User email not in admin list.")
    return <Navigate to="/" replace />
  }

  console.log("RequireAdmin - Access Granted")
  return children
}

function App() {
  const [session, setSession] = useState(null)
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [isSignupFlow, setIsSignupFlow] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [toast, setToast] = useState(null)

  // Global Toast Handler
  useEffect(() => {
    const handleToastEvent = (e) => {
      const { message, type } = e.detail
      setToast({ message, type, id: Date.now() })
    }
    window.addEventListener('itda-toast', handleToastEvent)

    // Also expose as a global function for convenience
    window.showToast = (message, type = 'success') => {
      window.dispatchEvent(new CustomEvent('itda-toast', { detail: { message, type } }))
    }

    return () => window.removeEventListener('itda-toast', handleToastEvent)
  }, [])

  const showToast = (message, type = 'success') => {
    window.showToast(message, type)
  }

  useEffect(() => {
    console.log("App mounted, checking session...")

    // Safety timeout - ensures UI unblocks even if auth is slow
    const timeoutId = setTimeout(() => {
      setIsAuthChecked(true)
    }, 2500)

    const handleProfileSync = async (session) => {
      if (!session?.user) return;
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, company, phone')
          .eq('id', session.user.id)
          .single()

        if (!existingProfile) {
          console.log("App: Creating missing profile for user", session.user.id)
          await supabase.from('profiles').insert([{
            id: session.user.id,
            email: session.user.email,
            credits: 100,
            status: 'active'
          }])
          setNeedsOnboarding(true)
        } else {
          await supabase.from('profiles').update({
            email: session.user.email,
            status: 'active'
          }).eq('id', session.user.id)

          if (!existingProfile.company || !existingProfile.phone) {
            setNeedsOnboarding(true)
          } else {
            setNeedsOnboarding(false)
          }
        }
        console.log("App: Profile sync complete")
      } catch (error) {
        console.error("App: Profile sync exception:", error)
      }
    }

    // Initial session check
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        if (session) {
          console.log("App: Session detected on mount, auto-starting...")
          setIsStarted(true)
          handleProfileSync(session)
        }
      })
      .catch(err => console.error("Session init error:", err))
      .finally(() => {
        clearTimeout(timeoutId)
        setIsAuthChecked(true)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event)
      setSession(session)
      if (session) {
        setIsStarted(true)
        handleProfileSync(session)
      }

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setNeedsOnboarding(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    console.log("Logout triggered, performing immediate cleanup...");

    // 1. Immediate UI update
    setSession(null)
    setIsStarted(false)
    setIsSignupFlow(false)

    // 2. Clear storage to ensure session doesn't persist on refresh
    try {
      window.sessionStorage.clear()
      window.localStorage.clear()
      // Note: Supabase SDK might use specific keys, but clearing all is safest here
    } catch (e) {
      console.error("Storage clear error:", e);
    }

    // 3. Background sign out (don't await to avoid UI hang)
    supabase.auth.signOut().catch(err => console.error("Server signOut error:", err))

    console.log("Logout cleanup complete, Redirecting to home...");
  }


  return (
    <>
      <Routes>
        <Route path="/" element={
          <div className="app-wrapper">
            {!isStarted ? (
              <Landing session={session} onStart={() => setIsStarted(true)} onLogout={handleLogout} showToast={showToast} />
            ) : (
              !session || isSignupFlow ? (
                <Auth
                  onBack={() => { setIsStarted(false); setIsSignupFlow(false); }}
                  onSignupStart={() => setIsSignupFlow(true)}
                  onSignupSuccess={() => setIsSignupFlow(false)}
                  showToast={showToast}
                />
              ) : (
                needsOnboarding ? (
                  <Onboarding session={session} onComplete={() => setNeedsOnboarding(false)} showToast={showToast} />
                ) : (
                  <ImageEditor session={session} onBack={() => setIsStarted(false)} onLogout={handleLogout} showToast={showToast} />
                )
              )
            )}
          </div>
        } />

        <Route path="/admin" element={
          <RequireAdmin session={session} isAuthChecked={isAuthChecked}>
            <AdminLayout session={session} onLogout={handleLogout} />
          </RequireAdmin>
        }>
          <Route index element={<DashboardOverview />} />
          <Route path="generations" element={<GeneratedImages />} />
          <Route path="inquiries" element={<InquiryManagement />} />
          <Route path="feedback" element={<FeedbackManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="payments" element={<PaymentHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Toast Container */}
      <div className="itda-toast-container">
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  );
}

export default App

