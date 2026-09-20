// Fixture database for recording the guided tour offline.
//
// Egress to Supabase is blocked here, so every PostgREST call is answered from
// this file. Shapes are lifted from the app's own seedDemoData (index.html
// ~5191) so the rows are the ones the product itself invents.
//
// NO RESIDENT DATA. No residents, medications, mar_entries or daily_logs
// tables are served, and the app in Lite never asks for them -- showMAR is
// false, so those queries are not made and t22Fetch would refuse them anyway.
// Staff are employment records, and these five are fictional.

const dISO = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const iso = n => new Date(Date.now() + n * 86400000).toISOString();

const FACILITY_ID = '3f7c1e90-5a21-4d88-9b0e-2c6a4f1d8e33';

const facility = {
  id: FACILITY_ID,
  user_id: '9d2b7a44-1c33-4e5f-8a90-6b1e0d7c2f55',
  name: 'Marigold House',
  facility_type: 'rcfe',
  license_number: '197600481',
  capacity: 6,
  address: '412 Alder Court, Fresno, CA 93704',
  administrator_name: 'Alex Morgan',
  administrator_cert_number: 'RCFE-204118',
  administrator_cert_expiry: dISO(240),
  is_demo: true,
  created_at: iso(-420),
};

const S = (id, name, role, hire, tbDue, cprExp, faExp) => ({
  id, facility_id: FACILITY_ID, full_name: name, name, role,
  hire_date: hire, phone: '(559) 555-0100', active: true, status: 'active',
  tb_test_date: dISO(-200), tb_test_due: tbDue, tb_test_expiry: tbDue,
  cpr_cert_date: dISO(-300), cpr_cert_expiry: cprExp,
  first_aid_cert_date: dISO(-300), first_aid_cert_expiry: faExp,
  livescan_cleared: true, livescan_date: dISO(-320),
  mandated_reporter_completed: true, mandated_reporter_date: dISO(-310),
  initial_training_complete: true, initial_training_completed: true,
  initial_training_hours: 40,
});

// One expired TB test and one CPR card inside 30 days, so the alert panel and
// the expiry banner have something real to point at -- that is the whole
// subject of tour step 2.
const staff = [
  S('a1000000-0000-4000-8000-000000000001', 'Maria Lopez',   'administrator',   dISO(-700), dISO(160), dISO(200), dISO(200)),
  S('a1000000-0000-4000-8000-000000000002', 'James Carter',  'lead_caregiver',  dISO(-500), dISO(120), dISO(19),  dISO(90)),
  S('a1000000-0000-4000-8000-000000000003', 'Priya Patel',   'med_tech',        dISO(-400), dISO(90),  dISO(150), dISO(150)),
  S('a1000000-0000-4000-8000-000000000004', 'Daniel Reyes',  'caregiver',       dISO(-250), dISO(-11), dISO(180), dISO(180)),
  S('a1000000-0000-4000-8000-000000000005', 'Sofia Ivanova', 'night_caregiver', dISO(-100), dISO(200), dISO(220), dISO(220)),
];

// A believable checklist: a facility that has done most of the work and has a
// handful of things outstanding, two of them overdue. Titles are real Title 22
// subject matter phrased as the app phrases them -- none of them states a
// deadline, a duration or what an inspector accepts.
const TASKS = [
  ['RCFE Administrator Certificate Current',        'administration', true,  240],
  ['Facility license posted in a public area',      'administration', true,  120],
  ['Emergency telephone numbers posted',            'administration', true,  180],
  ['Liability insurance certificate on file',       'administration', true,  95],
  ['Admission agreement template on file',          'administration', true,  150],
  ['Staff duty roster current',                     'administration', false, 6],
  ['Fire clearance current',                        'safety',         true,  210],
  ['Fire drill log up to date',                     'safety',         false, -3],
  ['Emergency disaster plan on file',               'safety',         true,  300],
  ['First aid supplies stocked',                    'safety',         true,  60],
  ['Smoke detectors tested',                        'safety',         true,  45],
  ['Water temperature log current',                 'safety',         false, 11],
  ['Exit routes unobstructed',                      'safety',         true,  30],
  ['TB clearance on file for every staff member',   'staffing',       false, -9],
  ['Live Scan clearance on file for every staff',   'staffing',       true,  365],
  ['CPR certification current for staff on duty',   'staffing',       false, 19],
  ['First aid certification current',               'staffing',       true,  90],
  ['Mandated reporter training documented',         'staffing',       true,  200],
  ['Initial 40-hour training documented',           'training',       true,  160],
  ['Annual 20-hour in-service documented',          'training',       false, 34],
  ['Dementia training documented where required',   'training',       true,  140],
  ['Personnel file complete for every staff member','staffing',       true,  75],
  ['Job descriptions on file',                      'staffing',       true,  280],
  ['Staff orientation records on file',             'training',       true,  190],
  ['Menu planning records on file',                 'food',           true,  25],
  ['Food storage temperatures logged',              'food',           true,  14],
  ['Kitchen sanitation check complete',             'food',           false, 4],
  ['Seven-day food supply on hand',                 'food',           true,  40],
  ['Incident reports filed as required',            'records',        true,  55],
  ['Facility register current',                     'records',        true,  35],
  ['Fire and disaster drill records retained',      'records',        true,  85],
  ['Staff time records retained',                   'records',        true,  110],
  ['Maintenance log current',                       'maintenance',    true,  50],
  ['Pest control service records on file',          'maintenance',    true,  130],
  ['Water heater safety check complete',            'maintenance',    false, 22],
  ['Grounds and walkways maintained',               'maintenance',    true,  70],
  ['Linens and bedding inventory adequate',         'maintenance',    true,  100],
];

