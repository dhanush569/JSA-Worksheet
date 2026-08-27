const BASE = import.meta.env.VITE_API_BASE || ''
const TOKEN_KEY = 'jsa.token'

export const tokenStore = {
  get: () => {
    try { return window.sessionStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set: (t) => {
    try { t ? window.sessionStorage.setItem(TOKEN_KEY, t) : window.sessionStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ }
  },
}

/** Raised on 401 so the app can bounce to the sign-in screen. */
export class AuthError extends Error {}

let onUnauthorised = null
export const setUnauthorisedHandler = (fn) => { onUnauthorised = fn }

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the JSA server. Check that the backend is running on port 8020.')
  }

  if (res.status === 204) return null

  const text = await res.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = { detail: text } }
  }

  if (!res.ok) {
    const detail = data?.detail
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg || d).join('; ')
      : typeof detail === 'string' ? detail : `Request failed (${res.status})`
    if (res.status === 401) {
      onUnauthorised?.()
      throw new AuthError(message)
    }
    throw new Error(message)
  }
  return data
}

export const api = {
  health: async () => ({ database: { connected: true }, email: { configured: true } }),

  login: async (genid, password) => {
    return {
      token: 'fake-jwt-token-for-ui-demo',
      landing: '/users',
      user: {
        id: '1',
        genid: genid || 'admin.demo',
        name: 'Demo Admin User',
        role: 'admin',
        plant_id: null
      }
    };
  },
  me: async () => {
    return {
      id: '1',
      genid: 'admin.demo',
      name: 'Demo Admin User',
      role: 'admin',
      plant_id: null
    };
  },
  changePassword: (current_password, new_password) =>
    request('/api/auth/change-password', { method: 'POST', body: { current_password, new_password } }),

  companies: async () => [],
  createCompany: (body) => request('/api/org/companies', { method: 'POST', body }),
  createPlant: (body) => request('/api/org/plants', { method: 'POST', body }),
  patchPlant: (id, body) => request(`/api/org/plants/${id}`, { method: 'PATCH', body }),

  users: async () => [],
  creatableRoles: async () => ({ roles: ['company_admin', 'location_admin', 'jsa_initiator'] }),
  approvers: async () => [],
  createUser: (body) => request('/api/users', { method: 'POST', body }),
  updateUser: (id, body) => request(`/api/users/${id}`, { method: 'PUT', body }),
  deactivateUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  listWorksheets: async () => [],
  getWorksheet: async (id) => ({ id, status: 'draft', is_editable: true }),
  createWorksheet: async (body) => ({ id: Math.random().toString(36).substring(2, 9), status: 'draft', is_editable: true }),
  updateWorksheet: async (id, body) => ({ id, status: 'draft', is_editable: true }),
  deleteWorksheet: async (id) => ({}),
  duplicateWorksheet: async (id) => ({ id: Math.random().toString(36).substring(2, 9), status: 'draft', is_editable: true }),
  savePage2: async (id, body) => ({ id, status: 'draft', is_editable: true }),
  savePage3: async (id, body) => ({ id, status: 'draft', is_editable: true }),

  sendContractorCode: async (id, contractor_email) => ({ message: 'Mock code sent', email_status: 'queued', dev_code: '123456' }),
  verifyContractorCode: async (id, code) => {
    if (code !== '123456') throw new Error('Invalid code');
    return { contractor_verified: true };
  },

  submitForApproval: async (id, body) => ({ 
    id, jsa_no: `JSA-${id}`, 
    approval_steps: [{ status: 'pending', assigned_user_name: 'Plant Head (Mock)' }] 
  }),
  inbox: async () => [],
  openByToken: async (token) => ({}),
  decide: async (id, body) => ({}),
  canAct: async (id) => ({ can_act: true }),

  byLocation: async () => [],
  completed: async () => [],
  emailLog: async () => [],

  generateHazards: async (body) => {
    return {
      results: (body.steps || []).map((step) => {
        const stepLower = (step.job_step || '').toLowerCase();
        const hazards = [];
        
        if (stepLower.includes('crane') || stepLower.includes('lift') || stepLower.includes('hoist')) {
            hazards.push({ potential_hazards: 'Suspended load falling and striking personnel', control_measures: 'Ensure nobody stands under the suspended load; use tag lines to guide the load.' });
            hazards.push({ potential_hazards: 'Sling or lifting gear failure', control_measures: 'Pre-use inspection of all lifting tackles (slings, D-shackles) by a competent person.' });
            hazards.push({ potential_hazards: 'Crane tipping or instability', control_measures: 'Ensure crane is placed on firm, level ground with outriggers fully extended.' });
            hazards.push({ potential_hazards: 'Pinch points and hand crushing during rigging', control_measures: 'Keep hands away from pinch points; wear impact-resistant gloves.' });
        }
        else if (stepLower.includes('cut') || stepLower.includes('blade') || stepLower.includes('grind')) {
            hazards.push({ potential_hazards: 'Lacerations or amputations from rotating blade', control_measures: 'Ensure machine guards are properly installed and never bypassed.' });
            hazards.push({ potential_hazards: 'Flying metal debris striking face or eyes', control_measures: 'Wear high-impact face shield and safety goggles.' });
            hazards.push({ potential_hazards: 'Inhalation of metal dust', control_measures: 'Use local exhaust ventilation (LEV) and wear N95 mask.' });
            hazards.push({ potential_hazards: 'Vibration and ergonomic strain', control_measures: 'Take frequent breaks and use anti-vibration gloves.' });
        }
        else if (stepLower.includes('electric') || stepLower.includes('wire') || stepLower.includes('panel')) {
            hazards.push({ potential_hazards: 'Fatal electrocution from live parts', control_measures: 'Strictly follow Lockout/Tagout (LOTO) procedure; verify zero energy state.' });
            hazards.push({ potential_hazards: 'Arc flash explosion', control_measures: 'Wear specific Arc Flash PPE (Category 2 or higher) based on hazard analysis.' });
            hazards.push({ potential_hazards: 'Trip hazards from scattered cables', control_measures: 'Route temporary cables safely and use cable protectors.' });
        }
        else {
            hazards.push({ potential_hazards: 'Slips, trips, and falls on the same level', control_measures: 'Maintain good housekeeping; clear all tripping hazards immediately.' });
            hazards.push({ potential_hazards: 'Ergonomic stress or muscle strain', control_measures: 'Maintain proper posture; avoid awkward twists and heavy manual lifting.' });
            hazards.push({ potential_hazards: 'Unexpected equipment startup', control_measures: 'Isolate energy sources and verify machine is safe before interacting.' });
            hazards.push({ potential_hazards: 'Cuts, scrapes, and bruises to hands', control_measures: 'Wear proper cut-resistant gloves suitable for the task.' });
        }

        return { seq_no: step.seq_no, hazards };
      })
    }
  },
}
