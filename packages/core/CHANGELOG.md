# @livekit/components-core

## 0.11.11

### Patch Changes

- use JS SDK's isLocal check - [#1050](https://github.com/livekit/components-js/pull/1050) ([@davidzhao](https://github.com/davidzhao))

## 0.11.10

### Patch Changes

- Fix initial device selection when mounting useMediaDeviceSelect - [#1014](https://github.com/livekit/components-js/pull/1014) ([@lukasIO](https://github.com/lukasIO))

## 0.11.9

### Patch Changes

- Use legacy chat messages on unsupported server versions - [#999](https://github.com/livekit/components-js/pull/999) ([@lukasIO](https://github.com/lukasIO))

## 0.11.8

### Patch Changes

- Move useKrispNoiseFilter into dedicated import path - [#991](https://github.com/livekit/components-js/pull/991) ([@lukasIO](https://github.com/lukasIO))

## 0.11.7

### Patch Changes

- Add krisp hook - [#986](https://github.com/livekit/components-js/pull/986) ([@lukasIO](https://github.com/lukasIO))

## 0.11.6

### Patch Changes

- update useParticipants to listen for any Participant's info changes - [#980](https://github.com/livekit/components-js/pull/980) ([@lebaudantoine](https://github.com/lebaudantoine))

- Add support for new chat API - [#979](https://github.com/livekit/components-js/pull/979) ([@lukasIO](https://github.com/lukasIO))

## 0.11.5

### Patch Changes

- Fix local storage user choices - [#970](https://github.com/livekit/components-js/pull/970) ([@lukasIO](https://github.com/lukasIO))

## 0.11.4

### Patch Changes

- Add dataprops and allow a template child for BarVisualizer @lukasIO - [#965](https://github.com/livekit/components-js/pull/965) ([@lukasIO](https://github.com/lukasIO))

## 0.11.3

### Patch Changes

- Fix local storage of user choices - [#949](https://github.com/livekit/components-js/pull/949) ([@lukasIO](https://github.com/lukasIO))

- Don't write empty username values to local storage - [#953](https://github.com/livekit/components-js/pull/953) ([@lukasIO](https://github.com/lukasIO))

- Add useVoiceAssistant - [#917](https://github.com/livekit/components-js/pull/917) ([@lukasIO](https://github.com/lukasIO))

## 0.11.2

### Patch Changes

- Add useIsRecording hook - [#931](https://github.com/livekit/components-js/pull/931) ([@lukasIO](https://github.com/lukasIO))

## 0.11.1

### Patch Changes

- Allow custom GridLayout definitions - [#909](https://github.com/livekit/components-js/pull/909) ([@Ocupe](https://github.com/Ocupe))

## 0.11.0

### Minor Changes

- Add participant attribute hooks and update livekit client - [#926](https://github.com/livekit/components-js/pull/926) ([@lukasIO](https://github.com/lukasIO))

## 0.10.5

### Patch Changes

- Fix docs package parameter extraction and forwardRefs components typing - [#912](https://github.com/livekit/components-js/pull/912) ([@lukasIO](https://github.com/lukasIO))

## 0.10.4

### Patch Changes

- Add overload for kind + identity in useRemoteParticipant hook - [#893](https://github.com/livekit/components-js/pull/893) ([@lukasIO](https://github.com/lukasIO))

## 0.10.3

### Patch Changes

- Create emailregex in components-core instead of using a dedicated package - [#895](https://github.com/livekit/components-js/pull/895) ([@lukasIO](https://github.com/lukasIO))

## 0.10.2

### Patch Changes

- Add experimental hooks for transcriptions - [#853](https://github.com/livekit/components-js/pull/853) ([@lukasIO](https://github.com/lukasIO))

## 0.10.1

### Patch Changes

- Add publishOptions for TrackToggle - [#868](https://github.com/livekit/components-js/pull/868) ([@lukasIO](https://github.com/lukasIO))

- Forward track toggle errors - [#869](https://github.com/livekit/components-js/pull/869) ([@lukasIO](https://github.com/lukasIO))

- Reset useChat messages when room disconnects - [#866](https://github.com/livekit/components-js/pull/866) ([@lukasIO](https://github.com/lukasIO))

## 0.10.0

### Minor Changes

- Require livekit-client ^2.1.0 peer dependency - [#830](https://github.com/livekit/components-js/pull/830) ([@lukasIO](https://github.com/lukasIO))

## 0.9.3

### Patch Changes

- Fix participant info observer - [#822](https://github.com/livekit/components-js/pull/822) ([@lukasIO](https://github.com/lukasIO))

## 0.9.2

### Patch Changes

- Update livekit-client to 2.0.10 for Chrome 124 compatibility - [#806](https://github.com/livekit/components-js/pull/806) ([@davidzhao](https://github.com/davidzhao))

## 0.9.1

### Patch Changes

- Add support for a settings modal render prop - [#781](https://github.com/livekit/components-js/pull/781) ([@lukasIO](https://github.com/lukasIO))

## 0.9.0

### Minor Changes

- Remove previously deprecated APIs - [#774](https://github.com/livekit/components-js/pull/774) ([@lukasIO](https://github.com/lukasIO))

- Update to livekit-client v2 - read the migration guide [here](https://docs.livekit.io/guides/migrate-from-v1/)https://docs.livekit.io/guides/migrate-from-v1/ - [#733](https://github.com/livekit/components-js/pull/733) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Initialize useMediaDevices useMediaDeviceSelect with empty array on error - [#770](https://github.com/livekit/components-js/pull/770) ([@lukasIO](https://github.com/lukasIO))

## 0.8.3

### Patch Changes

- Add setLogExtension to core - [#728](https://github.com/livekit/components-js/pull/728) ([@mpnri](https://github.com/mpnri))

- Pin all direct dependencies (Fixes an dependency resolve issue with a broken usehooks-ts release) - [#751](https://github.com/livekit/components-js/pull/751) ([@lukasIO](https://github.com/lukasIO))

## 0.8.2

### Patch Changes

- Fix duplicate chat messages - [#718](https://github.com/livekit/components-js/pull/718) ([@lukasIO](https://github.com/lukasIO))

## 0.8.1

### Patch Changes

- Add useStartVideo hook + update livekit client - [#714](https://github.com/livekit/components-js/pull/714) ([@lukasIO](https://github.com/lukasIO))

- Add support for multiple chat windows - [#713](https://github.com/livekit/components-js/pull/713) ([@lukasIO](https://github.com/lukasIO))

- Add StartMediaButton - [#717](https://github.com/livekit/components-js/pull/717) ([@lukasIO](https://github.com/lukasIO))

- Add onError callback for MediaDeviceSelect - [#710](https://github.com/livekit/components-js/pull/710) ([@lukasIO](https://github.com/lukasIO))

## 0.8.0

### Minor Changes

- Add `usePersistentUserChoices` hook to save user choices saving functionality. - [#683](https://github.com/livekit/components-js/pull/683) ([@Ocupe](https://github.com/Ocupe))

### Patch Changes

- Update PreJoin description and update docs. - [#682](https://github.com/livekit/components-js/pull/682) ([@Ocupe](https://github.com/Ocupe))

## 0.7.0

### Minor Changes

- Update more hooks and components to use `trackRef` and deprecate participant/source property pairs - [#629](https://github.com/livekit/components-js/pull/629) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- fix handling of multiple tracks of the same source from the same participant - [#627](https://github.com/livekit/components-js/pull/627) ([@lukasIO](https://github.com/lukasIO))

- Listen to ParticipantDisconnected event for useTracks hook - [#631](https://github.com/livekit/components-js/pull/631) ([@lukasIO](https://github.com/lukasIO))

- fix handling of multiple tracks of the same source from the same participant - [#627](https://github.com/livekit/components-js/pull/627) ([@lukasIO](https://github.com/lukasIO))

## 0.6.15

### Patch Changes

- Update dependency livekit-client to v1.13.1 - [#606](https://github.com/livekit/components-js/pull/606) ([@renovate](https://github.com/apps/renovate))

- Add useIsEncrypted hooks and display to tile - [#600](https://github.com/livekit/components-js/pull/600) ([@lukasIO](https://github.com/lukasIO))

- Make sure pinning is only attempted when screen share track is subscribed - [#604](https://github.com/livekit/components-js/pull/604) ([@lukasIO](https://github.com/lukasIO))

## 0.6.14

### Patch Changes

- Make sure dependencies arent bundled for esm builds - [#594](https://github.com/livekit/components-js/pull/594) ([@lukasIO](https://github.com/lukasIO))

## 0.6.13

### Patch Changes

- Expose custom message encoder/decoder from video conference - [#581](https://github.com/livekit/components-js/pull/581) ([@jmoguilevsky](https://github.com/jmoguilevsky))

## 0.6.12

### Patch Changes

- Remove unnecessary props from audio and video elements - [#569](https://github.com/livekit/components-js/pull/569) ([@mpnri](https://github.com/mpnri))

- Add unread chat message badge - [#563](https://github.com/livekit/components-js/pull/563) ([@lukasIO](https://github.com/lukasIO))

- Add MediaDevicesError event for use local participant - [#566](https://github.com/livekit/components-js/pull/566) ([@mpnri](https://github.com/mpnri))

- Rename GridLayout to GridLayoutDefinition in core to resolve name overlap. - [#567](https://github.com/livekit/components-js/pull/567) ([@Ocupe](https://github.com/Ocupe))
  Switch to the vertical 2x1 layout a bit earlier if reducing the width of the viewport.

## 0.6.11

### Patch Changes

- Fix initial population of device select - [#554](https://github.com/livekit/components-js/pull/554) ([@lukasIO](https://github.com/lukasIO))

- Make mouse event listener passive - [#551](https://github.com/livekit/components-js/pull/551) ([@lukasIO](https://github.com/lukasIO))

- Fix: Handle track reference type changes in the `updatePages` function by returning the new track reference instead of the old one. - [#560](https://github.com/livekit/components-js/pull/560) ([@Ocupe](https://github.com/Ocupe))

## 0.6.10

### Patch Changes

- Improve PreJoin component by requesting combined permissions when possible - [#537](https://github.com/livekit/components-js/pull/537) ([@lukasIO](https://github.com/lukasIO))

- Improve media device selection - [#535](https://github.com/livekit/components-js/pull/535) ([@lukasIO](https://github.com/lukasIO))

- Update devDependencies (non-major) - [#540](https://github.com/livekit/components-js/pull/540) ([@renovate](https://github.com/apps/renovate))

## 0.6.9

### Patch Changes

- add `setLogLevel` function - [#521](https://github.com/livekit/components-js/pull/521) ([@Ocupe](https://github.com/Ocupe))

- Update active device selection. Require `"livekit-client": "1.11.2"` - [#529](https://github.com/livekit/components-js/pull/529) ([@Ocupe](https://github.com/Ocupe))

- Add screen share feature detection to hide screen share button in control bar. - [#525](https://github.com/livekit/components-js/pull/525) ([@Ocupe](https://github.com/Ocupe))

## 0.6.8

### Patch Changes

- Fix: Only react to topics defined in the message observable - [#516](https://github.com/livekit/components-js/pull/516) ([@lukasIO](https://github.com/lukasIO))

## 0.6.7

### Patch Changes

- Add roomAudioPlaybackAllowedObservable - [#487](https://github.com/livekit/components-js/pull/487) ([@Ocupe](https://github.com/Ocupe))

## 0.6.6

### Patch Changes

- Add options to `setActiveMediaDevice` - [#482](https://github.com/livekit/components-js/pull/482) ([@lukasIO](https://github.com/lukasIO))

## 0.6.5

### Patch Changes

- Fix sourcemaps by not invoking rollup in tsup build - [#464](https://github.com/livekit/components-js/pull/464) ([@lukasIO](https://github.com/lukasIO))

## 0.6.4

### Patch Changes

- Simplify trackReference type #448 - [#456](https://github.com/livekit/components-js/pull/456) ([@lukasIO](https://github.com/lukasIO))

## 0.6.3

### Patch Changes

- Fix source media class on video tracks - [#438](https://github.com/livekit/components-js/pull/438) ([@lukasIO](https://github.com/lukasIO))

## 0.6.2

### Patch Changes

- Fix the carousel component for iOS and fix a possible unstable UI condition. - [#422](https://github.com/livekit/components-js/pull/422) ([@Ocupe](https://github.com/Ocupe))

## 0.6.1

### Patch Changes

- Add data callback to useDataChannel - [#417](https://github.com/livekit/components-js/pull/417) ([@lukasIO](https://github.com/lukasIO))

- Move track filter logic into pagination hook - [#392](https://github.com/livekit/components-js/pull/392) ([@lukasIO](https://github.com/lukasIO))

## 0.6.0

### Minor Changes

- Make trackReferences required for layout comps - [#383](https://github.com/livekit/components-js/pull/383) ([@lukasIO](https://github.com/lukasIO))

## 0.5.1

### Patch Changes

- Enable trackReferences to be used on audio/video track - [#374](https://github.com/livekit/components-js/pull/374) ([@lukasIO](https://github.com/lukasIO))

## 0.5.0

### Minor Changes

- Rename TrackBundle to TrackReference. - [#365](https://github.com/livekit/components-js/pull/365) ([@Ocupe](https://github.com/Ocupe))

- Exclude unknown and screenShareAudio from toggle sources - [#370](https://github.com/livekit/components-js/pull/370) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Fix data channel memory leak - [#360](https://github.com/livekit/components-js/pull/360) ([@Ocupe](https://github.com/Ocupe))

- Listen to ParticipantConnected events in trackBundleObservable - [#364](https://github.com/livekit/components-js/pull/364) ([@lukasIO](https://github.com/lukasIO))

- Bump minimum livekit-client version to 1.7.0 - [#369](https://github.com/livekit/components-js/pull/369) ([@lukasIO](https://github.com/lukasIO))

- Add capture options to toggle - [#356](https://github.com/livekit/components-js/pull/356) ([@lukasIO](https://github.com/lukasIO))

## 0.4.0

### Minor Changes

- Remove TileLoop in favor of TrackLoop. Simplify the TrackLoop component by removing the filter functionality. - [#327](https://github.com/livekit/components-js/pull/327) ([@Ocupe](https://github.com/Ocupe))

### Patch Changes

- GridLayout Revision. - [#326](https://github.com/livekit/components-js/pull/326) ([@Ocupe](https://github.com/Ocupe))

  Renaming:

  - `sortParticipantsByVolume` -> `sortParticipants`

- Rework useDataChannel API - [#340](https://github.com/livekit/components-js/pull/340) ([@lukasIO](https://github.com/lukasIO))

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
