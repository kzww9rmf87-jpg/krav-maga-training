# ENGINE OUTPUT SCHEMA

Version 0.1

---

# Purpose

The Engine Output Schema defines the structured result produced by the Combat Athlete System Engine after a session-generation request has been processed.

Its purpose is to ensure that every engine result is:

* explicit;
* structured;
* complete;
* explainable;
* auditable;
* safe;
* usable by the CAS application;
* understandable by the athlete;
* suitable for session history and future engine decisions.

The output schema defines the contract between:

* the Session Generation Pipeline;
* the CAS application;
* the training interface;
* the athlete;
* the coach;
* the Decision Trace;
* the validation system;
* the session-history system.

The engine must never return an unstructured collection of exercises.

---

# Core Principle

> Every CAS output must describe what the athlete should do, why the session was built that way, which constraints influenced it, and whether the result is valid.

The output must separate:

* engine-processing status;
* generation result;
* final session;
* selected adaptations;
* selected Capability Modules;
* exercise prescriptions;
* alternatives and substitutions;
* assumptions and safe defaults;
* warnings;
* validation results;
* confidence;
* Decision Trace.

A generated session must never be presented as valid when the engine encountered a blocking failure.

---

# Scope

The Engine Output Schema defines:

* the root output object;
* processing metadata;
* engine and rule versions;
* generation status;
* session-generation result;
* session objectives;
* adaptation priorities;
* selected Capability Modules;
* session phases and exercises;
* complete prescriptions;
* alternatives;
* substitutions;
* progression instructions;
* load and duration estimates;
* warnings and limitations;
* validation results;
* confidence;
* Decision Trace references;
* safe-failure output;
* system-failure output.

The schema does not define:

* athlete-profile input;
* current readiness input;
* medical input;
* equipment input;
* the internal implementation of scoring;
* the internal implementation of conflict detection.

Those structures are governed by:

* `19_ENGINE_INPUT_SCHEMA.md`;
* `16_SCORING_MODEL.md`;
* `17_CONFLICT_RULES.md`;
* `21_DECISION_TRACE.md`;
* `22_VALIDATION_RULES.md`.

---

# Root Output Object

The root output object is named:

```typescript
EngineOutput
```

Its canonical Version 0.1 structure is:

```typescript
interface EngineOutput {
  schemaVersion: "0.1";

  outputId: Identifier;
  requestId: Identifier;
  athleteId: Identifier;

  generatedAt: ISODateTime;
  timezone: IANATimeZone;
  locale?: LocaleCode;

  processingStatus: ProcessingStatus;
  generationStatus: GenerationStatus;

  engineVersions: EngineVersionSet;

  result:
    | GeneratedSessionResult
    | NoValidSessionResult
    | InputFailureResult
    | SystemFailureResult;

  warnings: EngineWarning[];
  assumptions: EngineAssumption[];

  confidence: OutputConfidence;

  validation: ValidationSummary;

  decisionTrace: DecisionTraceReference;
}
```

---

# Root-Level Requirements

The following root fields are required:

```text
schemaVersion
outputId
requestId
athleteId
generatedAt
timezone
processingStatus
generationStatus
engineVersions
result
warnings
assumptions
confidence
validation
decisionTrace
```

`locale` is optional.

The `result` object must match the declared `generationStatus`.

For example:

```text
generationStatus = SESSION_GENERATED
```

requires:

```text
result = GeneratedSessionResult
```

---

# Primitive Types

```typescript
type ISODate = string;
type ISODateTime = string;
type IANATimeZone = string;
type LocaleCode = string;
type Identifier = string;
type Minutes = number;
type Seconds = number;
type Kilograms = number;
type Percentage = number;
type Count = number;
```

Dates and times must use ISO 8601-compatible formats.

Example:

```text
2026-07-15T08:30:00+02:00
```

---

# Processing Status

`ProcessingStatus` describes whether the engine completed its technical processing.

```typescript
type ProcessingStatus =
  | "COMPLETED"
  | "COMPLETED_WITH_WARNINGS"
  | "FAILED";
```

Interpretation:

| Status                  | Meaning                                            |
| ----------------------- | -------------------------------------------------- |
| COMPLETED               | Processing completed without engine-level warning  |
| COMPLETED_WITH_WARNINGS | Processing completed but limitations were recorded |
| FAILED                  | Processing could not complete                      |

`ProcessingStatus` describes the technical process.

It does not by itself indicate whether a session was generated.

---

# Generation Status

`GenerationStatus` describes the training-decision result.

```typescript
type GenerationStatus =
  | "SESSION_GENERATED"
  | "SESSION_GENERATED_WITH_WARNINGS"
  | "NO_VALID_SESSION"
  | "INPUT_INVALID"
  | "SYSTEM_FAILURE";
```

Interpretation:

| Status                          | Meaning                                                  |
| ------------------------------- | -------------------------------------------------------- |
| SESSION_GENERATED               | A valid session was generated                            |
| SESSION_GENERATED_WITH_WARNINGS | A valid session was generated with non-blocking warnings |
| NO_VALID_SESSION                | No valid session could be generated                      |
| INPUT_INVALID                   | Input prevented safe generation                          |
| SYSTEM_FAILURE                  | A technical or internal failure prevented processing     |

The engine must not use:

```text
SESSION_GENERATED
```

when final validation returns `INVALID`.

---

# Engine Version Set

Every output must identify the rule and data versions used.

```typescript
interface EngineVersionSet {
  moduleEngineVersion: string;
  sessionPipelineVersion: string;
  inputSchemaVersion: string;
  outputSchemaVersion: string;

  exerciseSelectionRulesVersion: string;
  substitutionRulesVersion: string;
  scoringModelVersion: string;
  conflictRulesVersion: string;
  validationRulesVersion: string;
  decisionTraceVersion: string;

  exerciseLibraryVersion: string;

  engineImplementationVersion?: string;
}
```

Versioning makes outputs:

* reproducible;
* auditable;
* comparable;
* testable.

The same input may produce a different output after a rule or library update.

---

# Generated Session Result

A successfully generated session uses:

```typescript
interface GeneratedSessionResult {
  resultType: "GENERATED_SESSION";

  session: GeneratedSession;

  alternatives?: SessionAlternative[];
  substitutions?: SubstitutionRecord[];

  selectionSummary: SelectionSummary;
  adjustmentSummary: AdjustmentSummary;

  userSummary: UserFacingSummary;
}
```

---

# Generated Session

```typescript
interface GeneratedSession {
  sessionId: Identifier;
  sessionVersion: string;

  athleteId: Identifier;
  scheduledDate: ISODate;

  title: string;
  description?: string;

  sessionType: SessionType;

  objective: SessionObjective;
  adaptationPriorities: OutputAdaptationPriority[];

  selectedModules: SelectedCapabilityModule[];

  phases: SessionPhase[];

  estimatedDuration: DurationEstimate;
  estimatedLoad: SessionLoadEstimate;

  progressionPlan?: SessionProgressionPlan;

  completionRules: SessionCompletionRules;

  sessionWarnings: EngineWarning[];

  validationStatus:
    | "VALID"
    | "VALID_WITH_WARNINGS";

  confidence: OutputConfidence;
}
```

---

# Session Type

```typescript
type SessionType =
  | "DEVELOPMENT"
  | "MAINTENANCE"
  | "RECOVERY"
  | "ASSESSMENT"
  | "RETURN_TO_TRAINING"
  | "COMPETITION_PREPARATION"
  | "GENERAL_PHYSICAL_PREPARATION";
```

The output Session Type may differ from the requested Session Type.

When this occurs, the change must be recorded in:

* `adjustmentSummary`;
* `decisionTrace`.

---

# Session Objective

Every generated session must contain exactly one primary adaptation.

```typescript
interface SessionObjective {
  requestedObjective: string;
  finalObjective: string;

  performanceOutcome?: string;

  primaryAdaptation: AdaptationDomain;
  supportedCapabilities?: string[];

  objectiveChanged: boolean;
  changeReason?: string;

  measurableSessionOutcome?: SessionOutcomeMetric;
}
```

Example:

```yaml
requestedObjective: "Improve maximum strength"
finalObjective: "Maintain maximum strength with reduced fatigue"
primaryAdaptation: "MAXIMUM_STRENGTH"
objectiveChanged: true
changeReason: "Reduced readiness and hard combat practice within 24 hours"
```

The engine must never silently change the objective.

---

# Adaptation Domain

```typescript
type AdaptationDomain =
  | "MAXIMUM_STRENGTH"
  | "POWER"
  | "FUNCTIONAL_HYPERTROPHY"
  | "CONDITIONING"
  | "ROBUSTNESS"
  | "MOVEMENT"
  | "RECOVERY";
```

