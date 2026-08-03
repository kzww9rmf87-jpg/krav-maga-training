/**
 * Combat Athlete System — Pilot Exercise Prescription Registry
 * Version 0.1
 *
 * The first structured, real (non-fixture-only) source of
 * `ExercisePrescriptionSource` data. A deliberately small vertical slice —
 * seven exercises, each fully documented in `50-exercises/` — proving the
 * engine can produce a complete, deterministic prescription end to end
 * without inventing a single field.
 *
 * Every entry below cites the exact chapter and section it was built from
 * in a comment directly above it. Nothing here is deduced from the
 * exercise's module, name or role: every method, capability tag, volume
 * structure, intensity type, equipment requirement, instruction and stop
 * condition is either (a) copied from the cited exercise chapter, (b)
 * copied from the method/module contract already implemented in
 * `contracts.ts`, or (c) copied from the numerical profile already
 * implemented in `prescriptionKnowledge.ts`. `28_STOP_CONDITIONS.md` now
 * documents the stop-condition categories and factories used below;
 * exercise-specific instruction text is still grounded in the cited
 * exercise chapter, never invented from `28_STOP_CONDITIONS.md` alone.
 *
 * This registry is static and does not read `context` to decide *what* an
 * exercise supports — `context` only supplies athlete- and
 * session-specific facts (athlete references, available equipment,
 * range context, load rounding) that the registry itself cannot know.
 * See `getExercisePrescriptionSource` at the bottom of this file.
 */

import type { CapabilityModule, Identifier } from "../types";
import {
  acuteSymptomCondition,
  balanceLossCondition,
  completionCondition,
  equipmentFailureCondition,
  fatigueLimitCondition,
  impactLimitCondition,
  intervalPaceLossCondition,
  manualTerminationCondition,
  painCondition,
  partnerResistanceLimitCondition,
  rangeOfMotionLossCondition,
  roundBalanceLossCondition,
  roundCoordinationLossCondition,
  roundTechnicalFailureCondition,
  technicalFailureCondition,
  velocityLossCondition,
} from "./stopConditionRegistry";
import { makeInstruction } from "./instructionRegistry";
import type { StopConditionDefinition } from "./resolveStopConditions";
import type { InstructionDefinition } from "./resolveInstructions";
import {
  requiresLateralityResolution,
  type ExercisePrescriptionCapabilities,
} from "./validateCompatibility";
import type { IntensityReferenceType, IntensityType, PrescriptionLaterality, TempoType } from "./types";
import type { ExerciseRole } from "./types";
import { getTrainingMethodContract, type TrainingMethodId } from "./contracts";
import type { PrescribeExerciseInput } from "./prescribeExercise";
import type {
  NumericalPrescriptionProfileId,
  RangeContext,
} from "./prescriptionKnowledge";
import type { IntensityReference } from "./types";
import type { ExerciseDoseConstraints } from "./resolveVolume";
import type { ExerciseIntensityConstraints } from "./resolveIntensity";
import type { ExerciseRestConstraints } from "./resolveRest";

// -----------------------------------------------------------------------------
// Source-rule identifiers (mirrors the `SOURCE_*` convention already used in
// `contracts.ts` / `prescriptionKnowledge.ts`)
// -----------------------------------------------------------------------------

const SOURCE_METHOD_CATALOGUE = "31_TRAINING_METHOD_CATALOGUE_V0_1";
const SOURCE_MODULE_PROFILES = "32_MODULE_PRESCRIPTION_PROFILES_V0_1";
const SOURCE_NUMERICAL_TABLES = "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1";
const SOURCE_CAPABILITIES_DOC = "33_EXERCISE_PRESCRIPTION_CAPABILITIES_V0_1";
// Cited by an entry that narrows a shared profile to ONE of its documented
// intensity readings: the narrowing rests on the exercise chapter and on
// this vocabulary chapter jointly, so both are declared.
const SOURCE_INTENSITY_MODEL = "26_INTENSITY_MODEL_V0_1";

const SOURCE_BENCH_PRESS = "50-exercises/07_BENCH_PRESS";
const SOURCE_BACK_SQUAT = "50-exercises/01_BACK_SQUAT";
const SOURCE_TRAP_BAR_DEADLIFT = "50-exercises/03_TRAP_BAR_DEADLIFT";
const SOURCE_PULL_UP = "50-exercises/10_PULL_UP";
const SOURCE_FARMER_CARRY = "50-exercises/66_CARRIES/10_FARMER_CARRY.md";
const SOURCE_PALLOF_PRESS = "50-exercises/62_CORE/11_PALLOF_PRESS.md";
const SOURCE_BOX_JUMP = "50-exercises/63_PLYOMETRICS/10_BOX_JUMP.md";

// -----------------------------------------------------------------------------
// Registry entry shape
// -----------------------------------------------------------------------------

/**
 * Every field an `ExercisePrescriptionSource` needs, minus the
 * session/athlete-specific facts supplied by `PrescriptionExecutionContext`
 * at construction time (athlete references, available equipment, range
 * context, load rounding).
 */
export interface ExercisePrescriptionRegistryEntry {
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  role: ExerciseRole;
  explicitMethodId: TrainingMethodId;
  capabilities: ExercisePrescriptionCapabilities;
  supportedIntensityTypes: readonly IntensityType[];
  preferredIntensityType: IntensityType | null;
  supportedTempoTypes: readonly TempoType[];
  preferredTempoType: TempoType | null;
  instructionDefinitions: readonly InstructionDefinition[];
  stopConditionDefinitions: readonly StopConditionDefinition[];
  /**
   * Documented, exercise-specific narrowing of the shared numerical
   * profile's volume range (see `ExerciseDoseConstraints` in
   * `resolveVolume.ts`). This is a prescription constraint, not an
   * exercise capability — it never lives on `capabilities`. `null` for
   * every exercise whose documented range matches its module/method/role
   * profile exactly.
   */
  exerciseDoseConstraints: ExerciseDoseConstraints | null;
  /**
   * Documented, exercise-specific narrowing of the shared numerical
   * profile's intensity rules (see `ExerciseIntensityConstraints` in
   * `resolveIntensity.ts`). Not an exercise capability — `null` for every
   * exercise whose documented intensity bounds match its module/method/role
   * profile exactly.
   */
  exerciseIntensityConstraints: ExerciseIntensityConstraints | null;
  /**
   * Documented, exercise-specific narrowing of the shared numerical
   * profile's rest rule (see `ExerciseRestConstraints` in
   * `resolveRest.ts`). Not an exercise capability — `null` for every
   * exercise whose documented rest bounds match its module/method/role
   * profile exactly.
   */
  exerciseRestConstraints: ExerciseRestConstraints | null;
  /**
   * Explicit numerical profile selection for this entry. Required whenever
   * several `NumericalPrescriptionProfile`s share this entry's
   * (moduleId, explicitMethodId, role) triple — enforced by
   * `registryValidators.ts` (`AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE`).
   * Absent or `null` preserves the historical unique-triple lookup exactly;
   * every entry predating this field keeps it absent.
   */
  numericalProfileId?: NumericalPrescriptionProfileId | null;
  sourceRuleIds: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Pilot exercise identifiers
// -----------------------------------------------------------------------------

export const PILOT_EXERCISE_IDS = [
  // Original 7 (kept first, unchanged — this array's growth is additive only).
  "bench_press",
  "back_squat",
  "trap_bar_deadlift",
  "pull_up",
  "farmer_carry",
  "pallof_press",
  "box_jump",
  // Force
  "front_squat",
  "romanian_deadlift",
  "overhead_press",
  "bulgarian_split_squat",
  // Power
  "push_press",
  "hang_high_pull",
  "jump_shrug",
  // Core
  "hollow_body_hold",
  "dragon_flag",
  // Carries / Grip
  "front_rack_carry",
  "sandbag_carry",
  "zercher_carry",
  "suitcase_carry",
  "overhead_carry",
  "pinch_carry",
  // Plyometrics
  "depth_jump",
  "broad_jump",
  "knee_jump",
  "lateral_bound",
  "single_leg_hop",
  "split_squat_jump",
  // Ballistics
  // "medicine_ball" and "wall" were added to equipmentCapabilities.ts,
  // unblocking all seven Ballistics chapters' equipment requirement. The
  // remaining laterality question — both med_ball_rotational_throw and
  // med_ball_scoop_toss are documented with "Unilateral Emphasis with
  // Bilateral Support", which has no direct ExerciseLaterality member —
  // was resolved by an explicit CAS business decision: represent both as
  // "unilateral" with volumeInterpretations ["repetitions_per_side"],
  // matching their own documented "repetitions per side" prescription and
  // the identical precedent already used by med_ball_shot_put_throw. See
  // the laterality decision report. Each entry below that represents a
  // single documented variant out of several ("Wall or Partner", "Open
  // Space or Wall", "Standing Rotational Scoop Toss" vs. "Forward Scoop
  // Toss" vs. "Lateral Scoop Toss") says so explicitly in its own comment.
  "med_ball_slam",
  "med_ball_chest_pass",
  "med_ball_overhead_throw",
  "med_ball_rotational_throw",
  "med_ball_scoop_toss",
  "med_ball_shot_put_throw",
  "med_ball_reverse_throw",
  // Robustness
  // Shared profile: robustness_accessory_straight_sets_v0_1 (moduleId
  // robustness, methodId straight_sets_repetitions, exerciseRole
  // accessory) — a single profile narrowed per exercise via
  // exerciseDoseConstraints/exerciseIntensityConstraints, never widened
  // and never duplicated for the same triplet. wrist_strengthening
  // represents its repetitions variant only; the isometric-hold variant
  // is out of scope.
  "tibialis_raise",
  "rotator_cuff_training",
  "wrist_strengthening",
  "soleus_raise",
  // Force/Tirage — first unblocked sub-lot (see audit): only
  // countermovement_jump requires no new business rule, no new numerical
  // profile, no new equipment vocabulary, no reclassification and no
  // documentary conflict resolution.
  "countermovement_jump",
  // Core / Robustness — unilateral isometric adductor hold, reuses
  // timed_isometric_core_robustness_v0_1 (see audit).
  "copenhagen_plank",
  // Force/Tirage — shared strength_accessory_straight_sets_v0_1 profile,
  // RPE-only (no rir, no percentage_1rm — see audit).
  "hip_thrust",
  "chin_up",
  "barbell_row",
  // Registry Lot 1 — Strength immediate
  "chest_supported_row",
  "dip",
  "landmine_press",
  "weighted_pull_up",
  "neck_training",
  "nordic_hamstring_curl",
  // Registry Lot 2 — Power immediate (sled_push deliberately NOT added —
  // see the documented blocker comment above HANG_POWER_CLEAN's own entry).
  "hang_power_clean",
  // Registry Lot 3 — Movement immediate
  "bear_crawl",
  "bridging",
  "footwork_drills",
  "shadow_boxing",
  "technical_stand_up",
  "shrimping",
  // Registry Lot 4 — Combat movement immediate
  "sprawl",
  "shot_entries",
  // Registry Lot 5 — Conditioning intervals. The first entry in this
  // registry on the `conditioning` module, the `work_rest_intervals`
  // method and the `intervals` volume structure, and therefore the first
  // to declare an explicit `numericalProfileId`: its
  // (conditioning, work_rest_intervals, conditioning) triple is shared by
  // the three Table Group 8 profiles and never resolves implicitly.
  // assault_bike_intervals and battle_ropes remain unintegrated — each
  // needs its own fiche read and its own equipment resolution, and none is
  // assumed to follow from this one.
  "rowerg_intervals",
  // Registry Lot 6 — Sprint intervals. Second entry on the ambiguous
  // interval triple, and the first to select `repeated_sprint_intervals_v0_1`.
  // Shares the triple and the method with rowerg_intervals, and nothing
  // else: different profile, different intensity vocabulary, different
  // eligibility gates, no equipment at all.
  "sprint_intervals",
  // Registry Lot 7 — Core repetition work. First entry on the `core`
  // module with the `straight_sets_repetitions` method, and the first
  // consumer of Table Group 13's own `core_robustness_straight_sets_v0_1`.
  // The four existing core entries (pallof_press, hollow_body_hold,
  // dragon_flag, copenhagen_plank) all prescribe timed holds; this is the
  // other half of the module.
  "ab_wheel",
  // Registry Lot 8 — second Core repetition entry, and the FIRST entry in
  // this whole registry to declare `laterality: "alternating"`. Its fiche
  // prescribes "5-10 repetitions per side" within a contralateral set, so
  // it is also the first real consumer of the laterality plumbing fixed
  // just before it.
  "dead_bug",
  // Registry Lot 9 — third Core repetition entry, and the first suspended
  // one. Reuses `core_robustness_straight_sets_v0_1` unchanged and adds no
  // equipment identifier: `pull_up_bar` and `safe_landing_surface` both
  // already exist and are already what the knowledge base gates it on.
  "hanging_leg_raise",
  // Registry Lot 10 — first entry on the `grip` module with the
  // `timed_isometric_sets` method, and the first consumer of Table Group
  // 4's own ISO-GRIP profile. `pinch_carry` already covers this chapter's
  // documented Walking Variation through the carry profile; this entry
  // covers its static hold.
  "plate_pinch",
  // Registry Lot 11 — first entry on the `heavy_bag` equipment capability,
  // and the first consumer of Table Group 14's own INT-POWER profile. Its
  // documented interval structure fits no Table Group 8 profile, which is
  // why that table group was written before this entry existed.
  "heavy_bag_power_intervals",
  // Registry Lot 12 — second consumer of Table Group 14's INT-POWER
  // profile, and the exercise the other half of that table group's
  // envelope was built from. Adds no profile: the doctrine already covers
  // it, and this entry only narrows.
  "battle_ropes",
  // Registry Lot 13 — third consumer of Table Group 14's INT-POWER profile,
  // and the first that was NOT one of the two records the table group was
  // written from. Its own fiche satisfies that table's documented scope
  // sentence independently, which is what a generic profile is for. Adds no
  // profile and changes no doctrine.
  "assault_bike_intervals",
  // Registry Lot 14 — first consumer of Table Group 15's own
  // GRIP-REPETITION-STRENGTH profile, and the first Grip entry counted in
  // complete repetitions rather than carried metres or held seconds.
  "towel_pull_up",
  // Registry Lot 15 — first consumers of Table Groups 16 and 17. Two
  // exercises, two units, two profiles: an ascent and a hand-over-hand pull
  // are never counted as the same thing.
  "rope_climb",
  "rope_pull",
  // Registry Lot 20 — the three partner grappling drills, and the first
  // consumers of the `partner_grappling_rounds` method, of Table Group 18's
  // profile and of the `rounds_duration` structure anywhere in the registry.
  // The first entries whose required resistance is a person rather than an
  // implement. Add no method, no profile and no doctrine: the foundation
  // already covers them, and these entries only narrow.
  "pummeling",
  "wall_wrestling",
  "grip_fighting",
  // Registry Lot 21 — first consumer of Table Group 19's Loaded Locomotion
  // Power profile, first entry to prescribe a distance and a duration at
  // once, and the first power-module entry on an interval structure. Adds no
  // profile: the doctrine commit already created it, and this entry only
  // declares its own documented bounds.
  "sled_push",
] as const;

export type PilotExerciseId = (typeof PILOT_EXERCISE_IDS)[number];

// -----------------------------------------------------------------------------
// Bench Press
// Source: 50-exercises/07_BENCH_PRESS
//   - Primary Classification: "Strength" (module: strength)
//   - Equipment Requirements: Barbell, Bench, Rack, Weight Plates (required)
//   - Coaching Cues: "Brace before unracking.", "Keep the shoulders
//     packed.", "Control the descent.", "Press explosively.", "Maintain
//     full-body tension."
//   - Common Errors: Shoulder Elevation, Excessive Elbow Flare, Bouncing
//     the Bar, Partial Range of Motion, Loss of Scapular Position, Uneven
//     Press
//   - Contraindications: Acute Shoulder Injury, Acute Pectoral Injury,
//     Pain During Horizontal Pressing
//   - Performance Indicators: "1RM", "Estimated 1RM" (documents %1RM as a
//     valid intensity approach)
// Method: straight_sets_repetitions / strength / primary
//   (strength_primary_straight_sets_v0_1 — sets 2/3/4, reps 3/5/6, %1RM
//   80/85/90, RPE 7.5/8/9, RIR 1/2/3, tempo phase_intent)
// -----------------------------------------------------------------------------

const benchPressStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "bench_press_technical_failure",
    description:
      "Stop the set if shoulder elevation, excessive elbow flare, bouncing the bar off the chest, partial range of motion, loss of scapular position or an uneven press occurs.",
    sourceRuleIds: [SOURCE_BENCH_PRESS],
  }),
  painCondition({
    conditionId: "bench_press_pain",
    description:
      "Stop immediately if pain occurs during horizontal pressing, or in the presence of an acute shoulder or pectoral injury.",
    sourceRuleIds: [SOURCE_BENCH_PRESS],
  }),
  completionCondition({
    conditionId: "bench_press_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const benchPressInstructions: InstructionDefinition[] = [
  makeInstruction(
    "bench_press_setup",
    "setup",
    "Set the barbell on a rack with a bench, weight plates loaded, and safety arms or a spotter in place before unracking.",
    "high",
    true,
    SOURCE_BENCH_PRESS,
  ),
  makeInstruction(
    "bench_press_execution",
    "execution",
    "Brace before unracking, keep the shoulders packed, control the descent, press explosively and maintain full-body tension.",
    "high",
    true,
    SOURCE_BENCH_PRESS,
  ),
];

const benchPressEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "bench_press",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "bench_press",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    preferredIntensityTypes: ["percentage_1rm"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "bench", "rack", "plates"],
    requiredAthleteReferenceTypes: ["one_rep_max"],
    requiredInstructionIds: ["bench_press_setup", "bench_press_execution"],
    requiredStopConditionIds: ["bench_press_technical_failure", "bench_press_pain", "bench_press_completion"],
    durationEstimationProfileId: "duration_profile_bench_press",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_BENCH_PRESS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
  preferredIntensityType: "percentage_1rm",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: benchPressInstructions,
  stopConditionDefinitions: benchPressStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_BENCH_PRESS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Back Squat
// Source: 50-exercises/01_BACK_SQUAT
//   - Primary Classification: "Strength"
//   - Equipment Requirements: Barbell, Rack, Weight Plates (required)
//   - Coaching Cues: "Brace before descending.", "Push the floor away.",
//     "Keep the chest proud.", "Track knees over toes.", "Maintain foot
//     pressure.", "Drive explosively upward."
//   - Common Errors: Lumbar Flexion, Knee Valgus, Heel Lift, Insufficient
//     Depth, Forward Collapse, Loss of Bracing, Uneven Weight Distribution
//   - Contraindications: Acute Knee Injury, Acute Hip Injury, Acute
//     Lumbar Injury, Poor Bracing Ability, Pain During Squatting
// Method: straight_sets_repetitions / strength / primary
// -----------------------------------------------------------------------------

const backSquatStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "back_squat_technical_failure",
    description:
      "Stop the set if lumbar flexion, knee valgus, heel lift, insufficient depth, forward collapse, loss of bracing or uneven weight distribution occurs.",
    sourceRuleIds: [SOURCE_BACK_SQUAT],
  }),
  painCondition({
    conditionId: "back_squat_pain",
    description:
      "Stop immediately if pain occurs during squatting, or in the presence of an acute knee, hip or lumbar injury, or an inability to brace.",
    sourceRuleIds: [SOURCE_BACK_SQUAT],
  }),
  completionCondition({
    conditionId: "back_squat_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const backSquatInstructions: InstructionDefinition[] = [
  makeInstruction(
    "back_squat_setup",
    "setup",
    "Set up the barbell on a rack with weight plates loaded; a belt or knee sleeves may be used if available.",
    "high",
    true,
    SOURCE_BACK_SQUAT,
  ),
  makeInstruction(
    "back_squat_execution",
    "execution",
    "Brace before descending, push the floor away, keep the chest proud, track the knees over the toes, maintain foot pressure and drive explosively upward.",
    "high",
    true,
    SOURCE_BACK_SQUAT,
  ),
];

const backSquatEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "back_squat",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "back_squat",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    preferredIntensityTypes: ["percentage_1rm"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "rack", "plates"],
    requiredAthleteReferenceTypes: ["one_rep_max"],
    requiredInstructionIds: ["back_squat_setup", "back_squat_execution"],
    requiredStopConditionIds: ["back_squat_technical_failure", "back_squat_pain", "back_squat_completion"],
    durationEstimationProfileId: "duration_profile_back_squat",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_BACK_SQUAT, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
  preferredIntensityType: "percentage_1rm",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: backSquatInstructions,
  stopConditionDefinitions: backSquatStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_BACK_SQUAT, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Trap Bar Deadlift
// ("Deadlift" as literally proposed does not exist in 50-exercises/ — only
// Trap Bar Deadlift and Romanian Deadlift do. Trap Bar Deadlift is used as
// the closest real, documented match; see the final report for this
// substitution.)
// Source: 50-exercises/03_TRAP_BAR_DEADLIFT
//   - Primary Classification: "Strength"
//   - Equipment Requirements: Trap Bar, Weight Plates (required)
//   - Coaching Cues: "Brace first.", "Push the floor away.", "Maintain a
//     neutral spine.", "Keep the chest tall.", "Drive through the hips.",
//     "Finish with full extension."
//   - Common Errors: Lumbar Flexion, Early Hip Rise, Rounded Shoulders,
//     Incomplete Lockout, Loss of Bracing, Jerking the Weight
//   - Contraindications: Acute Lumbar Injury, Acute Hip Injury, Pain
//     During Pulling, Insufficient Hip Mobility
// Method: straight_sets_repetitions / strength / primary
// -----------------------------------------------------------------------------

const trapBarDeadliftStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "trap_bar_deadlift_technical_failure",
    description:
      "Stop the set if lumbar flexion, early hip rise, rounded shoulders, incomplete lockout, loss of bracing or jerking the weight occurs.",
    sourceRuleIds: [SOURCE_TRAP_BAR_DEADLIFT],
  }),
  painCondition({
    conditionId: "trap_bar_deadlift_pain",
    description:
      "Stop immediately if pain occurs during pulling, or in the presence of an acute lumbar or hip injury, or insufficient hip mobility.",
    sourceRuleIds: [SOURCE_TRAP_BAR_DEADLIFT],
  }),
  completionCondition({
    conditionId: "trap_bar_deadlift_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const trapBarDeadliftInstructions: InstructionDefinition[] = [
  makeInstruction(
    "trap_bar_deadlift_setup",
    "setup",
    "Set up the trap bar with weight plates loaded; lifting straps, a belt or blocks may be used if available.",
    "high",
    true,
    SOURCE_TRAP_BAR_DEADLIFT,
  ),
  makeInstruction(
    "trap_bar_deadlift_execution",
    "execution",
    "Brace first, push the floor away, maintain a neutral spine, keep the chest tall, drive through the hips and finish with full extension.",
    "high",
    true,
    SOURCE_TRAP_BAR_DEADLIFT,
  ),
];

const trapBarDeadliftEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "trap_bar_deadlift",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "trap_bar_deadlift",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    preferredIntensityTypes: ["percentage_1rm"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["trap_bar", "plates"],
    requiredAthleteReferenceTypes: ["one_rep_max"],
    requiredInstructionIds: ["trap_bar_deadlift_setup", "trap_bar_deadlift_execution"],
    requiredStopConditionIds: [
      "trap_bar_deadlift_technical_failure",
      "trap_bar_deadlift_pain",
      "trap_bar_deadlift_completion",
    ],
    durationEstimationProfileId: "duration_profile_trap_bar_deadlift",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_TRAP_BAR_DEADLIFT, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
  preferredIntensityType: "percentage_1rm",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: trapBarDeadliftInstructions,
  stopConditionDefinitions: trapBarDeadliftStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_TRAP_BAR_DEADLIFT, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Pull-Up
// Source: 50-exercises/10_PULL_UP
//   - Primary Classification: "Strength"
//   - Movement Context: "Bilateral / Suspended / Closed Chain / Bodyweight"
//   - Equipment Requirements: Pull-Up Bar (required)
//   - Coaching Cues: "Initiate with the scapula.", "Brace the trunk.",
//     "Pull the elbows toward the ribs.", "Reach full range of motion.",
//     "Control the descent."
//   - Common Errors: Partial Range of Motion, Shoulder Shrugging,
//     Swinging, Forward Head Position, Loss of Scapular Control
//   - Contraindications: Acute Shoulder Injury, Acute Elbow Injury, Acute
//     Wrist Injury, Pain During Vertical Pulling
// Method: straight_sets_repetitions / strength / primary
// No `percentage_1rm` — bodyweight pulling is not documented as
// 1RM-loaded here; only RPE/RIR are used, so no athlete reference is
// required (see task point 6: "une prescription RPE/RIR ne doit pas
// inventer de charge absolue").
// -----------------------------------------------------------------------------

const pullUpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "pull_up_technical_failure",
    description:
      "Stop the set if partial range of motion, shoulder shrugging, swinging, forward head position or loss of scapular control occurs.",
    sourceRuleIds: [SOURCE_PULL_UP],
  }),
  painCondition({
    conditionId: "pull_up_pain",
    description:
      "Stop immediately if pain occurs during vertical pulling, or in the presence of an acute shoulder, elbow or wrist injury.",
    sourceRuleIds: [SOURCE_PULL_UP],
  }),
  completionCondition({
    conditionId: "pull_up_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const pullUpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "pull_up_setup",
    "setup",
    "Use a pull-up bar; resistance bands or gymnastic rings may be used if available.",
    "medium",
    true,
    SOURCE_PULL_UP,
  ),
  makeInstruction(
    "pull_up_execution",
    "execution",
    "Initiate with the scapula, brace the trunk, pull the elbows toward the ribs, reach full range of motion and control the descent.",
    "high",
    true,
    SOURCE_PULL_UP,
  ),
];

const pullUpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "pull_up",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "pull_up",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe", "rir"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["pull_up_bar"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["pull_up_setup", "pull_up_execution"],
    requiredStopConditionIds: ["pull_up_technical_failure", "pull_up_pain", "pull_up_completion"],
    durationEstimationProfileId: "duration_profile_pull_up",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_PULL_UP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "rir"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: pullUpInstructions,
  stopConditionDefinitions: pullUpStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_PULL_UP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Farmer Carry
// Source: 50-exercises/66_CARRIES/10_FARMER_CARRY.md
//   - Exercise Identity: "Unilateral or Bilateral: Bilateral"
//   - Primary Classification: "Bilateral Loaded Carry"
//   - Equipment: "Dumbbells, Kettlebells, Farmer Handles, Trap Bar or
//     Similar Implements"
//   - Coaching Priorities: "Establish safe implement pickup.", "Center
//     the grip.", "Brace before walking.", "Maintain stacked posture.",
//     "Keep the shoulders stable.", "Use controlled steps.", "Keep the
//     loads close.", "Breathe without losing brace.", "Stop before grip
//     failure.", "Set the loads down safely."
//   - Ineligibility Criteria: "impaired balance", "unsafe gait"
//   - Common Errors > "Continuing After Grip Failure Begins": "terminate
//     the set at the first clear loss of grip security"
//   - Safety Rules: "Terminate immediately if sharp pain, numbness or
//     sudden weakness occurs."
// Method: distance_carry_sets / grip / primary
//   (distance_carry_strength_grip_v0_1 — sets 2/3/4, distance 15/25/40 m,
//   RPE 7/8/9, no tempo)
// A second, contradictory Farmer Carry chapter exists at
// `50-exercises/62_CORE/16_FARMER_CARRY.md` (Primary Adaptation:
// "Robustness" vs. this file's "Bilateral Loaded Locomotor Strength") —
// flagged in the final report, not used here.
// -----------------------------------------------------------------------------

const farmerCarryStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "farmer_carry_technical_failure",
    description:
      "Stop the set if grip security is lost, posture collapses, the walking path cannot be maintained, or an implement is dropped unexpectedly.",
    sourceRuleIds: [SOURCE_FARMER_CARRY],
  }),
  balanceLossCondition({
    conditionId: "farmer_carry_balance_loss",
    description: "Stop the set if gait becomes unsafe or balance is impaired during the carry.",
    sourceRuleIds: [SOURCE_FARMER_CARRY],
  }),
  equipmentFailureCondition({
    conditionId: "farmer_carry_equipment_failure",
    description: "Terminate the set at the first clear loss of grip security or if an implement is dropped.",
    sourceRuleIds: [SOURCE_FARMER_CARRY],
  }),
  painCondition({
    conditionId: "farmer_carry_pain",
    description: "Terminate immediately if sharp pain, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_FARMER_CARRY],
  }),
  completionCondition({
    conditionId: "farmer_carry_completion",
    description: "Stop once the prescribed sets and distance are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const farmerCarryInstructions: InstructionDefinition[] = [
  makeInstruction(
    "farmer_carry_setup",
    "setup",
    "Establish safe implement pickup and center the grip before walking.",
    "high",
    true,
    SOURCE_FARMER_CARRY,
  ),
  makeInstruction(
    "farmer_carry_execution",
    "execution",
    "Brace before walking, maintain stacked posture, keep the shoulders stable, use controlled steps, keep the loads close, and breathe without losing brace.",
    "high",
    true,
    SOURCE_FARMER_CARRY,
  ),
];

const farmerCarryEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "farmer_carry",
  moduleId: "grip",
  role: "primary",
  explicitMethodId: "distance_carry_sets",
  capabilities: {
    exerciseId: "farmer_carry",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["distance_carry_sets"],
    supportedVolumeStructures: ["sets_distance"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["dumbbell", "kettlebell"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_distance"],
    capabilityTags: ["distance_measurement", "external_load", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["loaded_carry_implement"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["farmer_carry_setup", "farmer_carry_execution"],
    requiredStopConditionIds: [
      "farmer_carry_technical_failure",
      "farmer_carry_balance_loss",
      "farmer_carry_equipment_failure",
      "farmer_carry_pain",
      "farmer_carry_completion",
    ],
    durationEstimationProfileId: "duration_profile_farmer_carry",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_FARMER_CARRY, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: farmerCarryInstructions,
  stopConditionDefinitions: farmerCarryStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_FARMER_CARRY, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Pallof Press
// Source: 50-exercises/62_CORE/11_PALLOF_PRESS.md
//   - Primary Movement Pattern: "Anti-Rotation"; Primary Adaptation
//     Domain: "Movement"; Secondary Adaptation Domains: "Robustness,
//     Strength"
//   - Equipment Requirements: "Cable Machine" or "Resistance Band" (one
//     of)
//   - Standard Setup / Standard Execution: cable/band at chest height,
//     brace the trunk, press the hands directly forward, prevent
//     rotation, return under control
//   - Coaching Cues: "Stay square.", "Do not let the cable turn you.",
//     "Press straight out.", "Keep equal pressure through both feet.",
//     "Make the trunk quiet.", "Breathe without losing position."
//   - Stopping Rules: "the trunk rotates and cannot be corrected
//     immediately; the pelvis shifts or turns substantially; the athlete
//     leans to escape the load; the stance changes unintentionally; the
//     arms cannot reach the prescribed position; the shoulders elevate
//     repeatedly; the athlete loses balance; breathing becomes
//     uncontrolled; pain appears; or repetitions become materially
//     different between sides."
// Method: timed_isometric_sets / core / robustness
//   (the only documented core/timed_isometric_sets numerical profile —
//   timed_isometric_core_robustness_v0_1 — uses role "robustness", not
//   "primary"; this role is used exactly because it is the one the
//   numerical profile actually documents, never because it "feels
//   right" for the exercise. "Robustness" is also explicitly listed as a
//   secondary adaptation domain for this exercise in its own chapter.)
// -----------------------------------------------------------------------------

const pallofPressStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "pallof_press_technical_failure",
    description:
      "The set must stop when the trunk rotates and cannot be corrected immediately, the pelvis shifts or turns substantially, the athlete leans to escape the load, the stance changes unintentionally, the arms cannot reach the prescribed position, the shoulders elevate repeatedly, or repetitions become materially different between sides.",
    sourceRuleIds: [SOURCE_PALLOF_PRESS],
  }),
  painCondition({
    conditionId: "pallof_press_pain",
    description: "The set must stop when pain appears.",
    sourceRuleIds: [SOURCE_PALLOF_PRESS],
  }),
  completionCondition({
    conditionId: "pallof_press_completion",
    description:
      "The set must not continue merely to reach the planned repetition count; stop once the prescribed work is completed on both sides.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const pallofPressInstructions: InstructionDefinition[] = [
  makeInstruction(
    "pallof_press_setup",
    "setup",
    "Attach the cable or band at approximately chest height, stand perpendicular to the anchor, and hold the handle with both hands close to the sternum.",
    "high",
    true,
    SOURCE_PALLOF_PRESS,
  ),
  makeInstruction(
    "pallof_press_execution",
    "execution",
    "Stay square, do not let the cable turn you, press straight out, keep equal pressure through both feet, make the trunk quiet, and breathe without losing position.",
    "high",
    true,
    SOURCE_PALLOF_PRESS,
  ),
];

const pallofPressEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "pallof_press",
  moduleId: "core",
  role: "robustness",
  explicitMethodId: "timed_isometric_sets",
  capabilities: {
    exerciseId: "pallof_press",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["timed_isometric_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["cable", "resistance_band"],
    supportedTempoTypes: ["isometric_hold"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["cable_or_band_resistance"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["pallof_press_setup", "pallof_press_execution"],
    requiredStopConditionIds: ["pallof_press_technical_failure", "pallof_press_pain", "pallof_press_completion"],
    durationEstimationProfileId: "duration_profile_pallof_press",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_PALLOF_PRESS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["isometric_hold"],
  preferredTempoType: null,
  instructionDefinitions: pallofPressInstructions,
  stopConditionDefinitions: pallofPressStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_PALLOF_PRESS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Box Jump
// Source: 50-exercises/63_PLYOMETRICS/10_BOX_JUMP.md
//   - Primary Classification: "Vertical Plyometric"; Primary Adaptation:
//     "Power"
//   - Equipment Requirements: "Stable plyometric box" (or a stable low
//     platform alternative)
//   - Key Coaching Cues: "Jump through the box, not toward it.", "Use a
//     fast dip.", "Drive the floor away.", "Extend violently.", "Land
//     softly.", "Own the landing.", "Step down and reset."
//   - Technical Failure Criteria: "The athlete clips the front edge of
//     the box.", "The athlete lands with only part of the foot
//     supported.", "The knees collapse inward.", "The trunk collapses
//     forward on landing.", "The landing becomes loud or rigid."
//     "The athlete loses balance or steps off immediately."
//     "Take-off becomes visibly slower." "Jump height declines
//     meaningfully." "The athlete requires repeated hesitation before
//     jumping." "Pain occurs during take-off, flight or landing."
//   - Fatigue Profile: "Technical Degradation Risk: High once fatigue
//     accumulates."
// Method: power_repetition_sets / power / primary
//   (power_primary_repetition_sets_v0_1 — `requiresExerciseSpecificLoadRule:
//   true`, so only `movement_intent` can resolve intensity; %1RM is
//   documented but is not usable for a bodyweight jump and is not
//   claimed here — see task point 6)
// This is the only power_repetition_sets pilot exercise included: its
// chapter is the only one of the three power candidates (Push Press, Box
// Jump, Medicine-Ball Chest Pass) whose Technical Failure / Fatigue
// Profile content genuinely grounds all seven stop-condition categories
// the "power" module requires — see the final report for Push Press and
// Medicine-Ball Chest Pass exclusion reasoning.
// -----------------------------------------------------------------------------

const boxJumpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "box_jump_technical_failure",
    description:
      "Stop or regress the set if the athlete clips the front edge of the box, lands with only part of the foot supported, the knees collapse inward, or the trunk collapses forward on landing.",
    sourceRuleIds: [SOURCE_BOX_JUMP],
  }),
  velocityLossCondition({
    conditionId: "box_jump_velocity_loss",
    description: "Stop the set once take-off becomes visibly slower.",
    sourceRuleIds: [SOURCE_BOX_JUMP],
  }),
  fatigueLimitCondition({
    conditionId: "box_jump_fatigue_limit",
    description:
      "Stop the exercise once jump height declines meaningfully or the athlete requires repeated hesitation before jumping — technical degradation risk is high once fatigue accumulates.",
    sourceRuleIds: [SOURCE_BOX_JUMP],
  }),
  impactLimitCondition({
    conditionId: "box_jump_impact_limit",
    description: "Stop the set if the landing becomes loud or rigid.",
    sourceRuleIds: [SOURCE_BOX_JUMP],
  }),
  balanceLossCondition({
    conditionId: "box_jump_balance_loss",
    description: "Stop the set if the athlete loses balance or steps off the box immediately after landing.",
    sourceRuleIds: [SOURCE_BOX_JUMP],
  }),
  painCondition({
    conditionId: "box_jump_pain",
    description: "Stop immediately if pain occurs during take-off, flight or landing.",
    sourceRuleIds: [SOURCE_BOX_JUMP],
  }),
  completionCondition({
    conditionId: "box_jump_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const boxJumpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "box_jump_setup",
    "setup",
    "Use a stable plyometric box (or a stable low platform alternative) with a non-slip surface, wide enough for a bilateral landing and free from sharp edges or obstacles.",
    "high",
    true,
    SOURCE_BOX_JUMP,
  ),
  makeInstruction(
    "box_jump_execution",
    "execution",
    "Jump through the box rather than toward it, use a fast dip, drive the floor away, extend violently, land softly, own the landing, then step down and reset.",
    "high",
    true,
    SOURCE_BOX_JUMP,
  ),
];

const boxJumpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "box_jump",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "box_jump",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["plyometric_box", "safe_landing_surface"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["box_jump_setup", "box_jump_execution"],
    requiredStopConditionIds: [
      "box_jump_technical_failure",
      "box_jump_velocity_loss",
      "box_jump_fatigue_limit",
      "box_jump_impact_limit",
      "box_jump_balance_loss",
      "box_jump_pain",
      "box_jump_completion",
    ],
    durationEstimationProfileId: "duration_profile_box_jump",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_BOX_JUMP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: boxJumpInstructions,
  stopConditionDefinitions: boxJumpStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_BOX_JUMP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// =============================================================================
// Family extension — Force, Power, Core, Carries/Grip, Plyometrics, Ballistics
// =============================================================================

// -----------------------------------------------------------------------------
// Front Squat
// Source: 50-exercises/02_FRONT_SQUAT
//   - Primary Classification: "Strength"
//   - Equipment Requirements: Barbell, Rack, Weight Plates (required)
//   - Coaching Cues: "Keep the elbows high.", "Brace before descending.",
//     "Stay tall.", "Drive through the mid-foot.", "Push vertically.",
//     "Finish with full extension."
//   - Common Errors: Dropping Elbows, Thoracic Flexion, Forward Collapse,
//     Heel Lift, Knee Valgus, Loss of Bracing
//   - Contraindications: Acute Wrist Injury, Acute Shoulder Injury,
//     Thoracic Mobility Restrictions, Pain During Squatting
// Method: straight_sets_repetitions / strength / primary
// -----------------------------------------------------------------------------

const SOURCE_FRONT_SQUAT = "50-exercises/02_FRONT_SQUAT";

const frontSquatStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "front_squat_technical_failure",
    description:
      "Stop the set if dropping elbows, thoracic flexion, forward collapse, heel lift, knee valgus or loss of bracing occurs.",
    sourceRuleIds: [SOURCE_FRONT_SQUAT],
  }),
  painCondition({
    conditionId: "front_squat_pain",
    description:
      "Stop immediately if pain occurs during squatting, or in the presence of an acute wrist or shoulder injury, or a thoracic mobility restriction.",
    sourceRuleIds: [SOURCE_FRONT_SQUAT],
  }),
  completionCondition({
    conditionId: "front_squat_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const frontSquatInstructions: InstructionDefinition[] = [
  makeInstruction(
    "front_squat_setup",
    "setup",
    "Set up the barbell on a rack with weight plates loaded; weightlifting shoes, safety arms or lifting straps may be used if available.",
    "high",
    true,
    SOURCE_FRONT_SQUAT,
  ),
  makeInstruction(
    "front_squat_execution",
    "execution",
    "Keep the elbows high, brace before descending, stay tall, drive through the mid-foot, push vertically and finish with full extension.",
    "high",
    true,
    SOURCE_FRONT_SQUAT,
  ),
];

const frontSquatEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "front_squat",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "front_squat",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    preferredIntensityTypes: ["percentage_1rm"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "rack", "plates"],
    requiredAthleteReferenceTypes: ["one_rep_max"],
    requiredInstructionIds: ["front_squat_setup", "front_squat_execution"],
    requiredStopConditionIds: ["front_squat_technical_failure", "front_squat_pain", "front_squat_completion"],
    durationEstimationProfileId: "duration_profile_front_squat",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_FRONT_SQUAT, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
  preferredIntensityType: "percentage_1rm",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: frontSquatInstructions,
  stopConditionDefinitions: frontSquatStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_FRONT_SQUAT, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Romanian Deadlift
// Source: 50-exercises/04_ROMANIAN_DEADLIFT
//   - Primary Classification: "Strength"
//   - Equipment Requirements: Barbell, Weight Plates (required)
//   - Coaching Cues: "Push the hips back.", "Maintain a neutral spine.",
//     "Keep the bar close.", "Feel tension in the hamstrings.", "Brace
//     throughout the movement.", "Finish by driving the hips forward."
//   - Common Errors: Lumbar Flexion, Excessive Knee Bend, Loss of Lat
//     Tension, Bar Moving Away From the Body, Hyperextension at Lockout,
//     Loss of Balance
//   - Contraindications: Acute Hamstring Injury, Acute Lumbar Injury, Hip
//     Pain During Hinging, Poor Hinge Mechanics
// Method: straight_sets_repetitions / strength / primary
// -----------------------------------------------------------------------------

const SOURCE_ROMANIAN_DEADLIFT = "50-exercises/04_ROMANIAN_DEADLIFT";

const romanianDeadliftStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "romanian_deadlift_technical_failure",
    description:
      "Stop the set if lumbar flexion, excessive knee bend, loss of lat tension, the bar moving away from the body, hyperextension at lockout or loss of balance occurs.",
    sourceRuleIds: [SOURCE_ROMANIAN_DEADLIFT],
  }),
  painCondition({
    conditionId: "romanian_deadlift_pain",
    description:
      "Stop immediately if hip pain occurs during hinging, or in the presence of an acute hamstring or lumbar injury, or poor hinge mechanics.",
    sourceRuleIds: [SOURCE_ROMANIAN_DEADLIFT],
  }),
  completionCondition({
    conditionId: "romanian_deadlift_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const romanianDeadliftInstructions: InstructionDefinition[] = [
  makeInstruction(
    "romanian_deadlift_setup",
    "setup",
    "Set up the barbell with weight plates loaded; dumbbells, kettlebells, straps or a belt may be used if available.",
    "high",
    true,
    SOURCE_ROMANIAN_DEADLIFT,
  ),
  makeInstruction(
    "romanian_deadlift_execution",
    "execution",
    "Push the hips back, maintain a neutral spine, keep the bar close, feel tension in the hamstrings, brace throughout the movement and finish by driving the hips forward.",
    "high",
    true,
    SOURCE_ROMANIAN_DEADLIFT,
  ),
];

const romanianDeadliftEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "romanian_deadlift",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "romanian_deadlift",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    preferredIntensityTypes: ["percentage_1rm"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "plates"],
    requiredAthleteReferenceTypes: ["one_rep_max"],
    requiredInstructionIds: ["romanian_deadlift_setup", "romanian_deadlift_execution"],
    requiredStopConditionIds: [
      "romanian_deadlift_technical_failure",
      "romanian_deadlift_pain",
      "romanian_deadlift_completion",
    ],
    durationEstimationProfileId: "duration_profile_romanian_deadlift",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_ROMANIAN_DEADLIFT, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
  preferredIntensityType: "percentage_1rm",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: romanianDeadliftInstructions,
  stopConditionDefinitions: romanianDeadliftStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_ROMANIAN_DEADLIFT,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Overhead Press
// Source: 50-exercises/08_OVERHEAD_PRESS
//   - Primary Classification: "Strength"
//   - Equipment Requirements: Barbell, Weight Plates, Rack (required)
//   - Coaching Cues: "Brace first.", "Squeeze the glutes.", "Press
//     vertically.", "Keep the ribs down.", "Finish overhead.", "Control
//     the descent."
//   - Common Errors: Lumbar Hyperextension, Forward Bar Path, Incomplete
//     Lockout, Poor Scapular Control, Loss of Balance, Pressing Around
//     the Head
//   - Contraindications: Acute Shoulder Injury, Acute Cervical Injury,
//     Pain During Overhead Pressing, Limited Shoulder Mobility
// Method: straight_sets_repetitions / strength / primary
// -----------------------------------------------------------------------------

const SOURCE_OVERHEAD_PRESS = "50-exercises/08_OVERHEAD_PRESS";

const overheadPressStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "overhead_press_technical_failure",
    description:
      "Stop the set if lumbar hyperextension, a forward bar path, incomplete lockout, poor scapular control, loss of balance or pressing around the head occurs.",
    sourceRuleIds: [SOURCE_OVERHEAD_PRESS],
  }),
  painCondition({
    conditionId: "overhead_press_pain",
    description:
      "Stop immediately if pain occurs during overhead pressing, or in the presence of an acute shoulder or cervical injury, or limited shoulder mobility.",
    sourceRuleIds: [SOURCE_OVERHEAD_PRESS],
  }),
  completionCondition({
    conditionId: "overhead_press_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const overheadPressInstructions: InstructionDefinition[] = [
  makeInstruction(
    "overhead_press_setup",
    "setup",
    "Set up the barbell on a rack with weight plates loaded; dumbbells, kettlebells or a log bar may be used if available.",
    "high",
    true,
    SOURCE_OVERHEAD_PRESS,
  ),
  makeInstruction(
    "overhead_press_execution",
    "execution",
    "Brace first, squeeze the glutes, press vertically, keep the ribs down, finish overhead and control the descent.",
    "high",
    true,
    SOURCE_OVERHEAD_PRESS,
  ),
];

const overheadPressEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "overhead_press",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "overhead_press",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    preferredIntensityTypes: ["percentage_1rm"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "plates", "rack"],
    requiredAthleteReferenceTypes: ["one_rep_max"],
    requiredInstructionIds: ["overhead_press_setup", "overhead_press_execution"],
    requiredStopConditionIds: [
      "overhead_press_technical_failure",
      "overhead_press_pain",
      "overhead_press_completion",
    ],
    durationEstimationProfileId: "duration_profile_overhead_press",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_OVERHEAD_PRESS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
  preferredIntensityType: "percentage_1rm",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: overheadPressInstructions,
  stopConditionDefinitions: overheadPressStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_OVERHEAD_PRESS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Bulgarian Split Squat
// Source: 50-exercises/06_BULGARIAN_SPLIT_SQUAT
//   - Primary Classification: "Strength"; Purpose: "unilateral
//     lower-body compound exercise"
//   - Equipment Requirements: Bench (required); Bodyweight / Dumbbells /
//     Kettlebells / Barbell / Safety Rack / Sandbag (optional) — bench is
//     the only strictly required item, so this entry supports bodyweight.
//   - Coaching Cues: "Brace before descending.", "Keep the front foot
//     stable.", "Maintain an upright torso.", "Drive through the whole
//     foot.", "Control the descent.", "Finish with full hip extension."
//   - Common Errors: Loss of Balance, Forward Knee Collapse, Excessive
//     Forward Lean, Incomplete Depth, Pushing from the Rear Leg, Pelvic
//     Rotation
//   - Contraindications: Acute Knee Injury, Acute Hip Injury, Severe
//     Balance Deficits, Pain During Single-Leg Loading
// Method: straight_sets_repetitions / strength / primary
// Unilateral: RPE/RIR only (no load claimed), matching the same
// no-invented-charge approach used for Pull-Up.
// -----------------------------------------------------------------------------

const SOURCE_BULGARIAN_SPLIT_SQUAT = "50-exercises/06_BULGARIAN_SPLIT_SQUAT";

const bulgarianSplitSquatStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "bulgarian_split_squat_technical_failure",
    description:
      "Stop the set if loss of balance, forward knee collapse, excessive forward lean, incomplete depth, pushing from the rear leg or pelvic rotation occurs.",
    sourceRuleIds: [SOURCE_BULGARIAN_SPLIT_SQUAT],
  }),
  painCondition({
    conditionId: "bulgarian_split_squat_pain",
    description:
      "Stop immediately if pain occurs during single-leg loading, or in the presence of an acute knee or hip injury, or severe balance deficits.",
    sourceRuleIds: [SOURCE_BULGARIAN_SPLIT_SQUAT],
  }),
  completionCondition({
    conditionId: "bulgarian_split_squat_completion",
    description: "Stop once the prescribed sets and repetitions per side are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const bulgarianSplitSquatInstructions: InstructionDefinition[] = [
  makeInstruction(
    "bulgarian_split_squat_setup",
    "setup",
    "Set up a bench for the rear foot; bodyweight, dumbbells, kettlebells, a barbell, a safety rack or a sandbag may be used if available.",
    "high",
    true,
    SOURCE_BULGARIAN_SPLIT_SQUAT,
  ),
  makeInstruction(
    "bulgarian_split_squat_execution",
    "execution",
    "Brace before descending, keep the front foot stable, maintain an upright torso, drive through the whole foot, control the descent and finish with full hip extension.",
    "high",
    true,
    SOURCE_BULGARIAN_SPLIT_SQUAT,
  ),
];

const bulgarianSplitSquatEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "bulgarian_split_squat",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "bulgarian_split_squat",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe", "rir"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["bodyweight", "added_external_load"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "unilateral",
    volumeInterpretations: ["repetitions_per_side"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["bench"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["bulgarian_split_squat_setup", "bulgarian_split_squat_execution"],
    requiredStopConditionIds: [
      "bulgarian_split_squat_technical_failure",
      "bulgarian_split_squat_pain",
      "bulgarian_split_squat_completion",
    ],
    durationEstimationProfileId: "duration_profile_bulgarian_split_squat",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_BULGARIAN_SPLIT_SQUAT, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "rir"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: bulgarianSplitSquatInstructions,
  stopConditionDefinitions: bulgarianSplitSquatStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_BULGARIAN_SPLIT_SQUAT,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Push Press (64_POWER version — richer schema than the root-level
// 15_PUSH_PRESS file; see the pilot registry's report for why this
// version, not the older one, is authoritative)
// Source: 50-exercises/64_POWER/10_PUSH_PRESS.md
//   - Primary Classification: "Loaded Power"; Primary Adaptation: "Power"
//   - Equipment Requirements (Primary): Barbell, Weight plates, Rack
//   - Technical Failure Criteria (verbatim, abridged to the distinct
//     failure modes actually used below): "the dip becomes excessively
//     deep... the bar rolls away from the shoulders... the bar is
//     dropped uncontrollably onto the shoulders... The set should be
//     terminated when technical errors repeat or bar speed decreases
//     materially."
//   - Velocity Profile: "The set should end when: bar speed declines
//     meaningfully, the dip becomes slower or deeper, the athlete begins
//     grinding the press, or overhead stabilization deteriorates."
//   - CAS Selection Logic: "CAS should deprioritize or reject the Push
//     Press when: the athlete reports relevant pain..."
//   - Root-level 50-exercises/15_PUSH_PRESS Contraindications: "Pain
//     During Overhead Pressing" (same exercise, older schema — used only
//     for this one corroborating pain fact).
// Method: power_repetition_sets / power / primary
//   (power_primary_repetition_sets_v0_1 — `requiresExerciseSpecificLoadRule:
//   true`, movement_intent used, matching Box Jump's pattern)
// -----------------------------------------------------------------------------

const SOURCE_PUSH_PRESS_POWER = "50-exercises/64_POWER/10_PUSH_PRESS.md";
const SOURCE_PUSH_PRESS_ROOT = "50-exercises/15_PUSH_PRESS";

const pushPressStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "push_press_technical_failure",
    description:
      "Stop the set if the dip becomes excessively deep, the torso tips forward, the heels rise before the drive, the knees collapse inward, leg drive and arm action occur out of sequence, or the athlete converts the movement into a slow Strict Press.",
    sourceRuleIds: [SOURCE_PUSH_PRESS_POWER],
  }),
  velocityLossCondition({
    conditionId: "push_press_velocity_loss",
    description: "Stop the set when bar speed decreases materially or declines meaningfully.",
    sourceRuleIds: [SOURCE_PUSH_PRESS_POWER],
  }),
  fatigueLimitCondition({
    conditionId: "push_press_fatigue_limit",
    description: "Stop the set when the dip becomes slower or deeper, or the athlete begins grinding the press.",
    sourceRuleIds: [SOURCE_PUSH_PRESS_POWER],
  }),
  impactLimitCondition({
    conditionId: "push_press_impact_limit",
    description: "Stop the set if the bar is dropped uncontrollably onto the shoulders.",
    sourceRuleIds: [SOURCE_PUSH_PRESS_POWER],
  }),
  balanceLossCondition({
    conditionId: "push_press_balance_loss",
    description:
      "Stop the set if the overhead position is unstable, overhead stabilization deteriorates, or the athlete cannot safely return the load.",
    sourceRuleIds: [SOURCE_PUSH_PRESS_POWER],
  }),
  painCondition({
    conditionId: "push_press_pain",
    description: "Stop if the athlete reports relevant pain, or pain occurs during overhead pressing.",
    sourceRuleIds: [SOURCE_PUSH_PRESS_POWER, SOURCE_PUSH_PRESS_ROOT],
  }),
  completionCondition({
    conditionId: "push_press_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const pushPressInstructions: InstructionDefinition[] = [
  makeInstruction(
    "push_press_setup",
    "setup",
    "Set up the barbell on a rack with weight plates loaded and collars secured.",
    "high",
    true,
    SOURCE_PUSH_PRESS_POWER,
  ),
  makeInstruction(
    "push_press_execution",
    "execution",
    "Dip straight down, stay tall, drive the floor away, move legs first then arms, brace before the dip, move the bar vertically, finish stacked overhead and accelerate every repetition.",
    "high",
    true,
    SOURCE_PUSH_PRESS_POWER,
  ),
];

const pushPressEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "push_press",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "push_press",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "plates", "rack"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["push_press_setup", "push_press_execution"],
    requiredStopConditionIds: [
      "push_press_technical_failure",
      "push_press_velocity_loss",
      "push_press_fatigue_limit",
      "push_press_impact_limit",
      "push_press_balance_loss",
      "push_press_pain",
      "push_press_completion",
    ],
    durationEstimationProfileId: "duration_profile_push_press",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_PUSH_PRESS_POWER, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: pushPressInstructions,
  stopConditionDefinitions: pushPressStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_PUSH_PRESS_POWER, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Hang High Pull
// Source: 50-exercises/64_POWER/11_HANG_HIGH_PULL.md
//   - Primary Classification: "Loaded Power"; Primary Adaptation: "Power"
//   - Equipment Requirements (Primary): Barbell, Weight plates, Secure
//     collars
//   - Technical Failure Criteria (verbatim, abridged): "the athlete
//     bends the elbows before meaningful hip and knee extension... the
//     bar collides heavily with the thighs or pelvis... bar height or
//     velocity falls substantially... or pain occurs."
//   - Velocity Profile: "CAS should terminate or reduce the set when
//     velocity loss becomes visible or measurable beyond the programmed
//     threshold."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_HANG_HIGH_PULL = "50-exercises/64_POWER/11_HANG_HIGH_PULL.md";

const hangHighPullStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "hang_high_pull_technical_failure",
    description:
      "Stop the set if the athlete bends the elbows before meaningful hip and knee extension, the movement becomes an upright row, the bar drifts substantially away from the body, hip extension is incomplete, or the athlete hyperextends the lumbar spine at the top.",
    sourceRuleIds: [SOURCE_HANG_HIGH_PULL],
  }),
  velocityLossCondition({
    conditionId: "hang_high_pull_velocity_loss",
    description:
      "Terminate or reduce the set when velocity loss becomes visible or measurable beyond the programmed threshold, or bar height or velocity falls substantially.",
    sourceRuleIds: [SOURCE_HANG_HIGH_PULL],
  }),
  fatigueLimitCondition({
    conditionId: "hang_high_pull_fatigue_limit",
    description: "Stop the set when the return to the hang position becomes uncontrolled.",
    sourceRuleIds: [SOURCE_HANG_HIGH_PULL],
  }),
  impactLimitCondition({
    conditionId: "hang_high_pull_impact_limit",
    description: "Stop the set if the bar collides heavily with the thighs or pelvis.",
    sourceRuleIds: [SOURCE_HANG_HIGH_PULL],
  }),
  balanceLossCondition({
    conditionId: "hang_high_pull_balance_loss",
    description: "Stop the set if the athlete jumps forward or backward excessively or loses neutral spinal control.",
    sourceRuleIds: [SOURCE_HANG_HIGH_PULL],
  }),
  painCondition({
    conditionId: "hang_high_pull_pain",
    description: "Stop if pain occurs.",
    sourceRuleIds: [SOURCE_HANG_HIGH_PULL],
  }),
  completionCondition({
    conditionId: "hang_high_pull_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const hangHighPullInstructions: InstructionDefinition[] = [
  makeInstruction(
    "hang_high_pull_setup",
    "setup",
    "Set up the barbell with weight plates loaded and secure collars fitted.",
    "high",
    true,
    SOURCE_HANG_HIGH_PULL,
  ),
  makeInstruction(
    "hang_high_pull_execution",
    "execution",
    "Push the floor away, stay over the bar until extension, finish tall, keep the arms long then pull, elbows high and outside, keep the bar close, and extend first, pull second.",
    "high",
    true,
    SOURCE_HANG_HIGH_PULL,
  ),
];

const hangHighPullEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "hang_high_pull",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "hang_high_pull",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "plates"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["hang_high_pull_setup", "hang_high_pull_execution"],
    requiredStopConditionIds: [
      "hang_high_pull_technical_failure",
      "hang_high_pull_velocity_loss",
      "hang_high_pull_fatigue_limit",
      "hang_high_pull_impact_limit",
      "hang_high_pull_balance_loss",
      "hang_high_pull_pain",
      "hang_high_pull_completion",
    ],
    durationEstimationProfileId: "duration_profile_hang_high_pull",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_HANG_HIGH_PULL, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: hangHighPullInstructions,
  stopConditionDefinitions: hangHighPullStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_HANG_HIGH_PULL, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Jump Shrug
// Source: 50-exercises/64_POWER/13_JUMP_SHRUG.md
//   - Primary Classification: "Loaded Power"; Primary Adaptation: "Power"
//   - Equipment Requirements (Essential): Barbell, Weight plates, Collars,
//     Suitable lifting surface
//   - Technical Failure Criteria (verbatim, abridged): "early elbow
//     flexion... the feet spread excessively during landing... the
//     landing is loud, unstable or uncontrolled... or repetition
//     velocity declines substantially."
//   - Contraindications and Restrictions: "acute lower-back pain..."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_JUMP_SHRUG = "50-exercises/64_POWER/13_JUMP_SHRUG.md";

const jumpShrugStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "jump_shrug_technical_failure",
    description:
      "Stop the set if early elbow flexion occurs, the athlete pulls primarily with the arms, hip or knee extension is incomplete, or the bar strikes the thighs aggressively.",
    sourceRuleIds: [SOURCE_JUMP_SHRUG],
  }),
  velocityLossCondition({
    conditionId: "jump_shrug_velocity_loss",
    description: "Stop the set when repetition velocity declines substantially.",
    sourceRuleIds: [SOURCE_JUMP_SHRUG],
  }),
  fatigueLimitCondition({
    conditionId: "jump_shrug_fatigue_limit",
    description: "Stop the set once jump height declines meaningfully across the set.",
    sourceRuleIds: [SOURCE_JUMP_SHRUG],
  }),
  impactLimitCondition({
    conditionId: "jump_shrug_impact_limit",
    description: "Stop the set if the landing is loud, unstable or uncontrolled, or the feet spread excessively during landing.",
    sourceRuleIds: [SOURCE_JUMP_SHRUG],
  }),
  balanceLossCondition({
    conditionId: "jump_shrug_balance_loss",
    description: "Stop the set if the athlete jumps forward or backward, or lands stiff-legged.",
    sourceRuleIds: [SOURCE_JUMP_SHRUG],
  }),
  painCondition({
    conditionId: "jump_shrug_pain",
    description: "Stop in the presence of acute lower-back pain.",
    sourceRuleIds: [SOURCE_JUMP_SHRUG],
  }),
  completionCondition({
    conditionId: "jump_shrug_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const jumpShrugInstructions: InstructionDefinition[] = [
  makeInstruction(
    "jump_shrug_setup",
    "setup",
    "Set up the barbell with weight plates loaded and collars secured on a suitable lifting surface.",
    "high",
    true,
    SOURCE_JUMP_SHRUG,
  ),
  makeInstruction(
    "jump_shrug_execution",
    "execution",
    "Push the floor away, keep the arms long, finish tall, jump straight up, keep the bar close, shrug after the legs extend and land quietly and balanced.",
    "high",
    true,
    SOURCE_JUMP_SHRUG,
  ),
];

const jumpShrugEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "jump_shrug",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "jump_shrug",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "plates"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["jump_shrug_setup", "jump_shrug_execution"],
    requiredStopConditionIds: [
      "jump_shrug_technical_failure",
      "jump_shrug_velocity_loss",
      "jump_shrug_fatigue_limit",
      "jump_shrug_impact_limit",
      "jump_shrug_balance_loss",
      "jump_shrug_pain",
      "jump_shrug_completion",
    ],
    durationEstimationProfileId: "duration_profile_jump_shrug",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_JUMP_SHRUG, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: jumpShrugInstructions,
  stopConditionDefinitions: jumpShrugStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_JUMP_SHRUG, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Hollow Body Hold
// Source: 50-exercises/62_CORE/13_HOLLOW_BODY_HOLD.md
//   - Primary Classification: "Core Strength"; Primary Adaptation:
//     "Robustness"
//   - Equipment Requirements: Floor Space (required)
//   - Key Coaching Cues: "Ribs down, pelvis quiet.", "Press the lower
//     trunk into a stable position without excessive flattening.",
//     "Reach long through the fingers and toes.", "Keep the shoulder
//     blades just off the floor.", "Make the shape smaller before the
//     back arches.", "Breathe behind the brace.", "Hold tension, not
//     discomfort."
//   - Technical Failure Criteria (verbatim): "Lumbar Extension / Rib
//     Flare / Anterior Pelvic Tilt / Loss of Abdominal Tension / Leg
//     Position Rising Unintentionally / Shoulder Blades Returning to the
//     Floor / Excessive Neck Flexion / Breath Holding Without Intent /
//     Shaking Accompanied by Positional Loss / Asymmetrical Limb
//     Position. A set ends when the hollow position can no longer be
//     maintained to the prescribed standard."
//   - Contraindications and Restrictions: "Acute Low-Back Pain Aggravated
//     by Trunk Flexion or Supine Leg Extension / Acute Hip Flexor Pain /
//     Acute Neck Pain / Acute Shoulder Pain During Overhead Positioning"
// Method: timed_isometric_sets / core / robustness
// -----------------------------------------------------------------------------

const SOURCE_HOLLOW_BODY_HOLD = "50-exercises/62_CORE/13_HOLLOW_BODY_HOLD.md";

const hollowBodyHoldStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "hollow_body_hold_technical_failure",
    description:
      "The hold ends when lumbar extension, rib flare, anterior pelvic tilt, loss of abdominal tension, the legs rising unintentionally, the shoulder blades returning to the floor or asymmetrical limb position occurs — the position can no longer be maintained to the prescribed standard.",
    sourceRuleIds: [SOURCE_HOLLOW_BODY_HOLD],
  }),
  painCondition({
    conditionId: "hollow_body_hold_pain",
    description:
      "Stop in the presence of acute low-back pain aggravated by trunk flexion, acute hip flexor pain, acute neck pain or acute shoulder pain during overhead positioning.",
    sourceRuleIds: [SOURCE_HOLLOW_BODY_HOLD],
  }),
  completionCondition({
    conditionId: "hollow_body_hold_completion",
    description: "Stop once the prescribed hold duration and sets are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const hollowBodyHoldInstructions: InstructionDefinition[] = [
  makeInstruction(
    "hollow_body_hold_setup",
    "setup",
    "Use floor space; an exercise mat, light dumbbell, light plate or resistance band may be used if available.",
    "medium",
    true,
    SOURCE_HOLLOW_BODY_HOLD,
  ),
  makeInstruction(
    "hollow_body_hold_execution",
    "execution",
    "Ribs down and pelvis quiet, press the lower trunk into a stable position without excessive flattening, reach long through the fingers and toes, keep the shoulder blades just off the floor, and breathe behind the brace.",
    "high",
    true,
    SOURCE_HOLLOW_BODY_HOLD,
  ),
];

const hollowBodyHoldEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "hollow_body_hold",
  moduleId: "core",
  role: "robustness",
  explicitMethodId: "timed_isometric_sets",
  capabilities: {
    exerciseId: "hollow_body_hold",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["timed_isometric_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["isometric_hold"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["open_space"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["hollow_body_hold_setup", "hollow_body_hold_execution"],
    requiredStopConditionIds: [
      "hollow_body_hold_technical_failure",
      "hollow_body_hold_pain",
      "hollow_body_hold_completion",
    ],
    durationEstimationProfileId: "duration_profile_hollow_body_hold",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_HOLLOW_BODY_HOLD, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["isometric_hold"],
  preferredTempoType: null,
  instructionDefinitions: hollowBodyHoldInstructions,
  stopConditionDefinitions: hollowBodyHoldStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_HOLLOW_BODY_HOLD,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Dragon Flag (isometric-hold variant — this file documents both a
// repetition-based and a duration-based "Isometric Trunk Strength"
// prescription; only the duration-based variant is registered here,
// since it is the one with a matching numerical profile)
// Source: 50-exercises/62_CORE/15_DRAGON_FLAG.md
//   - Primary Classification: "Core Strength"; Primary Adaptation:
//     "Robustness"
//   - Physiological Profile: "Typical Work Duration: 5–30 seconds"
//   - Equipment Requirements: Stable bench/fixed post/rigid support
//     (required), Secure overhead or behind-head hand anchor (required)
//   - Key Coaching Cues: "Ribs down.", "Curl the pelvis toward the
//     ribs.", "Move as one rigid piece.", "Squeeze the glutes and
//     thighs.", "Pull hard against the anchor.", "Keep the weight on the
//     upper back, not the neck."
//   - Technical Failure Criteria (verbatim, abridged): "The lumbar spine
//     visibly extends... The upper-back anchor becomes unstable... Pain
//     occurs in the neck, shoulder, elbow, lumbar spine or abdominal
//     wall."
// Method: timed_isometric_sets / core / robustness
// -----------------------------------------------------------------------------

const SOURCE_DRAGON_FLAG = "50-exercises/62_CORE/15_DRAGON_FLAG.md";

const dragonFlagStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "dragon_flag_technical_failure",
    description:
      "The set is terminated if the lumbar spine visibly extends, the hips sag or fold independently of the trunk, the body no longer moves as one unit, the upper-back anchor becomes unstable, or the grip or shoulder position becomes insecure.",
    sourceRuleIds: [SOURCE_DRAGON_FLAG],
  }),
  painCondition({
    conditionId: "dragon_flag_pain",
    description: "Stop if pain occurs in the neck, shoulder, elbow, lumbar spine or abdominal wall.",
    sourceRuleIds: [SOURCE_DRAGON_FLAG],
  }),
  completionCondition({
    conditionId: "dragon_flag_completion",
    description: "Stop once the prescribed hold duration and sets are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const dragonFlagInstructions: InstructionDefinition[] = [
  makeInstruction(
    "dragon_flag_setup",
    "setup",
    "Set up a stable bench, fixed post or equivalent rigid support with a secure overhead or behind-head hand anchor.",
    "high",
    true,
    SOURCE_DRAGON_FLAG,
  ),
  makeInstruction(
    "dragon_flag_execution",
    "execution",
    "Ribs down, curl the pelvis toward the ribs, move as one rigid piece, squeeze the glutes and thighs, pull hard against the anchor, and keep the weight on the upper back, not the neck.",
    "high",
    true,
    SOURCE_DRAGON_FLAG,
  ),
];

const dragonFlagEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "dragon_flag",
  moduleId: "core",
  role: "robustness",
  explicitMethodId: "timed_isometric_sets",
  capabilities: {
    exerciseId: "dragon_flag",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["timed_isometric_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["isometric_hold"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["bench", "rigid_anchor_support"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["dragon_flag_setup", "dragon_flag_execution"],
    requiredStopConditionIds: ["dragon_flag_technical_failure", "dragon_flag_pain", "dragon_flag_completion"],
    durationEstimationProfileId: "duration_profile_dragon_flag",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_DRAGON_FLAG, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["isometric_hold"],
  preferredTempoType: null,
  instructionDefinitions: dragonFlagInstructions,
  stopConditionDefinitions: dragonFlagStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_DRAGON_FLAG, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Front Rack Carry
// Source: 50-exercises/66_CARRIES/11_FRONT_RACK_CARRY.md
//   - Exercise Identity: "Category: Carries"; "Unilateral or Bilateral:
//     Bilateral or Unilateral"; "Equipment: Kettlebells, Dumbbells,
//     Barbell, Sandbag or Similar Front-Loaded Implements"
//   - Key Technical Cues: "Keep the load close.", "Stack the ribs over
//     the pelvis.", "Keep the elbows stable.", "Stay tall.", "Brace and
//     breathe.", "Walk with controlled steps."
//   - No "Technical Failure Criteria" section (this schema uses Common
//     Errors + Contraindications + Safety Rules instead — same pattern
//     already used for Farmer Carry in the pilot registry).
//   - Absolute Contraindications: "acute shoulder injury, acute wrist
//     injury, acute elbow injury, acute spinal injury, inability to
//     maintain a safe rack, or inability to walk safely under load."
//   - Safety Rules: "Stop before rack collapse. ... Terminate immediately
//     if sharp pain, dizziness, numbness or sudden weakness occurs."
// Method: distance_carry_sets / grip / primary
// -----------------------------------------------------------------------------

const SOURCE_FRONT_RACK_CARRY = "50-exercises/66_CARRIES/11_FRONT_RACK_CARRY.md";

const frontRackCarryStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "front_rack_carry_technical_failure",
    description: "Stop the set if the rack position begins to collapse or cannot be maintained safely.",
    sourceRuleIds: [SOURCE_FRONT_RACK_CARRY],
  }),
  balanceLossCondition({
    conditionId: "front_rack_carry_balance_loss",
    description: "Stop the set if the athlete cannot walk safely under load.",
    sourceRuleIds: [SOURCE_FRONT_RACK_CARRY],
  }),
  equipmentFailureCondition({
    conditionId: "front_rack_carry_equipment_failure",
    description: "Stop before rack collapse.",
    sourceRuleIds: [SOURCE_FRONT_RACK_CARRY],
  }),
  painCondition({
    conditionId: "front_rack_carry_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_FRONT_RACK_CARRY],
  }),
  completionCondition({
    conditionId: "front_rack_carry_completion",
    description: "Stop once the prescribed sets and distance are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const frontRackCarryInstructions: InstructionDefinition[] = [
  makeInstruction(
    "front_rack_carry_setup",
    "setup",
    "Use a secure rack position with kettlebells, dumbbells, a barbell, a sandbag or a similar front-loaded implement.",
    "high",
    true,
    SOURCE_FRONT_RACK_CARRY,
  ),
  makeInstruction(
    "front_rack_carry_execution",
    "execution",
    "Keep the load close, stack the ribs over the pelvis, keep the elbows stable, stay tall, brace and breathe, and walk with controlled steps.",
    "high",
    true,
    SOURCE_FRONT_RACK_CARRY,
  ),
];

const frontRackCarryEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "front_rack_carry",
  moduleId: "grip",
  role: "primary",
  explicitMethodId: "distance_carry_sets",
  capabilities: {
    exerciseId: "front_rack_carry",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["distance_carry_sets"],
    supportedVolumeStructures: ["sets_distance"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["dumbbell", "kettlebell"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_distance"],
    capabilityTags: ["distance_measurement", "external_load", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["loaded_carry_implement"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["front_rack_carry_setup", "front_rack_carry_execution"],
    requiredStopConditionIds: [
      "front_rack_carry_technical_failure",
      "front_rack_carry_balance_loss",
      "front_rack_carry_equipment_failure",
      "front_rack_carry_pain",
      "front_rack_carry_completion",
    ],
    durationEstimationProfileId: "duration_profile_front_rack_carry",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_FRONT_RACK_CARRY, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: frontRackCarryInstructions,
  stopConditionDefinitions: frontRackCarryStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_FRONT_RACK_CARRY,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Sandbag Carry
// Source: 50-exercises/66_CARRIES/12_SANDBAG_CARRY.md
//   - Equipment: "Sandbag"; "Unilateral or Bilateral: Bilateral or
//     Asymmetrical"
//   - Key Technical Cues: "Keep the bag close.", "Wrap and squeeze.",
//     "Stay tall.", "Stack the ribs over the pelvis.", "Walk with
//     controlled steps.", "Stop before the bag shifts."
//   - Absolute Contraindications: "acute spinal injury, acute shoulder
//     injury, acute upper-limb injury, uncontrolled respiratory
//     symptoms, inability to walk safely, or an unstable or damaged
//     sandbag."
//   - Safety Rules: "Stop before the bag slips. ... Terminate immediately
//     if sharp pain, dizziness, numbness or sudden weakness occurs."
// Method: distance_carry_sets / grip / primary
// -----------------------------------------------------------------------------

const SOURCE_SANDBAG_CARRY = "50-exercises/66_CARRIES/12_SANDBAG_CARRY.md";

const sandbagCarryStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "sandbag_carry_technical_failure",
    description: "Stop the set if the bag shifts or the grip wrap begins to fail.",
    sourceRuleIds: [SOURCE_SANDBAG_CARRY],
  }),
  balanceLossCondition({
    conditionId: "sandbag_carry_balance_loss",
    description: "Stop the set if the athlete cannot walk safely with the load.",
    sourceRuleIds: [SOURCE_SANDBAG_CARRY],
  }),
  equipmentFailureCondition({
    conditionId: "sandbag_carry_equipment_failure",
    description: "Stop before the bag slips, or if the sandbag is unstable or damaged.",
    sourceRuleIds: [SOURCE_SANDBAG_CARRY],
  }),
  painCondition({
    conditionId: "sandbag_carry_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_SANDBAG_CARRY],
  }),
  completionCondition({
    conditionId: "sandbag_carry_completion",
    description: "Stop once the prescribed sets and distance are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const sandbagCarryInstructions: InstructionDefinition[] = [
  makeInstruction(
    "sandbag_carry_setup",
    "setup",
    "Inspect the sandbag before use and confirm secure closures.",
    "high",
    true,
    SOURCE_SANDBAG_CARRY,
  ),
  makeInstruction(
    "sandbag_carry_execution",
    "execution",
    "Keep the bag close, wrap and squeeze, stay tall, stack the ribs over the pelvis, walk with controlled steps and breathe behind the brace.",
    "high",
    true,
    SOURCE_SANDBAG_CARRY,
  ),
];

const sandbagCarryEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "sandbag_carry",
  moduleId: "grip",
  role: "primary",
  explicitMethodId: "distance_carry_sets",
  capabilities: {
    exerciseId: "sandbag_carry",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["distance_carry_sets"],
    supportedVolumeStructures: ["sets_distance"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["sandbag"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_distance"],
    capabilityTags: ["distance_measurement", "external_load", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["loaded_carry_implement"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["sandbag_carry_setup", "sandbag_carry_execution"],
    requiredStopConditionIds: [
      "sandbag_carry_technical_failure",
      "sandbag_carry_balance_loss",
      "sandbag_carry_equipment_failure",
      "sandbag_carry_pain",
      "sandbag_carry_completion",
    ],
    durationEstimationProfileId: "duration_profile_sandbag_carry",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SANDBAG_CARRY, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: sandbagCarryInstructions,
  stopConditionDefinitions: sandbagCarryStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_SANDBAG_CARRY, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Zercher Carry
// Source: 50-exercises/66_CARRIES/13_ZERCHER_CARRY.md
//   - Equipment: "Barbell, Sandbag, Axle or Similar Implement";
//     "Unilateral or Bilateral: Bilateral"
//   - Key Technical Cues: "Keep the load close.", "Squeeze the forearms
//     together.", "Stay tall.", "Stack the ribs over the pelvis.",
//     "Keep the upper back active.", "Stop before the elbow cradle
//     fails."
//   - Absolute Contraindications: "acute elbow injury, acute biceps
//     injury, acute shoulder injury, acute spinal injury, uncontrolled
//     respiratory symptoms, or inability to walk safely under load."
//   - Safety Rules: "Stop before the elbow cradle fails. ... Terminate
//     immediately if sharp pain, dizziness, numbness or sudden weakness
//     occurs."
// Method: distance_carry_sets / grip / primary
// -----------------------------------------------------------------------------

const SOURCE_ZERCHER_CARRY = "50-exercises/66_CARRIES/13_ZERCHER_CARRY.md";

const zercherCarryStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "zercher_carry_technical_failure",
    description: "Stop the set before the elbow cradle fails.",
    sourceRuleIds: [SOURCE_ZERCHER_CARRY],
  }),
  balanceLossCondition({
    conditionId: "zercher_carry_balance_loss",
    description: "Stop the set if the athlete cannot walk safely under load.",
    sourceRuleIds: [SOURCE_ZERCHER_CARRY],
  }),
  equipmentFailureCondition({
    conditionId: "zercher_carry_equipment_failure",
    description: "Return the load safely if the elbow cradle position cannot be held.",
    sourceRuleIds: [SOURCE_ZERCHER_CARRY],
  }),
  painCondition({
    conditionId: "zercher_carry_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_ZERCHER_CARRY],
  }),
  completionCondition({
    conditionId: "zercher_carry_completion",
    description: "Stop once the prescribed sets and distance are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const zercherCarryInstructions: InstructionDefinition[] = [
  makeInstruction(
    "zercher_carry_setup",
    "setup",
    "Use secure supports when appropriate to set up the barbell, sandbag, axle or similar implement in the elbow cradle.",
    "high",
    true,
    SOURCE_ZERCHER_CARRY,
  ),
  makeInstruction(
    "zercher_carry_execution",
    "execution",
    "Keep the load close, squeeze the forearms together, stay tall, stack the ribs over the pelvis, keep the upper back active and walk with controlled steps.",
    "high",
    true,
    SOURCE_ZERCHER_CARRY,
  ),
];

const zercherCarryEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "zercher_carry",
  moduleId: "grip",
  role: "primary",
  explicitMethodId: "distance_carry_sets",
  capabilities: {
    exerciseId: "zercher_carry",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["distance_carry_sets"],
    supportedVolumeStructures: ["sets_distance"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    // Equipment: "Barbell, Sandbag, Axle or Similar Implement" (source doc above).
    // Only the barbell and sandbag variants are represented here — "axle" has
    // no dedicated LoadingMode value and is intentionally left unrepresented
    // rather than folded into "barbell".
    supportedLoadingModes: ["barbell", "sandbag"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_distance"],
    capabilityTags: ["distance_measurement", "external_load", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["loaded_carry_implement"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["zercher_carry_setup", "zercher_carry_execution"],
    requiredStopConditionIds: [
      "zercher_carry_technical_failure",
      "zercher_carry_balance_loss",
      "zercher_carry_equipment_failure",
      "zercher_carry_pain",
      "zercher_carry_completion",
    ],
    durationEstimationProfileId: "duration_profile_zercher_carry",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_ZERCHER_CARRY, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: zercherCarryInstructions,
  stopConditionDefinitions: zercherCarryStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_ZERCHER_CARRY, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Suitcase Carry
// (Filed under 62_CORE/ rather than 66_CARRIES/, but registered as `grip`
// module here — same reasoning already applied to the pilot Farmer Carry:
// the movement pattern is a loaded carry, and grip/distance_carry_sets/primary
// is the only numerically-documented profile any carry can use, regardless
// of which chapter directory it lives in or which "Primary Adaptation"
// label that chapter states.)
// Source: 50-exercises/62_CORE/17_SUITCASE_CARRY.md
//   - Primary Classification: "Loaded Carry"; unilateral ("unilateral
//     loaded locomotion")
//   - Equipment: Preferred — Heavy Dumbbell or Kettlebell; Acceptable —
//     Farmer Carry Handle, Loadable Suitcase Implement, Sandbag with
//     Secure Handle, Purpose-Built Carry Device
//   - Key Coaching Cues: "Stand tall.", "Do not let the weight pull you
//     sideways.", "Ribs over pelvis.", "Keep the belt line level.",
//     "Crush the handle.", "Walk quietly."
//   - Technical Failure Criteria (verbatim, abridged): "The trunk leans
//     visibly toward or away from the load... The athlete loses secure
//     grip... The athlete drops the implement unexpectedly. Pain occurs
//     in the spine, shoulder, elbow, wrist, hand, hip, knee or ankle."
// Method: distance_carry_sets / grip / primary
// -----------------------------------------------------------------------------

const SOURCE_SUITCASE_CARRY = "50-exercises/62_CORE/17_SUITCASE_CARRY.md";

const suitcaseCarryStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "suitcase_carry_technical_failure",
    description:
      "Stop the set if the trunk leans visibly toward or away from the load, the pelvis drops or shifts repeatedly, the shoulders rotate or become markedly uneven, step length becomes asymmetrical, or the athlete cannot maintain the prescribed path.",
    sourceRuleIds: [SOURCE_SUITCASE_CARRY],
  }),
  balanceLossCondition({
    conditionId: "suitcase_carry_balance_loss",
    description: "Stop the set if walking speed becomes uncontrolled or the feet cross the midline.",
    sourceRuleIds: [SOURCE_SUITCASE_CARRY],
  }),
  equipmentFailureCondition({
    conditionId: "suitcase_carry_equipment_failure",
    description: "Stop the set if the athlete loses secure grip or drops the implement unexpectedly.",
    sourceRuleIds: [SOURCE_SUITCASE_CARRY],
  }),
  painCondition({
    conditionId: "suitcase_carry_pain",
    description: "Stop if pain occurs in the spine, shoulder, elbow, wrist, hand, hip, knee or ankle.",
    sourceRuleIds: [SOURCE_SUITCASE_CARRY],
  }),
  completionCondition({
    conditionId: "suitcase_carry_completion",
    description: "Stop once the prescribed sets and distance per side are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const suitcaseCarryInstructions: InstructionDefinition[] = [
  makeInstruction(
    "suitcase_carry_setup",
    "setup",
    "Use a heavy dumbbell or kettlebell (preferred), or a farmer carry handle, loadable suitcase implement, sandbag with a secure handle or purpose-built carry device.",
    "high",
    true,
    SOURCE_SUITCASE_CARRY,
  ),
  makeInstruction(
    "suitcase_carry_execution",
    "execution",
    "Stand tall, do not let the weight pull you sideways, keep the ribs over the pelvis, keep the belt line level, crush the handle and walk quietly.",
    "high",
    true,
    SOURCE_SUITCASE_CARRY,
  ),
];

const suitcaseCarryEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "suitcase_carry",
  moduleId: "grip",
  role: "primary",
  explicitMethodId: "distance_carry_sets",
  capabilities: {
    exerciseId: "suitcase_carry",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["distance_carry_sets"],
    supportedVolumeStructures: ["sets_distance"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["dumbbell", "kettlebell"],
    supportedTempoTypes: [],
    laterality: "unilateral",
    volumeInterpretations: ["distance_per_side"],
    capabilityTags: ["distance_measurement", "external_load", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["loaded_carry_implement"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["suitcase_carry_setup", "suitcase_carry_execution"],
    requiredStopConditionIds: [
      "suitcase_carry_technical_failure",
      "suitcase_carry_balance_loss",
      "suitcase_carry_equipment_failure",
      "suitcase_carry_pain",
      "suitcase_carry_completion",
    ],
    durationEstimationProfileId: "duration_profile_suitcase_carry",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SUITCASE_CARRY, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: suitcaseCarryInstructions,
  stopConditionDefinitions: suitcaseCarryStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_SUITCASE_CARRY,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Overhead Carry
// (Same 62_CORE-directory-but-grip-module reasoning as Suitcase Carry.)
// Source: 50-exercises/62_CORE/18_OVERHEAD_CARRY.md
//   - Primary Classification: "Loaded Carry"
//   - Equipment: Minimum — One dumbbell or kettlebell; Optional — Two
//     dumbbells, Two kettlebells, Barbell, Trap bar frame with overhead
//     attachment, Sandbag, Specialized carry handles
//   - Key Coaching Cues: "Reach tall through the load.", "Keep the ribs
//     down.", "Stack the hand over the shoulder.", "Walk smoothly.",
//     "Keep the elbow long and stable.", "Breathe behind the brace."
//   - Technical Failure Criteria (verbatim, abridged): "The load drifts
//     significantly away from the shoulder line... The shoulder
//     collapses into an unstable or painful position... Pain, numbness
//     or neurological symptoms appear."
// Method: distance_carry_sets / grip / primary
// -----------------------------------------------------------------------------

const SOURCE_OVERHEAD_CARRY = "50-exercises/62_CORE/18_OVERHEAD_CARRY.md";

const overheadCarryStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "overhead_carry_technical_failure",
    description:
      "Stop the set if the load drifts significantly away from the shoulder line, the elbow repeatedly bends under fatigue, the athlete compensates with excessive lumbar extension, or gait becomes irregular or uncontrolled.",
    sourceRuleIds: [SOURCE_OVERHEAD_CARRY],
  }),
  balanceLossCondition({
    conditionId: "overhead_carry_balance_loss",
    description: "Stop the set if the athlete leans laterally or rotates excessively.",
    sourceRuleIds: [SOURCE_OVERHEAD_CARRY],
  }),
  equipmentFailureCondition({
    conditionId: "overhead_carry_equipment_failure",
    description: "Stop the set if the shoulder collapses into an unstable position or the wrist loses neutral alignment.",
    sourceRuleIds: [SOURCE_OVERHEAD_CARRY],
  }),
  painCondition({
    conditionId: "overhead_carry_pain",
    description: "Stop if pain, numbness or neurological symptoms appear.",
    sourceRuleIds: [SOURCE_OVERHEAD_CARRY],
  }),
  completionCondition({
    conditionId: "overhead_carry_completion",
    description: "Stop once the prescribed sets and distance are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const overheadCarryInstructions: InstructionDefinition[] = [
  makeInstruction(
    "overhead_carry_setup",
    "setup",
    "Use one dumbbell or kettlebell overhead; two implements, a barbell, a trap bar frame with overhead attachment, a sandbag or specialized carry handles may be used if available.",
    "high",
    true,
    SOURCE_OVERHEAD_CARRY,
  ),
  makeInstruction(
    "overhead_carry_execution",
    "execution",
    "Reach tall through the load, keep the ribs down, stack the hand over the shoulder, walk smoothly, keep the elbow long and stable, and breathe behind the brace.",
    "high",
    true,
    SOURCE_OVERHEAD_CARRY,
  ),
];

const overheadCarryEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "overhead_carry",
  moduleId: "grip",
  role: "primary",
  explicitMethodId: "distance_carry_sets",
  capabilities: {
    exerciseId: "overhead_carry",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["distance_carry_sets"],
    supportedVolumeStructures: ["sets_distance"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["dumbbell", "kettlebell"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_distance"],
    capabilityTags: ["distance_measurement", "external_load", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["loaded_carry_implement"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["overhead_carry_setup", "overhead_carry_execution"],
    requiredStopConditionIds: [
      "overhead_carry_technical_failure",
      "overhead_carry_balance_loss",
      "overhead_carry_equipment_failure",
      "overhead_carry_pain",
      "overhead_carry_completion",
    ],
    durationEstimationProfileId: "duration_profile_overhead_carry",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_OVERHEAD_CARRY, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: overheadCarryInstructions,
  stopConditionDefinitions: overheadCarryStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_OVERHEAD_CARRY,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Pinch Carry
// Source: 50-exercises/65_GRIP/12_PINCH_CARRY.md
//   - Exercise Identity: "Equipment: Weight Plates or Pinch Blocks";
//     "Unilateral or Bilateral: Unilateral or Bilateral"
//   - CAS decision: this entry represents only the documented Bilateral
//     Variation ("The athlete carries one implement in each hand" —
//     Bilateral Variation section), which the source doc treats as the
//     default/reference execution: it appears before the unilateral carry
//     in "Recommended Progression Sequence" (step 3 vs. step 4),
//     "unilateral execution" is listed under Progressions (harder) while
//     "bilateral execution" is listed under Regressions (easier), and the
//     doc's own Decision Trace example prescribes "three short bilateral
//     carries". The Unilateral Variation and Offset Variation sections are
//     NOT represented by this entry — no "per side" numerical value exists
//     anywhere in the source doc for either variant (unlike suitcase_carry,
//     whose source doc gives explicit per-side numbers), so representing
//     them here would require inventing one. laterality stays "bilateral"
//     and volumeInterpretations stays ["total_distance"] — both already
//     correct for the variant now explicitly represented.
//   - Key Technical Cues: "Pinch hard through the thumb.", "Keep the
//     wrist neutral.", "Keep the plate vertical.", "Walk tall.", "Keep
//     the load off the thigh.", "Stop before slipping."
//   - No "Technical Failure Criteria" section — uses Common Errors +
//     Contraindications + Safety Rules instead (same pattern as Farmer
//     Carry / the 66_CARRIES family).
//   - Absolute Contraindications: "acute thumb injury, acute finger
//     injury, acute wrist injury, neurological loss of grip control,
//     inability to walk safely under load, or an unstable implement
//     setup."
//   - Safety Rules: "Stop before uncontrolled slipping. ... Terminate
//     immediately if sharp pain, numbness or sudden weakness occurs."
// Method: distance_carry_sets / grip / primary
// -----------------------------------------------------------------------------

const SOURCE_PINCH_CARRY = "50-exercises/65_GRIP/12_PINCH_CARRY.md";

const pinchCarryStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "pinch_carry_technical_failure",
    description: "Stop the set if the plate can no longer be kept vertical or the load leans away from the body.",
    sourceRuleIds: [SOURCE_PINCH_CARRY],
  }),
  balanceLossCondition({
    conditionId: "pinch_carry_balance_loss",
    description: "Stop the set if the athlete cannot walk safely under load.",
    sourceRuleIds: [SOURCE_PINCH_CARRY],
  }),
  equipmentFailureCondition({
    conditionId: "pinch_carry_equipment_failure",
    description: "Stop before uncontrolled slipping, or if the implement setup becomes unstable.",
    sourceRuleIds: [SOURCE_PINCH_CARRY],
  }),
  painCondition({
    conditionId: "pinch_carry_pain",
    description: "Terminate immediately if sharp pain, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_PINCH_CARRY],
  }),
  completionCondition({
    conditionId: "pinch_carry_completion",
    description: "Stop once the prescribed sets and distance are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const pinchCarryInstructions: InstructionDefinition[] = [
  makeInstruction(
    "pinch_carry_setup",
    "setup",
    "Use intact weight plates or secure pinch blocks; confirm the implement setup is stable before walking.",
    "high",
    true,
    SOURCE_PINCH_CARRY,
  ),
  makeInstruction(
    "pinch_carry_execution",
    "execution",
    "Grip one implement in each hand with matched loads, pinch hard through the thumb, keep the wrist neutral, keep both implements vertical, walk tall with a level, symmetric gait and no lateral lean, keep the load off the thigh and take controlled steps.",
    "high",
    true,
    SOURCE_PINCH_CARRY,
  ),
];

const pinchCarryEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "pinch_carry",
  moduleId: "grip",
  role: "primary",
  explicitMethodId: "distance_carry_sets",
  capabilities: {
    exerciseId: "pinch_carry",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["distance_carry_sets"],
    supportedVolumeStructures: ["sets_distance"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["plate"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_distance"],
    capabilityTags: ["distance_measurement", "external_load", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["pinch_grip_implement"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["pinch_carry_setup", "pinch_carry_execution"],
    requiredStopConditionIds: [
      "pinch_carry_technical_failure",
      "pinch_carry_balance_loss",
      "pinch_carry_equipment_failure",
      "pinch_carry_pain",
      "pinch_carry_completion",
    ],
    durationEstimationProfileId: "duration_profile_pinch_carry",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_PINCH_CARRY, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: pinchCarryInstructions,
  stopConditionDefinitions: pinchCarryStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_PINCH_CARRY, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Depth Jump
// Source: 50-exercises/63_PLYOMETRICS/11_DEPTH_JUMP.md
//   - Primary Classification: "Reactive Plyometric"; Primary Adaptation:
//     "Reactive Strength"
//   - Equipment Requirements: Stable Elevated Platform, Appropriate
//     Landing Surface (required)
//   - Key Coaching Cues: "Step off, do not jump off.", "Land under your
//     hips.", "Be quick off the floor.", "Use the ground like a
//     spring.", "Quiet contact, violent take-off."
//   - Technical Failure Criteria (verbatim, abridged): "The athlete jumps
//     from the platform instead of stepping off... Ground contact
//     becomes visibly prolonged... Jump height decreases meaningfully...
//     The athlete reports pain... The set should end before technical
//     failure becomes pronounced."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_DEPTH_JUMP = "50-exercises/63_PLYOMETRICS/11_DEPTH_JUMP.md";

const depthJumpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "depth_jump_technical_failure",
    description:
      "Stop the set if the athlete jumps from the platform instead of stepping off, lands asymmetrically, the knees collapse inward, the trunk folds forward excessively, or the landing turns into a deep countermovement.",
    sourceRuleIds: [SOURCE_DEPTH_JUMP],
  }),
  velocityLossCondition({
    conditionId: "depth_jump_velocity_loss",
    description: "Stop the set when ground contact becomes visibly prolonged.",
    sourceRuleIds: [SOURCE_DEPTH_JUMP],
  }),
  fatigueLimitCondition({
    conditionId: "depth_jump_fatigue_limit",
    description: "Stop the set once jump height decreases meaningfully or the athlete pauses before the rebound.",
    sourceRuleIds: [SOURCE_DEPTH_JUMP],
  }),
  impactLimitCondition({
    conditionId: "depth_jump_impact_limit",
    description: "Stop the set if the athlete cannot control the final landing, or the platform moves or becomes unstable.",
    sourceRuleIds: [SOURCE_DEPTH_JUMP],
  }),
  balanceLossCondition({
    conditionId: "depth_jump_balance_loss",
    description: "Stop the set if the athlete shows fear, hesitation or protective movement.",
    sourceRuleIds: [SOURCE_DEPTH_JUMP],
  }),
  painCondition({
    conditionId: "depth_jump_pain",
    description: "Stop immediately if the athlete reports pain.",
    sourceRuleIds: [SOURCE_DEPTH_JUMP],
  }),
  completionCondition({
    conditionId: "depth_jump_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const depthJumpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "depth_jump_setup",
    "setup",
    "Use a stable elevated platform and an appropriate, non-slip landing surface with open vertical space.",
    "high",
    true,
    SOURCE_DEPTH_JUMP,
  ),
  makeInstruction(
    "depth_jump_execution",
    "execution",
    "Step off, do not jump off, land under your hips, be quick off the floor, use the ground like a spring, and aim for quiet contact with a violent take-off.",
    "high",
    true,
    SOURCE_DEPTH_JUMP,
  ),
];

const depthJumpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "depth_jump",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "depth_jump",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["plyometric_box", "safe_landing_surface"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["depth_jump_setup", "depth_jump_execution"],
    requiredStopConditionIds: [
      "depth_jump_technical_failure",
      "depth_jump_velocity_loss",
      "depth_jump_fatigue_limit",
      "depth_jump_impact_limit",
      "depth_jump_balance_loss",
      "depth_jump_pain",
      "depth_jump_completion",
    ],
    durationEstimationProfileId: "duration_profile_depth_jump",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_DEPTH_JUMP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: depthJumpInstructions,
  stopConditionDefinitions: depthJumpStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_DEPTH_JUMP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Broad Jump
// Source: 50-exercises/63_PLYOMETRICS/12_BROAD_JUMP.md
//   - Primary Classification: "Horizontal Plyometric"; Primary
//     Adaptation: "Power"
//   - Equipment Requirements: Stable non-slip training surface (required)
//   - Coaching Cues: "Load quickly.", "Throw the arms.", "Push the
//     ground behind you.", "Extend completely.", "Land on both feet.",
//     "Land quietly."
//   - Technical Failure Criteria (verbatim, abridged): "Incomplete hip,
//     knee or ankle extension... Audibly heavy landing associated with
//     poor force absorption... Visible reduction in distance combined
//     with loss of explosive intent... Pain during take-off, flight or
//     landing."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_BROAD_JUMP = "50-exercises/63_PLYOMETRICS/12_BROAD_JUMP.md";

const broadJumpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "broad_jump_technical_failure",
    description:
      "Stop the set if hip, knee or ankle extension is incomplete, the countermovement becomes excessively slow or deep, knee valgus occurs, or marked asymmetry between the legs occurs.",
    sourceRuleIds: [SOURCE_BROAD_JUMP],
  }),
  velocityLossCondition({
    conditionId: "broad_jump_velocity_loss",
    description: "Stop the set once loss of explosive intent appears.",
    sourceRuleIds: [SOURCE_BROAD_JUMP],
  }),
  fatigueLimitCondition({
    conditionId: "broad_jump_fatigue_limit",
    description: "Stop the set once a visible reduction in distance occurs.",
    sourceRuleIds: [SOURCE_BROAD_JUMP],
  }),
  impactLimitCondition({
    conditionId: "broad_jump_impact_limit",
    description: "Stop the set if the landing is audibly heavy with poor force absorption, or the hands contact the floor.",
    sourceRuleIds: [SOURCE_BROAD_JUMP],
  }),
  balanceLossCondition({
    conditionId: "broad_jump_balance_loss",
    description: "Stop the set if an additional step is required to regain balance, or the athlete falls backward after landing.",
    sourceRuleIds: [SOURCE_BROAD_JUMP],
  }),
  painCondition({
    conditionId: "broad_jump_pain",
    description: "Stop immediately if pain occurs during take-off, flight or landing.",
    sourceRuleIds: [SOURCE_BROAD_JUMP],
  }),
  completionCondition({
    conditionId: "broad_jump_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const broadJumpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "broad_jump_setup",
    "setup",
    "Use a stable non-slip training surface with sufficient open space to land safely.",
    "high",
    true,
    SOURCE_BROAD_JUMP,
  ),
  makeInstruction(
    "broad_jump_execution",
    "execution",
    "Load quickly, throw the arms, push the ground behind you, extend completely, land on both feet and land quietly.",
    "high",
    true,
    SOURCE_BROAD_JUMP,
  ),
];

const broadJumpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "broad_jump",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "broad_jump",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["safe_landing_surface"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["broad_jump_setup", "broad_jump_execution"],
    requiredStopConditionIds: [
      "broad_jump_technical_failure",
      "broad_jump_velocity_loss",
      "broad_jump_fatigue_limit",
      "broad_jump_impact_limit",
      "broad_jump_balance_loss",
      "broad_jump_pain",
      "broad_jump_completion",
    ],
    durationEstimationProfileId: "duration_profile_broad_jump",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_BROAD_JUMP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: broadJumpInstructions,
  stopConditionDefinitions: broadJumpStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_BROAD_JUMP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Knee Jump
// Source: 50-exercises/63_PLYOMETRICS/13_KNEE_JUMP.md
//   - Primary Classification: "Concentric-Dominant Plyometric"; Primary
//     Adaptation: "Power"
//   - Equipment Requirements: Dense Knee Pad or Folded Exercise Mat,
//     Stable Non-Slip Floor (required)
//   - Coaching Cues: "Tall through the hips.", "Ribs down.", "Load the
//     hips, not the lower back.", "Swing and drive.", "Land softly.",
//     "Freeze the finish."
//   - Technical Failure Criteria (verbatim, abridged): "The athlete
//     pushes significantly from the toes... The landing is excessively
//     loud or rigid... Pain occurs during kneeling, projection or
//     landing. Repetition height or speed declines substantially."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_KNEE_JUMP = "50-exercises/63_PLYOMETRICS/13_KNEE_JUMP.md";

const kneeJumpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "knee_jump_technical_failure",
    description:
      "Stop the set if the athlete pushes significantly from the toes, propulsion comes primarily from lumbar extension, the athlete throws the head backward, or the feet land excessively narrow, crossed or asymmetrical.",
    sourceRuleIds: [SOURCE_KNEE_JUMP],
  }),
  velocityLossCondition({
    conditionId: "knee_jump_velocity_loss",
    description: "Stop the set once repetition speed declines substantially.",
    sourceRuleIds: [SOURCE_KNEE_JUMP],
  }),
  fatigueLimitCondition({
    conditionId: "knee_jump_fatigue_limit",
    description: "Stop the set once repetition height declines substantially, or fear or hesitation alters the movement strategy.",
    sourceRuleIds: [SOURCE_KNEE_JUMP],
  }),
  impactLimitCondition({
    conditionId: "knee_jump_impact_limit",
    description: "Stop the set if the landing is excessively loud or rigid, or the athlete lands on the toes without controlled heel contact.",
    sourceRuleIds: [SOURCE_KNEE_JUMP],
  }),
  balanceLossCondition({
    conditionId: "knee_jump_balance_loss",
    description: "Stop the set if the athlete falls forward, backward or sideways, or an additional step is required to recover balance.",
    sourceRuleIds: [SOURCE_KNEE_JUMP],
  }),
  painCondition({
    conditionId: "knee_jump_pain",
    description: "Stop immediately if pain occurs during kneeling, projection or landing.",
    sourceRuleIds: [SOURCE_KNEE_JUMP],
  }),
  completionCondition({
    conditionId: "knee_jump_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const kneeJumpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "knee_jump_setup",
    "setup",
    "Use a dense knee pad or folded exercise mat on a stable, non-slip floor.",
    "high",
    true,
    SOURCE_KNEE_JUMP,
  ),
  makeInstruction(
    "knee_jump_execution",
    "execution",
    "Stay tall through the hips, keep the ribs down, load the hips rather than the lower back, swing and drive, land softly and freeze the finish.",
    "high",
    true,
    SOURCE_KNEE_JUMP,
  ),
];

const kneeJumpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "knee_jump",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "knee_jump",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["knee_protection_pad", "safe_landing_surface"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["knee_jump_setup", "knee_jump_execution"],
    requiredStopConditionIds: [
      "knee_jump_technical_failure",
      "knee_jump_velocity_loss",
      "knee_jump_fatigue_limit",
      "knee_jump_impact_limit",
      "knee_jump_balance_loss",
      "knee_jump_pain",
      "knee_jump_completion",
    ],
    durationEstimationProfileId: "duration_profile_knee_jump",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_KNEE_JUMP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: kneeJumpInstructions,
  stopConditionDefinitions: kneeJumpStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_KNEE_JUMP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Lateral Bound
// Source: 50-exercises/63_PLYOMETRICS/14_LATERAL_BOUND.md
//   - Primary Classification: "Unilateral Lateral Plyometric"; Primary
//     Adaptation: "Power"
//   - Equipment Requirements: Stable Non-Slip Floor (required)
//   - Coaching Cues: "Sit into the hip.", "Push the floor away.",
//     "Travel sideways, not upward only.", "Land on the opposite leg.",
//     "Land quietly.", "Stick the position."
//   - Technical Failure Criteria (verbatim, abridged): "The athlete
//     takes off from both feet... The landing is excessively loud... A
//     recovery step or hop is required... Pain occurs during take-off or
//     landing. Distance or landing quality declines substantially."
// Method: power_repetition_sets / power / primary
// Unilateral (per side).
// -----------------------------------------------------------------------------

const SOURCE_LATERAL_BOUND = "50-exercises/63_PLYOMETRICS/14_LATERAL_BOUND.md";

const lateralBoundStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "lateral_bound_technical_failure",
    description:
      "Stop the set if the athlete takes off from both feet, the push-off is hesitant or lacks clear lateral intent, the support knee collapses inward, or the trunk rotates excessively to create momentum.",
    sourceRuleIds: [SOURCE_LATERAL_BOUND],
  }),
  velocityLossCondition({
    conditionId: "lateral_bound_velocity_loss",
    description: "Stop the set once distance declines substantially.",
    sourceRuleIds: [SOURCE_LATERAL_BOUND],
  }),
  fatigueLimitCondition({
    conditionId: "lateral_bound_fatigue_limit",
    description: "Stop the set once landing quality declines substantially across repetitions.",
    sourceRuleIds: [SOURCE_LATERAL_BOUND],
  }),
  impactLimitCondition({
    conditionId: "lateral_bound_impact_limit",
    description: "Stop the set if the athlete lands rigidly without absorbing force, or the landing is excessively loud.",
    sourceRuleIds: [SOURCE_LATERAL_BOUND],
  }),
  balanceLossCondition({
    conditionId: "lateral_bound_balance_loss",
    description: "Stop the set if the trunk falls significantly outside the base of support, or the athlete cannot hold the landing position.",
    sourceRuleIds: [SOURCE_LATERAL_BOUND],
  }),
  painCondition({
    conditionId: "lateral_bound_pain",
    description: "Stop immediately if pain occurs during take-off or landing.",
    sourceRuleIds: [SOURCE_LATERAL_BOUND],
  }),
  completionCondition({
    conditionId: "lateral_bound_completion",
    description: "Stop once the prescribed sets and repetitions per side are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const lateralBoundInstructions: InstructionDefinition[] = [
  makeInstruction(
    "lateral_bound_setup",
    "setup",
    "Use a stable, non-slip floor with sufficient open space to land safely to the side.",
    "high",
    true,
    SOURCE_LATERAL_BOUND,
  ),
  makeInstruction(
    "lateral_bound_execution",
    "execution",
    "Sit into the hip, push the floor away, travel sideways rather than upward only, land on the opposite leg, land quietly and stick the position.",
    "high",
    true,
    SOURCE_LATERAL_BOUND,
  ),
];

const lateralBoundEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "lateral_bound",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "lateral_bound",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "unilateral",
    volumeInterpretations: ["repetitions_per_side"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["safe_landing_surface"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["lateral_bound_setup", "lateral_bound_execution"],
    requiredStopConditionIds: [
      "lateral_bound_technical_failure",
      "lateral_bound_velocity_loss",
      "lateral_bound_fatigue_limit",
      "lateral_bound_impact_limit",
      "lateral_bound_balance_loss",
      "lateral_bound_pain",
      "lateral_bound_completion",
    ],
    durationEstimationProfileId: "duration_profile_lateral_bound",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_LATERAL_BOUND, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: lateralBoundInstructions,
  stopConditionDefinitions: lateralBoundStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_LATERAL_BOUND, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Single Leg Hop
// Source: 50-exercises/63_PLYOMETRICS/15_SINGLE_LEG_HOP.md
//   - Primary Classification: "Unilateral Plyometric"; Primary
//     Adaptation: "Power"
//   - Equipment Requirements: Flat Non-Slip Surface (required)
//   - Coaching Cues: "Push the ground away.", "Drive through the whole
//     foot.", "Project, do not reach.", "Land on the same leg.", "Land
//     quietly.", "Own the landing."
//   - Technical Failure Criteria (verbatim, abridged): "The opposite
//     foot touches the ground during the landing... The athlete cannot
//     stabilize within approximately two seconds... Pain occurs during
//     take-off, flight preparation or landing."
// Method: power_repetition_sets / power / primary
// Unilateral (per side).
// -----------------------------------------------------------------------------

const SOURCE_SINGLE_LEG_HOP = "50-exercises/63_PLYOMETRICS/15_SINGLE_LEG_HOP.md";

const singleLegHopStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "single_leg_hop_technical_failure",
    description:
      "Stop the set if the knee collapses medially, the foot rolls excessively inward or outward, the pelvis drops or rotates uncontrollably, or the trunk collapses, twists or leans excessively.",
    sourceRuleIds: [SOURCE_SINGLE_LEG_HOP],
  }),
  velocityLossCondition({
    conditionId: "single_leg_hop_velocity_loss",
    description: "Stop the set once repeated hops show progressively longer ground contacts.",
    sourceRuleIds: [SOURCE_SINGLE_LEG_HOP],
  }),
  fatigueLimitCondition({
    conditionId: "single_leg_hop_fatigue_limit",
    description: "Stop the set once repeated hops show shorter distances or deteriorating alignment.",
    sourceRuleIds: [SOURCE_SINGLE_LEG_HOP],
  }),
  impactLimitCondition({
    conditionId: "single_leg_hop_impact_limit",
    description: "Stop the set if the heel, forefoot or entire foot strikes in an uncontrolled manner, or the athlete lands with a rigid knee and minimal force absorption.",
    sourceRuleIds: [SOURCE_SINGLE_LEG_HOP],
  }),
  balanceLossCondition({
    conditionId: "single_leg_hop_balance_loss",
    description: "Stop the set if the opposite foot touches the ground during the landing, the athlete takes a recovery step, or cannot stabilize within approximately two seconds.",
    sourceRuleIds: [SOURCE_SINGLE_LEG_HOP],
  }),
  painCondition({
    conditionId: "single_leg_hop_pain",
    description: "Stop immediately if pain occurs during take-off, flight preparation or landing.",
    sourceRuleIds: [SOURCE_SINGLE_LEG_HOP],
  }),
  completionCondition({
    conditionId: "single_leg_hop_completion",
    description: "Stop once the prescribed sets and repetitions per side are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const singleLegHopInstructions: InstructionDefinition[] = [
  makeInstruction(
    "single_leg_hop_setup",
    "setup",
    "Use a flat, non-slip surface with floor markers or measuring tape if available.",
    "high",
    true,
    SOURCE_SINGLE_LEG_HOP,
  ),
  makeInstruction(
    "single_leg_hop_execution",
    "execution",
    "Push the ground away, drive through the whole foot, project rather than reach, land on the same leg, land quietly and own the landing.",
    "high",
    true,
    SOURCE_SINGLE_LEG_HOP,
  ),
];

const singleLegHopEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "single_leg_hop",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "single_leg_hop",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "unilateral",
    volumeInterpretations: ["repetitions_per_side"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["safe_landing_surface"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["single_leg_hop_setup", "single_leg_hop_execution"],
    requiredStopConditionIds: [
      "single_leg_hop_technical_failure",
      "single_leg_hop_velocity_loss",
      "single_leg_hop_fatigue_limit",
      "single_leg_hop_impact_limit",
      "single_leg_hop_balance_loss",
      "single_leg_hop_pain",
      "single_leg_hop_completion",
    ],
    durationEstimationProfileId: "duration_profile_single_leg_hop",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SINGLE_LEG_HOP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: singleLegHopInstructions,
  stopConditionDefinitions: singleLegHopStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_SINGLE_LEG_HOP,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Split Squat Jump
// Source: 50-exercises/63_PLYOMETRICS/16_SPLIT_SQUAT_JUMP.md
//   - Primary Classification: "Alternating Unilateral Plyometric";
//     Primary Adaptation: "Power"
//   - Equipment Requirements: "None" (bodyweight)
//   - Coaching Cues: "Stay on two rails.", "Drive straight up.", "Switch
//     the legs, not the torso.", "Land softly in a strong stance.",
//     "Front knee tracks over the foot.", "Quality before speed."
//   - Technical Failure Criteria (verbatim, abridged): "The feet cross in
//     the air... The landing is excessively loud or rigid... Jump height
//     declines substantially across the set... Pain appears in the knee,
//     ankle, Achilles tendon, hip or lower back."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_SPLIT_SQUAT_JUMP = "50-exercises/63_PLYOMETRICS/16_SPLIT_SQUAT_JUMP.md";

const splitSquatJumpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "split_squat_jump_technical_failure",
    description:
      "Stop the set if the feet cross in the air or land on a single narrow line, the front knee collapses medially, the pelvis rotates excessively during the switch, or the torso arches, folds or twists to create artificial height.",
    sourceRuleIds: [SOURCE_SPLIT_SQUAT_JUMP],
  }),
  velocityLossCondition({
    conditionId: "split_squat_jump_velocity_loss",
    description: "Stop the set once the switching pattern becomes asynchronous or hesitant.",
    sourceRuleIds: [SOURCE_SPLIT_SQUAT_JUMP],
  }),
  fatigueLimitCondition({
    conditionId: "split_squat_jump_fatigue_limit",
    description: "Stop the set once jump height declines substantially across the set.",
    sourceRuleIds: [SOURCE_SPLIT_SQUAT_JUMP],
  }),
  impactLimitCondition({
    conditionId: "split_squat_jump_impact_limit",
    description: "Stop the set if the landing is excessively loud or rigid, or the rear knee strikes or nearly strikes the ground unintentionally.",
    sourceRuleIds: [SOURCE_SPLIT_SQUAT_JUMP],
  }),
  balanceLossCondition({
    conditionId: "split_squat_jump_balance_loss",
    description: "Stop the set if the athlete loses balance or takes corrective steps.",
    sourceRuleIds: [SOURCE_SPLIT_SQUAT_JUMP],
  }),
  painCondition({
    conditionId: "split_squat_jump_pain",
    description: "Stop immediately if pain appears in the knee, ankle, Achilles tendon, hip or lower back.",
    sourceRuleIds: [SOURCE_SPLIT_SQUAT_JUMP],
  }),
  completionCondition({
    conditionId: "split_squat_jump_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const splitSquatJumpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "split_squat_jump_setup",
    "setup",
    "No equipment is required for the standard exercise.",
    "medium",
    true,
    SOURCE_SPLIT_SQUAT_JUMP,
  ),
  makeInstruction(
    "split_squat_jump_execution",
    "execution",
    "Stay on two rails, drive straight up, switch the legs rather than the torso, land softly in a strong stance, track the front knee over the foot and prioritize quality before speed.",
    "high",
    true,
    SOURCE_SPLIT_SQUAT_JUMP,
  ),
];

const splitSquatJumpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "split_squat_jump",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "split_squat_jump",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["split_squat_jump_setup", "split_squat_jump_execution"],
    requiredStopConditionIds: [
      "split_squat_jump_technical_failure",
      "split_squat_jump_velocity_loss",
      "split_squat_jump_fatigue_limit",
      "split_squat_jump_impact_limit",
      "split_squat_jump_balance_loss",
      "split_squat_jump_pain",
      "split_squat_jump_completion",
    ],
    durationEstimationProfileId: "duration_profile_split_squat_jump",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SPLIT_SQUAT_JUMP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: splitSquatJumpInstructions,
  stopConditionDefinitions: splitSquatJumpStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_SPLIT_SQUAT_JUMP,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Slam
// (The only integrated Ballistics exercise — see PILOT_EXERCISE_IDS comment
// and the integrability report for why the other six Ballistics chapters are
// not integrated: they require a standard, rebounding-capable medicine ball,
// and no such equipment capability id exists in equipmentCapabilities.ts.
// "slam_ball" was added to that file's canonical vocabulary during a prior
// registry extension specifically for this exercise's own documented
// implement — "Slam Ball or Non-Rebounding Medicine Ball" — and is reused
// here unchanged, not newly created.)
// Source: 50-exercises/67_BALLISTICS/14_MED_BALL_SLAM.md
//   - Primary Classification: "Downward Ballistic Power"; Primary
//     Adaptation: "Rapid Downward Force Projection"
//   - Exercise Identity: "Equipment: Slam Ball or Non-Rebounding Medicine
//     Ball, Suitable Floor Surface"; "Unilateral or Bilateral: Bilateral"
//   - Key Technical Cues: "Reach tall, then slam hard.", "Accelerate all
//     the way down.", "Drive through the ball.", "Keep the ribs
//     controlled.", "Use the trunk, not only the arms.", "Throw the ball
//     in front of the body.", "Finish balanced.", "Reset before
//     repeating."
//   - No "Technical Failure Criteria" section (this chapter uses Common
//     Errors + Ineligibility Criteria + Contraindications + Safety Rules
//     instead — same pattern already used for the Carries family in this
//     registry).
//   - Common Errors (verbatim, abridged): "Using a Ball That Is Too
//     Heavy... Arm-Only Slam... Releasing Too Close to the Feet...
//     Collapsing Into Deep Flexion... Chasing the Rebound... Turning the
//     Exercise Into Conditioning: The athlete performs rapid
//     high-repetition sets with falling speed."
//   - Coaching Priorities: "...Preserve maximal intent. Stop before speed
//     declines."
//   - Safety Rules: "Use a slam ball or appropriate non-rebounding
//     medicine ball. Verify the floor surface. Keep the throwing area
//     clear. Do not slam directly onto the feet. Avoid unpredictable
//     rebounds. ... Terminate immediately if sharp pain, dizziness,
//     numbness or sudden weakness occurs."
// Method: power_repetition_sets / power / primary
//   (power_primary_repetition_sets_v0_1 — matches
//   34_NUMERICAL_PRESCRIPTION_TABLES.md's explicit note that medicine-ball
//   throws use `movement_intent: maximal_acceleration` under this exact
//   profile and that "the engine must not infer a medicine-ball mass from
//   this generic profile" — no ball mass is claimed here, matching the
//   same no-invented-load approach already used for Box Jump, Push Press
//   and every Plyometrics entry.)
// -----------------------------------------------------------------------------

const SOURCE_MED_BALL_SLAM = "50-exercises/67_BALLISTICS/14_MED_BALL_SLAM.md";

const medBallSlamStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "med_ball_slam_technical_failure",
    description:
      "Stop the set if the athlete uses only the arms instead of the trunk and hips, releases the ball too close to the feet, or collapses into excessive flexion after release.",
    sourceRuleIds: [SOURCE_MED_BALL_SLAM],
  }),
  velocityLossCondition({
    conditionId: "med_ball_slam_velocity_loss",
    description: "Stop the set before slam speed declines.",
    sourceRuleIds: [SOURCE_MED_BALL_SLAM],
  }),
  fatigueLimitCondition({
    conditionId: "med_ball_slam_fatigue_limit",
    description:
      "Stop the set before it turns into a high-repetition conditioning effort with falling speed; reduce repetitions and restore full intent instead.",
    sourceRuleIds: [SOURCE_MED_BALL_SLAM],
  }),
  impactLimitCondition({
    conditionId: "med_ball_slam_impact_limit",
    description: "Stop the set if the ball is released too close to the feet or rebounds unpredictably.",
    sourceRuleIds: [SOURCE_MED_BALL_SLAM],
  }),
  balanceLossCondition({
    conditionId: "med_ball_slam_balance_loss",
    description: "Stop the set if the athlete collapses into excessive flexion or loses posture after release.",
    sourceRuleIds: [SOURCE_MED_BALL_SLAM],
  }),
  painCondition({
    conditionId: "med_ball_slam_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_MED_BALL_SLAM],
  }),
  completionCondition({
    conditionId: "med_ball_slam_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const medBallSlamInstructions: InstructionDefinition[] = [
  makeInstruction(
    "med_ball_slam_setup",
    "setup",
    "Use a slam ball or appropriate non-rebounding medicine ball on a suitable, clear floor surface.",
    "high",
    true,
    SOURCE_MED_BALL_SLAM,
  ),
  makeInstruction(
    "med_ball_slam_execution",
    "execution",
    "Reach tall, then slam hard, accelerating all the way down and driving through the ball. Keep the ribs controlled, use the trunk rather than only the arms, throw the ball in front of the body and finish balanced.",
    "high",
    true,
    SOURCE_MED_BALL_SLAM,
  ),
];

const medBallSlamEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "med_ball_slam",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "med_ball_slam",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["medicine_ball"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["slam_ball", "safe_landing_surface"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["med_ball_slam_setup", "med_ball_slam_execution"],
    requiredStopConditionIds: [
      "med_ball_slam_technical_failure",
      "med_ball_slam_velocity_loss",
      "med_ball_slam_fatigue_limit",
      "med_ball_slam_impact_limit",
      "med_ball_slam_balance_loss",
      "med_ball_slam_pain",
      "med_ball_slam_completion",
    ],
    durationEstimationProfileId: "duration_profile_med_ball_slam",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_MED_BALL_SLAM, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: medBallSlamInstructions,
  stopConditionDefinitions: medBallSlamStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_MED_BALL_SLAM, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Chest Pass — WALL VARIANT ONLY
// (This chapter documents "Equipment: Medicine Ball, Wall or Partner" — two
// alternative receiving surfaces for the same throw. requiredEquipmentCapabilities
// describes the prescribed variant, not every documented alternative; no OR
// primitive exists in this layer's types (see equipmentCapabilities.ts header).
// This entry represents the wall variant only. No "partner" capability exists
// and none is created here — the partner variant is simply not registered.)
// Source: 50-exercises/67_BALLISTICS/10_MED_BALL_CHEST_PASS.md
//   - Primary Classification: "Horizontal Ballistic Power"; Exercise
//     Identity: "Complexity: Low"; "Unilateral or Bilateral: Bilateral"
//   - Starting Position: "...the medicine ball held close to the chest,
//     both hands placed symmetrically... The distance from the wall or
//     partner must allow safe release and reception."
//   - Key Technical Cues: "Throw through the target.", "Accelerate through
//     release.", "Keep the ribs stacked.", "Do not guide the ball.",
//     "Keep the release straight.", "Finish in balance.", "Reset before
//     the next repetition."
//   - No "Technical Failure Criteria" section — uses Common Errors +
//     Ineligibility Criteria + Safety Rules instead, same pattern already
//     used for Med Ball Slam and the Carries family.
//   - Common Errors (verbatim, abridged): "Guiding the Ball... Arms
//     Dominating the Movement... Catching a Fast Rebound Without
//     Preparation: The athlete receives the ball unexpectedly. Risk:
//     wrist, elbow or shoulder injury."
//   - Coaching Priorities: "...Preserve repetition quality. Stop before
//     velocity declines."
//   - Regression Criteria: "...or fatigue reduces output."
//   - Safety Rules: "...Do not catch unpredictable rebounds. Maintain
//     safe wall distance. ... Terminate immediately if sharp pain,
//     numbness or sudden weakness occurs."
// Method: power_repetition_sets / power / primary (matches Med Ball Slam
//   and every other Power/Plyometrics entry; movement_intent only — no
//   ball mass is claimed, per 34_NUMERICAL_PRESCRIPTION_TABLES.md's
//   explicit instruction not to infer one from the generic profile).
// -----------------------------------------------------------------------------

const SOURCE_MED_BALL_CHEST_PASS = "50-exercises/67_BALLISTICS/10_MED_BALL_CHEST_PASS.md";

const medBallChestPassStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "med_ball_chest_pass_technical_failure",
    description:
      "Stop the set if the ball is guided rather than released decisively, the arms dominate the movement when whole-body integration is intended, or the athlete leans backward and flares the ribs.",
    sourceRuleIds: [SOURCE_MED_BALL_CHEST_PASS],
  }),
  velocityLossCondition({
    conditionId: "med_ball_chest_pass_velocity_loss",
    description: "Stop before velocity declines.",
    sourceRuleIds: [SOURCE_MED_BALL_CHEST_PASS],
  }),
  fatigueLimitCondition({
    conditionId: "med_ball_chest_pass_fatigue_limit",
    description: "Regress or stop the set when fatigue reduces output.",
    sourceRuleIds: [SOURCE_MED_BALL_CHEST_PASS],
  }),
  impactLimitCondition({
    conditionId: "med_ball_chest_pass_impact_limit",
    description: "Stop the set if the athlete must catch a fast, unpredictable rebound without preparation.",
    sourceRuleIds: [SOURCE_MED_BALL_CHEST_PASS],
  }),
  balanceLossCondition({
    conditionId: "med_ball_chest_pass_balance_loss",
    description: "Stop the set if the throw turns into a jump or uncontrolled lunge and balance is lost.",
    sourceRuleIds: [SOURCE_MED_BALL_CHEST_PASS],
  }),
  painCondition({
    conditionId: "med_ball_chest_pass_pain",
    description: "Terminate immediately if sharp pain, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_MED_BALL_CHEST_PASS],
  }),
  completionCondition({
    conditionId: "med_ball_chest_pass_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const medBallChestPassInstructions: InstructionDefinition[] = [
  makeInstruction(
    "med_ball_chest_pass_setup",
    "setup",
    "Set up at a wall, at a distance that allows safe release and reception, with the medicine ball held close to the chest, both hands placed symmetrically and a stable stance established. This entry covers the wall variant only, not the partner variant.",
    "high",
    true,
    SOURCE_MED_BALL_CHEST_PASS,
  ),
  makeInstruction(
    "med_ball_chest_pass_execution",
    "execution",
    "Throw through the target, accelerate through release, keep the ribs stacked, do not guide the ball, keep the release straight and finish in balance.",
    "high",
    true,
    SOURCE_MED_BALL_CHEST_PASS,
  ),
];

const medBallChestPassEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "med_ball_chest_pass",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "med_ball_chest_pass",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["medicine_ball"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["medicine_ball", "wall"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["med_ball_chest_pass_setup", "med_ball_chest_pass_execution"],
    requiredStopConditionIds: [
      "med_ball_chest_pass_technical_failure",
      "med_ball_chest_pass_velocity_loss",
      "med_ball_chest_pass_fatigue_limit",
      "med_ball_chest_pass_impact_limit",
      "med_ball_chest_pass_balance_loss",
      "med_ball_chest_pass_pain",
      "med_ball_chest_pass_completion",
    ],
    durationEstimationProfileId: "duration_profile_med_ball_chest_pass",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_MED_BALL_CHEST_PASS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: medBallChestPassInstructions,
  stopConditionDefinitions: medBallChestPassStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_MED_BALL_CHEST_PASS,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Overhead Throw — OPEN SPACE VARIANT
// (This chapter documents "Equipment: Medicine Ball, Open Space or Wall".
// "open_space" was already canonical before this extension and fully,
// independently satisfies the documented alternative — no OR primitive is
// needed. "wall" is not required by this entry because the instructions
// below describe an open-space throw, not a wall-directed one.)
// Source: 50-exercises/67_BALLISTICS/11_MED_BALL_OVERHEAD_THROW.md
//   - Primary Classification: "Overhead Ballistic Power"; Exercise
//     Identity: "Complexity: Low to Moderate"; "Unilateral or Bilateral:
//     Bilateral"
//   - Starting Position: "...feet in a stable stance, knees and hips
//     slightly flexed... eyes directed toward the intended target area.
//     The throwing lane must be clear."
//   - Key Technical Cues: "Drive through the floor.", "Extend from the
//     hips.", "Throw through the fingertips.", "Accelerate through
//     release.", "Keep the ribs controlled.", "Do not arch excessively.",
//     "Finish tall and balanced.", "Reset before repeating."
//   - Common Errors (verbatim, abridged): "Excessive Lumbar Extension...
//     Arm-Dominant Throw... Inconsistent Release Angle: The ball travels
//     unpredictably. Risk: unsafe projection... Loss of Balance: The
//     athlete steps uncontrollably or falls backward after release."
//   - Coaching Priorities: "...Finish in balance. Stop before velocity
//     declines."
//   - Regression Criteria: "...or fatigue reduces output."
//   - Safety Rules: "...Terminate immediately if sharp pain, dizziness,
//     numbness or sudden weakness occurs."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_MED_BALL_OVERHEAD_THROW = "50-exercises/67_BALLISTICS/11_MED_BALL_OVERHEAD_THROW.md";

const medBallOverheadThrowStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "med_ball_overhead_throw_technical_failure",
    description:
      "Stop the set if the athlete arches the lower back instead of transferring force through the whole body, relies mainly on the shoulders and elbows, or begins the arm action before the hips and knees extend.",
    sourceRuleIds: [SOURCE_MED_BALL_OVERHEAD_THROW],
  }),
  velocityLossCondition({
    conditionId: "med_ball_overhead_throw_velocity_loss",
    description: "Stop before velocity declines.",
    sourceRuleIds: [SOURCE_MED_BALL_OVERHEAD_THROW],
  }),
  fatigueLimitCondition({
    conditionId: "med_ball_overhead_throw_fatigue_limit",
    description: "Regress or stop the set when fatigue reduces output.",
    sourceRuleIds: [SOURCE_MED_BALL_OVERHEAD_THROW],
  }),
  impactLimitCondition({
    conditionId: "med_ball_overhead_throw_impact_limit",
    description: "Stop the set if the ball travels unpredictably, creating an unsafe projection.",
    sourceRuleIds: [SOURCE_MED_BALL_OVERHEAD_THROW],
  }),
  balanceLossCondition({
    conditionId: "med_ball_overhead_throw_balance_loss",
    description: "Stop the set if the athlete steps uncontrollably or falls backward after release.",
    sourceRuleIds: [SOURCE_MED_BALL_OVERHEAD_THROW],
  }),
  painCondition({
    conditionId: "med_ball_overhead_throw_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_MED_BALL_OVERHEAD_THROW],
  }),
  completionCondition({
    conditionId: "med_ball_overhead_throw_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const medBallOverheadThrowInstructions: InstructionDefinition[] = [
  makeInstruction(
    "med_ball_overhead_throw_setup",
    "setup",
    "Set up in a clear open space with the medicine ball held securely, feet in a stable stance, knees and hips slightly flexed, and eyes directed toward the intended target area. This entry covers the open-space variant, not a wall-directed throw.",
    "high",
    true,
    SOURCE_MED_BALL_OVERHEAD_THROW,
  ),
  makeInstruction(
    "med_ball_overhead_throw_execution",
    "execution",
    "Drive through the floor, extend from the hips, throw through the fingertips, accelerate through release, keep the ribs controlled, avoid arching excessively and finish tall and balanced.",
    "high",
    true,
    SOURCE_MED_BALL_OVERHEAD_THROW,
  ),
];

const medBallOverheadThrowEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "med_ball_overhead_throw",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "med_ball_overhead_throw",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["medicine_ball"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["medicine_ball", "open_space"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["med_ball_overhead_throw_setup", "med_ball_overhead_throw_execution"],
    requiredStopConditionIds: [
      "med_ball_overhead_throw_technical_failure",
      "med_ball_overhead_throw_velocity_loss",
      "med_ball_overhead_throw_fatigue_limit",
      "med_ball_overhead_throw_impact_limit",
      "med_ball_overhead_throw_balance_loss",
      "med_ball_overhead_throw_pain",
      "med_ball_overhead_throw_completion",
    ],
    durationEstimationProfileId: "duration_profile_med_ball_overhead_throw",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_MED_BALL_OVERHEAD_THROW, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: medBallOverheadThrowInstructions,
  stopConditionDefinitions: medBallOverheadThrowStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_MED_BALL_OVERHEAD_THROW,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Shot-Put Throw — OPEN SPACE VARIANT
// (This chapter documents "Equipment: Medicine Ball, Wall or Open Space".
// "open_space" was already canonical before this extension and fully,
// independently satisfies the documented alternative.)
// Source: 50-exercises/67_BALLISTICS/15_MED_BALL_SHOT_PUT_THROW.md
//   - Primary Classification: "Unilateral Horizontal Ballistic Power";
//     Exercise Identity: "Complexity: Moderate"; "Unilateral or
//     Bilateral: Unilateral"
//   - Starting Position: "...feet in a staggered stance, knees and hips
//     slightly flexed... eyes focused on the target."
//   - Key Technical Cues: "Drive from the rear leg.", "Throw through the
//     target.", "Sequence hip, trunk and arm.", "Keep the ball close
//     before release.", "Do not push slowly.", "Keep the vector
//     forward.", "Finish balanced.", "Reset before repeating."
//   - Common Errors (verbatim, abridged): "Arm-Dominant Throw...
//     Excessive Lumbar Rotation... Inconsistent Release Direction: The
//     ball travels upward, sideways or across the body. Risk: poor
//     standardization, unsafe rebound... Losing Balance After Release:
//     The athlete falls forward or rotates excessively."
//   - Coaching Priorities: "...Reset fully. Stop before velocity
//     declines."
//   - Regression Criteria: "...or fatigue reduces output."
//   - Safety Rules: "...Terminate immediately if sharp pain, dizziness,
//     numbness or sudden weakness occurs."
//   - Prescription Variables: repetitions documented "per side".
// Method: power_repetition_sets / power / primary
//   Laterality kept as documented: "unilateral" (repetitions per side) —
//   an unambiguous value, unlike Rotational Throw/Scoop Toss's hybrid
//   "Unilateral Emphasis with Bilateral Support", which remains excluded.
// -----------------------------------------------------------------------------

const SOURCE_MED_BALL_SHOT_PUT_THROW = "50-exercises/67_BALLISTICS/15_MED_BALL_SHOT_PUT_THROW.md";

const medBallShotPutThrowStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "med_ball_shot_put_throw_technical_failure",
    description:
      "Stop the set if the athlete pushes the ball using mainly the arm, rotates mainly through the lower back, or the front knee moves inward and front-side support is lost.",
    sourceRuleIds: [SOURCE_MED_BALL_SHOT_PUT_THROW],
  }),
  velocityLossCondition({
    conditionId: "med_ball_shot_put_throw_velocity_loss",
    description: "Stop before velocity declines.",
    sourceRuleIds: [SOURCE_MED_BALL_SHOT_PUT_THROW],
  }),
  fatigueLimitCondition({
    conditionId: "med_ball_shot_put_throw_fatigue_limit",
    description: "Regress or stop the set when fatigue reduces output.",
    sourceRuleIds: [SOURCE_MED_BALL_SHOT_PUT_THROW],
  }),
  impactLimitCondition({
    conditionId: "med_ball_shot_put_throw_impact_limit",
    description: "Stop the set if the ball travels upward, sideways or across the body, creating an unsafe rebound.",
    sourceRuleIds: [SOURCE_MED_BALL_SHOT_PUT_THROW],
  }),
  balanceLossCondition({
    conditionId: "med_ball_shot_put_throw_balance_loss",
    description: "Stop the set if the athlete falls forward or rotates excessively after release.",
    sourceRuleIds: [SOURCE_MED_BALL_SHOT_PUT_THROW],
  }),
  painCondition({
    conditionId: "med_ball_shot_put_throw_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_MED_BALL_SHOT_PUT_THROW],
  }),
  completionCondition({
    conditionId: "med_ball_shot_put_throw_completion",
    description: "Stop once the prescribed sets and repetitions per side are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const medBallShotPutThrowInstructions: InstructionDefinition[] = [
  makeInstruction(
    "med_ball_shot_put_throw_setup",
    "setup",
    "Set up in a clear open space with the medicine ball held near the rear shoulder or chest, feet in a staggered stance, knees and hips slightly flexed, and eyes focused on the target. This entry covers the open-space variant, not a wall-directed throw.",
    "high",
    true,
    SOURCE_MED_BALL_SHOT_PUT_THROW,
  ),
  makeInstruction(
    "med_ball_shot_put_throw_execution",
    "execution",
    "Drive from the rear leg, throw through the target, sequence hip, trunk and arm, keep the ball close before release, do not push slowly, keep the vector forward and finish balanced.",
    "high",
    true,
    SOURCE_MED_BALL_SHOT_PUT_THROW,
  ),
];

const medBallShotPutThrowEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "med_ball_shot_put_throw",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "med_ball_shot_put_throw",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["medicine_ball"],
    supportedTempoTypes: ["global_intent"],
    laterality: "unilateral",
    volumeInterpretations: ["repetitions_per_side"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["medicine_ball", "open_space"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["med_ball_shot_put_throw_setup", "med_ball_shot_put_throw_execution"],
    requiredStopConditionIds: [
      "med_ball_shot_put_throw_technical_failure",
      "med_ball_shot_put_throw_velocity_loss",
      "med_ball_shot_put_throw_fatigue_limit",
      "med_ball_shot_put_throw_impact_limit",
      "med_ball_shot_put_throw_balance_loss",
      "med_ball_shot_put_throw_pain",
      "med_ball_shot_put_throw_completion",
    ],
    durationEstimationProfileId: "duration_profile_med_ball_shot_put_throw",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_MED_BALL_SHOT_PUT_THROW, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: medBallShotPutThrowInstructions,
  stopConditionDefinitions: medBallShotPutThrowStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_MED_BALL_SHOT_PUT_THROW,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Reverse Throw — OPEN SPACE (the only documented option; no
// wall alternative exists in this chapter, so there is no variant ambiguity
// to resolve).
// Source: 50-exercises/67_BALLISTICS/16_MED_BALL_REVERSE_THROW.md
//   - Primary Classification: "Posterior-Chain Ballistic Power"; Exercise
//     Identity: "Equipment: Medicine Ball, Open Space"; "Complexity:
//     Moderate"; "Unilateral or Bilateral: Bilateral"
//   - Starting Position: "...the back facing the throwing area... the
//     landing area checked before every set."
//   - Key Technical Cues: "Check behind you.", "Load briefly.", "Drive
//     through the floor.", "Extend hips first.", "Throw up and back.",
//     "Accelerate through release.", "Finish tall.", "Stay balanced."
//   - Common Errors (verbatim, abridged): "Arm-Dominant Throw... Excessive
//     Lumbar Hyperextension... Inconsistent Release Angle: The ball
//     travels too vertically, too low or sideways. Risk: poor
//     standardization, unsafe landing... Falling Backward: The athlete
//     loses control after release. Risk: fall..."
//   - Coaching Priorities: "Clear the throwing area. ... Stop before
//     velocity declines."
//   - Regression Criteria: "...or fatigue reduces output."
//   - Safety Rules: "Fully clear the area behind the athlete. Recheck the
//     area before every set. ... Terminate immediately if sharp pain,
//     dizziness, numbness or sudden weakness occurs."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_MED_BALL_REVERSE_THROW = "50-exercises/67_BALLISTICS/16_MED_BALL_REVERSE_THROW.md";

const medBallReverseThrowStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "med_ball_reverse_throw_technical_failure",
    description:
      "Stop the set if the athlete lifts the ball mainly with the shoulders and arms, arches the lower back aggressively at release, or begins lifting the ball before lower-body extension.",
    sourceRuleIds: [SOURCE_MED_BALL_REVERSE_THROW],
  }),
  velocityLossCondition({
    conditionId: "med_ball_reverse_throw_velocity_loss",
    description: "Stop before velocity declines.",
    sourceRuleIds: [SOURCE_MED_BALL_REVERSE_THROW],
  }),
  fatigueLimitCondition({
    conditionId: "med_ball_reverse_throw_fatigue_limit",
    description: "Regress or stop the set when fatigue reduces output.",
    sourceRuleIds: [SOURCE_MED_BALL_REVERSE_THROW],
  }),
  impactLimitCondition({
    conditionId: "med_ball_reverse_throw_impact_limit",
    description: "Stop the set if the ball travels too vertically, too low or sideways, creating an unsafe landing.",
    sourceRuleIds: [SOURCE_MED_BALL_REVERSE_THROW],
  }),
  balanceLossCondition({
    conditionId: "med_ball_reverse_throw_balance_loss",
    description: "Stop the set if the athlete loses control and falls backward after release.",
    sourceRuleIds: [SOURCE_MED_BALL_REVERSE_THROW],
  }),
  painCondition({
    conditionId: "med_ball_reverse_throw_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_MED_BALL_REVERSE_THROW],
  }),
  completionCondition({
    conditionId: "med_ball_reverse_throw_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const medBallReverseThrowInstructions: InstructionDefinition[] = [
  makeInstruction(
    "med_ball_reverse_throw_setup",
    "setup",
    "Fully clear and check the open area behind the athlete before every set, with the medicine ball held securely with both hands and a stable stance established, back facing the throwing area.",
    "high",
    true,
    SOURCE_MED_BALL_REVERSE_THROW,
  ),
  makeInstruction(
    "med_ball_reverse_throw_execution",
    "execution",
    "Check behind you, load briefly, drive through the floor, extend hips first, throw up and back, accelerate through release, finish tall and stay balanced.",
    "high",
    true,
    SOURCE_MED_BALL_REVERSE_THROW,
  ),
];

const medBallReverseThrowEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "med_ball_reverse_throw",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "med_ball_reverse_throw",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["medicine_ball"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["medicine_ball", "open_space"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["med_ball_reverse_throw_setup", "med_ball_reverse_throw_execution"],
    requiredStopConditionIds: [
      "med_ball_reverse_throw_technical_failure",
      "med_ball_reverse_throw_velocity_loss",
      "med_ball_reverse_throw_fatigue_limit",
      "med_ball_reverse_throw_impact_limit",
      "med_ball_reverse_throw_balance_loss",
      "med_ball_reverse_throw_pain",
      "med_ball_reverse_throw_completion",
    ],
    durationEstimationProfileId: "duration_profile_med_ball_reverse_throw",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_MED_BALL_REVERSE_THROW, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: medBallReverseThrowInstructions,
  stopConditionDefinitions: medBallReverseThrowStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_MED_BALL_REVERSE_THROW,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Rotational Throw — WALL VARIANT ONLY
// (This chapter documents "Equipment: Medicine Ball, Wall or Partner" — two
// alternative receiving surfaces for the same throw, exactly like Chest
// Pass. requiredEquipmentCapabilities describes the prescribed variant, not
// every documented alternative. This entry represents the wall variant
// only. No "partner" capability exists and none is created here.)
// Source: 50-exercises/67_BALLISTICS/12_MED_BALL_ROTATIONAL_THROW.md
//   - Primary Classification: "Rotational Ballistic Power"; Exercise
//     Identity: "Complexity: Moderate"; "Unilateral or Bilateral:
//     Unilateral Emphasis with Bilateral Support" — resolved to
//     `laterality: "unilateral"` / `volumeInterpretations:
//     ["repetitions_per_side"]` per the laterality decision report,
//     matching this chapter's own "Prescription Variables > Repetitions:
//     ...repetitions per side" and the identical precedent already used
//     by med_ball_shot_put_throw. The "Bilateral Support" nuance is not
//     separately represented, consistent with every other unilateral
//     entry in this registry.
//   - Starting Position: "...the body positioned side-on or slightly
//     angled to the target... The throwing distance must allow safe
//     release and rebound management."
//   - Key Technical Cues: "Rotate from the hips.", "Let the trunk
//     transfer the force.", "Throw through the target.", "Keep the ball
//     close during the load.", "Do not arm the throw.", "Keep the ribs
//     controlled.", "Finish balanced.", "Reset before repeating."
//   - Common Errors (verbatim, abridged): "Arm-Dominant Throw... Poor
//     Foot Pivot... Inconsistent Release Direction: The ball travels
//     upward, downward or away from the target. Risk: poor
//     standardization, unsafe rebound... Loss of Balance: The athlete
//     steps uncontrollably after release."
//   - Coaching Priorities: "...Train both sides. Stop before velocity
//     declines."
//   - Regression Criteria: "...or fatigue reduces output."
//   - Safety Rules: "...Verify the wall or partner setup... Use a safe
//     rebound distance... Terminate immediately if sharp pain,
//     dizziness, numbness or sudden weakness occurs."
// Method: power_repetition_sets / power / primary (matches every other
//   Ballistics entry; movement_intent only — no ball mass claimed).
// -----------------------------------------------------------------------------

const SOURCE_MED_BALL_ROTATIONAL_THROW = "50-exercises/67_BALLISTICS/12_MED_BALL_ROTATIONAL_THROW.md";

const medBallRotationalThrowStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "med_ball_rotational_throw_technical_failure",
    description:
      "Stop the set if the athlete throws mainly with the arms, the rear foot fails to pivot while the body rotates aggressively, or the athlete rotates primarily through the lower back.",
    sourceRuleIds: [SOURCE_MED_BALL_ROTATIONAL_THROW],
  }),
  velocityLossCondition({
    conditionId: "med_ball_rotational_throw_velocity_loss",
    description: "Stop before velocity declines.",
    sourceRuleIds: [SOURCE_MED_BALL_ROTATIONAL_THROW],
  }),
  fatigueLimitCondition({
    conditionId: "med_ball_rotational_throw_fatigue_limit",
    description: "Regress or stop the set when fatigue reduces output.",
    sourceRuleIds: [SOURCE_MED_BALL_ROTATIONAL_THROW],
  }),
  impactLimitCondition({
    conditionId: "med_ball_rotational_throw_impact_limit",
    description:
      "Stop the set if the ball travels upward, downward or away from the target, creating an unsafe rebound.",
    sourceRuleIds: [SOURCE_MED_BALL_ROTATIONAL_THROW],
  }),
  balanceLossCondition({
    conditionId: "med_ball_rotational_throw_balance_loss",
    description: "Stop the set if the athlete steps uncontrollably or spins excessively after release.",
    sourceRuleIds: [SOURCE_MED_BALL_ROTATIONAL_THROW],
  }),
  painCondition({
    conditionId: "med_ball_rotational_throw_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_MED_BALL_ROTATIONAL_THROW],
  }),
  completionCondition({
    conditionId: "med_ball_rotational_throw_completion",
    description: "Stop once the prescribed sets and repetitions per side are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const medBallRotationalThrowInstructions: InstructionDefinition[] = [
  makeInstruction(
    "med_ball_rotational_throw_setup",
    "setup",
    "Set up at a wall, in a stable athletic stance positioned side-on or slightly angled to the wall, with the medicine ball held near the hip, waist or chest, at a distance that allows safe release and rebound management. This entry covers the wall variant only, not the partner variant.",
    "high",
    true,
    SOURCE_MED_BALL_ROTATIONAL_THROW,
  ),
  makeInstruction(
    "med_ball_rotational_throw_execution",
    "execution",
    "Rotate from the hips, let the trunk transfer the force, throw through the target, keep the ball close during the load, do not arm the throw, keep the ribs controlled and finish balanced.",
    "high",
    true,
    SOURCE_MED_BALL_ROTATIONAL_THROW,
  ),
];

const medBallRotationalThrowEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "med_ball_rotational_throw",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "med_ball_rotational_throw",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["medicine_ball"],
    supportedTempoTypes: ["global_intent"],
    laterality: "unilateral",
    volumeInterpretations: ["repetitions_per_side"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["medicine_ball", "wall"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["med_ball_rotational_throw_setup", "med_ball_rotational_throw_execution"],
    requiredStopConditionIds: [
      "med_ball_rotational_throw_technical_failure",
      "med_ball_rotational_throw_velocity_loss",
      "med_ball_rotational_throw_fatigue_limit",
      "med_ball_rotational_throw_impact_limit",
      "med_ball_rotational_throw_balance_loss",
      "med_ball_rotational_throw_pain",
      "med_ball_rotational_throw_completion",
    ],
    durationEstimationProfileId: "duration_profile_med_ball_rotational_throw",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_MED_BALL_ROTATIONAL_THROW, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: medBallRotationalThrowInstructions,
  stopConditionDefinitions: medBallRotationalThrowStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_MED_BALL_ROTATIONAL_THROW,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Scoop Toss — STANDING ROTATIONAL VARIANT ONLY, OPEN SPACE
// (This chapter documents three named variants relevant here: "Standing
// Rotational Scoop Toss" — "This is the default variation for most
// athletes" — is the ONLY variant represented by this entry. "Forward
// Scoop Toss" is explicitly bilateral ("bilateral sequencing") and is NOT
// covered. "Lateral Scoop Toss" is explicitly directed "toward a wall" and
// is also NOT covered — its wall requirement must not be attributed to the
// Standing Rotational variant, which mentions no specific target surface.
// Equipment: the chapter's Exercise Identity states "Medicine Ball, Wall or
// Open Space"; since the Standing Rotational variant's own description
// names no target/wall requirement, and "open_space" is the
// non-target-dependent, unconditionally sufficient branch of that
// alternative, this entry uses ["medicine_ball", "open_space"] — chosen
// from the fiche's text, not deduced.)
// Source: 50-exercises/67_BALLISTICS/13_MED_BALL_SCOOP_TOSS.md
//   - Primary Classification: "Hip-Driven Ballistic Power"; Exercise
//     Identity: "Complexity: Moderate"; "Unilateral or Bilateral:
//     Unilateral Emphasis with Bilateral Support" — resolved identically
//     to med_ball_rotational_throw: `laterality: "unilateral"` /
//     `volumeInterpretations: ["repetitions_per_side"]`, matching this
//     chapter's own "Prescription Variables > Repetitions: ...repetitions
//     per side."
//   - "Standing Rotational Scoop Toss": "Primary role: whole-body
//     rotational and diagonal power. Primary characteristics: high
//     lower-body contribution, moderate complexity, strong hip-to-hand
//     sequencing. This is the default variation for most athletes."
//   - Starting Position: "...feet in a stable athletic stance, the
//     medicine ball held low near the hip... For rotational variations,
//     the body should be positioned side-on or slightly angled to the
//     target area."
//   - Key Technical Cues: "Drive from the hips.", "Scoop through the
//     target.", "Let the legs start the throw.", "Keep the ball close
//     during the load.", "Accelerate through release.", "Do not arm the
//     toss.", "Finish tall and balanced.", "Reset before repeating."
//   - Common Errors (verbatim, abridged): "Arm-Dominant Toss... Excessive
//     Lumbar Extension... Excessive Lumbar Rotation... Inconsistent
//     Release Direction: The ball travels unpredictably. Risk: poor
//     standardization, unsafe rebound... Loss of Balance: The athlete
//     steps or falls uncontrollably after release."
//   - Coaching Priorities: "...Train both sides when applicable. Stop
//     before velocity declines."
//   - Regression Criteria: "...or fatigue reduces output."
//   - Safety Rules: "...Verify the wall or open-space setup... Terminate
//     immediately if sharp pain, dizziness, numbness or sudden weakness
//     occurs."
// Method: power_repetition_sets / power / primary
// -----------------------------------------------------------------------------

const SOURCE_MED_BALL_SCOOP_TOSS = "50-exercises/67_BALLISTICS/13_MED_BALL_SCOOP_TOSS.md";

const medBallScoopTossStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "med_ball_scoop_toss_technical_failure",
    description:
      "Stop the set if the athlete lifts and throws primarily with the arms, arches or rotates through the lower back instead of the hips, or allows the ball to drift away from the body during the load.",
    sourceRuleIds: [SOURCE_MED_BALL_SCOOP_TOSS],
  }),
  velocityLossCondition({
    conditionId: "med_ball_scoop_toss_velocity_loss",
    description: "Stop before velocity declines.",
    sourceRuleIds: [SOURCE_MED_BALL_SCOOP_TOSS],
  }),
  fatigueLimitCondition({
    conditionId: "med_ball_scoop_toss_fatigue_limit",
    description: "Regress or stop the set when fatigue reduces output.",
    sourceRuleIds: [SOURCE_MED_BALL_SCOOP_TOSS],
  }),
  impactLimitCondition({
    conditionId: "med_ball_scoop_toss_impact_limit",
    description: "Stop the set if the ball travels unpredictably, creating an unsafe rebound.",
    sourceRuleIds: [SOURCE_MED_BALL_SCOOP_TOSS],
  }),
  balanceLossCondition({
    conditionId: "med_ball_scoop_toss_balance_loss",
    description: "Stop the set if the athlete steps or falls uncontrollably after release.",
    sourceRuleIds: [SOURCE_MED_BALL_SCOOP_TOSS],
  }),
  painCondition({
    conditionId: "med_ball_scoop_toss_pain",
    description: "Terminate immediately if sharp pain, dizziness, numbness or sudden weakness occurs.",
    sourceRuleIds: [SOURCE_MED_BALL_SCOOP_TOSS],
  }),
  completionCondition({
    conditionId: "med_ball_scoop_toss_completion",
    description: "Stop once the prescribed sets and repetitions per side are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const medBallScoopTossInstructions: InstructionDefinition[] = [
  makeInstruction(
    "med_ball_scoop_toss_setup",
    "setup",
    "Set up in a clear open space, in a stable athletic stance positioned side-on or slightly angled toward the target area, with the medicine ball held low near the hip. This entry covers the Standing Rotational Scoop Toss variant only, prescribed in open space — the bilateral Forward Scoop Toss variant and the wall-directed Lateral Scoop Toss variant are not represented, and repetitions are prescribed per side.",
    "high",
    true,
    SOURCE_MED_BALL_SCOOP_TOSS,
  ),
  makeInstruction(
    "med_ball_scoop_toss_execution",
    "execution",
    "Drive from the hips, scoop through the target, let the legs start the throw, keep the ball close during the load, accelerate through release, do not arm the toss and finish tall and balanced.",
    "high",
    true,
    SOURCE_MED_BALL_SCOOP_TOSS,
  ),
];

const medBallScoopTossEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "med_ball_scoop_toss",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "med_ball_scoop_toss",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["medicine_ball"],
    supportedTempoTypes: ["global_intent"],
    laterality: "unilateral",
    volumeInterpretations: ["repetitions_per_side"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["medicine_ball", "open_space"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["med_ball_scoop_toss_setup", "med_ball_scoop_toss_execution"],
    requiredStopConditionIds: [
      "med_ball_scoop_toss_technical_failure",
      "med_ball_scoop_toss_velocity_loss",
      "med_ball_scoop_toss_fatigue_limit",
      "med_ball_scoop_toss_impact_limit",
      "med_ball_scoop_toss_balance_loss",
      "med_ball_scoop_toss_pain",
      "med_ball_scoop_toss_completion",
    ],
    durationEstimationProfileId: "duration_profile_med_ball_scoop_toss",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_MED_BALL_SCOOP_TOSS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: medBallScoopTossInstructions,
  stopConditionDefinitions: medBallScoopTossStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_MED_BALL_SCOOP_TOSS,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Robustness
// Shared profile: robustness_accessory_straight_sets_v0_1
//   (moduleId: robustness, methodId: straight_sets_repetitions, exerciseRole: accessory)
//   sets 2-3-5, repetitions 10-20-30, RPE 3-5-8, technical_effort: high_quality,
//   rest 45-60-90s, tempo: global_intent/controlled. Every exercise below only
//   narrows this single shared profile via exerciseDoseConstraints /
//   exerciseIntensityConstraints — none of them widen it, none of them create
//   a second profile for the same triplet, and all four keep role: "accessory".
// -----------------------------------------------------------------------------

// Source: 50-exercises/41_TIBIALIS_RAISE
//   - Primary Classification: "Robustness"
//   - Typical Intensity: "Bodyweight to Moderate Load"; Typical Volume:
//     2-5 sets, 12-30 repetitions
//   - Equipment Requirements: Required: None; Optional: Tibialis Machine,
//     Resistance Band, Dumbbell, Slant Board — no single implement is
//     required, so supportedLoadingModes reflects the documented
//     bodyweight-to-loaded continuum ("bodyweight", "added_external_load"),
//     matching the precedent already set by bulgarian_split_squat.
//   - Coaching Cues: "Lift through the front of the ankle.", "Control the
//     lowering phase.", "Maintain full range of motion.", "Avoid
//     compensating with the hips."
//   - Common Errors: Using momentum, incomplete range of motion, externally
//     rotating the feet, rushing repetitions.
// Method: straight_sets_repetitions / robustness / accessory
const SOURCE_TIBIALIS_RAISE = "50-exercises/41_TIBIALIS_RAISE";

const tibialisRaiseStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "tibialis_raise_technical_failure",
    description:
      "The set must stop when momentum replaces controlled ankle dorsiflexion, range of motion becomes incomplete, the feet rotate externally to compensate, repetitions are rushed, or hip compensation replaces ankle control.",
    sourceRuleIds: [SOURCE_TIBIALIS_RAISE],
  }),
  painCondition({
    conditionId: "tibialis_raise_pain",
    description: "The set must stop when pain appears.",
    sourceRuleIds: [SOURCE_TIBIALIS_RAISE],
  }),
  completionCondition({
    conditionId: "tibialis_raise_completion",
    description:
      "The set must not continue merely to reach the planned repetition count; stop once the prescribed work is completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const tibialisRaiseInstructions: InstructionDefinition[] = [
  makeInstruction(
    "tibialis_raise_setup",
    "setup",
    "Stand or sit with the foot flat, ready to lift through the front of the ankle; bodyweight or added resistance (such as a band or dumbbell) may be used if available.",
    "high",
    true,
    SOURCE_TIBIALIS_RAISE,
  ),
  makeInstruction(
    "tibialis_raise_execution",
    "execution",
    "Lift through the front of the ankle, control the lowering phase, maintain full range of motion, and avoid compensating with the hips.",
    "high",
    true,
    SOURCE_TIBIALIS_RAISE,
  ),
  makeInstruction(
    "tibialis_raise_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_TIBIALIS_RAISE,
  ),
];

const tibialisRaiseEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "tibialis_raise",
  moduleId: "robustness",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "tibialis_raise",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["rpe", "technical_effort"],
    supportedLoadingModes: ["bodyweight", "added_external_load"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["tibialis_raise_setup", "tibialis_raise_execution", "tibialis_raise_safety"],
    requiredStopConditionIds: ["tibialis_raise_technical_failure", "tibialis_raise_pain", "tibialis_raise_completion"],
    durationEstimationProfileId: "duration_profile_tibialis_raise",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_TIBIALIS_RAISE, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: "global_intent",
  instructionDefinitions: tibialisRaiseInstructions,
  stopConditionDefinitions: tibialisRaiseStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: null,
    sourceRuleIds: [SOURCE_TIBIALIS_RAISE],
  },
  exerciseIntensityConstraints: {
    allowedIntensityTypes: null,
    rangeConstraints: [{ type: "rpe", minimum: 5, maximum: 8, normal: 6 }],
    sourceRuleIds: [SOURCE_TIBIALIS_RAISE],
  },
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_TIBIALIS_RAISE, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/42_ROTATOR_CUFF_TRAINING
//   - Primary Classification: "Robustness"
//   - Typical Intensity: "Very Light"; Typical Volume: 2-5 sets, 12-25 reps
//   - Equipment Requirements: Required: "Resistance Band or Cable" — no
//     bodyweight-only variant is documented, so requiredEquipmentCapabilities
//     uses the existing cable_or_band_resistance equivalence group (already
//     canonical, already used identically by pallof_press) and
//     supportedLoadingModes is limited to the two modes actually named
//     ("cable", "resistance_band") — no "bodyweight" mode.
//   - Coaching Cues: "Move slowly.", "Keep the elbow controlled.",
//     "Maintain scapular stability.", "Use light resistance.", "Prioritize
//     precision."
//   - Common Errors: Using excessive weight, shrugging the shoulders,
//     losing scapular control, using momentum, poor posture.
// Method: straight_sets_repetitions / robustness / accessory
const SOURCE_ROTATOR_CUFF_TRAINING = "50-exercises/42_ROTATOR_CUFF_TRAINING";

const rotatorCuffTrainingStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "rotator_cuff_training_technical_failure",
    description:
      "The set must stop when excessive weight is used, the shoulders shrug, scapular control is lost, momentum replaces controlled rotation, posture breaks down, or the required shoulder position cannot be maintained.",
    sourceRuleIds: [SOURCE_ROTATOR_CUFF_TRAINING],
  }),
  painCondition({
    conditionId: "rotator_cuff_training_pain",
    description: "The set must stop when pain appears.",
    sourceRuleIds: [SOURCE_ROTATOR_CUFF_TRAINING],
  }),
  completionCondition({
    conditionId: "rotator_cuff_training_completion",
    description:
      "The set must not continue merely to reach the planned repetition count; stop once the prescribed work is completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const rotatorCuffTrainingInstructions: InstructionDefinition[] = [
  makeInstruction(
    "rotator_cuff_training_setup",
    "setup",
    "Attach light resistance (a band or cable) at an appropriate height, keep the elbow close to the body, and set the shoulders in a stable, relaxed position before beginning.",
    "high",
    true,
    SOURCE_ROTATOR_CUFF_TRAINING,
  ),
  makeInstruction(
    "rotator_cuff_training_execution",
    "execution",
    "Move slowly, keep the elbow controlled, maintain scapular stability, use light resistance, and prioritize precision over speed or load.",
    "high",
    true,
    SOURCE_ROTATOR_CUFF_TRAINING,
  ),
  makeInstruction(
    "rotator_cuff_training_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_ROTATOR_CUFF_TRAINING,
  ),
];

const rotatorCuffTrainingEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "rotator_cuff_training",
  moduleId: "robustness",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "rotator_cuff_training",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["rpe", "technical_effort"],
    supportedLoadingModes: ["cable", "resistance_band"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["cable_or_band_resistance"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: [
      "rotator_cuff_training_setup",
      "rotator_cuff_training_execution",
      "rotator_cuff_training_safety",
    ],
    requiredStopConditionIds: [
      "rotator_cuff_training_technical_failure",
      "rotator_cuff_training_pain",
      "rotator_cuff_training_completion",
    ],
    durationEstimationProfileId: "duration_profile_rotator_cuff_training",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_ROTATOR_CUFF_TRAINING, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: "global_intent",
  instructionDefinitions: rotatorCuffTrainingInstructions,
  stopConditionDefinitions: rotatorCuffTrainingStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: null, repetitions: 25, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_ROTATOR_CUFF_TRAINING],
  },
  exerciseIntensityConstraints: {
    allowedIntensityTypes: null,
    rangeConstraints: [{ type: "rpe", minimum: 3, maximum: 6, normal: 4 }],
    sourceRuleIds: [SOURCE_ROTATOR_CUFF_TRAINING],
  },
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_ROTATOR_CUFF_TRAINING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/43_WRIST_STRENGTHENING
//   - Primary Classification: "Robustness"
//   - Typical Intensity: "Very Light"; Typical Volume: 2-5 sets, 10-30
//     repetitions "or 20-45 second holds" — this entry represents the
//     repetitions variant ONLY. The isometric-hold variant is explicitly
//     out of scope and is structurally excluded: this entry only declares
//     explicitMethodId "straight_sets_repetitions" and
//     supportedVolumeStructures ["sets_reps"], never
//     "timed_isometric_sets"/"sets_duration".
//   - Equipment Requirements: Required: None; Optional: Resistance Band,
//     Hammer, Dumbbell, Wrist Roller, Grip Tools, Rice Bucket, Fat Gripz —
//     no single implement required, so supportedLoadingModes reflects the
//     documented bodyweight-to-loaded continuum, matching the precedent
//     already set by bulgarian_split_squat and tibialis_raise above.
//   - Coaching Cues: "Control every repetition.", "Move through full
//     range.", "Avoid compensation.", "Train both sides equally.",
//     "Prioritize quality over resistance."
//   - Common Errors: Using excessive load, partial range of motion,
//     ignoring pain, training only flexion, poor wrist alignment.
// Method: straight_sets_repetitions / robustness / accessory
const SOURCE_WRIST_STRENGTHENING = "50-exercises/43_WRIST_STRENGTHENING";

const wristStrengtheningStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "wrist_strengthening_technical_failure",
    description:
      "The set must stop when load becomes excessive, range of motion becomes partial, wrist alignment breaks down, or one side is trained while neglecting the other.",
    sourceRuleIds: [SOURCE_WRIST_STRENGTHENING],
  }),
  painCondition({
    conditionId: "wrist_strengthening_pain",
    description: "The set must stop when pain appears.",
    sourceRuleIds: [SOURCE_WRIST_STRENGTHENING],
  }),
  completionCondition({
    conditionId: "wrist_strengthening_completion",
    description:
      "The set must not continue merely to reach the planned repetition count; stop once the prescribed work is completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const wristStrengtheningInstructions: InstructionDefinition[] = [
  makeInstruction(
    "wrist_strengthening_setup",
    "setup",
    "Position the wrist and forearm in a stable position for the chosen movement (flexion, extension or deviation); bodyweight or added resistance may be used if available.",
    "high",
    true,
    SOURCE_WRIST_STRENGTHENING,
  ),
  makeInstruction(
    "wrist_strengthening_execution",
    "execution",
    "Control every repetition through the full range of motion, avoid compensation, train both sides equally, and prioritize quality over resistance.",
    "high",
    true,
    SOURCE_WRIST_STRENGTHENING,
  ),
  makeInstruction(
    "wrist_strengthening_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_WRIST_STRENGTHENING,
  ),
];

const wristStrengtheningEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "wrist_strengthening",
  moduleId: "robustness",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "wrist_strengthening",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["rpe", "technical_effort"],
    supportedLoadingModes: ["bodyweight", "added_external_load"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["wrist_strengthening_setup", "wrist_strengthening_execution", "wrist_strengthening_safety"],
    requiredStopConditionIds: [
      "wrist_strengthening_technical_failure",
      "wrist_strengthening_pain",
      "wrist_strengthening_completion",
    ],
    durationEstimationProfileId: "duration_profile_wrist_strengthening",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_WRIST_STRENGTHENING, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: "global_intent",
  instructionDefinitions: wristStrengtheningInstructions,
  stopConditionDefinitions: wristStrengtheningStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: {
    allowedIntensityTypes: null,
    rangeConstraints: [{ type: "rpe", minimum: 3, maximum: 6, normal: 4 }],
    sourceRuleIds: [SOURCE_WRIST_STRENGTHENING],
  },
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_WRIST_STRENGTHENING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/44_SOLEUS_RAISE
//   - Primary Classification: "Robustness"
//   - Typical Intensity: "Moderate"; Typical Volume: 2-5 sets, 15-30 reps
//   - Equipment Requirements: Required: None; Optional: Seated Calf Raise
//     Machine, Smith Machine, Dumbbell, Weight Plate, Resistance Band — no
//     single implement required, so supportedLoadingModes reflects the
//     documented bodyweight-to-loaded continuum, matching the precedent
//     already set by bulgarian_split_squat.
//   - Coaching Cues: "Maintain knee flexion.", "Control the eccentric.",
//     "Reach full plantar flexion.", "Avoid bouncing.", "Use full range of
//     motion."
//   - Common Errors: Straightening the knees, using momentum, incomplete
//     range of motion, excessive loading, poor tempo control.
// Method: straight_sets_repetitions / robustness / accessory
const SOURCE_SOLEUS_RAISE = "50-exercises/44_SOLEUS_RAISE";

const soleusRaiseStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "soleus_raise_technical_failure",
    description:
      "The set must stop when the knees straighten, momentum replaces controlled plantar flexion, range of motion becomes incomplete, load becomes excessive, or tempo control is lost, including bouncing at the bottom of the movement.",
    sourceRuleIds: [SOURCE_SOLEUS_RAISE],
  }),
  painCondition({
    conditionId: "soleus_raise_pain",
    description: "The set must stop when pain appears.",
    sourceRuleIds: [SOURCE_SOLEUS_RAISE],
  }),
  completionCondition({
    conditionId: "soleus_raise_completion",
    description:
      "The set must not continue merely to reach the planned repetition count; stop once the prescribed work is completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const soleusRaiseInstructions: InstructionDefinition[] = [
  makeInstruction(
    "soleus_raise_setup",
    "setup",
    "Stand or sit with the knees flexed as prescribed, ready to control plantar flexion through the full range of motion; bodyweight or added resistance may be used if available.",
    "high",
    true,
    SOURCE_SOLEUS_RAISE,
  ),
  makeInstruction(
    "soleus_raise_execution",
    "execution",
    "Maintain knee flexion, control the eccentric phase, reach full plantar flexion, avoid bouncing, and use the full range of motion.",
    "high",
    true,
    SOURCE_SOLEUS_RAISE,
  ),
  makeInstruction(
    "soleus_raise_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_SOLEUS_RAISE,
  ),
];

const soleusRaiseEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "soleus_raise",
  moduleId: "robustness",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "soleus_raise",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["rpe", "technical_effort"],
    supportedLoadingModes: ["bodyweight", "added_external_load"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["soleus_raise_setup", "soleus_raise_execution", "soleus_raise_safety"],
    requiredStopConditionIds: ["soleus_raise_technical_failure", "soleus_raise_pain", "soleus_raise_completion"],
    durationEstimationProfileId: "duration_profile_soleus_raise",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SOLEUS_RAISE, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: "global_intent",
  instructionDefinitions: soleusRaiseInstructions,
  stopConditionDefinitions: soleusRaiseStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: 15, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: null,
    sourceRuleIds: [SOURCE_SOLEUS_RAISE],
  },
  exerciseIntensityConstraints: {
    allowedIntensityTypes: null,
    rangeConstraints: [{ type: "rpe", minimum: 5, maximum: 8, normal: 6 }],
    sourceRuleIds: [SOURCE_SOLEUS_RAISE],
  },
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_SOLEUS_RAISE, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Force/Tirage — first unblocked sub-lot
// Source: 50-exercises/21_COUNTERMOVEMENT_JUMP
//   - Primary Classification: "Power"
//   - Typical Intensity: "Bodyweight"; Typical Volume: 3-6 sets, 2-5
//     repetitions — a strict superset of the shared profile's own 3-4-5
//     sets / 2-3-5 reps, so the shared profile is used unchanged (no
//     exerciseDoseConstraints).
//   - Equipment Requirements: Required: None — no surface requirement is
//     documented here, unlike broad_jump's own fiche ("Stable non-slip
//     training surface"), so requiredEquipmentCapabilities stays empty:
//     no safe_landing_surface for this exercise specifically.
//   - Coaching Cues: "Move fast.", "Brace before jumping.", "Explode
//     vertically.", "Land softly.", "Absorb force efficiently."
//   - Common Errors: Slow Countermovement, Poor Landing, Excessive Knee
//     Valgus, Incomplete Triple Extension, Loss of Balance.
// Method: power_repetition_sets / power / primary
// Reuses power_primary_repetition_sets_v0_1 unchanged (movement_intent:
// maximal_acceleration matches the fiche's own "Maximum Velocity, Maximum
// Intent... movement velocity is the objective" exactly).
// -----------------------------------------------------------------------------
const SOURCE_COUNTERMOVEMENT_JUMP = "50-exercises/21_COUNTERMOVEMENT_JUMP";

const countermovementJumpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "countermovement_jump_technical_failure",
    description:
      "Stop or regress the set when the countermovement becomes slow, triple extension is incomplete, or the knees collapse inward during take-off or landing.",
    sourceRuleIds: [SOURCE_COUNTERMOVEMENT_JUMP],
  }),
  velocityLossCondition({
    conditionId: "countermovement_jump_velocity_loss",
    description:
      "Stop the set once take-off velocity or jump height becomes visibly reduced — movement velocity is the objective of this exercise.",
    sourceRuleIds: [SOURCE_COUNTERMOVEMENT_JUMP],
  }),
  fatigueLimitCondition({
    conditionId: "countermovement_jump_fatigue_limit",
    description:
      "Stop the exercise once jump height or explosive output declines meaningfully, or neuromuscular readiness appears reduced between repetitions.",
    sourceRuleIds: [SOURCE_COUNTERMOVEMENT_JUMP],
  }),
  impactLimitCondition({
    conditionId: "countermovement_jump_impact_limit",
    description: "Stop the set if landing mechanics become poor or forceful rather than soft and absorbed.",
    sourceRuleIds: [SOURCE_COUNTERMOVEMENT_JUMP],
  }),
  balanceLossCondition({
    conditionId: "countermovement_jump_balance_loss",
    description: "Stop the set if the athlete loses balance on landing.",
    sourceRuleIds: [SOURCE_COUNTERMOVEMENT_JUMP],
  }),
  painCondition({
    conditionId: "countermovement_jump_pain",
    description: "Stop immediately if pain occurs during the countermovement, take-off, flight or landing.",
    sourceRuleIds: [SOURCE_COUNTERMOVEMENT_JUMP],
  }),
  completionCondition({
    conditionId: "countermovement_jump_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const countermovementJumpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "countermovement_jump_setup",
    "setup",
    "Stand tall with feet roughly shoulder-width apart on a stable surface, ready to move directly into the countermovement without hesitation.",
    "high",
    true,
    SOURCE_COUNTERMOVEMENT_JUMP,
  ),
  makeInstruction(
    "countermovement_jump_execution",
    "execution",
    "Move fast: brace before jumping, dip directly into the countermovement, explode vertically through full triple extension, then land softly and absorb force efficiently.",
    "high",
    true,
    SOURCE_COUNTERMOVEMENT_JUMP,
  ),
];

const countermovementJumpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "countermovement_jump",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "countermovement_jump",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["countermovement_jump_setup", "countermovement_jump_execution"],
    requiredStopConditionIds: [
      "countermovement_jump_technical_failure",
      "countermovement_jump_velocity_loss",
      "countermovement_jump_fatigue_limit",
      "countermovement_jump_impact_limit",
      "countermovement_jump_balance_loss",
      "countermovement_jump_pain",
      "countermovement_jump_completion",
    ],
    durationEstimationProfileId: "duration_profile_countermovement_jump",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_COUNTERMOVEMENT_JUMP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: countermovementJumpInstructions,
  stopConditionDefinitions: countermovementJumpStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [
    SOURCE_COUNTERMOVEMENT_JUMP,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
};

// -----------------------------------------------------------------------------
// Source: 50-exercises/19_COPENHAGEN_PLANK
//   - Primary Classification: "Stability" (not a canonical CapabilityModule);
//     Capability Mapping Primary: "Dynamic Stability, Core Stability,
//     Adductor Strength" — Core Stability is explicitly primary. Purpose
//     itself names "groin robustness" — moduleId "core" / role "robustness"
//     reflects the fiche's own language, not analogy with pallof_press.
//   - Movement Context: "Unilateral, Ground Based, Isometric, Bodyweight" —
//     each hold is one side. laterality: "unilateral" with
//     volumeInterpretations: ["duration_per_side"] is required by
//     validateCompatibility's hasResolvedVolumeInterpretation gate for any
//     unilateral exercise, and matches the exact precedent of
//     single_leg_hop. The resolved PrescriptionVolume never carries a
//     "per side" label itself (DurationRule.scope only has
//     "per_set"/"per_round"/"per_interval"/"total") — the per-side meaning
//     lives solely in this declared capability, not in the resolver output.
//   - Typical Volume: "2-4 sets, 15-45 second holds" — sets match
//     timed_isometric_core_robustness_v0_1 exactly (2-4). The documented
//     minimum hold (15s) is above the shared profile's own minimum (10s),
//     so exerciseDoseConstraints narrows durationSeconds up to 15 — the
//     profile's maximum (40s) already sits below the fiche's own ceiling
//     (45s) and is used unchanged (narrowing-only; never widened).
//   - Equipment Requirements: Required: Bench (Optional: Exercise Box, Pad
//     — not represented). Represents the canonical variant only: short
//     lever, unweighted, on a bench — long lever, dynamic, weighted and
//     partner-assisted variants (all documented under Variations/
//     Progressions) are out of scope.
//   - Coaching Cues: "Maintain a straight body line.", "Brace
//     continuously.", "Keep the pelvis level.", "Drive through the
//     supporting leg.", "Breathe normally."
//   - Common Errors: Hip Rotation, Pelvic Drop, Neck Tension, Loss of
//     Alignment, Holding Breath.
// Method: timed_isometric_sets / core / robustness
// Reuses timed_isometric_core_robustness_v0_1 with a single narrowing
// (durationSeconds minimum 15s).
// -----------------------------------------------------------------------------
const SOURCE_COPENHAGEN_PLANK = "50-exercises/19_COPENHAGEN_PLANK";

const copenhagenPlankStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "copenhagen_plank_technical_failure",
    description:
      "Stop the set when the body line is lost, the hips drop, control of the supporting leg is lost, or the position can no longer be maintained.",
    sourceRuleIds: [SOURCE_COPENHAGEN_PLANK],
  }),
  painCondition({
    conditionId: "copenhagen_plank_pain",
    description: "Stop immediately if pain occurs.",
    sourceRuleIds: [SOURCE_COPENHAGEN_PLANK],
  }),
  completionCondition({
    conditionId: "copenhagen_plank_completion",
    description: "Stop once the prescribed sets and hold duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const copenhagenPlankInstructions: InstructionDefinition[] = [
  makeInstruction(
    "copenhagen_plank_setup",
    "setup",
    "Rest the top foot on a bench with the body in a side-lying position, supported on the bottom forearm, with a short lever (bent bottom knee) for the canonical variant.",
    "high",
    true,
    SOURCE_COPENHAGEN_PLANK,
  ),
  makeInstruction(
    "copenhagen_plank_execution",
    "execution",
    "Maintain a straight body line, brace continuously, keep the pelvis level, drive through the supporting leg, and breathe normally throughout the hold.",
    "high",
    true,
    SOURCE_COPENHAGEN_PLANK,
  ),
  makeInstruction(
    "copenhagen_plank_safety",
    "safety",
    "Never force the hold past a loss of body line or pelvic control; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_COPENHAGEN_PLANK,
  ),
];

const copenhagenPlankEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "copenhagen_plank",
  moduleId: "core",
  role: "robustness",
  explicitMethodId: "timed_isometric_sets",
  capabilities: {
    exerciseId: "copenhagen_plank",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["timed_isometric_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["isometric_hold"],
    laterality: "unilateral",
    volumeInterpretations: ["duration_per_side"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["bench"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["copenhagen_plank_setup", "copenhagen_plank_execution", "copenhagen_plank_safety"],
    requiredStopConditionIds: [
      "copenhagen_plank_technical_failure",
      "copenhagen_plank_pain",
      "copenhagen_plank_completion",
    ],
    durationEstimationProfileId: "duration_profile_copenhagen_plank",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_COPENHAGEN_PLANK, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["isometric_hold"],
  preferredTempoType: null,
  instructionDefinitions: copenhagenPlankInstructions,
  stopConditionDefinitions: copenhagenPlankStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 15, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: null,
    sourceRuleIds: [SOURCE_COPENHAGEN_PLANK],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_COPENHAGEN_PLANK, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Force/Tirage — strength_accessory_straight_sets_v0_1 batch
// Shared profile: strength_accessory_straight_sets_v0_1
//   (moduleId: strength, methodId: straight_sets_repetitions, exerciseRole: accessory)
//   sets 2-3-6, repetitions 4-8-15, RPE 6-7-8 only (no rir, no
//   percentage_1rm), rest 90-120-180s, tempo: null. hip_thrust and
//   barbell_row document 60-90% 1RM in their own chapters — this range is
//   acknowledged but deliberately not activated in V0.1 (see
//   34_NUMERICAL_PRESCRIPTION_TABLES.md, Table Group 12, "Documented But
//   Inactive Capability"): resolveVolume and resolveIntensity resolve
//   volume and intensity independently, and a wide repetition range (4-15)
//   combined with a wide percentage_1rm range (60-90%) could produce an
//   incoherent pair (e.g. 15 repetitions at 90% of the one-repetition
//   maximum). No percentage-to-RPE conversion is performed anywhere below.
// -----------------------------------------------------------------------------

// Source: 50-exercises/05_HIP_THRUST
//   - Primary Classification: "Strength"; Typical Intensity: "60-90% 1RM"
//     (documented, not activated — see note above); Typical Volume: 3-6
//     sets, 4-10 repetitions.
//   - Equipment Requirements: Required: Barbell, Bench, Weight Plates.
//   - Coaching Cues: "Brace first.", "Drive through the heels.", "Extend
//     the hips explosively.", "Finish with the glutes.", "Avoid lumbar
//     hyperextension.", "Control the descent."
//   - Common Errors: Lumbar Hyperextension, Insufficient Hip Extension,
//     Bouncing the Bar.
// Method: straight_sets_repetitions / strength / accessory
const SOURCE_HIP_THRUST = "50-exercises/05_HIP_THRUST";

const hipThrustStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "hip_thrust_technical_failure",
    description:
      "Stop the set when lumbar hyperextension occurs, hip extension is incomplete at the top, or the bar bounces or is not controlled through the range of motion.",
    sourceRuleIds: [SOURCE_HIP_THRUST],
  }),
  painCondition({
    conditionId: "hip_thrust_pain",
    description: "Stop immediately if pain occurs.",
    sourceRuleIds: [SOURCE_HIP_THRUST],
  }),
  completionCondition({
    conditionId: "hip_thrust_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const hipThrustInstructions: InstructionDefinition[] = [
  makeInstruction(
    "hip_thrust_setup",
    "setup",
    "Position the upper back across a bench with the barbell over the hips, feet planted flat and shoulder-width apart.",
    "high",
    true,
    SOURCE_HIP_THRUST,
  ),
  makeInstruction(
    "hip_thrust_execution",
    "execution",
    "Brace first, drive through the heels, extend the hips explosively, finish with the glutes, avoid lumbar hyperextension, and control the descent.",
    "high",
    true,
    SOURCE_HIP_THRUST,
  ),
  makeInstruction(
    "hip_thrust_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_HIP_THRUST,
  ),
];

const hipThrustEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "hip_thrust",
  moduleId: "strength",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "hip_thrust",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "bench", "plates"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["hip_thrust_setup", "hip_thrust_execution", "hip_thrust_safety"],
    requiredStopConditionIds: ["hip_thrust_technical_failure", "hip_thrust_pain", "hip_thrust_completion"],
    durationEstimationProfileId: "duration_profile_hip_thrust",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_HIP_THRUST, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: hipThrustInstructions,
  stopConditionDefinitions: hipThrustStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 6, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_HIP_THRUST],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_HIP_THRUST, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/11_CHIN_UP
//   - Primary Classification: "Strength"; Typical Intensity: "Bodyweight";
//     Typical Volume: 2-6 sets, 4-15 repetitions — matches the shared
//     profile's own envelope exactly, so no exerciseDoseConstraints.
//   - Equipment Requirements: Required: Pull-Up Bar only. The loaded
//     variant is a distinct, separately documented exercise
//     (weighted_pull_up) — not represented here.
//   - Coaching Cues: "Initiate with the scapula.", "Brace the trunk.",
//     "Lead with the chest.", "Pull the elbows toward the ribs.",
//     "Control the descent."
//   - Common Errors: Partial Range of Motion, Shrugged Shoulders, Swinging,
//     Forward Head Position, Loss of Scapular Control, Incomplete Elbow
//     Extension.
// Method: straight_sets_repetitions / strength / accessory
const SOURCE_CHIN_UP = "50-exercises/11_CHIN_UP";

const chinUpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "chin_up_technical_failure",
    description:
      "Stop the set when range of motion becomes incomplete, swinging or kipping replaces controlled pulling, or scapular control is lost.",
    sourceRuleIds: [SOURCE_CHIN_UP],
  }),
  painCondition({
    conditionId: "chin_up_pain",
    description: "Stop immediately if pain occurs.",
    sourceRuleIds: [SOURCE_CHIN_UP],
  }),
  completionCondition({
    conditionId: "chin_up_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const chinUpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "chin_up_setup",
    "setup",
    "Grip the pull-up bar with a supinated grip and hang with the arms fully extended before initiating the pull.",
    "high",
    true,
    SOURCE_CHIN_UP,
  ),
  makeInstruction(
    "chin_up_execution",
    "execution",
    "Initiate with the scapula, brace the trunk, lead with the chest, pull the elbows toward the ribs, and control the descent.",
    "high",
    true,
    SOURCE_CHIN_UP,
  ),
  makeInstruction(
    "chin_up_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_CHIN_UP,
  ),
];

const chinUpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "chin_up",
  moduleId: "strength",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "chin_up",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["pull_up_bar"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["chin_up_setup", "chin_up_execution", "chin_up_safety"],
    requiredStopConditionIds: ["chin_up_technical_failure", "chin_up_pain", "chin_up_completion"],
    durationEstimationProfileId: "duration_profile_chin_up",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_CHIN_UP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: chinUpInstructions,
  stopConditionDefinitions: chinUpStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_CHIN_UP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/12_BARBELL_ROW
//   - Primary Classification: "Strength"; Typical Intensity: "60-90% 1RM"
//     (documented, not activated — see note above); Typical Volume: 3-6
//     sets, 5-12 repetitions.
//   - Equipment Requirements: Required: Barbell, Weight Plates (no rack —
//     lifted from the floor).
//   - Coaching Cues: "Brace before pulling.", "Maintain the hip hinge.",
//     "Pull the elbows toward the hips.", "Squeeze the shoulder blades.",
//     "Control the lowering phase.", "Avoid excessive torso movement."
//   - Common Errors: Lumbar Flexion, Using Momentum, Incomplete Range of
//     Motion, Shoulder Shrugging, Early Trunk Extension, Poor Scapular
//     Retraction.
// Method: straight_sets_repetitions / strength / accessory
const SOURCE_BARBELL_ROW = "50-exercises/12_BARBELL_ROW";

const barbellRowStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "barbell_row_technical_failure",
    description:
      "Stop the set when lumbar flexion occurs, momentum replaces controlled pulling, or scapular retraction and trunk position are lost.",
    sourceRuleIds: [SOURCE_BARBELL_ROW],
  }),
  painCondition({
    conditionId: "barbell_row_pain",
    description: "Stop immediately if pain occurs.",
    sourceRuleIds: [SOURCE_BARBELL_ROW],
  }),
  completionCondition({
    conditionId: "barbell_row_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const barbellRowInstructions: InstructionDefinition[] = [
  makeInstruction(
    "barbell_row_setup",
    "setup",
    "Hinge at the hips to grip the barbell, brace the trunk, and set a stable hip-hinge position before pulling.",
    "high",
    true,
    SOURCE_BARBELL_ROW,
  ),
  makeInstruction(
    "barbell_row_execution",
    "execution",
    "Brace before pulling, maintain the hip hinge, pull the elbows toward the hips, squeeze the shoulder blades, and control the lowering phase.",
    "high",
    true,
    SOURCE_BARBELL_ROW,
  ),
  makeInstruction(
    "barbell_row_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_BARBELL_ROW,
  ),
];

const barbellRowEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "barbell_row",
  moduleId: "strength",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "barbell_row",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "plates"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["barbell_row_setup", "barbell_row_execution", "barbell_row_safety"],
    requiredStopConditionIds: ["barbell_row_technical_failure", "barbell_row_pain", "barbell_row_completion"],
    durationEstimationProfileId: "duration_profile_barbell_row",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_BARBELL_ROW, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: barbellRowInstructions,
  stopConditionDefinitions: barbellRowStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 6, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_BARBELL_ROW],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_BARBELL_ROW, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Registry Lot 1 — Strength immediate
// Shared profile: strength_accessory_straight_sets_v0_1 (chest_supported_row,
// dip, landmine_press, neck_training, nordic_hamstring_curl) plus
// strength_primary_straight_sets_v0_1 (weighted_pull_up).
// All six exercises are module="strength" in the exercise knowledge base
// (confirmed directly, not assumed — neck_training and nordic_hamstring_curl
// are "strength" in the KB, unlike their robustness-chapter cousins
// tibialis_raise/soleus_raise/rotator_cuff_training/wrist_strengthening,
// which are KB module="robustness" and use the separate
// robustness_accessory_straight_sets_v0_1 profile instead — the registry's
// moduleId mirrors the KB's own module field faithfully in every case,
// exactly as it already does for barbell_row/chin_up/hip_thrust).
// None of the six re-encodes any eligibility/requirements-layer decision
// already owned by exerciseKnowledgeBase.ts — human_assistance, any_of
// equipment alternatives and environment capabilities stay exclusively in
// the Exercise Requirements Model; the registry only ever describes how a
// prescription is dosed once the exercise is already known to be eligible.
// -----------------------------------------------------------------------------

// Source: 50-exercises/13_CHEST_SUPPORTED_ROW
//   - Primary Classification: "Strength"; Typical Intensity: "60-90% 1RM
//     Equivalent" (documented, not activated — same Table Group 12
//     precedent as hip_thrust/barbell_row: resolveVolume and
//     resolveIntensity resolve independently, and a wide repetition range
//     combined with a wide percentage range could produce an incoherent
//     pair); Typical Volume: 3-6 sets, 6-15 repetitions.
//   - Equipment Requirements: Required: Incline Bench, Dumbbells or
//     Barbell or Machine. `requiredEquipmentCapabilities` therefore holds
//     only "bench" (the one unconditionally required item); the
//     interchangeable dumbbell/barbell/machine choice is represented
//     honestly through `supportedLoadingModes` instead of an invented
//     equivalence-group capability id, since LoadingMode already exists
//     precisely for "which of several loading approaches is supported"
//     without turning an "or" into an "and".
//   - Coaching Cues: "Brace lightly.", "Pull through the elbows.",
//     "Squeeze the shoulder blades.", "Avoid shrugging.", "Control the
//     lowering phase."
//   - Common Errors: Using Momentum, Incomplete Retraction, Forward Head
//     Position, Partial Range of Motion.
//   - Safety Profile Primary Risks: Incomplete Range of Motion, Poor
//     Scapular Control, Excessive Neck Extension.
//   - Contraindications: Acute Shoulder Injury, Pain During Horizontal
//     Pulling.
// Method: straight_sets_repetitions / strength / accessory
//   (strength_accessory_straight_sets_v0_1 — sets 2/3/6, reps 4/8/15, RPE
//   6/7/8, rest 90/120/180s, tempo null). Narrowed: sets minimum 3 (up
//   from the profile's own floor of 2, matching the fiche's own "3-6
//   sets"); repetitions minimum 6 (up from the profile's own floor of 4,
//   matching the fiche's own "6-15 repetitions"); both maxima already
//   equal the profile's own ceiling and are restated explicitly for
//   clarity, not widened.
const SOURCE_CHEST_SUPPORTED_ROW = "50-exercises/13_CHEST_SUPPORTED_ROW";

const chestSupportedRowStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "chest_supported_row_technical_failure",
    description:
      "Stop the set when momentum replaces controlled pulling, retraction becomes incomplete, the head moves into a forward or extended position, or the range of motion becomes partial.",
    sourceRuleIds: [SOURCE_CHEST_SUPPORTED_ROW],
  }),
  painCondition({
    conditionId: "chest_supported_row_pain",
    description: "Stop immediately if pain occurs, including pain during horizontal pulling, or in the presence of an acute shoulder injury.",
    sourceRuleIds: [SOURCE_CHEST_SUPPORTED_ROW],
  }),
  completionCondition({
    conditionId: "chest_supported_row_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const chestSupportedRowInstructions: InstructionDefinition[] = [
  makeInstruction(
    "chest_supported_row_setup",
    "setup",
    "Set the incline bench and select a dumbbell, barbell or machine implement before beginning; a dedicated chest-supported-row machine or a cable machine may be used if available.",
    "high",
    true,
    SOURCE_CHEST_SUPPORTED_ROW,
  ),
  makeInstruction(
    "chest_supported_row_execution",
    "execution",
    "Brace lightly, pull through the elbows, squeeze the shoulder blades, avoid shrugging, and control the lowering phase.",
    "high",
    true,
    SOURCE_CHEST_SUPPORTED_ROW,
  ),
  makeInstruction(
    "chest_supported_row_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_CHEST_SUPPORTED_ROW,
  ),
];

const chestSupportedRowEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "chest_supported_row",
  moduleId: "strength",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "chest_supported_row",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["dumbbell", "barbell", "machine"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["bench"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["chest_supported_row_setup", "chest_supported_row_execution", "chest_supported_row_safety"],
    requiredStopConditionIds: [
      "chest_supported_row_technical_failure",
      "chest_supported_row_pain",
      "chest_supported_row_completion",
    ],
    durationEstimationProfileId: "duration_profile_chest_supported_row",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_CHEST_SUPPORTED_ROW, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: chestSupportedRowInstructions,
  stopConditionDefinitions: chestSupportedRowStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 6, repetitions: 15, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_CHEST_SUPPORTED_ROW],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_CHEST_SUPPORTED_ROW, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/14_DIP
//   - Primary Classification: "Strength"; Typical Intensity: "Bodyweight
//     or Bodyweight + External Load" (no percentage-of-maximum table
//     documented at all — RPE only, matching the same no-invented-charge
//     approach already used for pull_up/chin_up/bulgarian_split_squat);
//     Typical Volume: 3-6 sets, 3-12 repetitions.
//   - Equipment Requirements: Required: Parallel Bars. Optional: Dip
//     Belt, Weighted Vest, Gymnastic Rings, Resistance Bands.
//     `requiredEquipmentCapabilities` holds only "dip_bars" — a new,
//     minimal capability id added to `equipmentCapabilities.ts` for this
//     lot (see that file's own comment), aligned 1:1 with the knowledge
//     base's own distinct `EquipmentType` member of the same name. The
//     Dip Belt is never made required here — it is Optional in the
//     fiche's own Equipment Requirements, and only appears below inside
//     the setup instruction text as a documented progression, never as a
//     gate.
//   - Coaching Cues: "Brace the trunk.", "Keep the shoulders packed.",
//     "Descend under control.", "Press explosively.", "Finish with full
//     elbow extension."
//   - Common Errors: Shoulder Shrugging, Excessive Depth, Forward Head
//     Position, Loss of Body Tension, Incomplete Lockout, Swinging.
//   - Safety Profile Primary Risks: Excessive Shoulder Extension,
//     Anterior Shoulder Pain, Loss of Scapular Control, Incomplete
//     Stability.
//   - Contraindications: Acute Shoulder Injury, Acute Elbow Injury, Pain
//     During Dips, Severe Shoulder Instability.
// Method: straight_sets_repetitions / strength / accessory
//   Narrowed: sets minimum 3 (up from the profile's own floor of 2,
//   matching "3-6 sets"); repetitions maximum 12 (down from the
//   profile's own ceiling of 15, matching "3-12 repetitions"). The
//   fiche's own repetition floor of 3 is BELOW the shared profile's own
//   floor of 4 — a dose constraint can only narrow within the profile's
//   existing bounds, never widen below it, so the effective minimum stays
//   at the profile's own 4, a documented, honest limitation rather than a
//   fabricated 3.
const SOURCE_DIP = "50-exercises/14_DIP";

const dipStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "dip_technical_failure",
    description:
      "Stop the set when the shoulders shrug, depth becomes excessive, the head moves forward, body tension is lost, lockout becomes incomplete, or swinging appears.",
    sourceRuleIds: [SOURCE_DIP],
  }),
  painCondition({
    conditionId: "dip_pain",
    description: "Stop immediately if pain occurs during dips, or in the presence of an acute shoulder or elbow injury, or severe shoulder instability.",
    sourceRuleIds: [SOURCE_DIP],
  }),
  completionCondition({
    conditionId: "dip_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const dipInstructions: InstructionDefinition[] = [
  makeInstruction(
    "dip_setup",
    "setup",
    "Set up at the parallel bars; bodyweight is the base loading, with a dip belt, weighted vest or resistance band added only once strict bodyweight dips are mastered.",
    "high",
    true,
    SOURCE_DIP,
  ),
  makeInstruction(
    "dip_execution",
    "execution",
    "Brace the trunk, keep the shoulders packed, descend under control, press explosively, and finish with full elbow extension.",
    "high",
    true,
    SOURCE_DIP,
  ),
  makeInstruction(
    "dip_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_DIP,
  ),
];

const dipEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "dip",
  moduleId: "strength",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "dip",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["bodyweight", "added_external_load"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["dip_bars"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["dip_setup", "dip_execution", "dip_safety"],
    requiredStopConditionIds: ["dip_technical_failure", "dip_pain", "dip_completion"],
    durationEstimationProfileId: "duration_profile_dip",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_DIP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: dipInstructions,
  stopConditionDefinitions: dipStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 6, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_DIP],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_DIP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/26_LANDMINE_PRESS
//   - Primary Classification: "Strength"; Typical Intensity: "40-80%
//     Estimated Maximum" (documented, not activated — same Table Group
//     12 precedent as hip_thrust/barbell_row/chest_supported_row above);
//     Typical Volume: 3-6 sets, 4-10 repetitions.
//   - Equipment Requirements: Required: Barbell, Landmine Attachment.
//     `requiredEquipmentCapabilities` holds only "barbell" — "Landmine
//     Attachment" has no dedicated id in the closed prescription
//     vocabulary, and the knowledge base itself has no dedicated
//     `EquipmentType` for it either (it uses the flagged `"other"`
//     placeholder in `LANDMINE_PRESS`'s own `ExerciseDefinition`) — a new
//     capability id is deliberately NOT added here, unlike `dip_bars`
//     above, because doing so would claim more precision than even the
//     knowledge base itself claims. This is an accepted, documented
//     precision loss, not an oversight.
//   - Movement Context: "Unilateral or Bilateral" — the knowledge base's
//     own `ExerciseDefinition` resolves this to `unilateral: false`
//     (bilateral as the default form); this registry entry matches that
//     resolution rather than contradicting it.
//   - Coaching Cues: "Brace first.", "Drive from the legs.", "Press
//     diagonally.", "Reach naturally.", "Control the lowering phase."
//   - Common Errors: Lumbar Extension, Shrugging, Loss of Balance,
//     Pressing Only With the Arm, Incomplete Core Engagement.
//   - Safety Profile Primary Risks: Poor Trunk Stability, Lumbar
//     Hyperextension, Poor Foot Position.
//   - Contraindications: Acute Shoulder Injury, Acute Elbow Injury, Pain
//     During Pressing.
// Method: straight_sets_repetitions / strength / accessory
//   Narrowed: sets minimum 3 (up from 2, matching "3-6 sets");
//   repetitions maximum 10 (down from 15, matching "4-10 repetitions");
//   the repetitions minimum already equals the profile's own floor of 4.
const SOURCE_LANDMINE_PRESS = "50-exercises/26_LANDMINE_PRESS";

const landminePressStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "landmine_press_technical_failure",
    description:
      "Stop the set when lumbar extension or hyperextension appears, the shoulders shrug, balance is lost, the arm presses in isolation without leg and trunk drive, or core engagement becomes incomplete.",
    sourceRuleIds: [SOURCE_LANDMINE_PRESS],
  }),
  painCondition({
    conditionId: "landmine_press_pain",
    description: "Stop immediately if pain occurs during pressing, or in the presence of an acute shoulder or elbow injury.",
    sourceRuleIds: [SOURCE_LANDMINE_PRESS],
  }),
  completionCondition({
    conditionId: "landmine_press_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const landminePressInstructions: InstructionDefinition[] = [
  makeInstruction(
    "landmine_press_setup",
    "setup",
    "Anchor the barbell in the landmine attachment and set a stable standing base before pressing, bilateral or unilateral as prescribed.",
    "high",
    true,
    SOURCE_LANDMINE_PRESS,
  ),
  makeInstruction(
    "landmine_press_execution",
    "execution",
    "Brace first, drive from the legs, press diagonally along the barbell's natural path, reach naturally, and control the lowering phase.",
    "high",
    true,
    SOURCE_LANDMINE_PRESS,
  ),
  makeInstruction(
    "landmine_press_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown.",
    "high",
    true,
    SOURCE_LANDMINE_PRESS,
  ),
];

const landminePressEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "landmine_press",
  moduleId: "strength",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "landmine_press",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["landmine_press_setup", "landmine_press_execution", "landmine_press_safety"],
    requiredStopConditionIds: ["landmine_press_technical_failure", "landmine_press_pain", "landmine_press_completion"],
    durationEstimationProfileId: "duration_profile_landmine_press",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_LANDMINE_PRESS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: landminePressInstructions,
  stopConditionDefinitions: landminePressStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 6, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_LANDMINE_PRESS],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_LANDMINE_PRESS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/09_WEIGHTED_PULL_UP
//   - Primary Classification: "Strength"; Typical Intensity: "Bodyweight
//     + 5-60 kg" (a raw kilogram range, never a percentage-of-maximum
//     table) — matching the same no-invented-charge approach already
//     used for pull_up/chin_up/bulgarian_split_squat, `percentage_1rm` is
//     deliberately excluded from this entry's own active intensity types
//     via `exerciseIntensityConstraints.allowedIntensityTypes`, even
//     though the shared profile documents it; Typical Volume: 3-6 sets,
//     2-8 repetitions.
//   - Equipment Requirements: Required: Pull-Up Bar, Dip Belt, Weight
//     Plates. `requiredEquipmentCapabilities` holds "pull_up_bar" and
//     "plates" — the two items with an honest existing capability id.
//     "Dip Belt" (the harness that attaches the plates) has no dedicated
//     id, matching the same accepted-precision-loss treatment as
//     `landmine_press`'s own "Landmine Attachment" above, and matching
//     the knowledge base's own identical treatment (`"other"` flagged
//     placeholder for "Dip Belt" in `WEIGHTED_PULL_UP`'s own
//     `ExerciseDefinition`).
//   - Coaching Cues: "Brace before pulling.", "Initiate with the
//     scapula.", "Pull the elbows toward the ribs.", "Maintain body
//     tension.", "Control the descent.", "Avoid swinging."
//   - Common Errors: Incomplete Range of Motion, Forward Head Position,
//     Excessive Swing, Loss of Scapular Control, Kipping, Grip Failure.
//   - Safety Profile Primary Risks: Shoulder Irritation, Grip Failure,
//     Incomplete Scapular Control, Excessive Swing.
//   - Contraindications: Acute Shoulder Injury, Acute Elbow Injury, Acute
//     Wrist Injury, Pain During Vertical Pulling.
// Method: straight_sets_repetitions / strength / primary
//   (strength_primary_straight_sets_v0_1 — sets 2/3/4, reps 3/5/6,
//   percentage_1rm 80/85/90, RPE 7.5/8/9, RIR 1/2/3, rest 180/180/300s,
//   tempo phase_intent/maximal_safe_speed). Role "primary" mirrors
//   `pull_up`'s own identical resolution (weighted_pull_up is literally
//   pull_up plus external load). Narrowed: sets minimum 3 (up from the
//   profile's own floor of 2, matching "3-6 sets"); the fiche's own
//   ceiling of 6 sets and 8 repetitions both exceed the shared profile's
//   own ceiling (4 sets, 6 repetitions) — a dose constraint can never
//   widen a shared profile, so both maxima stay at the profile's own
//   ceiling, a documented, honest limitation rather than a fabricated
//   wider range. Repetitions minimum likewise stays at the profile's own
//   floor of 3 (the fiche's own floor of 2 is below it).
const SOURCE_WEIGHTED_PULL_UP = "50-exercises/09_WEIGHTED_PULL_UP";

const weightedPullUpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "weighted_pull_up_technical_failure",
    description:
      "Stop the set when the range of motion becomes incomplete, the head moves forward, swinging or kipping appears, or scapular control is lost.",
    sourceRuleIds: [SOURCE_WEIGHTED_PULL_UP],
  }),
  painCondition({
    conditionId: "weighted_pull_up_pain",
    description: "Stop immediately if pain occurs during vertical pulling, or in the presence of an acute shoulder, elbow or wrist injury.",
    sourceRuleIds: [SOURCE_WEIGHTED_PULL_UP],
  }),
  completionCondition({
    conditionId: "weighted_pull_up_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const weightedPullUpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "weighted_pull_up_setup",
    "setup",
    "Attach the additional load via a dip belt and weight plates before mounting the pull-up bar; the athlete should first demonstrate strict bodyweight pull-ups before adding external load.",
    "high",
    true,
    SOURCE_WEIGHTED_PULL_UP,
  ),
  makeInstruction(
    "weighted_pull_up_execution",
    "execution",
    "Brace before pulling, initiate with the scapula, pull the elbows toward the ribs, maintain body tension, control the descent, and avoid swinging.",
    "high",
    true,
    SOURCE_WEIGHTED_PULL_UP,
  ),
  makeInstruction(
    "weighted_pull_up_safety",
    "safety",
    "Never force a repetition to muscular failure; stop at the first sign of technical breakdown or grip failure.",
    "high",
    true,
    SOURCE_WEIGHTED_PULL_UP,
  ),
];

const weightedPullUpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "weighted_pull_up",
  moduleId: "strength",
  role: "primary",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "weighted_pull_up",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe", "rir"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["bodyweight", "added_external_load"],
    supportedTempoTypes: ["phase_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["pull_up_bar", "plates"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["weighted_pull_up_setup", "weighted_pull_up_execution", "weighted_pull_up_safety"],
    requiredStopConditionIds: [
      "weighted_pull_up_technical_failure",
      "weighted_pull_up_pain",
      "weighted_pull_up_completion",
    ],
    durationEstimationProfileId: "duration_profile_weighted_pull_up",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_WEIGHTED_PULL_UP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "rir"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["phase_intent"],
  preferredTempoType: null,
  instructionDefinitions: weightedPullUpInstructions,
  stopConditionDefinitions: weightedPullUpStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 4, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_WEIGHTED_PULL_UP],
  },
  exerciseIntensityConstraints: {
    allowedIntensityTypes: ["rpe", "rir"],
    rangeConstraints: [],
    sourceRuleIds: [SOURCE_WEIGHTED_PULL_UP],
  },
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_WEIGHTED_PULL_UP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/34_NECK_TRAINING
//   - Primary Classification: "Strength"; Typical Intensity: "Low to
//     Moderate"; Typical Volume: "2-5 sets, 10-20 repetitions OR 10-45
//     second holds" — a dual rep/isometric-hold fiche. Only the
//     repetition structure is modeled here (`straight_sets_repetitions`);
//     the isometric-hold alternative is a genuine, documented but
//     unmodeled variant, not silently dropped — flagged in the final
//     report rather than requiring a second method/contract.
//   - Movement Pattern Secondary: "Flexion, Extension, Lateral Flexion,
//     Rotation, Anti-Rotation" — no single default direction is named
//     anywhere in the fiche. Per the user's own instruction, this
//     direction/variant selection is encoded in the setup instruction
//     text below, not as a new capability or contract: a generic
//     "neck_training" entry stays honest by requiring the athlete/coach
//     to pick one documented direction per set, rather than silently
//     assuming one.
//   - Equipment Requirements: Required: None. `requiredEquipmentCapabilities`
//     is genuinely empty — Neck Harness/Resistance Bands/Partner/Weight
//     Plate/Neck Machine are all Optional.
//   - Coaching Cues: "Maintain neutral alignment.", "Move under
//     control.", "Brace the trunk.", "Breathe continuously.", "Stop
//     immediately if symptoms appear."
//   - Common Errors: Using excessive resistance, Fast uncontrolled
//     movements, Compensating with the torso, Holding the breath,
//     Ignoring pain.
//   - Contraindications: Acute Cervical Injury, Acute Concussion,
//     Cervical Disc Pathology, Medical Clearance Required.
// Method: straight_sets_repetitions / strength / accessory
//   Narrowed: sets maximum 5 (down from the profile's own ceiling of 6,
//   matching "2-5 sets"; the minimum already equals the profile's own
//   floor of 2); repetitions minimum 10 (up from the profile's own floor
//   of 4, matching "10-20 repetitions"). The fiche's own repetition
//   ceiling of 20 EXCEEDS the shared profile's own ceiling of 15 — a
//   dose constraint can never widen a shared profile, so the maximum
//   stays at the profile's own 15, a documented, honest limitation.
//   Intensity: the shared profile's own RPE floor (6) is higher than the
//   fiche's own "Low to Moderate" framing for a cervical exercise — this
//   registry entry pins the effective RPE range to the most conservative
//   position achievable within the shared profile's own bounds (6-7,
//   normal 6) rather than fabricating a value below the profile's own
//   floor, and this tension is flagged explicitly in the final report.
const SOURCE_NECK_TRAINING = "50-exercises/34_NECK_TRAINING";

const neckTrainingStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "neck_training_technical_failure",
    description:
      "Stop the set when excessive resistance is used, movements become fast or uncontrolled, the torso compensates for the neck, or the breath is held.",
    sourceRuleIds: [SOURCE_NECK_TRAINING],
  }),
  painCondition({
    conditionId: "neck_training_pain",
    description:
      "Stop immediately if any symptom appears, or in the presence of an acute cervical injury, acute concussion, cervical disc pathology, or when medical clearance has not been granted.",
    sourceRuleIds: [SOURCE_NECK_TRAINING],
  }),
  completionCondition({
    conditionId: "neck_training_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const neckTrainingInstructions: InstructionDefinition[] = [
  makeInstruction(
    "neck_training_setup",
    "setup",
    "Select a single cervical direction for the set — flexion, extension, lateral flexion or rotation — before beginning; no equipment is required, and a neck harness, resistance band, partner or weight plate may be added if available.",
    "high",
    true,
    SOURCE_NECK_TRAINING,
  ),
  makeInstruction(
    "neck_training_execution",
    "execution",
    "Maintain neutral alignment, move under control, brace the trunk, and breathe continuously throughout.",
    "high",
    true,
    SOURCE_NECK_TRAINING,
  ),
  makeInstruction(
    "neck_training_safety",
    "safety",
    "Stop immediately if any symptom appears; never train through cervical pain.",
    "high",
    true,
    SOURCE_NECK_TRAINING,
  ),
];

const neckTrainingEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "neck_training",
  moduleId: "strength",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "neck_training",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["bodyweight", "added_external_load", "partner_resistance"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["neck_training_setup", "neck_training_execution", "neck_training_safety"],
    requiredStopConditionIds: ["neck_training_technical_failure", "neck_training_pain", "neck_training_completion"],
    durationEstimationProfileId: "duration_profile_neck_training",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_NECK_TRAINING, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: neckTrainingInstructions,
  stopConditionDefinitions: neckTrainingStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 2, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 5, repetitions: 15, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_NECK_TRAINING],
  },
  exerciseIntensityConstraints: {
    allowedIntensityTypes: null,
    rangeConstraints: [{ type: "rpe", minimum: 6, maximum: 7, normal: 6 }],
    sourceRuleIds: [SOURCE_NECK_TRAINING],
  },
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_NECK_TRAINING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/18_NORDIC_HAMSTRING_CURL
//   - Primary Classification: "Strength"; Typical Intensity: "Bodyweight
//     or Assisted Bodyweight" (no percentage-of-maximum table); Typical
//     Volume: 2-5 sets, 3-8 repetitions.
//   - Equipment Requirements: Required: Nordic Bench OR Partner
//     Assistance. `requiredEquipmentCapabilities` is deliberately empty
//     — this any_of alternative (Nordic bench vs. partner) is already
//     the exercise's own eligibility gate inside
//     `exerciseKnowledgeBase.ts`'s Requirements Model (an `other`/
//     `human_assistance: partner` any_of clause), and is not re-encoded
//     here, per the explicit boundary between eligibility (knowledge
//     base) and prescription (this registry).
//   - Coaching Cues: "Maintain a straight line from knees to shoulders.",
//     "Brace continuously.", "Control the descent.", "Resist gravity for
//     as long as possible.", "Avoid hip flexion."
//   - Common Errors: Breaking at the hips, Falling too quickly,
//     Incomplete range of motion, Poor trunk stability, Excessive lumbar
//     extension.
//   - Safety Profile Primary Risks: Excessive Initial Volume, Poor Hip
//     Position, Uncontrolled Descent.
//   - Contraindications: Acute Hamstring Injury, Acute Knee Injury, Pain
//     During Knee Flexion.
// Method: straight_sets_repetitions / strength / accessory
//   Narrowed: sets maximum 5 (down from 6, matching "2-5 sets"; minimum
//   already equals the profile's own floor of 2); repetitions maximum 8
//   (down from 15, matching "3-8 repetitions"). The fiche's own
//   repetition floor of 3 is below the shared profile's own floor of 4 —
//   the effective minimum stays at the profile's own 4, a documented,
//   honest limitation rather than a fabricated 3.
const SOURCE_NORDIC_HAMSTRING_CURL = "50-exercises/18_NORDIC_HAMSTRING_CURL";

const nordicHamstringCurlStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "nordic_hamstring_curl_technical_failure",
    description:
      "Stop the set when the hips break, the descent becomes uncontrolled or too fast, the range of motion is incomplete, trunk stability is lost, or excessive lumbar extension appears.",
    sourceRuleIds: [SOURCE_NORDIC_HAMSTRING_CURL],
  }),
  painCondition({
    conditionId: "nordic_hamstring_curl_pain",
    description: "Stop immediately if pain occurs during knee flexion, or in the presence of an acute hamstring or knee injury.",
    sourceRuleIds: [SOURCE_NORDIC_HAMSTRING_CURL],
  }),
  completionCondition({
    conditionId: "nordic_hamstring_curl_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const nordicHamstringCurlInstructions: InstructionDefinition[] = [
  makeInstruction(
    "nordic_hamstring_curl_setup",
    "setup",
    "Kneel with the ankles secured by a Nordic bench or held firmly by a partner before beginning.",
    "high",
    true,
    SOURCE_NORDIC_HAMSTRING_CURL,
  ),
  makeInstruction(
    "nordic_hamstring_curl_execution",
    "execution",
    "Maintain a straight line from knees to shoulders, brace continuously, control the descent, resist gravity for as long as possible, and avoid hip flexion.",
    "high",
    true,
    SOURCE_NORDIC_HAMSTRING_CURL,
  ),
  makeInstruction(
    "nordic_hamstring_curl_safety",
    "safety",
    "Beginners should use assistance until full eccentric control is achieved; never force the descent.",
    "high",
    true,
    SOURCE_NORDIC_HAMSTRING_CURL,
  ),
];

const nordicHamstringCurlEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "nordic_hamstring_curl",
  moduleId: "strength",
  role: "accessory",
  explicitMethodId: "straight_sets_repetitions",
  capabilities: {
    exerciseId: "nordic_hamstring_curl",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    supportedLoadingModes: ["bodyweight", "assisted_bodyweight"],
    supportedTempoTypes: [],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["nordic_hamstring_curl_setup", "nordic_hamstring_curl_execution", "nordic_hamstring_curl_safety"],
    requiredStopConditionIds: [
      "nordic_hamstring_curl_technical_failure",
      "nordic_hamstring_curl_pain",
      "nordic_hamstring_curl_completion",
    ],
    durationEstimationProfileId: "duration_profile_nordic_hamstring_curl",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_NORDIC_HAMSTRING_CURL, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: nordicHamstringCurlInstructions,
  stopConditionDefinitions: nordicHamstringCurlStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 2, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 5, repetitions: 8, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_NORDIC_HAMSTRING_CURL],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_NORDIC_HAMSTRING_CURL, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Registry Lot 2 — Power immediate
// hang_power_clean reuses the existing power_primary_repetition_sets_v0_1
// profile, exactly as push_press/hang_high_pull/jump_shrug already do.
// sled_push is NOT integrated in this lot — see the block comment at the
// end of this section and the migration report for the full, precise
// blocking rationale (a genuine structural mismatch between its own
// flat "4-12 pushes, 10-40 meters" documented volume and the
// power_repetition_sets method's own sets>=3 AND repetitions>=2 floor,
// not a semantic preference).
// -----------------------------------------------------------------------------

// Source: 50-exercises/64_POWER/12_HANG_POWER_CLEAN.md
//   - Primary Classification: "Loaded Power"; Primary Adaptation: "Power".
//   - Equipment Requirements (Primary Equipment): "Barbell, Weight
//     plates, Secure collars" — identical structure to hang_high_pull's
//     own equipment list (no rack, unlike push_press). No `plates`/`barbell`
//     duplication of the knowledge base's own requirements is introduced
//     here — `requiredEquipmentCapabilities` reuses the same two existing
//     capability ids `hang_high_pull` already uses.
//   - Loading Profile: "Common Reference Range: Approximately 60 to 80
//     percent of an athlete's conventional power clean one-repetition
//     maximum WHEN SUCH A REFERENCE IS TECHNICALLY VALID... The correct
//     load is not defined by percentage alone... CAS should prioritize
//     execution velocity, turnover quality and catch stability over
//     absolute load." This is an even stronger, more explicit hedge
//     against `percentage_1rm` than push_press/hang_high_pull/jump_shrug
//     ever documented, and it is architecturally moot regardless: the
//     shared profile's own `requiresExerciseSpecificLoadRule: true` flag
//     causes `resolveIntensity` to reject every load-based rule type
//     (`absolute_load`, `percentage_1rm`, `percentage_training_max`,
//     `percentage_body_mass`, `resistance_category`) for EVERY exercise
//     using this profile, regardless of what any individual entry
//     declares — `movement_intent` is the only rule type in the shared
//     profile's own intensity array that this flag does not reject,
//     which is exactly why every existing power/primary entry in this
//     registry already uses `["movement_intent"]` alone. This is not a
//     stylistic choice; it is the only type that can ever resolve.
//   - Programming Applications (all four documented prescriptions):
//     "General Power Development: 3 to 5 sets, 2 to 3 repetitions...
//     Full recovery between sets." / "Strength-Speed Development: 3 to 5
//     sets, 1 to 3 repetitions... Long recovery." / "Speed-Strength
//     Development: 3 to 5 sets, 2 to 3 repetitions." / "Combat Athlete
//     General Preparation: 2 to 4 sets, 1 to 3 repetitions, Low total
//     volume." The shared profile's own default range (sets 3-4-5,
//     repetitions 2-3-5) already matches the fiche's own most common "3
//     to 5 sets" ceiling exactly and its floor of 3 sets falls within
//     the documented range too — no widening is ever needed on the sets
//     dimension. The fiche's own repetition ceiling never exceeds 3
//     across any of the four programming applications ("Sets should end
//     before... turnover quality... becomes the primary limiter";
//     "High-repetition sets... are generally incompatible with the
//     primary CAS power objective") — repetitions are therefore narrowed
//     down to the profile's own floor (2) through 3, well inside the
//     profile's own ceiling of 5. The Combat-Athlete section's own floor
//     of "2 to 4 sets" and every section's floor of "1 to 3 repetitions"
//     both fall BELOW the shared profile's own floors (3 sets, 2
//     repetitions) — a dose constraint can never widen a shared profile,
//     so both floors stay at the profile's own values, a documented,
//     honest limitation rather than a fabricated wider range.
//   - Key Coaching Cues: "Push the floor away.", "Stay over the bar
//     until extension.", "Finish tall, then turn over.", "Elbows fast
//     and around.", "Meet the bar, do not wait for it.", "Catch tall in
//     the rack.", "Absorb with the hips and knees.", "Elbows up, chest
//     up.", "Brace before every repetition.", "Stop before turnover or
//     catch quality drops."
//   - Technical Failure Criteria (abridged, quoted): "the athlete begins
//     the turnover before meaningful hip and knee extension", "hip or
//     knee extension is incomplete", "the bar drifts substantially away
//     from the body", "the turnover is slow, partial or incomplete",
//     "the bar is received before or after the correct catch position,
//     forcing an unstable adjustment", "the elbows drop during or after
//     the catch", "the torso collapses forward in the front rack".
//   - Velocity Profile: "CAS should terminate or reduce the set when
//     velocity loss, turnover delay or catch instability becomes visible
//     or measurable beyond the programmed threshold."
//   - Fatigue Profile: "Common fatigue-related changes include a slower
//     turnover, a lower or later catch, forward torso lean in the rack,
//     reduced extension velocity, wider or less stable foot placement
//     and increased reliance on the arms to muscle the bar into
//     position."
//   - Safety Profile: "the catch produces a hard, uncontrolled collision
//     with the shoulders" / "Bar collision with the shoulders, chin or
//     chest from a poor turnover."
//   - Technical Failure Criteria / Safety Profile: "the athlete steps or
//     stumbles excessively to control the catch" / "Loss of balance or
//     stumbling during the catch" / "the athlete loses neutral spinal
//     control during the catch" / "the athlete cannot stand cleanly out
//     of the catch position."
//   - Contraindications and Restrictions: "Acute low-back pain, Acute
//     hamstring injury, Acute hip, knee or ankle injury, Acute shoulder,
//     elbow or wrist pain."
// Method: power_repetition_sets / power / primary
//   (power_primary_repetition_sets_v0_1 — sets 3/4/5, repetitions 2/3/5,
//   intensity movement_intent + percentage_1rm (the latter structurally
//   unreachable — see above), rest between_sets 120/180/300s, tempo
//   global_intent/maximal_acceleration). Distinguished explicitly from
//   `hang_high_pull` (a partial equivalent only for the propulsive
//   component — the fiche's own words: "The Hang High Pull is a partial
//   equivalent only for the propulsive component; it does not replicate
//   the receiving demand" / "CAS should not substitute the Hang High
//   Pull for the Hang Power Clean when receiving skill itself is the
//   target adaptation") and from `jump_shrug` (an earlier-stage
//   extension-only drill in this exercise's own Progression Model,
//   Stage 3, entirely without a turnover or catch phase). The catch
//   phase itself is the reason this entry's own stop conditions include
//   impact/balance hazards neither `hang_high_pull` nor `jump_shrug`
//   document at the same density.
const SOURCE_HANG_POWER_CLEAN = "50-exercises/64_POWER/12_HANG_POWER_CLEAN.md";

const hangPowerCleanStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "hang_power_clean_technical_failure",
    description:
      "Stop the set if the athlete begins the turnover before meaningful hip and knee extension, hip or knee extension is incomplete, the bar drifts substantially away from the body, the turnover is slow, partial or incomplete, the bar is received before or after the correct catch position, the elbows drop during or after the catch, or the torso collapses forward in the front rack.",
    sourceRuleIds: [SOURCE_HANG_POWER_CLEAN],
  }),
  velocityLossCondition({
    conditionId: "hang_power_clean_velocity_loss",
    description:
      "Terminate or reduce the set when bar height, extension velocity or turnover speed falls substantially, or when velocity loss, turnover delay or catch instability becomes visible or measurable beyond the programmed threshold.",
    sourceRuleIds: [SOURCE_HANG_POWER_CLEAN],
  }),
  fatigueLimitCondition({
    conditionId: "hang_power_clean_fatigue_limit",
    description:
      "Stop the set once the turnover becomes slower, the catch becomes lower or later, the torso leans forward in the rack, extension velocity is reduced, or the athlete increasingly relies on the arms to muscle the bar into position.",
    sourceRuleIds: [SOURCE_HANG_POWER_CLEAN],
  }),
  impactLimitCondition({
    conditionId: "hang_power_clean_impact_limit",
    description: "Stop the set if the catch produces a hard, uncontrolled collision with the shoulders, or the bar collides with the shoulders, chin or chest from a poor turnover.",
    sourceRuleIds: [SOURCE_HANG_POWER_CLEAN],
  }),
  balanceLossCondition({
    conditionId: "hang_power_clean_balance_loss",
    description:
      "Stop the set if the athlete steps or stumbles excessively to control the catch, loses neutral spinal control during the catch, or cannot stand cleanly out of the catch position.",
    sourceRuleIds: [SOURCE_HANG_POWER_CLEAN],
  }),
  painCondition({
    conditionId: "hang_power_clean_pain",
    description: "Stop if pain occurs, or in the presence of acute low-back, hamstring, hip, knee, ankle, shoulder, elbow or wrist symptoms.",
    sourceRuleIds: [SOURCE_HANG_POWER_CLEAN],
  }),
  completionCondition({
    conditionId: "hang_power_clean_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const hangPowerCleanInstructions: InstructionDefinition[] = [
  makeInstruction(
    "hang_power_clean_setup",
    "setup",
    "Set up the barbell with weight plates loaded and secure collars fitted; establish a stable hang position above or near the knees with a braced trunk and whole-foot pressure before initiating the pull.",
    "high",
    true,
    SOURCE_HANG_POWER_CLEAN,
  ),
  makeInstruction(
    "hang_power_clean_execution",
    "execution",
    "Push the floor away, extend the hips and knees forcefully into a tall finish, then pull the body down and under the bar with a fast, complete turnover of the elbows, receive the bar tall in the front rack with the elbows high, absorb the catch through coordinated hip, knee and ankle flexion, and stand to full extension to complete the repetition.",
    "high",
    true,
    SOURCE_HANG_POWER_CLEAN,
  ),
];

const hangPowerCleanEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "hang_power_clean",
  moduleId: "power",
  role: "primary",
  explicitMethodId: "power_repetition_sets",
  capabilities: {
    exerciseId: "hang_power_clean",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["power_repetition_sets"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    supportedLoadingModes: ["barbell", "added_external_load"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "global_movement_intent", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["barbell", "plates"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["hang_power_clean_setup", "hang_power_clean_execution"],
    requiredStopConditionIds: [
      "hang_power_clean_technical_failure",
      "hang_power_clean_velocity_loss",
      "hang_power_clean_fatigue_limit",
      "hang_power_clean_impact_limit",
      "hang_power_clean_balance_loss",
      "hang_power_clean_pain",
      "hang_power_clean_completion",
    ],
    durationEstimationProfileId: "duration_profile_hang_power_clean",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_HANG_POWER_CLEAN, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: hangPowerCleanInstructions,
  stopConditionDefinitions: hangPowerCleanStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 2, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 5, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_HANG_POWER_CLEAN],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_HANG_POWER_CLEAN, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// sled_push — NOT integrated in this lot (documented blocker)
//
// Source: 50-exercises/17_SLED_PUSH — "# Loading Profile — Typical
// Volume: 4-12 pushes, 10-40 meters." This is a single, flat,
// undecomposed total-volume figure — no separate "sets" and
// "repetitions" numbers are documented anywhere in this fiche (contrast
// with hang_power_clean above, which documents "3 to 5 sets, 2 to 3
// repetitions" as two explicit, independent numbers in every one of its
// four programming sections).
//
// power_repetition_sets's own shared profile (power_primary_repetition_
// sets_v0_1) requires a genuine sets_reps structure with an enforced
// floor on BOTH dimensions simultaneously: sets >= 3 AND repetitions >=
// 2 (a minimum of 6 total discrete units). Mapping "4-12 pushes" onto
// this structure requires inventing a decomposition the source document
// never states:
//   - if each push is treated as one set of one repetition (the most
//     mechanically honest reading, matching how a sled push is actually
//     coached — one continuous drive per rest interval, never multiple
//     discrete "reps" within a single push), repetitions would need to
//     be 1, which is BELOW the profile's own floor of 2 and cannot be
//     narrowed there (a dose constraint only narrows within existing
//     bounds, never widens or lowers below them);
//   - if instead the 4-12 pushes are treated as repetitions within a
//     single set, sets would need to be 1, which is BELOW the profile's
//     own floor of 3, for the identical reason;
//   - any other invented sets x reps split (e.g. "3 sets of 4 pushes")
//     would silently multiply the fiche's own documented floor upward
//     (3 x 2 = 6 minimum total pushes under the shared profile, even
//     before any invented split), overstating the exercise's own
//     documented minimum volume — the same class of dishonest widening
//     this whole registry's own discipline forbids.
//
// The 10-40 meter distance dimension compounds this: `power_repetition_
// sets`'s own shared profile documents `distance: null` — no distance
// dimension exists in this method's volume structure at all, for any
// exercise. `distance_carry_sets` (the method with a real `sets_distance`
// structure) is NOT authorized for the "power" module at all —
// `contracts.ts`'s own `power` module profile explicitly lists
// `distance_carry_sets` inside its `forbiddenMethods`. sled_push's own
// module is "power" in both the knowledge base and this registry's own
// classification (matching its own fiche's "Primary Classification:
// Power" and Capability Mapping), so this is not a module
// misclassification to fix — it is a genuine absence of any authorized,
// structurally honest method for this exercise today.
//
// This is precisely the Category C finding already identified in the
// full 32-exercise Registry Audit (sled_push required a new numerical
// profile, not merely a new registry entry) — confirmed here at
// implementation depth, not merely reasserted. sled_push is therefore
// NOT migrated in this lot. Forcing it into power_repetition_sets today
// would require either inventing an unsourced sets/reps decomposition or
// silently dropping the documented distance entirely — both rejected.
// A future lot introducing a genuine distance/work-based numerical
// profile for the power module (or a documented, sourced sets x reps
// convention) is the correct path, not a workaround here.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Registry Lot 3 — Movement immediate
// The first six entries in this whole registry to use moduleId "movement".
// All six reuse the single existing controlled_mobility_sets_v0_1 profile
// (moduleId: movement, methodId: controlled_mobility_sets, exerciseRole:
// technical) — no new numerical prescription profile is created.
//
// STRUCTURAL DISCOVERY, verified directly in contracts.ts before writing
// any entry: the controlled_mobility_sets method contract declares
// `requiredStopConditionCategories: ["pain", "technical_failure",
// "range_of_motion_loss", "balance_loss", "completion"]` — FIVE mandatory
// categories, enforced by `resolveStopConditions.ts` (a missing category
// hard-fails with `STOP_CONDITION_CATEGORY_MISSING`, independent of
// whichever specific stop conditions any single entry happens to declare).
// No existing entry in this registry used this method before this lot, so
// no `rangeOfMotionLossCondition` factory existed in
// `stopConditionRegistry.ts` — a single new factory was added there,
// mirroring `balanceLossCondition`'s own exact shape, purely additive.
//
// VOLUME STRUCTURE DISCOVERY: the shared profile's own `volume.structure`
// is "sets_duration" — `repetitions: null`. None of the six exercises'
// own fiches document their volume exclusively in seconds; several
// document "sets x repetitions" instead (bridging, technical_stand_up),
// and two (footwork_drills, shadow_boxing) document multi-minute,
// round-based session volumes that categorically exceed the shared
// profile's own ceiling (3 sets x 60 seconds = 3 minutes maximum). Per
// exercise, the exact representational decision made is documented in
// that exercise's own block comment below — no arbitrary reps-to-duration
// conversion is invented anywhere in this lot.
// -----------------------------------------------------------------------------

// Source: 50-exercises/37_BEAR_CRAWL
//   - Primary Classification: "Athletic Development"; Loading Profile:
//     "Typical Volume: 3-8 sets, 10-30 meters OR 20-60 seconds." The
//     fiche itself documents a genuine duration equivalent alongside the
//     distance figure — no conversion is invented; the directly-quoted
//     "20-60 seconds" is used as-is, matching the shared profile's own
//     duration range (20-30-60s) exactly. The 10-30 meter distance has
//     no representable dimension in this method's own volume structure
//     (`distance: null`) and is preserved only as descriptive context in
//     the setup instruction, never as a structural dose claim.
//   - Equipment Requirements: Required: None.
//   - Coaching Cues: "Keep the hips low.", "Brace continuously.", "Move
//     opposite hand and foot together.", "Take controlled steps.", "Stay
//     quiet through the trunk."
//   - Common Errors / Safety Profile Primary Risks: "High hips.",
//     "Overstriding.", "Lumbar extension.", "Poor shoulder stability." /
//     "Hip Elevation", "Lumbar Extension", "Shoulder Collapse", "Short
//     Strides".
//   - Contraindications: Acute Wrist Injury, Acute Shoulder Injury,
//     Acute Knee Injury.
// Method: controlled_mobility_sets / movement / technical
//   (controlled_mobility_sets_v0_1 — sets 1/2/3, duration per_set
//   20/30/60s, RPE 2/3/5 + technical_effort, rest between_sets 0/15/45s,
//   tempo global_intent/technical_precision). Narrowed: sets pinned to 3
//   (the fiche's own documented floor of "3-8 sets" intersects the
//   profile's own range [1,3] at exactly {3} — a genuine, honest single-
//   point overlap, not an error); duration 20-60s restated explicitly
//   (already matches the profile's own default range exactly).
const SOURCE_BEAR_CRAWL = "50-exercises/37_BEAR_CRAWL";

const bearCrawlStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "bear_crawl_technical_failure",
    description: "Stop the set when the hips rise, the athlete overstrides, lumbar extension appears, or shoulder stability is lost.",
    sourceRuleIds: [SOURCE_BEAR_CRAWL],
  }),
  rangeOfMotionLossCondition({
    conditionId: "bear_crawl_range_of_motion_loss",
    description: "Stop the set if strides shorten excessively or the coordinated opposite hand-and-foot reach pattern is lost.",
    sourceRuleIds: [SOURCE_BEAR_CRAWL],
  }),
  balanceLossCondition({
    conditionId: "bear_crawl_balance_loss",
    description: "Stop the set if shoulder stability collapses or the whole-body coordinated pattern becomes unstable.",
    sourceRuleIds: [SOURCE_BEAR_CRAWL],
  }),
  painCondition({
    conditionId: "bear_crawl_pain",
    description: "Stop immediately if pain occurs, or in the presence of an acute wrist, shoulder or knee injury.",
    sourceRuleIds: [SOURCE_BEAR_CRAWL],
  }),
  completionCondition({
    conditionId: "bear_crawl_completion",
    description: "Stop once the prescribed sets and duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const bearCrawlInstructions: InstructionDefinition[] = [
  makeInstruction(
    "bear_crawl_setup",
    "setup",
    "Set up in a quadrupedal stance with the hips low and whole-body tension established; no equipment is required, and the prescribed distance is typically 10-30 meters per set.",
    "high",
    true,
    SOURCE_BEAR_CRAWL,
  ),
  makeInstruction(
    "bear_crawl_execution",
    "execution",
    "Keep the hips low, brace continuously, move the opposite hand and foot together, take controlled steps, and stay quiet through the trunk.",
    "high",
    true,
    SOURCE_BEAR_CRAWL,
  ),
];

const bearCrawlEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "bear_crawl",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "controlled_mobility_sets",
  capabilities: {
    exerciseId: "bear_crawl",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["controlled_mobility_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["bear_crawl_setup", "bear_crawl_execution"],
    requiredStopConditionIds: [
      "bear_crawl_technical_failure",
      "bear_crawl_range_of_motion_loss",
      "bear_crawl_balance_loss",
      "bear_crawl_pain",
      "bear_crawl_completion",
    ],
    durationEstimationProfileId: "duration_profile_bear_crawl",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_BEAR_CRAWL, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: bearCrawlInstructions,
  stopConditionDefinitions: bearCrawlStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: null, durationSeconds: 20, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 3, repetitions: null, durationSeconds: 60, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_BEAR_CRAWL],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_BEAR_CRAWL, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/39_BRIDGING
//   - Primary Classification: "Combat-Specific Movement" — this is the
//     canonical grappling/wrestling bridge (escaping, reversing and
//     generating force from the ground), explicitly distinguished in its
//     own text from a conditioning drill ("CAS develops Bridging as a
//     universal combat movement rather than a simple conditioning
//     drill"). This is NOT the same exercise as `hip_thrust` (already in
//     the registry, moduleId "strength", role "primary", a barbell-loaded
//     strength lift) — "Glute Bridge"/"Hip Lift" are named only as this
//     fiche's own Regressions, never as the base form, and are not
//     substituted in. `moduleId` stays "movement", never reclassified to
//     "strength".
//   - Loading Profile: "Typical Volume: 3-8 sets, 5-15 repetitions." No
//     total-set-duration figure is documented anywhere in this fiche
//     (the only duration figure present, "Typical Duration: 2-10
//     seconds" under Physiological Profile, describes a SINGLE
//     repetition's own duration, not a set) — multiplying reps by
//     per-repetition duration to manufacture a set-duration figure would
//     be an invented conversion, not a sourced one, and is deliberately
//     not done. The repetition count is preserved only as guidance in
//     the execution instruction; no `exerciseDoseConstraints` duration
//     narrowing is applied — the shared profile's own default duration
//     range (20-30-60s) is used as-is.
//   - Equipment Requirements: Required: Mat.
//   - Coaching Cues: "Drive through the feet.", "Explode with the
//     hips.", "Protect the neck.", "Create maximum elevation.", "Recover
//     immediately."
//   - Common Errors / Safety Profile Primary Risks: "Lifting only the
//     pelvis.", "Poor hip extension.", "Weak foot drive." / "Excessive
//     Cervical Loading", "Poor Hip Extension", "Lumbar Hyperextension".
//   - Contraindications: Acute Cervical Injury, Acute Lumbar Injury,
//     Acute Shoulder Injury.
// Method: controlled_mobility_sets / movement / technical
//   Narrowed: sets pinned to 3 (the fiche's own "3-8 sets" intersects
//   the profile's own [1,3] range at exactly {3}, the same resolution
//   already used for bear_crawl above). No duration narrowing (see
//   above).
const SOURCE_BRIDGING = "50-exercises/39_BRIDGING";

const bridgingStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "bridging_technical_failure",
    description: "Stop the set if only the pelvis lifts without full hip extension, foot drive is weak, or the movement becomes uncoordinated.",
    sourceRuleIds: [SOURCE_BRIDGING],
  }),
  rangeOfMotionLossCondition({
    conditionId: "bridging_range_of_motion_loss",
    description: "Stop the set if hip extension becomes incomplete or elevation decreases substantially across repetitions.",
    sourceRuleIds: [SOURCE_BRIDGING],
  }),
  balanceLossCondition({
    conditionId: "bridging_balance_loss",
    description: "Stop the set if the base of support through the feet and shoulders becomes unstable during the bridge.",
    sourceRuleIds: [SOURCE_BRIDGING],
  }),
  painCondition({
    conditionId: "bridging_pain",
    description: "Stop immediately if cervical, lumbar or shoulder pain occurs, or in the presence of an acute cervical, lumbar or shoulder injury.",
    sourceRuleIds: [SOURCE_BRIDGING],
  }),
  completionCondition({
    conditionId: "bridging_completion",
    description: "Stop once the prescribed sets and duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const bridgingInstructions: InstructionDefinition[] = [
  makeInstruction(
    "bridging_setup",
    "setup",
    "Lie on the mat and plant the feet, establishing a neck-safe starting position before initiating the bridge; the fiche's own typical volume is 5-15 repetitions within each prescribed set.",
    "high",
    true,
    SOURCE_BRIDGING,
  ),
  makeInstruction(
    "bridging_execution",
    "execution",
    "Drive through the feet, explode with the hips, protect the neck throughout, create maximum elevation, and recover immediately.",
    "high",
    true,
    SOURCE_BRIDGING,
  ),
];

const bridgingEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "bridging",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "controlled_mobility_sets",
  capabilities: {
    exerciseId: "bridging",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["controlled_mobility_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["mat"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["bridging_setup", "bridging_execution"],
    requiredStopConditionIds: [
      "bridging_technical_failure",
      "bridging_range_of_motion_loss",
      "bridging_balance_loss",
      "bridging_pain",
      "bridging_completion",
    ],
    durationEstimationProfileId: "duration_profile_bridging",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_BRIDGING, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: bridgingInstructions,
  stopConditionDefinitions: bridgingStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_BRIDGING],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_BRIDGING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/29_FOOTWORK_DRILLS
//   - Primary Classification: "Combat-Specific Technique"; Loading
//     Profile: "Typical Duration: 5-15 minutes. Rounds: 2-6." This full
//     session-length, round-based volume categorically exceeds the
//     shared profile's own maximum (3 sets x 60 seconds = 3 minutes) —
//     no dose constraint can honestly claim to represent it. This entry
//     therefore represents a SHORT TECHNICAL TOUCH of footwork practice
//     (matching this fiche's own "Warm-Up"/"Skill Acquisition" secondary
//     classifications and "Frequency: Daily if required" framing), using
//     the shared profile's own default, unconstrained range — not the
//     fiche's own full extended-session volume, which remains outside
//     what a single controlled_mobility_sets exercise slot can express.
//     A future session-composition layer (multiple prescribed blocks in
//     sequence) is the correct path to the fiche's own longer practice
//     length, not a fabricated dose constraint here. This limitation is
//     documented explicitly, not silently understated.
//   - Equipment Requirements: Required: None.
//   - Coaching Cues: "Stay light on the feet.", "Maintain your stance.",
//     "Move before striking.", "Never cross your feet.", "Stay
//     balanced."
//   - Common Errors / Contraindications: "Crossing Feet", "Standing
//     Upright", "Overstepping", "Poor Balance" / "Acute Lower-Limb
//     Injury", "Severe Balance Deficit".
// Method: controlled_mobility_sets / movement / technical
//   No exerciseDoseConstraints — the shared profile's own default range
//   is used unconstrained (see the model-limitation note above).
const SOURCE_FOOTWORK_DRILLS = "50-exercises/29_FOOTWORK_DRILLS";

const footworkDrillsStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "footwork_drills_technical_failure",
    description: "Stop the set if the feet cross, the athlete stands upright, overstepping occurs, or movement loses intent.",
    sourceRuleIds: [SOURCE_FOOTWORK_DRILLS],
  }),
  rangeOfMotionLossCondition({
    conditionId: "footwork_drills_range_of_motion_loss",
    description: "Stop the set if stride length or multidirectional range collapses, or movement becomes restricted to a single pattern.",
    sourceRuleIds: [SOURCE_FOOTWORK_DRILLS],
  }),
  balanceLossCondition({
    conditionId: "footwork_drills_balance_loss",
    description: "Stop the set if balance is lost or a severe balance deficit becomes apparent.",
    sourceRuleIds: [SOURCE_FOOTWORK_DRILLS],
  }),
  painCondition({
    conditionId: "footwork_drills_pain",
    description: "Stop immediately if pain occurs, or in the presence of an acute lower-limb injury.",
    sourceRuleIds: [SOURCE_FOOTWORK_DRILLS],
  }),
  completionCondition({
    conditionId: "footwork_drills_completion",
    description: "Stop once the prescribed sets and duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const footworkDrillsInstructions: InstructionDefinition[] = [
  makeInstruction(
    "footwork_drills_setup",
    "setup",
    "Establish a combat stance in a clear, multidirectional space; no equipment is required, though cones, an agility ladder or markers may be used if available.",
    "high",
    true,
    SOURCE_FOOTWORK_DRILLS,
  ),
  makeInstruction(
    "footwork_drills_execution",
    "execution",
    "Stay light on the feet, maintain the stance, move before striking, never cross the feet, and stay balanced throughout.",
    "high",
    true,
    SOURCE_FOOTWORK_DRILLS,
  ),
];

const footworkDrillsEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "footwork_drills",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "controlled_mobility_sets",
  capabilities: {
    exerciseId: "footwork_drills",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["controlled_mobility_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["footwork_drills_setup", "footwork_drills_execution"],
    requiredStopConditionIds: [
      "footwork_drills_technical_failure",
      "footwork_drills_range_of_motion_loss",
      "footwork_drills_balance_loss",
      "footwork_drills_pain",
      "footwork_drills_completion",
    ],
    durationEstimationProfileId: "duration_profile_footwork_drills",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_FOOTWORK_DRILLS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: footworkDrillsInstructions,
  stopConditionDefinitions: footworkDrillsStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_FOOTWORK_DRILLS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/28_SHADOW_BOXING
//   - Primary Classification: "Combat-Specific Technique"; Loading
//     Profile: "Typical Duration: 3-8 rounds, 2-5 minutes. Recovery:
//     30-60 seconds" (and, separately, "Typical Duration: 3-20 minutes"
//     under Physiological Profile). This is the same class of session-
//     length, round-based volume already discussed for footwork_drills
//     above, and categorically exceeds the shared profile's own ceiling.
//     This entry represents a SHORT TECHNICAL TOUCH of shadow boxing
//     practice (matching this fiche's own "Warm-Up"/"Recovery"/
//     "Regressions: Slow Technical Shadow, Single Technique" framing),
//     not its own full multi-round session — the same documented,
//     honest limitation as footwork_drills. This entry is NOT
//     `heavy_bag_power_intervals` (a different exercise, module
//     "conditioning", requiring a heavy bag and gloves — not integrated
//     in this lot) — no equipment or partner eligibility is introduced
//     here; the fiche's own "Required: None" stands unchanged.
//   - Equipment Requirements: Required: None.
//   - Coaching Cues: "Move with purpose.", "Stay relaxed.", "Maintain
//     your guard.", "Rotate through the hips.", "Visualize a real
//     opponent.", "Move continuously."
//   - Common Errors / Contraindications: "Moving without intent.",
//     "Punching only with the arms.", "Poor footwork." / "None. Except
//     acute injury preventing movement."
// Method: controlled_mobility_sets / movement / technical
//   No exerciseDoseConstraints — the shared profile's own default range
//   is used unconstrained (see the model-limitation note above).
const SOURCE_SHADOW_BOXING = "50-exercises/28_SHADOW_BOXING";

const shadowBoxingStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "shadow_boxing_technical_failure",
    description: "Stop the set if punches are thrown only with the arms, footwork deteriorates, or movement loses intent.",
    sourceRuleIds: [SOURCE_SHADOW_BOXING],
  }),
  rangeOfMotionLossCondition({
    conditionId: "shadow_boxing_range_of_motion_loss",
    description: "Stop the set if punches lose full technical extension or movement becomes restricted and mechanical.",
    sourceRuleIds: [SOURCE_SHADOW_BOXING],
  }),
  balanceLossCondition({
    conditionId: "shadow_boxing_balance_loss",
    description: "Stop the set if balance is lost or the guard position collapses during movement.",
    sourceRuleIds: [SOURCE_SHADOW_BOXING],
  }),
  painCondition({
    conditionId: "shadow_boxing_pain",
    description: "Stop immediately if pain occurs, or in the presence of an acute injury preventing movement.",
    sourceRuleIds: [SOURCE_SHADOW_BOXING],
  }),
  completionCondition({
    conditionId: "shadow_boxing_completion",
    description: "Stop once the prescribed sets and duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const shadowBoxingInstructions: InstructionDefinition[] = [
  makeInstruction(
    "shadow_boxing_setup",
    "setup",
    "No equipment is required; establish a guard and stance before beginning, a mirror or timer may be used if available.",
    "high",
    true,
    SOURCE_SHADOW_BOXING,
  ),
  makeInstruction(
    "shadow_boxing_execution",
    "execution",
    "Move with purpose, stay relaxed, maintain the guard, rotate through the hips, visualize a real opponent, and move continuously.",
    "high",
    true,
    SOURCE_SHADOW_BOXING,
  ),
];

const shadowBoxingEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "shadow_boxing",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "controlled_mobility_sets",
  capabilities: {
    exerciseId: "shadow_boxing",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["controlled_mobility_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["shadow_boxing_setup", "shadow_boxing_execution"],
    requiredStopConditionIds: [
      "shadow_boxing_technical_failure",
      "shadow_boxing_range_of_motion_loss",
      "shadow_boxing_balance_loss",
      "shadow_boxing_pain",
      "shadow_boxing_completion",
    ],
    durationEstimationProfileId: "duration_profile_shadow_boxing",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SHADOW_BOXING, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: shadowBoxingInstructions,
  stopConditionDefinitions: shadowBoxingStopConditions,
  exerciseDoseConstraints: null,
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_SHADOW_BOXING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/35_TECHNICAL_STAND_UP
//   - Primary Classification: "Combat-Specific Movement"; Loading
//     Profile: "Typical Volume: 2-6 sets, 5-15 repetitions." No
//     total-set-duration figure exists (the only duration figure, "2-5
//     seconds" under Physiological Profile, is a single repetition's own
//     duration, not a set) — the repetition count is preserved only as
//     guidance in the execution instruction, matching the same
//     discipline already applied to bridging above. No side ("left" or
//     "right") is ever named anywhere in this fiche, and no "alternate"
//     or "continuous" language appears either (contrast with shrimping
//     below) — the knowledge base's own `ExerciseDefinition` resolves
//     `unilateral: false`, and this entry matches that resolution
//     exactly: `laterality: "bilateral"`, with the free choice of side
//     documented as an execution detail, not a registry-level
//     alternating claim the fiche itself never makes.
//   - Equipment Requirements: Required: Mat.
//   - Coaching Cues: "Protect your head.", "Keep your eyes on the
//     opponent.", "Create distance first.", "Stand with balance.",
//     "Recover your fighting stance immediately."
//   - Common Errors / Safety Profile Primary Risks: "Turning your
//     back.", "Standing without protection.", "Crossing the feet.",
//     "Poor base." / "Poor Hand Placement", "Standing Too Early", "Loss
//     of Balance", "Poor Situational Awareness".
//   - Contraindications: Acute Wrist Injury, Acute Shoulder Injury,
//     Acute Knee Injury.
// Method: controlled_mobility_sets / movement / technical
//   Narrowed: sets 2-3 (the fiche's own "2-6 sets" intersects the
//   profile's own [1,3] range at [2,3] — a genuine, honest overlap
//   narrower than the profile's own default floor of 1, and short of
//   the fiche's own documented ceiling of 6, which the profile cannot
//   reach).
const SOURCE_TECHNICAL_STAND_UP = "50-exercises/35_TECHNICAL_STAND_UP";

const technicalStandUpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "technical_stand_up_technical_failure",
    description: "Stop the set if the athlete turns their back, stands without protection, or shows poor situational awareness during the transition.",
    sourceRuleIds: [SOURCE_TECHNICAL_STAND_UP],
  }),
  rangeOfMotionLossCondition({
    conditionId: "technical_stand_up_range_of_motion_loss",
    description: "Stop the set if the base narrows excessively, the feet cross, or protective positioning is lost during the transition.",
    sourceRuleIds: [SOURCE_TECHNICAL_STAND_UP],
  }),
  balanceLossCondition({
    conditionId: "technical_stand_up_balance_loss",
    description: "Stop the set if balance is lost while standing up.",
    sourceRuleIds: [SOURCE_TECHNICAL_STAND_UP],
  }),
  painCondition({
    conditionId: "technical_stand_up_pain",
    description: "Stop immediately if pain occurs, or in the presence of an acute wrist, shoulder or knee injury.",
    sourceRuleIds: [SOURCE_TECHNICAL_STAND_UP],
  }),
  completionCondition({
    conditionId: "technical_stand_up_completion",
    description: "Stop once the prescribed sets and duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const technicalStandUpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "technical_stand_up_setup",
    "setup",
    "Begin seated or grounded on the mat, choosing either side freely; no other equipment is required.",
    "high",
    true,
    SOURCE_TECHNICAL_STAND_UP,
  ),
  makeInstruction(
    "technical_stand_up_execution",
    "execution",
    "Protect the head, keep the eyes on the opponent, create distance first, stand with balance, and recover the fighting stance immediately.",
    "high",
    true,
    SOURCE_TECHNICAL_STAND_UP,
  ),
];

const technicalStandUpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "technical_stand_up",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "controlled_mobility_sets",
  capabilities: {
    exerciseId: "technical_stand_up",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["controlled_mobility_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["mat"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["technical_stand_up_setup", "technical_stand_up_execution"],
    requiredStopConditionIds: [
      "technical_stand_up_technical_failure",
      "technical_stand_up_range_of_motion_loss",
      "technical_stand_up_balance_loss",
      "technical_stand_up_pain",
      "technical_stand_up_completion",
    ],
    durationEstimationProfileId: "duration_profile_technical_stand_up",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_TECHNICAL_STAND_UP, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: technicalStandUpInstructions,
  stopConditionDefinitions: technicalStandUpStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 2, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_TECHNICAL_STAND_UP],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_TECHNICAL_STAND_UP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/38_SHRIMPING
//   - Primary Classification: "Combat-Specific Movement"; Loading
//     Profile: "Typical Volume: 3-8 sets, 10-20 repetitions OR 20-60
//     seconds." As with bear_crawl above, the fiche itself documents a
//     genuine duration equivalent alongside the repetition count — the
//     directly-quoted "20-60 seconds" is used as-is, matching the shared
//     profile's own duration range exactly; no conversion is invented.
//     Unlike the other five exercises in this lot, this movement
//     genuinely alternates sides continuously within a single set
//     ("Variations: ... Continuous Shrimp"; "Progressions: ... Continuous
//     Ground Movement") without ever being described as a fixed
//     per-side count. `laterality: "alternating"` was considered but
//     rejected after direct execution: `validateCompatibility.ts` requires
//     an "alternating"-laterality exercise to declare a volume
//     interpretation of "repetitions_per_side", "duration_per_side" or
//     similar — every available option asserts the prescribed dose is
//     repeated ONCE PER SIDE (doubling total volume), a claim this
//     fiche's own "20-60 seconds" (a single continuous total, not a
//     per-side figure) does not support. `laterality: "bilateral"` is
//     used instead — the honest choice given the current architecture has
//     no vocabulary for "continuous, non-doubled, alternating-sides"
//     laterality — with the alternating-sides nature preserved only as
//     execution guidance. A genuine, documented model limitation, not a
//     workaround.
//   - Equipment Requirements: Required: Mat.
//   - Coaching Cues: "Drive through the planted foot.", "Move the hips
//     first.", "Create maximum space.", "Stay connected to the ground.",
//     "Maintain defensive posture."
//   - Common Errors / Safety Profile Primary Risks: "Moving only the
//     shoulders.", "Minimal hip displacement.", "Poor foot placement." /
//     "Poor Hip Extension", "Excessive Neck Tension", "Poor Arm
//     Position".
//   - Contraindications: Acute Shoulder Injury, Acute Hip Injury, Acute
//     Lumbar Injury.
// Method: controlled_mobility_sets / movement / technical
//   Narrowed: sets pinned to 3 (the fiche's own "3-8 sets" intersects
//   the profile's own [1,3] range at exactly {3}, the same resolution
//   already used for bear_crawl/bridging above); duration 20-60s
//   restated explicitly (already matches the profile's own default range
//   exactly).
const SOURCE_SHRIMPING = "50-exercises/38_SHRIMPING";

const shrimpingStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "shrimping_technical_failure",
    description: "Stop the set if the movement comes only from the shoulders, foot placement deteriorates, or intent is lost.",
    sourceRuleIds: [SOURCE_SHRIMPING],
  }),
  rangeOfMotionLossCondition({
    conditionId: "shrimping_range_of_motion_loss",
    description: "Stop the set if hip displacement decreases substantially or the movement becomes segmented.",
    sourceRuleIds: [SOURCE_SHRIMPING],
  }),
  balanceLossCondition({
    conditionId: "shrimping_balance_loss",
    description: "Stop the set if structural connection to the ground is lost during the movement.",
    sourceRuleIds: [SOURCE_SHRIMPING],
  }),
  painCondition({
    conditionId: "shrimping_pain",
    description: "Stop immediately if shoulder, hip or lumbar pain occurs, or in the presence of an acute shoulder, hip or lumbar injury.",
    sourceRuleIds: [SOURCE_SHRIMPING],
  }),
  completionCondition({
    conditionId: "shrimping_completion",
    description: "Stop once the prescribed sets and duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const shrimpingInstructions: InstructionDefinition[] = [
  makeInstruction(
    "shrimping_setup",
    "setup",
    "Lie on the mat in a defensive ground position before beginning.",
    "high",
    true,
    SOURCE_SHRIMPING,
  ),
  makeInstruction(
    "shrimping_execution",
    "execution",
    "Drive through the planted foot, move the hips first, create maximum space, stay connected to the ground, and maintain defensive posture throughout, alternating sides continuously.",
    "high",
    true,
    SOURCE_SHRIMPING,
  ),
];

const shrimpingEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "shrimping",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "controlled_mobility_sets",
  capabilities: {
    exerciseId: "shrimping",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["controlled_mobility_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["mat"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["shrimping_setup", "shrimping_execution"],
    requiredStopConditionIds: [
      "shrimping_technical_failure",
      "shrimping_range_of_motion_loss",
      "shrimping_balance_loss",
      "shrimping_pain",
      "shrimping_completion",
    ],
    durationEstimationProfileId: "duration_profile_shrimping",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SHRIMPING, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: shrimpingInstructions,
  stopConditionDefinitions: shrimpingStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: null, durationSeconds: 20, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 3, repetitions: null, durationSeconds: 60, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_SHRIMPING],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_SHRIMPING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/30_SPRAWL
//   - Primary Classification: "Combat-Specific Movement" — a defensive
//     ground-transition action, not a general-conditioning circuit
//     exercise. `moduleId` stays "movement", never reclassified to
//     "conditioning" or "power" despite the "Power"/"Conditioning"
//     Secondary Classifications and the "Reactive Power"/"Anaerobic
//     Power" Capability Mapping entries — the same discipline already
//     applied to bear_crawl/bridging/shrimping/technical_stand_up in
//     Registry Lot 3. This is NOT `burpee` (no exercise with that id
//     exists anywhere in this knowledge base, confirmed by direct
//     search) and is NOT `sprint_intervals` (module "conditioning",
//     a distance/interval running drill with no ground-transition
//     component) — no substitution is made toward either.
//   - Loading Profile: "Typical Volume: 3-8 rounds, 5-20 repetitions or
//     10-30 second intervals." The "rounds"/"repetitions" reading cannot
//     be honestly mapped onto `controlled_mobility_sets` (a
//     `sets_duration` method that forbids a `repetitions` field, and
//     "rounds" is never treated as a `sets` synonym — the same
//     discipline already applied to footwork_drills/shadow_boxing in
//     Lot 3, where "rounds" was left entirely unconstrained rather than
//     silently reinterpreted as "sets"). The fiche's own alternative
//     figure, "10-30 second intervals", is however a genuine,
//     already-in-seconds duration figure requiring no invented
//     conversion — it is used to narrow ONLY the duration dimension:
//     intersected with the shared profile's own 20-60s range, this
//     yields an effective 20-30s (narrower ceiling than the profile's
//     own default 60s, consistent with this fiche's own "Physiological
//     Profile — Typical Work Duration: 2-8 seconds" framing of a
//     maximal ATP-PC effort). `sets` is deliberately left unconstrained
//     (both bounds `null`) — no genuine per-set count is documented,
//     only "rounds", which is not converted into "sets".
//   - Equipment Requirements: Required: Mat.
//   - Coaching Cues: "Throw the hips back explosively.", "Maintain a
//     strong trunk.", "Keep the head neutral.", "Recover immediately.",
//     "Move with intent."
//   - Common Errors / Safety Profile Primary Risks: "Landing on the
//     knees.", "Slow hip projection.", "Poor recovery to stance.", "Loss
//     of balance.", "Looking at the floor." / "Poor Landing Mechanics",
//     "Lumbar Hyperextension", "Wrist Overload", "Poor Neck Position".
//   - Contraindications: Acute Shoulder Injury, Acute Wrist Injury, Acute
//     Lumbar Injury, Acute Cervical Injury.
//   - No side ("left"/"right") or alternating language exists anywhere in
//     this fiche ("Movement Context: ... Whole Body" only) — a
//     simultaneous, symmetric bilateral action, matching the knowledge
//     base's own `unilateral: false` resolution exactly:
//     `laterality: "bilateral"`.
// Method: controlled_mobility_sets / movement / technical
//   Narrowed: duration 20-30s only (see above); sets left unconstrained.
const SOURCE_SPRAWL = "50-exercises/30_SPRAWL";

const sprawlStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "sprawl_technical_failure",
    description: "Stop the set if the athlete lands on the knees, hip projection becomes slow, or recovery to the fighting stance is delayed.",
    sourceRuleIds: [SOURCE_SPRAWL],
  }),
  rangeOfMotionLossCondition({
    conditionId: "sprawl_range_of_motion_loss",
    description: "Stop the set if hip projection distance decreases substantially or the recovery to base becomes incomplete.",
    sourceRuleIds: [SOURCE_SPRAWL],
  }),
  balanceLossCondition({
    conditionId: "sprawl_balance_loss",
    description: "Stop the set if balance is lost during the sprawl or its recovery.",
    sourceRuleIds: [SOURCE_SPRAWL],
  }),
  painCondition({
    conditionId: "sprawl_pain",
    description: "Stop immediately if shoulder, wrist, lumbar or cervical pain occurs, or in the presence of an acute shoulder, wrist, lumbar or cervical injury.",
    sourceRuleIds: [SOURCE_SPRAWL],
  }),
  completionCondition({
    conditionId: "sprawl_completion",
    description: "Stop once the prescribed sets and duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const sprawlInstructions: InstructionDefinition[] = [
  makeInstruction(
    "sprawl_setup",
    "setup",
    "Begin from a stable fighting stance on the mat; no partner or additional equipment is required, though reaction lights, a partner, a heavy bag or a timer may be used if available.",
    "high",
    true,
    SOURCE_SPRAWL,
  ),
  makeInstruction(
    "sprawl_execution",
    "execution",
    "Throw the hips back explosively, maintain a strong trunk, keep the head neutral, and recover immediately to the fighting stance, prioritizing full hip projection and clean recovery mechanics over raw speed.",
    "high",
    true,
    SOURCE_SPRAWL,
  ),
];

const sprawlEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "sprawl",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "controlled_mobility_sets",
  capabilities: {
    exerciseId: "sprawl",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["controlled_mobility_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["mat"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["sprawl_setup", "sprawl_execution"],
    requiredStopConditionIds: [
      "sprawl_technical_failure",
      "sprawl_range_of_motion_loss",
      "sprawl_balance_loss",
      "sprawl_pain",
      "sprawl_completion",
    ],
    durationEstimationProfileId: "duration_profile_sprawl",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SPRAWL, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: sprawlInstructions,
  stopConditionDefinitions: sprawlStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 20, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 30, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_SPRAWL],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_SPRAWL, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// Source: 50-exercises/36_SHOT_ENTRIES
//   - Primary Classification: "Combat-Specific Movement" — an offensive
//     standing-to-standing penetration/level-change action. `moduleId`
//     stays "movement", never reclassified to "strength" or "power"
//     despite the "Power" Secondary Classification and "Explosive
//     Entry"/"Rate of Force Development: ★★★★★" Capability Mapping
//     entries — the same discipline already applied to sprawl above.
//     This is NOT `pummeling` (already in the knowledge base, module
//     "movement", but requiring a mandatory partner —
//     `{ kind: "human_assistance", assistance: "partner" }` — a clinch
//     control drill, not a penetration entry) and is NOT
//     `technical_stand_up` (a ground-to-standing recovery movement, not
//     a standing-to-standing offensive entry) — no substitution is made
//     toward either. "Movement Context: ... Partner or Solo" and
//     "Equipment Requirements — Optional: Partner" confirm this entry
//     represents the solo form; no partner requirement is added to the
//     registry (the knowledge base itself never requires one).
//   - Loading Profile: "Typical Volume: 3-8 sets, 3-10 repetitions." No
//     total-set-duration figure is documented anywhere in this fiche
//     (the only duration figure, "Typical Duration: 2-5 seconds" under
//     Physiological Profile, describes a SINGLE repetition's own
//     duration, not a set — the same distinction already applied to
//     bridging/technical_stand_up in Lot 3) — multiplying reps by
//     per-repetition duration to manufacture a set-duration figure would
//     be an invented conversion and is deliberately not done. The
//     repetition count is preserved only as guidance in the execution
//     instruction; no duration narrowing is applied — the shared
//     profile's own default duration range (20-30-60s) is used as-is.
//   - Equipment Requirements: Required: Mat.
//   - Coaching Cues: "Lower your level.", "Keep your posture.", "Drive
//     through the lead leg.", "Penetrate deeply.", "Finish with intent."
//   - Common Errors / Safety Profile Primary Risks: "Bending at the
//     waist.", "Looking down.", "Stopping after penetration.", "Poor
//     foot placement.", "Weak hip drive." / "Poor Knee Position",
//     "Lumbar Flexion", "Poor Head Position", "Loss of Balance".
//   - Contraindications: Acute Knee Injury, Acute Hip Injury, Acute
//     Lumbar Injury.
//   - "Single Leg Entry" is named only as a documented Variation (not
//     this exercise's own default bilateral form, matching the knowledge
//     base's own comment) — no "per side" or alternating language exists
//     anywhere in this fiche, matching the knowledge base's own
//     `unilateral: false` resolution exactly: `laterality: "bilateral"`.
// Method: controlled_mobility_sets / movement / technical
//   Narrowed: sets pinned to 3 (the fiche's own "3-8 sets" intersects
//   the profile's own [1,3] range at exactly {3}, the same resolution
//   already used for bear_crawl/bridging/shrimping in Lot 3). No
//   duration narrowing (see above).
const SOURCE_SHOT_ENTRIES = "50-exercises/36_SHOT_ENTRIES";

const shotEntriesStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "shot_entries_technical_failure",
    description: "Stop the set if the athlete bends at the waist, looks down, stops immediately after penetration, or shows poor foot placement or weak hip drive.",
    sourceRuleIds: [SOURCE_SHOT_ENTRIES],
  }),
  rangeOfMotionLossCondition({
    conditionId: "shot_entries_range_of_motion_loss",
    description: "Stop the set if penetration distance decreases substantially or the level change becomes shallow.",
    sourceRuleIds: [SOURCE_SHOT_ENTRIES],
  }),
  balanceLossCondition({
    conditionId: "shot_entries_balance_loss",
    description: "Stop the set if balance is lost during the entry or the recovery to base.",
    sourceRuleIds: [SOURCE_SHOT_ENTRIES],
  }),
  painCondition({
    conditionId: "shot_entries_pain",
    description: "Stop immediately if knee, hip or lumbar pain occurs, or in the presence of an acute knee, hip or lumbar injury.",
    sourceRuleIds: [SOURCE_SHOT_ENTRIES],
  }),
  completionCondition({
    conditionId: "shot_entries_completion",
    description: "Stop once the prescribed sets and duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const shotEntriesInstructions: InstructionDefinition[] = [
  makeInstruction(
    "shot_entries_setup",
    "setup",
    "Begin from a stable wrestling stance on the mat; no partner is required for a solo entry, though a partner, reaction lights, cones or coach commands may be used if available. The fiche's own typical volume is 3-10 repetitions within each prescribed set.",
    "high",
    true,
    SOURCE_SHOT_ENTRIES,
  ),
  makeInstruction(
    "shot_entries_execution",
    "execution",
    "Lower the level, keep the posture upright, drive through the lead leg, penetrate deeply, finish with intent, and recover the base after each repetition.",
    "high",
    true,
    SOURCE_SHOT_ENTRIES,
  ),
];

const shotEntriesEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "shot_entries",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "controlled_mobility_sets",
  capabilities: {
    exerciseId: "shot_entries",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["controlled_mobility_sets"],
    supportedVolumeStructures: ["sets_duration"],
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["mat"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["shot_entries_setup", "shot_entries_execution"],
    requiredStopConditionIds: [
      "shot_entries_technical_failure",
      "shot_entries_range_of_motion_loss",
      "shot_entries_balance_loss",
      "shot_entries_pain",
      "shot_entries_completion",
    ],
    durationEstimationProfileId: "duration_profile_shot_entries",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SHOT_ENTRIES, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: shotEntriesInstructions,
  stopConditionDefinitions: shotEntriesStopConditions,
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_SHOT_ENTRIES],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_SHOT_ENTRIES, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// RowErg Intervals
// Source: 50-exercises/49_ROWERG_INTERVALS
//   - Primary Classification: "Combat-Specific Conditioning" (module:
//     conditioning), matching the knowledge base's own `module:
//     "conditioning"` / `primaryAdaptation: "conditioning"` resolution.
//   - Equipment Requirements: "Required: Concept2 RowErg, or Equivalent
//     Rowing Ergometer. Optional: Heart Rate Monitor, Power Display."
//   - Loading Profile: "Typical Volume: 5-12 intervals. Work: 15
//     seconds-5 minutes. Recovery: 30 seconds-3 minutes."
//   - Coaching Cues: "Drive with the legs first.", "Brace the trunk.",
//     "Finish with the arms.", "Recover under control.", "Maintain stroke
//     quality."
//   - Common Errors: Pulling with the arms too early, Rounded lumbar
//     spine, Excessive stroke rate, Poor recovery mechanics, Starting too
//     aggressively.
//   - Performance Indicators: Average Power, Split Time, Stroke Rate,
//     Heart Rate Recovery, Power Consistency, Technical Quality.
//   - Contraindications: Acute Lumbar Injury, Acute Rib Injury, Acute
//     Shoulder Injury.
//   - Skill Requirement: "Basic rowing technique should be learned before
//     maximal intervals."
// Method: work_rest_intervals / conditioning / conditioning
//
// EXPLICIT PROFILE SELECTION. This triple is shared by all three Table
// Group 8 profiles, so it never resolves implicitly
// (`NUMERICAL_PROFILE_AMBIGUOUS`) and `registryValidators.ts` rejects any
// entry on it without a `numericalProfileId`. This entry declares
// `conditioning_long_intervals_v0_1` (INT-LONG: 4/6/10 intervals,
// 60/120/180s per interval, 30/75/120s between intervals, RPE 7/8/9).
//
// Why INT-LONG and not the other two:
//   - `conditioning_short_intervals_v0_1` (INT-SHORT) documents no
//     encodable intensity at all and is refused at validation time
//     (`NON_EXECUTABLE_NUMERICAL_PROFILE`) — it could not prescribe this
//     or any other exercise;
//   - `repeated_sprint_intervals_v0_1` encodes 3-8 second all-out efforts,
//     which is not what this fiche's own "Work: 15 seconds-5 minutes"
//     interval envelope describes, and its `movement_intent` intensity is
//     not documented anywhere in this chapter.
//
// VOLUME — honest intersection only, no conversion:
//   - intervals: the fiche's own "5-12 intervals" intersected with the
//     profile's own [4, 10] gives [5, 10]. Both bounds are declared (the
//     same convention sprawl/shot_entries already use), and the generic
//     resolver computes the intersection — a declared bound can only ever
//     narrow, never widen (`applyExerciseDoseConstraint`);
//   - work duration: the fiche's own "15 seconds-5 minutes" is WIDER than
//     the selected profile's own 60-180s per interval, on both ends. It is
//     deliberately not declared: a dose constraint cannot widen a profile,
//     and the 15-60s part of that envelope is INT-SHORT's documented
//     territory, not INT-LONG's. Selecting INT-LONG means prescribing the
//     long-interval half of this fiche, which is exactly what an explicit
//     profile selection is for;
//   - recovery: the fiche's own "30 seconds-3 minutes" contains the
//     profile's own 30-120s window entirely, so there is nothing to
//     narrow — `exerciseRestConstraints` stays null.
//
// DOCUMENTED PRECISION LOSS (distance). The fiche documents distance as a
// real prescription dimension — "# Variations: 250 m Repeats, 500 m
// Repeats, 1000 m Repeats" and "# Loading Profile — Progression:
// Distance" — and `work_rest_intervals` lists `distance` among its
// optional volume fields. `conditioning_long_intervals_v0_1` encodes no
// distance rule, so a distance-based RowErg interval CANNOT be prescribed
// through this entry, and none is invented here: no metre figure is
// converted into seconds, and no `distanceMeters` dose constraint is
// declared (the resolver would reject it with
// `EXERCISE_DOSE_CONSTRAINT_INVALID`, since the selected profile's volume
// structure does not use that dimension). Prescribing "500 m repeats"
// needs a documented distance-scoped interval profile, which is a
// numerical-table change, not a registry entry.
//
// INTENSITY. Only `rpe` is claimed. 33_EXERCISE_PRESCRIPTION_CAPABILITIES'
// own "Exercise Family 11 — Ergometer Conditioning" also lists
// heart_rate, pace, velocity and resistance_category, and this fiche's own
// Optional equipment (Heart Rate Monitor, Power Display) would supply
// them — but `IntensityRangeRule` cannot encode beats per minute, pace,
// power or any aerobic reference type (see
// `conditioning_short_intervals_v0_1`'s own comment for the full
// analysis), and this chapter documents no number for any of them
// anyway. Claiming a capability the numerical model cannot represent
// would make `supportedIntensityTypes` a wish list rather than a
// contract. The profile's own RPE 7-9 rule is used unchanged
// (`exerciseIntensityConstraints: null`) — the fiche documents no RPE
// figure of its own to narrow it with.
//
// TEMPO. `global_intent` is declared because Family 11 documents it for
// this exercise family, but `work_rest_intervals` forbids tempo and the
// profile carries no tempo rule, so the resolved prescription's tempo is
// `null`. Capability and prescription are two different statements.
//
// STOP CONDITIONS — the six categories `work_rest_intervals` requires, no
// more. Two categories documented elsewhere for this exercise are
// knowingly absent:
//   - `equipment_failure`, named by Family 11's own "Required Stop
//     Conditions", has only a set-scoped factory
//     (`equipmentFailureCondition`: scope "set", action "end_set") — a
//     boundary this method does not have, since `sets` is one of its
//     `forbiddenVolumeFields`. Writing an interval-scoped variant would
//     mean inventing its scope, action and recoverability, which
//     28_STOP_CONDITIONS.md forbids for a category it does not document
//     for this structure (the same reasoning `intervalPaceLossCondition`
//     already records for the continuous-aerobic case);
//   - `intensity_limit`, `environmental_hazard` and `time_limit`, named by
//     the conditioning MODULE contract, have no factory at all and no
//     documented shape. Neither the resolver nor `validatePrescription`
//     enforces module-level categories today, so this entry prescribes
//     completely without them — a documented gap in the module contract's
//     coverage, not a gap invented here.
// -----------------------------------------------------------------------------

const SOURCE_ROWERG_INTERVALS = "50-exercises/49_ROWERG_INTERVALS";

const rowergIntervalsStopConditions: StopConditionDefinition[] = [
  intervalPaceLossCondition({
    conditionId: "rowerg_intervals_pace_loss",
    description:
      "Stop the interval if the split time lengthens, average power falls or power consistency is lost — the fiche's own performance indicators for this exercise.",
    sourceRuleIds: [SOURCE_ROWERG_INTERVALS, SOURCE_METHOD_CATALOGUE],
  }),
  technicalFailureCondition({
    conditionId: "rowerg_intervals_technical_failure",
    description:
      "Stop the set if the arms pull too early, the lumbar spine rounds, the stroke rate becomes excessive or recovery mechanics deteriorate.",
    sourceRuleIds: [SOURCE_ROWERG_INTERVALS],
  }),
  fatigueLimitCondition({
    conditionId: "rowerg_intervals_fatigue_limit",
    description:
      "Stop the exercise once accumulated fatigue prevents meeting the documented work target on the remaining intervals.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_ROWERG_INTERVALS],
  }),
  acuteSymptomCondition({
    conditionId: "rowerg_intervals_acute_symptom",
    description:
      "Stop immediately if an acute symptom appears at any point during the intervals or the recoveries.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
  painCondition({
    conditionId: "rowerg_intervals_pain",
    description:
      "Stop immediately if pain occurs, or in the presence of an acute lumbar, rib or shoulder injury.",
    sourceRuleIds: [SOURCE_ROWERG_INTERVALS],
  }),
  completionCondition({
    conditionId: "rowerg_intervals_completion",
    description:
      "Stop once the prescribed work intervals and their per-interval duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const rowergIntervalsInstructions: InstructionDefinition[] = [
  makeInstruction(
    "rowerg_intervals_setup",
    "setup",
    "Use a Concept2 RowErg or an equivalent rowing ergometer; a heart-rate monitor and a power display are optional. Basic rowing technique should be learned before maximal intervals.",
    "high",
    true,
    SOURCE_ROWERG_INTERVALS,
  ),
  makeInstruction(
    "rowerg_intervals_execution",
    "execution",
    "Drive with the legs first, brace the trunk, finish with the arms, recover under control and maintain stroke quality. Do not start the interval too aggressively.",
    "high",
    true,
    SOURCE_ROWERG_INTERVALS,
  ),
];

const rowergIntervalsEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "rowerg_intervals",
  moduleId: "conditioning",
  role: "conditioning",
  explicitMethodId: "work_rest_intervals",
  numericalProfileId: "conditioning_long_intervals_v0_1",
  capabilities: {
    exerciseId: "rowerg_intervals",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["work_rest_intervals"],
    supportedVolumeStructures: ["intervals"],
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    // 33_EXERCISE_PRESCRIPTION_CAPABILITIES.md, "Exercise Family 11 —
    // Ergometer Conditioning": "ergometer", "machine". Both are true of
    // this apparatus, and this fiche's own "# Movement Context:
    // Machine-Based" corroborates the second.
    supportedLoadingModes: ["ergometer", "machine"],
    supportedTempoTypes: ["global_intent"],
    // Family 11's own documented laterality. Not force-fitted to
    // "bilateral": a fixed, symmetrical machine stroke has no side to
    // resolve, and `not_applicable` is the vocabulary's own value for
    // exactly that. Consistent with the knowledge base's `unilateral:
    // false`, which asserts the absence of unilateral work, not the
    // presence of a bilateral/unilateral decision.
    laterality: "not_applicable",
    volumeInterpretations: ["interval_total"],
    // Exactly the three tags `work_rest_intervals` requires. No extra tag
    // is claimed: `cyclical_conditioning` is required by
    // `continuous_aerobic_duration` alone, and nothing in this pipeline
    // reads an unrequired tag.
    capabilityTags: ["interval_structure", "timed_effort", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["rowing_ergometer"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["rowerg_intervals_setup", "rowerg_intervals_execution"],
    requiredStopConditionIds: [
      "rowerg_intervals_pace_loss",
      "rowerg_intervals_technical_failure",
      "rowerg_intervals_fatigue_limit",
      "rowerg_intervals_acute_symptom",
      "rowerg_intervals_pain",
      "rowerg_intervals_completion",
    ],
    durationEstimationProfileId: "duration_profile_rowerg_intervals",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_ROWERG_INTERVALS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: rowergIntervalsInstructions,
  stopConditionDefinitions: rowergIntervalsStopConditions,
  // "# Loading Profile — Typical Volume: 5-12 intervals", intersected with
  // the selected profile's own [4, 10]. Only the interval count is
  // constrained; see the block comment above for why the fiche's wider
  // work-duration envelope and its documented distance variations are
  // deliberately not encoded here.
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: 5 },
    maximumDose: { sets: null, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: 10 },
    sourceRuleIds: [SOURCE_ROWERG_INTERVALS],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_ROWERG_INTERVALS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Sprint Intervals
// Source: 50-exercises/47_SPRINT_INTERVALS
//   - Primary Classification: "Combat-Specific Conditioning" (module:
//     conditioning), matching the knowledge base's own resolution.
//   - Equipment Requirements: "Required: Track, Field, Flat Surface.
//     Optional: Timing Gates, GPS, Heart Rate Monitor, Sled."
//   - Physiological Profile: "Typical Work Duration: 5-10 seconds.
//     Typical Recovery: 20-90 seconds."
//   - Loading Profile: "Typical Volume: 6-15 repetitions. Sprint
//     Distance: 10-60 meters."
//   - Velocity Profile: "Maximum Speed. Maximum Intent."
//   - Coaching Cues: "Accelerate aggressively.", "Maintain posture.",
//     "Drive through the ground.", "Relax the upper body.", "Finish every
//     sprint at maximum intent."
//   - Common Errors: Starting too upright, Overstriding, Poor arm action,
//     Stopping before the finish, Training while fatigued.
//   - Performance Indicators: Sprint Time, Acceleration, Maximum Velocity,
//     Stride Frequency, Stride Length, Recovery Between Repetitions,
//     Technical Consistency.
//   - Safety Profile: Primary Risks — Hamstring Strain, Poor Warm-Up,
//     Excessive Fatigue, Poor Sprint Mechanics.
//   - Contraindications: Acute Hamstring / Calf / Achilles / Hip Flexor
//     Injury.
//   - Philosophy: "CAS prioritizes sprint quality over training volume."
// Method: work_rest_intervals / conditioning / conditioning
//
// EXPLICIT PROFILE SELECTION: `repeated_sprint_intervals_v0_1` (INT-
// REPEATED-SPRINT: 10/15/20 intervals, 3/5/8s per interval, 20/40/60s
// between intervals, `movement_intent: maximal_safe_speed`, no tempo).
// The (conditioning, work_rest_intervals, conditioning) triple is shared
// by all three Table Group 8 profiles and never resolves implicitly.
//
// Why this profile and not the other two:
//   - `conditioning_short_intervals_v0_1` (INT-SHORT) documents no
//     encodable intensity and is refused at validation time
//     (`NON_EXECUTABLE_NUMERICAL_PROFILE`);
//   - `conditioning_long_intervals_v0_1` (INT-LONG, used by
//     rowerg_intervals) encodes 60-180s RPE-controlled efforts — an
//     aerobic-interval envelope that this fiche's own 5-10 second
//     ATP-PC efforts and "Maximum Intent" velocity profile contradict.
//   INT-REPEATED-SPRINT's own table also states it is "unavailable when
//   the exercise is not sprint-compatible" — this fiche's "# Movement
//   Pattern — Primary: Sprint" is exactly that compatibility.
//
// ELIGIBILITY. Governed entirely by the knowledge base, which already
// documents the three gates this exercise needs and no equipment at all:
// `sprinting_allowed`, `floor_safe` and `sufficient_space` (minimum
// "large"). Nothing is added, mirrored or re-encoded here: no equipment
// capability is invented to stand in for "Track, Field, Flat Surface"
// (those are the SURFACE the environment gates already describe, not an
// implement the athlete carries), and the Optional timing gates / GPS /
// heart-rate monitor / sled are excluded, matching the established
// discipline of never promoting an Optional item to Required. The sled in
// particular belongs to the documented "Resisted Sprint" variation, not
// to this base entry.
//
// VOLUME — one honest intersection, one deliberate abstention:
//   - work duration: the fiche's own "Typical Work Duration: 5-10
//     seconds" intersected with the profile's own [3, 8] gives [5, 8].
//     Same dimension, same unit, same per-effort scope — a real
//     narrowing, declared;
//   - interval count: the fiche documents "Typical Volume: 6-15
//     repetitions" while the profile (and 34_NUMERICAL_PRESCRIPTION_
//     TABLES.md's own INT-REPEATED-SPRINT table) counts "10-20
//     intervals". These are two different documented dimensions with two
//     different names, and this registry does not treat one as a synonym
//     for the other — the same discipline already applied to "rounds"
//     vs. "sets" for footwork_drills/shadow_boxing/sprawl. No
//     `workIntervals` constraint is therefore derived from the fiche's
//     repetition count.
//     DOCUMENTED CONSEQUENCE, flagged rather than silently reconciled:
//     the interval count stays governed by the shared profile alone, so
//     `rangeContext: "high"` prescribes 20 intervals — above the 15 this
//     fiche names as its own typical upper bound. Resolving that needs a
//     documented rule for mapping a chapter's "repetitions" onto the
//     interval dimension (or a fiche revision), not a silent assumption
//     here.
//
// DOCUMENTED PRECISION LOSS (distance). The fiche documents distance as a
// first-class dimension — "# Loading Profile — Sprint Distance: 10-60
// meters", "# Variations: 10 m / 20 m / 30 m Sprint", "Progression:
// Distance" — and `work_rest_intervals` lists `distance` among its
// optional volume fields. `repeated_sprint_intervals_v0_1` encodes no
// distance rule, so a distance-based sprint interval CANNOT be prescribed
// through this entry. No metre figure is converted into seconds, no
// second into metres, and no `distanceMeters` dose constraint is declared
// (the resolver would reject it with `EXERCISE_DOSE_CONSTRAINT_INVALID`,
// the selected profile's volume structure not using that dimension).
// Prescribing "20 m sprints" needs a documented distance-scoped interval
// profile — a numerical-table change, out of scope here.
//
// INTENSITY. `movement_intent: maximal_safe_speed` only — the profile's
// own single documented rule, and the finite vocabulary's representation
// of the fiche's "# Velocity Profile: Maximum Speed. Maximum Intent."
// 33_EXERCISE_PRESCRIPTION_CAPABILITIES' own "Exercise Family 10 —
// Sprints and Locomotion" also lists pace, velocity, heart_rate, rpe and
// technical_effort, and this fiche's Optional timing gates / GPS / heart-
// rate monitor would supply the first three — but none is encodable by
// `IntensityRangeRule` today, and this chapter documents no number for
// any of them. A qualitative category rule carries no range, so the
// prescribed intent is identical under reduced, normal and high: the
// range context moves volume and rest, never the instruction to sprint
// at maximal safe speed.
//
// TEMPO. `global_intent` is declared because Family 10 documents it for
// this family, but `work_rest_intervals` forbids tempo and the profile
// carries none, so the resolved tempo is `null`.
//
// STOP CONDITIONS — the six categories `work_rest_intervals` requires, no
// more. `environmental_hazard`, named by Family 10's own "Required Stop
// Conditions" and plausible for outdoor sprinting, is knowingly absent:
// no factory exists for that category and 28_STOP_CONDITIONS.md documents
// no scope, action or recoverability for it, so writing one would mean
// inventing all three. The same documented gap already recorded for
// rowerg_intervals (`equipment_failure`) and for the conditioning MODULE
// contract's own `intensity_limit` / `environmental_hazard` /
// `time_limit`, none of which any resolver enforces today.
// -----------------------------------------------------------------------------

const SOURCE_SPRINT_INTERVALS = "50-exercises/47_SPRINT_INTERVALS";

const sprintIntervalsStopConditions: StopConditionDefinition[] = [
  intervalPaceLossCondition({
    conditionId: "sprint_intervals_pace_loss",
    description:
      "Stop the interval if sprint time lengthens or acceleration and maximum velocity visibly drop — sprint quality is prioritized over training volume.",
    sourceRuleIds: [SOURCE_SPRINT_INTERVALS, SOURCE_METHOD_CATALOGUE],
  }),
  technicalFailureCondition({
    conditionId: "sprint_intervals_technical_failure",
    description:
      "Stop the set if the start becomes too upright, the athlete overstrides, arm action deteriorates or sprints are no longer finished through the line.",
    sourceRuleIds: [SOURCE_SPRINT_INTERVALS],
  }),
  fatigueLimitCondition({
    conditionId: "sprint_intervals_fatigue_limit",
    description:
      "Stop the exercise once accumulated fatigue prevents sprinting at maximum intent; sprinting while fatigued is a documented risk, not a training stimulus.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_SPRINT_INTERVALS],
  }),
  acuteSymptomCondition({
    conditionId: "sprint_intervals_acute_symptom",
    description:
      "Stop immediately if an acute symptom appears at any point during the sprints or the recoveries.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
  painCondition({
    conditionId: "sprint_intervals_pain",
    description:
      "Stop immediately if pain occurs, or in the presence of an acute hamstring, calf, Achilles or hip-flexor injury.",
    sourceRuleIds: [SOURCE_SPRINT_INTERVALS],
  }),
  completionCondition({
    conditionId: "sprint_intervals_completion",
    description:
      "Stop once the prescribed sprint intervals and their per-interval duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const sprintIntervalsInstructions: InstructionDefinition[] = [
  makeInstruction(
    "sprint_intervals_setup",
    "setup",
    "Sprint on a track, field or other flat surface, in an environment where full-speed running is permitted. Timing gates, GPS, a heart-rate monitor and a sled are optional. Sprint mechanics should be learned before sprinting at maximum intent.",
    "high",
    true,
    SOURCE_SPRINT_INTERVALS,
  ),
  makeInstruction(
    "sprint_intervals_execution",
    "execution",
    "Accelerate aggressively, maintain posture, drive through the ground, relax the upper body and finish every sprint at maximum intent. Do not stop before the finish.",
    "high",
    true,
    SOURCE_SPRINT_INTERVALS,
  ),
];

const sprintIntervalsEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "sprint_intervals",
  moduleId: "conditioning",
  role: "conditioning",
  explicitMethodId: "work_rest_intervals",
  numericalProfileId: "repeated_sprint_intervals_v0_1",
  capabilities: {
    exerciseId: "sprint_intervals",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["work_rest_intervals"],
    supportedVolumeStructures: ["intervals"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    // 33_EXERCISE_PRESCRIPTION_CAPABILITIES.md, "Exercise Family 10 —
    // Sprints and Locomotion": "locomotion_only", "sled",
    // "resistance_band". Only the first is declared — `sled` and
    // `resistance_band` serve the documented Resisted Sprint variation,
    // which this entry does not represent. `bodyweight` is deliberately
    // NOT claimed: this family's documentation never gives it, and
    // `locomotion_only` is the mode written for exactly this case.
    supportedLoadingModes: ["locomotion_only"],
    supportedTempoTypes: ["global_intent"],
    // Family 10's own documented laterality ("Normally: not_applicable"),
    // consistent with the knowledge base's `unilateral: false`.
    laterality: "not_applicable",
    volumeInterpretations: ["interval_total"],
    // Exactly the three tags `work_rest_intervals` requires.
    capabilityTags: ["interval_structure", "timed_effort", "technical_quality_observation"],
    // Deliberately empty: the knowledge base already gates this exercise
    // on `sprinting_allowed` + `floor_safe` + `sufficient_space` ("large"),
    // and its own `requirements` declare no equipment atom whatsoever. No
    // capability id is invented here to mirror an environment gate — that
    // would move an eligibility decision out of the knowledge base, which
    // owns it.
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["sprint_intervals_setup", "sprint_intervals_execution"],
    requiredStopConditionIds: [
      "sprint_intervals_pace_loss",
      "sprint_intervals_technical_failure",
      "sprint_intervals_fatigue_limit",
      "sprint_intervals_acute_symptom",
      "sprint_intervals_pain",
      "sprint_intervals_completion",
    ],
    durationEstimationProfileId: "duration_profile_sprint_intervals",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SPRINT_INTERVALS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: sprintIntervalsInstructions,
  stopConditionDefinitions: sprintIntervalsStopConditions,
  // "# Physiological Profile — Typical Work Duration: 5-10 seconds",
  // intersected with the selected profile's own [3, 8] seconds per
  // interval. Only that dimension is constrained; see the block comment
  // above for why the fiche's "6-15 repetitions" is NOT read as an
  // interval count and why its documented sprint distance is not encoded.
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 5, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 8, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_SPRINT_INTERVALS],
  },
  exerciseIntensityConstraints: null,
  // "# Physiological Profile — Typical Recovery: 20-90 seconds" fully
  // contains the profile's own 20-60s between-intervals window, so there
  // is nothing to narrow — a wider documented range never widens a profile.
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_SPRINT_INTERVALS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Ab Wheel Rollout
// Source: 50-exercises/62_CORE/10_AB_WHEEL.md
//   - Exercise Family: "Anti-Extension Core Exercise"; module core.
//   - Equipment Requirements: "Required Equipment: Ab Wheel." The
//     "Acceptable Alternatives" are denied equivalence by the fiche itself
//     and are not represented — see the equipment note below.
//   - Prescription Profile: "Valid Set Range — 2 to 5 sets", "Valid
//     Repetition Range — 3 to 12 repetitions", "Rest Range — 45 to 120
//     seconds", "Default Rest — 60 to 90 seconds".
//   - Intensity Regulation: "The Ab Wheel does not use percentage of
//     one-repetition maximum." "Recommended Effort — Approximately RPE 6
//     to 8." "Technical Repetitions in Reserve — 1 to 3."
//   - Tempo Options: "3-1-2", "2-0-2", "4-1-2".
//   - Core Principle: "The rollout distance is valid only while the athlete
//     can maintain trunk position."
//   - Stopping Rules and Common Errors: quoted in the stop conditions below.
//   - Technical Complexity: "Complexity Level: 3 — Intermediate".
// Method: straight_sets_repetitions / core / robustness
//   (core_robustness_straight_sets_v0_1 — sets 2/3/5, reps 3/10/15,
//   RPE 6/7/8, rest 45/60/120s, tempo global_intent controlled)
//
// PROFILE. Table Group 13's own profile, whose triple
// (core, straight_sets_repetitions, robustness) is unique — implicit
// resolution would already select it. The id is declared explicitly all
// the same: this entry is the profile's first consumer, and naming the
// selection at the entry keeps the decision auditable in the Decision
// Trace rather than inferred from the absence of a competitor. The role
// mirrors Table Group 4's own Core role list and the four existing Core
// entries, all of which use `robustness`.
//
// NARROWING — one dimension, honestly:
//   - repetitions: the fiche's "3 to 12" intersected with the profile's
//     own [3, 15] gives [3, 12]. Declared;
//   - sets: the fiche's "2 to 5" IS the profile's own envelope — that
//     envelope was built from this family's records, so there is nothing
//     to narrow. Both bounds are declared anyway, as sprawl/shot_entries
//     already do, so the entry states its own documented range rather
//     than relying on the envelope happening to match;
//   - rest: the fiche's "45 to 120 seconds" is the profile's own window
//     exactly — `exerciseRestConstraints` stays null. The narrower
//     "Default Rest — 60 to 90 seconds" is a default WITHIN the valid
//     range, not a replacement for it, and is not encoded as a bound;
//   - intensity: the fiche's "RPE 6 to 8" is the profile's own band
//     exactly — `exerciseIntensityConstraints` stays null.
//
// NOT CONVERTED. The fiche's difficulty model is explicitly non-numeric:
// "Difficulty is primarily determined by: rollout distance; lever length;
// body position; control; tempo; and variation." None of that is turned
// into a number here. Specifically:
//   - rollout distance and range of motion are never converted into
//     repetitions, load or intensity — they belong to the execution
//     instruction below and to the range-of-motion stop condition;
//   - "Technical Repetitions in Reserve — 1 to 3" is NOT converted into
//     an RPE value. `rir` is a real IntensityType, but the Core module's
//     own contract does not authorise it (allowed: rpe, technical_effort,
//     absolute_load, percentage_body_mass, resistance_category), so it is
//     neither claimed nor silently folded into the RPE band;
//   - the documented phase tempos (3-1-2 / 2-0-2 / 4-1-2) are not
//     representable by a numerical profile's tempo rule (global_intent /
//     phase_intent / isometric_hold / none only). The prescribed tempo is
//     the profile's `global_intent: controlled`; the phase timings stay in
//     the execution instruction, where the athlete can read them. This is
//     a documented precision loss, recorded in Table Group 13 itself.
//
// EQUIPMENT. `ab_wheel`, added to both vocabularies in this same change to
// replace the `"other"` catch-all the knowledge base had flagged. Exact
// matching, no equivalence group: the fiche lists alternatives and denies
// their equivalence in the same section.
//
// STOP CONDITIONS — five categories. `straight_sets_repetitions` requires
// three (technical_failure, pain, completion); the Core module documents
// six. `range_of_motion_loss` and `fatigue_limit` are added because this
// fiche's own "Stopping Rules" name them explicitly, not to reach a count.
// `balance_loss`, the module's sixth, is knowingly absent: nothing in this
// fiche describes a loss of balance — its Stopping Rules describe loss of
// trunk position, of range, of control and of breathing. Module-level
// categories are not enforced by any resolver today, a documented gap
// already recorded for the conditioning entries.
// -----------------------------------------------------------------------------

const SOURCE_AB_WHEEL = "50-exercises/62_CORE/10_AB_WHEEL.md";

const abWheelStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "ab_wheel_technical_failure",
    description:
      "Stop the set if lumbar extension becomes visible and cannot be corrected immediately, the rib cage and pelvis lose alignment, the hips sag toward the floor, or the return requires excessive momentum.",
    sourceRuleIds: [SOURCE_AB_WHEEL],
  }),
  rangeOfMotionLossCondition({
    conditionId: "ab_wheel_range_of_motion_loss",
    description:
      "Stop the set if the rollout range shortens involuntarily because of fatigue, or extends beyond the range the athlete can control — the rollout distance is valid only while trunk position is maintained.",
    sourceRuleIds: [SOURCE_AB_WHEEL],
  }),
  fatigueLimitCondition({
    conditionId: "ab_wheel_fatigue_limit",
    description:
      "Stop the exercise once fatigue produces repeated technical breakdown or breathing becomes uncontrolled. The set is not taken to muscular failure, and the planned repetition target is never a reason to continue.",
    sourceRuleIds: [SOURCE_AB_WHEEL],
  }),
  painCondition({
    conditionId: "ab_wheel_pain",
    description:
      "Stop immediately if the athlete reports pain, if the shoulders collapse or become painful, or in the presence of any documented hard exclusion for this exercise.",
    sourceRuleIds: [SOURCE_AB_WHEEL],
  }),
  completionCondition({
    conditionId: "ab_wheel_completion",
    description: "Stop once the prescribed sets and repetitions are completed with the intended trunk position preserved.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const abWheelInstructions: InstructionDefinition[] = [
  makeInstruction(
    "ab_wheel_setup",
    "setup",
    "Place the ab wheel on a stable, non-slip surface and start from a kneeling position, holding the wheel with both hands. Kneel on a pad if required for comfort. The standing rollout is an advanced position this prescription does not cover.",
    "high",
    true,
    SOURCE_AB_WHEEL,
  ),
  makeInstruction(
    "ab_wheel_execution",
    "execution",
    "Roll the wheel forward while resisting lumbar extension, keeping the rib cage and pelvis controlled, then return using the abdominal wall, shoulders and trunk together. Move at a controlled speed — a documented option is 3 seconds out, a 1-second pause and 2 seconds back. Range of motion must be earned through control: a technically shorter repetition is preferable to a longer invalid one.",
    "high",
    true,
    SOURCE_AB_WHEEL,
  ),
];

const abWheelEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "ab_wheel",
  moduleId: "core",
  role: "robustness",
  explicitMethodId: "straight_sets_repetitions",
  numericalProfileId: "core_robustness_straight_sets_v0_1",
  capabilities: {
    exerciseId: "ab_wheel",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    // Both metrics the shared profile documents. `rir` is deliberately
    // absent despite the fiche's own "Technical Repetitions in Reserve —
    // 1 to 3": the Core module contract does not authorise that type.
    supportedIntensityTypes: ["rpe", "technical_effort"],
    preferredIntensityTypes: ["rpe"],
    // "Loading Type: Bodyweight with leverage-based loading." No external
    // load is prescribed — "External load is not normally required in the
    // initial kneeling variation."
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    // Both hands drive one implement through a symmetric sagittal
    // rollout, and the fiche prescribes no per-side allocation anywhere —
    // unlike Dead Bug or Pallof Press, whose own records say "per side".
    // `bilateral` is the documented shape of the movement, not an
    // inference from the knowledge base's `unilateral: false`.
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    // Exactly the two tags `straight_sets_repetitions` requires.
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["ab_wheel"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["ab_wheel_setup", "ab_wheel_execution"],
    requiredStopConditionIds: [
      "ab_wheel_technical_failure",
      "ab_wheel_range_of_motion_loss",
      "ab_wheel_fatigue_limit",
      "ab_wheel_pain",
      "ab_wheel_completion",
    ],
    durationEstimationProfileId: "duration_profile_ab_wheel",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_AB_WHEEL, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe", "technical_effort"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: abWheelInstructions,
  stopConditionDefinitions: abWheelStopConditions,
  // "Valid Set Range — 2 to 5 sets" and "Valid Repetition Range — 3 to 12
  // repetitions", intersected with the shared profile's own [2, 5] sets
  // and [3, 15] repetitions. Only the repetition ceiling actually narrows.
  exerciseDoseConstraints: {
    minimumDose: { sets: 2, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 5, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_AB_WHEEL],
  },
  // "Recommended Effort — Approximately RPE 6 to 8" is the profile's own
  // band exactly; nothing to narrow.
  exerciseIntensityConstraints: null,
  // "Rest Range — 45 to 120 seconds" is the profile's own window exactly;
  // nothing to narrow.
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_AB_WHEEL, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Dead Bug
// Source: 50-exercises/62_CORE/12_DEAD_BUG.md
//   - Primary Classification: "Movement and Control"; Primary Adaptation:
//     "Movement"; module core.
//   - Movement Context: "Supine, Closed Trunk Position, Contralateral,
//     Controlled, Bodyweight".
//   - Loading Profile: "Typical Volume — 2-4 sets", "Repetitions — 5-10
//     per side", "Recovery — 20-60 seconds". ("Alternative Prescription —
//     20-45 seconds per set" is the DURATION variant; see below.)
//   - Velocity Profile: "Slow. Controlled. Position-Dominant. No Ballistic
//     Intent."
//   - Equipment Requirements: "Required — Floor Space." Optional: Exercise
//     Mat, Resistance Band, Light Dumbbell, Light Kettlebell, Stability
//     Ball, Wall.
//   - Technical Failure Criteria and Key Coaching Cues: quoted below.
//   - Fatigue Profile: every axis at the lowest level; "Overall Fatigue
//     Cost: Very Low".
// Method: straight_sets_repetitions / core / robustness
//   (core_robustness_straight_sets_v0_1 — sets 2/3/5, reps 3/10/15,
//   RPE 6/7/8 or technical_effort high_quality, rest 45/60/120s,
//   tempo global_intent controlled)
//
// LATERALITY — the first `alternating` entry in this registry, and the
// reason the laterality plumbing was fixed immediately before it.
//
// Three independent statements in the fiche settle it:
//   - "# Loading Profile — Repetitions: 5-10 PER SIDE";
//   - "# Movement Context — Contralateral";
//   - "# Execution Standard — Extend the prescribed arm, leg or opposite
//     arm-and-leg combination ... Return under control and repeat on the
//     opposite side when required."
// The sides alternate WITHIN a set and each receives the prescribed count:
// that is `alternating`, not `unilateral` (which would mean completing one
// side before switching — this fiche never says that) and not `bilateral`
// (which would mean both sides working together). The interpretation is
// `repetitions_per_side`, not `alternating_total_repetitions`: the fiche
// counts per side, so the resolved number is per side.
//
// The knowledge base's own `unilateral: false` is NOT read as "no per-side
// work" — its own comment says the opposite, describing "equal work on
// both sides within the same set". `unilateral: false` denies a
// single-sided specialization; it says nothing about how the count is
// allocated.
//
// NO MULTIPLICATION. A per-side interpretation LABELS the resolved count.
// 10 repetitions per side is prescribed as `reps = 10` carrying
// `interpretation: "repetitions_per_side"` — never as 20 total, and never
// as 5 per side halved from a total. No resolver multiplies, halves or
// converts anything for laterality.
//
// VOLUME — three real narrowings, all from the fiche's own numbers:
//   - sets: "2-4 sets" intersected with the profile's own [2, 5] → [2, 4];
//   - repetitions: "5-10 per side" intersected with [3, 15] → [5, 10];
//   - rest: "Recovery — 20-60 seconds" intersected with the profile's own
//     45-120s → [45, 60]. The fiche's own 20-second floor sits BELOW the
//     Core rest doctrine's 45-second floor, and a constraint can only
//     narrow: the effective floor stays 45. Declared as 20/60 so the entry
//     states its own documented range and the generic resolver computes
//     the intersection, exactly as `applyExerciseDoseConstraint` does for
//     volume.
//
// VARIANT SCOPE. This entry represents the REPETITION variant only. The
// fiche's "Alternative Prescription — 20-45 seconds per set" is a separate,
// duration-based variant: `straight_sets_repetitions` forbids the duration
// volume field outright, and converting seconds into repetitions is exactly
// the conversion this registry refuses. The same applies to the documented
// breathing work ("Exhale through the difficult portion", "Breathing Under
// Tension"): breaths are never counted as repetitions. Both stay in the
// instructions, where the athlete reads them.
//
// INTENSITY. `technical_effort` only, and deliberately NOT `rpe`. Unlike
// ab_wheel and pallof_press — whose own chapters state "Approximately RPE 6
// to 8" — this fiche documents no RPE figure anywhere, and no intensity
// metric at all in its Loading Profile. What it does document is a quality
// endpoint: nine "Technical Failure Criteria", "A set ends when trunk
// position can no longer be maintained", and "Use low-intensity variations
// ... without approaching technical failure". `technical_effort:
// high_quality` is the profile's own documented alternative rule and the
// Core module's own first preferred intensity type. Claiming the profile's
// RPE band here would be importing a number this chapter never gives.
//
// EQUIPMENT. None. "Required — Floor Space" is space, not an implement,
// and the knowledge base already gates the exercise on `sufficient_space`
// (minimum "very_limited"). The Exercise Mat is listed under Optional and
// is NOT promoted to required — the same Optional-stays-optional discipline
// applied to the sled for sprint_intervals and the heart-rate monitor for
// rowerg_intervals. `mat` already exists in the vocabulary and is
// deliberately not claimed.
//
// STOP CONDITIONS — four categories. `straight_sets_repetitions` requires
// technical_failure, pain and completion; `range_of_motion_loss` is added
// because this fiche names it explicitly ("Range of Motion Exceeding
// Positional Control"). `fatigue_limit` is deliberately absent, unlike
// ab_wheel: every fatigue axis in this chapter is rated at its lowest
// level, "Overall Fatigue Cost: Very Low", and the documented set endpoint
// is positional, not fatigue-driven — "A set ends when trunk position can
// no longer be maintained", which is the technical_failure condition.
// `balance_loss` is absent too: nothing supine describes a loss of balance.
// -----------------------------------------------------------------------------

const SOURCE_DEAD_BUG = "50-exercises/62_CORE/12_DEAD_BUG.md";

const deadBugStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "dead_bug_technical_failure",
    description:
      "Stop the set if the lumbar spine extends, the ribs flare, the pelvis tilts anteriorly or rotates, abdominal tension is lost, breathing is held without intent, or limb movement becomes rapid and uncontrolled. A set ends when trunk position can no longer be maintained.",
    sourceRuleIds: [SOURCE_DEAD_BUG],
  }),
  rangeOfMotionLossCondition({
    conditionId: "dead_bug_range_of_motion_loss",
    description:
      "Stop the set if the limbs travel beyond the range the athlete can control, or if repetition quality becomes asymmetrical between the two sides.",
    sourceRuleIds: [SOURCE_DEAD_BUG],
  }),
  painCondition({
    conditionId: "dead_bug_pain",
    description:
      "Stop immediately if low-back, hip-flexor or shoulder pain occurs during supine limb movement, or if the athlete cannot lie supine comfortably.",
    sourceRuleIds: [SOURCE_DEAD_BUG],
  }),
  completionCondition({
    conditionId: "dead_bug_completion",
    description:
      "Stop once the prescribed sets and per-side repetitions are completed with the ribcage and pelvis aligned throughout.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const deadBugInstructions: InstructionDefinition[] = [
  makeInstruction(
    "dead_bug_setup",
    "setup",
    "Lie supine on the floor with the hips and knees flexed to approximately 90 degrees and the arms above the shoulders. An exercise mat is optional. Set the ribcage over the pelvis without forcing the lower back into the floor, and create gentle circumferential trunk tension while breathing normally.",
    "high",
    true,
    SOURCE_DEAD_BUG,
  ),
  makeInstruction(
    "dead_bug_execution",
    "execution",
    "Brace before the limbs move, then extend the opposite arm and leg slowly — a documented option is 2 to 4 seconds of controlled extension with a 1 to 2 second pause near end range. Reach long rather than low, stop at the furthest range that preserves trunk position, return under control and repeat on the opposite side. The prescribed repetitions are per side. Exhale through the difficult portion without losing tension.",
    "high",
    true,
    SOURCE_DEAD_BUG,
  ),
];

const deadBugEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "dead_bug",
  moduleId: "core",
  role: "robustness",
  explicitMethodId: "straight_sets_repetitions",
  numericalProfileId: "core_robustness_straight_sets_v0_1",
  capabilities: {
    exerciseId: "dead_bug",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    // technical_effort ONLY — this chapter documents no RPE figure. See the
    // block comment above.
    supportedIntensityTypes: ["technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    // "# Movement Context — ... Bodyweight". No external load is
    // prescribed; the optional band, dumbbell and kettlebell belong to
    // documented progressions this entry does not represent.
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    // See the block comment: "5-10 per side" within a contralateral set.
    laterality: "alternating",
    volumeInterpretations: ["repetitions_per_side"],
    // Exactly the two tags `straight_sets_repetitions` requires.
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    // "Required — Floor Space" is space, already gated by the knowledge
    // base; the Exercise Mat is Optional and is not promoted.
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["dead_bug_setup", "dead_bug_execution"],
    requiredStopConditionIds: [
      "dead_bug_technical_failure",
      "dead_bug_range_of_motion_loss",
      "dead_bug_pain",
      "dead_bug_completion",
    ],
    durationEstimationProfileId: "duration_profile_dead_bug",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_DEAD_BUG, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: deadBugInstructions,
  stopConditionDefinitions: deadBugStopConditions,
  // "Typical Volume — 2-4 sets" and "Repetitions — 5-10 per side",
  // intersected with the shared profile's own [2, 5] sets and [3, 15]
  // repetitions. The repetition figure is per side and stays per side —
  // it is never doubled into a total.
  exerciseDoseConstraints: {
    minimumDose: { sets: 2, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 4, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_DEAD_BUG],
  },
  exerciseIntensityConstraints: null,
  // "Recovery — 20-60 seconds". The documented floor is below the Core rest
  // doctrine's own 45-second floor; a constraint can only narrow, so the
  // effective window is 45-60s. Declared as documented, intersection left
  // to the generic resolver.
  exerciseRestConstraints: {
    scope: "between_sets",
    minimumSeconds: 20,
    maximumSeconds: 60,
    sourceRuleIds: [SOURCE_DEAD_BUG],
  },
  sourceRuleIds: [SOURCE_DEAD_BUG, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Hanging Leg Raise
// Source: 50-exercises/62_CORE/14_HANGING_LEG_RAISE.md
//   - Primary Adaptation: "Robustness" (explicit) — the module role below
//     is not a convention borrowed from the other Core entries here, it is
//     this chapter's own adaptation.
//   - Movement Context: "Suspended, Dynamic, Long Lever, Bodyweight, Closed
//     Grip, Open Kinetic Chain Lower Limbs".
//   - Equipment Requirements: "Required — Stable pull-up bar or equivalent
//     overhead structure." Optional: neutral-grip handles, gymnastics
//     rings, captain's chair, ab straps, ankle weights, resistance band,
//     chalk.
//   - Space Requirements: vertical clearance for full suspension,
//     horizontal clearance, "Stable non-slip landing area", "No nearby
//     objects within leg-swing range".
//   - Programming Applications — "Core Strength Development: 3-5 sets, 5-12
//     repetitions, Controlled tempo, 60-150 seconds recovery" (see the
//     variant note below).
//   - Velocity Profile: "Recommended Velocity: Controlled"; concentric 1-2s,
//     eccentric 2-4s, pauses 0-1s and 0-2s; "Ballistic Execution: Not
//     recommended for the standard CAS variation".
//   - Technical Failure Criteria: ten items, quoted in the stop conditions.
//   - Fatigue Profile: "Fatigue Sensitivity: High" with a documented
//     signature (reduced pelvic rotation, shorter range, increasing swing,
//     faster uncontrolled lowering, grip opening).
//   - Technical Complexity: "Level 4 — Advanced Technique".
// Method: straight_sets_repetitions / core / robustness
//   (core_robustness_straight_sets_v0_1 — sets 2/3/5, reps 3/10/15,
//   RPE 6/7/8 or technical_effort high_quality, rest 45/60/120s,
//   tempo global_intent controlled)
//
// PROFILE. The existing Core repetition profile, unchanged — no new profile
// was created, and none was needed: every dimension this chapter documents
// intersects it non-degenerately (see below).
//
// WHICH PROGRAMMING APPLICATION. This chapter is unusual: it documents no
// sets/repetitions/rest in its own "# Loading Profile" (that section lists
// only load-regulation methods), and instead gives FIVE numbered
// "Programming Applications" — Core Strength Development, Trunk Endurance,
// Grip and Core Integration, Bodyweight Strength, Technical Practice — each
// with its own ranges. Picking one is a real decision, so it is made from
// the chapter's own selection rule rather than by preference: "# CAS
// Selection Logic — CAS may select the Hanging Leg Raise when: The target
// adaptation includes advanced CORE STRENGTH", and "# Decision Summary —
// The Hanging Leg Raise is an advanced suspended CORE-STRENGTH exercise".
// The application literally named "Core Strength Development" is the one
// CAS's own logic points at, and it is the one encoded here. The other four
// remain documented, unrepresented alternatives — a second entry, not a
// silent blend of five ranges.
//
// VOLUME — three real narrowings, all from that application:
//   - sets: "3-5 sets" intersected with the profile's own [2, 5] → [3, 5];
//   - repetitions: "5-12 repetitions" intersected with [3, 15] → [5, 12];
//   - rest: "60-150 seconds recovery" intersected with the profile's own
//     45-120s → [60, 120]. The documented ceiling of 150s sits ABOVE the
//     Core rest doctrine's own 120s ceiling and a constraint can only
//     narrow, so 120 stands — the mirror image of dead_bug, whose floor sat
//     below the doctrine's.
//
// NOT CONVERTED. This chapter's difficulty model is explicitly non-numeric:
// "# Loading Profile — Load Regulation Methods: Knee Flexion, Leg Length,
// Range of Motion, Tempo, Pause Duration, External Ankle Load." None of it
// becomes a number:
//   - knee flexion and leg length are LEVER choices, not a repetition or
//     load figure. The six-stage Progression Model (knee raise → partial
//     straight-leg → full → toes-to-bar) is a variation ladder, never a
//     numeric scale;
//   - "thighs at or above horizontal" is a position standard, not an
//     amplitude converted into intensity;
//   - the Velocity Profile's phase durations are not representable by a
//     numerical tempo rule and are not summed into anything;
//   - External Ankle Load is Optional and explicitly gated — "CAS does not
//     increase external load until the athlete can eliminate swing" — so no
//     loading mode beyond bodyweight is claimed.
//
// LATERALITY. `bilateral` with `total_repetitions`. Both hands hang from
// one bar and both legs move together throughout: "# Execution Standard —
// The legs begin still and aligned beneath the body", "Raise the knees or
// straight legs according to the prescribed variation". No "per side", "each
// side" or alternating language appears anywhere in this chapter. This is
// read from the execution standard, not inferred from the knowledge base's
// `unilateral: false` — though that entry's own comment reaches the same
// conclusion from the same text.
//
// INTENSITY. `technical_effort` only, like dead_bug and unlike ab_wheel.
// This chapter documents no RPE figure anywhere (verified by direct
// search), and its Programming Applications quantify sets, repetitions and
// recovery but never effort. What it does document is a quality endpoint:
// ten Technical Failure Criteria, "Maximum Recommended Loading Context —
// Technically strict repetitions with full control", and a Fatigue Profile
// whose whole signature is technical degradation. `technical_effort:
// high_quality` is the profile's own documented alternative rule and the
// Core module's first preferred intensity type.
//
// EQUIPMENT. `pull_up_bar` + `safe_landing_surface`, both already in the
// vocabulary and both already what the knowledge base gates this exercise
// on — no identifier is added. "or equivalent overhead structure" is a
// paraphrase of the same apparatus, not an equivalence group, and the
// Optional items (rings, captain's chair, ab straps, ankle weights, band,
// chalk) are not promoted. `rigid_anchor_support` is deliberately NOT used:
// it means Dragon Flag's own overhead or behind-head HAND anchor, a
// different apparatus from a bar the athlete hangs from. `dip_bars` is not
// used either.
//
// STOP CONDITIONS — five categories, every one named by this chapter's own
// "# Technical Failure Criteria" or Fatigue Profile:
//   - `equipment_failure` carries "The athlete loses grip security". No new
//     factory was invented for it: `equipmentFailureCondition` already
//     documents itself as "Loss of secure control of the
//     implement/equipment (GRIP, dropped load, rack failure)", is scoped to
//     the set — a real boundary for `straight_sets_repetitions`, unlike the
//     interval case — and `pinch_carry` already uses it for exactly this
//     grip-loss meaning;
//   - `fatigue_limit` is included here and was NOT for dead_bug: this
//     chapter documents "Fatigue Sensitivity: High" and a whole fatigue
//     signature, where dead_bug rated every fatigue axis at its lowest.
// `balance_loss`, the Core module's sixth category, stays absent: nothing
// in a hang describes a loss of balance. Module-level categories are not
// enforced by any resolver today — a documented gap already recorded for
// earlier entries.
// -----------------------------------------------------------------------------

const SOURCE_HANGING_LEG_RAISE = "50-exercises/62_CORE/14_HANGING_LEG_RAISE.md";

const hangingLegRaiseStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "hanging_leg_raise_technical_failure",
    description:
      "Stop the set if the athlete relies on repeated swinging to raise the legs, the pelvis no longer rotates posteriorly, the movement becomes almost entirely hip flexion, the shoulders collapse into a passive hang, the elbows bend substantially, the lumbar spine extends excessively at the bottom, the eccentric phase cannot be controlled, or the athlete kicks or jerks to complete a repetition.",
    sourceRuleIds: [SOURCE_HANGING_LEG_RAISE],
  }),
  rangeOfMotionLossCondition({
    conditionId: "hanging_leg_raise_range_of_motion_loss",
    description:
      "Stop the set if the range shortens so the thighs no longer reach at least horizontal, or if the range can only be reached by losing trunk position.",
    sourceRuleIds: [SOURCE_HANGING_LEG_RAISE],
  }),
  equipmentFailureCondition({
    conditionId: "hanging_leg_raise_grip_failure",
    description:
      "Stop the set as soon as grip security is lost or the hands begin to open on the bar — a suspended athlete cannot continue safely on a failing grip.",
    sourceRuleIds: [SOURCE_HANGING_LEG_RAISE],
  }),
  fatigueLimitCondition({
    conditionId: "hanging_leg_raise_fatigue_limit",
    description:
      "Stop the exercise once fatigue produces the documented signature: reduced pelvic rotation, increasing swing, faster uncontrolled lowering or loss of the active shoulder position. Technical quality deteriorates rapidly once grip, shoulder stability or trunk control is exhausted.",
    sourceRuleIds: [SOURCE_HANGING_LEG_RAISE],
  }),
  painCondition({
    conditionId: "hanging_leg_raise_pain",
    description:
      "Stop immediately if pain occurs in the shoulder, elbow, wrist, lumbar spine or hip.",
    sourceRuleIds: [SOURCE_HANGING_LEG_RAISE],
  }),
  completionCondition({
    conditionId: "hanging_leg_raise_completion",
    description:
      "Stop once the prescribed sets and repetitions are completed with strict execution and no swing.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const hangingLegRaiseInstructions: InstructionDefinition[] = [
  makeInstruction(
    "hanging_leg_raise_setup",
    "setup",
    "Hang from a stable pull-up bar with a secure pronated or neutral grip, with vertical clearance for full suspension, a stable non-slip area beneath and no objects within leg-swing range. Keep the arms extended, establish an active shoulder position rather than collapsing into the joints, bring the ribs down and start with the legs still and aligned beneath the body.",
    "high",
    true,
    SOURCE_HANGING_LEG_RAISE,
  ),
  makeInstruction(
    "hanging_leg_raise_execution",
    "execution",
    "Initiate by controlling the pelvis rather than throwing the legs, then raise the knees or straight legs according to the prescribed variation, producing posterior pelvic tilt until the thighs reach at least horizontal. Avoid momentum from the shoulders, spine or legs. Lower under control, keeping abdominal tension, and return to a stable hang without swinging — the next repetition begins only once the body is controlled. Ballistic execution is not part of this variation.",
    "high",
    true,
    SOURCE_HANGING_LEG_RAISE,
  ),
];

const hangingLegRaiseEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "hanging_leg_raise",
  moduleId: "core",
  role: "robustness",
  explicitMethodId: "straight_sets_repetitions",
  numericalProfileId: "core_robustness_straight_sets_v0_1",
  capabilities: {
    exerciseId: "hanging_leg_raise",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    // technical_effort ONLY — this chapter documents no RPE figure.
    supportedIntensityTypes: ["technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    // "# Loading Profile — Primary Load: Bodyweight"; "# Movement Context
    // — ... Bodyweight". The Optional ankle weights belong to a documented
    // progression this entry does not represent.
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    // Both legs move together throughout; no per-side language anywhere.
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    // Exactly the two tags `straight_sets_repetitions` requires.
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    // Both already canonical, and both already the knowledge base's own
    // gates for this exercise. No identifier is added by this lot.
    requiredEquipmentCapabilities: ["pull_up_bar", "safe_landing_surface"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["hanging_leg_raise_setup", "hanging_leg_raise_execution"],
    requiredStopConditionIds: [
      "hanging_leg_raise_technical_failure",
      "hanging_leg_raise_range_of_motion_loss",
      "hanging_leg_raise_grip_failure",
      "hanging_leg_raise_fatigue_limit",
      "hanging_leg_raise_pain",
      "hanging_leg_raise_completion",
    ],
    durationEstimationProfileId: "duration_profile_hanging_leg_raise",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_HANGING_LEG_RAISE, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: hangingLegRaiseInstructions,
  stopConditionDefinitions: hangingLegRaiseStopConditions,
  // "# Programming Applications — Core Strength Development: 3-5 sets, 5-12
  // repetitions", intersected with the shared profile's own [2, 5] sets and
  // [3, 15] repetitions. See the block comment above for why this
  // application, and not one of the other four, is the one encoded.
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 5, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_HANGING_LEG_RAISE],
  },
  exerciseIntensityConstraints: null,
  // "Core Strength Development: ... 60-150 seconds recovery". The
  // documented ceiling is above the Core rest doctrine's own 120s ceiling;
  // a constraint can only narrow, so the effective window is 60-120s.
  // Declared as documented, intersection left to the generic resolver.
  exerciseRestConstraints: {
    scope: "between_sets",
    minimumSeconds: 60,
    maximumSeconds: 150,
    sourceRuleIds: [SOURCE_HANGING_LEG_RAISE],
  },
  sourceRuleIds: [SOURCE_HANGING_LEG_RAISE, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Plate Pinch
// Source: 50-exercises/65_GRIP/11_PLATE_PINCH.md
//   - Exercise Identity: "Primary Pattern: Isometric Grip. Secondary
//     Pattern: Loaded Hold. Equipment: Weight Plates. Complexity: Low.
//     Unilateral or Bilateral: Unilateral or Bilateral."
//   - Prescription Variables: "Sets — 3 to 5"; "Hold Duration — 5 to 15
//     seconds for strength, 15 to 30 seconds for strength endurance, 30 to
//     60 seconds for endurance"; "Rest — 90 seconds to 3 minutes".
//   - Strength-Endurance Prescription: "3 to 4 sets, 15 to 30 second
//     holds, 90 to 180 seconds rest, submaximal loading, consistent wrist
//     position."
//   - Key Technical Cues and Common Errors: quoted in the stop conditions.
//   - Safety Rules: "Use intact plates with safe edges", "Keep the floor
//     area clear", "Do not hold plates over the feet", "Wear suitable
//     footwear", "Keep the plates close to the body", "Stop before
//     uncontrolled slipping", "Do not use damaged or oily plates".
// Method: timed_isometric_sets / grip / secondary
//   (timed_isometric_grip_v0_1 — sets 2/3/4, hold 10/20/30s per set,
//   RPE 7/8/9, rest 60/90/150s, tempo isometric_hold)
//
// PROFILE. Table Group 4's own ISO-GRIP profile, whose two documentation
// defects were corrected and implemented immediately before this entry.
// The role is `secondary`: the corrected table's first-listed, and the
// highest the method actually supports — `timed_isometric_sets` does not
// admit `primary`, which is why the Grip module's primary grip work stays
// with `distance_carry_sets`.
//
// WHICH PRESCRIPTION. This chapter documents three named prescriptions
// over the same movement — Strength (5-15s holds), Strength-Endurance
// (15-30s), Endurance (30-60s). This entry encodes the
// STRENGTH-ENDURANCE one, and the choice is arithmetic rather than
// aesthetic: it is the only one of the three whose hold range sits
// entirely inside ISO-GRIP's own 10-30 second envelope. Strength would
// lose its 5-10s half to the profile's floor, and Endurance would
// collapse onto the single point {30} against its ceiling. The other two
// remain documented, unrepresented alternatives — a second entry, never a
// blend.
//
// VOLUME — three real narrowings, all from that prescription:
//   - sets: "3 to 4 sets" intersected with the profile's own [2, 4] →
//     [3, 4];
//   - hold: "15 to 30 second holds" intersected with [10, 30] → [15, 30];
//   - rest: "90 to 180 seconds rest" intersected with the profile's own
//     60-150s → [90, 150]. The documented 180s ceiling sits above the
//     table's own 150s and a constraint can only narrow, so 150 stands.
//
// NOT CONVERTED. This chapter's difficulty model is explicitly
// multi-factor and non-numeric: "Load is determined by: plate weight,
// number of plates, plate thickness, surface friction, unilateral or
// bilateral execution, and hold duration." None of it becomes a number
// here — no plate weight, count or thickness is turned into an intensity,
// a set count or a duration, and no second is turned into a repetition.
// The documented "Distance — 10 to 30 metres" belongs to the Walking
// Variation, which `pinch_carry` already covers through the carry profile;
// it is not folded into this static hold.
//
// LATERALITY. `bilateral` with `total_duration`, representing the
// chapter's own "# Bilateral Variation — The athlete holds one plate
// combination in each hand", whose stated benefits are "efficient
// bilateral training, symmetrical loading ... easier integration into
// general strength sessions". Both hands hold simultaneously, so the
// prescribed 20 seconds is 20 seconds total, not 20 per side.
//
// The chapter's "# Unilateral Variation — The athlete holds the plate
// combination in one hand" is deliberately NOT represented: it would be
// `unilateral` with `duration_per_side`, and the Prescription Variables
// carry no "per side" qualifier to tell us whether the documented 15-30
// seconds would then be per hand or total. That question is unanswerable
// from this chapter, so the variant that does not raise it is the one
// encoded, and the other is left to a separate entry.
//
// INTENSITY. The profile's own RPE 7-9, unchanged. This chapter documents
// no RPE figure: its Strength-Endurance prescription says "submaximal
// loading", which describes the LOAD, not the effort — a submaximal plate
// held to near grip failure for 15-30 seconds is a high-effort set, and
// the two statements do not conflict. Since no numeric effort of its own
// exists to narrow the band with, `exerciseIntensityConstraints` stays
// null, exactly as for rowerg_intervals against INT-LONG's fallback RPE.
// The profile's `requiresExerciseSpecificLoadRule` keeps any absolute or
// body-mass load out: no plate weight is ever fabricated.
//
// STOP CONDITIONS — four categories. `timed_isometric_sets` requires
// technical_failure, pain and completion; `equipment_failure` is added
// because this chapter's own termination rule is exactly that — "End the
// set before grip security is lost", "terminate the set at the first clear
// loss of control". It reuses the EXISTING `equipmentFailureCondition`,
// whose contract already names grip and whose set scope is a real boundary
// for this method, the same reuse `hanging_leg_raise` and `pinch_carry`
// already make.
//
// `fatigue_limit` is deliberately absent: this chapter's documented set
// endpoint is grip security, not fatigue ("The set ends before
// uncontrolled slipping occurs"), and its Fatigue Profile records limited
// systemic cost. The Safety Rules' foot-protection guidance ("Do not hold
// plates over the feet", "Wear suitable footwear") is a SETUP precaution,
// not a termination trigger, and lives in the setup instruction; no
// `environmental_hazard` factory exists and none was invented.
// -----------------------------------------------------------------------------

const SOURCE_PLATE_PINCH = "50-exercises/65_GRIP/11_PLATE_PINCH.md";

const platePinchStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "plate_pinch_technical_failure",
    description:
      "Stop the set if the fingers hook under the rim instead of pinching, the wrist flexes excessively, the plates rest against the thigh, the shoulder elevates, or the plates lose their even alignment.",
    sourceRuleIds: [SOURCE_PLATE_PINCH],
  }),
  equipmentFailureCondition({
    conditionId: "plate_pinch_grip_failure",
    description:
      "Terminate the set at the first clear loss of control: as soon as the plates begin to slide, tilt or rotate, or grip security is lost. Never attempt to save a failing hold.",
    sourceRuleIds: [SOURCE_PLATE_PINCH],
  }),
  painCondition({
    conditionId: "plate_pinch_pain",
    description:
      "Stop immediately if thumb, finger, wrist or medial-elbow pain occurs, or in the presence of an acute thumb, finger or wrist injury.",
    sourceRuleIds: [SOURCE_PLATE_PINCH],
  }),
  completionCondition({
    conditionId: "plate_pinch_completion",
    description: "Stop once the prescribed sets and hold duration are completed and the plates are lowered under control.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const platePinchInstructions: InstructionDefinition[] = [
  makeInstruction(
    "plate_pinch_setup",
    "setup",
    "Use intact weight plates with safe edges and clean, dry smooth surfaces — never damaged or oily ones. Keep the floor area clear, wear suitable footwear and never hold the plates over the feet. Align the plates evenly, place the thumb on one side and the fingers on the opposite side, keep the wrist close to neutral, the shoulder controlled and the ribs stacked. This entry prescribes the bilateral variation: one plate combination in each hand.",
    "critical",
    true,
    SOURCE_PLATE_PINCH,
  ),
  makeInstruction(
    "plate_pinch_execution",
    "execution",
    "Squeeze the plates firmly before lifting, then stand upright and maintain pressure through the thumb and fingertips for the prescribed hold. Keep the plates vertical and close to the body, the wrist neutral and the shoulder down and stable. Do not hook the fingers under the rim and do not rest the plates against the thigh. End the set before grip security is lost, then lower the plates under control.",
    "high",
    true,
    SOURCE_PLATE_PINCH,
  ),
];

const platePinchEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "plate_pinch",
  moduleId: "grip",
  role: "secondary",
  explicitMethodId: "timed_isometric_sets",
  numericalProfileId: "timed_isometric_grip_v0_1",
  capabilities: {
    exerciseId: "plate_pinch",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["timed_isometric_sets"],
    supportedVolumeStructures: ["sets_duration"],
    // The profile's only documented metric. No absolute plate load is
    // claimed — this chapter gives no weight figure anywhere.
    supportedIntensityTypes: ["rpe"],
    preferredIntensityTypes: ["rpe"],
    // "Equipment: Weight Plates" — the load is the implement itself.
    supportedLoadingModes: ["plate"],
    supportedTempoTypes: ["isometric_hold"],
    // The documented Bilateral Variation: one combination in each hand,
    // held simultaneously. See the block comment for why the Unilateral
    // Variation is not represented here.
    laterality: "bilateral",
    volumeInterpretations: ["total_duration"],
    // Exactly the three tags `timed_isometric_sets` requires.
    capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
    // Already canonical, and already the knowledge base's own gate.
    requiredEquipmentCapabilities: ["plates"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["plate_pinch_setup", "plate_pinch_execution"],
    requiredStopConditionIds: [
      "plate_pinch_technical_failure",
      "plate_pinch_grip_failure",
      "plate_pinch_pain",
      "plate_pinch_completion",
    ],
    durationEstimationProfileId: "duration_profile_plate_pinch",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_PLATE_PINCH, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["rpe"],
  preferredIntensityType: "rpe",
  supportedTempoTypes: ["isometric_hold"],
  preferredTempoType: null,
  instructionDefinitions: platePinchInstructions,
  stopConditionDefinitions: platePinchStopConditions,
  // "# Strength-Endurance Prescription — 3 to 4 sets, 15 to 30 second
  // holds", intersected with the shared profile's own [2, 4] sets and
  // [10, 30] seconds.
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: null, durationSeconds: 15, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 4, repetitions: null, durationSeconds: 30, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_PLATE_PINCH],
  },
  // "submaximal loading" is qualitative and describes the load, not the
  // effort — there is no numeric effort here to narrow RPE 7-9 with.
  exerciseIntensityConstraints: null,
  // "90 to 180 seconds rest". The documented ceiling sits above the
  // table's own 150s; a constraint can only narrow, so the effective
  // window is 90-150s. Declared as documented, intersection left to the
  // generic resolver.
  exerciseRestConstraints: {
    scope: "between_sets",
    minimumSeconds: 90,
    maximumSeconds: 180,
    sourceRuleIds: [SOURCE_PLATE_PINCH],
  },
  sourceRuleIds: [SOURCE_PLATE_PINCH, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Registry
// -----------------------------------------------------------------------------
// Heavy Bag Power Intervals
// Source: 50-exercises/27_HEAVY_BAG_POWER_INTERVALS
//   - Primary Classification: "Combat-Specific Conditioning" (module:
//     conditioning), matching the knowledge base's own resolution.
//   - Equipment Requirements: "Required: Heavy Bag, Gloves, Hand Wraps,
//     Timer. Optional: Heart Rate Monitor, Punch Sensor, Velocity Sensor."
//   - Loading Profile: "Typical Duration: 3-8 rounds. Work: 10-30 seconds.
//     Recovery: 30-90 seconds."
//   - Physiological Profile: "Primary Energy System: ATP-PC, Anaerobic
//     Glycolysis. Typical Work Interval: 5-30 seconds. Typical Recovery:
//     30-120 seconds."
//   - Velocity Profile: "Maximum Intent. Maximum Speed. Maximum Power.
//     Velocity-Based Training Compatible: No."
//   - Coaching Cues: "Generate force from the floor.", "Maintain technical
//     precision.", "Strike with maximal intent.", "Recover actively.", "Do
//     not sacrifice technique for fatigue."
//   - Common Errors: Arm Punching, Poor Hip Rotation, Loss of Guard,
//     Technical Breakdown, Excessive Tension.
//   - Safety Profile: Primary Risks — Poor Wrist Alignment, Poor Shoulder
//     Mechanics, Excessive Volume, Loss of Technique Under Fatigue.
//   - Contraindications: Acute Hand / Wrist / Shoulder Injury, Acute
//     Concussion.
//   - Performance Indicators: Average Power, Peak Power, Strike Count,
//     Strike Density, Heart Rate, Power Drop-Off, Technical Quality,
//     Recovery Rate.
//   - Philosophy: "Strength developed in the weight room must eventually
//     become combat performance."
// Method: work_rest_intervals / conditioning / conditioning
//
// EXPLICIT PROFILE SELECTION: `power_intervals_v0_1` (Table Group 14 /
// INT-POWER: 3/7/12 intervals, 10/25/40s per interval, 20/55/90s between
// intervals, `impact_intent: maximal_safe_power` then `movement_intent:
// explosive`, no tempo). The (conditioning, work_rest_intervals,
// conditioning) triple is now shared by FOUR profiles and never resolves
// implicitly.
//
// Why a new table group and not one of the three that already existed —
// each is arithmetically EMPTY against this fiche, on a dimension the
// registry may only narrow, never widen:
//   - `conditioning_short_intervals_v0_1` (INT-SHORT): 10-20 intervals
//     against this fiche's "3-8 rounds" — no intersection. It also
//     documents no encodable intensity and is refused at validation time
//     (`NON_EXECUTABLE_NUMERICAL_PROFILE`), so it could not have served
//     this entry even had the counts overlapped;
//   - `conditioning_long_intervals_v0_1` (INT-LONG, used by
//     rowerg_intervals): 60-180s efforts against "Work: 10-30 seconds" —
//     no intersection, and an RPE-controlled aerobic envelope this
//     fiche's ATP-PC energy system and "Maximum Power" contradict;
//   - `repeated_sprint_intervals_v0_1` (INT-REPEATED-SPRINT, used by
//     sprint_intervals): 3-8s efforts against "10-30 seconds" — no
//     intersection either, in the opposite direction.
// Table Group 14 was written first, from the family this fiche shares
// with battle_ropes, and this entry narrows that envelope. It was NOT
// written around this single exercise.
//
// Why NOT Table Group 9 / COMBAT-CONDITIONING-ROUNDS, despite this
// fiche's own word "rounds": that profile refuses to prescribe without a
// documented sport-specific subtype (`requiresSportSpecificSubtype`), and
// its 60-180s round duration is empty against 10-30s. A combat round is a
// sport-defined competition period; a 10-30 second maximal effort with
// incomplete recovery is an interval — which this fiche's own title
// ("Power INTERVALS") and Physiological Profile ("Typical Work INTERVAL")
// both say directly.
//
// EQUIPMENT — one id declared, one documented gap, one deliberate
// exclusion:
//   - `heavy_bag` is added to the equipment vocabulary and declared. It is
//     aligned 1:1 with the knowledge base's own pre-existing `heavy_bag`
//     `EquipmentType` member and with 33_EXERCISE_PRESCRIPTION_
//     CAPABILITIES' own "Exercise Family 12 — Combat Bag and Pad Work"
//     required list ("heavy bag"). Not an equivalence group;
//   - "Gloves" and "Hand Wraps" are genuinely Required by this fiche and
//     "gloves" is named by Family 12 as well — but the knowledge base
//     encodes BOTH, collectively, as a single flagged `"other"` placeholder
//     shared with four other exercises (dip's Dip Belt, chest_supported_
//     row's Machine, landmine_press's Landmine Attachment,
//     nordic_hamstring_curl's Nordic Bench). There is no
//     `requiredEquipmentCapabilities` id that could mirror `"other"`
//     honestly, and replacing that placeholder for this exercise alone
//     would split a doctrine the knowledge base applies uniformly.
//     DOCUMENTED CONSEQUENCE, flagged rather than silently dropped:
//     eligibility IS still enforced — `checkExerciseEligibility` refuses
//     this exercise unless the athlete's environment supplies the `other`
//     atom — and the requirement is restated at critical priority in the
//     setup instruction. What is missing is a SECOND, prescription-layer
//     gate, not the gate itself. Giving hand protection its own capability
//     id needs a knowledge-base change across all five placeholder users,
//     not a local exception here;
//   - "Timer" is excluded, matching the knowledge base's own recorded
//     reasoning: a timer is a programming tool for structuring intervals,
//     not equipment the athlete interacts with during the movement. The
//     Optional heart-rate monitor, punch sensor and velocity sensor are
//     excluded too, matching the established discipline of never promoting
//     an Optional item to Required.
//
// VOLUME AND REST — two documented sources, and the narrower one governs.
// The Loading Profile ("3-8 rounds", "Work: 10-30 seconds", "Recovery:
// 30-90 seconds") is the prescription section; the Physiological Profile's
// wider "5-30 seconds" / "30-120 seconds" is descriptive physiology. The
// same precedent already applied to rowerg_intervals and sprint_intervals
// is applied here, and it happens to be the safe direction in both
// dimensions. This fiche's "rounds" is read as the interval count — not as
// a `rounds` volume field — because `work_rest_intervals` forbids that
// field outright and this fiche's own title and Physiological Profile
// name the same quantity an INTERVAL. That is a naming resolution
// grounded in this fiche's own two other words for the dimension, not the
// unit conversion this registry refuses elsewhere ("repetitions" onto
// intervals for sprint_intervals, "rounds" onto "sets" for
// footwork_drills/shadow_boxing/sprawl).
//   - intervals: "3-8" narrows the profile's own [3, 12];
//   - work duration: "10-30 seconds" narrows the profile's own [10, 40];
//   - rest: "30-90 seconds" narrows the profile's own [20, 90] floor from
//     20 to 30. Declared, unlike sprint_intervals' wider documented
//     recovery, which had nothing to narrow.
//
// INTENSITY. `impact_intent: maximal_safe_power` only, declared through an
// explicit `exerciseIntensityConstraints` narrowing rather than left to
// documented rule order. The profile's second rule (`movement_intent:
// explosive`) is deliberately excluded: `explosive` is calibrated for this
// family's non-impact member and would UNDERSTATE this fiche, whose
// Velocity Profile says "Maximum Intent. Maximum Speed. Maximum Power."
// 26_INTENSITY_MODEL sanctions the impact reading directly — "bag work may
// support technical effort or impact intent" — and `maximal_safe_power` is
// the impact vocabulary's maximal value.
// Average power, peak power, strike count, strike density, heart rate and
// power drop-off are all named by this fiche as Performance INDICATORS,
// never as prescribed targets, and its own "Velocity-Based Training
// Compatible: No" forbids reading the velocity sensor as one. No number is
// derived from any of them. A qualitative category rule carries no range,
// so the prescribed intent is identical under reduced, normal and high:
// the range context moves intervals, work duration and rest — never the
// instruction to strike at maximal safe power.
//
// TEMPO. `global_intent` is declared because Family 12 documents it for
// this family ("Formal phase timing is unsupported"), but
// `work_rest_intervals` forbids tempo and the profile carries none, so the
// resolved tempo is `null`.
//
// LATERALITY. `bilateral` with `interval_total`: striking alternates sides
// continuously, but this fiche prescribes no per-side allocation anywhere
// — no "per side" figure exists in its Loading Profile — and the knowledge
// base's own `unilateral: false` says the same. The whole interval is one
// prescribed quantity, not two halves.
//
// STOP CONDITIONS — the six categories `work_rest_intervals` requires, no
// more. Family 12's own "Required Stop Conditions" additionally name
// equipment failure, an impact-limit threshold and unsafe alignment.
// Factories exist for the first two (`equipmentFailureCondition`,
// `impactLimitCondition`) and both are genuinely plausible here (a bag
// tearing from its mount; the fiche's own "Poor Wrist Alignment" and
// "Excessive Volume" risks) — but no module or method contract requires
// them, and this registry declares exactly what the method demands, as
// every preceding entry does. The documented gap is the same one already
// recorded for rowerg_intervals and sprint_intervals: module-contract and
// family-level stop-condition categories are enforced by no resolver
// today. This fiche's alignment and impact risks are instead carried
// where they are actionable — inside the technical-failure and
// fatigue-limit descriptions below.
// -----------------------------------------------------------------------------

const SOURCE_HEAVY_BAG_POWER_INTERVALS = "50-exercises/27_HEAVY_BAG_POWER_INTERVALS";

const heavyBagPowerIntervalsStopConditions: StopConditionDefinition[] = [
  intervalPaceLossCondition({
    conditionId: "heavy_bag_power_intervals_pace_loss",
    description:
      "Stop the interval if power output visibly drops — strike density falls, strikes lose speed, or the athlete can no longer strike with maximal intent. Power drop-off is this exercise's own documented performance indicator, and the objective is power expression, not accumulated volume.",
    sourceRuleIds: [SOURCE_HEAVY_BAG_POWER_INTERVALS, SOURCE_METHOD_CATALOGUE],
  }),
  technicalFailureCondition({
    conditionId: "heavy_bag_power_intervals_technical_failure",
    description:
      "Stop the interval on technical breakdown: arm punching instead of force generated from the floor, loss of hip rotation, a dropped guard, excessive tension, or wrist and shoulder alignment that can no longer be held. Technique is never sacrificed for fatigue.",
    sourceRuleIds: [SOURCE_HEAVY_BAG_POWER_INTERVALS],
  }),
  fatigueLimitCondition({
    conditionId: "heavy_bag_power_intervals_fatigue_limit",
    description:
      "Stop the exercise once accumulated fatigue prevents striking at maximal intent with sound mechanics. Excessive volume and loss of technique under fatigue are documented risks of this exercise, not a training stimulus.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_HEAVY_BAG_POWER_INTERVALS],
  }),
  acuteSymptomCondition({
    conditionId: "heavy_bag_power_intervals_acute_symptom",
    description:
      "Stop immediately if an acute symptom appears at any point during the intervals or the recoveries, including any sign of concussion.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_HEAVY_BAG_POWER_INTERVALS],
  }),
  painCondition({
    conditionId: "heavy_bag_power_intervals_pain",
    description:
      "Stop immediately if pain occurs, or in the presence of an acute hand, wrist or shoulder injury, or an acute concussion.",
    sourceRuleIds: [SOURCE_HEAVY_BAG_POWER_INTERVALS],
  }),
  completionCondition({
    conditionId: "heavy_bag_power_intervals_completion",
    description:
      "Stop once the prescribed intervals and their per-interval duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const heavyBagPowerIntervalsInstructions: InstructionDefinition[] = [
  makeInstruction(
    "heavy_bag_power_intervals_setup",
    "setup",
    "Strike a securely mounted heavy bag. Hand wraps and gloves are required equipment for this exercise and must be worn before any striking begins — they are not optional protective gear. A timer structures the work and recovery intervals. Basic striking mechanics must be established before maximal power work; a heart-rate monitor, punch sensor and velocity sensor are optional.",
    "critical",
    true,
    SOURCE_HEAVY_BAG_POWER_INTERVALS,
  ),
  makeInstruction(
    "heavy_bag_power_intervals_execution",
    "execution",
    "Generate force from the floor, maintain technical precision and strike with maximal intent. Recover actively between intervals. Do not sacrifice technique for fatigue: no arm punching, no loss of hip rotation, no dropped guard.",
    "high",
    true,
    SOURCE_HEAVY_BAG_POWER_INTERVALS,
  ),
];

const heavyBagPowerIntervalsEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "heavy_bag_power_intervals",
  moduleId: "conditioning",
  role: "conditioning",
  explicitMethodId: "work_rest_intervals",
  numericalProfileId: "power_intervals_v0_1",
  capabilities: {
    exerciseId: "heavy_bag_power_intervals",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["work_rest_intervals"],
    supportedVolumeStructures: ["intervals"],
    // See the block comment above for why `movement_intent` is not claimed
    // even though Family 12 and the selected profile both offer it.
    supportedIntensityTypes: ["impact_intent"],
    preferredIntensityTypes: ["impact_intent"],
    // Family 12's own list is "impact_equipment", "partner_resistance",
    // "locomotion_only". Only the first applies: this exercise strikes a
    // bag, has no partner, and is not a displacement drill.
    supportedLoadingModes: ["impact_equipment"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["interval_total"],
    // Exactly the three tags `work_rest_intervals` requires.
    capabilityTags: ["interval_structure", "timed_effort", "technical_quality_observation"],
    // The one Required item this vocabulary can express exactly. Gloves and
    // hand wraps stay gated by the knowledge base alone — see the block
    // comment above.
    requiredEquipmentCapabilities: ["heavy_bag"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: [
      "heavy_bag_power_intervals_setup",
      "heavy_bag_power_intervals_execution",
    ],
    requiredStopConditionIds: [
      "heavy_bag_power_intervals_pace_loss",
      "heavy_bag_power_intervals_technical_failure",
      "heavy_bag_power_intervals_fatigue_limit",
      "heavy_bag_power_intervals_acute_symptom",
      "heavy_bag_power_intervals_pain",
      "heavy_bag_power_intervals_completion",
    ],
    durationEstimationProfileId: "duration_profile_heavy_bag_power_intervals",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_HEAVY_BAG_POWER_INTERVALS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["impact_intent"],
  preferredIntensityType: "impact_intent",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: null,
  instructionDefinitions: heavyBagPowerIntervalsInstructions,
  stopConditionDefinitions: heavyBagPowerIntervalsStopConditions,
  // "# Loading Profile — Typical Duration: 3-8 rounds. Work: 10-30
  // seconds", narrowing the profile's own [3, 12] intervals and [10, 40]
  // seconds. See the block comment above for why the Loading Profile
  // governs over the Physiological Profile's wider figures, and why
  // "rounds" is read here as the interval count.
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 10, distanceMeters: null, rounds: null, workIntervals: 3 },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 30, distanceMeters: null, rounds: null, workIntervals: 8 },
    sourceRuleIds: [SOURCE_HEAVY_BAG_POWER_INTERVALS],
  },
  // Narrows the shared profile to this fiche's single documented intensity
  // reading. See the block comment above.
  exerciseIntensityConstraints: {
    allowedIntensityTypes: ["impact_intent"],
    rangeConstraints: [],
    sourceRuleIds: [SOURCE_HEAVY_BAG_POWER_INTERVALS, SOURCE_INTENSITY_MODEL],
  },
  // "# Loading Profile — Recovery: 30-90 seconds", raising the profile's
  // own 20-second floor to 30. The ceiling already matches.
  exerciseRestConstraints: {
    scope: "between_intervals",
    minimumSeconds: 30,
    maximumSeconds: 90,
    sourceRuleIds: [SOURCE_HEAVY_BAG_POWER_INTERVALS],
  },
  sourceRuleIds: [SOURCE_HEAVY_BAG_POWER_INTERVALS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Battle Ropes
// Source: 50-exercises/46_BATTLE_ROPES.md
//   - Primary Classification: "Combat-Specific Conditioning" (module:
//     conditioning), matching the knowledge base's own resolution.
//   - Equipment Requirements: "Required: Battle Ropes, Anchor Point.
//     Optional: Heart Rate Monitor, Timer."
//   - Loading Profile: "Typical Volume: 5-12 rounds. Work: 10-40 seconds.
//     Recovery: 20-90 seconds."
//   - Physiological Profile: "Primary Energy System: Anaerobic Glycolysis.
//     Secondary: ATP-PC, Oxidative Recovery. Typical Work Duration: 10-40
//     seconds. Typical Recovery: 20-90 seconds."
//   - Velocity Profile: "Explosive. Continuous. Maximum Intent."
//   - Coaching Cues: "Generate force from the floor.", "Brace
//     continuously.", "Move explosively.", "Relax between contractions.",
//     "Maintain rhythm."
//   - Common Errors: Using only the arms, Losing trunk stiffness,
//     Shrugging the shoulders, Poor breathing rhythm, Technical
//     deterioration under fatigue.
//   - Safety Profile: "Overall Risk: Very Low." Primary Risks — Poor Trunk
//     Position, Excessive Shoulder Elevation, Using Only the Arms.
//   - Contraindications: Acute Shoulder / Wrist / Elbow Injury.
//   - Performance Indicators: Wave Velocity, Wave Amplitude, Work Output,
//     Heart Rate, Power Consistency, Technical Quality, Fatigue Resistance.
//   - Neurological Profile: "Skill Requirement: Beginner. Learning Curve:
//     Short."
//   - Philosophy: "Battle Ropes train explosive intent under fatigue."
// Method: work_rest_intervals / conditioning / conditioning
//
// EXPLICIT PROFILE SELECTION: `power_intervals_v0_1` (Table Group 14 /
// INT-POWER). The (conditioning, work_rest_intervals, conditioning) triple
// is shared by FOUR profiles and never resolves implicitly.
//
// This entry adds no profile and changes no doctrine. Table Group 14's
// envelope was built from the union of TWO documented records, and this
// fiche is the second of them — its 5-12 / 10-40 s / 20-90 s figures are
// literally where the envelope's upper interval bound, its whole work
// range and its whole rest range came from. The profile therefore already
// contains this exercise exactly, and the entry only narrows.
//
// The other three interval profiles remain unusable here, for the reasons
// Table Group 14 records: INT-LONG prescribes 60-180 s efforts (empty
// against 10-40 s), INT-REPEATED-SPRINT prescribes 3-8 s efforts (empty
// too), and INT-SHORT — the only one whose ranges overlap at all — is
// non-executable, documenting no encodable intensity, and is refused at
// validation time (`NON_EXECUTABLE_NUMERICAL_PROFILE`).
//
// VARIANT REPRESENTED — one prescription, many documented movements. This
// fiche lists eight Variations (Alternating Waves, Double Waves, Outside
// Circles, Inside Circles, Power Slams, Snakes, Lateral Waves, Jump Slams)
// but exactly ONE "# Loading Profile", which covers all of them. That is
// the opposite of plate_pinch, whose chapter documented three separately
// quantified prescriptions and forced a choice. The ExerciseId therefore
// represents a FAMILY of rope movements under a single prescription: the
// execution instruction names the documented movements, and the numbers
// stay unique. No second prescription is mixed in, and the Progressions
// (Jumping Waves, Reactive Intervals, Contrast Training) are not
// represented — they are documented progressions, not this entry.
//
// "rounds" AS THE INTERVAL COUNT. This fiche says "Typical Volume: 5-12
// rounds" while naming the work period a "Typical Work Duration". Reading
// its "rounds" as the interval dimension is not a decision taken here: it
// is the reading 34_NUMERICAL_PRESCRIPTION_TABLES.md's own Table Group 14
// already made and published, listing "Battle Ropes 5-12 rounds" as one of
// the two records defining the family's interval envelope. It is also the
// only encodable reading — `work_rest_intervals` forbids the `rounds`
// volume field outright — and structurally accurate: a work period
// followed by a recovery period, repeated, is an interval. Table Group 9's
// combat rounds are sport-defined competition periods, which this fiche
// never claims to be, and COMBAT-CONDITIONING-ROUNDS refuses to prescribe
// without a sport-specific subtype this fiche does not supply.
//
// EQUIPMENT — two ids, both new, both replacing an imprecise atom the
// knowledge base itself had already flagged:
//   - `battle_rope` replaces the generic `rope`. BATTLE_ROPES' own block
//     comment recorded that value as a MODEL LIMITATION ("the closest
//     existing honest generic value ... openly flagged"). Matching is
//     exact, so a climbing rope no longer satisfies this exercise, and
//     `rope` stays untouched for rope_climb and rope_pull;
//   - `rope_anchor_point` replaces `rigid_anchor_support`, whose scope
//     this catalog documents twice as a HAND-GRIP anchor (dragon_flag's
//     "Secure overhead or behind-head hand anchor"). A battle-rope anchor
//     is a fixed structural point the ROPES attach to and the athlete
//     never grips; reusing that value would be an alias, not a match.
//     `rigid_anchor_support` stays untouched for dragon_flag and
//     towel_pull_up.
// No equivalence is created with rope, towel, suspension trainer,
// heavy_bag, sled or resistance_band. The Optional heart-rate monitor and
// timer are excluded, matching the established discipline of never
// promoting an Optional item to Required — and matching the knowledge
// base's own recorded reasoning that a timer is a programming tool.
//
// NO CAPABILITY FAMILY COVERS THIS EXERCISE, stated rather than
// force-fitted. 33_EXERCISE_PRESCRIPTION_CAPABILITIES.md's fourteen
// families include Ergometer Conditioning (Family 11) and Combat Bag and
// Pad Work (Family 12); battle ropes are neither a machine nor bag/pad
// work, and no rope-conditioning family exists. Every capability below is
// therefore grounded in the METHOD contract or in this fiche directly, and
// `sourceRuleIds` cites those two rather than a capabilities chapter that
// does not describe this exercise.
//
// VOLUME — one real narrowing, one declared match:
//   - interval count: "5-12 rounds" narrows the profile's own [3, 12].
//     Genuinely narrower at the floor;
//   - work duration: "10-40 seconds" IS the profile's own envelope,
//     because the envelope was built from this fiche. Both bounds are
//     declared anyway, as ab_wheel and sprawl already do, so the entry
//     states its own documented range rather than relying on the envelope
//     happening to match.
// This fiche's two quantified sections AGREE (Loading Profile and
// Physiological Profile both give 10-40 s work and 20-90 s recovery), so
// unlike heavy_bag_power_intervals there is no narrower-source decision to
// make here.
// Nothing is converted: waves are not repetitions, slams are not seconds,
// oscillation counts are not intensity, "Rope Speed"/"Wave Amplitude" are
// documented PROGRESSION AXES and not volume dimensions, and no rope
// length or weight is read as a load.
//
// INTENSITY. `movement_intent: explosive` only, declared through an
// explicit `exerciseIntensityConstraints` narrowing. `explosive` is a
// literal word of this fiche's own "# Velocity Profile: Explosive.
// Continuous. Maximum Intent." and a literal member of 26_INTENSITY_MODEL's
// movement-intent vocabulary — no mapping judgement is involved.
// The profile's OTHER rule, `impact_intent: maximal_safe_power`, is
// deliberately excluded and the narrowing is what excludes it: nothing is
// struck here. The rope is driven, not hit, this fiche documents no impact
// of any kind, and the impact vocabulary belongs to bag and pad work.
// Because `impact_intent` is the profile's first documented rule, omitting
// the constraint would have silently selected it — the constraint is
// therefore load-bearing, not decorative.
// No RPE, heart rate, pace, velocity or power figure exists anywhere in
// this fiche. "Wave Velocity", "Work Output", "Heart Rate" and "Power
// Consistency" are listed under Performance INDICATORS, and the
// heart-rate monitor is Optional instrumentation — none is a prescribed
// target, and no number is derived from any of them.
//
// TEMPO. `work_rest_intervals` declares `tempoPolicy: forbidden`, the
// profile carries no tempo rule, and — unlike heavy_bag_power_intervals,
// whose Family 12 documents `global_intent` for bag work — no capability
// family documents any tempo type for this exercise. `supportedTempoTypes`
// is therefore empty rather than borrowed, which the compatibility
// validator accepts precisely because the method forbids tempo. The
// explosive character of the movement lives in the intensity rule, where
// this fiche puts it, never in a fabricated cadence.
//
// REST. `exerciseRestConstraints` is null. This fiche's "Recovery: 20-90
// seconds" is EXACTLY the profile's own between-intervals window — there
// is nothing to narrow, and a constraint that restates an envelope adds no
// information while implying a distinction that does not exist. The same
// reasoning already left sprint_intervals' rest constraint null. The fiche
// documents no active/passive recovery distinction, so none is invented.
//
// LATERALITY. `not_applicable` with `interval_total`. This is a
// considered choice, not a default: the single prescription covers
// bilateral movements (Double Waves, Power Slams) AND alternating ones
// (Alternating Waves, Snakes) without changing a single number, and the
// volume is counted in intervals, never per arm. Declaring `alternating`
// would describe the biomechanics of some variations while implying a
// per-side structure the fiche never prescribes; `bilateral` would exclude
// the variations it names first. The knowledge base's own `unilateral:
// false` agrees, and no volume is multiplied anywhere.
//
// LOADING MODE. `rope` — a real, pre-existing `LoadingMode` member whose
// meaning is exactly this: resistance supplied by a rope the athlete sets
// in motion. This entry is its first consumer. `bodyweight` would be false
// (an implement supplies the resistance), `plate`/`sled`/`medicine_ball`
// name other implements, `locomotion_only` describes displacement this
// exercise does not perform, and `impact_equipment` belongs to striking.
//
// STOP CONDITIONS — the six categories `work_rest_intervals` requires, no
// more. Two categories a reader might expect are knowingly absent, and
// their absence is sourced rather than assumed: `equipment_failure` (a
// shifting anchor, a lost rope) and `range_of_motion_loss` are plausible,
// but this fiche's own Safety Profile, Primary Risks and Common Errors
// name NO anchor movement and NO loss of rope control (checked directly) —
// declaring either would mean inventing a documented risk. Wave amplitude
// IS documented, as a Performance Indicator and a Progression axis, and it
// is carried where it is actionable: inside the pace-loss description,
// alongside wave velocity and power consistency. The same module-contract
// gap already recorded for rowerg_intervals, sprint_intervals and
// heavy_bag_power_intervals still applies: no resolver enforces the
// conditioning MODULE's own categories today.
// -----------------------------------------------------------------------------

const SOURCE_BATTLE_ROPES = "50-exercises/46_BATTLE_ROPES.md";

const battleRopesStopConditions: StopConditionDefinition[] = [
  intervalPaceLossCondition({
    conditionId: "battle_ropes_pace_loss",
    description:
      "Stop the interval when wave velocity or wave amplitude visibly drops, or when the waves become slow and pushed rather than driven — power consistency across intervals is this exercise's own success criterion, not accumulated work.",
    sourceRuleIds: [SOURCE_BATTLE_ROPES, SOURCE_METHOD_CATALOGUE],
  }),
  technicalFailureCondition({
    conditionId: "battle_ropes_technical_failure",
    description:
      "Stop the interval on technical breakdown: moving with the arms alone instead of generating force from the floor, loss of trunk stiffness, or shoulders shrugging upward. Poor trunk position and excessive shoulder elevation are this exercise's documented primary risks.",
    sourceRuleIds: [SOURCE_BATTLE_ROPES],
  }),
  fatigueLimitCondition({
    conditionId: "battle_ropes_fatigue_limit",
    description:
      "Stop the exercise once accumulated fatigue degrades technique or breathing rhythm and explosive intent can no longer be produced. Technical deterioration under fatigue is a documented error of this exercise, not a training stimulus.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_BATTLE_ROPES],
  }),
  acuteSymptomCondition({
    conditionId: "battle_ropes_acute_symptom",
    description:
      "Stop immediately if an acute symptom appears at any point during the intervals or the recoveries.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
  painCondition({
    conditionId: "battle_ropes_pain",
    description:
      "Stop immediately if pain occurs, or in the presence of an acute shoulder, wrist or elbow injury.",
    sourceRuleIds: [SOURCE_BATTLE_ROPES],
  }),
  completionCondition({
    conditionId: "battle_ropes_completion",
    description:
      "Stop once the prescribed intervals and their per-interval duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const battleRopesInstructions: InstructionDefinition[] = [
  makeInstruction(
    "battle_ropes_setup",
    "setup",
    "Secure the battle ropes to a fixed anchor point; both are required equipment. Stand facing the anchor with the rope ends held so that force can travel from the ground through the feet, legs and core to the shoulders and arms, as this exercise's documented force path requires. A timer and a heart-rate monitor are optional. The skill requirement is beginner level with a short learning curve.",
    "high",
    true,
    SOURCE_BATTLE_ROPES,
  ),
  makeInstruction(
    "battle_ropes_execution",
    "execution",
    "Generate force from the floor, brace continuously, move explosively, relax between contractions and maintain rhythm. Any documented rope movement may be used for the interval — alternating waves, double waves, outside or inside circles, power slams, snakes, lateral waves or jump slams — but the prescribed intervals, work duration and recovery do not change with the movement chosen. Do not move with the arms alone, do not lose trunk stiffness and do not shrug the shoulders. Stop when wave velocity, wave amplitude or technical quality drops.",
    "high",
    true,
    SOURCE_BATTLE_ROPES,
  ),
];

const battleRopesEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "battle_ropes",
  moduleId: "conditioning",
  role: "conditioning",
  explicitMethodId: "work_rest_intervals",
  numericalProfileId: "power_intervals_v0_1",
  capabilities: {
    exerciseId: "battle_ropes",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["work_rest_intervals"],
    supportedVolumeStructures: ["intervals"],
    // See the block comment above for why `impact_intent`, offered by the
    // shared profile, is not claimed: nothing is struck here.
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    // The `LoadingMode` value whose meaning is exactly a rope the athlete
    // sets in motion. First consumer of that value.
    supportedLoadingModes: ["rope"],
    // Empty, not borrowed: the method forbids tempo and no capability
    // family documents a tempo type for this exercise.
    supportedTempoTypes: [],
    laterality: "not_applicable",
    volumeInterpretations: ["interval_total"],
    // Exactly the three tags `work_rest_intervals` requires.
    capabilityTags: ["interval_structure", "timed_effort", "technical_quality_observation"],
    // "Required: Battle Ropes, Anchor Point" — two items, two exact ids.
    requiredEquipmentCapabilities: ["battle_rope", "rope_anchor_point"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["battle_ropes_setup", "battle_ropes_execution"],
    requiredStopConditionIds: [
      "battle_ropes_pace_loss",
      "battle_ropes_technical_failure",
      "battle_ropes_fatigue_limit",
      "battle_ropes_acute_symptom",
      "battle_ropes_pain",
      "battle_ropes_completion",
    ],
    durationEstimationProfileId: "duration_profile_battle_ropes",
    substitutionCapabilityTags: [],
    // No capabilities chapter describes this exercise (see the block
    // comment above), so the method catalogue is cited instead of one.
    sourceRuleIds: [SOURCE_BATTLE_ROPES, SOURCE_METHOD_CATALOGUE],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: battleRopesInstructions,
  stopConditionDefinitions: battleRopesStopConditions,
  // "# Loading Profile — Typical Volume: 5-12 rounds. Work: 10-40
  // seconds." The interval count genuinely narrows the profile's own
  // [3, 12]; the work duration matches the envelope exactly, because the
  // envelope was built from this fiche, and is declared anyway so the
  // entry states its own documented range.
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 10, distanceMeters: null, rounds: null, workIntervals: 5 },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 40, distanceMeters: null, rounds: null, workIntervals: 12 },
    sourceRuleIds: [SOURCE_BATTLE_ROPES],
  },
  // Narrows the shared profile to this fiche's single documented intensity
  // reading, and is what excludes `impact_intent` — the profile's FIRST
  // rule, which would otherwise have been selected silently.
  exerciseIntensityConstraints: {
    allowedIntensityTypes: ["movement_intent"],
    rangeConstraints: [],
    sourceRuleIds: [SOURCE_BATTLE_ROPES, SOURCE_INTENSITY_MODEL],
  },
  // Null deliberately: "# Loading Profile — Recovery: 20-90 seconds" is
  // exactly the profile's own between-intervals window, so there is
  // nothing to narrow.
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_BATTLE_ROPES, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Assault Bike Intervals
// Source: 50-exercises/48_ASSAULT_BIKE_INTERVALS
//   - Primary Classification: "Combat-Specific Conditioning" (module:
//     conditioning), matching the knowledge base's own resolution.
//   - Equipment Requirements: "Required: Assault Bike, or Echo Bike.
//     Optional: Heart Rate Monitor, Power Meter."
//   - Loading Profile: "Typical Volume: 6-15 intervals. Work: 10-60
//     seconds. Recovery: 20-180 seconds. Progression: Power Output, Work
//     Duration, Reduced Recovery, Calories per Interval."
//   - Physiological Profile: "Primary Energy System: Anaerobic Glycolysis.
//     Secondary: ATP-PC, Oxidative Recovery. Typical Work Duration: 10-60
//     seconds. Typical Recovery: 20-180 seconds."
//   - Movement Context: "Machine-Based, Whole Body, Continuous, Explosive."
//   - Velocity Profile: "Maximum Intent. Continuous."
//   - Movement Pattern: "Primary: Whole-Body Cyclic Power. Secondary: Push,
//     Pull, Lower-Body Drive, Brace."
//   - Coaching Cues: "Push and pull aggressively.", "Drive through the
//     legs.", "Maintain posture.", "Control breathing during recovery.",
//     "Finish every interval with intent."
//   - Common Errors: Starting too fast, Poor pacing, Using only the arms,
//     Losing posture, Stopping pedaling immediately after work intervals.
//   - Safety Profile: "Overall Risk: Very Low." Primary Risks — Poor
//     Pacing, Insufficient Warm-Up, Grip Fatigue.
//   - Contraindications: Acute Knee Injury, Acute Shoulder Injury, Acute
//     Cardiovascular Contraindications.
//   - Performance Indicators: Peak Power, Average Power, Calories,
//     Distance, Heart Rate Recovery, Power Drop-Off, Work Consistency.
//   - Neurological Profile: "Motor Complexity: 2/5. Skill Requirement:
//     Beginner. Learning Curve: Very Short."
// Method: work_rest_intervals / conditioning / conditioning
//
// EXPLICIT PROFILE SELECTION: `power_intervals_v0_1` (Table Group 14 /
// INT-POWER), reused unchanged. The (conditioning, work_rest_intervals,
// conditioning) triple is shared by FOUR profiles and never resolves
// implicitly.
//
// WHY THIS EXERCISE WAS BLOCKED BEFORE, AND WHY IT NO LONGER IS. An earlier
// audit concluded that this exercise could only sit on INT-SHORT — the only
// Table Group 8 profile whose ranges overlapped its own — and that INT-SHORT
// documents no encodable intensity, so the entry failed at the intensity
// stage with INTENSITY_NOT_DOCUMENTED while its volume resolved. That
// conclusion was correct at the time and is now obsolete: Table Group 14 did
// not exist when it was written. Nothing about this fiche changed, and
// INT-SHORT is untouched and still non-executable — a fourth, executable
// profile simply appeared on the same triple.
//
// This entry is NOT a stretch of that table group. Table Group 14's own
// Scope section states the family as records sharing "a Primary
// Classification of Combat-Specific Conditioning, the same ATP-PC plus
// anaerobic-glycolysis energy systems, and a Velocity Profile containing
// Maximum Intent". This fiche satisfies all three literally and
// independently: "# Primary Classification: Combat-Specific Conditioning";
// "Primary Energy System: Anaerobic Glycolysis. Secondary: ATP-PC"; "#
// Velocity Profile: Maximum Intent. Continuous." It is the first consumer
// that was not one of the two records the envelope was built from, which is
// the point of a generic profile — the doctrine is applied, never widened.
//
// VOLUME AND REST — the fiche's own bounds are declared, and the generic
// resolvers compute every intersection. Nothing is pre-computed here:
//   - intervals: documented 6-15, against the profile's own [3, 12] → 6-12;
//   - work duration: documented 10-60 s, against [10, 40] → 10-40 s;
//   - rest: documented 20-180 s, against [20, 90] → 20-90 s.
// Each documented bound is wider than the profile at the ceiling and equal
// or narrower at the floor, so the prescription always stays strictly
// inside what this fiche documents — never above it. The upper parts of the
// documented ranges (13-15 intervals, 41-60 s of work, 91-180 s of
// recovery) are consequently NOT reachable through this entry: a documented
// precision loss in the safe direction, recorded rather than resolved by
// widening a shared envelope. Both quantified sections of this fiche agree
// (Loading Profile and Physiological Profile give the same 10-60 s work and
// 20-180 s recovery), so there is no narrower-source decision to make, as
// there was for heavy_bag_power_intervals.
// Nothing is converted: calories are not seconds, watts are not intensity,
// cadence is not volume, the machine's virtual distance is not a real
// distance, and the fiche's own "intervals" needed no reinterpretation at
// all — unlike battle_ropes and heavy_bag_power_intervals, this chapter
// already counts in intervals.
//
// INTENSITY. `movement_intent: explosive` only, declared through an explicit
// `exerciseIntensityConstraints` narrowing. `explosive` is a literal word of
// this fiche's own "# Movement Context — Machine-Based, Whole Body,
// Continuous, Explosive", the same section slot battle_ropes sources its own
// `explosive` from, and it is a literal member of 26_INTENSITY_MODEL's
// movement-intent vocabulary. The Velocity Profile's "Maximum Intent"
// corroborates it.
// The profile's OTHER rule, `impact_intent: maximal_safe_power`, is
// deliberately excluded and the constraint is what excludes it: nothing is
// struck on a bike. Because `impact_intent` is the profile's FIRST
// documented rule, omitting the constraint would have selected it silently
// — the constraint is load-bearing, not decorative.
// NO measured target is claimed. "Peak Power", "Average Power", "Calories",
// "Distance", "Heart Rate Recovery", "Power Drop-Off" and "Work
// Consistency" are all listed by this fiche as Performance INDICATORS, and
// the heart-rate monitor and power meter are Optional instrumentation.
// "Power Output" and "Calories per Interval" appear only as PROGRESSION
// AXES. None of them carries a normative figure anywhere in the chapter, so
// none becomes a prescribed target and no number is derived from any of
// them. This is precisely the gap the original block was about, and it is
// closed by a documented qualitative rule rather than by inventing a watt,
// a heart rate or an RPE.
//
// TEMPO. `work_rest_intervals` declares `tempoPolicy: forbidden` and the
// profile carries no tempo rule, so the resolved tempo is null.
// `supportedTempoTypes` is empty rather than borrowed: this fiche documents
// no tempo of any kind, and a continuous machine effort has no
// concentric/eccentric phase to intend. This is a deliberate divergence from
// rowerg_intervals, which declares `global_intent` because Family 11 lists
// it for the family — the resolved outcome is identical (null in both
// cases, the method forbidding tempo), and the tighter claim is the one this
// chapter actually supports. The explosive character lives in the intensity
// rule, where this fiche puts it.
//
// EQUIPMENT. `cardio_machine`, added to the prescription vocabulary by this
// lot and aligned 1:1 with the atom the knowledge base ALREADY gates on —
// the ExerciseDefinition is not modified, because that atom is exact and
// documented ("Required: Assault Bike, or Echo Bike" names two brands of one
// air-resistance apparatus). The only thing missing was the vocabulary
// asymmetry: the prescription layer had no way to express an atom the
// knowledge base already used.
// No equivalence is created with `rowing_ergometer` — matching is exact and
// the two are disjoint since rowerg_intervals was narrowed to its own
// precise id, which also means this entry is today the only user of
// `cardio_machine` in either layer. The Optional heart-rate monitor and
// power meter are excluded, matching the established discipline of never
// promoting an Optional item to Required.
// KNOWN STALE COMMENT, flagged and deliberately NOT fixed here: the
// ExerciseDefinition's own block comment still says `cardio_machine` is
// shared with ROWERG_INTERVALS. That stopped being true when
// rowerg_intervals was narrowed to `rowing_ergometer`. Correcting it is a
// knowledge-base edit this lot does not need and does not make.
//
// ELIGIBILITY. Governed entirely by the knowledge base, whose `requirements`
// declare exactly one atom and no environment gate at all: no space, no
// floor safety, no landing surface, no wall, no partner and no sprint
// permission is documented anywhere in this fiche (checked directly), and
// none is invented here.
//
// LATERALITY. `not_applicable` with `interval_total`, matching Family 11's
// own documented laterality for ergometer conditioning and the knowledge
// base's `unilateral: false`. The fiche's "Push, Pull, Lower-Body Drive"
// secondary patterns describe a whole-body cyclic action with no per-side
// allocation whatsoever, and the volume is counted in intervals. No count is
// multiplied for two arms or two legs.
//
// CAPABILITY FAMILY. 33_EXERCISE_PRESCRIPTION_CAPABILITIES' "Exercise Family
// 11 — Ergometer Conditioning" describes this exercise and supplies its
// loading modes (`ergometer`, `machine`) and laterality (`not_applicable`),
// exactly as it does for rowerg_intervals. One deliberate departure, stated
// rather than hidden: Family 11's Supported Intensity Types list
// (heart_rate, pace, rpe, velocity, resistance_category) does NOT include
// `movement_intent`. That list is family-level guidance enforced by no
// validator; the conditioning MODULE contract, the `work_rest_intervals`
// METHOD contract and the selected profile all admit `movement_intent`, and
// this fiche documents one explicitly while documenting no figure for any of
// Family 11's five types. The intensity claim is therefore sourced to the
// chapter and 26_INTENSITY_MODEL, not to the capabilities document.
//
// STOP CONDITIONS — the six categories `work_rest_intervals` requires, no
// more. Family 11's own Required Stop Conditions additionally name
// "equipment failure"; a factory exists (`equipmentFailureCondition`) but is
// scoped `set`/`end_set`, a boundary `work_rest_intervals` does not use, and
// no module or method contract requires the category. That is the same
// documented gap already recorded for rowerg_intervals, and it is unchanged
// here. This fiche's own "Poor Pacing" risk is carried where it is
// actionable, in the pace-loss and fatigue-limit descriptions.
// -----------------------------------------------------------------------------

const SOURCE_ASSAULT_BIKE_INTERVALS = "50-exercises/48_ASSAULT_BIKE_INTERVALS";

const assaultBikeIntervalsStopConditions: StopConditionDefinition[] = [
  intervalPaceLossCondition({
    conditionId: "assault_bike_intervals_pace_loss",
    description:
      "Stop the interval when cadence or power output visibly drops and the effort becomes slow despite maximal intent. Poor pacing is this exercise's own documented primary risk, and work consistency across intervals is what the effort is for.",
    sourceRuleIds: [SOURCE_ASSAULT_BIKE_INTERVALS, SOURCE_METHOD_CATALOGUE],
  }),
  technicalFailureCondition({
    conditionId: "assault_bike_intervals_technical_failure",
    description:
      "Stop the interval on technical breakdown: driving with the arms alone instead of pushing and pulling while driving through the legs, or loss of posture on the machine.",
    sourceRuleIds: [SOURCE_ASSAULT_BIKE_INTERVALS],
  }),
  fatigueLimitCondition({
    conditionId: "assault_bike_intervals_fatigue_limit",
    description:
      "Stop the exercise once accumulated fatigue prevents finishing an interval with intent, or once grip fatigue compromises the handles. Starting too fast and grip fatigue are both documented failure modes of this exercise.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_ASSAULT_BIKE_INTERVALS],
  }),
  acuteSymptomCondition({
    conditionId: "assault_bike_intervals_acute_symptom",
    description:
      "Stop immediately if an acute symptom appears at any point during the intervals or the recoveries, including any cardiovascular symptom.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_ASSAULT_BIKE_INTERVALS],
  }),
  painCondition({
    conditionId: "assault_bike_intervals_pain",
    description:
      "Stop immediately if pain occurs, or in the presence of an acute knee or shoulder injury, or any acute cardiovascular contraindication.",
    sourceRuleIds: [SOURCE_ASSAULT_BIKE_INTERVALS],
  }),
  completionCondition({
    conditionId: "assault_bike_intervals_completion",
    description:
      "Stop once the prescribed intervals and their per-interval duration are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const assaultBikeIntervalsInstructions: InstructionDefinition[] = [
  makeInstruction(
    "assault_bike_intervals_setup",
    "setup",
    "Use an air-resistance bike: an Assault Bike or an Echo Bike. Warm up before the first interval — insufficient warm-up is a documented risk of this exercise. A heart-rate monitor and a power meter are optional and are never prescribed targets. The skill requirement is beginner level with a very short learning curve.",
    "high",
    true,
    SOURCE_ASSAULT_BIKE_INTERVALS,
  ),
  makeInstruction(
    "assault_bike_intervals_execution",
    "execution",
    "Push and pull aggressively while driving through the legs, maintain posture and finish every interval with intent. Do not start too fast and do not drive with the arms alone. Keep pedalling during the recovery rather than stopping immediately, and control breathing while recovering. Stop the interval when cadence, power or posture clearly drops.",
    "high",
    true,
    SOURCE_ASSAULT_BIKE_INTERVALS,
  ),
];

const assaultBikeIntervalsEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "assault_bike_intervals",
  moduleId: "conditioning",
  role: "conditioning",
  explicitMethodId: "work_rest_intervals",
  numericalProfileId: "power_intervals_v0_1",
  capabilities: {
    exerciseId: "assault_bike_intervals",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["work_rest_intervals"],
    supportedVolumeStructures: ["intervals"],
    // See the block comment above for why `impact_intent`, offered by the
    // shared profile, is not claimed, and why `movement_intent` is sourced
    // to the chapter rather than to Family 11's own list.
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    // Family 11 — Ergometer Conditioning, identical to rowerg_intervals.
    supportedLoadingModes: ["ergometer", "machine"],
    // Empty, not borrowed: this fiche documents no tempo and the method
    // forbids it. See the block comment above.
    supportedTempoTypes: [],
    laterality: "not_applicable",
    volumeInterpretations: ["interval_total"],
    // Exactly the three tags `work_rest_intervals` requires.
    capabilityTags: ["interval_structure", "timed_effort", "technical_quality_observation"],
    // The atom the knowledge base already gates on, now expressible.
    requiredEquipmentCapabilities: ["cardio_machine"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: [
      "assault_bike_intervals_setup",
      "assault_bike_intervals_execution",
    ],
    requiredStopConditionIds: [
      "assault_bike_intervals_pace_loss",
      "assault_bike_intervals_technical_failure",
      "assault_bike_intervals_fatigue_limit",
      "assault_bike_intervals_acute_symptom",
      "assault_bike_intervals_pain",
      "assault_bike_intervals_completion",
    ],
    durationEstimationProfileId: "duration_profile_assault_bike_intervals",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_ASSAULT_BIKE_INTERVALS, SOURCE_CAPABILITIES_DOC],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: assaultBikeIntervalsInstructions,
  stopConditionDefinitions: assaultBikeIntervalsStopConditions,
  // "# Loading Profile — Typical Volume: 6-15 intervals. Work: 10-60
  // seconds." The fiche's own bounds are declared verbatim; the generic
  // resolvers intersect them with the profile's [3, 12] and [10, 40] to
  // 6-12 intervals of 10-40 seconds. No intersection is pre-computed here.
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 10, distanceMeters: null, rounds: null, workIntervals: 6 },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 60, distanceMeters: null, rounds: null, workIntervals: 15 },
    sourceRuleIds: [SOURCE_ASSAULT_BIKE_INTERVALS],
  },
  // Narrows the shared profile to this fiche's single documented intensity
  // reading, and is what excludes `impact_intent` — the profile's FIRST
  // rule, which would otherwise have been selected silently.
  exerciseIntensityConstraints: {
    allowedIntensityTypes: ["movement_intent"],
    rangeConstraints: [],
    sourceRuleIds: [SOURCE_ASSAULT_BIKE_INTERVALS, SOURCE_INTENSITY_MODEL],
  },
  // "# Loading Profile — Recovery: 20-180 seconds", declared verbatim and
  // intersected by the resolver with the profile's own [20, 90].
  exerciseRestConstraints: {
    scope: "between_intervals",
    minimumSeconds: 20,
    maximumSeconds: 180,
    sourceRuleIds: [SOURCE_ASSAULT_BIKE_INTERVALS],
  },
  sourceRuleIds: [SOURCE_ASSAULT_BIKE_INTERVALS, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Towel Pull-Up
// Source: 50-exercises/65_GRIP/10_TOWEL_PULL_UP.md
//   - Primary Classification: "Grip Strength" (module grip), matching the
//     knowledge base's own resolution.
//   - Equipment: "A towel is draped securely over a stable pull-up bar."
//   - Prescription Variables: "Repetitions — 1 to 6 for strength, 4 to 8
//     for strength endurance"; "Sets — 3 to 5"; "Tempo — controlled
//     ascent, brief top pause, 2 to 4 second eccentric, no uncontrolled
//     drop"; "Rest — 2 to 4 minutes for strength, 90 to 180 seconds for
//     strength endurance".
//   - Strength Prescription: "3 to 5 sets, 2 to 5 repetitions, 2 to 4
//     minutes rest, 1 to 3 repetitions in reserve, complete grip control."
//   - Strength-Endurance Prescription: "3 to 4 sets, 4 to 8 repetitions,
//     90 to 180 seconds rest, submaximal grip fatigue, no uncontrolled
//     slipping."
//   - Isometric Variation: "5 to 20 seconds, 2 to 4 sets" — NOT this entry.
//   - Key Technical Cues: "Crush the towel.", "Keep the wrists strong.",
//     "Pull the elbows toward the ribs.", "Keep the chest tall.", "Do not
//     shrug into the ears.", "Keep the ribs down.", "Minimize swinging.",
//     "Control the descent.", "Stop before the hands begin to slip
//     uncontrollably."
//   - Common Errors: Passive Shoulder Position, Excessive Swinging, Wrist
//     Collapse, Elbows Flare Excessively, Neck Reaching, Uncontrolled
//     Descent, Grip Failure Before Technical Failure.
//   - Safety Rules: "Use a strong towel without visible damage.", "Place
//     the towel over a stable pull-up bar.", "Confirm that the bar is
//     secure.", "Keep the landing area clear.", "Do not continue after
//     grip security is lost.", "Do not use an unstable door-mounted
//     setup.", "Terminate immediately if numbness, sharp pain or sudden
//     weakness occurs."
//   - Technical Complexity: "Moderate."
// Method: straight_sets_repetitions / grip / secondary
//   (grip_repetition_strength_v0_1 — sets 3/4/5, reps 2/5/8, RIR 1/2/3,
//   rest 90/165/240 s, tempo global_intent controlled)
//
// PROFILE. Table Group 15's own profile, whose triple
// (grip, straight_sets_repetitions, secondary) is UNIQUE — implicit
// resolution would already select it. The id is declared explicitly all
// the same: this entry is the profile's first consumer, and naming the
// selection at the entry keeps the decision auditable in the Decision
// Trace rather than inferred from the absence of a competitor. The same
// convention ab_wheel and plate_pinch already use.
//
// THE DOCTRINE IS THE MODULE'S, NOT THIS ENTRY'S. Table Group 15 was
// written from `65_GRIP/00_OVERVIEW.md`'s own new "Grip Repetition
// Strength" rule, and that rule owns every number in the profile. This
// entry contributes nothing to the envelope — it narrows it. Had this
// exercise's figures been used to BUILD the envelope, the profile would
// have been a towel-pull-up profile wearing a generic name, which the
// preceding audit refused.
//
// VARIANT REPRESENTED — the complete towel pull-up, and only that. The
// chapter documents four other things this entry does NOT represent:
//   - the Isometric Variation (5-20 s holds) — a different unit entirely,
//     covered by Table Group 4 and excluded in writing by the module rule;
//   - the Assisted Variation (bands, foot support, partner, machine);
//   - weighted towel pull-ups, "reserved for advanced athletes with
//     established tissue tolerance";
//   - eccentric-only descents.
// None of them is mixed into the numbers below.
//
// NARROWING — the union of the chapter's two repetition prescriptions,
// which is exactly what Table Group 15's narrowing rule permits:
//   - sets: Strength 3-5 and Strength-Endurance 3-4 give 3-5, which IS the
//     profile's own envelope. Declared anyway, as ab_wheel and battle_ropes
//     already do, so the entry states its own documented range rather than
//     relying on the envelope happening to match;
//   - repetitions: Strength 2-5 and Strength-Endurance 4-8 give 2-8, again
//     the profile's own envelope, declared for the same reason;
//   - rest: Strength 120-240 s and Strength-Endurance 90-180 s give
//     90-240 s, the profile's own window.
// The chapter's wider "Prescription Variables — 1 to 6 repetitions for
// strength" is NOT used: the named Strength Prescription says 2 to 5, and
// this registry takes the named prescription over the variable range, the
// same discipline plate_pinch already applied to its own three named
// prescriptions.
//
// INTENSITY. `rir` only, 1-3 from "1 to 3 repetitions in reserve" in the
// Strength Prescription — the single quantified intensity figure anywhere
// in this chapter. No RPE exists in it, and none is invented.
// Everything else the chapter lists under "Intensity" is a DETERMINANT,
// not a target: bodyweight, assistance level, towel thickness, towel
// material, grip height, range of motion, repetition count and proximity
// to grip failure. The module chapter states the general form of this
// rule — "Grip intensity is not represented accurately by external load
// alone" — so none of them becomes a number here. In particular towel
// thickness is not converted into a resistance category, and bodyweight is
// not converted into a percentage: the loading mode is bodyweight and the
// reserve is counted against grip security.
//
// TEMPO. `global_intent: controlled`, resolved from the profile, matching
// this chapter's "controlled ascent" and "Control the descent" and the
// module rule's "Controlled throughout, with a controlled descent".
// DOCUMENTED PRECISION LOSS: the chapter's "2 to 4 second eccentric" is
// phase timing, which `NumericalTempoRule` cannot represent
// (global_intent / phase_intent / isometric_hold / none only). The figure
// is therefore carried where it is actionable — in the execution
// instruction — exactly as Table Group 13 records for phase-timed core
// work. No phase duration is fabricated in the numbers.
//
// EQUIPMENT. `pull_up_bar` AND `towel`, the two atoms the knowledge base
// already gates on. `towel` is added to the prescription vocabulary by
// this lot and aligned 1:1 with the pre-existing `EquipmentType` member;
// the ExerciseDefinition is not modified. Matching is exact and no
// equivalence is created: a rope, a strap, a suspension trainer and a
// thick-grip attachment all fail, which is what keeps this entry disjoint
// from the rope exercises the module rule excludes.
// The knowledge base additionally gates `sufficient_space` at
// "very_limited"; that environment atom stays where it is, and no
// capability id is invented to mirror it.
//
// LATERALITY. `bilateral` with `total_repetitions`. "The athlete grips one
// end of the towel with each hand" and both hands pull the same body
// upward in one movement — a repetition is one complete movement, counted
// once. Nothing is per side and nothing is multiplied.
//
// STOP CONDITIONS — six. `straight_sets_repetitions` requires three
// (technical_failure, pain, completion); the GRIP MODULE contract requires
// five (adding fatigue_limit and equipment_failure), and both existing
// grip entries already declare more than the method minimum
// (plate_pinch four, pinch_carry five). All six declared here are
// documented by this chapter:
//   - equipment_failure covers the towel tearing, slipping or an unstable
//     bar, all named in Safety Rules, and the documented "Grip Failure
//     Before Technical Failure" error;
//   - range_of_motion_loss covers "Neck Reaching → false range
//     completion" and the prescribed bottom position.
// The module's sixth required category, `balance_loss`, is deliberately
// ABSENT: this chapter documents no balance concern anywhere (checked
// directly), and declaring it would mean inventing one.
// -----------------------------------------------------------------------------

const SOURCE_TOWEL_PULL_UP = "50-exercises/65_GRIP/10_TOWEL_PULL_UP.md";

const towelPullUpStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "towel_pull_up_technical_failure",
    description:
      "Stop the set on technical breakdown: hanging passively without scapular control, using momentum to swing up, wrists collapsing under load, or elbows flaring away from the ribs.",
    sourceRuleIds: [SOURCE_TOWEL_PULL_UP],
  }),
  equipmentFailureCondition({
    conditionId: "towel_pull_up_equipment_failure",
    description:
      "Stop immediately if the hands begin to slide, if the towel shows damage or begins to tear, or if the bar or its mounting moves. Grip security lost is the end of the set, whatever repetitions remain.",
    sourceRuleIds: [SOURCE_TOWEL_PULL_UP],
  }),
  rangeOfMotionLossCondition({
    conditionId: "towel_pull_up_range_of_motion_loss",
    description:
      "Stop the set when the prescribed top position can no longer be reached without extending the neck to bring the chin over the hands, or when the prescribed bottom position is no longer reached under control.",
    sourceRuleIds: [SOURCE_TOWEL_PULL_UP],
  }),
  fatigueLimitCondition({
    conditionId: "towel_pull_up_fatigue_limit",
    description:
      "Stop the exercise once grip quality and pulling mechanics can no longer both be maintained. Repetitions continue only while both remain acceptable.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_TOWEL_PULL_UP],
  }),
  painCondition({
    conditionId: "towel_pull_up_pain",
    description:
      "Stop immediately if pain occurs, and terminate at once on numbness, sharp pain or sudden weakness. Avoid maximal effort with irritated finger or elbow tendons.",
    sourceRuleIds: [SOURCE_TOWEL_PULL_UP],
  }),
  completionCondition({
    conditionId: "towel_pull_up_completion",
    description: "Stop once the prescribed sets and repetitions are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const towelPullUpInstructions: InstructionDefinition[] = [
  makeInstruction(
    "towel_pull_up_setup",
    "setup",
    "Drape one strong towel, without visible damage, securely over a stable pull-up bar and confirm the bar is secure; do not use an unstable door-mounted setup. The towel must be long enough to permit a secure hold without excessive bunching. Hold one towel end in each hand at approximately shoulder width or slightly narrower, thumbs wrapped when possible, wrists controlled, shoulders actively stabilized, ribs controlled, pelvis neutral and the body aligned beneath the grip. Keep the landing area clear.",
    "critical",
    true,
    SOURCE_TOWEL_PULL_UP,
  ),
  makeInstruction(
    "towel_pull_up_execution",
    "execution",
    "Establish an active hang, brace the trunk and initiate the pull by driving the elbows down toward the ribs. Crush the towel, keep the wrists strong and the chest tall, do not shrug into the ears and minimize swinging. Reach the prescribed top position without craning the neck, then lower under control over roughly 2 to 4 seconds to the prescribed bottom position while maintaining shoulder integrity. Repeat only while grip quality and pulling mechanics remain acceptable, and stop before the hands begin to slip uncontrollably.",
    "high",
    true,
    SOURCE_TOWEL_PULL_UP,
  ),
];

const towelPullUpEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "towel_pull_up",
  moduleId: "grip",
  role: "secondary",
  explicitMethodId: "straight_sets_repetitions",
  numericalProfileId: "grip_repetition_strength_v0_1",
  capabilities: {
    exerciseId: "towel_pull_up",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    // The single quantified intensity figure in this chapter. Every other
    // "Intensity" item it lists is a determinant, not a target.
    supportedIntensityTypes: ["rir"],
    preferredIntensityTypes: ["rir"],
    // "# Movement Description" — the athlete's own bodyweight. The weighted
    // and assisted variations are documented but not represented here.
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    // Exactly the two tags `straight_sets_repetitions` requires.
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    // "A towel is draped securely over a stable pull-up bar" — two atoms,
    // the same two the knowledge base gates on.
    requiredEquipmentCapabilities: ["pull_up_bar", "towel"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["towel_pull_up_setup", "towel_pull_up_execution"],
    requiredStopConditionIds: [
      "towel_pull_up_technical_failure",
      "towel_pull_up_equipment_failure",
      "towel_pull_up_range_of_motion_loss",
      "towel_pull_up_fatigue_limit",
      "towel_pull_up_pain",
      "towel_pull_up_completion",
    ],
    durationEstimationProfileId: "duration_profile_towel_pull_up",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_TOWEL_PULL_UP, SOURCE_MODULE_PROFILES],
  },
  supportedIntensityTypes: ["rir"],
  preferredIntensityType: "rir",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: "global_intent",
  instructionDefinitions: towelPullUpInstructions,
  stopConditionDefinitions: towelPullUpStopConditions,
  // The union of this chapter's two repetition prescriptions: sets 3-5
  // (Strength 3-5, Strength-Endurance 3-4) and repetitions 2-8 (Strength
  // 2-5, Strength-Endurance 4-8). Both match the profile's own envelope,
  // and are declared anyway so the entry states its own documented range.
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 2, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 5, repetitions: 8, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_TOWEL_PULL_UP],
  },
  // Null: the profile documents exactly one intensity rule and this chapter
  // documents exactly the same 1-3 RIR range. There is nothing to narrow
  // and nothing to choose between.
  exerciseIntensityConstraints: null,
  // "Rest — 2 to 4 minutes for strength, 90 to 180 seconds for strength
  // endurance" — union 90-240 s, which IS the profile's own window.
  // Declared so the entry states its own documented range.
  exerciseRestConstraints: {
    scope: "between_sets",
    minimumSeconds: 90,
    maximumSeconds: 240,
    sourceRuleIds: [SOURCE_TOWEL_PULL_UP],
  },
  sourceRuleIds: [SOURCE_TOWEL_PULL_UP, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Rope Climb
// Source: 50-exercises/65_GRIP/13_ROPE_CLIMB.md
//   - Primary Classification: "Grip-Integrated Pulling Strength"; module grip.
//   - Exercise Identity: "Equipment: Climbing Rope. Complexity: High.
//     Unilateral or Bilateral: Alternating Bilateral. Closed or Open Chain:
//     Closed Chain."
//   - Prescription Variables: "Height — partial climbs, 2 to 4 metres,
//     full-rope climbs, repeated short ascents"; "Repetitions — 1 to 5
//     climbs, or 2 to 8 controlled hand pulls per set"; "Sets — 3 to 5";
//     "Rest — 2 to 5 minutes".
//   - Strength Prescription: "3 to 5 sets, 1 to 3 short climbs, long rest,
//     full technical control, termination before grip breakdown."
//   - Execution: "Verify the rope and anchor point. ... Reposition one hand
//     higher on the rope. Re-establish full grip before moving the other
//     hand. ... Descend under control. ... Finish with both feet safely on
//     the floor."
//   - Safety Rules: "Use a professionally anchored rope.", "Inspect the rope
//     before every session.", "Keep the landing area clear.", "Teach descent
//     before full-height climbing.", "Do not climb beyond the athlete's safe
//     descent capacity.", "Stop before grip failure.", "Do not slide down
//     the rope.", "Terminate immediately if sharp pain, numbness or sudden
//     weakness occurs."
//   - Common Errors: Insecure Regripping (and the rest of that section).
// Method: straight_sets_repetitions / grip / secondary
//   (grip_climb_strength_v0_1 — sets 3/4/5, climbs 1/3/5, technical_effort
//   high_quality, rest 120/210/300 s, tempo global_intent controlled)
//
// UNIT — `climbs`, and this is the whole point of the entry. The chapter
// offers two units in the same breath ("1 to 5 climbs, OR 2 to 8 controlled
// hand pulls per set"), and only ONE may be represented. Complete ascents
// are chosen because they are the better-quantified of the two: the named
// Strength Prescription quantifies climbs ("1 to 3 short climbs") and never
// quantifies hand pulls, while the Strength-Endurance Prescription leaves
// "repeated hand transitions" unquantified entirely. The hand-pull reading
// of THIS exercise is therefore not represented — it is not merged into
// Table Group 17 either, whose consumer is rope_pull and whose envelope is
// a different exercise's.
//
// CLIMBED HEIGHT IS NOT A VOLUME DIMENSION. "Height — partial climbs, 2 to
// 4 metres, full-rope climbs" is a documented variable of the exercise, and
// it stays in the instructions. No metre is converted into a count, and no
// count into a metre. `straight_sets_repetitions` forbids the distance
// field outright, which makes the refusal structural rather than a
// preference.
//
// PROFILE. Table Group 16's own profile. Its triple
// (grip, straight_sets_repetitions, secondary) is shared with Table Groups
// 15 and 17, so the explicit `numericalProfileId` is mandatory — implicit
// resolution refuses the triple.
//
// NARROWING. The chapter's Prescription Variables give sets 3-5, climbs 1-5
// and rest 2-5 minutes, and those ARE the module envelope, because the
// module rule was written from this family. Declared anyway, as ab_wheel
// and towel_pull_up already do, so the entry states its own documented
// range rather than relying on the envelope happening to match. The named
// Strength Prescription's narrower "1 to 3 short climbs" is NOT used as the
// bound: the chapter documents 1-5 as the range and 1-3 as one prescription
// within it, and this entry represents the exercise, not one prescription
// of it — unlike towel_pull_up, whose chapter gives no wider variable range
// than its named prescriptions.
//
// INTENSITY. `technical_effort` only, resolved from the profile as
// `high_quality`. The chapter documents "full technical control" and
// "technically consistent ascent and descent" and gives no RPE, no RIR and
// no load figure anywhere. Rope diameter, texture, stiffness, length and
// surface friction are documented DIFFICULTY influences, and assistance
// (foot lock, leg drive, partial height, seated start, body angle,
// partner support) is a documented regression axis — none is converted
// into a number.
//
// LATERALITY. `bilateral` with `climbs`. The chapter says "Alternating
// Bilateral", but that alternation is intra-movement: the hands alternate
// WITHIN an ascent, and the prescription allocates nothing per hand. A
// per-side interpretation would also force the laterality-resolution gate,
// which is exactly the wrong claim here. The knowledge base's own
// `unilateral: false` agrees.
//
// EQUIPMENT. `rope`, plus the environment gates the knowledge base already
// owns: `safe_landing_surface` and `sufficient_space` at "large". `rope` is
// added to the prescription vocabulary by this lot and is disjoint from
// `battle_rope` in both directions. No anchor id is invented: "a
// professionally anchored rope" is a property OF the rope in this chapter,
// not a second implement, and `rope_anchor_point` belongs to battle ropes,
// where the anchor is a separate documented Required item.
//
// STOP CONDITIONS — six, all documented here. The method requires three
// (technical_failure, pain, completion) and the grip module five (adding
// fatigue_limit and equipment_failure). `equipment_failure` covers the
// inspected rope and its anchor; `range_of_motion_loss` covers the
// prescribed height and the controlled descent to both feet on the floor.
// `balance_loss`, the module's sixth, is deliberately absent: this chapter
// documents no balance concern (checked directly).
// -----------------------------------------------------------------------------

const SOURCE_ROPE_CLIMB = "50-exercises/65_GRIP/13_ROPE_CLIMB.md";

const ropeClimbStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "rope_climb_technical_failure",
    description:
      "Stop the set on technical breakdown: moving the next hand before the supporting hand is fully secure, loss of an active shoulder position, or a trunk that can no longer be kept controlled between transitions.",
    sourceRuleIds: [SOURCE_ROPE_CLIMB],
  }),
  equipmentFailureCondition({
    conditionId: "rope_climb_equipment_failure",
    description:
      "Stop immediately if the rope shows damage on inspection, if the anchor is not secure, or if the hands begin to slide. Never slide down the rope.",
    sourceRuleIds: [SOURCE_ROPE_CLIMB],
  }),
  rangeOfMotionLossCondition({
    conditionId: "rope_climb_range_of_motion_loss",
    description:
      "Stop the set when the prescribed height can no longer be reached and descended under control, and never climb beyond the athlete's safe descent capacity.",
    sourceRuleIds: [SOURCE_ROPE_CLIMB],
  }),
  fatigueLimitCondition({
    conditionId: "rope_climb_fatigue_limit",
    description:
      "Stop the exercise before grip failure. An ascent begun on a fatigued grip becomes a descent that cannot be controlled, which is why the set ends first.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_ROPE_CLIMB],
  }),
  painCondition({
    conditionId: "rope_climb_pain",
    description:
      "Stop immediately if pain occurs, and terminate at once on sharp pain, numbness or sudden weakness. Avoid maximal efforts with irritated fingers, elbows or shoulders.",
    sourceRuleIds: [SOURCE_ROPE_CLIMB],
  }),
  completionCondition({
    conditionId: "rope_climb_completion",
    description: "Stop once the prescribed sets and ascents are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const ropeClimbInstructions: InstructionDefinition[] = [
  makeInstruction(
    "rope_climb_setup",
    "setup",
    "Use a professionally anchored rope and inspect it before every session. Ensure adequate clearance around the climbing area, a safe landing surface and appropriate floor protection, and keep the landing area clear. Grip the rope with both hands, wrists controlled, shoulders actively stabilized, ribs stacked and trunk braced, with the feet positioned according to the selected climbing technique. Establish grip security before leaving the floor. Descent is taught before full-height climbing, and novice athletes are supervised.",
    "critical",
    true,
    SOURCE_ROPE_CLIMB,
  ),
  makeInstruction(
    "rope_climb_execution",
    "execution",
    "Pull the body upward while driving the elbows down, reposition one hand higher on the rope and re-establish full grip before moving the other. Repeat while keeping the trunk controlled, to the prescribed height — partial climbs, roughly 2 to 4 metres, or full-rope climbs, according to the athlete's safe descent capacity. Descend under control, maintaining grip and foot security throughout, and finish with both feet safely on the floor. Never slide down the rope, and protect exposed skin from rope burns.",
    "high",
    true,
    SOURCE_ROPE_CLIMB,
  ),
];

const ropeClimbEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "rope_climb",
  moduleId: "grip",
  role: "secondary",
  explicitMethodId: "straight_sets_repetitions",
  numericalProfileId: "grip_climb_strength_v0_1",
  capabilities: {
    exerciseId: "rope_climb",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    // The athlete's own bodyweight; the documented assistance variations
    // (foot lock, leg drive, seated start, partner support) are regressions
    // this entry does not represent.
    supportedLoadingModes: ["bodyweight"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    // The count is ascents, not repetitions — see the block comment above.
    volumeInterpretations: ["climbs"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["rope"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["rope_climb_setup", "rope_climb_execution"],
    requiredStopConditionIds: [
      "rope_climb_technical_failure",
      "rope_climb_equipment_failure",
      "rope_climb_range_of_motion_loss",
      "rope_climb_fatigue_limit",
      "rope_climb_pain",
      "rope_climb_completion",
    ],
    durationEstimationProfileId: "duration_profile_rope_climb",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_ROPE_CLIMB, SOURCE_MODULE_PROFILES],
  },
  supportedIntensityTypes: ["technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: "global_intent",
  instructionDefinitions: ropeClimbInstructions,
  stopConditionDefinitions: ropeClimbStopConditions,
  // "# Prescription Variables — Sets: 3 to 5. Repetitions: 1 to 5 climbs."
  // Both match the module envelope, and are declared so the entry states its
  // own documented range. The climbed height is deliberately absent: it is
  // not a volume dimension here.
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 1, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 5, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_ROPE_CLIMB],
  },
  // Null: the profile documents one rule and this chapter documents no
  // competing intensity of any kind.
  exerciseIntensityConstraints: null,
  // "# Prescription Variables — Rest: 2 to 5 minutes", which IS the module
  // window. Declared so the entry states its own documented range.
  exerciseRestConstraints: {
    scope: "between_sets",
    minimumSeconds: 120,
    maximumSeconds: 300,
    sourceRuleIds: [SOURCE_ROPE_CLIMB],
  },
  sourceRuleIds: [SOURCE_ROPE_CLIMB, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Rope Pull
// Source: 50-exercises/65_GRIP/14_ROPE_PULL.md
//   - Primary Classification: "Grip-Integrated Pulling Endurance"; module grip.
//   - Exercise Identity: "Equipment: Climbing Rope, Sled or Anchored Load.
//     Complexity: Moderate. Unilateral or Bilateral: Alternating Bilateral.
//     Closed or Open Chain: Open Chain."
//   - Prescription Variables: "Distance — 5 to 15 metres for strength, 10 to
//     30 metres for strength endurance"; "Duration — 10 to 20 seconds for
//     strength, 20 to 40 seconds for strength endurance, 30 to 60 seconds
//     for work-capacity emphasis"; "Hand Pulls — 6 to 20 hand-over-hand
//     pulls per set"; "Sets — 3 to 5"; "Rest — 90 seconds to 4 minutes";
//     "Load is determined by sled weight, rope angle, friction, rope
//     diameter, pulling position, distance, and intended adaptation."
//   - Strength Prescription: "3 to 5 sets, heavy external resistance, 6 to
//     10 strong hand pulls, 2 to 4 minutes rest, complete grip and trunk
//     control."
//   - Strength-Endurance Prescription: "3 to 4 sets, moderate external
//     resistance, 10 to 20 hand pulls, 90 to 180 seconds rest, consistent
//     pace and posture."
//   - Work-Capacity Prescription: "2 to 4 sets, 20 to 40 second intervals" —
//     NOT this entry.
//   - Safety Rules: "Use a securely anchored rope.", "Inspect the rope
//     before use.", "Verify sled or load attachment.", "Keep the pulling
//     lane clear.", "Maintain a stable stance.", "Do not wrap the rope
//     around the hand or wrist.", "Stop before grip failure.", "Avoid
//     uncontrolled rope recoil.", "Terminate immediately if sharp pain,
//     numbness or sudden weakness occurs."
//   - Common Errors: Insecure Regripping (and the rest of that section).
// Method: straight_sets_repetitions / grip / secondary
//   (grip_hand_pull_work_v0_1 — sets 3/4/5, hand pulls 6/13/20,
//   technical_effort high_quality, rest 90/165/240 s, tempo controlled)
//
// UNIT — `hand_pulls`, chosen among THREE the chapter documents for the same
// movement, and the only one both of its strength prescriptions quantify:
//   - hand pulls: 6-10 (Strength) and 10-20 (Strength-Endurance) — used;
//   - distance: 5-15 m and 10-30 m — a Prescription Variable that no named
//     prescription restates, and a dimension `straight_sets_repetitions`
//     forbids outright. Representing it would need a distance-scoped grip
//     profile, which Table Group 17 explicitly excludes;
//   - duration and the Work-Capacity Prescription's "20 to 40 second
//     intervals" — a different structure entirely, excluded by Table Group
//     17 in writing.
// No metre becomes a pull, no second becomes a pull, and the two
// unrepresented prescriptions stay unrepresented rather than being folded
// in. This is a documented precision loss, recorded rather than resolved.
//
// PROFILE. Table Group 17's own profile, on the shared Grip triple, so the
// explicit id is mandatory.
//
// NARROWING. The union of the two pull-counted prescriptions is 6-20 hand
// pulls over 3-5 sets, with rest spanning 90-240 s — which is what the
// chapter's own Prescription Variables state, and what the module envelope
// holds. Declared so the entry states its own documented range.
//
// INTENSITY. `technical_effort` only. The chapter qualifies resistance in
// words — "heavy external resistance", "moderate external resistance" —
// and never in figures; `resistance_category` cannot carry a categorical
// profile rule in this model, and inventing a number for "heavy" is exactly
// what the module chapter forbids when it states that grip intensity is not
// represented accurately by external load alone. What the chapter DOES
// prescribe is the standard the pulls must hold: "complete grip and trunk
// control", "consistent pace and posture", "no uncontrolled slipping".
//
// LATERALITY. `bilateral` with `hand_pulls`. "Alternating Bilateral"
// describes hands alternating WITHIN the movement; the count is a total and
// nothing is allocated per hand.
//
// EQUIPMENT. `rope` only, mirroring the knowledge base exactly.
// DOCUMENTED GAP, flagged rather than papered over: this chapter's own
// "Equipment: Climbing Rope, Sled or Anchored Load" names a resistance
// source alongside the rope, and its Safety Rules say to "verify sled or
// load attachment". The knowledge base encodes only `rope`, and this entry
// mirrors that decision rather than inventing an equivalence group for
// "Sled or Anchored Load" — which would also collide with the `sled` id
// that belongs to loaded locomotion. The requirement is carried at critical
// priority in the setup instruction instead. Closing it properly is a
// knowledge-base change, not a registry one.
//
// STOP CONDITIONS — six, on the same reasoning as rope_climb.
// `range_of_motion_loss` covers the documented regripping standard: a pull
// that no longer travels its full path with the rope kept close to the body
// is a pull that has lost its range.
// -----------------------------------------------------------------------------

const SOURCE_ROPE_PULL = "50-exercises/65_GRIP/14_ROPE_PULL.md";

const ropePullStopConditions: StopConditionDefinition[] = [
  technicalFailureCondition({
    conditionId: "rope_pull_technical_failure",
    description:
      "Stop the set on technical breakdown: releasing one hand before the other is secure, loss of a stable stance, or trunk compensation replacing grip.",
    sourceRuleIds: [SOURCE_ROPE_PULL],
  }),
  equipmentFailureCondition({
    conditionId: "rope_pull_equipment_failure",
    description:
      "Stop immediately if the rope shows damage on inspection, if the anchor or the load attachment is not secure, or if the rope begins to slip through the hands. Never wrap the rope around the hand or wrist, and avoid uncontrolled rope recoil.",
    sourceRuleIds: [SOURCE_ROPE_PULL],
  }),
  rangeOfMotionLossCondition({
    conditionId: "rope_pull_range_of_motion_loss",
    description:
      "Stop the set when a pull no longer travels its full path with the rope kept close to the body, or when the regrip can no longer reach farther along the rope.",
    sourceRuleIds: [SOURCE_ROPE_PULL],
  }),
  fatigueLimitCondition({
    conditionId: "rope_pull_fatigue_limit",
    description:
      "Stop the exercise before grip failure, and before pace and posture can no longer both be held consistent.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_ROPE_PULL],
  }),
  painCondition({
    conditionId: "rope_pull_pain",
    description:
      "Stop immediately if pain occurs, and terminate at once on sharp pain, numbness or sudden weakness. Avoid maximal loading with irritated elbows or fingers.",
    sourceRuleIds: [SOURCE_ROPE_PULL],
  }),
  completionCondition({
    conditionId: "rope_pull_completion",
    description: "Stop once the prescribed sets and hand pulls are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const ropePullInstructions: InstructionDefinition[] = [
  makeInstruction(
    "rope_pull_setup",
    "setup",
    "Use a securely anchored rope and inspect it before use. This exercise also requires an external resistance — a sled or an anchored load — and its attachment must be verified before every set; that resistance is documented by this chapter but is not representable as its own equipment identifier, so it is checked here. Keep the pulling lane clear and establish a stable stance with both hands on the rope, the trunk braced and the shoulders controlled. Never wrap the rope around the hand or wrist.",
    "critical",
    true,
    SOURCE_ROPE_PULL,
  ),
  makeInstruction(
    "rope_pull_execution",
    "execution",
    "Pull one hand toward the torso, then regrip farther along the rope with the opposite hand, securing the next grip before releasing the previous one. Continue alternating hands, keeping the rope close to the body and holding consistent posture and rhythm. Stop before slipping or major technical breakdown, then reset or return the rope safely. Protect the skin from excessive friction.",
    "high",
    true,
    SOURCE_ROPE_PULL,
  ),
];

const ropePullEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "rope_pull",
  moduleId: "grip",
  role: "secondary",
  explicitMethodId: "straight_sets_repetitions",
  numericalProfileId: "grip_hand_pull_work_v0_1",
  capabilities: {
    exerciseId: "rope_pull",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    // The rope and its external resistance supply the load; the athlete is
    // not moving their own bodyweight against gravity here.
    supportedLoadingModes: ["rope"],
    supportedTempoTypes: ["global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["hand_pulls"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: ["rope"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["rope_pull_setup", "rope_pull_execution"],
    requiredStopConditionIds: [
      "rope_pull_technical_failure",
      "rope_pull_equipment_failure",
      "rope_pull_range_of_motion_loss",
      "rope_pull_fatigue_limit",
      "rope_pull_pain",
      "rope_pull_completion",
    ],
    durationEstimationProfileId: "duration_profile_rope_pull",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_ROPE_PULL, SOURCE_MODULE_PROFILES],
  },
  supportedIntensityTypes: ["technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: ["global_intent"],
  preferredTempoType: "global_intent",
  instructionDefinitions: ropePullInstructions,
  stopConditionDefinitions: ropePullStopConditions,
  // "# Prescription Variables — Hand Pulls: 6 to 20 per set. Sets: 3 to 5",
  // the union of the two pull-counted prescriptions. Distance and duration
  // are deliberately absent — see the block comment above.
  exerciseDoseConstraints: {
    minimumDose: { sets: 3, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: 5, repetitions: 20, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: [SOURCE_ROPE_PULL],
  },
  exerciseIntensityConstraints: null,
  // "# Prescription Variables — Rest: 90 seconds to 4 minutes."
  exerciseRestConstraints: {
    scope: "between_sets",
    minimumSeconds: 90,
    maximumSeconds: 240,
    sourceRuleIds: [SOURCE_ROPE_PULL],
  },
  sourceRuleIds: [SOURCE_ROPE_PULL, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Registry Lot 20 — the three partner grappling drills
// Sources: 50-exercises/31_PUMMELING, 32_WALL_WRESTLING, 33_GRIP_FIGHTING
//
// The three entries the Partner Grappling Rounds foundation was built for.
// Everything they need already exists: the `partner_grappling_rounds` method,
// Table Group 18's `partner_grappling_rounds_technical_v0_1` profile, the
// `partner_resistance` capability and the round-scoped stop-condition family.
// No method, module contract, profile or doctrine is touched here — this lot
// is registry work, and the foundation comes out of it unchanged.
//
// WHAT IS IDENTICAL ACROSS ALL THREE, and why it is not duplication: every
// one of these fields is dictated by the method contract or by Table Group
// 18, not chosen per exercise. `rounds_duration` is the method's only
// structure; `technical_effort` is the profile's only intensity rule; tempo
// is forbidden by the method; laterality is forbidden by the method, so
// `not_applicable` is the only honest value; `partner_resistance` is the
// method's own required capability. Three chapters that share a Primary
// Classification, a Secondary Classification and a Loading Profile shape
// SHOULD produce three structurally identical entries — divergence would be
// the thing needing justification.
//
// WHAT DIFFERS is exactly what the chapters differ on: the documented volume
// bounds, the wall, and the drill-specific text of instructions and stop
// conditions.
//
// ROLE. `technical` for all three, and it is read from the documents rather
// than picked for convenience: each chapter's Primary Classification is
// "Combat-Specific Technique", each names "Technical quality remains high"
// as a Success Criterion, and the movement module authorizes
// `partner_grappling_rounds` at `technical` (priority 6, its last preference
// — resisted partner work is never selected ahead of mobility or repetition
// work). `secondary` and `accessory` are contract-legal but neither is
// supported by a chapter that calls itself a technique.
//
// INTENSITY. `technical_effort` alone, and `exerciseIntensityConstraints`
// is null for all three: the profile carries exactly one intensity rule, so
// there is nothing to narrow and a constraint object would only restate it.
// No RPE and no RIR appear anywhere in the three chapters (counted
// directly). `movement_intent` is not declared even though the method allows
// it — wall_wrestling and grip_fighting say "Explosive" and pummeling says
// movement quality is prioritized over speed, and Table Group 18 already
// settled that a shared profile cannot claim a velocity one member
// contradicts.
//
// PARTNER RESISTANCE IS NOT DOSED, in any of the three. All three list it
// under "Progression" — a progression axis, not a prescribed value, the same
// reading that kept Power Output and Calories out of assault_bike_intervals.
// It is carried by the `intensity_limit` stop condition instead.
//
// REST. `exerciseRestConstraints` is null for all three, and that is a
// finding rather than an oversight: none of the three chapters documents
// inter-round rest at all (checked directly — their only time values are
// round duration and 24–48 h inter-session recovery). The profile's
// 60/120/180 s band applies unnarrowed, and it is sourced to
// `MOVEMENT_PARTNER_GRAPPLING_REST_V0_1`, so the one value no chapter
// supports can never be mistaken for a value read off one of these three.
//
// THE PARTNER IS NOT AN EQUIPMENT ID. It is gated on three layers already —
// the method's `partner_resistance` required capability, each entry's own
// `capabilityTags`, and the knowledge base's `human_assistance: partner`
// requirement, which governs eligibility. No generic "partner" identifier
// was added to the equipment vocabulary: a human being does not belong in
// the implement list. `registryValidators` was taught this class of
// requirement generically (see `NON_EQUIPMENT_REQUIREMENT_TAGS`), not
// exercise by exercise.
//
// DURATION. All three profiles are `unresolved` — see
// `durationEstimationProfiles.ts` for why a partner drill's elapsed time is
// structurally unavailable, and why `perRoundSeconds` must not be back-filled
// from the prescribed round duration.
// -----------------------------------------------------------------------------

const SOURCE_PUMMELING = "50-exercises/31_PUMMELING";
const SOURCE_WALL_WRESTLING = "50-exercises/32_WALL_WRESTLING";
const SOURCE_GRIP_FIGHTING = "50-exercises/33_GRIP_FIGHTING";

/**
 * The capability tags every partner grappling entry carries. Exactly the
 * `partner_grappling_rounds` contract's own `requiredExerciseCapabilities`,
 * in the same order — `validateCompatibility` checks the entry against the
 * method, so any divergence here is a bug, not a variation.
 */
const PARTNER_GRAPPLING_CAPABILITY_TAGS = [
  "round_structure",
  "technical_quality_observation",
  "partner_resistance",
] as const;

// -----------------------------------------------------------------------------
// Pummeling
//
// NARROWING. "# Loading Profile — Typical Volume: 3–8 rounds, 2–5 minutes",
// corroborated by "# Physiological Profile — Typical Duration: 2–5 minute
// rounds". The two sections agree, so there is no source arbitration of the
// heavy_bag kind. Declared as the chapter's own bounds; the generic resolvers
// intersect them with the profile's 3–10 × 30–300 s envelope and reach 3–8 ×
// 120–300 s. The 9th and 10th round and the 30–119 s round become
// unreachable, which is the safe direction: a constraint narrows, never
// widens.
//
// EQUIPMENT. None, and this is the chapter's own position: "# Equipment
// Requirements — Required: Training Partner", with "Wrestling Mat, Timer,
// Reaction Commands" all Optional. NO WALL — "Wall Pummeling" appears only
// as a named Variation of this chapter, and a variation's equipment is not
// the base drill's requirement. The knowledge base agrees exactly: its
// `requirements` hold `human_assistance: partner` and nothing else.
// -----------------------------------------------------------------------------

const pummelingStopConditions: StopConditionDefinition[] = [
  roundTechnicalFailureCondition({
    conditionId: "pummeling_technical_failure",
    description:
      "End the round on technical breakdown: posture lost and the athlete standing too upright, the arms working alone without the feet, or the exchange degenerating into a strength contest rather than a fight for inside position.",
    sourceRuleIds: [SOURCE_PUMMELING],
  }),
  roundCoordinationLossCondition({
    conditionId: "pummeling_coordination_loss",
    description:
      "End the round when the continuous exchange can no longer be coordinated — reacting to the hands instead of feeling pressure, tension replacing relaxed contact, or the athlete no longer able to improve position while maintaining posture and balance.",
    sourceRuleIds: [SOURCE_PUMMELING, SOURCE_MODULE_PROFILES],
  }),
  roundBalanceLossCondition({
    conditionId: "pummeling_balance_loss",
    description:
      "End the round on loss of balance or base: feet no longer moving continuously, stance crossed or squared under pressure, or posture no longer recoverable inside the clinch.",
    sourceRuleIds: [SOURCE_PUMMELING],
  }),
  partnerResistanceLimitCondition({
    conditionId: "pummeling_partner_resistance_limit",
    description:
      "End the round if the partner's resistance rises above the agreed level, or if excessive force replaces technical exchange. Resistance is a progression axis in this chapter, not a prescribed dose — it is corrected by the partner dialling back, after which the work continues.",
    sourceRuleIds: [SOURCE_PUMMELING, SOURCE_METHOD_CATALOGUE],
  }),
  manualTerminationCondition({
    conditionId: "pummeling_manual_termination",
    description:
      "End the round immediately whenever either athlete asks to stop. No reason has to be stated, and none is inferred.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
  painCondition({
    conditionId: "pummeling_pain",
    description:
      "Stop immediately on pain, in particular shoulder pain under load or any pain referred to the neck. Do not train with an acute shoulder, cervical or elbow injury.",
    sourceRuleIds: [SOURCE_PUMMELING],
  }),
  acuteSymptomCondition({
    conditionId: "pummeling_acute_symptom",
    description:
      "Stop the exercise at once on any acute symptom — dizziness, nausea, numbness or sudden weakness — reported by either athlete at any point.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_PUMMELING],
  }),
  completionCondition({
    conditionId: "pummeling_completion",
    description: "Stop once the prescribed rounds are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const pummelingInstructions: InstructionDefinition[] = [
  makeInstruction(
    "pummeling_setup",
    "setup",
    "This drill requires a training partner and has no solo form. Agree the level of resistance and the constraint before the first round, and hold it there — resistance is a progression axis in this chapter, not a prescribed dose. Establish the clinch with posture maintained and a stable base, feet already moving. A wrestling mat and a timer are optional; no wall is required.",
    "critical",
    true,
    SOURCE_PUMMELING,
  ),
  makeInstruction(
    "pummeling_execution",
    "execution",
    "Fight continuously for inside position, alternating underhooks with the partner and exchanging fluidly rather than in discrete attempts. Feel before reacting instead of watching the hands, keep the arms connected to a moving base rather than working them alone, move the feet continuously and stay relaxed. Movement quality is prioritized over speed.",
    "high",
    true,
    SOURCE_PUMMELING,
  ),
  makeInstruction(
    "pummeling_safety",
    "safety",
    "Maintain neck position throughout — poor neck position, excessive force, shoulder overload and technical breakdown are this chapter's documented risks. Do not force a position with strength when the technique is not there. Do not train with an acute shoulder, cervical or elbow injury.",
    "critical",
    true,
    SOURCE_PUMMELING,
  ),
];

const pummelingEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "pummeling",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "partner_grappling_rounds",
  numericalProfileId: "partner_grappling_rounds_technical_v0_1",
  capabilities: {
    exerciseId: "pummeling",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["partner_grappling_rounds"],
    supportedVolumeStructures: ["rounds_duration"],
    supportedIntensityTypes: ["technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    // The resistance comes from the partner. No implement, no machine, and
    // not `bodyweight` either — the athlete is not moving their own mass
    // against gravity, they are working against a resisting human.
    supportedLoadingModes: ["partner_resistance"],
    supportedTempoTypes: [],
    laterality: "not_applicable",
    volumeInterpretations: ["round_total"],
    capabilityTags: [...PARTNER_GRAPPLING_CAPABILITY_TAGS],
    // Deliberately empty. "Wrestling Mat" is Optional in this chapter, and
    // "Wall Pummeling" is one of its Variations, not its requirement.
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["pummeling_setup", "pummeling_execution", "pummeling_safety"],
    requiredStopConditionIds: [
      "pummeling_technical_failure",
      "pummeling_coordination_loss",
      "pummeling_balance_loss",
      "pummeling_partner_resistance_limit",
      "pummeling_manual_termination",
      "pummeling_pain",
      "pummeling_acute_symptom",
      "pummeling_completion",
    ],
    durationEstimationProfileId: "duration_profile_pummeling",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_PUMMELING, SOURCE_MODULE_PROFILES],
  },
  supportedIntensityTypes: ["technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: pummelingInstructions,
  stopConditionDefinitions: pummelingStopConditions,
  // "# Loading Profile — Typical Volume: 3–8 rounds, 2–5 minutes."
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 120, distanceMeters: null, rounds: 3, workIntervals: null },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 300, distanceMeters: null, rounds: 8, workIntervals: null },
    sourceRuleIds: [SOURCE_PUMMELING],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_PUMMELING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Wall Wrestling
//
// NARROWING. "# Loading Profile — Typical Volume: 3–8 rounds, 2–5 minutes",
// again corroborated by "# Physiological Profile — Typical Duration: 2–5
// minute rounds". Same bounds as pummeling, reached independently from this
// chapter's own sections rather than copied across.
//
// EQUIPMENT — THE ONE PLACE THE THREE DIVERGE. "# Equipment Requirements —
// Required: Training Partner, Wall or MMA Cage." Two unconditional items,
// and the knowledge base encodes exactly that: an `all_of` clause holding
// `human_assistance: partner` AND `environment: usable_wall`. This entry
// mirrors the wall with the `usable_wall` capability id, matching the
// knowledge base's own identifier name for the same physical constraint.
//
// NOT the `wall` id, which is documented as a surface authorized to receive
// a THROWN IMPLEMENT and is held by two medicine-ball entries — see
// `equipmentCapabilities.ts` for the full reasoning. Crash Mats, Timer and
// Coach are Optional and add no atom. No impact equipment of any kind is
// required: nothing is struck in this drill.
// -----------------------------------------------------------------------------

const wallWrestlingStopConditions: StopConditionDefinition[] = [
  roundTechnicalFailureCondition({
    conditionId: "wall_wrestling_technical_failure",
    description:
      "End the round on technical breakdown: standing upright against the surface, hip pressure lost, the arms working without the legs, or posture no longer held under pressure.",
    sourceRuleIds: [SOURCE_WALL_WRESTLING],
  }),
  roundCoordinationLossCondition({
    conditionId: "wall_wrestling_coordination_loss",
    description:
      "End the round when position against the wall can no longer be controlled — the athlete unable to maintain connection and pressure at once, or the exchange no longer directed at a position but merely absorbed.",
    sourceRuleIds: [SOURCE_WALL_WRESTLING, SOURCE_MODULE_PROFILES],
  }),
  roundBalanceLossCondition({
    conditionId: "wall_wrestling_balance_loss",
    description:
      "End the round on loss of balance or base against the surface: feet crossed, feet no longer moving, or stance collapsing under the partner's pressure.",
    sourceRuleIds: [SOURCE_WALL_WRESTLING],
  }),
  partnerResistanceLimitCondition({
    conditionId: "wall_wrestling_partner_resistance_limit",
    description:
      "End the round if the partner's resistance exceeds the agreed level — excessive resistance is named among this chapter's primary risks. Resistance and partner skill are progression axes here, not prescribed doses; the correction is the partner dialling back, after which the work continues.",
    sourceRuleIds: [SOURCE_WALL_WRESTLING, SOURCE_METHOD_CATALOGUE],
  }),
  manualTerminationCondition({
    conditionId: "wall_wrestling_manual_termination",
    description:
      "End the round immediately whenever either athlete asks to stop. No reason has to be stated, and none is inferred.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
  painCondition({
    conditionId: "wall_wrestling_pain",
    description:
      "Stop immediately on pain, in particular neck pain under load and finger pain from grip exchanges. Do not train with an acute cervical, shoulder or knee injury, or after a concussion.",
    sourceRuleIds: [SOURCE_WALL_WRESTLING],
  }),
  acuteSymptomCondition({
    conditionId: "wall_wrestling_acute_symptom",
    description:
      "Stop the exercise at once on any acute symptom — dizziness, nausea, headache, numbness or sudden weakness — reported by either athlete at any point. This drill's contraindications include acute concussion, so head symptoms end the session rather than the round.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_WALL_WRESTLING],
  }),
  completionCondition({
    conditionId: "wall_wrestling_completion",
    description: "Stop once the prescribed rounds are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const wallWrestlingInstructions: InstructionDefinition[] = [
  makeInstruction(
    "wall_wrestling_setup",
    "setup",
    "This drill requires a training partner and a wall or MMA cage — a vertical, resistant surface an opponent can be controlled against. Check the surface and the area around it before starting: no protruding edges, no obstacles, and enough clear floor at its base. Agree the level of resistance and the objective before the first round. Establish the clinch against the surface with head position set and a stable base. Crash mats, a timer and a coach are optional.",
    "critical",
    true,
    SOURCE_WALL_WRESTLING,
  ),
  makeInstruction(
    "wall_wrestling_execution",
    "execution",
    "Control the inside space and drive through the legs, keeping hip pressure on the partner and staying connected to them and to the surface. Work pummeling, underhook battles and positional control against the wall, changing levels to improve position. Never stop moving the feet and do not cross them. Do not stand upright and do not pull with the arms alone.",
    "high",
    true,
    SOURCE_WALL_WRESTLING,
  ),
  makeInstruction(
    "wall_wrestling_safety",
    "safety",
    "Maintain head position throughout — poor head position, neck overload, finger injuries and excessive resistance are this chapter's documented risks. Takedown entries belong to this drill, but completing a takedown is a documented progression ('Wall Wrestling to Takedown') and not part of its base form: never force a throw or takedown against the surface, and end the round when control is lost rather than finishing the entry. Do not train with an acute cervical, shoulder or knee injury, or after a concussion.",
    "critical",
    true,
    SOURCE_WALL_WRESTLING,
  ),
];

const wallWrestlingEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "wall_wrestling",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "partner_grappling_rounds",
  numericalProfileId: "partner_grappling_rounds_technical_v0_1",
  capabilities: {
    exerciseId: "wall_wrestling",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["partner_grappling_rounds"],
    supportedVolumeStructures: ["rounds_duration"],
    supportedIntensityTypes: ["technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["partner_resistance"],
    supportedTempoTypes: [],
    laterality: "not_applicable",
    volumeInterpretations: ["round_total"],
    capabilityTags: [...PARTNER_GRAPPLING_CAPABILITY_TAGS],
    // The only equipment atom in this family, mirroring the knowledge base's
    // own `environment: usable_wall` requirement 1:1.
    requiredEquipmentCapabilities: ["usable_wall"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: [
      "wall_wrestling_setup",
      "wall_wrestling_execution",
      "wall_wrestling_safety",
    ],
    requiredStopConditionIds: [
      "wall_wrestling_technical_failure",
      "wall_wrestling_coordination_loss",
      "wall_wrestling_balance_loss",
      "wall_wrestling_partner_resistance_limit",
      "wall_wrestling_manual_termination",
      "wall_wrestling_pain",
      "wall_wrestling_acute_symptom",
      "wall_wrestling_completion",
    ],
    durationEstimationProfileId: "duration_profile_wall_wrestling",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_WALL_WRESTLING, SOURCE_MODULE_PROFILES],
  },
  supportedIntensityTypes: ["technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: wallWrestlingInstructions,
  stopConditionDefinitions: wallWrestlingStopConditions,
  // "# Loading Profile — Typical Volume: 3–8 rounds, 2–5 minutes."
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 120, distanceMeters: null, rounds: 3, workIntervals: null },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 300, distanceMeters: null, rounds: 8, workIntervals: null },
    sourceRuleIds: [SOURCE_WALL_WRESTLING],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_WALL_WRESTLING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Grip Fighting
//
// NARROWING. "# Loading Profile — Typical Volume: 3–10 rounds, 30 seconds–3
// minutes", corroborated by "# Physiological Profile — Typical Duration: 30
// seconds–3 minutes". This is the chapter that set both outer edges of Table
// Group 18's envelope: its round count IS the profile's 3–10, so only the
// duration ceiling narrows (300 s → 180 s).
//
// NO GARMENT IS REQUIRED, and this is the chapter's own position rather than
// a simplification. "# Equipment Requirements — Required: Training Partner",
// with "Gi, No-Gi Clothing, Grip Trainer, Resistance Bands" ALL Optional, and
// "# Variations" names both "Gi Grip Fighting" and "No-Gi Hand Fighting" as
// equal alternatives. A gi is therefore a variation's implement, never the
// base drill's requirement, and requiring one at the engine level would make
// the no-gi form unprescribable. The knowledge base agrees exactly: its
// `requirements` hold `human_assistance: partner` and nothing else.
//
// NO WALL. "Wall Grip Fighting" is a named Variation of this chapter, not a
// requirement — the same discipline applied to pummeling's "Wall Pummeling".
// -----------------------------------------------------------------------------

const gripFightingStopConditions: StopConditionDefinition[] = [
  roundTechnicalFailureCondition({
    conditionId: "grip_fighting_technical_failure",
    description:
      "End the round on technical breakdown: pulling with arm strength alone, standing upright, chasing the hands, holding grips too long, or the feet no longer positioning the body behind the grip.",
    sourceRuleIds: [SOURCE_GRIP_FIGHTING],
  }),
  roundCoordinationLossCondition({
    conditionId: "grip_fighting_coordination_loss",
    description:
      "End the round when hand fighting can no longer be coordinated with posture and distance — grips taken without the body behind them, or the athlete reacting to the hands instead of controlling the exchange.",
    sourceRuleIds: [SOURCE_GRIP_FIGHTING, SOURCE_MODULE_PROFILES],
  }),
  roundBalanceLossCondition({
    conditionId: "grip_fighting_balance_loss",
    description:
      "End the round on loss of balance or base: poor foot positioning, the athlete pulled off posture by a grip, or distance no longer managed.",
    sourceRuleIds: [SOURCE_GRIP_FIGHTING],
  }),
  partnerResistanceLimitCondition({
    conditionId: "grip_fighting_partner_resistance_limit",
    description:
      "End the round if the partner's resistance rises above the agreed level, or if excessive grip force replaces technical hand fighting. Partner skill and grip constraints are progression axes in this chapter, not prescribed doses; the correction is the partner dialling back, after which the work continues.",
    sourceRuleIds: [SOURCE_GRIP_FIGHTING, SOURCE_METHOD_CATALOGUE],
  }),
  manualTerminationCondition({
    conditionId: "grip_fighting_manual_termination",
    description:
      "End the round immediately whenever either athlete asks to stop. No reason has to be stated, and none is inferred.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
  painCondition({
    conditionId: "grip_fighting_pain",
    description:
      "Stop immediately on pain, in particular finger, wrist or elbow pain during a grip or a grip break. Do not train with an acute finger, wrist or elbow injury.",
    sourceRuleIds: [SOURCE_GRIP_FIGHTING],
  }),
  acuteSymptomCondition({
    conditionId: "grip_fighting_acute_symptom",
    description:
      "Stop the exercise at once on any acute symptom — numbness or tingling in the hands, sudden weakness, dizziness or nausea — reported by either athlete at any point.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_GRIP_FIGHTING],
  }),
  completionCondition({
    conditionId: "grip_fighting_completion",
    description: "Stop once the prescribed rounds are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const gripFightingInstructions: InstructionDefinition[] = [
  makeInstruction(
    "grip_fighting_setup",
    "setup",
    "This drill requires a training partner and has no solo form. A gi, no-gi clothing, a grip trainer and resistance bands are all optional — the drill runs in either the gi or the no-gi form, and neither garment is required. Agree the variation and the level of resistance before the first round. Establish posture at working distance before engaging the hands.",
    "critical",
    true,
    SOURCE_GRIP_FIGHTING,
  ),
  makeInstruction(
    "grip_fighting_execution",
    "execution",
    "Fight for inside control, establishing dominant grips — sleeve and collar in the gi form, wrist and elbow control in the no-gi form — while denying the partner the same. Break grips immediately rather than holding them, never chase the hands or watch them, use the whole body rather than arm strength alone, and keep the feet moving to manage distance. Maintain technical quality as the round goes on.",
    "high",
    true,
    SOURCE_GRIP_FIGHTING,
  ),
  makeInstruction(
    "grip_fighting_safety",
    "safety",
    "Protect the fingers and keep the wrists in a strong position — finger injuries, excessive grip force, poor wrist position and shoulder tension are this chapter's documented risks. Never jerk a gripped limb abruptly and never twist a gripped wrist or finger to break a grip. Do not train with an acute finger, wrist or elbow injury.",
    "critical",
    true,
    SOURCE_GRIP_FIGHTING,
  ),
];

const gripFightingEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "grip_fighting",
  moduleId: "movement",
  role: "technical",
  explicitMethodId: "partner_grappling_rounds",
  numericalProfileId: "partner_grappling_rounds_technical_v0_1",
  capabilities: {
    exerciseId: "grip_fighting",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["partner_grappling_rounds"],
    supportedVolumeStructures: ["rounds_duration"],
    supportedIntensityTypes: ["technical_effort"],
    preferredIntensityTypes: ["technical_effort"],
    supportedLoadingModes: ["partner_resistance"],
    supportedTempoTypes: [],
    laterality: "not_applicable",
    volumeInterpretations: ["round_total"],
    capabilityTags: [...PARTNER_GRAPPLING_CAPABILITY_TAGS],
    // Deliberately empty. Gi, no-gi clothing, grip trainer and resistance
    // bands are all Optional in this chapter, and both the gi and the no-gi
    // forms are named Variations — requiring a garment would make one of the
    // two documented forms unprescribable.
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: [
      "grip_fighting_setup",
      "grip_fighting_execution",
      "grip_fighting_safety",
    ],
    requiredStopConditionIds: [
      "grip_fighting_technical_failure",
      "grip_fighting_coordination_loss",
      "grip_fighting_balance_loss",
      "grip_fighting_partner_resistance_limit",
      "grip_fighting_manual_termination",
      "grip_fighting_pain",
      "grip_fighting_acute_symptom",
      "grip_fighting_completion",
    ],
    durationEstimationProfileId: "duration_profile_grip_fighting",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_GRIP_FIGHTING, SOURCE_MODULE_PROFILES],
  },
  supportedIntensityTypes: ["technical_effort"],
  preferredIntensityType: "technical_effort",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: gripFightingInstructions,
  stopConditionDefinitions: gripFightingStopConditions,
  // "# Loading Profile — Typical Volume: 3–10 rounds, 30 seconds–3 minutes."
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 30, distanceMeters: null, rounds: 3, workIntervals: null },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 180, distanceMeters: null, rounds: 10, workIntervals: null },
    sourceRuleIds: [SOURCE_GRIP_FIGHTING],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_GRIP_FIGHTING, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------
// Registry Lot 21 — Sled Push
// Source: 50-exercises/17_SLED_PUSH
//
// The first consumer of Table Group 19's Loaded Locomotion Power profile, the
// first entry in the registry to prescribe a DISTANCE AND A DURATION at once,
// and the first power-module entry on an interval structure.
//
// WHAT IS REPRESENTED: the repeated explosive push. Four to twelve separate
// efforts, each of a documented distance and duration, each accelerating a
// loaded sled, with recovery between them.
//
// WHAT IS NOT, and stays unrepresented rather than folded in:
//
// - continuous heavy marching — this chapter documents repeated efforts, not
//   one bout, and `intervals` could not express a single continuous effort
//   anyway;
// - maximal-strength work — a heavy sled held static is not this chapter's
//   prescription, and the module rule excludes displacement-free work;
// - "Harness Push", a named Variation, whose harness is Optional equipment
//   here and whose towed form belongs to sprint doctrine;
// - "Backward Sled Push" and "Single-Arm Push", named Variations with no
//   prescription of their own in this chapter;
// - loaded carries and long conditioning intervals, both excluded in writing
//   by the module rule.
//
// TRIPLE. `power / work_rest_intervals / secondary`, unique across the
// profiles, so implicit resolution already selects Table Group 19's profile;
// the id is declared anyway, by the auditability convention Table Group 15
// established. The role is read from the documents, not chosen to satisfy a
// validator — see the Table Group's own reasoning.
//
// NARROWING. There is none to perform, and that is a property of this entry
// rather than an omission: Table Group 19 was written from this chapter, so
// the envelope and the chapter's own bounds are the same numbers. The entry
// declares them anyway — the rope_pull precedent, where the chapter's range
// also equalled its module envelope and was stated so the entry carries its
// own documented range rather than relying on a profile to speak for it. The
// generic resolvers compute an intersection that happens to be the identity.
//
// THREE DIMENSIONS, AND NO CONVERSION BETWEEN THEM:
//
//   work intervals  4-12    "# Loading Profile — Typical Volume: 4-12 pushes"
//   distance       10-40 m  same line: "10-40 meters"
//   duration        5-40 s  "# Physiological Profile — Typical Duration"
//
// The duration is read from a different section than the other two, which is
// the established precedent — sprint_intervals already takes its prescribed
// duration from its own Physiological Profile. Metres are never derived from
// seconds nor seconds from metres.
//
// "PUSHES" MAPS TO `workIntervals`, and the chapter supports the reading
// directly: "4-12 pushes" counts discrete efforts, each covering a documented
// distance and separated by recovery. It is not a repetition count of a
// movement performed on the spot, and `intervals` forbids `repetitions`
// anyway.
//
// INTENSITY. `movement_intent: explosive`, the profile's only rule, so
// `exerciseIntensityConstraints` is null — there is nothing to narrow and a
// constraint object would only restate it. "Light to Very Heavy" is NOT
// encoded: it is qualitative, the model has no categorical resistance rule
// type a profile can carry, and Table Group 19 records load as a progression
// axis. Load, Distance, Speed and Rest are this chapter's four named
// Progression axes; none of them becomes a prescribed number here.
//
// REST. `exerciseRestConstraints` is null. This chapter documents no
// inter-effort rest — "Rest" appears only among the Progression axes — so the
// profile's 120/180/240 s band applies unnarrowed, still sourced to
// `POWER_LOADED_LOCOMOTION_REST_V0_1` so the one value no chapter supports
// stays traceable to the decision that created it.
//
// EQUIPMENT. `sled` only, mirroring the knowledge base exactly. That
// definition states in its own comment why "Weighted Sled" is ONE atom and
// not `sled` + `plates`, and this entry does not second-guess it.
// "Suitable Surface", the chapter's second Required item, has NO equipment
// identifier and is deliberately given none: the knowledge base already gates
// on it as the `floor_safe` environment capability, and the prescription
// layer has no environment atoms for `floor_safe` or `sufficient_space` at
// all — sprint_intervals, whose knowledge-base requirements are the same
// shape, likewise declares no equipment capability for them. The requirement
// is carried at critical priority in the setup instruction instead, and this
// documented limitation is recorded rather than resolved by bending a
// neighbouring atom.
// -----------------------------------------------------------------------------

const SOURCE_SLED_PUSH = "50-exercises/17_SLED_PUSH";

const sledPushStopConditions: StopConditionDefinition[] = [
  // The interval family's own pace factory: scoped to the interval, because
  // `intervals` has no sets. This is the governing quality threshold for
  // Loaded Locomotion Power — the Power overview's Velocity Principle names
  // loss of speed as the end of the useful stimulus.
  intervalPaceLossCondition({
    conditionId: "sled_push_pace_loss",
    description:
      "End the effort when the sled stops accelerating and the push becomes a grind: speed visibly dropping within the effort, steps shortening under load, or the athlete no longer able to finish every metre at the intended pace.",
    sourceRuleIds: [SOURCE_SLED_PUSH, SOURCE_METHOD_CATALOGUE],
  }),
  // Set-scoped, like the four interval entries that precede it. A known,
  // pre-existing inconsistency of this factory with the `intervals`
  // structure, documented at the round-scoped family in
  // `stopConditionRegistry.ts`; inventing a sled-specific factory to dodge it
  // would fracture the interval family for one exercise.
  technicalFailureCondition({
    conditionId: "sled_push_technical_failure",
    description:
      "Stop on technical breakdown: bending at the waist instead of leaning from the ankles, excessive trunk flexion, overstriding, looking down, or losing body tension between steps.",
    sourceRuleIds: [SOURCE_SLED_PUSH],
  }),
  // "# Safety Profile — Primary Risks: ... Loss of Foot Traction." The one
  // risk this chapter names that no other required category covers, and the
  // reason its "Suitable Surface" requirement exists. The power module lists
  // `balance_loss` among its categories; this entry can declare it honestly
  // because the chapter documents the concern, unlike towel_pull_up and the
  // rope entries, which omitted it for exactly the opposite reason.
  balanceLossCondition({
    conditionId: "sled_push_balance_loss",
    description:
      "Stop if the feet lose traction on the surface, if the athlete slips or stumbles under the sled, or if the drive can no longer be applied from a stable base.",
    sourceRuleIds: [SOURCE_SLED_PUSH],
  }),
  fatigueLimitCondition({
    conditionId: "sled_push_fatigue_limit",
    description:
      "Stop the exercise when accumulated fatigue prevents the athlete from accelerating the sled, rather than continuing to accumulate efforts at reduced output.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_SLED_PUSH],
  }),
  painCondition({
    conditionId: "sled_push_pain",
    description:
      "Stop immediately if pain occurs, in particular knee, hip or ankle pain under drive. Do not train with an acute knee, hip or ankle injury.",
    sourceRuleIds: [SOURCE_SLED_PUSH],
  }),
  acuteSymptomCondition({
    conditionId: "sled_push_acute_symptom",
    description:
      "Stop the exercise at once on any acute symptom — dizziness, nausea, chest discomfort or sudden weakness — at any point during or between efforts.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE, SOURCE_SLED_PUSH],
  }),
  completionCondition({
    conditionId: "sled_push_completion",
    description: "Stop once the prescribed efforts are completed.",
    sourceRuleIds: [SOURCE_METHOD_CATALOGUE],
  }),
];

const sledPushInstructions: InstructionDefinition[] = [
  makeInstruction(
    "sled_push_setup",
    "setup",
    "Load the sled and confirm it is stable before the first effort. This exercise also requires a suitable surface — one that gives the feet reliable traction and lets the sled slide predictably; that requirement is documented by this chapter but has no equipment identifier of its own, so it is verified here. Keep the pushing lane clear for the full prescribed distance. Take a grip on the uprights or handles at the height that lets the trunk stay long, set the feet behind the sled and brace before applying any force.",
    "critical",
    true,
    SOURCE_SLED_PUSH,
  ),
  makeInstruction(
    "sled_push_execution",
    "execution",
    "Brace first, then lean from the ankles rather than bending at the waist, keeping the body in one line from the ankles through the trunk to the hands. Drive through the ground with short, powerful steps and maintain constant pressure on the sled — accelerate it rather than settling into a walk, and do not stop between steps. Keep the eyes forward rather than down, and finish every metre of the prescribed distance at the same intent.",
    "high",
    true,
    SOURCE_SLED_PUSH,
  ),
  makeInstruction(
    "sled_push_safety",
    "safety",
    "Poor body position, loss of foot traction and excessive trunk flexion are this chapter's documented risks. End the effort when acceleration or posture degrades rather than grinding out the remaining distance — a push that has become slow is no longer the prescribed stimulus. Stop at once if the feet lose traction. Do not train with an acute knee, hip or ankle injury.",
    "critical",
    true,
    SOURCE_SLED_PUSH,
  ),
];

const sledPushEntry: ExercisePrescriptionRegistryEntry = {
  exerciseId: "sled_push",
  moduleId: "power",
  role: "secondary",
  explicitMethodId: "work_rest_intervals",
  numericalProfileId: "loaded_locomotion_power_intervals_v0_1",
  capabilities: {
    exerciseId: "sled_push",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["work_rest_intervals"],
    supportedVolumeStructures: ["intervals"],
    supportedIntensityTypes: ["movement_intent"],
    preferredIntensityTypes: ["movement_intent"],
    // The exact mode for locomotion against an external resistance, and it
    // already existed. NOT `locomotion_only`, which sprint_intervals uses and
    // which asserts there is no external resistance at all; not `bodyweight`;
    // not `machine`, which names an apparatus the athlete works against
    // rather than one they displace.
    supportedLoadingModes: ["sled"],
    // The method forbids tempo, and this chapter documents none. Explosive
    // intent is carried by the intensity rule, where it belongs.
    supportedTempoTypes: [],
    // Both hands drive the same implement along one path and the volume is
    // counted in efforts and metres, never per side. `bilateral` would be an
    // inference from the biomechanics; the prescription allocates nothing to
    // a side, so `not_applicable` is the honest value — the same reading
    // sprint_intervals uses.
    laterality: "not_applicable",
    volumeInterpretations: ["interval_total"],
    // The method's three required capabilities, plus `distance_measurement`
    // because this entry genuinely prescribes a distance. `external_load` is
    // deliberately absent: the sled is loaded, but no load is DOSED, and the
    // tag would imply a load can be prescribed.
    capabilityTags: [
      "interval_structure",
      "timed_effort",
      "distance_measurement",
      "technical_quality_observation",
    ],
    requiredEquipmentCapabilities: ["sled"],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: ["sled_push_setup", "sled_push_execution", "sled_push_safety"],
    requiredStopConditionIds: [
      "sled_push_pace_loss",
      "sled_push_technical_failure",
      "sled_push_balance_loss",
      "sled_push_fatigue_limit",
      "sled_push_pain",
      "sled_push_acute_symptom",
      "sled_push_completion",
    ],
    durationEstimationProfileId: "duration_profile_sled_push",
    substitutionCapabilityTags: [],
    sourceRuleIds: [SOURCE_SLED_PUSH, SOURCE_MODULE_PROFILES],
  },
  supportedIntensityTypes: ["movement_intent"],
  preferredIntensityType: "movement_intent",
  supportedTempoTypes: [],
  preferredTempoType: null,
  instructionDefinitions: sledPushInstructions,
  stopConditionDefinitions: sledPushStopConditions,
  // "# Loading Profile — Typical Volume: 4-12 pushes, 10-40 meters" and
  // "# Physiological Profile — Typical Duration: 5-40 seconds". Equal to
  // Table Group 19's envelope, because that table was written from this
  // chapter; declared so the entry states its own documented range.
  exerciseDoseConstraints: {
    minimumDose: { sets: null, repetitions: null, durationSeconds: 5, distanceMeters: 10, rounds: null, workIntervals: 4 },
    maximumDose: { sets: null, repetitions: null, durationSeconds: 40, distanceMeters: 40, rounds: null, workIntervals: 12 },
    sourceRuleIds: [SOURCE_SLED_PUSH],
  },
  exerciseIntensityConstraints: null,
  exerciseRestConstraints: null,
  sourceRuleIds: [SOURCE_SLED_PUSH, SOURCE_METHOD_CATALOGUE, SOURCE_MODULE_PROFILES, SOURCE_NUMERICAL_TABLES],
};

// -----------------------------------------------------------------------------

/**
 * Statically typed as `Record<PilotExerciseId, ...>` — TypeScript refuses
 * to compile this file if any pilot exercise id is missing an entry, or if
 * any entry is missing a required field of `ExercisePrescriptionRegistryEntry`.
 */
export const EXERCISE_PRESCRIPTION_REGISTRY = {
  bench_press: benchPressEntry,
  back_squat: backSquatEntry,
  trap_bar_deadlift: trapBarDeadliftEntry,
  pull_up: pullUpEntry,
  farmer_carry: farmerCarryEntry,
  pallof_press: pallofPressEntry,
  box_jump: boxJumpEntry,

  front_squat: frontSquatEntry,
  romanian_deadlift: romanianDeadliftEntry,
  overhead_press: overheadPressEntry,
  bulgarian_split_squat: bulgarianSplitSquatEntry,

  push_press: pushPressEntry,
  hang_high_pull: hangHighPullEntry,
  jump_shrug: jumpShrugEntry,

  hollow_body_hold: hollowBodyHoldEntry,
  dragon_flag: dragonFlagEntry,

  front_rack_carry: frontRackCarryEntry,
  sandbag_carry: sandbagCarryEntry,
  zercher_carry: zercherCarryEntry,
  suitcase_carry: suitcaseCarryEntry,
  overhead_carry: overheadCarryEntry,
  pinch_carry: pinchCarryEntry,

  depth_jump: depthJumpEntry,
  broad_jump: broadJumpEntry,
  knee_jump: kneeJumpEntry,
  lateral_bound: lateralBoundEntry,
  single_leg_hop: singleLegHopEntry,
  split_squat_jump: splitSquatJumpEntry,

  med_ball_slam: medBallSlamEntry,
  med_ball_chest_pass: medBallChestPassEntry,
  med_ball_overhead_throw: medBallOverheadThrowEntry,
  med_ball_shot_put_throw: medBallShotPutThrowEntry,
  med_ball_reverse_throw: medBallReverseThrowEntry,
  med_ball_rotational_throw: medBallRotationalThrowEntry,
  med_ball_scoop_toss: medBallScoopTossEntry,

  tibialis_raise: tibialisRaiseEntry,
  rotator_cuff_training: rotatorCuffTrainingEntry,
  wrist_strengthening: wristStrengtheningEntry,
  soleus_raise: soleusRaiseEntry,

  countermovement_jump: countermovementJumpEntry,

  copenhagen_plank: copenhagenPlankEntry,

  hip_thrust: hipThrustEntry,
  chin_up: chinUpEntry,
  barbell_row: barbellRowEntry,

  chest_supported_row: chestSupportedRowEntry,
  dip: dipEntry,
  landmine_press: landminePressEntry,
  weighted_pull_up: weightedPullUpEntry,
  neck_training: neckTrainingEntry,
  nordic_hamstring_curl: nordicHamstringCurlEntry,

  hang_power_clean: hangPowerCleanEntry,

  bear_crawl: bearCrawlEntry,
  bridging: bridgingEntry,
  footwork_drills: footworkDrillsEntry,
  shadow_boxing: shadowBoxingEntry,
  technical_stand_up: technicalStandUpEntry,
  shrimping: shrimpingEntry,

  sprawl: sprawlEntry,
  shot_entries: shotEntriesEntry,

  rowerg_intervals: rowergIntervalsEntry,
  sprint_intervals: sprintIntervalsEntry,

  ab_wheel: abWheelEntry,
  dead_bug: deadBugEntry,
  hanging_leg_raise: hangingLegRaiseEntry,
  plate_pinch: platePinchEntry,

  heavy_bag_power_intervals: heavyBagPowerIntervalsEntry,
  battle_ropes: battleRopesEntry,
  assault_bike_intervals: assaultBikeIntervalsEntry,
  towel_pull_up: towelPullUpEntry,
  rope_climb: ropeClimbEntry,
  rope_pull: ropePullEntry,

  pummeling: pummelingEntry,
  wall_wrestling: wallWrestlingEntry,
  grip_fighting: gripFightingEntry,

  sled_push: sledPushEntry,
} as const satisfies Record<PilotExerciseId, ExercisePrescriptionRegistryEntry>;

export const isPilotExerciseId = (value: unknown): value is PilotExerciseId =>
  typeof value === "string" && (PILOT_EXERCISE_IDS as readonly string[]).includes(value);

// -----------------------------------------------------------------------------
// Pure constructor
// -----------------------------------------------------------------------------

/**
 * Session/athlete-specific facts the static registry cannot know. Never
 * defaulted internally — a missing required reference or equipment
 * capability produces a structured failure, not a fabricated value.
 */
export interface PrescriptionExecutionContext {
  rangeContext: RangeContext;
  /** Validated athlete references actually available for this athlete. */
  athleteReferences: readonly IntensityReference[];
  /** Equipment capability identifiers actually available in this environment. */
  availableEquipmentCapabilities: readonly Identifier[];
  loadRounding?: {
    incrementKg: number;
    mode: "nearest" | "down" | "up";
    ruleId: Identifier;
  } | null;
}

export type ExercisePrescriptionSourceFailureCode =
  | "EXERCISE_NOT_IN_REGISTRY"
  | "REQUIRED_ATHLETE_REFERENCE_MISSING"
  | "REQUIRED_EQUIPMENT_MISSING";

export interface ExercisePrescriptionSourceSuccess {
  ok: true;
  exerciseId: PilotExerciseId;
  moduleId: CapabilityModule;
  source: Omit<PrescribeExerciseInput, "exerciseId" | "moduleId">;
}

export interface ExercisePrescriptionSourceFailure {
  ok: false;
  exerciseId: Identifier;
  failureCode: ExercisePrescriptionSourceFailureCode;
  message: string;
}

export type ExercisePrescriptionSourceResult = ExercisePrescriptionSourceSuccess | ExercisePrescriptionSourceFailure;

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

/**
 * The `PrescriptionLaterality` an entry declares, or `null` when it cannot
 * be stated honestly.
 *
 * Before this existed, `getExercisePrescriptionSource` simply did not
 * forward laterality: every registry entry declared one, and every resolved
 * `PrescriptionVolume.laterality` came out `null` — including for the eight
 * entries declaring `unilateral` with a per-side volume interpretation. An
 * athlete reading "3 repetitions" could not tell whether that meant three
 * in total or three per side, and the public `CasLateralityV1` field the
 * serializer already maps was permanently empty.
 *
 * The rule is purely declarative — nothing is inferred:
 * - `laterality` and `interpretation` are copied from what the entry
 *   declares. They are never derived from the knowledge base's
 *   `unilateral` flag, and no repetition count is ever doubled, halved or
 *   otherwise converted because of them: a per-side interpretation
 *   *labels* the resolved number, it never changes it;
 * - `startingSide` and `sideSwitchRuleId` stay `null`. No exercise chapter
 *   in `50-exercises/` documents which side to start on or when to switch,
 *   and inventing either would be exactly the fabrication this registry
 *   refuses everywhere else;
 * - an entry declaring no volume interpretation yields `null` rather than
 *   a half-filled object;
 * - a method whose contract FORBIDS the laterality volume field yields
 *   `null` too. That is a method-contract rule, not an exercise rule, so it
 *   holds for any future entry without naming one.
 */
const buildPrescriptionLaterality = (
  capabilities: ExercisePrescriptionCapabilities,
  methodId: TrainingMethodId,
): PrescriptionLaterality | null => {
  if (getTrainingMethodContract(methodId).forbiddenVolumeFields.includes("laterality")) {
    return null;
  }

  const [interpretation] = capabilities.volumeInterpretations;

  if (interpretation === undefined) {
    return null;
  }

  return {
    laterality: capabilities.laterality,
    interpretation,
    startingSide: null,
    sideSwitchRuleId: null,
  };
};

/**
 * Builds a complete `ExercisePrescriptionSource` for one pilot exercise, or
 * a structured failure when a required athlete reference or equipment
 * capability is missing from `context`. Never mutates `context`, never
 * reads the system clock, and never returns a source with a missing
 * required field silently filled in.
 */
export function getExercisePrescriptionSource(
  exerciseId: Identifier,
  context: PrescriptionExecutionContext,
): ExercisePrescriptionSourceResult {
  if (!isPilotExerciseId(exerciseId)) {
    return {
      ok: false,
      exerciseId,
      failureCode: "EXERCISE_NOT_IN_REGISTRY",
      message: `Exercise "${exerciseId}" is not in the pilot prescription registry.`,
    };
  }

  const entry = EXERCISE_PRESCRIPTION_REGISTRY[exerciseId];
  const availableReferenceTypes = unique(context.athleteReferences.map((reference) => reference.referenceType));

  const missingReferenceTypes = entry.capabilities.requiredAthleteReferenceTypes.filter(
    (referenceType): boolean => !availableReferenceTypes.includes(referenceType),
  );

  if (missingReferenceTypes.length > 0) {
    return {
      ok: false,
      exerciseId,
      failureCode: "REQUIRED_ATHLETE_REFERENCE_MISSING",
      message: `Exercise "${exerciseId}" requires athlete reference(s) [${missingReferenceTypes.join(", ")}], but none was supplied in the context.`,
    };
  }

  const missingEquipment = entry.capabilities.requiredEquipmentCapabilities.filter(
    (capability) => !context.availableEquipmentCapabilities.includes(capability),
  );

  if (missingEquipment.length > 0) {
    return {
      ok: false,
      exerciseId,
      failureCode: "REQUIRED_EQUIPMENT_MISSING",
      message: `Exercise "${exerciseId}" requires equipment capability(ies) [${missingEquipment.join(", ")}], but they are not available in the context.`,
    };
  }

  return {
    ok: true,
    exerciseId,
    moduleId: entry.moduleId,
    source: {
      role: entry.role,
      rangeContext: context.rangeContext,
      capabilities: entry.capabilities,
      explicitMethodId: entry.explicitMethodId,
      // Declared by the entry, forwarded verbatim. `lateralityRequired`
      // reuses `validateCompatibility`'s own predicate rather than
      // restating it, so an entry that must resolve a side to be
      // compatible is exactly an entry whose volume must carry one.
      laterality: buildPrescriptionLaterality(entry.capabilities, entry.explicitMethodId),
      lateralityRequired: requiresLateralityResolution(entry.capabilities),
      supportedIntensityTypes: entry.supportedIntensityTypes,
      athleteReferences: context.athleteReferences,
      preferredIntensityType: entry.preferredIntensityType,
      supportedTempoTypes: entry.supportedTempoTypes,
      preferredTempoType: entry.preferredTempoType,
      availableEquipmentCapabilities: context.availableEquipmentCapabilities,
      availableAthleteReferenceTypes: availableReferenceTypes as readonly IntensityReferenceType[],
      instructionDefinitions: entry.instructionDefinitions,
      stopConditionDefinitions: entry.stopConditionDefinitions,
      exerciseDoseConstraints: entry.exerciseDoseConstraints,
      exerciseIntensityConstraints: entry.exerciseIntensityConstraints,
      exerciseRestConstraints: entry.exerciseRestConstraints,
      numericalProfileId: entry.numericalProfileId ?? null,
      loadRounding: context.loadRounding,
      sourceRuleIds: entry.sourceRuleIds,
    },
  };
}
