import { useState, useEffect } from 'react'
import { useProject } from '../hooks/useProject'
import { useData } from '../hooks/useData'
import { callClaude } from '../lib/ai'
import { SAFETY_SYSTEM_PROMPT } from '../data/standards'
import { SC, Card, LD, AIResult, AnalyzeButton, PrintButton, fmtMd } from '../components/SharedUI'

type WeatherData = {
  temp: number; feels_like: number; humidity: number; wind_speed: number; wind_gust: number
  description: string; icon: string; visibility: number; uvi: number
  alerts: string[]; rain_1h: number; snow_1h: number
  forecast: { dt: number; temp: number; wind: number; pop: number; desc: string }[]
}

// OSHA/NIOSH threshold constants
const THRESHOLDS = {
  HEAT_CAUTION: 80, HEAT_WARNING: 90, HEAT_DANGER: 100, HEAT_EXTREME: 115,
  COLD_CAUTION: 40, COLD_WARNING: 32, COLD_DANGER: 0,
  WIND_CAUTION: 25, WIND_HIGH: 35, WIND_CRANE_STOP: 30, WIND_EXTREME: 45,
  LIGHTNING_STOP: true, // any lightning = stop outdoor work
  UVI_HIGH: 6, UVI_VERY_HIGH: 8, UVI_EXTREME: 11,
  VISIBILITY_LOW: 1000, // meters
  RAIN_HEAVY: 7.6, // mm/hr
}

