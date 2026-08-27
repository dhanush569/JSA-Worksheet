import { FaFolderOpen, FaFilePen } from 'react-icons/fa6'
import { useJsa } from '../context/JsaContext.jsx'

// Picks up src/assets/rane-logo.* if it exists. import.meta.glob returns an
// empty object when nothing matches, so a missing logo never breaks the build.
const found = import.meta.glob('../assets/rane-logo.{png,svg,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const LOGO = Object.values(found)[0] || null

export default function Header({ onOpenRegister, onNewWorksheet }) {
  const { worksheetId, status } = useJsa()

  return (
    <header className="header">
      <div className="header-title">
        <h1>JSA Worksheet</h1>
        <span className="docref">FR-HSE-38 · Rev-00 · Ref PR-HSE-04</span>
      </div>

      <div className="header-meta">
        <span className="chip">{worksheetId ? `JSA ID ${worksheetId}` : 'Not saved yet'}</span>
        <span className={`chip chip-${status}`}>{status}</span>
        <button type="button" className="btn btn-sm" onClick={onOpenRegister}>
          <FaFolderOpen size={12} /> Register
        </button>
        <button type="button" className="btn btn-sm" onClick={onNewWorksheet}>
          <FaFilePen size={12} /> New JSA
        </button>
      </div>

      <div className="header-logo">
        {LOGO ? (
          <img src={LOGO} alt="Rane" />
        ) : (
          <div>
            <div className="wordmark">Rane</div>
            <div className="wordmark-sub">Expanding Horizons</div>
          </div>
        )}
      </div>
    </header>
  )
}
