import { FaClipboardList, FaListCheck, FaSignature, FaCircleInfo } from 'react-icons/fa6'

const STEPS = [
  { n: 1, label: 'General · Permits · PPE', Icon: FaClipboardList },
  { n: 2, label: 'Hazards & Controls', Icon: FaListCheck },
  { n: 3, label: 'Team & Sign Off', Icon: FaSignature },
]

export default function StepRail({ page, onChange, note }) {
  return (
    <nav className="rail" aria-label="Worksheet pages">
      {STEPS.map(({ n, label, Icon }) => (
        <button
          key={n}
          type="button"
          className="rail-step"
          aria-current={page === n}
          onClick={() => onChange(n)}
        >
          <span className="rail-num">{n}</span>
          <Icon size={13} />
          {label}
        </button>
      ))}
      <div className="rail-spacer" />
      {note && (
        <div className="rail-note">
          <FaCircleInfo size={12} />
          {note}
        </div>
      )}
    </nav>
  )
}
