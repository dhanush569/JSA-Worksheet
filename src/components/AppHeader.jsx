import { FaKey, FaRightFromBracket } from 'react-icons/fa6'
import { ROLE_LABEL, useAuth } from '../auth/AuthContext.jsx'

// Picks up src/assets/rane-logo.* when it exists; an empty glob is not an error.
const found = import.meta.glob('../assets/rane-logo.{png,svg,jpg,jpeg,webp}', {
  eager: true, query: '?url', import: 'default',
})
const LOGO = Object.values(found)[0] || null

/**
 * Logo, then the document this app is — FR-HSE-38 is a controlled form, so its
 * number sits in the masthead the way it does on the printed sheet — then who
 * is signed in and the two things they can do about it.
 */
export default function AppHeader({ onChangePassword }) {
  const { user, signOut } = useAuth()

  return (
    <header className="masthead">
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

      <div className="header-title">
        <h1>JSA Worksheet</h1>
        <span className="docref">FR-HSE-38 · Rev-00 · Ref PR-HSE-04</span>
      </div>

      <div className="header-meta">
        {user && (
          <>
            <span className="chip">{user.plant_name || user.company_name || 'All plants'}</span>
            <span className="chip">{ROLE_LABEL[user.role] || user.role}</span>
            {onChangePassword && (
              <button type="button" className="btn btn-sm" onClick={onChangePassword}
                      aria-label="Change your password">
                <FaKey size={11} aria-hidden="true" />
                <span className="btn-label">Password</span>
              </button>
            )}
            <button type="button" className="btn btn-sm" onClick={signOut}
                    aria-label="Sign out">
              <FaRightFromBracket size={11} aria-hidden="true" />
              <span className="btn-label">Sign out</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
