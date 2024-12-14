# @livekit/components-react

## 2.6.11

### Patch Changes

- Use shared logger for krisp hook - [#1044](https://github.com/livekit/components-js/pull/1044) ([@bcherry](https://github.com/bcherry))

- use JS SDK's isLocal check - [#1050](https://github.com/livekit/components-js/pull/1050) ([@davidzhao](https://github.com/davidzhao))

- Updated dependencies [[`ebe78fb658cd6c8b76eedf0465c51b03aa00b305`](https://github.com/livekit/components-js/commit/ebe78fb658cd6c8b76eedf0465c51b03aa00b305)]:
  - @livekit/components-core@0.11.11

## 2.6.10

### Patch Changes

- Make processor initialization work on track create - [#1039](https://github.com/livekit/components-js/pull/1039) ([@lukasIO](https://github.com/lukasIO))

## 2.6.9

### Patch Changes

- Fix Chat usage without layoutcontext - [#1027](https://github.com/livekit/components-js/pull/1027) ([@lukasIO](https://github.com/lukasIO))

- Fix className property on BarVisualizer - [#1029](https://github.com/livekit/components-js/pull/1029) ([@mikljohansson](https://github.com/mikljohansson))

- Forward disconnectReason to onDisconnected callback - [#1031](https://github.com/livekit/components-js/pull/1031) ([@lukasIO](https://github.com/lukasIO))

## 2.6.8

### Patch Changes

- Don't emit connection errors if `connect` is set to false - [#1025](https://github.com/livekit/components-js/pull/1025) ([@lukasIO](https://github.com/lukasIO))

## 2.6.7

### Patch Changes

- Fix initial device selection when mounting useMediaDeviceSelect - [#1014](https://github.com/livekit/components-js/pull/1014) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`5e314414a443c487fc3a4ac687c20bee5f60f0e7`](https://github.com/livekit/components-js/commit/5e314414a443c487fc3a4ac687c20bee5f60f0e7)]:
  - @livekit/components-core@0.11.10

## 2.6.6

### Patch Changes

- Avoid logging activeDevice updates for undefined active devices - [#1012](https://github.com/livekit/components-js/pull/1012) ([@lukasIO](https://github.com/lukasIO))

## 2.6.5

### Patch Changes

- Updated dependencies [[`369d1b443eb831ce700a99531048981f1a1d3db8`](https://github.com/livekit/components-js/commit/369d1b443eb831ce700a99531048981f1a1d3db8)]:
  - @livekit/components-core@0.11.9

## 2.6.4

### Patch Changes

- Use vite for building react package, fixes useKrispNoiseFilter usage - [#994](https://github.com/livekit/components-js/pull/994) ([@lukasIO](https://github.com/lukasIO))

## 2.6.3

### Patch Changes

- Move useKrispNoiseFilter into dedicated import path - [#991](https://github.com/livekit/components-js/pull/991) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`a353a3b52303d167f0e04d34caeb90bab36244ba`](https://github.com/livekit/components-js/commit/a353a3b52303d167f0e04d34caeb90bab36244ba)]:
  - @livekit/components-core@0.11.8

## 2.6.2

### Patch Changes

- Add krisp hook - [#986](https://github.com/livekit/components-js/pull/986) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`302bbb776cea1391c51c167127023d696a2dbab8`](https://github.com/livekit/components-js/commit/302bbb776cea1391c51c167127023d696a2dbab8)]:
  - @livekit/components-core@0.11.7

## 2.6.1

### Patch Changes

- Improve bar visualizer animations and add initializing state - [#987](https://github.com/livekit/components-js/pull/987) ([@mattherzog](https://github.com/mattherzog))

- Add support for new chat API - [#979](https://github.com/livekit/components-js/pull/979) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`3a8495fd70489bc09b801fb743afe850950c3871`](https://github.com/livekit/components-js/commit/3a8495fd70489bc09b801fb743afe850950c3871), [`22fa65e4715490216577223ab07ce14f6ff7917d`](https://github.com/livekit/components-js/commit/22fa65e4715490216577223ab07ce14f6ff7917d)]:
  - @livekit/components-core@0.11.6

## 2.6.0

### Minor Changes

- Update agent state property name to `lk.agent.state` - [#976](https://github.com/livekit/components-js/pull/976) ([@bcherry](https://github.com/bcherry))

### Patch Changes

- Add StartMediaButton to public API - [#978](https://github.com/livekit/components-js/pull/978) ([@junsumida](https://github.com/junsumida))

- Update agent component docs - [#973](https://github.com/livekit/components-js/pull/973) ([@lukasIO](https://github.com/lukasIO))

## 2.5.4

### Patch Changes

- Updated dependencies [[`3b66cf356a90973e0cb1abc3a6d6c56880c4eb58`](https://github.com/livekit/components-js/commit/3b66cf356a90973e0cb1abc3a6d6c56880c4eb58)]:
  - @livekit/components-core@0.11.5

## 2.5.3

### Patch Changes

- Add dataprops and allow a template child for BarVisualizer @lukasIO - [#965](https://github.com/livekit/components-js/pull/965) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`a77a52eeb415701f0e233e9f2304b7de2d754397`](https://github.com/livekit/components-js/commit/a77a52eeb415701f0e233e9f2304b7de2d754397)]:
  - @livekit/components-core@0.11.4

## 2.5.2

### Patch Changes

- Don't override className on BarVisualizer - [#963](https://github.com/livekit/components-js/pull/963) ([@lukasIO](https://github.com/lukasIO))

## 2.5.1

### Patch Changes

- Add css var fallbacks and fix className forwarding on BarVisualizer - [#961](https://github.com/livekit/components-js/pull/961) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies []:
  - @livekit/components-core@0.11.3

## 2.5.0

### Minor Changes

- Stateful BarVisualizer and VoiceAssistantControlBar - [#954](https://github.com/livekit/components-js/pull/954) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Fix local storage of user choices - [#949](https://github.com/livekit/components-js/pull/949) ([@lukasIO](https://github.com/lukasIO))

- Add useVoiceAssistant - [#917](https://github.com/livekit/components-js/pull/917) ([@lukasIO](https://github.com/lukasIO))

- Fix state update on participant attributes hook - [#957](https://github.com/livekit/components-js/pull/957) ([@lukasIO](https://github.com/lukasIO))

- Add callback option to trackTranscription hook - [#939](https://github.com/livekit/components-js/pull/939) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`cb45f42912a08a2ab8c03b1e5109eb24d1d78180`](https://github.com/livekit/components-js/commit/cb45f42912a08a2ab8c03b1e5109eb24d1d78180), [`9b1a2596f4068c68ac8780c119426cbb55a4ca3f`](https://github.com/livekit/components-js/commit/9b1a2596f4068c68ac8780c119426cbb55a4ca3f), [`d35dffd16131cac43279300071c595f30981767f`](https://github.com/livekit/components-js/commit/d35dffd16131cac43279300071c595f30981767f)]:
  - @livekit/components-core@0.11.3

## 2.4.3

### Patch Changes

- Expose useIsRecording hook with optional room param - [#934](https://github.com/livekit/components-js/pull/934) ([@lukasIO](https://github.com/lukasIO))

## 2.4.2

### Patch Changes

- Add useIsRecording hook - [#931](https://github.com/livekit/components-js/pull/931) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`ddb2451790be04b03dbce4f7fc2fb52c19ff7843`](https://github.com/livekit/components-js/commit/ddb2451790be04b03dbce4f7fc2fb52c19ff7843)]:
  - @livekit/components-core@0.11.2

## 2.4.1

### Patch Changes

- Allow custom GridLayout definitions - [#909](https://github.com/livekit/components-js/pull/909) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`5a17214da6d516e52f7f6917e3fcbe86aaa3805f`](https://github.com/livekit/components-js/commit/5a17214da6d516e52f7f6917e3fcbe86aaa3805f)]:
  - @livekit/components-core@0.11.1

## 2.4.0

### Minor Changes

- Add participant attribute hooks and update livekit client - [#926](https://github.com/livekit/components-js/pull/926) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Add onDeviceError callback to ControlBar - [#921](https://github.com/livekit/components-js/pull/921) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`4245444ad0212f3eb33920216a65b5d0b9a0637c`](https://github.com/livekit/components-js/commit/4245444ad0212f3eb33920216a65b5d0b9a0637c)]:
  - @livekit/components-core@0.11.0

## 2.3.6

### Patch Changes

- Remove @react-hook dependency due to ESM conflicts - [#919](https://github.com/livekit/components-js/pull/919) ([@lukasIO](https://github.com/lukasIO))

## 2.3.5

### Patch Changes

- Fix docs package parameter extraction and forwardRefs components typing - [#912](https://github.com/livekit/components-js/pull/912) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`cd447a1da49645a3966323c73ba18f16bf81fcef`](https://github.com/livekit/components-js/commit/cd447a1da49645a3966323c73ba18f16bf81fcef)]:
  - @livekit/components-core@0.10.5

## 2.3.4

### Patch Changes

- Update usehooks-ts to v3 - [#885](https://github.com/livekit/components-js/pull/885) ([@renovate](https://github.com/apps/renovate))

- Add overload for kind + identity in useRemoteParticipant hook - [#893](https://github.com/livekit/components-js/pull/893) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`fcc23749ebd9209f29cbe47ec93e643eeb057a26`](https://github.com/livekit/components-js/commit/fcc23749ebd9209f29cbe47ec93e643eeb057a26)]:
  - @livekit/components-core@0.10.4

## 2.3.3

### Patch Changes

- Fix `useRemoteParticipant` re-rendering on participant events - [#891](https://github.com/livekit/components-js/pull/891) ([@mpnri](https://github.com/mpnri))

- Updated dependencies [[`f09491284e935fa7e1af6cae0870bcb09926f722`](https://github.com/livekit/components-js/commit/f09491284e935fa7e1af6cae0870bcb09926f722)]:
  - @livekit/components-core@0.10.3

## 2.3.2

### Patch Changes

- Support passing room to useIsEncrypted hook - [#871](https://github.com/livekit/components-js/pull/871) ([@renekliment](https://github.com/renekliment))

- Update focused placeholder to trackRef - [#874](https://github.com/livekit/components-js/pull/874) ([@lukasIO](https://github.com/lukasIO))

## 2.3.1

### Patch Changes

- Add experimental hooks for transcriptions - [#853](https://github.com/livekit/components-js/pull/853) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`79636e4f9ac72a4e608d5d28ccaf337bcb2a6514`](https://github.com/livekit/components-js/commit/79636e4f9ac72a4e608d5d28ccaf337bcb2a6514)]:
  - @livekit/components-core@0.10.2

## 2.3.0

### Minor Changes

- Reset useChat messages when room disconnects - [#866](https://github.com/livekit/components-js/pull/866) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Add publishOptions for TrackToggle - [#868](https://github.com/livekit/components-js/pull/868) ([@lukasIO](https://github.com/lukasIO))

- Forward track toggle errors - [#869](https://github.com/livekit/components-js/pull/869) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`bdfd3f53875ffc79024f8290b5302cf20eaed664`](https://github.com/livekit/components-js/commit/bdfd3f53875ffc79024f8290b5302cf20eaed664), [`b9136108c654906d693fb17db577d5f939d98ad1`](https://github.com/livekit/components-js/commit/b9136108c654906d693fb17db577d5f939d98ad1), [`3b257b19da111d52d6d554467024973e3922fa6c`](https://github.com/livekit/components-js/commit/3b257b19da111d52d6d554467024973e3922fa6c)]:
  - @livekit/components-core@0.10.1

## 2.2.1

### Patch Changes

- Update docs for default connect value in LiveKitRoom - [#840](https://github.com/livekit/components-js/pull/840) ([@davidliu](https://github.com/davidliu))

- Fix duplicated incoming audio when using AudioTrack renderer and its muted property - [#855](https://github.com/livekit/components-js/pull/855) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies []:
  - @livekit/components-core@0.10.0

## 2.2.0

### Minor Changes

- Don't auto subscribe to all audio tracks automatically in RoomAudioRenderer - [#847](https://github.com/livekit/components-js/pull/847) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Fix docs for TrackMutedIndicator accepting track references - [#846](https://github.com/livekit/components-js/pull/846) ([@lukasIO](https://github.com/lukasIO))

- Fix releasing of local tracks in prejoin - [#844](https://github.com/livekit/components-js/pull/844) ([@lukasIO](https://github.com/lukasIO))

## 2.1.3

### Patch Changes

- Fix participant tile audio muted data prop - [#838](https://github.com/livekit/components-js/pull/838) ([@lukasIO](https://github.com/lukasIO))

- Remove useForwardedRef redeclaration - [#839](https://github.com/livekit/components-js/pull/839) ([@lukasIO](https://github.com/lukasIO))

- Fix prejoin track lock release - [#842](https://github.com/livekit/components-js/pull/842) ([@lukasIO](https://github.com/lukasIO))

## 2.1.2

### Patch Changes

- Forward AudioTrack ref via imperative handle (fixes audio rendering) - [#835](https://github.com/livekit/components-js/pull/835) ([@lukasIO](https://github.com/lukasIO))

## 2.1.1

### Patch Changes

- Fix video rendering, use imperative handle to forward ref - [#831](https://github.com/livekit/components-js/pull/831) ([@lukasIO](https://github.com/lukasIO))

## 2.1.0

### Minor Changes

- Require livekit-client ^2.1.0 peer dependency - [#830](https://github.com/livekit/components-js/pull/830) ([@lukasIO](https://github.com/lukasIO))

- Support referencing components via refs - [#827](https://github.com/livekit/components-js/pull/827) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Improve track acquiring and handling in usePreviewTracks - [#830](https://github.com/livekit/components-js/pull/830) ([@lukasIO](https://github.com/lukasIO))

- Use participant array length to re-trigger sorting - [#829](https://github.com/livekit/components-js/pull/829) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`ccd551f98037427d92bb6e14560f972458a4544d`](https://github.com/livekit/components-js/commit/ccd551f98037427d92bb6e14560f972458a4544d)]:
  - @livekit/components-core@0.10.0

## 2.0.6

### Patch Changes

- Request device permissions when opening media device menu - [#820](https://github.com/livekit/components-js/pull/820) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`8c4e196adfe0f85e9eef5d6045eeda19d78a8e03`](https://github.com/livekit/components-js/commit/8c4e196adfe0f85e9eef5d6045eeda19d78a8e03)]:
  - @livekit/components-core@0.9.3

## 2.0.5

### Patch Changes

- Revert "Request device permissions when opening menu" due to change in behavior - [#810](https://github.com/livekit/components-js/pull/810) ([@davidzhao](https://github.com/davidzhao))

## 2.0.4

### Patch Changes

- Request device permissions when opening media device menu - [#800](https://github.com/livekit/components-js/pull/800) ([@lukasIO](https://github.com/lukasIO))

- Update livekit-client to 2.0.10 for Chrome 124 compatibility - [#806](https://github.com/livekit/components-js/pull/806) ([@davidzhao](https://github.com/davidzhao))

- Updated dependencies [[`24de53696cd6c90cf32f0e35d3b64d6b20d8dc5b`](https://github.com/livekit/components-js/commit/24de53696cd6c90cf32f0e35d3b64d6b20d8dc5b)]:
  - @livekit/components-core@0.9.2

## 2.0.3

### Patch Changes

- Stop propagation of key events on chat input element - [#798](https://github.com/livekit/components-js/pull/798) ([@lukasIO](https://github.com/lukasIO))

- Update docs for useDisconnectButton - [#796](https://github.com/livekit/components-js/pull/796) ([@lukasIO](https://github.com/lukasIO))

## 2.0.2

### Patch Changes

- Remove unintended character in video conference view - [#794](https://github.com/livekit/components-js/pull/794) ([@lukasIO](https://github.com/lukasIO))

## 2.0.1

### Patch Changes

- Fix check for process in style warning - [#782](https://github.com/livekit/components-js/pull/782) ([@lukasIO](https://github.com/lukasIO))

- Add support for a settings modal render prop - [#781](https://github.com/livekit/components-js/pull/781) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`344dd70e23c7a1184cab6c066d5cf6ef9c919eb2`](https://github.com/livekit/components-js/commit/344dd70e23c7a1184cab6c066d5cf6ef9c919eb2)]:
  - @livekit/components-core@0.9.1

## 2.0.0

### Major Changes

- Remove previously deprecated APIs - [#774](https://github.com/livekit/components-js/pull/774) ([@lukasIO](https://github.com/lukasIO))

- Add useParticipantTracks and remove useTrack hook - [#729](https://github.com/livekit/components-js/pull/729) ([@lukasIO](https://github.com/lukasIO))

- Update to livekit-client v2 - read the migration guide [here](https://docs.livekit.io/guides/migrate-from-v1/)https://docs.livekit.io/guides/migrate-from-v1/ - [#733](https://github.com/livekit/components-js/pull/733) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Initialize useMediaDevices useMediaDeviceSelect with empty array on error - [#770](https://github.com/livekit/components-js/pull/770) ([@lukasIO](https://github.com/lukasIO))

- Do not crash in usePreviewDevice when user has not granted permission to media device - [#768](https://github.com/livekit/components-js/pull/768) ([@dnetteln](https://github.com/dnetteln))

- Catch callback executions when chained as props - [#771](https://github.com/livekit/components-js/pull/771) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`6d3e25c593923eb86ee66b76455bb55a7da779b5`](https://github.com/livekit/components-js/commit/6d3e25c593923eb86ee66b76455bb55a7da779b5), [`e00d930a80bbcba30933656c484e064a683c5408`](https://github.com/livekit/components-js/commit/e00d930a80bbcba30933656c484e064a683c5408), [`5fa2d6b33c591a5cf511c015d066546c983bf2aa`](https://github.com/livekit/components-js/commit/5fa2d6b33c591a5cf511c015d066546c983bf2aa)]:
  - @livekit/components-core@0.9.0

## 1.5.3

### Patch Changes

- Add possibility to edit/update chat messages - [#757](https://github.com/livekit/components-js/pull/757) ([@lukasIO](https://github.com/lukasIO))

- Use room as dependency to recreate localParticipant observable - [#753](https://github.com/livekit/components-js/pull/753) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies []:
  - @livekit/components-core@0.8.3

## 1.5.2

### Patch Changes

- Added close button in chat screen - [#740](https://github.com/livekit/components-js/pull/740) ([@govind-io](https://github.com/govind-io))

- Add useTrackVolume hooks - [#735](https://github.com/livekit/components-js/pull/735) ([@lukasIO](https://github.com/lukasIO))

- Log error on non-ok http statuses of useToken - [#739](https://github.com/livekit/components-js/pull/739) ([@lukasIO](https://github.com/lukasIO))

- Pin all direct dependencies (Fixes an dependency resolve issue with a broken usehooks-ts release) - [#751](https://github.com/livekit/components-js/pull/751) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`e805d41b`](https://github.com/livekit/components-js/commit/e805d41b424b4c5618caff87bab65dbf5fbb648f), [`3e15bde4`](https://github.com/livekit/components-js/commit/3e15bde4720309869dc8f6b42ea7263f1bc8319e)]:
  - @livekit/components-core@0.8.3

## 1.5.1

### Patch Changes

- Fix render loop in TrackToggle onChange - [#734](https://github.com/livekit/components-js/pull/734) ([@harrywebdev](https://github.com/harrywebdev))

## 1.5.0

### Minor Changes

- Add an `isUserInitiated` argument to the `onChange` callback on the `TrackToggle` component. - [#732](https://github.com/livekit/components-js/pull/732) ([@Ocupe](https://github.com/Ocupe))

### Patch Changes

- Emit missing style warning on VideoConference when in development mode - [#720](https://github.com/livekit/components-js/pull/720) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies []:
  - @livekit/components-core@0.8.2

## 1.4.2

### Patch Changes

- Updated dependencies [[`7017b588`](https://github.com/livekit/components-js/commit/7017b58897f54736e9d5db63b9c6da8d446516fb)]:
  - @livekit/components-core@0.8.2

## 1.4.1

### Patch Changes

- Surface encryption error on LiveKitRoom - [#706](https://github.com/livekit/components-js/pull/706) ([@lukasIO](https://github.com/lukasIO))

- Add useStartVideo hook + update livekit client - [#714](https://github.com/livekit/components-js/pull/714) ([@lukasIO](https://github.com/lukasIO))

- Add support for multiple chat windows - [#713](https://github.com/livekit/components-js/pull/713) ([@lukasIO](https://github.com/lukasIO))

- Add StartMediaButton - [#717](https://github.com/livekit/components-js/pull/717) ([@lukasIO](https://github.com/lukasIO))

- Add onError callback for MediaDeviceSelect - [#710](https://github.com/livekit/components-js/pull/710) ([@lukasIO](https://github.com/lukasIO))

- Expose icons and hooks necessary to recreate participant tile - [#716](https://github.com/livekit/components-js/pull/716) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`da5ffe3b`](https://github.com/livekit/components-js/commit/da5ffe3b867de4d8567a544597905dd9b2fc8fd9), [`adc3d042`](https://github.com/livekit/components-js/commit/adc3d0427745000b73b70971297e9496c7eee9d6), [`11ec05d4`](https://github.com/livekit/components-js/commit/11ec05d4a753cd4e317e5031ccdb66137cab49b5), [`2dab3b08`](https://github.com/livekit/components-js/commit/2dab3b0855b09eb8c72c4c0c6fc63de5d5f6384d)]:
  - @livekit/components-core@0.8.1

## 1.4.0

### Minor Changes

- Add `usePersistentUserChoices` hook to save user choices saving functionality. - [#683](https://github.com/livekit/components-js/pull/683) ([@Ocupe](https://github.com/Ocupe))

- Deprecate showE2EE options on PreJoin - [#693](https://github.com/livekit/components-js/pull/693) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Use more specific prop types for audio and video track - [#681](https://github.com/livekit/components-js/pull/681) ([@lukasIO](https://github.com/lukasIO))

- Update PreJoin description and update docs. - [#682](https://github.com/livekit/components-js/pull/682) ([@Ocupe](https://github.com/Ocupe))

- Fix `useTrackRef` for certain cases. - [#692](https://github.com/livekit/components-js/pull/692) ([@Ocupe](https://github.com/Ocupe))

- Fix chat messages are not scrollable. - [#662](https://github.com/livekit/components-js/pull/662) ([@Ocupe](https://github.com/Ocupe))

- Export isTrackReference - [#696](https://github.com/livekit/components-js/pull/696) ([@lukasIO](https://github.com/lukasIO))

- Allow track placeholders to be pinned - [#666](https://github.com/livekit/components-js/pull/666) ([@lukasIO](https://github.com/lukasIO))

- Remove non-exposed orphaned icons `QualityUnknownIcon.tsx` and `UserSilhouetteIcon.tsx`. - [#647](https://github.com/livekit/components-js/pull/647) ([@hehehai](https://github.com/hehehai))

- Updated dependencies [[`01611f5d`](https://github.com/livekit/components-js/commit/01611f5d2498c8dcdc231e5e305f281c9c2d9311), [`946d2b06`](https://github.com/livekit/components-js/commit/946d2b06d78a5f8ab721a98fbebe6b16a2e98463)]:
  - @livekit/components-core@0.8.0

## 1.3.0

### Minor Changes

- Add `volume` and `muted` control to `RoomAudioRenderer` and `AudioTrack`. Include to render `Track.Source.Unknown` in `RoomAudioRenderer` as long as they are of king `Track.Kind.Audio`. - [#648](https://github.com/livekit/components-js/pull/648) ([@Ocupe](https://github.com/Ocupe))

## 1.2.2

### Patch Changes

- Initialize canPlayAudio with room state - [#646](https://github.com/livekit/components-js/pull/646) ([@lukasIO](https://github.com/lukasIO))

## 1.2.1

### Patch Changes

- Set the default value for `canPlayAudio` returned by the `useStartAudio` hook to `true` to avoid flashing issues. - [#641](https://github.com/livekit/components-js/pull/641) ([@harrisonlo](https://github.com/harrisonlo))

## 1.2.0

### Minor Changes

- fix handling of multiple tracks of the same source from the same participant - [#627](https://github.com/livekit/components-js/pull/627) ([@lukasIO](https://github.com/lukasIO))

- Update more hooks and components to use `trackRef` and deprecate participant/source property pairs - [#629](https://github.com/livekit/components-js/pull/629) ([@lukasIO](https://github.com/lukasIO))

- refactor `ParticipantTile` and `useParticipantTile` to trackRef and rename `TrackContext` to `TrackRefContext`. - [#627](https://github.com/livekit/components-js/pull/627) ([@lukasIO](https://github.com/lukasIO))

- Update AudioTrack and VideoTrack components to accept track references. - [#627](https://github.com/livekit/components-js/pull/627) ([@lukasIO](https://github.com/lukasIO))

### Patch Changes

- Make `source` and `participant` props optional for `UseParticipantTileProps`. - [#632](https://github.com/livekit/components-js/pull/632) ([@Ocupe](https://github.com/Ocupe))

- Add internal feature flag support - [#637](https://github.com/livekit/components-js/pull/637) ([@lukasIO](https://github.com/lukasIO))

- fix handling of multiple tracks of the same source from the same participant - [#627](https://github.com/livekit/components-js/pull/627) ([@lukasIO](https://github.com/lukasIO))

- Update and add doc strings for all components. - [#633](https://github.com/livekit/components-js/pull/633) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`999eb2ca`](https://github.com/livekit/components-js/commit/999eb2ca85f6d9cab16988f2815974d5f394e4ee), [`71690916`](https://github.com/livekit/components-js/commit/71690916a80d053fe6457c66f3fa3b584b69c5fe), [`999eb2ca`](https://github.com/livekit/components-js/commit/999eb2ca85f6d9cab16988f2815974d5f394e4ee), [`d5b2093b`](https://github.com/livekit/components-js/commit/d5b2093b1999df891cdd6fbe7b350c488b330cf7)]:
  - @livekit/components-core@0.7.0

## 1.1.8

### Patch Changes

- Add e2ee user choices to PreJoin component - [#624](https://github.com/livekit/components-js/pull/624) ([@lukasIO](https://github.com/lukasIO))

- Apply default passphrase in PreJoin - [#625](https://github.com/livekit/components-js/pull/625) ([@lukasIO](https://github.com/lukasIO))

- Fix: media tracks were memoized on participant identity - [#620](https://github.com/livekit/components-js/pull/620) ([@dbkr](https://github.com/dbkr))

## 1.1.7

### Patch Changes

- Fix occasional black tiles, unsusbscribe if intersection entry is still not intersecting - [#619](https://github.com/livekit/components-js/pull/619) ([@lukasIO](https://github.com/lukasIO))

## 1.1.6

### Patch Changes

- Pass participant explicitly to useIsEncrypted - [#607](https://github.com/livekit/components-js/pull/607) ([@lukasIO](https://github.com/lukasIO))

## 1.1.5

### Patch Changes

- Update dependency livekit-client to v1.13.1 - [#606](https://github.com/livekit/components-js/pull/606) ([@renovate](https://github.com/apps/renovate))

- Add useIsEncrypted hooks and display to tile - [#600](https://github.com/livekit/components-js/pull/600) ([@lukasIO](https://github.com/lukasIO))

- Make sure pinning is only attempted when screen share track is subscribed - [#604](https://github.com/livekit/components-js/pull/604) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`d5dadd2`](https://github.com/livekit/components-js/commit/d5dadd2991a415545ff0b6d392197c5be01cb43d), [`49de8d7`](https://github.com/livekit/components-js/commit/49de8d7755fc408d02c94afdb2e94d8ca75af6c3), [`915b371`](https://github.com/livekit/components-js/commit/915b371b9c9195a09173a3ff73c6d772fe71e248)]:
  - @livekit/components-core@0.6.15

## 1.1.4

### Patch Changes

- Automatically generate doc meta-data.json file - [#601](https://github.com/livekit/components-js/pull/601) ([@Ocupe](https://github.com/Ocupe))

## 1.1.3

### Patch Changes

- Use different import scheme for usehooks - [#595](https://github.com/livekit/components-js/pull/595) ([@lukasIO](https://github.com/lukasIO))

## 1.1.2

### Patch Changes

- Make sure dependencies arent bundled for esm builds - [#594](https://github.com/livekit/components-js/pull/594) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`ca225fa`](https://github.com/livekit/components-js/commit/ca225fa76ed24f7488d41439692dbc0d35e2dd0c)]:
  - @livekit/components-core@0.6.14

## 1.1.1

### Patch Changes

- Expose custom message encoder/decoder from video conference - [#581](https://github.com/livekit/components-js/pull/581) ([@jmoguilevsky](https://github.com/jmoguilevsky))

- Fix loop component docs - [#584](https://github.com/livekit/components-js/pull/584) ([@lukasIO](https://github.com/lukasIO))

- Enable auto managed subscriptions for ParticipantTile - [#590](https://github.com/livekit/components-js/pull/590) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`f1ed9cf`](https://github.com/livekit/components-js/commit/f1ed9cf4ec0ecc0a321380a163e90f03e8b32158)]:
  - @livekit/components-core@0.6.13

## 1.1.0

### Minor Changes

- Codebase consistency: Consistently use named functions instead of arrow functions for exported top-level elements. Consistently use `interface` instead of `type` for component properties. - [#564](https://github.com/livekit/components-js/pull/564) ([@Ocupe](https://github.com/Ocupe))

### Patch Changes

- Remove unnecessary props from audio and video elements - [#569](https://github.com/livekit/components-js/pull/569) ([@mpnri](https://github.com/mpnri))

- Move Hooks into hook dir. Expose `useFocusToggle` and `useToggleChat` hooks. - [#565](https://github.com/livekit/components-js/pull/565) ([@Ocupe](https://github.com/Ocupe))

- Merge control bar classname with passed props - [#582](https://github.com/livekit/components-js/pull/582) ([@lukasIO](https://github.com/lukasIO))

- Add unread chat message badge - [#563](https://github.com/livekit/components-js/pull/563) ([@lukasIO](https://github.com/lukasIO))

- Add MediaDevicesError event for use local participant - [#566](https://github.com/livekit/components-js/pull/566) ([@mpnri](https://github.com/mpnri))

- Rename GridLayout to GridLayoutDefinition in core to resolve name overlap. - [#567](https://github.com/livekit/components-js/pull/567) ([@Ocupe](https://github.com/Ocupe))
  Switch to the vertical 2x1 layout a bit earlier if reducing the width of the viewport.

- Make touch events passive - [#561](https://github.com/livekit/components-js/pull/561) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`5f018d5`](https://github.com/livekit/components-js/commit/5f018d5773f31a756e83b76152627cab991b4d3b), [`8a1964a`](https://github.com/livekit/components-js/commit/8a1964a821a568b24856186bdd118768cc24e78c), [`95f48c0`](https://github.com/livekit/components-js/commit/95f48c0ab2768f2f4a3cc5f399e7100d8db9a21a), [`1a9851b`](https://github.com/livekit/components-js/commit/1a9851b9ecdd48e22ef3c4e17a3795086f06e979)]:
  - @livekit/components-core@0.6.12

## 1.0.8

### Patch Changes

- Added facingMode detection to minimize unwanted local participant video track mirroring. - [#527](https://github.com/livekit/components-js/pull/527) ([@Ocupe](https://github.com/Ocupe))

- Add overload for defaulting to undefined topic - [#552](https://github.com/livekit/components-js/pull/552) ([@lukasIO](https://github.com/lukasIO))

- Add data-lk-orientation for all video tracks - [#559](https://github.com/livekit/components-js/pull/559) ([@nwang92](https://github.com/nwang92))

- Only render layout components in browser (no SSR) in order to avoid useLayoutEffect warnings - [#553](https://github.com/livekit/components-js/pull/553) ([@lukasIO](https://github.com/lukasIO))

- Display active state of chat toggle - [#549](https://github.com/livekit/components-js/pull/549) ([@lukasIO](https://github.com/lukasIO))

- Updated dependencies [[`64a95f0`](https://github.com/livekit/components-js/commit/64a95f0c957df0fbbc24a01ce41be390de0332bd), [`e82e88b`](https://github.com/livekit/components-js/commit/e82e88bcf70b6e2185cf6d0b596083557c3fc4bc), [`05c7a70`](https://github.com/livekit/components-js/commit/05c7a70981ac5ece1a6011e335ef6a86252bc243)]:
  - @livekit/components-core@0.6.11

## 1.0.7

### Patch Changes

- Improve PreJoin component by requesting combined permissions when possible - [#537](https://github.com/livekit/components-js/pull/537) ([@lukasIO](https://github.com/lukasIO))

- Improve media device selection - [#535](https://github.com/livekit/components-js/pull/535) ([@lukasIO](https://github.com/lukasIO))

- Update devDependencies (non-major) - [#540](https://github.com/livekit/components-js/pull/540) ([@renovate](https://github.com/apps/renovate))

- Updated dependencies [[`9829600`](https://github.com/livekit/components-js/commit/98296009c5e228ce440f0285d84a3fe49ad20801), [`99878de`](https://github.com/livekit/components-js/commit/99878de51a59dedcf8758b912541123a64a66d3d), [`f7fdbc5`](https://github.com/livekit/components-js/commit/f7fdbc5adacbf05f7e7e33b131777db08cd727aa)]:
  - @livekit/components-core@0.6.10

## 1.0.6

### Patch Changes

- Fix autofocus logic in the `VideoConference` component that prevented screen sharing from being removed from focus. Fix `usePinnedTracks` not returning `undefined` state. - [#519](https://github.com/livekit/components-js/pull/519) ([@Ocupe](https://github.com/Ocupe))

- Update active device selection. Require `"livekit-client": "1.11.2"` - [#529](https://github.com/livekit/components-js/pull/529) ([@Ocupe](https://github.com/Ocupe))

- Add screen share feature detection to hide screen share button in control bar. - [#525](https://github.com/livekit/components-js/pull/525) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`7c7cc55`](https://github.com/livekit/components-js/commit/7c7cc552b58bdfcc1ba15a4724e652bf188f1ea8), [`fdab2db`](https://github.com/livekit/components-js/commit/fdab2db9326db93024b0c3002956806d57164055), [`28ac866`](https://github.com/livekit/components-js/commit/28ac86691c5ff489833b5f02e88e9ef40e33acc0)]:
  - @livekit/components-core@0.6.9

## 1.0.5

### Patch Changes

- Updated dependencies [[`d71f8fa`](https://github.com/livekit/components-js/commit/d71f8fa401e4345359e49ee2a9947f80941fe65b)]:
  - @livekit/components-core@0.6.8

## 1.0.4

### Patch Changes

- Improve carousel view stability on overflow - [#499](https://github.com/livekit/components-js/pull/499) ([@lukasIO](https://github.com/lukasIO))

- Set correct starting value for useAudioPlayback hook - [#514](https://github.com/livekit/components-js/pull/514) ([@lukasIO](https://github.com/lukasIO))

- Fix participant tile always rendering camera track - [#498](https://github.com/livekit/components-js/pull/498) ([@lukasIO](https://github.com/lukasIO))

- Catch publish promises when first connecting room - [#501](https://github.com/livekit/components-js/pull/501) ([@lukasIO](https://github.com/lukasIO))

- Correct export of LayoutContextType #491 - [#495](https://github.com/livekit/components-js/pull/495) ([@Ocupe](https://github.com/Ocupe))

- Stringify room options - [#489](https://github.com/livekit/components-js/pull/489) ([@lukasIO](https://github.com/lukasIO))

- Fix default values in docs - [#502](https://github.com/livekit/components-js/pull/502) ([@lukasIO](https://github.com/lukasIO))

## 1.0.3

### Patch Changes

- Remove unneeded console.log - [#485](https://github.com/livekit/components-js/pull/485) ([@davidzhao](https://github.com/davidzhao))

- Add `usePreviewDevice`, `useStartAudio` and newly created `useAudioPlayback` hooks to public API. - [#487](https://github.com/livekit/components-js/pull/487) ([@Ocupe](https://github.com/Ocupe))

- Updated dependencies [[`a63d293`](https://github.com/livekit/components-js/commit/a63d293cbfb939d6633163e203b70fa0ba5399e5)]:
  - @livekit/components-core@0.6.7

## 1.0.2

### Patch Changes

- Updated dependencies [[`73df060`](https://github.com/livekit/components-js/commit/73df060a5e72fe3526c7dec0dfc0355f25ef42a9)]:
  - @livekit/components-core@0.6.6

## 1.0.1

### Patch Changes

- Fix audio volume set to 0 and prevent false warning when setting volume on AudioTrack. - [#471](https://github.com/livekit/components-js/pull/471) ([@Ocupe](https://github.com/Ocupe))

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
