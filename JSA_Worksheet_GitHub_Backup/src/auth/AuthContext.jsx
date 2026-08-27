import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setUnauthorisedHandler, tokenStore } from '../api/client.js'

const AuthContext = createContext(null)

export const ROLE_LABEL = {
  admin: 'Administrator',
  company_admin: 'Company admin',
  location_admin: 'Location admin',
  jsa_initiator: 'JSA initiator',
  lvl1_approver: 'Level 1 approver',
  lvl2_approver: 'Level 2 approver',
  ph_approver: 'Plant Head',
}

export const APPROVER_ROLES = ['lvl1_approver', 'lvl2_approver', 'ph_approver', 'location_admin']
export const MANAGER_ROLES = ['admin', 'company_admin', 'location_admin']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // A session lives in sessionStorage, so closing the tab signs you out —
  // reasonable on a shared shop-floor laptop.
  useEffect(() => {
    const token = tokenStore.get()
    if (!token) { setReady(true); return }
    api.me()
      .then(setUser)
      .catch(() => { tokenStore.set(null); setUser(null) })
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    setUnauthorisedHandler(() => { tokenStore.set(null); setUser(null) })
  }, [])

  const signIn = useCallback(async (genid, password) => {
    const res = await api.login(genid, password)
    tokenStore.set(res.token)
    setUser(res.user)
    return res
  }, [])

  const signOut = useCallback(() => {
    tokenStore.set(null)
    setUser(null)
  }, [])

  /** Used when an approver arrives on an emailed link: the backend hands back
      a normal session so the rest of the app behaves as usual. */
  const adoptSession = useCallback((token, who) => {
    tokenStore.set(token)
    setUser(who)
  }, [])

  const value = useMemo(
    () => ({ user, ready, signIn, signOut, adoptSession, setUser }),
    [user, ready, signIn, signOut, adoptSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
