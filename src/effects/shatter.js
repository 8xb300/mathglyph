// shatter: letters near the pointer break into round dots that scatter a little, then fly back and
// reassemble, often as a new glyph.
// speed: how fast the dots fly out and back, times the speed option.
// radius: how near the pointer a letter must be to break, in em.
// scatter: how far the dots fly out, in em, at most 0.6.
// dots: the most dots a letter breaks into.

var LIFE = 650;   // ms a letter stays broken, at speed 1
var OUT = 0.3;    // share of that time the dots fly out; for the rest they fly back
var DOT = 0.065;  // dot radius, em
var WHOLE = 1.4;  // a letter stays whole until this share of LIFE has passed, before it can break again

// The dots of one glyph, from its pixels: for each dot its x and y from the glyph's centre, in px,
// and the way it flies, at most about 1 long. Drawn once per glyph and font.
function sample(s, text, f, max) {
  var cv = s.cv || (s.cv = document.createElement('canvas')), ctx = cv.getContext('2d', { willReadFrequently: true });
  var w = f.fs * 4 | 0, h = f.fs * 2 | 0;
  cv.width = w;  // this also clears it
  cv.height = h;
  ctx.font = f.font;
  ctx.textAlign = 'center';
  var m = ctx.measureText('Hg');
  ctx.fillText(text, w / 2, h / 2 + (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2);
  var px = ctx.getImageData(0, 0, w, h).data, i, c, x, y, a, dots;
  // Ink adds up in square cells of `step` px. A cell that is a fifth inked or more is a dot, at its
  // centre of ink. The cells grow until there are few enough dots.
  for (var step = f.fs / 16; !dots || dots.length > max * 4; step *= 1.15) {
    var cols = Math.ceil(w / step), sum = new Float32Array(cols * Math.ceil(h / step) * 3);
    for (i = 0; i < w * h; i++) {
      if (!(a = px[i * 4 + 3])) continue;
      x = i % w;
      y = (i - x) / w;
      c = ((y / step | 0) * cols + (x / step | 0)) * 3;
      sum[c] += x * a;
      sum[c + 1] += y * a;
      sum[c + 2] += a;
    }
    dots = [];
    for (c = 0; c < sum.length; c += 3) {
      if (sum[c + 2] < 51 * step * step) continue;
      x = sum[c] / sum[c + 2] + 0.5 - w / 2;
      y = sum[c + 1] / sum[c + 2] + 0.5 - h / 2;
      dots.push(x, y, 1.6 * x / f.fs + 0.4 * Math.random() - 0.2, 1.6 * y / f.fs + 0.4 * Math.random() - 0.2);
    }
  }
  return dots;
}

export var shatter = {
  name: 'shatter',
  defaults: { speed: 1, radius: 1.8, scatter: 0.5, dots: 12 },
  frame: function (f) {
    var s = f.state;
    if (s.font !== f.font) { s.font = f.font; s.cache = {}; }
    s.k = Math.max(f.settings.speed * f.speed, 0.05);
    s.d = Math.min(f.settings.scatter, 0.6) * f.fs;
    return !!(f.pointer && f.moved) || f.now < s.end;
  },
  glyph: function (g, out, f) {
    var s = f.state, b = g.fx, u = b ? (f.now - b.t) * s.k / LIFE : WHOLE, v;
    if (u < 1) {
      // How far out the dots are, from 0 to 1: out fast, then back on a smoothstep.
      if (u < OUT) { v = 1 - u / OUT; b.b = 1 - v * v * v; }
      else { v = (u - OUT) / (1 - OUT); b.b = 1 - v * v * (3 - 2 * v); }
      out.alpha = Math.max(0, 1 - 3 * b.b);
      out.paint = b.b > 0.03;
      if (u > OUT && !b.s) out.swap = b.s = true;
      return;
    }
    if (u < WHOLE) return;
    var p = f.pointer, r = f.settings.radius * f.fs;
    if (!p || !f.moved) return;
    var dx = g.cx - p.x, dy = g.cy - p.y;
    if (dx * dx + dy * dy > r * r || g.w < 0.5) return;
    var dots = s.cache[g.g] || (s.cache[g.g] = sample(s, g.g, f, f.settings.dots));
    if (!dots.length) return;
    b = g.fx = b || {};
    b.t = f.now;
    b.d = dots;
    b.b = 0;
    b.s = false;
    s.end = f.now + LIFE / s.k;  // letters break in time order, so this one is whole again last
  },
  paint: function (ctx, g, out, f) {
    var b = g.fx, d = b.d, k = b.b * f.state.d, r = f.fs * DOT * (1 - 0.3 * b.b);
    var cos = Math.cos(g.r), sin = Math.sin(g.r), x0 = g.cx + out.x, y0 = g.cy + out.y;
    // paint() does not get the glyph's colour, so each letter's dots take one palette colour.
    ctx.fillStyle = f.palette[g.seed * f.palette.length | 0];
    ctx.globalAlpha = Math.min(1, 3 * b.b);
    ctx.beginPath();
    for (var i = 0; i < d.length; i += 4) {
      var x = d[i] + d[i + 2] * k, y = d[i + 1] + d[i + 3] * k, X = x0 + x * cos - y * sin, Y = y0 + x * sin + y * cos;
      ctx.moveTo(X + r, Y);
      ctx.arc(X, Y, r, 0, 6.2832);
    }
    ctx.fill();
  }
};
