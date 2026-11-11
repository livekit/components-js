import * as i from "react";
import { LocalAudioTrack as b } from "livekit-client";
import { p as f } from "./contexts-BABOeQ4Z.mjs";
import { I as h } from "./room-BXkFS6wM.mjs";
function K(l = {}) {
  const [o, u] = i.useState(!1), [p, a] = i.useState(!1), [d, n] = i.useState(!1);
  let e = h().microphoneTrack;
  const [s, k] = i.useState();
  l.trackRef && (e = l.trackRef.publication);
  const m = i.useCallback(async (t) => {
    if (t) {
      const { KrispNoiseFilter: r, isKrispNoiseFilterSupported: c } = await import("@livekit/krisp-noise-filter");
      if (!c()) {
        f.warn("LiveKit-Krisp noise filter is not supported in this browser");
        return;
      }
      s || k(r(l.filterOptions));
    }
    u((r) => (r !== t && a(!0), t));
  }, []);
  return i.useEffect(() => {
    var t;
    if (e && e.track instanceof b && s) {
      const r = e.track.getProcessor();
      r && r.name === "livekit-noise-filter" ? (a(!0), r.setEnabled(o).finally(() => {
        a(!1), n(o);
      })) : !r && o && (a(!0), (t = e == null ? void 0 : e.track) == null || t.setProcessor(s).then(() => s.setEnabled(o)).then(() => {
        n(!0);
      }).catch((c) => {
        n(!1), f.error("Krisp hook: error enabling filter", c);
      }).finally(() => {
        a(!1);
      }));
    }
  }, [o, e, s]), {
    setNoiseFilterEnabled: m,
    isNoiseFilterEnabled: d,
    isNoiseFilterPending: p,
    processor: s
  };
}
export {
  K as useKrispNoiseFilter
};
//# sourceMappingURL=krisp.mjs.map
