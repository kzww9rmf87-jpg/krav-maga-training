/**
 * Combat Athlete System — Prescription Contracts
 * Version 0.1
 *
 * Finite contracts for the first deterministic prescription methods.
 *
 * This file contains:
 * - supported method identifiers;
 * - method contracts;
 * - module-to-method authorization profiles;
 * - runtime contract guards;
 * - deterministic lookup helpers.
 *
 * It contains no numerical prescription generation.
 */

import type { CapabilityModule, Identifier } from "../types";
import type {
  ExerciseRole,
  IntensityType,
  StopConditionCategory,
  TempoType,
  VolumeStructure,
} from "./types";

// -----------------------------------------------------------------------------
// Finite prescription vocabulary
// -----------------------------------------------------------------------------

export const TRAINING_METHOD_IDS = [
  "straight_sets_repetitions",
  "timed_isometric_sets",
  "distance_carry_sets",
  "power_repetition_sets",
  "combat_rounds",
  "work_rest_intervals",
  "continuous_aerobic_duration",
  "controlled_mobility_sets",
  "recovery_duration_work",
  // Resisted partner grappling organized in rounds. Deliberately NOT a
  // widening of `combat_rounds`: that contract requires the
  // `impact_equipment` capability and the `impact_limit` and
  // `equipment_failure` stop-condition categories, none of which a
  // bare-handed clinch drill can honestly declare. See the contract below.
  "partner_grappling_rounds",
] as const;

export type TrainingMethodId = (typeof TRAINING_METHOD_IDS)[number];

export type TrainingMethodFamily =
  | "repetition_sets"
  | "timed_sets"
  | "distance_sets"
  | "power_sets"
  | "combat_rounds"
  | "intervals"
  | "continuous_work"
  | "mobility_control"
  | "recovery_work";

export type MethodStatus =
  | "documented"
  | "implemented"
  | "experimental"
  | "deprecated"
  | "unsupported";

export type PrescriptionField =
  | "sets"
  | "repetitions"
  | "duration"
  | "distance"
  | "rounds"
  | "work_intervals"
  | "laterality";

export type MethodRestPolicy =
  | "required"
  | "optional"
  | "forbidden"
  | "not_applicable";

export type TempoPolicy = "required" | "optional" | "forbidden";

export type StopConditionPolicy = "required" | "conditional" | "optional";

export type ModuleSubstitutionPolicy =
  | "exercise_only"
  | "method_then_exercise"
  | "module_removal_allowed"
  | "module_removal_forbidden";

export type PrescriptionCapabilityRequirement =
  | "countable_repetitions"
  | "timed_effort"
  | "distance_measurement"
  | "round_structure"
  | "interval_structure"
  | "continuous_duration"
  | "external_load"
  | "body_mass_loading"
  | "tempo_control"
  | "global_movement_intent"
  | "laterality_resolution"
  | "technical_quality_observation"
  | "impact_equipment"
  | "cyclical_conditioning"
  | "safe_throwing_space"
  /**
   * A resisting human training partner is structurally required: the
   * prescribed work does not exist without one, and the resistance comes
   * from that partner rather than from an implement.
   *
   * The exact counterpart of `impact_equipment` for grappling — one names
   * the object that receives force, the other names the person who returns
   * it. The `partner_resistance` LoadingMode (`validateCompatibility.ts`)
   * already existed and describes the same fact from the loading side; this
   * is the capability side, which is what a method contract can require.
   *
   * The requirement lives here rather than being restated per exercise on
   * purpose: it belongs to the METHOD, so every future exercise using that
   * method inherits it and none can opt out. The knowledge base's own
   * `human_assistance: partner` requirement still governs ELIGIBILITY — the
   * two are different gates on different layers, not a duplicated rule.
   */
  | "partner_resistance";

// -----------------------------------------------------------------------------
// Method contract
// -----------------------------------------------------------------------------

export interface TrainingMethodContract {
  methodId: TrainingMethodId;
  name: string;
  family: TrainingMethodFamily;
  version: "0.1";
  status: MethodStatus;

  supportedModules: readonly CapabilityModule[];
  supportedRoles: readonly ExerciseRole[];

  volumeStructure: VolumeStructure;
  requiredVolumeFields: readonly PrescriptionField[];
  optionalVolumeFields: readonly PrescriptionField[];
  forbiddenVolumeFields: readonly PrescriptionField[];

  allowedIntensityTypes: readonly IntensityType[];
  requiredIntensityTypes: readonly IntensityType[];

  restPolicy: MethodRestPolicy;
  tempoPolicy: TempoPolicy;
  allowedTempoTypes: readonly TempoType[];
  stopConditionPolicy: StopConditionPolicy;
  requiredStopConditionCategories: readonly StopConditionCategory[];

  requiredExerciseCapabilities: readonly PrescriptionCapabilityRequirement[];

  minimumDoseRuleId: Identifier;
  maximumDoseRuleId: Identifier | null;
  sourceRuleIds: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Module authorization profile
// -----------------------------------------------------------------------------

export interface ModuleMethodAuthorization {
  methodId: TrainingMethodId;
  allowedRoles: readonly ExerciseRole[];
  priority: number;
  required: boolean;
  conditions: readonly string[];
  sourceRuleIds: readonly Identifier[];
}

export interface ModulePrescriptionContract {
  moduleId: CapabilityModule;
  version: "0.1";
  primaryObjective: string;

  allowedMethods: readonly ModuleMethodAuthorization[];
  forbiddenMethods: readonly TrainingMethodId[];

  allowedRoles: readonly ExerciseRole[];
  requiredRoles: readonly ExerciseRole[];

  allowedIntensityTypes: readonly IntensityType[];
  preferredIntensityTypes: readonly IntensityType[];

  restPolicy: MethodRestPolicy | "method_dependent";
  tempoPolicy: TempoPolicy | "method_dependent";
  requiredStopConditionCategories: readonly StopConditionCategory[];

