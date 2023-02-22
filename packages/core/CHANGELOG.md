# @livekit/components-core

## 0.3.1

### Patch Changes

- Fix regression in `mediaDeviceSelect` observable where switching the media device would not update the UI. - [#323](https://github.com/livekit/components-js/pull/323) ([@Ocupe](https://github.com/Ocupe))

- Throw an error if the application is running in an unsecure context. - [#325](https://github.com/livekit/components-js/pull/325) ([@Ocupe](https://github.com/Ocupe))

## 0.3.0

### Minor Changes

- apply updateOnlyOn logic for remote participant hook - [#308](https://github.com/livekit/components-js/pull/308) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Export ChatMessage type from package/react. - [#319](https://github.com/livekit/components-js/pull/319) ([@Ocupe](https://github.com/Ocupe))

- Add option to get mediatrack by name - [#317](https://github.com/livekit/components-js/pull/317) ([@lukasIO](https://github.com/lukasIO))

## 0.2.7

### Patch Changes

- Add useRemoteParticipant hook - [#295](https://github.com/livekit/components-js/pull/295) ([@lukasIO](https://github.com/lukasIO))

## 0.2.6

### Patch Changes

- Simplify data channel usage, only allow one `channelId` - [#290](https://github.com/livekit/components-js/pull/290) ([@lukasIO](https://github.com/lukasIO))

- Make permissions observer participant based - [#292](https://github.com/livekit/components-js/pull/292) ([@lukasIO](https://github.com/lukasIO))

- Add localParticipantPermissionsObserver - [#285](https://github.com/livekit/components-js/pull/285) ([@lukasIO](https://github.com/lukasIO))

## 0.2.5

### Patch Changes

- Fix timing issue when device observable first gets set up - [#279](https://github.com/livekit/components-js/pull/279) ([@lukasIO](https://github.com/lukasIO))

- Add useDataChannelMessages hook and generalise core data channel usage - [#277](https://github.com/livekit/components-js/pull/277) ([@lukasIO](https://github.com/lukasIO))

## 0.2.4

### Patch Changes

- Fix floating-ui shift middleware and style and responsiveness updates on PreJoin component. - [#271](https://github.com/livekit/components-js/pull/271) ([@Ocupe](https://github.com/Ocupe))

- Replace tlds dependency with global-tld-list in order to avoid having to deal with JSON imports - [#274](https://github.com/livekit/components-js/pull/274) ([@lukasIO](https://github.com/lukasIO))

## 0.2.3

### Patch Changes

- Mark packages as side-effect free - [#268](https://github.com/livekit/components-js/pull/268) ([@lukasIO](https://github.com/lukasIO))

## 0.2.2

### Patch Changes

- Move link regex into core - [#265](https://github.com/livekit/components-js/pull/265) ([@lukasIO](https://github.com/lukasIO))

- Make tokenizer typesafe and move to separate file - [#267](https://github.com/livekit/components-js/pull/267) ([@lukasIO](https://github.com/lukasIO))

## 0.2.1

### Patch Changes

- Refactor loop filter into core and rename TracksFilter to TrackFilter. - [#257](https://github.com/livekit/components-js/pull/257) ([@Ocupe](https://github.com/Ocupe))

## 0.2.0

### Minor Changes

- add formatter for chat messages - [#247](https://github.com/livekit/components-js/pull/247) ([@paulwe](https://github.com/paulwe))

### Patch Changes

- Update dependencies - [#253](https://github.com/livekit/components-js/pull/253) ([@lukasIO](https://github.com/lukasIO))

## 0.1.13

### Patch Changes

- Internal revisions of the component and prefab structure. - [#241](https://github.com/livekit/components-js/pull/241) ([@Ocupe](https://github.com/Ocupe))

- Monorepo-wide package updates and cleanups. - [#235](https://github.com/livekit/components-js/pull/235) ([@Ocupe](https://github.com/Ocupe))

## 0.1.12

### Patch Changes

- Fix logger export - [`5977a9c`](https://github.com/livekit/components-js/commit/5977a9c881c7b520bad0209cbe9e3182d3a1ffbe) ([@lukasIO](https://github.com/lukasIO))

## 0.1.11

### Patch Changes

- Expose log method - [`f5984ef`](https://github.com/livekit/components-js/commit/f5984efa3a53eb9bcc389e644e0b91695f17a9d7) ([@lukasIO](https://github.com/lukasIO))

## 0.1.10

### Patch Changes

- Fix TrackLoop - [#144](https://github.com/livekit/components-js/pull/144) ([@Ocupe](https://github.com/Ocupe))

- Add TileLoop for displaying participants without tracks, rename contexts - [#170](https://github.com/livekit/components-js/pull/170) ([@lukasIO](https://github.com/lukasIO))

- Rename ParticipantView to ParticipantTile and use it in FocusLayout - [#158](https://github.com/livekit/components-js/pull/158) ([@Ocupe](https://github.com/Ocupe))

- Add ConnectionStateToast - [#173](https://github.com/livekit/components-js/pull/173) ([@lukasIO](https://github.com/lukasIO))

- Add FocusToggle component to ParticipantTile. - [#178](https://github.com/livekit/components-js/pull/178) ([@Ocupe](https://github.com/Ocupe))

- Replace pin context with layout context. - [#168](https://github.com/livekit/components-js/pull/168) ([@Ocupe](https://github.com/Ocupe))

- Hide screen share button on mobile. - [#200](https://github.com/livekit/components-js/pull/200) ([@Ocupe](https://github.com/Ocupe))

- Add chat to audio and video conference prefabs. - [#171](https://github.com/livekit/components-js/pull/171) ([@Ocupe](https://github.com/Ocupe))

- Fix initial muted state - [#159](https://github.com/livekit/components-js/pull/159) ([@Ocupe](https://github.com/Ocupe))

## 0.1.9

### Patch Changes

- Bugfixes - [`fa3cf1c`](https://github.com/livekit/components/commit/fa3cf1cf7ff74acff5d6e4629faf46218c411432) ([@lukasIO](https://github.com/lukasIO))

## 0.1.8

### Patch Changes

- Prepare for dev preview - [`f2c7955`](https://github.com/livekit/components/commit/f2c79559e3ca38b2f783c2e7e2c4a952436db88b) ([@lukasIO](https://github.com/lukasIO))

## 0.1.7

### Patch Changes

- Fix react hook conditional errors - [#82](https://github.com/livekit/components/pull/82) ([@lukasIO](https://github.com/lukasIO))

- Make core a module - [`725b995`](https://github.com/livekit/components/commit/725b9950b71fa3b633a24c981152f818cd05434c) ([@lukasIO](https://github.com/lukasIO))

- bundle core package - [`324be93`](https://github.com/livekit/components/commit/324be930e9e33afb1c00d765a734c8bb2b53bf8e) ([@lukasIO](https://github.com/lukasIO))

## 0.1.6

### Patch Changes

- Better Bundling - [#76](https://github.com/livekit/components/pull/76) ([@lukasIO](https://github.com/lukasIO))

## 0.1.5

### Patch Changes

- remove type module

- dont use nested folder exports

## 0.1.4

### Patch Changes

- bundle token ([`5d2bd45`](https://github.com/livekit/components/commit/5d2bd453411870786b2f7ccdc22b951a3a058ff6))

## 0.1.3

### Patch Changes

- Bundle packages ([`8339933`](https://github.com/livekit/components/commit/83399336e03908751c766e194e628a5f210dfe3a))

## 0.1.2

### Patch Changes

- update libs ([`e2c731d`](https://github.com/livekit/components/commit/e2c731d5f15f410680deaa1ffc389a02c6c9b36c))

## 0.1.1

### Patch Changes

- Add a basic chat component ([#45](https://github.com/livekit/components/pull/45))

- Rework theming logic ([#48](https://github.com/livekit/components/pull/48))
