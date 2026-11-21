import * as s from "react";
import { useRef as ue, useMemo as qe, useCallback as ne, useEffect as Be } from "react";
import { u as H, r as We, a as Ne, s as ze, b as Y, c as Ge, d as Je, e as ce, f as $e, g as Ke, h as fe, i as Qe, j as Ye, k as Xe, G as Ze, l as et, m as tt, n as me, o as nt, p as _, q as rt, t as st, v as Ie, w as pe, x as _e, y as ot, z as at, A as it, B as he, C as ct, D as ut, E as lt, F as dt, H as ft, I as mt, J as pt, K as ht, L as Te, M as bt, N as gt, O as vt, P as St, Q as yt, R as Ct, S as Et, T as Mt, U as Fe, V as Tt, W as kt, X as wt, Y as Pt, Z as Lt, _ as At, $ as Rt, a0 as Dt, a1 as Ot, a2 as Nt, a3 as It, a4 as _t, a5 as de, a6 as K, a7 as Ft, a8 as xt, a9 as Ut, aa as Vt, ab as Ht } from "./contexts-BABOeQ4Z.mjs";
import { ConnectionState as N, LocalTrackPublication as jt, facingModeFromLocalTrack as qt, Room as be, RoomEvent as I, MediaDeviceFailure as Bt, Track as P, createAudioAnalyser as ge, ParticipantKind as ae, Mutex as Wt, ParticipantEvent as ee, decodeTokenPayload as zt, TokenSourceConfigurable as Gt } from "livekit-client";
const Jt = (e) => {
  const t = s.useRef(e);
  return s.useEffect(() => {
    t.current = e;
  }), t;
};
function $t(e, t) {
  const n = Qt(), r = Jt(t);
  return s.useLayoutEffect(() => {
    let o = !1;
    const i = e.current;
    if (!i) return;
    function a(c, u) {
      o || r.current(c, u);
    }
    return n == null || n.subscribe(i, a), () => {
      o = !0, n == null || n.unsubscribe(i, a);
    };
  }, [e.current, n, r]), n == null ? void 0 : n.observer;
}
function Kt() {
  let e = !1, t = [];
  const n = /* @__PURE__ */ new Map();
  if (typeof window > "u")
    return;
  const r = new ResizeObserver((o, i) => {
    t = t.concat(o), e || window.requestAnimationFrame(() => {
      const a = /* @__PURE__ */ new Set();
      for (let c = 0; c < t.length; c++) {
        if (a.has(t[c].target)) continue;
        a.add(t[c].target);
        const u = n.get(t[c].target);
        u == null || u.forEach((m) => m(t[c], i));
      }
      t = [], e = !1;
    }), e = !0;
  });
  return {
    observer: r,
    subscribe(o, i) {
      r.observe(o);
      const a = n.get(o) ?? [];
      a.push(i), n.set(o, a);
    },
    unsubscribe(o, i) {
      const a = n.get(o) ?? [];
      if (a.length === 1) {
        r.unobserve(o), n.delete(o);
        return;
      }
      const c = a.indexOf(i);
      c !== -1 && a.splice(c, 1), n.set(o, a);
    }
  };
}
let le;
const Qt = () => le || (le = Kt()), Yt = (e) => {
  const [t, n] = s.useState({ width: 0, height: 0 });
  s.useLayoutEffect(() => {
    if (e.current) {
      const { width: o, height: i } = e.current.getBoundingClientRect();
      n({ width: o, height: i });
    }
  }, [e.current]);
  const r = s.useCallback(
    (o) => n(o.contentRect),
    []
  );
  return $t(e, r), t;
};
function D(e, t, n = !0) {
  const [r, o] = s.useState(t);
  return s.useEffect(() => {
    if (n && o(t), typeof window > "u" || !e) return;
    const i = e.subscribe(o);
    return () => i.unsubscribe();
  }, [e, n]), r;
}
function Vn(e) {
  const t = (i) => typeof window < "u" ? window.matchMedia(i).matches : !1, [n, r] = s.useState(t(e));
  function o() {
    r(t(e));
  }
  return s.useEffect(() => {
    const i = window.matchMedia(e);
    return o(), i.addListener ? i.addListener(o) : i.addEventListener("change", o), () => {
      i.removeListener ? i.removeListener(o) : i.removeEventListener("change", o);
    };
  }, [e]), n;
}
function Hn(e) {
  const t = H(e), n = s.useCallback(async () => {
    await t.startAudio();
  }, [t]), r = s.useMemo(
    () => We(t),
    [t]
  ), { canPlayAudio: o } = D(r, {
    canPlayAudio: t.canPlaybackAudio
  });
  return { canPlayAudio: o, startAudio: n };
}
function xe(e) {
  var t, n, r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (n = xe(e[t])) && (r && (r += " "), r += n);
  } else for (n in e) e[n] && (r && (r += " "), r += n);
  return r;
}
function Ue() {
  for (var e, t, n = 0, r = "", o = arguments.length; n < o; n++) (e = arguments[n]) && (t = xe(e)) && (r && (r += " "), r += t);
  return r;
}
function Xt(...e) {
  return (...t) => {
    for (const n of e)
      if (typeof n == "function")
        try {
          n(...t);
        } catch (r) {
          console.error(r);
        }
  };
}
function B(...e) {
  const t = { ...e[0] };
  for (let n = 1; n < e.length; n++) {
    const r = e[n];
    for (const o in r) {
      const i = t[o], a = r[o];
      typeof i == "function" && typeof a == "function" && // This is a lot faster than a regex.
      o[0] === "o" && o[1] === "n" && o.charCodeAt(2) >= /* 'A' */
      65 && o.charCodeAt(2) <= /* 'Z' */
      90 ? t[o] = Xt(i, a) : (o === "className" || o === "UNSAFE_className") && typeof i == "string" && typeof a == "string" ? t[o] = Ue(i, a) : t[o] = a !== void 0 ? a : i;
    }
  }
  return t;
}
function jn(e) {
  const { state: t, dispatch: n } = Ne().pin;
  return { buttonProps: s.useMemo(() => {
    const { className: o } = ze();
    return B(e, {
      className: o,
      disabled: !(t != null && t.length),
      onClick: () => {
        n && n({ msg: "clear_pin" });
      }
    });
  }, [e, n, t]) };
}
function qn(e = {}) {
  const t = Y(e.participant), { className: n, connectionQualityObserver: r } = s.useMemo(
    () => Ge(t),
    [t]
  ), o = D(r, t.connectionQuality);
  return { className: n, quality: o };
}
function re(e) {
  const t = H(e), n = s.useMemo(() => Je(t), [t]);
  return D(n, t.state);
}
function Bn(e, t) {
  const n = typeof e == "function" ? e : t, r = typeof e == "string" ? e : void 0, o = ce(), { send: i, messageObservable: a, isSendingObservable: c } = s.useMemo(
    () => $e(o, r, n),
    [o, r, n]
  ), u = D(a, void 0), m = D(c, !1);
  return {
    message: u,
    send: i,
    isSending: m
  };
}
function Wn(e) {
  const t = ce(), n = re(t);
  return { buttonProps: s.useMemo(() => {
    const { className: o, disconnect: i } = Ke(t);
    return B(e, {
      className: o,
      onClick: () => i(e.stopTracks ?? !0),
      disabled: n === N.Disconnected
    });
  }, [t, e, n]) };
}
function Zt(e) {
  if (e.publication instanceof jt) {
    const t = e.publication.track;
    if (t) {
      const { facingMode: n } = qt(t);
      return n;
    }
  }
  return "undefined";
}
function zn({ trackRef: e, props: t }) {
  const n = fe(e), r = Qe(), { className: o } = s.useMemo(() => Ye(), []), i = s.useMemo(() => Xe(n, r == null ? void 0 : r.pin.state), [n, r == null ? void 0 : r.pin.state]);
  return { mergedProps: s.useMemo(
    () => B(t, {
      className: o,
      onClick: (c) => {
        var u, m, p, d, l;
        (u = t.onClick) == null || u.call(t, c), i ? (p = r == null ? void 0 : (m = r.pin).dispatch) == null || p.call(m, {
          msg: "clear_pin"
        }) : (l = r == null ? void 0 : (d = r.pin).dispatch) == null || l.call(d, {
          msg: "set_pin",
          trackReference: n
        });
      }
    }),
    [t, o, n, i, r == null ? void 0 : r.pin]
  ), inFocus: i };
}
function Gn(e, t, n = {}) {
  const r = n.gridLayouts ?? Ze, { width: o, height: i } = Yt(e), a = et(r, t, o, i);
  return s.useEffect(() => {
    e.current && a && (e.current.style.setProperty("--lk-col-count", a == null ? void 0 : a.columns.toString()), e.current.style.setProperty("--lk-row-count", a == null ? void 0 : a.rows.toString()));
  }, [e, a]), {
    layout: a,
    containerWidth: o,
    containerHeight: i
  };
}
function ke(e, t = {}) {
  var c, u;
  const n = typeof e == "string" ? t.participant : e.participant, r = Y(n), o = typeof e == "string" ? { participant: r, source: e } : e, [i, a] = s.useState(
    !!((c = o.publication) != null && c.isMuted || (u = r.getTrackPublication(o.source)) != null && u.isMuted)
  );
  return s.useEffect(() => {
    const m = tt(o).subscribe(a);
    return () => m.unsubscribe();
  }, [me(o)]), i;
}
function en(e) {
  const t = Y(e), n = s.useMemo(() => nt(t), [t]);
  return D(n, t.isSpeaking);
}
function tn(e) {
  return e !== void 0;
}
function Jn(...e) {
  return B(...e.filter(tn));
}
function $n(e, t, n) {
  return s.Children.map(e, (r) => s.isValidElement(r) && s.Children.only(e) ? (r.props.className && (t ?? (t = {}), t.className = Ue(r.props.className, t.className), t.style = { ...r.props.style, ...t.style }), s.cloneElement(r, { ...t, key: n })) : r);
}
function Kn(e) {
  var t, n;
  if (typeof window < "u" && typeof process < "u" && // eslint-disable-next-line turbo/no-undeclared-env-vars
  (((t = process == null ? void 0 : process.env) == null ? void 0 : t.NODE_ENV) === "dev" || // eslint-disable-next-line turbo/no-undeclared-env-vars
  ((n = process == null ? void 0 : process.env) == null ? void 0 : n.NODE_ENV) === "development")) {
    const r = document.querySelector(".lk-room-container");
    r && !getComputedStyle(r).getPropertyValue("--lk-has-imported-styles") && _.warn(
      "It looks like you're not using the `@livekit/components-styles package`. To render the UI with the default styling, please import it in your layout or page."
    );
  }
}
function nn(e, t) {
  return e === "processor" && t && typeof t == "object" && "name" in t ? t.name : e === "e2ee" && t ? "e2ee-enabled" : t;
}
const rn = {
  connect: !0,
  audio: !1,
  video: !1
};
function Qn(e) {
  const {
    token: t,
    serverUrl: n,
    options: r,
    room: o,
    connectOptions: i,
    connect: a,
    audio: c,
    video: u,
    screen: m,
    onConnected: p,
    onDisconnected: d,
    onError: l,
    onMediaDeviceFailure: g,
    onEncryptionError: E,
    simulateParticipants: w,
    ...L
  } = { ...rn, ...e };
  r && o && _.warn(
    "when using a manually created room, the options object will be ignored. set the desired options directly when creating the room instead."
  );
  const [M, O] = s.useState(), A = s.useRef(a);
  s.useEffect(() => {
    O(o ?? new be(r));
  }, [o, JSON.stringify(r, nn)]);
  const h = s.useMemo(() => {
    const { className: f } = rt();
    return B(L, { className: f });
  }, [L]);
  return s.useEffect(() => {
    if (!M) return;
    const f = () => {
      const C = M.localParticipant;
      _.debug("trying to publish local tracks"), Promise.all([
        C.setMicrophoneEnabled(!!c, typeof c != "boolean" ? c : void 0),
        C.setCameraEnabled(!!u, typeof u != "boolean" ? u : void 0),
        C.setScreenShareEnabled(!!m, typeof m != "boolean" ? m : void 0)
      ]).catch((k) => {
        _.warn(k), l == null || l(k);
      });
    }, b = (C, k) => {
      const x = Bt.getFailure(C);
      g == null || g(x, k);
    }, v = (C) => {
      E == null || E(C);
    }, y = (C) => {
      d == null || d(C);
    }, T = () => {
      p == null || p();
    };
    return M.on(I.SignalConnected, f).on(I.MediaDevicesError, b).on(I.EncryptionError, v).on(I.Disconnected, y).on(I.Connected, T), () => {
      M.off(I.SignalConnected, f).off(I.MediaDevicesError, b).off(I.EncryptionError, v).off(I.Disconnected, y).off(I.Connected, T);
    };
  }, [
    M,
    c,
    u,
    m,
    l,
    E,
    g,
    p,
    d
  ]), s.useEffect(() => {
    if (M) {
      if (w) {
        M.simulateParticipants({
          participants: {
            count: w
          },
          publish: {
            audio: !0,
            useRealTracks: !0
          }
        });
        return;
      }
      if (a) {
        if (A.current = !0, _.debug("connecting"), !t) {
          _.debug("no token yet");
          return;
        }
        if (!n) {
          _.warn("no livekit url provided"), l == null || l(Error("no livekit url provided"));
          return;
        }
        M.connect(n, t, i).catch((f) => {
          _.warn(f), A.current === !0 && (l == null || l(f));
        });
      } else
        _.debug("disconnecting because connect is false"), A.current = !1, M.disconnect();
    }
  }, [
    a,
    t,
    JSON.stringify(i),
    M,
    l,
    n,
    w
  ]), s.useEffect(() => {
    if (M)
      return () => {
        _.info("disconnecting on onmount"), M.disconnect();
      };
  }, [M]), { room: M, htmlProps: h };
}
function Ve(e = {}) {
  const t = H(e.room), [n, r] = s.useState(t.localParticipant), [o, i] = s.useState(
    n.isMicrophoneEnabled
  ), [a, c] = s.useState(n.isCameraEnabled), [u, m] = s.useState(
    n.isScreenShareEnabled
  ), [p, d] = s.useState(
    n.lastMicrophoneError
  ), [l, g] = s.useState(n.lastCameraError), [E, w] = s.useState(
    void 0
  ), [L, M] = s.useState(void 0), O = (A) => {
    c(A.isCameraEnabled), i(A.isMicrophoneEnabled), m(A.isScreenShareEnabled), M(A.cameraTrack), w(A.microphoneTrack), d(A.participant.lastMicrophoneError), g(A.participant.lastCameraError), r(A.participant);
  };
  return s.useEffect(() => {
    const A = st(t.localParticipant).subscribe(O);
    return () => A.unsubscribe();
  }, [t]), {
    isMicrophoneEnabled: o,
    isScreenShareEnabled: u,
    isCameraEnabled: a,
    microphoneTrack: E,
    cameraTrack: L,
    lastMicrophoneError: p,
    lastCameraError: l,
    localParticipant: n
  };
}
function Yn() {
  const e = ce(), t = s.useMemo(
    () => Ie(e.localParticipant),
    [e]
  );
  return D(t, e.localParticipant.permissions);
}
function Xn({
  kind: e,
  room: t,
  track: n,
  requestPermissions: r,
  onError: o
}) {
  const i = pe(), a = s.useMemo(() => t ?? i ?? new be(), [t, i]), c = s.useMemo(
    () => _e(e, o, r),
    [e, r, o]
  ), u = D(c, []), [m, p] = s.useState(
    (a == null ? void 0 : a.getActiveDevice(e)) ?? "default"
  ), { className: d, activeDeviceObservable: l, setActiveMediaDevice: g } = s.useMemo(
    () => ot(e, a),
    [e, a, n]
  );
  return s.useEffect(() => {
    const E = l.subscribe((w) => {
      w && (_.info("setCurrentDeviceId", w), p(w));
    });
    return () => {
      E == null || E.unsubscribe();
    };
  }, [l]), { devices: u, className: d, activeDeviceId: m, setActiveMediaDevice: g };
}
function Zn({
  kind: e,
  onError: t
}) {
  const n = s.useMemo(
    () => _e(e, t),
    [e, t]
  );
  return D(n, []);
}
function sn(e, t, n = {}) {
  const r = s.useRef([]), o = s.useRef(-1), i = t !== o.current, a = typeof n.customSortFunction == "function" ? n.customSortFunction(e) : at(e);
  let c = [...a];
  if (i === !1)
    try {
      c = it(r.current, a, t);
    } catch (u) {
      _.error("Error while running updatePages(): ", u);
    }
  return i ? r.current = a : r.current = c, o.current = t, c;
}
function er(e, t) {
  const [n, r] = s.useState(1), o = Math.max(Math.ceil(t.length / e), 1);
  n > o && r(o);
  const i = n * e, a = i - e, c = (d) => {
    r((l) => d === "next" ? l === o ? l : l + 1 : l === 1 ? l : l - 1);
  }, u = (d) => {
    d > o ? r(o) : d < 1 ? r(1) : r(d);
  }, p = sn(t, e).slice(a, i);
  return {
    totalPageCount: o,
    nextPage: () => c("next"),
    prevPage: () => c("previous"),
    setPage: u,
    firstItemIndex: a,
    lastItemIndex: i,
    tracks: p,
    currentPage: n
  };
}
function on(e = {}) {
  let t = he();
  e.participant && (t = e.participant);
  const n = s.useMemo(() => ct(t), [t]), { identity: r, name: o, metadata: i } = D(n, {
    name: t == null ? void 0 : t.name,
    identity: t == null ? void 0 : t.identity,
    metadata: t == null ? void 0 : t.metadata
  });
  return { identity: r, name: o, metadata: i };
}
function tr(e = {}) {
  const t = Y(e.participant), n = s.useMemo(() => Ie(t), [t]);
  return D(n, t.permissions);
}
function nr({
  trackRef: e,
  onParticipantClick: t,
  disableSpeakingIndicator: n,
  htmlProps: r
}) {
  const o = fe(e), i = s.useMemo(() => {
    const { className: l } = ut();
    return B(r, {
      className: l,
      onClick: (g) => {
        var E;
        if ((E = r.onClick) == null || E.call(r, g), typeof t == "function") {
          const w = o.publication ?? o.participant.getTrackPublication(o.source);
          t({ participant: o.participant, track: w });
        }
      }
    });
  }, [
    r,
    t,
    o.publication,
    o.source,
    o.participant
  ]), a = o.participant.getTrackPublication(P.Source.Microphone), c = s.useMemo(() => ({
    participant: o.participant,
    source: P.Source.Microphone,
    publication: a
  }), [a, o.participant]), u = ke(o), m = ke(c), p = en(o.participant), d = Zt(o);
  return {
    elementProps: {
      "data-lk-audio-muted": m,
      "data-lk-video-muted": u,
      "data-lk-speaking": n === !0 ? !1 : p,
      "data-lk-local-participant": o.participant.isLocal,
      "data-lk-source": o.source,
      "data-lk-facing-mode": d,
      ...i
    }
  };
}
function ve(e = {}) {
  const t = H(e.room), [n, r] = s.useState([]);
  return s.useEffect(() => {
    const o = lt(t, {
      additionalRoomEvents: e.updateOnlyOn
    }).subscribe(r);
    return () => o.unsubscribe();
  }, [t, JSON.stringify(e.updateOnlyOn)]), n;
}
function an(e = {}) {
  const t = ve(e), { localParticipant: n } = Ve(e);
  return s.useMemo(
    () => [n, ...t],
    [n, t]
  );
}
function rr(e) {
  return e = dt(e), s.useMemo(() => (e == null ? void 0 : e.pin.state) !== void 0 && e.pin.state.length >= 1 ? e.pin.state : [], [e.pin.state]);
}
function sr(e, t = {}) {
  const n = ce(), [r] = s.useState(t.updateOnlyOn), o = s.useMemo(() => typeof e == "string" ? ft(n, e, {
    additionalEvents: r
  }) : mt(n, e, {
    additionalEvents: r
  }), [n, JSON.stringify(e), r]), [i, a] = s.useState({
    p: void 0
  });
  return s.useEffect(() => {
    const c = o.subscribe((u) => a({ p: u }));
    return () => c.unsubscribe();
  }, [o]), i.p;
}
function or(e = {}) {
  const t = H(e.room), n = s.useMemo(() => pt(t), [t]), { name: r, metadata: o } = D(n, {
    name: t.name,
    metadata: t.metadata
  });
  return { name: r, metadata: o };
}
function cn(e) {
  const t = H(e == null ? void 0 : e.room), n = s.useMemo(() => ht(t), [t]);
  return D(n, t.activeSpeakers);
}
function ar(e) {
  const [t, n] = s.useState(
    Te(e)
  ), r = cn();
  return s.useEffect(() => {
    n(Te(e));
  }, [r, e]), t;
}
function ir({ room: e, props: t }) {
  const n = H(e), { className: r, roomAudioPlaybackAllowedObservable: o, handleStartAudioPlayback: i } = s.useMemo(
    () => bt(),
    []
  ), a = s.useMemo(
    () => o(n),
    [n, o]
  ), { canPlayAudio: c } = D(a, {
    canPlayAudio: n.canPlaybackAudio
  });
  return { mergedProps: s.useMemo(
    () => B(t, {
      className: r,
      onClick: () => {
        i(n);
      },
      style: { display: c ? "none" : "block" }
    }),
    [t, r, c, i, n]
  ), canPlayAudio: c };
}
function cr({ room: e, props: t }) {
  const n = H(e), { className: r, roomVideoPlaybackAllowedObservable: o, handleStartVideoPlayback: i } = s.useMemo(
    () => gt(),
    []
  ), a = s.useMemo(
    () => o(n),
    [n, o]
  ), { canPlayVideo: c } = D(a, {
    canPlayVideo: n.canPlaybackVideo
  });
  return { mergedProps: s.useMemo(
    () => B(t, {
      className: r,
      onClick: () => {
        i(n);
      },
      style: { display: c ? "none" : "block" }
    }),
    [t, r, c, i, n]
  ), canPlayVideo: c };
}
function ur(e, t = {}) {
  const n = s.useRef(null), r = s.useRef(null), o = t.minSwipeDistance ?? 50, i = (u) => {
    r.current = null, n.current = u.targetTouches[0].clientX;
  }, a = (u) => {
    r.current = u.targetTouches[0].clientX;
  }, c = s.useCallback(() => {
    if (!n.current || !r.current)
      return;
    const u = n.current - r.current, m = u > o, p = u < -o;
    m && t.onLeftSwipe && t.onLeftSwipe(), p && t.onRightSwipe && t.onRightSwipe();
  }, [o, t]);
  s.useEffect(() => {
    const u = e.current;
    return u && (u.addEventListener("touchstart", i, { passive: !0 }), u.addEventListener("touchmove", a, { passive: !0 }), u.addEventListener("touchend", c, { passive: !0 })), () => {
      u && (u.removeEventListener("touchstart", i), u.removeEventListener("touchmove", a), u.removeEventListener("touchend", c));
    };
  }, [e, c]);
}
function lr({ props: e }) {
  const { dispatch: t, state: n } = Ne().widget, { className: r } = s.useMemo(() => vt(), []);
  return { mergedProps: s.useMemo(() => B(e, {
    className: r,
    onClick: () => {
      t && t({ msg: "toggle_chat" });
    },
    "aria-pressed": n != null && n.showChat ? "true" : "false",
    "data-lk-unread-msgs": n ? n.unreadMessages < 10 ? n.unreadMessages.toFixed(0) : "9+" : "0"
  }), [e, r, t, n]) };
}
function dr(e, t, n = {}) {
  const [r, o] = s.useState(void 0);
  return s.useEffect(() => {
    var a;
    if (e === void 0)
      throw Error("token endpoint needs to be defined");
    if (((a = n.userInfo) == null ? void 0 : a.identity) === void 0)
      return;
    (async () => {
      _.debug("fetching token");
      const c = new URLSearchParams({ ...n.userInfo, roomName: t }), u = await fetch(`${e}?${c.toString()}`);
      if (!u.ok) {
        _.error(
          `Could not fetch token. Server responded with status ${u.status}: ${u.statusText}`
        );
        return;
      }
      const { accessToken: m } = await u.json();
      o(m);
    })();
  }, [e, t, JSON.stringify(n)]), r;
}
function fr(e) {
  var i, a;
  const t = fe(e), { className: n, mediaMutedObserver: r } = s.useMemo(
    () => St(t),
    [me(t)]
  );
  return { isMuted: D(
    r,
    !!((i = t.publication) != null && i.isMuted || (a = t.participant.getTrackPublication(t.source)) != null && a.isMuted)
  ), className: n };
}
function mr({
  source: e,
  onChange: t,
  initialState: n,
  captureOptions: r,
  publishOptions: o,
  onDeviceError: i,
  room: a,
  ...c
}) {
  var h;
  const u = pe(), m = s.useMemo(() => a ?? u, [a, u]), p = (h = m == null ? void 0 : m.localParticipant) == null ? void 0 : h.getTrackPublication(e), d = s.useRef(!1), { toggle: l, className: g, pendingObserver: E, enabledObserver: w } = s.useMemo(
    () => m ? yt(e, m, r, o, i) : Ct(),
    [m, e, JSON.stringify(r), o]
  ), L = D(E, !1), M = D(w, n ?? !!(p != null && p.isEnabled));
  s.useEffect(() => {
    t == null || t(M, d.current), d.current = !1;
  }, [M, t]), s.useEffect(() => {
    n !== void 0 && (_.debug("forcing initial toggle state", e, n), l(n));
  }, []);
  const O = s.useMemo(() => B(c, { className: g }), [c, g]), A = s.useCallback(
    (f) => {
      var b;
      d.current = !0, l().catch(() => d.current = !1), (b = c.onClick) == null || b.call(c, f);
    },
    [c, l]
  );
  return {
    toggle: l,
    enabled: M,
    pending: L,
    track: p,
    buttonProps: {
      ...O,
      "aria-pressed": M,
      "data-lk-source": e,
      "data-lk-enabled": M,
      disabled: L,
      onClick: A
    }
  };
}
function pr(e = [
  P.Source.Camera,
  P.Source.Microphone,
  P.Source.ScreenShare,
  P.Source.ScreenShareAudio,
  P.Source.Unknown
], t = {}) {
  const n = H(t.room), [r, o] = s.useState([]), [i, a] = s.useState([]), c = s.useMemo(() => e.map((m) => Et(m) ? m.source : m), [JSON.stringify(e)]);
  return s.useEffect(() => {
    const m = Mt(n, c, {
      additionalRoomEvents: t.updateOnlyOn,
      onlySubscribed: t.onlySubscribed
    }).subscribe(({ trackReferences: p, participants: d }) => {
      _.debug("setting track bundles", p, d), o(p), a(d);
    });
    return () => m.unsubscribe();
  }, [
    n,
    JSON.stringify(t.onlySubscribed),
    JSON.stringify(t.updateOnlyOn),
    JSON.stringify(e)
  ]), s.useMemo(() => {
    if (Fe(e)) {
      const m = ln(e, i), p = Array.from(r);
      return i.forEach((d) => {
        m.has(d.identity) && (m.get(d.identity) ?? []).forEach((g) => {
          if (r.find(
            ({ participant: w, publication: L }) => d.identity === w.identity && L.source === g
          ))
            return;
          _.debug(
            `Add ${g} placeholder for participant ${d.identity}.`
          );
          const E = {
            participant: d,
            source: g
          };
          p.push(E);
        });
      }), p;
    } else
      return r;
  }, [r, i, e]);
}
function un(e, t) {
  const n = new Set(e);
  for (const r of t)
    n.delete(r);
  return n;
}
function ln(e, t) {
  const n = /* @__PURE__ */ new Map();
  if (Fe(e)) {
    const r = e.filter((o) => o.withPlaceholder).map((o) => o.source);
    t.forEach((o) => {
      const i = o.getTrackPublications().map((c) => {
        var u;
        return (u = c.track) == null ? void 0 : u.source;
      }).filter((c) => c !== void 0), a = Array.from(
        un(new Set(r), new Set(i))
      );
      a.length > 0 && n.set(o.identity, a);
    });
  }
  return n;
}
function dn(e) {
  const [t, n] = s.useState(Tt(e)), { trackObserver: r } = s.useMemo(() => kt(e), [e.participant.sid ?? e.participant.identity, e.source]);
  return s.useEffect(() => {
    const o = r.subscribe((i) => {
      n(i);
    });
    return () => o == null ? void 0 : o.unsubscribe();
  }, [r]), {
    participant: e.participant,
    source: e.source ?? P.Source.Unknown,
    publication: t
  };
}
function hr(e, t) {
  const n = Y(t);
  return dn({ name: e, participant: n });
}
function fn(e) {
  const t = H(e == null ? void 0 : e.room), n = re(t), r = s.useMemo(
    () => n === N.Disconnected,
    [n]
  ), o = s.useMemo(
    () => wt(t, e),
    [t, e, r]
  ), i = D(o.isSendingObservable, !1), a = D(o.messageObservable, []);
  return { send: o.send, chatMessages: a, isSending: i };
}
function br(e = {}) {
  const [t, n] = s.useState(
    Pt(e.defaults, e.preventLoad ?? !1)
  ), r = s.useCallback((u) => {
    n((m) => ({ ...m, audioEnabled: u }));
  }, []), o = s.useCallback((u) => {
    n((m) => ({ ...m, videoEnabled: u }));
  }, []), i = s.useCallback((u) => {
    n((m) => ({ ...m, audioDeviceId: u }));
  }, []), a = s.useCallback((u) => {
    n((m) => ({ ...m, videoDeviceId: u }));
  }, []), c = s.useCallback((u) => {
    n((m) => ({ ...m, username: u }));
  }, []);
  return s.useEffect(() => {
    Lt(t, e.preventSave ?? !1);
  }, [t, e.preventSave]), {
    userChoices: t,
    saveAudioInputEnabled: r,
    saveVideoInputEnabled: o,
    saveAudioInputDeviceId: i,
    saveVideoInputDeviceId: a,
    saveUsername: c
  };
}
function gr(e, t = {}) {
  const n = Y(e), r = H(t.room), o = s.useMemo(() => At(r, n), [r, n]);
  return D(
    o,
    n.isLocal ? n.isE2EEEnabled : !!(n != null && n.isEncrypted)
  );
}
function vr(e, t = { fftSize: 32, smoothingTimeConstant: 0 }) {
  const n = Rt(e) ? e.publication.track : e, [r, o] = s.useState(0);
  return s.useEffect(() => {
    if (!n || !n.mediaStream)
      return;
    const { cleanup: i, analyser: a } = ge(n, t), c = a.frequencyBinCount, u = new Uint8Array(c), p = setInterval(() => {
      a.getByteFrequencyData(u);
      let d = 0;
      for (let l = 0; l < u.length; l++) {
        const g = u[l];
        d += g * g;
      }
      o(Math.sqrt(d / u.length) / 255);
    }, 1e3 / 30);
    return () => {
      i(), clearInterval(p);
    };
  }, [n, n == null ? void 0 : n.mediaStream, JSON.stringify(t)]), r;
}
const mn = (e) => {
  const t = (n) => {
    let i = 1 - Math.max(-100, Math.min(-10, n)) * -1 / 100;
    return i = Math.sqrt(i), i;
  };
  return e.map((n) => n === -1 / 0 ? 0 : t(n));
}, pn = {
  bands: 5,
  loPass: 100,
  hiPass: 600,
  updateInterval: 32,
  analyserOptions: { fftSize: 2048 }
};
function Sr(e, t = {}) {
  var a;
  const n = e instanceof P ? e : (a = e == null ? void 0 : e.publication) == null ? void 0 : a.track, r = { ...pn, ...t }, [o, i] = s.useState(
    new Array(r.bands).fill(0)
  );
  return s.useEffect(() => {
    if (!n || !(n != null && n.mediaStream)) {
      i((g) => g.slice().fill(0));
      return;
    }
    const { analyser: c, cleanup: u } = ge(n, r.analyserOptions), m = c.frequencyBinCount, p = new Float32Array(m), l = setInterval(() => {
      c.getFloatFrequencyData(p);
      let g = new Float32Array(p.length);
      for (let M = 0; M < p.length; M++)
        g[M] = p[M];
      g = g.slice(r.loPass, r.hiPass);
      const E = mn(g), w = E.length, L = [];
      for (let M = 0; M < r.bands; M++) {
        const O = Math.floor(M * w / r.bands), A = Math.floor((M + 1) * w / r.bands), h = E.slice(O, A), f = h.length;
        if (f === 0)
          L.push(0);
        else {
          const b = h.reduce((v, y) => v += y, 0);
          L.push(b / f);
        }
      }
      i(L);
    }, r.updateInterval);
    return () => {
      u(), clearInterval(l);
    };
  }, [n, n == null ? void 0 : n.mediaStream, JSON.stringify(t)]), o;
}
const hn = {
  barCount: 120,
  volMultiplier: 5,
  updateInterval: 20
};
function yr(e, t = {}) {
  var p;
  const n = e instanceof P ? e : (p = e == null ? void 0 : e.publication) == null ? void 0 : p.track, r = { ...hn, ...t }, o = s.useRef(new Float32Array()), i = s.useRef(performance.now()), a = s.useRef(0), [c, u] = s.useState([]), m = s.useCallback((d) => {
    u(
      Array.from(
        gn(d, r.barCount).map((l) => Math.sqrt(l) * r.volMultiplier)
        // wave.slice(0, opts.barCount).map((v) => sigmoid(v * opts.volMultiplier, 0.08, 0.2)),
      )
    );
  }, []);
  return s.useEffect(() => {
    if (!n || !(n != null && n.mediaStream))
      return;
    const { analyser: d, cleanup: l } = ge(n, {
      fftSize: we(r.barCount)
    }), g = we(r.barCount), E = new Float32Array(g), w = () => {
      if (L = requestAnimationFrame(w), d.getFloatTimeDomainData(E), o.current.map((M, O) => M + E[O]), a.current += 1, performance.now() - i.current >= r.updateInterval) {
        const M = E.map((O) => O / a.current);
        m(M), i.current = performance.now(), a.current = 0;
      }
    };
    let L = requestAnimationFrame(w);
    return () => {
      l(), cancelAnimationFrame(L);
    };
  }, [n, n == null ? void 0 : n.mediaStream, JSON.stringify(t), m]), {
    bars: c
  };
}
function we(e) {
  return e < 32 ? 32 : bn(e);
}
function bn(e) {
  let t = 2;
  for (; e >>= 1; )
    t <<= 1;
  return t;
}
function gn(e, t) {
  const n = Math.floor(e.length / t), r = new Float32Array(t);
  for (let o = 0; o < t; o++) {
    const i = n * o;
    let a = 0;
    for (let c = 0; c < n; c++)
      a = a + Math.abs(e[i + c]);
    r[o] = a / n;
  }
  return r;
}
function ie(e, t = {}) {
  let n, r;
  typeof t == "string" ? n = t : (n = t == null ? void 0 : t.participantIdentity, r = t == null ? void 0 : t.room);
  const o = he(), i = an({ room: r, updateOnlyOn: [] }), a = s.useMemo(() => n ? i.find((m) => m.identity === n) : o, [n, i, o]), c = s.useMemo(() => {
    if (a)
      return Dt(a, { sources: e });
  }, [a, JSON.stringify(e)]);
  return D(c, []);
}
function vn(e) {
  var n, r, o;
  const t = s.useMemo(
    () => {
      var i;
      return (i = e == null ? void 0 : e.publication) != null && i.track ? Ot(e == null ? void 0 : e.publication.track) : void 0;
    },
    [(n = e == null ? void 0 : e.publication) == null ? void 0 : n.track]
  );
  return D(t, {
    timestamp: Date.now(),
    rtpTimestamp: (o = (r = e == null ? void 0 : e.publication) == null ? void 0 : r.track) == null ? void 0 : o.rtpTimestamp
  });
}
const Sn = {
  bufferSize: 100
  // maxAge: 2_000,
};
function yn(e, t) {
  const n = { ...Sn, ...t }, [r, o] = s.useState([]), i = vn(e), a = (c) => {
    var u;
    (u = n.onTranscription) == null || u.call(n, c), o(
      (m) => It(
        m,
        // when first receiving a segment, add the current media timestamp to it
        c.map((p) => _t(p, i)),
        n.bufferSize
      )
    );
  };
  return s.useEffect(() => {
    if (!(e != null && e.publication))
      return;
    const c = Nt(e.publication).subscribe((u) => {
      a(...u);
    });
    return () => {
      c.unsubscribe();
    };
  }, [e && me(e), a]), { segments: r };
}
function Cn(e = {}) {
  const t = he(), n = e.participant ?? t, r = s.useMemo(
    // weird typescript constraint
    () => n ? de(n) : de(n),
    [n]
  );
  return D(r, {
    attributes: n == null ? void 0 : n.attributes
  });
}
function Cr(e, t = {}) {
  const n = Y(t.participant), [r, o] = s.useState(n.attributes[e]);
  return s.useEffect(() => {
    if (!n)
      return;
    const i = de(n).subscribe((a) => {
      a.changed[e] !== void 0 && o(a.attributes[e]);
    });
    return () => {
      i.unsubscribe();
    };
  }, [n, e]), r;
}
const Pe = K.AgentState;
function Er() {
  const e = ve(), t = e.find(
    (d) => d.kind === ae.AGENT && !(K.PublishOnBehalf in d.attributes)
  ), n = e.find(
    (d) => d.kind === ae.AGENT && d.attributes[K.PublishOnBehalf] === (t == null ? void 0 : t.identity)
  ), r = ie(
    [P.Source.Microphone, P.Source.Camera],
    t == null ? void 0 : t.identity
  ), o = ie(
    [P.Source.Microphone, P.Source.Camera],
    n == null ? void 0 : n.identity
  ), i = r.find((d) => d.source === P.Source.Microphone) ?? o.find((d) => d.source === P.Source.Microphone), a = r.find((d) => d.source === P.Source.Camera) ?? o.find((d) => d.source === P.Source.Camera), { segments: c } = yn(i), u = re(), { attributes: m } = Cn({ participant: t }), p = s.useMemo(() => u === N.Disconnected ? "disconnected" : u === N.Connecting || !t || !(m != null && m[Pe]) ? "connecting" : m[Pe], [m, t, u]);
  return {
    agent: t,
    state: p,
    audioTrack: i,
    videoTrack: a,
    agentTranscriptions: c,
    agentAttributes: m
  };
}
function Mr(e) {
  const t = H(e), n = re(t), r = s.useMemo(() => Ft(t), [t, n]);
  return D(r, t.isRecording);
}
function En(e, t) {
  const n = H(t == null ? void 0 : t.room), o = re(n) === N.Disconnected, i = s.useMemo(() => xt(n, e), [n, e]);
  return { textStreams: D(o ? void 0 : i, []) };
}
function Mn(e) {
  const { participantIdentities: t, trackSids: n } = e ?? {}, { textStreams: r } = En(Ut.TRANSCRIPTION, { room: e == null ? void 0 : e.room });
  return s.useMemo(
    () => r.filter(
      (i) => t ? t.includes(i.participantInfo.identity) : !0
    ).filter(
      (i) => {
        var a;
        return n ? n.includes(
          ((a = i.streamInfo.attributes) == null ? void 0 : a[K.TranscribedTrackId]) ?? ""
        ) : !0;
      }
    ),
    [r, t, n]
  );
}
const Le = 2, Ae = 400, Re = 3, De = 1e3;
function Tr(e) {
  const t = ue([]), n = qe(() => new Wt(), []), r = ne(async () => n.lock().then(async (p) => {
    for (; ; ) {
      const d = t.current.pop();
      if (!d) {
        p();
        break;
      }
      switch (d.type) {
        case "connect":
          await d.room.connect(...d.args).then(d.resolve).catch(d.reject);
          break;
        case "disconnect":
          await d.room.disconnect(...d.args).then(d.resolve).catch(d.reject);
          break;
      }
    }
  }), []), o = ue([]), i = ne((p) => {
    let d = 0;
    o.current = o.current.filter((l) => {
      const g = p.getTime() - l.getTime() < De;
      return g && (d += 1), g;
    }), d > Re && _.warn(
      `useSequentialRoomConnectDisconnect: room changed reference rapidly (over ${Re}x in ${De}ms). This is not recommended.`
    );
  }, []);
  Be(() => {
    t.current = [];
    const p = /* @__PURE__ */ new Date();
    o.current.push(p), i(p);
  }, [e, i]);
  const a = ue([]), c = ne((p) => {
    let d = 0;
    a.current = a.current.filter((l) => {
      const g = p.getTime() - l.getTime() < Ae;
      return g && (d += 1), g;
    }), d > Le && _.warn(
      `useSequentialRoomConnectDisconnect: room connect / disconnect occurring in rapid sequence (over ${Le}x in ${Ae}ms). This is not recommended and may be the sign of a bug like a useEffect dependency changing every render.`
    );
  }, []), u = ne(
    async (...p) => new Promise((d, l) => {
      if (!e)
        throw new Error("Called connect(), but room was unset");
      const g = /* @__PURE__ */ new Date();
      c(g), t.current.push({ type: "connect", room: e, args: p, resolve: d, reject: l }), a.current.push(g), r();
    }),
    [e, c, r]
  ), m = ne(
    async (...p) => new Promise((d, l) => {
      if (!e)
        throw new Error("Called discconnect(), but room was unset");
      const g = /* @__PURE__ */ new Date();
      c(g), t.current.push({ type: "disconnect", room: e, args: p, resolve: d, reject: l }), a.current.push(g), r();
    }),
    [e, c, r]
  );
  return {
    connect: e ? u : null,
    disconnect: e ? m : null
  };
}
var oe = { exports: {} }, Oe;
function Tn() {
  if (Oe) return oe.exports;
  Oe = 1;
  var e = typeof Reflect == "object" ? Reflect : null, t = e && typeof e.apply == "function" ? e.apply : function(f, b, v) {
    return Function.prototype.apply.call(f, b, v);
  }, n;
  e && typeof e.ownKeys == "function" ? n = e.ownKeys : Object.getOwnPropertySymbols ? n = function(f) {
    return Object.getOwnPropertyNames(f).concat(Object.getOwnPropertySymbols(f));
  } : n = function(f) {
    return Object.getOwnPropertyNames(f);
  };
  function r(h) {
    console && console.warn && console.warn(h);
  }
  var o = Number.isNaN || function(f) {
    return f !== f;
  };
  function i() {
    i.init.call(this);
  }
  oe.exports = i, oe.exports.once = M, i.EventEmitter = i, i.prototype._events = void 0, i.prototype._eventsCount = 0, i.prototype._maxListeners = void 0;
  var a = 10;
  function c(h) {
    if (typeof h != "function")
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof h);
  }
  Object.defineProperty(i, "defaultMaxListeners", {
    enumerable: !0,
    get: function() {
      return a;
    },
    set: function(h) {
      if (typeof h != "number" || h < 0 || o(h))
        throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + h + ".");
      a = h;
    }
  }), i.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  }, i.prototype.setMaxListeners = function(f) {
    if (typeof f != "number" || f < 0 || o(f))
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + f + ".");
    return this._maxListeners = f, this;
  };
  function u(h) {
    return h._maxListeners === void 0 ? i.defaultMaxListeners : h._maxListeners;
  }
  i.prototype.getMaxListeners = function() {
    return u(this);
  }, i.prototype.emit = function(f) {
    for (var b = [], v = 1; v < arguments.length; v++) b.push(arguments[v]);
    var y = f === "error", T = this._events;
    if (T !== void 0)
      y = y && T.error === void 0;
    else if (!y)
      return !1;
    if (y) {
      var C;
      if (b.length > 0 && (C = b[0]), C instanceof Error)
        throw C;
      var k = new Error("Unhandled error." + (C ? " (" + C.message + ")" : ""));
      throw k.context = C, k;
    }
    var x = T[f];
    if (x === void 0)
      return !1;
    if (typeof x == "function")
      t(x, this, b);
    else
      for (var q = x.length, j = E(x, q), v = 0; v < q; ++v)
        t(j[v], this, b);
    return !0;
  };
  function m(h, f, b, v) {
    var y, T, C;
    if (c(b), T = h._events, T === void 0 ? (T = h._events = /* @__PURE__ */ Object.create(null), h._eventsCount = 0) : (T.newListener !== void 0 && (h.emit(
      "newListener",
      f,
      b.listener ? b.listener : b
    ), T = h._events), C = T[f]), C === void 0)
      C = T[f] = b, ++h._eventsCount;
    else if (typeof C == "function" ? C = T[f] = v ? [b, C] : [C, b] : v ? C.unshift(b) : C.push(b), y = u(h), y > 0 && C.length > y && !C.warned) {
      C.warned = !0;
      var k = new Error("Possible EventEmitter memory leak detected. " + C.length + " " + String(f) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      k.name = "MaxListenersExceededWarning", k.emitter = h, k.type = f, k.count = C.length, r(k);
    }
    return h;
  }
  i.prototype.addListener = function(f, b) {
    return m(this, f, b, !1);
  }, i.prototype.on = i.prototype.addListener, i.prototype.prependListener = function(f, b) {
    return m(this, f, b, !0);
  };
  function p() {
    if (!this.fired)
      return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  function d(h, f, b) {
    var v = { fired: !1, wrapFn: void 0, target: h, type: f, listener: b }, y = p.bind(v);
    return y.listener = b, v.wrapFn = y, y;
  }
  i.prototype.once = function(f, b) {
    return c(b), this.on(f, d(this, f, b)), this;
  }, i.prototype.prependOnceListener = function(f, b) {
    return c(b), this.prependListener(f, d(this, f, b)), this;
  }, i.prototype.removeListener = function(f, b) {
    var v, y, T, C, k;
    if (c(b), y = this._events, y === void 0)
      return this;
    if (v = y[f], v === void 0)
      return this;
    if (v === b || v.listener === b)
      --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete y[f], y.removeListener && this.emit("removeListener", f, v.listener || b));
    else if (typeof v != "function") {
      for (T = -1, C = v.length - 1; C >= 0; C--)
        if (v[C] === b || v[C].listener === b) {
          k = v[C].listener, T = C;
          break;
        }
      if (T < 0)
        return this;
      T === 0 ? v.shift() : w(v, T), v.length === 1 && (y[f] = v[0]), y.removeListener !== void 0 && this.emit("removeListener", f, k || b);
    }
    return this;
  }, i.prototype.off = i.prototype.removeListener, i.prototype.removeAllListeners = function(f) {
    var b, v, y;
    if (v = this._events, v === void 0)
      return this;
    if (v.removeListener === void 0)
      return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : v[f] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete v[f]), this;
    if (arguments.length === 0) {
      var T = Object.keys(v), C;
      for (y = 0; y < T.length; ++y)
        C = T[y], C !== "removeListener" && this.removeAllListeners(C);
      return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (b = v[f], typeof b == "function")
      this.removeListener(f, b);
    else if (b !== void 0)
      for (y = b.length - 1; y >= 0; y--)
        this.removeListener(f, b[y]);
    return this;
  };
  function l(h, f, b) {
    var v = h._events;
    if (v === void 0)
      return [];
    var y = v[f];
    return y === void 0 ? [] : typeof y == "function" ? b ? [y.listener || y] : [y] : b ? L(y) : E(y, y.length);
  }
  i.prototype.listeners = function(f) {
    return l(this, f, !0);
  }, i.prototype.rawListeners = function(f) {
    return l(this, f, !1);
  }, i.listenerCount = function(h, f) {
    return typeof h.listenerCount == "function" ? h.listenerCount(f) : g.call(h, f);
  }, i.prototype.listenerCount = g;
  function g(h) {
    var f = this._events;
    if (f !== void 0) {
      var b = f[h];
      if (typeof b == "function")
        return 1;
      if (b !== void 0)
        return b.length;
    }
    return 0;
  }
  i.prototype.eventNames = function() {
    return this._eventsCount > 0 ? n(this._events) : [];
  };
  function E(h, f) {
    for (var b = new Array(f), v = 0; v < f; ++v)
      b[v] = h[v];
    return b;
  }
  function w(h, f) {
    for (; f + 1 < h.length; f++)
      h[f] = h[f + 1];
    h.pop();
  }
  function L(h) {
    for (var f = new Array(h.length), b = 0; b < f.length; ++b)
      f[b] = h[b].listener || h[b];
    return f;
  }
  function M(h, f) {
    return new Promise(function(b, v) {
      function y(C) {
        h.removeListener(f, T), v(C);
      }
      function T() {
        typeof h.removeListener == "function" && h.removeListener("error", y), b([].slice.call(arguments));
      }
      A(h, f, T, { once: !0 }), f !== "error" && O(h, y, { once: !0 });
    });
  }
  function O(h, f, b) {
    typeof h.on == "function" && A(h, "error", f, b);
  }
  function A(h, f, b, v) {
    if (typeof h.on == "function")
      v.once ? h.once(f, b) : h.on(f, b);
    else if (typeof h.addEventListener == "function")
      h.addEventListener(f, function y(T) {
        v.once && h.removeEventListener(f, y), b(T);
      });
    else
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof h);
  }
  return oe.exports;
}
var Se = Tn();
const kn = 2e4;
var wn = /* @__PURE__ */ ((e) => (e.CameraChanged = "cameraChanged", e.MicrophoneChanged = "microphoneChanged", e.StateChanged = "stateChanged", e))(wn || {});
const V = (e) => ({
  isConnected: e === "listening" || e === "thinking" || e === "speaking",
  canListen: e === "pre-connect-buffering" || e === "listening" || e === "thinking" || e === "speaking",
  isFinished: e === "disconnected" || e === "failed",
  isPending: e === "connecting" || e === "initializing" || e === "idle"
}), Pn = () => {
  const [e, t] = s.useState(
    null
  ), [n, r] = s.useState(
    null
  ), o = s.useRef("connecting"), i = s.useRef(!1), a = (c) => setTimeout(() => {
    if (!i.current) {
      t("Agent did not join the room.");
      return;
    }
    const { isConnected: u } = V(o.current);
    if (!u) {
      t("Agent joined the room but did not complete initializing.");
      return;
    }
  }, c ?? kn);
  return {
    agentTimeoutFailureReason: e,
    startAgentTimeout: s.useCallback(
      (c) => {
        n && clearTimeout(n), t(null), r(a(c)), o.current = "connecting", i.current = !1;
      },
      [n]
    ),
    clearAgentTimeout: s.useCallback(() => {
      n && clearTimeout(n), t(null), r(null), o.current = "connecting", i.current = !1;
    }, [n]),
    clearAgentTimeoutFailureReason: s.useCallback(() => {
      t(null);
    }, []),
    updateAgentTimeoutState: s.useCallback((c) => {
      o.current = c;
    }, []),
    updateAgentTimeoutParticipantExists: s.useCallback((c) => {
      i.current = c;
    }, [])
  };
};
function Ln(e, t) {
  const n = s.useRef(t);
  s.useEffect(() => {
    n.current = t;
  }, [t]);
  const r = s.useCallback(
    async (a) => {
      const { isConnected: c } = V(n.current);
      if (!c)
        return new Promise((u, m) => {
          const p = (g) => {
            const { isConnected: E } = V(g);
            E && (l(), u());
          }, d = () => {
            l(), m(new Error("useAgent(/* ... */).waitUntilConnected - signal aborted"));
          }, l = () => {
            e.off("stateChanged", p), a == null || a.removeEventListener("abort", d);
          };
          e.on("stateChanged", p), a == null || a.addEventListener("abort", d);
        });
    },
    [e]
  ), o = s.useCallback(
    async (a) => {
      const { canListen: c } = V(n.current);
      if (!c)
        return new Promise((u, m) => {
          const p = (g) => {
            const { canListen: E } = V(g);
            E && (l(), u());
          }, d = () => {
            l(), m(new Error("useAgent(/* ... */).waitUntilCouldBeListening - signal aborted"));
          }, l = () => {
            e.off("stateChanged", p), a == null || a.removeEventListener("abort", d);
          };
          e.on("stateChanged", p), a == null || a.addEventListener("abort", d);
        });
    },
    [e]
  ), i = s.useCallback(
    async (a) => {
      const { isFinished: c } = V(n.current);
      if (!c)
        return new Promise((u, m) => {
          const p = (g) => {
            const { isFinished: E } = V(g);
            E && (l(), u());
          }, d = () => {
            l(), m(new Error("useAgent(/* ... */).waitUntilFinished - signal aborted"));
          }, l = () => {
            e.off("stateChanged", p), a == null || a.removeEventListener("abort", d);
          };
          e.on("stateChanged", p), a == null || a.addEventListener("abort", d);
        });
    },
    [e]
  );
  return { waitUntilConnected: r, waitUntilCouldBeListening: o, waitUntilFinished: i };
}
function He(e) {
  const t = Vt();
  if (e = e ?? t, !e)
    throw new Error(
      "No session provided, make sure you are inside a Session context or pass the session explicitly"
    );
  const {
    room: n,
    internal: {
      agentConnectTimeoutMilliseconds: r,
      agentTimeoutFailureReason: o,
      startAgentTimeout: i,
      clearAgentTimeout: a,
      clearAgentTimeoutFailureReason: c,
      updateAgentTimeoutState: u,
      updateAgentTimeoutParticipantExists: m
    }
  } = e, p = s.useMemo(() => new Se.EventEmitter(), []), d = ve({ room: n }), l = s.useMemo(() => d.find(
    (S) => S.kind === ae.AGENT && !(K.PublishOnBehalf in S.attributes)
  ) ?? null, [d]), g = s.useMemo(() => l ? d.find(
    (S) => S.kind === ae.AGENT && S.attributes[K.PublishOnBehalf] === l.identity
  ) ?? null : null, [l, d]), [E, w] = s.useState((l == null ? void 0 : l.attributes) ?? {});
  s.useEffect(() => {
    if (!l)
      return;
    const S = (U) => {
      w(U);
    };
    return l.on(ee.AttributesChanged, S), () => {
      l.off(ee.AttributesChanged, S);
    };
  }, [l, p]);
  const L = ie([P.Source.Camera, P.Source.Microphone], {
    room: n,
    participantIdentity: l == null ? void 0 : l.identity
  }), M = ie([P.Source.Camera, P.Source.Microphone], {
    room: n,
    participantIdentity: g == null ? void 0 : g.identity
  }), O = s.useMemo(
    () => L.find((S) => S.source === P.Source.Camera) ?? M.find((S) => S.source === P.Source.Camera),
    [L, M]
  );
  s.useEffect(() => {
    p.emit("cameraChanged", O);
  }, [p, O]);
  const A = s.useMemo(
    () => L.find((S) => S.source === P.Source.Microphone) ?? M.find((S) => S.source === P.Source.Microphone),
    [L, M]
  );
  s.useEffect(() => {
    p.emit("microphoneChanged", A);
  }, [p, A]);
  const [h, f] = s.useState(n.state);
  s.useEffect(() => {
    const S = (U) => {
      f(U);
    };
    return n.on(I.ConnectionStateChanged, S), () => {
      n.off(I.ConnectionStateChanged, S);
    };
  }, [n]), s.useEffect(() => {
    l && c();
  }, [l]);
  const [b, v] = s.useState(null);
  s.useEffect(() => {
    if (!l)
      return;
    const S = (U) => {
      U.identity === (l == null ? void 0 : l.identity) && v("Agent left the room unexpectedly.");
    };
    return n.on(I.ParticipantDisconnected, S), () => {
      n.off(I.ParticipantDisconnected, S);
    };
  }, [l, n]), s.useEffect(() => {
    h === N.Disconnected && v(null);
  }, [h]);
  const [y, T] = s.useState(
    () => n.localParticipant.getTrackPublication(P.Source.Microphone) ?? null
  );
  s.useEffect(() => {
    const S = () => {
      T(n.localParticipant.getTrackPublication(P.Source.Microphone) ?? null);
    }, U = () => {
      T(null);
    };
    return n.localParticipant.on(
      ee.LocalTrackPublished,
      S
    ), n.localParticipant.on(
      ee.LocalTrackUnpublished,
      U
    ), () => {
      n.localParticipant.off(
        ee.LocalTrackPublished,
        S
      ), n.localParticipant.off(
        ee.LocalTrackUnpublished,
        U
      );
    };
  }, [n.localParticipant]);
  const C = s.useMemo(() => {
    const S = [];
    return o && S.push(o), b && S.push(b), S;
  }, [o, b]), k = s.useMemo(() => {
    if (C.length > 0)
      return "failed";
    let S = "disconnected";
    return h !== N.Disconnected && (S = "connecting"), y && (S = "pre-connect-buffering"), l && E[K.AgentState] && (S = E[K.AgentState]), S;
  }, [
    C,
    h,
    y,
    l,
    E
  ]);
  s.useEffect(() => {
    p.emit("stateChanged", k), u(k);
  }, [p, k]), s.useEffect(() => {
    m(l !== null);
  }, [l]);
  const x = e.connectionState === "disconnected";
  s.useEffect(() => {
    if (!x)
      return i(r), () => {
        a();
      };
  }, [x, r]);
  const {
    identity: q,
    name: j,
    metadata: Q
  } = on({ participant: l ?? void 0 }), te = s.useMemo(() => {
    const S = {
      attributes: E,
      internal: {
        agentParticipant: l,
        workerParticipant: g,
        emitter: p
      }
    };
    switch (k) {
      case "disconnected":
        return {
          ...S,
          identity: void 0,
          name: void 0,
          metadata: void 0,
          state: k,
          ...V(k),
          failureReasons: null,
          // Clear inner values if no longer connected
          cameraTrack: void 0,
          microphoneTrack: void 0
        };
      case "connecting":
        return {
          ...S,
          identity: void 0,
          name: void 0,
          metadata: void 0,
          state: k,
          ...V(k),
          failureReasons: null,
          // Clear inner values if no longer connected
          cameraTrack: void 0,
          microphoneTrack: void 0
        };
      case "initializing":
      case "idle":
        return {
          ...S,
          identity: q,
          name: j,
          metadata: Q,
          state: k,
          ...V(k),
          failureReasons: null,
          cameraTrack: O,
          microphoneTrack: A
        };
      case "pre-connect-buffering":
        return {
          ...S,
          identity: q,
          name: j,
          metadata: Q,
          state: k,
          ...V(k),
          failureReasons: null,
          cameraTrack: O,
          microphoneTrack: A
        };
      case "listening":
      case "thinking":
      case "speaking":
        return {
          ...S,
          identity: q,
          name: j,
          metadata: Q,
          state: k,
          ...V(k),
          failureReasons: null,
          cameraTrack: O,
          microphoneTrack: A
        };
      case "failed":
        return {
          ...S,
          identity: void 0,
          name: void 0,
          metadata: void 0,
          state: "failed",
          ...V("failed"),
          failureReasons: C,
          // Clear inner values if no longer connected
          cameraTrack: void 0,
          microphoneTrack: void 0
        };
    }
  }, [
    q,
    j,
    Q,
    E,
    p,
    l,
    k,
    O,
    A
  ]), { waitUntilConnected: X, waitUntilCouldBeListening: R, waitUntilFinished: F } = Ln(p, k), W = s.useCallback(
    (S) => new Promise((U, Z) => {
      const z = ($) => {
        $ && (J(), U($));
      }, G = () => {
        J(), Z(new Error("useAgent(/* ... */).waitUntilCamera - signal aborted"));
      }, J = () => {
        p.off("cameraChanged", z), S == null || S.removeEventListener("abort", G);
      };
      p.on("cameraChanged", z), S == null || S.addEventListener("abort", G);
    }),
    [p]
  ), se = s.useCallback(
    (S) => new Promise((U, Z) => {
      const z = ($) => {
        $ && (J(), U($));
      }, G = () => {
        J(), Z(new Error("useAgent(/* ... */).waitUntilMicrophone - signal aborted"));
      }, J = () => {
        p.off("microphoneChanged", z), S == null || S.removeEventListener("abort", G);
      };
      p.on("microphoneChanged", z), S == null || S.addEventListener("abort", G);
    }),
    [p]
  );
  return s.useMemo(() => ({
    ...te,
    waitUntilConnected: X,
    waitUntilCouldBeListening: R,
    waitUntilFinished: F,
    waitUntilCamera: W,
    waitUntilMicrophone: se
  }), [
    te,
    X,
    R,
    F,
    W,
    se
  ]);
}
var An = /* @__PURE__ */ ((e) => (e.ConnectionStateChanged = "connectionStateChanged", e.MediaDevicesError = "mediaDevicesError", e.EncryptionError = "encryptionError", e))(An || {});
function Rn(e, t) {
  const n = /* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(t)]);
  for (const r of n)
    switch (r) {
      case "roomName":
      case "participantName":
      case "participantIdentity":
      case "participantMetadata":
      case "participantAttributes":
      case "agentName":
      case "agentMetadata":
        if (e[r] !== t[r])
          return !1;
        break;
      default:
        const o = r;
        throw new Error(`Options key ${o} not being checked for equality!`);
    }
  return !0;
}
function Dn(e, t) {
  const n = s.useRef(t);
  return s.useEffect(() => {
    n.current = t;
  }, [t]), s.useCallback(
    async (o, i) => {
      if (n.current !== o)
        return new Promise((a, c) => {
          const u = (d) => {
            d === o && (p(), a());
          }, m = () => {
            p(), c(
              new Error(
                `useSession(/* ... */).waitUntilConnectionState(${o}, /* signal */) - signal aborted`
              )
            );
          }, p = () => {
            e.off("connectionStateChanged", u), i == null || i.removeEventListener("abort", m);
          };
          e.on("connectionStateChanged", u), i == null || i.addEventListener("abort", m);
        });
    },
    [e]
  );
}
function On(e, t) {
  const n = e instanceof Gt, r = s.useRef(
    n ? t : null
  );
  return s.useEffect(() => {
    if (!n) {
      r.current = null;
      return;
    }
    r.current !== null && Rn(r.current, t) || (r.current = t);
  }, [n, t]), s.useCallback(async () => {
    if (n) {
      if (!r.current)
        throw new Error(
          "AgentSession - memoized token fetch options are not set, but the passed tokenSource was an instance of TokenSourceConfigurable. If you are seeing this please make a new GitHub issue!"
        );
      return e.fetch(r.current);
    } else
      return e.fetch();
  }, [n, e]);
}
function kr(e, t = {}) {
  const { room: n, agentConnectTimeoutMilliseconds: r, ...o } = t, i = pe(), a = s.useMemo(
    () => i ?? n ?? new be(),
    [i, n]
  ), c = s.useMemo(
    () => new Se.EventEmitter(),
    []
  ), u = s.useCallback(
    (R) => ({
      isConnected: R === N.Connected || R === N.Reconnecting || R === N.SignalReconnecting
    }),
    []
  ), [m, p] = s.useState(a.state);
  s.useEffect(() => {
    const R = (F) => {
      p(F);
    };
    return a.on(I.ConnectionStateChanged, R), () => {
      a.off(I.ConnectionStateChanged, R);
    };
  }, [a]), s.useEffect(() => {
    const R = async (F) => {
      c.emit("mediaDevicesError", F);
    };
    return a.on(I.MediaDevicesError, R), () => {
      a.off(I.MediaDevicesError, R);
    };
  }, [a, c]), s.useEffect(() => {
    const R = async (F) => {
      c.emit("encryptionError", F);
    };
    return a.on(I.EncryptionError, R), () => {
      a.off(I.EncryptionError, R);
    };
  }, [a, c]);
  const { localParticipant: d } = Ve({ room: a }), l = d.getTrackPublication(P.Source.Camera), g = s.useMemo(() => {
    if (l)
      return {
        source: P.Source.Camera,
        participant: d,
        publication: l
      };
  }, [d, l]), E = d.getTrackPublication(P.Source.Microphone), w = s.useMemo(() => {
    if (E)
      return {
        source: P.Source.Microphone,
        participant: d,
        publication: E
      };
  }, [d, E]), L = d.getTrackPublication(P.Source.ScreenShare), M = s.useMemo(() => {
    if (L)
      return {
        source: P.Source.ScreenShare,
        participant: d,
        publication: L
      };
  }, [d, L]), {
    agentTimeoutFailureReason: O,
    startAgentTimeout: A,
    clearAgentTimeout: h,
    clearAgentTimeoutFailureReason: f,
    updateAgentTimeoutState: b,
    updateAgentTimeoutParticipantExists: v
  } = Pn(), y = s.useMemo(
    () => ({
      emitter: c,
      tokenSource: e,
      agentConnectTimeoutMilliseconds: r,
      agentTimeoutFailureReason: O,
      startAgentTimeout: A,
      clearAgentTimeout: h,
      clearAgentTimeoutFailureReason: f,
      updateAgentTimeoutState: b,
      updateAgentTimeoutParticipantExists: v
    }),
    [
      c,
      r,
      e,
      O,
      A,
      h,
      f,
      b,
      v
    ]
  ), T = s.useMemo(() => {
    const R = {
      room: a,
      internal: y
    };
    switch (m) {
      case N.Connecting:
        return {
          ...R,
          connectionState: N.Connecting,
          ...u(N.Connecting),
          local: {
            cameraTrack: void 0,
            microphoneTrack: void 0,
            screenShareTrack: void 0
          }
        };
      case N.Connected:
      case N.Reconnecting:
      case N.SignalReconnecting:
        return {
          ...R,
          connectionState: m,
          ...u(m),
          local: {
            cameraTrack: g,
            microphoneTrack: w,
            screenShareTrack: M
          }
        };
      case N.Disconnected:
        return {
          ...R,
          connectionState: N.Disconnected,
          ...u(N.Disconnected),
          local: {
            cameraTrack: void 0,
            microphoneTrack: void 0,
            screenShareTrack: void 0
          }
        };
    }
  }, [
    y,
    a,
    m,
    g,
    w,
    u
  ]);
  s.useEffect(() => {
    c.emit("connectionStateChanged", T.connectionState);
  }, [c, T.connectionState]);
  const C = Dn(
    c,
    T.connectionState
  ), k = s.useCallback(
    async (R) => C(
      N.Connected,
      R
    ),
    [C]
  ), x = s.useCallback(
    async (R) => C(N.Disconnected, R),
    [C]
  ), q = He(
    s.useMemo(
      () => ({
        connectionState: T.connectionState,
        room: a,
        internal: y
      }),
      [T, a, y]
    )
  ), j = On(e, o), Q = s.useCallback(
    async (R = {}) => {
      var Z, z, G, J, $, ye;
      const {
        signal: F,
        tracks: W = { microphone: { enabled: !0, publishOptions: { preConnectBuffer: !0 } } },
        roomConnectOptions: se
      } = R;
      await x(F);
      const S = () => {
        a.disconnect();
      };
      F == null || F.addEventListener("abort", S);
      let U = !1;
      await Promise.all([
        j().then(({ serverUrl: je, participantToken: Ce }) => {
          var Ee, Me;
          return U = (((Me = (Ee = zt(Ce).roomConfig) == null ? void 0 : Ee.agents) == null ? void 0 : Me.length) ?? 0) > 0, a.connect(je, Ce, se);
        }),
        // Start microphone (with preconnect buffer) by default
        (Z = W.microphone) != null && Z.enabled ? a.localParticipant.setMicrophoneEnabled(
          !0,
          void 0,
          ((z = W.microphone) == null ? void 0 : z.publishOptions) ?? {}
        ) : Promise.resolve(),
        (G = W.camera) != null && G.enabled ? a.localParticipant.setCameraEnabled(
          !0,
          void 0,
          ((J = W.camera) == null ? void 0 : J.publishOptions) ?? {}
        ) : Promise.resolve(),
        ($ = W.screenShare) != null && $.enabled ? a.localParticipant.setScreenShareEnabled(
          !0,
          void 0,
          ((ye = W.screenShare) == null ? void 0 : ye.publishOptions) ?? {}
        ) : Promise.resolve()
      ]), await k(F), U && await q.waitUntilConnected(F), F == null || F.removeEventListener("abort", S);
    },
    [a, x, j, k, q.waitUntilConnected]
  ), te = s.useCallback(async () => {
    await a.disconnect();
  }, [a]), X = s.useCallback(async () => {
    const R = await j();
    await a.prepareConnection(R.serverUrl, R.participantToken);
  }, [j, a]);
  return s.useEffect(
    () => {
      X().catch((R) => {
        console.warn("WARNING: Room.prepareConnection failed:", R);
      });
    },
    [
      /* note: no prepareConnection here, this effect should only ever run once! */
    ]
  ), s.useMemo(
    () => ({
      ...T,
      waitUntilConnected: k,
      waitUntilDisconnected: x,
      prepareConnection: X,
      start: Q,
      end: te
    }),
    [T, k, x, X, Q, te]
  );
}
function wr(e, t, n, r) {
  const o = s.useMemo(() => () => {
  }, []), i = s.useCallback(n ?? o, r ?? []), a = r ? i : n, c = s.useMemo(() => e ? "internal" in e ? e.internal.emitter : e : null, [e]);
  s.useEffect(() => {
    if (!(!c || !a))
      return c.on(t, a), () => {
        c.off(t, a);
      };
  }, [c, t, a]);
}
var Nn = /* @__PURE__ */ ((e) => (e.MessageReceived = "messageReceived", e))(Nn || {});
function Pr(e) {
  const { room: t } = Ht(e), n = s.useMemo(
    () => new Se.EventEmitter(),
    []
  ), r = He(e), o = Mn({ room: t }), i = s.useMemo(() => ({ room: t }), [t]), a = fn(i), c = s.useMemo(() => o.map((l) => {
    var g, E, w;
    switch (l.participantInfo.identity) {
      case t.localParticipant.identity:
        return {
          type: "userTranscript",
          message: l.text,
          id: l.streamInfo.id,
          timestamp: l.streamInfo.timestamp,
          from: t.localParticipant
        };
      case ((g = r.internal.agentParticipant) == null ? void 0 : g.identity):
      case ((E = r.internal.workerParticipant) == null ? void 0 : E.identity):
        return {
          type: "agentTranscript",
          message: l.text,
          id: l.streamInfo.id,
          timestamp: l.streamInfo.timestamp,
          from: ((w = r.internal.agentParticipant) == null ? void 0 : w.identity) === l.participantInfo.identity ? r.internal.agentParticipant : r.internal.workerParticipant
        };
      default:
        return {
          type: "agentTranscript",
          message: l.text,
          id: l.streamInfo.id,
          timestamp: l.streamInfo.timestamp,
          from: Array.from(t.remoteParticipants.values()).find(
            (L) => L.identity === l.participantInfo.identity
          )
        };
    }
  }), [o, t]), u = s.useMemo(() => [...c, ...a.chatMessages], [c, a.chatMessages]), m = s.useRef(/* @__PURE__ */ new Map()), p = s.useMemo(() => {
    const l = /* @__PURE__ */ new Date();
    for (const g of u)
      m.current.has(g.id) || m.current.set(g.id, l);
    return u.sort((g, E) => {
      const w = m.current.get(g.id), L = m.current.get(E.id);
      return typeof w > "u" || typeof L > "u" ? 0 : w.getTime() - L.getTime();
    });
  }, [u]), d = s.useRef(/* @__PURE__ */ new Set());
  return s.useEffect(() => {
    for (const l of p)
      d.current.has(l.id) || (d.current.add(l.id), n.emit("messageReceived", l));
  }, [p]), s.useMemo(
    () => ({
      messages: p,
      send: a.send,
      isSending: a.isSending,
      internal: { emitter: n }
    }),
    [p, a.send, a.isSending]
  );
}
export {
  ie as $,
  Kn as A,
  br as B,
  Zn as C,
  nn as D,
  B as E,
  Vn as F,
  Yn as G,
  rr as H,
  Ve as I,
  Hn as J,
  Bn as K,
  Zt as L,
  ke as M,
  en as N,
  on as O,
  tr as P,
  an as Q,
  sr as R,
  ve as S,
  ar as T,
  cn as U,
  dr as V,
  hr as W,
  wn as X,
  He as Y,
  vr as Z,
  yr as _,
  re as a,
  yn as a0,
  Er as a1,
  Cn as a2,
  Cr as a3,
  Mr as a4,
  En as a5,
  Mn as a6,
  Tr as a7,
  An as a8,
  kr as a9,
  wr as aa,
  Nn as ab,
  Pr as ac,
  lr as b,
  Wn as c,
  zn as d,
  Xn as e,
  ir as f,
  cr as g,
  mr as h,
  qn as i,
  D as j,
  fr as k,
  nr as l,
  Jn as m,
  gr as n,
  $n as o,
  Gn as p,
  er as q,
  ur as r,
  Yt as s,
  sn as t,
  jn as u,
  Qn as v,
  Sr as w,
  pr as x,
  or as y,
  fn as z
};
//# sourceMappingURL=room-BXkFS6wM.mjs.map