  minimumDoseRuleId: Identifier;
  maximumDoseRuleId: Identifier | null;

  durationReductionPriority: readonly ExerciseRole[];
  substitutionPolicy: ModuleSubstitutionPolicy;

  sourceRuleIds: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Shared identifiers
// -----------------------------------------------------------------------------

const SOURCE_METHOD_CATALOGUE = "31_TRAINING_METHOD_CATALOGUE_V0_1";
const SOURCE_MODULE_PROFILES = "32_MODULE_PRESCRIPTION_PROFILES_V0_1";
const SOURCE_NUMERICAL_TABLES = "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1";

// -----------------------------------------------------------------------------
// Method contracts
// -----------------------------------------------------------------------------

export const TRAINING_METHOD_CONTRACTS = {
  straight_sets_repetitions: {
    methodId: "straight_sets_repetitions",
    name: "Straight Sets Repetitions",
    family: "repetition_sets",
    version: "0.1",
    status: "documented",
    supportedModules: [
      "movement",
      "strength",
      "functional_hypertrophy",
      "robustness",
      "grip",
      "core",
    ],
    supportedRoles: [
      "primary",
      "secondary",
      "accessory",
      "robustness",
      "corrective",
    ],
    volumeStructure: "sets_reps",
    requiredVolumeFields: ["sets", "repetitions"],
    optionalVolumeFields: ["laterality"],
    forbiddenVolumeFields: [
      "duration",
      "distance",
      "rounds",
      "work_intervals",
    ],
    allowedIntensityTypes: [
      "absolute_load",
      "percentage_1rm",
      "percentage_training_max",
      "percentage_body_mass",
      "rpe",
      "rir",
      "assistance_level",
      "resistance_category",
      "technical_effort",
      "movement_intent",
    ],
    requiredIntensityTypes: [],
    restPolicy: "required",
    tempoPolicy: "optional",
    allowedTempoTypes: [
      "phase_timed",
      "phase_intent",
      "isometric_hold",
      "global_intent",
      "mixed",
    ],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "technical_failure",
      "pain",
      "completion",
    ],
    requiredExerciseCapabilities: [
      "countable_repetitions",
      "technical_quality_observation",
    ],
    minimumDoseRuleId: "MIN_DOSE_STRAIGHT_SETS_REPETITIONS_V0_1",
    maximumDoseRuleId: "MAX_DOSE_STRAIGHT_SETS_REPETITIONS_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  timed_isometric_sets: {
    methodId: "timed_isometric_sets",
    name: "Timed Isometric Sets",
    family: "timed_sets",
    version: "0.1",
    status: "documented",
    supportedModules: ["movement", "strength", "robustness", "grip", "core", "recovery"],
    supportedRoles: [
      "secondary",
      "accessory",
      "robustness",
      "corrective",
      "recovery",
    ],
    volumeStructure: "sets_duration",
    requiredVolumeFields: ["sets", "duration"],
    optionalVolumeFields: ["laterality"],
    forbiddenVolumeFields: [
      "repetitions",
      "distance",
      "rounds",
      "work_intervals",
    ],
    allowedIntensityTypes: [
      "rpe",
      "technical_effort",
      "resistance_category",
      "absolute_load",
      "percentage_body_mass",
    ],
    requiredIntensityTypes: [],
    restPolicy: "required",
    tempoPolicy: "required",
    allowedTempoTypes: ["isometric_hold", "global_intent"],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "technical_failure",
      "pain",
      "completion",
    ],
    requiredExerciseCapabilities: [
      "timed_effort",
      "tempo_control",
      "technical_quality_observation",
    ],
    minimumDoseRuleId: "MIN_DOSE_TIMED_ISOMETRIC_SETS_V0_1",
    maximumDoseRuleId: "MAX_DOSE_TIMED_ISOMETRIC_SETS_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  distance_carry_sets: {
    methodId: "distance_carry_sets",
    name: "Distance Carry Sets",
    family: "distance_sets",
    version: "0.1",
    status: "documented",
    supportedModules: ["strength", "robustness", "grip", "core", "conditioning"],
    supportedRoles: [
      "primary",
      "secondary",
      "accessory",
      "conditioning",
      "robustness",
    ],
    volumeStructure: "sets_distance",
    requiredVolumeFields: ["sets", "distance"],
    optionalVolumeFields: ["laterality"],
    forbiddenVolumeFields: [
      "repetitions",
      "duration",
      "rounds",
      "work_intervals",
    ],
    allowedIntensityTypes: [
      "absolute_load",
      "percentage_body_mass",
      "rpe",
      "resistance_category",
    ],
    requiredIntensityTypes: [],
    restPolicy: "required",
    tempoPolicy: "forbidden",
    allowedTempoTypes: [],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "technical_failure",
      "balance_loss",
      "equipment_failure",
      "pain",
      "completion",
    ],
    requiredExerciseCapabilities: [
      "distance_measurement",
      "external_load",
      "technical_quality_observation",
    ],
    minimumDoseRuleId: "MIN_DOSE_DISTANCE_CARRY_SETS_V0_1",
    maximumDoseRuleId: "MAX_DOSE_DISTANCE_CARRY_SETS_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  power_repetition_sets: {
    methodId: "power_repetition_sets",
    name: "Power Repetition Sets",
    family: "power_sets",
    version: "0.1",
    status: "documented",
    supportedModules: ["preparation", "movement", "power"],
    supportedRoles: ["primary", "primer", "contrast", "secondary", "technical"],
    volumeStructure: "sets_reps",
    requiredVolumeFields: ["sets", "repetitions"],
    optionalVolumeFields: ["laterality"],
    forbiddenVolumeFields: [
      "duration",
      "distance",
      "rounds",
      "work_intervals",
    ],
    allowedIntensityTypes: [
      "movement_intent",
      "velocity",
      "absolute_load",
      "percentage_1rm",
      "percentage_body_mass",
      "resistance_category",
      "impact_intent",
      "technical_effort",
    ],
    requiredIntensityTypes: ["movement_intent"],
    restPolicy: "required",
    tempoPolicy: "required",
    allowedTempoTypes: ["global_intent"],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "technical_failure",
      "velocity_loss",
      "fatigue_limit",
      "impact_limit",
      "balance_loss",
      "pain",
      "completion",
    ],
    requiredExerciseCapabilities: [
      "countable_repetitions",
      "global_movement_intent",
      "technical_quality_observation",
    ],
    minimumDoseRuleId: "MIN_DOSE_POWER_REPETITION_SETS_V0_1",
    maximumDoseRuleId: "MAX_DOSE_POWER_REPETITION_SETS_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  combat_rounds: {
    methodId: "combat_rounds",
    name: "Combat Rounds",
    family: "combat_rounds",
    version: "0.1",
    status: "documented",
    supportedModules: ["power", "conditioning"],
    supportedRoles: ["technical", "conditioning", "primary", "secondary"],
    volumeStructure: "rounds_duration",
    requiredVolumeFields: ["rounds", "duration"],
    optionalVolumeFields: ["laterality"],
    forbiddenVolumeFields: ["sets", "repetitions", "distance", "work_intervals"],
    allowedIntensityTypes: [
      "technical_effort",
      "impact_intent",
      "rpe",
      "heart_rate",
      "movement_intent",
      "pace",
    ],
    requiredIntensityTypes: [],
    restPolicy: "required",
    tempoPolicy: "forbidden",
    allowedTempoTypes: [],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "technical_failure",
      "coordination_loss",
      "balance_loss",
      "impact_limit",
      "equipment_failure",
      "pain",
      "acute_symptom",
      "completion",
    ],
    requiredExerciseCapabilities: [
      "round_structure",
      "technical_quality_observation",
      "impact_equipment",
    ],
    minimumDoseRuleId: "MIN_DOSE_COMBAT_ROUNDS_V0_1",
    maximumDoseRuleId: "MAX_DOSE_COMBAT_ROUNDS_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  work_rest_intervals: {
    methodId: "work_rest_intervals",
    name: "Work-Rest Intervals",
    family: "intervals",
    version: "0.1",
    status: "documented",
    supportedModules: ["power", "grip", "conditioning"],
    supportedRoles: ["conditioning", "secondary", "accessory", "technical"],
    volumeStructure: "intervals",
    requiredVolumeFields: ["work_intervals", "duration"],
    optionalVolumeFields: ["distance", "laterality"],
    forbiddenVolumeFields: ["sets", "repetitions", "rounds"],
    allowedIntensityTypes: [
      "rpe",
      "heart_rate",
      "pace",
      "velocity",
      "technical_effort",
      "impact_intent",
      "movement_intent",
      "resistance_category",
    ],
    requiredIntensityTypes: [],
    restPolicy: "required",
    tempoPolicy: "forbidden",
    allowedTempoTypes: [],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "pace_loss",
      "technical_failure",
      "fatigue_limit",
      "acute_symptom",
      "pain",
      "completion",
    ],
    requiredExerciseCapabilities: [
      "interval_structure",
      "timed_effort",
      "technical_quality_observation",
    ],
    minimumDoseRuleId: "MIN_DOSE_WORK_REST_INTERVALS_V0_1",
    maximumDoseRuleId: "MAX_DOSE_WORK_REST_INTERVALS_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  continuous_aerobic_duration: {
    methodId: "continuous_aerobic_duration",
    name: "Continuous Aerobic Duration",
    family: "continuous_work",
    version: "0.1",
    status: "documented",
    supportedModules: ["preparation", "conditioning", "recovery"],
    supportedRoles: ["conditioning", "recovery", "secondary"],
    volumeStructure: "continuous_duration",
    requiredVolumeFields: ["duration"],
    optionalVolumeFields: [],
    forbiddenVolumeFields: [
      "sets",
      "repetitions",
      "distance",
      "rounds",
      "work_intervals",
      "laterality",
    ],
    allowedIntensityTypes: ["heart_rate", "pace", "rpe", "technical_effort"],
    requiredIntensityTypes: [],
    restPolicy: "not_applicable",
    tempoPolicy: "forbidden",
    allowedTempoTypes: [],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "intensity_limit",
      "pace_loss",
      "acute_symptom",
      "environmental_hazard",
      "pain",
      "completion",
      "time_limit",
    ],
    requiredExerciseCapabilities: [
      "continuous_duration",
      "cyclical_conditioning",
    ],
    minimumDoseRuleId: "MIN_DOSE_CONTINUOUS_AEROBIC_DURATION_V0_1",
    maximumDoseRuleId: "MAX_DOSE_CONTINUOUS_AEROBIC_DURATION_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  controlled_mobility_sets: {
    methodId: "controlled_mobility_sets",
    name: "Controlled Mobility Sets",
    family: "mobility_control",
    version: "0.1",
    status: "documented",
    supportedModules: ["preparation", "movement", "robustness", "recovery"],
    supportedRoles: [
      "primer",
      "corrective",
      "recovery",
      "technical",
      "accessory",
    ],
    volumeStructure: "sets_duration",
    requiredVolumeFields: ["sets", "duration"],
    optionalVolumeFields: ["laterality"],
    forbiddenVolumeFields: [
      "repetitions",
      "distance",
      "rounds",
      "work_intervals",
    ],
    allowedIntensityTypes: ["technical_effort", "movement_intent", "rpe"],
    requiredIntensityTypes: [],
    restPolicy: "optional",
    tempoPolicy: "required",
    allowedTempoTypes: [
      "phase_timed",
      "phase_intent",
      "global_intent",
      "mixed",
    ],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "pain",
      "technical_failure",
      "range_of_motion_loss",
      "balance_loss",
      "completion",
    ],
    requiredExerciseCapabilities: [
      "timed_effort",
      "tempo_control",
      "technical_quality_observation",
    ],
    minimumDoseRuleId: "MIN_DOSE_CONTROLLED_MOBILITY_SETS_V0_1",
    maximumDoseRuleId: "MAX_DOSE_CONTROLLED_MOBILITY_SETS_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  recovery_duration_work: {
    methodId: "recovery_duration_work",
    name: "Recovery Duration Work",
    family: "recovery_work",
    version: "0.1",
    status: "documented",
    supportedModules: ["preparation", "movement", "recovery"],
    supportedRoles: ["recovery", "corrective"],
    volumeStructure: "continuous_duration",
    requiredVolumeFields: ["duration"],
    optionalVolumeFields: [],
    forbiddenVolumeFields: [
      "sets",
      "repetitions",
      "distance",
      "rounds",
      "work_intervals",
      "laterality",
    ],
    allowedIntensityTypes: [
      "rpe",
      "heart_rate",
      "technical_effort",
      "movement_intent",
    ],
    requiredIntensityTypes: [],
    restPolicy: "not_applicable",
    tempoPolicy: "optional",
    allowedTempoTypes: ["phase_intent", "global_intent"],
    stopConditionPolicy: "required",
    requiredStopConditionCategories: [
      "intensity_limit",
      "acute_symptom",
      "pain",
      "completion",
      "time_limit",
    ],
    requiredExerciseCapabilities: ["continuous_duration"],
    minimumDoseRuleId: "MIN_DOSE_RECOVERY_DURATION_WORK_V0_1",
    maximumDoseRuleId: "MAX_DOSE_RECOVERY_DURATION_WORK_V0_1",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_NUMERICAL_TABLES],
  },

  // ---------------------------------------------------------------------------
  // Method 10 — Partner Grappling Rounds
  //
  // WHY THIS IS A NEW METHOD AND NOT A WIDENING OF `combat_rounds`.
  //
  // Four independent structural blockers, every one of them verifiable in
  // the `combat_rounds` contract above rather than a matter of taste:
  //
  //  1. `requiredExerciseCapabilities` contains `impact_equipment`. A
  //     bare-handed clinch drill has no impact equipment, so every grappling
  //     entry would fail `validateCompatibility` with
  //     `EXERCISE_REQUIRED_CAPABILITY_MISSING` — unless it falsely declared
  //     a capability tag it does not have.
  //  2. `requiredStopConditionCategories` contains `impact_limit` AND
  //     `equipment_failure`. Neither is documented by any of the three
  //     grappling chapters (checked directly): there is no impact to limit
  //     and no implement to fail. Prescription would fail at the
  //     `stop_conditions` stage, or succeed only on two invented conditions.
  //  3. `supportedModules` is `["power", "conditioning"]`, and the movement
  //     module's own `forbiddenMethods` lists `combat_rounds`. Both would
  //     have to be edited, and the consequence is not local: `combat_rounds`
  //     would become reachable from `movement` for STRIKING exercises too,
  //     which is exactly the isolation the forbidden-list encodes today.
  //  4. Table Group 9's own doctrine makes `combat_rounds` sport-bound:
  //     `combat_technical_rounds_v0_1` carries
  //     `requiresSportSpecificSubtype: true`, and the table states the
  //     work-to-rest ratio "must come from the athlete's combat sport" and
  //     "must not use one universal work-to-rest ratio". The three drills
  //     this method serves are explicitly cross-discipline — each rates
  //     five stars for Wrestling, BJJ, Judo, Sambo and MMA at once — so no
  //     single sport subtype describes them.
  //
  // Weakening any of those four to save one method identifier would trade a
  // precise contract for a permissive one. The catalogue documents
  // `movement` among `combat_rounds`' POTENTIAL modules; the implementation
  // deliberately narrowed it, and this method exists so that narrowing can
  // stay.
  //
  // WHAT IS SHARED. The structural family is `combat_rounds` — the family
  // vocabulary is closed and describes SHAPE (repetition_sets, timed_sets,
  // intervals, …), and this is the same shape: repeated rounds of a
  // documented duration. Same family, different method, different contract.
  // ---------------------------------------------------------------------------
  partner_grappling_rounds: {
    methodId: "partner_grappling_rounds",
    name: "Partner Grappling Rounds",
    family: "combat_rounds",
    version: "0.1",
    status: "documented",
    // Movement only. This method is not offered to `power` or
    // `conditioning`: those already have `combat_rounds` and
    // `work_rest_intervals`, and the knowledge base places all three
    // grappling drills in `movement`.
    supportedModules: ["movement"],
    // A subset of the movement module's own allowed roles. `primer`,
    // `corrective` and `recovery` are excluded: resisted work against a
    // live opponent is neither a warm-up, a correction nor recovery.
    supportedRoles: ["technical", "secondary", "accessory"],
    volumeStructure: "rounds_duration",
    requiredVolumeFields: ["rounds", "duration"],
    optionalVolumeFields: [],
    // `laterality` is forbidden, unlike `combat_rounds` where it is
    // optional. A clinch exchange is not allocated per side: both athletes
    // use both sides continuously, and the round is the unit. Declaring it
    // optional would leave the door open to a per-side round count, which
    // no chapter documents and which the drills cannot mean.
    forbiddenVolumeFields: [
      "sets",
      "repetitions",
      "distance",
      "work_intervals",
      "laterality",
    ],
    // `impact_intent` is absent — no strike is prescribed, so there is no
    // impact whose intent could be dosed. `heart_rate` and `pace` are
    // absent: neither is measurable in a clinch exchange without equipment
    // no chapter requires. The three that remain are exactly the three the
    // movement module allows and that a partner drill can honestly carry.
    allowedIntensityTypes: ["technical_effort", "movement_intent", "rpe"],
    requiredIntensityTypes: [],
    // Rest between rounds is required. See Table Group 18 and
    // 32_MODULE_PRESCRIPTION_PROFILES.md's "Partner Grappling Rounds"
    // doctrine for the band and for the explicit statement that the band is
    // an engineering decision, not a value read off an exercise chapter.
    restPolicy: "required",
    // Forbidden, for the same reason `combat_rounds` forbids it and one
    // reason of its own: the rhythm of a resisted exchange is set by the
    // opponent. All three chapters describe velocity as "Reactive" and
    // "Variable" — words that mean the tempo is not the athlete's to
    // prescribe.
    tempoPolicy: "forbidden",
    allowedTempoTypes: [],
    stopConditionPolicy: "required",
    // Eight categories: `combat_rounds`' eight, minus the two that assume
    // impact and equipment, plus the two that a resisting human introduces.
    //
    // - `intensity_limit` — the partner's resistance exceeded the level the
    //   drill is being run at. This is the one intensity channel a partner
    //   drill genuinely has, and it is a stop condition rather than a dosed
    //   value precisely because no chapter quantifies resistance.
    // - `manual_termination` — either athlete asks to stop. Grappling is
    //   the only family in the library where a SECOND person can end the
    //   work, and no other category expresses that.
    //
    // `range_of_motion_loss` is deliberately absent: none of the three
    // chapters documents a range-of-motion concern (checked directly). The
    // movement module lists it, but module-level categories are not
    // enforced by any resolver — an entry may still declare it when its own
    // chapter documents one.
    requiredStopConditionCategories: [
      "technical_failure",
      "coordination_loss",
      "balance_loss",
      "intensity_limit",
      "pain",
      "acute_symptom",
      "manual_termination",
      "completion",
    ],
    // Structurally parallel to `combat_rounds`, with `impact_equipment`
    // replaced by `partner_resistance` — the same slot, the other contact
    // model.
    requiredExerciseCapabilities: [
      "round_structure",
      "technical_quality_observation",
      "partner_resistance",
    ],
    minimumDoseRuleId: "MIN_DOSE_PARTNER_GRAPPLING_ROUNDS_V0_1",
    maximumDoseRuleId: "MAX_DOSE_PARTNER_GRAPPLING_ROUNDS_V0_1",
    sourceRuleIds: [
      SOURCE_METHOD_CATALOGUE,
      SOURCE_MODULE_PROFILES,
      SOURCE_NUMERICAL_TABLES,
    ],
  },
} as const satisfies Record<TrainingMethodId, TrainingMethodContract>;

