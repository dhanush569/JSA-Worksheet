import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FaCircleInfo, FaClipboardList, FaListCheck, FaLock, FaSignature, FaFileContract
} from 'react-icons/fa6'
import { LoadingScreen } from '../components/Loading.jsx'
import { useToast } from '../components/Toast.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { useJsa } from '../context/JsaContext.jsx'
import Page1 from './Page1.jsx'
import Page2 from './Page2.jsx'
import Page3 from './Page3.jsx'
import Page4 from './Page4.jsx'

const ALL_STEPS = [
  { n: 1, label: 'General · Permits · PPE', short: 'General', Icon: FaClipboardList },
  { n: 2, label: 'Hazards & Controls',      short: 'Hazards', Icon: FaListCheck },
  { n: 3, label: 'Team · Contractor · Sign off', short: 'Sign off', Icon: FaSignature },
  { n: 4, label: 'Permit to Work', short: 'PTW', Icon: FaFileContract },
]

/** The three-page wizard. /jsa/new starts blank; /jsa/:id opens an existing one. */
export default function JsaWorksheetPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { loadWorksheet, resetWorksheet, worksheetId, status, isEditable, permitsTicked } = useJsa()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(!!id)
  const toast = useToast()

  const isOnlyExempt = permitsTicked.length > 0 && permitsTicked.every(p => p === 'sunday_holiday' || p === 'general_work')
  const showPtw = status === 'approved' || isOnlyExempt

  const STEPS = []
  STEPS.push(ALL_STEPS[0])
  STEPS.push(ALL_STEPS[1])
  STEPS.push(ALL_STEPS[2])
  if (showPtw) {
    STEPS.push(ALL_STEPS[3])
  }

  useEffect(() => {
    if (!id) {
      resetWorksheet({ company_id: user.company_id || '', plant_id: user.plant_id || '' })
      setPage(1)
      return
    }
    setLoading(true)
    loadWorksheet(id)
      .catch((e) => { toast.error(e.message); navigate('/my-jsa', { replace: true }) })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Once a draft is saved, keep the address bar in step so a refresh does not lose it.
  useEffect(() => {
    if (!id && worksheetId) navigate(`/jsa/${worksheetId}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId])

  // Moving between pages should start you at the top of the new one.
  useEffect(() => {
    document.querySelector('.sheet')?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  if (loading) return <LoadingScreen label="Opening the worksheet" />

  const note = !isEditable && status !== 'approved'
    ? `Read only — this JSA is ${status.replace('_', ' ')}`
    : page === 2 ? 'Drafts assist you; the signatory stays accountable' : null

  return (
    <>
      <nav className="rail" aria-label="Worksheet pages">
        {STEPS.map(({ n, label, short, Icon }) => (
          <button key={n} type="button" className="rail-step" aria-current={page === n}
                  onClick={() => setPage(n)}>
            <span className="rail-num" aria-hidden="true">{n}</span>
            <Icon size={13} aria-hidden="true" />
            <span className="rail-step-long">
              {label}
              {isOnlyExempt && (n === 2 || n === 3) && (
                <span style={{ color: 'var(--brand-blue)', fontStyle: 'italic', fontSize: '0.9em', marginLeft: '6px', opacity: 0.8 }}>(Optional)</span>
              )}
            </span>
            <span className="rail-step-short">
              {short}
              {isOnlyExempt && (n === 2 || n === 3) && <span style={{ opacity: 0.7 }}> *</span>}
            </span>
          </button>
        ))}

        <div className="rail-spacer" />

        {note && (
          <div className="rail-note">
            {isEditable ? <FaCircleInfo size={12} aria-hidden="true" />
                        : <FaLock size={12} aria-hidden="true" />}
            <span>{note}</span>
          </div>
        )}
      </nav>

      <main className="sheet">
        {page === 1 && <Page1 onNext={() => setPage(2)} />}
        {page === 2 && <Page2 onBack={() => setPage(1)} onNext={() => setPage(3)} />}
        {page === 3 && <Page3 onBack={() => setPage(2)} onNext={showPtw ? () => setPage(4) : null} />}
        {page === 4 && showPtw && <Page4 onBack={() => setPage(3)} />}
      </main>
    </>
  )
}
