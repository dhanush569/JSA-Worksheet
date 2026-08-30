import { useState, useEffect, useMemo } from 'react'
import {
  FaArrowLeft, FaArrowRight, FaCircleCheck, FaFloppyDisk, FaSpinner,
  FaFileContract, FaTriangleExclamation, FaShieldHalved, FaRoute, FaEnvelope, FaFilePdf
} from 'react-icons/fa6'
import { Field, Row, TextField } from '../components/Field.jsx'
import PermitStrip from '../components/PermitStrip.jsx'
import CameraCapture from '../components/CameraCapture.jsx'
import { RiskPill } from '../components/Pills.jsx'
import Modal from '../components/Modal.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'
import { useJsa } from '../context/JsaContext.jsx'

const CHECKLIST_SECTIONS = [
  {
    title: 'Common Checks to be done for all work and General Work',
    questions: [
      'Has the worker been trained for this task?',
      'Are all tools and equipment inspected for (ELCB, or industrial socket and double insulated tools) and safe to use as per equipment-specific checklist(e.g. tool inspection checklist)?',
      'Is Housekeeping done and are the pits/sumps/trenches nearby covered properly to avoid slip/trip/fall hazards??',
      'Are existing control measures as mentioned in JSA adequate to conducting work in a safe manner?',
      'Sufficient Lighting and ventilation provided?',
      'Is the necessary barricade and warning signage in place (e.g. Caution boards, Appropriate barrication tape)?',
      'Are emergency exits accessible? Are emergency protocols communicated to all?',
      'Is all PPEs used appropriate for the work as specified in the JSA / Permit to work and inspected?'
    ]
  },
  {
    title: 'Hot work',
    questions: [
      'Are combustible or flammable materials identified and removed within a 10-meter radius?',
      'Is fire protection provided for combustible materials, flammables, and cylinders that cannot be removed?',
      'Are gas cylinders, hoses, and nozzles in good condition, equipped with safety measures including pressure gauges and flashback arrestors on both sides of the nozzle, and appropriately guarded where necessary?',
      'Is appropriate fire fighting equipment available(Fire Extinguishers/Fire Blankets/Fire Buckets/Fire Hydrants/Fire Alarms and Detectors/ Sprinkler Systems)?',
      'Are the smoke detectors protected to avoid False alarms?',
      'Is a dedicated fire watcher in place and trained?'
    ]
  },
  {
    title: 'Electrical work',
    questions: [
      'Is the FRP ladder used wherever required? Is a proper working platform ensured (wherever required)?',
      'Is an HV and LV detector used to ensure a zero energy state?',
      'Has the consumer/company side HT AB switch been switched off, earthed, and Lockout/Tagout (LOTO) procedures applied before commencing work on subsequent HT side equipment?',
      'Have Lockout/Tagout (LOTO) procedures been implemented to ensure equipment and capacitors are free of residual energy, specifically using appropriate discharge rods or earthing trolleys?',
      'Are Rubber Mats provided as per IS 15652? Are they in good condition?'
    ]
  },
  {
    title: 'Height work',
    questions: [
      'Are all the members required to work at height medically fit, trained, assessed and certified?',
      'Is proper fixed support/structure available/lifeline provided for anchoring the safety belt and safety measures provided for work above 1.8 meters?',
      'Are tools/materials secured with a rope, carried in a Toolbag tied to a rope, or attached to the person with a tool belt?',
      'Ensure scaffolding or aerial work platforms (boom/scissor lifts) are securely positioned, with stable bases, safe access, adequate platforms, proper guardrails, toe guards, functioning wheel locks (for mobile scaffolds), in good condition, and green tagged for safe use.',
      'Check if the ladder is in good condition, green tagged ("Safe for Use"), secured at the top, extends(Approx 1m), and ensures 3-point contact while climbing.',
      'Boom/scissor lift – Emergency control, load details & trained operator?'
    ]
  },
  {
    title: 'Unloading tanker containing flammable liquid/gas to storage tank',
    questions: [
      'Are all valid and relevant documents like Driver and vehicle documents verified and checked?',
      'Is the Spark Arrestor fixed to the exhaust pipe of the tanker?',
      'Is earthing and bonding done to the tanker to avoid static energy discharge?',
      'Is Secondary Containment provided at the Tanker & pump connection point to collect leakages (if any) and thus avoid land contamination?',
      'Have the lids and vents of the tanker been kept open, and have all required valves been opened or closed as per the line diagram for the unloading operation?',
      'Is static discharge done by the person holding the discharge rod provided?',
      'Is a Spill Kit kept readily available to absorb the spillages if any?'
    ]
  },
  {
    title: 'Excavation work',
    questions: [
      'Are all valid and relevant documents like License, and Earthmover documents verified and checked?',
      'Is nearby Structures and buildings verified and considered safe to work',
      'Are relevant excavation protection methods used to avoid cave-ins and slide-overs to protect the employees and machinery?',
      'Is heavy vehicles and the excavation work done at a safe distance of 3m from the area to avoid collapse?',
      'Have underground utilities and electrical supplies been isolated and covered according to drawings, and have obstacles like overhead power lines been checked to ensure unrestricted vehicle access?',
      'Is a Signalman available and trained to provide a signal?'
    ]
  },
  {
    title: 'Lifting/Shifting heavy equipment/machinery/material',
    questions: [
      'Are the lifting tools & tackles used found in good condition (no defects observed)?',
      'Are all valid and relevant documents like Driver and vehicle documents verified and checked?',
      'Is a signalman deployed to guide the crane operator and riggers while equipment is being shifted/moved through the crane?',
      'Ensure there are no obstacles on the route and that the overhead power lines/road/floor/surface are safe for moving with lifting equipment.',
      'Ensure the lift area is clear of machinery, piping, or live electrical lines, if not clear protection has been given.',
      'Are the lifting plans attached?'
    ]
  },
  {
    title: 'Confined work',
    questions: [
      'Is the atmosphere in the confined space tested for hazardous or flammable gasses using a multi-gas analyser, ensuring that the Lower Explosive Limit (LEL) is within 0-10%?',
      'Is appropriate oxygen concentration available in the confined area (19.5 to 22.5%)',
      'Confined space purged with air using a blower for a minimum of 2 hours?',
      'Is the signalling and communicating method known by both entrant and attendant?',
      'Is a SCBA required for entry, and is it readily available for use?'
    ]
  }
]

