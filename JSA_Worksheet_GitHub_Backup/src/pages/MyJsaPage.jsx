import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaClipboardList, FaCopy, FaPlus, FaTrash } from 'react-icons/fa6'
import { Actions, Cell, DataHead, DataList, DataRow } from '../components/DataList.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Loading } from '../components/Loading.jsx'
import { RiskPill, StatusPill } from '../components/Pills.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'

const COLUMNS = ['JSA no.', 'Job description', 'Risk', 'Steps', 'Prepared', 'Status', '']

const when = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—')

export default function MyJsaPage() {
  const [rows, setRows] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  const load = useCallback(() => {
    api.listWorksheets('?mine=true')
      .then(setRows)
      .catch((e) => { toast.error(e.message); setRows([]) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(load, [load])

  const duplicate = async (id) => {
    try {
      const ws = await api.duplicateWorksheet(id)
      toast.ok(`Copied to a new draft, JSA ${ws.jsa_no || ws.id}.`)
      navigate(`/jsa/${ws.id}`)
    } catch (e) { toast.error(e.message) }
  }

  const remove = async (id) => {
    try {
      await api.deleteWorksheet(id)
      toast.ok(`Draft ${id} deleted.`)
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="page">
      <div className="page-inner animate-in">
        <div className="page-head">
          <h1>My JSAs</h1>
          <span className="lede">Everything you have raised, and where each one stands.</span>
          <span className="grow" />
          <button className="btn btn-primary" onClick={() => navigate('/jsa/new')}>
            <FaPlus size={12} aria-hidden="true" /> New JSA
          </button>
        </div>

        {rows === null && <div className="list"><Loading label="Loading your worksheets" /></div>}

        {rows !== null && rows.length === 0 && (
          <div className="list">
            <EmptyState
              icon={FaClipboardList}
              title="No worksheets yet"
              hint="Raise a JSA and it will appear here with its approval status, so you always know who it is waiting on."
              action={
                <button className="btn btn-primary" onClick={() => navigate('/jsa/new')}>
                  <FaPlus size={12} aria-hidden="true" /> Raise your first JSA
                </button>
              }
            />
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <DataList>
            <DataHead variant="row-jsa" labels={COLUMNS} />
            {rows.map((r) => (
              <DataRow variant="row-jsa" key={r.id}>
                <Cell label="JSA no.">
                  <button className="strong-link truncate mono" onClick={() => navigate(`/jsa/${r.id}`)}>
                    {r.jsa_no || `draft ${r.id}`}
                  </button>
                </Cell>
                <Cell label="Job" className="truncate" title={r.job_description || ''}>
                  {r.job_description || <em className="dim">untitled</em>}
                </Cell>
                <Cell label="Risk"><RiskPill risk={r.risk_level} /></Cell>
                <Cell label="Steps" className="num">{r.step_count}</Cell>
                <Cell label="Prepared">{when(r.jsa_prepared_date)}</Cell>
                <Cell label="Status">
                  <StatusPill status={r.status} stageLabel={r.current_stage_label} />
                </Cell>
                <Actions>
                  <button className="icon-btn icon-btn-neutral" onClick={() => duplicate(r.id)}
                          title="Duplicate as a new draft"
                          aria-label={`Duplicate JSA ${r.jsa_no || r.id} as a new draft`}>
                    <FaCopy size={12} />
                  </button>
                  {r.status === 'draft' && (
                    <button className="icon-btn" onClick={() => remove(r.id)}
                            title="Delete this draft"
                            aria-label={`Delete draft ${r.jsa_no || r.id}`}>
                      <FaTrash size={12} />
                    </button>
                  )}
                </Actions>
              </DataRow>
            ))}
          </DataList>
        )}
      </div>
    </div>
  )
}
