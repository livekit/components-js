"""Reproduce exploratory uncertainty intervals from the committed microphone-only samples."""

import csv
import math
import random
import statistics
from pathlib import Path

samples = Path(__file__).resolve().parents[1] / "benchmarks/session-experience/samples.csv"
with samples.open() as source:
    rows = list(csv.DictReader(source))

metrics = ("readyToTalkUiMs", "greetingAudioMs", "responseAudioMs")
rng = random.Random(3610)
iterations = 20_000

print("# Exploratory bootstrap intervals\n")
print("Candidate minus baseline, in milliseconds; negative means faster. Independent resampling "
      "within each arm, 20,000 iterations, seed 3610, percentile 95% intervals. Each arm has "
      "only ten observations. These intervals are descriptive, unadjusted for multiple "
      "comparisons, and do not establish production significance. No new benchmark runs.\n")
print("This analysis uses the conventional median (average of the two middle observations), "
      "while the original README table uses nearest-rank p50. Small differences are expected. "
      "Greeting includes SFU participant-announcement behavior; it does not isolate publication.\n")
print("| Scenario | Microphone-ready UI | Greeting audio (policy-dependent) | Response audio |")
print("| --- | ---: | ---: | ---: |")
for scenario in dict.fromkeys(row["scenario"] for row in rows):
    cells = []
    for metric in metrics:
        baseline = [float(row[metric]) for row in rows
                    if row["scenario"] == scenario and row["prepared"] == "False"]
        candidate = [float(row[metric]) for row in rows
                     if row["scenario"] == scenario and row["prepared"] == "True"]
        assert len(baseline) == len(candidate) == 10
        delta = statistics.median(candidate) - statistics.median(baseline)
        draws = sorted(statistics.median(rng.choices(candidate, k=len(candidate))) -
                       statistics.median(rng.choices(baseline, k=len(baseline)))
                       for _ in range(iterations))
        low = draws[math.ceil(0.025 * iterations) - 1]
        high = draws[math.ceil(0.975 * iterations) - 1]
        cells.append(f"{delta:+.0f} [{low:+.0f}, {high:+.0f}]")
    print(f"| {scenario} | {' | '.join(cells)} |")
