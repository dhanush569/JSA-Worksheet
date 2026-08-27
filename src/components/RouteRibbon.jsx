import { FaCheck, FaClock, FaMinus, FaPause, FaXmark } from 'react-icons/fa6'

/**
 * The approval chain, shown as the chain it is.
 *
 * Where a worksheet stands is the single fact everybody opening this app wants
 * first, so it gets its own visual: numbered stages joined by a rule that fills
 * in behind each stage as it is decided. The numbers are meaningful here rather
 * than decorative — nobody downstream is even notified until the stage before
 * them approves.
 *
 * Status is never carried by colour alone: each stage also has a distinct mark
 * (tick, clock, cross, pause, dash) and a word.
 */

const MARK = {
  approved: <FaCheck size={12} />,
  rejected: <FaXmark size={12} />,
  hold: <FaPause size={11} />,
  pending: <FaClock size={12} />,
  skipped: <FaMinus size={12} />,
}

const WORD = {
  approved: 'Approved',
  rejected: 'Rejected',
  hold: 'On hold',
  pending: 'Awaiting',
  skipped: 'Not required',
}

const toneOf = (status) => {
  if (status === 'approved') return 'is-done'
  if (status === 'pending') return 'is-current'
  if (status === 'rejected') return 'is-bad'
  if (status === 'hold') return 'is-hold'
  return ''
}

const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString([], {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : null

export default function RouteRibbon({ steps = [] }) {
  if (!steps.length) return null

  return (
    <ol className="ribbon" aria-label="Approval route">
      {steps.map((s, i) => {
        const tone = toneOf(s.status)
        const who = s.decided_by_name || s.assigned_user_name ||
          (s.assigned_role ? `Any ${String(s.assigned_role).replace(/_/g, ' ')}` : '—')
        const stamp = when(s.decided_at)

        return (
          <li className={`ribbon-node ${tone}`.trim()} key={s.id ?? i}>
            <span className="ribbon-disc" aria-hidden="true">
              {MARK[s.status] || i + 1}
            </span>
            <span className="ribbon-stage">{s.stage_label || s.stage}</span>
            <span className="ribbon-who">{who}</span>
            <span className="ribbon-when">
              {stamp || (s.notified_at ? 'Notified' : WORD[s.status] || '—')}
            </span>
            {/* Screen readers get the state as a word, not as a colour. */}
            <span className="u-visually-hidden">
              {`Stage ${i + 1}: ${WORD[s.status] || s.status}`}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
