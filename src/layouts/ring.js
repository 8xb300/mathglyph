// ring: the text around one circle, clockwise from the top, the lines one after the other with a
// gap between them. The circumference is the sum of the slots and the gaps, so the ring grows
// outward as glyphs widen, and the glyphs turn with the circle. The anchor word stays at the top,
// and the circle grows down, away from it.
// gap: the space between two lines, in em.

var ROOM = 1.2;   // the circumference the ring can grow to, as a share of its plain one

export var ring = {
  name: 'ring',
  defaults: { gap: 1 },
  // The ring at its largest, with a line's height around it, fits the element's width or 80% of
  // the viewport, whichever is smaller.
  size: function (m) {
    var around = 0;
    m.lines.forEach(function (L) {
      L.cells.forEach(function (c) { around += c.pw; });
      around += m.settings.gap;
    });
    var across = around * ROOM / Math.PI + m.lineEm;
    var fs = m.fit ? Math.max(8, Math.min(m.maxSize, Math.min(m.width, 0.8 * m.viewH) / across)) : m.fs;
    return { fs: fs, height: Math.ceil(across * fs) };
  },
  place: function (m) {
    var gap = m.settings.gap * m.fs, around = 0, plain = 0, at = gap / 2, a = m.anchor, cs, k, x, t;
    m.lines.forEach(function (L) {
      L.cells.forEach(function (c) { c.x = around; around += c.w; plain += c.pw * m.fs; });
      around += gap;
      plain += gap;
    });
    var R = Math.max(around / (2 * Math.PI), 1), cx = m.width / 2, cy = m.height / 2;
    if (a) {
      cs = m.lines[a.line].cells;
      at = -(cs[a.from].x + cs[a.to - 1].x + cs[a.to - 1].w) / 2;
      cy = m.lineH / 2 + R;
    }
    m.lines.forEach(function (L) {
      L.cells.forEach(function (c) {
        t = (c.x + c.w / 2 + at) / R;
        c.cx = cx + R * Math.sin(t);
        c.cy = cy - R * Math.cos(t);
        c.r = t;
      });
    });
    if (!a) return;
    // The anchor's glyphs go on the circle of the plain text instead, which touches this one at the
    // top, at offsets that are sums of the same widths in every frame, so they never move.
    R = Math.max(plain / (2 * Math.PI), 1);
    for (x = 0, k = a.from; k < a.to; k++) x -= cs[k].w / 2;
    for (k = a.from; k < a.to; k++) {
      t = (x + cs[k].w / 2) / R;
      cs[k].cx = cx + R * Math.sin(t);
      cs[k].cy = m.lineH / 2 + R - R * Math.cos(t);
      cs[k].r = t;
      x += cs[k].w;
    }
  }
};
