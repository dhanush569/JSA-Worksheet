import { useJsa } from '../context/JsaContext.jsx'
import { WORK_PERMITS } from '../data/permits.js'
import { FaCheck } from 'react-icons/fa6'

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
      'Boom/scissor lift  Emergency control, load details & trained operator?'
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
  const { page1, page4 } = useJsa()

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
        if (page4.checklist[`${sIndex}_${qIndex}`] === 'Yes') {
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
  
  const brandBlue = '#1b66d3'
  const brandLight = '#f4f8fc'
  const borderColor = '#cdd6e2'

  return (
    <div style={{ backgroundColor: '#fff', color: '#374252', padding: '40px', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontSize: '13px', maxWidth: '900px', margin: '0 auto', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
        
        {/* Header Section */}
        <div style={{ borderBottom: `4px solid ${brandBlue}`, paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: brandBlue, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PERMIT TO WORK (PTW)</h1>
            <div style={{ fontSize: '11px', color: '#8593a6', fontWeight: '600' }}>DOCUMENT REF: FR-HSE-07 | REV: 00</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Date Generated:</div>
            <div style={{ color: '#5f6d80' }}>{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* 1. GENERAL DETAILS */}
        <div style={{ backgroundColor: brandBlue, color: '#fff', fontWeight: 'bold', padding: '8px 12px', borderRadius: '4px 4px 0 0', fontSize: '13px', letterSpacing: '0.5px' }}>1. GENERAL DETAILS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <tbody>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', fontWeight: '600', width: '20%', backgroundColor: brandLight, color: brandBlue }}>Permit Number</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', width: '30%' }}>{page1.permit_no || 'Draft'}</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', fontWeight: '600', width: '20%', backgroundColor: brandLight, color: brandBlue }}>JSA Number</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', width: '30%' }}>{page4.jsa_number || page1.jsa_no || 'Draft'}</td>
            </tr>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', fontWeight: '600', backgroundColor: brandLight, color: brandBlue }}>Date</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px' }}>{page4.date || todayDate}</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', fontWeight: '600', backgroundColor: brandLight, color: brandBlue }}>Time (Start / End)</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px' }}>{page4.start_time || '00:00'} to {page4.end_time || '00:00'}</td>
            </tr>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', fontWeight: '600', backgroundColor: brandLight, color: brandBlue }}>Location</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px' }}>{page1.location || 'Not specified'}</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', fontWeight: '600', backgroundColor: brandLight, color: brandBlue }}>Persons Involved</td>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px' }}>{page4.persons_involved_count || '0'}</td>
            </tr>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', fontWeight: '600', backgroundColor: brandLight, color: brandBlue }}>Contractor</td>
                <td colSpan={3} style={{ border: `1px solid ${borderColor}`, padding: '10px 12px' }}>{page1.contractor || 'Not specified'}</td>
            </tr>
            <tr>
                <td style={{ border: `1px solid ${borderColor}`, padding: '10px 12px', fontWeight: '600', backgroundColor: brandLight, color: brandBlue }}>Work Description</td>
                <td colSpan={3} style={{ border: `1px solid ${borderColor}`, padding: '10px 12px' }}>{page1.job_description || 'Not specified'}</td>
            </tr>
            </tbody>
        </table>

        {/* 2. TYPE OF WORK & SUPPORTING DOCS */}
        <div style={{ backgroundColor: brandBlue, color: '#fff', fontWeight: 'bold', padding: '8px 12px', borderRadius: '4px 4px 0 0', fontSize: '13px', letterSpacing: '0.5px' }}>2. TYPE OF WORK & SUPPORTING DOCUMENTS</div>
        <div style={{ border: `1px solid ${borderColor}`, padding: '16px', borderTop: 'none', marginBottom: '24px', borderRadius: '0 0 4px 4px' }}>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: '600', color: brandBlue, marginBottom: '8px' }}>Work Types Permitted:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {activePermits.length > 0 ? activePermits.map(wp => (
                    <div key={wp.key} style={{ background: brandLight, border: `1px solid ${brandBlue}`, color: brandBlue, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaCheck /> {wp.label}
                    </div>
                  )) : (
                    <div style={{ color: '#8593a6', fontStyle: 'italic' }}>No specific work types selected.</div>
                  )}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fafbfc' }}>
                <tbody>
                <tr>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '8px 12px', fontWeight: '600', width: '15%', color: brandBlue }}>LOTO Number:</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '8px 12px', width: '18%' }}>{page4.loto_number || 'N/A'}</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '8px 12px', fontWeight: '600', width: '15%', color: brandBlue }}>TBT Ref:</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '8px 12px', width: '18%' }}>{page4.tbt_number || 'N/A'}</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '8px 12px', fontWeight: '600', width: '15%', color: brandBlue }}>JSA Attached:</td>
                    <td style={{ border: `1px solid ${borderColor}`, padding: '8px 12px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: page4.jsa_checked ? '#0b8a53' : '#e0e4eb', color: page4.jsa_checked ? '#fff' : '#374252', fontWeight: 'bold' }}>
                        {page4.jsa_checked ? 'YES' : 'NO'}
                      </span>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        {/* 3. SAFETY CHECKLIST */}
        <div style={{ backgroundColor: brandBlue, color: '#fff', fontWeight: 'bold', padding: '8px 12px', borderRadius: '4px 4px 0 0', fontSize: '13px', letterSpacing: '0.5px' }}>3. SAFETY CHECKLIST (Verified on site)</div>
        <div style={{ border: `1px solid ${borderColor}`, padding: '16px', borderTop: 'none', marginBottom: '24px', borderRadius: '0 0 4px 4px' }}>
            {activeChecklists.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activeChecklists.map((section, idx) => (
                  <div key={idx}>
                    <div style={{ fontWeight: 'bold', color: brandBlue, fontSize: '14px', marginBottom: '8px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '4px' }}>
                      {section.title}
                    </div>
                    {section.questions.map((q, qIdx) => (
                      <div key={qIdx} style={{ margin: '6px 0', display: 'flex', alignItems: 'flex-start', lineHeight: '1.4' }}>
                        <FaCheck style={{ color: '#0b8a53', marginTop: '3px', marginRight: '8px', flexShrink: 0 }} /> 
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#8593a6', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                No safety checklist items were marked as verified (Yes).
              </div>
            )}
        </div>

        {/* 4. PERMIT ISSUANCE */}
        <div style={{ backgroundColor: brandBlue, color: '#fff', fontWeight: 'bold', padding: '8px 12px', borderRadius: '4px 4px 0 0', fontSize: '13px', letterSpacing: '0.5px' }}>4. PERMIT ISSUANCE</div>
        <div style={{ border: `1px solid ${borderColor}`, padding: '16px', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
          <p style={{ fontStyle: 'italic', fontSize: '12px', margin: '0 0 12px 0', color: '#5f6d80' }}>
            We have inspected the location and confirmed all necessary precautions are in place. The location is safe for work.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
              <tr>
                  <th style={{ borderBottom: `2px solid ${brandBlue}`, padding: '8px', textAlign: 'left', color: brandBlue }}>Role</th>
                  <th style={{ borderBottom: `2px solid ${brandBlue}`, padding: '8px', textAlign: 'left', color: brandBlue }}>Name</th>
                  <th style={{ borderBottom: `2px solid ${brandBlue}`, padding: '8px', textAlign: 'left', color: brandBlue }}>Signature / Status</th>
              </tr>
              <tr>
                  <td style={{ borderBottom: `1px solid ${borderColor}`, padding: '10px 8px', fontWeight: '600' }}>Permit Initiator</td>
                  <td style={{ borderBottom: `1px solid ${borderColor}`, padding: '10px 8px' }}>{page4.permit_issuance?.initiator || 'Pending'}</td>
                  <td style={{ borderBottom: `1px solid ${borderColor}`, padding: '10px 8px', color: '#0b8a53' }}><em>Signed electronically</em></td>
              </tr>
              <tr>
                  <td style={{ borderBottom: `1px solid ${borderColor}`, padding: '10px 8px', fontWeight: '600' }}>Contractor</td>
                  <td style={{ borderBottom: `1px solid ${borderColor}`, padding: '10px 8px' }}>{page4.permit_issuance?.contractor || 'Pending'}</td>
                  <td style={{ borderBottom: `1px solid ${borderColor}`, padding: '10px 8px', color: page4.permit_issuance?.contractor ? '#0b8a53' : '#8593a6' }}>
                    <em>{page4.permit_issuance?.contractor ? 'Signed electronically' : 'Pending'}</em>
                  </td>
              </tr>
              <tr>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>Permit Authoriser</td>
                  <td style={{ padding: '10px 8px' }}>{page4.permit_issuance?.authoriser || 'Pending'}</td>
                  <td style={{ padding: '10px 8px', color: page4.permit_issuance?.authoriser ? '#0b8a53' : '#b07600' }}>
                    <em>{page4.permit_issuance?.authoriser ? 'Signed electronically' : 'Pending Approval'}</em>
                  </td>
              </tr>
              </tbody>
          </table>
        </div>
    </div>
  )
}
