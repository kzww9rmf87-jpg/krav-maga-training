/**
 * Combat Athlete System — Equipment Capability Derivation Tests
 *
 * Covers the canonical bridge between the engine's two equipment
 * vocabularies (`EquipmentType` → `EquipmentCapabilityId`).
 *
 * The mapping is a training-domain decision, so most of what matters here is
 * what the derivation REFUSES to do: no equipment hierarchy, no invented
 * equivalence, no safety authorization granted from a neighbouring one. Each
 * refusal below cites the distinction `equipmentCapabilities.ts` documents at
 * the relevant entry.
 */

import { describe, expect, test } from "vitest";

import {
  DIRECTLY_MAPPED_EQUIPMENT_TYPES,
  ENVIRONMENT_DERIVED_CAPABILITIES,
  EQUIPMENT_CAPABILITY_EQUIVALENCE_GROUPS,
  EQUIPMENT_TYPES_WITHOUT_CAPABILITY,
  EQUIPMENT_TYPE_CAPABILITY_TABLE,
  deriveEquipmentCapabilities,
} from "../../prescription/deriveEquipmentCapabilities";
import { EQUIPMENT_CAPABILITY_IDS } from "../../prescription/equipmentCapabilities";
import type { EquipmentType, TrainingEnvironment } from "../../types";

/** Every `EquipmentType` a fully-stocked facility could declare. */
const ALL_EQUIPMENT_TYPES = Object.keys(EQUIPMENT_TYPE_CAPABILITY_TABLE) as EquipmentType[];

function makeEnvironment(
  equipment: readonly EquipmentType[],
  overrides: Partial<TrainingEnvironment> = {},
): TrainingEnvironment {
  return {
    locationType: "gym",
    availableEquipment: equipment.map((type) => ({ type })),
    availableSpace: "large",
    ...overrides,
  };
}

describe("deriveEquipmentCapabilities — mapping table integrity", () => {
  test("the table is total over EquipmentType and every entry is a known capability or null", () => {
    // Totality itself is enforced at compile time by `satisfies
    // Record<EquipmentType, …>`; this asserts the runtime values.
    for (const [equipmentType, capability] of Object.entries(EQUIPMENT_TYPE_CAPABILITY_TABLE)) {
      if (capability === null) {
        expect(EQUIPMENT_TYPES_WITHOUT_CAPABILITY).toContain(equipmentType);
      } else {
        expect(EQUIPMENT_CAPABILITY_IDS).toContain(capability);
      }
    }
  });

  test("exactly five EquipmentType members deliberately grant no capability", () => {
    expect([...EQUIPMENT_TYPES_WITHOUT_CAPABILITY].sort()).toEqual([
      "bodyweight",
      "box",
      "farmer_handle",
      "other",
      "sandbag",
    ]);
  });

  test("no two EquipmentType members map to the same capability", () => {
    const mapped = DIRECTLY_MAPPED_EQUIPMENT_TYPES.map(
      (equipmentType) => EQUIPMENT_TYPE_CAPABILITY_TABLE[equipmentType],
    );
    expect(new Set(mapped).size).toBe(mapped.length);
  });

  test("every capability in the vocabulary is reachable from some environment", () => {
    const fullyEquipped = deriveEquipmentCapabilities(
      makeEnvironment(ALL_EQUIPMENT_TYPES, { floorSafe: true, usableWall: true }),
    );
    expect([...fullyEquipped].sort()).toEqual([...EQUIPMENT_CAPABILITY_IDS].sort());
    expect(fullyEquipped).toHaveLength(34);
  });

  test("every equivalence-group member is a real EquipmentType", () => {
    for (const members of Object.values(EQUIPMENT_CAPABILITY_EQUIVALENCE_GROUPS)) {
      for (const member of members) {
        expect(ALL_EQUIPMENT_TYPES).toContain(member);
      }
    }
  });
});

