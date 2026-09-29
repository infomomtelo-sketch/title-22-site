// The invented account and home the documents clip is recorded in.
// One home, no staff yet, the tour's checklist. No resident data.
const { compliance_tasks } = require('../../tour/record/fixtures');

const USER_ID = '7b1f3c52-2d4e-4a6b-9c8d-1e2f3a4b5c6d';
const FACILITY_ID = '5e8a2c14-7b3d-4f6e-8a1c-9d0b2e4f6a81';
const iso = n => new Date(Date.now() + n * 86400000).toISOString();

const user = {
  id: USER_ID, aud: 'authenticated', role: 'authenticated',
  email: 'alex@marigoldhouse.example', email_confirmed_at: iso(-60),
  user_metadata: { full_name: 'Alex Morgan' }, app_metadata: { provider: 'email' },
  created_at: iso(-60),
};

const facility = {
  id: FACILITY_ID, user_id: USER_ID, name: 'Marigold House', facility_type: 'rcfe',
  license_number: '', capacity: 6, address: 'Fresno, CA', is_demo: false, created_at: iso(-60),
};

const seed = {
  user,
  tables: {
    profiles: [{ id: USER_ID, email: user.email, title22_plan: 'lite', title22_trial_ends_at: null,
      title22_plan_expires_at: null, title22_subscription_id: 'sub_recording', created_at: iso(-60) }],
    subscriptions: [{ id: 's1', user_id: USER_ID, plan: 'lite', status: 'active', current_period_end: iso(25) }],
    facilities: [facility],
    facility_members: [],
    staff: [],
    documents: [],
    incidents: [],
    compliance_tasks: compliance_tasks.map(t => ({ ...t, facility_id: FACILITY_ID })),
    events: [], audit_log: [], invites: [], launch_checklist: [],
  },
  rpc: {
    title22_member_entitlement: null,
    title22_accept_my_invite: null,
  },
};

module.exports = { seed, USER_ID, FACILITY_ID };
