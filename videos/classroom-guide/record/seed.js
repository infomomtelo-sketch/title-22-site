// The invented trainer account the Classroom guide is recorded in.
const USER_ID = '7b1f3c52-2d4e-4a6b-9c8d-1e2f3a4b5c6d';
const iso = n => new Date(Date.now() + n * 86400000).toISOString();
const user = {
  id: USER_ID, aud: 'authenticated', role: 'authenticated',
  email: 'dana@valleycare.example', email_confirmed_at: iso(-3),
  user_metadata: { full_name: 'Dana Whitfield' }, app_metadata: { provider: 'email' }, created_at: iso(-3),
};
const { compliance_tasks } = require('../../tour/record/fixtures');
// The requirement list the app builds a home's checklist from: the tour's own
// items, so the practice home gets the same checklist the other clips show.
const checklist_items = compliance_tasks.map((t, i) => ({ id: 'ci-' + i, title: t.title, category: t.category, frequency: 'annual', requirement_code: null, facility_types: null }));
const seed = {
  user,
  tables: {
    profiles: [{ id: USER_ID, email: user.email, title22_plan: 'edu', title22_trial_ends_at: null,
      title22_plan_expires_at: null, title22_subscription_id: null, created_at: iso(-3) }],
    checklist_items, subscriptions: [], facilities: [], facility_members: [], facility_invites: [], staff: [], documents: [], incidents: [],
    residents: [], medications: [], mar_entries: [], compliance_tasks: [], events: [], audit_log: [], invites: [], launch_checklist: [],
    title22_lessons: [], title22_lesson_questions: [], title22_lesson_attempts: [], staff_trainings: [],
  },
  rpc: { title22_member_entitlement: null, title22_accept_my_invite: null },
};
module.exports = { seed, USER_ID };
