import { Track as k, facingModeFromLocalTrack as ie, Mutex as oe, createLocalTracks as ue, createLocalVideoTrack as le, VideoPresets as de, createLocalAudioTrack as me, RoomEvent as fe } from "livekit-client";
import * as e from "react";
import { C as K, S as he, a as pe, M as B, b as ge, T as R, c as Ee, d as Se, D as H, e as ve, f as z, L as J, G as ke, P as G, F as be, g as Ce, h as we, R as Ie, i as ye, j as Pe, k as Me, B as Ne } from "./components-Dl8_KfwP.mjs";
import { i as Q, as as Te, at as Le, p as N, a as Ae, au as De, av as Re, $ as U, aw as Oe, ax as Ve } from "./contexts-BABOeQ4Z.mjs";
import { z as $e, o as _e, A as Fe, B as W, C as xe, D as Be, E as Ue, F as We, G as X, m as Y, x as Z, H as qe, I as je } from "./room-BXkFS6wM.mjs";
function ee({
  messageFormatter: r,
  messageDecoder: d,
  messageEncoder: u,
  channelTopic: n,
  ...S
}) {
  const g = e.useRef(null), m = e.useRef(null), l = e.useMemo(() => ({ messageDecoder: d, messageEncoder: u, channelTopic: n }), [d, u, n]), { chatMessages: c, send: y, isSending: t } = $e(l), h = Q(), i = e.useRef(0);
  async function v(s) {
    s.preventDefault(), m.current && m.current.value.trim() !== "" && (await y(m.current.value), m.current.value = "", m.current.focus());
  }
  return e.useEffect(() => {
    var s;
    g && ((s = g.current) == null || s.scrollTo({ top: g.current.scrollHeight }));
  }, [g, c]), e.useEffect(() => {
    var o, E, a, w, b;
    if (!h || c.length === 0)
      return;
    if ((o = h.widget.state) != null && o.showChat && c.length > 0 && i.current !== ((E = c[c.length - 1]) == null ? void 0 : E.timestamp)) {
      i.current = (a = c[c.length - 1]) == null ? void 0 : a.timestamp;
      return;
    }
    const s = c.filter(
      (A) => !i.current || A.timestamp > i.current
    ).length, { widget: f } = h;
    s > 0 && ((w = f.state) == null ? void 0 : w.unreadMessages) !== s && ((b = f.dispatch) == null || b.call(f, { msg: "unread_msg", count: s }));
  }, [c, h == null ? void 0 : h.widget]), /* @__PURE__ */ e.createElement("div", { ...S, className: "lk-chat" }, /* @__PURE__ */ e.createElement("div", { className: "lk-chat-header" }, "Сообщения", h && /* @__PURE__ */ e.createElement(K, { className: "lk-close-button" }, /* @__PURE__ */ e.createElement(he, null))), /* @__PURE__ */ e.createElement("ul", { className: "lk-list lk-chat-messages", ref: g }, S.children ? c.map(
    (s, f) => _e(S.children, {
      entry: s,
      key: s.id ?? f,
      messageFormatter: r
    })
  ) : c.map((s, f, o) => {
    const E = f >= 1 && o[f - 1].from === s.from, a = f >= 1 && s.timestamp - o[f - 1].timestamp < 6e4;
    return /* @__PURE__ */ e.createElement(
      pe,
      {
        key: s.id ?? f,
        hideName: E,
        hideTimestamp: E === !1 ? !1 : a,
        entry: s,
        messageFormatter: r
      }
    );
  })), /* @__PURE__ */ e.createElement("form", { className: "lk-chat-form", onSubmit: v }, /* @__PURE__ */ e.createElement(
    "input",
    {
      className: "lk-form-control lk-chat-form-input",
      disabled: t,
      ref: m,
      type: "text",
      placeholder: "Введите сообщение",
      onInput: (s) => s.stopPropagation(),
      onKeyDown: (s) => s.stopPropagation(),
      onKeyUp: (s) => s.stopPropagation()
    }
  ), /* @__PURE__ */ e.createElement("button", { type: "submit", className: "lk-button lk-chat-form-button", disabled: t }, "Отправить")));
}
function V({
  kind: r,
  initialSelection: d,
  onActiveDeviceChange: u,
  tracks: n,
  requestPermissions: S = !1,
  ...g
}) {
  const [m, l] = e.useState(!1), [c, y] = e.useState([]), [t, h] = e.useState(!0), [i, v] = e.useState(S), s = (a, w) => {
    N.debug("handle device change"), l(!1), u == null || u(a, w);
  }, f = e.useRef(null), o = e.useRef(null);
  e.useLayoutEffect(() => {
    m && v(!0);
  }, [m]), e.useLayoutEffect(() => {
    let a;
    return f.current && o.current && (c || t) && (a = Te(f.current, o.current, (w, b) => {
      o.current && Object.assign(o.current.style, { left: `${w}px`, top: `${b}px` });
    })), h(!1), () => {
      a == null || a();
    };
  }, [f, o, c, t]);
  const E = e.useCallback(
    (a) => {
      o.current && a.target !== f.current && m && Le(o.current, a) && l(!1);
    },
    [m, o, f]
  );
  return e.useEffect(() => (document.addEventListener("click", E), () => {
    document.removeEventListener("click", E);
  }), [E]), /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(
    "button",
    {
      className: "lk-button lk-button-menu",
      "aria-pressed": m,
      ...g,
      onClick: () => l(!m),
      ref: f
    },
    g.children
  ), !g.disabled && /* @__PURE__ */ e.createElement(
    "div",
    {
      className: "lk-device-menu",
      ref: o,
      style: { visibility: m ? "visible" : "hidden" }
    },
    r ? /* @__PURE__ */ e.createElement(
      B,
      {
        initialSelection: d,
        onActiveDeviceChange: (a) => s(r, a),
        onDeviceListChange: y,
        kind: r,
        track: n == null ? void 0 : n[r],
        requestPermissions: i
      }
    ) : /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("div", { className: "lk-device-menu-heading" }, "Аудио-устройства"), /* @__PURE__ */ e.createElement(
      B,
      {
        kind: "audioinput",
        onActiveDeviceChange: (a) => s("audioinput", a),
        onDeviceListChange: y,
        track: n == null ? void 0 : n.audioinput,
        requestPermissions: i
      }
    ), /* @__PURE__ */ e.createElement("div", { className: "lk-device-menu-heading" }, "Видео-устройства"), /* @__PURE__ */ e.createElement(
      B,
      {
        kind: "videoinput",
        onActiveDeviceChange: (a) => s("videoinput", a),
        onDeviceListChange: y,
        track: n == null ? void 0 : n.videoinput,
        requestPermissions: i
      }
    ))
  ));
}
function q() {
  e.useEffect(() => {
    Fe();
  }, []);
}
function Ge(r, d) {
  const [u, n] = e.useState(), S = e.useMemo(() => new oe(), []);
  return e.useEffect(() => {
    let g = !1, m = [];
    return S.lock().then(async (l) => {
      try {
        (r.audio || r.video) && (m = await ue(r), g ? m.forEach((c) => c.stop()) : n(m));
      } catch (c) {
        d && c instanceof Error ? d(c) : N.error(c);
      } finally {
        l();
      }
    }), () => {
      g = !0, m.forEach((l) => {
        l.stop();
      });
    };
  }, [JSON.stringify(r, Be), d, S]), u;
}
function Ze(r, d, u) {
  const [n, S] = e.useState(null), [g, m] = e.useState(!1), l = xe({ kind: u }), [c, y] = e.useState(
    void 0
  ), [t, h] = e.useState(), [i, v] = e.useState(d);
  e.useEffect(() => {
    v(d);
  }, [d]);
  const s = async (E, a) => {
    try {
      const w = a === "videoinput" ? await le({
        deviceId: E,
        resolution: de.h720.resolution
      }) : await me({ deviceId: E }), b = await w.getDeviceId(!1);
      b && E !== b && (o.current = b, v(b)), h(w);
    } catch (w) {
      w instanceof Error && S(w);
    }
  }, f = async (E, a) => {
    await E.setDeviceId(a), o.current = a;
  }, o = e.useRef(i);
  return e.useEffect(() => {
    r && !t && !n && !g && (N.debug("creating track", u), m(!0), s(i, u).finally(() => {
      m(!1);
    }));
  }, [r, t, n, g]), e.useEffect(() => {
    t && (r ? c != null && c.deviceId && o.current !== (c == null ? void 0 : c.deviceId) ? (N.debug(`switching ${u} device from`, o.current, c.deviceId), f(t, c.deviceId)) : (N.debug(`unmuting local ${u} track`), t.unmute()) : (N.debug(`muting ${u} track`), t.mute().then(() => N.debug(t.mediaStreamTrack))));
  }, [t, c, r, u]), e.useEffect(() => () => {
    t && (N.debug(`stopping local ${u} track`), t.stop(), t.mute());
  }, []), e.useEffect(() => {
    y(l == null ? void 0 : l.find((E) => E.deviceId === i));
  }, [i, l]), {
    selectedDevice: c,
    localTrack: t,
    deviceError: n
  };
}
function et({
  defaults: r = {},
  onValidate: d,
  onSubmit: u,
  onError: n,
  debug: S,
  joinLabel: g = "Войти в комнату",
  micLabel: m = "Микрофон",
  camLabel: l = "Камера",
  userLabel: c = "Имя пользователя",
  persistUserChoices: y = !0,
  videoProcessor: t,
  ...h
}) {
  const {
    userChoices: i,
    saveAudioInputDeviceId: v,
    saveAudioInputEnabled: s,
    saveVideoInputDeviceId: f,
    saveVideoInputEnabled: o,
    saveUsername: E
  } = W({
    defaults: r,
    preventSave: !y,
    preventLoad: !y
  }), [a, w] = e.useState(i), [b, A] = e.useState(a.audioEnabled), [I, L] = e.useState(a.videoEnabled), [T, $] = e.useState(a.audioDeviceId), [p, P] = e.useState(a.videoDeviceId), [O, ae] = e.useState(a.username);
  e.useEffect(() => {
    s(b);
  }, [b, s]), e.useEffect(() => {
    o(I);
  }, [I, o]), e.useEffect(() => {
    v(T);
  }, [T, v]), e.useEffect(() => {
    f(p);
  }, [p, f]), e.useEffect(() => {
    E(O);
  }, [O, E]);
  const D = Ge(
    {
      audio: b ? { deviceId: i.audioDeviceId } : !1,
      video: I ? { deviceId: i.videoDeviceId, processor: t } : !1
    },
    n
  ), _ = e.useRef(null), M = e.useMemo(
    () => D == null ? void 0 : D.filter((C) => C.kind === k.Kind.Video)[0],
    [D]
  ), ne = e.useMemo(() => {
    if (M) {
      const { facingMode: C } = ie(M);
      return C;
    } else
      return "undefined";
  }, [M]), j = e.useMemo(
    () => D == null ? void 0 : D.filter((C) => C.kind === k.Kind.Audio)[0],
    [D]
  );
  e.useEffect(() => (_.current && M && (M.unmute(), M.attach(_.current)), () => {
    M == null || M.detach();
  }), [M]);
  const [ce, se] = e.useState(), F = e.useCallback(
    (C) => typeof d == "function" ? d(C) : C.username !== "",
    [d]
  );
  e.useEffect(() => {
    const C = {
      username: O,
      videoEnabled: I,
      videoDeviceId: p,
      audioEnabled: b,
      audioDeviceId: T
    };
    w(C), se(F(C));
  }, [O, I, F, b, T, p]);
  function re(C) {
    C.preventDefault(), F(a) ? typeof u == "function" && u(a) : N.warn("Validation failed with: ", a);
  }
  return q(), /* @__PURE__ */ e.createElement("div", { className: "lk-prejoin", ...h }, /* @__PURE__ */ e.createElement("div", { className: "lk-video-container" }, M && /* @__PURE__ */ e.createElement("video", { ref: _, width: "1280", height: "720", "data-lk-facing-mode": ne }), (!M || !I) && /* @__PURE__ */ e.createElement("div", { className: "lk-camera-off-note" }, /* @__PURE__ */ e.createElement(ge, null))), /* @__PURE__ */ e.createElement("div", { className: "lk-button-group-container" }, /* @__PURE__ */ e.createElement("div", { className: "lk-button-group audio" }, /* @__PURE__ */ e.createElement(
    R,
    {
      initialState: b,
      source: k.Source.Microphone,
      onChange: (C) => A(C)
    },
    m
  ), /* @__PURE__ */ e.createElement("div", { className: "lk-button-group-menu" }, /* @__PURE__ */ e.createElement(
    V,
    {
      initialSelection: T,
      kind: "audioinput",
      disabled: !j,
      tracks: { audioinput: j },
      onActiveDeviceChange: (C, x) => $(x)
    }
  ))), /* @__PURE__ */ e.createElement("div", { className: "lk-button-group video" }, /* @__PURE__ */ e.createElement(
    R,
    {
      initialState: I,
      source: k.Source.Camera,
      onChange: (C) => L(C)
    },
    l
  ), /* @__PURE__ */ e.createElement("div", { className: "lk-button-group-menu" }, /* @__PURE__ */ e.createElement(
    V,
    {
      initialSelection: p,
      kind: "videoinput",
      disabled: !M,
      tracks: { videoinput: M },
      onActiveDeviceChange: (C, x) => P(x)
    }
  )))), /* @__PURE__ */ e.createElement("form", { className: "lk-username-container" }, /* @__PURE__ */ e.createElement(
    "input",
    {
      className: "lk-form-control",
      id: "username",
      name: "username",
      type: "text",
      defaultValue: O,
      placeholder: c,
      onChange: (C) => ae(C.target.value),
      autoComplete: "off"
    }
  ), /* @__PURE__ */ e.createElement(
    "button",
    {
      className: "lk-button lk-join-button",
      type: "submit",
      onClick: re,
      disabled: !ce
    },
    g
  )), S && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("strong", null, "Выбор пользователя:"), /* @__PURE__ */ e.createElement("ul", { className: "lk-list", style: { overflow: "hidden", maxWidth: "15rem" } }, /* @__PURE__ */ e.createElement("li", null, "Имя пользователя: ", `${a.username}`), /* @__PURE__ */ e.createElement("li", null, "Видео включено: ", `${a.videoEnabled}`), /* @__PURE__ */ e.createElement("li", null, "Аудио включено: ", `${a.audioEnabled}`), /* @__PURE__ */ e.createElement("li", null, "Видео-устройство: ", `${a.videoDeviceId}`), /* @__PURE__ */ e.createElement("li", null, "Аудио-устройство: ", `${a.audioDeviceId}`))));
}
function Ke({ props: r }) {
  const { dispatch: d, state: u } = Ae().widget, n = "lk-button lk-settings-toggle";
  return { mergedProps: e.useMemo(() => Ue(r, {
    className: n,
    onClick: () => {
      d && d({ msg: "toggle_settings" });
    },
    "aria-pressed": u != null && u.showSettings ? "true" : "false"
  }), [r, n, d, u]) };
}
const He = /* @__PURE__ */ e.forwardRef(
  function(d, u) {
    const { mergedProps: n } = Ke({ props: d });
    return /* @__PURE__ */ e.createElement("button", { ref: u, ...n }, d.children);
  }
), ze = (r) => {
  switch (r) {
    case k.Source.Camera:
      return 1;
    case k.Source.Microphone:
      return 2;
    case k.Source.ScreenShare:
      return 3;
    default:
      return 0;
  }
};
function te({
  variation: r,
  controls: d,
  saveUserChoices: u = !0,
  onDeviceError: n,
  ...S
}) {
  var $;
  const [g, m] = e.useState(!1), l = Q();
  e.useEffect(() => {
    var p, P;
    ((p = l == null ? void 0 : l.widget.state) == null ? void 0 : p.showChat) !== void 0 && m((P = l == null ? void 0 : l.widget.state) == null ? void 0 : P.showChat);
  }, [($ = l == null ? void 0 : l.widget.state) == null ? void 0 : $.showChat]);
  const y = We(`(max-width: ${g ? 1e3 : 760}px)`) ? "minimal" : "verbose";
  r ?? (r = y);
  const t = { leave: !0, ...d }, h = X();
  if (!h)
    t.camera = !1, t.chat = !1, t.microphone = !1, t.screenShare = !1;
  else {
    const p = (P) => h.canPublish && (h.canPublishSources.length === 0 || h.canPublishSources.includes(ze(P)));
    t.camera ?? (t.camera = p(k.Source.Camera)), t.microphone ?? (t.microphone = p(k.Source.Microphone)), t.screenShare ?? (t.screenShare = p(k.Source.ScreenShare)), t.chat ?? (t.chat = h.canPublishData && (d == null ? void 0 : d.chat));
  }
  const i = e.useMemo(
    () => r === "minimal" || r === "verbose",
    [r]
  ), v = e.useMemo(
    () => r === "textOnly" || r === "verbose",
    [r]
  ), s = De(), [f, o] = e.useState(!1), E = e.useCallback(
    (p) => {
      o(p);
    },
    [o]
  ), a = Y({ className: "lk-control-bar" }, S), {
    saveAudioInputEnabled: w,
    saveVideoInputEnabled: b,
    saveAudioInputDeviceId: A,
    saveVideoInputDeviceId: I
  } = W({ preventSave: !u }), L = e.useCallback(
    (p, P) => P ? w(p) : null,
    [w]
  ), T = e.useCallback(
    (p, P) => P ? b(p) : null,
    [b]
  );
  return /* @__PURE__ */ e.createElement("div", { ...a }, t.microphone && /* @__PURE__ */ e.createElement("div", { className: "lk-button-group" }, /* @__PURE__ */ e.createElement(
    R,
    {
      source: k.Source.Microphone,
      showIcon: i,
      onChange: L,
      onDeviceError: (p) => n == null ? void 0 : n({ source: k.Source.Microphone, error: p })
    },
    v && "Микрофон"
  ), /* @__PURE__ */ e.createElement("div", { className: "lk-button-group-menu" }, /* @__PURE__ */ e.createElement(
    V,
    {
      kind: "audioinput",
      onActiveDeviceChange: (p, P) => A(P ?? "default")
    }
  ))), t.camera && /* @__PURE__ */ e.createElement("div", { className: "lk-button-group" }, /* @__PURE__ */ e.createElement(
    R,
    {
      source: k.Source.Camera,
      showIcon: i,
      onChange: T,
      onDeviceError: (p) => n == null ? void 0 : n({ source: k.Source.Camera, error: p })
    },
    v && "Камера"
  ), /* @__PURE__ */ e.createElement("div", { className: "lk-button-group-menu" }, /* @__PURE__ */ e.createElement(
    V,
    {
      kind: "videoinput",
      onActiveDeviceChange: (p, P) => I(P ?? "default")
    }
  ))), t.screenShare && s && /* @__PURE__ */ e.createElement(
    R,
    {
      source: k.Source.ScreenShare,
      captureOptions: { audio: !0, selfBrowserSurface: "include" },
      showIcon: i,
      onChange: E,
      onDeviceError: (p) => n == null ? void 0 : n({ source: k.Source.ScreenShare, error: p })
    },
    v && (f ? "Остановить показ экрана" : "Поделиться экраном")
  ), t.chat && /* @__PURE__ */ e.createElement(K, null, i && /* @__PURE__ */ e.createElement(Ee, null), v && "Чат"), t.settings && /* @__PURE__ */ e.createElement(He, null, i && /* @__PURE__ */ e.createElement(Se, null), v && "Настройки"), t.leave && /* @__PURE__ */ e.createElement(H, null, i && /* @__PURE__ */ e.createElement(ve, null), v && "Выйти"), /* @__PURE__ */ e.createElement(z, null));
}
function tt({
  chatMessageFormatter: r,
  chatMessageDecoder: d,
  chatMessageEncoder: u,
  SettingsComponent: n,
  ...S
}) {
  var s, f;
  const [g, m] = e.useState({
    showChat: !1,
    unreadMessages: 0,
    showSettings: !1
  }), l = e.useRef(null), c = Z(
    [
      { source: k.Source.Camera, withPlaceholder: !0 },
      { source: k.Source.ScreenShare, withPlaceholder: !1 }
    ],
    { updateOnlyOn: [fe.ActiveSpeakersChanged], onlySubscribed: !1 }
  ), y = (o) => {
    N.debug("updating widget state", o), m(o);
  }, t = Re(), h = c.filter(U).filter((o) => o.publication.source === k.Source.ScreenShare), i = (s = qe(t)) == null ? void 0 : s[0], v = c.filter((o) => !Oe(o, i));
  return e.useEffect(() => {
    var o, E, a, w, b, A;
    if (h.some((I) => I.publication.isSubscribed) && l.current === null ? (N.debug("Auto set screen share focus:", { newScreenShareTrack: h[0] }), (E = (o = t.pin).dispatch) == null || E.call(o, { msg: "set_pin", trackReference: h[0] }), l.current = h[0]) : l.current && !h.some(
      (I) => {
        var L, T;
        return I.publication.trackSid === ((T = (L = l.current) == null ? void 0 : L.publication) == null ? void 0 : T.trackSid);
      }
    ) && (N.debug("Auto clearing screen share focus."), (w = (a = t.pin).dispatch) == null || w.call(a, { msg: "clear_pin" }), l.current = null), i && !U(i)) {
      const I = c.find(
        (L) => L.participant.identity === i.participant.identity && L.source === i.source
      );
      I !== i && U(I) && ((A = (b = t.pin).dispatch) == null || A.call(b, { msg: "set_pin", trackReference: I }));
    }
  }, [
    h.map((o) => `${o.publication.trackSid}_${o.publication.isSubscribed}`).join(),
    (f = i == null ? void 0 : i.publication) == null ? void 0 : f.trackSid,
    c
  ]), q(), /* @__PURE__ */ e.createElement("div", { className: "lk-video-conference", ...S }, Ve() && /* @__PURE__ */ e.createElement(
    J,
    {
      value: t,
      onWidgetChange: y
    },
    /* @__PURE__ */ e.createElement("div", { className: "lk-video-conference-inner" }, i ? /* @__PURE__ */ e.createElement("div", { className: "lk-focus-layout-wrapper" }, /* @__PURE__ */ e.createElement(be, null, /* @__PURE__ */ e.createElement(Ce, { tracks: v }, /* @__PURE__ */ e.createElement(G, null)), i && /* @__PURE__ */ e.createElement(we, { trackRef: i }))) : /* @__PURE__ */ e.createElement("div", { className: "lk-grid-layout-wrapper" }, /* @__PURE__ */ e.createElement(ke, { tracks: c }, /* @__PURE__ */ e.createElement(G, null))), /* @__PURE__ */ e.createElement(te, { controls: { chat: !0, settings: !!n } })),
    /* @__PURE__ */ e.createElement(
      ee,
      {
        style: { display: g.showChat ? "grid" : "none" },
        messageFormatter: r,
        messageEncoder: u,
        messageDecoder: d
      }
    ),
    n && /* @__PURE__ */ e.createElement(
      "div",
      {
        className: "lk-settings-menu-modal",
        style: { display: g.showSettings ? "block" : "none" }
      },
      /* @__PURE__ */ e.createElement(n, null)
    )
  ), /* @__PURE__ */ e.createElement(Ie, null), /* @__PURE__ */ e.createElement(ye, null));
}
function at({ ...r }) {
  const [d, u] = e.useState({
    showChat: !1,
    unreadMessages: 0
  }), n = Z([k.Source.Microphone]);
  return q(), /* @__PURE__ */ e.createElement(J, { onWidgetChange: u }, /* @__PURE__ */ e.createElement("div", { className: "lk-audio-conference", ...r }, /* @__PURE__ */ e.createElement("div", { className: "lk-audio-conference-stage" }, /* @__PURE__ */ e.createElement(Pe, { tracks: n }, /* @__PURE__ */ e.createElement(Me, null))), /* @__PURE__ */ e.createElement(
    te,
    {
      controls: { microphone: !0, screenShare: !1, camera: !1, chat: !0 }
    }
  ), d.showChat && /* @__PURE__ */ e.createElement(ee, null)));
}
function nt({
  controls: r,
  saveUserChoices: d = !0,
  onDeviceError: u,
  ...n
}) {
  const S = { leave: !0, microphone: !0, ...r }, g = X(), { microphoneTrack: m, localParticipant: l } = je(), c = e.useMemo(() => ({
    participant: l,
    source: k.Source.Microphone,
    publication: m
  }), [l, m]);
  g ? S.microphone ?? (S.microphone = g.canPublish) : S.microphone = !1;
  const y = Y({ className: "lk-agent-control-bar" }, n), { saveAudioInputEnabled: t, saveAudioInputDeviceId: h } = W({
    preventSave: !d
  }), i = e.useCallback(
    (v, s) => {
      s && t(v);
    },
    [t]
  );
  return /* @__PURE__ */ e.createElement("div", { ...y }, S.microphone && /* @__PURE__ */ e.createElement("div", { className: "lk-button-group" }, /* @__PURE__ */ e.createElement(
    R,
    {
      source: k.Source.Microphone,
      showIcon: !0,
      onChange: i,
      onDeviceError: (v) => u == null ? void 0 : u({ source: k.Source.Microphone, error: v })
    },
    /* @__PURE__ */ e.createElement(Ne, { trackRef: c, barCount: 7, options: { minHeight: 5 } })
  ), /* @__PURE__ */ e.createElement("div", { className: "lk-button-group-menu" }, /* @__PURE__ */ e.createElement(
    V,
    {
      kind: "audioinput",
      onActiveDeviceChange: (v, s) => h(s ?? "default")
    }
  ))), S.leave && /* @__PURE__ */ e.createElement(H, null, "Отключиться"), /* @__PURE__ */ e.createElement(z, null));
}
export {
  at as A,
  ee as C,
  V as M,
  et as P,
  tt as V,
  Ge as a,
  te as b,
  nt as c,
  Ze as u
};
//# sourceMappingURL=prefabs-C0OZ4byT.mjs.map