Specific Skill is not a physical Adaptation Domain in CAS Version 0.1.

---

# Output Adaptation Priority

```typescript
interface OutputAdaptationPriority {
  adaptation: AdaptationDomain;

  role:
    | "PRIMARY"
    | "SECONDARY"
    | "MAINTENANCE"
    | "SUPPORT"
    | "EXCLUDED";

  priorityScore?: number;
  selectionReason: string;

  requested: boolean;
  selected: boolean;

  omissionReason?: string;
}
```

Exactly one adaptation must have:

```text
role = PRIMARY
selected = true
```

---

# Selected Capability Module

```typescript
interface SelectedCapabilityModule {
  moduleId: CapabilityModuleId;

  role:
    | "PRIMARY"
    | "SECONDARY"
    | "MAINTENANCE"
    | "SUPPORT";

  primaryAdaptation: AdaptationDomain;

  purpose: string;
  selectionReason: string;

  modulePriorityScore?: number;
  confidence: ConfidenceLevel;

  plannedDurationMinutes?: Minutes;

  estimatedCost: ModuleLoadEstimate;

  exerciseIds: Identifier[];
}
```

Only canonical Capability Modules may appear.

```typescript
type CapabilityModuleId =
  | "PREPARATION"
  | "MOVEMENT"
  | "POWER"
  | "STRENGTH"
  | "FUNCTIONAL_HYPERTROPHY"
  | "ROBUSTNESS"
  | "GRIP"
  | "CORE"
  | "CONDITIONING"
  | "RECOVERY";
```

---

# Session Phases

A session is represented as an ordered collection of phases.

```typescript
interface SessionPhase {
  phaseId: Identifier;
  order: number;

  moduleId: CapabilityModuleId;
  phaseName: string;

  role:
    | "PREPARATION"
    | "PRIMARY"
    | "SECONDARY"
    | "SUPPORT"
    | "RECOVERY";

  objective: string;

  estimatedDurationMinutes: Minutes;

  exercises: PrescribedExercise[];

  transitionAfter?: TransitionInstruction;
}
```

Each phase must map to one canonical Capability Module.

A phase name may be more descriptive than the module name.

Example:

```yaml
moduleId: "POWER"
phaseName: "Rotational Power"
```

The descriptive name must not create a new module.

---

# Prescribed Exercise

```typescript
interface PrescribedExercise {
  prescriptionId: Identifier;

  exerciseId: Identifier;
  exerciseName: string;

  moduleId: CapabilityModuleId;

  role:
    | "PRIMARY"
    | "SECONDARY"
    | "SUPPORT"
    | "PREPARATION"
    | "RECOVERY";

  purpose: string;

  prescription: ExercisePrescription;

  executionInstructions: ExecutionInstruction[];

  stoppingCriteria: StoppingCriterion[];

  progressionInstruction?: ProgressionInstruction;
  regressionInstruction?: RegressionInstruction;

  alternatives?: ExerciseAlternative[];

  estimatedDurationMinutes: Minutes;
  estimatedCost: ExerciseLoadEstimate;

  selection: ExerciseSelectionResult;

  warnings?: EngineWarning[];
}
```

Every final exercise must contain an explicit `purpose`.

Examples:

```text
Develop rapid rotational force production.
```

```text
Maintain upper-body maximum strength with controlled fatigue.
```

```text
Improve trunk force transmission.
```

An exercise must not appear without a declared training function.

---

# Exercise Prescription

The prescription must include the fields needed to execute the exercise correctly.

```typescript
interface ExercisePrescription {
  prescriptionType:
    | "SETS_REPS"
    | "TIME"
    | "DISTANCE"
    | "INTERVALS"
    | "CONTINUOUS"
    | "CONTACTS"
    | "CUSTOM";

  sets?: number;
  repetitions?: RepetitionPrescription;
  durationSeconds?: Seconds;
  distanceMeters?: number;

  rounds?: number;
  workSeconds?: Seconds;
  restSeconds?: Seconds;

  load?: LoadPrescription;
  intensity?: IntensityPrescription;

  tempo?: TempoPrescription;
  velocity?: VelocityPrescription;

  rangeOfMotion?: string;
  sidePrescription?: SidePrescription;

  totalContactCount?: Count;

  restBetweenSetsSeconds?: Seconds;
  restBetweenExercisesSeconds?: Seconds;

  executionIntent?: string;

  customInstructions?: string[];
}
```

The engine must not output meaningless incomplete prescriptions such as:

```text
Bench Press — 4 sets
```

The athlete must receive enough information to execute the work.

---

# Repetition Prescription

```typescript
interface RepetitionPrescription {
  type:
    | "FIXED"
    | "RANGE"
    | "MAX_QUALITY"
    | "UNTIL_STOPPING_CRITERION";

  value?: number;
  minimum?: number;
  maximum?: number;

  perSide?: boolean;
}
```

Examples:

```yaml
type: "FIXED"
value: 5
```

```yaml
type: "RANGE"
minimum: 8
maximum: 10
```

```yaml
type: "MAX_QUALITY"
maximum: 5
```

---

# Load Prescription

```typescript
interface LoadPrescription {
  mode:
    | "ABSOLUTE_KG"
    | "PERCENT_1RM"
    | "RELATIVE_BODYWEIGHT"
    | "RPE_BASED"
    | "RIR_BASED"
    | "VELOCITY_BASED"
    | "IMPLEMENT_WEIGHT"
    | "SELF_SELECTED"
    | "NOT_APPLICABLE";

  kilograms?: Kilograms;
  percentage1Rm?: Percentage;

  bodyweightModifierKg?: Kilograms;

  implementWeightKg?: Kilograms;

  targetRpe?: number;
  targetRir?: number;

  minimumVelocityMps?: number;
  targetVelocityRangeMps?: NumericRange;

  adjustmentRule?: string;
}
```

Valid ranges include:

```text
RPE = 1 to 10
RIR = 0 to 10
Percentage = 0 to 100
```

The engine must not prescribe an exact load without sufficient athlete-specific data.

When exact load data are unavailable, it should use:

* RPE;
* RIR;
* velocity;
* quality-based rules;
* safe ranges.

---

# Intensity Prescription

```typescript
interface IntensityPrescription {
  mode:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "VERY_HIGH"
    | "MAXIMAL_INTENT"
    | "ZONE"
    | "CUSTOM";

  targetRpe?: number;
  targetRir?: number;

  heartRateZone?: string;
  percentageMaxHeartRate?: NumericRange;

  description?: string;
}
```

`MAXIMAL_INTENT` does not necessarily mean maximal load.

It may apply to:

* throws;
* jumps;
* explosive strikes;
* sprints;
* ballistic movements.

---

# Velocity Prescription

```typescript
interface VelocityPrescription {
  intent:
    | "MAXIMAL"
    | "HIGH"
    | "MODERATE"
    | "CONTROLLED"
    | "SLOW"
    | "ISOMETRIC";

  targetRangeMps?: NumericRange;
  maximumVelocityLossPercent?: Percentage;

  stopOnVisibleVelocityLoss?: boolean;
}
```

Power work should normally define:

* maximal or high intent;
* velocity-loss threshold;
* technical-quality threshold.

---

# Tempo Prescription

```typescript
interface TempoPrescription {
  eccentricSeconds?: number;
  pauseBottomSeconds?: number;
  concentricSeconds?: number;
  pauseTopSeconds?: number;

  notation?: string;
}
```

Example:

```yaml
notation: "3-1-X-0"
```

where `X` indicates maximal concentric intent.

---

# Side Prescription

```typescript
interface SidePrescription {
  mode:
    | "BILATERAL"
    | "LEFT"
    | "RIGHT"
    | "EACH_SIDE"
    | "ALTERNATING";

  startSide?: "LEFT" | "RIGHT";
  equalVolumeRequired?: boolean;
}
```

---

# Numeric Range

```typescript
interface NumericRange {
  minimum: number;
  maximum: number;
}
```

`minimum` must not exceed `maximum`.

---

# Execution Instructions

```typescript
interface ExecutionInstruction {
  type:
    | "SETUP"
    | "TECHNIQUE"
    | "BREATHING"
    | "INTENT"
    | "RHYTHM"
    | "SAFETY"
    | "TRANSITION";

  instruction: string;
  priority:
    | "CRITICAL"
    | "HIGH"
    | "NORMAL";
}
```

Instructions should remain concise enough for real-time use.

Critical cues should be displayed more prominently by the application.

---

# Stopping Criteria

