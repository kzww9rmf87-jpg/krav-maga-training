/**
 * Combat Athlete System — explicit numericalProfileId plumbing through the
 * four numerical resolvers (volume, intensity, rest, tempo).
 *
 * With the 12 documented profiles every triple is unique, so these tests
 * verify three things on real data, per resolver:
 * 1. a valid explicit id resolves to the exact same prescription values as
 *    the historical implicit lookup, with resolutionSource
 *    "explicit_profile_id";
 * 2. an unknown id fails with NUMERICAL_PROFILE_ID_UNKNOWN — never a
 *    fallback to the triple's own profile;
 * 3. an existing id whose triple does not match fails with
 *    NUMERICAL_PROFILE_TRIPLE_MISMATCH — never a substitution.
 *
 * The AMBIGUOUS branch cannot be reached through the real profile array
 * (no duplicate triple exists yet) and is covered with injected data in
 * numericalProfileResolution.test.ts.
 */

import { describe, expect, test } from "vitest";

import { resolveVolume } from "../../prescription/resolveVolume";
import { resolveIntensity } from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";

const strengthPrimary = {
  moduleId: "strength",
  methodId: "straight_sets_repetitions",
  role: "primary",
  rangeContext: "normal",
} as const;

const STRENGTH_PRIMARY_PROFILE_ID = "strength_primary_straight_sets_v0_1";
// Real profile, deliberately mismatched triple (grip / distance_carry_sets / primary).
const MISMATCHED_PROFILE_ID = "distance_carry_strength_grip_v0_1";
const UNKNOWN_PROFILE_ID = "does_not_exist_v0_1";

const intensityExtras = {
  supportedIntensityTypes: ["rpe"],
} as const;

const tempoExtras = {
  supportedTempoTypes: ["phase_intent"],
} as const;

describe("resolveVolume — explicit numericalProfileId", () => {
  test("a valid explicit id resolves identically to the implicit lookup, tagged explicit_profile_id", () => {
    const implicit = resolveVolume({ ...strengthPrimary });
    const explicit = resolveVolume({
      ...strengthPrimary,
      numericalProfileId: STRENGTH_PRIMARY_PROFILE_ID,
    });

    if (!implicit.ok || !explicit.ok) {
      throw new Error("Expected both resolutions to succeed.");
    }

    expect(implicit.profileResolutionSource).toBe("module_method_role_unique");
    expect(explicit.profileResolutionSource).toBe("explicit_profile_id");
    expect(explicit.profileId).toBe(STRENGTH_PRIMARY_PROFILE_ID);
    expect(explicit.volume).toEqual(implicit.volume);
  });

  test("an unknown id fails with NUMERICAL_PROFILE_ID_UNKNOWN and never falls back", () => {
    const result = resolveVolume({
      ...strengthPrimary,
      numericalProfileId: UNKNOWN_PROFILE_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_ID_UNKNOWN");
    expect(result.profileId).toBeNull();
  });

  test("an existing id with a mismatched triple fails with NUMERICAL_PROFILE_TRIPLE_MISMATCH", () => {
    const result = resolveVolume({
      ...strengthPrimary,
      numericalProfileId: MISMATCHED_PROFILE_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_TRIPLE_MISMATCH");
    expect(result.message).toContain(MISMATCHED_PROFILE_ID);
  });

  test("numericalProfileId: null behaves exactly like an absent id", () => {
    const withNull = resolveVolume({ ...strengthPrimary, numericalProfileId: null });
    const without = resolveVolume({ ...strengthPrimary });

    expect(withNull).toEqual(without);
  });
});

describe("resolveIntensity — explicit numericalProfileId", () => {
  test("a valid explicit id resolves identically to the implicit lookup, tagged explicit_profile_id", () => {
    const implicit = resolveIntensity({ ...strengthPrimary, ...intensityExtras });
    const explicit = resolveIntensity({
      ...strengthPrimary,
      ...intensityExtras,
      numericalProfileId: STRENGTH_PRIMARY_PROFILE_ID,
    });

    if (!implicit.ok || !explicit.ok) {
      throw new Error("Expected both resolutions to succeed.");
    }

    expect(implicit.profileResolutionSource).toBe("module_method_role_unique");
    expect(explicit.profileResolutionSource).toBe("explicit_profile_id");
    expect(explicit.intensity).toEqual(implicit.intensity);
  });

  test("an unknown id fails with NUMERICAL_PROFILE_ID_UNKNOWN", () => {
    const result = resolveIntensity({
      ...strengthPrimary,
      ...intensityExtras,
      numericalProfileId: UNKNOWN_PROFILE_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_ID_UNKNOWN");
  });

  test("a mismatched triple fails with NUMERICAL_PROFILE_TRIPLE_MISMATCH", () => {
    const result = resolveIntensity({
      ...strengthPrimary,
      ...intensityExtras,
      numericalProfileId: MISMATCHED_PROFILE_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_TRIPLE_MISMATCH");
  });
});

describe("resolveRest — explicit numericalProfileId", () => {
  test("a valid explicit id resolves identically to the implicit lookup, tagged explicit_profile_id", () => {
    const implicit = resolveRest({ ...strengthPrimary });
    const explicit = resolveRest({
      ...strengthPrimary,
      numericalProfileId: STRENGTH_PRIMARY_PROFILE_ID,
    });

    if (!implicit.ok || !explicit.ok) {
      throw new Error("Expected both resolutions to succeed.");
    }

    expect(implicit.profileResolutionSource).toBe("module_method_role_unique");
    expect(explicit.profileResolutionSource).toBe("explicit_profile_id");
    expect(explicit.rest).toEqual(implicit.rest);
  });

  test("an unknown id fails with NUMERICAL_PROFILE_ID_UNKNOWN", () => {
    const result = resolveRest({
      ...strengthPrimary,
      numericalProfileId: UNKNOWN_PROFILE_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_ID_UNKNOWN");
  });

  test("a mismatched triple fails with NUMERICAL_PROFILE_TRIPLE_MISMATCH", () => {
    const result = resolveRest({
      ...strengthPrimary,
      numericalProfileId: MISMATCHED_PROFILE_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_TRIPLE_MISMATCH");
  });
});

describe("resolveTempo — explicit numericalProfileId", () => {
  test("a valid explicit id resolves identically to the implicit lookup, tagged explicit_profile_id", () => {
    const implicit = resolveTempo({ ...strengthPrimary, ...tempoExtras });
    const explicit = resolveTempo({
      ...strengthPrimary,
      ...tempoExtras,
      numericalProfileId: STRENGTH_PRIMARY_PROFILE_ID,
    });

    if (!implicit.ok || !explicit.ok) {
      throw new Error("Expected both resolutions to succeed.");
    }

    expect(implicit.profileResolutionSource).toBe("module_method_role_unique");
    expect(explicit.profileResolutionSource).toBe("explicit_profile_id");
    expect(explicit.tempo).toEqual(implicit.tempo);
  });

  test("an unknown id fails with NUMERICAL_PROFILE_ID_UNKNOWN", () => {
    const result = resolveTempo({
      ...strengthPrimary,
      ...tempoExtras,
      numericalProfileId: UNKNOWN_PROFILE_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_ID_UNKNOWN");
  });

  test("a mismatched triple fails with NUMERICAL_PROFILE_TRIPLE_MISMATCH", () => {
    const result = resolveTempo({
      ...strengthPrimary,
      ...tempoExtras,
      numericalProfileId: MISMATCHED_PROFILE_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_TRIPLE_MISMATCH");
  });
});
