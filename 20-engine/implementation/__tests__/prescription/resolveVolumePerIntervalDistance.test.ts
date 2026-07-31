/**
 * Combat Athlete System — resolveVolume, DistanceRule.scope "per_interval"
 *
 * Isolated in its own file so `vi.mock("../../prescription/prescriptionKnowledge", ...)`
 * never affects any other suite — Vitest gives every test file its own
 * module registry, and only `resolveNumericalProfile` is replaced here.
 *
 * The `intervals` volume structure treats distance as optional
 * (`work_rest_intervals` declares `optionalVolumeFields: ["distance", ...]`),
 * and `DistanceRule.scope` now includes `"per_interval"` so a documented
 * per-interval distance can flow through unchanged. No documented profile
 * uses a per-interval distance yet — the mocked profile below exists purely
 * to prove the plumbing carries the scope through without reinterpretation.
 */

import { describe, expect, test, vi } from "vitest";

import type { DistanceRule } from "../../prescription/prescriptionKnowledge";

vi.mock("../../prescription/prescriptionKnowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../prescription/prescriptionKnowledge")>();
  return {
    ...actual,
    resolveNumericalProfile: () => ({
      ok: true as const,
      profile: PER_INTERVAL_DISTANCE_PROFILE,
      resolutionSource: "explicit_profile_id" as const,
    }),
  };
});

const PER_INTERVAL_DISTANCE_PROFILE = {
  profileId: "test_mocked_per_interval_distance_profile_v0_1",
  version: "0.1" as const,
  moduleId: "conditioning" as const,
  methodId: "work_rest_intervals" as const,
  exerciseRole: "conditioning" as const,
  volume: {
    structure: "intervals" as const,
    sets: null,
    repetitions: null,
    duration: {
      type: "fixed_range" as const,
      range: { min: 15, normal: 30, max: 60, unit: "seconds" as const },
      scope: "per_interval" as const,
    },
    distance: {
      type: "fixed_range",
      range: { min: 50, normal: 100, max: 200, unit: "meters" },
      // The exact scope under test — a compile-time member of
      // DistanceRule["scope"] since the interval foundation lot.
      scope: "per_interval",
    } satisfies DistanceRule,
    rounds: null,
    workIntervals: { min: 10, normal: 12, max: 20 },
  },
  intensity: [],
  rest: {
    scope: "between_intervals" as const,
    seconds: { min: 15, normal: 30, max: 60 },
    sourceRuleIds: ["TEST_MOCK_SOURCE"],
  },
  tempo: null,
  minimumDose: { sets: null, repetitions: null, durationSeconds: 15, distanceMeters: 50, rounds: null, workIntervals: 10 },
  maximumDose: { sets: null, repetitions: null, durationSeconds: 60, distanceMeters: 200, rounds: null, workIntervals: 20 },
  requiresExerciseSpecificLoadRule: false,
  requiresSportSpecificSubtype: false,
  sourceRuleIds: ["TEST_MOCK_SOURCE"],
};

// Imported after the mock declaration (Vitest hoists `vi.mock` above all
// imports automatically).
const { resolveVolume } = await import("../../prescription/resolveVolume");

const baseInput = {
  moduleId: "conditioning" as const,
  methodId: "work_rest_intervals" as const,
  role: "conditioning" as const,
  rangeContext: "normal" as const,
  numericalProfileId: "test_mocked_per_interval_distance_profile_v0_1",
};

describe("resolveVolume — per-interval distance", () => {
  test("a documented per-interval distance resolves with scope \"per_interval\" preserved", () => {
    const result = resolveVolume(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.volume.structure).toBe("intervals");
    expect(result.volume.distance).toEqual({
      value: 100,
      unit: "meters",
      scope: "per_interval",
    });
    expect(result.volume.workIntervals).toBe(12);
    expect(result.volume.duration?.scope).toBe("per_interval");
  });

  test("reduced and high contexts select the documented distance boundaries", () => {
    const reduced = resolveVolume({ ...baseInput, rangeContext: "reduced" });
    const high = resolveVolume({ ...baseInput, rangeContext: "high" });

    expect(reduced.ok && reduced.volume.distance?.value).toBe(50);
    expect(high.ok && high.volume.distance?.value).toBe(200);
  });

  test("exercise dose constraints can narrow the per-interval distance, never widen it", () => {
    const result = resolveVolume({
      ...baseInput,
      exerciseDoseConstraints: {
        minimumDose: { sets: null, repetitions: null, durationSeconds: null, distanceMeters: 80, rounds: null, workIntervals: null },
        maximumDose: { sets: null, repetitions: null, durationSeconds: null, distanceMeters: 120, rounds: null, workIntervals: null },
        sourceRuleIds: ["TEST_MOCK_CONSTRAINT_SOURCE"],
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.volume.distance?.value).toBe(100);
    expect(result.narrowingNotes.some((note) => note.includes("distanceMeters"))).toBe(true);
  });

  test("determinism: identical input produces an identical result", () => {
    expect(resolveVolume(baseInput)).toEqual(resolveVolume(baseInput));
  });

  test("does not mutate the mocked profile", () => {
    const snapshot = JSON.parse(JSON.stringify(PER_INTERVAL_DISTANCE_PROFILE));

    resolveVolume(baseInput);

    expect(PER_INTERVAL_DISTANCE_PROFILE).toEqual(snapshot);
  });
});
