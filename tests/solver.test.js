// Testy solvera na przypadkach z tablic (uruchom: node tests/solver.test.js)
const { solve } = require('../js/solver.js');

let fails = 0;
function near(name, got, exp, tol = 1e-3) {
  const ok = Math.abs(got - exp) <= tol * Math.max(1, Math.abs(exp));
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: ${got.toFixed(5)} (oczekiwane ${exp.toFixed(5)})`);
  if (!ok) fails++;
}
const maxAbs = a => a.reduce((m, v) => Math.abs(v) > Math.abs(m) ? v : m, 0);
const max = a => Math.max(...a), min = a => Math.min(...a);
const EI = 1000, q = 10, L = 6, P = 20;

// 1. Belka swobodnie podparta, obciążenie równomierne
let r = solve({ spans: [L], nodes: [{ support: 'pin' }, { support: 'pin' }], EI,
  cases: [[{ type: 'dist', x1: 0, x2: L, q1: q, q2: q }]] }).cases[0];
near('SP q: Mmax = qL²/8', max(r.M), q * L * L / 8);
near('SP q: R_A = qL/2', r.R[0].R, q * L / 2);
near('SP q: wmax = 5qL⁴/384EI', max(r.w), 5 * q * L ** 4 / 384 / EI);

// 2. Siła skupiona w środku
r = solve({ spans: [L], nodes: [{ support: 'pin' }, { support: 'pin' }], EI,
  cases: [[{ type: 'point', x: L / 2, P }]] }).cases[0];
near('SP P: Mmax = PL/4', max(r.M), P * L / 4);
near('SP P: wmax = PL³/48EI', max(r.w), P * L ** 3 / 48 / EI);

// 3. Wspornik z siłą na końcu
r = solve({ spans: [L], nodes: [{ support: 'fixed' }, { support: 'none' }], EI,
  cases: [[{ type: 'point', x: L, P }]] }).cases[0];
near('Wspornik: M utw. = -PL', min(r.M), -P * L);
near('Wspornik: w = PL³/3EI', max(r.w), P * L ** 3 / 3 / EI);
near('Wspornik: R = P', r.R[0].R, P);

// 4. Obustronnie utwierdzona, q
r = solve({ spans: [L], nodes: [{ support: 'fixed' }, { support: 'fixed' }], EI,
  cases: [[{ type: 'dist', x1: 0, x2: L, q1: q, q2: q }]] }).cases[0];
near('Utw-utw: M podp. = -qL²/12', min(r.M), -q * L * L / 12);
near('Utw-utw: M przęsło = qL²/24', max(r.M), q * L * L / 24);
near('Utw-utw: w = qL⁴/384EI', max(r.w), q * L ** 4 / 384 / EI);

// 5. Belka dwuprzęsłowa, q na całości
r = solve({ spans: [L, L], nodes: [{ support: 'pin' }, { support: 'pin' }, { support: 'pin' }], EI,
  cases: [[{ type: 'dist', x1: 0, x2: 2 * L, q1: q, q2: q }]] }).cases[0];
near('2 przęsła: M podpora = -qL²/8', min(r.M), -q * L * L / 8);
near('2 przęsła: R_B = 1.25qL', r.R[1].R, 1.25 * q * L);
near('2 przęsła: M przęsło = 9qL²/128', max(r.M), 9 * q * L * L / 128);

// 6. Obciążenie trójkątne 0→q, swobodnie podparta: Mmax = qL²/(9√3)
r = solve({ spans: [L], nodes: [{ support: 'pin' }, { support: 'pin' }], EI,
  cases: [[{ type: 'dist', x1: 0, x2: L, q1: 0, q2: q }]] }).cases[0];
near('Trójkąt: Mmax = qL²/(9√3)', max(r.M), q * L * L / (9 * Math.sqrt(3)));
near('Trójkąt: R_B = qL/3', r.R[1].R, q * L / 3);

// 7. Belka Gerbera: utwierdzenie – przegub – podpora; siła P w przegubie
r = solve({ spans: [3, 3], nodes: [{ support: 'fixed' }, { support: 'none', hinge: true }, { support: 'pin' }], EI,
  cases: [[{ type: 'dist', x1: 0, x2: 6, q1: q, q2: q }]] }).cases[0];
// prawa część: belka swobodnie podparta 3 m → przekazuje 15 kN na wspornik; M utw = -(15·3 + 10·3²/2) = -90
near('Gerber: M utw.', r.R[0].M === 0 ? 0 : min(r.M), -90);
near('Gerber: R_C = 15', r.R[2].R, 15);
near('Gerber: M w przegubie = 0', r.M[r.M.length / 2 - 1], 0, 1e-2);

// 8. Moment skupiony w środku belki swobodnie podpartej: R = M/L
r = solve({ spans: [L], nodes: [{ support: 'pin' }, { support: 'pin' }], EI,
  cases: [[{ type: 'moment', x: L / 2, M: 12 }]] }).cases[0];
near('Moment: R_A = -M/L', r.R[0].R, -12 / L);
near('Moment: skok M = M/2 po obu stronach', Math.abs(maxAbs(r.M)), 6);
near('Moment: M tuż za punktem = +M/2', max(r.M), 6);

// 9. Mechanizm
const bad = solve({ spans: [L], nodes: [{ support: 'pin' }, { support: 'none' }], EI, cases: [[]] });
console.log(bad.ok ? 'FAIL mechanizm niewykryty' : 'OK   mechanizm wykryty: ' + bad.error);
if (bad.ok) fails++;

// 10. Żelbet: płyta 1 m, d = 75 mm, C30/37, f_yk = 440 MPa, M_Ed = 5 kNm
const S = require('../js/sections.js');
const mat = S.rcMaterial({ conc: 'C30/37', fyk: 440 });
near('Żelbet: f_cd = 30/1,4', mat.fcd, 30 / 1.4);
near('Żelbet: f_yd = 440/1,15', mat.fyd, 440 / 1.15);
const rb = S.rcBending(5, 1000, 75, mat);
const mu = 5e6 / (1000 * 75 * 75 * (30 / 1.4));
near('Żelbet: μ', rb.mu, mu);
near('Żelbet: A_s = ξ·b·d·f_cd/f_yd', rb.As, (1 - Math.sqrt(1 - 2 * mu)) * 1000 * 75 * (30 / 1.4) / (440 / 1.15));
near('Żelbet: A_s,min = 0,26·f_ctm/f_yk·b·d', rb.AsMin, 0.26 * 2.9 / 440 * 1000 * 75);
near('Żelbet: ξ_eff,lim (f_yk 440)', rb.xiLim, 0.8 * 0.0035 / (0.0035 + 440 / 1.15 / 200000));
const bars = S.rcBars(rb.AsReq, 1000, 100, 10);
console.log((bars.AsProv >= rb.AsReq && bars.s <= 200 ? 'OK   ' : 'FAIL ') + 'Żelbet: pręty ' + bars.text);
if (!(bars.AsProv >= rb.AsReq && bars.s <= 200)) fails++;
const sl = S.sectionProps({ kind: 'rc', conc: 'C30/37', fyk: 440, b: 1000, h: 100, cov: 20, phi: 10 });
near('Żelbet: ciężar płyty 0,10·25', sl.gk, 2.5);
near('Żelbet: d = h − c − φ/2', sl.d, 75);
// zestawienie domyślne = tabelka ręczna (ST 3,68 kN/m²)
const z = S.defaultZs();
near('Zestawienie: suma stałych', z.rows.reduce((a, L) => a + (L.t > 0 && L.y > 0 ? L.t * L.y : L.v), 0), 3.6755);

console.log(fails ? `\n${fails} test(ów) nie przeszło` : '\nWszystkie testy OK');
process.exit(fails ? 1 : 0);