// -----------------------------------------------------------------------------
// Module contracts
// -----------------------------------------------------------------------------

const authorization = (
  methodId: TrainingMethodId,
  allowedRoles: readonly ExerciseRole[],
  priority: number,
  conditions: readonly string[] = [],
): ModuleMethodAuthorization => ({
  methodId,
  allowedRoles,
  priority,
  required: false,
  conditions,
  sourceRuleIds: [SOURCE_MODULE_PROFILES],
});

export const MODULE_PRESCRIPTION_CONTRACTS = {
  preparation: {
    moduleId: "preparation",
    version: "0.1",
    primaryObjective:
      "Prepare the athlete physically and neurologically while limiting unnecessary fatigue.",
    allowedMethods: [
      authorization("controlled_mobility_sets", [
        "primer",
        "technical",
        "corrective",
        "recovery",
      ], 1),
      authorization("power_repetition_sets", ["primer", "technical"], 2),
      authorization("recovery_duration_work", ["recovery", "corrective"], 3),
      authorization("continuous_aerobic_duration", ["recovery", "secondary"], 4),
    ],
    forbiddenMethods: [
      "straight_sets_repetitions",
      "timed_isometric_sets",
      "distance_carry_sets",
      "combat_rounds",
      "work_rest_intervals",
    ],
    allowedRoles: ["primer", "technical", "corrective", "recovery", "secondary"],
    requiredRoles: [],
    allowedIntensityTypes: [
      "technical_effort",
      "movement_intent",
      "rpe",
      "heart_rate",
    ],
    preferredIntensityTypes: ["technical_effort", "movement_intent"],
    restPolicy: "method_dependent",
    tempoPolicy: "method_dependent",
    requiredStopConditionCategories: [
      "pain",
      "acute_symptom",
      "technical_failure",
      "completion",
    ],
    minimumDoseRuleId: "MIN_DOSE_PREPARATION_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: ["recovery", "corrective", "technical", "primer"],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  movement: {
    moduleId: "movement",
    version: "0.1",
    primaryObjective:
      "Develop movement quality, control, coordination and transferable movement capacity.",
    allowedMethods: [
      authorization("controlled_mobility_sets", [
        "technical",
        "corrective",
        "primer",
        "recovery",
        "accessory",
      ], 1),
      authorization("straight_sets_repetitions", [
        "secondary",
        "accessory",
        "corrective",
      ], 2),
      authorization("power_repetition_sets", [
        "primer",
        "technical",
        "secondary",
      ], 3),
      authorization("recovery_duration_work", ["recovery", "corrective"], 4),
      authorization("timed_isometric_sets", [
        "secondary",
        "accessory",
        "corrective",
        "recovery",
      ], 5),
      // Last in preference order on purpose. Resisted partner work is the
      // most specialized and most fatiguing way this module can be
      // prescribed; it must never be selected ahead of controlled mobility
      // or repetition work when both are authorized.
      authorization("partner_grappling_rounds", [
        "technical",
        "secondary",
        "accessory",
      ], 6, ["Requires a resisting training partner."]),
    ],
    // `combat_rounds` stays forbidden here. `partner_grappling_rounds` was
    // added precisely so that this line would not have to move: striking
    // rounds remain unreachable from the movement module.
    forbiddenMethods: [
      "distance_carry_sets",
      "combat_rounds",
      "work_rest_intervals",
      "continuous_aerobic_duration",
    ],
    allowedRoles: [
      "technical",
      "corrective",
      "primer",
      "secondary",
      "accessory",
      "recovery",
    ],
    requiredRoles: [],
    allowedIntensityTypes: [
      "technical_effort",
      "movement_intent",
      "rpe",
      "resistance_category",
    ],
    preferredIntensityTypes: ["technical_effort", "movement_intent"],
    restPolicy: "method_dependent",
    tempoPolicy: "method_dependent",
    requiredStopConditionCategories: [
      "pain",
      "technical_failure",
      "range_of_motion_loss",
      "balance_loss",
      "coordination_loss",
      "completion",
    ],
    minimumDoseRuleId: "MIN_DOSE_MOVEMENT_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: [
      "recovery",
      "accessory",
      "corrective",
      "secondary",
      "technical",
      "primer",
    ],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  power: {
    moduleId: "power",
    version: "0.1",
    primaryObjective:
      "Develop rapid force expression, acceleration and ballistic output while preserving quality.",
    allowedMethods: [
      authorization("power_repetition_sets", [
        "primary",
        "primer",
        "contrast",
        "technical",
        "secondary",
      ], 1),
      authorization("combat_rounds", [
        "primary",
        "technical",
        "secondary",
        "conditioning",
      ], 2, ["Requires a compatible combat exercise profile."]),
      authorization("work_rest_intervals", [
        "conditioning",
        "secondary",
        "technical",
      ], 3),
    ],
    forbiddenMethods: [
      "straight_sets_repetitions",
      "timed_isometric_sets",
      "distance_carry_sets",
      "continuous_aerobic_duration",
      "controlled_mobility_sets",
      "recovery_duration_work",
    ],
    allowedRoles: [
      "primary",
      "primer",
      "contrast",
      "technical",
      "secondary",
      "conditioning",
    ],
    requiredRoles: [],
    allowedIntensityTypes: [
      "movement_intent",
      "velocity",
      "absolute_load",
      "percentage_1rm",
      "percentage_body_mass",
      "resistance_category",
      "impact_intent",
      "technical_effort",
      "rpe",
    ],
    preferredIntensityTypes: [
      "movement_intent",
      "velocity",
      "impact_intent",
    ],
    restPolicy: "required",
    tempoPolicy: "required",
    requiredStopConditionCategories: [
      "technical_failure",
      "velocity_loss",
      "fatigue_limit",
      "impact_limit",
      "balance_loss",
      "pain",
      "completion",
    ],
    minimumDoseRuleId: "MIN_DOSE_POWER_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: [
      "conditioning",
      "secondary",
      "technical",
      "contrast",
      "primary",
      "primer",
    ],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  strength: {
    moduleId: "strength",
    version: "0.1",
    primaryObjective:
      "Develop the athlete's capacity to produce high force against external resistance.",
    allowedMethods: [
      authorization("straight_sets_repetitions", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
      ], 1),
      authorization("distance_carry_sets", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
      ], 2),
      authorization("timed_isometric_sets", [
        "secondary",
        "accessory",
        "robustness",
      ], 3),
    ],
    forbiddenMethods: [
      "power_repetition_sets",
      "combat_rounds",
      "work_rest_intervals",
      "continuous_aerobic_duration",
      "controlled_mobility_sets",
      "recovery_duration_work",
    ],
    allowedRoles: ["primary", "secondary", "accessory", "robustness"],
    requiredRoles: [],
    allowedIntensityTypes: [
      "absolute_load",
      "percentage_1rm",
      "percentage_training_max",
      "percentage_body_mass",
      "rpe",
      "rir",
      "resistance_category",
    ],
    preferredIntensityTypes: [
      "percentage_1rm",
      "percentage_training_max",
      "absolute_load",
      "rpe",
    ],
    restPolicy: "required",
    tempoPolicy: "method_dependent",
    requiredStopConditionCategories: [
      "pain",
      "technical_failure",
      "intensity_limit",
      "equipment_failure",
      "completion",
    ],
    minimumDoseRuleId: "MIN_DOSE_STRENGTH_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: [
      "accessory",
      "robustness",
      "secondary",
      "primary",
    ],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  functional_hypertrophy: {
    moduleId: "functional_hypertrophy",
    version: "0.1",
    primaryObjective:
      "Develop useful muscular tissue while preserving movement quality and recovery compatibility.",
    allowedMethods: [
      authorization("straight_sets_repetitions", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
      ], 1),
      authorization("timed_isometric_sets", [
        "secondary",
        "accessory",
        "robustness",
      ], 2),
    ],
    forbiddenMethods: [
      "distance_carry_sets",
      "power_repetition_sets",
      "combat_rounds",
      "work_rest_intervals",
      "continuous_aerobic_duration",
      "controlled_mobility_sets",
      "recovery_duration_work",
    ],
    allowedRoles: ["primary", "secondary", "accessory", "robustness"],
    requiredRoles: [],
    allowedIntensityTypes: [
      "absolute_load",
      "percentage_1rm",
      "percentage_training_max",
      "rpe",
      "rir",
      "assistance_level",
      "resistance_category",
    ],
    preferredIntensityTypes: ["rpe", "rir", "absolute_load"],
    restPolicy: "required",
    tempoPolicy: "method_dependent",
    requiredStopConditionCategories: [
      "pain",
      "technical_failure",
      "intensity_limit",
      "fatigue_limit",
      "completion",
    ],
    minimumDoseRuleId: "MIN_DOSE_FUNCTIONAL_HYPERTROPHY_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: [
      "accessory",
      "robustness",
      "secondary",
      "primary",
    ],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  robustness: {
    moduleId: "robustness",
    version: "0.1",
    primaryObjective:
      "Increase tolerance, structural capacity and resilience without avoidable risk.",
    allowedMethods: [
      authorization("timed_isometric_sets", [
        "robustness",
        "corrective",
        "secondary",
        "accessory",
      ], 1),
      authorization("straight_sets_repetitions", [
        "robustness",
        "corrective",
        "secondary",
        "accessory",
      ], 2),
      authorization("distance_carry_sets", [
        "robustness",
        "secondary",
        "accessory",
      ], 3),
      authorization("controlled_mobility_sets", [
        "corrective",
        "accessory",
      ], 4),
    ],
    forbiddenMethods: [
      "power_repetition_sets",
      "combat_rounds",
      "work_rest_intervals",
      "continuous_aerobic_duration",
      "recovery_duration_work",
    ],
    allowedRoles: ["robustness", "corrective", "secondary", "accessory"],
    requiredRoles: [],
    allowedIntensityTypes: [
      "rpe",
      "rir",
      "absolute_load",
      "percentage_body_mass",
      "technical_effort",
      "resistance_category",
    ],
    preferredIntensityTypes: ["rpe", "technical_effort"],
    restPolicy: "method_dependent",
    tempoPolicy: "method_dependent",
    requiredStopConditionCategories: [
      "pain",
      "acute_symptom",
      "technical_failure",
      "range_of_motion_loss",
      "balance_loss",
      "fatigue_limit",
      "completion",
    ],
    minimumDoseRuleId: "MIN_DOSE_ROBUSTNESS_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: [
      "accessory",
      "corrective",
      "secondary",
      "robustness",
    ],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  grip: {
    moduleId: "grip",
    version: "0.1",
    primaryObjective:
      "Develop gripping strength, endurance, control and combat transfer.",
    allowedMethods: [
      authorization("distance_carry_sets", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
        "conditioning",
      ], 1),
      authorization("timed_isometric_sets", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
      ], 2),
      authorization("straight_sets_repetitions", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
      ], 3),
      authorization("work_rest_intervals", [
        "conditioning",
        "secondary",
        "accessory",
      ], 4),
    ],
    forbiddenMethods: [
      "power_repetition_sets",
      "combat_rounds",
      "continuous_aerobic_duration",
      "controlled_mobility_sets",
      "recovery_duration_work",
    ],
    allowedRoles: [
      "primary",
      "secondary",
      "accessory",
      "robustness",
      "conditioning",
    ],
    requiredRoles: [],
    allowedIntensityTypes: [
      "absolute_load",
      "percentage_body_mass",
      "rpe",
      "rir",
      "resistance_category",
      "technical_effort",
    ],
    preferredIntensityTypes: ["absolute_load", "rpe", "resistance_category"],
    restPolicy: "required",
    tempoPolicy: "method_dependent",
    requiredStopConditionCategories: [
      "technical_failure",
      "fatigue_limit",
      "equipment_failure",
      "pain",
      "balance_loss",
      "completion",
    ],
    minimumDoseRuleId: "MIN_DOSE_GRIP_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: [
      "accessory",
      "conditioning",
      "robustness",
      "secondary",
      "primary",
    ],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  core: {
    moduleId: "core",
    version: "0.1",
    primaryObjective:
      "Develop force transfer, trunk control and combat-relevant stability.",
    allowedMethods: [
      authorization("timed_isometric_sets", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
        "corrective",
      ], 1),
      authorization("straight_sets_repetitions", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
        "corrective",
      ], 2),
      authorization("distance_carry_sets", [
        "primary",
        "secondary",
        "accessory",
        "robustness",
      ], 3),
      authorization("controlled_mobility_sets", ["corrective", "accessory"], 4),
    ],
    forbiddenMethods: [
      "power_repetition_sets",
      "combat_rounds",
      "work_rest_intervals",
      "continuous_aerobic_duration",
      "controlled_mobility_sets",
      "recovery_duration_work",
    ],
    allowedRoles: [
      "primary",
      "secondary",
      "accessory",
      "robustness",
      "corrective",
    ],
    requiredRoles: [],
    allowedIntensityTypes: [
      "rpe",
      "technical_effort",
      "absolute_load",
      "percentage_body_mass",
      "resistance_category",
    ],
    preferredIntensityTypes: ["technical_effort", "rpe"],
    restPolicy: "method_dependent",
    tempoPolicy: "method_dependent",
    requiredStopConditionCategories: [
      "pain",
      "technical_failure",
      "range_of_motion_loss",
      "balance_loss",
      "fatigue_limit",
      "completion",
    ],
    minimumDoseRuleId: "MIN_DOSE_CORE_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: [
      "accessory",
      "corrective",
      "robustness",
      "secondary",
      "primary",
    ],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  conditioning: {
    moduleId: "conditioning",
    version: "0.1",
    primaryObjective:
      "Develop energy-system capacity, repeatability, pace control and work tolerance.",
    allowedMethods: [
      authorization("work_rest_intervals", [
        "conditioning",
        "secondary",
        "accessory",
      ], 1),
      authorization("combat_rounds", [
        "conditioning",
        "primary",
        "secondary",
        "technical",
      ], 2, ["Requires a compatible combat exercise profile."]),
      authorization("continuous_aerobic_duration", [
        "conditioning",
        "secondary",
        "recovery",
      ], 3),
      authorization("distance_carry_sets", [
        "conditioning",
        "secondary",
        "accessory",
      ], 4),
    ],
    forbiddenMethods: [
      "straight_sets_repetitions",
      "timed_isometric_sets",
      "power_repetition_sets",
      "controlled_mobility_sets",
      "recovery_duration_work",
    ],
    allowedRoles: [
      "conditioning",
      "primary",
      "secondary",
      "accessory",
      "technical",
      "recovery",
    ],
    requiredRoles: [],
    allowedIntensityTypes: [
      "heart_rate",
      "pace",
      "rpe",
      "technical_effort",
      "impact_intent",
      "movement_intent",
      "velocity",
      "resistance_category",
    ],
    preferredIntensityTypes: ["heart_rate", "pace", "rpe"],
    restPolicy: "method_dependent",
    tempoPolicy: "forbidden",
    requiredStopConditionCategories: [
      "acute_symptom",
      "pain",
      "pace_loss",
      "intensity_limit",
      "technical_failure",
      "fatigue_limit",
      "environmental_hazard",
      "completion",
      "time_limit",
    ],
    minimumDoseRuleId: "MIN_DOSE_CONDITIONING_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: [
      "accessory",
      "secondary",
      "conditioning",
      "primary",
    ],
    substitutionPolicy: "method_then_exercise",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },

  recovery: {
    moduleId: "recovery",
    version: "0.1",
    primaryObjective:
      "Support restoration and readiness without adding meaningful fatigue.",
    allowedMethods: [
      authorization("recovery_duration_work", ["recovery", "corrective"], 1),
      authorization("controlled_mobility_sets", ["recovery", "corrective"], 2),
      authorization("continuous_aerobic_duration", ["recovery", "secondary"], 3),
      authorization("timed_isometric_sets", ["recovery", "corrective"], 4),
    ],
    forbiddenMethods: [
      "straight_sets_repetitions",
      "distance_carry_sets",
      "power_repetition_sets",
      "combat_rounds",
      "work_rest_intervals",
    ],
    allowedRoles: ["recovery", "corrective", "secondary"],
    requiredRoles: [],
    allowedIntensityTypes: [
      "rpe",
      "heart_rate",
      "technical_effort",
      "movement_intent",
    ],
    preferredIntensityTypes: ["rpe", "technical_effort"],
    restPolicy: "method_dependent",
    tempoPolicy: "method_dependent",
    requiredStopConditionCategories: [
      "pain",
      "acute_symptom",
      "intensity_limit",
      "technical_failure",
      "completion",
      "time_limit",
    ],
    minimumDoseRuleId: "MIN_DOSE_RECOVERY_MODULE_V0_1",
    maximumDoseRuleId: null,
    durationReductionPriority: ["corrective", "recovery", "secondary"],
    substitutionPolicy: "module_removal_allowed",
    sourceRuleIds: [SOURCE_MODULE_PROFILES],
  },
} as const satisfies Record<CapabilityModule, ModulePrescriptionContract>;

