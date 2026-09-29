// A stand-in for supabase-js, served in place of /vendor/supabase-js-*.js when
// recording a how-to clip. Everything the app reads and writes lands in memory
// in the page: nothing leaves the machine, and there is no real account.
//
// The rows are invented: one home (Marigold House), no staff until the clip
// adds one, and the tour's checklist. No resident data exists here and Lite
// never asks for any.
//
// buildFakeClient(seed) returns the source of a script that defines
// window.supabase.createClient. seed = { user, tables }.
function buildFakeClient(seed) {
  return `(() => {
  const SEED = ${JSON.stringify(seed)};
  const DB = SEED.tables;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  const log = window.__fakeLog = [];
  const session = { access_token: 'recording', refresh_token: 'recording', token_type: 'bearer',
    expires_in: 999999, expires_at: Math.floor(Date.now() / 1000) + 999999, user: SEED.user };

  function match(row, f) {
    const v = row[f.col];
    switch (f.op) {
      case 'eq': return String(v) === String(f.val);
      case 'neq': return String(v) !== String(f.val);
      case 'is': return v === f.val || (f.val === null && v == null);
      case 'in': return f.val.map(String).includes(String(v));
      case 'gte': return v != null && v >= f.val;
      case 'lte': return v != null && v <= f.val;
      case 'gt': return v != null && v > f.val;
      case 'lt': return v != null && v < f.val;
      case 'not': return !(f.inner === 'is' ? (v === f.val || (f.val === null && v == null)) : String(v) === String(f.val));
      default: return true;
    }
  }

  class Q {
    constructor(table) { this.t = table; this.f = []; this.op = 'select'; this.one = null; this.lim = null; this.ord = null; this.ret = false; this.head = false; }
    select(cols, o) { if (this.op !== 'select') this.ret = true; if (o && o.head) this.head = true; this.countWanted = o && o.count; return this; }
    insert(rows) { this.op = 'insert'; this.rows = Array.isArray(rows) ? rows : [rows]; return this; }
    upsert(rows, o) { this.op = 'upsert'; this.rows = Array.isArray(rows) ? rows : [rows]; this.onConflict = (o && o.onConflict) || 'id'; this.ignoreDup = o && o.ignoreDuplicates; return this; }
    update(v) { this.op = 'update'; this.vals = v; return this; }
    delete() { this.op = 'delete'; return this; }
    eq(c, v) { this.f.push({ col: c, op: 'eq', val: v }); return this; }
    neq(c, v) { this.f.push({ col: c, op: 'neq', val: v }); return this; }
    is(c, v) { this.f.push({ col: c, op: 'is', val: v }); return this; }
    in(c, v) { this.f.push({ col: c, op: 'in', val: v || [] }); return this; }
    gte(c, v) { this.f.push({ col: c, op: 'gte', val: v }); return this; }
    lte(c, v) { this.f.push({ col: c, op: 'lte', val: v }); return this; }
    gt(c, v) { this.f.push({ col: c, op: 'gt', val: v }); return this; }
    lt(c, v) { this.f.push({ col: c, op: 'lt', val: v }); return this; }
    not(c, op, v) { this.f.push({ col: c, op: 'not', inner: op, val: v }); return this; }
    or() { return this; } like() { return this; } ilike() { return this; } contains() { return this; }
    filter() { return this; } match(o) { Object.entries(o || {}).forEach(([c, v]) => this.eq(c, v)); return this; }
    order(c, o) { this.ord = { c, asc: !o || o.ascending !== false }; return this; }
    limit(n) { this.lim = n; return this; } range(a, b) { this.lim = b - a + 1; return this; }
    single() { this.one = 'single'; return this; } maybeSingle() { this.one = 'maybe'; return this; }
    abortSignal() { return this; }
    run() {
      const T = DB[this.t] || (DB[this.t] = []);
      let out;
      if (this.op === 'insert' || this.op === 'upsert') {
        out = [];
        for (const r of this.rows) {
          const key = this.onConflict || 'id';
          const keys = key.split(',');
          const hit = this.op === 'upsert' ? T.find(x => keys.every(k => r[k] !== undefined && String(x[k]) === String(r[k]))) : null;
          if (hit) { if (!this.ignoreDup) Object.assign(hit, r); out.push(hit); }
          else { const row = { id: uid(), created_at: new Date().toISOString(), ...r }; T.push(row); out.push(row); }
        }
      } else {
        let rows = T.filter(r => this.f.every(f => match(r, f)));
        if (this.op === 'update') rows.forEach(r => Object.assign(r, this.vals));
        if (this.op === 'delete') { DB[this.t] = T.filter(r => !rows.includes(r)); }
        if (this.ord) { const { c, asc } = this.ord; rows = rows.slice().sort((a, b) => (a[c] == null) - (b[c] == null) || (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1)); }
        if (this.lim != null) rows = rows.slice(0, this.lim);
        out = rows;
      }
      log.push(this.op + ' ' + this.t + ' ' + out.length);
      out = JSON.parse(JSON.stringify(out));
      const count = out.length;
      if (this.head) return { data: null, error: null, count };
      if (this.one) {
        if (!out.length) return this.one === 'maybe' ? { data: null, error: null } : { data: null, error: { message: 'no rows', code: 'PGRST116' } };
        return { data: out[0], error: null, count };
      }
      if ((this.op === 'update' || this.op === 'delete') && !this.ret) return { data: null, error: null, count };
      return { data: out, error: null, count };
    }
    then(res, rej) { return new Promise(r => setTimeout(r, 40)).then(() => this.run()).then(res, rej); }
  }

  const RPC = SEED.rpc || {};
  const client = {
    from: t => new Q(t),
    rpc: (name, args) => { log.push('rpc ' + name); const q = { then: (res, rej) => Promise.resolve({ data: RPC[name] === undefined ? null : RPC[name], error: null }).then(res, rej), single: () => q, maybeSingle: () => q, select: () => q }; return q; },
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user: SEED.user }, error: null }),
      refreshSession: async () => ({ data: { session, user: SEED.user }, error: null }),
      onAuthStateChange(cb) { setTimeout(() => cb('SIGNED_IN', session), 0); return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async () => ({ error: null }), updateUser: async () => ({ data: { user: SEED.user }, error: null }),
      signInWithPassword: async () => ({ data: { session, user: SEED.user }, error: null }),
      signInWithOAuth: async () => ({ error: null }), resend: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ data: { session }, error: null }),
    },
    storage: { from: () => ({
      upload: async (p) => ({ data: { path: p }, error: null }),
      remove: async () => ({ data: [], error: null }),
      createSignedUrl: async () => ({ data: { signedUrl: 'about:blank' }, error: null }),
      createSignedUrls: async (ps) => ({ data: ps.map(p => ({ path: p, signedUrl: 'about:blank' })), error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'about:blank' } }),
      download: async () => ({ data: new Blob(['']), error: null }),
    }) },
    functions: { invoke: async () => ({ data: null, error: null }) },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }), removeChannel() {},
  };
  window.supabase = { createClient: () => client };
})();`;
}

module.exports = { buildFakeClient };
