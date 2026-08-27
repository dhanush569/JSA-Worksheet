import { FaCheck } from 'react-icons/fa6'
import { WORK_PERMITS } from '../data/permits.js'
import { PPE_GROUPS } from '../data/ppe.js'
import { RiskPill, StatusPill } from './Pills.jsx'

const Cell = ({ k, v }) => (
  <div className="ro-cell">
    <div className="k">{k}</div>
    <div className={`v${v ? '' : ' empty-v'}`}>{v || 'not filled'}</div>
  </div>
)

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '')

/** Everything an approver needs to read, and nothing they can change. */
export default function WorksheetReadOnly({ ws }) {
  const permits = WORK_PERMITS.filter((p) => ws.work_permits?.[p.key])
  const ppe = PPE_GROUPS.flatMap((g) =>
    g.items.filter((i) => ws.ppe?.[i.key]).map((i) => ({
      key: i.key,
      label: `${g.title}: ${i.label}${i.other && ws.ppe_other_text ? ` (${ws.ppe_other_text})` : ''}`,
    }))
  )

  const pendingStage = ws.approval_steps?.find((s) => s.status === 'pending')?.stage_label

  return (
    <div className="stack">
      {/* ------------------------------------------------------ general details */}
      <section className="block">
        <div className="block-head">
          <h2>General details</h2>
          <span className="hint">
            <RiskPill risk={ws.risk_level} />
            <StatusPill status={ws.status} stageLabel={pendingStage} />
          </span>
        </div>
        <div className="ro-grid">
          <Cell k="JSA no." v={ws.jsa_no} />
          <Cell k="Company" v={ws.company_name} />
          <Cell k="Plant" v={ws.plant_name} />
          <Cell k="JSA prepared date" v={fmt(ws.jsa_prepared_date)} />
          <Cell k="Line or location name" v={ws.line_location_name} />
          <Cell k="Dept. head / incharge" v={ws.department_head_name} />
          <Cell k="Permit no." v={ws.permit_no} />
          <Cell k="Location" v={ws.location} />
          <Cell k="Contractor" v={ws.contractor} />
          <Cell k="Contractor type" v={ws.contractor_type} />
          <Cell k="Raised by" v={ws.initiator ? `${ws.initiator.name} · ${ws.initiator.email_id}` : ''} />
          <Cell k="Contractor acknowledgement"
                v={ws.contractor_verified ? `Confirmed by ${ws.contractor_email}` : 'not confirmed'} />
        </div>
        <div className="ro-grid" style={{ gridTemplateColumns: '1fr' }}>
          <Cell k="Job description" v={ws.job_description} />
          <Cell k="Tools & equipment" v={ws.tools_equipment} />
          <Cell k="Inspection guideline" v={ws.tools_inspection_guideline} />
          <Cell k="Inspection frequency" v={ws.inspection_frequency} />
          <Cell k="Are the PPE's in good condition" v={ws.ppe_good_condition} />
        </div>
      </section>

      {/* ---------------------------------------------------------- work permit */}
      <section className="block">
        <div className="block-head">
          <h2>Work permit</h2>
          <span className="hint">{permits.length} ticked</span>
        </div>
        <div className="chiprow">
          {permits.length ? permits.map((p) => (
            <span className="tickchip" key={p.key}>
              <FaCheck size={9} aria-hidden="true" /> {p.label}
            </span>
          )) : <span className="dim">No work permit was ticked.</span>}
        </div>
      </section>

      {/* ------------------------------------------------------------------ PPE */}
      <section className="block">
        <div className="block-head">
          <h2>PPE / safety equipment</h2>
          <span className="hint">{ppe.length} ticked</span>
        </div>
        <div className="chiprow">
          {ppe.length ? ppe.map((i) => (
            <span className="tickchip" key={i.key}>
              <FaCheck size={9} aria-hidden="true" /> {i.label}
            </span>
          )) : <span className="dim">No PPE was ticked.</span>}
        </div>
      </section>

      {/* ------------------------------------------- job steps and the analysis */}
      <section className="block">
        <div className="block-head">
          <h2>Job steps · hazards · control measures</h2>
          <span className="hint">{ws.job_steps?.length || 0} step(s)</span>
        </div>
        <div className="table-wrap">
          <table className="sheet-table table-read">
            <thead>
              <tr>
                <th className="col-seq">#</th>
                <th style={{ width: '22%' }}>Job step</th>
                <th style={{ width: '26%' }}>Potential hazards</th>
                <th style={{ width: '28%' }}>Control measures</th>
                <th style={{ width: '9%' }}>Target</th>
                <th style={{ width: '8%' }}>Status</th>
                <th>Responsible</th>
              </tr>
            </thead>
            <tbody>
              {(ws.job_steps || []).map((s, i) => (
                <tr key={s.id ?? i}>
                  <td className="col-seq">{s.seq_no ?? i + 1}</td>
                  <td>{s.job_step}</td>
                  <td>{s.potential_hazards}</td>
                  <td>{s.control_measures}</td>
                  <td>{s.target}</td>
                  <td>{s.step_status}</td>
                  <td>{s.responsible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --------------------------------------------------------- team members */}
      <section className="block">
        <div className="block-head">
          <h2>JSA team members</h2>
          <span className="hint">{ws.team_members?.length || 0} named</span>
        </div>
        {ws.team_members?.length ? (
          <div className="table-wrap">
            <table className="sheet-table table-read">
              <thead>
                <tr>
                  <th className="col-seq">#</th>
                  <th style={{ width: '26%' }}>Name</th>
                  <th style={{ width: '26%' }}>Company / Contractor</th>
                  <th style={{ width: '22%' }}>Department</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {ws.team_members.map((m, i) => (
                  <tr key={m.id ?? i}>
                    <td className="col-seq">{m.sl_no ?? i + 1}</td>
                    <td>{m.name}</td>
                    <td>{m.company_contractor}</td>
                    <td>{m.department}</td>
                    <td>{m.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">No team members were listed.</div>}
      </section>

      {/* -------------------------------------------------------------- sign off */}
      <section className="block">
        <div className="block-head"><h2>Sign off acknowledgements</h2></div>
        <div className="chiprow" style={{ flexDirection: 'column', gap: 'var(--s-2)' }}>
          <span className={ws.sign_off?.consultation_ack ? 'tickchip' : 'dim'}>
            {ws.sign_off?.consultation_ack && <FaCheck size={9} aria-hidden="true" />}
            Developed through consultation with employees, read and understood by all undertaking the work
          </span>
          <span className={ws.sign_off?.pre_work_briefing_ack ? 'tickchip' : 'dim'}>
            {ws.sign_off?.pre_work_briefing_ack && <FaCheck size={9} aria-hidden="true" />}
            Pre-work briefing shall be conducted before starting of work
          </span>
          {ws.sign_off?.notes && (
            <span style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>{ws.sign_off.notes}</span>
          )}
        </div>
      </section>
    </div>
  )
}