describe("deriveEquipmentCapabilities — one-to-one mappings", () => {
  test("each directly-mapped EquipmentType yields its own capability", () => {
    for (const equipmentType of DIRECTLY_MAPPED_EQUIPMENT_TYPES) {
      const expected = EQUIPMENT_TYPE_CAPABILITY_TABLE[equipmentType];
      expect(deriveEquipmentCapabilities(makeEnvironment([equipmentType]))).toContain(expected);
    }
  });

  test("an unmapped EquipmentType grants nothing on its own", () => {
    expect(deriveEquipmentCapabilities(makeEnvironment(["bodyweight"]))).toEqual([]);
    expect(deriveEquipmentCapabilities(makeEnvironment(["box"]))).toEqual([]);
    expect(deriveEquipmentCapabilities(makeEnvironment(["other"]))).toEqual([]);
  });

  test("an empty environment derives nothing, and is not an error", () => {
    expect(deriveEquipmentCapabilities(makeEnvironment([]))).toEqual([]);
  });

  test("an unknown equipment value is ignored rather than throwing", () => {
    const environment = makeEnvironment([]);
    // Simulates unvalidated JSON carrying a type outside the union.
    const withUnknown: TrainingEnvironment = {
      ...environment,
      availableEquipment: [{ type: "moon_rock" as EquipmentType }, { type: "bench" }],
    };
    expect(deriveEquipmentCapabilities(withUnknown)).toEqual(["bench"]);
  });
});

describe("deriveEquipmentCapabilities — refused equivalences", () => {
  /**
   * Each pair below is documented in `equipmentCapabilities.ts` as
   * deliberately disjoint, for a reason that is physical rather than
   * cosmetic. Deriving one from the other would grant an authorization no
   * chapter gives.
   */
  test.each([
    // A climbing rope is anchored overhead and climbed; a battle rope is
    // anchored at floor level and driven in waves.
    ["rope", "battle_rope"],
    ["battle_rope", "rope"],
    // Two precise apparatus, no hierarchy between them.
    ["cardio_machine", "rowing_ergometer"],
    ["rowing_ergometer", "cardio_machine"],
    // Non-rebounding is a safety property, not a detail.
    ["medicine_ball", "slam_ball"],
    ["slam_ball", "medicine_ball"],
    // One is gripped by the hand, the other is never touched.
    ["rigid_anchor_support", "rope_anchor_point"],
    ["rope_anchor_point", "rigid_anchor_support"],
    // A generic box is not a rated plyometric box.
    ["box", "plyometric_box"],
  ] as const)("declaring %s never grants %s", (declared, forbidden) => {
    expect(deriveEquipmentCapabilities(makeEnvironment([declared]))).not.toContain(forbidden);
  });

  test("a wall rated to receive a thrown implement is not a wall to wrestle against", () => {
    // `wall` is a declared implement; `usable_wall` is an environment flag.
    expect(deriveEquipmentCapabilities(makeEnvironment(["wall"]))).toEqual(["wall"]);
    expect(deriveEquipmentCapabilities(makeEnvironment([], { usableWall: true }))).toEqual(["usable_wall"]);
  });

  test("availableSpace is never read — open_space is a declared implement, not a space level", () => {
    for (const availableSpace of ["very_limited", "limited", "moderate", "large", "open"] as const) {
      expect(deriveEquipmentCapabilities(makeEnvironment([], { availableSpace }))).toEqual([]);
    }
    expect(deriveEquipmentCapabilities(makeEnvironment(["open_space"], { availableSpace: "very_limited" }))).toEqual([
      "open_space",
    ]);
  });
});