const SECTION_KEY_MAP = {
  'Common Checks to be done for all work and General Work': 'always',
  'Hot work': 'hot_work',
  'Electrical work': 'electrical_work',
  'Height work': 'height_work',
  'Unloading tanker containing flammable liquid/gas to storage tank': 'tanker_unloading',
  'Excavation work': 'excavation_work',
  'Lifting/Shifting heavy equipment/machinery/material': 'lifting_shifting',
  'Confined work': 'confined_space'
}

export default function Page4({ onBack, onNext }) {
  const { page1, page4, setPtwField, isEditable, savePage4, savingPage } = useJsa()
  const toast = useToast()
  
  const busy = savingPage === 4

  const [pools, setPools] = useState({ lvl1_approver: [], lvl2_approver: [], ph_approver: [] })
  const [emailPreview, setEmailPreview] = useState(false)

  useEffect(() => {
    if (!page1.plant_id) return
    const roles = ['lvl1_approver', 'lvl2_approver', 'ph_approver']
    Promise.all(roles.map((r) => api.approvers(r, page1.plant_id).catch(() => [])))
      .then(([a, b, c]) => setPools({ lvl1_approver: a, lvl2_approver: b, ph_approver: c }))
      .catch((e) => toast.error(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page1.plant_id])

  const chosen = useMemo(() => ({
    lvl1: pools.lvl1_approver.find((p) => String(p.id) === String(page4.approvers?.lvl1)),
    lvl2: pools.lvl2_approver.find((p) => String(p.id) === String(page4.approvers?.lvl2)),
    ph: pools.ph_approver.find((p) => String(p.id) === String(page4.approvers?.ph)),
  }), [pools, page4.approvers])

  const highRisk = page4.risk_level === 'High_Risk'

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const time = new Date().toTimeString().slice(0, 5)
    
    if (!page4.date) setPtwField('date', today)
    if (!page4.start_time) setPtwField('start_time', time)
    
    if (!page4.verification_hse?.date || !page4.verification_hse?.time) {
      setPtwField('verification_hse', {
        ...page4.verification_hse,
        date: page4.verification_hse?.date || today,
        time: page4.verification_hse?.time || time
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setChecklistAnswer = (sectionIdx, questionIdx, answer) => {
    const key = `${sectionIdx}-${questionIdx}`
    setPtwField('checklist', { ...(page4.checklist || {}), [key]: answer })
  }

  const save = async ({ advance }) => {
    try {
      if (savePage4) {
        await savePage4()
        toast.ok('Permit to Work saved.')
      }
      if (advance) onNext()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const tickedTypes = Object.entries(page1.work_permits || {}).filter(([, v]) => v).length

  return (
    <fieldset disabled={!isEditable} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <div className="sheet-inner">
        <section className="block">
          <div className="block-head">
            <FaFileContract size={13} aria-hidden="true" />
            <h2>Permit to Work</h2>
            <span className="hint">Independent PTW details based on FR-HSE-07</span>
          </div>

          <Row>
            <Field label="Permit Initiator Name & Dept">
              <TextField value={page4.permit_initiator || ''} onChange={(v) => setPtwField('permit_initiator', v)} />
            </Field>
            <Field label="Permit Issued To (Contractor)">
              <TextField value={page1.contractor || ''} onChange={() => {}} readOnly />
            </Field>
          </Row>
          <Row>
            <Field label="Location">
              <TextField value={page1.location || ''} onChange={() => {}} readOnly />
            </Field>
            <Field label="Permit Number">
              <TextField value={page1.permit_no || ''} onChange={() => {}} readOnly />
            </Field>
            <Field label="Number of persons involved">
              <TextField value={page4.persons_involved_count || ''} onChange={(v) => setPtwField('persons_involved_count', v)} />
            </Field>
          </Row>
          <Row cols={1}>
            <Field label="Work description">
              <TextField value={page1.job_description || ''} onChange={() => {}} readOnly />
            </Field>
          </Row>
          <Row>
            <Field label="Date">
              <TextField type="date" value={page4.date || ''} onChange={(v) => setPtwField('date', v)} />
            </Field>
            <Field label="Start time">
              <TextField type="time" value={page4.start_time || ''} onChange={(v) => setPtwField('start_time', v)} />
            </Field>
            <Field label="End time">
              <TextField type="time" value={page4.end_time || ''} onChange={(v) => setPtwField('end_time', v)} />
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head">
            <FaShieldHalved size={13} />
            <h2>Type of work (from General tab)</h2>
            <span className="hint">
              {tickedTypes ? `${tickedTypes} type(s) selected` : 'None selected'}
            </span>
          </div>
          <div style={{ pointerEvents: 'none' }}>
            <PermitStrip selected={page1.work_permits || {}} onToggle={() => {}} />
          </div>
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Supporting Documents</h2>
          </div>
          <Row>
            <Field label="LOTO number">
              <TextField value={page4.loto_number || ''} onChange={(v) => setPtwField('loto_number', v)} />
              <label style={{ fontSize: '0.8em', display: 'block', marginTop: 4 }}>
                <input type="checkbox" checked={page4.loto_checked || false} onChange={e => setPtwField('loto_checked', e.target.checked)} /> Checked in LOTO register
              </label>
            </Field>
            <Field label="JSA number">
              <TextField value={page4.jsa_number || ''} onChange={(v) => setPtwField('jsa_number', v)} />
              <label style={{ fontSize: '0.8em', display: 'block', marginTop: 4 }}>
                <input type="checkbox" checked={page4.jsa_checked || false} onChange={e => setPtwField('jsa_checked', e.target.checked)} /> JSA findings attached
              </label>
            </Field>
            <Field label="TBT number">
              <TextField value={page4.tbt_number || ''} onChange={(v) => setPtwField('tbt_number', v)} />
              <label style={{ fontSize: '0.8em', display: 'block', marginTop: 4 }}>
                <input type="checkbox" checked={page4.tbt_checked || false} onChange={e => setPtwField('tbt_checked', e.target.checked)} /> Tool Box Talk done
              </label>
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Safety Checklist</h2>
          </div>
          <div style={{ padding: '0 var(--s-3)', fontSize: '0.9em' }}>
            {CHECKLIST_SECTIONS.map((section, sIdx) => {
              const reqKey = SECTION_KEY_MAP[section.title]
              const isRequired = reqKey === 'always' || !!page1.work_permits?.[reqKey]

              if (!isRequired) return null

              return (
                <div key={sIdx} style={{ marginBottom: '24px' }}>
                  <h4 style={{ background: '#e2e8f0', padding: '6px 12px', borderRadius: '4px' }}>
                    {section.title}
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th>Check</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Yes</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>No</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>NA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.questions.map((q, qIdx) => {
                      const key = `${sIdx}-${qIdx}`
                      const ans = (page4.checklist || {})[key]
                      return (
                        <tr key={qIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 4px' }}>{qIdx + 1}. {q}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input type="radio" checked={ans === 'Yes'} onChange={() => setChecklistAnswer(sIdx, qIdx, 'Yes')} />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input type="radio" checked={ans === 'No'} onChange={() => setChecklistAnswer(sIdx, qIdx, 'No')} />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input type="radio" checked={ans === 'NA'} onChange={() => setChecklistAnswer(sIdx, qIdx, 'NA')} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
          </div>
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Additional Details</h2>
          </div>
          <Row cols={1}>
            <Field label="Name of the persons involved">
              <TextField value={page4.persons_involved_names || ''} onChange={(v) => setPtwField('persons_involved_names', v)} />
            </Field>
          </Row>
          <Row cols={1}>
            <Field label="Additional comments if any (Specify)">
              <TextField value={page4.additional_comments || ''} onChange={(v) => setPtwField('additional_comments', v)} />
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head" style={{ background: '#dcfce7', padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>
            <h2 style={{ textAlign: 'center', width: '100%', color: '#166534' }}>Permit Issuance</h2>
          </div>
          <div style={{ padding: '12px 16px', fontSize: '0.9em', borderBottom: '1px solid #e2e8f0' }}>
            We have inspected the mentioned location and confirmed that all necessary precautions have been taken and verified to ensure that recommended safety measures are in place as per the JSA and PTW checklists. The location is safe for work, which will be conducted under the supervision of the permit initiator and the contractor.
          </div>
          <Row>
            <Field label="Name & Signature of Permit initiator/work in charge">
              <TextField value={page4.permit_issuance?.initiator || ''} onChange={(v) => setPtwField('permit_issuance', { ...page4.permit_issuance, initiator: v })} />
            </Field>
            <Field label="Name & Signature of Contractor">
              <TextField value={page4.permit_issuance?.contractor || ''} onChange={(v) => setPtwField('permit_issuance', { ...page4.permit_issuance, contractor: v })} />
            </Field>
            <Field label="Name & Signature of Permit Authoriser / Plant Head">
              <TextField value={page4.permit_issuance?.authoriser || ''} onChange={(v) => setPtwField('permit_issuance', { ...page4.permit_issuance, authoriser: v })} />
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head" style={{ background: '#f1f5f9', padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>
            <h2 style={{ textAlign: 'center', width: '100%', color: '#334155' }}>Verification by HSE Personnel</h2>
          </div>
          <div style={{ padding: '12px 16px', fontSize: '0.9em', borderBottom: '1px solid #e2e8f0' }}>
            I have checked and verified all the safety precautions and found that the workplace is safe to work the necessary precautions and control measures are in working conditions and the work shall commence. The permit may be withdrawn if any deviations from Safety is noticed.
          </div>
          <Row>
            <Field label="Date">
              <TextField type="date" value={page4.verification_hse?.date || ''} onChange={(v) => setPtwField('verification_hse', { ...page4.verification_hse, date: v })} />
            </Field>
            <Field label="Time">
              <TextField type="time" value={page4.verification_hse?.time || ''} onChange={(v) => setPtwField('verification_hse', { ...page4.verification_hse, time: v })} />
            </Field>
            <Field label="Name of the HSE personnel (Signature)">
              <TextField value={page4.verification_hse?.hse_name || ''} onChange={(v) => setPtwField('verification_hse', { ...page4.verification_hse, hse_name: v })} />
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head" style={{ background: '#ffedd5', padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>
            <h2 style={{ textAlign: 'center', width: '100%', color: '#9a3412' }}>Permit Extension (from 6 PM to 10 PM) / Cancelation</h2>
          </div>
          <div style={{ padding: '12px 16px', fontSize: '0.9em', borderBottom: '1px solid #e2e8f0' }}>
            This permit to work has been Canceled for the reason stated below and all the signatories of this permit have been informed / Extended and the relevant authority has been informed.
          </div>
          <Row>
            <Field label="Reason">
              <TextField value={page4.permit_extension?.reason || ''} onChange={(v) => setPtwField('permit_extension', { ...page4.permit_extension, reason: v })} />
            </Field>
            <Field label="Time extended to">
              <TextField type="time" value={page4.permit_extension?.time_extended_to || ''} onChange={(v) => setPtwField('permit_extension', { ...page4.permit_extension, time_extended_to: v })} />
            </Field>
          </Row>
          <Row>
            <Field label="Permit Authoriser">
              <TextField value={page4.permit_extension?.authoriser || ''} onChange={(v) => setPtwField('permit_extension', { ...page4.permit_extension, authoriser: v })} />
            </Field>
            <Field label="Name & sign of the HR In-charge (if required)">
              <TextField value={page4.permit_extension?.hr_incharge || ''} onChange={(v) => setPtwField('permit_extension', { ...page4.permit_extension, hr_incharge: v })} />
            </Field>
            <Field label="HSE personnel">
              <TextField value={page4.permit_extension?.hse_personnel || ''} onChange={(v) => setPtwField('permit_extension', { ...page4.permit_extension, hse_personnel: v })} />
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head" style={{ background: '#dcfce7', padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>
            <h2 style={{ textAlign: 'center', width: '100%', color: '#166534' }}>Permit Closure</h2>
          </div>
          <div style={{ padding: '12px 16px', fontSize: '0.9em', borderBottom: '1px solid #e2e8f0' }}>
            The work has been completed as per the permit requirements. The area has been inspected, verified to be risk-free, and cleaned. All equipment has been removed, connections re-established, and the area is ready for normal operations. The work permit can now be closed.
          </div>
          <Row>
            <Field label="Permit initiator">
              <TextField value={page4.permit_closure?.initiator || ''} onChange={(v) => setPtwField('permit_closure', { ...page4.permit_closure, initiator: v })} />
            </Field>
            <Field label="Contractor">
              <TextField value={page4.permit_closure?.contractor || ''} onChange={(v) => setPtwField('permit_closure', { ...page4.permit_closure, contractor: v })} />
            </Field>
          </Row>
          <Row>
            <Field label="HSE personnel">
              <TextField value={page4.permit_closure?.hse_personnel || ''} onChange={(v) => setPtwField('permit_closure', { ...page4.permit_closure, hse_personnel: v })} />
            </Field>
            <Field label="Permit Authoriser / Plant Head">
              <TextField value={page4.permit_closure?.authoriser || ''} onChange={(v) => setPtwField('permit_closure', { ...page4.permit_closure, authoriser: v })} />
            </Field>
          </Row>
          <Row cols={1}>
            <Field label="Upload photo of cleaned area">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="file" accept="image/*" capture="environment" 
                       style={{ display: 'none' }} id="photo-upload"
                       onChange={(e) => {
                         const file = e.target.files[0]
                         if (file) {
                           setPtwField('permit_closure', { ...page4.permit_closure, photo: file.name })
                           toast.ok(`Photo attached: ${file.name}`)
                         }
                       }} />
                <label htmlFor="photo-upload" className="btn">
                  Choose File
                </label>
                <span>or</span>
                <CameraCapture onCapture={(file) => {
                  setPtwField('permit_closure', { ...page4.permit_closure, photo: file.name })
                  toast.ok(`Photo taken and attached: ${file.name}`)
                }} />
              </div>
              {page4.permit_closure?.photo && <div className="hint" style={{ marginTop: '8px' }}>Attached: {page4.permit_closure.photo}</div>}
            </Field>
          </Row>
        </section>

        <section className="block">
          <div className="block-head">
            <FaRoute size={13} />
            <h2>Approval route</h2>
            <span className="hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <RiskPill risk={page4.risk_level || 'Normal'} />
            </span>
          </div>

          <div className="form-grid" style={{ padding: 'var(--s-3)' }}>
            <div className="field-block" style={{ margin: 0 }}>
              <label>Level of approval</label>
              <select value={page4.risk_level || 'Normal'} onChange={(e) => setPtwField('risk_level', e.target.value)}>
                <option value="Normal">Normal</option>
                <option value="High_Risk">High risk</option>
              </select>
              <div className="field-hint">
                {highRisk
                  ? 'Plant Head'
                  : 'Level 1 → Level 2 → Location admin'}
              </div>
            </div>

            {!highRisk && (
              <ApproverPick label="Level 1 approver" pool={pools.lvl1_approver}
                            value={page4.approvers?.lvl1} person={chosen.lvl1}
                            onChange={(v) => setPtwField('approvers', { ...page4.approvers, lvl1: v })} />
            )}

            {!highRisk && (
              <ApproverPick label="Level 2 approver" pool={pools.lvl2_approver}
                            value={page4.approvers?.lvl2} person={chosen.lvl2}
                            onChange={(v) => setPtwField('approvers', { ...page4.approvers, lvl2: v })} />
            )}

            {highRisk && (
              <ApproverPick label="Plant Head approver" pool={pools.ph_approver}
                            value={page4.approvers?.ph} person={chosen.ph}
                            onChange={(v) => setPtwField('approvers', { ...page4.approvers, ph: v })} />
            )}

            {!highRisk && (
              <div className="field-block" style={{ margin: 0 }}>
                <label>Final approval</label>
                <input value="Any location admin of this plant" disabled />
                <div className="field-hint">
                  Assigned to the plant, not a person, so leave does not stall the job.
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="actionbar actionbar-sticky">
          <span className="grow" />
          {onBack && (
            <button type="button" className="btn" onClick={onBack}>
              <FaArrowLeft size={12} /> Previous Page
            </button>
          )}
          <button type="button" className="btn" disabled={busy || !isEditable}
                  onClick={() => save({ advance: false })}>
            {busy ? <FaSpinner className="spin" size={12} /> : <FaFloppyDisk size={12} />} Save draft
          </button>
          {highRisk && (
            <button type="button" className="btn" disabled={!isEditable}
                    onClick={() => setEmailPreview(true)}>
              <FaEnvelope size={12} /> Preview Plant Head Email
            </button>
          )}
          {onNext && (
            <button type="button" className="btn btn-primary" disabled={busy || !isEditable}
                    onClick={() => save({ advance: true })}>
              Save &amp; continue <FaArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {emailPreview && (
        <Modal title="Plant Head Email Preview" onClose={() => setEmailPreview(false)} footer={
          <button className="btn" onClick={() => setEmailPreview(false)}>Close Preview</button>
        }>
          <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', fontFamily: 'sans-serif' }}>
            <p><strong>To:</strong> {chosen.ph?.email_id || 'Plant Head'}</p>
            <p><strong>Subject:</strong> Approval Required: High Risk PTW {page4.permit_number || page1.permit_no || 'Draft'}</p>
            <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
            
            <p>Please review the following High Risk Permit to Work (PTW) for approval.</p>
            
            <h3 style={{ marginTop: '20px', marginBottom: '8px' }}>PTW Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
              <tbody>
                <tr><td style={{ padding: '4px 0', width: '30%', fontWeight: 'bold' }}>PTW No:</td><td>{page4.permit_number || page1.permit_no || 'Draft'}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>JSA No:</td><td>{page4.jsa_number || page1.jsa_no || 'Draft'}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Date:</td><td>{page4.date || new Date().toISOString().slice(0, 10)}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Location:</td><td>{page4.location || page1.location}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Work Description:</td><td>{page4.work_description || page1.job_description}</td></tr>
                <tr><td style={{ padding: '4px 0', fontWeight: 'bold' }}>Contractor:</td><td>{page4.permit_issuance?.contractor || page1.contractor}</td></tr>
              </tbody>
            </table>

            <h3 style={{ marginTop: '20px', marginBottom: '8px' }}>Attachments</h3>
            <a href="/ptw_template.html" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                <FaFilePdf size={24} color="#ef4444" />
                <div>
                  <div style={{ fontWeight: 'bold' }}>PTW_{page4.permit_number || page1.permit_no || 'Draft'}.pdf</div>
                  <div style={{ fontSize: '0.8em', color: '#64748b' }}>Complete Permit to Work Sheet</div>
                </div>
              </div>
            </a>

            <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
              <button style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Accept</button>
              <button style={{ padding: '10px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Hold</button>
              <button style={{ padding: '10px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Decline</button>
            </div>
            
            <p style={{ marginTop: '20px', fontSize: '0.8em', color: '#64748b' }}>
              * You can also view the full PTW details by clicking the link in your portal.
            </p>
          </div>
        </Modal>
      )}

    </fieldset>
  )
}

/* ------------------------------------------------------------------ helpers */
function ApproverPick({ label, pool, value, person, onChange }) {
  return (
    <div className="field-block" style={{ margin: 0 }}>
      <label>{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{pool.length ? 'Select a person' : 'Nobody with this role at your plant'}</option>
        {pool.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.designation ? ` — ${p.designation}` : ''}
          </option>
        ))}
      </select>
      <div className="field-hint">
        {person ? person.email_id : 'Their email is taken from the users table.'}
      </div>
    </div>
  )
}