```typescript
interface StoppingCriterion {
  criterionType:
    | "PAIN"
    | "TECHNICAL_BREAKDOWN"
    | "VELOCITY_LOSS"
    | "POWER_LOSS"
    | "BALANCE_LOSS"
    | "TARGET_REACHED"
    | "TIME_REACHED"
    | "RPE_LIMIT"
    | "RIR_LIMIT"
    | "HEART_RATE_LIMIT"
    | "CUSTOM";

  threshold?: number;
  unit?: string;

  instruction: string;
  severity:
    | "STOP_SET"
    | "STOP_EXERCISE"
    | "STOP_MODULE"
    | "STOP_SESSION";
}
```

Examples:

```yaml
criterionType: "VELOCITY_LOSS"
threshold: 10
unit: "%"
instruction: "Stop the set when explosive speed visibly falls."
severity: "STOP_SET"
```

```yaml
criterionType: "PAIN"
instruction: "Stop the exercise if pain appears or alters movement."
severity: "STOP_EXERCISE"
```

---

# Exercise Selection Result

Every selected exercise must retain a summary of its selection process.

```typescript
interface ExerciseSelectionResult {
  eligibility:
    | "ELIGIBLE";

  mandatoryCriteriaPassed: boolean;

  scoringProfile: string;

  baseSuitabilityScore?: number;
  finalSuitabilityScore?: number;

  confidence: ConfidenceLevel;

  rank?: number;

  selectionReason: string;
  mainAdvantages: string[];
  mainLimitations: string[];

  tieBreakApplied?: boolean;
  tieBreakReason?: string;

  manualOverrideApplied?: boolean;
  manualOverrideReason?: string;
}
```

Ineligible exercises do not appear in the final session.

They may appear in the Decision Trace or selection summary.

---

# Exercise Alternatives

```typescript
interface ExerciseAlternative {
  exerciseId: Identifier;
  exerciseName: string;

  status:
    | "VALID_ALTERNATIVE"
    | "CONDITIONAL_ALTERNATIVE"
    | "EMERGENCY_SUBSTITUTE";

  finalSuitabilityScore?: number;
  confidence: ConfidenceLevel;

  useWhen: string;
  preservedFeatures: string[];
  changedFeatures: string[];
  limitations: string[];

  prescriptionAdjustment?: string;
}
```

Alternatives must not be presented as perfectly equivalent unless they preserve all decision-relevant characteristics.

---

# Substitution Record

```typescript
interface SubstitutionRecord {
  substitutionId: Identifier;

  originalExerciseId: Identifier;
  originalExerciseName: string;

  substituteExerciseId: Identifier;
  substituteExerciseName: string;

  reason:
    | "PAIN"
    | "MEDICAL_RESTRICTION"
    | "EQUIPMENT"
    | "ENVIRONMENT"
    | "TECHNICAL_LEVEL"
    | "READINESS"
    | "FATIGUE"
    | "CONFLICT"
    | "TIME"
    | "ATHLETE_RESPONSE"
    | "OTHER";

  primaryAdaptationPreserved: boolean;
  modulePreserved: boolean;

  preservedFeatures: string[];
  changedFeatures: string[];
  lostFeatures: string[];

  substitutionScore?: number;
  confidence: ConfidenceLevel;

  explanation: string;
}
```

When the primary adaptation is not preserved, the result is not a normal substitution.

It must be recorded as:

* objective adjustment;
* module adjustment;
* program modification.

---

# Progression Instruction

```typescript
interface ProgressionInstruction {
  progressionType:
    | "INCREASE_LOAD"
    | "INCREASE_REPETITIONS"
    | "INCREASE_VOLUME"
    | "INCREASE_RANGE_OF_MOTION"
    | "INCREASE_VELOCITY"
    | "INCREASE_DENSITY"
    | "INCREASE_COMPLEXITY"
    | "REDUCE_ASSISTANCE"
    | "REPEAT_PRESCRIPTION"
    | "ASSESS_NEXT_SESSION";

  condition: string;
  change: string;

  maximumChange?: number;
  unit?: string;
}
```

Example:

```yaml
progressionType: "INCREASE_LOAD"
condition: "All sets completed at RPE 8 or below with stable technique."
change: "Increase load by 2.5 kg next exposure."
maximumChange: 2.5
unit: "kg"
```

---

# Regression Instruction

```typescript
interface RegressionInstruction {
  trigger: string;

  regressionType:
    | "REDUCE_LOAD"
    | "REDUCE_REPETITIONS"
    | "REDUCE_VOLUME"
    | "REDUCE_RANGE_OF_MOTION"
    | "INCREASE_REST"
    | "REDUCE_COMPLEXITY"
    | "ADD_ASSISTANCE"
    | "CHANGE_EXERCISE"
    | "STOP";

  action: string;
}
```

---

# Session Progression Plan

```typescript
interface SessionProgressionPlan {
  primaryProgressionVariable:
    | "LOAD"
    | "REPETITIONS"
    | "VOLUME"
    | "VELOCITY"
    | "RANGE_OF_MOTION"
    | "DENSITY"
    | "COMPLEXITY"
    | "RECOVERY"
    | "NONE";

  sessionSuccessCriteria: string[];

  nextSessionDecision:
    | "PROGRESS"
    | "REPEAT"
    | "REGRESS"
    | "DELOAD"
    | "ASSESS";

  nextSessionDecisionRule: string;
}
```

The output should normally change one primary progression variable at a time.

---

# Session Completion Rules

```typescript
interface SessionCompletionRules {
  completeWhen: string[];

  stopOrModifyWhen: string[];

  athleteFeedbackRequired: AthleteFeedbackRequirement[];
}
```

---

# Athlete Feedback Requirement

```typescript
interface AthleteFeedbackRequirement {
  metric:
    | "SESSION_RPE"
    | "PAIN"
    | "TECHNIQUE_QUALITY"
    | "SORENESS"
    | "RECOVERY"
    | "MOTIVATION"
    | "EXERCISE_DIFFICULTY"
    | "COMBAT_PRACTICE_IMPACT"
    | "CUSTOM";

  required: boolean;
  timing:
    | "DURING_EXERCISE"
    | "POST_EXERCISE"
    | "POST_SESSION"
    | "NEXT_DAY"
    | "BEFORE_NEXT_SESSION";
}
```

---

# Duration Estimate

```typescript
interface DurationEstimate {
  totalMinutes: Minutes;

  preparationMinutes?: Minutes;
  activeWorkMinutes?: Minutes;
  restMinutes?: Minutes;
  transitionMinutes?: Minutes;
  recoveryMinutes?: Minutes;

  availableMinutes: Minutes;

  differenceMinutes: number;

  fitsAvailableDuration: boolean;

  confidence: ConfidenceLevel;
}
```

Validation requires:

```text
fitsAvailableDuration = true
```

unless an explicit tolerance is allowed by Validation Rules.

---

# Load Estimate

The output must remain consistent with the four fatigue dimensions defined by the Module Engine.

```typescript
interface SessionLoadEstimate {
  neuralFatigue: LoadDimensionEstimate;
  muscularFatigue: LoadDimensionEstimate;
  connectiveTissueStress: LoadDimensionEstimate;
  metabolicFatigue: LoadDimensionEstimate;

  impactExposure?: LoadDimensionEstimate;
  technicalComplexity?: LoadDimensionEstimate;

  estimatedRecoveryHours?: NumericRange;

  withinSessionBudget: boolean;
  withinWeeklyBudget?: boolean;

  mainRecoveryDemand: string;
}
```

---

## Load Dimension Estimate

```typescript
interface LoadDimensionEstimate {
  level:
    | "NONE"
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "VERY_HIGH";

  internalUnits?: number;

  mainContributors: string[];

  confidence: ConfidenceLevel;
}
```

Internal fatigue units must not be presented as direct physiological measurements.

---

# Module Load Estimate

```typescript
interface ModuleLoadEstimate {
  neuralFatigue: CostLevel;
  muscularFatigue: CostLevel;
  connectiveTissueStress: CostLevel;
  metabolicFatigue: CostLevel;

  estimatedRecoveryHours?: NumericRange;
}
```

---

# Exercise Load Estimate

```typescript
interface ExerciseLoadEstimate {
  neuralFatigue: CostLevel;
  muscularFatigue: CostLevel;
  connectiveTissueStress: CostLevel;
  metabolicFatigue: CostLevel;

  primaryRegions?: BodyRegion[];

  estimatedRecoveryHours?: NumericRange;
}
```

---

# Cost Level

```typescript
type CostLevel =
  | "NONE"
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH"
  | "UNKNOWN";
```

---

# Body Region

The output should use the same body-region identifiers as the Engine Input Schema.

```typescript
type BodyRegion = string;
```

The implementation should import the canonical `BodyRegion` type rather than redefine it independently.

---

# Session Alternative

A complete alternative session may be returned when several coherent structures are valid.

