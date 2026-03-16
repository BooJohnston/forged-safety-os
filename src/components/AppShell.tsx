import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../hooks/useI18n'
import { useOffline } from '../hooks/useOffline'
import { ProjectBar } from './ProjectBar'
import { PageTranslator } from './PageTranslator'
import { Dashboard } from '../pages/Dashboard'
import { Projects } from '../pages/Projects'
import { PhotoAnalysis } from '../pages/PhotoAnalysis'
import { HazardManager } from '../pages/HazardManager'
import { DailyLog } from '../pages/DailyLog'
import { Incidents } from '../pages/Incidents'
import { NearMisses } from '../pages/NearMisses'
import { Inspections } from '../pages/Inspections'
import { Permits } from '../pages/Permits'
import { ToolboxTalks } from '../pages/ToolboxTalks'
import { VoiceCoPilot } from '../pages/VoiceCoPilot'
import { WeeklyReport } from '../pages/WeeklyReport'
import { RiskForecast } from '../pages/RiskForecast'
import { AbatementEvidence } from '../pages/AbatementEvidence'
import { PreStart } from '../pages/PreStart'
import { JHABuilder } from '../pages/JHABuilder'
import { TrainingTracker, SDSChemical, Orientation, AuditTracker, Settings } from '../pages/CrudModules'
import { CraneLiftPlans, EmergencyPlan, SubScorecards, RegulatoryEngine, DocumentIntel, Intelligence } from '../pages/FinalModules'
import { Reports } from '../pages/Reports'
import { Placeholder } from '../pages/Placeholder'
import { WeatherRisk } from '../pages/WeatherRisk'
import { OSHAAudit } from '../pages/OSHAAudit'
import { TeamPage } from '../pages/TeamPage'

const NAV_KEYS = [
  { path: '/', icon: '📊', key: 'nav.dashboard' },
  { path: '/projects', icon: '🏗️', key: 'nav.projects' },
  { path: '/team', icon: '👥', key: 'nav.team' },
  { path: '/hazards', icon: '⚠️', key: 'nav.hazards' },
  { path: '/photos', icon: '📸', key: 'nav.photos' },
  { path: '/prestart', icon: '✅', key: 'nav.prestart' },
  { path: '/daily', icon: '📋', key: 'nav.daily' },
  { path: '/weekly', icon: '📅', key: 'nav.weekly' },
  { path: '/inspections', icon: '🔍', key: 'nav.inspections' },
  { path: '/incidents', icon: '🚨', key: 'nav.incidents' },
  { path: '/nearmiss', icon: '⚡', key: 'nav.nearmiss' },
  { path: '/abatement', icon: '📦', key: 'nav.abatement' },
  { path: '/permits', icon: '📜', key: 'nav.permits' },
  { path: '/training', icon: '🎓', key: 'nav.training' },
  { path: '/toolbox', icon: '🔧', key: 'nav.toolbox' },
  { path: '/subscores', icon: '🏢', key: 'nav.subscores' },
  { path: '/jha', icon: '📝', key: 'nav.jha' },
  { path: '/sds', icon: '☣️', key: 'nav.sds' },
  { path: '/crane', icon: '🏗️', key: 'nav.crane' },
  { path: '/eap', icon: '🚒', key: 'nav.eap' },
  { path: '/audit', icon: '✅', key: 'nav.audit' },
  { path: '/orientation', icon: '🎓', key: 'nav.orientation' },
  { path: '/regulatory', icon: '⚖️', key: 'nav.regulatory' },
  { path: '/documents', icon: '📁', key: 'nav.documents' },
  { path: '/reports', icon: '📊', key: 'nav.reports' },
  { path: '/risk', icon: '🎯', key: 'nav.risk' },
  { path: '/weather', icon: '🌤️', key: 'nav.weather' },
  { path: '/osha-audit', icon: '🏛️', key: 'nav.oshaAudit' },
  { path: '/voice', icon: '🎤', key: 'nav.voice' },
  { path: '/intelligence', icon: '🧠', key: 'nav.intelligence' },
  { path: '/settings', icon: '⚙️', key: 'nav.settings' },
]

