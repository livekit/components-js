import { setLogLevel as qn, LogLevel as St, setLogExtension as Kn, RoomEvent as y, ParticipantEvent as w, Track as R, TrackEvent as Gt, getBrowser as Gn, compareVersions as Qn, Room as Tt } from "livekit-client";
import * as I from "react";
const De = Math.min, ue = Math.max, $e = Math.round, _e = Math.floor, J = (e) => ({
  x: e,
  y: e
}), Jn = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Xn = {
  start: "end",
  end: "start"
};
function Et(e, t, n) {
  return ue(e, De(t, n));
}
function He(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function le(e) {
  return e.split("-")[0];
}
function ze(e) {
  return e.split("-")[1];
}
function Qt(e) {
  return e === "x" ? "y" : "x";
}
function Jt(e) {
  return e === "y" ? "height" : "width";
}
const Zn = /* @__PURE__ */ new Set(["top", "bottom"]);
function ie(e) {
  return Zn.has(le(e)) ? "y" : "x";
}
function Xt(e) {
  return Qt(ie(e));
}
function er(e, t, n) {
  n === void 0 && (n = !1);
  const r = ze(e), i = Xt(e), o = Jt(i);
  let s = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[o] > t.floating[o] && (s = Ne(s)), [s, Ne(s)];
}
function tr(e) {
  const t = Ne(e);
  return [st(e), t, st(t)];
}
function st(e) {
  return e.replace(/start|end/g, (t) => Xn[t]);
}
const Ct = ["left", "right"], Pt = ["right", "left"], nr = ["top", "bottom"], rr = ["bottom", "top"];
function ir(e, t, n) {
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? Pt : Ct : t ? Ct : Pt;
    case "left":
    case "right":
      return t ? nr : rr;
    default:
      return [];
  }
}
function or(e, t, n, r) {
  const i = ze(e);
  let o = ir(le(e), n === "start", r);
  return i && (o = o.map((s) => s + "-" + i), t && (o = o.concat(o.map(st)))), o;
}
function Ne(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Jn[t]);
}
function sr(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function ar(e) {
  return typeof e != "number" ? sr(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Fe(e) {
  const {
    x: t,
    y: n,
    width: r,
    height: i
  } = e;
  return {
    width: r,
    height: i,
    top: n,
    left: t,
    right: t + r,
    bottom: n + i,
    x: t,
    y: n
  };
}
function Ot(e, t, n) {
  let {
    reference: r,
    floating: i
  } = e;
  const o = ie(t), s = Xt(t), a = Jt(s), c = le(t), u = o === "y", l = r.x + r.width / 2 - i.width / 2, f = r.y + r.height / 2 - i.height / 2, v = r[a] / 2 - i[a] / 2;
  let d;
  switch (c) {
    case "top":
      d = {
        x: l,
        y: r.y - i.height
      };
      break;
    case "bottom":
      d = {
        x: l,
        y: r.y + r.height
      };
      break;
    case "right":
      d = {
        x: r.x + r.width,
        y: f
      };
      break;
    case "left":
      d = {
        x: r.x - i.width,
        y: f
      };
      break;
    default:
      d = {
        x: r.x,
        y: r.y
      };
  }
  switch (ze(t)) {
    case "start":
      d[s] -= v * (n && u ? -1 : 1);
      break;
    case "end":
      d[s] += v * (n && u ? -1 : 1);
      break;
  }
  return d;
}
const cr = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: i = "absolute",
    middleware: o = [],
    platform: s
  } = n, a = o.filter(Boolean), c = await (s.isRTL == null ? void 0 : s.isRTL(t));
  let u = await s.getElementRects({
    reference: e,
    floating: t,
    strategy: i
  }), {
    x: l,
    y: f
  } = Ot(u, r, c), v = r, d = {}, m = 0;
  for (let p = 0; p < a.length; p++) {
    const {
      name: g,
      fn: h
    } = a[p], {
      x,
      y: E,
      data: O,
      reset: b
    } = await h({
      x: l,
      y: f,
      initialPlacement: r,
      placement: v,
      strategy: i,
      middlewareData: d,
      rects: u,
      platform: s,
      elements: {
        reference: e,
        floating: t
      }
    });
    l = x ?? l, f = E ?? f, d = {
      ...d,
      [g]: {
        ...d[g],
        ...O
      }
    }, b && m <= 50 && (m++, typeof b == "object" && (b.placement && (v = b.placement), b.rects && (u = b.rects === !0 ? await s.getElementRects({
      reference: e,
      floating: t,
      strategy: i
    }) : b.rects), {
      x: l,
      y: f
    } = Ot(u, v, c)), p = -1);
  }
  return {
    x: l,
    y: f,
    placement: v,
    strategy: i,
    middlewareData: d
  };
};
async function Zt(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: i,
    platform: o,
    rects: s,
    elements: a,
    strategy: c
  } = e, {
    boundary: u = "clippingAncestors",
    rootBoundary: l = "viewport",
    elementContext: f = "floating",
    altBoundary: v = !1,
    padding: d = 0
  } = He(t, e), m = ar(d), g = a[v ? f === "floating" ? "reference" : "floating" : f], h = Fe(await o.getClippingRect({
    element: (n = await (o.isElement == null ? void 0 : o.isElement(g))) == null || n ? g : g.contextElement || await (o.getDocumentElement == null ? void 0 : o.getDocumentElement(a.floating)),
    boundary: u,
    rootBoundary: l,
    strategy: c
  })), x = f === "floating" ? {
    x: r,
    y: i,
    width: s.floating.width,
    height: s.floating.height
  } : s.reference, E = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(a.floating)), O = await (o.isElement == null ? void 0 : o.isElement(E)) ? await (o.getScale == null ? void 0 : o.getScale(E)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, b = Fe(o.convertOffsetParentRelativeRectToViewportRelativeRect ? await o.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: a,
    rect: x,
    offsetParent: E,
    strategy: c
  }) : x);
  return {
    top: (h.top - b.top + m.top) / O.y,
    bottom: (b.bottom - h.bottom + m.bottom) / O.y,
    left: (h.left - b.left + m.left) / O.x,
    right: (b.right - h.right + m.right) / O.x
  };
}
const ur = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: i,
        middlewareData: o,
        rects: s,
        initialPlacement: a,
        platform: c,
        elements: u
      } = t, {
        mainAxis: l = !0,
        crossAxis: f = !0,
        fallbackPlacements: v,
        fallbackStrategy: d = "bestFit",
        fallbackAxisSideDirection: m = "none",
        flipAlignment: p = !0,
        ...g
      } = He(e, t);
      if ((n = o.arrow) != null && n.alignmentOffset)
        return {};
      const h = le(i), x = ie(a), E = le(a) === a, O = await (c.isRTL == null ? void 0 : c.isRTL(u.floating)), b = v || (E || !p ? [Ne(a)] : tr(a)), S = m !== "none";
      !v && S && b.push(...or(a, p, m, O));
      const C = [a, ...b], $ = await Zt(t, g), M = [];
      let V = ((r = o.flip) == null ? void 0 : r.overflows) || [];
      if (l && M.push($[h]), f) {
        const Q = er(i, s, O);
        M.push($[Q[0]], $[Q[1]]);
      }
      if (V = [...V, {
        placement: i,
        overflows: M
      }], !M.every((Q) => Q <= 0)) {
        var T, _;
        const Q = (((T = o.flip) == null ? void 0 : T.index) || 0) + 1, Se = C[Q];
        if (Se && (!(f === "alignment" ? x !== ie(Se) : !1) || // We leave the current main axis only if every placement on that axis
        // overflows the main axis.
        V.every((Y) => ie(Y.placement) === x ? Y.overflows[0] > 0 : !0)))
          return {
            data: {
              index: Q,
              overflows: V
            },
            reset: {
              placement: Se
            }
          };
        let Te = (_ = V.filter((ae) => ae.overflows[0] <= 0).sort((ae, Y) => ae.overflows[1] - Y.overflows[1])[0]) == null ? void 0 : _.placement;
        if (!Te)
          switch (d) {
            case "bestFit": {
              var ee;
              const ae = (ee = V.filter((Y) => {
                if (S) {
                  const re = ie(Y.placement);
                  return re === x || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  re === "y";
                }
                return !0;
              }).map((Y) => [Y.placement, Y.overflows.filter((re) => re > 0).reduce((re, Yn) => re + Yn, 0)]).sort((Y, re) => Y[1] - re[1])[0]) == null ? void 0 : ee[0];
              ae && (Te = ae);
              break;
            }
            case "initialPlacement":
              Te = a;
              break;
          }
        if (i !== Te)
          return {
            reset: {
              placement: Te
            }
          };
      }
      return {};
    }
  };
}, lr = /* @__PURE__ */ new Set(["left", "top"]);
async function fr(e, t) {
  const {
    placement: n,
    platform: r,
    elements: i
  } = e, o = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), s = le(n), a = ze(n), c = ie(n) === "y", u = lr.has(s) ? -1 : 1, l = o && c ? -1 : 1, f = He(t, e);
  let {
    mainAxis: v,
    crossAxis: d,
    alignmentAxis: m
  } = typeof f == "number" ? {
    mainAxis: f,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: f.mainAxis || 0,
    crossAxis: f.crossAxis || 0,
    alignmentAxis: f.alignmentAxis
  };
  return a && typeof m == "number" && (d = a === "end" ? m * -1 : m), c ? {
    x: d * l,
    y: v * u
  } : {
    x: v * u,
    y: d * l
  };
}
const dr = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: i,
        y: o,
        placement: s,
        middlewareData: a
      } = t, c = await fr(t, e);
      return s === ((n = a.offset) == null ? void 0 : n.placement) && (r = a.arrow) != null && r.alignmentOffset ? {} : {
        x: i + c.x,
        y: o + c.y,
        data: {
          ...c,
          placement: s
        }
      };
    }
  };
}, pr = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: r,
        placement: i
      } = t, {
        mainAxis: o = !0,
        crossAxis: s = !1,
        limiter: a = {
          fn: (g) => {
            let {
              x: h,
              y: x
            } = g;
            return {
              x: h,
              y: x
            };
          }
        },
        ...c
      } = He(e, t), u = {
        x: n,
        y: r
      }, l = await Zt(t, c), f = ie(le(i)), v = Qt(f);
      let d = u[v], m = u[f];
      if (o) {
        const g = v === "y" ? "top" : "left", h = v === "y" ? "bottom" : "right", x = d + l[g], E = d - l[h];
        d = Et(x, d, E);
      }
      if (s) {
        const g = f === "y" ? "top" : "left", h = f === "y" ? "bottom" : "right", x = m + l[g], E = m - l[h];
        m = Et(x, m, E);
      }
      const p = a.fn({
        ...t,
        [v]: d,
        [f]: m
      });
      return {
        ...p,
        data: {
          x: p.x - n,
          y: p.y - r,
          enabled: {
            [v]: o,
            [f]: s
          }
        }
      };
    }
  };
};
function Ye() {
  return typeof window < "u";
}
function ye(e) {
  return en(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function j(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Z(e) {
  var t;
  return (t = (en(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function en(e) {
  return Ye() ? e instanceof Node || e instanceof j(e).Node : !1;
}
function K(e) {
  return Ye() ? e instanceof Element || e instanceof j(e).Element : !1;
}
function X(e) {
  return Ye() ? e instanceof HTMLElement || e instanceof j(e).HTMLElement : !1;
}
function At(e) {
  return !Ye() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof j(e).ShadowRoot;
}
const hr = /* @__PURE__ */ new Set(["inline", "contents"]);
function Ae(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: i
  } = G(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !hr.has(i);
}
const vr = /* @__PURE__ */ new Set(["table", "td", "th"]);
function mr(e) {
  return vr.has(ye(e));
}
const gr = [":popover-open", ":modal"];
function qe(e) {
  return gr.some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
const br = ["transform", "translate", "scale", "rotate", "perspective"], yr = ["transform", "translate", "scale", "rotate", "perspective", "filter"], wr = ["paint", "layout", "strict", "content"];
function pt(e) {
  const t = ht(), n = K(e) ? G(e) : e;
  return br.some((r) => n[r] ? n[r] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || yr.some((r) => (n.willChange || "").includes(r)) || wr.some((r) => (n.contain || "").includes(r));
}
function xr(e) {
  let t = se(e);
  for (; X(t) && !me(t); ) {
    if (pt(t))
      return t;
    if (qe(t))
      return null;
    t = se(t);
  }
  return null;
}
function ht() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
const Sr = /* @__PURE__ */ new Set(["html", "body", "#document"]);
function me(e) {
  return Sr.has(ye(e));
}
function G(e) {
  return j(e).getComputedStyle(e);
}
function Ke(e) {
  return K(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function se(e) {
  if (ye(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    At(e) && e.host || // Fallback.
    Z(e)
  );
  return At(t) ? t.host : t;
}
function tn(e) {
  const t = se(e);
  return me(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : X(t) && Ae(t) ? t : tn(t);
}
function Ce(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const i = tn(e), o = i === ((r = e.ownerDocument) == null ? void 0 : r.body), s = j(i);
  if (o) {
    const a = at(s);
    return t.concat(s, s.visualViewport || [], Ae(i) ? i : [], a && n ? Ce(a) : []);
  }
  return t.concat(i, Ce(i, [], n));
}
function at(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function nn(e) {
  const t = G(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const i = X(e), o = i ? e.offsetWidth : n, s = i ? e.offsetHeight : r, a = $e(n) !== o || $e(r) !== s;
  return a && (n = o, r = s), {
    width: n,
    height: r,
    $: a
  };
}
function vt(e) {
  return K(e) ? e : e.contextElement;
}
function he(e) {
  const t = vt(e);
  if (!X(t))
    return J(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: i,
    $: o
  } = nn(t);
  let s = (o ? $e(n.width) : n.width) / r, a = (o ? $e(n.height) : n.height) / i;
  return (!s || !Number.isFinite(s)) && (s = 1), (!a || !Number.isFinite(a)) && (a = 1), {
    x: s,
    y: a
  };
}
const Tr = /* @__PURE__ */ J(0);
function rn(e) {
  const t = j(e);
  return !ht() || !t.visualViewport ? Tr : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Er(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== j(e) ? !1 : t;
}
function fe(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const i = e.getBoundingClientRect(), o = vt(e);
  let s = J(1);
  t && (r ? K(r) && (s = he(r)) : s = he(e));
  const a = Er(o, n, r) ? rn(o) : J(0);
  let c = (i.left + a.x) / s.x, u = (i.top + a.y) / s.y, l = i.width / s.x, f = i.height / s.y;
  if (o) {
    const v = j(o), d = r && K(r) ? j(r) : r;
    let m = v, p = at(m);
    for (; p && r && d !== m; ) {
      const g = he(p), h = p.getBoundingClientRect(), x = G(p), E = h.left + (p.clientLeft + parseFloat(x.paddingLeft)) * g.x, O = h.top + (p.clientTop + parseFloat(x.paddingTop)) * g.y;
      c *= g.x, u *= g.y, l *= g.x, f *= g.y, c += E, u += O, m = j(p), p = at(m);
    }
  }
  return Fe({
    width: l,
    height: f,
    x: c,
    y: u
  });
}
function Ge(e, t) {
  const n = Ke(e).scrollLeft;
  return t ? t.left + n : fe(Z(e)).left + n;
}
function on(e, t) {
  const n = e.getBoundingClientRect(), r = n.left + t.scrollLeft - Ge(e, n), i = n.top + t.scrollTop;
  return {
    x: r,
    y: i
  };
}
function Cr(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: i
  } = e;
  const o = i === "fixed", s = Z(r), a = t ? qe(t.floating) : !1;
  if (r === s || a && o)
    return n;
  let c = {
    scrollLeft: 0,
    scrollTop: 0
  }, u = J(1);
  const l = J(0), f = X(r);
  if ((f || !f && !o) && ((ye(r) !== "body" || Ae(s)) && (c = Ke(r)), X(r))) {
    const d = fe(r);
    u = he(r), l.x = d.x + r.clientLeft, l.y = d.y + r.clientTop;
  }
  const v = s && !f && !o ? on(s, c) : J(0);
  return {
    width: n.width * u.x,
    height: n.height * u.y,
    x: n.x * u.x - c.scrollLeft * u.x + l.x + v.x,
    y: n.y * u.y - c.scrollTop * u.y + l.y + v.y
  };
}
function Pr(e) {
  return Array.from(e.getClientRects());
}
function Or(e) {
  const t = Z(e), n = Ke(e), r = e.ownerDocument.body, i = ue(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), o = ue(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let s = -n.scrollLeft + Ge(e);
  const a = -n.scrollTop;
  return G(r).direction === "rtl" && (s += ue(t.clientWidth, r.clientWidth) - i), {
    width: i,
    height: o,
    x: s,
    y: a
  };
}
const kt = 25;
function Ar(e, t) {
  const n = j(e), r = Z(e), i = n.visualViewport;
  let o = r.clientWidth, s = r.clientHeight, a = 0, c = 0;
  if (i) {
    o = i.width, s = i.height;
    const l = ht();
    (!l || l && t === "fixed") && (a = i.offsetLeft, c = i.offsetTop);
  }
  const u = Ge(r);
  if (u <= 0) {
    const l = r.ownerDocument, f = l.body, v = getComputedStyle(f), d = l.compatMode === "CSS1Compat" && parseFloat(v.marginLeft) + parseFloat(v.marginRight) || 0, m = Math.abs(r.clientWidth - f.clientWidth - d);
    m <= kt && (o -= m);
  } else u <= kt && (o += u);
  return {
    width: o,
    height: s,
    x: a,
    y: c
  };
}
const kr = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function _r(e, t) {
  const n = fe(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, o = X(e) ? he(e) : J(1), s = e.clientWidth * o.x, a = e.clientHeight * o.y, c = i * o.x, u = r * o.y;
  return {
    width: s,
    height: a,
    x: c,
    y: u
  };
}
function _t(e, t, n) {
  let r;
  if (t === "viewport")
    r = Ar(e, n);
  else if (t === "document")
    r = Or(Z(e));
  else if (K(t))
    r = _r(t, n);
  else {
    const i = rn(e);
    r = {
      x: t.x - i.x,
      y: t.y - i.y,
      width: t.width,
      height: t.height
    };
  }
  return Fe(r);
}
function sn(e, t) {
  const n = se(e);
  return n === t || !K(n) || me(n) ? !1 : G(n).position === "fixed" || sn(n, t);
}
function Lr(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = Ce(e, [], !1).filter((a) => K(a) && ye(a) !== "body"), i = null;
  const o = G(e).position === "fixed";
  let s = o ? se(e) : e;
  for (; K(s) && !me(s); ) {
    const a = G(s), c = pt(s);
    !c && a.position === "fixed" && (i = null), (o ? !c && !i : !c && a.position === "static" && !!i && kr.has(i.position) || Ae(s) && !c && sn(e, s)) ? r = r.filter((l) => l !== s) : i = a, s = se(s);
  }
  return t.set(e, r), r;
}
function Ir(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: i
  } = e;
  const s = [...n === "clippingAncestors" ? qe(t) ? [] : Lr(t, this._c) : [].concat(n), r], a = s[0], c = s.reduce((u, l) => {
    const f = _t(t, l, i);
    return u.top = ue(f.top, u.top), u.right = De(f.right, u.right), u.bottom = De(f.bottom, u.bottom), u.left = ue(f.left, u.left), u;
  }, _t(t, a, i));
  return {
    width: c.right - c.left,
    height: c.bottom - c.top,
    x: c.left,
    y: c.top
  };
}
function Mr(e) {
  const {
    width: t,
    height: n
  } = nn(e);
  return {
    width: t,
    height: n
  };
}
function Rr(e, t, n) {
  const r = X(t), i = Z(t), o = n === "fixed", s = fe(e, !0, o, t);
  let a = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const c = J(0);
  function u() {
    c.x = Ge(i);
  }
  if (r || !r && !o)
    if ((ye(t) !== "body" || Ae(i)) && (a = Ke(t)), r) {
      const d = fe(t, !0, o, t);
      c.x = d.x + t.clientLeft, c.y = d.y + t.clientTop;
    } else i && u();
  o && !r && i && u();
  const l = i && !r && !o ? on(i, a) : J(0), f = s.left + a.scrollLeft - c.x - l.x, v = s.top + a.scrollTop - c.y - l.y;
  return {
    x: f,
    y: v,
    width: s.width,
    height: s.height
  };
}
function et(e) {
  return G(e).position === "static";
}
function Lt(e, t) {
  if (!X(e) || G(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return Z(e) === n && (n = n.ownerDocument.body), n;
}
function an(e, t) {
  const n = j(e);
  if (qe(e))
    return n;
  if (!X(e)) {
    let i = se(e);
    for (; i && !me(i); ) {
      if (K(i) && !et(i))
        return i;
      i = se(i);
    }
    return n;
  }
  let r = Lt(e, t);
  for (; r && mr(r) && et(r); )
    r = Lt(r, t);
  return r && me(r) && et(r) && !pt(r) ? n : r || xr(e) || n;
}
const Dr = async function(e) {
  const t = this.getOffsetParent || an, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: Rr(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function $r(e) {
  return G(e).direction === "rtl";
}
const Nr = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Cr,
  getDocumentElement: Z,
  getClippingRect: Ir,
  getOffsetParent: an,
  getElementRects: Dr,
  getClientRects: Pr,
  getDimensions: Mr,
  getScale: he,
  isElement: K,
  isRTL: $r
};
function cn(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Fr(e, t) {
  let n = null, r;
  const i = Z(e);
  function o() {
    var a;
    clearTimeout(r), (a = n) == null || a.disconnect(), n = null;
  }
  function s(a, c) {
    a === void 0 && (a = !1), c === void 0 && (c = 1), o();
    const u = e.getBoundingClientRect(), {
      left: l,
      top: f,
      width: v,
      height: d
    } = u;
    if (a || t(), !v || !d)
      return;
    const m = _e(f), p = _e(i.clientWidth - (l + v)), g = _e(i.clientHeight - (f + d)), h = _e(l), E = {
      rootMargin: -m + "px " + -p + "px " + -g + "px " + -h + "px",
      threshold: ue(0, De(1, c)) || 1
    };
    let O = !0;
    function b(S) {
      const C = S[0].intersectionRatio;
      if (C !== c) {
        if (!O)
          return s();
        C ? s(!1, C) : r = setTimeout(() => {
          s(!1, 1e-7);
        }, 1e3);
      }
      C === 1 && !cn(u, e.getBoundingClientRect()) && s(), O = !1;
    }
    try {
      n = new IntersectionObserver(b, {
        ...E,
        // Handle <iframe>s
        root: i.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(b, E);
    }
    n.observe(e);
  }
  return s(!0), o;
}
function Ur(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: i = !0,
    ancestorResize: o = !0,
    elementResize: s = typeof ResizeObserver == "function",
    layoutShift: a = typeof IntersectionObserver == "function",
    animationFrame: c = !1
  } = r, u = vt(e), l = i || o ? [...u ? Ce(u) : [], ...Ce(t)] : [];
  l.forEach((h) => {
    i && h.addEventListener("scroll", n, {
      passive: !0
    }), o && h.addEventListener("resize", n);
  });
  const f = u && a ? Fr(u, n) : null;
  let v = -1, d = null;
  s && (d = new ResizeObserver((h) => {
    let [x] = h;
    x && x.target === u && d && (d.unobserve(t), cancelAnimationFrame(v), v = requestAnimationFrame(() => {
      var E;
      (E = d) == null || E.observe(t);
    })), n();
  }), u && !c && d.observe(u), d.observe(t));
  let m, p = c ? fe(e) : null;
  c && g();
  function g() {
    const h = fe(e);
    p && !cn(p, h) && n(), p = h, m = requestAnimationFrame(g);
  }
  return n(), () => {
    var h;
    l.forEach((x) => {
      i && x.removeEventListener("scroll", n), o && x.removeEventListener("resize", n);
    }), f == null || f(), (h = d) == null || h.disconnect(), d = null, c && cancelAnimationFrame(m);
  };
}
const Wr = dr, jr = pr, Br = ur, Vr = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), i = {
    platform: Nr,
    ...n
  }, o = {
    ...i.platform,
    _c: r
  };
  return cr(e, t, {
    ...i,
    platform: o
  });
};
var es = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Hr(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Me = { exports: {} }, zr = Me.exports, It;
function Yr() {
  return It || (It = 1, (function(e) {
    (function(t, n) {
      e.exports ? e.exports = n() : t.log = n();
    })(zr, function() {
      var t = function() {
      }, n = "undefined", r = typeof window !== n && typeof window.navigator !== n && /Trident\/|MSIE /.test(window.navigator.userAgent), i = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
      ], o = {}, s = null;
      function a(p, g) {
        var h = p[g];
        if (typeof h.bind == "function")
          return h.bind(p);
        try {
          return Function.prototype.bind.call(h, p);
        } catch {
          return function() {
            return Function.prototype.apply.apply(h, [p, arguments]);
          };
        }
      }
      function c() {
        console.log && (console.log.apply ? console.log.apply(console, arguments) : Function.prototype.apply.apply(console.log, [console, arguments])), console.trace && console.trace();
      }
      function u(p) {
        return p === "debug" && (p = "log"), typeof console === n ? !1 : p === "trace" && r ? c : console[p] !== void 0 ? a(console, p) : console.log !== void 0 ? a(console, "log") : t;
      }
      function l() {
        for (var p = this.getLevel(), g = 0; g < i.length; g++) {
          var h = i[g];
          this[h] = g < p ? t : this.methodFactory(h, p, this.name);
        }
        if (this.log = this.debug, typeof console === n && p < this.levels.SILENT)
          return "No console available for logging";
      }
      function f(p) {
        return function() {
          typeof console !== n && (l.call(this), this[p].apply(this, arguments));
        };
      }
      function v(p, g, h) {
        return u(p) || f.apply(this, arguments);
      }
      function d(p, g) {
        var h = this, x, E, O, b = "loglevel";
        typeof p == "string" ? b += ":" + p : typeof p == "symbol" && (b = void 0);
        function S(T) {
          var _ = (i[T] || "silent").toUpperCase();
          if (!(typeof window === n || !b)) {
            try {
              window.localStorage[b] = _;
              return;
            } catch {
            }
            try {
              window.document.cookie = encodeURIComponent(b) + "=" + _ + ";";
            } catch {
            }
          }
        }
        function C() {
          var T;
          if (!(typeof window === n || !b)) {
            try {
              T = window.localStorage[b];
            } catch {
            }
            if (typeof T === n)
              try {
                var _ = window.document.cookie, ee = encodeURIComponent(b), Q = _.indexOf(ee + "=");
                Q !== -1 && (T = /^([^;]+)/.exec(
                  _.slice(Q + ee.length + 1)
                )[1]);
              } catch {
              }
            return h.levels[T] === void 0 && (T = void 0), T;
          }
        }
        function $() {
          if (!(typeof window === n || !b)) {
            try {
              window.localStorage.removeItem(b);
            } catch {
            }
            try {
              window.document.cookie = encodeURIComponent(b) + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
            } catch {
            }
          }
        }
        function M(T) {
          var _ = T;
          if (typeof _ == "string" && h.levels[_.toUpperCase()] !== void 0 && (_ = h.levels[_.toUpperCase()]), typeof _ == "number" && _ >= 0 && _ <= h.levels.SILENT)
            return _;
          throw new TypeError("log.setLevel() called with invalid level: " + T);
        }
        h.name = p, h.levels = {
          TRACE: 0,
          DEBUG: 1,
          INFO: 2,
          WARN: 3,
          ERROR: 4,
          SILENT: 5
        }, h.methodFactory = g || v, h.getLevel = function() {
          return O ?? E ?? x;
        }, h.setLevel = function(T, _) {
          return O = M(T), _ !== !1 && S(O), l.call(h);
        }, h.setDefaultLevel = function(T) {
          E = M(T), C() || h.setLevel(T, !1);
        }, h.resetLevel = function() {
          O = null, $(), l.call(h);
        }, h.enableAll = function(T) {
          h.setLevel(h.levels.TRACE, T);
        }, h.disableAll = function(T) {
          h.setLevel(h.levels.SILENT, T);
        }, h.rebuild = function() {
          if (s !== h && (x = M(s.getLevel())), l.call(h), s === h)
            for (var T in o)
              o[T].rebuild();
        }, x = M(
          s ? s.getLevel() : "WARN"
        );
        var V = C();
        V != null && (O = M(V)), l.call(h);
      }
      s = new d(), s.getLogger = function(g) {
        if (typeof g != "symbol" && typeof g != "string" || g === "")
          throw new TypeError("You must supply a name when creating a logger.");
        var h = o[g];
        return h || (h = o[g] = new d(
          g,
          s.methodFactory
        )), h;
      };
      var m = typeof window !== n ? window.log : void 0;
      return s.noConflict = function() {
        return typeof window !== n && window.log === s && (window.log = m), s;
      }, s.getLoggers = function() {
        return o;
      }, s.default = s, s;
    });
  })(Me)), Me.exports;
}
var qr = Yr();
const Kr = /* @__PURE__ */ Hr(qr);
var ct = function(e, t) {
  return ct = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, r) {
    n.__proto__ = r;
  } || function(n, r) {
    for (var i in r) Object.prototype.hasOwnProperty.call(r, i) && (n[i] = r[i]);
  }, ct(e, t);
};
function ne(e, t) {
  if (typeof t != "function" && t !== null)
    throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
  ct(e, t);
  function n() {
    this.constructor = e;
  }
  e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n());
}
function Gr(e, t, n, r) {
  function i(o) {
    return o instanceof n ? o : new n(function(s) {
      s(o);
    });
  }
  return new (n || (n = Promise))(function(o, s) {
    function a(l) {
      try {
        u(r.next(l));
      } catch (f) {
        s(f);
      }
    }
    function c(l) {
      try {
        u(r.throw(l));
      } catch (f) {
        s(f);
      }
    }
    function u(l) {
      l.done ? o(l.value) : i(l.value).then(a, c);
    }
    u((r = r.apply(e, t || [])).next());
  });
}
function un(e, t) {
  var n = { label: 0, sent: function() {
    if (o[0] & 1) throw o[1];
    return o[1];
  }, trys: [], ops: [] }, r, i, o, s = Object.create((typeof Iterator == "function" ? Iterator : Object).prototype);
  return s.next = a(0), s.throw = a(1), s.return = a(2), typeof Symbol == "function" && (s[Symbol.iterator] = function() {
    return this;
  }), s;
  function a(u) {
    return function(l) {
      return c([u, l]);
    };
  }
  function c(u) {
    if (r) throw new TypeError("Generator is already executing.");
    for (; s && (s = 0, u[0] && (n = 0)), n; ) try {
      if (r = 1, i && (o = u[0] & 2 ? i.return : u[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, u[1])).done) return o;
      switch (i = 0, o && (u = [u[0] & 2, o.value]), u[0]) {
        case 0:
        case 1:
          o = u;
          break;
        case 4:
          return n.label++, { value: u[1], done: !1 };
        case 5:
          n.label++, i = u[1], u = [0];
          continue;
        case 7:
          u = n.ops.pop(), n.trys.pop();
          continue;
        default:
          if (o = n.trys, !(o = o.length > 0 && o[o.length - 1]) && (u[0] === 6 || u[0] === 2)) {
            n = 0;
            continue;
          }
          if (u[0] === 3 && (!o || u[1] > o[0] && u[1] < o[3])) {
            n.label = u[1];
            break;
          }
          if (u[0] === 6 && n.label < o[1]) {
            n.label = o[1], o = u;
            break;
          }
          if (o && n.label < o[2]) {
            n.label = o[2], n.ops.push(u);
            break;
          }
          o[2] && n.ops.pop(), n.trys.pop();
          continue;
      }
      u = t.call(e, n);
    } catch (l) {
      u = [6, l], i = 0;
    } finally {
      r = o = 0;
    }
    if (u[0] & 5) throw u[1];
    return { value: u[0] ? u[1] : void 0, done: !0 };
  }
}
function ge(e) {
  var t = typeof Symbol == "function" && Symbol.iterator, n = t && e[t], r = 0;
  if (n) return n.call(e);
  if (e && typeof e.length == "number") return {
    next: function() {
      return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e };
    }
  };
  throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function de(e, t) {
  var n = typeof Symbol == "function" && e[Symbol.iterator];
  if (!n) return e;
  var r = n.call(e), i, o = [], s;
  try {
    for (; (t === void 0 || t-- > 0) && !(i = r.next()).done; ) o.push(i.value);
  } catch (a) {
    s = { error: a };
  } finally {
    try {
      i && !i.done && (n = r.return) && n.call(r);
    } finally {
      if (s) throw s.error;
    }
  }
  return o;
}
function be(e, t, n) {
  if (n || arguments.length === 2) for (var r = 0, i = t.length, o; r < i; r++)
    (o || !(r in t)) && (o || (o = Array.prototype.slice.call(t, 0, r)), o[r] = t[r]);
  return e.concat(o || Array.prototype.slice.call(t));
}
function ve(e) {
  return this instanceof ve ? (this.v = e, this) : new ve(e);
}
function Qr(e, t, n) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var r = n.apply(e, t || []), i, o = [];
  return i = Object.create((typeof AsyncIterator == "function" ? AsyncIterator : Object).prototype), a("next"), a("throw"), a("return", s), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function s(d) {
    return function(m) {
      return Promise.resolve(m).then(d, f);
    };
  }
  function a(d, m) {
    r[d] && (i[d] = function(p) {
      return new Promise(function(g, h) {
        o.push([d, p, g, h]) > 1 || c(d, p);
      });
    }, m && (i[d] = m(i[d])));
  }
  function c(d, m) {
    try {
      u(r[d](m));
    } catch (p) {
      v(o[0][3], p);
    }
  }
  function u(d) {
    d.value instanceof ve ? Promise.resolve(d.value.v).then(l, f) : v(o[0][2], d);
  }
  function l(d) {
    c("next", d);
  }
  function f(d) {
    c("throw", d);
  }
  function v(d, m) {
    d(m), o.shift(), o.length && c(o[0][0], o[0][1]);
  }
}
function Jr(e) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var t = e[Symbol.asyncIterator], n;
  return t ? t.call(e) : (e = typeof ge == "function" ? ge(e) : e[Symbol.iterator](), n = {}, r("next"), r("throw"), r("return"), n[Symbol.asyncIterator] = function() {
    return this;
  }, n);
  function r(o) {
    n[o] = e[o] && function(s) {
      return new Promise(function(a, c) {
        s = e[o](s), i(a, c, s.done, s.value);
      });
    };
  }
  function i(o, s, a, c) {
    Promise.resolve(c).then(function(u) {
      o({ value: u, done: a });
    }, s);
  }
}
function P(e) {
  return typeof e == "function";
}
function mt(e) {
  var t = function(r) {
    Error.call(r), r.stack = new Error().stack;
  }, n = e(t);
  return n.prototype = Object.create(Error.prototype), n.prototype.constructor = n, n;
}
var tt = mt(function(e) {
  return function(n) {
    e(this), this.message = n ? n.length + ` errors occurred during unsubscription:
` + n.map(function(r, i) {
      return i + 1 + ") " + r.toString();
    }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = n;
  };
});
function Ue(e, t) {
  if (e) {
    var n = e.indexOf(t);
    0 <= n && e.splice(n, 1);
  }
}
var ke = (function() {
  function e(t) {
    this.initialTeardown = t, this.closed = !1, this._parentage = null, this._finalizers = null;
  }
  return e.prototype.unsubscribe = function() {
    var t, n, r, i, o;
    if (!this.closed) {
      this.closed = !0;
      var s = this._parentage;
      if (s)
        if (this._parentage = null, Array.isArray(s))
          try {
            for (var a = ge(s), c = a.next(); !c.done; c = a.next()) {
              var u = c.value;
              u.remove(this);
            }
          } catch (p) {
            t = { error: p };
          } finally {
            try {
              c && !c.done && (n = a.return) && n.call(a);
            } finally {
              if (t) throw t.error;
            }
          }
        else
          s.remove(this);
      var l = this.initialTeardown;
      if (P(l))
        try {
          l();
        } catch (p) {
          o = p instanceof tt ? p.errors : [p];
        }
      var f = this._finalizers;
      if (f) {
        this._finalizers = null;
        try {
          for (var v = ge(f), d = v.next(); !d.done; d = v.next()) {
            var m = d.value;
            try {
              Mt(m);
            } catch (p) {
              o = o ?? [], p instanceof tt ? o = be(be([], de(o)), de(p.errors)) : o.push(p);
            }
          }
        } catch (p) {
          r = { error: p };
        } finally {
          try {
            d && !d.done && (i = v.return) && i.call(v);
          } finally {
            if (r) throw r.error;
          }
        }
      }
      if (o)
        throw new tt(o);
    }
  }, e.prototype.add = function(t) {
    var n;
    if (t && t !== this)
      if (this.closed)
        Mt(t);
      else {
        if (t instanceof e) {
          if (t.closed || t._hasParent(this))
            return;
          t._addParent(this);
        }
        (this._finalizers = (n = this._finalizers) !== null && n !== void 0 ? n : []).push(t);
      }
  }, e.prototype._hasParent = function(t) {
    var n = this._parentage;
    return n === t || Array.isArray(n) && n.includes(t);
  }, e.prototype._addParent = function(t) {
    var n = this._parentage;
    this._parentage = Array.isArray(n) ? (n.push(t), n) : n ? [n, t] : t;
  }, e.prototype._removeParent = function(t) {
    var n = this._parentage;
    n === t ? this._parentage = null : Array.isArray(n) && Ue(n, t);
  }, e.prototype.remove = function(t) {
    var n = this._finalizers;
    n && Ue(n, t), t instanceof e && t._removeParent(this);
  }, e.EMPTY = (function() {
    var t = new e();
    return t.closed = !0, t;
  })(), e;
})(), ln = ke.EMPTY;
function fn(e) {
  return e instanceof ke || e && "closed" in e && P(e.remove) && P(e.add) && P(e.unsubscribe);
}
function Mt(e) {
  P(e) ? e() : e.unsubscribe();
}
var Xr = {
  Promise: void 0
}, Zr = {
  setTimeout: function(e, t) {
    for (var n = [], r = 2; r < arguments.length; r++)
      n[r - 2] = arguments[r];
    return setTimeout.apply(void 0, be([e, t], de(n)));
  },
  clearTimeout: function(e) {
    return clearTimeout(e);
  },
  delegate: void 0
};
function dn(e) {
  Zr.setTimeout(function() {
    throw e;
  });
}
function We() {
}
function Re(e) {
  e();
}
var gt = (function(e) {
  ne(t, e);
  function t(n) {
    var r = e.call(this) || this;
    return r.isStopped = !1, n ? (r.destination = n, fn(n) && n.add(r)) : r.destination = ni, r;
  }
  return t.create = function(n, r, i) {
    return new Pe(n, r, i);
  }, t.prototype.next = function(n) {
    this.isStopped || this._next(n);
  }, t.prototype.error = function(n) {
    this.isStopped || (this.isStopped = !0, this._error(n));
  }, t.prototype.complete = function() {
    this.isStopped || (this.isStopped = !0, this._complete());
  }, t.prototype.unsubscribe = function() {
    this.closed || (this.isStopped = !0, e.prototype.unsubscribe.call(this), this.destination = null);
  }, t.prototype._next = function(n) {
    this.destination.next(n);
  }, t.prototype._error = function(n) {
    try {
      this.destination.error(n);
    } finally {
      this.unsubscribe();
    }
  }, t.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }, t;
})(ke), ei = (function() {
  function e(t) {
    this.partialObserver = t;
  }
  return e.prototype.next = function(t) {
    var n = this.partialObserver;
    if (n.next)
      try {
        n.next(t);
      } catch (r) {
        Le(r);
      }
  }, e.prototype.error = function(t) {
    var n = this.partialObserver;
    if (n.error)
      try {
        n.error(t);
      } catch (r) {
        Le(r);
      }
    else
      Le(t);
  }, e.prototype.complete = function() {
    var t = this.partialObserver;
    if (t.complete)
      try {
        t.complete();
      } catch (n) {
        Le(n);
      }
  }, e;
})(), Pe = (function(e) {
  ne(t, e);
  function t(n, r, i) {
    var o = e.call(this) || this, s;
    return P(n) || !n ? s = {
      next: n ?? void 0,
      error: r ?? void 0,
      complete: i ?? void 0
    } : s = n, o.destination = new ei(s), o;
  }
  return t;
})(gt);
function Le(e) {
  dn(e);
}
function ti(e) {
  throw e;
}
var ni = {
  closed: !0,
  next: We,
  error: ti,
  complete: We
}, bt = (function() {
  return typeof Symbol == "function" && Symbol.observable || "@@observable";
})();
function Qe(e) {
  return e;
}
function ri(e) {
  return e.length === 0 ? Qe : e.length === 1 ? e[0] : function(n) {
    return e.reduce(function(r, i) {
      return i(r);
    }, n);
  };
}
var k = (function() {
  function e(t) {
    t && (this._subscribe = t);
  }
  return e.prototype.lift = function(t) {
    var n = new e();
    return n.source = this, n.operator = t, n;
  }, e.prototype.subscribe = function(t, n, r) {
    var i = this, o = oi(t) ? t : new Pe(t, n, r);
    return Re(function() {
      var s = i, a = s.operator, c = s.source;
      o.add(a ? a.call(o, c) : c ? i._subscribe(o) : i._trySubscribe(o));
    }), o;
  }, e.prototype._trySubscribe = function(t) {
    try {
      return this._subscribe(t);
    } catch (n) {
      t.error(n);
    }
  }, e.prototype.forEach = function(t, n) {
    var r = this;
    return n = Rt(n), new n(function(i, o) {
      var s = new Pe({
        next: function(a) {
          try {
            t(a);
          } catch (c) {
            o(c), s.unsubscribe();
          }
        },
        error: o,
        complete: i
      });
      r.subscribe(s);
    });
  }, e.prototype._subscribe = function(t) {
    var n;
    return (n = this.source) === null || n === void 0 ? void 0 : n.subscribe(t);
  }, e.prototype[bt] = function() {
    return this;
  }, e.prototype.pipe = function() {
    for (var t = [], n = 0; n < arguments.length; n++)
      t[n] = arguments[n];
    return ri(t)(this);
  }, e.prototype.toPromise = function(t) {
    var n = this;
    return t = Rt(t), new t(function(r, i) {
      var o;
      n.subscribe(function(s) {
        return o = s;
      }, function(s) {
        return i(s);
      }, function() {
        return r(o);
      });
    });
  }, e.create = function(t) {
    return new e(t);
  }, e;
})();
function Rt(e) {
  var t;
  return (t = e ?? Xr.Promise) !== null && t !== void 0 ? t : Promise;
}
function ii(e) {
  return e && P(e.next) && P(e.error) && P(e.complete);
}
function oi(e) {
  return e && e instanceof gt || ii(e) && fn(e);
}
function si(e) {
  return P(e == null ? void 0 : e.lift);
}
function W(e) {
  return function(t) {
    if (si(t))
      return t.lift(function(n) {
        try {
          return e(n, this);
        } catch (r) {
          this.error(r);
        }
      });
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function F(e, t, n, r, i) {
  return new ai(e, t, n, r, i);
}
var ai = (function(e) {
  ne(t, e);
  function t(n, r, i, o, s, a) {
    var c = e.call(this, n) || this;
    return c.onFinalize = s, c.shouldUnsubscribe = a, c._next = r ? function(u) {
      try {
        r(u);
      } catch (l) {
        n.error(l);
      }
    } : e.prototype._next, c._error = o ? function(u) {
      try {
        o(u);
      } catch (l) {
        n.error(l);
      } finally {
        this.unsubscribe();
      }
    } : e.prototype._error, c._complete = i ? function() {
      try {
        i();
      } catch (u) {
        n.error(u);
      } finally {
        this.unsubscribe();
      }
    } : e.prototype._complete, c;
  }
  return t.prototype.unsubscribe = function() {
    var n;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var r = this.closed;
      e.prototype.unsubscribe.call(this), !r && ((n = this.onFinalize) === null || n === void 0 || n.call(this));
    }
  }, t;
})(gt), ci = mt(function(e) {
  return function() {
    e(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
  };
}), te = (function(e) {
  ne(t, e);
  function t() {
    var n = e.call(this) || this;
    return n.closed = !1, n.currentObservers = null, n.observers = [], n.isStopped = !1, n.hasError = !1, n.thrownError = null, n;
  }
  return t.prototype.lift = function(n) {
    var r = new Dt(this, this);
    return r.operator = n, r;
  }, t.prototype._throwIfClosed = function() {
    if (this.closed)
      throw new ci();
  }, t.prototype.next = function(n) {
    var r = this;
    Re(function() {
      var i, o;
      if (r._throwIfClosed(), !r.isStopped) {
        r.currentObservers || (r.currentObservers = Array.from(r.observers));
        try {
          for (var s = ge(r.currentObservers), a = s.next(); !a.done; a = s.next()) {
            var c = a.value;
            c.next(n);
          }
        } catch (u) {
          i = { error: u };
        } finally {
          try {
            a && !a.done && (o = s.return) && o.call(s);
          } finally {
            if (i) throw i.error;
          }
        }
      }
    });
  }, t.prototype.error = function(n) {
    var r = this;
    Re(function() {
      if (r._throwIfClosed(), !r.isStopped) {
        r.hasError = r.isStopped = !0, r.thrownError = n;
        for (var i = r.observers; i.length; )
          i.shift().error(n);
      }
    });
  }, t.prototype.complete = function() {
    var n = this;
    Re(function() {
      if (n._throwIfClosed(), !n.isStopped) {
        n.isStopped = !0;
        for (var r = n.observers; r.length; )
          r.shift().complete();
      }
    });
  }, t.prototype.unsubscribe = function() {
    this.isStopped = this.closed = !0, this.observers = this.currentObservers = null;
  }, Object.defineProperty(t.prototype, "observed", {
    get: function() {
      var n;
      return ((n = this.observers) === null || n === void 0 ? void 0 : n.length) > 0;
    },
    enumerable: !1,
    configurable: !0
  }), t.prototype._trySubscribe = function(n) {
    return this._throwIfClosed(), e.prototype._trySubscribe.call(this, n);
  }, t.prototype._subscribe = function(n) {
    return this._throwIfClosed(), this._checkFinalizedStatuses(n), this._innerSubscribe(n);
  }, t.prototype._innerSubscribe = function(n) {
    var r = this, i = this, o = i.hasError, s = i.isStopped, a = i.observers;
    return o || s ? ln : (this.currentObservers = null, a.push(n), new ke(function() {
      r.currentObservers = null, Ue(a, n);
    }));
  }, t.prototype._checkFinalizedStatuses = function(n) {
    var r = this, i = r.hasError, o = r.thrownError, s = r.isStopped;
    i ? n.error(o) : s && n.complete();
  }, t.prototype.asObservable = function() {
    var n = new k();
    return n.source = this, n;
  }, t.create = function(n, r) {
    return new Dt(n, r);
  }, t;
})(k), Dt = (function(e) {
  ne(t, e);
  function t(n, r) {
    var i = e.call(this) || this;
    return i.destination = n, i.source = r, i;
  }
  return t.prototype.next = function(n) {
    var r, i;
    (i = (r = this.destination) === null || r === void 0 ? void 0 : r.next) === null || i === void 0 || i.call(r, n);
  }, t.prototype.error = function(n) {
    var r, i;
    (i = (r = this.destination) === null || r === void 0 ? void 0 : r.error) === null || i === void 0 || i.call(r, n);
  }, t.prototype.complete = function() {
    var n, r;
    (r = (n = this.destination) === null || n === void 0 ? void 0 : n.complete) === null || r === void 0 || r.call(n);
  }, t.prototype._subscribe = function(n) {
    var r, i;
    return (i = (r = this.source) === null || r === void 0 ? void 0 : r.subscribe(n)) !== null && i !== void 0 ? i : ln;
  }, t;
})(te), pn = (function(e) {
  ne(t, e);
  function t(n) {
    var r = e.call(this) || this;
    return r._value = n, r;
  }
  return Object.defineProperty(t.prototype, "value", {
    get: function() {
      return this.getValue();
    },
    enumerable: !1,
    configurable: !0
  }), t.prototype._subscribe = function(n) {
    var r = e.prototype._subscribe.call(this, n);
    return !r.closed && n.next(this._value), r;
  }, t.prototype.getValue = function() {
    var n = this, r = n.hasError, i = n.thrownError, o = n._value;
    if (r)
      throw i;
    return this._throwIfClosed(), o;
  }, t.prototype.next = function(n) {
    e.prototype.next.call(this, this._value = n);
  }, t;
})(te), ui = {
  now: function() {
    return Date.now();
  }
}, li = (function(e) {
  ne(t, e);
  function t(n, r) {
    return e.call(this) || this;
  }
  return t.prototype.schedule = function(n, r) {
    return this;
  }, t;
})(ke), $t = {
  setInterval: function(e, t) {
    for (var n = [], r = 2; r < arguments.length; r++)
      n[r - 2] = arguments[r];
    return setInterval.apply(void 0, be([e, t], de(n)));
  },
  clearInterval: function(e) {
    return clearInterval(e);
  },
  delegate: void 0
}, fi = (function(e) {
  ne(t, e);
  function t(n, r) {
    var i = e.call(this, n, r) || this;
    return i.scheduler = n, i.work = r, i.pending = !1, i;
  }
  return t.prototype.schedule = function(n, r) {
    var i;
    if (r === void 0 && (r = 0), this.closed)
      return this;
    this.state = n;
    var o = this.id, s = this.scheduler;
    return o != null && (this.id = this.recycleAsyncId(s, o, r)), this.pending = !0, this.delay = r, this.id = (i = this.id) !== null && i !== void 0 ? i : this.requestAsyncId(s, this.id, r), this;
  }, t.prototype.requestAsyncId = function(n, r, i) {
    return i === void 0 && (i = 0), $t.setInterval(n.flush.bind(n, this), i);
  }, t.prototype.recycleAsyncId = function(n, r, i) {
    if (i === void 0 && (i = 0), i != null && this.delay === i && this.pending === !1)
      return r;
    r != null && $t.clearInterval(r);
  }, t.prototype.execute = function(n, r) {
    if (this.closed)
      return new Error("executing a cancelled action");
    this.pending = !1;
    var i = this._execute(n, r);
    if (i)
      return i;
    this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null));
  }, t.prototype._execute = function(n, r) {
    var i = !1, o;
    try {
      this.work(n);
    } catch (s) {
      i = !0, o = s || new Error("Scheduled action threw falsy error");
    }
    if (i)
      return this.unsubscribe(), o;
  }, t.prototype.unsubscribe = function() {
    if (!this.closed) {
      var n = this, r = n.id, i = n.scheduler, o = i.actions;
      this.work = this.state = this.scheduler = null, this.pending = !1, Ue(o, this), r != null && (this.id = this.recycleAsyncId(i, r, null)), this.delay = null, e.prototype.unsubscribe.call(this);
    }
  }, t;
})(li), Nt = (function() {
  function e(t, n) {
    n === void 0 && (n = e.now), this.schedulerActionCtor = t, this.now = n;
  }
  return e.prototype.schedule = function(t, n, r) {
    return n === void 0 && (n = 0), new this.schedulerActionCtor(this, t).schedule(r, n);
  }, e.now = ui.now, e;
})(), di = (function(e) {
  ne(t, e);
  function t(n, r) {
    r === void 0 && (r = Nt.now);
    var i = e.call(this, n, r) || this;
    return i.actions = [], i._active = !1, i;
  }
  return t.prototype.flush = function(n) {
    var r = this.actions;
    if (this._active) {
      r.push(n);
      return;
    }
    var i;
    this._active = !0;
    do
      if (i = n.execute(n.state, n.delay))
        break;
    while (n = r.shift());
    if (this._active = !1, i) {
      for (; n = r.shift(); )
        n.unsubscribe();
      throw i;
    }
  }, t;
})(Nt), pi = new di(fi);
function hi(e) {
  return e && P(e.schedule);
}
function vi(e) {
  return e[e.length - 1];
}
function yt(e) {
  return hi(vi(e)) ? e.pop() : void 0;
}
var wt = (function(e) {
  return e && typeof e.length == "number" && typeof e != "function";
});
function hn(e) {
  return P(e == null ? void 0 : e.then);
}
function vn(e) {
  return P(e[bt]);
}
function mn(e) {
  return Symbol.asyncIterator && P(e == null ? void 0 : e[Symbol.asyncIterator]);
}
function gn(e) {
  return new TypeError("You provided " + (e !== null && typeof e == "object" ? "an invalid object" : "'" + e + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
function mi() {
  return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
}
var bn = mi();
function yn(e) {
  return P(e == null ? void 0 : e[bn]);
}
function wn(e) {
  return Qr(this, arguments, function() {
    var n, r, i, o;
    return un(this, function(s) {
      switch (s.label) {
        case 0:
          n = e.getReader(), s.label = 1;
        case 1:
          s.trys.push([1, , 9, 10]), s.label = 2;
        case 2:
          return [4, ve(n.read())];
        case 3:
          return r = s.sent(), i = r.value, o = r.done, o ? [4, ve(void 0)] : [3, 5];
        case 4:
          return [2, s.sent()];
        case 5:
          return [4, ve(i)];
        case 6:
          return [4, s.sent()];
        case 7:
          return s.sent(), [3, 2];
        case 8:
          return [3, 10];
        case 9:
          return n.releaseLock(), [7];
        case 10:
          return [2];
      }
    });
  });
}
function xn(e) {
  return P(e == null ? void 0 : e.getReader);
}
function z(e) {
  if (e instanceof k)
    return e;
  if (e != null) {
    if (vn(e))
      return gi(e);
    if (wt(e))
      return bi(e);
    if (hn(e))
      return yi(e);
    if (mn(e))
      return Sn(e);
    if (yn(e))
      return wi(e);
    if (xn(e))
      return xi(e);
  }
  throw gn(e);
}
function gi(e) {
  return new k(function(t) {
    var n = e[bt]();
    if (P(n.subscribe))
      return n.subscribe(t);
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function bi(e) {
  return new k(function(t) {
    for (var n = 0; n < e.length && !t.closed; n++)
      t.next(e[n]);
    t.complete();
  });
}
function yi(e) {
  return new k(function(t) {
    e.then(function(n) {
      t.closed || (t.next(n), t.complete());
    }, function(n) {
      return t.error(n);
    }).then(null, dn);
  });
}
function wi(e) {
  return new k(function(t) {
    var n, r;
    try {
      for (var i = ge(e), o = i.next(); !o.done; o = i.next()) {
        var s = o.value;
        if (t.next(s), t.closed)
          return;
      }
    } catch (a) {
      n = { error: a };
    } finally {
      try {
        o && !o.done && (r = i.return) && r.call(i);
      } finally {
        if (n) throw n.error;
      }
    }
    t.complete();
  });
}
function Sn(e) {
  return new k(function(t) {
    Si(e, t).catch(function(n) {
      return t.error(n);
    });
  });
}
function xi(e) {
  return Sn(wn(e));
}
function Si(e, t) {
  var n, r, i, o;
  return Gr(this, void 0, void 0, function() {
    var s, a;
    return un(this, function(c) {
      switch (c.label) {
        case 0:
          c.trys.push([0, 5, 6, 11]), n = Jr(e), c.label = 1;
        case 1:
          return [4, n.next()];
        case 2:
          if (r = c.sent(), !!r.done) return [3, 4];
          if (s = r.value, t.next(s), t.closed)
            return [2];
          c.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          return a = c.sent(), i = { error: a }, [3, 11];
        case 6:
          return c.trys.push([6, , 9, 10]), r && !r.done && (o = n.return) ? [4, o.call(n)] : [3, 8];
        case 7:
          c.sent(), c.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (i) throw i.error;
          return [7];
        case 10:
          return [7];
        case 11:
          return t.complete(), [2];
      }
    });
  });
}
function oe(e, t, n, r, i) {
  r === void 0 && (r = 0), i === void 0 && (i = !1);
  var o = t.schedule(function() {
    n(), i ? e.add(this.schedule(null, r)) : this.unsubscribe();
  }, r);
  if (e.add(o), !i)
    return o;
}
function Tn(e, t) {
  return t === void 0 && (t = 0), W(function(n, r) {
    n.subscribe(F(r, function(i) {
      return oe(r, e, function() {
        return r.next(i);
      }, t);
    }, function() {
      return oe(r, e, function() {
        return r.complete();
      }, t);
    }, function(i) {
      return oe(r, e, function() {
        return r.error(i);
      }, t);
    }));
  });
}
function En(e, t) {
  return t === void 0 && (t = 0), W(function(n, r) {
    r.add(e.schedule(function() {
      return n.subscribe(r);
    }, t));
  });
}
function Ti(e, t) {
  return z(e).pipe(En(t), Tn(t));
}
function Ei(e, t) {
  return z(e).pipe(En(t), Tn(t));
}
function Ci(e, t) {
  return new k(function(n) {
    var r = 0;
    return t.schedule(function() {
      r === e.length ? n.complete() : (n.next(e[r++]), n.closed || this.schedule());
    });
  });
}
function Pi(e, t) {
  return new k(function(n) {
    var r;
    return oe(n, t, function() {
      r = e[bn](), oe(n, t, function() {
        var i, o, s;
        try {
          i = r.next(), o = i.value, s = i.done;
        } catch (a) {
          n.error(a);
          return;
        }
        s ? n.complete() : n.next(o);
      }, 0, !0);
    }), function() {
      return P(r == null ? void 0 : r.return) && r.return();
    };
  });
}
function Cn(e, t) {
  if (!e)
    throw new Error("Iterable cannot be null");
  return new k(function(n) {
    oe(n, t, function() {
      var r = e[Symbol.asyncIterator]();
      oe(n, t, function() {
        r.next().then(function(i) {
          i.done ? n.complete() : n.next(i.value);
        });
      }, 0, !0);
    });
  });
}
function Oi(e, t) {
  return Cn(wn(e), t);
}
function Ai(e, t) {
  if (e != null) {
    if (vn(e))
      return Ti(e, t);
    if (wt(e))
      return Ci(e, t);
    if (hn(e))
      return Ei(e, t);
    if (mn(e))
      return Cn(e, t);
    if (yn(e))
      return Pi(e, t);
    if (xn(e))
      return Oi(e, t);
  }
  throw gn(e);
}
function Je(e, t) {
  return t ? Ai(e, t) : z(e);
}
function Ft() {
  for (var e = [], t = 0; t < arguments.length; t++)
    e[t] = arguments[t];
  var n = yt(e);
  return Je(e, n);
}
function ki(e) {
  return e instanceof Date && !isNaN(e);
}
var _i = mt(function(e) {
  return function(n) {
    n === void 0 && (n = null), e(this), this.message = "Timeout has occurred", this.name = "TimeoutError", this.info = n;
  };
});
function Li(e, t) {
  var n = ki(e) ? { first: e } : typeof e == "number" ? { each: e } : e, r = n.first, i = n.each, o = n.with, s = o === void 0 ? Ii : o, a = n.scheduler, c = a === void 0 ? pi : a, u = n.meta, l = u === void 0 ? null : u;
  if (r == null && i == null)
    throw new TypeError("No timeout provided.");
  return W(function(f, v) {
    var d, m, p = null, g = 0, h = function(x) {
      m = oe(v, c, function() {
        try {
          d.unsubscribe(), z(s({
            meta: l,
            lastValue: p,
            seen: g
          })).subscribe(v);
        } catch (E) {
          v.error(E);
        }
      }, x);
    };
    d = f.subscribe(F(v, function(x) {
      m == null || m.unsubscribe(), g++, v.next(p = x), i > 0 && h(i);
    }, void 0, void 0, function() {
      m != null && m.closed || m == null || m.unsubscribe(), p = null;
    })), !g && h(r != null ? typeof r == "number" ? r : +r - c.now() : i);
  });
}
function Ii(e) {
  throw new _i(e);
}
function A(e, t) {
  return W(function(n, r) {
    var i = 0;
    n.subscribe(F(r, function(o) {
      r.next(e.call(t, o, i++));
    }));
  });
}
var Mi = Array.isArray;
function Ri(e, t) {
  return Mi(t) ? e.apply(void 0, be([], de(t))) : e(t);
}
function Di(e) {
  return A(function(t) {
    return Ri(e, t);
  });
}
function $i(e, t, n, r, i, o, s, a) {
  var c = [], u = 0, l = 0, f = !1, v = function() {
    f && !c.length && !u && t.complete();
  }, d = function(p) {
    return u < r ? m(p) : c.push(p);
  }, m = function(p) {
    u++;
    var g = !1;
    z(n(p, l++)).subscribe(F(t, function(h) {
      t.next(h);
    }, function() {
      g = !0;
    }, void 0, function() {
      if (g)
        try {
          u--;
          for (var h = function() {
            var x = c.shift();
            s || m(x);
          }; c.length && u < r; )
            h();
          v();
        } catch (x) {
          t.error(x);
        }
    }));
  };
  return e.subscribe(F(t, d, function() {
    f = !0, v();
  })), function() {
  };
}
function xt(e, t, n) {
  return n === void 0 && (n = 1 / 0), P(t) ? xt(function(r, i) {
    return A(function(o, s) {
      return t(r, o, i, s);
    })(z(e(r, i)));
  }, n) : (typeof t == "number" && (n = t), W(function(r, i) {
    return $i(r, i, e, n);
  }));
}
function Ni(e) {
  return xt(Qe, e);
}
function Fi() {
  return Ni(1);
}
function je() {
  for (var e = [], t = 0; t < arguments.length; t++)
    e[t] = arguments[t];
  return Fi()(Je(e, yt(e)));
}
var Ui = ["addListener", "removeListener"], Wi = ["addEventListener", "removeEventListener"], ji = ["on", "off"];
function ut(e, t, n, r) {
  if (P(n) && (r = n, n = void 0), r)
    return ut(e, t, n).pipe(Di(r));
  var i = de(Hi(e) ? Wi.map(function(a) {
    return function(c) {
      return e[a](t, c, n);
    };
  }) : Bi(e) ? Ui.map(Ut(e, t)) : Vi(e) ? ji.map(Ut(e, t)) : [], 2), o = i[0], s = i[1];
  if (!o && wt(e))
    return xt(function(a) {
      return ut(a, t, n);
    })(z(e));
  if (!o)
    throw new TypeError("Invalid event target");
  return new k(function(a) {
    var c = function() {
      for (var u = [], l = 0; l < arguments.length; l++)
        u[l] = arguments[l];
      return a.next(1 < u.length ? u : u[0]);
    };
    return o(c), function() {
      return s(c);
    };
  });
}
function Ut(e, t) {
  return function(n) {
    return function(r) {
      return e[n](t, r);
    };
  };
}
function Bi(e) {
  return P(e.addListener) && P(e.removeListener);
}
function Vi(e) {
  return P(e.on) && P(e.off);
}
function Hi(e) {
  return P(e.addEventListener) && P(e.removeEventListener);
}
function Xe(e, t) {
  return W(function(n, r) {
    var i = 0;
    n.subscribe(F(r, function(o) {
      return e.call(t, o, i++) && r.next(o);
    }));
  });
}
function zi(e, t, n, r, i) {
  return function(o, s) {
    var a = n, c = t, u = 0;
    o.subscribe(F(s, function(l) {
      var f = u++;
      c = a ? e(c, l, f) : (a = !0, l), s.next(c);
    }, i));
  };
}
function Yi(e, t) {
  return t === void 0 && (t = Qe), e = e ?? qi, W(function(n, r) {
    var i, o = !0;
    n.subscribe(F(r, function(s) {
      var a = t(s);
      (o || !e(i, a)) && (o = !1, i = a, r.next(s));
    }));
  });
}
function qi(e, t) {
  return e === t;
}
function lt(e, t) {
  return W(zi(e, t, arguments.length >= 2, !0));
}
function Ki(e) {
  e === void 0 && (e = {});
  var t = e.connector, n = t === void 0 ? function() {
    return new te();
  } : t, r = e.resetOnError, i = r === void 0 ? !0 : r, o = e.resetOnComplete, s = o === void 0 ? !0 : o, a = e.resetOnRefCountZero, c = a === void 0 ? !0 : a;
  return function(u) {
    var l, f, v, d = 0, m = !1, p = !1, g = function() {
      f == null || f.unsubscribe(), f = void 0;
    }, h = function() {
      g(), l = v = void 0, m = p = !1;
    }, x = function() {
      var E = l;
      h(), E == null || E.unsubscribe();
    };
    return W(function(E, O) {
      d++, !p && !m && g();
      var b = v = v ?? n();
      O.add(function() {
        d--, d === 0 && !p && !m && (f = nt(x, c));
      }), b.subscribe(O), !l && d > 0 && (l = new Pe({
        next: function(S) {
          return b.next(S);
        },
        error: function(S) {
          p = !0, g(), f = nt(h, i, S), b.error(S);
        },
        complete: function() {
          m = !0, g(), f = nt(h, s), b.complete();
        }
      }), z(E).subscribe(l));
    })(u);
  };
}
function nt(e, t) {
  for (var n = [], r = 2; r < arguments.length; r++)
    n[r - 2] = arguments[r];
  if (t === !0) {
    e();
    return;
  }
  if (t !== !1) {
    var i = new Pe({
      next: function() {
        i.unsubscribe(), e();
      }
    });
    return z(t.apply(void 0, be([], de(n)))).subscribe(i);
  }
}
function Gi(e) {
  return W(function(t, n) {
    var r = !1, i = F(n, function() {
      i == null || i.unsubscribe(), r = !0;
    }, We);
    z(e).subscribe(i), t.subscribe(F(n, function(o) {
      return r && n.next(o);
    }));
  });
}
function D() {
  for (var e = [], t = 0; t < arguments.length; t++)
    e[t] = arguments[t];
  var n = yt(e);
  return W(function(r, i) {
    (n ? je(e, r, n) : je(e, r)).subscribe(i);
  });
}
function Pn(e, t) {
  return W(function(n, r) {
    var i = null, o = 0, s = !1, a = function() {
      return s && !i && r.complete();
    };
    n.subscribe(F(r, function(c) {
      i == null || i.unsubscribe();
      var u = 0, l = o++;
      z(e(c, l)).subscribe(i = F(r, function(f) {
        return r.next(t ? t(c, f, l, u++) : f);
      }, function() {
        i = null, a();
      }));
    }, function() {
      s = !0, a();
    }));
  });
}
function Wt(e) {
  return W(function(t, n) {
    z(e).subscribe(F(n, function() {
      return n.complete();
    }, We)), !n.closed && t.subscribe(n);
  });
}
function Qi(e, t, n) {
  var r = P(e) || t || n ? { next: e, error: t, complete: n } : e;
  return r ? W(function(i, o) {
    var s;
    (s = r.subscribe) === null || s === void 0 || s.call(r);
    var a = !0;
    i.subscribe(F(o, function(c) {
      var u;
      (u = r.next) === null || u === void 0 || u.call(r, c), o.next(c);
    }, function() {
      var c;
      a = !1, (c = r.complete) === null || c === void 0 || c.call(r), o.complete();
    }, function(c) {
      var u;
      a = !1, (u = r.error) === null || u === void 0 || u.call(r, c), o.error(c);
    }, function() {
      var c, u;
      a && ((c = r.unsubscribe) === null || c === void 0 || c.call(r)), (u = r.finalize) === null || u === void 0 || u.call(r);
    }));
  }) : Qe;
}
var Ji = Object.defineProperty, Xi = Object.defineProperties, Zi = Object.getOwnPropertyDescriptors, jt = Object.getOwnPropertySymbols, eo = Object.prototype.hasOwnProperty, to = Object.prototype.propertyIsEnumerable, Bt = (e, t, n) => t in e ? Ji(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, q = (e, t) => {
  for (var n in t || (t = {}))
    eo.call(t, n) && Bt(e, n, t[n]);
  if (jt)
    for (var n of jt(t))
      to.call(t, n) && Bt(e, n, t[n]);
  return e;
}, ce = (e, t) => Xi(e, Zi(t)), H = (e, t, n) => new Promise((r, i) => {
  var o = (c) => {
    try {
      a(n.next(c));
    } catch (u) {
      i(u);
    }
  }, s = (c) => {
    try {
      a(n.throw(c));
    } catch (u) {
      i(u);
    }
  }, a = (c) => c.done ? r(c.value) : Promise.resolve(c.value).then(o, s);
  a((n = n.apply(e, t)).next());
}), On = "lk";
function B(e) {
  return typeof e > "u" ? !1 : no(e) || ro(e);
}
function no(e) {
  var t;
  return e ? e.hasOwnProperty("participant") && e.hasOwnProperty("source") && e.hasOwnProperty("track") && typeof ((t = e.publication) == null ? void 0 : t.track) < "u" : !1;
}
function ro(e) {
  return e ? e.hasOwnProperty("participant") && e.hasOwnProperty("source") && e.hasOwnProperty("publication") && typeof e.publication < "u" : !1;
}
function Oe(e) {
  return e ? e.hasOwnProperty("participant") && e.hasOwnProperty("source") && typeof e.publication > "u" : !1;
}
function N(e) {
  if (typeof e == "string" || typeof e == "number")
    return `${e}`;
  if (Oe(e))
    return `${e.participant.identity}_${e.source}_placeholder`;
  if (B(e))
    return `${e.participant.identity}_${e.publication.source}_${e.publication.trackSid}`;
  throw new Error(`Can't generate a id for the given track reference: ${e}`);
}
function ts(e, t) {
  return e === void 0 || t === void 0 ? !1 : B(e) && B(t) ? e.publication.trackSid === t.publication.trackSid : N(e) === N(t);
}
function ns(e, t) {
  return typeof t > "u" ? !1 : B(e) ? t.some(
    (n) => n.participant.identity === e.participant.identity && B(n) && n.publication.trackSid === e.publication.trackSid
  ) : Oe(e) ? t.some(
    (n) => n.participant.identity === e.participant.identity && Oe(n) && n.source === e.source
  ) : !1;
}
function io(e, t) {
  return Oe(e) && B(t) && t.participant.identity === e.participant.identity && t.source === e.source;
}
function rs() {
  const e = document.createElement("p");
  e.style.width = "100%", e.style.height = "200px";
  const t = document.createElement("div");
  t.style.position = "absolute", t.style.top = "0px", t.style.left = "0px", t.style.visibility = "hidden", t.style.width = "200px", t.style.height = "150px", t.style.overflow = "hidden", t.appendChild(e), document.body.appendChild(t);
  const n = e.offsetWidth;
  t.style.overflow = "scroll";
  let r = e.offsetWidth;
  return n === r && (r = t.clientWidth), document.body.removeChild(t), n - r;
}
function is() {
  return typeof document < "u";
}
function oo(e) {
  e = q({}, e);
  const t = "(?:(?:[a-z]+:)?//)?", n = "(?:\\S+(?::\\S*)?@)?", r = new RegExp(
    "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}",
    "g"
  ).source, u = `(?:${t}|www\\.)${n}(?:localhost|${r}|(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))\\.?)(?::\\d{2,5})?(?:[/?#][^\\s"]*)?`;
  return e.exact ? new RegExp(`(?:^${u}$)`, "i") : new RegExp(u, "ig");
}
var Vt = "[^\\.\\s@:](?:[^\\s@:]*[^\\s@:\\.])?@[^\\.\\s@]+(?:\\.[^\\.\\s@]+)*";
function so({ exact: e } = {}) {
  return e ? new RegExp(`^${Vt}$`) : new RegExp(Vt, "g");
}
function os(e, t, n) {
  return Ur(e, t, () => H(this, null, function* () {
    const { x: i, y: o } = yield Vr(e, t, {
      placement: "top",
      middleware: [Wr(6), Br(), jr({ padding: 5 })]
    });
    n == null || n(i, o);
  }));
}
function ss(e, t) {
  return !e.contains(t.target);
}
var as = () => ({
  email: so(),
  url: oo({})
});
function cs(e, t) {
  const n = Object.entries(t).map(
    ([o, s], a) => Array.from(e.matchAll(s)).map(({ index: c, 0: u }) => ({
      type: o,
      weight: a,
      content: u,
      index: c ?? 0
    }))
  ).flat().sort((o, s) => {
    const a = o.index - s.index;
    return a !== 0 ? a : o.weight - s.weight;
  }).filter(({ index: o }, s, a) => {
    if (s === 0) return !0;
    const c = a[s - 1];
    return c.index + c.content.length <= o;
  }), r = [];
  let i = 0;
  for (const { type: o, content: s, index: a } of n)
    a > i && r.push(e.substring(i, a)), r.push({ type: o, content: s }), i = a + s.length;
  return e.length > i && r.push(e.substring(i)), r;
}
var ao = [
  y.ConnectionStateChanged,
  y.RoomMetadataChanged,
  y.ActiveSpeakersChanged,
  y.ConnectionQualityChanged,
  y.ParticipantConnected,
  y.ParticipantDisconnected,
  y.ParticipantPermissionsChanged,
  y.ParticipantMetadataChanged,
  y.ParticipantNameChanged,
  y.ParticipantAttributesChanged,
  y.TrackMuted,
  y.TrackUnmuted,
  y.TrackPublished,
  y.TrackUnpublished,
  y.TrackStreamStateChanged,
  y.TrackSubscriptionFailed,
  y.TrackSubscriptionPermissionChanged,
  y.TrackSubscriptionStatusChanged
], An = [
  ...ao,
  y.LocalTrackPublished,
  y.LocalTrackUnpublished
], co = [
  w.TrackPublished,
  w.TrackUnpublished,
  w.TrackMuted,
  w.TrackUnmuted,
  w.TrackStreamStateChanged,
  w.TrackSubscribed,
  w.TrackUnsubscribed,
  w.TrackSubscriptionPermissionChanged,
  w.TrackSubscriptionFailed,
  w.LocalTrackPublished,
  w.LocalTrackUnpublished
], uo = [
  w.ConnectionQualityChanged,
  w.IsSpeakingChanged,
  w.ParticipantMetadataChanged,
  w.ParticipantPermissionsChanged,
  w.TrackMuted,
  w.TrackUnmuted,
  w.TrackPublished,
  w.TrackUnpublished,
  w.TrackStreamStateChanged,
  w.TrackSubscriptionFailed,
  w.TrackSubscriptionPermissionChanged,
  w.TrackSubscriptionStatusChanged
], kn = [
  ...uo,
  w.LocalTrackPublished,
  w.LocalTrackUnpublished
], L = Kr.getLogger("lk-components-js");
L.setDefaultLevel("WARN");
function us(e, t = {}) {
  var n;
  L.setLevel(e), qn((n = t.liveKitClientLogLevel) != null ? n : e);
}
function ls(e, t = {}) {
  var n;
  const r = L.methodFactory;
  L.methodFactory = (i, o, s) => {
    const a = r(i, o, s), c = St[i], u = c >= o && c < St.silent;
    return (l, f) => {
      f ? a(l, f) : a(l), u && e(c, l, f);
    };
  }, L.setLevel(L.getLevel()), Kn((n = t.liveKitClientLogExtension) != null ? n : e);
}
var fs = [
  {
    columns: 1,
    rows: 1
  },
  {
    columns: 1,
    rows: 2,
    orientation: "portrait"
  },
  {
    columns: 2,
    rows: 1,
    orientation: "landscape"
  },
  {
    columns: 2,
    rows: 2,
    minWidth: 560
  },
  {
    columns: 3,
    rows: 3,
    minWidth: 700
  },
  {
    columns: 4,
    rows: 4,
    minWidth: 960
  },
  {
    columns: 5,
    rows: 5,
    minWidth: 1100
  }
];
function lo(e, t, n, r) {
  if (e.length < 1)
    throw new Error("At least one grid layout definition must be provided.");
  const i = fo(e);
  if (n <= 0 || r <= 0)
    return i[0];
  let o = 0;
  const s = n / r > 1 ? "landscape" : "portrait";
  let a = i.find((c, u, l) => {
    o = u;
    const f = l.findIndex((v, d) => {
      const m = !v.orientation || v.orientation === s, p = d > u, g = v.maxTiles === c.maxTiles;
      return p && g && m;
    }) !== -1;
    return c.maxTiles >= t && !f;
  });
  if (a === void 0)
    if (a = i[i.length - 1], a)
      L.warn(
        `No layout found for: participantCount: ${t}, width/height: ${n}/${r} fallback to biggest available layout (${a}).`
      );
    else
      throw new Error("No layout or fallback layout found.");
  if ((n < a.minWidth || r < a.minHeight) && o > 0) {
    const c = i[o - 1];
    a = lo(
      i.slice(0, o),
      c.maxTiles,
      n,
      r
    );
  }
  return a;
}
function fo(e) {
  return [...e].map((t) => {
    var n, r;
    return {
      name: `${t.columns}x${t.rows}`,
      columns: t.columns,
      rows: t.rows,
      maxTiles: t.columns * t.rows,
      minWidth: (n = t.minWidth) != null ? n : 0,
      minHeight: (r = t.minHeight) != null ? r : 0,
      orientation: t.orientation
    };
  }).sort((t, n) => t.maxTiles !== n.maxTiles ? t.maxTiles - n.maxTiles : t.minWidth !== 0 || n.minWidth !== 0 ? t.minWidth - n.minWidth : t.minHeight !== 0 || n.minHeight !== 0 ? t.minHeight - n.minHeight : 0);
}
function ds() {
  return typeof navigator < "u" && navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
}
function ps(e, t) {
  var n;
  return ce(q({}, e), {
    receivedAtMediaTimestamp: (n = t.rtpTimestamp) != null ? n : 0,
    receivedAt: t.timestamp
  });
}
function hs(e, t, n) {
  return [...e, ...t].reduceRight((r, i) => (r.find((o) => o.id === i.id) || r.unshift(i), r), []).slice(0 - n);
}
var po = /* @__PURE__ */ ((e) => (e.AgentState = "lk.agent.state", e.PublishOnBehalf = "lk.publish_on_behalf", e.TranscriptionFinal = "lk.transcription_final", e.TranscriptionSegmentId = "lk.segment_id", e.TranscribedTrackId = "lk.transcribed_track_id", e))(po || {}), _n = [], Ln = {
  showChat: !1,
  unreadMessages: 0,
  showSettings: !1
};
function ho(e) {
  return typeof e == "object";
}
function vs(e) {
  return Array.isArray(e) && e.filter(ho).length > 0;
}
function In(e, t) {
  return t.audioLevel - e.audioLevel;
}
function Mn(e, t) {
  return e.isSpeaking === t.isSpeaking ? 0 : e.isSpeaking ? -1 : 1;
}
function Rn(e, t) {
  var n, r, i, o;
  return e.lastSpokeAt !== void 0 || t.lastSpokeAt !== void 0 ? ((r = (n = t.lastSpokeAt) == null ? void 0 : n.getTime()) != null ? r : 0) - ((o = (i = e.lastSpokeAt) == null ? void 0 : i.getTime()) != null ? o : 0) : 0;
}
function Be(e, t) {
  var n, r, i, o;
  return ((r = (n = e.joinedAt) == null ? void 0 : n.getTime()) != null ? r : 0) - ((o = (i = t.joinedAt) == null ? void 0 : i.getTime()) != null ? o : 0);
}
function vo(e, t) {
  return B(e) ? B(t) ? 0 : -1 : B(t) ? 1 : 0;
}
function mo(e, t) {
  const n = e.participant.isCameraEnabled, r = t.participant.isCameraEnabled;
  return n !== r ? n ? -1 : 1 : 0;
}
function ms(e) {
  const t = [], n = [], r = [], i = [];
  e.forEach((a) => {
    a.participant.isLocal && a.source === R.Source.Camera ? t.push(a) : a.source === R.Source.ScreenShare ? n.push(a) : a.source === R.Source.Camera ? r.push(a) : i.push(a);
  });
  const o = go(n), s = bo(r);
  return [...t, ...o, ...s, ...i];
}
function go(e) {
  const t = [], n = [];
  return e.forEach((i) => {
    i.participant.isLocal ? t.push(i) : n.push(i);
  }), t.sort((i, o) => Be(i.participant, o.participant)), n.sort((i, o) => Be(i.participant, o.participant)), [...n, ...t];
}
function bo(e) {
  const t = [], n = [];
  return e.forEach((r) => {
    r.participant.isLocal ? t.push(r) : n.push(r);
  }), n.sort((r, i) => r.participant.isSpeaking && i.participant.isSpeaking ? In(r.participant, i.participant) : r.participant.isSpeaking !== i.participant.isSpeaking ? Mn(r.participant, i.participant) : r.participant.lastSpokeAt !== i.participant.lastSpokeAt ? Rn(r.participant, i.participant) : B(r) !== B(i) ? vo(r, i) : r.participant.isCameraEnabled !== i.participant.isCameraEnabled ? mo(r, i) : Be(r.participant, i.participant)), [...t, ...n];
}
function gs(e) {
  const t = [...e];
  t.sort((r, i) => {
    if (r.isSpeaking && i.isSpeaking)
      return In(r, i);
    if (r.isSpeaking !== i.isSpeaking)
      return Mn(r, i);
    if (r.lastSpokeAt !== i.lastSpokeAt)
      return Rn(r, i);
    const o = r.videoTrackPublications.size > 0, s = i.videoTrackPublications.size > 0;
    return o !== s ? o ? -1 : 1 : Be(r, i);
  });
  const n = t.find((r) => r.isLocal);
  if (n) {
    const r = t.indexOf(n);
    r >= 0 && (t.splice(r, 1), t.length > 0 ? t.splice(0, 0, n) : t.push(n));
  }
  return t;
}
function yo(e, t) {
  return e.reduce(
    (n, r, i) => i % t === 0 ? [...n, [r]] : [...n.slice(0, -1), [...n.slice(-1)[0], r]],
    []
  );
}
function Ht(e, t) {
  const n = Math.max(e.length, t.length);
  return new Array(n).fill([]).map((r, i) => [e[i], t[i]]);
}
function Ve(e, t, n) {
  return e.filter((r) => !t.map((i) => n(i)).includes(n(r)));
}
function ft(e) {
  return e.map((t) => typeof t == "string" || typeof t == "number" ? `${t}` : N(t));
}
function wo(e, t) {
  return {
    dropped: Ve(e, t, N),
    added: Ve(t, e, N)
  };
}
function xo(e) {
  return e.added.length !== 0 || e.dropped.length !== 0;
}
function dt(e, t) {
  const n = t.findIndex(
    (r) => N(r) === N(e)
  );
  if (n === -1)
    throw new Error(
      `Element not part of the array: ${N(
        e
      )} not in ${ft(t)}`
    );
  return n;
}
function So(e, t, n) {
  const r = dt(e, n), i = dt(t, n);
  return n.splice(r, 1, t), n.splice(i, 1, e), n;
}
function To(e, t) {
  const n = dt(e, t);
  return t.splice(n, 1), t;
}
function Eo(e, t) {
  return [...t, e];
}
function rt(e, t) {
  return yo(e, t);
}
function bs(e, t, n) {
  let r = Co(e, t);
  if (r.length < t.length) {
    const s = Ve(t, r, N);
    r = [...r, ...s];
  }
  const i = rt(r, n), o = rt(t, n);
  if (Ht(i, o).forEach(([s, a], c) => {
    if (s && a) {
      const u = rt(r, n)[c], l = wo(u, a);
      xo(l) && (L.debug(
        `Detected visual changes on page: ${c}, current: ${ft(
          s
        )}, next: ${ft(a)}`,
        { changes: l }
      ), l.added.length === l.dropped.length && Ht(l.added, l.dropped).forEach(([f, v]) => {
        if (f && v)
          r = So(f, v, r);
        else
          throw new Error(
            `For a swap action we need a addition and a removal one is missing: ${f}, ${v}`
          );
      }), l.added.length === 0 && l.dropped.length > 0 && l.dropped.forEach((f) => {
        r = To(f, r);
      }), l.added.length > 0 && l.dropped.length === 0 && l.added.forEach((f) => {
        r = Eo(f, r);
      }));
    }
  }), r.length > t.length) {
    const s = Ve(r, t, N);
    r = r.filter(
      (a) => !s.map(N).includes(N(a))
    );
  }
  return r;
}
function Co(e, t) {
  return e.map((n) => {
    const r = t.find(
      (i) => (
        // If the IDs match or ..
        N(n) === N(i) || // ... if the current item is a placeholder and the new item is the track reference can replace it.
        typeof n != "number" && Oe(n) && B(i) && io(n, i)
      )
    );
    return r ?? n;
  });
}
function U(e) {
  return `${On}-${e}`;
}
function ys(e) {
  const t = zt(e), n = Dn(e.participant).pipe(
    A(() => zt(e)),
    D(t)
  );
  return { className: U(
    e.source === R.Source.Camera || e.source === R.Source.ScreenShare ? "participant-media-video" : "participant-media-audio"
  ), trackObserver: n };
}
function zt(e) {
  if (B(e))
    return e.publication;
  {
    const { source: t, name: n, participant: r } = e;
    if (t && n)
      return r.getTrackPublications().find((i) => i.source === t && i.trackName === n);
    if (n)
      return r.getTrackPublicationByName(n);
    if (t)
      return r.getTrackPublication(t);
    throw new Error("At least one of source and name needs to be defined");
  }
}
function pe(e, ...t) {
  return new k((r) => {
    const i = () => {
      r.next(e);
    };
    return t.forEach((s) => {
      e.on(s, i);
    }), () => {
      t.forEach((s) => {
        e.off(s, i);
      });
    };
  }).pipe(D(e));
}
function we(e, t) {
  return new k((r) => {
    const i = (...s) => {
      r.next(s);
    };
    return e.on(t, i), () => {
      e.off(t, i);
    };
  });
}
function ws(e) {
  return we(e, y.ConnectionStateChanged).pipe(
    A(([t]) => t),
    D(e.state)
  );
}
function xs(e) {
  return pe(
    e,
    y.RoomMetadataChanged,
    y.ConnectionStateChanged
  ).pipe(
    A((n) => ({ name: n.name, metadata: n.metadata }))
  );
}
function Ss(e) {
  return we(e, y.ActiveSpeakersChanged).pipe(
    A(([t]) => t)
  );
}
function Ts(e, t, n = !0) {
  const r = new k((o) => {
    Tt.getLocalDevices(e, n).then((s) => {
      o.next(s), o.complete();
    }).catch((s) => {
      t == null || t(s), o.next([]), o.complete();
    });
  }), i = new k((o) => {
    var s;
    const a = () => H(this, null, function* () {
      try {
        const c = yield Tt.getLocalDevices(e, n);
        o.next(c);
      } catch (c) {
        t == null || t(c);
      }
    });
    if (typeof window < "u") {
      if (!window.isSecureContext)
        throw new Error(
          "Accessing media devices is available only in secure contexts (HTTPS and localhost), in some or all supporting browsers. See: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices"
        );
      (s = navigator == null ? void 0 : navigator.mediaDevices) == null || s.addEventListener("devicechange", a);
    }
    return () => {
      var c;
      (c = navigator == null ? void 0 : navigator.mediaDevices) == null || c.removeEventListener("devicechange", a);
    };
  });
  return je(r, i);
}
function Po(e) {
  return we(e, y.DataReceived);
}
function Oo(e) {
  return pe(e, y.AudioPlaybackStatusChanged).pipe(
    A((n) => ({ canPlayAudio: n.canPlaybackAudio }))
  );
}
function Ao(e) {
  return pe(e, y.VideoPlaybackStatusChanged).pipe(
    A((n) => ({ canPlayVideo: n.canPlaybackVideo }))
  );
}
function ko(e, t) {
  return we(e, y.ActiveDeviceChanged).pipe(
    Xe(([n]) => n === t),
    A(([n, r]) => (L.debug("activeDeviceObservable | RoomEvent.ActiveDeviceChanged", { kind: n, deviceId: r }), r))
  );
}
function Es(e, t) {
  return we(e, y.ParticipantEncryptionStatusChanged).pipe(
    Xe(
      ([, n]) => (t == null ? void 0 : t.identity) === (n == null ? void 0 : n.identity) || !n && (t == null ? void 0 : t.identity) === e.localParticipant.identity
    ),
    A(([n]) => n),
    D(
      t != null && t.isLocal ? t.isE2EEEnabled : !!(t != null && t.isEncrypted)
    )
  );
}
function Cs(e) {
  return we(e, y.RecordingStatusChanged).pipe(
    A(([t]) => t),
    D(e.isRecording)
  );
}
function xe(e, ...t) {
  return new k((r) => {
    const i = () => {
      r.next(e);
    };
    return t.forEach((s) => {
      e.on(s, i);
    }), () => {
      t.forEach((s) => {
        e.off(s, i);
      });
    };
  }).pipe(D(e));
}
function Dn(e) {
  return xe(
    e,
    w.TrackMuted,
    w.TrackUnmuted,
    w.ParticipantPermissionsChanged,
    // ParticipantEvent.IsSpeakingChanged,
    w.TrackPublished,
    w.TrackUnpublished,
    w.LocalTrackPublished,
    w.LocalTrackUnpublished,
    w.MediaDevicesError,
    w.TrackSubscriptionStatusChanged
    // ParticipantEvent.ConnectionQualityChanged,
  ).pipe(
    A((n) => {
      const { isMicrophoneEnabled: r, isCameraEnabled: i, isScreenShareEnabled: o } = n, s = n.getTrackPublication(R.Source.Microphone), a = n.getTrackPublication(R.Source.Camera);
      return {
        isCameraEnabled: i,
        isMicrophoneEnabled: r,
        isScreenShareEnabled: o,
        cameraTrack: a,
        microphoneTrack: s,
        participant: n
      };
    })
  );
}
function _o(e) {
  return e ? xe(
    e,
    w.ParticipantMetadataChanged,
    w.ParticipantNameChanged
  ).pipe(
    A(({ name: n, identity: r, metadata: i }) => ({
      name: n,
      identity: r,
      metadata: i
    })),
    D({
      name: e.name,
      identity: e.identity,
      metadata: e.metadata
    })
  ) : void 0;
}
function Lo(e) {
  return Ze(
    e,
    w.ConnectionQualityChanged
  ).pipe(
    A(([n]) => n),
    D(e.connectionQuality)
  );
}
function Ze(e, t) {
  return new k((r) => {
    const i = (...s) => {
      r.next(s);
    };
    return e.on(t, i), () => {
      e.off(t, i);
    };
  });
}
function Io(e) {
  var t, n, r, i;
  return xe(
    e.participant,
    w.TrackMuted,
    w.TrackUnmuted,
    w.TrackSubscribed,
    w.TrackUnsubscribed,
    w.LocalTrackPublished,
    w.LocalTrackUnpublished
  ).pipe(
    A((o) => {
      var s, a;
      const c = (s = e.publication) != null ? s : o.getTrackPublication(e.source);
      return (a = c == null ? void 0 : c.isMuted) != null ? a : !0;
    }),
    D(
      (i = (r = (t = e.publication) == null ? void 0 : t.isMuted) != null ? r : (n = e.participant.getTrackPublication(e.source)) == null ? void 0 : n.isMuted) != null ? i : !0
    )
  );
}
function Ps(e) {
  return Ze(e, w.IsSpeakingChanged).pipe(
    A(([t]) => t)
  );
}
function Os(e, t = {}) {
  var n;
  let r;
  const i = new k((c) => (r = c, () => a.unsubscribe())).pipe(D(Array.from(e.remoteParticipants.values()))), o = (n = t.additionalRoomEvents) != null ? n : An, s = Array.from(
    /* @__PURE__ */ new Set([
      y.ParticipantConnected,
      y.ParticipantDisconnected,
      y.ConnectionStateChanged,
      ...o
    ])
  ), a = pe(e, ...s).subscribe(
    (c) => r == null ? void 0 : r.next(Array.from(c.remoteParticipants.values()))
  );
  return e.remoteParticipants.size > 0 && (r == null || r.next(Array.from(e.remoteParticipants.values()))), i;
}
function As(e, t, n = {}) {
  var r;
  const i = (r = n.additionalEvents) != null ? r : kn;
  return pe(
    e,
    y.ParticipantConnected,
    y.ParticipantDisconnected,
    y.ConnectionStateChanged
  ).pipe(
    Pn((s) => {
      const a = s.getParticipantByIdentity(t);
      return a ? xe(a, ...i) : new k((c) => c.next(void 0));
    }),
    D(e.getParticipantByIdentity(t))
  );
}
function ks(e) {
  return Ze(
    e,
    w.ParticipantPermissionsChanged
  ).pipe(
    A(() => e.permissions),
    D(e.permissions)
  );
}
function _s(e, { kind: t, identity: n }, r = {}) {
  var i;
  const o = (i = r.additionalEvents) != null ? i : kn, s = (c) => {
    let u = !0;
    return t && (u = u && c.kind === t), n && (u = u && c.identity === n), u;
  };
  return pe(
    e,
    y.ParticipantConnected,
    y.ParticipantDisconnected,
    y.ConnectionStateChanged
  ).pipe(
    Pn((c) => {
      const u = Array.from(c.remoteParticipants.values()).find(
        (l) => s(l)
      );
      return u ? xe(u, ...o) : new k((l) => l.next(void 0));
    }),
    D(Array.from(e.remoteParticipants.values()).find((c) => s(c)))
  );
}
function Ls(e) {
  return typeof e > "u" ? new k() : Ze(e, w.AttributesChanged).pipe(
    A(([t]) => ({
      changed: t,
      attributes: e.attributes
    })),
    D({ changed: e.attributes, attributes: e.attributes })
  );
}
function Is(e, t, n, r, i) {
  const { localParticipant: o } = t, s = (f, v) => {
    let d = !1;
    switch (f) {
      case R.Source.Camera:
        d = v.isCameraEnabled;
        break;
      case R.Source.Microphone:
        d = v.isMicrophoneEnabled;
        break;
      case R.Source.ScreenShare:
        d = v.isScreenShareEnabled;
        break;
    }
    return d;
  }, a = Dn(o).pipe(
    A((f) => s(e, f.participant)),
    D(s(e, o))
  ), c = new te(), u = (f, v) => H(this, null, function* () {
    try {
      switch (v ?? (v = n), c.next(!0), e) {
        case R.Source.Camera:
          return yield o.setCameraEnabled(
            f ?? !o.isCameraEnabled,
            v,
            r
          ), o.isCameraEnabled;
        case R.Source.Microphone:
          return yield o.setMicrophoneEnabled(
            f ?? !o.isMicrophoneEnabled,
            v,
            r
          ), o.isMicrophoneEnabled;
        case R.Source.ScreenShare:
          return yield o.setScreenShareEnabled(
            f ?? !o.isScreenShareEnabled,
            v,
            r
          ), o.isScreenShareEnabled;
        default:
          throw new TypeError("Tried to toggle unsupported source");
      }
    } catch (d) {
      if (i && d instanceof Error) {
        i == null || i(d);
        return;
      } else
        throw d;
    } finally {
      c.next(!1);
    }
  });
  return {
    className: U("button"),
    toggle: u,
    enabledObserver: a,
    pendingObserver: c.asObservable()
  };
}
function Ms() {
  let e = !1;
  const t = new te(), n = new te(), r = (o) => H(this, null, function* () {
    n.next(!0), e = o ?? !e, t.next(e), n.next(!1);
  });
  return {
    className: U("button"),
    toggle: r,
    enabledObserver: t.asObservable(),
    pendingObserver: n.asObservable()
  };
}
function Rs(e, t, n) {
  const r = new pn(void 0), i = ko(t, e), o = (a, ...c) => H(this, [a, ...c], function* (u, l = {}) {
    var f, v, d;
    if (t) {
      const m = Gn();
      if (e === "audiooutput" && ((m == null ? void 0 : m.name) === "Safari" || (m == null ? void 0 : m.os) === "iOS")) {
        L.warn("Switching audio output device is not supported on Safari and iOS.");
        return;
      }
      L.debug(`Switching active device of kind "${e}" with id ${u}.`), yield t.switchActiveDevice(e, u, l.exact);
      const p = (f = t.getActiveDevice(e)) != null ? f : u;
      p !== u && u !== "default" && L.info(
        `We tried to select the device with id (${u}), but the browser decided to select the device with id (${p}) instead.`
      );
      let g;
      e === "audioinput" ? g = (v = t.localParticipant.getTrackPublication(R.Source.Microphone)) == null ? void 0 : v.track : e === "videoinput" && (g = (d = t.localParticipant.getTrackPublication(R.Source.Camera)) == null ? void 0 : d.track);
      const h = u === "default" && !g || u === "default" && (g == null ? void 0 : g.mediaStreamTrack.label.startsWith("Default"));
      r.next(h ? u : p);
    }
  });
  return {
    className: U("media-device-select"),
    activeDeviceObservable: i,
    setActiveMediaDevice: o
  };
}
function Ds(e) {
  const t = (r) => {
    e.disconnect(r);
  };
  return { className: U("disconnect-button"), disconnect: t };
}
function $s(e) {
  const t = U("connection-quality"), n = Lo(e);
  return { className: t, connectionQualityObserver: n };
}
function Ns(e) {
  let t = "track-muted-indicator-camera";
  switch (e.source) {
    case R.Source.Camera:
      t = "track-muted-indicator-camera";
      break;
    case R.Source.Microphone:
      t = "track-muted-indicator-microphone";
      break;
  }
  const n = U(t), r = Io(e);
  return { className: n, mediaMutedObserver: r };
}
function Fs(e) {
  return { className: "lk-participant-name", infoObserver: _o(e) };
}
function Us() {
  return {
    className: U("participant-tile")
  };
}
var Mo = {
  CHAT: "lk.chat",
  TRANSCRIPTION: "lk.transcription"
}, Ro = {
  CHAT: "lk-chat-topic"
};
function $n(e, t) {
  return H(this, arguments, function* (n, r, i = {}) {
    const { reliable: o, destinationIdentities: s, topic: a } = i;
    yield n.publishData(r, {
      destinationIdentities: s,
      topic: a,
      reliable: o
    });
  });
}
function Do(e, t, n) {
  const r = Array.isArray(t) ? t : [t], i = Po(e).pipe(
    Xe(
      ([, , , c]) => t === void 0 || c !== void 0 && r.includes(c)
    ),
    A(([c, u, , l]) => {
      const f = {
        payload: c,
        topic: l,
        from: u
      };
      return n == null || n(f), f;
    })
  );
  let o;
  const s = new k((c) => {
    o = c;
  });
  return { messageObservable: i, isSendingObservable: s, send: (c, ...u) => H(this, [c, ...u], function* (l, f = {}) {
    o.next(!0);
    try {
      yield $n(e.localParticipant, l, q({ topic: r[0] }, f));
    } finally {
      o.next(!1);
    }
  }) };
}
var Ie = /* @__PURE__ */ new WeakMap();
function $o(e) {
  return e.ignoreLegacy == !0;
}
var No = (e) => JSON.parse(new TextDecoder().decode(e)), Fo = (e) => new TextEncoder().encode(JSON.stringify(e));
function Ws(e, t) {
  var n, r, i, o, s, a;
  const c = () => {
    var b, S, C;
    return ((b = e.serverInfo) == null ? void 0 : b.edition) === 1 || !!((S = e.serverInfo) != null && S.version) && Qn((C = e.serverInfo) == null ? void 0 : C.version, "1.8.2") > 0;
  }, u = new te(), l = (n = t == null ? void 0 : t.channelTopic) != null ? n : Mo.CHAT, f = (r = t == null ? void 0 : t.channelTopic) != null ? r : Ro.CHAT;
  let v = !1;
  Ie.has(e) || (v = !0);
  const d = (i = Ie.get(e)) != null ? i : /* @__PURE__ */ new Map(), m = (o = d.get(l)) != null ? o : new te();
  d.set(l, m), Ie.set(e, d);
  const p = (s = t == null ? void 0 : t.messageDecoder) != null ? s : No;
  if (v) {
    e.registerTextStreamHandler(l, (S, C) => H(this, null, function* () {
      const { id: $, timestamp: M } = S.info;
      Je(S).pipe(
        lt((T, _) => T + _),
        A((T) => ({
          id: $,
          timestamp: M,
          message: T,
          from: e.getParticipantByIdentity(C.identity),
          type: "chatMessage"
          // editTimestamp: type === 'update' ? timestamp : undefined,
        }))
      ).subscribe({
        next: (T) => m.next(T)
      });
    }));
    const { messageObservable: b } = Do(e, [f]);
    b.pipe(
      A((S) => {
        const C = p(S.payload);
        return $o(C) ? void 0 : ce(q({}, C), {
          type: "chatMessage",
          from: S.from
        });
      }),
      Xe((S) => !!S),
      Wt(u)
    ).subscribe(m);
  }
  const g = m.pipe(
    lt((b, S) => {
      if ("id" in S && b.find((C) => {
        var $, M;
        return (($ = C.from) == null ? void 0 : $.identity) === ((M = S.from) == null ? void 0 : M.identity) && C.id === S.id;
      })) {
        const C = b.findIndex(($) => $.id === S.id);
        if (C > -1) {
          const $ = b[C];
          b[C] = ce(q({}, S), {
            timestamp: $.timestamp,
            editTimestamp: S.timestamp
          });
        }
        return [...b];
      }
      return [...b, S];
    }, []),
    Wt(u)
  ), h = new pn(!1), x = (a = t == null ? void 0 : t.messageEncoder) != null ? a : Fo, E = (b, S) => H(this, null, function* () {
    var C;
    S || (S = {}), (C = S.topic) != null || (S.topic = l), h.next(!0);
    try {
      const M = {
        id: (yield e.localParticipant.sendText(b, S)).id,
        timestamp: Date.now(),
        message: b
      }, V = ce(q({}, M), {
        attachedFiles: S.attachments
      }), T = ce(q({}, V), {
        type: "chatMessage",
        from: e.localParticipant,
        attributes: S.attributes
      });
      m.next(T);
      const _ = x(ce(q({}, M), {
        ignoreLegacy: c()
      }));
      try {
        yield $n(e.localParticipant, _, {
          reliable: !0,
          topic: f
        });
      } catch (ee) {
        L.info("could not send message in legacy chat format", ee);
      }
      return T;
    } finally {
      h.next(!1);
    }
  });
  function O() {
    u.next(), u.complete(), m.complete(), Ie.delete(e), e.unregisterTextStreamHandler(l);
  }
  return e.once(y.Disconnected, O), {
    messageObservable: g,
    isSendingObservable: h,
    send: E
  };
}
function js() {
  const e = (n) => H(this, null, function* () {
    L.info("Start Audio for room: ", n), yield n.startAudio();
  });
  return { className: U("start-audio-button"), roomAudioPlaybackAllowedObservable: Oo, handleStartAudioPlayback: e };
}
function Bs() {
  const e = (n) => H(this, null, function* () {
    L.info("Start Video for room: ", n), yield n.startVideo();
  });
  return { className: U("start-audio-button"), roomVideoPlaybackAllowedObservable: Ao, handleStartVideoPlayback: e };
}
function Vs() {
  return { className: [U("button"), U("chat-toggle")].join(" ") };
}
function Hs() {
  return { className: [U("button"), U("focus-toggle-button")].join(" ") };
}
function zs() {
  return { className: "lk-clear-pin-button lk-button" };
}
function Ys() {
  return { className: "lk-room-container" };
}
function Yt(e, t, n = !0) {
  const i = [e.localParticipant, ...Array.from(e.remoteParticipants.values())], o = [];
  return i.forEach((s) => {
    t.forEach((a) => {
      const c = Array.from(
        s.trackPublications.values()
      ).filter(
        (u) => u.source === a && // either return all or only the ones that are subscribed
        (!n || u.track)
      ).map((u) => ({
        participant: s,
        publication: u,
        source: u.source
      }));
      o.push(...c);
    });
  }), { trackReferences: o, participants: i };
}
function qt(e, t, n = !1) {
  const { sources: r, kind: i, name: o } = t;
  return Array.from(e.trackPublications.values()).filter(
    (a) => (!r || r.includes(a.source)) && (!i || a.kind === i) && (!o || a.trackName === o) && // either return all or only the ones that are subscribed
    (!n || a.track)
  ).map((a) => ({
    participant: e,
    publication: a,
    source: a.source
  }));
}
function qs(e, t, n) {
  var r, i;
  const o = (r = n.additionalRoomEvents) != null ? r : An, s = (i = n.onlySubscribed) != null ? i : !0, a = Array.from(
    (/* @__PURE__ */ new Set([
      y.ParticipantConnected,
      y.ParticipantDisconnected,
      y.ConnectionStateChanged,
      y.LocalTrackPublished,
      y.LocalTrackUnpublished,
      y.TrackPublished,
      y.TrackUnpublished,
      y.TrackSubscriptionStatusChanged,
      ...o
    ])).values()
  );
  return pe(e, ...a).pipe(
    A((u) => {
      const l = Yt(u, t, s);
      return L.debug(`TrackReference[] was updated. (length ${l.trackReferences.length})`, l), l;
    }),
    D(Yt(e, t, s))
  );
}
function Ks(e, t) {
  return xe(e, ...co).pipe(
    A((r) => {
      const i = qt(r, t);
      return L.debug(`TrackReference[] was updated. (length ${i.length})`, i), i;
    }),
    D(qt(e, t))
  );
}
function Nn(e, t) {
  return new k((r) => {
    const i = (...s) => {
      r.next(s);
    };
    return e.on(t, i), () => {
      e.off(t, i);
    };
  });
}
function Gs(e) {
  return Nn(e, Gt.TranscriptionReceived);
}
function Qs(e) {
  return Nn(e, Gt.TimeSyncUpdate).pipe(
    A(([t]) => t)
  );
}
function Js(e, t = 1e3) {
  if (e === null) return Ft(!1);
  const n = ut(e, "mousemove", { passive: !0 }).pipe(A(() => !0)), r = n.pipe(
    Li({
      each: t,
      with: () => je(Ft(!1), r.pipe(Gi(n)))
    }),
    Yi()
  );
  return r;
}
function Uo(e, t) {
  if (typeof localStorage > "u") {
    L.error("Local storage is not available.");
    return;
  }
  try {
    if (t) {
      const n = Object.fromEntries(
        Object.entries(t).filter(([, r]) => r !== "")
      );
      localStorage.setItem(e, JSON.stringify(n));
    }
  } catch (n) {
    L.error(`Error setting item to local storage: ${n}`);
  }
}
function Wo(e) {
  if (typeof localStorage > "u") {
    L.error("Local storage is not available.");
    return;
  }
  try {
    const t = localStorage.getItem(e);
    if (!t) {
      L.warn(`Item with key ${e} does not exist in local storage.`);
      return;
    }
    return JSON.parse(t);
  } catch (t) {
    L.error(`Error getting item from local storage: ${t}`);
    return;
  }
}
function jo(e) {
  return {
    load: () => Wo(e),
    save: (t) => Uo(e, t)
  };
}
var Bo = `${On}-user-choices`, Ee = {
  videoEnabled: !0,
  audioEnabled: !0,
  videoDeviceId: "default",
  audioDeviceId: "default",
  username: ""
}, { load: Vo, save: Ho } = jo(Bo);
function Xs(e, t = !1) {
  t !== !0 && Ho(e);
}
function Zs(e, t = !1) {
  var n, r, i, o, s;
  const a = {
    videoEnabled: (n = e == null ? void 0 : e.videoEnabled) != null ? n : Ee.videoEnabled,
    audioEnabled: (r = e == null ? void 0 : e.audioEnabled) != null ? r : Ee.audioEnabled,
    videoDeviceId: (i = e == null ? void 0 : e.videoDeviceId) != null ? i : Ee.videoDeviceId,
    audioDeviceId: (o = e == null ? void 0 : e.audioDeviceId) != null ? o : Ee.audioDeviceId,
    username: (s = e == null ? void 0 : e.username) != null ? s : Ee.username
  };
  if (t)
    return a;
  {
    const c = Vo();
    return q(q({}, a), c ?? {});
  }
}
var it = null, ot = null, zo = 0;
function Kt() {
  return it || (it = /* @__PURE__ */ new Map()), it;
}
function Yo() {
  return ot || (ot = /* @__PURE__ */ new WeakMap()), ot;
}
function qo(e, t) {
  const n = Yo();
  let r = n.get(e);
  return r || (r = `room_${zo++}`, n.set(e, r)), `${r}:${t}`;
}
function ea(e, t) {
  const n = qo(e, t), r = Kt(), i = r.get(n);
  if (i)
    return i;
  const o = new te();
  let s = [];
  const a = "lk.segment_id", c = o.pipe(
    Qi({
      subscribe: () => {
        e.registerTextStreamHandler(t, (u, l) => H(this, null, function* () {
          var f;
          const v = Je(u).pipe(
            lt((m, p) => m + p, "")
          ), d = !!((f = u.info.attributes) != null && f[a]);
          v.subscribe((m) => {
            const p = s.findIndex(
              (g) => {
                var h, x;
                return g.streamInfo.id === u.info.id || d && ((h = g.streamInfo.attributes) == null ? void 0 : h[a]) === ((x = u.info.attributes) == null ? void 0 : x[a]);
              }
            );
            p !== -1 ? (s[p] = ce(q({}, s[p]), {
              text: m
            }), o.next([...s])) : (s.push({
              text: m,
              participantInfo: l,
              streamInfo: u.info
            }), o.next([...s]));
          });
        }));
      },
      finalize: () => {
        e.unregisterTextStreamHandler(t);
      }
    }),
    Ki()
  );
  return r.set(n, c), e.on(y.Disconnected, () => {
    Kt().delete(n), s = [], o.next([]);
  }), c;
}
function Fn(e, t) {
  if (t.msg === "show_chat")
    return { ...e, showChat: !0, unreadMessages: 0 };
  if (t.msg === "hide_chat")
    return { ...e, showChat: !1 };
  if (t.msg === "toggle_chat") {
    const n = { ...e, showChat: !e.showChat };
    return n.showChat === !0 && (n.unreadMessages = 0), n;
  } else return t.msg === "unread_msg" ? { ...e, unreadMessages: t.count } : t.msg === "toggle_settings" ? { ...e, showSettings: !e.showSettings } : { ...e };
}
function Un(e, t) {
  return t.msg === "set_pin" ? [t.trackReference] : t.msg === "clear_pin" ? [] : { ...e };
}
const Wn = I.createContext(void 0);
function ta() {
  const e = I.useContext(Wn);
  if (!e)
    throw Error("Tried to access LayoutContext context outside a LayoutContextProvider provider.");
  return e;
}
function na(e) {
  const t = Ko();
  if (e ?? (e = t), !e)
    throw Error("Tried to access LayoutContext context outside a LayoutContextProvider provider.");
  return e;
}
function ra() {
  const [e, t] = I.useReducer(Un, _n), [n, r] = I.useReducer(Fn, Ln);
  return {
    pin: { dispatch: t, state: e },
    widget: { dispatch: r, state: n }
  };
}
function ia(e) {
  const [t, n] = I.useReducer(Un, _n), [r, i] = I.useReducer(Fn, Ln);
  return e ?? {
    pin: { dispatch: n, state: t },
    widget: { dispatch: i, state: r }
  };
}
function Ko() {
  return I.useContext(Wn);
}
const jn = I.createContext(
  void 0
);
function oa() {
  const e = I.useContext(jn);
  if (!e)
    throw Error("tried to access track context outside of track context provider");
  return e;
}
function Bn() {
  return I.useContext(jn);
}
function sa(e) {
  const t = Bn(), n = e ?? t;
  if (!n)
    throw new Error(
      "No TrackRef, make sure you are inside a TrackRefContext or pass the TrackRef explicitly"
    );
  return n;
}
const Vn = I.createContext(void 0);
function aa() {
  const e = I.useContext(Vn);
  if (!e)
    throw Error("tried to access participant context outside of participant context provider");
  return e;
}
function Go() {
  return I.useContext(Vn);
}
function ca(e) {
  const t = Go(), n = Bn(), r = e ?? t ?? (n == null ? void 0 : n.participant);
  if (!r)
    throw new Error(
      "No participant provided, make sure you are inside a participant context or pass the participant explicitly"
    );
  return r;
}
const Hn = I.createContext(void 0);
function ua() {
  const e = I.useContext(Hn);
  if (!e)
    throw Error("tried to access room context outside of livekit room component");
  return e;
}
function Qo() {
  return I.useContext(Hn);
}
function la(e) {
  const t = Qo(), n = e ?? t;
  if (!n)
    throw new Error(
      "No room provided, make sure you are inside a Room context or pass the room explicitly"
    );
  return n;
}
const zn = I.createContext(void 0);
function fa() {
  const e = I.useContext(zn);
  if (!e)
    throw Error("tried to access session context outside of SessionProvider component");
  return e;
}
function Jo() {
  return I.useContext(zn);
}
function da(e) {
  const t = Jo(), n = e ?? t;
  if (!n)
    throw new Error(
      "No session provided, make sure you are inside a Session context or pass the session explicitly"
    );
  return n;
}
const Xo = I.createContext(void 0);
function pa(e) {
  const t = I.useContext(Xo);
  if (e === !0) {
    if (t)
      return t;
    throw Error("tried to access feature context, but none is present");
  }
  return t;
}
export {
  B as $,
  bs as A,
  Go as B,
  _o as C,
  Us as D,
  Os as E,
  na as F,
  fs as G,
  As as H,
  _s as I,
  xs as J,
  Ss as K,
  gs as L,
  js as M,
  Bs as N,
  Vs as O,
  Ns as P,
  Is as Q,
  Ms as R,
  ho as S,
  qs as T,
  vs as U,
  zt as V,
  ys as W,
  Ws as X,
  Zs as Y,
  Xs as Z,
  Es as _,
  ta as a,
  Ks as a0,
  Qs as a1,
  Gs as a2,
  hs as a3,
  ps as a4,
  Ls as a5,
  po as a6,
  Cs as a7,
  ea as a8,
  Mo as a9,
  aa as aA,
  fa as aB,
  oa as aC,
  Jo as aa,
  da as ab,
  Bn as ac,
  Wn as ad,
  Fs as ae,
  es as af,
  Hr as ag,
  Vn as ah,
  jn as ai,
  pa as aj,
  Js as ak,
  rs as al,
  ia as am,
  Hn as an,
  Xo as ao,
  cs as ap,
  as as aq,
  zn as ar,
  os as as,
  ss as at,
  ds as au,
  ra as av,
  ts as aw,
  is as ax,
  us as ay,
  ls as az,
  ca as b,
  $s as c,
  ws as d,
  ua as e,
  Do as f,
  Ds as g,
  sa as h,
  Ko as i,
  Hs as j,
  ns as k,
  lo as l,
  Io as m,
  N as n,
  Ps as o,
  L as p,
  Ys as q,
  Oo as r,
  zs as s,
  Dn as t,
  la as u,
  ks as v,
  Qo as w,
  Ts as x,
  Rs as y,
  ms as z
};
//# sourceMappingURL=contexts-BABOeQ4Z.mjs.map