```typescript
interface SessionAlternative {
  alternativeId: Identifier;

  title: string;
  description: string;

  useWhen: string;

  primaryAdaptation: AdaptationDomain;
  selectedModules: CapabilityModuleId[];

  estimatedDurationMinutes: Minutes;
  estimatedLoadLevel: CostLevel;

  mainAdvantages: string[];
  mainLimitations: string[];

  confidence: ConfidenceLevel;
}
```

The engine should not generate alternatives merely to display variety.

Alternatives should correspond to meaningful contextual choices.

---

# Selection Summary

```typescript
interface SelectionSummary {
  candidateCount: number;
  eligibleCandidateCount: number;
  excludedCandidateCount: number;

  selectedExerciseCount: number;

  highestRankedRejectedCandidates?: RejectedCandidateSummary[];

  scoringProfilesUsed: string[];

  tieBreaksApplied: number;
  substitutionsApplied: number;
  manualOverridesApplied: number;
}
```

---

# Rejected Candidate Summary

```typescript
interface RejectedCandidateSummary {
  candidateId: Identifier;
  candidateName: string;

  rejectionType:
    | "INELIGIBLE"
    | "MANDATORY_CRITERION_FAILURE"
    | "LOW_SCORE"
    | "CONFLICT"
    | "REDUNDANCY"
    | "DURATION"
    | "LOW_PRIORITY";

  reason: string;

  score?: number;
  confidence?: ConfidenceLevel;
}
```

Every rejected high-ranking candidate should have an explanation.

---

# Adjustment Summary

```typescript
interface AdjustmentSummary {
  objectiveChanged: boolean;
  moduleSelectionChanged: boolean;
  exerciseSelectionChanged: boolean;
  prescriptionChanged: boolean;

  backtrackingOccurred: boolean;
  backtrackingCount: number;

  adjustments: EngineAdjustment[];
}
```

---

# Engine Adjustment

```typescript
interface EngineAdjustment {
  adjustmentType:
    | "OBJECTIVE_REDUCTION"
    | "OBJECTIVE_CHANGE"
    | "MODULE_ADDED"
    | "MODULE_REMOVED"
    | "MODULE_ROLE_CHANGED"
    | "EXERCISE_SUBSTITUTED"
    | "EXERCISE_REMOVED"
    | "VOLUME_REDUCED"
    | "INTENSITY_REDUCED"
    | "REST_INCREASED"
    | "ORDER_CHANGED"
    | "SESSION_SHORTENED"
    | "RECOVERY_FALLBACK"
    | "OTHER";

  originalValue?: unknown;
  adjustedValue?: unknown;

  reason: string;
  protectedPriority: string;

  ruleReference?: string;
}
```

---

# User-Facing Summary

```typescript
interface UserFacingSummary {
  sessionTitle: string;

  primaryGoal: string;
  sessionIntent: string;

  whyThisSession: string;
  mainAdjustment?: string;

  readinessSummary?: string;
  mainWarning?: string;

  expectedOutcome: string;
}
```

This summary should use clear, non-technical language.

It must remain consistent with the structured engine result.

---

# Transition Instruction

```typescript
interface TransitionInstruction {
  nextPhaseName?: string;
  transitionTimeSeconds?: Seconds;
  instruction?: string;
}
```

This field may support application features such as:

* announcing the next exercise;
* displaying the next load;
* preparing equipment during rest;
* calculating session progression.

---

# Engine Warnings

```typescript
interface EngineWarning {
  warningId: Identifier;

  code: string;

  severity:
    | "INFORMATIONAL"
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "BLOCKING";

  category:
    | "INPUT"
    | "READINESS"
    | "PAIN"
    | "MEDICAL"
    | "EQUIPMENT"
    | "ENVIRONMENT"
    | "SUPERVISION"
    | "FATIGUE"
    | "CONFLICT"
    | "DURATION"
    | "PRESCRIPTION"
    | "COMPETITION"
    | "COMBAT_PRACTICE"
    | "DATA_QUALITY"
    | "SYSTEM";

  message: string;
  affectedElements?: Identifier[];

  athleteAction?: string;
  engineAction?: string;

  ruleReference?: string;
}
```

A generated valid session must not contain a `BLOCKING` warning.

Blocking issues must produce:

* `NO_VALID_SESSION`;
* `INPUT_INVALID`;
* `SYSTEM_FAILURE`.

---

# Engine Assumptions

```typescript
interface EngineAssumption {
  assumptionId: Identifier;

  fieldPath?: string;

  type:
    | "INFERENCE"
    | "SAFE_DEFAULT"
    | "CONSERVATIVE_ASSUMPTION"
    | "DATA_NORMALIZATION";

  description: string;

  sourceData?: string[];
  ruleReference?: string;

  confidence: ConfidenceLevel;

  decisionImpact:
    | "NONE"
    | "LOW"
    | "MODERATE"
    | "HIGH";
}
```

Examples:

```yaml
type: "SAFE_DEFAULT"
description: "The session was treated as unsupervised because no coach presence was confirmed."
confidence: "HIGH"
decisionImpact: "MODERATE"
```

```yaml
type: "CONSERVATIVE_ASSUMPTION"
description: "Unknown plyometric experience was treated as non-advanced."
confidence: "MODERATE"
decisionImpact: "HIGH"
```

---

# Output Confidence

Confidence remains separate from suitability and validation.

```typescript
interface OutputConfidence {
  overall: ConfidenceLevel;

  inputConfidence: ConfidenceLevel;
  objectiveInterpretationConfidence: ConfidenceLevel;
  moduleSelectionConfidence: ConfidenceLevel;
  exerciseSelectionConfidence: ConfidenceLevel;
  loadEstimateConfidence: ConfidenceLevel;

  limitingFactors: string[];
  supportingFactors: string[];
}
```

Possible confidence values:

```typescript
type ConfidenceLevel =
  | "VERY_HIGH"
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "VERY_LOW";
```

A low-confidence valid session may still be generated when:

* risk is low;
* the session is conservative;
* warnings are explicit.

High-risk training must not be generated automatically with very low confidence.

---

# Validation Summary

```typescript
interface ValidationSummary {
  status:
    | "VALID"
    | "VALID_WITH_WARNINGS"
    | "INVALID";

  blockingErrorCount: number;
  warningCount: number;
  recommendationCount: number;

  rulesChecked: number;
  rulesPassed: number;
  rulesFailed: number;

  blockingErrors: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: ValidationIssue[];

  validatedAt: ISODateTime;
  validationRulesVersion: string;
}
```

---

# Validation Issue

```typescript
interface ValidationIssue {
  issueId: Identifier;
  ruleId: string;

  code: string;

  severity:
    | "BLOCKING"
    | "WARNING"
    | "RECOMMENDATION";

  message: string;

  fieldPath?: string;
  affectedElements?: Identifier[];

  expected?: string;
  actual?: unknown;

  suggestedResolution?: string;
}
```

A `GeneratedSessionResult` requires:

```text
validation.status = VALID
or
validation.status = VALID_WITH_WARNINGS
```

---

# Decision Trace Reference

```typescript
interface DecisionTraceReference {
  traceId: Identifier;
  traceVersion: string;

  included:
    | "FULL"
    | "SUMMARY"
    | "REFERENCE_ONLY";

  summary: DecisionTraceSummary;

  storageReference?: string;
}
```

---

# Decision Trace Summary

```typescript
interface DecisionTraceSummary {
  primaryDecision: string;

  selectedModules: CapabilityModuleId[];
  selectedExercises: Identifier[];

  mainConstraints: string[];
  mainConflicts: string[];
  mainResolutions: string[];

  objectiveChanged: boolean;
  safeDefaultsUsed: number;

  finalValidationStatus:
    | "VALID"
    | "VALID_WITH_WARNINGS"
    | "INVALID";
}
```

The full Decision Trace structure is defined in:

`21_DECISION_TRACE.md`

---

# No Valid Session Result

When no valid session can be produced, the engine returns:

```typescript
interface NoValidSessionResult {
  resultType: "NO_VALID_SESSION";

  failureCategory:
    | "SAFETY"
    | "MEDICAL"
    | "PAIN"
    | "READINESS"
    | "CONFLICT"
    | "NO_VALID_EXERCISE"
    | "INSUFFICIENT_INFORMATION"
    | "ENVIRONMENT"
    | "EQUIPMENT"
    | "OTHER";

  reason: string;
  protectedPriority: string;

  attemptedObjective?: string;
  attemptedModules?: CapabilityModuleId[];

  failedStages: PipelineFailure[];

  safeAlternatives: SafeAlternativeAction[];

  additionalInformationRequired?: RequiredInformation[];

  professionalAssessmentSuggested: boolean;
  professionalAssessmentReason?: string;

  userMessage: string;
}
```

