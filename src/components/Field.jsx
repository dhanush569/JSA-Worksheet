import { cloneElement, isValidElement, useId } from 'react'

/** One ruled row of the printed grid. `cols` is how many label/input pairs it holds. */
export function Row({ cols = 3, sep = false, children }) {
  return <div className={`row row-${cols}${sep ? ' row-sep' : ''}`}>{children}</div>
}

/**
 * Label cell + input cell.
 *
 * The label is a real <label> bound to the control beside it, so screen readers
 * and click-to-focus both work — the two cells are grid siblings rather than
 * nested, so the association has to be explicit.
 *
 * Pass `group` for a cell that holds several controls (a radio set), where there
 * is no single input to point at.
 */
export function Field({ label, htmlFor, group = false, children }) {
  const auto = useId()
  const id = htmlFor || auto

  // Hand the id down to a single child control that has not been given one.
  const child = !group && isValidElement(children) && !children.props.id
    ? cloneElement(children, { id })
    : children

  return (
    <>
      {group ? (
        <div className="cell-label" role="presentation">{label}</div>
      ) : (
        <label className="cell-label" htmlFor={id}>{label}</label>
      )}
      <div className="cell-input">{child}</div>
    </>
  )
}

export function TextField({ id, value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      id={id}
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

export function TimeField({ id, value, onChange }) {
  const [h, m] = (value || '00:00').split(':')
  let hr = parseInt(h || '0', 10)
  const isPM = hr >= 12
  const hr12 = hr % 12 || 12

  const update = (newHr12, newM, newIsPM) => {
    let finalHr = parseInt(newHr12, 10)
    if (isNaN(finalHr)) finalHr = 12
    if (newIsPM && finalHr !== 12) finalHr += 12
    if (!newIsPM && finalHr === 12) finalHr = 0
    onChange(`${String(finalHr).padStart(2, '0')}:${String(newM).padStart(2, '0')}`)
  }

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <input type="number" id={id} min="1" max="12" value={hr12} onChange={e => update(e.target.value, m, isPM)} style={{ width: '40px', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} />
      :
      <input type="number" min="0" max="59" value={m} onChange={e => update(hr12, e.target.value, isPM)} style={{ width: '40px', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} />
      <select value={isPM ? 'PM' : 'AM'} onChange={e => update(hr12, m, e.target.value === 'PM')} style={{ border: 'none', outline: 'none', background: 'transparent' }}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
