import { useState } from 'react'
import { useCompany, type CompanyRole } from '../hooks/useCompany'
import { useAuth } from '../hooks/useAuth'
import { SC, Card, LD, Empty, FI, FS, DelBtn } from '../components/SharedUI'

export function TeamPage() {
  const { user } = useAuth()
  const { company, members, role, isOwner, isManager, canManageMembers, loading,
    createCompany, inviteMember, updateMemberRole, removeMember } = useCompany()
  const [showInvite, setShowInvite] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [creating, setCreating] = useState(false)

  // ═══ NO COMPANY — SETUP WIZARD ═══
  if (!loading && !company) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="text-2xl font-extrabold mb-2">Set Up Your Company</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--t3)' }}>
            Create a company to invite team members. All safety data will be shared across your organization.
          </p>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)}
            placeholder="Company name (e.g. ABC Contractors)"
            className="w-full px-4 py-3 rounded-lg text-sm mb-4 text-center"
            style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)', maxWidth: 400, margin: '0 auto 16px' }} />
          <br />
          <button onClick={async () => {
            if (!companyName.trim()) return
            setCreating(true)
            await createCompany(companyName.trim())
            setCreating(false)
          }} disabled={creating || !companyName.trim()}
            className="px-8 py-3 rounded-lg font-bold text-sm text-white"
            style={{ background: creating ? 'var(--bg3)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: creating ? 0.6 : 1 }}>
            {creating ? 'Creating...' : 'Create Company'}
          </button>
          <p className="text-xs mt-4" style={{ color: 'var(--t3)' }}>
            You'll be the Owner with full admin access. You can invite team members after setup.
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="p-6"><LD /></div>

  const roleColors: Record<string, string> = {
    owner: 'var(--acc)', manager: 'var(--blu)', ssho: 'var(--pur)', field: 'var(--grn)', viewer: 'var(--t3)'
  }
  const roleLabels: Record<string, string> = {
    owner: 'Owner', manager: 'Manager', ssho: 'SSHO', field: 'Field', viewer: 'Viewer'
  }
  const activeMembers = members.filter(m => m.status === 'active')
  const invitedMembers = members.filter(m => m.status === 'invited')

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const name = fd.get('name') as string
    const inviteRole = fd.get('role') as CompanyRole
    if (!email) return
    await inviteMember(email, name, inviteRole)
    setShowInvite(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Team Management</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {company?.name} — {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManageMembers && (
          <button onClick={() => setShowInvite(!showInvite)}
            className="px-4 py-2 rounded-lg font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
            + Invite Member
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <SC label="Total Members" value={activeMembers.length} color="var(--acc)" />
        <SC label="Managers" value={activeMembers.filter(m => m.role === 'manager' || m.role === 'owner').length} color="var(--blu)" />
        <SC label="SSHOs" value={activeMembers.filter(m => m.role === 'ssho').length} color="var(--pur)" />
        <SC label="Field" value={activeMembers.filter(m => m.role === 'field').length} color="var(--grn)" />
        <SC label="Invited" value={invitedMembers.length} color="var(--yel)" />
      </div>

      {/* Company Info */}
      <Card borderColor="var(--acc)">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">{company?.name}</div>
            <div className="text-xs" style={{ color: 'var(--t3)' }}>
              Plan: {company?.plan || 'Starter'} • Max: {company?.max_members || 25} members • Your role: <span style={{ color: roleColors[role || 'field'] }}>{roleLabels[role || 'field']}</span>
            </div>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: 'rgba(249,115,22,.12)', color: 'var(--acc)' }}>
            {role?.toUpperCase()}
          </div>
        </div>
      </Card>

      {/* Invite Form */}
      {showInvite && canManageMembers && (
        <form onSubmit={handleInvite} className="rounded-xl p-5 my-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <h3 className="font-bold text-sm mb-3">Invite Team Member</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--t3)' }}>
            Add a member to your company. They'll see all company data based on their role.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <FI name="email" label="Email" placeholder="worker@company.com" required />
            <FI name="name" label="Full Name" placeholder="John Smith" required />
            <FS name="role" label="Role" options={['field', 'ssho', 'manager', 'viewer']} />
          </div>
          <div className="rounded-lg p-3 mt-3 text-xs" style={{ background: 'var(--bg3)', color: 'var(--t3)' }}>
            <strong>Role Permissions:</strong><br />
            <span style={{ color: 'var(--grn)' }}>Field</span> — Submit hazards, near misses, daily logs, photos for assigned projects<br />
            <span style={{ color: 'var(--pur)' }}>SSHO</span> — All Field permissions + approve JHAs, manage training, view all project data<br />
            <span style={{ color: 'var(--blu)' }}>Manager</span> — Full access to all company data, manage members, generate reports<br />
            <span style={{ color: 'var(--t3)' }}>Viewer</span> — Read-only access to dashboards and reports
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Send Invite</button>
            <button type="button" onClick={() => setShowInvite(false)}
              className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Active Members */}
      <div className="mt-4">
        <h3 className="font-bold text-sm mb-3">Active Members ({activeMembers.length})</h3>
        {activeMembers.map(m => (
          <Card key={m.id} borderColor={roleColors[m.role] || 'var(--bdr)'}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: `${roleColors[m.role]}20`, color: roleColors[m.role] }}>
                  {(m.name || m.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm">{m.name || m.email}</div>
                  <div className="text-xs" style={{ color: 'var(--t3)' }}>{m.email} • Joined {new Date(m.joined_at).toLocaleDateString()}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                  style={{ background: `${roleColors[m.role]}15`, color: roleColors[m.role] }}>
                  {roleLabels[m.role] || m.role}
                </span>
                {m.user_id === user?.id && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--t3)' }}>YOU</span>}
              </div>
              {canManageMembers && m.user_id !== user?.id && m.role !== 'owner' && (
                <div className="flex gap-1">
                  <select value={m.role} onChange={e => updateMemberRole(m.id, e.target.value as CompanyRole)}
                    className="px-2 py-1 rounded text-xs" style={{ background: 'var(--bg3)', color: 'var(--t2)', border: '1px solid var(--bdr)' }}>
                    <option value="field">Field</option>
                    <option value="ssho">SSHO</option>
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <DelBtn onClick={() => {
                    if (confirm(`Remove ${m.name || m.email} from the team?`)) removeMember(m.id)
                  }} />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Invited (pending) */}
      {invitedMembers.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--yel)' }}>Pending Invites ({invitedMembers.length})</h3>
          {invitedMembers.map(m => (
            <Card key={m.id} borderColor="var(--yel)">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-sm">{m.name || m.email}</span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--t3)' }}>{m.email}</span>
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(234,179,8,.12)', color: 'var(--yel)' }}>INVITED</span>
                  <span className="ml-1 text-[10px] px-2 py-0.5 rounded" style={{ background: `${roleColors[m.role]}15`, color: roleColors[m.role] }}>{roleLabels[m.role]}</span>
                </div>
                {canManageMembers && <DelBtn onClick={() => removeMember(m.id)} />}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No-company solo users see nothing extra */}
    </div>
  )
}