// -----------------------------------------------------------------------------
// Runtime guards
// -----------------------------------------------------------------------------

const TRAINING_METHOD_ID_SET: ReadonlySet<string> = new Set(TRAINING_METHOD_IDS);

export const isTrainingMethodId = (
  value: unknown,
): value is TrainingMethodId =>
  typeof value === "string" && TRAINING_METHOD_ID_SET.has(value);

export const getTrainingMethodContract = (
  methodId: TrainingMethodId,
): TrainingMethodContract => TRAINING_METHOD_CONTRACTS[methodId];

export const getModulePrescriptionContract = (
  moduleId: CapabilityModule,
): ModulePrescriptionContract => MODULE_PRESCRIPTION_CONTRACTS[moduleId];

export const isMethodAuthorizedForModule = (
  moduleId: CapabilityModule,
  methodId: TrainingMethodId,
): boolean =>
  MODULE_PRESCRIPTION_CONTRACTS[moduleId].allowedMethods.some(
    (authorizationRule) => authorizationRule.methodId === methodId,
  );

export const isRoleAuthorizedForMethod = (
  methodId: TrainingMethodId,
  role: ExerciseRole,
): boolean =>
  (TRAINING_METHOD_CONTRACTS[methodId].supportedRoles as readonly ExerciseRole[]).includes(role);

