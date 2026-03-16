import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ProjectProvider } from './hooks/useProject'
import { I18nProvider } from './hooks/useI18n'
import { CompanyProvider } from './hooks/useCompany'
import { LoginPage } from './pages/LoginPage'
import { AppShell } from './components/AppShell'
import './styles/globals.css'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">⛑️</div>
          <div className="font-mono text-xs tracking-widest" style={{ color: 'var(--acc)' }}>FORGED SAFETY OS</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--t3)' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <I18nProvider>
        <CompanyProvider>
          <ProjectProvider>
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
              <Route path="/*" element={user ? <AppShell /> : <Navigate to="/login" />} />
            </Routes>
          </ProjectProvider>
        </CompanyProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}
