// grid: the lines are rows, each centred, and the characters sit in aligned columns. A wider glyph
// pushes its column wider and its row taller, so its neighbours move aside and up or down. Column
// widths and row heights move on springs of their own, toward the widest slot of the column and
// the most grown slot of the row, so they never jump or turn back. The anchor word never moves:
// its row stays in the middle and its columns keep their plain width, so a glyph that grows in
// another row of those columns draws over its neighbours a little.

var GROW = 0.5;    // em a row can grow taller
var ROOM = 1.35;   // the width the rows can grow to, as a share of their plain width
var SPRING = 20;   // rad/s at speed 1, as the slots
var SETTLE = 13;   // going narrower: a column never gets narrower than the slots in it

// Moves w[i] (velocity v[i]) toward `to` on an exact critically damped spring for m.dt ms.
// Returns true while it moves.
function step(w, v, i, to, m) {
  if (w[i] === undefined) { w[i] = to; v[i] = 0; }
  if (w[i] === to && !v[i]) return false;
  var k = (to < w[i] ? SETTLE : SPRING) * m.speed, t = m.dt / 1000, d = w[i] - to, e = Math.exp(-k * t), j = (v[i] + k * d) * t;
  d = (d + j) * e;
  v[i] = (v[i] - k * j) * e;
  if (Math.abs(d) < 0.1 && Math.abs(v[i]) < 6) { w[i] = to; v[i] = 0; return false; }
  w[i] = to + d;
  return true;
}

// The number of columns, and the first column of each row.
function columnsOf(m) {
  var n = 0;
  m.lines.forEach(function (L) { n = Math.max(n, L.cells.length); });
  m.lines.forEach(function (L) { L.off = (n - L.cells.length) >> 1; });
  return n;
}

// Where the middle of the anchor word is, from the left edges x and widths w of the columns.
function anchorMid(m, x, w) {
  var a = m.anchor, off = m.lines[a.line].off, last = off + a.to - 1;
  return (x[off + a.from] + x[last] + w[last]) / 2;
}

export var grid = {
  name: 'grid',
  size: function (m) {
    var n = columnsOf(m), w = [], x = [], wide = 0, a = m.anchor, rows = m.lines.length, k;
    m.lines.forEach(function (L) {
      L.cells.forEach(function (c, i) { w[L.off + i] = Math.max(w[L.off + i] || 0, c.pw); });
    });
    for (k = 0; k < n; k++) { x[k] = wide; wide += w[k]; }
    // Anchored, the grid is as wide and as tall as twice its longer side around the anchor.
    var mid = a ? anchorMid(m, x, w) : wide / 2, row = m.lineEm + GROW;
    var tall = a ? 2 * Math.max(a.line + 0.5, rows - a.line - 0.5) * row : rows * row;
    var fs = m.fit ? Math.max(8, Math.min(m.maxSize, m.width / (2 * Math.max(mid, wide - mid) * ROOM))) : m.fs;
    return { fs: fs, height: Math.ceil((tall + 0.3) * fs) };  // room for labels under the last row
  },
  place: function (m) {
    var s = m.state, n = columnsOf(m), a = m.anchor, tw = [], th = [], x = [], y = [], busy = false, left = 0, right = 0, tall = 0, k, r;
    // The anchor's columns [a0, a1): none without an anchor.
    var a0 = a ? m.lines[a.line].off + a.from : 0, a1 = a ? a0 + a.to - a.from : 0;
    if (!s.w) { s.w = []; s.v = []; s.h = []; s.u = []; }
    m.lines.forEach(function (L, r) {
      var grow = 0;
      L.cells.forEach(function (c, i) {
        k = L.off + i;
        tw[k] = Math.max(tw[k] || 0, k >= a0 && k < a1 ? c.pw * m.fs : c.peak);
        grow = Math.max(grow, c.peak - c.pw * m.fs);
      });
      th[r] = m.lineH + Math.min(GROW * m.fs, grow);
    });
    // Column edges count from the anchor's first column both ways, so that the anchor's own are
    // sums of the same widths in every frame and come out exactly the same.
    for (k = 0; k < n; k++) busy = step(s.w, s.v, k, tw[k], m) || busy;
    for (k = a0; k < n; k++) { x[k] = right; right += s.w[k]; }
    for (k = a0 - 1; k >= 0; k--) { left -= s.w[k]; x[k] = left; }
    for (r = 0; r < m.lines.length; r++) { busy = step(s.h, s.u, r, th[r], m) || busy; y[r] = tall; tall += s.h[r]; }
    // [p0, p1] stays at the middle of the element: the anchor's columns, or the middle of the grid.
    // A grid wider than the element draws the columns beside it closer to it.
    var p0 = a ? 0 : right / 2, p1 = a ? x[a1 - 1] + s.w[a1 - 1] : p0, half = (p1 - p0) / 2;
    var squeeze = Math.min(1, Math.max(0, m.width / 2 - half) / Math.max(p0 - left, right - p1));
    var mid = a ? y[a.line] + s.h[a.line] / 2 : tall / 2;
    m.lines.forEach(function (L, r) {
      L.cells.forEach(function (c, i) {
        var at = x[L.off + i] + s.w[L.off + i] / 2;
        if (at < p0) at = (at - p0) * squeeze - half;
        else if (at > p1) at = (at - p1) * squeeze + half;
        else at -= p0 + half;
        c.cx = m.width / 2 + at;
        c.cy = m.height / 2 + (y[r] + s.h[r] / 2 - mid);
        c.r = 0;
      });
    });
    return busy;
  }
};
