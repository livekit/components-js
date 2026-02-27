import * as e from "react";
import { useState as B, useRef as z, useEffect as F, useMemo as Ne } from "react";
import { u as ze, a as he, b as Fe, c as Ve, d as Ze, e as He, m as I, f as ge, g as Be, h as je, i as _e, j as Oe, k as We, l as ve, n as qe, o as ee, p as $e, q as De, r as Ue, s as Ge, t as Qe, v as Ke, w as Ee, x as Je, y as Xe } from "./room-BXkFS6wM.mjs";
import { RoomEvent as Ye, Track as S, ConnectionQuality as Q, RemoteTrackPublication as X, RemoteAudioTrack as et, ConnectionState as K } from "livekit-client";
import { ac as te, ad as pe, w as tt, u as at, e as nt, b as rt, ae as ct, V as lt, W as st, $, p as j, af as q, ag as it, h as _, B as ot, ah as we, ai as ae, i as ut, aj as dt, k as mt, n as ke, ak as ft, al as ht, am as gt, an as Re, ao as vt, ap as Et, aq as pt, ar as wt } from "./contexts-BABOeQ4Z.mjs";
const la = /* @__PURE__ */ e.forwardRef(
  function(n, a) {
    const { buttonProps: c } = ze(n);
    return /* @__PURE__ */ e.createElement("button", { ref: a, ...c }, n.children);
  }
), sa = /* @__PURE__ */ e.forwardRef(
  function({ room: n, ...a }, c) {
    const r = he(n);
    return /* @__PURE__ */ e.createElement("div", { ref: c, ...a }, r);
  }
), ia = /* @__PURE__ */ e.forwardRef(
  function(n, a) {
    const { mergedProps: c } = Fe({ props: n });
    return /* @__PURE__ */ e.createElement("button", { ref: a, ...c }, n.children);
  }
), oa = /* @__PURE__ */ e.forwardRef(
  function(n, a) {
    const { buttonProps: c } = Ve(n);
    return /* @__PURE__ */ e.createElement("button", { ref: a, ...c }, n.children);
  }
), kt = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "currentColor", ...t }, /* @__PURE__ */ e.createElement("path", { d: "M1.354.646a.5.5 0 1 0-.708.708l14 14a.5.5 0 0 0 .708-.708L11 10.293V4.5A1.5 1.5 0 0 0 9.5 3H3.707zM0 4.5a1.5 1.5 0 0 1 .943-1.393l9.532 9.533c-.262.224-.603.36-.975.36h-8A1.5 1.5 0 0 1 0 11.5z" }), /* @__PURE__ */ e.createElement("path", { d: "m15.2 3.6-2.8 2.1a1 1 0 0 0-.4.8v3a1 1 0 0 0 .4.8l2.8 2.1a.5.5 0 0 0 .8-.4V4a.5.5 0 0 0-.8-.4z" })), Rt = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "currentColor", ...t }, /* @__PURE__ */ e.createElement("path", { d: "M0 4.5A1.5 1.5 0 0 1 1.5 3h8A1.5 1.5 0 0 1 11 4.5v7A1.5 1.5 0 0 1 9.5 13h-8A1.5 1.5 0 0 1 0 11.5zM15.2 3.6l-2.8 2.1a1 1 0 0 0-.4.8v3a1 1 0 0 0 .4.8l2.8 2.1a.5.5 0 0 0 .8-.4V4a.5.5 0 0 0-.8-.4z" })), ua = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, viewBox: "0 0 24 24", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "#FFF",
    d: "M4.99 3.99a1 1 0 0 0-.697 1.717L10.586 12l-6.293 6.293a1 1 0 1 0 1.414 1.414L12 13.414l6.293 6.293a1 1 0 1 0 1.414-1.414L13.414 12l6.293-6.293a1 1 0 0 0-.727-1.717 1 1 0 0 0-.687.303L12 10.586 5.707 4.293a1 1 0 0 0-.717-.303z"
  }
)), da = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 18, fill: "none", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M0 2.75A2.75 2.75 0 0 1 2.75 0h10.5A2.75 2.75 0 0 1 16 2.75v13.594a.75.75 0 0 1-1.234.572l-3.691-3.12a1.25 1.25 0 0 0-.807-.296H2.75A2.75 2.75 0 0 1 0 10.75v-8ZM2.75 1.5c-.69 0-1.25.56-1.25 1.25v8c0 .69.56 1.25 1.25 1.25h7.518c.65 0 1.279.23 1.775.65l2.457 2.077V2.75c0-.69-.56-1.25-1.25-1.25H2.75Z",
    clipRule: "evenodd"
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5Zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5Zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z",
    clipRule: "evenodd"
  }
)), ie = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentcolor",
    fillRule: "evenodd",
    d: "M5.293 2.293a1 1 0 0 1 1.414 0l4.823 4.823a1.25 1.25 0 0 1 0 1.768l-4.823 4.823a1 1 0 0 1-1.414-1.414L9.586 8 5.293 3.707a1 1 0 0 1 0-1.414z",
    clipRule: "evenodd"
  }
)), Mt = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement("g", { stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5 }, /* @__PURE__ */ e.createElement("path", { d: "M10 1.75h4.25m0 0V6m0-4.25L9 7M6 14.25H1.75m0 0V10m0 4.25L7 9" }))), ma = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentcolor",
    fillRule: "evenodd",
    d: "M8.961.894C8.875-.298 7.125-.298 7.04.894c-.066.912-1.246 1.228-1.76.472-.67-.99-2.186-.115-1.664.96.399.824-.465 1.688-1.288 1.289-1.076-.522-1.95.994-.961 1.665.756.513.44 1.693-.472 1.759-1.192.086-1.192 1.836 0 1.922.912.066 1.228 1.246.472 1.76-.99.67-.115 2.186.96 1.664.824-.399 1.688.465 1.289 1.288-.522 1.076.994 1.95 1.665.961.513-.756 1.693-.44 1.759.472.086 1.192 1.836 1.192 1.922 0 .066-.912 1.246-1.228 1.76-.472.67.99 2.186.115 1.664-.96-.399-.824.465-1.688 1.288-1.289 1.076.522 1.95-.994.961-1.665-.756-.513-.44-1.693.472-1.759 1.192-.086 1.192-1.836 0-1.922-.912-.066-1.228-1.246-.472-1.76.99-.67.115-2.186-.96-1.664-.824.399-1.688-.465-1.289-1.288.522-1.076-.994-1.95-1.665-.961-.513.756-1.693.44-1.759-.472ZM8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10Z",
    clipRule: "evenodd"
  }
)), fa = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M2 2.75A2.75 2.75 0 0 1 4.75 0h6.5A2.75 2.75 0 0 1 14 2.75v10.5A2.75 2.75 0 0 1 11.25 16h-6.5A2.75 2.75 0 0 1 2 13.25v-.5a.75.75 0 0 1 1.5 0v.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25h-6.5c-.69 0-1.25.56-1.25 1.25v.5a.75.75 0 0 1-1.5 0v-.5Z",
    clipRule: "evenodd"
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M8.78 7.47a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H1.75a.75.75 0 0 1 0-1.5h4.69l-.97-.97a.75.75 0 0 1 1.06-1.06l2.25 2.25Z",
    clipRule: "evenodd"
  }
)), yt = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentcolor",
    fillRule: "evenodd",
    d: "M4 6.104V4a4 4 0 1 1 8 0v2.104c1.154.326 2 1.387 2 2.646v4.5A2.75 2.75 0 0 1 11.25 16h-6.5A2.75 2.75 0 0 1 2 13.25v-4.5c0-1.259.846-2.32 2-2.646ZM5.5 4a2.5 2.5 0 0 1 5 0v2h-5V4Z",
    clipRule: "evenodd"
  }
)), bt = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "currentColor", ...t }, /* @__PURE__ */ e.createElement("path", { d: "M12.227 11.52a5.477 5.477 0 0 0 1.246-2.97.5.5 0 0 0-.995-.1 4.478 4.478 0 0 1-.962 2.359l-1.07-1.07C10.794 9.247 11 8.647 11 8V3a3 3 0 0 0-6 0v1.293L1.354.646a.5.5 0 1 0-.708.708l14 14a.5.5 0 0 0 .708-.708zM8 12.5c.683 0 1.33-.152 1.911-.425l.743.743c-.649.359-1.378.59-2.154.66V15h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-1.522a5.502 5.502 0 0 1-4.973-4.929.5.5 0 0 1 .995-.098A4.5 4.5 0 0 0 8 12.5z" }), /* @__PURE__ */ e.createElement("path", { d: "M8.743 10.907 5 7.164V8a3 3 0 0 0 3.743 2.907z" })), St = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "currentColor", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fillRule: "evenodd",
    d: "M2.975 8.002a.5.5 0 0 1 .547.449 4.5 4.5 0 0 0 8.956 0 .5.5 0 1 1 .995.098A5.502 5.502 0 0 1 8.5 13.478V15h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-1.522a5.502 5.502 0 0 1-4.973-4.929.5.5 0 0 1 .448-.547z",
    clipRule: "evenodd"
  }
), /* @__PURE__ */ e.createElement("path", { d: "M5 3a3 3 0 1 1 6 0v5a3 3 0 0 1-6 0z" })), Ct = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "currentcolor", ...t }, /* @__PURE__ */ e.createElement("path", { d: "M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-6a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }), /* @__PURE__ */ e.createElement("path", { d: "M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-6a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" })), It = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "currentcolor", ...t }, /* @__PURE__ */ e.createElement("path", { d: "M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }), /* @__PURE__ */ e.createElement("path", { d: "M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }), /* @__PURE__ */ e.createElement("g", { opacity: 0.25 }, /* @__PURE__ */ e.createElement("path", { d: "M12 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }), /* @__PURE__ */ e.createElement("path", { d: "M12 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }))), xt = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "currentcolor", ...t }, /* @__PURE__ */ e.createElement("path", { d: "M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }), /* @__PURE__ */ e.createElement("path", { d: "M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }), /* @__PURE__ */ e.createElement("g", { opacity: 0.25 }, /* @__PURE__ */ e.createElement("path", { d: "M6 6.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }), /* @__PURE__ */ e.createElement("path", { d: "M6 6.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-6a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }), /* @__PURE__ */ e.createElement("path", { d: "M12 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" }))), Pt = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "currentColor", ...t }, /* @__PURE__ */ e.createElement("g", { opacity: 0.25 }, /* @__PURE__ */ e.createElement("path", { d: "M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4Zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-9Zm6-6a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V.5Z" }), /* @__PURE__ */ e.createElement("path", { d: "M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4Zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-9Zm6-6a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V.5Z" }))), Me = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 20, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M0 2.75A2.75 2.75 0 0 1 2.75 0h14.5A2.75 2.75 0 0 1 20 2.75v10.5A2.75 2.75 0 0 1 17.25 16H2.75A2.75 2.75 0 0 1 0 13.25V2.75ZM2.75 1.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h14.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25H2.75Z",
    clipRule: "evenodd"
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M9.47 4.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1-1.06 1.06l-.97-.97v4.69a.75.75 0 0 1-1.5 0V6.56l-.97.97a.75.75 0 0 1-1.06-1.06l2.25-2.25Z",
    clipRule: "evenodd"
  }
)), Tt = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 20, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement("g", { fill: "currentColor" }, /* @__PURE__ */ e.createElement("path", { d: "M7.28 4.22a.75.75 0 0 0-1.06 1.06L8.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 6.94z" }), /* @__PURE__ */ e.createElement(
  "path",
  {
    fillRule: "evenodd",
    d: "M2.75 0A2.75 2.75 0 0 0 0 2.75v10.5A2.75 2.75 0 0 0 2.75 16h14.5A2.75 2.75 0 0 0 20 13.25V2.75A2.75 2.75 0 0 0 17.25 0zM1.5 2.75c0-.69.56-1.25 1.25-1.25h14.5c.69 0 1.25.56 1.25 1.25v10.5c0 .69-.56 1.25-1.25 1.25H2.75c-.69 0-1.25-.56-1.25-1.25z",
    clipRule: "evenodd"
  }
))), oe = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M8 0a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0Z",
    clipRule: "evenodd"
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M8 12a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 12Z",
    clipRule: "evenodd",
    opacity: 0.7
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M12 1.072a.75.75 0 0 1 .274 1.024l-1.25 2.165a.75.75 0 0 1-1.299-.75l1.25-2.165A.75.75 0 0 1 12 1.072Z",
    clipRule: "evenodd"
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M6 11.464a.75.75 0 0 1 .274 1.025l-1.25 2.165a.75.75 0 0 1-1.299-.75l1.25-2.165A.75.75 0 0 1 6 11.464Z",
    clipRule: "evenodd",
    opacity: 0.6
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M14.928 4a.75.75 0 0 1-.274 1.025l-2.165 1.25a.75.75 0 1 1-.75-1.3l2.165-1.25A.75.75 0 0 1 14.928 4Z",
    clipRule: "evenodd"
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M4.536 10a.75.75 0 0 1-.275 1.024l-2.165 1.25a.75.75 0 0 1-.75-1.298l2.165-1.25A.75.75 0 0 1 4.536 10Z",
    clipRule: "evenodd",
    opacity: 0.5
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M16 8a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h2.5A.75.75 0 0 1 16 8Z",
    clipRule: "evenodd"
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M4 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h2.5A.75.75 0 0 1 4 8Z",
    clipRule: "evenodd",
    opacity: 0.4
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M14.928 12a.75.75 0 0 1-1.024.274l-2.165-1.25a.75.75 0 0 1 .75-1.299l2.165 1.25A.75.75 0 0 1 14.928 12Z",
    clipRule: "evenodd",
    opacity: 0.9
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M4.536 6a.75.75 0 0 1-1.025.275l-2.165-1.25a.75.75 0 1 1 .75-1.3l2.165 1.25A.75.75 0 0 1 4.536 6Z",
    clipRule: "evenodd",
    opacity: 0.3
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M12 14.928a.75.75 0 0 1-1.024-.274l-1.25-2.165a.75.75 0 0 1 1.298-.75l1.25 2.165A.75.75 0 0 1 12 14.928Z",
    clipRule: "evenodd",
    opacity: 0.8
  }
), /* @__PURE__ */ e.createElement(
  "path",
  {
    fill: "currentColor",
    fillRule: "evenodd",
    d: "M6 4.536a.75.75 0 0 1-1.024-.275l-1.25-2.165a.75.75 0 1 1 1.299-.75l1.25 2.165A.75.75 0 0 1 6 4.536Z",
    clipRule: "evenodd",
    opacity: 0.2
  }
)), At = (t) => /* @__PURE__ */ e.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 16, height: 16, fill: "none", ...t }, /* @__PURE__ */ e.createElement("g", { stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5 }, /* @__PURE__ */ e.createElement("path", { d: "M13.25 7H9m0 0V2.75M9 7l5.25-5.25M2.75 9H7m0 0v4.25M7 9l-5.25 5.25" }))), Lt = /* @__PURE__ */ e.forwardRef(
  function({ trackRef: n, ...a }, c) {
    const r = te(), { mergedProps: s, inFocus: o } = Ze({
      trackRef: n ?? r,
      props: a
    });
    return /* @__PURE__ */ e.createElement(pe.Consumer, null, (l) => l !== void 0 && /* @__PURE__ */ e.createElement("button", { ref: c, ...s }, a.children ? a.children : o ? /* @__PURE__ */ e.createElement(At, null) : /* @__PURE__ */ e.createElement(Mt, null)));
  }
), ha = /* @__PURE__ */ e.forwardRef(
  function({
    kind: n,
    initialSelection: a,
    onActiveDeviceChange: c,
    onDeviceListChange: r,
    onDeviceSelectError: s,
    exactMatch: o,
    track: l,
    requestPermissions: i,
    onError: d,
    ...u
  }, v) {
    const f = tt(), p = e.useRef("default"), E = e.useCallback(
      (w) => {
        f && f.emit(Ye.MediaDevicesError, w), d == null || d(w);
      },
      [f, d]
    ), { devices: h, activeDeviceId: m, setActiveMediaDevice: y, className: C } = He({
      kind: n,
      room: f,
      track: l,
      requestPermissions: i,
      onError: E
    });
    e.useEffect(() => {
      a !== void 0 && y(a);
    }, [y]), e.useEffect(() => {
      typeof r == "function" && r(h);
    }, [r, h]), e.useEffect(() => {
      m !== p.current && (c == null || c(m)), p.current = m;
    }, [m]);
    const A = async (w) => {
      try {
        await y(w, { exact: o ?? !0 });
      } catch (M) {
        if (M instanceof Error)
          s == null || s(M);
        else
          throw M;
      }
    }, L = e.useMemo(
      () => I(u, { className: C }, { className: "lk-list" }),
      [C, u]
    ), g = !!h.find((w) => w.label.toLowerCase().startsWith("default"));
    function R(w, M, P) {
      return w === M || !g && P === 0 && M === "default";
    }
    return /* @__PURE__ */ e.createElement("ul", { ref: v, ...L }, h.map((w, M) => /* @__PURE__ */ e.createElement(
      "li",
      {
        key: w.deviceId,
        id: w.deviceId,
        "data-lk-active": R(w.deviceId, m, M),
        "aria-selected": R(w.deviceId, m, M),
        role: "option"
      },
      /* @__PURE__ */ e.createElement("button", { className: "lk-button", onClick: () => A(w.deviceId) }, w.label)
    )));
  }
), ga = /* @__PURE__ */ e.forwardRef(
  function({ label: n = "Разрешить звук", ...a }, c) {
    const r = at(a.room), { mergedProps: s } = ge({ room: r, props: a });
    return /* @__PURE__ */ e.createElement("button", { ref: c, ...s }, n);
  }
), va = /* @__PURE__ */ e.forwardRef(
  function({ label: n, ...a }, c) {
    const r = nt(), { mergedProps: s, canPlayAudio: o } = ge({ room: r, props: a }), { mergedProps: l, canPlayVideo: i } = Be({ room: r, props: s }), { style: d, ...u } = l;
    return d.display = o && i ? "none" : "block", /* @__PURE__ */ e.createElement("button", { ref: c, style: d, ...u }, n ?? `Включить ${o ? "Видео" : "Звук"}`);
  }
);
function ye(t, n) {
  switch (t) {
    case S.Source.Microphone:
      return n ? /* @__PURE__ */ e.createElement(St, null) : /* @__PURE__ */ e.createElement(bt, null);
    case S.Source.Camera:
      return n ? /* @__PURE__ */ e.createElement(Rt, null) : /* @__PURE__ */ e.createElement(kt, null);
    case S.Source.ScreenShare:
      return n ? /* @__PURE__ */ e.createElement(Tt, null) : /* @__PURE__ */ e.createElement(Me, null);
    default:
      return;
  }
}
function Nt(t) {
  switch (t) {
    case Q.Excellent:
      return /* @__PURE__ */ e.createElement(Ct, null);
    case Q.Good:
      return /* @__PURE__ */ e.createElement(It, null);
    case Q.Poor:
      return /* @__PURE__ */ e.createElement(xt, null);
    default:
      return /* @__PURE__ */ e.createElement(Pt, null);
  }
}
const Ea = /* @__PURE__ */ e.forwardRef(function({ showIcon: n, ...a }, c) {
  const { buttonProps: r, enabled: s } = je(a), [o, l] = e.useState(!1);
  return e.useEffect(() => {
    l(!0);
  }, []), o && /* @__PURE__ */ e.createElement("button", { ref: c, ...r }, (n ?? !0) && ye(a.source, s), a.children);
}), be = /* @__PURE__ */ e.forwardRef(function(n, a) {
  const { className: c, quality: r } = _e(n), s = e.useMemo(() => ({ ...I(n, { className: c }), "data-lk-quality": r }), [r, n, c]);
  return /* @__PURE__ */ e.createElement("div", { ref: a, ...s }, n.children ?? Nt(r));
}), Y = /* @__PURE__ */ e.forwardRef(
  function({ participant: n, ...a }, c) {
    const r = rt(n), { className: s, infoObserver: o } = e.useMemo(() => ct(r), [r]), { identity: l, name: i } = Oe(o, {
      name: r.name,
      identity: r.identity,
      metadata: r.metadata
    }), d = e.useMemo(() => I(a, { className: s, "data-lk-participant-name": i }), [a, s, i]);
    return /* @__PURE__ */ e.createElement("span", { ref: c, ...d }, i !== "" ? i : l, a.children);
  }
), Se = /* @__PURE__ */ e.forwardRef(
  function({ trackRef: n, show: a = "always", ...c }, r) {
    const { className: s, isMuted: o } = We(n), l = a === "always" || a === "muted" && o || a === "unmuted" && !o, i = e.useMemo(
      () => I(c, {
        className: s
      }),
      [s, c]
    );
    return l ? /* @__PURE__ */ e.createElement("div", { ref: r, ...i, "data-lk-muted": o }, c.children ?? ye(n.source, !o)) : null;
  }
), zt = (t) => /* @__PURE__ */ e.createElement(
  "svg",
  {
    width: 320,
    height: 320,
    viewBox: "0 0 320 320",
    preserveAspectRatio: "xMidYMid meet",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...t
  },
  /* @__PURE__ */ e.createElement(
    "path",
    {
      d: "M160 180C204.182 180 240 144.183 240 100C240 55.8172 204.182 20 160 20C115.817 20 79.9997 55.8172 79.9997 100C79.9997 144.183 115.817 180 160 180Z",
      fill: "white",
      fillOpacity: 0.25
    }
  ),
  /* @__PURE__ */ e.createElement(
    "path",
    {
      d: "M97.6542 194.614C103.267 191.818 109.841 192.481 115.519 195.141C129.025 201.466 144.1 205 159.999 205C175.899 205 190.973 201.466 204.48 195.141C210.158 192.481 216.732 191.818 222.345 194.614C262.703 214.719 291.985 253.736 298.591 300.062C300.15 310.997 291.045 320 280 320H39.9997C28.954 320 19.8495 310.997 21.4087 300.062C28.014 253.736 57.2966 214.72 97.6542 194.614Z",
      fill: "white",
      fillOpacity: 0.25
    }
  )
);
function Ce(t, n = {}) {
  const [a, c] = e.useState(lt(t)), [r, s] = e.useState(a == null ? void 0 : a.isMuted), [o, l] = e.useState(a == null ? void 0 : a.isSubscribed), [i, d] = e.useState(a == null ? void 0 : a.track), [u, v] = e.useState("landscape"), f = e.useRef(), { className: p, trackObserver: E } = e.useMemo(() => st(t), [
    t.participant.sid ?? t.participant.identity,
    t.source,
    $(t) && t.publication.trackSid
  ]);
  return e.useEffect(() => {
    const h = E.subscribe((m) => {
      j.debug("update track", m), c(m), s(m == null ? void 0 : m.isMuted), l(m == null ? void 0 : m.isSubscribed), d(m == null ? void 0 : m.track);
    });
    return () => h == null ? void 0 : h.unsubscribe();
  }, [E]), e.useEffect(() => {
    var h, m;
    return i && (f.current && i.detach(f.current), (h = n.element) != null && h.current && !(t.participant.isLocal && (i == null ? void 0 : i.kind) === "audio") && i.attach(n.element.current)), f.current = (m = n.element) == null ? void 0 : m.current, () => {
      f.current && (i == null || i.detach(f.current));
    };
  }, [i, n.element]), e.useEffect(() => {
    var h, m;
    if (typeof ((h = a == null ? void 0 : a.dimensions) == null ? void 0 : h.width) == "number" && typeof ((m = a == null ? void 0 : a.dimensions) == null ? void 0 : m.height) == "number") {
      const y = a.dimensions.width > a.dimensions.height ? "landscape" : "portrait";
      v(y);
    }
  }, [a]), {
    publication: a,
    isMuted: r,
    isSubscribed: o,
    track: i,
    elementProps: I(n.props, {
      className: p,
      "data-lk-local-participant": t.participant.isLocal,
      "data-lk-source": a == null ? void 0 : a.source,
      ...(a == null ? void 0 : a.kind) === "video" && { "data-lk-orientation": u }
    })
  };
}
var J, ue;
function Ft() {
  if (ue) return J;
  ue = 1;
  var t = "Expected a function", n = NaN, a = "[object Symbol]", c = /^\s+|\s+$/g, r = /^[-+]0x[0-9a-f]+$/i, s = /^0b[01]+$/i, o = /^0o[0-7]+$/i, l = parseInt, i = typeof q == "object" && q && q.Object === Object && q, d = typeof self == "object" && self && self.Object === Object && self, u = i || d || Function("return this")(), v = Object.prototype, f = v.toString, p = Math.max, E = Math.min, h = function() {
    return u.Date.now();
  };
  function m(g, R, w) {
    var M, P, O, N, b, T, V = 0, re = !1, Z = !1, D = !0;
    if (typeof g != "function")
      throw new TypeError(t);
    R = L(R) || 0, y(w) && (re = !!w.leading, Z = "maxWait" in w, O = Z ? p(L(w.maxWait) || 0, R) : O, D = "trailing" in w ? !!w.trailing : D);
    function U(k) {
      var x = M, H = P;
      return M = P = void 0, V = k, N = g.apply(H, x), N;
    }
    function Pe(k) {
      return V = k, b = setTimeout(W, R), re ? U(k) : N;
    }
    function Te(k) {
      var x = k - T, H = k - V, se = R - x;
      return Z ? E(se, O - H) : se;
    }
    function ce(k) {
      var x = k - T, H = k - V;
      return T === void 0 || x >= R || x < 0 || Z && H >= O;
    }
    function W() {
      var k = h();
      if (ce(k))
        return le(k);
      b = setTimeout(W, Te(k));
    }
    function le(k) {
      return b = void 0, D && M ? U(k) : (M = P = void 0, N);
    }
    function Ae() {
      b !== void 0 && clearTimeout(b), V = 0, M = T = P = b = void 0;
    }
    function Le() {
      return b === void 0 ? N : le(h());
    }
    function G() {
      var k = h(), x = ce(k);
      if (M = arguments, P = this, T = k, x) {
        if (b === void 0)
          return Pe(T);
        if (Z)
          return b = setTimeout(W, R), U(T);
      }
      return b === void 0 && (b = setTimeout(W, R)), N;
    }
    return G.cancel = Ae, G.flush = Le, G;
  }
  function y(g) {
    var R = typeof g;
    return !!g && (R == "object" || R == "function");
  }
  function C(g) {
    return !!g && typeof g == "object";
  }
  function A(g) {
    return typeof g == "symbol" || C(g) && f.call(g) == a;
  }
  function L(g) {
    if (typeof g == "number")
      return g;
    if (A(g))
      return n;
    if (y(g)) {
      var R = typeof g.valueOf == "function" ? g.valueOf() : g;
      g = y(R) ? R + "" : R;
    }
    if (typeof g != "string")
      return g === 0 ? g : +g;
    g = g.replace(c, "");
    var w = s.test(g);
    return w || o.test(g) ? l(g.slice(2), w ? 2 : 8) : r.test(g) ? n : +g;
  }
  return J = m, J;
}
var Vt = Ft();
const de = /* @__PURE__ */ it(Vt);
function Zt(t) {
  const n = z(t);
  n.current = t, F(
    () => () => {
      n.current();
    },
    []
  );
}
function Ht(t, n = 500, a) {
  const c = z();
  Zt(() => {
    c.current && c.current.cancel();
  });
  const r = Ne(() => {
    const s = de(t, n, a), o = (...l) => s(...l);
    return o.cancel = () => {
      s.cancel();
    }, o.isPending = () => !!c.current, o.flush = () => s.flush(), o;
  }, [t, n, a]);
  return F(() => {
    c.current = de(t, n, a);
  }, [t, n, a]), r;
}
function Bt(t, n, a) {
  const c = ((d, u) => d === u), r = t instanceof Function ? t() : t, [s, o] = B(r), l = z(r), i = Ht(
    o,
    n,
    a
  );
  return c(l.current, r) || (i(r), l.current = r), [s, i];
}
function jt({
  threshold: t = 0,
  root: n = null,
  rootMargin: a = "0%",
  freezeOnceVisible: c = !1,
  initialIsIntersecting: r = !1,
  onChange: s
} = {}) {
  var o;
  const [l, i] = B(null), [d, u] = B(() => ({
    isIntersecting: r,
    entry: void 0
  })), v = z();
  v.current = s;
  const f = ((o = d.entry) == null ? void 0 : o.isIntersecting) && c;
  F(() => {
    if (!l || !("IntersectionObserver" in window) || f)
      return;
    const h = new IntersectionObserver(
      (m) => {
        const y = Array.isArray(h.thresholds) ? h.thresholds : [h.thresholds];
        m.forEach((C) => {
          const A = C.isIntersecting && y.some((L) => C.intersectionRatio >= L);
          u({ isIntersecting: A, entry: C }), v.current && v.current(A, C);
        });
      },
      { threshold: t, root: n, rootMargin: a }
    );
    return h.observe(l), () => {
      h.disconnect();
    };
  }, [
    l,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(t),
    n,
    a,
    f,
    c
  ]);
  const p = z(null);
  F(() => {
    var h;
    !l && ((h = d.entry) != null && h.target) && !c && !f && p.current !== d.entry.target && (p.current = d.entry.target, u({ isIntersecting: r, entry: void 0 }));
  }, [l, d.entry, c, f, r]);
  const E = [
    i,
    !!d.isIntersecting,
    d.entry
  ];
  return E.ref = E[0], E.isIntersecting = E[1], E.entry = E[2], E;
}
const _t = /* @__PURE__ */ e.forwardRef(
  function({
    onTrackClick: n,
    onClick: a,
    onSubscriptionStatusChanged: c,
    trackRef: r,
    manageSubscription: s,
    ...o
  }, l) {
    const i = _(r), d = e.useRef(null);
    e.useImperativeHandle(l, () => d.current);
    const u = jt({ root: d.current }), [v] = Bt(u, 3e3);
    e.useEffect(() => {
      s && i.publication instanceof X && (v == null ? void 0 : v.isIntersecting) === !1 && (u == null ? void 0 : u.isIntersecting) === !1 && i.publication.setSubscribed(!1);
    }, [v, i, s]), e.useEffect(() => {
      s && i.publication instanceof X && (u == null ? void 0 : u.isIntersecting) === !0 && i.publication.setSubscribed(!0);
    }, [u, i, s]);
    const {
      elementProps: f,
      publication: p,
      isSubscribed: E
    } = Ce(i, {
      element: d,
      props: o
    });
    e.useEffect(() => {
      c == null || c(!!E);
    }, [E, c]);
    const h = (m) => {
      a == null || a(m), n == null || n({ participant: i == null ? void 0 : i.participant, track: p });
    };
    return /* @__PURE__ */ e.createElement("video", { ref: d, ...f, muted: !0, onClick: h });
  }
), ne = /* @__PURE__ */ e.forwardRef(
  function({ trackRef: n, onSubscriptionStatusChanged: a, volume: c, ...r }, s) {
    const o = _(n), l = e.useRef(null);
    e.useImperativeHandle(s, () => l.current);
    const {
      elementProps: i,
      isSubscribed: d,
      track: u,
      publication: v
    } = Ce(o, {
      element: l,
      props: r
    });
    return e.useEffect(() => {
      a == null || a(!!d);
    }, [d, a]), e.useEffect(() => {
      u === void 0 || c === void 0 || (u instanceof et ? u.setVolume(c) : j.warn("Volume can only be set on remote audio tracks."));
    }, [c, u]), e.useEffect(() => {
      v === void 0 || r.muted === void 0 || (v instanceof X ? v.setEnabled(!r.muted) : j.warn("Can only call setEnabled on remote track publications."));
    }, [r.muted, v, u]), /* @__PURE__ */ e.createElement("audio", { ref: l, ...i });
  }
);
function Ot(t) {
  const n = !!ot();
  return t.participant && !n ? /* @__PURE__ */ e.createElement(we.Provider, { value: t.participant }, t.children) : /* @__PURE__ */ e.createElement(e.Fragment, null, t.children);
}
function Wt(t) {
  const n = !!te();
  return t.trackRef && !n ? /* @__PURE__ */ e.createElement(ae.Provider, { value: t.trackRef }, t.children) : /* @__PURE__ */ e.createElement(e.Fragment, null, t.children);
}
const qt = /* @__PURE__ */ e.forwardRef(
  function({
    trackRef: n,
    children: a,
    onParticipantClick: c,
    disableSpeakingIndicator: r,
    ...s
  }, o) {
    var p, E;
    const l = _(n), { elementProps: i } = ve({
      htmlProps: s,
      disableSpeakingIndicator: r,
      onParticipantClick: c,
      trackRef: l
    }), d = qe(l.participant), u = ut(), v = (p = dt()) == null ? void 0 : p.autoSubscription, f = e.useCallback(
      (h) => {
        l.source && !h && u && u.pin.dispatch && mt(l, u.pin.state) && u.pin.dispatch({ msg: "clear_pin" });
      },
      [l, u]
    );
    return /* @__PURE__ */ e.createElement("div", { ref: o, style: { position: "relative" }, ...i }, /* @__PURE__ */ e.createElement(Wt, { trackRef: l }, /* @__PURE__ */ e.createElement(Ot, { participant: l.participant }, a ?? /* @__PURE__ */ e.createElement(e.Fragment, null, $(l) && (((E = l.publication) == null ? void 0 : E.kind) === "video" || l.source === S.Source.Camera || l.source === S.Source.ScreenShare) ? /* @__PURE__ */ e.createElement(
      _t,
      {
        trackRef: l,
        onSubscriptionStatusChanged: f,
        manageSubscription: v
      }
    ) : $(l) && /* @__PURE__ */ e.createElement(
      ne,
      {
        trackRef: l,
        onSubscriptionStatusChanged: f
      }
    ), /* @__PURE__ */ e.createElement("div", { className: "lk-participant-placeholder" }, /* @__PURE__ */ e.createElement(zt, null)), /* @__PURE__ */ e.createElement("div", { className: "lk-participant-metadata" }, /* @__PURE__ */ e.createElement("div", { className: "lk-participant-metadata-item" }, l.source === S.Source.Camera ? /* @__PURE__ */ e.createElement(e.Fragment, null, d && /* @__PURE__ */ e.createElement(yt, { style: { marginRight: "0.25rem" } }), /* @__PURE__ */ e.createElement(
      Se,
      {
        trackRef: {
          participant: l.participant,
          source: S.Source.Microphone
        },
        show: "muted"
      }
    ), /* @__PURE__ */ e.createElement(Y, null)) : /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(Me, { style: { marginRight: "0.25rem" } }), /* @__PURE__ */ e.createElement(Y, null, "'s screen"))), /* @__PURE__ */ e.createElement(be, { className: "lk-participant-metadata-item" }))), /* @__PURE__ */ e.createElement(Lt, { trackRef: l }))));
  }
);
function pa(t) {
  const n = I(t, { className: "lk-focus-layout" });
  return /* @__PURE__ */ e.createElement("div", { ...n }, t.children);
}
function wa({ trackRef: t, ...n }) {
  return /* @__PURE__ */ e.createElement(qt, { trackRef: t, ...n });
}
function Ie({ tracks: t, ...n }) {
  return /* @__PURE__ */ e.createElement(e.Fragment, null, t.map((a) => /* @__PURE__ */ e.createElement(
    ae.Provider,
    {
      value: a,
      key: ke(a)
    },
    ee(n.children)
  )));
}
function $t({
  totalPageCount: t,
  nextPage: n,
  prevPage: a,
  currentPage: c,
  pagesContainer: r
}) {
  const [s, o] = e.useState(!1);
  return e.useEffect(() => {
    let l;
    return r && (l = ft(r.current, 2e3).subscribe(
      o
    )), () => {
      l && l.unsubscribe();
    };
  }, [r]), /* @__PURE__ */ e.createElement("div", { className: "lk-pagination-control", "data-lk-user-interaction": s }, /* @__PURE__ */ e.createElement("button", { className: "lk-button", onClick: a }, /* @__PURE__ */ e.createElement(ie, null)), /* @__PURE__ */ e.createElement("span", { className: "lk-pagination-count" }, `${c} of ${t}`), /* @__PURE__ */ e.createElement("button", { className: "lk-button", onClick: n }, /* @__PURE__ */ e.createElement(ie, null)));
}
const Dt = /* @__PURE__ */ e.forwardRef(
  function({ totalPageCount: n, currentPage: a }, c) {
    const r = new Array(n).fill("").map((s, o) => o + 1 === a ? /* @__PURE__ */ e.createElement("span", { "data-lk-active": !0, key: o }) : /* @__PURE__ */ e.createElement("span", { key: o }));
    return /* @__PURE__ */ e.createElement("div", { ref: c, className: "lk-pagination-indicator" }, r);
  }
);
function ka({ tracks: t, ...n }) {
  const a = e.createRef(), c = e.useMemo(
    () => I(n, { className: "lk-grid-layout" }),
    [n]
  ), { layout: r } = $e(a, t.length), s = De(r.maxTiles, t);
  return Ue(a, {
    onLeftSwipe: s.nextPage,
    onRightSwipe: s.prevPage
  }), /* @__PURE__ */ e.createElement("div", { ref: a, "data-lk-pagination": s.totalPageCount > 1, ...c }, /* @__PURE__ */ e.createElement(Ie, { tracks: s.tracks }, n.children), t.length > r.maxTiles && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(
    Dt,
    {
      totalPageCount: s.totalPageCount,
      currentPage: s.currentPage
    }
  ), /* @__PURE__ */ e.createElement($t, { pagesContainer: a, ...s })));
}
const Ut = 130, Gt = 140, me = 1, xe = 16 / 10, Qt = (1 - xe) * -1;
function Ra({ tracks: t, orientation: n, ...a }) {
  const c = e.useRef(null), [r, s] = e.useState(0), { width: o, height: l } = Ge(c), i = n || (l >= o ? "vertical" : "horizontal"), d = i === "vertical" ? Math.max(o * Qt, Ut) : Math.max(l * xe, Gt), u = ht(), v = Math.max(i === "vertical" ? (l - u) / d : (o - u) / d, me);
  let f = Math.round(v);
  Math.abs(v - r) < 0.5 ? f = Math.round(r) : r !== v && s(v);
  const p = Qe(t, f);
  return e.useLayoutEffect(() => {
    c.current && (c.current.dataset.lkOrientation = i, c.current.style.setProperty("--lk-max-visible-tiles", f.toString()));
  }, [f, i]), /* @__PURE__ */ e.createElement("aside", { key: i, className: "lk-carousel", ref: c, ...a }, /* @__PURE__ */ e.createElement(Ie, { tracks: p }, a.children));
}
function Ma({
  value: t,
  onPinChange: n,
  onWidgetChange: a,
  children: c
}) {
  const r = gt(t);
  return e.useEffect(() => {
    j.debug("PinState Updated", { state: r.pin.state }), n && r.pin.state && n(r.pin.state);
  }, [r.pin.state, n]), e.useEffect(() => {
    j.debug("Widget Updated", { widgetState: r.widget.state }), a && r.widget.state && a(r.widget.state);
  }, [a, r.widget.state]), /* @__PURE__ */ e.createElement(pe.Provider, { value: r }, c);
}
const ya = /* @__PURE__ */ e.forwardRef(function(n, a) {
  const { room: c, htmlProps: r } = Ke(n);
  return /* @__PURE__ */ e.createElement("div", { ref: a, ...r }, c && /* @__PURE__ */ e.createElement(Re.Provider, { value: c }, /* @__PURE__ */ e.createElement(vt.Provider, { value: n.featureFlags }, n.children)));
}), ba = /* @__PURE__ */ e.forwardRef(
  function({ trackRef: n, ...a }, c) {
    const u = _(n), v = Ee(u, { bands: 7, loPass: 300 });
    return /* @__PURE__ */ e.createElement(
      "svg",
      {
        ref: c,
        width: "100%",
        height: "100%",
        viewBox: "0 0 200 90",
        ...a,
        className: "lk-audio-visualizer"
      },
      /* @__PURE__ */ e.createElement("rect", { x: "0", y: "0", width: "100%", height: "100%" }),
      /* @__PURE__ */ e.createElement(
        "g",
        {
          style: {
            transform: `translate(${130 / 2}px, 0)`
          }
        },
        v.map((f, p) => /* @__PURE__ */ e.createElement(
          "rect",
          {
            key: p,
            x: p * 10,
            y: 90 / 2 - f * 50 / 2,
            width: 6,
            height: f * 50
          }
        ))
      )
    );
  }
);
function Sa({ participants: t, ...n }) {
  return /* @__PURE__ */ e.createElement(e.Fragment, null, t.map((a) => /* @__PURE__ */ e.createElement(we.Provider, { value: a, key: a.identity }, ee(n.children))));
}
function Ca({ room: t, volume: n, muted: a }) {
  const c = Je(
    [S.Source.Microphone, S.Source.ScreenShareAudio, S.Source.Unknown],
    {
      updateOnlyOn: [],
      onlySubscribed: !0,
      room: t
    }
  ).filter((r) => !r.participant.isLocal && r.publication.kind === S.Kind.Audio);
  return /* @__PURE__ */ e.createElement("div", { style: { display: "none" } }, c.map((r) => /* @__PURE__ */ e.createElement(
    ne,
    {
      key: ke(r),
      trackRef: r,
      volume: n,
      muted: a
    }
  )));
}
const Ia = /* @__PURE__ */ e.forwardRef(function({ childrenPosition: n = "before", children: a, ...c }, r) {
  const { name: s } = Xe();
  return /* @__PURE__ */ e.createElement("span", { ref: r, ...c }, n === "before" && a, s, n === "after" && a);
});
function Kt(t) {
  const n = e.useMemo(() => I(t, { className: "lk-toast" }), [t]);
  return /* @__PURE__ */ e.createElement("div", { ...n }, t.children);
}
const Jt = (t) => {
  const n = [];
  for (let a = 0; a < t; a++)
    n.push([a, t - 1 - a]);
  return n;
}, fe = (t) => [[Math.floor(t / 2)], [-1]], Xt = (t, n, a) => {
  const [c, r] = B(0), [s, o] = B([[]]);
  F(() => {
    if (t === "thinking")
      o(fe(n));
    else if (t === "connecting" || t === "initializing") {
      const i = [...Jt(n)];
      o(i);
    } else o(t === "listening" ? fe(n) : t === void 0 || t === "speaking" ? [new Array(n).fill(0).map((i, d) => d)] : [[]]);
    r(0);
  }, [t, n]);
  const l = z(null);
  return F(() => {
    let i = performance.now();
    const d = (u) => {
      u - i >= a && (r((f) => f + 1), i = u), l.current = requestAnimationFrame(d);
    };
    return l.current = requestAnimationFrame(d), () => {
      l.current !== null && cancelAnimationFrame(l.current);
    };
  }, [a, n, t, s.length]), s[c % s.length];
}, Yt = /* @__PURE__ */ new Map([
  ["connecting", 2e3],
  ["initializing", 2e3],
  ["listening", 500],
  ["thinking", 150]
]), ea = (t, n) => {
  if (t === void 0)
    return 1e3;
  let a = Yt.get(t);
  if (a)
    switch (t) {
      case "connecting":
        a /= n;
        break;
    }
  return a;
}, ta = /* @__PURE__ */ e.forwardRef(
  function({ state: n, options: a, barCount: c = 15, trackRef: r, track: s, children: o, ...l }, i) {
    const d = I(l, { className: "lk-audio-bar-visualizer" });
    let u = te();
    (r || s) && (u = r || s);
    const v = Ee(u, {
      bands: c,
      loPass: 100,
      hiPass: 200
    }), f = (a == null ? void 0 : a.minHeight) ?? 20, p = (a == null ? void 0 : a.maxHeight) ?? 100, E = Xt(
      n,
      c,
      ea(n, c) ?? 100
    );
    return /* @__PURE__ */ e.createElement("div", { ref: i, ...d, "data-lk-va-state": n }, v.map(
      (h, m) => o ? ee(o, {
        "data-lk-highlighted": E.includes(m),
        "data-lk-bar-index": m,
        className: "lk-audio-bar",
        style: { height: `${Math.min(p, Math.max(f, h * 100 + 5))}%` }
      }) : /* @__PURE__ */ e.createElement(
        "span",
        {
          key: m,
          "data-lk-highlighted": E.includes(m),
          "data-lk-bar-index": m,
          className: `lk-audio-bar ${E.includes(m) && "lk-highlighted"}`,
          style: {
            // TODO transform animations would be more performant, however the border-radius gets distorted when using scale transforms. a 9-slice approach (or 3 in this case) could work
            // transform: `scale(1, ${Math.min(maxHeight, Math.max(minHeight, volume))}`,
            height: `${Math.min(p, Math.max(f, h * 100 + 5))}%`
          }
        }
      )
    ));
  }
), xa = /* @__PURE__ */ e.forwardRef(
  function({
    children: n,
    disableSpeakingIndicator: a,
    onParticipantClick: c,
    trackRef: r,
    ...s
  }, o) {
    const l = _(r), { elementProps: i } = ve({
      trackRef: l,
      htmlProps: s,
      disableSpeakingIndicator: a,
      onParticipantClick: c
    });
    return /* @__PURE__ */ e.createElement("div", { ref: o, style: { position: "relative", minHeight: "160px" }, ...i }, /* @__PURE__ */ e.createElement(ae.Provider, { value: l }, n ?? /* @__PURE__ */ e.createElement(e.Fragment, null, $(l) && /* @__PURE__ */ e.createElement(ne, { trackRef: l }), /* @__PURE__ */ e.createElement(ta, { barCount: 7, options: { minHeight: 8 } }), /* @__PURE__ */ e.createElement("div", { className: "lk-participant-metadata" }, /* @__PURE__ */ e.createElement("div", { className: "lk-participant-metadata-item" }, /* @__PURE__ */ e.createElement(Se, { trackRef: l }), /* @__PURE__ */ e.createElement(Y, null)), /* @__PURE__ */ e.createElement(be, { className: "lk-participant-metadata-item" })))));
  }
);
function Pa(t) {
  const [n, a] = e.useState(void 0), c = he(t.room);
  return e.useEffect(() => {
    switch (c) {
      case K.Reconnecting:
        a(
          /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(oe, { className: "lk-spinner" }), " Повторное подключение")
        );
        break;
      case K.Connecting:
        a(
          /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(oe, { className: "lk-spinner" }), " Подключение")
        );
        break;
      case K.Disconnected:
        a(/* @__PURE__ */ e.createElement(e.Fragment, null, "Отключено"));
        break;
      default:
        a(void 0);
        break;
    }
  }, [c]), n ? /* @__PURE__ */ e.createElement(Kt, { className: "lk-toast-connection-state" }, n) : /* @__PURE__ */ e.createElement(e.Fragment, null);
}
const Ta = /* @__PURE__ */ e.forwardRef(
  function({ entry: n, hideName: a = !1, hideTimestamp: c = !1, messageFormatter: r, ...s }, o) {
    var f, p, E, h;
    const l = e.useMemo(() => r ? r(n.message) : n.message, [n.message, r]), i = !!n.editTimestamp, d = new Date(n.timestamp), u = typeof navigator < "u" ? navigator.language : "en-US", v = ((f = n.from) == null ? void 0 : f.name) ?? ((p = n.from) == null ? void 0 : p.identity);
    return /* @__PURE__ */ e.createElement(
      "li",
      {
        ref: o,
        className: "lk-chat-entry",
        title: d.toLocaleTimeString(u, { timeStyle: "full" }),
        "data-lk-message-origin": (E = n.from) != null && E.isLocal ? "local" : "remote",
        ...s
      },
      (!c || !a || i) && /* @__PURE__ */ e.createElement("span", { className: "lk-meta-data" }, !a && /* @__PURE__ */ e.createElement("strong", { className: "lk-participant-name" }, v), (!c || i) && /* @__PURE__ */ e.createElement("span", { className: "lk-timestamp" }, i && "edited ", d.toLocaleTimeString(u, { timeStyle: "short" }))),
      /* @__PURE__ */ e.createElement("span", { className: "lk-message-body" }, l),
      /* @__PURE__ */ e.createElement("span", { className: "lk-message-attachements" }, (h = n.attachedFiles) == null ? void 0 : h.map(
        (m) => m.type.startsWith("image/") && /* @__PURE__ */ e.createElement(
          "img",
          {
            style: { maxWidth: "300px", maxHeight: "300px" },
            key: m.name,
            src: URL.createObjectURL(m),
            alt: m.name
          }
        )
      ))
    );
  }
);
function Aa(t) {
  return Et(t, pt()).map((n, a) => {
    if (typeof n == "string")
      return n;
    {
      const c = n.content.toString(), r = n.type === "url" ? /^http(s?):\/\//.test(c) ? c : `https://${c}` : `mailto:${c}`;
      return /* @__PURE__ */ e.createElement("a", { className: "lk-chat-link", key: a, href: r, target: "_blank", rel: "noreferrer" }, c);
    }
  });
}
function La(t) {
  return /* @__PURE__ */ e.createElement(wt.Provider, { value: t.session }, /* @__PURE__ */ e.createElement(Re.Provider, { value: t.session.room }, t.children));
}
export {
  oe as $,
  ba as A,
  ta as B,
  ia as C,
  oa as D,
  La as E,
  pa as F,
  ka as G,
  kt as H,
  Rt as I,
  ie as J,
  Mt as K,
  Ma as L,
  ha as M,
  yt as N,
  bt as O,
  qt as P,
  St as Q,
  Ca as R,
  ua as S,
  Ea as T,
  Ct as U,
  _t as V,
  It as W,
  xt as X,
  Pt as Y,
  Me as Z,
  Tt as _,
  Ta as a,
  At as a0,
  zt as b,
  da as c,
  ma as d,
  fa as e,
  va as f,
  Ra as g,
  wa as h,
  Pa as i,
  Ie as j,
  xa as k,
  Kt as l,
  Aa as m,
  la as n,
  sa as o,
  Lt as p,
  ga as q,
  ya as r,
  be as s,
  ne as t,
  Y as u,
  Se as v,
  Sa as w,
  Ia as x,
  Ot as y,
  Wt as z
};
//# sourceMappingURL=components-Dl8_KfwP.mjs.map
