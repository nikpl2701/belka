/* Biblioteka przekrojów i materiałów.
 * Jednostki w tabelach: wymiary mm, A cm², Iy cm⁴, W cm³, Avz cm², masa kg/m.
 * Wartości katalogowe – przed użyciem w projekcie sprawdź z tablicami producenta.
 */
(function (root) {
  // [nazwa, h, b, tw, tf, A, Iy, Wel_y, Wpl_y, Avz, masa]
  const IPE = [
    ['IPE 80', 80, 46, 3.8, 5.2, 7.64, 80.14, 20.03, 23.22, 3.58, 6.0],
    ['IPE 100', 100, 55, 4.1, 5.7, 10.32, 171.0, 34.20, 39.41, 5.08, 8.1],
    ['IPE 120', 120, 64, 4.4, 6.3, 13.21, 317.8, 52.96, 60.73, 6.31, 10.4],
    ['IPE 140', 140, 73, 4.7, 6.9, 16.43, 541.2, 77.32, 88.34, 7.64, 12.9],
    ['IPE 160', 160, 82, 5.0, 7.4, 20.09, 869.3, 108.7, 123.9, 9.66, 15.8],
    ['IPE 180', 180, 91, 5.3, 8.0, 23.95, 1317, 146.3, 166.4, 11.25, 18.8],
    ['IPE 200', 200, 100, 5.6, 8.5, 28.48, 1943, 194.3, 220.6, 14.00, 22.4],
    ['IPE 220', 220, 110, 5.9, 9.2, 33.37, 2772, 252.0, 285.4, 15.88, 26.2],
    ['IPE 240', 240, 120, 6.2, 9.8, 39.12, 3892, 324.3, 366.6, 19.14, 30.7],
    ['IPE 270', 270, 135, 6.6, 10.2, 45.95, 5790, 428.9, 484.0, 22.14, 36.1],
    ['IPE 300', 300, 150, 7.1, 10.7, 53.81, 8356, 557.1, 628.4, 25.68, 42.2],
    ['IPE 330', 330, 160, 7.5, 11.5, 62.61, 11770, 713.1, 804.3, 30.81, 49.1],
    ['IPE 360', 360, 170, 8.0, 12.7, 72.73, 16270, 903.6, 1019, 35.14, 57.1],
    ['IPE 400', 400, 180, 8.6, 13.5, 84.46, 23130, 1156, 1307, 42.69, 66.3],
    ['IPE 450', 450, 190, 9.4, 14.6, 98.82, 33740, 1500, 1702, 50.85, 77.6],
    ['IPE 500', 500, 200, 10.2, 16.0, 115.5, 48200, 1928, 2194, 59.87, 90.7],
    ['IPE 550', 550, 210, 11.1, 17.2, 134.4, 67120, 2441, 2787, 72.34, 106],
    ['IPE 600', 600, 220, 12.0, 19.0, 156.0, 92080, 3069, 3512, 83.78, 122],
  ];
  const HEA = [
    ['HEA 100', 96, 100, 5.0, 8.0, 21.24, 349.2, 72.76, 83.01, 7.56, 16.7],
    ['HEA 120', 114, 120, 5.0, 8.0, 25.34, 606.2, 106.3, 119.5, 8.46, 19.9],
    ['HEA 140', 133, 140, 5.5, 8.5, 31.42, 1033, 155.4, 173.5, 10.12, 24.7],
    ['HEA 160', 152, 160, 6.0, 9.0, 38.77, 1673, 220.1, 245.1, 13.21, 30.4],
    ['HEA 180', 171, 180, 6.0, 9.5, 45.25, 2510, 293.6, 324.9, 14.47, 35.5],
    ['HEA 200', 190, 200, 6.5, 10.0, 53.83, 3692, 388.6, 429.5, 18.08, 42.3],
    ['HEA 220', 210, 220, 7.0, 11.0, 64.34, 5410, 515.2, 568.5, 20.67, 50.5],
    ['HEA 240', 230, 240, 7.5, 12.0, 76.84, 7763, 675.1, 744.6, 25.18, 60.3],
    ['HEA 260', 250, 260, 7.5, 12.5, 86.82, 10450, 836.4, 919.8, 28.76, 68.2],
    ['HEA 280', 270, 280, 8.0, 13.0, 97.26, 13670, 1013, 1112, 31.74, 76.4],
    ['HEA 300', 290, 300, 8.5, 14.0, 112.5, 18260, 1260, 1383, 37.28, 88.3],
  ];
  const HEB = [
    ['HEB 100', 100, 100, 6.0, 10.0, 26.04, 449.5, 89.91, 104.2, 9.04, 20.4],
    ['HEB 120', 120, 120, 6.5, 11.0, 34.01, 864.4, 144.1, 165.2, 10.96, 26.7],
    ['HEB 140', 140, 140, 7.0, 12.0, 42.96, 1509, 215.6, 245.4, 13.08, 33.7],
    ['HEB 160', 160, 160, 8.0, 13.0, 54.25, 2492, 311.5, 354.0, 17.59, 42.6],
    ['HEB 180', 180, 180, 8.5, 14.0, 65.25, 3831, 425.7, 481.4, 20.24, 51.2],
    ['HEB 200', 200, 200, 9.0, 15.0, 78.08, 5696, 569.6, 642.5, 24.83, 61.3],
    ['HEB 220', 220, 220, 9.5, 16.0, 91.04, 8091, 735.5, 827.0, 27.92, 71.5],
    ['HEB 240', 240, 240, 10.0, 17.0, 106.0, 11260, 938.3, 1053, 33.23, 83.2],
    ['HEB 260', 260, 260, 10.0, 17.5, 118.4, 14920, 1148, 1283, 37.59, 93.0],
    ['HEB 280', 280, 280, 10.5, 18.0, 131.4, 19270, 1376, 1534, 41.09, 103],
    ['HEB 300', 300, 300, 11.0, 19.0, 149.1, 25170, 1678, 1869, 47.43, 117],
  ];
  const STEEL_PROFILES = { IPE, HEA, HEB };

  const STEEL_GRADES = { S235: 235, S275: 275, S355: 355 };
  const E_STEEL = 210000; // MPa

  // Drewno wg PN-EN 338 (lite) i PN-EN 14080 (klejone). MPa, kg/m³.
  const TIMBER = {
    C16: { fm: 16, fv: 3.2, E: 8000, rho: 370, glulam: false },
    C18: { fm: 18, fv: 3.4, E: 9000, rho: 380, glulam: false },
    C24: { fm: 24, fv: 4.0, E: 11000, rho: 420, glulam: false },
    C30: { fm: 30, fv: 4.0, E: 12000, rho: 460, glulam: false },
    GL24h: { fm: 24, fv: 3.5, E: 11500, rho: 420, glulam: true },
    GL28h: { fm: 28, fv: 3.5, E: 12600, rho: 460, glulam: true },
    GL32h: { fm: 32, fv: 3.5, E: 14200, rho: 490, glulam: true },
  };

  // kmod wg PN-EN 1995-1-1 tab. 3.1 (drewno lite i klejone).
  const DURATIONS = {
    perm: { name: 'stałe', kmod: [0.6, 0.6, 0.5] },
    long: { name: 'długotrwałe', kmod: [0.7, 0.7, 0.55] },
    medium: { name: 'średniotrwałe', kmod: [0.8, 0.8, 0.65] },
    short: { name: 'krótkotrwałe', kmod: [0.9, 0.9, 0.7] },
    inst: { name: 'chwilowe', kmod: [1.1, 1.1, 0.9] },
  };
  const KDEF = [0.6, 0.8, 2.0]; // klasy użytkowania 1, 2, 3


  // ---------- żelbet (PN-EN 1992-1-1, uproszczone) ----------
  // [f_ck, f_ctm] MPa, E_cm GPa – tab. 3.1
  const CONCRETE = {
    'C16/20': [16, 1.9, 29], 'C20/25': [20, 2.2, 30], 'C25/30': [25, 2.6, 31], 'C30/37': [30, 2.9, 33],
    'C35/45': [35, 3.2, 34], 'C40/50': [40, 3.5, 35], 'C45/55': [45, 3.8, 36], 'C50/60': [50, 4.1, 37],
  };
  const GAMMA_C = 1.4, GAMMA_S = 1.15, E_S = 200000;

  function rcMaterial(sec) {
    const c = CONCRETE[sec.conc] || CONCRETE['C30/37'];
    const fyk = +sec.fyk || 500;
    return { conc: CONCRETE[sec.conc] ? sec.conc : 'C30/37', fck: c[0], fctm: c[1], Ecm: c[2],
      fcd: c[0] / GAMMA_C, fyk, fyd: fyk / GAMMA_S };
  }

  /* Zginanie – przekrój prostokątny pojedynczo zbrojony, prostokątny wykres naprężeń (λ = 0,8, η = 1).
   * MEd [kNm], b, d [mm] → A_s [mm²]. */
  function rcBending(MEd, b, d, mat) {
    const mu = Math.abs(MEd) * 1e6 / (b * d * d * mat.fcd);
    const xiLim = 0.8 * 0.0035 / (0.0035 + mat.fyd / E_S);
    const xi = mu < 0.5 ? 1 - Math.sqrt(1 - 2 * mu) : Infinity;
    const As = xi * b * d * mat.fcd / mat.fyd;
    const AsMin = Math.max(0.26 * mat.fctm / mat.fyk, 0.0013) * b * d;
    return { mu, xi, xiLim, As, AsMin, AsReq: Math.max(As, AsMin) };
  }

  /* Propozycja prętów: płyta (b ≥ 500 mm) – rozstaw, belka – liczba prętów. */
  function rcBars(AsReq, b, h, phi) {
    const a1 = Math.PI * phi * phi / 4;
    if (!isFinite(AsReq)) return { text: '–', AsProv: NaN };
    if (b >= 500) {
      const smax = Math.min(2 * h, 250);
      const s = Math.min(Math.floor(b * a1 / AsReq / 10) * 10, smax);
      if (s < 60) return { text: `φ${phi} – za gęsto, zwiększ średnicę`, AsProv: NaN };
      return { text: `φ${phi} co ${s} mm`, AsProv: b * a1 / s, s };
    }
    const n = Math.max(2, Math.ceil(AsReq / a1 - 1e-9));
    return { text: `${n}φ${phi}`, AsProv: n * a1, n };
  }

  /* Nośność na ścinanie elementu bez zbrojenia poprzecznego V_Rd,c [kN] (wzór 6.2). */
  function rcVRdc(b, d, rho, mat) {
    const k = Math.min(2, 1 + Math.sqrt(200 / d));
    const vmin = 0.035 * Math.pow(k, 1.5) * Math.sqrt(mat.fck);
    const v = Math.max(0.18 / GAMMA_C * k * Math.cbrt(100 * Math.min(rho, 0.02) * mat.fck), vmin);
    return { VRdc: v * b * d / 1000, k, vmin };
  }

  /* Graniczna smukłość l/d (wzór 7.16, ρ' = 0) z poprawką 500/f_yk (A_s,prov ≈ A_s,req). */
  function rcSpanDepth(K, rho, mat) {
    const f = Math.sqrt(mat.fck), r0 = f * 1e-3, r = Math.max(rho, 1e-6);
    const base = r <= r0 ? 11 + 1.5 * f * r0 / r + 3.2 * f * Math.pow(r0 / r - 1, 1.5) : 11 + 1.5 * f * r0 / r;
    return K * base * Math.min(500 / mat.fyk, 1.5);
  }

  // ---------- zestawienie obciążeń stropu ----------
  // Posadzka (warstwa wierzchnia): [nazwa, grubość m, ciężar kN/m³]
  const FLOORS = {
    deszczolki: ['Deszczółki (parkiet) na kleju', 0.022, 9],
    deski: ['Deski podłogowe', 0.028, 5.5],
    panele: ['Panele podłogowe z podkładem', 0.010, 8],
    plytki: ['Płytki ceramiczne na kleju', 0.015, 21],
    lastryko: ['Lastryko', 0.020, 22],
    kamien: ['Płyty kamienne (granit)', 0.020, 28],
    pcv: ['Wykładzina PCV', 0.003, 14],
  };
  // Przeznaczenie: [nazwa, q_k kN/m², ψ₂] – wartości orientacyjne wg PN-EN 1991-1-1 tab. 6.2,
  // przed użyciem porównaj z tematem projektu / prowadzącym.
  const USES = {
    mieszkalne: ['Mieszkalne (kat. A)', 2.0, 0.3],
    koszary: ['Koszary', 4.0, 0.3],
    biura: ['Biura (kat. B)', 3.0, 0.3],
    szkoly: ['Szkoły, kawiarnie, restauracje (C1)', 3.0, 0.6],
    sale: ['Sale ze stałymi siedzeniami – kina, kościoły (C2)', 4.0, 0.6],
    publiczne: ['Muzea, hole, korytarze bud. publicznych, szpitale (C3)', 5.0, 0.6],
    sport: ['Sale gimnastyczne, taneczne (C4)', 5.0, 0.6],
    sklepy: ['Sklepy (D1)', 5.0, 0.6],
    magazyny: ['Magazyny, archiwa, biblioteki (E1)', 7.5, 0.8],
    wlasne: ['Inne – wpisz q_k', null, 0.3],
  };
  function defaultZs() {
    const f = FLOORS.deszczolki;
    return {
      use: 'koszary', qk: 4.0, floor: 'deszczolki', bw: 1.0,
      rows: [
        { n: f[0], t: f[1], y: f[2], v: 0, floor: true },
        { n: 'Podkład cementowy', t: 0.03, y: 22, v: 0 },
        { n: 'Folia', t: 0, y: 0, v: 0.01 },
        { n: 'Styropian', t: 0.05, y: 0.45, v: 0 },
        { n: 'Płyta żelbetowa', t: 0.10, y: 25, v: 0, slab: true },
        { n: 'Tynk od spodu', t: 0.015, y: 19, v: 0 },
      ],
    };
  }

  /* Zwraca właściwości przekroju w jednostkach obliczeniowych:
   * EI [kNm²], gk ciężar własny [kN/m] oraz dane do sprawdzeń. */
  function sectionProps(sec) {
    if (sec.kind === 'timber') {
      const m = TIMBER[sec.timberClass] || TIMBER.C24;
      const b = +sec.b, h = +sec.h; // mm
      const I = b * h * h * h / 12; // mm⁴
      const W = b * h * h / 6; // mm³
      return {
        kind: 'timber',
        label: `${sec.timberClass} ${b}×${h} mm`,
        EI: m.E * 1e3 * I * 1e-12,
        gk: m.rho * 9.81e-3 * b * h * 1e-6, // kN/m
        b, h, I, W, A: b * h, mat: m,
      };
    }
    if (sec.kind === 'steel') {
      const list = STEEL_PROFILES[sec.family] || IPE;
      const row = list.find(r => r[0] === sec.profile) || list[0];
      const [name, h, b, tw, tf, A, Iy, Wel, Wpl, Avz, mass] = row;
      const fy = STEEL_GRADES[sec.grade] || 235;
      return {
        kind: 'steel',
        label: `${name}, ${sec.grade}`,
        EI: E_STEEL * 1e3 * Iy * 1e-8,
        gk: mass * 9.81e-3,
        name, h, b, tw, tf, A, Iy, Wel, Wpl, Avz, fy,
      };
    }
    if (sec.kind === 'rc') {
      const b = +sec.b, h = +sec.h, phi = +sec.phi || 10;
      const mat = rcMaterial(sec);
      const I = b * h * h * h / 12; // mm⁴
      return {
        kind: 'rc',
        label: `żelbet ${mat.conc} ${b}×${h} mm, f_yk = ${mat.fyk} MPa`,
        EI: mat.Ecm * 1e6 * I * 1e-12,
        gk: 25 * b * h * 1e-6,
        b, h, I, phi, d: h - (+sec.cov || 0) - phi / 2, mat,
      };
    }
    // własny przekrój
    const E = +sec.E, I = +sec.I; // MPa, cm⁴
    return {
      kind: 'custom',
      label: `własny: E=${E} MPa, I=${I} cm⁴`,
      EI: E * 1e3 * I * 1e-8,
      gk: +sec.gk || 0,
      W: +sec.W || 0, fd: +sec.fd || 0,
    };
  }

  const api = {
    STEEL_PROFILES, STEEL_GRADES, TIMBER, DURATIONS, KDEF, E_STEEL, sectionProps,
    CONCRETE, rcMaterial, rcBending, rcBars, rcVRdc, rcSpanDepth, FLOORS, USES, defaultZs,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Sections = api;
})(this);
