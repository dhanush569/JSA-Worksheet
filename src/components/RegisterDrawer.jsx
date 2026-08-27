import { useEffect, useState } from 'react'
import { FaTrash, FaSpinner } from 'react-icons/fa6'
import Modal from './Modal.jsx'
import { api } from '../api/client.js'
import { useToast } from './Toast.jsx'

export default function RegisterDrawer({ onClose, onOpen }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const toast = useToast()

  const load = () => {
    setError(null)
    api
      .listWorksheets()
      .then(setRows)
      .catch((e) => {
        setRows([])
        setError(e.message)
      })
  }

  useEffect(load, [])

  const remove = async (id) => {
    try {
      await api.deleteWorksheet(id)
      toast.ok(`JSA ${id} deleted.`)
      load()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <Modal title="JSA Register" onClose={onClose} wide footer={
      <button type="button" className="btn" onClick={onClose}>Close</button>
    }>
      {rows === null && (
        <div className="empty"><FaSpinner className="spin" /> Loading the register…</div>
      )}

      {error && <div className="notice notice-ai" style={{ marginBottom: 10 }}>{error}</div>}

      {rows !== null && rows.length === 0 && !error && (
        <div className="empty">No worksheets saved yet. Fill page 1 and save a draft.</div>
      )}

      {rows !== null && rows.length > 0 && (
        <div>
          <div className="register-row head">
            <span>ID</span><span>Job description</span><span>JSA no.</span>
            <span>Plant</span><span>Updated</span><span />
          </div>
          {rows.map((r) => (
            <div className="register-row" key={r.id}>
              <span>{r.id}</span>
              <span className="truncate" title={r.job_description || ''}>
                {r.job_description || <em style={{ color: '#9aa5b1' }}>untitled</em>}
              </span>
              <span className="truncate">{r.jsa_no || '—'}</span>
              <span className="truncate">{r.plant || '—'}</span>
              <span>{new Date(r.updated_at).toLocaleDateString()}</span>
              <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-sm" onClick={() => onOpen(r.id)}>Open</button>
                <button type="button" className="icon-btn" onClick={() => remove(r.id)} aria-label={`Delete JSA ${r.id}`}>
                  <FaTrash size={11} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
