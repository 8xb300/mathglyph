// sine: a custom layout, written with the same public interface as the built-in ones. The lines
// are centred, on a baseline that runs as a sine wave, and each glyph turns with the wave's slope.
// amplitude: the height of the wave above and below the line's middle, in em.
// wavelength: the length of one wave, in em.

export var sine = {
  name: 'sine',
  defaults: { amplitude: 0.4, wavelength: 7 },
  // The widest line fits the width, as in 'lines', with room for the wave above and below.
  size: function (m) {
    var most = 1;
    // An anchored line is as wide as twice its longer side, since the anchor stays in the middle.
    m.lines.forEach(function (L) { most = Math.max(most, L.a1 ? 2 * Math.max(L.mid, L.natural - L.mid) : L.natural); });
    var fs = m.fit ? Math.max(8, Math.min(m.maxSize, m.width / (most * 1.2))) : m.fs;
    return { fs: fs, height: Math.ceil((m.lines.length * m.lineEm + 2 * m.settings.amplitude) * fs) };
  },
  // From the slot sizes w: each glyph's centre (cx, cy) and angle (r). The anchor word's middle
  // stays at the middle of the width, so it never moves.
  place: function (m) {
    var a = m.settings.amplitude * m.fs, k = 2 * Math.PI / (m.settings.wavelength * m.fs);
    m.lines.forEach(function (L, i) {
      var cs = L.cells, x = 0, left, mid = a + (i + 0.5) * m.lineH;
      cs.forEach(function (c) { c.x = x; x += c.w; });
      left = L.a1 ? (m.width - cs[L.a0].x - cs[L.a1 - 1].x - cs[L.a1 - 1].w) / 2 : (m.width - x) / 2;
      cs.forEach(function (c) {
        var t = left + c.x + c.w / 2;
        c.cx = t;
        c.cy = mid + a * Math.sin(k * t);
        c.r = Math.atan(a * k * Math.cos(k * t));
      });
    });
  }
};