describe("deriveEquipmentCapabilities — equivalence groups", () => {
  test("cable_or_band_resistance is satisfied by either member alone", () => {
    expect(deriveEquipmentCapabilities(makeEnvironment(["cable_machine"]))).toContain("cable_or_band_resistance");
    expect(deriveEquipmentCapabilities(makeEnvironment(["resistance_band"]))).toContain("cable_or_band_resistance");
  });

  test("cable_or_band_resistance is absent when neither member is declared", () => {
    expect(deriveEquipmentCapabilities(makeEnvironment(["barbell", "dumbbell"]))).not.toContain(
      "cable_or_band_resistance",
    );
  });

  test.each(EQUIPMENT_CAPABILITY_EQUIVALENCE_GROUPS.loaded_carry_implement)(
    "loaded_carry_implement is satisfied by %s alone",
    (member) => {
      expect(deriveEquipmentCapabilities(makeEnvironment([member]))).toContain("loaded_carry_implement");
    },
  );

  test("loaded_carry_implement is absent when no carry implement is declared", () => {
    expect(deriveEquipmentCapabilities(makeEnvironment(["bodyweight", "pull_up_bar"]))).not.toContain(
      "loaded_carry_implement",
    );
  });

  test("a group never implies its members, and members never imply each other", () => {
    const sandbagOnly = deriveEquipmentCapabilities(makeEnvironment(["sandbag"]));
    expect(sandbagOnly).toEqual(["loaded_carry_implement"]);
    expect(sandbagOnly).not.toContain("dumbbell");
    expect(sandbagOnly).not.toContain("kettlebell");
  });
});

describe("deriveEquipmentCapabilities — environment-derived capabilities", () => {
  test("floorSafe and usableWall grant their capabilities only when strictly true", () => {
    expect(deriveEquipmentCapabilities(makeEnvironment([], { floorSafe: true }))).toEqual(["safe_landing_surface"]);
    expect(deriveEquipmentCapabilities(makeEnvironment([], { floorSafe: false }))).toEqual([]);
    expect(deriveEquipmentCapabilities(makeEnvironment([]))).toEqual([]);

    expect(deriveEquipmentCapabilities(makeEnvironment([], { usableWall: true }))).toEqual(["usable_wall"]);
    expect(deriveEquipmentCapabilities(makeEnvironment([], { usableWall: false }))).toEqual([]);
  });

  test("the environment-derived capabilities cannot come from declared equipment", () => {
    const everyImplement = deriveEquipmentCapabilities(makeEnvironment(ALL_EQUIPMENT_TYPES));
    for (const capability of ENVIRONMENT_DERIVED_CAPABILITIES) {
      expect(everyImplement).not.toContain(capability);
    }
  });
});

describe("deriveEquipmentCapabilities — determinism and purity", () => {
  test("the result is independent of declaration order", () => {
    const a = deriveEquipmentCapabilities(makeEnvironment(["plates", "barbell", "bench"]));
    const b = deriveEquipmentCapabilities(makeEnvironment(["bench", "plates", "barbell"]));
    expect(a).toEqual(b);
  });

  test("the result follows canonical vocabulary order", () => {
    const derived = deriveEquipmentCapabilities(
      makeEnvironment(ALL_EQUIPMENT_TYPES, { floorSafe: true, usableWall: true }),
    );
    const canonicalOrder = EQUIPMENT_CAPABILITY_IDS.filter((capability) => derived.includes(capability));
    expect(derived).toEqual(canonicalOrder);
  });

  test("duplicate declarations produce no duplicate capabilities", () => {
    const derived = deriveEquipmentCapabilities(makeEnvironment(["barbell", "barbell", "barbell"]));
    expect(derived).toEqual(["barbell", "loaded_carry_implement"]);
  });

  test("the environment is never mutated", () => {
    const environment = makeEnvironment(["barbell", "cable_machine"], { floorSafe: true });
    const before = JSON.stringify(environment);
    deriveEquipmentCapabilities(environment);
    expect(JSON.stringify(environment)).toBe(before);
  });

  test("two calls with the same environment return equal arrays", () => {
    const environment = makeEnvironment(["barbell", "plates"], { floorSafe: true });
    expect(deriveEquipmentCapabilities(environment)).toEqual(deriveEquipmentCapabilities(environment));
  });
});
