import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  FaCircleCheck, FaCircleInfo, FaTriangleExclamation, FaXmark,
} from 'react-icons/fa6'

const ToastContext = createContext(null)

const ICONS = {
  ok: FaCircleCheck,
  err: FaTriangleExclamation,
  warn: FaTriangleExclamation,
  info: FaCircleInfo,
}

/** Errors get read out; confirmations do not interrupt what you are typing. */
const POLITENESS = { err: 'assertive', warn: 'assertive' }

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message, kind = 'info', ms = 4200) => {
    const id = Math.random().toString(36).slice(2)
    setItems((prev) => [...prev, { id, message, kind }])
    setTimeout(() => dismiss(id), ms)
  }, [dismiss])

  const toast = useMemo(() => ({
    ok: (m) => push(m, 'ok'),
    error: (m) => push(m, 'err', 6500),
    warn: (m) => push(m, 'warn', 6500),
    info: (m) => push(m, 'info'),
  }), [push])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {items.map((t) => {
          const Icon = ICONS[t.kind] || FaCircleInfo
          return (
            <div
              key={t.id}
              className={`toast toast-${t.kind}`}
              role={POLITENESS[t.kind] ? 'alert' : 'status'}
              aria-live={POLITENESS[t.kind] || 'polite'}
            >
              <Icon size={15} aria-hidden="true" />
              <span className="grow">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss this message"
                className="toast-x"
              >
                <FaXmark size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