const compliance_tasks = TASKS.map(([title, category, completed, dueIn], i) => ({
  id: 'c1000000-0000-4000-8000-' + String(100000000000 + i).slice(-12),
  facility_id: FACILITY_ID,
  checklist_item_id: 'b1000000-0000-4000-8000-' + String(200000000000 + i).slice(-12),
  title, category, completed,
  completed_at: completed ? iso(-Math.floor(Math.random() * 40) - 1) : null,
  priority: dueIn < 0 ? 'high' : 'medium',
  due_date: dISO(dueIn),
  citation: null,
}));

const documents = [
  ['Fire clearance', 'safety', -210],
  ['Liability insurance certificate', 'administration', -95],
  ['Facility license', 'administration', -420],
  ['Emergency disaster plan', 'safety', -300],
  ['Administrator certificate', 'staffing', -120],
  ['Live Scan clearance - M. Lopez', 'staffing', -320],
].map(([name, category, ago], i) => ({
  id: 'd1000000-0000-4000-8000-' + String(300000000000 + i).slice(-12),
  facility_id: FACILITY_ID,
  resident_id: null,
  name, title: name, document_name: name, category, slot: null,
  file_path: FACILITY_ID + '/' + i + '.pdf',
  uploaded_at: iso(ago), created_at: iso(ago),
  expiry_date: null,
}));

const incidents = [
  {
    id: 'e1000000-0000-4000-8000-000000000001',
    facility_id: FACILITY_ID, resident_id: null,
    incident_type: 'fall', occurred_at: iso(-12),
    location: 'Hallway outside Room 3',
    description: 'Unwitnessed fall found at 06:40 during rounds. No injury observed. Physician and responsible party notified. Floor checked for hazards.',
    action_taken: 'Reviewed at staff meeting; night lighting increased in the hallway.',
    reported_to_licensing: true, created_at: iso(-12),
  },
  {
    id: 'e1000000-0000-4000-8000-000000000002',
    facility_id: FACILITY_ID, resident_id: null,
    incident_type: 'medication', occurred_at: iso(-31),
    location: 'Medication room',
    description: 'Dose found unadministered at shift change. Physician notified, no adverse effect.',
    action_taken: 'Shift handover checklist updated.',
    reported_to_licensing: false, created_at: iso(-31),
  },
];

const facility_members = [
  { id: 'f1000000-0000-4000-8000-000000000001', facility_id: FACILITY_ID,
    user_id: '9d2b7a44-1c33-4e5f-8a90-6b1e0d7c2f55', role: 'administrator',
    email: 'alex@marigoldhouse.example', status: 'active', created_at: iso(-420) },
  { id: 'f1000000-0000-4000-8000-000000000002', facility_id: FACILITY_ID,
    user_id: '9d2b7a44-1c33-4e5f-8a90-6b1e0d7c2f56', role: 'supervisor',
    email: 'james@marigoldhouse.example', status: 'active', created_at: iso(-380) },
  { id: 'f1000000-0000-4000-8000-000000000003', facility_id: FACILITY_ID,
    user_id: '9d2b7a44-1c33-4e5f-8a90-6b1e0d7c2f57', role: 'caregiver',
    email: 'priya@marigoldhouse.example', status: 'active', created_at: iso(-300) },
];

// Tables the app may ask for that should simply come back empty.
const EMPTY = ['residents', 'medications', 'mar_entries', 'daily_logs', 'audit_log',
  'events', 'launch_checklist', 'subscriptions', 'profiles', 'invites',
  'title22_trainers', 'title22_lessons', 'checklist_items', 'training_staff',
  'staff_trainings', 'training_events', 'training_trainer'];

const TABLES = { facilities: [facility], staff, compliance_tasks, documents, incidents, facility_members };

// PostgREST-ish: honour eq./gte. filters loosely and `select=count` headers not
// at all -- the app only needs the rows.
function rowsFor(pathname, search) {
  const table = pathname.replace(/^\/rest\/v1\//, '').split('?')[0];
  if (TABLES[table]) {
    let rows = TABLES[table];
    const p = new URLSearchParams(search);
    for (const [k, v] of p) {
      if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
      const m = /^(eq|gte|lte|gt|lt|is|neq)\.(.*)$/.exec(v);
      if (!m) continue;
      const [, op, raw] = m;
      const want = raw === 'true' ? true : raw === 'false' ? false : raw === 'null' ? null : raw;
      rows = rows.filter(r => {
        const got = r[k];
        switch (op) {
          case 'eq': return String(got) === String(want) || got === want;
          case 'neq': return String(got) !== String(want);
          case 'is': return got === want;
          case 'gte': return got != null && String(got) >= String(want);
          case 'lte': return got != null && String(got) <= String(want);
          case 'gt': return got != null && String(got) > String(want);
          case 'lt': return got != null && String(got) < String(want);
        }
        return true;
      });
    }
    const lim = p.get('limit');
    if (lim) rows = rows.slice(0, parseInt(lim, 10));
    return rows;
  }
  if (EMPTY.includes(table)) return [];
  return [];
}

module.exports = { rowsFor, FACILITY_ID, facility, staff, compliance_tasks, TASKS };
