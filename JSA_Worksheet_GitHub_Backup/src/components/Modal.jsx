import { useEffect, useId, useRef } from 'react'
import { FaXmark } from 'react-icons/fa6'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A dialog that behaves like one: focus moves in on open and back out on close,
 * Tab is trapped inside it, Escape dismisses it, and the page behind it stops
 * scrolling. Same props as before — title, children, onClose, wide, footer.
 */
export default function Modal({ title, children, onClose, wide = false, footer }) {
  const panel = useRef(null)
  const returnTo = useRef(null)
  const titleId = useId()

  useEffect(() => {
    returnTo.current = document.activeElement

    // Move focus to the first thing worth typing in, or the dialog itself.
    const first = panel.current?.querySelector(FOCUSABLE)
    ;(first || panel.current)?.focus?.()

    // Stop the page behind the dialog from scrolling with it.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return

      const items = Array.from(panel.current?.querySelectorAll(FOCUSABLE) || [])
        .filter((el) => el.offsetParent !== null)
      if (!items.length) return

      const edge = e.shiftKey ? items[0] : items[items.length - 1]
      if (document.activeElement === edge) {
        e.preventDefault()
        ;(e.shiftKey ? items[items.length - 1] : items[0]).focus()
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
      returnTo.current?.focus?.()
    }
  }, [onClose])

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        className={`modal${wide ? ' modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panel}
        tabIndex={-1}
      >
        <h2 id={titleId}>
          <span>{title}</span>
          <button
            type="button"
            className="icon-btn icon-btn-neutral no-print"
            onClick={onClose}
            aria-label="Close this dialog"
          >
            <FaXmark size={14} />
          </button>
        </h2>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
