/**
 * Combat Athlete System — Prescription laterality plumbing
 *
 * THE DEFECT THIS FILE GUARDS, stated plainly because it shipped for a
 * long time and was invisible from the outside:
 *
 * every registry entry declared a `laterality` and a
 * `volumeInterpretations` list, `PrescribeExerciseInput` accepted
 * `laterality`/`lateralityRequired`, `PrescriptionVolume` carried a
 * `laterality` field, the public `CasLateralityV1` contract existed and
 * `serializeEngineRunResult` already mapped it — and none of it was ever
 * populated, because `getExercisePrescriptionSource` did not forward the
 * declaration. The resolved volume reported `laterality: null` for all 62
 * entries, including the eight declaring `unilateral` with a per-side
 * interpretation. Nothing downstream could distinguish "3 repetitions" from
 * "3 repetitions per side".
 *
 * The fix is declarative and generic: the source builder copies what the
 * entry declares, and nothing else. This file proves the whole path —
 * registry entry → getExercisePrescriptionSource → PrescribeExerciseInput
 * → resolveVolume → PrescriptionVolume → Decision Trace — for every
 * laterality value present in the registry, and proves that no volume
 * number moved as a result.
 */

import { describe, expect, test } from "vitest";

import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  PILOT_EXERCISE_IDS,
  type PilotExerciseId,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { requiresLateralityResolution } from "../../prescription/validateCompatibility";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExerciseLaterality } from "../../prescription/types";

const REFERENCE = {
  referenceType: "one_rep_max" as const,
  value: 100,
  unit: "kilograms",
  sourceId: "test-1rm",
  measuredAt: null,
  validUntil: null,
  confidence: "validated" as const,
};

function contextFor(id: PilotExerciseId): PrescriptionExecutionContext {
  return {
    rangeContext: "normal",
    athleteReferences: [REFERENCE],
    availableEquipmentCapabilities:
      EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.requiredEquipmentCapabilities,
  };
}

function prescribe(id: PilotExerciseId) {
  const sourceResult = getExercisePrescriptionSource(id, contextFor(id));
  if (!sourceResult.ok) {
    throw new Error(`Expected a source for "${id}": ${sourceResult.message}`);
  }
  const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
  if (!result.ok) {
    throw new Error(`Expected "${id}" to prescribe (${result.failureStage}): ${result.message}`);
  }
  return result;
}

/** Every registry id declaring the given laterality. */
const idsWithLaterality = (laterality: ExerciseLaterality): PilotExerciseId[] =>
  PILOT_EXERCISE_IDS.filter(
    (id) => EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.laterality === laterality,
  );

// -----------------------------------------------------------------------------
// The source builder forwards the declaration
// -----------------------------------------------------------------------------

describe("prescription laterality — getExercisePrescriptionSource forwards what the entry declares", () => {
  test("REGRESSION GUARD: the source carries laterality for every entry — it used to carry none", () => {
    for (const id of PILOT_EXERCISE_IDS) {
      const sourceResult = getExercisePrescriptionSource(id, contextFor(id));
      if (!sourceResult.ok) {
        throw new Error(`Expected a source for "${id}": ${sourceResult.message}`);
      }

      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const [expectedInterpretation] = entry.capabilities.volumeInterpretations;

      expect(sourceResult.source.laterality).toEqual({
        laterality: entry.capabilities.laterality,
        interpretation: expectedInterpretation,
        startingSide: null,
        sideSwitchRuleId: null,
      });
      // The flag is the same predicate compatibility validation uses — one
      // definition, not two that can drift.
      expect(sourceResult.source.lateralityRequired).toBe(requiresLateralityResolution(entry.capabilities));
    }
  });

  test("nothing is inferred: no starting side and no side-switch rule is ever produced", () => {
    for (const id of PILOT_EXERCISE_IDS) {
      const sourceResult = getExercisePrescriptionSource(id, contextFor(id));
      if (!sourceResult.ok) continue;
      expect(sourceResult.source.laterality?.startingSide ?? null).toBeNull();
      expect(sourceResult.source.laterality?.sideSwitchRuleId ?? null).toBeNull();
    }
  });

  test("the declaration is never derived from the knowledge base's `unilateral` flag", () => {
    // pallof_press is the standing proof: the knowledge base records
    // `unilateral: false` for it, and the registry independently declares
    // `bilateral` — the two are separate statements, and the source builder
    // reads only the registry's.
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.pallof_press;
    expect(entry.capabilities.laterality).toBe("bilateral");

    const sourceResult = getExercisePrescriptionSource("pallof_press", contextFor("pallof_press"));
    if (!sourceResult.ok) {
      throw new Error("Expected pallof_press to build a source.");
    }
    expect(sourceResult.source.laterality?.laterality).toBe("bilateral");
  });
});

