import { useEffect, useMemo, useState } from 'react'
import {
  FaArrowRight, FaCircleCheck, FaClipboardList, FaFloppyDisk, FaHelmetSafety,
  FaShieldHalved, FaSpinner, FaToolbox, FaTriangleExclamation,
} from 'react-icons/fa6'
import { Field, Row, TextField } from '../components/Field.jsx'
import PermitStrip from '../components/PermitStrip.jsx'
import PpeStrip from '../components/PpeStrip.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { useJsa } from '../context/JsaContext.jsx'
import { WORK_PERMITS } from '../data/permits.js'

export default function Page1({ onNext }) {
  const {
    page1, setField, togglePermit, togglePpe, permitsTicked, ppeTicked,
    savePage1, savingPage, isEditable,
  } = useJsa()
  const { user } = useAuth()
  const toast = useToast()
  const [companies, setCompanies] = useState([])

  // Company and plant are dropdowns fed by the org tables. The backend only
  // returns what this user is entitled to, so an initiator sees one of each.
  useEffect(() => {
    api.companies()
      .then((rows) => {
        setCompanies(rows)
        if (!page1.company_id && rows.length) {
          const mine = rows.find((c) => c.id === user.company_id) || rows[0]
          setField('company_id', mine.id)
          const plant = mine.plants.find((p) => p.id === user.plant_id) || mine.plants[0]
          if (plant) setField('plant_id', plant.id)
        }
      })
      .catch((e) => toast.error(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const plants = useMemo(() => {
    const c = companies.find((x) => String(x.id) === String(page1.company_id))
    return c ? c.plants.filter((p) => p.is_active || String(p.id) === String(page1.plant_id)) : []
  }, [companies, page1.company_id, page1.plant_id])

  const busy = savingPage === 1
  const isOnlyExempt = permitsTicked.length > 0 && permitsTicked.every(p => p === 'sunday_holiday' || p === 'general_work')

  const save = async ({ advance }) => {
    try {
      const id = await savePage1()
      toast.ok(`Page 1 saved to JSA ${id}.`)
      if (advance) onNext()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <fieldset disabled={!isEditable} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <div className="sheet-inner">
        <section className="block">
          <div className="block-head">
            <FaClipboardList size={13} aria-hidden="true" />
            <h2>General details</h2>
            <span className="hint">Everything that identifies this worksheet</span>
          </div>
          <Row>
            <Field label="Company Name">
              <select
                value={page1.company_id || ''}
                onChange={(e) => { setField('company_id', e.target.value); setField('plant_id', '') }}
              >
                <option value="">Select company</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Plant">
              <select
                value={page1.plant_id || ''}
                onChange={(e) => setField('plant_id', e.target.value)}
                disabled={!page1.company_id}
              >
                <option value="">{page1.company_id ? 'Select plant' : 'Pick a company first'}</option>
                {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="JSA Prepared Date">
              <TextField type="date" value={page1.jsa_prepared_date}
                         onChange={(v) => setField('jsa_prepared_date', v)} />
            </Field>
          </Row>

          <Row>
            <Field label="Line or Location Name">
              <TextField value={page1.line_location_name}
                         onChange={(v) => setField('line_location_name', v)} />
            </Field>
            <Field label="Dept. Head / Incharge">
              <TextField value={page1.department_head_name}
                         onChange={(v) => setField('department_head_name', v)} />
            </Field>
            <Field label="Permit No.">
              <TextField value={page1.permit_no} onChange={(v) => setField('permit_no', v)} />
            </Field>
          </Row>

          <Row>
            <Field label="Location">
              <TextField value={page1.location} onChange={(v) => setField('location', v)} />
            </Field>
            <Field label="Contractor">
              <TextField value={page1.contractor} onChange={(v) => setField('contractor', v)} />
            </Field>
            <Field label="JSA No.">
              <TextField value={page1.jsa_no} onChange={(v) => setField('jsa_no', v)}
                         placeholder="auto on first save" />
            </Field>
          </Row>

          <Row cols={1}>
            <Field label="Job description">
              <TextField value={page1.job_description}
                         onChange={(v) => setField('job_description', v)}
                         placeholder="What work is being carried out, and where" />
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head">
            <FaToolbox size={13} />
            <h2>Tools &amp; Equipment</h2>
            <span className="hint">Guideline for tools inspection and checklist for the inspection</span>
          </div>
          <Row cols={1}>
            <Field label="Tools used">
              <TextField value={page1.tools_equipment}
                         onChange={(v) => setField('tools_equipment', v)}
                         placeholder="List the tools and equipment for this job" />
            </Field>
          </Row>
          <Row cols={1}>
            <Field label="Inspection guideline">
              <TextField value={page1.tools_inspection_guideline}
                         onChange={(v) => setField('tools_inspection_guideline', v)}
                         placeholder="Checklist reference followed for tool inspection" />
            </Field>
          </Row>
          <Row cols={2}>
            <Field label="Contractor" group>
              <div className="radio-row" role="radiogroup" aria-label="Contractor type">
                {['Internal', 'External'].map((opt) => (
                  <label key={opt}>
                    <input type="radio" name="contractor_type"
                           checked={page1.contractor_type === opt}
                           onChange={() => setField('contractor_type', opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Inspection frequency">
              <select value={page1.inspection_frequency || ''}
                      onChange={(e) => setField('inspection_frequency', e.target.value)}>
                <option value="">Select frequency</option>
                <option>Before every use</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Half-yearly</option>
                <option>Annually</option>
              </select>
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head">
            <FaShieldHalved size={13} />
            <h2>Work Permit</h2>
            <span className="hint">
              {permitsTicked.length
                ? `${permitsTicked.length} of ${WORK_PERMITS.length} ticked`
                : 'Tick every permit this job needs'}
            </span>
          </div>
          <PermitStrip selected={page1.work_permits} onToggle={togglePermit} />
        </section>

        <fieldset disabled={isOnlyExempt} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <section className="block" style={{ opacity: isOnlyExempt ? 0.5 : 1 }}>
            <div className="block-head">
              <FaHelmetSafety size={13} />
              <h2>Tick required PPE / safety equipment</h2>
              <span className="hint">
                {isOnlyExempt ? 'Not required for this work type' : ppeTicked.length ? `${ppeTicked.length} item(s) ticked` : 'Nothing ticked yet'}
              </span>
            </div>
            <PpeStrip selected={page1.ppe} otherText={page1.ppe_other_text}
                      onToggle={togglePpe} onOtherText={(v) => setField('ppe_other_text', v)} />
            <Row cols={1} sep>
              <Field label="Are the PPE's in good condition">
                <TextField value={page1.ppe_good_condition}
                           onChange={(v) => setField('ppe_good_condition', v)}
                           placeholder="Who verified the condition, and what was found" />
              </Field>
            </Row>
          </section>
        </fieldset>

        <div className="actionbar actionbar-sticky">
          {permitsTicked.length === 0 || (!isOnlyExempt && ppeTicked.length === 0) ? (
            <span className="status-line warn">
              <FaTriangleExclamation size={12} />
              {permitsTicked.length === 0 && ppeTicked.length === 0
                ? 'No work permit or PPE ticked yet'
                : permitsTicked.length === 0 ? 'No work permit ticked yet' : 'No PPE ticked yet'}
            </span>
          ) : (
            <span className="status-line good">
              <FaCircleCheck size={12} />
              {permitsTicked.length} permit(s) {!isOnlyExempt ? `, ${ppeTicked.length} PPE item(s)` : ''}
            </span>
          )}
          <span className="grow" />
          <button type="button" className="btn" disabled={busy || !isEditable}
                  onClick={() => save({ advance: false })}>
            {busy ? <FaSpinner className="spin" size={12} /> : <FaFloppyDisk size={12} />} Save draft
          </button>
          <button type="button" className="btn btn-primary" disabled={busy || !isEditable}
                  onClick={() => save({ advance: true })}>
            Save &amp; continue <FaArrowRight size={12} />
          </button>
        </div>
      </div>
    </fieldset>
  )
}
