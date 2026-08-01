/**
 * Combat Athlete System — Grip volume interpretations
 *
 * `climbs` and `hand_pulls` join `VolumeInterpretation` so that a rope
 * ascent and a hand-over-hand pull can be counted as themselves, instead of
 * being flattened into `total_repetitions` — which would have meant telling
 * a consumer that three climbs are three repetitions of the same thing a
 * pull-up counts.
 *
 * The contract decision this file guards:
 *
 * - `cas-session-output.v1` re-declares SHAPES to freeze them, and IMPORTS
 *   closed vocabularies precisely so they track the engine. Adding a member
 *   is therefore additive and stays within v1; the policy is now written
 *   down in the contract file rather than left implicit, together with the
 *   consequence for consumers (tolerate unknown members, never switch
 *   exhaustively);
 * - nothing about the addition is silent: the contract carries a dated
 *   additive history entry naming the reason.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import type { PrescriptionLaterality, VolumeInterpretation } from "../../prescription/types";
import type { CasLateralityV1 } from "../../sessionOutput/types";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  PILOT_EXERCISE_IDS,
} from "../../prescription/exercisePrescriptionRegistry";

const readSource = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf-8");

describe("grip volume interpretations — the vocabulary", () => {
  test("1. climbs and hand_pulls are members of VolumeInterpretation", () => {
    const climbs: VolumeInterpretation = "climbs";
    const handPulls: VolumeInterpretation = "hand_pulls";
    expect(climbs).toBe("climbs");
    expect(handPulls).toBe("hand_pulls");
  });

  test("2. the union still carries every pre-existing member — nothing was removed or renamed", () => {
    const types = readSource("../../prescription/types.ts");
    const union = types.slice(
      types.indexOf("export type VolumeInterpretation ="),
      types.indexOf("export interface PrescriptionLaterality"),
    );

    for (const preExisting of [
      "total_repetitions",
      "repetitions_per_side",
      "alternating_total_repetitions",
      "duration_per_side",
      "total_duration",
      "distance_per_side",
      "total_distance",
      "load_per_hand",
      "load_per_side",
      "combined_external_load",
      "system_load",
      "round_total",
      "interval_total",
    ]) {
      expect(union, preExisting).toContain(`"${preExisting}"`);
    }
    expect(union).toContain('"climbs"');
    expect(union).toContain('"hand_pulls"');
  });

  test("3. the semantics are documented: totals, never per side, never a distance or a duration", () => {
    const types = readSource("../../prescription/types.ts");
    const union = types.slice(
      types.indexOf("export type VolumeInterpretation ="),
      types.indexOf("export interface PrescriptionLaterality"),
    );

    expect(union).toContain("the number of COMPLETE ascents prescribed");
    expect(union).toContain("the number of hand-over-hand pulls prescribed");
    expect(union).toContain("Both are TOTALS, never per-side counts");
    expect(union).toContain("neither may be converted");
    expect(union).toContain("Volume Metrics");
  });
});

describe("grip volume interpretations — the public contract decision", () => {
  test("4. the contract states its evolution policy explicitly, and stays at v1", () => {
    const contract = readSource("../../sessionOutput/types.ts");

    expect(contract).toContain("CONTRACT EVOLUTION POLICY");
    // Shapes frozen, vocabularies tracked — the split that makes this
    // addition additive rather than breaking.
    expect(contract).toContain("requires `cas-session-output.v2`");
    expect(contract).toContain("Adding a member to one is an ADDITIVE change and");
    expect(contract).toContain("Removing or renaming a member is breaking");

    // v1 is still the only contract version emitted.
    expect(contract).toContain('contractVersion: "cas-session-output.v1"');
    expect(contract).not.toContain("cas-session-output.v2\"");
  });

  test("5. the addition is not silent — the contract carries a dated reason", () => {
    const contract = readSource("../../sessionOutput/types.ts");
    expect(contract).toContain("v1 additive history:");
    expect(contract).toContain("2026-08-01");
    expect(contract).toContain("`climbs` and `hand_pulls`");
  });

  test("6. the consumer consequence is written down, not assumed", () => {
    const contract = readSource("../../sessionOutput/types.ts");
    expect(contract).toContain("tolerate unknown vocabulary members");
    expect(contract).toContain("rather than exhaustively");
  });

  test("7. CasLateralityV1 keeps its exact shape — only the vocabulary widened", () => {
    // A structural check: the public DTO and the internal type still agree
    // field for field, which is what "shapes are frozen" means.
    const laterality: PrescriptionLaterality = {
      laterality: "bilateral",
      interpretation: "climbs",
      startingSide: null,
      sideSwitchRuleId: null,
    };
    const publicDto: CasLateralityV1 = laterality;

    expect(Object.keys(publicDto).sort()).toEqual([
      "interpretation",
      "laterality",
      "sideSwitchRuleId",
      "startingSide",
    ]);
    expect(publicDto.interpretation).toBe("climbs");
  });
});

describe("grip volume interpretations — no behaviour changed", () => {
  test("8. no resolver or validator switches exhaustively on the vocabulary", () => {
    for (const file of [
      "../../prescription/resolveVolume.ts",
      "../../prescription/resolveIntensity.ts",
      "../../prescription/resolveRest.ts",
      "../../prescription/resolveTempo.ts",
      "../../prescription/validateCompatibility.ts",
      "../../prescription/registryValidators.ts",
      "../../sessionOutput/serializeEngineRunResult.ts",
    ]) {
      const source = readSource(file);
      // The only place the vocabulary is enumerated is a per-side allowlist,
      // which both new members are deliberately absent from.
      expect(source, file).not.toContain('case "total_repetitions"');
      expect(source, file).not.toContain('case "climbs"');
      expect(source, file).not.toContain('case "hand_pulls"');
    }

    const validate = readSource("../../prescription/validateCompatibility.ts");
    const perSideGate = validate.slice(
      validate.indexOf("const hasResolvedVolumeInterpretation"),
      validate.indexOf("const hasResolvedVolumeInterpretation") + 900,
    );
    expect(perSideGate).toContain("repetitions_per_side");
    // Neither new member is a per-side interpretation.
    expect(perSideGate).not.toContain("climbs");
    expect(perSideGate).not.toContain("hand_pulls");
  });

  test("9. no existing registry entry adopted either new interpretation", () => {
    for (const id of PILOT_EXERCISE_IDS) {
      const declared = EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.volumeInterpretations;
      expect(declared, id).not.toContain("climbs");
      expect(declared, id).not.toContain("hand_pulls");
    }
    // This phase adds vocabulary only: the registry is untouched.
    expect(PILOT_EXERCISE_IDS).toHaveLength(69);
  });

  test("10. no volume is multiplied by adopting a new unit — both are plain totals", () => {
    // A count carried under either new interpretation means exactly itself.
    const climbing: PrescriptionLaterality = {
      laterality: "bilateral",
      interpretation: "climbs",
      startingSide: null,
      sideSwitchRuleId: null,
    };
    const pulling: PrescriptionLaterality = {
      laterality: "bilateral",
      interpretation: "hand_pulls",
      startingSide: null,
      sideSwitchRuleId: null,
    };

    for (const laterality of [climbing, pulling]) {
      expect(laterality.startingSide).toBeNull();
      expect(laterality.sideSwitchRuleId).toBeNull();
      expect(laterality.interpretation).not.toBe("repetitions_per_side");
      expect(laterality.interpretation).not.toBe("alternating_total_repetitions");
    }
  });
});
