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
 * implemented in `prescriptionKnowledge.ts`. `28_STOP_CONDITIONS.md` is
 * never used as a source — it is a confirmed erroneous duplicate of
 * `27_REST_TEMPO_RULES.md`.
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
    supportedLoadingModes: ["dumbbell", "kettlebell"],
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
    supportedLoadingModes: ["dumbbell", "kettlebell"],
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
    "Pinch hard through the thumb, keep the wrist neutral, keep the plate vertical, walk tall, keep the load off the thigh and take controlled steps.",
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
    supportedLoadingModes: ["dumbbell", "kettlebell"],
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
  sourceRuleIds: [
    SOURCE_MED_BALL_SCOOP_TOSS,
    SOURCE_METHOD_CATALOGUE,
    SOURCE_MODULE_PROFILES,
    SOURCE_NUMERICAL_TABLES,
  ],
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
      loadRounding: context.loadRounding,
      sourceRuleIds: entry.sourceRuleIds,
    },
  };
}
