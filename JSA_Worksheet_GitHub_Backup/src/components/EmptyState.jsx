/**
 * An empty screen is an invitation to act, so it says what is missing and what
 * to do about it rather than just reporting nothing.
 */
export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="emptystate">
      {Icon && (
        <span className="emptystate-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
      )}
      {title && <span className="emptystate-title">{title}</span>}
      {hint && <span className="emptystate-hint">{hint}</span>}
      {action}
    </div>
  )
}
