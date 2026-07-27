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
  balanceLossCondition,
  completionCondition,
  equipmentFailureCondition,
  fatigueLimitCondition,
  impactLimitCondition,
  painCondition,
  technicalFailureCondition,
  velocityLossCondition,
} from "./stopConditionRegistry";
import { makeInstruction } from "./instructionRegistry";
import type { StopConditionDefinition } from "./resolveStopConditions";
import type { InstructionDefinition } from "./resolveInstructions";
import type { ExercisePrescriptionCapabilities } from "./validateCompatibility";
import type { IntensityReferenceType, IntensityType, TempoType } from "./types";
import type { ExerciseRole } from "./types";
import type { TrainingMethodId } from "./contracts";
import type { PrescribeExerciseInput } from "./prescribeExercise";
import type { RangeContext } from "./prescriptionKnowledge";
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
// Registry
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
      loadRounding: context.loadRounding,
      sourceRuleIds: entry.sourceRuleIds,
    },
  };
}
