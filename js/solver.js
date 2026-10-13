/* Solver belek ciągłych – metoda przemieszczeń (MES, elementy belkowe Eulera–Bernoulliego).
 *
 * Konwencje:
 *  - x od lewego końca belki [m]
 *  - obciążenia P, q dodatnie w dół [kN, kN/m]; moment skupiony M dodatni zgodnie z ruchem wskazówek zegara [kNm]
 *  - reakcje pionowe dodatnie w górę, momenty utwierdzenia dodatnie zgodnie z ruchem wskazówek zegara
 *  - siła tnąca V: suma sił pionowych (w górę) po lewej stronie przekroju
 *  - moment zginający M > 0 rozciąga włókna dolne
 *  - ugięcie w > 0 w dół
 */
(function (root) {
  const BAND = 4;

  function buildMesh(spans, nodes, cases, perSpan) {
    const xs = [0];
    for (const L of spans) xs.push(xs[xs.length - 1] + L);
    const Ltot = xs[xs.length - 1];
    const eps = Ltot * 1e-9;
    const keys = xs.slice();
    for (const loads of cases) for (const ld of loads) {
      if (ld.type === 'dist') keys.push(ld.x1, ld.x2); else keys.push(ld.x);
    }
    const sorted = keys.filter(x => x >= -eps && x <= Ltot + eps)
      .map(x => Math.min(Math.max(x, 0), Ltot)).sort((a, b) => a - b);
    const uniq = [];
    for (const x of sorted) if (!uniq.length || x - uniq[uniq.length - 1] > eps) uniq.push(x);
    // podział na drobne elementy
    const h = Ltot / perSpan;
    const pts = [uniq[0]];
    for (let i = 1; i < uniq.length; i++) {
      const a = uniq[i - 1], b = uniq[i];
      const n = Math.max(1, Math.ceil((b - a) / h - 1e-9));
      for (let k = 1; k <= n; k++) pts.push(k === n ? b : a + (b - a) * k / n);
    }
    // indeksy punktów odpowiadających węzłom użytkownika
    const nodePt = xs.map(x => {
      let best = 0;
      for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i] - x) < Math.abs(pts[best] - x)) best = i;
      return best;
    });
    return { pts, nodeX: xs, nodePt, Ltot, eps };
  }

  function elemK(EI, L) {
    const a = EI / (L * L * L);
    return [
      [12 * a, 6 * L * a, -12 * a, 6 * L * a],
      [6 * L * a, 4 * L * L * a, -6 * L * a, 2 * L * L * a],
      [-12 * a, -6 * L * a, 12 * a, -6 * L * a],
      [6 * L * a, 2 * L * L * a, -6 * L * a, 4 * L * L * a],
    ];
  }

  // Zastępcze siły węzłowe od obciążenia liniowo zmiennego (w górę dodatnie): pa na lewym, pb na prawym końcu.
  function elemFeq(pa, pb, L) {
    return [
      L * (7 * pa + 3 * pb) / 20,
      L * L * (3 * pa + 2 * pb) / 60,
      L * (3 * pa + 7 * pb) / 20,
      -L * L * (2 * pa + 3 * pb) / 60,
    ];
  }

  // Rozkład LDLᵀ / eliminacja Gaussa dla macierzy pasmowej (symetryczna, dodatnio określona).
  function factorBand(A, n, b) {
    const w = 2 * b + 1;
    let maxDiag = 0;
    for (let i = 0; i < n; i++) maxDiag = Math.max(maxDiag, Math.abs(A[i * w + b]));
    for (let k = 0; k < n; k++) {
      const piv = A[k * w + b];
      if (!(piv > maxDiag * 1e-11)) return false;
      const iEnd = Math.min(n - 1, k + b);
      for (let i = k + 1; i <= iEnd; i++) {
        const f = A[i * w + (k - i + b)] / piv;
        if (f === 0) continue;
        A[i * w + (k - i + b)] = f; // zapamiętaj mnożnik
        for (let j = k + 1; j <= Math.min(n - 1, k + b); j++) {
          A[i * w + (j - i + b)] -= f * A[k * w + (j - k + b)];
        }
      }
    }
    return true;
  }

  function solveBand(A, n, b, rhs) {
    const w = 2 * b + 1;
    const y = Float64Array.from(rhs);
    for (let k = 0; k < n; k++) {
      for (let i = k + 1; i <= Math.min(n - 1, k + b); i++) y[i] -= A[i * w + (k - i + b)] * y[k];
    }
    for (let i = n - 1; i >= 0; i--) {
      let s = y[i];
      for (let j = i + 1; j <= Math.min(n - 1, i + b); j++) s -= A[i * w + (j - i + b)] * y[j];
      y[i] = s / A[i * w + b];
    }
    return y;
  }

  /**
   * model = { spans:[L], nodes:[{support:'fixed'|'pin'|'none', hinge:bool}], EI, cases:[[obciążenia]], perSpan? }
   * Zwraca { ok, error?, xs (punkty sił wewn.), xw (punkty ugięć), cases:[{V,M,w,R}] }
   */
  function solve(model) {
    const { spans, nodes, EI } = model;
    const cases = model.cases;
    if (!spans.length || spans.some(L => !(L > 0))) return { ok: false, error: 'Długości przęseł muszą być dodatnie.' };
    if (!(EI > 0)) return { ok: false, error: 'Sztywność EI musi być dodatnia.' };
    const mesh = buildMesh(spans, nodes, cases, model.perSpan || 400);
    const { pts, nodePt, eps } = mesh;
    const np = pts.length;

    // numeracja stopni swobody
    const hingeAt = new Array(np).fill(false);
    const supAt = new Array(np).fill('none');
    nodes.forEach((nd, i) => {
      const p = nodePt[i];
      supAt[p] = nd.support;
      if (nd.hinge && i > 0 && i < nodes.length - 1 && nd.support !== 'fixed') hingeAt[p] = true;
    });
    const vD = [], tL = [], tR = [];
    let nd = 0;
    for (let i = 0; i < np; i++) {
      vD.push(nd++); tL.push(nd++);
      tR.push(hingeAt[i] ? nd++ : tL[i]);
    }
    const ndof = nd;
    const fixedDof = new Uint8Array(ndof);
    for (let i = 0; i < np; i++) {
      if (supAt[i] === 'pin' || supAt[i] === 'fixed') fixedDof[vD[i]] = 1;
      if (supAt[i] === 'fixed') fixedDof[tL[i]] = fixedDof[tR[i]] = 1;
    }
    const map = new Int32Array(ndof);
    let nf = 0;
    for (let d = 0; d < ndof; d++) map[d] = fixedDof[d] ? -1 : nf++;

    // macierz sztywności
    const w = 2 * BAND + 1;
    const K = new Float64Array(nf * w);
    const elems = [];
    for (let e = 0; e < np - 1; e++) {
      const L = pts[e + 1] - pts[e];
      const k = elemK(EI, L);
      const dofs = [vD[e], tR[e], vD[e + 1], tL[e + 1]];
      elems.push({ L, k, dofs, xa: pts[e], xb: pts[e + 1] });
      for (let a = 0; a < 4; a++) {
        const ia = map[dofs[a]];
        if (ia < 0) continue;
        for (let c = 0; c < 4; c++) {
          const ic = map[dofs[c]];
          if (ic < 0) continue;
          K[ia * w + (ic - ia + BAND)] += k[a][c];
        }
      }
    }
    if (nf > 0 && !factorBand(K, nf, BAND)) {
      return { ok: false, error: 'Układ geometrycznie zmienny (mechanizm) – dodaj podpory lub usuń przeguby.' };
    }
    // sprawdzenie, czy belka w ogóle ma podpory pionowe (gdy nf==0 wszystko utwierdzone – też OK)
    if (!supAt.some(s => s !== 'none')) return { ok: false, error: 'Belka nie ma żadnej podpory.' };

    const pointIdx = x => {
      let lo = 0, hi = np - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m] <= x) lo = m; else hi = m; }
      return Math.abs(pts[lo] - x) <= Math.abs(pts[hi] - x) ? lo : hi;
    };

    const out = [];
    for (const loads of cases) {
      const F = new Float64Array(ndof);     // obciążenia węzłowe (bez zastępczych)
      const feqE = elems.map(() => [0, 0, 0, 0]);
      for (const ld of loads) {
        if (ld.type === 'point') {
          F[vD[pointIdx(ld.x)]] -= ld.P;
        } else if (ld.type === 'moment') {
          F[tL[pointIdx(ld.x)]] -= ld.M;
        } else if (ld.type === 'dist') {
          const x1 = Math.min(ld.x1, ld.x2), x2 = Math.max(ld.x1, ld.x2);
          const q1 = ld.x1 <= ld.x2 ? ld.q1 : ld.q2, q2 = ld.x1 <= ld.x2 ? ld.q2 : ld.q1;
          if (x2 - x1 <= eps) continue;
          const qAt = x => q1 + (q2 - q1) * (x - x1) / (x2 - x1);
          elems.forEach((el, e) => {
            if (el.xa >= x1 - eps && el.xb <= x2 + eps) {
              const f = elemFeq(-qAt(el.xa), -qAt(el.xb), el.L);
              for (let a = 0; a < 4; a++) feqE[e][a] += f[a];
            }
          });
        }
      }
      const Ftot = Float64Array.from(F);
      elems.forEach((el, e) => { for (let a = 0; a < 4; a++) Ftot[el.dofs[a]] += feqE[e][a]; });
      const rhs = new Float64Array(nf);
      for (let d = 0; d < ndof; d++) if (map[d] >= 0) rhs[map[d]] = Ftot[d];
      const u = nf > 0 ? solveBand(K, nf, BAND, rhs) : rhs;
      const d = new Float64Array(ndof);
      for (let i = 0; i < ndof; i++) if (map[i] >= 0) d[i] = u[map[i]];

      // siły wewnętrzne i reakcje
      const V = [], M = [];
      const r = new Float64Array(ndof);
      elems.forEach((el, e) => {
        const de = el.dofs.map(i => d[i]);
        const fe = [0, 0, 0, 0];
        for (let a = 0; a < 4; a++) {
          let s = -feqE[e][a];
          for (let c = 0; c < 4; c++) s += el.k[a][c] * de[c];
          fe[a] = s;
          r[el.dofs[a]] += s;
        }
        V.push(fe[0], -fe[2]);
        M.push(-fe[1], fe[3]);
      });
      for (let i = 0; i < ndof; i++) r[i] -= F[i];
      const R = nodes.map((nd, i) => {
        const p = nodePt[i];
        return {
          R: nd.support !== 'none' ? r[vD[p]] : 0,
          M: nd.support === 'fixed' ? -r[tL[p]] : 0,
        };
      });
      const wv = pts.map((_, i) => -d[vD[i]]);
      out.push({ V, M, w: wv, R });
    }
    const xs = [];
    elems.forEach(el => xs.push(el.xa, el.xb));
    return { ok: true, xs, xw: pts, nodeX: mesh.nodeX, cases: out };
  }

  const api = { solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BeamSolver = api;
})(this);
