import { PPE_GROUPS } from '../data/ppe.js'
import Tick from './Tick.jsx'

export default function PpeStrip({ selected, otherText, onToggle, onOtherText }) {
  return (
    <div className="rail-grid ppe-grid">
      {PPE_GROUPS.map(({ key, title, Icon, items }) => {
        const anyTicked = items.some((i) => selected[i.key])
        return (
          <div key={key} className={`ppe-col${anyTicked ? ' has-tick' : ''}`}>
            <div className="ppe-col-head">
              <span className="permit-disc" aria-hidden="true">
                <Icon />
              </span>
              <span className="ppe-col-title">{title}</span>
            </div>
            <div className="ppe-items">
              {items.map((item) => (
                // The "Other" text box sits beside the tick, not inside the
                // <label>, so typing in it never toggles the checkbox.
                <div key={item.key}>
                  <Tick
                    label={item.label}
                    checked={selected[item.key]}
                    onChange={() => onToggle(item.key)}
                  />
                  {item.other && (
                    <input
                      className="tick-other"
                      value={otherText ?? ''}
                      onChange={(e) => onOtherText(e.target.value)}
                      placeholder="specify"
                      aria-label="Other respirator, specify"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