A `NoValidSessionResult` must not contain a normal exercise prescription disguised as a session.

---

# Safe Alternative Action

```typescript
interface SafeAlternativeAction {
  actionType:
    | "RECOVERY_SESSION"
    | "LOW_INTENSITY_MOVEMENT"
    | "POSTPONE_SESSION"
    | "REDUCE_OBJECTIVE"
    | "REQUEST_INFORMATION"
    | "SEEK_PROFESSIONAL_ASSESSMENT"
    | "NO_TRAINING_RECOMMENDATION";

  description: string;

  automaticallyGenerated: boolean;
  sessionReference?: Identifier;
}
```

A Recovery session may be generated only if it passes its own complete pipeline and validation.

---

# Required Information

```typescript
interface RequiredInformation {
  fieldPath: string;
  reason: string;
  safetyCritical: boolean;

  acceptedFormats?: string[];
}
```

Example:

```yaml
fieldPath: "painContext.currentPain"
reason: "Pain status is required before high-impact lower-body Power work can be evaluated."
safetyCritical: true
```

---

# Input Failure Result

```typescript
interface InputFailureResult {
  resultType: "INPUT_FAILURE";

  validationStatus: "INVALID";

  errors: OutputInputError[];

  safeToRetry: boolean;

  requiredCorrections: RequiredInformation[];

  userMessage: string;
}
```

---

# Output Input Error

```typescript
interface OutputInputError {
  code: string;
  fieldPath?: string;

  severity:
    | "ERROR"
    | "BLOCKING";

  message: string;

  receivedValue?: unknown;
  expected?: string;

  suggestedAction?: string;
}
```

---

# System Failure Result

```typescript
interface SystemFailureResult {
  resultType: "SYSTEM_FAILURE";

  failureId: Identifier;

  stage?: string;
  errorCode: string;

  userSafeMessage: string;

  recoverable: boolean;
  retryAllowed: boolean;

  technicalReference?: string;
}
```

System failures must not be represented as athlete-related training limitations.

The user-facing output should not expose:

* stack traces;
* confidential system data;
* internal infrastructure details.

---

# Pipeline Failure

```typescript
interface PipelineFailure {
  stage: string;

  failureType:
    | "RECOVERABLE_FAILURE"
    | "BLOCKING_FAILURE"
    | "SYSTEM_FAILURE";

  reason: string;

  attemptedResolution?: string;
  resolutionSucceeded: boolean;
}
```

---

# Output Status Consistency Rules

The following combinations are valid:

| Generation status               | Result type       | Validation          |
| ------------------------------- | ----------------- | ------------------- |
| SESSION_GENERATED               | GENERATED_SESSION | VALID               |
| SESSION_GENERATED_WITH_WARNINGS | GENERATED_SESSION | VALID_WITH_WARNINGS |
| NO_VALID_SESSION                | NO_VALID_SESSION  | INVALID             |
| INPUT_INVALID                   | INPUT_FAILURE     | INVALID             |
| SYSTEM_FAILURE                  | SYSTEM_FAILURE    | INVALID             |

Any other combination is invalid.

---

# Output Validation Rules

The output object must be validated before delivery.

---

## Rule 1 — Schema Version

`schemaVersion` is required.

Supported value:

```text
0.1
```

---

## Rule 2 — Identifier Continuity

The output must preserve:

* `requestId`;
* `athleteId`.

These values must match the processed Engine Input.

---

## Rule 3 — One Result Type

Exactly one result object must be present.

---

## Rule 4 — One Primary Adaptation

A generated session must contain exactly one selected primary adaptation.

---

## Rule 5 — Canonical Modules

Every module identifier must belong to the canonical catalog.

---

## Rule 6 — Exercise Purpose

Every prescribed exercise must have a non-empty purpose.

---

## Rule 7 — Complete Prescription

Every prescribed exercise must contain enough information for execution.

Prescription requirements depend on the exercise type.

Examples:

### Strength

Usually requires:

* sets;
* repetitions;
* load or effort target;
* rest;
* stopping criteria.

### Power

Usually requires:

* sets;
* repetitions or contacts;
* maximal intent;
* full or defined rest;
* quality or velocity stopping criteria.

### Conditioning

Usually requires:

* work duration;
* rest duration;
* rounds;
* intensity;
* completion or stopping criteria.

### Recovery

Usually requires:

* duration;
* intensity;
* execution purpose.

---

## Rule 8 — Duration

The estimated session duration must fit the available duration.

---

## Rule 9 — Validation Status

An invalid session must not be returned as generated.

---

## Rule 10 — Blocking Warning

A generated session cannot contain a blocking warning.

---

## Rule 11 — Objective Change

When the final objective differs from the request:

```text
objectiveChanged = true
```

and a reason is required.

---

## Rule 12 — Substitution Transparency

Every substitution must state:

* what was preserved;
* what changed;
* what was lost.

---

## Rule 13 — Confidence Visibility

Every generated result must include an overall confidence level.

---

## Rule 14 — Decision Trace

Every engine result must reference a Decision Trace.

This includes:

* valid sessions;
* safe failures;
* input failures;
* system failures.

---

## Rule 15 — Assumption Visibility

Every safe default or material inference must appear in `assumptions`.

---

# Minimal Valid Generated Output

```typescript
interface MinimalGeneratedOutput {
  schemaVersion: "0.1";

  outputId: Identifier;
  requestId: Identifier;
  athleteId: Identifier;

  generatedAt: ISODateTime;
  timezone: IANATimeZone;

  processingStatus:
    | "COMPLETED"
    | "COMPLETED_WITH_WARNINGS";

  generationStatus:
    | "SESSION_GENERATED"
    | "SESSION_GENERATED_WITH_WARNINGS";

  engineVersions: EngineVersionSet;

  result: GeneratedSessionResult;

  warnings: EngineWarning[];
  assumptions: EngineAssumption[];

  confidence: OutputConfidence;
  validation: ValidationSummary;
  decisionTrace: DecisionTraceReference;
}
```

---

# Complete Generated Output Example

