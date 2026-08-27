import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const JsaContext = createContext(null)

const uid = () => Math.random().toString(36).slice(2, 10)

export const blankHazard = () => ({
  rid: uid(),
  potential_hazards: '',
  control_measures: '',
  target: '',
  step_status: '',
  responsible: '',
  ai_generated: false,
  edited_by_user: false,
  selected: true,
})

export const blankStep = () => ({
  rid: uid(),
  job_step: '',
  hazards: [blankHazard()],
})

export const blankMember = () => ({
  rid: uid(),
  name: '',
  company_contractor: '',
  department: '',
  remarks: '',
})

const emptyPage1 = () => ({
  company_id: '',
  plant_id: '',
  jsa_prepared_date: new Date().toISOString().slice(0, 10),
  line_location_name: '',
  department_head_name: '',
  permit_no: '',
  location: '',
  contractor: '',
  jsa_no: '',
  job_description: '',
  tools_equipment: '',
  tools_inspection_guideline: '',
  contractor_type: '',
  inspection_frequency: '',
  work_permits: {},
  ppe: {},
  ppe_other_text: '',
  ppe_good_condition: '',
  risk_level: 'Normal',
})

const emptySignOff = () => ({
  consultation_ack: false,
  pre_work_briefing_ack: false,
  notes: '',
})

/** Empty strings become NULL in Postgres. */
const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v]))

const nz = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === null || v === undefined ? '' : v]))

const stripRid = ({ rid, id, ...rest }) => rest // eslint-disable-line no-unused-vars

