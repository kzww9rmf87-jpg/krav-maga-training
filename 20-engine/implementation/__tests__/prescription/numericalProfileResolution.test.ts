import { describe, expect, test } from "vitest";

import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  findDuplicateProfileTriples,
  getNumericalPrescriptionProfile,
  isNumericalPrescriptionProfileId,
  resolveNumericalProfile,
  resolveNumericalProfileFrom,
  type NumericalPrescriptionProfile,
  type NumericalProfileQuery,
} from "../../prescription/prescriptionKnowledge";

// -----------------------------------------------------------------------------
// Injected fixtures — two synthetic profiles sharing one triple, plus one
// unique-triple profile, built from a real documented profile so every
// structural field stays valid. Only identifiers are altered.
// -----------------------------------------------------------------------------

const realProfile = NUMERICAL_PRESCRIPTION_PROFILES.find(
  (profile) => profile.profileId === "strength_primary_straight_sets_v0_1",
);

if (realProfile === undefined) {
  throw new Error("Fixture prerequisite missing: strength_primary_straight_sets_v0_1");
}

const uniqueProfile: NumericalPrescriptionProfile = {
  ...realProfile,
  profileId: "test_unique_profile_v0_1",
};

const duplicateA: NumericalPrescriptionProfile = {
  ...realProfile,
  profileId: "test_duplicate_a_v0_1",
  moduleId: "conditioning",
  methodId: "work_rest_intervals",
  exerciseRole: "conditioning",
};

const duplicateB: NumericalPrescriptionProfile = {
  ...realProfile,
  profileId: "test_duplicate_b_v0_1",
  moduleId: "conditioning",
  methodId: "work_rest_intervals",
  exerciseRole: "conditioning",
};

const injectedProfiles: readonly NumericalPrescriptionProfile[] = [
  uniqueProfile,
  duplicateA,
  duplicateB,
];

const uniqueQuery: NumericalProfileQuery = {
  moduleId: uniqueProfile.moduleId,
  methodId: uniqueProfile.methodId,
  exerciseRole: uniqueProfile.exerciseRole,
};

const ambiguousQuery: NumericalProfileQuery = {
  moduleId: "conditioning",
  methodId: "work_rest_intervals",
  exerciseRole: "conditioning",
};

