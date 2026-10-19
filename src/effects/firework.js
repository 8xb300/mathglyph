// firework: glyphs near the pointer burst outward with a few coloured sparks, then spring back.
// speed: how fast glyphs fly out and spring back, times the speed option.
// radius: how near the pointer has to come to burst a glyph, in em.
// power: how far a glyph flies out at most, in em.
// spin: the most a glyph turns as it flies, in radians. About 1 in 4 glyphs turn.
// sparks: the sparks that fly from each glyph.

// A glyph moves on a critically damped spring kicked away from its slot: its offset is
// power * t * e^(1 - t), where t is the time in units of 1 / K. It is furthest out at t = 1.
var K = 0.0125;   // per ms at speed 1: a glyph is furthest out after 80 ms
var BACK = 7.5;   // t when a glyph is back: its offset is then 1% of the furthest
var SPARK = 5;    // t when a spark is gone

export var firework = {
  name: 'firework',
  defaults: { speed: 1, radius: 1.7, power: 0.8, spin: 0.5, sparks: 2 },
  frame: function (f) {
    var s = f.state, busy = s.n > 0 || !!(f.pointer && f.moved);
    s.n = 0;
    s.k = K * f.settings.speed * f.speed;
    return busy;
  },
  glyph: function (g, out, f) {
    var b = g.fx, s = f.state, p = f.pointer, set = f.settings;
    if (b && b.on) {
      var t = (f.now - b.t) * s.k, e = t * Math.exp(1 - t);
      if (t < BACK) {
        s.n++;
        out.x = b.x * e;
        out.y = b.y * e;
        // The turn settles faster than the offset, so it can stop early without a visible snap.
        // A turned glyph costs as much to draw as dozens of plain ones, so the turn is short.
        if (b.a && e > 0.4) out.rotate = b.a * e * e * e * e;
        out.paint = t < SPARK;
        return;
      }
      b.on = false;
    }
    if (!p || !f.moved) return;
    var dx = g.cx - p.x, dy = g.cy - p.y, r = set.radius * f.fs;
    if (dx * dx + dy * dy > r * r) return;
    if (!b) b = g.fx = { on: false, t: 0, x: 0, y: 0, a: 0, d: 0, c: 0 };
    var a = (dx || dy ? Math.atan2(dy, dx) : Math.random() * 2 * Math.PI) + Math.random() - 0.5;
    var m = set.power * f.fs * (0.7 + 0.3 * Math.random()), edge = 0.65 * f.fs;
    // Kept inside the canvas: a glyph at the edge flies along it.
    b.x = Math.min(Math.max(Math.cos(a) * m, edge - g.cx), f.width - edge - g.cx);
    b.y = Math.min(Math.max(Math.sin(a) * m, edge - g.cy), f.height - edge - g.cy);
    b.a = Math.random() < 0.25 ? set.spin * (Math.random() < 0.5 ? -1 : 1) : 0;
    b.d = Math.atan2(b.y, b.x);
    b.c = Math.floor(Math.random() * 64);
    b.t = f.now;
    b.on = out.swap = out.paint = true;
    s.n++;
  },
  paint: function (ctx, g, out, f) {
    var b = g.fx, t = (f.now - b.t) * f.state.k / SPARK, n = f.settings.sparks, fs = f.fs, pal = f.palette;
    var d = fs * (0.3 + 1.4 * (1 - Math.exp(-4 * t))), z = fs * 0.09 * (1 - 0.4 * t), drop = fs * 0.5 * t * t;
    ctx.globalAlpha = 1 - t;
    for (var i = 0; i < n; i++) {
      var a = b.d + (i - (n - 1) / 2) * 0.8, di = d * (1 - 0.3 * ((b.c * 0.37 + i * 0.61) % 1));
      ctx.fillStyle = pal[(b.c + i) % pal.length];
      ctx.fillRect(g.cx + Math.cos(a) * di - z / 2, g.cy + Math.sin(a) * di + drop - z / 2, z, z);
    }
  }
};
