import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaArrowRight, FaEye, FaEyeSlash, FaSpinner, FaTriangleExclamation,
} from 'react-icons/fa6'
import { useAuth } from '../auth/AuthContext.jsx'

// Handy while the seed data is still in place; delete this block once real
// accounts exist and the demo users have been removed.
const DEMO = [
  ['admin', 'Admin@123', 'Administrator'],
  ['company.admin', 'Company@123', 'Company admin'],
  ['vns.location.admin', 'Location@123', 'Location admin'],
  ['vns.initiator', 'Initiator@123', 'JSA initiator'],
  ['vns.lvl1', 'Level1@123', 'Level 1'],
  ['vns.lvl2', 'Level2@123', 'Level 2'],
  ['vns.planthead', 'Planthead@123', 'Plant Head'],
]

// The route a worksheet takes. Shown on sign-in because it is the first thing a
// new signatory needs to understand about this product.
const ROUTE = ['Initiator', 'Level 1', 'Level 2', 'Plant Head', 'Location admin']

export default function LoginPage() {
  const [genid, setGenid] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e?.preventDefault()
    if (!genid.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await signIn(genid.trim(), password)
      navigate(res.landing || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const useDemo = (g, p) => {
    setGenid(g)
    setPassword(p)
    setError(null)
  }

  return (
    <div className="login-shell">
      <aside className="login-brand">
        <div>
          <div className="wordmark" style={{ marginBottom: 'var(--s-5)' }}>Rane</div>
          <h1>Job Safety<br />Analysis</h1>
          <span className="docref">FR-HSE-38 · Rev-00 · Ref PR-HSE-04</span>
        </div>

        <p>
          Raise a JSA, have the contractor acknowledge it, and route it through the plant for
          approval. Every decision and remark is kept against the worksheet.
        </p>

        <div>
          <div className="eyebrow" style={{ color: '#93a7c1', marginBottom: 'var(--s-2)' }}>
            The approval route
          </div>
          <div className="login-flow">
            {ROUTE.map((stage, i) => (
              <span key={stage} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                <b>{stage}</b>
                {i < ROUTE.length - 1 && <span aria-hidden="true">→</span>}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 'var(--s-2)', fontSize: 'var(--t-xs)', color: '#93a7c1' }}>
            Plant Head is added only when the JSA is marked high risk.
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="sub">Use the username your admin issued.</p>

          {error && (
            <div className="login-error" role="alert">
              <FaTriangleExclamation size={13} style={{ marginTop: 2 }} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="field-block">
            <label htmlFor="genid">Username</label>
            <input
              id="genid" value={genid} autoComplete="username" autoFocus
              autoCapitalize="none" spellCheck="false"
              onChange={(e) => setGenid(e.target.value)} placeholder="e.g. vns.initiator"
            />
          </div>

          <div className="field-block">
            <label htmlFor="password">Password</label>
            <div className="input-affix">
              <input
                id="password" type={reveal ? 'text' : 'password'} value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-affix-btn"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? 'Hide password' : 'Show password'}
                aria-pressed={reveal}
              >
                {reveal ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <FaSpinner className="spin" size={13} aria-hidden="true" />
                  : <FaArrowRight size={13} aria-hidden="true" />}
            {busy ? 'Signing in' : 'Sign in'}
          </button>

          <div className="login-demo">
            Seeded accounts — tap one to fill the form, then change these passwords.
            <div className="login-demo-grid">
              {DEMO.map(([g, p, label]) => (
                <button type="button" key={g} onClick={() => useDemo(g, p)}>{label}</button>
              ))}
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
