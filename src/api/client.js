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

let mockCompanies = [
  { id: 1, name: 'Rane (Madras) Limited - SLD', code: 'RML-SLD', plants: [
    { id: 101, name: 'Varanavasi', code: 'VNS', is_active: true, user_count: 3 },
    { id: 102, name: 'Pondicherry', code: 'PDY', is_active: true, user_count: 1 }
  ]}
];
let mockUsers = [
  { id: 1, name: 'Administrator', genid: 'admin', role: 'admin', email_id: 'admin@rane.com', is_active: true, company_id: null, plant_id: null, company_name: null, plant_name: null },
  { id: 2, name: 'Company Admin', genid: 'company.admin', role: 'company_admin', email_id: 'cadmin@rane.com', is_active: true, company_id: 1, plant_id: null, company_name: 'Rane (Madras) Limited - SLD', plant_name: null },
  { id: 3, name: 'Location Admin', genid: 'vns.location.admin', role: 'location_admin', email_id: 'ladmin@rane.com', is_active: true, company_id: 1, plant_id: 101, company_name: 'Rane (Madras) Limited - SLD', plant_name: 'Varanavasi' },
  { id: 4, name: 'JSA Initiator', genid: 'vns.initiator', role: 'jsa_initiator', email_id: 'initiator@rane.com', is_active: true, company_id: 1, plant_id: 101, company_name: 'Rane (Madras) Limited - SLD', plant_name: 'Varanavasi' },
  { id: 5, name: 'Level 1 Approver', genid: 'vns.lvl1', role: 'lvl1_approver', email_id: 'lvl1@rane.com', is_active: true, company_id: 1, plant_id: 101, company_name: 'Rane (Madras) Limited - SLD', plant_name: 'Varanavasi' },
  { id: 6, name: 'Level 2 Approver', genid: 'vns.lvl2', role: 'lvl2_approver', email_id: 'lvl2@rane.com', is_active: true, company_id: 1, plant_id: 101, company_name: 'Rane (Madras) Limited - SLD', plant_name: 'Varanavasi' },
  { id: 7, name: 'Plant Head', genid: 'vns.planthead', role: 'ph_approver', email_id: 'ph@rane.com', is_active: true, company_id: 1, plant_id: 101, company_name: 'Rane (Madras) Limited - SLD', plant_name: 'Varanavasi' },
];

export const api = {
  health: async () => ({ database: { connected: true }, email: { configured: true } }),

  login: async (genid, password) => {
    const user = mockUsers.find(u => u.genid === genid) || {
      id: Date.now(), genid: genid || 'admin.demo', name: 'Demo Admin User', role: 'admin', plant_id: null
    };
    const isManager = ['admin', 'company_admin', 'location_admin'].includes(user.role);
    return {
      token: user.genid,
      landing: isManager ? '/users' : '/',
      user: user
    };
  },
  me: async () => {
    const token = tokenStore.get();
    return mockUsers.find(u => u.genid === token) || mockUsers[0];
  },
  changePassword: (current_password, new_password) =>
    request('/api/auth/change-password', { method: 'POST', body: { current_password, new_password } }),

  companies: async () => mockCompanies,
  createCompany: async (body) => {
    const newCompany = { id: Date.now(), name: body.name, code: body.code, plants: [] };
    mockCompanies.push(newCompany);
    return newCompany;
  },
  createPlant: async (body) => {
    const company = mockCompanies.find(c => c.id === body.company_id);
    if (company) {
      company.plants.push({ id: Date.now(), name: body.name, code: body.code, is_active: true, user_count: 0 });
    }
    return {};
  },
  patchPlant: async (id, body) => {
    for (const c of mockCompanies) {
      const p = c.plants.find(p => p.id === id);
      if (p) Object.assign(p, body);
    }
    return {};
  },

  users: async () => mockUsers,
  creatableRoles: async () => {
    const token = tokenStore.get();
    const user = mockUsers.find(u => u.genid === token) || mockUsers[0];
    if (user.role === 'admin') return { roles: ['admin', 'company_admin', 'location_admin', 'jsa_initiator', 'lvl1_approver', 'lvl2_approver', 'ph_approver'] };
    if (user.role === 'company_admin') return { roles: ['location_admin'] };
    if (user.role === 'location_admin') return { roles: ['jsa_initiator', 'lvl1_approver', 'lvl2_approver', 'ph_approver'] };
    return { roles: [] };
  },
  approvers: async (role, plantId) => mockUsers.filter(u => u.role === role && String(u.plant_id) === String(plantId)),
  createUser: async (body) => {
    const c = mockCompanies.find(c => c.id === body.company_id);
    const p = c?.plants.find(p => p.id === body.plant_id);
    const newUser = { 
      id: Date.now(), 
      ...body, 
      is_active: true, 
      company_name: c?.name, 
      plant_name: p?.name 
    };
    mockUsers.push(newUser);
    if (p) p.user_count++;
    return newUser;
  },
  updateUser: async (id, body) => {
    const u = mockUsers.find(u => u.id === id);
    if (u) Object.assign(u, body);
    return {};
  },
  deactivateUser: async (id) => {
    const u = mockUsers.find(u => u.id === id);
    if (u) u.is_active = false;
    return {};
  },

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
