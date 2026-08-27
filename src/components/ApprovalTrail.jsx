import { FaCheck, FaClock, FaPause, FaRoute, FaXmark } from 'react-icons/fa6'
import EmptyState from './EmptyState.jsx'
import RouteRibbon from './RouteRibbon.jsx'

const MARK = {
  approved: <FaCheck size={10} />,
  rejected: <FaXmark size={10} />,
  hold: <FaPause size={9} />,
  pending: <FaClock size={10} />,
}

const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString([], {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : null

/**
 * The signature record: who is in the chain, in order, and what each of them
 * did. The ribbon across the top answers "where is this now"; the rows beneath
 * carry the detail an auditor needs — names, addresses, timestamps, remarks.
 */
export default function ApprovalTrail({ steps }) {
  if (!steps?.length) {
    return (
      <EmptyState
        icon={FaRoute}
        title="No route yet"
        hint="The approval route appears here once the JSA is submitted."
      />
    )
  }

  return (
    <>
      <RouteRibbon steps={steps} />

      <div className="trail">
        {steps.map((s, i) => {
          const cls =
            s.status === 'approved' ? 'done'
            : s.status === 'pending' ? 'is-current'
            : s.status === 'rejected' || s.status === 'hold' ? 'bad'
            : ''

          return (
            <div className={`trail-row ${cls}`.trim()} key={s.id ?? i}>
              <span className="trail-seq" aria-hidden="true">{MARK[s.status] || i + 1}</span>
              <span className="trail-stage">{s.stage_label || s.stage}</span>
              <span className="trail-who">
                {s.decided_by_name || s.assigned_user_name ||
                  `Any ${String(s.assigned_role || '').replace(/_/g, ' ')}`}
                {s.assigned_user_email && <small>{s.assigned_user_email}</small>}
              </span>
              <span className="trail-stage dim">
                {s.decision || (s.status === 'pending' ? 'Awaiting' : s.status)}
              </span>
              <span className="trail-when">
                {when(s.decided_at) || (s.notified_at ? 'Notified' : '—')}
              </span>
              {s.remarks && (
                <span className="trail-remark" style={{ gridColumn: '2 / -1' }}>
                  {s.remarks}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