export const isRoleAuthorizedForModuleMethod = (
  moduleId: CapabilityModule,
  methodId: TrainingMethodId,
  role: ExerciseRole,
): boolean => {
  const authorizationRule =
    MODULE_PRESCRIPTION_CONTRACTS[moduleId].allowedMethods.find(
      (candidate) => candidate.methodId === methodId,
    );

  return (authorizationRule?.allowedRoles as readonly ExerciseRole[] | undefined)?.includes(role) ?? false;
};

export const getAuthorizedMethodsForModule = (
  moduleId: CapabilityModule,
  role?: ExerciseRole,
): readonly ModuleMethodAuthorization[] => {
  const authorizations = MODULE_PRESCRIPTION_CONTRACTS[moduleId].allowedMethods;

  const filtered =
    role === undefined
      ? authorizations
      : authorizations.filter((candidate) =>
          (candidate.allowedRoles as readonly ExerciseRole[]).includes(role),
        );

  return [...filtered].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.methodId.localeCompare(right.methodId);
  });
};

export const validateMethodModuleRoleContract = (
  moduleId: CapabilityModule,
  methodId: TrainingMethodId,
  role: ExerciseRole,
):
  | {
      valid: true;
      method: TrainingMethodContract;
      module: ModulePrescriptionContract;
      authorization: ModuleMethodAuthorization;
    }
  | {
      valid: false;
      reason:
        | "METHOD_MODULE_INCOMPATIBLE"
        | "METHOD_ROLE_INCOMPATIBLE"
        | "MODULE_ROLE_INCOMPATIBLE";
    } => {
  const moduleContract = getModulePrescriptionContract(moduleId);
  const methodContract = getTrainingMethodContract(methodId);

  if (!(moduleContract.allowedRoles as readonly ExerciseRole[]).includes(role)) {
    return {
      valid: false,
      reason: "MODULE_ROLE_INCOMPATIBLE",
    };
  }

  const authorizationRule = moduleContract.allowedMethods.find(
    (candidate) => candidate.methodId === methodId,
  );

  if (authorizationRule === undefined) {
    return {
      valid: false,
      reason: "METHOD_MODULE_INCOMPATIBLE",
    };
  }

  if (
    !(methodContract.supportedRoles as readonly ExerciseRole[]).includes(role) ||
    !(authorizationRule.allowedRoles as readonly ExerciseRole[]).includes(role)
  ) {
    return {
      valid: false,
      reason: "METHOD_ROLE_INCOMPATIBLE",
    };
  }

  return {
    valid: true,
    method: methodContract,
    module: moduleContract,
    authorization: authorizationRule,
  };
};