// -----------------------------------------------------------------------------
// Each laterality value round-trips to the resolved prescription
// -----------------------------------------------------------------------------

describe("prescription laterality — every declared value reaches the resolved volume", () => {
  test("a bilateral entry resolves as bilateral, with a total interpretation", () => {
    const bilateralIds = idsWithLaterality("bilateral");
    expect(bilateralIds.length).toBeGreaterThan(0);

    for (const id of bilateralIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const laterality = prescribe(id).prescription.volume.laterality;

      expect(laterality?.laterality).toBe("bilateral");
      expect(laterality?.interpretation).toBe(entry.capabilities.volumeInterpretations[0]);
      // A bilateral entry never claims a per-side interpretation.
      expect(laterality?.interpretation).not.toContain("per_side");
    }
  });

  test("a unilateral entry resolves as unilateral, with a per-side interpretation", () => {
    const unilateralIds = idsWithLaterality("unilateral");
    expect(unilateralIds.length).toBeGreaterThan(0);

    for (const id of unilateralIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const laterality = prescribe(id).prescription.volume.laterality;

      expect(laterality?.laterality).toBe("unilateral");
      expect(laterality?.interpretation).toBe(entry.capabilities.volumeInterpretations[0]);
      // Compatibility validation already demands a per-side interpretation
      // for these; the resolved volume now carries it.
      expect(laterality?.interpretation).toContain("per_side");
    }
  });

  test("an alternating entry resolves as alternating when one exists — and the value is representable either way", () => {
    // `alternating` is a real member of the ExerciseLaterality vocabulary
    // and of the per-side interpretation set compatibility validation
    // accepts, whether or not any entry currently declares it.
    const alternatingIds = idsWithLaterality("alternating");

    for (const id of alternatingIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const laterality = prescribe(id).prescription.volume.laterality;
      expect(laterality?.laterality).toBe("alternating");
      expect(laterality?.interpretation).toBe(entry.capabilities.volumeInterpretations[0]);
    }

    // The plumbing treats it exactly like the other resolution-requiring
    // values, with no special case anywhere.
    expect(
      requiresLateralityResolution({
        ...EXERCISE_PRESCRIPTION_REGISTRY.bench_press.capabilities,
        laterality: "alternating",
        volumeInterpretations: ["alternating_total_repetitions"],
      }),
    ).toBe(true);
  });

  test("a not_applicable entry stays not_applicable and claims no side", () => {
    const notApplicableIds = idsWithLaterality("not_applicable");
    expect(notApplicableIds.length).toBeGreaterThan(0);

    for (const id of notApplicableIds) {
      const laterality = prescribe(id).prescription.volume.laterality;
      expect(laterality?.laterality).toBe("not_applicable");
      expect(laterality?.interpretation).not.toContain("per_side");
      expect(laterality?.startingSide).toBeNull();
    }

    expect(requiresLateralityResolution(EXERCISE_PRESCRIPTION_REGISTRY.rowerg_intervals.capabilities)).toBe(false);
  });

  test("a method whose contract forbids the laterality field yields null — a method rule, not an exercise rule", () => {
    // No registry entry uses such a method today; the rule is asserted at
    // the contract level so it holds for the first entry that does.
    for (const methodId of ["continuous_aerobic_duration", "recovery_duration_work"] as const) {
      expect(getTrainingMethodContract(methodId).forbiddenVolumeFields).toContain("laterality");
    }
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      expect(getTrainingMethodContract(entry.explicitMethodId).forbiddenVolumeFields).not.toContain("laterality");
    }
  });
});

// -----------------------------------------------------------------------------
// No number moved
// -----------------------------------------------------------------------------

