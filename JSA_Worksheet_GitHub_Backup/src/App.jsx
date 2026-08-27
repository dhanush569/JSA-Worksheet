import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { FaKey, FaTriangleExclamation } from 'react-icons/fa6'
import AppHeader from './components/AppHeader.jsx'
import Modal from './components/Modal.jsx'
import NavTabs from './components/NavTabs.jsx'
import { LoadingScreen } from './components/Loading.jsx'
import { useToast } from './components/Toast.jsx'
import { api } from './api/client.js'
import { useAuth } from './auth/AuthContext.jsx'
import { JsaProvider } from './context/JsaContext.jsx'
import ApprovalInboxPage from './pages/ApprovalInboxPage.jsx'
import ApprovalReviewPage from './pages/ApprovalReviewPage.jsx'
import JsaWorksheetPage from './pages/JsaWorksheetPage.jsx'
import LocationSummaryPage from './pages/LocationSummaryPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MyJsaPage from './pages/MyJsaPage.jsx'
import UserManagementPage from './pages/UserManagementPage.jsx'

const LANDING = {
  admin: '/users',
  company_admin: '/users',
  location_admin: '/approvals',
  jsa_initiator: '/jsa/new',
  lvl1_approver: '/approvals',
  lvl2_approver: '/approvals',
  ph_approver: '/approvals',
}

/** Blocks a page when the signed-in role has no business there. */
function Guard({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="center-note">
        <FaTriangleExclamation size={22} style={{ color: 'var(--warn)' }} aria-hidden="true" />
        <div style={{ maxWidth: '48ch' }}>
          Your role ({user.role.replace('_', ' ')}) does not have this page. You were sent to where
          your work lives instead.
        </div>
        <Navigate to={LANDING[user.role] || '/'} replace />
      </div>
    )
  }
  return children
}

export default function App() {
  const { user, ready } = useAuth()
  const location = useLocation()
  const toast = useToast()
  const [pending, setPending] = useState(0)
  const [pwOpen, setPwOpen] = useState(false)
  const healthChecked = useState({ done: false })[0]

  // One health check per session, so a missing key or unreachable database is
  // reported before somebody types a whole worksheet.
  useEffect(() => {
    if (!user || healthChecked.done) return
    healthChecked.done = true
    api.health()
      .then((h) => {
        if (!h.database.connected) toast.error('The API cannot reach PostgreSQL. Saving will fail.')
        else if (!h.email.configured) toast.warn('SMTP is not configured — approval emails will be logged, not sent.')
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const refreshBadge = useCallback(() => {
    if (!user || !['lvl1_approver', 'lvl2_approver', 'ph_approver', 'location_admin', 'admin'].includes(user.role)) {
      setPending(0)
      return
    }
    api.inbox().then((rows) => setPending(rows.length)).catch(() => {})
  }, [user])

  useEffect(refreshBadge, [refreshBadge, location.pathname])

  const emailRoute = location.pathname === '/approve'

  if (!ready) return <LoadingScreen label="Loading the portal" />

  // The emailed approval link carries its own token, so it renders before sign-in.
  if (emailRoute) {
    return (
      <div className="shell shell-flat">
        <AppHeader />
        <div className="shell-main">
          <ApprovalReviewPage fromEmail />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <JsaProvider>
      <div className="shell">
        <AppHeader onChangePassword={() => setPwOpen(true)} />
        <NavTabs pendingCount={pending} />

        <div className="shell-main">
          <Routes>
            <Route path="/login" element={<Navigate to={LANDING[user.role] || '/'} replace />} />

            <Route path="/users" element={
              <Guard roles={['admin', 'company_admin', 'location_admin']}>
                <UserManagementPage />
              </Guard>
            } />

            <Route path="/summary" element={
              <Guard roles={['admin', 'company_admin', 'location_admin']}>
                <LocationSummaryPage />
              </Guard>
            } />

            <Route path="/jsa/new" element={
              <Guard roles={['jsa_initiator', 'admin']}><JsaWorksheetPage /></Guard>
            } />
            <Route path="/jsa/:id" element={
              <Guard roles={['jsa_initiator', 'admin']}><JsaWorksheetPage /></Guard>
            } />
            <Route path="/my-jsa" element={
              <Guard roles={['jsa_initiator', 'admin']}><MyJsaPage /></Guard>
            } />

            <Route path="/approvals" element={
              <Guard roles={['lvl1_approver', 'lvl2_approver', 'ph_approver', 'location_admin', 'admin']}>
                <ApprovalInboxPage />
              </Guard>
            } />
            <Route path="/review/:id" element={<Guard><ApprovalReviewPage /></Guard>} />

            <Route path="*" element={<Navigate to={LANDING[user.role] || '/users'} replace />} />
          </Routes>
        </div>
      </div>

      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}
    </JsaProvider>
  )
}

function ChangePassword({ onClose }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const save = async () => {
    setBusy(true)
    try {
      await api.changePassword(current, next)
      toast.ok('Password changed.')
      onClose()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title="Change your password" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || next.length < 4} onClick={save}>
          <FaKey size={12} aria-hidden="true" /> Change password
        </button>
      </>
    }>
      <div className="field-block">
        <label htmlFor="pw-current">Current password</label>
        <input id="pw-current" type="password" value={current} autoFocus
               autoComplete="current-password"
               onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="field-block">
        <label htmlFor="pw-next">New password</label>
        <input id="pw-next" type="password" value={next} autoComplete="new-password"
               onChange={(e) => setNext(e.target.value)} />
        <div className="field-hint">At least 4 characters.</div>
      </div>
    </Modal>
  )
}
