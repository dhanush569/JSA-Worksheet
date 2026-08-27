import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FaBuilding, FaCirclePlus, FaIndustry, FaSpinner, FaToggleOff, FaToggleOn,
  FaTriangleExclamation, FaUserPlus, FaUsersGear,
} from 'react-icons/fa6'
import { Actions, Cell, DataBody, DataHead, DataRow } from '../components/DataList.jsx'
import { Card, CardHead } from '../components/Card.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Loading } from '../components/Loading.jsx'
import Modal from '../components/Modal.jsx'
import { RolePill } from '../components/Pills.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../api/client.js'
import { ROLE_LABEL, useAuth } from '../auth/AuthContext.jsx'

const PLANT_SCOPED = ['location_admin', 'jsa_initiator', 'lvl1_approver', 'lvl2_approver', 'ph_approver']

const USER_COLUMNS = ['Name', 'Username', 'Role', 'Plant', 'Email', 'State', '']
const PLANT_COLUMNS = ['Plant', 'Code', 'Users', '']

const HELP = {
  admin: 'You can create companies, add plants anywhere, and create any user.',
  company_admin: 'You can add plants to your company and appoint location admins for them.',
  location_admin: 'You can create the JSA initiator and the level 1, level 2 and Plant Head approvers for your plant.',
}

