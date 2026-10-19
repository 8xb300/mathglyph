// columns: vertical text. Each line is a column, the columns go left to right, and the characters
// stack top to bottom. A slot grows along its column as its glyph widens, so a column breathes up
// and down from its middle, or from its anchor word, which stays still.
// spacing: the distance from one column to the next, in em.

var PAD = 0.5;   // em each slot gets along the column on top of its width, so the letters do not touch

export var columns = {
  name: 'columns',
  defaults: { spacing: 1.5 },
  vertical: true,
  // The tallest column fits the element's width or 80% of the viewport, whichever is smaller,
  // with room to grow, and all the columns fit the width.
  size: function (m) {
    var most = 1;
    m.lines.forEach(function (L) {
      var n = 0, mid = 0;
      L.cells.forEach(function (c, i) {
        if (i === L.a0) mid = n;
        if (i === L.a1) mid = (mid + n) / 2;
        n += c.pw + PAD;
      });
      if (L.a1 === L.cells.length) mid = (mid + n) / 2;
      // An anchored column is as tall as twice its longer side, since the anchor stays in the middle.
      most = Math.max(most, L.a1 ? 2 * Math.max(mid, n - mid) : n);
    });
    var fs = m.fit
      ? Math.max(8, Math.min(m.maxSize, Math.min(m.width, 0.8 * m.viewH) / (most * 1.2), m.width / (m.lines.length * m.settings.spacing)))
      : m.fs;
    return { fs: fs, height: Math.ceil(most * 1.2 * fs), pad: PAD };
  },
  place: function (m) {
    var step = m.settings.spacing * m.fs, left = (m.width - m.lines.length * step) / 2;
    m.lines.forEach(function (L, i) {
      var cs = L.cells, y = 0, up = 0, j, c, top;
      // Offsets count from the anchor's first glyph both ways, so that the anchor's own are sums of
      // the same widths in every frame and come out exactly the same.
      for (j = L.a0; j < cs.length; j++) { cs[j].x = y; y += cs[j].w; }
      for (j = L.a0 - 1; j >= 0; j--) { up -= cs[j].w; cs[j].x = up; }
      top = L.a1 ? m.height / 2 - (cs[L.a1 - 1].x + cs[L.a1 - 1].w) / 2 : (m.height - y) / 2;
      for (j = 0; j < cs.length; j++) {
        c = cs[j];
        c.cx = left + (i + 0.5) * step;
        c.cy = top + c.x + c.w / 2;
        c.r = 0;
      }
    });
  }
};
