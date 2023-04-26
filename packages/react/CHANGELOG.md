# @livekit/components-react

## 1.0.0

### Major Changes

- Bump to 1.0 - [#444](https://github.com/livekit/components-js/pull/444) ([@lukasIO](https://github.com/lukasIO))

  We adapted tsdoc release tags to signal stability of API methods following this [spec](https://api-extractor.com/pages/tsdoc/doc_comment_syntax/#release-tags)

## 0.8.2

### Patch Changes

- Remove deprecated components `MediaTrack` and `ScreenShareRenderer` - [#465](https://github.com/livekit/components-js/pull/465) ([@Ocupe](https://github.com/Ocupe))

- Fix sourcemaps by not invoking rollup in tsup build - [#464](https://github.com/livekit/components-js/pull/464) ([@lukasIO](https://github.com/lukasIO))

- Fix some imports - [#461](https://github.com/livekit/components-js/pull/461) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`0bbacce`](https://github.com/livekit/components-js/commit/0bbaccea5e964f3d38925a49223b914a3e2076fe)]:
  - @livekit/components-core@0.6.5

## 0.8.1

### Patch Changes

- Fix: avoid recursive pin dependency - [#458](https://github.com/livekit/components-js/pull/458) ([@lukasIO](https://github.com/lukasIO))

- Display default username in PreJoin component - [#455](https://github.com/livekit/components-js/pull/455) ([@apurvbhavsar](https://github.com/apurvbhavsar))

## 0.8.0

### Minor Changes

- Make layout component children required - [#447](https://github.com/livekit/components-js/pull/447) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- fix: remove pin when screen share ended - [#440](https://github.com/livekit/components-js/pull/440) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`f61f2b2`](https://github.com/livekit/components-js/commit/f61f2b2e5f709335c59c58010a3debb761be0ca9)]:
  - @livekit/components-core@0.6.4

## 0.7.3

### Patch Changes

- Remove filter from `ParticipantLoop` and add option to pass room to `useParticipants`, `useLocalParticipant` and `useRemoteParticipants`. - [#435](https://github.com/livekit/components-js/pull/435) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`fe92d54`](https://github.com/livekit/components-js/commit/fe92d5464eca72da8d12f021c2b35c955855f3af)]:
  - @livekit/components-core@0.6.3

## 0.7.2

### Patch Changes

- Add swipe detection to switch pages in the GridLayout. - [#423](https://github.com/livekit/components-js/pull/423) ([@Ocupe](https://github.com/Ocupe))

- add pagination indicator to GridLayout component - [#431](https://github.com/livekit/components-js/pull/431) ([@Ocupe](https://github.com/Ocupe))

- Fix the carousel component for iOS and fix a possible unstable UI condition. - [#422](https://github.com/livekit/components-js/pull/422) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`1f14b38`](https://github.com/livekit/components-js/commit/1f14b386d676cf3548117f781129e467ab67c48f)]:
  - @livekit/components-core@0.6.2

## 0.7.1

### Patch Changes

- Export usePinnedTracks - [#413](https://github.com/livekit/components-js/pull/413) ([@lukasIO](https://github.com/lukasIO))

- Surface media device failure - [#398](https://github.com/livekit/components-js/pull/398) ([@lukasIO](https://github.com/lukasIO))

- Add data callback to useDataChannel - [#417](https://github.com/livekit/components-js/pull/417) ([@lukasIO](https://github.com/lukasIO))

- Move track filter logic into pagination hook - [#392](https://github.com/livekit/components-js/pull/392) ([@lukasIO](https://github.com/lukasIO))

- Fix chat toggle not working - [#395](https://github.com/livekit/components-js/pull/395) ([@lukasIO](https://github.com/lukasIO))

- Chat revision: add property to hide chat metadata in a ChatEntry and update ChatEntry styling. - [#397](https://github.com/livekit/components-js/pull/397) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`e786dc9`](https://github.com/livekit/components-js/commit/e786dc98f571f125794b27305bf89cbf5ee30c63), [`5992c42`](https://github.com/livekit/components-js/commit/5992c429371a5516e724c59b80584df8badd2e95)]:
  - @livekit/components-core@0.6.1

## 0.7.0

### Minor Changes

- Make trackReferences required for layout comps - [#383](https://github.com/livekit/components-js/pull/383) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Remove rxjs imports to keep bundle size down - [#379](https://github.com/livekit/components-js/pull/379) ([@lukasIO](https://github.com/lukasIO))

- Add prop to disable speaking indicator on tile - [#387](https://github.com/livekit/components-js/pull/387) ([@lukasIO](https://github.com/lukasIO))

- Fix: Prevent pagination from getting stuck on a page that no longer exists #385 - [#385](https://github.com/livekit/components-js/pull/385) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`f0602fc`](https://github.com/livekit/components-js/commit/f0602fcf06eca39f0ac9b8bb4612c63328d9da4d)]:
  - @livekit/components-core@0.6.0

## 0.6.2

### Patch Changes

- Use trackReference.participant as fallback for rendering track - [#377](https://github.com/livekit/components-js/pull/377) ([@lukasIO](https://github.com/lukasIO))

## 0.6.1

### Patch Changes

- Enable trackReferences to be used on audio/video track - [#374](https://github.com/livekit/components-js/pull/374) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`a423d48`](https://github.com/livekit/components-js/commit/a423d483ee1d92d658a04c4c9ff2142aa388d2d0)]:
  - @livekit/components-core@0.5.1

## 0.6.0

### Minor Changes

- Rename TrackBundle to TrackReference. - [#365](https://github.com/livekit/components-js/pull/365) ([@Ocupe](https://github.com/Ocupe))

- Exclude unknown and screenShareAudio from toggle sources - [#370](https://github.com/livekit/components-js/pull/370) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- add orientation prop to CarouselView - [#355](https://github.com/livekit/components-js/pull/355) ([@Ocupe](https://github.com/Ocupe))

- Include screen share audio in control bar capture defaults - [#361](https://github.com/livekit/components-js/pull/361) ([@lukasIO](https://github.com/lukasIO))

- add pagination to GridLayout component - [#350](https://github.com/livekit/components-js/pull/350) ([@Ocupe](https://github.com/Ocupe))

- Fix data channel memory leak - [#360](https://github.com/livekit/components-js/pull/360) ([@Ocupe](https://github.com/Ocupe))

- Bump minimum livekit-client version to 1.7.0 - [#369](https://github.com/livekit/components-js/pull/369) ([@lukasIO](https://github.com/lukasIO))

- Add capture options to toggle - [#356](https://github.com/livekit/components-js/pull/356) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`a011fdd`](https://github.com/livekit/components-js/commit/a011fdda0550cb4ac9e380022ddb3cbb0c57dc7d), [`9accef1`](https://github.com/livekit/components-js/commit/9accef114bf77c7fc7ac2b9f711cd38256dc8bd7), [`ec2c7a3`](https://github.com/livekit/components-js/commit/ec2c7a3ac33f58334d16d0c8241c475710e80f2b), [`493d49c`](https://github.com/livekit/components-js/commit/493d49cad3b7286ba6ffc9b03f2ecf0a28d86702), [`9cf77c6`](https://github.com/livekit/components-js/commit/9cf77c641f425d18a4edefbbf27602119e6fe17f), [`f5707d0`](https://github.com/livekit/components-js/commit/f5707d016225abd2520b20221b30b6dd834511e7)]:
  - @livekit/components-core@0.5.0

## 0.5.0

### Minor Changes

- Deprecate MediaTrack and split into AudioTrack and VideoTrack #336 - [#337](https://github.com/livekit/components-js/pull/337) ([@lukasIO](https://github.com/lukasIO))

- Remove TileLoop in favor of TrackLoop. Simplify the TrackLoop component by removing the filter functionality. - [#327](https://github.com/livekit/components-js/pull/327) ([@Ocupe](https://github.com/Ocupe))

### Patch Changes

- GridLayout Revision. - [#326](https://github.com/livekit/components-js/pull/326) ([@Ocupe](https://github.com/Ocupe))

  Renaming:

  - `sortParticipantsByVolume` -> `sortParticipants`

- Include room in dependency array in order to disconnect on room unmount - [#332](https://github.com/livekit/components-js/pull/332) ([@lukasIO](https://github.com/lukasIO))

- CraouselView revision: Add a visually stable update to the carousel component. Limit the maximum visible tiles. Add snap scrolling to better align the tiles. - [#346](https://github.com/livekit/components-js/pull/346) ([@Ocupe](https://github.com/Ocupe))

- Use stringify array effect deps - [#338](https://github.com/livekit/components-js/pull/338) ([@lukasIO](https://github.com/lukasIO))

- Rework useDataChannel API - [#340](https://github.com/livekit/components-js/pull/340) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`2ff6f78`](https://github.com/livekit/components-js/commit/2ff6f78edbc186cb63d353ae2ae688d3317976c8), [`53aafaa`](https://github.com/livekit/components-js/commit/53aafaaba03c6cfe403555e3b01db374b7bcd14c), [`bed7516`](https://github.com/livekit/components-js/commit/bed7516196df8d59d7b464ca524a831a7d3b6351)]:
  - @livekit/components-core@0.4.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`369db26`](https://github.com/livekit/components-js/commit/369db26143c06d449d9c698dd6b82ba9a7f29122), [`50edb66`](https://github.com/livekit/components-js/commit/50edb6698de4f70a04b2d6b75f6ef566da3fa6fb)]:
  - @livekit/components-core@0.3.1

## 0.4.0

### Minor Changes

- apply updateOnlyOn logic for remote participant hook - [#308](https://github.com/livekit/components-js/pull/308) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Export ChatMessage type from package/react. - [#319](https://github.com/livekit/components-js/pull/319) ([@Ocupe](https://github.com/Ocupe))

- Add option to get mediatrack by name - [#317](https://github.com/livekit/components-js/pull/317) ([@lukasIO](https://github.com/lukasIO))

- Fix TileLoop child (template) not used for main source. - [#320](https://github.com/livekit/components-js/pull/320) ([@Ocupe](https://github.com/Ocupe))

- Remove useTrack in favor of focusing on useMediaTrack - [#313](https://github.com/livekit/components-js/pull/313) ([@lukasIO](https://github.com/lukasIO))

- Remove the excludePinnedTracks property from the useTracks hook. PinState handling must be accomplished outside the hook. - [#311](https://github.com/livekit/components-js/pull/311) ([@Ocupe](https://github.com/Ocupe))

- Fix infinite render loop in custom participant hooks. - [#315](https://github.com/livekit/components-js/pull/315) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`08b6b6a`](https://github.com/livekit/components-js/commit/08b6b6a50ce371f5103b56d33f221c5038e98ca7), [`dc65553`](https://github.com/livekit/components-js/commit/dc65553508783665542ddc9a808c4dcee6ee3804), [`37eff03`](https://github.com/livekit/components-js/commit/37eff03c87ff8087c932826ebb03a7db1292a05d)]:
  - @livekit/components-core@0.3.0

## 0.3.0

### Minor Changes

- Use consistent parameters style for hooks - [#298](https://github.com/livekit/components-js/pull/298) ([@lukasIO](https://github.com/lukasIO))

- Replace `showMutedOnly` with `show={'muted' | 'unmuted' | 'always'}` - [#305](https://github.com/livekit/components-js/pull/305) ([@lukasIO](https://github.com/lukasIO))

## 0.2.7

### Patch Changes

- Add useRemoteParticipant hook - [#295](https://github.com/livekit/components-js/pull/295) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`56ee42f`](https://github.com/livekit/components-js/commit/56ee42f153e1e85baa5272f309ba24dd6fb7634b)]:
  - @livekit/components-core@0.2.7

## 0.2.6

### Patch Changes

- Specify livekit-client as peer dependency in react package - [#287](https://github.com/livekit/components-js/pull/287) ([@lukasIO](https://github.com/lukasIO))

- Add button label props for PreJoin component - [#289](https://github.com/livekit/components-js/pull/289) ([@lukasIO](https://github.com/lukasIO))

- Simplify data channel usage, only allow one `channelId` - [#290](https://github.com/livekit/components-js/pull/290) ([@lukasIO](https://github.com/lukasIO))

- Show/hide controls based on participant permissions by default - [#285](https://github.com/livekit/components-js/pull/285) ([@lukasIO](https://github.com/lukasIO))

- Add useParticipantPermissions hook additionally to useLocalParticipantPermissions - [#292](https://github.com/livekit/components-js/pull/292) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`77f2b34`](https://github.com/livekit/components-js/commit/77f2b34f7dae248a58963a01c7023b106749f4ec), [`317d50d`](https://github.com/livekit/components-js/commit/317d50db678f92ff9bc04b76757e7708a3bfa2ff), [`c5b0aca`](https://github.com/livekit/components-js/commit/c5b0aca7dd85ee0b51c43113a72fd5861f0fb4a7)]:
  - @livekit/components-core@0.2.6

## 0.2.5

### Patch Changes

- Make ParticipantInfoProps optional in useParticipantInfo hook - [#276](https://github.com/livekit/components-js/pull/276) ([@lukasIO](https://github.com/lukasIO))

- Add useDataChannelMessages hook and generalise core data channel usage - [#277](https://github.com/livekit/components-js/pull/277) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`c023b8a`](https://github.com/livekit/components-js/commit/c023b8aa65b54567af082a1e2b87ea18f426e955), [`7e13007`](https://github.com/livekit/components-js/commit/7e130075f7b83176a46bdb366c280275785d4fa3)]:
  - @livekit/components-core@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`480808a`](https://github.com/livekit/components-js/commit/480808a6d024391f474b0f3bdb997e49259a3860), [`cb9e2b6`](https://github.com/livekit/components-js/commit/cb9e2b6595514f35145dc8e9124324531a3979e0)]:
  - @livekit/components-core@0.2.4

## 0.2.3

### Patch Changes

- Mark packages as side-effect free - [#268](https://github.com/livekit/components-js/pull/268) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`4d742bf`](https://github.com/livekit/components-js/commit/4d742bf5465bae7cc39215150b78c5f3d2ba3283)]:
  - @livekit/components-core@0.2.3

## 0.2.2

### Patch Changes

- Move link regex into core - [#265](https://github.com/livekit/components-js/pull/265) ([@lukasIO](https://github.com/lukasIO))

- Make tokenizer typesafe and move to separate file - [#267](https://github.com/livekit/components-js/pull/267) ([@lukasIO](https://github.com/lukasIO))

- Only populate room in useEffect to avoid strict mode disconnecting - [#264](https://github.com/livekit/components-js/pull/264) ([@lukasIO](https://github.com/lukasIO))

- Replace floating-ui/react with floating-ui/dom and fix the position problem with the MediaDeviceMenu component. - [#266](https://github.com/livekit/components-js/pull/266) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`8b1e826`](https://github.com/livekit/components-js/commit/8b1e826a08fc1fa45993108c82edc8e68684b92c), [`39be24c`](https://github.com/livekit/components-js/commit/39be24c17b3c3b6a0f15efb28a622766abdf2fa2)]:
  - @livekit/components-core@0.2.2

## 0.2.1

### Patch Changes

- Refactor loop filter into core and rename TracksFilter to TrackFilter. - [#257](https://github.com/livekit/components-js/pull/257) ([@Ocupe](https://github.com/Ocupe))

- Remove ResizeObserver polyfill dependency - [#254](https://github.com/livekit/components-js/pull/254) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`1144b2c`](https://github.com/livekit/components-js/commit/1144b2c5c762ebbc3ff919114e18f8a11f52cf46)]:
  - @livekit/components-core@0.2.1

## 0.2.0

### Minor Changes

- add formatter for chat messages - [#247](https://github.com/livekit/components-js/pull/247) ([@paulwe](https://github.com/paulwe))

### Patch Changes

- Fix: Only disconnect on onmount or if room changes - [#250](https://github.com/livekit/components-js/pull/250) ([@lukasIO](https://github.com/lukasIO))

- Update dependencies - [#253](https://github.com/livekit/components-js/pull/253) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`bcd4fdb`](https://github.com/livekit/components-js/commit/bcd4fdb886d48018309dacd4ea8e1e554b758aaa), [`1a7a098`](https://github.com/livekit/components-js/commit/1a7a09863df1fa79b15cfa1716213c3d2da0ac0d)]:
  - @livekit/components-core@0.2.0

## 0.1.20

### Patch Changes

- Don't stop track on unmount - [#245](https://github.com/livekit/components-js/pull/245) ([@lukasIO](https://github.com/lukasIO))

## 0.1.19

### Patch Changes

- Internal revisions of the component and prefab structure. - [#241](https://github.com/livekit/components-js/pull/241) ([@Ocupe](https://github.com/Ocupe))

- Monorepo-wide package updates and cleanups. - [#235](https://github.com/livekit/components-js/pull/235) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`1e53f58`](https://github.com/livekit/components-js/commit/1e53f58901c56224bc1a060210baf5d5beb9d17f), [`6a13879`](https://github.com/livekit/components-js/commit/6a13879d8a7092aa566f500f43e2e2057a3dcd8a)]:
  - @livekit/components-core@0.1.13

## 0.1.18

### Patch Changes

- Fix mic dropdown on prejoin page - [#231](https://github.com/livekit/components-js/pull/231) ([@lukasIO](https://github.com/lukasIO))

- Fix prejoin bugs - [#231](https://github.com/livekit/components-js/pull/231) ([@lukasIO](https://github.com/lukasIO))

## 0.1.17

### Patch Changes

- Fix prejoin bugs - [#229](https://github.com/livekit/components-js/pull/229) ([@lukasIO](https://github.com/lukasIO))

## 0.1.16

### Patch Changes

- Updated dependencies [[`5977a9c`](https://github.com/livekit/components-js/commit/5977a9c881c7b520bad0209cbe9e3182d3a1ffbe)]:
  - @livekit/components-core@0.1.12

## 0.1.15

### Patch Changes

- Updated dependencies [[`f5984ef`](https://github.com/livekit/components-js/commit/f5984efa3a53eb9bcc389e644e0b91695f17a9d7)]:
  - @livekit/components-core@0.1.11

## 0.1.14

### Patch Changes

- Remove the unused showIcon prop from the usTrackToggle hook. - [#220](https://github.com/livekit/components-js/pull/220) ([@Ocupe](https://github.com/Ocupe))

- Update participant screen share with icon - [#206](https://github.com/livekit/components-js/pull/206) ([@Ocupe](https://github.com/Ocupe))

- Make Chat component scrollable. - [`f0ff603`](https://github.com/livekit/components-js/commit/f0ff6033beec8d12bcd25b85b7fe3b92c8ba5bee) ([@Ocupe](https://github.com/Ocupe))

- Fix wrong overlay on screen share when muting camera. - [#217](https://github.com/livekit/components-js/pull/217) ([@Ocupe](https://github.com/Ocupe))

- Better auto-grid layout - [#203](https://github.com/livekit/components-js/pull/203) ([@lukasIO](https://github.com/lukasIO))

## 0.1.13

### Patch Changes

- use device specific selector for default control bar - [#153](https://github.com/livekit/components-js/pull/153) ([@lukasIO](https://github.com/lukasIO))

- Fix TrackLoop - [#144](https://github.com/livekit/components-js/pull/144) ([@Ocupe](https://github.com/Ocupe))

- Add TileLoop for displaying participants without tracks, rename contexts - [#170](https://github.com/livekit/components-js/pull/170) ([@lukasIO](https://github.com/lukasIO))

- Rename ParticipantView to ParticipantTile and use it in FocusLayout - [#158](https://github.com/livekit/components-js/pull/158) ([@Ocupe](https://github.com/Ocupe))

- add variations to controlbar and its story - [#156](https://github.com/livekit/components-js/pull/156) ([@lukasIO](https://github.com/lukasIO))

- Add ConnectionStateToast - [#173](https://github.com/livekit/components-js/pull/173) ([@lukasIO](https://github.com/lukasIO))

- Detach track on onmount - [#167](https://github.com/livekit/components-js/pull/167) ([@lukasIO](https://github.com/lukasIO))

- Add FocusToggle component to ParticipantTile. - [#178](https://github.com/livekit/components-js/pull/178) ([@Ocupe](https://github.com/Ocupe))

- Update "eslint-config-turbo" 0.0.6 -> 0.0.7 - [#147](https://github.com/livekit/components-js/pull/147) ([@renovate](https://github.com/apps/renovate))

- Replace pin context with layout context. - [#168](https://github.com/livekit/components-js/pull/168) ([@Ocupe](https://github.com/Ocupe))

- Use @floating-ui/react package for MediaDeviceMenu - [#161](https://github.com/livekit/components-js/pull/161) ([@Ocupe](https://github.com/Ocupe))

- Hide screen share button on mobile. - [#200](https://github.com/livekit/components-js/pull/200) ([@Ocupe](https://github.com/Ocupe))

- Add chat to audio and video conference prefabs. - [#171](https://github.com/livekit/components-js/pull/171) ([@Ocupe](https://github.com/Ocupe))

- Add error callback to prejoin prefab - [#196](https://github.com/livekit/components-js/pull/196) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`fdfbfc7`](https://github.com/livekit/components-js/commit/fdfbfc75a20741f8cc17c85ec045f08663b90000), [`e3d48c3`](https://github.com/livekit/components-js/commit/e3d48c31c7fd3c7a6d12d854fa08f634de0f0d6b), [`91b9c5d`](https://github.com/livekit/components-js/commit/91b9c5d473446c3ea0e3ae37a20302a5a5f2f791), [`1c3942a`](https://github.com/livekit/components-js/commit/1c3942ab924d720aa86fc18e4f1d30f7dcf581e3), [`fda5c66`](https://github.com/livekit/components-js/commit/fda5c66c4559f90851c8634bfa218dd707a1caa4), [`7af268b`](https://github.com/livekit/components-js/commit/7af268b3b267d93b337b0c5942e674cd8f8e78dc), [`25064a5`](https://github.com/livekit/components-js/commit/25064a5d1a1fb86eeed0d77de8e3f516e1aa3840), [`7a14944`](https://github.com/livekit/components-js/commit/7a1494401d4230ea61697bf4ada789a49446bf90), [`9707652`](https://github.com/livekit/components-js/commit/97076529a9a278007369d7bf16c0a62b6057797d)]:
  - @livekit/components-core@0.1.10

## 0.1.12

### Patch Changes

- Updated dependencies [[`fa3cf1c`](https://github.com/livekit/components/commit/fa3cf1cf7ff74acff5d6e4629faf46218c411432)]:
  - @livekit/components-core@0.1.9

## 0.1.11

### Patch Changes

- Icon fixes - [#130](https://github.com/livekit/components/pull/130) ([@mdo](https://github.com/mdo))

## 0.1.10

### Patch Changes

- Prepare for dev preview - [`f2c7955`](https://github.com/livekit/components/commit/f2c79559e3ca38b2f783c2e7e2c4a952436db88b) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`f2c7955`](https://github.com/livekit/components/commit/f2c79559e3ca38b2f783c2e7e2c4a952436db88b)]:
  - @livekit/components-core@0.1.8

## 0.1.9

### Patch Changes

- quicker build - [`fdbf77a`](https://github.com/livekit/components/commit/fdbf77a1abcf96a410102459c2d44a41ed73120e) ([@lukasIO](https://github.com/lukasIO))

## 0.1.8

### Patch Changes

- Fix react hook conditional errors - [#82](https://github.com/livekit/components/pull/82) ([@lukasIO](https://github.com/lukasIO))

- bundle core package - [`324be93`](https://github.com/livekit/components/commit/324be930e9e33afb1c00d765a734c8bb2b53bf8e) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`622b14c`](https://github.com/livekit/components/commit/622b14c4eff002d9ae6de776099284ec0581f7ed), [`725b995`](https://github.com/livekit/components/commit/725b9950b71fa3b633a24c981152f818cd05434c), [`324be93`](https://github.com/livekit/components/commit/324be930e9e33afb1c00d765a734c8bb2b53bf8e)]:
  - @livekit/components-core@0.1.7

## 0.1.7

### Patch Changes

- Better Bundling - [#76](https://github.com/livekit/components/pull/76) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`fb22bc8`](https://github.com/livekit/components/commit/fb22bc8c4f71110f15f79888dc3e768f9cd7870a)]:
  - @livekit/components-core@0.1.6

## 0.1.6

### Patch Changes

- remove type module

- dont use nested folder exports

- Updated dependencies []:
  - @livekit/components-core@0.1.5

## 0.1.5

### Patch Changes

- Updated dependencies [[`5d2bd45`](https://github.com/livekit/components/commit/5d2bd453411870786b2f7ccdc22b951a3a058ff6)]:
  - @livekit/components-core@0.1.4

## 0.1.4

### Patch Changes

- Bundle packages ([`8339933`](https://github.com/livekit/components/commit/83399336e03908751c766e194e628a5f210dfe3a))

- Updated dependencies [[`8339933`](https://github.com/livekit/components/commit/83399336e03908751c766e194e628a5f210dfe3a)]:
  - @livekit/components-core@0.1.3

## 0.1.3

### Patch Changes

- bundle react components package with tsup ([#72](https://github.com/livekit/components/pull/72))

## 0.1.2

### Patch Changes

- update libs ([`e2c731d`](https://github.com/livekit/components/commit/e2c731d5f15f410680deaa1ffc389a02c6c9b36c))

- Updated dependencies [[`e2c731d`](https://github.com/livekit/components/commit/e2c731d5f15f410680deaa1ffc389a02c6c9b36c)]:
  - @livekit/components-core@0.1.2

## 0.1.1

### Patch Changes

- Add a basic chat component ([#45](https://github.com/livekit/components/pull/45))

- Updated dependencies [[`08857da`](https://github.com/livekit/components/commit/08857dab44d0c9c3434dffbff13cb02df1f5784e), [`4c67a8c`](https://github.com/livekit/components/commit/4c67a8c395efa1118aad4cbd71d7c7d0c9904111)]:
  - @livekit/components-core@0.1.1