```yaml
schemaVersion: "0.1"

outputId: "output_2026_07_15_001"
requestId: "request_2026_07_15_001"
athleteId: "athlete_001"

generatedAt: "2026-07-15T07:16:30+02:00"
timezone: "Europe/Paris"
locale: "fr-FR"

processingStatus: "COMPLETED_WITH_WARNINGS"
generationStatus: "SESSION_GENERATED_WITH_WARNINGS"

engineVersions:
  moduleEngineVersion: "0.1"
  sessionPipelineVersion: "0.1"
  inputSchemaVersion: "0.1"
  outputSchemaVersion: "0.1"
  exerciseSelectionRulesVersion: "0.1"
  substitutionRulesVersion: "0.1"
  scoringModelVersion: "0.1"
  conflictRulesVersion: "0.1"
  validationRulesVersion: "0.1"
  decisionTraceVersion: "0.1"
  exerciseLibraryVersion: "0.1"
  engineImplementationVersion: "0.1.0"

result:
  resultType: "GENERATED_SESSION"

  session:
    sessionId: "session_2026_07_15_001"
    sessionVersion: "0.1"

    athleteId: "athlete_001"
    scheduledDate: "2026-07-15"

    title: "Striking Power and Upper-Body Strength"
    description: "Power-priority session with controlled strength-maintenance volume."

    sessionType: "DEVELOPMENT"

    objective:
      requestedObjective: "Improve striking power"
      finalObjective: "Improve rapid striking force expression while maintaining upper-body strength"
      performanceOutcome: "Improve high-quality explosive striking output"
      primaryAdaptation: "POWER"
      supportedCapabilities:
        - "rotate"
        - "transmit_force"
        - "accelerate"
        - "maintain_balance"
      objectiveChanged: false

    adaptationPriorities:
      - adaptation: "POWER"
        role: "PRIMARY"
        priorityScore: 91
        selectionReason: "Primary Training Cycle priority and direct match with the request."
        requested: true
        selected: true

      - adaptation: "MAXIMUM_STRENGTH"
        role: "MAINTENANCE"
        priorityScore: 74
        selectionReason: "Maintained with controlled volume after Power work."
        requested: true
        selected: true

      - adaptation: "MOVEMENT"
        role: "SUPPORT"
        priorityScore: 68
        selectionReason: "Supports trunk organization and force transfer."
        requested: false
        selected: true

    selectedModules:
      - moduleId: "PREPARATION"
        role: "SUPPORT"
        primaryAdaptation: "MOVEMENT"
        purpose: "Prepare the athlete for high-velocity rotational work."
        selectionReason: "Required preparation for the selected Power exercises."
        confidence: "HIGH"
        plannedDurationMinutes: 8
        estimatedCost:
          neuralFatigue: "LOW"
          muscularFatigue: "LOW"
          connectiveTissueStress: "LOW"
          metabolicFatigue: "LOW"
        exerciseIds:
          - "dynamic_movement_preparation"

      - moduleId: "POWER"
        role: "PRIMARY"
        primaryAdaptation: "POWER"
        purpose: "Develop high-quality rapid rotational force production."
        selectionReason: "Best match for the primary session objective."
        modulePriorityScore: 91
        confidence: "HIGH"
        plannedDurationMinutes: 15
        estimatedCost:
          neuralFatigue: "MODERATE"
          muscularFatigue: "LOW"
          connectiveTissueStress: "LOW"
          metabolicFatigue: "LOW"
        exerciseIds:
          - "rotational_medicine_ball_throw"
          - "explosive_heavy_bag_single_strike"

      - moduleId: "STRENGTH"
        role: "MAINTENANCE"
        primaryAdaptation: "MAXIMUM_STRENGTH"
        purpose: "Maintain upper-body force production."
        selectionReason: "Supports long-term strength without compromising the Power objective."
        modulePriorityScore: 74
        confidence: "HIGH"
        plannedDurationMinutes: 25
        estimatedCost:
          neuralFatigue: "MODERATE"
          muscularFatigue: "MODERATE"
          connectiveTissueStress: "MODERATE"
          metabolicFatigue: "LOW"
        exerciseIds:
          - "weighted_pull_up"
          - "bench_press"

      - moduleId: "CORE"
        role: "SUPPORT"
        primaryAdaptation: "MOVEMENT"
        purpose: "Support trunk control and force transmission."
        selectionReason: "Low-cost support for the primary objective."
        confidence: "HIGH"
        plannedDurationMinutes: 6
        estimatedCost:
          neuralFatigue: "LOW"
          muscularFatigue: "LOW"
          connectiveTissueStress: "LOW"
          metabolicFatigue: "LOW"
        exerciseIds:
          - "pallof_press"

      - moduleId: "RECOVERY"
        role: "SUPPORT"
        primaryAdaptation: "RECOVERY"
        purpose: "Reduce arousal and prepare for recovery."
        selectionReason: "Included at low cost after high-intent work."
        confidence: "HIGH"
        plannedDurationMinutes: 4
        estimatedCost:
          neuralFatigue: "NONE"
          muscularFatigue: "NONE"
          connectiveTissueStress: "NONE"
          metabolicFatigue: "LOW"
        exerciseIds:
          - "breathing_downregulation"

    phases:
      - phaseId: "phase_1"
        order: 1
        moduleId: "PREPARATION"
        phaseName: "Dynamic Preparation"
        role: "PREPARATION"
        objective: "Prepare the relevant movement patterns without fatigue."
        estimatedDurationMinutes: 8

        exercises:
          - prescriptionId: "prescription_1"
            exerciseId: "dynamic_movement_preparation"
            exerciseName: "Dynamic Movement Preparation"
            moduleId: "PREPARATION"
            role: "PREPARATION"
            purpose: "Prepare the shoulders, trunk and lower body for rotational Power."

            prescription:
              prescriptionType: "TIME"
              durationSeconds: 480
              intensity:
                mode: "LOW"
                description: "Progressive and non-fatiguing"
              executionIntent: "Increase readiness without creating fatigue"

            executionInstructions:
              - type: "TECHNIQUE"
                instruction: "Use controlled movement and gradually increase amplitude."
                priority: "HIGH"

            stoppingCriteria:
              - criterionType: "PAIN"
                instruction: "Stop any drill that produces pain."
                severity: "STOP_EXERCISE"

            estimatedDurationMinutes: 8

            estimatedCost:
              neuralFatigue: "LOW"
              muscularFatigue: "LOW"
              connectiveTissueStress: "LOW"
              metabolicFatigue: "LOW"

            selection:
              eligibility: "ELIGIBLE"
              mandatoryCriteriaPassed: true
              scoringProfile: "Preparation Exercise Selection V0.1"
              finalSuitabilityScore: 89
              confidence: "HIGH"
              rank: 1
              selectionReason: "Best preparation match with minimal fatigue."
              mainAdvantages:
                - "Low fatigue"
                - "Relevant movement preparation"
              mainLimitations:
                - "Requires athlete attention to exercise quality"

        transitionAfter:
          nextPhaseName: "Rotational Power"
          transitionTimeSeconds: 60
          instruction: "Prepare the medicine ball and clear the throwing area."

      - phaseId: "phase_2"
        order: 2
        moduleId: "POWER"
        phaseName: "Rotational Power"
        role: "PRIMARY"
        objective: "Develop rapid rotational force production."
        estimatedDurationMinutes: 15

        exercises:
          - prescriptionId: "prescription_2"
            exerciseId: "rotational_medicine_ball_throw"
            exerciseName: "Rotational Medicine-Ball Throw"
            moduleId: "POWER"
            role: "PRIMARY"
            purpose: "Develop rapid rotational force production."

            prescription:
              prescriptionType: "SETS_REPS"
              sets: 4
              repetitions:
                type: "FIXED"
                value: 3
                perSide: true
              load:
                mode: "IMPLEMENT_WEIGHT"
                implementWeightKg: 5
              intensity:
                mode: "MAXIMAL_INTENT"
              velocity:
                intent: "MAXIMAL"
                maximumVelocityLossPercent: 10
                stopOnVisibleVelocityLoss: true
              restBetweenSetsSeconds: 120
              executionIntent: "Throw every repetition with maximal controlled intent"

            executionInstructions:
              - type: "SETUP"
                instruction: "Use a safe wall or throwing area."
                priority: "CRITICAL"

              - type: "INTENT"
                instruction: "Accelerate the ball maximally while maintaining balance."
                priority: "HIGH"

            stoppingCriteria:
              - criterionType: "POWER_LOSS"
                threshold: 10
                unit: "%"
                instruction: "Stop the set if throw speed or impact clearly decreases."
                severity: "STOP_SET"

              - criterionType: "BALANCE_LOSS"
                instruction: "Stop if balance or landing control deteriorates."
                severity: "STOP_EXERCISE"

            progressionInstruction:
              progressionType: "INCREASE_VELOCITY"
              condition: "All throws remain explosive and technically stable."
              change: "Improve output before increasing medicine-ball mass."

            regressionInstruction:
              trigger: "Loss of speed or balance"
              regressionType: "REDUCE_LOAD"
              action: "Use a lighter medicine ball."

            estimatedDurationMinutes: 9

            estimatedCost:
              neuralFatigue: "MODERATE"
              muscularFatigue: "LOW"
              connectiveTissueStress: "LOW"
              metabolicFatigue: "LOW"
              primaryRegions:
                - "TRUNK"
                - "SHOULDER_LEFT"
                - "SHOULDER_RIGHT"
              estimatedRecoveryHours:
                minimum: 12
                maximum: 24

            selection:
              eligibility: "ELIGIBLE"
              mandatoryCriteriaPassed: true
              scoringProfile: "Power Exercise Selection V0.1"
              baseSuitabilityScore: 91
              finalSuitabilityScore: 92
              confidence: "HIGH"
              rank: 1
              selectionReason: "Highest-quality rotational Power option with controlled fatigue."
              mainAdvantages:
                - "Maximal rotational intent"
                - "Low repetition fatigue"
                - "Strong match with the primary objective"
              mainLimitations:
                - "Requires safe throwing space"

          - prescriptionId: "prescription_3"
            exerciseId: "explosive_heavy_bag_single_strike"
            exerciseName: "Explosive Heavy-Bag Single Strike"
            moduleId: "POWER"
            role: "SECONDARY"
            purpose: "Express high-quality striking Power with full recovery."

            prescription:
              prescriptionType: "SETS_REPS"
              sets: 4
              repetitions:
                type: "FIXED"
                value: 3
                perSide: true
              intensity:
                mode: "MAXIMAL_INTENT"
              restBetweenSetsSeconds: 90
              executionIntent: "Maximal clean impact with full reset between strikes"

            executionInstructions:
              - type: "INTENT"
                instruction: "Prioritize impact quality, speed and balance over strike count."
                priority: "HIGH"

              - type: "TECHNIQUE"
                instruction: "Reset position fully before every strike."
                priority: "HIGH"

            stoppingCriteria:
              - criterionType: "TECHNICAL_BREAKDOWN"
                instruction: "Stop if balance, alignment or striking mechanics deteriorate."
                severity: "STOP_EXERCISE"

              - criterionType: "POWER_LOSS"
                instruction: "Stop when impact quality clearly falls."
                severity: "STOP_SET"

            estimatedDurationMinutes: 6

            estimatedCost:
              neuralFatigue: "MODERATE"
              muscularFatigue: "LOW"
              connectiveTissueStress: "MODERATE"
              metabolicFatigue: "LOW"
              primaryRegions:
                - "SHOULDER_LEFT"
                - "SHOULDER_RIGHT"
                - "TRUNK"

            selection:
              eligibility: "ELIGIBLE"
              mandatoryCriteriaPassed: true
              scoringProfile: "Power Heavy-Bag Selection V0.1"
              baseSuitabilityScore: 85
              finalSuitabilityScore: 83
              confidence: "MODERATE"
              rank: 2
              selectionReason: "Valid low-volume Power implementation with direct combat relevance."
              mainAdvantages:
                - "High striking relevance"
                - "Maximal intent"
              mainLimitations:
                - "Output is difficult to measure precisely"
                - "Shoulder fatigue must be monitored"

    estimatedDuration:
      totalMinutes: 58
      preparationMinutes: 8
      activeWorkMinutes: 18
      restMinutes: 25
      transitionMinutes: 3
      recoveryMinutes: 4
      availableMinutes: 60
      differenceMinutes: -2
      fitsAvailableDuration: true
      confidence: "HIGH"

    estimatedLoad:
      neuralFatigue:
        level: "MODERATE"
        mainContributors:
          - "Rotational medicine-ball throws"
          - "Strength maintenance"
        confidence: "HIGH"

      muscularFatigue:
        level: "MODERATE"
        mainContributors:
          - "Weighted pull-ups"
          - "Bench press"
        confidence: "HIGH"

      connectiveTissueStress:
        level: "MODERATE"
        mainContributors:
          - "Explosive heavy-bag strikes"
          - "Bench press"
        confidence: "MODERATE"

      metabolicFatigue:
        level: "LOW"
        mainContributors:
          - "Limited repeated work"
        confidence: "HIGH"

      estimatedRecoveryHours:
        minimum: 24
        maximum: 36

      withinSessionBudget: true
      withinWeeklyBudget: true
      mainRecoveryDemand: "Upper-body muscular and shoulder connective-tissue recovery"

    completionRules:
      completeWhen:
        - "All prescribed high-quality work is completed without technical degradation."
        - "Power output remains within the defined quality threshold."

      stopOrModifyWhen:
        - "Pain appears."
        - "Explosive output clearly decreases."
        - "Shoulder soreness increases."
        - "Technique deteriorates."

      athleteFeedbackRequired:
        - metric: "SESSION_RPE"
          required: true
          timing: "POST_SESSION"

        - metric: "PAIN"
          required: true
          timing: "DURING_EXERCISE"

        - metric: "SORENESS"
          required: true
          timing: "NEXT_DAY"

    sessionWarnings:
      - warningId: "warning_001"
        code: "LOW_RIGHT_SHOULDER_SORENESS"
        severity: "LOW"
        category: "READINESS"
        message: "Right-shoulder soreness is low but should be monitored during bag work and pressing."
        athleteAction: "Stop or reduce upper-body work if symptoms increase."
        engineAction: "Bench-press volume was reduced."

    validationStatus: "VALID_WITH_WARNINGS"

    confidence:
      overall: "HIGH"
      inputConfidence: "HIGH"
      objectiveInterpretationConfidence: "HIGH"
      moduleSelectionConfidence: "HIGH"
      exerciseSelectionConfidence: "HIGH"
      loadEstimateConfidence: "MODERATE"
      limitingFactors:
        - "Heavy-bag impact output is not measured directly"
      supportingFactors:
        - "Complete readiness information"
        - "Known exercise history"
        - "Confirmed equipment"

  selectionSummary:
    candidateCount: 18
    eligibleCandidateCount: 15
    excludedCandidateCount: 3
    selectedExerciseCount: 7

    highestRankedRejectedCandidates:
      - candidateId: "landmine_push_press"
        candidateName: "Landmine Push Press"
        rejectionType: "INELIGIBLE"
        reason: "Landmine attachment was not confirmed."

    scoringProfilesUsed:
      - "Preparation Exercise Selection V0.1"
      - "Power Exercise Selection V0.1"
      - "Power Heavy-Bag Selection V0.1"
      - "Strength Exercise Selection V0.1"
      - "Core Exercise Selection V0.1"
      - "Recovery Exercise Selection V0.1"

    tieBreaksApplied: 1
    substitutionsApplied: 0
    manualOverridesApplied: 0

  adjustmentSummary:
    objectiveChanged: false
    moduleSelectionChanged: false
    exerciseSelectionChanged: true
    prescriptionChanged: true
    backtrackingOccurred: true
    backtrackingCount: 1

    adjustments:
      - adjustmentType: "VOLUME_REDUCED"
        originalValue: "Bench press planned at 4 sets"
        adjustedValue: "Bench press reduced to 3 sets"
        reason: "Limit shoulder and triceps fatigue before the next combat session."
        protectedPriority: "Power quality and combat-practice readiness"
        ruleReference: "CONFLICT_RULES_V0.1"

  userSummary:
    sessionTitle: "Striking Power and Upper-Body Strength"
    primaryGoal: "Develop high-quality striking Power"
    sessionIntent: "Move explosively without accumulating unnecessary fatigue"
    whyThisSession: "Power work is performed first while fresh, followed by controlled strength-maintenance work."
    mainAdjustment: "Bench-press volume was reduced because of mild shoulder soreness and the upcoming Krav Maga session."
    readinessSummary: "Readiness is good, with mild right-shoulder soreness."
    mainWarning: "Stop upper-body work if shoulder discomfort increases."
    expectedOutcome: "High-quality explosive work with limited interference for the next combat session."

warnings:
  - warningId: "warning_001"
    code: "LOW_RIGHT_SHOULDER_SORENESS"
    severity: "LOW"
    category: "READINESS"
    message: "Right-shoulder soreness should be monitored."
    athleteAction: "Stop or reduce work if symptoms increase."
    engineAction: "Pressing volume was reduced."

assumptions:
  - assumptionId: "assumption_001"
    fieldPath: "supervisionContext"
    type: "SAFE_DEFAULT"
    description: "The session was treated as unsupervised."
    confidence: "HIGH"
    decisionImpact: "MODERATE"

confidence:
  overall: "HIGH"
  inputConfidence: "HIGH"
  objectiveInterpretationConfidence: "HIGH"
  moduleSelectionConfidence: "HIGH"
  exerciseSelectionConfidence: "HIGH"
  loadEstimateConfidence: "MODERATE"
  limitingFactors:
    - "Heavy-bag output is not instrumented."
  supportingFactors:
    - "Known athlete history"
    - "Confirmed equipment"
    - "Complete pain status"

validation:
  status: "VALID_WITH_WARNINGS"
  blockingErrorCount: 0
  warningCount: 1
  recommendationCount: 1
  rulesChecked: 42
  rulesPassed: 42
  rulesFailed: 0
  blockingErrors: []
  warnings:
    - issueId: "validation_warning_001"
      ruleId: "READINESS_SHOULDER_001"
      code: "MONITOR_SHOULDER_SORENESS"
      severity: "WARNING"
      message: "Low shoulder soreness requires monitoring."
  recommendations:
    - issueId: "validation_recommendation_001"
      ruleId: "FEEDBACK_001"
      code: "RECORD_NEXT_DAY_SHOULDER_RESPONSE"
      severity: "RECOMMENDATION"
      message: "Record next-day shoulder soreness."
  validatedAt: "2026-07-15T07:16:20+02:00"
  validationRulesVersion: "0.1"

decisionTrace:
  traceId: "trace_2026_07_15_001"
  traceVersion: "0.1"
  included: "FULL"
  summary:
    primaryDecision: "Generate a Power-priority session with reduced Strength-maintenance volume."
    selectedModules:
      - "PREPARATION"
      - "POWER"
      - "STRENGTH"
      - "CORE"
      - "RECOVERY"
    selectedExercises:
      - "dynamic_movement_preparation"
      - "rotational_medicine_ball_throw"
      - "explosive_heavy_bag_single_strike"
      - "weighted_pull_up"
      - "bench_press"
      - "pallof_press"
      - "breathing_downregulation"
    mainConstraints:
      - "60-minute duration"
      - "Mild right-shoulder soreness"
      - "Key combat session within 48 hours"
      - "Unsupervised session"
    mainConflicts:
      - "Upper-body fatigue overlap between bag work and bench press"
    mainResolutions:
      - "Power placed before Strength"
      - "Bench-press volume reduced"
      - "Only one Core exercise retained"
    objectiveChanged: false
    safeDefaultsUsed: 1
    finalValidationStatus: "VALID_WITH_WARNINGS"
```

