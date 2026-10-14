/* Belka – interfejs, kombinacje obciążeń, wykresy i sprawdzenia. */
(function () {
  'use strict';
  const S = window.Sections, Solver = window.BeamSolver;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const SUPPORTS = {
    fixed: 'Utwierdzenie',
    pin: 'Przegubowa nieprzesuwna',
    roller: 'Przegubowa przesuwna',
    none: 'Brak (koniec wolny)',
  };
  const GROUP_COLORS = ['#d97706', '#db2777', '#0891b2', '#7c3aed', '#65a30d', '#e11d48', '#0d9488'];
  const G_COLOR = '#64748b';
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const TIMBER_H = { solid: [100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300], glulam: [] };
  for (let h = 120; h <= 1200; h += 40) TIMBER_H.glulam.push(h);

  function nf(v, d = 2) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -d)) v = 0;
    return v.toLocaleString('pl-PL', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  const num = v => { const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : 0; };

  // ---------- stan ----------
  const LD = (t, g, sp, a, c, v1, v2) => ({ t, g, sp, a, c, v1, v2: v2 === undefined ? v1 : v2 });
  const RC0 = { conc: 'C30/37', fyk: 500, cov: 20, phi: 10 };
  const timberSec = (cls, b, h) => Object.assign({ kind: 'timber', timberClass: cls, b, h, sc: 1, family: 'IPE', profile: 'IPE 200', grade: 'S235', E: 11000, I: 5000, W: 400, fd: 0, gk: 0 }, RC0);
  const steelSec = (fam, prof, grade) => Object.assign({ kind: 'steel', timberClass: 'C24', b: 100, h: 200, sc: 1, family: fam, profile: prof, grade, E: 210000, I: 5000, W: 400, fd: 0, gk: 0 }, RC0);
  const rcSec = (conc, fyk, b, h) => Object.assign(timberSec('C24', b, h), { kind: 'rc', conc, fyk });
  const nodesOf = list => list.map(s => (typeof s === 'string' ? { s, h: false } : s));
  const defSet = () => ({ gG: 1.35, gQ: 1.5, wlim: 250 });
  const grp = (name, dur, psi2, pat = true) => ({ name, dur, psi2, pat });

  const EXAMPLES = {
    simple: {
      spans: [4.5], nodes: nodesOf(['pin', 'roller']), sec: timberSec('C24', 75, 200), sw: true,
      groups: [grp('Użytkowe', 'medium', 0.3)],
      loads: [LD('q', 0, 0, 0, 0, 0.9), LD('q', 1, 0, 0, 0, 1.2)], set: defSet(),
    },
    cantilever: {
      spans: [1.8], nodes: nodesOf(['fixed', 'none']), sec: timberSec('C24', 100, 200), sw: true,
      groups: [grp('Użytkowe', 'medium', 0.3)],
      loads: [LD('q', 0, 0, 0, 0, 1.0), LD('P', 1, 0, 1.8, 0, 2.0)], set: defSet(),
    },
    overhang: {
      spans: [5, 1.5], nodes: nodesOf(['pin', 'roller', 'none']), sec: timberSec('C24', 100, 240), sw: true,
      groups: [grp('Użytkowe', 'medium', 0.3)],
      loads: [LD('q', 0, -1, 0, 0, 2.0), LD('q', 1, -1, 0, 0, 2.5)], set: defSet(),
    },
    cont3: {
      spans: [4, 5, 4], nodes: nodesOf(['pin', 'pin', 'pin', 'roller']), sec: timberSec('GL24h', 120, 320), sw: true,
      groups: [grp('Użytkowe', 'medium', 0.3), grp('Śnieg', 'short', 0, false)],
      loads: [LD('q', 0, -1, 0, 0, 4.0), LD('q', 1, -1, 0, 0, 5.0), LD('q', 2, -1, 0, 0, 2.0)], set: defSet(),
    },
    fixed: {
      spans: [6], nodes: nodesOf(['fixed', 'fixed']), sec: steelSec('IPE', 'IPE 240', 'S235'), sw: true,
      groups: [grp('Użytkowe', 'medium', 0.3)],
      loads: [LD('q', 0, 0, 0, 0, 8), LD('P', 1, 0, 3, 0, 20)], set: defSet(),
    },
    gerber: {
      spans: [5, 1.5, 4], nodes: [{ s: 'pin', h: false }, { s: 'roller', h: false }, { s: 'none', h: true }, { s: 'roller', h: false }],
      sec: steelSec('IPE', 'IPE 220', 'S235'), sw: true,
      groups: [grp('Użytkowe', 'medium', 0.3)],
      loads: [LD('q', 0, -1, 0, 0, 3), LD('P', 1, 2, 2, 0, 15)], set: defSet(),
    },
    steel: {
      spans: [6], nodes: nodesOf(['pin', 'roller']), sec: steelSec('IPE', 'IPE 270', 'S235'), sw: true,
      groups: [grp('Użytkowe', 'medium', 0.3)],
      loads: [LD('q', 0, 0, 0, 0, 10), LD('q', 1, 0, 0, 0, 12)], set: defSet(),
    },
    slab: {
      spans: [2.88, 2.88, 2.88, 2.88, 2.88], nodes: nodesOf(['pin', 'roller', 'roller', 'roller', 'roller', 'roller']),
      sec: rcSec('C30/37', 440, 1000, 100), sw: false, groups: [], loads: [], set: defSet(), zs: S.defaultZs(), applyZs: true,
    },
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  let state = loadState();

  function loadState() {
    try {
      if (location.hash.length > 1) {
        const s = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
        if (s && Array.isArray(s.spans)) return normalize(s);
      }
    } catch (e) { /* zły link – pomiń */ }
    try {
      const s = JSON.parse(localStorage.getItem('belka-state'));
      if (s && Array.isArray(s.spans)) return normalize(s);
    } catch (e) { /* brak dostępu do pamięci */ }
    return clone(EXAMPLES.cont3);
  }
  function normalize(s) {
    const d = clone(EXAMPLES.simple);
    s.sec = Object.assign(d.sec, s.sec || {});
    s.set = Object.assign(defSet(), s.set || {});
    s.groups = s.groups || [];
    s.loads = s.loads || [];
    while (s.nodes.length < s.spans.length + 1) s.nodes.push({ s: 'pin', h: false });
    s.nodes.length = s.spans.length + 1;
    if (s.sw === undefined) s.sw = true;
    s.zs = Object.assign(S.defaultZs(), s.zs || {});
    return s;
  }
  function save() {
    const json = JSON.stringify(state);
    try { localStorage.setItem('belka-state', json); } catch (e) { /* tryb prywatny */ }
    try { history.replaceState(null, '', '#' + btoa(unescape(encodeURIComponent(json)))); } catch (e) { /* ignoruj */ }
  }

  // ---------- zestawienie obciążeń stropu ----------
  const r3 = v => Math.round(v * 1000) / 1000;
  // grubość warstwy „płyta” bierze się z przekroju żelbetowego
  const layerT = (st, L) => (L.slab && st.sec.kind === 'rc' ? num(st.sec.h) / 1000 : num(L.t));
  const layerGk = (st, L) => (layerT(st, L) > 0 && num(L.y) > 0 ? layerT(st, L) * num(L.y) : num(L.v));
  function zsTotals(st) {
    const z = st.zs;
    const gk = z.rows.reduce((a, L) => a + layerGk(st, L), 0);
    const qk = num(z.qk);
    const gG = num(st.set.gG) || 1.35, gQ = num(st.set.gQ) || 1.5;
    return { gk, qk, gG, gQ, gd: gk * gG, qd: qk * gQ, bw: num(z.bw) || 1 };
  }
  const hasAuto = st => st.loads.some(L => L.auto);
  // Zamienia zestawienie na obciążenia belki: G i grupa zmienna „osobno w przęsłach”
  function applyZs(st) {
    const t = zsTotals(st);
    const use = S.USES[st.zs.use] || S.USES.wlasne;
    const gname = st.zs.use === 'wlasne' ? 'Użytkowe' : 'Użytkowe – ' + use[0].replace(/ \(.*\)$/, '');
    let gi = st.groups.findIndex(g => g.auto);
    if (gi < 0) { st.groups.push(Object.assign(grp(gname, 'medium', use[2], true), { auto: true })); gi = st.groups.length - 1; }
    else Object.assign(st.groups[gi], { name: gname, psi2: use[2] });
    st.loads = st.loads.filter(L => !L.auto);
    st.loads.unshift(Object.assign(LD('q', 0, -1, 0, 0, r3(t.gk * t.bw)), { auto: true }),
      Object.assign(LD('q', gi + 1, -1, 0, 0, r3(t.qk * t.bw)), { auto: true }));
    st.sw = false; // ciężar płyty jest w zestawieniu
  }

  // ---------- model obliczeniowy ----------
  function buildModel(st) {
    const sec = S.sectionProps(st.sec);
    const off = [0];
    st.spans.forEach(L => off.push(off[off.length - 1] + num(L)));
    const Ltot = off[off.length - 1];
    const nSp = st.spans.length;
    const spanOf = x => { for (let s = 0; s < nSp; s++) if (x <= off[s + 1] + 1e-9) return s; return nSp - 1; };

    // przypadki bazowe: [G, ...podprzypadki grup zmiennych]
    const subs = [{ g: 0, span: null }];
    const subIdx = st.groups.map((gr, k) => {
      const list = [];
      const n = gr.pat ? nSp : 1;
      for (let s = 0; s < n; s++) { list.push(subs.length); subs.push({ g: k + 1, span: gr.pat ? s : null }); }
      return list;
    });
    const cases = subs.map(() => []);
    const drawLoads = [];
    if (st.sw && sec.gk > 0 && Ltot > 0) {
      const ld = { type: 'dist', x1: 0, x2: Ltot, q1: sec.gk, q2: sec.gk };
      cases[0].push(ld);
      drawLoads.push(Object.assign({ g: 0, sw: true }, ld));
    }
    st.loads.forEach(L => {
      const g = Math.max(0, Math.min(st.groups.length, L.g | 0));
      const sp = L.sp | 0;
      const whole = sp < 0 || sp >= nSp;
      const base = whole ? 0 : off[sp];
      const len = whole ? Ltot : num(st.spans[sp]);
      const a = Math.min(Math.max(num(L.a), 0), len);
      let ld;
      if (L.t === 'P') ld = { type: 'point', x: base + a, P: num(L.v1) };
      else if (L.t === 'M') ld = { type: 'moment', x: base + a, M: num(L.v1) };
      else {
        const c = num(L.c) > 0 ? num(L.c) : len - a;
        const x2 = Math.min(base + a + c, Ltot);
        if (x2 - (base + a) <= 1e-9) return;
        ld = { type: 'dist', x1: base + a, x2, q1: num(L.v1), q2: num(L.v2) };
      }
      drawLoads.push(Object.assign({ g }, ld));
      if (g === 0) { cases[0].push(ld); return; }
      const gr = st.groups[g - 1];
      const idx = subIdx[g - 1];
      if (!gr.pat) { cases[idx[0]].push(ld); return; }
      // układ szachownicowy: podział obciążenia na przęsła
      if (ld.type !== 'dist') { cases[idx[spanOf(ld.x)]].push(ld); return; }
      for (let s = 0; s < nSp; s++) {
        const a1 = Math.max(ld.x1, off[s]), a2 = Math.min(ld.x2, off[s + 1]);
        if (a2 - a1 <= 1e-9) continue;
        const qa = x => ld.q1 + (ld.q2 - ld.q1) * (x - ld.x1) / (ld.x2 - ld.x1);
        cases[idx[s]].push({ type: 'dist', x1: a1, x2: a2, q1: qa(a1), q2: qa(a2) });
      }
    });
    return {
      sec, off, Ltot, subs, subIdx, cases, drawLoads,
      spans: st.spans.map(num),
      nodes: st.nodes.map((n, i) => ({
        support: n.s === 'roller' ? 'pin' : n.s,
        hinge: !!n.h && i > 0 && i < st.nodes.length - 1 && n.s !== 'fixed',
      })),
    };
  }

  // Obwiednia: stałe·G + Σ max/min(współczynnik_i · Q_i, 0) po wybranych podprzypadkach
  function envelope(arrs, cG, coefs, allowed) {
    const n = arrs[0].length;
    const max = new Float64Array(n), min = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let base = cG * arrs[0][i], up = 0, dn = 0;
      for (let k = 1; k < arrs.length; k++) {
        if (allowed && !allowed[k]) continue;
        const v = coefs[k] * arrs[k][i];
        if (v > 0) up += v; else dn += v;
      }
      max[i] = base + up; min[i] = base + dn;
    }
    return { max, min };
  }
  function sumCases(arrs, ks, c = 1) {
    const n = arrs[0].length, out = new Float64Array(n);
    for (const k of ks) for (let i = 0; i < n; i++) out[i] += c * arrs[k][i];
    return { max: out, min: out };
  }

  function compute(st) {
    const model = buildModel(st);
    const sol = Solver.solve({ spans: model.spans, nodes: model.nodes, EI: model.sec.EI, cases: model.cases });
    if (!sol.ok) return { ok: false, error: sol.error, model };
    const set = st.set;
    const gG = num(set.gG) || 1.35, gQ = num(set.gQ) || 1.5;
    const nC = model.cases.length;
    const Ms = sol.cases.map(c => c.M), Vs = sol.cases.map(c => c.V), Ws = sol.cases.map(c => c.w);
    const qCoef = c => model.subs.map((_, k) => (k === 0 ? 1 : c));
    const sec = model.sec;
    const isTimber = sec.kind === 'timber';
    const sc = Math.min(3, Math.max(1, st.sec.sc | 0 || 1));
    const kdef = S.KDEF[sc - 1];
    const res = { ok: true, model, sol, gG, gQ, kdef, isTimber };

    res.views = {};
    res.views.uls = {
      label: `Obwiednia SGN (${nf(gG)}·G + ${nf(gQ)}·Q)`,
      M: envelope(Ms, gG, qCoef(gQ)), V: envelope(Vs, gG, qCoef(gQ)),
      w: envelope(Ws, 1, qCoef(1)), env: true,
    };
    res.views.sls = {
      label: 'Obwiednia charakterystyczna (G + Q)',
      M: envelope(Ms, 1, qCoef(1)), V: envelope(Vs, 1, qCoef(1)), w: envelope(Ws, 1, qCoef(1)), env: true,
    };
    res.views.G = { label: 'Tylko G – stałe (charakterystyczne)', M: sumCases(Ms, [0]), V: sumCases(Vs, [0]), w: sumCases(Ws, [0]) };
    st.groups.forEach((gr, k) => {
      const ks = model.subIdx[k];
      res.views['Q' + k] = {
        label: `Tylko Q${k + 1} – ${gr.name || 'zmienne'} (charakterystyczne, pełne)`,
        M: sumCases(Ms, ks), V: sumCases(Vs, ks), w: sumCases(Ws, ks),
      };
    });
    if (isTimber) {
      const fc = model.subs.map((s, k) => (k === 0 ? 1 + kdef : 1 + num(st.groups[s.g - 1].psi2) * kdef));
      res.wfin = envelope(Ws, 1 + kdef, fc);
      res.views.uls.wfin = res.views.sls.wfin = res.wfin;
    }

    // reakcje
    const Rv = sol.cases.map(c => c.R.map(r => r.R)), Rm = sol.cases.map(c => c.R.map(r => r.M));
    res.react = {
      G: Rv[0], GM: Rm[0],
      groups: st.groups.map((_, k) => ({ R: sumCases(Rv, model.subIdx[k]).max, M: sumCases(Rm, model.subIdx[k]).max })),
      uls: envelope(Rv, gG, qCoef(gQ)), ulsM: envelope(Rm, gG, qCoef(gQ)),
      sls: envelope(Rv, 1, qCoef(1)), slsM: envelope(Rm, 1, qCoef(1)),
    };

    // sprawdzenia
    const absMax = e => { let m = 0; for (let i = 0; i < e.max.length; i++) m = Math.max(m, Math.abs(e.max[i]), Math.abs(e.min[i])); return m; };
    const MEd = absMax(res.views.uls.M), VEd = absMax(res.views.uls.V);
    const checks = [];
    if (sec.kind === 'steel') {
      const MRd = sec.Wpl * sec.fy * 1e-3, VRd = sec.Avz * sec.fy / Math.sqrt(3) / 10;
      checks.push({ name: 'Zginanie', util: MEd / MRd,
        desc: `M_Ed = ${nf(MEd)} kNm ≤ M_c,Rd = W_pl·f_y/γ_M0 = ${nf(MRd)} kNm` });
      checks.push({ name: 'Ścinanie', util: VEd / VRd,
        desc: `V_Ed = ${nf(VEd)} kN ≤ V_pl,Rd = A_vz·f_y/(√3·γ_M0) = ${nf(VRd)} kN` });
    } else if (isTimber) {
      const m = sec.mat, gM = m.glulam ? 1.25 : 1.3, kcr = 0.67;
      const kh = m.glulam ? (sec.h < 600 ? Math.min(Math.pow(600 / sec.h, 0.1), 1.1) : 1)
        : (sec.h < 150 ? Math.min(Math.pow(150 / sec.h, 0.2), 1.3) : 1);
      // poziomy kmod: obciążenie o najkrótszym czasie trwania decyduje
      const kmodOf = dur => (S.DURATIONS[dur] || S.DURATIONS.medium).kmod[sc - 1];
      const levels = [{ dur: 'perm', kmod: kmodOf('perm') }];
      st.groups.forEach(g => { if (!levels.some(l => l.kmod === kmodOf(g.dur))) levels.push({ dur: g.dur, kmod: kmodOf(g.dur) }); });
      let bestM = null, bestV = null;
      for (const lv of levels) {
        const allowed = model.subs.map((s, k) => k === 0 || kmodOf(st.groups[s.g - 1].dur) <= lv.kmod);
        const mE = absMax(envelope(Ms, gG, qCoef(gQ), allowed));
        const vE = absMax(envelope(Vs, gG, qCoef(gQ), allowed));
        const fmd = lv.kmod * m.fm / gM * kh, fvd = lv.kmod * m.fv / gM;
        const sig = mE * 1e6 / sec.W, tau = 1.5 * vE * 1e3 / (kcr * sec.b * sec.h);
        const uM = sig / fmd, uV = tau / fvd;
        if (!bestM || uM > bestM.util) bestM = { util: uM, mE, sig, fmd, lv };
        if (!bestV || uV > bestV.util) bestV = { util: uV, vE, tau, fvd, lv };
      }
      const dn = lv => `k_mod = ${nf(lv.kmod)} (${S.DURATIONS[lv.dur].name})`;
      checks.push({ name: 'Zginanie', util: bestM.util,
        desc: `σ_m,d = M/W = ${nf(bestM.mE)} kNm / W = ${nf(bestM.sig)} MPa ≤ k_h·f_m,d = ${nf(bestM.fmd)} MPa; ${dn(bestM.lv)}, k_h = ${nf(kh, 3)}, γ_M = ${nf(gM)}` });
      checks.push({ name: 'Ścinanie', util: bestV.util,
        desc: `τ_d = 1,5·V/(k_cr·b·h) = ${nf(bestV.tau)} MPa ≤ f_v,d = ${nf(bestV.fvd)} MPa; V = ${nf(bestV.vE)} kN, k_cr = 0,67, ${dn(bestV.lv)}` });
    } else if (sec.W > 0) {
      const sig = MEd * 1e3 / sec.W;
      checks.push({ name: 'Naprężenia normalne', util: sec.fd > 0 ? sig / sec.fd : null,
        desc: `σ = M_Ed/W = ${nf(sig)} MPa` + (sec.fd > 0 ? ` ≤ f_d = ${nf(sec.fd)} MPa` : ' (podaj f_d, by sprawdzić)') });
    }
    // ugięcia w przęsłach
    const wl = num(set.wlim) || 250;
    const wEnv = isTimber ? res.wfin : res.views.sls.w;
    const xw = sol.xw;
    const n = st.nodes, last = n.length - 1;
    const isCant = s => {
      const fi = n[s].s === 'none', fj = n[s + 1].s === 'none';
      if (fi === fj) return false;
      const f = fi ? s : s + 1, o = fi ? s + 1 : s;
      if (f === 0 || f === last) return true; // wolny koniec belki
      // przegub bez podpory: wspornik, gdy drugi koniec jest ciągły (belka trwa dalej) lub utwierdzony
      return n[o].s === 'fixed' || (o !== 0 && o !== last && !n[o].h);
    };
    if (sec.kind !== 'rc') model.spans.forEach((L, s) => {
      const cant = isCant(s);
      const i0 = xw.findIndex(x => x >= model.off[s] - 1e-9);
      let i1 = i0;
      while (i1 < xw.length - 1 && xw[i1 + 1] <= model.off[s + 1] + 1e-9) i1++;
      let wmax = 0, at = 0;
      for (const arr of [wEnv.max, wEnv.min]) {
        for (let i = i0; i <= i1; i++) {
          // przęsło (nie wspornik): ugięcie względem cięciwy łączącej końce przęsła
          const t = (xw[i] - xw[i0]) / (xw[i1] - xw[i0]);
          const v = Math.abs(cant ? arr[i] : arr[i] - (arr[i0] + (arr[i1] - arr[i0]) * t));
          if (v > wmax) { wmax = v; at = xw[i]; }
        }
      }
      const Lc = cant ? 2 * L : L;
      const lim = Lc / wl;
      checks.push({ name: `Ugięcie przęsła ${s + 1}${cant ? ' (wspornik)' : ''}`, util: wmax / lim,
        desc: `${isTimber ? 'w_fin' : 'w_max'} = ${nf(wmax * 1000, 1)} mm ≤ ${cant ? '2L' : 'L'}/${wl} = ${nf(lim * 1000, 1)} mm (x = ${nf(at)} m)` });
    });
    if (sec.kind === 'rc') res.rc = rcChecks(st, model, sol, res.views.uls.M, VEd, isCant, checks);
    res.checks = checks;
    res.MEd = MEd; res.VEd = VEd;
    return res;
  }

  // Żelbet: zbrojenie w przęsłach i nad podporami, ściskanie betonu, ścinanie bez strzemion, l/d
  function rcChecks(st, model, sol, M, VEd, isCant, checks) {
    const sec = model.sec, mat = sec.mat, b = sec.b, d = sec.d, off = model.off, xs = sol.xs;
    const rows = [];
    if (d <= 0) { checks.push({ name: 'Wysokość użyteczna', util: 2, desc: 'd ≤ 0 – zmniejsz otulinę lub średnicę pręta' }); return { rows, d }; }
    const add = (where, pos, MEd, span) => {
      const r = S.rcBending(MEd, b, d, mat);
      rows.push(Object.assign(r, { where, pos, M: MEd, span, bars: S.rcBars(r.AsReq, b, sec.h, sec.phi) }));
    };
    model.spans.forEach((_, s) => {
      let mp = 0;
      for (let i = 0; i < xs.length; i++) {
        const xc = (xs[i - (i % 2)] + xs[i - (i % 2) + 1]) / 2;
        if (xc > off[s] && xc < off[s + 1]) mp = Math.max(mp, M.max[i]);
      }
      add(`Przęsło ${s + 1}`, 'dołem', mp, s);
    });
    st.nodes.forEach((n, i) => {
      let mn = 0;
      for (let k = 0; k < xs.length; k++) if (Math.abs(xs[k] - off[i]) < 1e-9) mn = Math.min(mn, M.min[k]);
      if (mn < -1e-6) add(`Podpora ${LETTERS[i]}`, 'górą', -mn, null);
    });
    // ściskanie betonu (ξ_eff ≤ ξ_eff,lim)
    const worst = rows.reduce((w, r) => (!w || r.xi > w.xi ? r : w), null);
    if (worst) {
      checks.push({ name: 'Zginanie – strefa ściskana betonu', util: isFinite(worst.xi) ? worst.xi / worst.xiLim : 2,
        desc: isFinite(worst.xi)
          ? `${worst.where}: M_Ed = ${nf(worst.M)} kNm, μ = ${nf(worst.mu, 3)}, ξ_eff = ${nf(worst.xi, 3)} ≤ ξ_eff,lim = ${nf(worst.xiLim, 3)} (d = ${nf(d, 0)} mm)`
          : `${worst.where}: M_Ed = ${nf(worst.M)} kNm – przekrój za mały (μ ≥ 0,5), zwiększ h` });
    }
    // ścinanie – ρ_l z najbardziej zbrojonego miejsca nad podporą (lub w przęśle, gdy brak momentów podporowych)
    const sup = rows.filter(r => r.span === null);
    const asl = Math.max(...(sup.length ? sup : rows).map(r => r.AsReq));
    const rho = asl / (b * d);
    const v = S.rcVRdc(b, d, rho, mat);
    checks.push({ name: 'Ścinanie (bez zbrojenia poprzecznego)', util: VEd / v.VRdc,
      desc: `V_Ed = ${nf(VEd)} kN ≤ V_Rd,c = ${nf(v.VRdc)} kN; k = ${nf(v.k, 3)}, ρ_l = ${nf(rho * 100, 3)}%` });
    // ugięcia metodą l/d
    const n = st.nodes, last = n.length - 1;
    const cont = i => (i > 0 && i < last ? n[i].s !== 'none' && !n[i].h : n[i].s === 'fixed');
    model.spans.forEach((L, s) => {
      const cant = isCant(s);
      const nc = cont(s) + cont(s + 1);
      const K = cant ? 0.4 : [1.0, 1.3, 1.5][nc];
      const r = rows.find(x => x.span === s);
      const rs = (cant ? Math.max(asl, r.AsMin) : r.AsReq) / (b * d);
      const lim = S.rcSpanDepth(K, rs, mat) * (L > 7 ? 7 / L : 1);
      const ld = L * 1000 / d;
      const kind = cant ? 'wspornik' : ['swobodnie podparte', 'skrajne', 'pośrednie'][nc];
      checks.push({ name: `Ugięcie przęsła ${s + 1} – l/d (${kind})`, util: ld / lim,
        desc: `l/d = ${nf(ld, 1)} ≤ ${nf(lim, 1)}; K = ${nf(K, 1)}, ρ = ${nf(rs * 100, 3)}%, × 500/f_yk` });
    });
    return { rows, d, rho, VRdc: v.VRdc };
  }

  // ---------- edytor ----------
  function renderGeometry() {
    const n = state.nodes.length;
    let h = '';
    state.nodes.forEach((nd, i) => {
      const inner = i > 0 && i < n - 1;
      h += `<div class="geo-node"><span class="nlabel">${LETTERS[i] || i}</span>
        <select data-path="nodes.${i}.s" data-rerender="geo">${Object.entries(SUPPORTS).map(([k, v]) =>
          `<option value="${k}"${nd.s === k ? ' selected' : ''}>${v}</option>`).join('')}</select>
        ${inner ? `<label class="chk"><input type="checkbox" data-path="nodes.${i}.h"${nd.h ? ' checked' : ''}${nd.s === 'fixed' ? ' disabled' : ''}> przegub</label>` : ''}
      </div>`;
      if (i < n - 1) {
        h += `<div class="geo-span">przęsło ${i + 1}: L = <input type="number" step="0.05" min="0.05" data-path="spans.${i}" value="${state.spans[i]}"> m</div>`;
      }
    });
    $('geometry').innerHTML = h;
  }

  const opt = (v, label, cur) => `<option value="${esc(v)}"${String(cur) === String(v) ? ' selected' : ''}>${esc(label)}</option>`;
  function field(label, inner, unit = '') { return `<label>${label}</label><div>${inner}${unit ? `<span class="unit">${unit}</span>` : ''}</div>`; }
  const numIn = (path, val, step = 'any') => `<input type="number" step="${step}" data-path="${path}" value="${val}">`;

  function renderSection() {
    const s = state.sec;
    let h = '<div class="fields">';
    h += field('Rodzaj', `<select data-path="sec.kind" data-rerender="sec">${opt('timber', 'Drewno – prostokąt', s.kind)}${opt('steel', 'Stal – dwuteownik', s.kind)}${opt('rc', 'Żelbet – płyta / belka prostokątna', s.kind)}${opt('custom', 'Własny (E, I)', s.kind)}</select>`);
    if (s.kind === 'rc') {
      h += field('Beton', `<select data-path="sec.conc">${Object.keys(S.CONCRETE).map(k => opt(k, k, s.conc)).join('')}</select>`);
      h += field('Stal f<sub>yk</sub>', numIn('sec.fyk', s.fyk, 10), 'MPa');
      h += field('Szerokość b', numIn('sec.b', s.b, 10), 'mm (płyta: pasmo 1000)');
      h += field('Wysokość h', numIn('sec.h', s.h, 10), 'mm');
      h += field('Otulina c<sub>nom</sub>', numIn('sec.cov', s.cov, 5), 'mm');
      h += field('Pręty φ', `<select data-path="sec.phi">${[6, 8, 10, 12, 14, 16, 20, 25].map(v => opt(v, v, s.phi)).join('')}</select>`, 'mm');
    } else if (s.kind === 'timber') {
      h += field('Klasa', `<select data-path="sec.timberClass">${Object.keys(S.TIMBER).map(k => opt(k, k + (S.TIMBER[k].glulam ? ' (klejone)' : ''), s.timberClass)).join('')}</select>`);
      h += field('Szerokość b', numIn('sec.b', s.b, 5), 'mm');
      h += field('Wysokość h', numIn('sec.h', s.h, 10), 'mm');
      h += field('Klasa użytk.', `<select data-path="sec.sc">${opt(1, '1 – wnętrza ogrzewane', s.sc)}${opt(2, '2 – zadaszone, nieogrzewane', s.sc)}${opt(3, '3 – na zewnątrz', s.sc)}</select>`);
    } else if (s.kind === 'steel') {
      h += field('Typ', `<select data-path="sec.family" data-rerender="sec">${Object.keys(S.STEEL_PROFILES).map(k => opt(k, k, s.family)).join('')}</select>`);
      h += field('Profil', `<select data-path="sec.profile">${S.STEEL_PROFILES[s.family].map(r => opt(r[0], r[0], s.profile)).join('')}</select>`);
      h += field('Gatunek', `<select data-path="sec.grade">${Object.keys(S.STEEL_GRADES).map(k => opt(k, k, s.grade)).join('')}</select>`);
    } else {
      h += field('E', numIn('sec.E', s.E), 'MPa');
      h += field('I', numIn('sec.I', s.I), 'cm⁴');
      h += field('W', numIn('sec.W', s.W), 'cm³');
      h += field('f_d', numIn('sec.fd', s.fd), 'MPa');
      h += field('g_k', numIn('sec.gk', s.gk), 'kN/m');
    }
    h += '</div>';
    h += `<p style="margin:8px 0 0"><label class="chk"><input type="checkbox" data-path="sw"${state.sw ? ' checked' : ''}> uwzględnij ciężar własny belki <span id="gkInfo"></span></label></p>`;
    $('section').innerHTML = h;
  }

  function renderGroups() {
    let h = `<div class="list"><div class="item"><span class="tag" style="background:${G_COLOR}">G</span><span>Stałe (ciężar własny, warstwy)</span></div>`;
    state.groups.forEach((g, k) => {
      h += `<div class="item"><span class="tag" style="background:${GROUP_COLORS[k % GROUP_COLORS.length]}">Q${k + 1}</span>
        <input type="text" data-path="groups.${k}.name" value="${esc(g.name)}" placeholder="nazwa">
        <label>czas <select data-path="groups.${k}.dur">${Object.entries(S.DURATIONS).filter(([d]) => d !== 'perm').map(([d, v]) => opt(d, v.name, g.dur)).join('')}</select></label>
        <label>ψ₂ ${numIn(`groups.${k}.psi2`, g.psi2, 0.1)}</label>
        <label class="chk" title="Obciążenie może działać w każdym przęśle niezależnie (układ szachownicowy)"><input type="checkbox" data-path="groups.${k}.pat"${g.pat ? ' checked' : ''}> osobno w przęsłach</label>
        <button class="btn icon del" data-act="delGroup" data-i="${k}" title="Usuń grupę">✕</button></div>`;
    });
    h += '</div>';
    $('groups').innerHTML = h;
  }

  function renderLoads() {
    if (!state.loads.length) { $('loads').innerHTML = '<p class="empty">Brak obciążeń – dodaj poniżej.</p>'; return; }
    const groupOpts = cur => opt(0, 'G', cur) + state.groups.map((g, k) => opt(k + 1, 'Q' + (k + 1), cur)).join('');
    const spanOpts = cur => opt(-1, 'cała belka', cur) + state.spans.map((_, s) => opt(s, 'przęsło ' + (s + 1), cur)).join('');
    let h = '<div class="list">';
    state.loads.forEach((L, i) => {
      const col = L.g > 0 ? GROUP_COLORS[(L.g - 1) % GROUP_COLORS.length] : G_COLOR;
      const tag = { q: 'q', P: 'P', M: 'M' }[L.t];
      h += `<div class="item"><span class="tag" style="background:${col}">${tag}</span>${L.auto ? '<span class="auto-tag" title="Wartość aktualizowana z zestawienia obciążeń">z zestawienia</span>' : ''}
        <select data-path="loads.${i}.g" data-rerender="loads">${groupOpts(L.g)}</select>
        <select data-path="loads.${i}.sp">${spanOpts(L.sp)}</select>
        <label>a ${numIn(`loads.${i}.a`, L.a, 0.05)}</label>`;
      if (L.t === 'q') {
        h += `<label title="Długość obciążenia; 0 = do końca przęsła/belki">c ${numIn(`loads.${i}.c`, L.c, 0.05)}</label>
          <label>q₁ ${numIn(`loads.${i}.v1`, L.v1, 0.1)}</label><label>q₂ ${numIn(`loads.${i}.v2`, L.v2, 0.1)} kN/m</label>`;
      } else if (L.t === 'P') {
        h += `<label>P ${numIn(`loads.${i}.v1`, L.v1, 0.5)} kN</label>`;
      } else {
        h += `<label>M ${numIn(`loads.${i}.v1`, L.v1, 0.5)} kNm</label>`;
      }
      h += `<button class="btn icon del" data-act="delLoad" data-i="${i}" title="Usuń">✕</button></div>`;
    });
    h += '</div><p class="hint" style="margin-top:6px">q: c = długość (0 = do końca), q₁ i q₂ – wartości na początku i końcu (różne = trapez/trójkąt).</p>';
    $('loads').innerHTML = h;
  }

  function renderSettings() {
    const s = state.set;
    let h = '<div class="fields">';
    h += field('γ<sub>G</sub>', numIn('set.gG', s.gG, 0.05));
    h += field('γ<sub>Q</sub>', numIn('set.gQ', s.gQ, 0.05));
    h += field('Ugięcie gran.', `L / <select data-path="set.wlim">${[150, 200, 250, 300, 350, 400, 500].map(v => opt(v, v, s.wlim)).join('')}</select>`);
    h += '</div>';
    $('settings').innerHTML = h;
  }

  function renderZs() {
    const z = state.zs;
    let h = '<div class="fields">';
    h += field('Przeznaczenie', `<select data-path="zs.use" data-rerender="zs">${Object.entries(S.USES).map(([k, u]) => opt(k, u[0], z.use)).join('')}</select>`);
    h += field('q<sub>k</sub> użytkowe', numIn('zs.qk', z.qk, 0.5), 'kN/m²');
    h += field('Posadzka', `<select data-path="zs.floor" data-rerender="zs">${Object.entries(S.FLOORS).map(([k, f]) => opt(k, f[0], z.floor)).join('')}</select>`);
    h += field('Szer. pasma', numIn('zs.bw', z.bw, 0.1), 'm');
    h += '</div><p class="hint" style="margin:4px 0 8px">Szerokość pasma: płyta – 1 m; żebro/belka – rozstaw (szerokość zbierania obciążeń).</p>';
    h += '<div class="list">';
    z.rows.forEach((L, i) => {
      const synced = L.slab && state.sec.kind === 'rc';
      const tIn = synced ? `<span title="grubość z przekroju żelbetowego (h)" id="zst-${i}">${nf(layerT(state, L), 3)}</span>` : numIn(`zs.rows.${i}.t`, L.t, 0.005);
      h += `<div class="item zs-row"><input type="text" data-path="zs.rows.${i}.n" value="${esc(L.n)}">
        <label>${tIn} m ×</label><label>${numIn(`zs.rows.${i}.y`, L.y, 0.5)} kN/m³</label>
        ${num(L.t) > 0 || synced ? '' : `<label>lub ${numIn(`zs.rows.${i}.v`, L.v, 0.01)} kN/m²</label>`}
        <span class="val" id="zsv-${i}"></span>
        <button class="btn icon del" data-act="delLayer" data-i="${i}" title="Usuń warstwę">✕</button></div>`;
    });
    h += '</div><div class="row-btns"><button class="btn small" data-act="addLayer">+ warstwa</button>';
    h += `<button class="btn small" data-act="applyZs" style="margin-left:auto;font-weight:600">${hasAuto(state) ? '↻ Wstawione do belki' : '→ Wstaw do belki'}</button></div>`;
    h += '<div id="zsTot" class="zs-tot"></div>';
    $('zs').innerHTML = h;
    renderZsTot();
  }

  function renderZsTot() {
    const t = zsTotals(state);
    state.zs.rows.forEach((L, i) => {
      const e = $('zsv-' + i); if (e) e.textContent = nf(layerGk(state, L)) + ' kN/m²';
      const s = $('zst-' + i); if (s) s.textContent = nf(layerT(state, L), 3);
    });
    let h = `<table><tr><th>kN/m²</th><th>charakt.</th><th>γ<sub>F</sub></th><th>oblicz.</th></tr>
      <tr><td>Stałe (ST)</td><td>${nf(t.gk)}</td><td>${nf(t.gG)}</td><td>${nf(t.gd)}</td></tr>
      <tr><td>Zmienne (ZM)</td><td>${nf(t.qk)}</td><td>${nf(t.gQ)}</td><td>${nf(t.qd)}</td></tr>
      <tr class="sum"><td>Razem ST + ZM</td><td>${nf(t.gk + t.qk)}</td><td>–</td><td>${nf(t.gd + t.qd)}</td></tr></table>`;
    h += `<p class="hint" style="margin:6px 0 0">Na belkę (× ${nf(t.bw)} m): g<sub>k</sub> = ${nf(t.gk * t.bw, 3)} kN/m, q<sub>k</sub> = ${nf(t.qk * t.bw, 3)} kN/m.${hasAuto(state) ? ' Zmiany w zestawieniu aktualizują belkę automatycznie.' : ''}</p>`;
    $('zsTot').innerHTML = h;
  }

  function renderEditor() {
    renderGeometry(); renderSection(); renderZs(); renderGroups(); renderLoads(); renderSettings();
  }

  function setPath(path, value) {
    const parts = path.split('.');
    let o = state;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }

  const editor = $('editor');
  editor.addEventListener('input', onEdit);
  editor.addEventListener('change', onEdit);
  function onEdit(e) {
    const t = e.target;
    const path = t.dataset && t.dataset.path;
    if (!path) return;
    if (e.type === 'input' && (t.tagName === 'SELECT' || t.type === 'checkbox')) return;
    let v;
    if (t.type === 'checkbox') v = t.checked;
    else if (t.type === 'number') { if (t.value === '' && e.type === 'input') return; v = num(t.value); }
    else if (t.tagName === 'SELECT' && /^-?\d+(\.\d+)?$/.test(t.value) && !/profile|timberClass|grade|family|kind|dur|\.s$/.test(path)) v = num(t.value);
    else v = t.value;
    if (path === 'sec.family') {
      const n = (state.sec.profile.match(/\d+/) || [''])[0];
      const list = S.STEEL_PROFILES[v];
      state.sec.profile = (list.find(r => r[0].endsWith(' ' + n)) || list[0])[0];
    }
    if (path === 'sec.kind' && (v === 'rc') !== (state.sec.kind === 'rc')) {
      // rozsądne wymiary po zmianie materiału
      if (v === 'rc') { const sl = state.zs.rows.find(L => L.slab); Object.assign(state.sec, { b: 1000, h: sl && num(sl.t) > 0 ? Math.round(num(sl.t) * 1000) : 100 }); }
      else Object.assign(state.sec, { b: 100, h: 200 });
    }
    setPath(path, v);
    if (/^nodes\.\d+\.s$/.test(path) && v === 'fixed') state.nodes[+path.split('.')[1]].h = false;
    if (path === 'zs.use' && S.USES[v] && S.USES[v][1] !== null) state.zs.qk = S.USES[v][1];
    if (path === 'zs.floor' && S.FLOORS[v]) {
      const f = S.FLOORS[v], row = { n: f[0], t: f[1], y: f[2], v: 0, floor: true };
      const i = state.zs.rows.findIndex(L => L.floor);
      if (i >= 0) state.zs.rows[i] = row; else state.zs.rows.unshift(row);
    }
    const rr = t.dataset.rerender;
    if (rr === 'geo') renderGeometry();
    if (rr === 'sec') renderSection();
    if (rr === 'loads') renderLoads();
    if (/^(zs|sec|set)\./.test(path)) {
      if (rr === 'zs' || path === 'sec.kind' || (e.type === 'change' && /^zs\.rows\.\d+\.t$/.test(path))) renderZs();
      else renderZsTot();
      if (hasAuto(state) && /^(zs\.|sec\.)/.test(path)) { applyZs(state); renderLoads(); if (path === 'zs.use') renderGroups(); }
    }
    update();
  }

  editor.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'addSpan') {
      state.spans.push(state.spans[state.spans.length - 1] || 4);
      const last = state.nodes[state.nodes.length - 1];
      if (last.s === 'none' || last.s === 'fixed') { state.nodes.push({ s: last.s, h: false }); last.s = 'pin'; }
      else state.nodes.push({ s: 'roller', h: false });
    } else if (b.id === 'delSpan') {
      if (state.spans.length <= 1) return;
      state.spans.pop();
      const removed = state.nodes.pop();
      state.nodes[state.nodes.length - 1] = { s: removed.s, h: false };
      state.loads.forEach(L => { if (L.sp >= state.spans.length) L.sp = state.spans.length - 1; });
    } else if (b.id === 'addGroup') {
      state.groups.push(grp('Zmienne ' + (state.groups.length + 1), 'medium', 0.3));
    } else if (b.dataset.add) {
      const t = b.dataset.add;
      const L0 = num(state.spans[0]);
      state.loads.push(t === 'q' ? LD('q', state.groups.length ? 1 : 0, -1, 0, 0, 2)
        : LD(t, state.groups.length ? 1 : 0, 0, +(L0 / 2).toFixed(2), 0, t === 'P' ? 10 : 5));
    } else if (b.dataset.act === 'addLayer') {
      state.zs.rows.push({ n: 'Warstwa', t: 0.01, y: 20, v: 0 });
    } else if (b.dataset.act === 'delLayer') {
      state.zs.rows.splice(+b.dataset.i, 1);
      if (hasAuto(state)) applyZs(state);
    } else if (b.dataset.act === 'applyZs') {
      applyZs(state);
      toast('Wstawiono do belki: G i obciążenie użytkowe (osobno w przęsłach). Ciężar własny belki wyłączony – płyta jest w zestawieniu.');
    } else if (b.dataset.act === 'delLoad') {
      state.loads.splice(+b.dataset.i, 1);
    } else if (b.dataset.act === 'delGroup') {
      const k = +b.dataset.i + 1;
      const used = state.loads.filter(L => L.g === k).length;
      if (used && !confirm(`Grupa Q${k} ma ${used} obciąż. – usunąć je razem z grupą?`)) return;
      state.loads = state.loads.filter(L => L.g !== k);
      state.loads.forEach(L => { if (L.g > k) L.g--; });
      state.groups.splice(k - 1, 1);
    } else return;
    renderEditor();
    update();
  });

  $('example').addEventListener('change', e => {
    const k = e.target.value;
    if (!EXAMPLES[k]) return;
    const zs = state.zs;
    const ex = clone(EXAMPLES[k]);
    state = normalize(ex);
    if (!EXAMPLES[k].zs) state.zs = zs;
    if (ex.applyZs) { delete state.applyZs; applyZs(state); }
    e.target.value = '';
    renderEditor();
    update();
  });
  $('view').addEventListener('change', () => { currentView = $('view').value; draw(); });
  $('btnPrint').addEventListener('click', () => window.print());
  $('btnLink').addEventListener('click', async () => {
    save();
    try { await navigator.clipboard.writeText(location.href); toast('Link skopiowany – wyślij go, by otworzyć ten sam schemat.'); }
    catch (e) { prompt('Skopiuj link:', location.href); }
  });
  $('btnPick').addEventListener('click', pickSection);

  function toast(msg) {
    const d = document.createElement('div');
    d.className = 'toast'; d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2600);
  }

  function pickSection() {
    const s = state.sec;
    let cands = [];
    if (s.kind === 'steel') cands = S.STEEL_PROFILES[s.family].map(r => Object.assign({}, s, { profile: r[0] }));
    else if (s.kind === 'timber') {
      const gl = S.TIMBER[s.timberClass].glulam;
      cands = TIMBER_H[gl ? 'glulam' : 'solid'].map(h => Object.assign({}, s, { h }));
    } else if (s.kind === 'rc') {
      for (let h = 60; h <= 1200; h += 10) cands.push(Object.assign({}, s, { h }));
    } else { toast('Dobór działa dla drewna, stali i żelbetu.'); return; }
    for (const c of cands) {
      const st2 = clone(state);
      st2.sec = c;
      if (hasAuto(st2)) applyZs(st2); // ciężar płyty zależy od h
      const r = compute(st2);
      if (r.ok && r.checks.every(ch => ch.util === null || ch.util <= 1)) {
        state.sec = c;
        if (hasAuto(state)) applyZs(state);
        renderEditor(); update();
        toast(`Dobrano: ${S.sectionProps(c).label}`);
        return;
      }
    }
    toast(s.kind === 'rc' ? 'Żadna wysokość nie wystarcza – zmień beton, stal lub schemat.' : s.kind === 'timber' ?'Żadna wysokość nie wystarcza – zwiększ szerokość b lub klasę drewna.' : 'Żaden profil z typoszeregu nie wystarcza – zmień typ lub gatunek stali.');
  }

  // ---------- wyniki ----------
  let result = null, currentView = 'uls';

  function update() {
    save();
    result = compute(state);
    const err = $('error');
    if (!result.ok) {
      err.hidden = false; err.textContent = result.error;
    } else err.hidden = true;
    const gk = result.model.sec.gk;
    const gi = $('gkInfo');
    if (gi) gi.textContent = gk > 0 ? `(g_k = ${nf(gk, 3)} kN/m)` : '';
    if (!result.ok) { $('chart').innerHTML = ''; $('reactions').innerHTML = ''; $('extremes').innerHTML = ''; $('checks').innerHTML = ''; $('rcCard').hidden = true; return; }
    // lista widoków
    const sel = $('view');
    const keys = Object.keys(result.views);
    if (!keys.includes(currentView)) currentView = 'uls';
    sel.innerHTML = keys.map(k => opt(k, result.views[k].label, currentView)).join('');
    draw();
    renderReactions();
    renderChecks();
    renderSummary();
  }

  function renderReactions() {
    const r = result.react, st = state;
    const gNames = st.groups.map((_, k) => 'Q' + (k + 1));
    let h = `<div class="tablewrap"><table><tr><th>Podpora</th><th>G</th>${gNames.map(n => `<th>${n}</th>`).join('')}<th>SGN max</th><th>SGN min</th></tr>`;
    st.nodes.forEach((n, i) => {
      if (n.s === 'none') return;
      const L = LETTERS[i] || i;
      h += `<tr><td>R<sub>${L}</sub> [kN]</td><td>${nf(r.G[i])}</td>${r.groups.map(g => `<td>${nf(g.R[i])}</td>`).join('')}<td><b>${nf(r.uls.max[i])}</b></td><td>${nf(r.uls.min[i])}</td></tr>`;
      if (n.s === 'fixed') {
        h += `<tr><td>M<sub>${L}</sub> [kNm]</td><td>${nf(r.GM[i])}</td>${r.groups.map(g => `<td>${nf(g.M[i])}</td>`).join('')}<td><b>${nf(r.ulsM.max[i])}</b></td><td>${nf(r.ulsM.min[i])}</td></tr>`;
      }
    });
    h += '</table></div><p class="hint" style="margin-top:6px">G, Q – charakterystyczne (Q w pełnym układzie). R &gt; 0 w górę; M utwierdzenia &gt; 0 zgodnie z ruchem wskazówek zegara. Ujemne SGN min = podpora odrywana.</p>';
    $('reactions').innerHTML = h;
  }

  function extremeOf(xs, e, useMax) {
    let best = useMax ? -Infinity : Infinity, at = 0;
    const arr = useMax ? e.max : e.min;
    for (let i = 0; i < arr.length; i++) if (useMax ? arr[i] > best : arr[i] < best) { best = arr[i]; at = xs[i]; }
    return { v: best, x: at };
  }

  function renderExtremes(view) {
    const sol = result.sol;
    const rows = [
      ['M<sub>max</sub>', extremeOf(sol.xs, view.M, true), 'kNm', 2],
      ['M<sub>min</sub>', extremeOf(sol.xs, view.M, false), 'kNm', 2],
      ['V<sub>max</sub>', extremeOf(sol.xs, view.V, true), 'kN', 2],
      ['V<sub>min</sub>', extremeOf(sol.xs, view.V, false), 'kN', 2],
    ];
    const wm = extremeOf(sol.xw, view.w, true), wn = extremeOf(sol.xw, view.w, false);
    let h = '<table><tr><th>Wielkość</th><th>wartość</th><th>x [m]</th></tr>';
    rows.forEach(([n, e, u, d]) => { h += `<tr><td>${n}</td><td>${nf(e.v, d)} ${u}</td><td>${nf(e.x)}</td></tr>`; });
    h += `<tr><td>w<sub>max</sub> (w dół)${view === result.views.uls ? ' – char.' : ''}</td><td>${nf(wm.v * 1000, 2)} mm</td><td>${nf(wm.x)}</td></tr>`;
    if (wn.v < -1e-7) h += `<tr><td>w<sub>min</sub> (w górę)</td><td>${nf(wn.v * 1000, 2)} mm</td><td>${nf(wn.x)}</td></tr>`;
    if (view.wfin) { const f = extremeOf(sol.xw, view.wfin, true); h += `<tr><td>w<sub>fin</sub> (z pełzaniem)</td><td>${nf(f.v * 1000, 2)} mm</td><td>${nf(f.x)}</td></tr>`; }
    h += `</table><p class="hint" style="margin-top:6px">Widok: ${esc(view.label)}. EI = ${nf(result.model.sec.EI, 0)} kNm².</p>`;
    $('extremes').innerHTML = h;
  }

  function renderChecks() {
    const sec = result.model.sec;
    const isT = result.isTimber;
    let h = `<div class="secinfo">Przekrój: <b>${esc(sec.label)}</b> · EI = ${nf(sec.EI, 0)} kNm² · g<sub>k</sub> = ${nf(sec.gk, 3)} kN/m`;
    if (sec.kind === 'steel') h += ` · W<sub>pl</sub> = ${nf(sec.Wpl, 1)} cm³ · I<sub>y</sub> = ${nf(sec.Iy, 0)} cm⁴`;
    if (isT) h += ` · W = ${nf(sec.W / 1000, 1)} cm³ · k<sub>def</sub> = ${nf(result.kdef, 1)}`;
    if (sec.kind === 'rc') h += ` · d = ${nf(sec.d, 0)} mm · f<sub>cd</sub> = ${nf(sec.mat.fcd)} MPa · f<sub>yd</sub> = ${nf(sec.mat.fyd, 1)} MPa`;
    h += '</div>';
    const valid = result.checks.filter(c => c.util !== null);
    const worst = valid.reduce((m, c) => Math.max(m, c.util), 0);
    h += `<div class="verdict ${worst <= 1 ? 'ok' : 'bad'}">${worst <= 1 ? '✔ Przekrój spełnia warunki' : '✘ Przekrój NIE spełnia warunków'} – maksymalne wytężenie ${nf(worst * 100, 0)}%</div>`;
    h += '<div class="checks">';
    result.checks.forEach(c => {
      const u = c.util;
      const cls = u === null ? '' : u <= 0.9 ? 'ok' : u <= 1 ? 'warn' : 'bad';
      const col = u === null ? 'var(--muted)' : `var(--${cls})`;
      h += `<div class="row"><div class="desc"><b>${esc(c.name)}</b><span>${esc(c.desc)}</span></div>
        <div class="bar"><div style="width:${u === null ? 0 : Math.min(100, u * 100)}%;background:${col}"></div></div>
        <div class="pct ${cls}">${u === null ? '–' : nf(u * 100, 0) + '%'}</div></div>`;
    });
    h += '</div>';
    const notes = [];
    if (sec.kind === 'steel') notes.push('Założono przekrój klasy 1–2 i belkę zabezpieczoną przed zwichrzeniem (np. stropem). γ_M0 = 1,0. Ugięcia od obciążeń charakterystycznych.');
    if (isT) notes.push('Założono belkę zabezpieczoną przed zwichrzeniem (k_crit = 1). Ugięcie końcowe w_fin = w_G(1+k_def) + Σ w_Q(1+ψ₂·k_def). Nie sprawdzono docisku na podporach.');
    if (sec.kind === 'rc') notes.push('Statyka sprężysta (stałe EI, bez redystrybucji); momenty podporowe w osi podpory, bez redukcji do lica – po bezpiecznej stronie. Ugięcia sprawdzone metodą l/d (PN-EN 1992-1-1, 7.4.2); wykres ugięć to sprężysty przekrój niezarysowany – tylko orientacyjnie. V_Ed w osi podpory.');
    notes.push('Kombinacja SGN uproszczona: γ_G·G + γ_Q·ΣQ (bez współczynników ψ₀) – po bezpiecznej stronie.');
    h += `<p class="hint" style="margin-top:8px">${notes.join(' ')}</p>`;
    $('checks').innerHTML = h;
    renderRc();
  }

  function renderRc() {
    const rc = result.rc, card = $('rcCard');
    card.hidden = !rc || !rc.rows.length;
    if (card.hidden) return;
    const sec = result.model.sec;
    const cm = v => (isFinite(v) ? nf(v / 100, 2) : '–');
    let h = `<div class="tablewrap"><table><tr><th>Miejsce</th><th>M<sub>Ed</sub> [kNm]</th><th>μ</th><th>ξ<sub>eff</sub></th><th>A<sub>s,req</sub> [cm²]</th><th>A<sub>s,min</sub> [cm²]</th><th>Propozycja</th><th>A<sub>s,prov</sub> [cm²]</th></tr>`;
    rc.rows.forEach(r => {
      const bad = !isFinite(r.xi) || r.xi > r.xiLim;
      h += `<tr><td>${esc(r.where)} <span class="auto-tag">${r.pos}</span></td><td>${nf(r.M)}</td><td>${nf(r.mu, 3)}</td>
        <td class="${bad ? 'bad' : ''}">${isFinite(r.xi) ? nf(r.xi, 3) : '> lim'}</td><td><b>${cm(r.As)}</b></td><td>${cm(r.AsMin)}</td>
        <td>${esc(r.bars.text)}</td><td>${cm(r.bars.AsProv)}</td></tr>`;
    });
    h += '</table></div>';
    h += `<p class="hint" style="margin-top:6px">Na szerokości b = ${nf(sec.b, 0)} mm${sec.b === 1000 ? ' (czyli na 1 m płyty)' : ''}, d = h − c<sub>nom</sub> − φ/2 = ${nf(sec.d, 0)} mm.
      A<sub>s,min</sub> = max(0,26·f<sub>ctm</sub>/f<sub>yk</sub>; 0,0013)·b·d. ${sec.b >= 500 ? `Rozstaw prętów ≤ min(2h; 250 mm) = ${nf(Math.min(2 * sec.h, 250), 0)} mm. ` : ''}
      Propozycja dobiera rozstaw/liczbę prętów φ${sec.phi} do większej z A<sub>s,req</sub> i A<sub>s,min</sub> – zmień φ w przekroju, by zobaczyć inne warianty.</p>`;
    $('rcTable').innerHTML = h;
  }

  function renderSummary() {
    const st = state, m = result.model;
    let h = '';
    if (hasAuto(st)) {
      const t = zsTotals(st);
      h += `<p><b>Zestawienie obciążeń</b> – przeznaczenie: ${esc((S.USES[st.zs.use] || S.USES.wlasne)[0])}, posadzka: ${esc((S.FLOORS[st.zs.floor] || [''])[0])}</p>
        <table><tr><th>Warstwa</th><th>grubość [m]</th><th>γ [kN/m³]</th><th>g<sub>k</sub> [kN/m²]</th><th>γ<sub>F</sub></th><th>g<sub>d</sub> [kN/m²]</th></tr>`;
      st.zs.rows.forEach(L => {
        const tt = layerT(st, L), g = layerGk(st, L);
        h += `<tr><td>${esc(L.n)}</td><td>${tt > 0 ? nf(tt, 3) : '–'}</td><td>${num(L.y) > 0 && tt > 0 ? nf(num(L.y), 2) : '–'}</td><td>${nf(g)}</td><td>${nf(t.gG)}</td><td>${nf(g * t.gG)}</td></tr>`;
      });
      h += `<tr><td><b>Razem stałe</b></td><td></td><td></td><td><b>${nf(t.gk)}</b></td><td></td><td><b>${nf(t.gd)}</b></td></tr>
        <tr><td>Zmienne użytkowe</td><td></td><td></td><td>${nf(t.qk)}</td><td>${nf(t.gQ)}</td><td>${nf(t.qd)}</td></tr>
        <tr><td><b>Razem ST + ZM</b></td><td></td><td></td><td><b>${nf(t.gk + t.qk)}</b></td><td></td><td><b>${nf(t.gd + t.qd)}</b></td></tr></table>
        <p>Szerokość pasma ${nf(t.bw)} m.</p><br>`;
    }
    h += '<table><tr><th>Węzeł</th><th>Podpora</th><th>x [m]</th></tr>';
    st.nodes.forEach((n, i) => { h += `<tr><td>${LETTERS[i]}</td><td>${SUPPORTS[n.s]}${n.h ? ' + przegub' : ''}</td><td>${nf(m.off[i])}</td></tr>`; });
    h += '</table><br><table><tr><th>Obciążenie</th><th>Grupa</th><th>Położenie</th><th>Wartość</th></tr>';
    m.drawLoads.forEach(L => {
      const g = L.g ? 'Q' + L.g : 'G';
      if (L.type === 'dist') h += `<tr><td>q${L.sw ? ' (ciężar własny)' : ''}</td><td>${g}</td><td>${nf(L.x1)} – ${nf(L.x2)} m</td><td>${nf(L.q1)}${L.q1 !== L.q2 ? ' → ' + nf(L.q2) : ''} kN/m</td></tr>`;
      else if (L.type === 'point') h += `<tr><td>P</td><td>${g}</td><td>${nf(L.x)} m</td><td>${nf(L.P)} kN</td></tr>`;
      else h += `<tr><td>M</td><td>${g}</td><td>${nf(L.x)} m</td><td>${nf(L.M)} kNm</td></tr>`;
    });
    h += `</table><p>Grupy zmienne: ${st.groups.map((g, k) => `Q${k + 1} ${esc(g.name)} (ψ₂ = ${g.psi2}${g.pat ? ', osobno w przęsłach' : ''})`).join('; ') || 'brak'}. γ_G = ${st.set.gG}, γ_Q = ${st.set.gQ}, ugięcie L/${st.set.wlim}.</p>`;
    $('summary').innerHTML = h;
  }

  // ---------- wykres SVG ----------
  let chartMeta = null;

  function draw() {
    if (!result || !result.ok) return;
    const view = result.views[currentView];
    renderExtremes(view);
    const box = $('chart');
    const W = Math.max(320, box.clientWidth || 800);
    const padL = 58, padR = 18;
    const m = result.model, sol = result.sol;
    const Ltot = m.Ltot;
    const X = x => padL + x / Ltot * (W - padL - padR);
    let svg = '', y = 0;
    const panels = [];

    // --- schemat ---
    const dists = m.drawLoads.filter(l => l.type === 'dist');
    const bandH = 32;
    const top = 22;
    const hasPt = m.drawLoads.some(l => l.type !== 'dist');
    const yPtTop = top + dists.length * bandH + (hasPt ? 16 : 0);
    const yBeam = yPtTop + (hasPt ? 50 : 18);
    const colorOf = g => (g ? GROUP_COLORS[(g - 1) % GROUP_COLORS.length] : G_COLOR);
    const gname = g => (g ? 'Q' + g : 'G');
    svg += `<text x="4" y="14" class="ptitle">Schemat i obciążenia (charakterystyczne)</text>`;
    dists.forEach((l, i) => {
      const base = top + (i + 1) * bandH;
      const qm = Math.max(Math.abs(l.q1), Math.abs(l.q2)) || 1;
      const h1 = 15 * Math.abs(l.q1) / qm, h2 = 15 * Math.abs(l.q2) / qm;
      const x1 = X(l.x1), x2 = X(l.x2), c = colorOf(l.g);
      svg += `<polygon points="${x1},${base} ${x1},${base - h1} ${x2},${base - h2} ${x2},${base}" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="1.2"/>`;
      const nArr = Math.max(2, Math.min(30, Math.round((x2 - x1) / 28)));
      for (let k = 0; k <= nArr; k++) {
        const xx = x1 + (x2 - x1) * k / nArr;
        const hh = h1 + (h2 - h1) * k / nArr;
        if (hh < 3) continue;
        const up = (l.q1 + (l.q2 - l.q1) * k / nArr) < 0;
        const ya = up ? base - hh + 1 : base - 1;
        svg += `<line x1="${xx}" y1="${base - hh}" x2="${xx}" y2="${base}" stroke="${c}" stroke-width="1"/>`;
        svg += `<path d="M${xx - 2.5},${ya + (up ? 4 : -4)} L${xx},${ya} L${xx + 2.5},${ya + (up ? 4 : -4)}" fill="none" stroke="${c}" stroke-width="1"/>`;
      }
      const lab = `${l.sw ? 'g (c.w.)' : 'q'} = ${nf(l.q1)}${l.q1 !== l.q2 ? ' ÷ ' + nf(l.q2) : ''} kN/m  [${gname(l.g)}]`;
      const tx = Math.min(Math.max((x1 + x2) / 2, padL + 60), W - padR - 60);
      svg += `<text x="${tx}" y="${base - 18}" text-anchor="middle" class="halo" style="fill:${c}">${esc(lab)}</text>`;
    });
    // siły i momenty skupione
    const placed = [];
    m.drawLoads.forEach(l => {
      if (l.type === 'dist') return;
      const x = X(l.x), c = colorOf(l.g);
      let ly = yPtTop + 2;
      while (placed.some(p => Math.abs(p.x - x) < 70 && Math.abs(p.y - ly) < 11)) ly -= 11;
      placed.push({ x, y: ly });
      const anchor = x > W - padR - 50 ? 'end' : x < padL + 50 ? 'start' : 'middle';
      if (l.type === 'point') {
        const up = l.P < 0;
        const y1 = yPtTop + 8, y2 = yBeam - 4;
        svg += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${c}" stroke-width="2"/>`;
        const ya = up ? y1 : y2;
        svg += `<path d="M${x - 5},${ya + (up ? 8 : -8)} L${x},${ya} L${x + 5},${ya + (up ? 8 : -8)}" fill="${c}" stroke="${c}"/>`;
        svg += `<text x="${x}" y="${ly}" text-anchor="${anchor}" class="halo" style="fill:${c}">P = ${nf(l.P)} kN [${gname(l.g)}]</text>`;
      } else {
        const r = 14, cw = l.M >= 0;
        // łuk 3/4 okręgu nad belką, grot wskazuje kierunek
        const a0 = Math.PI * 1.15, a1 = -Math.PI * 0.15;
        const p = a => [x + r * Math.cos(a), yBeam - r * Math.sin(a)];
        const [sx, sy] = p(a0), [ex, ey] = p(a1);
        svg += `<path d="M${sx},${sy} A${r},${r} 0 1 1 ${ex},${ey}" fill="none" stroke="${c}" stroke-width="2"/>`;
        const [hx, hy] = cw ? [ex, ey] : [sx, sy];
        svg += `<circle cx="${hx}" cy="${hy}" r="3.2" fill="${c}"/>`;
        svg += `<text x="${x}" y="${ly}" text-anchor="${anchor}" class="halo" style="fill:${c}">M = ${nf(l.M)} kNm ${cw ? '↻' : '↺'} [${gname(l.g)}]</text>`;
      }
    });
    // belka i podpory
    svg += `<line x1="${X(0)}" y1="${yBeam}" x2="${X(Ltot)}" y2="${yBeam}" class="beam"/>`;
    state.nodes.forEach((n, i) => {
      const x = X(m.off[i]);
      const s = n.s;
      if (s === 'pin' || s === 'roller') {
        svg += `<path d="M${x},${yBeam + 3} L${x - 9},${yBeam + 18} L${x + 9},${yBeam + 18} Z" class="sup"/>`;
        if (s === 'roller') svg += `<line x1="${x - 12}" y1="${yBeam + 23}" x2="${x + 12}" y2="${yBeam + 23}" class="sup"/>`;
        const yg = s === 'roller' ? yBeam + 27 : yBeam + 18;
        svg += `<line x1="${x - 13}" y1="${yg}" x2="${x + 13}" y2="${yg}" class="sup"/>`;
        for (let k = -12; k <= 8; k += 5) svg += `<line x1="${x + k}" y1="${yg + 5}" x2="${x + k + 4}" y2="${yg}" class="sup"/>`;
        svg += `<circle cx="${x}" cy="${yBeam + 3}" r="2.5" class="hinge"/>`;
      } else if (s === 'fixed') {
        const dir = i === 0 ? -1 : i === state.nodes.length - 1 ? 1 : 0;
        if (dir === 0) {
          svg += `<rect x="${x - 6}" y="${yBeam - 12}" width="12" height="24" class="supf" opacity=".6"/>`;
        } else {
          svg += `<line x1="${x}" y1="${yBeam - 16}" x2="${x}" y2="${yBeam + 16}" class="sup" stroke-width="2.5"/>`;
          for (let k = -16; k < 16; k += 5) svg += `<line x1="${x}" y1="${yBeam + k + 5}" x2="${x + dir * 6}" y2="${yBeam + k}" class="sup"/>`;
        }
      }
      if (n.h && i > 0 && i < state.nodes.length - 1 && s !== 'fixed') svg += `<circle cx="${x}" cy="${yBeam}" r="4.5" class="hinge"/>`;
      svg += `<text x="${x}" y="${yBeam + 42}" text-anchor="middle" class="ptitle">${LETTERS[i]}</text>`;
    });
    // wymiary
    const yd = yBeam + 56;
    svg += `<line x1="${X(0)}" y1="${yd}" x2="${X(Ltot)}" y2="${yd}" class="dim"/>`;
    m.off.forEach(o => { svg += `<line x1="${X(o)}" y1="${yd - 5}" x2="${X(o)}" y2="${yd + 5}" class="dim"/>`; });
    m.spans.forEach((L, s) => { svg += `<text x="${(X(m.off[s]) + X(m.off[s + 1])) / 2}" y="${yd - 4}" text-anchor="middle" class="muted">${nf(L)} m</text>`; });
    y = yd + 16;
    const schemeBottom = y;

    // --- wykresy ---
    const diag = (title, unit, xs, env, opts) => {
      const H = opts.h;
      const y0 = y + 38, y1 = y + H - 24;
      let vmax = 0, vmin = 0;
      for (let i = 0; i < env.max.length; i++) { vmax = Math.max(vmax, env.max[i], env.min[i]); vmin = Math.min(vmin, env.max[i], env.min[i]); }
      if (opts.extra) for (let i = 0; i < opts.extra.max.length; i++) { vmax = Math.max(vmax, opts.extra.max[i]); vmin = Math.min(vmin, opts.extra.min[i]); }
      vmax *= opts.k; vmin *= opts.k;
      const range = vmax - vmin || 1;
      const sc = (y1 - y0) / range;
      const down = opts.down; // dodatnie w dół
      const axisY = down ? y0 - vmin * sc : y0 + vmax * sc;
      const Y = v => (down ? axisY + v * sc : axisY - v * sc);
      let g = `<text x="4" y="${y + 14}" class="ptitle">${title}</text><text x="${padL - 6}" y="${axisY + 4}" text-anchor="end" class="muted">0</text>`;
      m.off.forEach(o => { g += `<line x1="${X(o)}" y1="${y0 - 4}" x2="${X(o)}" y2="${y1 + 4}" class="grid"/>`; });
      const path = arr => xs.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(arr[i] * opts.k).toFixed(1)}`).join('');
      const fillP = arr => `${path(arr)}L${X(xs[xs.length - 1]).toFixed(1)},${axisY}L${X(xs[0]).toFixed(1)},${axisY}Z`;
      const same = env.max === env.min;
      g += `<path d="${fillP(env.max)}" class="${opts.cls}-fill"/>`;
      if (!same) g += `<path d="${fillP(env.min)}" class="${opts.cls}-fill"/>`;
      g += `<line x1="${X(0)}" y1="${axisY}" x2="${X(Ltot)}" y2="${axisY}" class="axis"/>`;
      g += `<path d="${path(env.max)}" class="${opts.cls}-line"/>`;
      if (!same) g += `<path d="${path(env.min)}" class="${opts.cls}-line"/>`;
      if (opts.extra) g += `<path d="${path(opts.extra.max)}" class="w-line2"/>`;
      // opisy ekstremów w przęsłach
      const labels = [];
      const thr = 0.03 * range / opts.k;
      const spanAt = x => { for (let s = 0; s < m.spans.length; s++) if (x <= m.off[s + 1] + 1e-9) return s; return m.spans.length - 1; };
      m.spans.forEach((_, s) => {
        let bi = -1, bv = -Infinity, si = -1, sv = Infinity;
        for (let i = 0; i < xs.length; i++) {
          const xc = opts.pairs ? (xs[i - (i % 2)] + xs[i - (i % 2) + 1]) / 2 : xs[i];
          if (spanAt(xc) !== s) continue;
          if (!opts.pairs && (xs[i] < m.off[s] - 1e-9 || xs[i] > m.off[s + 1] + 1e-9)) continue;
          if (env.max[i] > bv) { bv = env.max[i]; bi = i; }
          if (env.min[i] < sv) { sv = env.min[i]; si = i; }
        }
        if (bi >= 0 && bv > thr) labels.push([xs[bi], bv]);
        if (si >= 0 && sv < -thr) labels.push([xs[si], sv]);
      });
      const used = [];
      labels.forEach(([x, v], li) => {
        if (labels.some(([x2, v2], lj) => lj < li && Math.abs(x2 - x) < 1e-6 && Math.abs(v2 - v) < 1e-6)) return;
        const px = X(x);
        let py = Y(v * opts.k) + ((down ? v > 0 : v < 0) ? 13 : -5);
        if (used.some(u => Math.abs(u[0] - px) < 50 && Math.abs(u[1] - py) < 12)) py += (down ? v > 0 : v < 0) ? 12 : -12;
        used.push([px, py]);
        const anchor = px > W - padR - 30 ? 'end' : px < padL + 30 ? 'start' : 'middle';
        g += `<text x="${px}" y="${py}" text-anchor="${anchor}" class="val halo">${nf(v * opts.k, opts.d)}</text>`;
      });
      panels.push({ y0: y + 18, y1: y + H - 4, xs, env, extra: opts.extra, k: opts.k, d: opts.d, unit, sym: opts.sym, Y, pairs: opts.pairs });
      y += H;
      return g;
    };
    const tag = view.env ? ' – obwiednia' : '';
    svg += diag(`Momenty zginające M [kNm]${tag}`, 'kNm', sol.xs, view.M, { h: 190, down: true, cls: 'm', k: 1, d: 2, sym: 'M', pairs: true });
    svg += diag(`Siły tnące V [kN]${tag}`, 'kN', sol.xs, view.V, { h: 170, down: false, cls: 'v', k: 1, d: 2, sym: 'V', pairs: true });
    const wTitle = view.wfin ? 'Ugięcia w [mm] – ciągła: chwilowe, przerywana: końcowe w_fin' : `Ugięcia w [mm]${view === result.views.uls ? ' (charakterystyczne)' : ''}`;
    svg += diag(wTitle, 'mm', sol.xw, view.w, { h: 160, down: true, cls: 'w', k: 1000, d: 2, sym: 'w', extra: view.wfin, pairs: false });
    const H = y + 6;
    svg += `<g id="cursorG"></g><rect id="hoverRect" x="${padL}" y="0" width="${W - padL - padR}" height="${H}" fill="transparent"/>`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Wykresy sił wewnętrznych i ugięć">${svg}</svg>`;
    chartMeta = { X, W, padL, padR, Ltot, panels, H, schemeBottom };
    const rect = box.querySelector('#hoverRect');
    const move = ev => {
      const svgEl = box.querySelector('svg');
      const bb = svgEl.getBoundingClientRect();
      const px = (ev.clientX - bb.left) * (W / bb.width);
      const x = Math.min(Ltot, Math.max(0, (px - padL) / (W - padL - padR) * Ltot));
      drawCursor(x);
    };
    rect.addEventListener('pointermove', move);
    rect.addEventListener('pointerdown', move);
    rect.addEventListener('pointerleave', () => { const c = box.querySelector('#cursorG'); if (c) c.innerHTML = ''; });
  }

  function valueAt(xs, arr, x, pairs) {
    if (pairs) {
      // elementy: (xs[2e], xs[2e+1]); w punkcie skoku bierz wartość z prawej
      let lo = 0, hi = xs.length / 2 - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (xs[2 * mid] <= x + 1e-12) lo = mid; else hi = mid - 1; }
      const a = xs[2 * lo], b = xs[2 * lo + 1];
      const t = b > a ? Math.min(1, Math.max(0, (x - a) / (b - a))) : 0;
      return arr[2 * lo] + (arr[2 * lo + 1] - arr[2 * lo]) * t;
    }
    let i = 0;
    while (i < xs.length - 2 && xs[i + 1] < x) i++;
    const a = xs[i], b = xs[i + 1];
    const t = b > a ? Math.min(1, Math.max(0, (x - a) / (b - a))) : 0;
    return arr[i] + (arr[i + 1] - arr[i]) * t;
  }

  function drawCursor(x) {
    const c = $('chart').querySelector('#cursorG');
    if (!c || !chartMeta) return;
    const { X, W, panels, H } = chartMeta;
    const px = X(x);
    let g = `<line x1="${px}" y1="4" x2="${px}" y2="${H - 4}" class="cursor"/>`;
    const parts = [`<b>x = ${nf(x)} m</b>`];
    panels.forEach(p => {
      const vmax = valueAt(p.xs, p.env.max, x, p.pairs) * p.k;
      const vmin = valueAt(p.xs, p.env.min, x, p.pairs) * p.k;
      let txt = Math.abs(vmax - vmin) < 1e-9 ? `${p.sym} = ${nf(vmax, p.d)} ${p.unit}` : `${p.sym} max ${nf(vmax, p.d)} / min ${nf(vmin, p.d)} ${p.unit}`;
      if (p.extra) txt += ` · w_fin ${nf(valueAt(p.xs, p.extra.max, x, false) * p.k, p.d)}`;
      g += `<circle cx="${px}" cy="${p.Y(vmax)}" r="3" fill="var(--cursor)"/>`;
      if (Math.abs(vmax - vmin) > 1e-9) g += `<circle cx="${px}" cy="${p.Y(vmin)}" r="3" fill="var(--cursor)"/>`;
      parts.push(txt);
    });
    c.innerHTML = g;
    $('readout').innerHTML = parts.join('<span class="sep">|</span>');
  }

  let rt = null;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 120); });

  renderEditor();
  update();
})();
