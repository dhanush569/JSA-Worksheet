import { FaCheck } from 'react-icons/fa6'

/** A single checkbox rendered as the printed form's tick box. */
export default function Tick({ checked, onChange, label, children }) {
  return (
    <label className="tick">
      <input type="checkbox" checked={!!checked} onChange={onChange} />
      <span className="tickbox" aria-hidden="true">
        <FaCheck />
      </span>
      <span>{label}</span>
      {children}
    </label>
  )
}
