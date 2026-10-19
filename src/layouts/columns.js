// columns: vertical text. Each line is a column, and the characters stack top to bottom, upright.
// A slot grows along its column as its glyph widens, so a column breathes up and down from its
// middle, or from its anchor word, which stays still.
// columnGap: the space between two columns, in em. A column is 1 em wide, the width of a CJK
// character, so 0 sets the columns side by side, as the characters on a sign.
// spacing (v0.5.0): the distance from the middle of one column to the next, in em. Code written for
// v0.5.0 sets it; when set, it wins over columnGap.
// columnOrder: 'rtl' puts the first line on the right, as in Chinese, Japanese and Korean vertical
// writing, 'ltr' on the left. 'auto': 'rtl' when most of the characters are CJK, else 'ltr'.

var PAD = 0.5;       // em each slot gets along the column on top of its width, so the letters do not touch
var CJK_PAD = 0.2;   // the same for text that is mostly CJK: its square characters stack closer, as in print
var CJK = /[\p{scx=Han}\p{scx=Hiragana}\p{scx=Katakana}\p{scx=Hangul}]/u;

export var columns = {
  name: 'columns',
  defaults: { columnGap: 0.5, columnOrder: 'auto' },
  vertical: true,
  // The tallest column fits the element's width or 80% of the viewport, whichever is smaller,
  // with room to grow, and all the columns fit the width.
  size: function (m) {
    var most = 1, pad = mostlyCJK(m) ? CJK_PAD : PAD;
    m.lines.forEach(function (L) {
      var n = 0, mid = 0;
      L.cells.forEach(function (c, i) {
        if (i === L.a0) mid = n;
        if (i === L.a1) mid = (mid + n) / 2;
        n += c.pw + pad;
      });
      if (L.a1 === L.cells.length) mid = (mid + n) / 2;
      // An anchored column is as tall as twice its longer side, since the anchor stays in the middle.
      most = Math.max(most, L.a1 ? 2 * Math.max(mid, n - mid) : n);
    });
    var fs = m.fit
      ? Math.max(8, Math.min(m.maxSize, Math.min(m.width, 0.8 * m.viewH) / (most * 1.2), m.width / (m.lines.length * stepOf(m.settings))))
      : m.fs;
    return { fs: fs, height: Math.ceil(most * 1.2 * fs), pad: pad };
  },
  place: function (m) {
    if (m.state.rtl === undefined) {
      var order = m.settings.columnOrder;
      m.state.rtl = order === 'auto' ? mostlyCJK(m) : order === 'rtl';
    }
    var step = stepOf(m.settings) * m.fs, left = (m.width - m.lines.length * step) / 2;
    m.lines.forEach(function (L, i) {
      var cs = L.cells, y = 0, up = 0, j, c, top;
      // Offsets count from the anchor's first glyph both ways, so that the anchor's own are sums of
      // the same widths in every frame and come out exactly the same.
      for (j = L.a0; j < cs.length; j++) { cs[j].x = y; y += cs[j].w; }
      for (j = L.a0 - 1; j >= 0; j--) { up -= cs[j].w; cs[j].x = up; }
      top = L.a1 ? m.height / 2 - (cs[L.a1 - 1].x + cs[L.a1 - 1].w) / 2 : (m.height - y) / 2;
      for (j = 0; j < cs.length; j++) {
        c = cs[j];
        c.cx = left + ((m.state.rtl ? m.lines.length - 1 - i : i) + 0.5) * step;
        c.cy = top + c.x + c.w / 2;
        c.r = 0;
      }
    });
  }
};

// em from the middle of one column to the next.
function stepOf(s) {
  return s.spacing != null ? s.spacing : 1 + s.columnGap;
}

function mostlyCJK(m) {
  var cjk = 0, other = 0;
  m.lines.forEach(function (L) {
    L.cells.forEach(function (c) {
      if (CJK.test(c.ch)) cjk++;
      else if (c.ch !== ' ') other++;
    });
  });
  return cjk > other;
}
