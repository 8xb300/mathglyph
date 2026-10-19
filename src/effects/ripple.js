// ripple: rings run out from the pointer, and glyphs swap and pulse as a ring passes them.
// speed: how fast the rings grow, times the speed option.
// radius: how far a ring runs before it has faded out, in em.
// gap: the space between two rings, in em. A moving pointer starts a ring each time the last one is this wide.
// pulse: how much a glyph grows as a ring passes, as a share of its size (0.4: 40% larger). It rises a little too.

var MAX = 8;         // rings at a time
var GROW = 0.009;    // em per ms that a ring grows at speed 1
var FRONT = 0.5;     // em: a glyph starts to grow when the ring is this near
var TAIL = 1.4;      // em: and is back at rest when the ring is this far past it

export var ripple = {
  name: 'ripple',
  defaults: { speed: 1, radius: 5, gap: 2.5, pulse: 0.4 },
  frame: function (f) {
    var s = f.state, p = f.pointer, set = f.settings, fs = f.fs, rings = s.rings, live = 0, i, R;
    if (!rings) {
      rings = s.rings = [];
      for (i = 0; i < MAX; i++) rings.push({ x: 0, y: 0, r: 0, r0: 0, k: 0 });
      s.n = 0;
    }
    var max = set.radius * fs, grow = GROW * fs * set.speed * f.speed * f.dt, last = rings[(s.n + MAX - 1) % MAX];
    if (p && f.moved && (!last.k || last.r >= set.gap * fs)) {
      R = rings[s.n++ % MAX];
      R.x = p.x;
      R.y = p.y;
      R.r = -grow;  // grows to 0 below, in this frame
      R.k = 1;
    }
    s.x0 = s.y0 = Infinity;
    s.x1 = s.y1 = -Infinity;
    for (i = 0; i < MAX; i++) {
      R = rings[i];
      if (!R.k) continue;
      R.r0 = R.r;
      R.r += grow;
      R.k = R.r < max ? (1 - R.r / max) * (1 - R.r / max) : 0;
      if (!R.k) continue;
      live++;
      var edge = R.r + FRONT * fs;
      s.x0 = Math.min(s.x0, R.x - edge);
      s.x1 = Math.max(s.x1, R.x + edge);
      s.y0 = Math.min(s.y0, R.y - edge);
      s.y1 = Math.max(s.y1, R.y + edge);
    }
    return live > 0;
  },
  glyph: function (g, out, f) {
    var s = f.state, x = g.cx, y = g.cy;
    if (x < s.x0 || x > s.x1 || y < s.y0 || y > s.y1) return;
    var front = FRONT * f.fs, tail = TAIL * f.fs, top = 0, i, R, dx, dy, d, u;
    for (i = 0; i < MAX; i++) {
      R = s.rings[i];
      if (!R.k) continue;
      dx = x - R.x;
      dy = y - R.y;
      d = Math.sqrt(dx * dx + dy * dy);
      u = R.r - d;  // below 0: the ring has not reached the glyph yet
      if (u <= -front || u >= tail) continue;
      if (u >= 0 && d > R.r0 && Math.random() < R.k) out.swap = true;
      u = u < 0 ? u / front : u / tail;
      u = (1 - u * u) * (1 - u * u) * R.k;
      if (u > top) top = u;
    }
    var pulse = f.settings.pulse * top;
    if (pulse < 0.01) return;
    // In steps of 1/40, so that the browser can reuse glyphs it drew at that size: much faster.
    out.scale = 1 + Math.round(pulse * 40) / 40;
    out.y = -0.25 * pulse * f.fs;
  }
};
