import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaCircleCheck, FaClock, FaEnvelopeOpenText, FaIndustry, FaTriangleExclamation,
  FaChartPie, FaClipboardList,
} from 'react-icons/fa6'
import { Actions, Cell, DataBody, DataHead, DataList, DataRow } from '../components/DataList.jsx'
import { Card, CardHead } from '../components/Card.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Loading } from '../components/Loading.jsx'
import { RiskPill, StatusPill } from '../components/Pills.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'
import { MANAGER_ROLES, useAuth } from '../auth/AuthContext.jsx'

const PLANT_COLUMNS = ['Plant', 'Total', 'Draft', 'Pending', 'Approved', 'Rejected', 'Hold', 'Last activity']
const DONE_COLUMNS = ['JSA no.', 'Job description', 'Risk', 'Steps', 'Plant', 'Status', '']
const MAIL_COLUMNS = ['Sent', 'To', 'Subject', 'Result']

const when = (iso) => (iso ? new Date(iso).toLocaleString([], {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}) : '—')

export default function LocationSummaryPage() {
  const [rows, setRows] = useState(null)
  const [done, setDone] = useState([])
  const [mail, setMail] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    Promise.all([api.byLocation(), api.completed()])
      .then(([a, b]) => { setRows(a); setDone(b) })
      .catch((e) => { toast.error(e.message); setRows([]) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totals = (rows || []).reduce((acc, r) => ({
    total: acc.total + r.total, pending: acc.pending + r.pending,
    approved: acc.approved + r.approved, high: acc.high + r.high_risk,
  }), { total: 0, pending: 0, approved: 0, high: 0 })

  const openMail = async () => {
    try { setMail(await api.emailLog()) } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="page">
      <div className="page-inner animate-in">
        <div className="page-head">
          <h1>JSA summary</h1>
          <span className="lede">Every plant you oversee, and how its worksheets are moving.</span>
          <span className="grow" />
          {MANAGER_ROLES.includes(user.role) && (
            <button className="btn" onClick={openMail}>
              <FaEnvelopeOpenText size={12} aria-hidden="true" /> Email log
            </button>
          )}
        </div>

        {rows === null && <Card><Loading label="Gathering plant figures" /></Card>}

        {rows !== null && (
          <>
            {/* --------------------------------------------------- headline numbers */}
            <Card>
              <div className="metrics">
                <div className="metric">
                  <div className="k">Worksheets</div>
                  <div className="v">{totals.total}</div>
                </div>
                <div className="metric warn">
                  <div className="k"><FaClock size={10} aria-hidden="true" /> Awaiting approval</div>
                  <div className="v">{totals.pending}</div>
                </div>
                <div className="metric good">
                  <div className="k"><FaCircleCheck size={10} aria-hidden="true" /> Approved</div>
                  <div className="v">{totals.approved}</div>
                </div>
                <div className="metric bad">
                  <div className="k"><FaTriangleExclamation size={10} aria-hidden="true" /> High risk</div>
                  <div className="v">{totals.high}</div>
                </div>
                <div className="metric">
                  <div className="k"><FaIndustry size={10} aria-hidden="true" /> Plants</div>
                  <div className="v">{rows.length}</div>
                </div>
              </div>
            </Card>

            {/* --------------------------------------------------------- by location */}
            <Card>
              <CardHead icon={FaChartPie} title="By location">
                {rows.length} plant{rows.length === 1 ? '' : 's'}
              </CardHead>
              {rows.length === 0 ? (
                <EmptyState
                  icon={FaIndustry}
                  title="No plants yet"
                  hint="Add a plant from User management and its worksheets will be counted here."
                />
              ) : (
                <>
                  <DataHead variant="row-sum" labels={PLANT_COLUMNS} />
                  {rows.map((r) => (
                    <DataRow variant="row-sum" key={r.plant_id}>
                      <Cell className="truncate">{r.plant_name}</Cell>
                      <Cell label="Total" className="num">{r.total}</Cell>
                      <Cell label="Draft" className="num dim">{r.draft}</Cell>
                      <Cell label="Pending" className="num"
                            style={{ color: r.pending ? 'var(--warn)' : undefined, fontWeight: r.pending ? 600 : undefined }}>
                        {r.pending}
                      </Cell>
                      <Cell label="Approved" className="num"
                            style={{ color: r.approved ? 'var(--ok)' : undefined }}>
                        {r.approved}
                      </Cell>
                      <Cell label="Rejected" className="num"
                            style={{ color: r.rejected ? 'var(--danger)' : undefined }}>
                        {r.rejected}
                      </Cell>
                      <Cell label="Hold" className="num">{r.on_hold}</Cell>
                      <Cell label="Last activity" className="dim num">{when(r.last_activity)}</Cell>
                    </DataRow>
                  ))}
                </>
              )}
            </Card>

            {/* ------------------------------------------------------ completed JSAs */}
            <Card>
              <CardHead icon={FaCircleCheck} title="Completed JSAs">
                {done.length} approved
              </CardHead>
              {done.length === 0 ? (
                <EmptyState
                  icon={FaClipboardList}
                  title="Nothing fully approved yet"
                  hint="A worksheet lands here once the location admin records the final approval."
                />
              ) : (
                <>
                  <DataHead variant="row-jsa" labels={DONE_COLUMNS} />
                  <DataBody maxHeight="42vh">
                    {done.map((r) => (
                      <DataRow variant="row-jsa" key={r.id}>
                        <Cell label="JSA no.">
                          <button className="strong-link truncate mono" onClick={() => navigate(`/review/${r.id}`)}>
                            {r.jsa_no || r.id}
                          </button>
                        </Cell>
                        <Cell label="Job" className="truncate" title={r.job_description || ''}>
                          {r.job_description || <em className="dim">untitled</em>}
                        </Cell>
                        <Cell label="Risk"><RiskPill risk={r.risk_level} /></Cell>
                        <Cell label="Steps" className="num">{r.step_count}</Cell>
                        <Cell label="Plant" className="truncate">{r.plant_name}</Cell>
                        <Cell label="Status"><StatusPill status={r.status} /></Cell>
                        <Actions>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/review/${r.id}`)}>
                            Open
                          </button>
                        </Actions>
                      </DataRow>
                    ))}
                  </DataBody>
                </>
              )}
            </Card>

            {/* ----------------------------------------------------------- email log */}
            {mail && (
              <Card>
                <CardHead icon={FaEnvelopeOpenText} title="Email log">
                  Newest first — “skipped” means SMTP is not configured
                </CardHead>
                {mail.length === 0 ? (
                  <EmptyState
                    icon={FaEnvelopeOpenText}
                    title="Nothing sent yet"
                    hint="Approval requests, contractor codes and decision notices are all recorded here."
                  />
                ) : (
                  <>
                    <DataHead variant="row-mail" labels={MAIL_COLUMNS} />
                    <DataBody maxHeight="36vh">
                      {mail.map((m) => (
                        <DataRow variant="row-mail" key={m.id}>
                          <Cell label="Sent" className="dim mono">{when(m.created_at)}</Cell>
                          <Cell label="To" className="truncate" title={m.to_email}>{m.to_email}</Cell>
                          <Cell label="Subject" className="truncate" title={m.error || m.subject}>
                            {m.subject}
                          </Cell>
                          <Cell label="Result">
                            <span className={`pill ${m.status === 'sent' ? 'pill-approved'
                              : m.status === 'failed' ? 'pill-rejected' : 'pill-draft'}`}>
                              {m.status}
                            </span>
                          </Cell>
                        </DataRow>
                      ))}
                    </DataBody>
                  </>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
