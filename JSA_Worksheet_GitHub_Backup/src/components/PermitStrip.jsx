import { FaCheck } from 'react-icons/fa6'
import { WORK_PERMITS } from '../data/permits.js'

/** The signature rail: ten pictogram tiles split by hairline vertical rules. */
export default function PermitStrip({ selected, onToggle }) {
  return (
    <div className="rail-grid permit-grid">
      {WORK_PERMITS.map(({ key, label, Icon }) => {
        const on = !!selected[key]
        return (
          <button
            key={key}
            type="button"
            className="permit"
            aria-pressed={on}
            onClick={() => onToggle(key)}
            title={label}
          >
            <span className="permit-disc" aria-hidden="true">
              <Icon />
            </span>
            <span className="permit-label">{label}</span>
            <span className="tickbox" aria-hidden="true">
              <FaCheck />
            </span>
          </button>
        )
      })}
    </div>
  )
}