export function JsaProvider({ children }) {
  const [worksheetId, setWorksheetId] = useState(null)
  const [status, setStatus] = useState('draft')
  const [isEditable, setIsEditable] = useState(true)
  const [page1, setPage1] = useState(emptyPage1)
  const [jobSteps, setJobSteps] = useState(() => Array.from({ length: 6 }, blankStep))
  const [teamMembers, setTeamMembers] = useState(() => Array.from({ length: 6 }, blankMember))
  const [signOff, setSignOff] = useState(emptySignOff)
  const [approvalSteps, setApprovalSteps] = useState([])
  const [contractor, setContractor] = useState({ email: '', verified: false, sentAt: null })
  const [approvers, setApprovers] = useState({ lvl1: '', lvl2: '', ph: '' })
  const [savingPage, setSavingPage] = useState(null)

  const setField = useCallback((name, value) => {
    setPage1((prev) => ({ ...prev, [name]: value }))
  }, [])

  const togglePermit = useCallback((key) => {
    setPage1((p) => ({ ...p, work_permits: { ...p.work_permits, [key]: !p.work_permits[key] } }))
  }, [])

  const togglePpe = useCallback((key) => {
    setPage1((p) => ({ ...p, ppe: { ...p.ppe, [key]: !p.ppe[key] } }))
  }, [])

  const permitsTicked = useMemo(
    () => Object.entries(page1.work_permits).filter(([, v]) => v).map(([k]) => k),
    [page1.work_permits]
  )
  const ppeTicked = useMemo(
    () => Object.entries(page1.ppe).filter(([, v]) => v).map(([k]) => k),
    [page1.ppe]
  )

  const absorb = useCallback((ws) => {
    setWorksheetId(ws.id)
    setStatus(ws.status)
    setIsEditable(ws.is_editable)
    setApprovalSteps(ws.approval_steps || [])
    setContractor({
      email: ws.contractor_email || '',
      verified: !!ws.contractor_verified,
      sentAt: ws.contractor_code_sent_at || null,
    })
    setApprovers({
      lvl1: ws.lvl1_approver_id || '',
      lvl2: ws.lvl2_approver_id || '',
      ph: ws.ph_approver_id || '',
    })
    return ws
  }, [])

  // ----------------------------------------------------------------- saving
  const savePage1 = useCallback(async () => {
    setSavingPage(1)
    try {
      const body = clean(page1)
      const ws = worksheetId
        ? await api.updateWorksheet(worksheetId, body)
        : await api.createWorksheet(body)
      absorb(ws)
      // The backend mints the JSA number on first save.
      if (ws.jsa_no && ws.jsa_no !== page1.jsa_no) setField('jsa_no', ws.jsa_no)
      return ws.id
    } finally {
      setSavingPage(null)
    }
  }, [page1, worksheetId, absorb, setField])

  const savePage2 = useCallback(async () => {
    const id = worksheetId ?? (await savePage1())
    setSavingPage(2)
    try {
      const payloadSteps = jobSteps.map((r) => {
        const { hazards, ...rest } = r
        const selectedHazards = hazards.filter(h => h.selected !== false)
        const potential_hazards = selectedHazards.map((h) => h.potential_hazards).filter(Boolean).join('\n')
        const control_measures = selectedHazards.map((h) => h.control_measures).filter(Boolean).join('\n')
        // We pick the first hazard's target/status/responsible for backward compatibility
        const target = selectedHazards[0]?.target || ''
        const step_status = selectedHazards[0]?.step_status || ''
        const responsible = selectedHazards[0]?.responsible || ''
        const ai_generated = hazards.some((h) => h.ai_generated)
        const edited_by_user = hazards.some((h) => h.edited_by_user)
        return clean(stripRid({ ...rest, potential_hazards, control_measures, target, step_status, responsible, ai_generated, edited_by_user }))
      })
      absorb(await api.savePage2(id, { job_steps: payloadSteps }))
      return id
    } finally {
      setSavingPage(null)
    }
  }, [worksheetId, savePage1, jobSteps, absorb])

  const savePage3 = useCallback(async () => {
    const id = worksheetId ?? (await savePage1())
    setSavingPage(3)
    try {
      absorb(await api.savePage3(id, {
        team_members: teamMembers.map((r) => clean(stripRid(r))),
        sign_off: clean(signOff),
      }))
      return id
    } finally {
      setSavingPage(null)
    }
  }, [worksheetId, savePage1, teamMembers, signOff, absorb])

  const sendContractorCode = useCallback(async (email) => {
    const id = worksheetId ?? (await savePage1())
    const res = await api.sendContractorCode(id, email)
    setContractor((c) => ({ ...c, email, sentAt: new Date().toISOString(), verified: false }))
    return res
  }, [worksheetId, savePage1])

  const verifyContractorCode = useCallback(async (code) => {
    absorb(await api.verifyContractorCode(worksheetId, code))
  }, [worksheetId, absorb])

  const submitForApproval = useCallback(async () => {
    const ws = await api.submitForApproval(worksheetId, {
      risk_level: page1.risk_level,
      lvl1_approver_id: Number(approvers.lvl1) || null,
      lvl2_approver_id: Number(approvers.lvl2) || null,
      ph_approver_id: page1.risk_level === 'High_Risk' ? Number(approvers.ph) || null : null,
    })
    absorb(ws)
    return ws
  }, [worksheetId, page1.risk_level, approvers, absorb])

  // ----------------------------------------------------------------- loading
  const loadWorksheet = useCallback(async (id) => {
    const ws = await api.getWorksheet(id)
    const shape = emptyPage1()
    setPage1({
      ...shape,
      ...nz(Object.fromEntries(Object.entries(ws).filter(([k]) => k in shape))),
      work_permits: ws.work_permits || {},
      ppe: ws.ppe || {},
      risk_level: ws.risk_level || 'Normal',
    })

    const steps = (ws.job_steps || []).map((s) => {
      const hazards = []
      if (s.potential_hazards || s.control_measures) {
        hazards.push({
          ...blankHazard(),
          potential_hazards: s.potential_hazards || '',
          control_measures: s.control_measures || '',
          target: s.target || '',
          step_status: s.step_status || '',
          responsible: s.responsible || '',
          ai_generated: !!s.ai_generated,
          edited_by_user: !!s.edited_by_user,
          selected: true,
        })
      } else {
        hazards.push(blankHazard())
      }
      return {
        ...blankStep(),
        ...nz(s),
        rid: uid(),
        hazards,
      }
    })
    while (steps.length < 6) steps.push(blankStep())
    setJobSteps(steps)

    const members = (ws.team_members || []).map((m) => ({ ...blankMember(), ...nz(m), rid: uid() }))
    while (members.length < 6) members.push(blankMember())
    setTeamMembers(members)

    setSignOff(ws.sign_off
      ? { ...emptySignOff(), notes: ws.sign_off.notes || '',
          consultation_ack: !!ws.sign_off.consultation_ack,
          pre_work_briefing_ack: !!ws.sign_off.pre_work_briefing_ack }
      : emptySignOff())

    absorb(ws)
    return ws
  }, [absorb])

  const resetWorksheet = useCallback((defaults = {}) => {
    setWorksheetId(null)
    setStatus('draft')
    setIsEditable(true)
    setPage1({ ...emptyPage1(), ...defaults })
    setJobSteps(Array.from({ length: 6 }, blankStep))
    setTeamMembers(Array.from({ length: 6 }, blankMember))
    setSignOff(emptySignOff())
    setApprovalSteps([])
    setContractor({ email: '', verified: false, sentAt: null })
    setApprovers({ lvl1: '', lvl2: '', ph: '' })
  }, [])

  const value = {
    worksheetId, status, isEditable, savingPage,
    page1, setField, togglePermit, togglePpe, permitsTicked, ppeTicked,
    jobSteps, setJobSteps, teamMembers, setTeamMembers, signOff, setSignOff,
    approvalSteps, contractor, setContractor, approvers, setApprovers,
    savePage1, savePage2, savePage3,
    sendContractorCode, verifyContractorCode, submitForApproval,
    loadWorksheet, resetWorksheet,
  }

  return <JsaContext.Provider value={value}>{children}</JsaContext.Provider>
}

export function useJsa() {
  const ctx = useContext(JsaContext)
  if (!ctx) throw new Error('useJsa must be used inside <JsaProvider>')
  return ctx
}
