import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Lang = 'en' | 'es'

type I18nContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en', setLang: () => {}, t: (k) => k
})

// ═══ TRANSLATIONS ═══
const translations: Record<string, Record<Lang, string>> = {
  // ─── Navigation ───
  'nav.dashboard': { en: 'Dashboard', es: 'Panel' },
  'nav.projects': { en: 'Projects', es: 'Proyectos' },
  'nav.team': { en: 'Team', es: 'Equipo' },
  'nav.hazards': { en: 'Hazard Manager', es: 'Gestor de Peligros' },
  'nav.photos': { en: 'Photo Analysis', es: 'Análisis de Fotos' },
  'nav.prestart': { en: 'Pre-Start Readiness', es: 'Preparación Pre-Inicio' },
  'nav.daily': { en: 'Daily Log', es: 'Registro Diario' },
  'nav.weekly': { en: 'Weekly Report', es: 'Informe Semanal' },
  'nav.inspections': { en: 'Inspections', es: 'Inspecciones' },
  'nav.incidents': { en: 'Incidents', es: 'Incidentes' },
  'nav.nearmiss': { en: 'Near Misses', es: 'Casi Accidentes' },
  'nav.abatement': { en: 'Abatement Evidence', es: 'Evidencia de Corrección' },
  'nav.permits': { en: 'Permits', es: 'Permisos' },
  'nav.training': { en: 'Training Tracker', es: 'Control de Capacitación' },
  'nav.toolbox': { en: 'Toolbox Talks', es: 'Charlas de Seguridad' },
  'nav.subscores': { en: 'Sub Scorecards', es: 'Tarjetas de Subcontratistas' },
  'nav.jha': { en: 'JHA/JSA Builder', es: 'Generador de ATS' },
  'nav.sds': { en: 'SDS Chemical Mgr', es: 'Gestor Químico HDS' },
  'nav.crane': { en: 'Crane & Lift Plans', es: 'Planes de Grúa e Izaje' },
  'nav.eap': { en: 'Emergency Plan', es: 'Plan de Emergencia' },
  'nav.audit': { en: 'Audit Tracker', es: 'Control de Auditorías' },
  'nav.orientation': { en: 'Orientation', es: 'Orientación' },
  'nav.regulatory': { en: 'Regulatory Engine', es: 'Motor Regulatorio' },
  'nav.documents': { en: 'Document Intel', es: 'Intel de Documentos' },
  'nav.reports': { en: 'Reports', es: 'Informes' },
  'nav.risk': { en: 'Risk Forecast', es: 'Pronóstico de Riesgo' },
  'nav.weather': { en: 'Weather Risk', es: 'Riesgo Climático' },
  'nav.oshaAudit': { en: 'OSHA Audit Sim', es: 'Simulador OSHA' },
  'nav.voice': { en: 'Voice Co-Pilot', es: 'Co-Piloto de Voz' },
  'nav.intelligence': { en: 'Intelligence', es: 'Inteligencia' },
  'nav.settings': { en: 'Settings', es: 'Configuración' },

  // ─── Common UI ───
  'common.save': { en: 'Save', es: 'Guardar' },
  'common.cancel': { en: 'Cancel', es: 'Cancelar' },
  'common.delete': { en: 'Delete', es: 'Eliminar' },
  'common.close': { en: 'Close', es: 'Cerrar' },
  'common.print': { en: 'Print', es: 'Imprimir' },
  'common.export': { en: 'Export CSV', es: 'Exportar CSV' },
  'common.loading': { en: 'Loading...', es: 'Cargando...' },
  'common.signOut': { en: 'Sign Out', es: 'Cerrar Sesión' },
  'common.new': { en: 'New', es: 'Nuevo' },
  'common.all': { en: 'All', es: 'Todos' },
  'common.open': { en: 'Open', es: 'Abierto' },
  'common.closed': { en: 'Closed', es: 'Cerrado' },
  'common.total': { en: 'Total', es: 'Total' },
  'common.status': { en: 'Status', es: 'Estado' },
  'common.date': { en: 'Date', es: 'Fecha' },
  'common.location': { en: 'Location', es: 'Ubicación' },
  'common.description': { en: 'Description', es: 'Descripción' },
  'common.severity': { en: 'Severity', es: 'Severidad' },
  'common.category': { en: 'Category', es: 'Categoría' },
  'common.analyze': { en: 'Analyze with AI', es: 'Analizar con IA' },
  'common.analyzing': { en: 'Analyzing...', es: 'Analizando...' },
  'common.noData': { en: 'No data yet.', es: 'Sin datos aún.' },
  'common.overdue': { en: 'Overdue', es: 'Vencido' },
  'common.critical': { en: 'Critical', es: 'Crítico' },
  'common.high': { en: 'High', es: 'Alto' },
  'common.moderate': { en: 'Moderate', es: 'Moderado' },
  'common.low': { en: 'Low', es: 'Bajo' },

  // ─── Dashboard ───
  'dash.title': { en: 'Safety Dashboard', es: 'Panel de Seguridad' },
  'dash.subtitle': { en: 'Real-time safety intelligence', es: 'Inteligencia de seguridad en tiempo real' },
  'dash.openHazards': { en: 'Open Hazards', es: 'Peligros Abiertos' },
  'dash.incidents30d': { en: 'Incidents (30d)', es: 'Incidentes (30d)' },
  'dash.nearMisses': { en: 'Near Misses', es: 'Casi Accidentes' },
  'dash.safetyScore': { en: 'Safety Score', es: 'Puntuación de Seguridad' },
  'dash.penaltyExposure': { en: 'Penalty Exposure', es: 'Exposición a Multas' },
  'dash.quickActions': { en: 'Quick Actions', es: 'Acciones Rápidas' },
  'dash.recentActivity': { en: 'Recent Activity', es: 'Actividad Reciente' },
  'dash.alerts': { en: 'Active Alerts', es: 'Alertas Activas' },

  // ─── Hazards ───
  'haz.title': { en: 'Hazard Manager', es: 'Gestor de Peligros' },
  'haz.new': { en: '+ New Hazard', es: '+ Nuevo Peligro' },
  'haz.corrective': { en: 'Corrective Action', es: 'Acción Correctiva' },

  // ─── Incidents ───
  'inc.title': { en: 'Incident Reports', es: 'Reportes de Incidentes' },
  'inc.new': { en: '+ Report Incident', es: '+ Reportar Incidente' },
  'inc.rootCause': { en: 'Root Cause', es: 'Causa Raíz' },
  'inc.injuries': { en: 'Injuries', es: 'Lesiones' },

  // ─── Near Misses ───
  'nm.title': { en: 'Near Miss Reports', es: 'Reportes de Casi Accidentes' },
  'nm.new': { en: '+ Report Near Miss', es: '+ Reportar Casi Accidente' },
  'nm.anonymous': { en: 'Report anonymously', es: 'Reportar anónimamente' },
  'nm.whatHappened': { en: 'What happened?', es: '¿Qué pasó?' },

  // ─── Daily Log ───
  'daily.title': { en: 'Daily Safety Log', es: 'Registro Diario de Seguridad' },
  'daily.new': { en: '+ New Entry', es: '+ Nueva Entrada' },
  'daily.weather': { en: 'Weather', es: 'Clima' },
  'daily.manpower': { en: 'Manpower', es: 'Personal' },
  'daily.activities': { en: 'Activities', es: 'Actividades' },
  'daily.hazardsNoted': { en: 'Hazards Noted', es: 'Peligros Observados' },

  // ─── Permits ───
  'permit.title': { en: 'Permits', es: 'Permisos' },
  'permit.new': { en: '+ New Permit', es: '+ Nuevo Permiso' },
  'permit.active': { en: 'Active', es: 'Activo' },
  'permit.expired': { en: 'Expired', es: 'Vencido' },
  'permit.expiring': { en: 'Expiring', es: 'Por Vencer' },
  'permit.competent': { en: 'Competent Person', es: 'Persona Competente' },

  // ─── Training ───
  'train.title': { en: 'Training Tracker', es: 'Control de Capacitación' },
  'train.new': { en: '+ Add Training', es: '+ Agregar Capacitación' },
  'train.worker': { en: 'Worker Name', es: 'Nombre del Trabajador' },
  'train.cert': { en: 'Certification', es: 'Certificación' },
  'train.issued': { en: 'Date Issued', es: 'Fecha de Emisión' },
  'train.expires': { en: 'Expiration Date', es: 'Fecha de Vencimiento' },
  'train.current': { en: 'Current', es: 'Vigente' },

  // ─── Toolbox Talks ───
  'tb.title': { en: 'Toolbox Talks', es: 'Charlas de Seguridad' },
  'tb.generate': { en: 'Generate Toolbox Talk', es: 'Generar Charla de Seguridad' },
  'tb.suggested': { en: 'Suggested Topics', es: 'Temas Sugeridos' },
  'tb.printSignIn': { en: 'Print with Sign-In', es: 'Imprimir con Lista de Asistencia' },

  // ─── Photo Analysis ───
  'photo.title': { en: 'Photo & Video Analysis', es: 'Análisis de Fotos y Video' },
  'photo.hazardScan': { en: 'Hazard Scan — Find all hazards in photos', es: 'Escaneo de Peligros — Encontrar todos los peligros' },
  'photo.complianceCheck': { en: 'Compliance Check — "Is this compliant?"', es: 'Verificación de Cumplimiento — "¿Es conforme?"' },
  'photo.complianceQ': { en: 'Compliance Question', es: 'Pregunta de Cumplimiento' },
  'photo.consensus': { en: 'Build Dual AI Consensus Report', es: 'Crear Reporte de Consenso IA Dual' },
  'photo.autoHazards': { en: 'Auto-Generate Hazards', es: 'Auto-Generar Peligros' },
  'photo.sitePhotos': { en: 'Site Photos', es: 'Fotos del Sitio' },
  'photo.videoWalk': { en: 'Video Walkthrough', es: 'Recorrido en Video' },

  // ─── JHA ───
  'jha.title': { en: 'JHA / JSA Builder', es: 'Generador de ATS / AST' },
  'jha.generate': { en: 'Generate with AI', es: 'Generar con IA' },
  'jha.peerReview': { en: 'Peer Review', es: 'Revisión por Pares' },
  'jha.approve': { en: 'Approve', es: 'Aprobar' },

  // ─── Weather ───
  'wx.title': { en: 'Weather-Linked Risk Engine', es: 'Motor de Riesgo Climático' },
  'wx.refresh': { en: 'Refresh Weather', es: 'Actualizar Clima' },
  'wx.alerts': { en: 'Active Risk Alerts', es: 'Alertas de Riesgo Activas' },
  'wx.forecast': { en: '12-Hour Forecast', es: 'Pronóstico de 12 Horas' },

  // ─── OSHA Audit ───
  'audit.title': { en: 'OSHA Audit Simulator', es: 'Simulador de Auditoría OSHA' },
  'audit.run': { en: 'Run Mock OSHA Inspection', es: 'Ejecutar Inspección OSHA Simulada' },
  'audit.pass': { en: 'Pass', es: 'Aprobado' },
  'audit.fail': { en: 'Fail', es: 'Reprobado' },
  'audit.warning': { en: 'Warning', es: 'Advertencia' },
  'audit.satisfactory': { en: 'SATISFACTORY — Ready for inspection', es: 'SATISFACTORIO — Listo para inspección' },
  'audit.needsImprovement': { en: 'NEEDS IMPROVEMENT', es: 'NECESITA MEJORA' },
  'audit.unsatisfactory': { en: 'UNSATISFACTORY', es: 'INSATISFACTORIO' },

  // ─── Inspections ───
  'insp.title': { en: 'Inspections', es: 'Inspecciones' },
  'insp.new': { en: '+ New Inspection', es: '+ Nueva Inspección' },
  'insp.findings': { en: 'Findings', es: 'Hallazgos' },
  'insp.inspector': { en: 'Inspector', es: 'Inspector' },

  // ─── Orientation ───
  'orient.title': { en: 'Site Orientation', es: 'Orientación de Sitio' },
  'orient.new': { en: '+ Orient Worker', es: '+ Orientar Trabajador' },

  // ─── Offline ───
  'offline.banner': { en: 'You are offline. Changes will sync when connected.', es: 'Estás sin conexión. Los cambios se sincronizarán al conectarse.' },
  'offline.syncing': { en: 'Syncing offline data...', es: 'Sincronizando datos fuera de línea...' },
  'offline.synced': { en: 'All data synced!', es: '¡Todos los datos sincronizados!' },
  'offline.pending': { en: 'pending changes', es: 'cambios pendientes' },

  // ─── AI Prompts (appended to system prompts for Spanish output) ───
  'ai.respondInSpanish': { en: '', es: '\n\nIMPORTANT: Respond entirely in Spanish. All analysis, citations, findings, and recommendations must be in Spanish.' },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('forged-lang')
    return (saved === 'es' ? 'es' : 'en') as Lang
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('forged-lang', l)
  }

  const t = (key: string): string => {
    return translations[key]?.[lang] || translations[key]?.en || key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

// Helper: get AI prompt suffix for current language
export function getAILangSuffix(lang: Lang): string {
  if (lang === 'es') return '\n\nIMPORTANT: Respond entirely in Spanish. All analysis, citations, findings, and recommendations must be in Spanish.'
  return ''
}