export function WeatherRisk() {
  const { activeProject } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: permits } = useData<any>('permits')
  const { data: training } = useData<any>('training')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [lastFetch, setLastFetch] = useState('')
  const [manualZip, setManualZip] = useState('')

  const zip = manualZip || activeProject?.zip || ''
  const city = activeProject?.city || ''

  // Fetch weather using Open-Meteo (free, no API key needed)
  const fetchWeather = async (zipCode?: string) => {
    const z = zipCode || zip
    if (!z) { setError('Set a ZIP code on your project or enter one below.'); return }
    setLoading(true); setError('')

    try {
      // Geocode ZIP to lat/lon using Open-Meteo geocoding
      const geoQuery = z.length === 5 ? `${z},US` : z
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city || geoQuery)}&count=1&language=en&format=json`)
      const geoData = await geoRes.json()

      if (!geoData.results?.length) {
        // Fallback: try zip as postal code search
        const fallbackRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(z)}&count=1&language=en&format=json`)
        const fallbackData = await fallbackRes.json()
        if (!fallbackData.results?.length) {
          setError(`Could not find location for "${z}". Try entering a city name.`)
          setLoading(false)
          return
        }
        geoData.results = fallbackData.results
      }

      const { latitude, longitude } = geoData.results[0]

      // Fetch current + forecast from Open-Meteo
      const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,weather_code,visibility,uv_index,rain,snowfall&hourly=temperature_2m,wind_speed_10m,precipitation_probability,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=2&forecast_hours=12`)
      const wxData = await wxRes.json()

      const current = wxData.current
      const hourly = wxData.hourly

      // Map weather code to description
      const weatherDesc = getWeatherDescription(current.weather_code)

      // Check for NWS alerts via weather code patterns
      const alerts: string[] = []
      if (current.weather_code >= 95) alerts.push('⛈️ Thunderstorm activity detected — STOP WORK for outdoor crews')
      if (current.weather_code >= 71 && current.weather_code <= 77) alerts.push('🌨️ Snow/Ice conditions — assess driving and walking surfaces')
      if (current.weather_code >= 80 && current.weather_code <= 82) alerts.push('🌧️ Heavy rain — monitor excavations and drainage')

      // Build forecast array from hourly data
      const forecast = []
      for (let i = 0; i < Math.min(12, hourly.time?.length || 0); i++) {
        forecast.push({
          dt: new Date(hourly.time[i]).getTime() / 1000,
          temp: hourly.temperature_2m[i],
          wind: hourly.wind_speed_10m[i],
          pop: hourly.precipitation_probability[i],
          desc: getWeatherDescription(hourly.weather_code[i])
        })
      }

      setWeather({
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        wind_speed: current.wind_speed_10m,
        wind_gust: current.wind_gusts_10m || current.wind_speed_10m * 1.5,
        description: weatherDesc,
        icon: getWeatherEmoji(current.weather_code),
        visibility: current.visibility || 10000,
        uvi: current.uv_index || 0,
        alerts,
        rain_1h: current.rain || 0,
        snow_1h: current.snowfall || 0,
        forecast
      })
      setLastFetch(new Date().toLocaleTimeString())
    } catch (e: any) {
      setError('Weather fetch failed: ' + e.message)
    }
    setLoading(false)
  }

  // Auto-fetch on load if project has zip
  useEffect(() => {
    if (zip && !weather) fetchWeather()
  }, [zip])

  // Generate risk alerts from weather data
  const getRiskAlerts = (): { level: 'STOP_WORK' | 'CRITICAL' | 'WARNING' | 'CAUTION' | 'MONITOR'; msg: string; osha: string; action: string }[] => {
    if (!weather) return []
    const alerts: any[] = []
    const t = weather.temp
    const fl = weather.feels_like
    const w = weather.wind_speed
    const wg = weather.wind_gust

    // Heat
    if (fl >= THRESHOLDS.HEAT_EXTREME) alerts.push({ level: 'STOP_WORK', msg: `Extreme heat: ${Math.round(fl)}°F feels-like`, osha: 'OSHA NEP Heat (CPL 03-00-024)', action: 'STOP all outdoor work. Move to cooling stations. Monitor for heat stroke.' })
    else if (fl >= THRESHOLDS.HEAT_DANGER) alerts.push({ level: 'CRITICAL', msg: `Danger heat index: ${Math.round(fl)}°F`, osha: 'OSHA NEP Heat / NIOSH Criteria', action: 'Mandatory 15-min rest per hour. Water every 15 min. Buddy system. Shaded rest areas.' })
    else if (fl >= THRESHOLDS.HEAT_WARNING) alerts.push({ level: 'WARNING', msg: `Heat advisory: ${Math.round(fl)}°F feels-like`, osha: '29 CFR 1926.21 / OSHA Heat NEP', action: 'Encourage hydration breaks. Monitor new/returning workers closely (acclimatization).' })
    else if (fl >= THRESHOLDS.HEAT_CAUTION) alerts.push({ level: 'CAUTION', msg: `Moderate heat: ${Math.round(fl)}°F`, osha: 'OSHA General Duty Clause', action: 'Ensure water is available. Watch for early heat illness signs.' })

    // Cold
    if (fl <= THRESHOLDS.COLD_DANGER) alerts.push({ level: 'CRITICAL', msg: `Extreme cold: ${Math.round(fl)}°F`, osha: '29 CFR 1926.21 / Cold Stress', action: 'Limit exposure time. Heated break areas required. Monitor for hypothermia/frostbite.' })
    else if (fl <= THRESHOLDS.COLD_WARNING) alerts.push({ level: 'WARNING', msg: `Freezing conditions: ${Math.round(fl)}°F`, osha: 'OSHA Cold Stress Guide', action: 'Warm break shelters. Layer protection. Inspect walkways for ice.' })
    else if (fl <= THRESHOLDS.COLD_CAUTION) alerts.push({ level: 'CAUTION', msg: `Cold conditions: ${Math.round(fl)}°F`, osha: 'OSHA Cold Stress Guide', action: 'Provide warm beverages. Allow additional warm-up breaks.' })

    // Wind
    if (wg >= THRESHOLDS.WIND_EXTREME) alerts.push({ level: 'STOP_WORK', msg: `Extreme winds: gusts ${Math.round(wg)} mph`, osha: '29 CFR 1926.502(i)(14)', action: 'STOP all crane ops, roofing, steel erection, scaffold work. Secure loose materials.' })
    else if (w >= THRESHOLDS.WIND_HIGH) alerts.push({ level: 'CRITICAL', msg: `High winds: ${Math.round(w)} mph sustained`, osha: '29 CFR 1926.1431 / Subpart CC', action: 'Stop crane operations. Evaluate scaffold and aerial lift safety. Lower booms.' })
    else if (w >= THRESHOLDS.WIND_CRANE_STOP) alerts.push({ level: 'WARNING', msg: `Wind advisory: ${Math.round(w)} mph — crane threshold`, osha: '29 CFR 1926.1417(e)', action: 'Consult crane load charts for wind deductions. Signal person must monitor continuously.' })
    else if (w >= THRESHOLDS.WIND_CAUTION) alerts.push({ level: 'CAUTION', msg: `Elevated winds: ${Math.round(w)} mph`, osha: '29 CFR 1926.451(f)(12)', action: 'Monitor scaffold stability. Secure tarps and lightweight materials.' })

    // Lightning / Thunderstorm
    if (weather.alerts.some(a => a.includes('Thunderstorm'))) {
      alerts.push({ level: 'STOP_WORK', msg: 'Thunderstorm / Lightning detected', osha: 'OSHA 29 CFR 1926.21 / 30-30 Rule', action: 'STOP ALL outdoor work. Evacuate elevated positions. 30-min wait after last thunder/lightning.' })
    }

    // UV
    if (weather.uvi >= THRESHOLDS.UVI_EXTREME) alerts.push({ level: 'WARNING', msg: `Extreme UV index: ${weather.uvi}`, osha: 'OSHA Sun Safety', action: 'Required sunscreen, hat, light long sleeves. Shaded rest breaks.' })
    else if (weather.uvi >= THRESHOLDS.UVI_VERY_HIGH) alerts.push({ level: 'CAUTION', msg: `Very high UV: ${weather.uvi}`, osha: 'OSHA Sun Safety', action: 'Encourage sun protection. Schedule outdoor work for early/late hours.' })

    // Visibility
    if (weather.visibility < THRESHOLDS.VISIBILITY_LOW) alerts.push({ level: 'WARNING', msg: `Low visibility: ${Math.round(weather.visibility * 3.28)}ft`, osha: '29 CFR 1926.21', action: 'Enhanced spotters for equipment. Additional lighting. High-vis vests mandatory.' })

    // Rain
    if (weather.rain_1h > THRESHOLDS.RAIN_HEAVY) alerts.push({ level: 'WARNING', msg: `Heavy rain: ${weather.rain_1h.toFixed(1)} in/hr`, osha: '29 CFR 1926.651(h)', action: 'Inspect excavations for water accumulation. Monitor trench walls. Pump as needed.' })

    // Precipitation forecast
    const highPrecipHours = weather.forecast.filter(f => f.pop > 70)
    if (highPrecipHours.length > 3) alerts.push({ level: 'MONITOR', msg: `${highPrecipHours.length} hours of >70% precip probability ahead`, osha: 'General planning', action: 'Pre-position pumps. Cover exposed work. Plan for weather delays.' })

    return alerts.length > 0 ? alerts : [{ level: 'MONITOR' as const, msg: 'No weather-related risks detected', osha: 'N/A', action: 'Normal operations. Continue standard safety protocols.' }]
  }

  const runAIAnalysis = async () => {
    if (!weather) return
    setAnalyzing(true); setAiAnalysis('')
    const alerts = getRiskAlerts()
    const openHazards = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')

    const prompt = `${SAFETY_SYSTEM_PROMPT}\n\nWEATHER-LINKED RISK ANALYSIS\n\nProject: ${activeProject?.name || 'General'} — ${activeProject?.city || ''}, ${activeProject?.state || ''} ${activeProject?.zip || ''}\nScopes: ${activeProject?.scopes || 'General construction'}\n\nCURRENT CONDITIONS:\n- Temperature: ${Math.round(weather.temp)}°F (Feels like: ${Math.round(weather.feels_like)}°F)\n- Wind: ${Math.round(weather.wind_speed)} mph sustained, gusts ${Math.round(weather.wind_gust)} mph\n- Humidity: ${weather.humidity}%\n- UV Index: ${weather.uvi}\n- Conditions: ${weather.description}\n- Visibility: ${Math.round(weather.visibility * 3.28)} ft\n- Rain: ${weather.rain_1h} in/hr\n\n12-HOUR FORECAST:\n${weather.forecast.slice(0, 8).map(f => `${new Date(f.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${Math.round(f.temp)}°F, Wind ${Math.round(f.wind)}mph, ${f.pop}% precip — ${f.desc}`).join('\n')}\n\nACTIVE RISK ALERTS:\n${alerts.map(a => `[${a.level}] ${a.msg} — ${a.osha}`).join('\n')}\n\nOPEN HAZARDS (${openHazards.length}):\n${openHazards.slice(0, 10).map((h: any) => `- ${h.category}: ${h.title} (${h.severity})`).join('\n')}\n\nProvide:\n1. OVERALL RISK LEVEL (Green/Yellow/Orange/Red) with justification\n2. Weather-specific hazard interactions (how weather amplifies existing hazards)\n3. Required PPE modifications for today's conditions\n4. Crew briefing talking points (3-5 bullets for morning huddle)\n5. Hour-by-hour work planning recommendations\n6. STOP WORK triggers to watch for as conditions evolve\n7. Documentation requirements for today's conditions`

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], 3000)
      setAiAnalysis(data.content?.[0]?.text || '')
    } catch (e: any) { setAiAnalysis('Error: ' + e.message) }
    setAnalyzing(false)
  }

  const printWeatherReport = () => {
    if (!weather) return
    const w = window.open('', '', 'width=1000,height=800')
    if (!w) return
    const alerts = getRiskAlerts()
    const maxLevel = alerts[0]?.level || 'MONITOR'
    const levelColors: Record<string, string> = { STOP_WORK: '#dc2626', CRITICAL: '#dc2626', WARNING: '#f97316', CAUTION: '#eab308', MONITOR: '#22c55e' }

    w.document.write(`<html><head><title>Weather Risk Report</title><style>
      body{font-family:Arial,sans-serif;padding:2rem;font-size:12px;color:#333}
      h1{font-size:18px;border-bottom:3px solid ${levelColors[maxLevel]};padding-bottom:6px}
      .level{display:inline-block;padding:4px 12px;border-radius:4px;font-weight:800;font-size:14px;color:white;background:${levelColors[maxLevel]};margin-bottom:12px}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
      .stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px;text-align:center}
      .stat .num{font-size:18px;font-weight:800} .stat .lbl{font-size:9px;color:#666}
      .alert{padding:8px;margin:4px 0;border-radius:4px;border-left:3px solid}
      .forecast{margin:12px 0}
      .forecast table{width:100%;border-collapse:collapse} .forecast th,.forecast td{border:1px solid #ddd;padding:4px;font-size:11px}
      .ai{margin-top:16px;line-height:1.7;border-left:3px solid #f97316;padding-left:12px}
      .footer{margin-top:24px;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px}
      @media print{body{padding:0}}
    </style></head><body>`)
    w.document.write(`<h1>🌤️ Weather-Linked Risk Assessment</h1>`)
    w.document.write(`<div class="level">${maxLevel.replace('_', ' ')}</div>`)
    w.document.write(`<p><b>Project:</b> ${activeProject?.name || 'General'} | <b>Location:</b> ${activeProject?.city || ''}, ${activeProject?.state || ''} ${activeProject?.zip || ''} | <b>Generated:</b> ${new Date().toLocaleString()}</p>`)
    w.document.write(`<div class="grid"><div class="stat"><div class="num">${Math.round(weather.temp)}°F</div><div class="lbl">Temperature</div></div><div class="stat"><div class="num">${Math.round(weather.feels_like)}°F</div><div class="lbl">Feels Like</div></div><div class="stat"><div class="num">${Math.round(weather.wind_speed)}</div><div class="lbl">Wind (mph)</div></div><div class="stat"><div class="num">${weather.uvi}</div><div class="lbl">UV Index</div></div></div>`)
    w.document.write(`<h3 style="margin-top:16px">Active Alerts</h3>`)
    alerts.forEach(a => {
      w.document.write(`<div class="alert" style="border-color:${levelColors[a.level]};background:${levelColors[a.level]}08"><b>[${a.level}]</b> ${a.msg}<br><small>${a.osha} — ${a.action}</small></div>`)
    })
    if (aiAnalysis) w.document.write(`<h3>AI Risk Analysis</h3><div class="ai">${fmtMd(aiAnalysis)}</div>`)
    w.document.write(`<div class="footer">FORGED Safety Intelligence OS — Weather-Linked Risk Engine — OSHA General Duty Clause 5(a)(1)</div></body></html>`)
    w.document.close(); w.print()
  }

  const alerts = getRiskAlerts()
  const maxLevel = alerts[0]?.level || 'MONITOR'
  const levelColors: Record<string, string> = { STOP_WORK: 'var(--red)', CRITICAL: 'var(--red)', WARNING: 'var(--acc)', CAUTION: 'var(--yel)', MONITOR: 'var(--grn)' }
  const levelBg: Record<string, string> = { STOP_WORK: 'rgba(239,68,68,.1)', CRITICAL: 'rgba(239,68,68,.06)', WARNING: 'rgba(249,115,22,.06)', CAUTION: 'rgba(234,179,8,.06)', MONITOR: 'rgba(34,197,94,.06)' }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Weather-Linked Risk Engine</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Live weather → OSHA thresholds → auto-triggered safety alerts — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          {weather && <PrintButton onClick={printWeatherReport} label="Print Report" />}
          <button onClick={() => fetchWeather()} disabled={loading}
            className="px-4 py-2 rounded-lg font-bold text-sm text-white"
            style={{ background: loading ? 'var(--bg3)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Fetching...' : '🌤️ Refresh Weather'}
          </button>
        </div>
      </div>

      {/* ZIP input if no project zip */}
      {!activeProject?.zip && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <div className="flex items-center gap-3">
            <div className="text-sm" style={{ color: 'var(--t3)' }}>No ZIP on active project —</div>
            <input value={manualZip} onChange={e => setManualZip(e.target.value)} placeholder="Enter ZIP or city"
              className="px-3 py-1.5 rounded-lg text-sm w-48" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            <button onClick={() => fetchWeather(manualZip)} disabled={!manualZip || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Go</button>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.25)', color: 'var(--red)' }}>{error}</div>}

      {weather && (
        <>
          {/* Current conditions */}
          <div className="grid grid-cols-6 gap-3 mb-4">
            <SC label="Temperature" value={`${Math.round(weather.temp)}°F`} color={weather.feels_like >= 90 ? 'var(--red)' : weather.feels_like <= 32 ? 'var(--blu)' : 'var(--grn)'} />
            <SC label="Feels Like" value={`${Math.round(weather.feels_like)}°F`} color={weather.feels_like >= 100 ? 'var(--red)' : weather.feels_like >= 90 ? 'var(--acc)' : weather.feels_like <= 32 ? 'var(--blu)' : 'var(--grn)'} />
            <SC label="Wind" value={`${Math.round(weather.wind_speed)}`} color={weather.wind_speed >= 35 ? 'var(--red)' : weather.wind_speed >= 25 ? 'var(--acc)' : 'var(--grn)'} sub="mph" />
            <SC label="Gusts" value={`${Math.round(weather.wind_gust)}`} color={weather.wind_gust >= 45 ? 'var(--red)' : weather.wind_gust >= 30 ? 'var(--acc)' : 'var(--grn)'} sub="mph" />
            <SC label="UV Index" value={weather.uvi} color={weather.uvi >= 8 ? 'var(--red)' : weather.uvi >= 6 ? 'var(--acc)' : 'var(--grn)'} />
            <SC label="Humidity" value={`${weather.humidity}%`} color="var(--blu)" />
          </div>

          {/* Conditions banner */}
          <div className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{weather.icon}</span>
              <div>
                <div className="font-bold">{weather.description}</div>
                <div className="text-xs" style={{ color: 'var(--t3)' }}>{activeProject?.city || 'Location'}, {activeProject?.state || ''} • Updated {lastFetch}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: levelBg[maxLevel], color: levelColors[maxLevel], border: `1px solid ${levelColors[maxLevel]}30` }}>
                {maxLevel.replace('_', ' ')} RISK
              </div>
            </div>
          </div>

          {/* Risk Alerts */}
          <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <h3 className="font-bold text-sm mb-3">⚡ Active Risk Alerts ({alerts.length})</h3>
            {alerts.map((a, i) => (
              <div key={i} className="rounded-lg p-3 mb-2" style={{ background: levelBg[a.level], borderLeft: `3px solid ${levelColors[a.level]}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold text-white" style={{ background: levelColors[a.level] }}>{a.level.replace('_', ' ')}</span>
                  <span className="font-semibold text-sm">{a.msg}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--t2)' }}>
                  <span style={{ color: 'var(--blu)' }}>📜 {a.osha}</span> — {a.action}
                </div>
              </div>
            ))}
          </div>

          {/* 12-Hour Forecast */}
          {weather.forecast.length > 0 && (
            <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
              <h3 className="font-bold text-sm mb-3">📅 12-Hour Forecast</h3>
              <div className="grid grid-cols-6 gap-2">
                {weather.forecast.slice(0, 12).map((f, i) => {
                  const fWind = f.wind >= 30 ? 'var(--red)' : f.wind >= 20 ? 'var(--acc)' : 'var(--t3)'
                  const fTemp = f.temp >= 95 ? 'var(--red)' : f.temp >= 85 ? 'var(--acc)' : f.temp <= 32 ? 'var(--blu)' : 'var(--t2)'
                  return (
                    <div key={i} className="rounded-lg p-2 text-center text-xs" style={{ background: 'var(--bg3)' }}>
                      <div style={{ color: 'var(--t3)' }}>{new Date(f.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="font-bold text-sm mt-1" style={{ color: fTemp }}>{Math.round(f.temp)}°</div>
                      <div style={{ color: fWind }}>💨 {Math.round(f.wind)}</div>
                      <div style={{ color: f.pop > 50 ? 'var(--blu)' : 'var(--t3)' }}>🌧 {f.pop}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Deep Analysis */}
          <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <AnalyzeButton onClick={runAIAnalysis} analyzing={analyzing} label="🧠 AI Risk Analysis — Weather + Project Data" />
          </div>
          <AIResult text={aiAnalysis} label="Weather Risk Intelligence" color="var(--acc)" />
        </>
      )}

      {loading && !weather && <LD />}
    </div>
  )
}

function PrintButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--bdr)', color: 'var(--t2)' }}>🖨️ {label}</button>
}

function getWeatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
  }
  return map[code] || 'Unknown'
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'; if (code <= 2) return '⛅'; if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'; if (code <= 55) return '🌦️'; if (code <= 65) return '🌧️'
  if (code <= 77) return '🌨️'; if (code <= 82) return '🌧️'; if (code <= 86) return '🌨️'
  return '⛈️'
}