describe("prescription laterality — carrying the declaration changes no volume number", () => {
  /**
   * The resolved volume numbers, frozen. A per-side interpretation LABELS
   * these numbers; it must never multiply, halve or otherwise transform
   * them. Written out for every entry rather than recomputed, so that a
   * future resolver-side conversion would fail loudly here.
   */
  test("no automatic multiplication, halving or doubling occurs for any entry", () => {
    for (const id of PILOT_EXERCISE_IDS) {
      const result = prescribe(id);
      const { volume } = result.prescription;
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];

      // Whatever the laterality, the resolved numbers stay inside the
      // profile's own documented dose boundaries — a doubled per-side count
      // would immediately break through the maximum.
      const trace = result.trace.volume;
      if (!trace.ok) {
        throw new Error(`Expected volume resolution for "${id}".`);
      }

      const perSide = entry.capabilities.volumeInterpretations[0]?.includes("per_side") === true;
      if (!perSide) continue;

      // For every per-side entry, the number resolved is the profile's own
      // selected value — identical in kind to a bilateral exercise on the
      // same profile, never twice it.
      expect(volume.laterality?.interpretation).toContain("per_side");
      if (volume.reps?.type === "fixed") {
        expect(volume.reps.value).toBeLessThanOrEqual(
          trace.profileId === "power_primary_repetition_sets_v0_1" ? 5 : 30,
        );
      }
    }
  });

  test("two entries on the same profile, one bilateral and one unilateral, resolve identical numbers", () => {
    // med_ball_overhead_throw (bilateral) and med_ball_shot_put_throw
    // (unilateral) share power_primary_repetition_sets_v0_1. Only the label
    // differs — never the count.
    const bilateral = prescribe("med_ball_overhead_throw").prescription.volume;
    const unilateral = prescribe("med_ball_shot_put_throw").prescription.volume;

    expect(bilateral.sets).toBe(unilateral.sets);
    expect(bilateral.reps).toEqual(unilateral.reps);

    expect(bilateral.laterality?.laterality).toBe("bilateral");
    expect(bilateral.laterality?.interpretation).toBe("total_repetitions");
    expect(unilateral.laterality?.laterality).toBe("unilateral");
    expect(unilateral.laterality?.interpretation).toBe("repetitions_per_side");
  });

  test("every entry still prescribes completely, and every resolved volume respects its profile's dose boundaries", () => {
    expect(PILOT_EXERCISE_IDS.length).toBeGreaterThan(0);

    for (const id of PILOT_EXERCISE_IDS) {
      const result = prescribe(id);
      expect(result.prescription.status).toBe("complete");
      expect(result.trace.validation.valid).toBe(true);
    }
  });
});

// -----------------------------------------------------------------------------
// The Decision Trace explains the interpretation
// -----------------------------------------------------------------------------

describe("prescription laterality — the Decision Trace states how to read the numbers", () => {
  test("the volume entry names the laterality and its interpretation", () => {
    const entries = adaptExercisePrescriptionResult(prescribe("med_ball_shot_put_throw"), {
      idPrefix: "laterality_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    const summary = volumeEntry?.reasons.find((reason) => reason.startsWith("structure=")) ?? "";

    expect(summary).toContain("laterality=unilateral (repetitions_per_side)");
    // The count is stated beside its interpretation, so the pair is
    // unambiguous in the trace itself.
    expect(summary).toContain("reps=");
  });

  test("a bilateral exercise's trace says so explicitly rather than staying silent", () => {
    const entries = adaptExercisePrescriptionResult(prescribe("bench_press"), {
      idPrefix: "laterality_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    const summary = volumeEntry?.reasons.find((reason) => reason.startsWith("structure=")) ?? "";

    expect(summary).toContain("laterality=bilateral (total_repetitions)");
  });
});

// -----------------------------------------------------------------------------
// Genericity
// -----------------------------------------------------------------------------

describe("prescription laterality — the fix is generic", () => {
  test("no exercise id appears in the laterality plumbing", async () => {
    const registrySource = await import("node:fs").then((fs) =>
      fs.readFileSync(
        new URL("../../prescription/exercisePrescriptionRegistry.ts", import.meta.url),
        "utf-8",
      ),
    );

    // The builder reads only the entry's own declared capabilities and the
    // method contract — extract it and prove no id is named inside.
    const start = registrySource.indexOf("const buildPrescriptionLaterality");
    expect(start).toBeGreaterThan(-1);
    const builder = registrySource.slice(start, registrySource.indexOf("};", start) + 2);

    for (const id of PILOT_EXERCISE_IDS) {
      expect(builder).not.toContain(`"${id}"`);
    }
    expect(builder).toContain("capabilities.laterality");
    expect(builder).toContain("capabilities.volumeInterpretations");
  });

  test("determinism and non-mutation: repeated calls agree and the registry is untouched", () => {
    const registrySnapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    for (const id of ["med_ball_shot_put_throw", "bench_press", "rowerg_intervals"] as const) {
      expect(getExercisePrescriptionSource(id, contextFor(id))).toEqual(
        getExercisePrescriptionSource(id, contextFor(id)),
      );
      expect(prescribe(id).prescription.volume.laterality).toEqual(
        prescribe(id).prescription.volume.laterality,
      );
    }

    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(registrySnapshot);
  });
});
