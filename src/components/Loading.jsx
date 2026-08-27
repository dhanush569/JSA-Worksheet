import { FaSpinner } from 'react-icons/fa6'

/** One loading treatment for the whole app, so waiting always looks the same. */
export function Loading({ label = 'Loading' }) {
  return (
    <div className="empty" role="status" aria-live="polite">
      <FaSpinner className="spin" size={18} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

/** A full-height version for route transitions. */
export function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="center-note" role="status" aria-live="polite">
      <FaSpinner className="spin" size={22} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

/**
 * Placeholder rows that match the height of the real ones, so a list does not
 * jump when the data lands.
 */
export function SkeletonRows({ rows = 5, variant = '' }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div className={`list-row ${variant}`.trim()} key={i}>
          <span className="skeleton" style={{ height: 14, width: '70%' }} />
          <span className="skeleton" style={{ height: 14, width: '90%' }} />
          <span className="skeleton" style={{ height: 14, width: '55%' }} />
        </div>
      ))}
    </div>
  )
}
