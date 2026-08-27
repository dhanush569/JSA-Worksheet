import { FaTriangleExclamation } from 'react-icons/fa6'
import { ROLE_LABEL } from '../auth/AuthContext.jsx'

const STATUS = {
  draft:            ['pill-draft',    'Draft'],
  pending_approval: ['pill-pending',  'Awaiting approval'],
  approved:         ['pill-approved', 'Approved'],
  rejected:         ['pill-rejected', 'Rejected'],
  on_hold:          ['pill-hold',     'On hold'],
}

export function StatusPill({ status, stageLabel }) {
  const [cls, label] = STATUS[status] || ['pill-draft', status]
  const text = status === 'pending_approval' && stageLabel ? `With ${stageLabel}` : label
  return <span className={`pill ${cls}`}>{text}</span>
}

export function RiskPill({ risk }) {
  const high = risk === 'High_Risk'
  return (
    <span className={`pill ${high ? 'pill-risk-high' : 'pill-risk-normal'}`}>
      {high && <FaTriangleExclamation size={10} />}
      {high ? 'High risk' : 'Normal'}
    </span>
  )
}

export function RolePill({ role }) {
  return <span className="pill pill-role">{ROLE_LABEL[role] || role}</span>
}
