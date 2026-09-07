import { useEffect, useMemo, useState } from 'react'
import {
  FaArrowLeft, FaArrowRight, FaCircleCheck, FaCircleInfo, FaEnvelope, FaFloppyDisk, FaLock,
  FaPaperPlane, FaPlus, FaRoute, FaSignature, FaSpinner, FaTrash,
  FaTriangleExclamation, FaUserGroup,
} from 'react-icons/fa6'
import ApprovalTrail from '../components/ApprovalTrail.jsx'
import Modal from '../components/Modal.jsx'
import { RiskPill } from '../components/Pills.jsx'
import Tick from '../components/Tick.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { blankMember, useJsa } from '../context/JsaContext.jsx'

const today = () => new Date().toISOString().slice(0, 10)

export default function Page3({ onBack, onNext }) {
  const {
    page1, setField, teamMembers, setTeamMembers, signOff, setSignOff,
    jobSteps, savePage3, savingPage, worksheetId, isEditable, status,
    approvalSteps, contractor, approvers, setApprovers,
    sendContractorCode, verifyContractorCode, submitForApproval, permitsTicked,
  } = useJsa()
  const { user } = useAuth()
  const toast = useToast()

  const isOnlyExempt = permitsTicked && permitsTicked.length > 0 && permitsTicked.every(p => p === 'sunday_holiday' || p === 'general_work')

  const [pools, setPools] = useState({ lvl1_approver: [], lvl2_approver: [], ph_approver: [] })
  const [contractorEmail, setContractorEmail] = useState(contractor.email || '')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [emailPreview, setEmailPreview] = useState(false)

  const highRisk = page1.risk_level === 'High_Risk'

  // Approver dropdowns come from the users table for this plant. Email and date
  // are never typed by hand — they are resolved from the chosen person.
  useEffect(() => {
    if (!page1.plant_id) return
    const roles = ['lvl1_approver', 'lvl2_approver', 'ph_approver']
    Promise.all(roles.map((r) => api.approvers(r, page1.plant_id).catch(() => [])))
      .then(([a, b, c]) => setPools({ lvl1_approver: a, lvl2_approver: b, ph_approver: c }))
      .catch((e) => toast.error(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page1.plant_id])

  useEffect(() => setContractorEmail(contractor.email || ''), [contractor.email])

  const chosen = useMemo(() => ({
    lvl1: pools.lvl1_approver.find((p) => String(p.id) === String(approvers.lvl1)),
    lvl2: pools.lvl2_approver.find((p) => String(p.id) === String(approvers.lvl2)),
    ph: pools.ph_approver.find((p) => String(p.id) === String(approvers.ph)),
  }), [pools, approvers])

  const filledSteps = jobSteps.filter((r) => (r.job_step || '').trim())
  const incomplete = filledSteps.filter(
    (r) => !r.hazards.some((h) => h.selected !== false && (h.potential_hazards || '').trim() && (h.control_measures || '').trim())
  ).length

  const blockers = []
  if (!filledSteps.length) blockers.push('Add at least one job step on page 2.')
  if (incomplete) blockers.push(`${incomplete} step(s) still have no hazard or control measure.`)
  if (!contractor.verified) blockers.push('The contractor has not acknowledged the JSA yet.')
  if (!approvers.lvl1) blockers.push('Choose a level 1 approver.')
  if (!approvers.lvl2) blockers.push('Choose a level 2 approver.')
  if (highRisk && !approvers.ph) blockers.push('High risk needs a Plant Head approver.')

  const updateMember = (rid, patch) =>
    setTeamMembers((prev) => prev.map((m) => (m.rid === rid ? { ...m, ...patch } : m)))

  const deleteMember = (rid) =>
    setTeamMembers((prev) => {
      const next = prev.filter((m) => m.rid !== rid)
      return next.length ? next : [blankMember()]
    })

  const saveDraft = async () => {
    try {
      const id = await savePage3()
      toast.ok(`Page 3 saved to JSA ${id}.`)
    } catch (e) { toast.error(e.message) }
  }

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractorEmail)) {
      toast.warn('Enter the contractor’s email address first.')
      return
    }
    setSending(true)
    try {
      await savePage3()
      const res = await sendContractorCode(contractorEmail.trim().toLowerCase())
      setDevCode(res.dev_code || null)
      setCode('')
      toast[res.email_status === 'queued' ? 'ok' : 'warn'](res.message)
    } catch (e) { toast.error(e.message) } finally { setSending(false) }
  }

  const verify = async () => {
    setVerifying(true)
    try {
      await verifyContractorCode(code.trim())
      setDevCode(null)
      setCode('')
      toast.ok('Contractor acknowledgement recorded.')
    } catch (e) { toast.error(e.message) } finally { setVerifying(false) }
  }

  const doSubmit = async () => {
    setSubmitting(true)
    try {
      await savePage3()
      const ws = await submitForApproval()
      const first = ws.approval_steps.find((s) => s.status === 'pending')
      toast.ok(`JSA ${ws.jsa_no || ws.id} sent to ${first?.assigned_user_name || first?.stage_label}.`)
    } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
  }

  return (
    <div className="sheet-inner">
      {!isEditable && (
        <div className={`banner tape-edge banner-lock ${status === 'approved' ? 'banner-good' : status === 'rejected' ? 'banner-bad' : 'banner-warn'}`}>
          <FaLock size={13} aria-hidden="true" />
          <span>
            <b>This JSA is locked. </b>
            {status === 'pending_approval' && 'It is out for approval, so nothing can change until an approver acts.'}
            {status === 'approved' && 'It is fully approved. Duplicate it from My JSAs to raise a new one.'}
            {status === 'rejected' && 'It was rejected. Duplicate it from My JSAs to raise a corrected version.'}
          </span>
        </div>
      )}

      <fieldset disabled={!isEditable} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="stack">
          {/* ------------------------------------------------ team members */}
          <section className="block">
            <div className="block-head">
              <FaUserGroup size={13} />
              <h2>JSA team member's details</h2>
              <span className="hint">
                {teamMembers.filter((m) => (m.name || '').trim()).length} member(s) named
              </span>
            </div>
            <div className="table-wrap" style={{ maxHeight: 'min(340px, 40vh)' }}>
              <table className="sheet-table">
                <thead>
                  <tr>
                    <th className="col-seq">#</th>
                    <th style={{ width: '28%' }}>Name</th>
                    <th style={{ width: '28%' }}>Company / Contractor</th>
                    <th style={{ width: '22%' }}>Department</th>
                    <th>Remarks</th>
                    <th className="col-act" aria-label="Delete row" />
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m, i) => (
                    <tr key={m.rid}>
                      <td className="col-seq">{i + 1}</td>
                      <td><input value={m.name}
                                 onChange={(e) => updateMember(m.rid, { name: e.target.value })} /></td>
                      <td><input value={m.company_contractor}
                                 onChange={(e) => updateMember(m.rid, { company_contractor: e.target.value })} /></td>
                      <td><input value={m.department}
                                 onChange={(e) => updateMember(m.rid, { department: e.target.value })} /></td>
                      <td><input value={m.remarks}
                                 onChange={(e) => updateMember(m.rid, { remarks: e.target.value })} /></td>
                      <td className="col-act">
                        <button type="button" className="icon-btn" onClick={() => deleteMember(m.rid)}
                                aria-label={`Delete member ${i + 1}`}>
                          <FaTrash size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: 'var(--s-2) var(--s-3)', borderTop: '1px solid var(--line)' }}>
              <button type="button" className="btn btn-ghost btn-sm"
                      onClick={() => setTeamMembers((prev) => [...prev, blankMember()])}>
                <FaPlus size={10} /> Add member
              </button>
            </div>
          </section>

          {/* ------------------------------------------------ contractor code */}
          <section className="block">
            <div className="block-head">
              <FaEnvelope size={13} />
              <h2>Contractor acknowledgement</h2>
              <span className="hint">
                {contractor.verified ? 'Confirmed' : 'Required before the JSA can be sent for approval'}
              </span>
            </div>

            {contractor.verified ? (
              <div className="banner banner-good" style={{ margin: 'var(--s-3)' }}>
                <FaCircleCheck size={13} />
                <span>
                  <b>{contractor.email} </b>
                  confirmed they have read this JSA. Change the address below to ask again.
                </span>
              </div>
            ) : (
              <div className="banner banner-info" style={{ margin: 'var(--s-3)' }}>
                <FaCircleInfo size={13} />
                <span>
                  Send the contractor a six digit code, walk them through the worksheet, then type
                  the code they read back to you. This proves the JSA was discussed before work began.
                </span>
              </div>
            )}

            <div className="form-grid" style={{ padding: '0 var(--s-3) var(--s-3)' }}>
              <div className="field-block" style={{ margin: 0 }}>
                <label>Contractor email</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={contractorEmail} type="email"
                         onChange={(e) => setContractorEmail(e.target.value)}
                         placeholder="name@contractor.com" />
                  <button type="button" className="btn" style={{ whiteSpace: 'nowrap' }}
                          disabled={sending || !isEditable} onClick={sendCode}>
                    {sending ? <FaSpinner className="spin" size={12} /> : <FaPaperPlane size={12} />}
                    {contractor.sentAt ? 'Resend code' : 'Send code'}
                  </button>
                </div>
                <div className="field-hint">
                  A fresh code is generated each time and expires after 60 minutes.
                </div>
              </div>

              <div className="field-block" style={{ margin: 0 }}>
                <label>Code from the contractor</label>
                <div className="code-entry">
                  <input className="code-input" value={code} inputMode="numeric" maxLength={6}
                         onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                         placeholder="······" disabled={contractor.verified} />
                  <button type="button" className="btn btn-primary"
                          disabled={verifying || code.length !== 6 || contractor.verified}
                          onClick={verify}>
                    {verifying ? <FaSpinner className="spin" size={12} /> : <FaCircleCheck size={12} />}
                    Confirm
                  </button>
                </div>
                {devCode && (
                  <div className="field-hint" style={{ marginTop: 6 }}>
                    Development echo (SMTP off or DEV_ECHO_EMAILS on):{' '}
                    <span className="code-shown">{devCode}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ------------------------------------------------ routing */}
          <section className="block">
            <div className="block-head">
              <FaRoute size={13} />
              <h2>Approval route</h2>
              <span className="hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <RiskPill risk={page1.risk_level} />
              </span>
            </div>

            <div className="form-grid" style={{ padding: 'var(--s-3)' }}>
              <div className="field-block" style={{ margin: 0 }}>
                <label>Level of approval</label>
                <select value={page1.risk_level} onChange={(e) => setField('risk_level', e.target.value)}>
                  <option value="Normal">Normal</option>
                  <option value="High_Risk">High risk</option>
                </select>
                <div className="field-hint">
                  {highRisk
                    ? 'Plant Head'
                    : 'Level 1 → Level 2 → Location admin'}
                </div>
              </div>

              {!highRisk && (
                <ApproverPick label="Level 1 approver" pool={pools.lvl1_approver}
                              value={approvers.lvl1} person={chosen.lvl1}
                              onChange={(v) => setApprovers((a) => ({ ...a, lvl1: v }))} />
              )}

              {!highRisk && (
                <ApproverPick label="Level 2 approver" pool={pools.lvl2_approver}
                              value={approvers.lvl2} person={chosen.lvl2}
                              onChange={(v) => setApprovers((a) => ({ ...a, lvl2: v }))} />
              )}

              {highRisk && (
                <ApproverPick label="Plant Head approver" pool={pools.ph_approver}
                              value={approvers.ph} person={chosen.ph}
                              onChange={(v) => setApprovers((a) => ({ ...a, ph: v }))} />
              )}

              {!highRisk && (
                <div className="field-block" style={{ margin: 0 }}>
                  <label>Final approval</label>
                  <input value="Any location admin of this plant" disabled />
                  <div className="field-hint">
                    Assigned to the plant, not a person, so leave does not stall the job.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ------------------------------------------------ sign off */}
          <section className="block">
            <div className="block-head">
              <FaSignature size={13} />
              <h2>JSA sign off</h2>
              <span className="hint">Prepared by {user.name} · {user.email_id} · {page1.jsa_prepared_date || today()}</span>
            </div>

            <div className="signoff-note">
              <Tick
                label="This Job Safety Analysis has been developed through consultation with our employees and has been read, understood, and signed by all employees undertaking the work."
                checked={signOff.consultation_ack}
                onChange={() => setSignOff((s) => ({ ...s, consultation_ack: !s.consultation_ack }))} />
              <Tick
                label="Pre-work briefing shall be conducted before starting of work."
                checked={signOff.pre_work_briefing_ack}
                onChange={() => setSignOff((s) => ({ ...s, pre_work_briefing_ack: !s.pre_work_briefing_ack }))} />
            </div>

            <div className="ro-grid" style={{ borderTop: '1px solid var(--line)' }}>
              <SignCell k="Prepared by" name={user.name} email={user.email_id}
                        date={page1.jsa_prepared_date} />
              <SignCell k="Checked by (level 1)" name={chosen.lvl1?.name} email={chosen.lvl1?.email_id} />
              <SignCell k="Reviewed by (level 2)" name={chosen.lvl2?.name} email={chosen.lvl2?.email_id} />
              {highRisk && (
                <SignCell k="Plant Head" name={chosen.ph?.name} email={chosen.ph?.email_id} />
              )}
              <SignCell k="Approved by" name="Location admin" email="assigned to the plant" />
            </div>
          </section>
        </div>
      </fieldset>

      {approvalSteps.length > 0 && (
        <section className="block">
          <div className="block-head">
            <FaRoute size={13} />
            <h2>Approval trail</h2>
          </div>
          <ApprovalTrail steps={approvalSteps} />
        </section>
      )}

      {/* ------------------------------------------------ actions */}
      <div className="actionbar actionbar-sticky">
        {isOnlyExempt && blockers.length > 0 && isEditable ? (
          <span className="status-line">
            <FaCircleInfo size={12} style={{ color: 'var(--brand-blue)' }} /> 
            Tabs 2 & 3 are optional for General/Sunday work. You may skip to PTW.
          </span>
        ) : blockers.length > 0 && isEditable ? (
          <span className="status-line warn">
            <FaTriangleExclamation size={12} /> {blockers[0]}
            {blockers.length > 1 && ` (+${blockers.length - 1} more)`}
          </span>
        ) : isEditable ? (
          <span className="status-line good">
            <FaCircleCheck size={12} /> Ready to send for approval
          </span>
        ) : (
          <span className="status-line"><FaLock size={12} /> Locked</span>
        )}
        <span className="grow" />
        <button type="button" className="btn" onClick={onBack}>
          <FaArrowLeft size={12} /> Page 2
        </button>
        <button type="button" className="btn" disabled={savingPage === 3 || submitting || !isEditable}
                onClick={saveDraft}>
          {savingPage === 3 ? <FaSpinner className="spin" size={12} /> : <FaFloppyDisk size={12} />} Save draft
        </button>
        {highRisk && (
          <button type="button" className="btn" disabled={!isEditable}
                  onClick={() => setEmailPreview(true)}>
            <FaEnvelope size={12} /> Preview Plant Head Email
          </button>
        )}
        <button type="button" className="btn btn-primary"
                disabled={submitting || !isEditable || blockers.length > 0}
                onClick={() => setConfirm(true)}>
          {submitting ? <FaSpinner className="spin" size={12} /> : <FaPaperPlane size={12} />}
          Submit for approval
        </button>
        {onNext && (
          <button type="button" className="btn" onClick={onNext}>
            PTW <FaArrowRight size={12} />
          </button>
        )}
      </div>

      {confirm && (
        <Modal title="Submit for approval?" onClose={() => setConfirm(false)} footer={
          <>
            <button className="btn" onClick={() => setConfirm(false)}>Keep editing</button>
            <button className="btn btn-primary" onClick={() => { setConfirm(false); doSubmit() }}>
              <FaPaperPlane size={12} /> Yes, send it
            </button>
          </>
        }>
          <p>
            Once submitted you <b>cannot edit this JSA</b>. It only reopens if an approver puts it
            on hold. {chosen.lvl1?.name} is notified first.
          </p>
          <div className="modal-summary">
            <div><b>JSA no.</b><span>{page1.jsa_no || `draft ${worksheetId ?? ''}`}</span></div>
            <div><b>Level of approval</b><span>{highRisk ? 'High risk' : 'Normal'}</span></div>
            <div><b>Job steps</b><span>{filledSteps.length}</span></div>
            <div><b>Contractor</b><span>{contractor.email} · confirmed</span></div>
            <div><b>Level 1</b><span>{chosen.lvl1?.name} · {chosen.lvl1?.email_id}</span></div>
            <div><b>Level 2</b><span>{chosen.lvl2?.name} · {chosen.lvl2?.email_id}</span></div>
            {highRisk && <div><b>Plant Head</b><span>{chosen.ph?.name} · {chosen.ph?.email_id}</span></div>}
            <div><b>Final</b><span>Any location admin of this plant</span></div>
          </div>
          {(!signOff.consultation_ack || !signOff.pre_work_briefing_ack) && (
            <div className="banner banner-warn" style={{ marginTop: 10 }}>
              <FaTriangleExclamation size={13} />
              <span>The sign-off acknowledgements are not both ticked.</span>
            </div>
          )}
        </Modal>
      )}

      {emailPreview && (
        <Modal title="Plant Head Email Preview" onClose={() => setEmailPreview(false)} footer={
          <button className="btn" onClick={() => setEmailPreview(false)}>Close Preview</button>
        }>
          <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', fontFamily: 'sans-serif' }}>
            <p><strong>To:</strong> {chosen.ph?.email_id || 'Plant Head'}</p>
            <p><strong>Subject:</strong> Approval Required: High Risk JSA {page1.jsa_no || 'Draft'}</p>
            <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
            
            <p>Please review the following High Risk JSA for approval.</p>
            
            <h3 style={{ marginTop: '20px', marginBottom: '8px' }}>General Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
              <tbody>
                <tr><td style={{ padding: '4px 0', width: '30%', fontWeight: 'bold' }}>JSA No:</td><td>{page1.jsa_no || 'Draft'}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Date:</td><td>{page1.jsa_prepared_date || today()}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Department:</td><td>{page1.department}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Location:</td><td>{page1.location}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Work Description:</td><td>{page1.job_description}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Contractor:</td><td>{page1.contractor}</td></tr>
              </tbody>
            </table>

            <h3 style={{ marginTop: '20px', marginBottom: '8px' }}>Job Steps (Summary)</h3>
            <p style={{ margin: 0, fontSize: '0.9em', lineHeight: '1.5' }}>
              {filledSteps.length > 0 
                ? `This JSA outlines a ${filledSteps.length}-step procedure for ${page1.job_description ? page1.job_description.toLowerCase() : 'the specified task'}. It begins with ${filledSteps[0].job_step.toLowerCase()} and concludes with ${filledSteps[filledSteps.length - 1].job_step.toLowerCase()}. Control measures for all associated hazards have been documented.`
                : 'No job steps have been defined yet.'}
            </p>

            <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
              <button style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
              <button style={{ padding: '10px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Hold</button>
              <button style={{ padding: '10px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
            </div>
            
            <p style={{ marginTop: '20px', fontSize: '0.8em', color: '#64748b' }}>
              * You can also view the full JSA details by clicking the link in your portal.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ helpers */
function ApproverPick({ label, pool, value, person, onChange }) {
  return (
    <div className="field-block" style={{ margin: 0 }}>
      <label>{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{pool.length ? 'Select a person' : 'Nobody with this role at your plant'}</option>
        {pool.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.designation ? ` — ${p.designation}` : ''}
          </option>
        ))}
      </select>
      <div className="field-hint">
        {person ? person.email_id : 'Their email is taken from the users table.'}
      </div>
    </div>
  )
}

function SignCell({ k, name, email, date }) {
  return (
    <div className="ro-cell">
      <div className="k">{k}</div>
      <div className={`v${name ? '' : ' empty-v'}`}>{name || 'not chosen yet'}</div>
      {email && <div className="v dim" style={{ fontSize: 'var(--t-xs)' }}>{email}</div>}
      {date && <div className="v dim mono" style={{ fontSize: 'var(--t-xs)' }}>{date}</div>}
    </div>
  )
}
