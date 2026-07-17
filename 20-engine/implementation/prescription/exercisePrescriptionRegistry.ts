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
  "bench_press",
  "back_squat",
  "trap_bar_deadlift",
  "pull_up",
  "farmer_carry",
  "pallof_press",
  "box_jump",
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
    requiredEquipmentCapabilities: ["barbell", "bench", "rack", "weight_plates"],
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
    requiredEquipmentCapabilities: ["barbell", "rack", "weight_plates"],
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
    requiredEquipmentCapabilities: ["trap_bar", "weight_plates"],
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
    requiredEquipmentCapabilities: ["farmer_carry_implements"],
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
    requiredEquipmentCapabilities: ["cable_machine_or_resistance_band"],
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
    requiredEquipmentCapabilities: ["plyometric_box"],
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