export default function UserManagementPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [companies, setCompanies] = useState(null)
  const [users, setUsers] = useState([])
  const [caps, setCaps] = useState({ roles: [] })
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(null) // 'company' | 'plant' | 'user'
  const [busy, setBusy] = useState(false)
  const [filterPlant, setFilterPlant] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, u, k] = await Promise.all([api.companies(), api.users(), api.creatableRoles()])
      setCompanies(c)
      setUsers(u)
      setCaps(k)
    } catch (e) {
      toast.error(e.message)
      setCompanies([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  const allPlants = useMemo(
    () => (companies || []).flatMap((c) => c.plants.map((p) => ({ ...p, company_name: c.name }))),
    [companies]
  )

  const shownUsers = useMemo(
    () => (filterPlant ? users.filter((u) => String(u.plant_id) === String(filterPlant)) : users),
    [users, filterPlant]
  )

  const canMakeCompany = user.role === 'admin'
  const canMakePlant = ['admin', 'company_admin'].includes(user.role)
  const canMakeUser = (caps.roles || []).length > 0

  const togglePlant = async (plant) => {
    try {
      await api.patchPlant(plant.id, { is_active: !plant.is_active })
      toast.ok(`${plant.name} is now ${plant.is_active ? 'inactive' : 'active'}.`)
      load()
    } catch (e) { toast.error(e.message) }
  }

  const toggleUser = async (u) => {
    try {
      if (u.is_active) await api.deactivateUser(u.id)
      else await api.updateUser(u.id, { is_active: true })
      toast.ok(`${u.name} is now ${u.is_active ? 'deactivated' : 'active'}.`)
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="page">
      <div className="page-inner animate-in">
        <div className="page-head">
          <h1>User management</h1>
          <span className="lede">{HELP[user.role] || 'Read only for your role.'}</span>
          <span className="grow" />
          {canMakeCompany && (
            <button className="btn" onClick={() => setDialog('company')}>
              <FaBuilding size={12} aria-hidden="true" /> New company
            </button>
          )}
          {canMakePlant && (
            <button className="btn" onClick={() => setDialog('plant')}>
              <FaIndustry size={12} aria-hidden="true" /> New plant
            </button>
          )}
          {canMakeUser && (
            <button className="btn btn-primary" onClick={() => setDialog('user')}>
              <FaUserPlus size={12} aria-hidden="true" /> New user
            </button>
          )}
        </div>

        {loading && <Card><Loading label="Loading the organisation" /></Card>}

        {!loading && (
          <div className="split">
            {/* ------------------------------------------------------- org tree */}
            <div className="stack">
              <Card>
                <CardHead icon={FaIndustry} title="Companies & plants">
                  {allPlants.length} plant{allPlants.length === 1 ? '' : 's'}
                </CardHead>

                {(companies || []).length === 0 && (
                  <EmptyState
                    icon={FaBuilding}
                    title="No company yet"
                    hint={canMakeCompany
                      ? 'Create a company, add its plants, then appoint the people who work in them.'
                      : 'Ask an administrator to set up your company.'}
                    action={canMakeCompany ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setDialog('company')}>
                        <FaCirclePlus size={11} aria-hidden="true" /> New company
                      </button>
                    ) : null}
                  />
                )}

                {(companies || []).map((c) => (
                  <div key={c.id}>
                    <div className="orgrow-company">
                      <b>{c.name}</b>
                      <span className="dim mono">{c.code || '—'}</span>
                    </div>

                    {c.plants.length === 0 ? (
                      <div className="list-row dim" style={{ gridTemplateColumns: '1fr' }}>
                        No plant added yet.
                      </div>
                    ) : (
                      <>
                        <DataHead variant="row-plant" labels={PLANT_COLUMNS} />
                        {c.plants.map((p) => (
                          <DataRow variant="row-plant" key={p.id}>
                            <Cell className="truncate">{p.name}</Cell>
                            <Cell label="Code" className="dim mono">{p.code || '—'}</Cell>
                            <Cell label="Users" className="num">{p.user_count}</Cell>
                            <Actions>
                              {canMakePlant ? (
                                <button className="btn btn-ghost btn-sm" onClick={() => togglePlant(p)}
                                        aria-label={`${p.is_active ? 'Deactivate' : 'Activate'} ${p.name}`}>
                                  {p.is_active
                                    ? <FaToggleOn size={14} style={{ color: 'var(--ok)' }} aria-hidden="true" />
                                    : <FaToggleOff size={14} aria-hidden="true" />}
                                  {p.is_active ? 'Active' : 'Off'}
                                </button>
                              ) : (
                                <span className={`pill ${p.is_active ? 'pill-approved' : 'pill-draft'}`}>
                                  {p.is_active ? 'Active' : 'Inactive'}
                                </span>
                              )}
                            </Actions>
                          </DataRow>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </Card>
            </div>

            {/* ---------------------------------------------------------- users */}
            <Card>
              <CardHead icon={FaUsersGear} title="Users">
                {allPlants.length > 1 && (
                  <>
                    <label htmlFor="plant-filter" className="u-visually-hidden">Filter by plant</label>
                    <select
                      id="plant-filter"
                      value={filterPlant}
                      onChange={(e) => setFilterPlant(e.target.value)}
                      className="inline-select"
                    >
                      <option value="">Every plant</option>
                      {allPlants.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </>
                )}
                <span>{shownUsers.length} shown</span>
              </CardHead>

              <DataHead variant="row-user" labels={USER_COLUMNS} />
              <DataBody maxHeight="58vh">
                {shownUsers.map((u) => (
                  <DataRow variant="row-user" key={u.id}>
                    <Cell className="cell-person" title={u.name}>
                      <b className="truncate">{u.name}</b>
                      {u.designation && <small className="truncate dim">{u.designation}</small>}
                    </Cell>
                    <Cell label="Username" className="truncate mono">{u.genid}</Cell>
                    <Cell label="Role"><RolePill role={u.role} /></Cell>
                    <Cell label="Plant" className="truncate">
                      {u.plant_name || u.company_name || 'All'}
                    </Cell>
                    <Cell label="Email" className="truncate" title={u.email_id}>{u.email_id}</Cell>
                    <Cell label="State">
                      <span className={`pill ${u.is_active ? 'pill-approved' : 'pill-draft'}`}>
                        {u.is_active ? 'Active' : 'Off'}
                      </span>
                    </Cell>
                    <Actions>
                      {u.id !== user.id && (
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleUser(u)}>
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </Actions>
                  </DataRow>
                ))}
                {shownUsers.length === 0 && (
                  <EmptyState
                    icon={FaUsersGear}
                    title="No users to show"
                    hint={filterPlant
                      ? 'No account is assigned to that plant yet.'
                      : 'Create the JSA initiator and the approvers for your plant to get started.'}
                  />
                )}
              </DataBody>
            </Card>
          </div>
        )}
      </div>

      {dialog === 'company' && (
        <CompanyDialog onClose={() => setDialog(null)} onDone={() => { setDialog(null); load() }}
                       busy={busy} setBusy={setBusy} />
      )}
      {dialog === 'plant' && (
        <PlantDialog companies={companies || []} onClose={() => setDialog(null)}
                     onDone={() => { setDialog(null); load() }} busy={busy} setBusy={setBusy} />
      )}
      {dialog === 'user' && (
        <UserDialog caps={caps} companies={companies || []} me={user}
                    onClose={() => setDialog(null)} onDone={() => { setDialog(null); load() }}
                    busy={busy} setBusy={setBusy} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ dialogs */
function CompanyDialog({ onClose, onDone, busy, setBusy }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const toast = useToast()

  const save = async () => {
    setBusy(true)
    try {
      await api.createCompany({ name, code: code || null })
      toast.ok(`${name} created.`)
      onDone()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title="New company" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || name.trim().length < 2} onClick={save}>
          <FaCirclePlus size={12} aria-hidden="true" /> Create company
        </button>
      </>
    }>
      <div className="field-block">
        <label htmlFor="co-name">Company name</label>
        <input id="co-name" value={name} autoFocus onChange={(e) => setName(e.target.value)}
               placeholder="e.g. Rane (Madras) Limited - SLD" />
      </div>
      <div className="field-block">
        <label htmlFor="co-code">Short code (optional)</label>
        <input id="co-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. RML-SLD" />
        <div className="field-hint">Used as the prefix of every JSA number raised at its plants.</div>
      </div>
    </Modal>
  )
}

function PlantDialog({ companies, onClose, onDone, busy, setBusy }) {
  const [companyId, setCompanyId] = useState(companies[0]?.id || '')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const toast = useToast()

  const save = async () => {
    setBusy(true)
    try {
      await api.createPlant({ company_id: Number(companyId), name, code: code || null })
      toast.ok(`${name} added.`)
      onDone()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title="New plant" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || !companyId || !name.trim()} onClick={save}>
          <FaCirclePlus size={12} aria-hidden="true" /> Add plant
        </button>
      </>
    }>
      <div className="field-block">
        <label htmlFor="pl-company">Company</label>
        <select id="pl-company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="field-block">
        <label htmlFor="pl-name">Plant name</label>
        <input id="pl-name" value={name} autoFocus onChange={(e) => setName(e.target.value)}
               placeholder="e.g. Varanavasi" />
      </div>
      <div className="field-block">
        <label htmlFor="pl-code">Short code (optional)</label>
        <input id="pl-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. VNS" />
      </div>
    </Modal>
  )
}

function UserDialog({ caps, companies, me, onClose, onDone, busy, setBusy }) {
  const roles = caps.roles || []
  const [form, setForm] = useState({
    role: roles[0] || '',
    name: '', genid: '', email_id: '', password: '', designation: '',
    company_id: me.company_id || companies[0]?.id || '',
    plant_id: me.plant_id || '',
    send_welcome_email: false,
  })
  const toast = useToast()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const plants = useMemo(() => {
    const c = companies.find((x) => String(x.id) === String(form.company_id))
    return c ? c.plants : []
  }, [companies, form.company_id])

  const needsPlant = PLANT_SCOPED.includes(form.role)
  const needsCompany = form.role !== 'admin'
  const lockedCompany = me.role !== 'admin'
  const lockedPlant = me.role === 'location_admin'

  const problems = []
  if (!form.role) problems.push('Pick a role.')
  if (form.name.trim().length < 2) problems.push('Enter the person’s name.')
  if (form.genid.trim().length < 3) problems.push('Username needs at least 3 characters.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_id)) problems.push('Enter a valid email address.')
  if (form.password.length < 4) problems.push('Password needs at least 4 characters.')
  if (needsCompany && !form.company_id) problems.push('Pick a company.')
  if (needsPlant && !form.plant_id) problems.push('Pick a plant.')

  const save = async () => {
    setBusy(true)
    try {
      await api.createUser({
        ...form,
        genid: form.genid.trim().toLowerCase(),
        company_id: needsCompany ? Number(form.company_id) : null,
        plant_id: needsPlant ? Number(form.plant_id) : null,
      })
      toast.ok(`${form.name} can now sign in as ${form.genid.trim().toLowerCase()}.`)
      onDone()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <Modal title="New user" onClose={onClose} wide footer={
      <>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || problems.length > 0} onClick={save}>
          {busy ? <FaSpinner className="spin" size={12} aria-hidden="true" />
                : <FaUserPlus size={12} aria-hidden="true" />}
          Create user
        </button>
      </>
    }>
      <div className="form-grid">
        <div className="field-block">
          <label htmlFor="u-role">Role</label>
          <select id="u-role" value={form.role} onChange={(e) => set('role', e.target.value)}>
            {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)}
          </select>
          <div className="field-hint">{HELP[me.role]}</div>
        </div>

        <div className="field-block">
          <label htmlFor="u-name">Full name</label>
          <input id="u-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className="field-block">
          <label htmlFor="u-genid">Username</label>
          <input id="u-genid" value={form.genid} onChange={(e) => set('genid', e.target.value)}
                 placeholder="e.g. vns.lvl1" />
          <div className="field-hint">Stored in lower case. This is what they type to sign in.</div>
        </div>

        <div className="field-block">
          <label htmlFor="u-email">Email</label>
          <input id="u-email" type="email" value={form.email_id}
                 onChange={(e) => set('email_id', e.target.value)} />
          <div className="field-hint">Approval requests go here — get it right.</div>
        </div>

        <div className="field-block">
          <label htmlFor="u-password">Password</label>
          <input id="u-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
          <div className="field-hint">They can change it once they sign in.</div>
        </div>

        <div className="field-block">
          <label htmlFor="u-desig">Designation (optional)</label>
          <input id="u-desig" value={form.designation}
                 onChange={(e) => set('designation', e.target.value)} />
        </div>

        {needsCompany && (
          <div className="field-block">
            <label htmlFor="u-company">Company</label>
            <select id="u-company" value={form.company_id} disabled={lockedCompany}
                    onChange={(e) => { set('company_id', e.target.value); set('plant_id', '') }}>
              <option value="">Select</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {needsPlant && (
          <div className="field-block">
            <label htmlFor="u-plant">Plant</label>
            <select id="u-plant" value={form.plant_id} disabled={lockedPlant}
                    onChange={(e) => set('plant_id', e.target.value)}>
              <option value="">Select</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {lockedPlant && <div className="field-hint">Fixed to your own plant.</div>}
          </div>
        )}
      </div>

      <label className="tick" style={{ marginTop: 'var(--s-3)' }}>
        <input type="checkbox" checked={form.send_welcome_email}
               onChange={() => set('send_welcome_email', !form.send_welcome_email)} />
        <span className="tickbox" aria-hidden="true">✓</span>
        <span>Email them their username and password</span>
      </label>

      {problems.length > 0 && (
        <div className="banner banner-warn" style={{ marginTop: 'var(--s-3)' }}>
          <FaTriangleExclamation size={13} aria-hidden="true" />
          <span>{problems.join(' ')}</span>
        </div>
      )}
    </Modal>
  )
}
