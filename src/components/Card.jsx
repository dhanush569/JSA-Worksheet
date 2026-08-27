/**
 * The standard panel. Pages already use `<section className="block">` in
 * places; this wraps the same markup so new work has one obvious way to do it.
 */
export function Card({ children, className = '', ...rest }) {
  return (
    <section className={`card ${className}`.trim()} {...rest}>
      {children}
    </section>
  )
}

/**
 * Card header: an optional icon, a title, and anything that belongs on the
 * right (a count, a filter, a pill).
 */
export function CardHead({ icon: Icon, title, children }) {
  return (
    <div className="card-head">
      {Icon && <Icon size={14} aria-hidden="true" />}
      {title && <h2>{title}</h2>}
      {children && <span className="hint">{children}</span>}
    </div>
  )
}
