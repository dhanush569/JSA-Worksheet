import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaInbox } from 'react-icons/fa6'
import { Actions, Cell, DataHead, DataList, DataRow } from '../components/DataList.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Loading } from '../components/Loading.jsx'
import { RiskPill } from '../components/Pills.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'

const COLUMNS = ['JSA no.', 'Job description', 'Risk', 'Steps', 'Raised by', 'Waiting', '']

const ago = (iso) => {
  if (!iso) return '—'
  const hours = Math.floor((Date.now() - new Date(iso)) / 3.6e6)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** How long something has waited is the thing that should nag, so past two days
    it is called out rather than left as plain grey text. */
const isStale = (iso) => !!iso && Date.now() - new Date(iso) > 2 * 864e5

export default function ApprovalInboxPage() {
  const [rows, setRows] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  const load = useCallback(() => {
    api.inbox()
      .then(setRows)
      .catch((e) => { toast.error(e.message); setRows([]) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(load, [load])

  return (
    <div className="page">
      <div className="page-inner animate-in">
        <div className="page-head">
          <h1>Approvals</h1>
          <span className="lede">
            Waiting on you right now. The same list arrives by email, but this one cannot be missed.
          </span>
          {rows?.length > 0 && (
            <>
              <span className="grow" />
              <span className="pill pill-pending">{rows.length} waiting</span>
            </>
          )}
        </div>

        {rows === null && <div className="list"><Loading label="Checking your inbox" /></div>}

        {rows !== null && rows.length === 0 && (
          <div className="list">
            <EmptyState
              icon={FaInbox}
              title="Nothing is waiting on you"
              hint="When an initiator sends a JSA to your stage it appears here, and you get an email at the same time."
            />
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <DataList>
            <DataHead variant="row-jsa" labels={COLUMNS} />
            {rows.map((r) => (
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
                <Cell label="Raised by" className="truncate">{r.initiator_name || '—'}</Cell>
                <Cell label="Waiting" title={r.submitted_at || ''}
                      className={isStale(r.submitted_at) ? 'status-line warn' : undefined}>
                  {ago(r.submitted_at)}
                </Cell>
                <Actions>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/review/${r.id}`)}>
                    Review
                  </button>
                </Actions>
              </DataRow>
            ))}
          </DataList>
        )}
      </div>
    </div>
  )
}
