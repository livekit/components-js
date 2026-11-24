# Exploratory bootstrap intervals

Candidate minus baseline, in milliseconds; negative means faster. Independent resampling within each arm, 20,000 iterations, seed 3610, percentile 95% intervals. Each arm has only ten observations. These intervals are descriptive, unadjusted for multiple comparisons, and do not establish production significance. No new benchmark runs.

This analysis uses the conventional median (average of the two middle observations), while the original README table uses nearest-rank p50. Small differences are expected. Greeting includes SFU participant-announcement behavior; it does not isolate publication.

| Scenario           | Microphone-ready UI | Greeting audio (policy-dependent) |    Response audio |
| ------------------ | ------------------: | --------------------------------: | ----------------: |
| nearby-fast-device |       +11 [-5, +20] |                    -28 [-49, -11] |    -27 [-46, -13] |
| remote-fast-device |     -14 [-20, +110] |                   +20 [-14, +140] |     +2 [-6, +126] |
| remote-slow-device |   -206 [-213, -199] |                 -623 [-651, -598] | -128 [-165, -114] |
| slow-credentials   |      -11 [-73, +96] |                    +1 [-67, +111] |    +8 [-53, +114] |
| permission-prompt  |   -207 [-216, -199] |              -1838 [-1851, -1818] | -162 [-179, -140] |
