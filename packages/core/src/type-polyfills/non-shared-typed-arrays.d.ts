// livekit-client (>=2.19) declares an ambient global `NonSharedUint8Array` in its own source
// (`src/type-polyfills/non-shared-typed-arrays.d.ts`) but does NOT ship that declaration in its
// published `dist` types. Its emitted `.d.ts` files (Track, LocalParticipant, Room, ...) therefore
// reference a global type that downstream consumers cannot resolve. Our `tsc` build tolerates this
// because of `skipLibCheck`, but api-extractor must fully follow every rolled-up symbol and fails
// with `Internal Error: Unable to follow symbol for "NonSharedUint8Array"`.
//
// Re-declaring the global here makes the symbol resolvable during our own type analysis. Unlike
// upstream — which aliases to the non-shared `Uint8Array<ArrayBuffer>` variant for Web API
// compatibility in its own code — we intentionally alias to plain `Uint8Array`: this type is only
// a resolution shim (it never appears in our public API), and components-js forwards
// consumer-supplied `Uint8Array` values unchanged, so tightening to the non-shared variant would
// break our public payload signatures for no benefit.
//
// This is a temporary workaround. The upstream fix (livekit/client-sdk-js#1997) ships the
// `NonSharedUint8Array` declaration in livekit-client's published types; once a livekit-client
// release containing it is out and this repo's `livekit-client` catalog entry is bumped to that
// version, the type resolves from livekit-client itself and this file should be deleted.
// See: https://github.com/livekit/client-sdk-js/pull/1997
type NonSharedUint8Array = Uint8Array;
