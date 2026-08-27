import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  FaCircleCheck, FaCircleInfo, FaPause, FaRoute, FaSpinner,
  FaTriangleExclamation, FaXmark,
} from 'react-icons/fa6'
import ApprovalTrail from '../components/ApprovalTrail.jsx'
import { LoadingScreen } from '../components/Loading.jsx'
import Modal from '../components/Modal.jsx'
import WorksheetReadOnly from '../components/WorksheetReadOnly.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'

const ACTIONS = {
  Approve: { cls: 'btn-approve', Icon: FaCircleCheck, verb: 'Approve',
             blurb: 'The next approver is notified straight away. A remark is optional.' },
  Reject:  { cls: 'btn-reject',  Icon: FaXmark, verb: 'Reject',
             blurb: 'The chain stops here and the JSA cannot be edited. Say why — the remark is required.' },
  Hold:    { cls: 'btn-hold',    Icon: FaPause, verb: 'Hold',
             blurb: 'The worksheet reopens for the initiator to fix. Say what needs changing — the remark is required.' },
}

/**
 * Two ways in:
 *   /review/:id            an approver already signed in
 *   /approve?token=...     straight off the Click to approve button in an email
 */
export default function ApprovalReviewPage({ fromEmail = false }) {
  const { id } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { user, adoptSession } = useAuth()
  const toast = useToast()

  const [ws, setWs] = useState(null)
  const [meta, setMeta] = useState({ can_act: false, stage_label: null, reason: null })
  const [emailToken, setEmailToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [asking, setAsking] = useState(null)   // 'Approve' | 'Reject' | 'Hold'
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (fromEmail) {
        const token = search.get('token')
        if (!token) throw new Error('That link is missing its token. Sign in to the portal instead.')
        const res = await api.openByToken(token)
        // The backend hands back a real session so the rest of the app works normally.
        adoptSession(res.session_token, res.approver)
        setEmailToken(token)
        setWs(res.worksheet)
        setMeta({ can_act: res.can_act, stage_label: res.stage_label, reason: res.reason })
      } else {
        const [sheet, can] = await Promise.all([api.getWorksheet(id), api.canAct(id)])
        setWs(sheet)
        setMeta({
          can_act: can.can_act,
          stage_label: can.stage_label,
          reason: can.can_act ? null
            : sheet.status === 'pending_approval'
              ? `This JSA is with the ${can.stage_label || 'next approver'}, so nothing is needed from you.`
              : `This JSA is ${sheet.status.replace('_', ' ')}.`,
        })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromEmail, id])

  useEffect(() => { load() }, [load])

  const decide = async () => {
    setBusy(true)
    try {
      const updated = await api.decide(ws.id, {
        decision: asking,
        remarks: remarks.trim() || null,
        token: emailToken || undefined,
      })
      setWs(updated)
      setMeta({ can_act: false, stage_label: null, reason: null })
      setAsking(null)
      setRemarks('')

      const next = updated.approval_steps.find((s) => s.status === 'pending')
      if (asking === 'Approve') {
        toast.ok(next
          ? `Approved. Sent on to ${next.assigned_user_name || next.stage_label}.`
          : 'Approved. This JSA is now fully approved.')
      } else {
        toast.ok(`Recorded as ${asking}. The initiator has been told.`)
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingScreen label="Opening the JSA" />

  if (error) {
    return (
      <div className="center-note">
        <FaTriangleExclamation size={22} style={{ color: 'var(--danger)' }} aria-hidden="true" />
        <div style={{ maxWidth: '46ch' }}>{error}</div>
        <button className="btn" onClick={() => navigate(user ? '/approvals' : '/login')}>
          {user ? 'Go to my approvals' : 'Sign in'}
        </button>
      </div>
    )
  }

  const needsRemark = asking === 'Reject' || asking === 'Hold'
  const cfg = asking ? ACTIONS[asking] : null

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-head">
          <h1>Review JSA {ws.jsa_no || ws.id}</h1>
          <span className="lede">
            {meta.can_act
              ? `You are the ${meta.stage_label} for this worksheet. Read it, then record your decision.`
              : 'Read only.'}
          </span>
          <span className="grow" />
          {user && (
            <button className="btn" onClick={() => navigate('/approvals')}>My approvals</button>
          )}
        </div>

        {meta.reason && (
          <div className="banner banner-info">
            <FaCircleInfo size={13} />
            <span>{meta.reason}</span>
          </div>
        )}

        {meta.can_act && (
          <div className="actionbar actionbar-decide">
            <span className="status-line">
              <FaRoute size={12} aria-hidden="true" /> Your decision is recorded against this JSA permanently.
            </span>
            <span className="grow" />
            <div className="decide-bar">
              {Object.entries(ACTIONS).map(([key, { cls, Icon, verb }]) => (
                <button key={key} className={`btn ${cls}`} disabled={busy}
                        onClick={() => { setAsking(key); setRemarks('') }}>
                  <Icon size={12} /> {verb}
                </button>
              ))}
            </div>
          </div>
        )}

        <section className="block">
          <div className="block-head">
            <FaRoute size={13} />
            <h2>Approval trail</h2>
          </div>
          <ApprovalTrail steps={ws.approval_steps} />
        </section>

        <WorksheetReadOnly ws={ws} />
      </div>

      {asking && (
        <Modal title={`${cfg.verb} this JSA?`} onClose={() => setAsking(null)} footer={
          <>
            <button className="btn" onClick={() => setAsking(null)}>Cancel</button>
            <button className={`btn ${cfg.cls}`}
                    disabled={busy || (needsRemark && !remarks.trim())} onClick={decide}>
              {busy ? <FaSpinner className="spin" size={12} /> : <cfg.Icon size={12} />}
              Confirm {cfg.verb.toLowerCase()}
            </button>
          </>
        }>
          <p>{cfg.blurb}</p>
          <div className="field-block" style={{ marginTop: 10 }}>
            <label>Remark {needsRemark ? '(required)' : '(optional)'}</label>
            <textarea rows={4} value={remarks} autoFocus
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder={needsRemark
                        ? 'What has to change, and why'
                        : 'Anything the team should know'} />
            {needsRemark && !remarks.trim() && (
              <div className="field-hint" style={{ color: 'var(--danger)' }}>
                A remark is required to {cfg.verb.toLowerCase()} a JSA.
              </div>
            )}
          </div>
          <div className="modal-summary">
            <div><b>JSA no.</b><span>{ws.jsa_no || ws.id}</span></div>
            <div><b>Job</b><span>{ws.job_description || '—'}</span></div>
            <div><b>Raised by</b><span>{ws.initiator?.name || '—'}</span></div>
            <div><b>Your stage</b><span>{meta.stage_label}</span></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
