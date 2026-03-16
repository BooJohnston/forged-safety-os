import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export type CompanyRole = 'owner' | 'manager' | 'ssho' | 'field' | 'viewer'

export type Company = {
  id: string
  name: string
  owner_id: string
  plan: string
  max_members: number
  created_at: string
}

export type CompanyMember = {
  id: string
  company_id: string
  user_id: string
  email: string
  name: string
  role: CompanyRole
  status: string
  joined_at: string
}

type CompanyContextType = {
  company: Company | null
  membership: CompanyMember | null
  members: CompanyMember[]
  role: CompanyRole | null
  isOwner: boolean
  isManager: boolean
  isSSHO: boolean
  canManageMembers: boolean
  canEdit: boolean
  loading: boolean
  createCompany: (name: string) => Promise<Company | null>
  joinCompany: (companyId: string) => Promise<boolean>
  inviteMember: (email: string, name: string, role: CompanyRole) => Promise<boolean>
  updateMemberRole: (memberId: string, role: CompanyRole) => Promise<boolean>
  removeMember: (memberId: string) => Promise<boolean>
  refreshMembers: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType>({
  company: null, membership: null, members: [], role: null,
  isOwner: false, isManager: false, isSSHO: false, canManageMembers: false, canEdit: false,
  loading: true,
  createCompany: async () => null, joinCompany: async () => false,
  inviteMember: async () => false, updateMemberRole: async () => false,
  removeMember: async () => false, refreshMembers: async () => {}
})

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [membership, setMembership] = useState<CompanyMember | null>(null)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)

  const role = membership?.role || null
  const isOwner = role === 'owner'
  const isManager = role === 'manager' || isOwner
  const isSSHO = role === 'ssho' || isManager
  const canManageMembers = isOwner || isManager
  const canEdit = role !== 'viewer'

  // Load company on auth
  useEffect(() => {
    if (user) loadCompany()
    else { setCompany(null); setMembership(null); setMembers([]); setLoading(false) }
  }, [user])

  const loadCompany = async () => {
    if (!user) return
    setLoading(true)

    // Check if user is a member of any company
    const { data: memberData } = await supabase
      .from('safety_company_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (memberData) {
      setMembership(memberData)
      // Load the company
      const { data: companyData } = await supabase
        .from('safety_companies')
        .select('*')
        .eq('id', memberData.company_id)
        .single()
      if (companyData) {
        setCompany(companyData)
        localStorage.setItem('forged-company-id', companyData.id)
        await loadMembers(companyData.id)
      }
    } else {
      // Check if user owns a company
      const { data: ownedCompany } = await supabase
        .from('safety_companies')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .single()

      if (ownedCompany) {
        setCompany(ownedCompany)
        localStorage.setItem('forged-company-id', ownedCompany.id)
        // Auto-create membership for owner if missing
        const { data: existingMember } = await supabase
          .from('safety_company_members')
          .select('*')
          .eq('company_id', ownedCompany.id)
          .eq('user_id', user.id)
          .single()

        if (existingMember) {
          setMembership(existingMember)
        } else {
          const { data: newMember } = await supabase
            .from('safety_company_members')
            .insert({
              id: genId(), company_id: ownedCompany.id, user_id: user.id,
              email: user.email, name: user.user_metadata?.name || user.email,
              role: 'owner', status: 'active', joined_at: new Date().toISOString()
            })
            .select().single()
          if (newMember) setMembership(newMember)
        }
        await loadMembers(ownedCompany.id)
      }
      // If no company at all, user will see the company setup wizard
    }
    setLoading(false)
  }

  const loadMembers = async (companyId: string) => {
    const { data } = await supabase
      .from('safety_company_members')
      .select('*')
      .eq('company_id', companyId)
      .order('joined_at', { ascending: true })
    if (data) setMembers(data)
  }

  const refreshMembers = async () => {
    if (company) await loadMembers(company.id)
  }

  const createCompany = async (name: string): Promise<Company | null> => {
    if (!user) return null
    const id = genId()
    const { data, error } = await supabase
      .from('safety_companies')
      .insert({
        id, name, owner_id: user.id, plan: 'starter', max_members: 25,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      })
      .select().single()

    if (error || !data) { console.error('Create company failed:', error); return null }

    // Add owner as member
    await supabase.from('safety_company_members').insert({
      id: genId(), company_id: id, user_id: user.id,
      email: user.email, name: user.user_metadata?.name || user.email,
      role: 'owner', status: 'active', joined_at: new Date().toISOString()
    })

    setCompany(data)
    await loadCompany()
    return data
  }

  const joinCompany = async (companyId: string): Promise<boolean> => {
    if (!user) return false
    const { error } = await supabase.from('safety_company_members').insert({
      id: genId(), company_id: companyId, user_id: user.id,
      email: user.email, name: user.user_metadata?.name || user.email,
      role: 'field', status: 'active', joined_at: new Date().toISOString()
    })
    if (error) { console.error('Join failed:', error); return false }
    await loadCompany()
    return true
  }

  const inviteMember = async (email: string, name: string, memberRole: CompanyRole): Promise<boolean> => {
    if (!user || !company) return false
    // Create a placeholder member — when they sign up with this email, they'll be linked
    const { error } = await supabase.from('safety_company_members').insert({
      id: genId(), company_id: company.id, user_id: user.id, // temporarily set to inviter
      email, name, role: memberRole, status: 'invited',
      invited_by: user.id, joined_at: new Date().toISOString()
    })
    if (error) { console.error('Invite failed:', error); return false }
    await refreshMembers()
    return true
  }

  const updateMemberRole = async (memberId: string, newRole: CompanyRole): Promise<boolean> => {
    const { error } = await supabase
      .from('safety_company_members')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', memberId)
    if (error) { console.error('Update role failed:', error); return false }
    await refreshMembers()
    return true
  }

  const removeMember = async (memberId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('safety_company_members')
      .delete()
      .eq('id', memberId)
    if (error) { console.error('Remove failed:', error); return false }
    await refreshMembers()
    return true
  }

  return (
    <CompanyContext.Provider value={{
      company, membership, members, role, isOwner, isManager, isSSHO,
      canManageMembers, canEdit, loading,
      createCompany, joinCompany, inviteMember, updateMemberRole, removeMember, refreshMembers
    }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  return useContext(CompanyContext)
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}
