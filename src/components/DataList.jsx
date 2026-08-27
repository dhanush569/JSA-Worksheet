/**
 * A tabular list that stops being tabular on a small screen.
 *
 * On a desktop these render as CSS-grid rows with a sticky header, which is
 * what a register of worksheets wants. Below 860px the header is dropped and
 * each cell prints the label it was given, so a seven-column register reads as
 * a stack of labelled blocks instead of forcing a horizontal scrollbar.
 *
 *   <DataList>
 *     <DataHead variant="row-jsa" labels={['JSA no.', 'Job', …]} />
 *     <DataBody maxHeight="52vh">
 *       {rows.map((r) => (
 *         <DataRow variant="row-jsa" key={r.id}>
 *           <Cell label="JSA no.">{r.jsa_no}</Cell>
 *           …
 *           <Actions><button …/></Actions>
 *         </DataRow>
 *       ))}
 *     </DataBody>
 *   </DataList>
 *
 * `variant` is the grid-template class (row-jsa, row-user, row-plant, row-sum)
 * and must match between the head and its rows.
 */

export function DataList({ children, className = '' }) {
  return <div className={`list ${className}`.trim()}>{children}</div>
}

/** Column headings. Pass an empty string for a column that has no heading. */
export function DataHead({ variant = '', labels = [] }) {
  return (
    <div className={`list-row head ${variant}`.trim()} role="row">
      {labels.map((label, i) => (
        <span key={i} className={label === '#' || label?.startsWith?.('#') ? 'num' : undefined}>
          {label}
        </span>
      ))}
    </div>
  )
}

/** A scrolling region beneath a sticky header. */
export function DataBody({ maxHeight, children }) {
  if (!maxHeight) return children
  return <div className="dt-body" style={{ maxHeight }}>{children}</div>
}

export function DataRow({ variant = '', className = '', children, ...rest }) {
  return (
    <div className={`list-row ${variant} ${className}`.trim()} role="row" {...rest}>
      {children}
    </div>
  )
}

/**
 * One cell. `label` is what shows on a phone; leave it off for cells that are
 * self-explanatory or hold only controls.
 */
export function Cell({ label, className = '', title, children, ...rest }) {
  return (
    <span className={className || undefined} data-label={label} title={title} {...rest}>
      {children}
    </span>
  )
}

/** The trailing cell of buttons. Right-aligned on desktop, ruled off on mobile. */
export function Actions({ children, className = '' }) {
  return (
    <span
      className={`dt-actions ${className}`.trim()}
      style={{ display: 'flex', gap: 'var(--s-1)', justifyContent: 'flex-end' }}
    >
      {children}
    </span>
  )
}
