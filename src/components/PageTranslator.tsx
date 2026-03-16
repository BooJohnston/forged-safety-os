import { useEffect, useRef } from 'react'
import { useI18n, type Lang } from '../hooks/useI18n'

// ═══ COMPREHENSIVE ENGLISH → SPANISH DICTIONARY ═══
// Covers all UI text across all 30 modules
const DICT: Record<string, string> = {
  // ─── Page Titles ───
  'Safety Dashboard': 'Panel de Seguridad',
  'Projects': 'Proyectos',
  'Hazard Manager': 'Gestor de Peligros',
  'Photo & Video Analysis': 'Análisis de Fotos y Video',
  'Photo & Video Hazard Analysis': 'Análisis de Peligros en Fotos y Video',
  'Pre-Start Readiness': 'Preparación Pre-Inicio',
  'Daily Safety Log': 'Registro Diario de Seguridad',
  'Weekly Safety Report': 'Informe Semanal de Seguridad',
  'Inspections': 'Inspecciones',
  'Incident Reports': 'Reportes de Incidentes',
  'Near Miss Reports': 'Reportes de Casi Accidentes',
  'Abatement Evidence': 'Evidencia de Corrección',
  'Permits': 'Permisos',
  'Training Tracker': 'Control de Capacitación',
  'Toolbox Talks': 'Charlas de Seguridad',
  'Sub Scorecards': 'Tarjetas de Subcontratistas',
  'JHA / JSA Builder': 'Generador de ATS / AST',
  'AHA Builder': 'Generador de AHA',
  'SDS Chemical Manager': 'Gestor Químico HDS',
  'Crane & Lift Plans': 'Planes de Grúa e Izaje',
  'Emergency Plan': 'Plan de Emergencia',
  'Audit & Compliance': 'Auditoría y Cumplimiento',
  'Site Orientation': 'Orientación de Sitio',
  'Regulatory Engine': 'Motor Regulatorio',
  'Document Intel': 'Intel de Documentos',
  'Reports': 'Informes',
  'Risk Forecast': 'Pronóstico de Riesgo',
  'Weather-Linked Risk Engine': 'Motor de Riesgo Climático',
  'OSHA Audit Simulator': 'Simulador de Auditoría OSHA',
  'USACE EM 385 Compliance Audit': 'Auditoría de Cumplimiento USACE EM 385',
  'Voice Co-Pilot': 'Co-Piloto de Voz',
  'Safety Intelligence': 'Inteligencia de Seguridad',
  'Settings': 'Configuración',
  'Team Management': 'Gestión del Equipo',
  'Set Up Your Company': 'Configure Su Empresa',
  'Invite Team Member': 'Invitar Miembro del Equipo',
  'Active Members': 'Miembros Activos',
  'Pending Invites': 'Invitaciones Pendientes',
  'Send Invite': 'Enviar Invitación',
  '+ Invite Member': '+ Invitar Miembro',
  'Owner': 'Propietario',
  'Manager': 'Gerente',
  'SSHO': 'SSHO',
  'Field': 'Campo',
  'Viewer': 'Visualizador',
  'Total Members': 'Total Miembros',
  'Managers': 'Gerentes',
  'SSHOs': 'SSHOs',
  'Invited': 'Invitados',
  'YOU': 'TÚ',
  'INVITED': 'INVITADO',
  'Role Permissions:': 'Permisos de Rol:',

  // ─── Subtitles / Descriptions ───
  'Real-time safety intelligence': 'Inteligencia de seguridad en tiempo real',
  'Set an active project — all modules auto-populate with project context.': 'Establezca un proyecto activo — todos los módulos se llenan automáticamente.',
  'Track, prioritize, and close hazards': 'Rastrear, priorizar y cerrar peligros',
  'Document incidents with root cause analysis': 'Documentar incidentes con análisis de causa raíz',
  'Leading indicator tracking — anonymous reporting supported': 'Seguimiento de indicadores principales — reporte anónimo disponible',
  'Certifications, expiration alerts, compliance tracking': 'Certificaciones, alertas de vencimiento, seguimiento de cumplimiento',
  'GHS compliant — OSHA 29 CFR 1910.1200 HazCom': 'Conforme a GHS — OSHA 29 CFR 1910.1200 HazCom',
  'Worker check-in and safety orientation tracking': 'Registro de trabajadores y seguimiento de orientación',
  'Track findings, corrective actions, compliance scores': 'Rastrear hallazgos, acciones correctivas, puntajes de cumplimiento',
  'AI-generated from your live data': 'Generado por IA desde sus datos en tiempo real',
  'Patterns, trends, and AI-driven insights': 'Patrones, tendencias e información impulsada por IA',
  'Site inspections and safety walk-throughs': 'Inspecciones del sitio y recorridos de seguridad',
  'Hot work, confined space, excavation permits': 'Permisos de trabajo en caliente, espacio confinado, excavación',
  'AI-powered with OSHA citations — printable sign-in sheets': 'Potenciado por IA con citas de OSHA — hojas de asistencia imprimibles',
  'Live weather → OSHA thresholds → auto-triggered safety alerts': 'Clima en vivo → umbrales OSHA → alertas de seguridad automáticas',
  'Mock inspection against your live data — identifies gaps before OSHA does': 'Inspección simulada contra sus datos — identifica brechas antes que OSHA',
  'Dual AI Consensus Engine • Hazard Scan • Compliance Check': 'Motor de Consenso IA Dual • Escaneo de Peligros • Verificación de Cumplimiento',
  'Dual AI • 12-Category Detection Matrix • Auto-Hazard Generation': 'IA Dual • Matriz de Detección de 12 Categorías • Auto-Generación de Peligros',

  // ─── Buttons ───
  '+ New Project': '+ Nuevo Proyecto',
  '+ New Hazard': '+ Nuevo Peligro',
  '+ Report Incident': '+ Reportar Incidente',
  '+ Report Near Miss': '+ Reportar Casi Accidente',
  '+ New Entry': '+ Nueva Entrada',
  '+ New Inspection': '+ Nueva Inspección',
  '+ New Permit': '+ Nuevo Permiso',
  '+ Add Training': '+ Agregar Capacitación',
  '+ Add Chemical': '+ Agregar Químico',
  '+ Orient Worker': '+ Orientar Trabajador',
  '+ New Finding': '+ Nuevo Hallazgo',
  '+ New Lift Plan': '+ Nuevo Plan de Izaje',
  '+ Manual JHA': '+ ATS Manual',
  '+ Manual AHA': '+ AHA Manual',
  'Create Project': 'Crear Proyecto',
  'Save': 'Guardar',
  'Save Incident': 'Guardar Incidente',
  'Cancel': 'Cancelar',
  'Del': 'Elim',
  'Close': 'Cerrar',
  'View': 'Ver',
  'Approve': 'Aprobar',
  'Print': 'Imprimir',
  'Set Active': 'Activar',
  'Deactivate': 'Desactivar',
  'Submit': 'Enviar',
  'Issue Permit': 'Emitir Permiso',
  'Analyze with Dual AI': 'Analizar con IA Dual',
  'Analyzing with Dual AI...': 'Analizando con IA Dual...',
  'Analyzing...': 'Analizando...',
  'Generating...': 'Generando...',
  'Sign Out': 'Cerrar Sesión',
  'Export CSV': 'Exportar CSV',
  'Go': 'Ir',

  // ─── Photo Analysis ───
  'Hazard Scan — Find all hazards in photos': 'Escaneo de Peligros — Encontrar todos los peligros',
  'Compliance Check — "Is this compliant?"': 'Verificación — "¿Es conforme?"',
  'Compliance Question': 'Pregunta de Cumplimiento',
  'Build Dual AI Consensus Report': 'Crear Reporte de Consenso IA Dual',
  'Auto-Generate Hazards': 'Auto-Generar Peligros',
  'Scan for Hazards with Dual AI': 'Escanear Peligros con IA Dual',
  'Check Compliance with Dual AI': 'Verificar Cumplimiento con IA Dual',
  'Site Photos': 'Fotos del Sitio',
  'Video Walkthrough': 'Recorrido en Video',
  'Analysis Results': 'Resultados del Análisis',
  'Hazard Analysis Results': 'Resultados del Análisis de Peligros',
  'Claude Analysis': 'Análisis de Claude',
  'GPT-4o Analysis': 'Análisis de GPT-4o',
  'Analysis History': 'Historial de Análisis',
  'History': 'Historial',
  'Total Analyses': 'Total de Análisis',
  'Photos Analyzed': 'Fotos Analizadas',
  'Hazards Found': 'Peligros Encontrados',
  'Compliance Checks': 'Verificaciones de Cumplimiento',
  'Both Agree': 'Ambos Coinciden',
  'Disagree (Review)': 'Desacuerdo (Revisar)',
  'Single Model Only': 'Solo Un Modelo',
  'Dual AI Consensus': 'Consenso IA Dual',

  // ─── Status / Severity ───
  'Open': 'Abierto',
  'Closed': 'Cerrado',
  'In Progress': 'En Progreso',
  'Pending': 'Pendiente',
  'Draft': 'Borrador',
  'Approved': 'Aprobado',
  'Peer Reviewed': 'Revisado por Pares',
  'Active': 'Activo',
  'Completed': 'Completado',
  'Critical': 'Crítico',
  'High': 'Alto',
  'Moderate': 'Moderado',
  'Low': 'Bajo',
  'OVERDUE': 'VENCIDO',
  'EXPIRED': 'VENCIDO',
  'CURRENT': 'VIGENTE',
  'EXPIRING': 'POR VENCER',
  'ACTIVE': 'ACTIVO',
  'CLOSED': 'CERRADO',
  'COMPLIANT': 'CONFORME',
  'NON-COMPLIANT': 'NO CONFORME',
  'REVIEW NEEDED': 'REVISIÓN NECESARIA',
  'INDETERMINATE': 'INDETERMINADO',
  'STOP WORK': 'PARE EL TRABAJO',
  'WARNING': 'ADVERTENCIA',
  'CAUTION': 'PRECAUCIÓN',
  'MONITOR': 'MONITOREAR',
  'PASS': 'APROBADO',
  'FAIL': 'REPROBADO',
  'N/A': 'N/A',

  // ─── Labels / Fields ───
  'Project': 'Proyecto',
  'Project Name': 'Nombre del Proyecto',
  'Project Type': 'Tipo de Proyecto',
  'Activity': 'Actividad',
  'Location': 'Ubicación',
  'Street Address': 'Dirección',
  'City': 'Ciudad',
  'ZIP Code': 'Código Postal',
  'State': 'Estado',
  'Compliance Framework': 'Marco de Cumplimiento',
  'Status': 'Estado',
  'Work Scopes': 'Alcances de Trabajo',
  'GC / Prime Contractor': 'Contratista General',
  'SSHO / Safety Contact': 'SSHO / Contacto de Seguridad',
  'Category': 'Categoría',
  'Severity': 'Severidad',
  'Description': 'Descripción',
  'Corrective Action': 'Acción Correctiva',
  'Due Date': 'Fecha Límite',
  'Hazard Title': 'Título del Peligro',
  'OSHA Reference': 'Referencia OSHA',
  'Incident Title': 'Título del Incidente',
  'Type': 'Tipo',
  'Injuries': 'Lesiones',
  'Root Cause': 'Causa Raíz',
  'Corrective Actions': 'Acciones Correctivas',
  'What happened?': '¿Qué pasó?',
  'Report anonymously': 'Reportar anónimamente',
  'Potential Severity': 'Severidad Potencial',
  'Date': 'Fecha',
  'Weather': 'Clima',
  'Manpower (headcount)': 'Personal (conteo)',
  'Activities': 'Actividades',
  'Hazards Noted': 'Peligros Observados',
  'Active Permits': 'Permisos Activos',
  'Notes': 'Notas',
  'Incidents / Near Misses': 'Incidentes / Casi Accidentes',
  'Inspection Type': 'Tipo de Inspección',
  'Inspector': 'Inspector',
  'Area / Location': 'Área / Ubicación',
  'Findings': 'Hallazgos',
  'Permit Type': 'Tipo de Permiso',
  'Expires': 'Vence',
  'Issued By': 'Emitido Por',
  'Competent Person': 'Persona Competente',
  'Worker Name': 'Nombre del Trabajador',
  'Certification': 'Certificación',
  'Date Issued': 'Fecha de Emisión',
  'Expiration Date': 'Fecha de Vencimiento',
  'Training Provider': 'Proveedor de Capacitación',
  'Chemical Name': 'Nombre del Químico',
  'CAS Number': 'Número CAS',
  'Manufacturer': 'Fabricante',
  'SDS Date': 'Fecha HDS',
  'Storage Location': 'Ubicación de Almacenamiento',
  'GHS Hazard Level': 'Nivel de Peligro GHS',
  'Required PPE': 'EPP Requerido',
  'First Aid': 'Primeros Auxilios',
  'Spill Response': 'Respuesta a Derrames',
  'Full Name': 'Nombre Completo',
  'Company': 'Empresa',
  'Trade': 'Oficio',

  // ─── Stats ───
  'Open Hazards': 'Peligros Abiertos',
  'Total Hazards': 'Total de Peligros',
  'Safety Score': 'Puntuación de Seguridad',
  'Penalty Exposure': 'Exposición a Multas',
  'Incidents (30d)': 'Incidentes (30d)',
  'Near Misses': 'Casi Accidentes',
  'Daily Logs': 'Registros Diarios',
  'Closed (7d)': 'Cerrados (7d)',
  'Total Records': 'Total de Registros',
  'Expired': 'Vencidos',
  'Current': 'Vigentes',
  'This Week': 'Esta Semana',
  'With Findings': 'Con Hallazgos',
  'Last 7 Days': 'Últimos 7 Días',
  'Last 30 Days': 'Últimos 30 Días',
  'Total': 'Total',
  'Overdue': 'Vencido',
  'With Hazards': 'Con Peligros',
  'Today': 'Hoy',
  'Total Manpower': 'Personal Total',
  'Anonymous': 'Anónimo',
  'High/Critical': 'Alto/Crítico',
  'Total Oriented': 'Total Orientados',
  'AI Generated': 'Generado por IA',
  'This Project': 'Este Proyecto',
  'Expired Certs': 'Certificados Vencidos',
  'Expired Permits': 'Permisos Vencidos',
  'Weekly Inspections': 'Inspecciones Semanales',
  'JHAs Approved': 'ATS Aprobados',
  'Temperature': 'Temperatura',
  'Feels Like': 'Sensación Térmica',
  'Wind': 'Viento',
  'Gusts': 'Ráfagas',
  'UV Index': 'Índice UV',
  'Humidity': 'Humedad',
  'New Hazards': 'Nuevos Peligros',
  'Open Total': 'Total Abiertos',
  'Expired Training': 'Capacitación Vencida',
  'OSHA 2024 Estimate': 'Estimación OSHA 2024',

  // ─── Dashboard ───
  'Quick Actions': 'Acciones Rápidas',
  'Recent Activity': 'Actividad Reciente',
  'Active Alerts': 'Alertas Activas',
  'Multi-Project Overview': 'Vista Multi-Proyecto',
  'No activity yet.': 'Sin actividad aún.',
  'Photo Hazard Scan': 'Escaneo de Peligros por Foto',
  'Log New Hazard': 'Registrar Nuevo Peligro',
  'Daily Log': 'Registro Diario',
  'Pre-Start Check': 'Verificación Pre-Inicio',
  'Report Incident': 'Reportar Incidente',
  'Toolbox Talk': 'Charla de Seguridad',
  'Voice Co-Pilot': 'Co-Piloto de Voz',
  'Generate Report': 'Generar Informe',

  // ─── Weather ───
  'Active Risk Alerts': 'Alertas de Riesgo Activas',
  '12-Hour Forecast': 'Pronóstico de 12 Horas',
  'Refresh Weather': 'Actualizar Clima',
  'AI Risk Analysis — Weather + Project Data': 'Análisis de Riesgo IA — Clima + Datos del Proyecto',
  'RISK': 'RIESGO',
  'Clear sky': 'Cielo despejado',
  'Mainly clear': 'Mayormente despejado',
  'Partly cloudy': 'Parcialmente nublado',
  'Overcast': 'Nublado',
  'Fog': 'Niebla',
  'Light drizzle': 'Llovizna ligera',
  'Moderate rain': 'Lluvia moderada',
  'Heavy rain': 'Lluvia fuerte',
  'Thunderstorm': 'Tormenta eléctrica',

  // ─── Audit ───
  'Run Mock OSHA Inspection': 'Ejecutar Inspección OSHA Simulada',
  'Run EM 385 Compliance Audit': 'Ejecutar Auditoría EM 385',
  'Inspecting...': 'Inspeccionando...',
  'Failures': 'Reprobados',
  'Warnings': 'Advertencias',
  'Passing': 'Aprobados',
  'SATISFACTORY — Ready for inspection': 'SATISFACTORIO — Listo para inspección',
  'NEEDS IMPROVEMENT — Address failures before OSHA visit': 'NECESITA MEJORA — Corrija fallas antes de visita OSHA',
  'UNSATISFACTORY — Significant compliance gaps detected': 'INSATISFACTORIO — Brechas significativas de cumplimiento',
  'AI Deep Dive — Citation Predictions, Penalties & Fix Plan': 'Análisis Profundo IA — Predicción de Citas, Multas y Plan de Corrección',

  // ─── JHA ───
  'AI JHA Generator — Dual Model': 'Generador de ATS con IA — Modelo Dual',
  'AI AHA Generator — Dual Model': 'Generador de AHA con IA — Modelo Dual',
  'Peer Review': 'Revisión por Pares',
  'Generate JHA with AI': 'Generar ATS con IA',

  // ─── Misc ───
  'Loading...': 'Cargando...',
  'No data yet.': 'Sin datos aún.',
  'No hazards found.': 'No se encontraron peligros.',
  'No incidents reported.': 'No se reportaron incidentes.',
  'No near misses reported.': 'No se reportaron casi accidentes.',
  'No daily logs yet.': 'Sin registros diarios aún.',
  'No inspections recorded.': 'Sin inspecciones registradas.',
  'No permits issued.': 'Sin permisos emitidos.',
  'No training records yet.': 'Sin registros de capacitación.',
  'No chemicals registered.': 'Sin químicos registrados.',
  'No orientations recorded.': 'Sin orientaciones registradas.',
  'No findings.': 'Sin hallazgos.',
  'No saved analyses.': 'Sin análisis guardados.',
  'Account': 'Cuenta',
  'About': 'Acerca de',
  'Email': 'Correo',
  'Name': 'Nombre',
  'Role': 'Rol',
  'Active Project': 'Proyecto Activo',
  'Scopes': 'Alcances',
  'New Project': 'Nuevo Proyecto',
  'All Projects': 'Todos los Proyectos',
}

