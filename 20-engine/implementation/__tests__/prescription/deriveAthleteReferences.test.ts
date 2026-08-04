/**
 * Combat Athlete System — Athlete Reference Derivation Tests
 *
 * The engine now sources athlete references from the input rather than from
 * the caller, so what matters here is that it uses exactly what was
 * recorded, refuses what has expired, and never manufactures a reference to
 * make an exercise prescribable.
 */

import { describe, expect, test } from "vitest";

import { deriveAthleteReferences } from "../../prescription/deriveAthleteReferences";
import type { IntensityReference } from "../../prescription/types";
import type { EngineInput } from "../../types";

import { makeAthleteProfile, makeValidInput, REQUESTED_AT } from "../fixtures";

function makeReference(overrides: Partial<IntensityReference> = {}): IntensityReference {
  return {
    referenceType: "one_rep_max",
    value: 100,
    unit: "kg",
    sourceId: "reference-1",
    measuredAt: "2025-12-01T00:00:00.000Z",
    validUntil: null,
    confidence: "validated",
    ...overrides,
  };
}

function makeInput(references?: readonly IntensityReference[]): EngineInput {
  return makeValidInput({
    athleteProfile: makeAthleteProfile({ performanceReferences: references }),
  });
}

describe("deriveAthleteReferences — what the athlete recorded", () => {
  test("an absent list yields no references and no rejections", () => {
    expect(deriveAthleteReferences(makeInput())).toEqual({ references: [], rejected: [] });
  });

  test("an empty list yields no references", () => {
    expect(deriveAthleteReferences(makeInput([])).references).toEqual([]);
  });

  test("recorded references pass through unchanged, in the recorded order", () => {
    const first = makeReference({ sourceId: "first", referenceType: "one_rep_max" });
    const second = makeReference({ sourceId: "second", referenceType: "training_max" });

    const decision = deriveAthleteReferences(makeInput([first, second]));

    expect(decision.references).toEqual([first, second]);
    expect(decision.rejected).toEqual([]);
  });

  test("no reference is ever invented, whatever else the input contains", () => {
    // Training history carries loadKg and repetitionsCompleted, from which an
    // Epley-style one-rep max is mechanically derivable and documented
    // nowhere. It must not become a reference.
    const input: EngineInput = {
      ...makeInput(),
      trainingHistory: {
        recentSessions: [
          {
            sessionId: "s1",
            completedAt: "2026-01-10T08:00:00.000Z",
            sessionType: "cas",
            intensity: "moderate",
            durationMinutes: 45,
            exercises: [{ exerciseId: "bench_press", loadKg: 90, repetitionsCompleted: 5 }],
          },
        ],
      },
    };

    expect(deriveAthleteReferences(input).references).toEqual([]);
  });
});

describe("deriveAthleteReferences — expiry", () => {
  test("a reference that expired before the request is refused, with a reason", () => {
    const expired = makeReference({ sourceId: "stale", validUntil: "2025-06-01T00:00:00.000Z" });

    const decision = deriveAthleteReferences(makeInput([expired]));

    expect(decision.references).toEqual([]);
    expect(decision.rejected).toHaveLength(1);
    expect(decision.rejected[0]?.code).toBe("EXPIRED");
    expect(decision.rejected[0]?.sourceId).toBe("stale");
    expect(decision.rejected[0]?.reason).toContain("stale");
  });

  test("a reference valid on the request date is kept", () => {
    const stillValid = makeReference({ validUntil: "2026-12-31T00:00:00.000Z" });
    expect(deriveAthleteReferences(makeInput([stillValid])).references).toEqual([stillValid]);
  });

  test("expiry exactly at the request instant is not yet expired", () => {
    const boundary = makeReference({ validUntil: REQUESTED_AT });
    expect(deriveAthleteReferences(makeInput([boundary])).references).toHaveLength(1);
  });

  test("validUntil null means no expiry recorded, never expired", () => {
    const noExpiry = makeReference({ validUntil: null });
    expect(deriveAthleteReferences(makeInput([noExpiry])).references).toEqual([noExpiry]);
  });

  test("an unparseable validUntil is not treated as expired", () => {
    // Silently dropping a reference on a malformed field would change the
    // dose without saying so; malformed input is validation's concern.
    const malformed = makeReference({ validUntil: "not-a-date" });
    expect(deriveAthleteReferences(makeInput([malformed])).references).toHaveLength(1);
  });

  test("valid and expired references are separated, each keeping its order", () => {
    const validA = makeReference({ sourceId: "valid-a" });
    const expired = makeReference({ sourceId: "expired", validUntil: "2020-01-01T00:00:00.000Z" });
    const validB = makeReference({ sourceId: "valid-b", referenceType: "body_mass", value: 80 });

    const decision = deriveAthleteReferences(makeInput([validA, expired, validB]));

    expect(decision.references.map((reference) => reference.sourceId)).toEqual(["valid-a", "valid-b"]);
    expect(decision.rejected.map((rejection) => rejection.sourceId)).toEqual(["expired"]);
  });
});

describe("deriveAthleteReferences — determinism and purity", () => {
  test("two calls with the same input are deeply equal", () => {
    const input = makeInput([makeReference()]);
    expect(deriveAthleteReferences(input)).toEqual(deriveAthleteReferences(input));
  });

  test("the input is never mutated", () => {
    const input = makeInput([makeReference(), makeReference({ sourceId: "b", validUntil: "2020-01-01T00:00:00.000Z" })]);
    const before = JSON.stringify(input);

    deriveAthleteReferences(input);

    expect(JSON.stringify(input)).toBe(before);
  });

  test("expiry is judged against the request date, never the system clock", () => {
    // `validUntil` sits between the fixed request date and today's real date;
    // judging against the wall clock would give a different answer.
    const reference = makeReference({ validUntil: "2026-02-01T00:00:00.000Z" });
    expect(deriveAthleteReferences(makeInput([reference])).references).toHaveLength(1);
  });
});
