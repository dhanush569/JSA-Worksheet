import { useMemo, useState } from 'react'
import {
  FaArrowLeft, FaArrowRight, FaCircleCheck, FaCircleInfo, FaEraser, FaFloppyDisk,
  FaListCheck, FaPlus, FaRotate, FaSpinner, FaTrash, FaTriangleExclamation,
  FaWandMagicSparkles,
} from 'react-icons/fa6'
import Modal from '../components/Modal.jsx'
import Tick from '../components/Tick.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'
import { blankStep, blankHazard, useJsa } from '../context/JsaContext.jsx'
import { WORK_PERMITS } from '../data/permits.js'
import { PPE_LABEL } from '../data/ppe.js'

const STATUS_OPTIONS = ['Open', 'In progress', 'Completed', 'Not applicable']

export default function Page2({ onBack, onNext }) {
  const {
    page1, permitsTicked, ppeTicked, jobSteps, setJobSteps,
    savePage2, savingPage, worksheetId, isEditable,
  } = useJsa()

  const [generating, setGenerating] = useState(false)
  const [aiRun, setAiRun] = useState(null)
  const [regenAsk, setRegenAsk] = useState(false)
  const [replaceEdited, setReplaceEdited] = useState(false)
  const toast = useToast()

  const busy = savingPage === 2
  const filledSteps = useMemo(() => jobSteps.filter((r) => (r.job_step || '').trim()), [jobSteps])
  const hasDrafts = jobSteps.some((r) => r.hazards.some(h => h.ai_generated && !h.edited_by_user))
  const editedDrafts = jobSteps.reduce((acc, r) => acc + r.hazards.filter(h => h.ai_generated && h.edited_by_user).length, 0)
  const generatedOnce = aiRun !== null || jobSteps.some((r) => r.hazards.some(h => h.ai_generated))

  const updateStep = (rid, patch) =>
    setJobSteps((prev) => prev.map((r) => (r.rid === rid ? { ...r, ...patch } : r)))

  const updateHazard = (stepRid, hazardRid, patch) =>
    setJobSteps((prev) => prev.map((r) => {
      if (r.rid !== stepRid) return r
      return {
        ...r,
        hazards: r.hazards.map((h) => (h.rid === hazardRid ? { ...h, ...patch } : h))
      }
    }))

  const editHazardAiCell = (stepRid, hazard, field, value) =>
    updateHazard(stepRid, hazard.rid, {
      [field]: value,
      edited_by_user: hazard.ai_generated ? true : hazard.edited_by_user,
    })

  const addHazardRow = (stepRid) =>
    setJobSteps((prev) => prev.map((r) => r.rid === stepRid ? { ...r, hazards: [...r.hazards, blankHazard()] } : r))

  const deleteHazardRow = (stepRid, hazardRid) =>
    setJobSteps((prev) => {
      const nextSteps = prev.map((r) => {
        if (r.rid !== stepRid) return r
        const nextHazards = r.hazards.filter(h => h.rid !== hazardRid)
        return { ...r, hazards: nextHazards }
      })
      const filtered = nextSteps.filter(r => r.hazards.length > 0)
      return filtered.length ? filtered : [blankStep()]
    })

  const clearDrafts = () => {
    setJobSteps((prev) => prev.map((r) => ({
      ...r,
      hazards: r.hazards.map((h) => (h.ai_generated
        ? { ...h, potential_hazards: '', control_measures: '', ai_generated: false, edited_by_user: false }
        : h))
    })))
    setAiRun(null)
    toast.info('AI drafts cleared. Job steps are untouched.')
  }

  const runGeneration = async ({ overwriteEdited }) => {
    if (!filledSteps.length) {
      toast.warn('Enter at least one job step first.')
      return
    }
    setGenerating(true)
    try {
      const steps = jobSteps
        .map((r, i) => ({ row: r, seq_no: i + 1 }))
        .filter(({ row }) => (row.job_step || '').trim())
        .map(({ row, seq_no }) => ({ seq_no, job_step: row.job_step.trim() }))

      const res = await api.generateHazards({
        worksheet_id: worksheetId,
        job_description: page1.job_description,
        plant: page1.plant_name,
        location: page1.location || page1.line_location_name,
        work_permits: permitsTicked.map((k) => WORK_PERMITS.find((p) => p.key === k)?.label || k),
        ppe: ppeTicked.map((k) => PPE_LABEL[k] || k),
        steps,
        regenerate: generatedOnce,
      })

      const bySeq = new Map(res.results.map((r) => [r.seq_no, r]))
      let applied = 0
      let kept = 0

      setJobSteps((prev) => prev.map((row, i) => {
        const hit = bySeq.get(i + 1)
        if (!hit || !hit.hazards) return row
        
        const newHazards = []
        const humanHazards = row.hazards.filter(h => h.edited_by_user || (!h.ai_generated && ((h.potential_hazards || '').trim() || (h.control_measures || '').trim())))
        
        if (!overwriteEdited && humanHazards.length > 0) {
          kept += humanHazards.length
          newHazards.push(...humanHazards)
        }
        
        hit.hazards.forEach(aiHazard => {
          applied += 1
          newHazards.push({
            ...blankHazard(),
            potential_hazards: aiHazard.potential_hazards,
            control_measures: aiHazard.control_measures,
            ai_generated: true,
            edited_by_user: false,
            selected: false,
          })
        })
        
        return {
          ...row,
          hazards: newHazards.length ? newHazards : [blankHazard()]
        }
      }))

      setAiRun({ ...res, count: applied })
      if (res.source === 'fallback') {
        toast.warn(`Drafted ${applied} row(s) from the built-in hazard library.`)
      } else {
        toast.ok(`Drafted ${applied} row(s) with ${res.model}${kept ? `, kept ${kept} row(s) you had written` : ''}.`)
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
      setReplaceEdited(false)
    }
  }

  const save = async ({ advance }) => {
    try {
      const id = await savePage2()
      toast.ok(`Page 2 saved to JSA ${id}.`)
      if (advance) onNext()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const rowsMissing = filledSteps.filter(
    (r) => !r.hazards.some(h => (h.potential_hazards || '').trim() && (h.control_measures || '').trim())
  ).length

  return (
    <fieldset disabled={!isEditable} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <div className="sheet-inner">
        <section className="block">
          <div className="block-head">
            <FaListCheck size={13} />
            <h2>Job steps · Hazards · Control measures</h2>
            <span className="hint">
              {filledSteps.length} step(s) entered
              {hasDrafts && ' · amber marks text still as drafted'}
            </span>
          </div>

          <div className="table-wrap">
            <table className="sheet-table table-roomy">
              <thead>
                <tr>
                  <th className="col-seq">#</th>
                  <th style={{ width: '22%' }}>Job steps in sequential order</th>
                  <th style={{ width: '25%' }}>Potential hazards</th>
                  <th style={{ width: '25%' }}>Control measures</th>
                  <th style={{ width: '9%' }}>Target</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '8%' }}>Responsible</th>
                  <th className="col-act" aria-label="Delete row" />
                </tr>
              </thead>
              <tbody>
                {jobSteps.flatMap((row, i) => row.hazards.map((hazard, hIdx) => {
                  const aiFresh = hazard.ai_generated && !hazard.edited_by_user
                  const aiKept = hazard.ai_generated && hazard.edited_by_user
                  const cellClass = `ai-cell${aiFresh ? ' is-ai' : aiKept ? ' is-kept' : ''}`
                  const opacity = hazard.selected === false ? 0.4 : 1
                  return (
                    <tr key={hazard.rid}>
                      {hIdx === 0 && (
                        <>
                          <td className="col-seq" rowSpan={row.hazards.length}>{i + 1}</td>
                          <td rowSpan={row.hazards.length} style={{ position: 'relative' }}>
                            <textarea rows={3} value={row.job_step}
                                      onChange={(e) => updateStep(row.rid, { job_step: e.target.value })}
                                      placeholder={i === 0 ? 'e.g. Isolate the press and apply LOTO' : ''} />
                            {!!row.job_step.trim() && (
                              <div style={{ position: 'absolute', bottom: 4, left: 4, display: 'flex', gap: 4 }}>
                                <button type="button" className="btn btn-ghost" style={{ padding: '4px' }}
                                        onClick={() => addHazardRow(row.rid)} title="Add Hazard">
                                  <FaPlus size={10} /> Add Hazard
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                      <td className={cellClass} style={{ opacity }}>
                        {hazard.ai_generated && (
                          <div style={{ marginBottom: 4, minHeight: 22, display: 'flex', alignItems: 'center', fontSize: '0.85em', color: 'var(--text-light)' }}>
                            <Tick checked={hazard.selected !== false}
                                  onChange={(e) => updateHazard(row.rid, hazard.rid, { selected: e.target.checked })}
                                  label="Select draft" />
                          </div>
                        )}
                        <textarea rows={3} value={hazard.potential_hazards} disabled={hazard.selected === false}
                                  onChange={(e) => editHazardAiCell(row.rid, hazard, 'potential_hazards', e.target.value)} />
                      </td>
                      <td className={cellClass} style={{ opacity }}>
                        {hazard.ai_generated && <div style={{ marginBottom: 4, minHeight: 22 }} />}
                        <textarea rows={3} value={hazard.control_measures} disabled={hazard.selected === false}
                                  onChange={(e) => editHazardAiCell(row.rid, hazard, 'control_measures', e.target.value)} />
                      </td>
                      <td style={{ opacity }}>
                        {hazard.ai_generated && <div style={{ marginBottom: 4, minHeight: 22 }} />}
                        <input value={hazard.target} disabled={hazard.selected === false}
                               onChange={(e) => updateHazard(row.rid, hazard.rid, { target: e.target.value })} />
                      </td>
                      <td style={{ opacity }}>
                        {hazard.ai_generated && <div style={{ marginBottom: 4, minHeight: 22 }} />}
                        <select value={hazard.step_status || ''} disabled={hazard.selected === false}
                                onChange={(e) => updateHazard(row.rid, hazard.rid, { step_status: e.target.value })}>
                          <option value="" />
                          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ opacity }}>
                        {hazard.ai_generated && <div style={{ marginBottom: 4, minHeight: 22 }} />}
                        <input value={hazard.responsible} disabled={hazard.selected === false}
                               onChange={(e) => updateHazard(row.rid, hazard.rid, { responsible: e.target.value })} />
                      </td>
                      <td className="col-act">
                        {hazard.ai_generated && <div style={{ marginBottom: 4, minHeight: 22 }} />}
                        <button type="button" className="icon-btn" onClick={() => deleteHazardRow(row.rid, hazard.rid)}
                                aria-label={`Delete hazard`} title="Delete this hazard">
                          <FaTrash size={11} />
                        </button>
                      </td>
                    </tr>
                  )
                }))}
              </tbody>
            </table>
          </div>

          <div className="actionbar actionbar-inset">
            <button type="button" className="btn btn-ai"
                    onClick={() => (generatedOnce ? setRegenAsk(true) : runGeneration({ overwriteEdited: false }))}
                    disabled={generating || !filledSteps.length}>
              {generating ? <><FaSpinner className="spin" size={12} /> Drafting…</>
                : generatedOnce ? <><FaRotate size={12} /> Regenerate hazards &amp; measures</>
                : <><FaWandMagicSparkles size={12} /> Generate hazards &amp; measures</>}
            </button>

            <button type="button" className="btn btn-ghost"
                    onClick={() => setJobSteps((prev) => [...prev, blankStep()])}>
              <FaPlus size={11} /> Add row
            </button>

            {generatedOnce && (
              <button type="button" className="btn btn-ghost" onClick={clearDrafts}>
                <FaEraser size={11} /> Clear drafts
              </button>
            )}

            <span className="grow" />

            {aiRun ? (
              <span className={`status-line ${aiRun.source === 'gemini' ? 'good' : 'warn'}`}>
                <FaCircleInfo size={12} />
                {aiRun.source === 'gemini' ? aiRun.model : 'built-in library'} · {aiRun.count} row(s) ·{' '}
                {(aiRun.latency_ms / 1000).toFixed(1)}s
                {editedDrafts ? ` · ${editedDrafts} edited by you` : ''}
              </span>
            ) : (
              <span className="status-line">
                <FaCircleInfo size={12} />
                Drafts are a starting point. Review every row before you submit.
              </span>
            )}
          </div>

          {aiRun?.notice && (
            <div className="notice notice-ai" style={{ margin: 'var(--s-3)' }}>
              <FaTriangleExclamation size={12} />
              <span>{aiRun.notice}</span>
            </div>
          )}
        </section>

        <div className="actionbar actionbar-sticky">
          {rowsMissing > 0 ? (
            <span className="status-line warn">
              <FaTriangleExclamation size={12} />
              {rowsMissing} step(s) have no hazard or control filled — approval will be refused
            </span>
          ) : filledSteps.length > 0 ? (
            <span className="status-line good">
              <FaCircleCheck size={12} /> All {filledSteps.length} step(s) have hazards and controls
            </span>
          ) : (
            <span className="status-line">
              <FaCircleInfo size={12} /> Start by listing the job steps in order
            </span>
          )}
          <span className="grow" />
          <button type="button" className="btn" onClick={onBack}>
            <FaArrowLeft size={12} /> Page 1
          </button>
          <button type="button" className="btn" disabled={busy || !isEditable}
                  onClick={() => save({ advance: false })}>
            {busy ? <FaSpinner className="spin" size={12} /> : <FaFloppyDisk size={12} />} Save draft
          </button>
          <button type="button" className="btn btn-primary"
                  disabled={busy || !filledSteps.length || !isEditable}
                  onClick={() => save({ advance: true })}>
            Save &amp; continue <FaArrowRight size={12} />
          </button>
        </div>
      </div>

      {regenAsk && (
        <Modal title="Regenerate the drafts?" onClose={() => setRegenAsk(false)} footer={
          <>
            <button className="btn" onClick={() => setRegenAsk(false)}>Cancel</button>
            <button className="btn btn-ai" onClick={() => {
              setRegenAsk(false)
              runGeneration({ overwriteEdited: replaceEdited })
            }}>
              <FaRotate size={12} /> Regenerate
            </button>
          </>
        }>
          <p>
            This re-reads your job steps and drafts fresh hazards and control measures.
            Rows you have written or edited yourself are kept as they are.
          </p>
          {editedDrafts > 0 && (
            <Tick label={`Also replace the ${editedDrafts} row(s) I edited`}
                  checked={replaceEdited} onChange={() => setReplaceEdited((v) => !v)} />
          )}
        </Modal>
      )}
    </fieldset>
  )
}
