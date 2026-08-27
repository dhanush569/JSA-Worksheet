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
