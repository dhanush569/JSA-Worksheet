import { NavLink } from 'react-router-dom'
import {
  FaChartPie, FaClipboardList, FaInbox, FaListCheck, FaUsersGear,
} from 'react-icons/fa6'
import { useAuth } from '../auth/AuthContext.jsx'

const TABS = [
  { to: '/users',     label: 'User management', Icon: FaUsersGear,
    roles: ['admin', 'company_admin', 'location_admin'] },
  { to: '/jsa/new',   label: 'New JSA', Icon: FaClipboardList, roles: ['jsa_initiator', 'admin'] },
  { to: '/my-jsa',    label: 'My JSAs', Icon: FaListCheck, roles: ['jsa_initiator', 'admin'] },
  { to: '/approvals', label: 'Approvals', Icon: FaInbox, badge: true,
    roles: ['lvl1_approver', 'lvl2_approver', 'ph_approver', 'location_admin', 'admin'] },
  { to: '/summary',   label: 'Summary', Icon: FaChartPie,
    roles: ['admin', 'company_admin', 'location_admin'] },
]

export default function NavTabs({ pendingCount = 0 }) {
  const { user } = useAuth()
  if (!user) return null
  const tabs = TABS.filter((t) => t.roles.includes(user.role))

  return (
    <nav className="navtabs" aria-label="Sections">
      {tabs.map(({ to, label, Icon, badge }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `navtab${isActive ? ' active' : ''}`}>
          <Icon size={14} aria-hidden="true" />
          <span>{label}</span>
          {badge && pendingCount > 0 && (
            <span className="count" aria-label={`${pendingCount} waiting on you`}>
              {pendingCount}
            </span>
          )}
        </NavLink>
      ))}

      <div className="rail-spacer" />

      <div className="whoami">
        <span className="whoami-name">
          <b>{user.name}</b>
          <span className="role">{user.genid}</span>
        </span>
      </div>
    </nav>
  )
}
