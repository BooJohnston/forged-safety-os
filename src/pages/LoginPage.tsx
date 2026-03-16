import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('Safety Manager')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Enter email and password.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    try {
      await signIn(email, password)
    } catch {
      try { await signUp(email, password, { name, company, role }) }
      catch (e: any) { setError(e.message || 'Authentication failed') }
    }
    setLoading(false)
  }

  return (
    <div className="h-screen flex" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 hidden md:flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0f00 0%, #2d1800 50%, #0a0e1a 100%)' }}>
        <div className="absolute w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(249,115,22,.15), transparent 70%)', top: '20%', left: '30%' }} />
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">⛑️</div>
          <div className="font-mono text-sm tracking-widest mb-2" style={{ color: 'var(--acc)' }}>FORGED EDUCATIONAL SYSTEMS</div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
            Safety Intelligence OS
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--t3)' }}>
            28 Modules • Dual AI • Core 58 Standards • WHAT-WHY-HOW
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden text-center mb-6">
            <div className="font-mono text-xs tracking-widest" style={{ color: 'var(--acc)' }}>FORGED SAFETY OS</div>
          </div>
          <h2 className="text-xl font-bold mb-1">Sign In</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--t3)' }}>Enter credentials or create a new account</p>

          {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.12)', color: 'var(--red)', border: '1px solid rgba(239,68,68,.3)' }}>{error}</div>}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Richard Johnston"
                className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters"
                className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Company</label>
                <input value={company} onChange={e => setCompany(e.target.value)} placeholder="ABC Contractors"
                  className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }}>
                  <option>Safety Manager</option><option>SSHO</option><option>Superintendent</option>
                  <option>Project Manager</option><option>Safety Director</option><option>Foreman</option>
                  <option>Inspector</option><option>QC Manager</option>
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-5 py-3 rounded-lg font-bold text-white text-sm transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', opacity: loading ? 0.5 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In / Create Account'}
          </button>

          <p className="mt-4 text-center text-xs" style={{ color: 'var(--t3)' }}>
            FORGED Safety Intelligence OS v3.0 • Richard Johnston
          </p>
        </div>
      </div>
    </div>
  )
}