// Build a sorted list of phrases to match longest first
const SORTED_PHRASES = Object.keys(DICT).sort((a, b) => b.length - a.length)

// Translate a single text string
function translateText(text: string): string {
  // Exact match first
  const trimmed = text.trim()
  if (DICT[trimmed]) return text.replace(trimmed, DICT[trimmed])

  // Phrase replacement for longer strings (subtitles, descriptions)
  let result = text
  for (const phrase of SORTED_PHRASES) {
    if (result.includes(phrase)) {
      result = result.replace(phrase, DICT[phrase])
    }
  }
  return result
}

// Check if a node should be translated
function shouldTranslate(node: Node): boolean {
  const el = node.parentElement
  if (!el) return false
  // Skip code/pre blocks, AI result content (already in Spanish from prompt), and input values
  if (el.closest('.ai-result') || el.closest('code') || el.closest('pre')) return false
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'OPTION') return false
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return false
  return true
}

// ═══ TRANSLATOR COMPONENT ═══
export function PageTranslator() {
  const { lang } = useI18n()
  const observerRef = useRef<MutationObserver | null>(null)
  const originalTexts = useRef<Map<Node, string>>(new Map())

  useEffect(() => {
    if (lang === 'en') {
      // Restore original English text
      originalTexts.current.forEach((original, node) => {
        if (node.parentNode) node.textContent = original
      })
      originalTexts.current.clear()
      if (observerRef.current) observerRef.current.disconnect()
      return
    }

    // Spanish mode: translate all existing text nodes
    const translateAllTextNodes = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
      let node: Node | null
      while ((node = walker.nextNode())) {
        if (!node.textContent || node.textContent.trim().length < 2) continue
        if (!shouldTranslate(node)) continue

        const original = node.textContent
        const translated = translateText(original)
        if (translated !== original) {
          if (!originalTexts.current.has(node)) {
            originalTexts.current.set(node, original)
          }
          node.textContent = translated
        }
      }
    }

    // Also translate placeholder attributes
    const translatePlaceholders = (root: Element) => {
      root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
        const ph = el.getAttribute('placeholder')
        if (ph && DICT[ph]) {
          el.setAttribute('data-original-ph', ph)
          el.setAttribute('placeholder', DICT[ph])
        }
      })
    }

    // Initial translation pass
    translateAllTextNodes(document.body)
    translatePlaceholders(document.body)

    // Watch for DOM changes (route changes, data loading, etc.)
    observerRef.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (!node.textContent || node.textContent.trim().length < 2) return
            if (!shouldTranslate(node)) return
            const original = node.textContent
            const translated = translateText(original)
            if (translated !== original) {
              originalTexts.current.set(node, original)
              node.textContent = translated
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateAllTextNodes(node)
            if (node instanceof Element) translatePlaceholders(node)
          }
        })
      }
    })

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
    })

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [lang])

  return null // This component renders nothing — it just translates the DOM
}