describe("resolveNumericalProfileFrom — implicit triple resolution", () => {
  test("zero candidates fails with NUMERICAL_PROFILE_MISSING and an empty candidate list", () => {
    const result = resolveNumericalProfileFrom(injectedProfiles, {
      moduleId: "recovery",
      methodId: "recovery_duration_work",
      exerciseRole: "recovery",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_MISSING");
    expect(result.candidateProfileIds).toEqual([]);
  });

  test("exactly one candidate resolves with module_method_role_unique", () => {
    const result = resolveNumericalProfileFrom(injectedProfiles, uniqueQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.profileId).toBe("test_unique_profile_v0_1");
    expect(result.resolutionSource).toBe("module_method_role_unique");
  });

  test("two candidates fail with NUMERICAL_PROFILE_AMBIGUOUS listing both candidate ids", () => {
    const result = resolveNumericalProfileFrom(injectedProfiles, ambiguousQuery);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
    expect(result.candidateProfileIds).toEqual([
      "test_duplicate_a_v0_1",
      "test_duplicate_b_v0_1",
    ]);
  });

  test("ambiguity is independent of array order — reversed input fails identically", () => {
    const reversed = [...injectedProfiles].reverse();
    const result = resolveNumericalProfileFrom(reversed, ambiguousQuery);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
    expect([...result.candidateProfileIds].sort()).toEqual([
      "test_duplicate_a_v0_1",
      "test_duplicate_b_v0_1",
    ]);
  });
});

describe("resolveNumericalProfileFrom — explicit profile id", () => {
  test("a valid explicit id on an ambiguous triple resolves that exact profile", () => {
    const result = resolveNumericalProfileFrom(injectedProfiles, {
      ...ambiguousQuery,
      explicitProfileId: "test_duplicate_b_v0_1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.profileId).toBe("test_duplicate_b_v0_1");
    expect(result.resolutionSource).toBe("explicit_profile_id");
  });

  test("an unknown explicit id fails with NUMERICAL_PROFILE_ID_UNKNOWN and never falls back", () => {
    const result = resolveNumericalProfileFrom(injectedProfiles, {
      ...uniqueQuery,
      explicitProfileId: "does_not_exist_v0_1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_ID_UNKNOWN");
  });

  test("an existing id whose triple does not match fails with NUMERICAL_PROFILE_TRIPLE_MISMATCH", () => {
    const result = resolveNumericalProfileFrom(injectedProfiles, {
      ...uniqueQuery,
      explicitProfileId: "test_duplicate_a_v0_1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_TRIPLE_MISMATCH");
    expect(result.message).toContain("test_duplicate_a_v0_1");
    expect(result.message).toContain(uniqueQuery.moduleId);
  });

  test("explicitProfileId: null behaves exactly like an absent explicit id", () => {
    const withNull = resolveNumericalProfileFrom(injectedProfiles, {
      ...uniqueQuery,
      explicitProfileId: null,
    });
    const without = resolveNumericalProfileFrom(injectedProfiles, uniqueQuery);

    expect(withNull).toEqual(without);
  });
});

describe("resolveNumericalProfileFrom — determinism and non-mutation", () => {
  test("two identical calls return structurally identical results", () => {
    const first = resolveNumericalProfileFrom(injectedProfiles, ambiguousQuery);
    const second = resolveNumericalProfileFrom(injectedProfiles, ambiguousQuery);

    expect(first).toEqual(second);
  });

  test("resolution never mutates the injected profile array", () => {
    const snapshot = injectedProfiles.map((profile) => profile.profileId);

    resolveNumericalProfileFrom(injectedProfiles, ambiguousQuery);
    resolveNumericalProfileFrom(injectedProfiles, {
      ...ambiguousQuery,
      explicitProfileId: "test_duplicate_a_v0_1",
    });

    expect(injectedProfiles.map((profile) => profile.profileId)).toEqual(snapshot);
  });
});

describe("resolveNumericalProfile — documented profile set", () => {
  test("every documented triple is currently unique, so implicit resolution matches the legacy helper for all 12 profiles", () => {
    for (const profile of NUMERICAL_PRESCRIPTION_PROFILES) {
      const result = resolveNumericalProfile({
        moduleId: profile.moduleId,
        methodId: profile.methodId,
        exerciseRole: profile.exerciseRole,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.profile.profileId).toBe(profile.profileId);
      expect(result.resolutionSource).toBe("module_method_role_unique");
      expect(result.profile).toBe(
        getNumericalPrescriptionProfile(
          profile.moduleId,
          profile.methodId,
          profile.exerciseRole,
        ),
      );
    }
  });

  test("every documented profile id resolves explicitly to itself", () => {
    for (const profile of NUMERICAL_PRESCRIPTION_PROFILES) {
      const result = resolveNumericalProfile({
        moduleId: profile.moduleId,
        methodId: profile.methodId,
        exerciseRole: profile.exerciseRole,
        explicitProfileId: profile.profileId,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.profile.profileId).toBe(profile.profileId);
      expect(result.resolutionSource).toBe("explicit_profile_id");
    }
  });
});

describe("findDuplicateProfileTriples", () => {
  test("the documented profile set contains no duplicate triple", () => {
    expect(findDuplicateProfileTriples()).toEqual([]);
  });

  test("an injected duplicate triple is reported with both profile ids", () => {
    const duplicates = findDuplicateProfileTriples(injectedProfiles);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.moduleId).toBe("conditioning");
    expect(duplicates[0]?.methodId).toBe("work_rest_intervals");
    expect(duplicates[0]?.exerciseRole).toBe("conditioning");
    expect([...(duplicates[0]?.profileIds ?? [])].sort()).toEqual([
      "test_duplicate_a_v0_1",
      "test_duplicate_b_v0_1",
    ]);
  });
});

describe("isNumericalPrescriptionProfileId", () => {
  test("accepts every documented profile id", () => {
    for (const profile of NUMERICAL_PRESCRIPTION_PROFILES) {
      expect(isNumericalPrescriptionProfileId(profile.profileId)).toBe(true);
    }
  });

  test("rejects unknown ids and non-strings", () => {
    expect(isNumericalPrescriptionProfileId("does_not_exist_v0_1")).toBe(false);
    expect(isNumericalPrescriptionProfileId(null)).toBe(false);
    expect(isNumericalPrescriptionProfileId(42)).toBe(false);
  });
});
