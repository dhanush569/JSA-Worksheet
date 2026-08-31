import { useJsa } from '../context/JsaContext.jsx'
import { WORK_PERMITS } from '../data/permits.js'

const CHECKLIST_SECTIONS = [
  {
    title: 'Common & General Work',
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
      'Boom/scissor lift Emergency control, load details & trained operator?'
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
    ]
  }
]

export default function PtwPdfPreview() {
  const { page1 = {}, page4 = {} } = useJsa() || {}

  // Format date/time helpers
  const todayDate = new Date().toISOString().slice(0, 10)
  
  // Get active work permits
  const activePermits = WORK_PERMITS.filter(wp => page1.work_permits && page1.work_permits[wp.key])

  // Get active checklists
  const getActiveChecklists = () => {
    if (!page4.checklist) return []
    let active = []
    CHECKLIST_SECTIONS.forEach((section, sIndex) => {
      let activeQs = []
      section.questions.forEach((q, qIndex) => {
        // use - hyphen for correct key match
        if (page4.checklist[`${sIndex}-${qIndex}`] === 'Yes') {
          activeQs.push(q)
        }
      })
      if (activeQs.length > 0) {
        active.push({ title: section.title, questions: activeQs })
      }
    })
    return active
  }

  const activeChecklists = getActiveChecklists()

  // Colors based on website tokens
  const brandNavy = '#0c213d'
  const brandBlue = '#1b66d3'
  const bgLight = '#f4f6f9'
  const borderColor = '#cdd6e2'
  const textColor = '#141b26'

  return (
    <div style={{ backgroundColor: '#fff', color: textColor, padding: '20px', fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', fontSize: '11px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.4' }}>
        <h1 style={{ textAlign: 'center', fontSize: '18px', margin: '0 0 5px 0', textTransform: 'uppercase', color: brandNavy }}>PERMIT TO WORK (PTW)</h1>
        <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '15px', fontWeight: 'bold', color: '#5f6d80' }}>Document Ref: FR-HSE-07 | Rev: 00</div>

        {/* 1. GENERAL DETAILS */}
        <div style={{ backgroundColor: brandNavy, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${brandNavy}`, marginTop: '8px', fontSize: '12px' }}>1. GENERAL DETAILS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <tbody>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', width: '20%', backgroundColor: bgLight, color: brandNavy }}>Permit Number</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', width: '30%' }}>{page1.permit_no || 'Draft'}</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', width: '20%', backgroundColor: bgLight, color: brandNavy }}>JSA Number</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', width: '30%' }}>{page4.jsa_number || page1.jsa_no || 'Draft'}</td>
            </tr>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', backgroundColor: bgLight, color: brandNavy }}>Date</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page4.date || todayDate}</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', backgroundColor: bgLight, color: brandNavy }}>Time (Start / End)</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page4.start_time || '00:00'} to {page4.end_time || '00:00'}</td>
            </tr>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', backgroundColor: bgLight, color: brandNavy }}>Location</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page1.location || 'Not specified'}</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', backgroundColor: bgLight, color: brandNavy }}>Persons Involved</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page4.persons_involved_count || '0'}</td>
            </tr>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', backgroundColor: bgLight, color: brandNavy }}>Contractor</td>
                <td colSpan={3} style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page1.contractor || 'Not specified'}</td>
            </tr>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', backgroundColor: bgLight, color: brandNavy }}>Work Description</td>
                <td colSpan={3} style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page1.job_description || 'Not specified'}</td>
            </tr>
            </tbody>
        </table>

        {/* 2. TYPE OF WORK & SUPPORTING DOCS */}
        <div style={{ backgroundColor: brandNavy, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${brandNavy}`, marginTop: '10px', fontSize: '12px' }}>2. TYPE OF WORK & SUPPORTING DOCUMENTS</div>
        <div style={{ border: `1px solid ${borderColor}`, padding: '8px', borderTop: 'none', marginBottom: '10px' }}>
            <strong style={{ color: brandNavy, display: 'block', marginBottom: '6px', fontSize: '12px' }}>Work Types Permitted:</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px', margin: '5px 0' }}>
                {activePermits.length > 0 ? activePermits.map(wp => (
                  <div key={wp.key}>[<span style={{ color: brandBlue, fontWeight: 'bold' }}>X</span>] {wp.label}</div>
                )) : (
                  <div>None selected</div>
                )}
            </div>
            <table style={{ marginTop: '10px', marginBottom: '0', width: '100%', borderCollapse: 'collapse', backgroundColor: bgLight }}>
                <tbody>
                <tr>
                    <td style={{ border: `1px solid ${borderColor}`, fontWeight: 'bold', padding: '6px', color: brandNavy, whiteSpace: 'nowrap' }}>LOTO Number:</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', backgroundColor: '#fff', width: '25%' }}>{page4.loto_number || 'N/A'}</td>
                    <td style={{ border: `1px solid ${borderColor}`, fontWeight: 'bold', padding: '6px', color: brandNavy, whiteSpace: 'nowrap' }}>TBT Ref:</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', backgroundColor: '#fff', width: '25%' }}>{page4.tbt_number || 'N/A'}</td>
                    <td style={{ border: `1px solid ${borderColor}`, fontWeight: 'bold', padding: '6px', color: brandNavy, whiteSpace: 'nowrap' }}>JSA Attached:</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', backgroundColor: '#fff', width: '15%' }}>{page4.jsa_checked ? 'Yes' : 'No'}</td>
                </tr>
                </tbody>
            </table>
        </div>

        {/* 3. SAFETY CHECKLIST */}
        <div style={{ backgroundColor: brandNavy, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${brandNavy}`, marginTop: '10px', fontSize: '12px' }}>3. SAFETY CHECKLIST (Verified on site)</div>
        <div style={{ border: `1px solid ${borderColor}`, padding: '10px', borderTop: 'none', marginBottom: '10px' }}>
            {activeChecklists.length > 0 ? (
              <div>
                {activeChecklists.map((section, idx) => (
                  <div key={idx} style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', marginBottom: '6px', color: brandNavy, fontSize: '12px' }}>{section.title}</strong>
                    {section.questions.map((q, qIdx) => (
                      <div key={qIdx} style={{ margin: '4px 0', display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ marginRight: '6px', fontFamily: 'monospace', fontSize: '13px', color: brandBlue, fontWeight: 'bold' }}>[X]</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontStyle: 'italic', color: '#8593a6' }}>No safety checklist items were marked as verified (Yes).</div>
            )}
        </div>

        {/* 4. PERMIT ISSUANCE */}
        <div style={{ backgroundColor: brandNavy, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${brandNavy}`, marginTop: '10px', fontSize: '12px' }}>4. PERMIT ISSUANCE</div>
        <div style={{ border: `1px solid ${borderColor}`, padding: '10px', borderTop: 'none' }}>
            <p style={{ fontStyle: 'italic', fontSize: '11px', margin: '0 0 10px 0', color: '#5f6d80' }}>We have inspected the location and confirmed all necessary precautions are in place. The location is safe for work.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                <tr>
                    <th style={{ border: `1px solid ${borderColor}`, padding: '6px', textAlign: 'left', backgroundColor: bgLight, color: brandNavy }}>Role</th>
                    <th style={{ border: `1px solid ${borderColor}`, padding: '6px', textAlign: 'left', backgroundColor: bgLight, color: brandNavy }}>Name</th>
                    <th style={{ border: `1px solid ${borderColor}`, padding: '6px', textAlign: 'left', backgroundColor: bgLight, color: brandNavy }}>Signature / Status</th>
                </tr>
                <tr>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', color: brandNavy }}>Permit Initiator</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page4.permit_issuance?.initiator || 'Pending'}</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', color: '#0b8a53', fontStyle: 'italic' }}>Signed electronically</td>
                </tr>
                <tr>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', color: brandNavy }}>Contractor</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page4.permit_issuance?.contractor || 'Pending'}</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', color: page4.permit_issuance?.contractor ? '#0b8a53' : '#8593a6', fontStyle: 'italic' }}>{page4.permit_issuance?.contractor ? 'Signed electronically' : 'Pending'}</td>
                </tr>
                <tr>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', fontWeight: 'bold', color: brandNavy }}>Permit Authoriser</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px' }}>{page4.permit_issuance?.authoriser || 'Pending'}</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '6px', color: page4.permit_issuance?.authoriser ? '#0b8a53' : '#b07600', fontStyle: 'italic' }}>{page4.permit_issuance?.authoriser ? 'Signed electronically' : 'Pending Approval'}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
  )
}