---

# No Valid Session Example

```yaml
schemaVersion: "0.1"

outputId: "output_failure_001"
requestId: "request_failure_001"
athleteId: "athlete_001"

generatedAt: "2026-07-15T07:20:00+02:00"
timezone: "Europe/Paris"

processingStatus: "COMPLETED_WITH_WARNINGS"
generationStatus: "NO_VALID_SESSION"

engineVersions:
  moduleEngineVersion: "0.1"
  sessionPipelineVersion: "0.1"
  inputSchemaVersion: "0.1"
  outputSchemaVersion: "0.1"
  exerciseSelectionRulesVersion: "0.1"
  substitutionRulesVersion: "0.1"
  scoringModelVersion: "0.1"
  conflictRulesVersion: "0.1"
  validationRulesVersion: "0.1"
  decisionTraceVersion: "0.1"
  exerciseLibraryVersion: "0.1"

result:
  resultType: "NO_VALID_SESSION"

  failureCategory: "PAIN"

  reason: "Acute knee pain and reduced landing control prevent safe lower-body Power training."

  protectedPriority: "Athlete safety"

  attemptedObjective: "Develop lower-body Power"

  attemptedModules:
    - "POWER"

  failedStages:
    - stage: "Exercise Eligibility Filtering"
      failureType: "BLOCKING_FAILURE"
      reason: "All ballistic lower-body candidates were ineligible."
      attemptedResolution: "Search for low-impact Power alternatives."
      resolutionSucceeded: false

  safeAlternatives:
    - actionType: "RECOVERY_SESSION"
      description: "Generate a low-intensity upper-body and breathing-based Recovery session."
      automaticallyGenerated: false

    - actionType: "SEEK_PROFESSIONAL_ASSESSMENT"
      description: "Seek appropriate assessment if pain persists, worsens or affects daily movement."
      automaticallyGenerated: false

  professionalAssessmentSuggested: true
  professionalAssessmentReason: "Acute pain and altered movement were reported."

  userMessage: "No lower-body Power session was generated because your current knee symptoms are incompatible with safe ballistic work."

warnings:
  - warningId: "warning_failure_001"
    code: "ACUTE_KNEE_PAIN"
    severity: "HIGH"
    category: "PAIN"
    message: "Knee pain alters movement and blocks lower-body ballistic exercise."

assumptions: []

confidence:
  overall: "HIGH"
  inputConfidence: "HIGH"
  objectiveInterpretationConfidence: "HIGH"
  moduleSelectionConfidence: "HIGH"
  exerciseSelectionConfidence: "HIGH"
  loadEstimateConfidence: "LOW"
  limitingFactors:
    - "No valid session was assembled."
  supportingFactors:
    - "Pain information was explicit."
    - "Movement alteration was reported."

validation:
  status: "INVALID"
  blockingErrorCount: 1
  warningCount: 0
  recommendationCount: 1
  rulesChecked: 12
  rulesPassed: 11
  rulesFailed: 1
  blockingErrors:
    - issueId: "blocking_001"
      ruleId: "PAIN_ELIGIBILITY_001"
      code: "PAIN_ALTERS_MOVEMENT"
      severity: "BLOCKING"
      message: "Lower-body ballistic exercise is blocked because pain alters movement."
  warnings: []
  recommendations:
    - issueId: "recommendation_001"
      ruleId: "ASSESSMENT_001"
      code: "PROFESSIONAL_ASSESSMENT"
      severity: "RECOMMENDATION"
      message: "Seek appropriate assessment if symptoms persist or worsen."
  validatedAt: "2026-07-15T07:19:50+02:00"
  validationRulesVersion: "0.1"

decisionTrace:
  traceId: "trace_failure_001"
  traceVersion: "0.1"
  included: "FULL"
  summary:
    primaryDecision: "Reject the requested lower-body Power session."
    selectedModules: []
    selectedExercises: []
    mainConstraints:
      - "Acute knee pain"
      - "Reduced landing control"
    mainConflicts:
      - "Safety conflict between pain state and ballistic lower-body demand"
    mainResolutions:
      - "All lower-body Power candidates excluded"
      - "Safe alternatives proposed"
    objectiveChanged: false
    safeDefaultsUsed: 0
    finalValidationStatus: "INVALID"
```