export function AppShell() {
  const { user, signOut } = useAuth()
  const { lang, setLang, t } = useI18n()
  const { isOffline, pendingCount } = useOffline()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Offline banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] py-1.5 px-4 text-center text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
          📡 {t('offline.banner')}{pendingCount > 0 && ` (${pendingCount} ${t('offline.pending')})`}
        </div>
      )}
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-56 flex flex-col transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg2)', borderRight: '1px solid var(--bdr)' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--bdr)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>⛑️</div>
          <span className="font-mono text-xs font-bold tracking-wider" style={{ color: 'var(--acc)' }}>SAFETY INTEL</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-1.5">
          {NAV_KEYS.map(item => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <button key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm transition-all mb-0.5 ${
                  active ? 'font-semibold' : ''
                }`}
                style={{
                  background: active ? 'rgba(249,115,22,.12)' : 'transparent',
                  color: active ? 'var(--acc)' : 'var(--t2)',
                  borderLeft: active ? '3px solid var(--acc)' : '3px solid transparent'
                }}>
                <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                <span className="truncate">{t(item.key)}</span>
              </button>
            )
          })}
        </nav>

        {/* User + Language */}
        <div className="shrink-0 p-2.5" style={{ borderTop: '1px solid var(--bdr)' }}>
          {/* Language switcher */}
          <div className="flex justify-center gap-1 mb-2">
            <button onClick={() => setLang('en')}
              className="px-2.5 py-1 rounded text-[10px] font-bold transition-all"
              style={{ background: lang === 'en' ? 'rgba(249,115,22,.15)' : 'transparent', color: lang === 'en' ? 'var(--acc)' : 'var(--t3)', border: `1px solid ${lang === 'en' ? 'var(--acc)' : 'var(--bdr)'}` }}>
              EN
            </button>
            <button onClick={() => setLang('es')}
              className="px-2.5 py-1 rounded text-[10px] font-bold transition-all"
              style={{ background: lang === 'es' ? 'rgba(249,115,22,.15)' : 'transparent', color: lang === 'es' ? 'var(--acc)' : 'var(--t3)', border: `1px solid ${lang === 'es' ? 'var(--acc)' : 'var(--bdr)'}` }}>
              ES
            </button>
          </div>
          <div className="text-xs text-center mb-1.5" style={{ color: 'var(--t3)' }}>{userName}</div>
          <button onClick={signOut}
            className="w-full py-1.5 rounded-lg text-xs cursor-pointer transition-all hover:border-orange-500"
            style={{ background: 'transparent', color: 'var(--t3)', border: '1px solid var(--bdr)' }}>
            {t('common.signOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Real-time page translator */}
        <PageTranslator />

        {/* Project context bar */}
        <ProjectBar />

        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-3" style={{ borderBottom: '1px solid var(--bdr)' }}>
          <button onClick={() => setMobileOpen(true)} className="text-xl" style={{ color: 'var(--t2)' }}>☰</button>
          <span className="font-mono text-xs font-bold tracking-wider" style={{ color: 'var(--acc)' }}>SAFETY INTEL</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/photos" element={<PhotoAnalysis />} />
            <Route path="/hazards" element={<HazardManager />} />
            <Route path="/daily" element={<DailyLog />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/nearmiss" element={<NearMisses />} />
            <Route path="/inspections" element={<Inspections />} />
            <Route path="/permits" element={<Permits />} />
            <Route path="/weekly" element={<WeeklyReport />} />
            <Route path="/toolbox" element={<ToolboxTalks />} />
            <Route path="/voice" element={<VoiceCoPilot />} />
            <Route path="/risk" element={<RiskForecast />} />
            <Route path="/abatement" element={<AbatementEvidence />} />
            <Route path="/prestart" element={<PreStart />} />
            {/* Modules to build next */}
            <Route path="/training" element={<TrainingTracker />} />
            <Route path="/subscores" element={<SubScorecards />} />
            <Route path="/jha" element={<JHABuilder />} />
            <Route path="/sds" element={<SDSChemical />} />
            <Route path="/crane" element={<CraneLiftPlans />} />
            <Route path="/eap" element={<EmergencyPlan />} />
            <Route path="/audit" element={<AuditTracker />} />
            <Route path="/orientation" element={<Orientation />} />
            <Route path="/regulatory" element={<RegulatoryEngine />} />
            <Route path="/documents" element={<DocumentIntel />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/weather" element={<WeatherRisk />} />
            <Route path="/osha-audit" element={<OSHAAudit />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
