import { useJsa } from '../context/JsaContext.jsx'

export default function PtwPdfPreview() {
  const { page1, page4 } = useJsa()

  // Format date/time helpers
  const todayDate = new Date().toISOString().slice(0, 10)
  
  // Extract checklists to see what's selected
  const isHotWork = page1.work_permits?.hot_work === true
  const isHeightWork = page1.work_permits?.height_work === true
  const isConfinedSpace = page1.work_permits?.confined_space === true
  const isElectrical = page1.work_permits?.electrical_work === true

  const checkVal = (key) => {
    if (!page4.checklist || !page4.checklist[key]) return ' '
    return page4.checklist[key] === 'Yes' ? 'X' : (page4.checklist[key] === 'NA' ? '-' : ' ')
  }

  return (
    <div style={{ backgroundColor: '#fff', color: '#000', padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '11px', maxWidth: '800px', margin: '0 auto', border: '1px solid #ccc' }}>
        <h1 style={{ textAlign: 'center', fontSize: '16px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>PERMIT TO WORK (PTW)</h1>
        <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '10px', fontWeight: 'bold' }}>Document Ref: FR-HSE-07 | Rev: 00</div>

        {/* 1. GENERAL DETAILS */}
        <div style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', padding: '4px', border: '1px solid #000', marginTop: '8px', fontSize: '12px' }}>1. GENERAL DETAILS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px' }}>
            <tbody>
            <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '20%', backgroundColor: '#f9f9f9' }}>Permit Number</td>
                <td style={{ border: '1px solid #000', padding: '4px', width: '30%' }}>{page1.permit_no || 'Draft'}</td>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '20%', backgroundColor: '#f9f9f9' }}>JSA Number</td>
                <td style={{ border: '1px solid #000', padding: '4px', width: '30%' }}>{page4.jsa_number || page1.jsa_no || 'Draft'}</td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Date</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>{page4.date || todayDate}</td>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Time (Start / End)</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>{page4.start_time || '00:00'} to {page4.end_time || '00:00'}</td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Location</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>{page1.location || 'Not specified'}</td>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Persons Involved</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>{page4.persons_involved_count || '0'}</td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Contractor</td>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}>{page1.contractor || 'Not specified'}</td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Work Description</td>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}>{page1.job_description || 'Not specified'}</td>
            </tr>
            </tbody>
        </table>

        {/* 2. TYPE OF WORK & SUPPORTING DOCS */}
        <div style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', padding: '4px', border: '1px solid #000', marginTop: '8px', fontSize: '12px' }}>2. TYPE OF WORK & SUPPORTING DOCUMENTS</div>
        <div style={{ border: '1px solid #000', padding: '5px', borderTop: 'none' }}>
            <strong>Work Types Permitted:</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px', margin: '5px 0' }}>
                <div>[{isHotWork ? 'X' : ' '}] Hot Work</div>
                <div>[{isHeightWork ? 'X' : ' '}] Height Work</div>
                <div>[{isConfinedSpace ? 'X' : ' '}] Confined Space</div>
                <div>[{isElectrical ? 'X' : ' '}] Electrical Work</div>
            </div>
            <table style={{ marginTop: '5px', marginBottom: '0', width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                <tr>
                    <td style={{ fontWeight: 'bold', width: '15%' }}>LOTO Number:</td>
                    <td style={{ width: '18%' }}>{page4.loto_number || 'N/A'}</td>
                    <td style={{ fontWeight: 'bold', width: '15%' }}>TBT Ref:</td>
                    <td style={{ width: '18%' }}>{page4.tbt_number || 'N/A'}</td>
                    <td style={{ fontWeight: 'bold', width: '15%' }}>JSA Attached:</td>
                    <td>{page4.jsa_checked ? 'Yes' : 'No'}</td>
                </tr>
                </tbody>
            </table>
        </div>

        {/* 3. SAFETY CHECKLIST */}
        <div style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', padding: '4px', border: '1px solid #000', marginTop: '8px', fontSize: '12px' }}>3. SAFETY CHECKLIST (Verified on site)</div>
        <div style={{ border: '1px solid #000', padding: '5px', borderTop: 'none', display: 'flex', gap: '15px' }}>
            <div style={{ flex: '1' }}>
                <strong>Common & General Work</strong>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('0_0')}]</span> Has the worker been trained for this task?</div>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('0_1')}]</span> Are all tools/equipment inspected and safe?</div>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('0_2')}]</span> Housekeeping done; pits/sumps covered?</div>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('0_5')}]</span> Necessary barricades/warning signs in place?</div>
            </div>
            <div style={{ flex: '1', opacity: isHotWork ? 1 : 0.4 }}>
                <strong>Hot Work</strong>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('1_0')}]</span> Combustibles removed within 10m?</div>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('1_2')}]</span> Cylinders equipped with flashback arrestors?</div>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('1_3')}]</span> Fire fighting equipment available?</div>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('1_5')}]</span> Dedicated fire watcher in place?</div>
            </div>
            <div style={{ flex: '1', opacity: isHeightWork ? 1 : 0.4 }}>
                <strong>Height Work</strong>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('3_0')}]</span> Members medically fit and trained?</div>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('3_3')}]</span> Scaffolding/platform green tagged?</div>
                <div style={{ margin: '3px 0', display: 'flex' }}><span style={{ marginRight: '5px', fontFamily: 'monospace' }}>[{checkVal('3_2')}]</span> Tools/materials secured with rope/bag?</div>
            </div>
        </div>

        {/* 4. PERMIT ISSUANCE */}
        <div style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', padding: '4px', border: '1px solid #000', marginTop: '8px', fontSize: '12px' }}>4. PERMIT ISSUANCE</div>
        <p style={{ fontStyle: 'italic', fontSize: '10px', margin: '3px 0' }}>We have inspected the location and confirmed all necessary precautions are in place. The location is safe for work.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
            <tr>
                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Role</th>
                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Signature / Status</th>
            </tr>
            <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Permit Initiator</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>{page4.permit_issuance?.initiator || 'Pending'}</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}><em>Signed electronically</em></td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Contractor</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>{page4.permit_issuance?.contractor || 'Pending'}</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}><em>{page4.permit_issuance?.contractor ? 'Signed electronically' : 'Pending'}</em></td>
            </tr>
            <tr>
                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Permit Authoriser</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>{page4.permit_issuance?.authoriser || 'Pending'}</td>
                <td style={{ border: '1px solid #000', padding: '4px' }}><em>{page4.permit_issuance?.authoriser ? 'Signed electronically' : 'Pending Approval'}</em></td>
            </tr>
            </tbody>
        </table>
    </div>
  )
}