---

# Schema Invariants

The following conditions must always remain true:

1. Every output uses an explicit schema version.
2. Every output references the original request.
3. Every output identifies the athlete.
4. Every output identifies the rule versions used.
5. Every output contains one result type.
6. Generation status and result type must agree.
7. A generated session contains exactly one primary adaptation.
8. Only canonical Capability Modules may appear.
9. Every exercise has an explicit purpose.
10. Every exercise has an executable prescription.
11. Every Power exercise has quality-preserving stopping criteria.
12. Every substitution states what was preserved and lost.
13. Every material objective change is explicit.
14. Every assumption is visible.
15. Confidence remains separate from scoring and validation.
16. An invalid session is never returned as valid.
17. Blocking warnings cannot appear inside a generated valid session.
18. Session duration must be realistic.
19. Fatigue estimates use the four canonical dimensions.
20. Every output references a Decision Trace.
21. Safe failure is a valid engine result.
22. System failure is distinguishable from athlete-related failure.
23. No output may silently bypass hard constraints.
24. User-facing explanations must match structured decisions.
25. The engine must not claim certainty unsupported by data.

---

# Relationship With the Engine Input Schema

The output must preserve traceable relationships with the input.

Examples:

| Input                      | Output                              |
| -------------------------- | ----------------------------------- |
| `requestId`                | `requestId`                         |
| `athleteProfile.athleteId` | `athleteId`                         |
| requested objective        | requested and final objective       |
| available duration         | duration estimate                   |
| pain context               | warnings, exclusions and validation |
| equipment context          | selected or excluded exercises      |
| combat context             | session adjustments                 |
| competition context        | readiness and fatigue adjustments   |
| data provenance            | assumptions and confidence          |
| engine options             | alternative and trace behavior      |

Input values must not be rewritten silently.

Derived output values must remain identifiable as engine decisions.

---

# Relationship With the Session Generation Pipeline

The Engine Output represents the result of all pipeline stages:

```text
Input Validation
        ↓
Athlete State Evaluation
        ↓
Constraint Extraction
        ↓
Objective Interpretation
        ↓
Adaptation Prioritization
        ↓
Module Selection
        ↓
Exercise Selection
        ↓
Conflict Resolution
        ↓
Session Assembly
        ↓
Prescription
        ↓
Validation
        ↓
Engine Output
```

The output must contain enough structured information to determine:

* what the engine selected;
* what the engine rejected;
* what the engine changed;
* why it changed it;
* whether the result passed validation.

---

# Relationship With Session History

After execution, the generated session may become a historical session record.

The output schema should support later recording of:

* completion;
* actual load;
* actual repetitions;
* actual duration;
* RPE;
* pain response;
* technique quality;
* substitutions performed;
* next-day soreness;
* recovery;
* combat-practice impact.

Execution results should not overwrite the original generated prescription.

The system should preserve:

```text
Planned Session
Actual Session
```

as separate but linked records.

---

# Relationship With the Application Interface

The application may transform the output into:

* session overview;
* phase cards;
* exercise cards;
* rest timers;
* progress bars;
* next-exercise announcements;
* warnings;
* session summaries.

The interface must not alter the engine decision.

For example:

* hiding a warning does not remove the warning;
* changing displayed order does not change prescribed order;
* shortening a rest timer changes the prescription and requires a new decision;
* replacing an exercise requires substitution logic.

The structured output remains authoritative.

---

# Implementation Principle

The implementation should validate `EngineOutput` before sending it to:

* the application;
* the athlete;
* storage;
* analytics;
* session history.

Recommended processing sequence:

```text
buildOutput()
validateOutputSchema()
validateStatusConsistency()
validateSessionContent()
attachDecisionTrace()
serializeOutput()
deliverOutput()
```

The engine must not expose a partially built session as a final result.

---

# Definition of Success

The Engine Output Schema succeeds when it ensures that every engine response is:

* structurally valid;
* complete;
* actionable;
* safe;
* traceable;
* versioned;
* transparent;
* compatible with the application;
* compatible with future engine decisions;
* understandable at both technical and user-facing levels.

The schema does not succeed merely because it serializes a session.

It succeeds only when the output faithfully represents the complete engine decision.

---

# Final Principle

A CAS output is not a list of exercises.

It is a complete training decision containing:

* an objective;
* selected adaptations;
* selected Capability Modules;
* executable prescriptions;
* constraints;
* adjustments;
* warnings;
* validation;
* confidence;
* traceability.

> The session tells the athlete what to do.

> The output schema proves that the engine had a valid reason to prescribe it.
