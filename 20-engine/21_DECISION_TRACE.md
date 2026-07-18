# DECISION TRACE

Version 0.1

---

# Purpose

The Decision Trace defines how the Combat Athlete System records, explains and audits the reasoning behind every engine result.

Its purpose is to make every important decision:

* visible;
* structured;
* reproducible;
* understandable;
* reviewable;
* technically inspectable;
* linked to its source data;
* linked to the rule that produced it.

The Decision Trace explains how the engine moved from:

* athlete information;
* current readiness;
* pain and medical context;
* training objectives;
* Training Cycle priorities;
* constraints;
* equipment;
* environment;
* combat-practice context;
* competition context;
* recent training history

to:

* objective interpretation;
* adaptation priorities;
* Capability Module selection;
* exercise candidate generation;
* eligibility decisions;
* scoring;
* conflict detection;
* conflict resolution;
* session assembly;
* prescription;
* substitutions;
* warnings;
* validation;
* safe failure;
* the final engine output.

The Decision Trace is not an optional commentary layer.

It is a mandatory output of the CAS Engine.

---

# Core Principle

> Every significant CAS decision must be explainable through an explicit chain of input evidence, rules, scores, constraints and resolution actions.

The engine must never return:

* an unexplained exercise;
* an unexplained Capability Module;
* an unexplained warning;
* an unexplained substitution;
* an unexplained rejection;
* an unexplained objective change;
* an unexplained reduction in volume or intensity;
* an unexplained safe failure.

The Decision Trace must represent the actual decision process.

It must not create a plausible retrospective explanation after the decision has already been made.

---

# Scope

The Decision Trace records:

* which inputs were used;
* which inputs were missing;
* which safe defaults were applied;
* which values were inferred;
* how the objective was interpreted;
* how adaptations were prioritized;
* how modules were selected;
* which exercise candidates were retrieved;
* which candidates were excluded;
* how eligible candidates were scored;
* which conflicts were detected;
* how conflicts were resolved;
* whether backtracking occurred;
* how the session was assembled;
* how prescriptions were adjusted;
* which validation rules passed or failed;
* why the final result was returned.

The Decision Trace does not replace:

* the Engine Input;
* the Engine Output;
* the Scoring Model;
* the Conflict Rules;
* the Validation Rules.

It references and connects those systems.

---

# Objectives

The Decision Trace supports four main objectives.

---

## 1. Athlete Understanding

The athlete must be able to understand:

* why the session was selected;
* what the primary objective is;
* why exercises appear in a specific order;
* why volume or intensity was modified;
* why certain exercises were excluded;
* why a substitution was used;
* how the session relates to combat practice;
* what the main warning is.

The athlete-facing explanation should remain concise and practical.

---

## 2. Coach Review

A coach must be able to inspect:

* objective interpretation;
* adaptation priorities;
* module selection;
* exercise scores;
* eligibility decisions;
* fatigue estimates;
* constraints;
* conflict resolution;
* progression logic;
* weekly integration;
* validation results;
* confidence limitations.

---

## 3. Engine Debugging

Developers must be able to identify:

* which pipeline stage produced a decision;
* which rule triggered;
* which input caused the rule to trigger;
* which candidates were considered;
* which values were inferred;
* where uncertainty entered the process;
* when the engine backtracked;
* why an expected candidate was not selected;
* why the final output differed from a previous output.

---

## 4. Scientific and System Audit

The trace must support later review of:

* decision consistency;
* scoring calibration;
* rule effectiveness;
* conflict-resolution quality;
* athlete-specific response;
* fatigue prediction;
* progression quality;
* substitution success;
* model drift;
* version-related changes.

---

# Trace Levels

The Decision Trace supports three levels of representation:

1. User-Level Trace
2. Coach-Level Trace
3. Technical-Level Trace

These levels describe different views of the same underlying decision record.

They must not contain contradictory explanations.

---

## User-Level Trace

The User-Level Trace provides a concise and readable explanation.

It should explain:

* the session objective;
* the most important priorities;
* the main constraints;
* the key selected exercises;
* the most important adjustment;
* the main warning;
* the overall session logic.

Example:

> Rotational Power work was placed first because striking Power is the primary objective and explosive work must be performed while fresh. Strength work was kept afterward at maintenance volume. Conditioning was excluded to preserve recovery before the next combat session.

The User-Level Trace should avoid:

* long score tables;
* internal identifiers;
* implementation details;
* technical error codes;
* low-value rejected candidates;
* redundant explanations.

---

## Coach-Level Trace

The Coach-Level Trace provides a structured professional summary.

It may include:

* adaptation priorities;
* selected modules;
* principal scoring results;
* fatigue and recovery estimates;
* conflict details;
* volume and intensity adjustments;
* progression rationale;
* alternatives;
* validation warnings;
* confidence limitations.

The Coach-Level Trace should be detailed enough for review without exposing the complete internal event stream.

---

## Technical-Level Trace

The Technical-Level Trace provides the complete structured record.

It may include:

* input field references;
* source and provenance;
* normalized values;
* inferred values;
* safe defaults;
* pipeline stages;
* rule identifiers;
* rule versions;
* candidate lists;
* eligibility decisions;
* mandatory-criterion checks;
* scoring profiles;
* criterion scores;
* criterion weights;
* modifiers;
* confidence assessments;
* conflicts;
* backtracking;
* validation events;
* output mapping;
* timestamps.

---

# Root Decision Trace Object

The root object is named:

```typescript
DecisionTrace
```

Its canonical Version 0.1 structure is:

```typescript
interface DecisionTrace {
  traceVersion: "0.1";

  traceId: Identifier;
  requestId: Identifier;
  outputId: Identifier;
  athleteId: Identifier;

  startedAt: ISODateTime;
  completedAt: ISODateTime;
  timezone: IANATimeZone;

  processingStatus: TraceProcessingStatus;

  engineVersions: EngineVersionSet;

  inputSummary: TraceInputSummary;
  provenanceSummary: ProvenanceSummary;

  userTrace: UserLevelTrace;
  coachTrace: CoachLevelTrace;

  pipelineTrace: PipelineTrace;
  decisionEvents: DecisionEvent[];

  candidateTrace: CandidateDecisionTrace;
  conflictTrace: ConflictDecisionTrace;
  adjustmentTrace: AdjustmentDecisionTrace;
  validationTrace: ValidationDecisionTrace;

  assumptions: TraceAssumption[];
  unresolvedUncertainties: TraceUncertainty[];

  finalDecision: FinalDecisionRecord;

  integrity: TraceIntegrityRecord;
}
```

---

# Trace Processing Status

```typescript
type TraceProcessingStatus =
  | "COMPLETE"
  | "COMPLETE_WITH_WARNINGS"
  | "INCOMPLETE_SYSTEM_FAILURE";
```

A trace may be incomplete only when a technical failure prevents normal completion.

Even in a System Failure, the engine should preserve all trace events successfully recorded before failure.

---

# Primitive Types

```typescript
type Identifier = string;
type ISODateTime = string;
type IANATimeZone = string;
```

---

# Engine Versions

The trace must identify every rule and data version used.

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

A decision must never be audited without knowing which rule versions produced it.

---

# Input Summary

```typescript
interface TraceInputSummary {
  requestedObjective: string;
  requestedSessionType?: string;
  requestedDurationMinutes: number;

  athleteStateSummary: string;
  painStatusSummary: string;
  medicalStatusSummary: string;

  equipmentSummary: string[];
  environmentSummary: string;
  supervisionSummary: string;

  combatContextSummary?: string;
  competitionContextSummary?: string;
  trainingCycleSummary?: string;
  recentTrainingSummary?: string;

  criticalInputWarnings: string[];
}
```

The Input Summary is not a copy of the complete Engine Input.

It highlights the fields that materially influenced the decision.

---

# Provenance Summary

```typescript
interface ProvenanceSummary {
  directAthleteInputs: number;
  coachInputs: number;
  medicalInputs: number;
  measuredInputs: number;
  importedInputs: number;
  inferredValues: number;
  safeDefaults: number;

  lowQualityDataCount: number;
  unknownCriticalDataCount: number;

  materialProvenanceRecords: MaterialProvenanceRecord[];
}
```

---

## Material Provenance Record

```typescript
interface MaterialProvenanceRecord {
  fieldPath: string;

  source:
    | "ATHLETE_SELF_REPORT"
    | "COACH_INPUT"
    | "MEDICAL_INPUT"
    | "TRAINING_HISTORY"
    | "DIRECT_MEASUREMENT"
    | "WEARABLE"
    | "IMPORTED_SERVICE"
    | "ENGINE_INFERENCE"
    | "SAFE_DEFAULT";

  quality:
    | "HIGH"
    | "MODERATE"
    | "LOW"
    | "UNKNOWN";

  confidence: ConfidenceLevel;

  decisionImpact:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "CRITICAL";

  usedByRules: string[];
}
```

Only materially relevant provenance records need to appear in the main trace.

The complete provenance set may remain linked through the Engine Input.

---

# User-Level Trace

```typescript
interface UserLevelTrace {
  title: string;

  primaryGoal: string;
  sessionLogic: string;

  mainPriorities: string[];
  mainConstraints: string[];

  whyTheseExercises: UserExerciseReason[];

  mainAdjustment?: string;
  mainWarning?: string;

  expectedOutcome: string;

  safeFailureExplanation?: string;
}
```

---

## User Exercise Reason

```typescript
interface UserExerciseReason {
  exerciseId: Identifier;
  exerciseName: string;

  reason: string;
  role: string;
}
```

The user-facing trace should explain selected exercises by function, not by numerical score alone.

Bad explanation:

> This exercise was selected because it scored 86.

Better explanation:

> This exercise was selected because it provides high-velocity rotational work with limited fatigue before the strength block.

---

# Coach-Level Trace

```typescript
interface CoachLevelTrace {
  interpretedObjective: string;
  primaryAdaptation: AdaptationDomain;

  adaptationPriorities: CoachAdaptationDecision[];
  moduleDecisions: CoachModuleDecision[];
  exerciseDecisions: CoachExerciseDecision[];

  mainConflicts: CoachConflictSummary[];
  mainAdjustments: CoachAdjustmentSummary[];

  estimatedSessionLoad: string;
  estimatedRecovery: string;

  validationSummary: string;
  confidenceSummary: string;

  reviewPoints: string[];
}
```

---

## Coach Adaptation Decision

```typescript
interface CoachAdaptationDecision {
  adaptation: AdaptationDomain;

  role:
    | "PRIMARY"
    | "SECONDARY"
    | "MAINTENANCE"
    | "SUPPORT"
    | "EXCLUDED";

  reason: string;
  priorityScore?: number;
}
```

---

## Coach Module Decision

```typescript
interface CoachModuleDecision {
  moduleId: CapabilityModuleId;

  selected: boolean;
  role?: string;

  purpose?: string;
  reason: string;

  modulePriorityScore?: number;
}
```

---

## Coach Exercise Decision

```typescript
interface CoachExerciseDecision {
  exerciseId: Identifier;
  exerciseName: string;

  selected: boolean;

  moduleId?: CapabilityModuleId;

  finalSuitabilityScore?: number;
  confidence?: ConfidenceLevel;

  reason: string;
  mainLimitation?: string;
}
```

---

## Coach Conflict Summary

```typescript
interface CoachConflictSummary {
  conflictType: string;
  level: ConflictLevel;

  affectedElements: string[];

  protectedPriority: string;
  resolution: string;
}
```

---

## Coach Adjustment Summary

```typescript
interface CoachAdjustmentSummary {
  adjustmentType: string;

  originalPlan?: string;
  finalPlan: string;

  reason: string;
  tradeOff?: string;
}
```

---

# Pipeline Trace

The Pipeline Trace records the execution of the Session Generation Pipeline.

```typescript
interface PipelineTrace {
  stages: PipelineStageTrace[];

  completedStageCount: number;
  warningStageCount: number;
  failedStageCount: number;

  backtrackingOccurred: boolean;
  backtrackingCount: number;
  maximumBacktrackingLimit?: number;
}
```

---

# Pipeline Stage Trace

```typescript
interface PipelineStageTrace {
  stageId: Identifier;

  stageName: PipelineStageName;
  order: number;

  startedAt: ISODateTime;
  completedAt?: ISODateTime;

  status:
    | "SUCCESS"
    | "SUCCESS_WITH_WARNINGS"
    | "RECOVERABLE_FAILURE"
    | "BLOCKING_FAILURE"
    | "SYSTEM_FAILURE"
    | "SKIPPED";

  inputReferences: string[];
  outputReferences: string[];

  rulesEvaluated: string[];
  warnings: string[];
  errors: string[];

  decisionEventIds: Identifier[];

  nextStage?: PipelineStageName;
  backtrackStage?: PipelineStageName;
}
```

---

# Pipeline Stage Names

```typescript
type PipelineStageName =
  | "INPUT_VALIDATION"
  | "ATHLETE_STATE_EVALUATION"
  | "CONSTRAINT_EXTRACTION"
  | "OBJECTIVE_INTERPRETATION"
  | "ADAPTATION_PRIORITY_CALCULATION"
  | "CAPABILITY_MODULE_SELECTION"
  | "MODULE_COMPATIBILITY_CHECK"
  | "EXERCISE_CANDIDATE_RETRIEVAL"
  | "EXERCISE_ELIGIBILITY_FILTERING"
  | "EXERCISE_SCORING"
  | "INITIAL_CANDIDATE_SELECTION"
  | "CONFLICT_DETECTION"
  | "CONFLICT_RESOLUTION"
  | "SESSION_ASSEMBLY"
  | "PRESCRIPTION_GENERATION"
  | "LOAD_ESTIMATION"
  | "DURATION_ESTIMATION"
  | "FINAL_VALIDATION"
  | "OUTPUT_GENERATION";
```

---

# Decision Events

The Decision Trace is primarily an ordered event record.

Each meaningful engine action creates a `DecisionEvent`.

```typescript
interface DecisionEvent {
  eventId: Identifier;
  sequence: number;

  timestamp: ISODateTime;
  stage: PipelineStageName;

  eventType: DecisionEventType;

  subjectType:
    | "INPUT"
    | "OBJECTIVE"
    | "ADAPTATION"
    | "MODULE"
    | "EXERCISE"
    | "PRESCRIPTION"
    | "CONFLICT"
    | "VALIDATION"
    | "OUTPUT"
    | "SYSTEM";

  subjectId?: Identifier;
  subjectName?: string;

  decision: string;
  rationale: string;

  inputEvidence: EvidenceReference[];
  rulesApplied: RuleReference[];

  scoreReference?: ScoreReference;
  conflictReference?: Identifier;
  validationReference?: Identifier;

  confidence: ConfidenceLevel;

  alternativesConsidered?: AlternativeDecisionRecord[];

  result:
    | "ACCEPTED"
    | "REJECTED"
    | "MODIFIED"
    | "DEFERRED"
    | "FAILED";

  parentEventId?: Identifier;
}
```

---

# Decision Event Types

```typescript
type DecisionEventType =
  | "INPUT_ACCEPTED"
  | "INPUT_REJECTED"
  | "VALUE_NORMALIZED"
  | "VALUE_INFERRED"
  | "SAFE_DEFAULT_APPLIED"
  | "CONSTRAINT_CREATED"
  | "OBJECTIVE_INTERPRETED"
  | "OBJECTIVE_CHANGED"
  | "ADAPTATION_PRIORITIZED"
  | "ADAPTATION_EXCLUDED"
  | "MODULE_SELECTED"
  | "MODULE_REJECTED"
  | "MODULE_ROLE_CHANGED"
  | "CANDIDATE_RETRIEVED"
  | "CANDIDATE_EXCLUDED"
  | "MANDATORY_CRITERION_FAILED"
  | "CANDIDATE_SCORED"
  | "CANDIDATE_SELECTED"
  | "CANDIDATE_REJECTED"
  | "CONFLICT_DETECTED"
  | "CONFLICT_RESOLVED"
  | "SUBSTITUTION_APPLIED"
  | "PRESCRIPTION_MODIFIED"
  | "ORDER_CHANGED"
  | "VOLUME_REDUCED"
  | "INTENSITY_REDUCED"
  | "REST_CHANGED"
  | "BACKTRACK_STARTED"
  | "BACKTRACK_COMPLETED"
  | "VALIDATION_PASSED"
  | "VALIDATION_WARNING"
  | "VALIDATION_FAILED"
  | "SESSION_GENERATED"
  | "SAFE_FAILURE_RETURNED"
  | "SYSTEM_FAILURE_RECORDED"
  | "MANUAL_OVERRIDE";
```

---

# Evidence References

```typescript
interface EvidenceReference {
  sourceType:
    | "ENGINE_INPUT"
    | "TRAINING_HISTORY"
    | "EXERCISE_LIBRARY"
    | "RULE_RESULT"
    | "SCORING_RESULT"
    | "CONFLICT_RESULT"
    | "VALIDATION_RESULT";

  reference: string;
  valueSummary?: string;

  sourceQuality?: string;
  confidence?: ConfidenceLevel;
}
```

Example:

```yaml
sourceType: "ENGINE_INPUT"
reference: "athleteState.regionalReadiness[SHOULDER_RIGHT]"
valueSummary: "Moderate readiness due to low soreness"
confidence: "HIGH"
```

---

# Rule References

```typescript
interface RuleReference {
  ruleId: string;
  ruleVersion: string;

  ruleSystem:
    | "MODULE_ENGINE"
    | "SESSION_PIPELINE"
    | "EXERCISE_SELECTION"
    | "SUBSTITUTION"
    | "SCORING"
    | "CONFLICT"
    | "VALIDATION"
    | "INPUT_SCHEMA"
    | "OUTPUT_SCHEMA";

  result:
    | "TRIGGERED"
    | "PASSED"
    | "FAILED"
    | "NOT_APPLICABLE";

  effect: string;
}
```

A Decision Event must reference the actual rules that materially caused the decision.

It does not need to list every rule evaluated by the stage.

---

# Alternative Decision Record

```typescript
interface AlternativeDecisionRecord {
  candidateId?: Identifier;
  candidateName: string;

  status:
    | "ELIGIBLE"
    | "INELIGIBLE"
    | "LOWER_RANKED"
    | "CONFLICTED"
    | "NOT_SELECTED";

  score?: number;
  confidence?: ConfidenceLevel;

  reasonNotSelected: string;
}
```

---

# Score References

```typescript
interface ScoreReference {
  decisionType:
    | "MODULE_PRIORITY"
    | "EXERCISE_SELECTION"
    | "SUBSTITUTION"
    | "SESSION_QUALITY"
    | "PROGRESSION";

  scoringProfile: string;

  baseScore?: number;
  positiveModifiers?: number;
  negativeModifiers?: number;
  finalScore?: number;

  rank?: number;
  tieBreakApplied?: boolean;

  detailedScoreId?: Identifier;
}
```

Confidence must not be incorporated as a hidden multiplier.

It must be recorded separately.

---

# Candidate Decision Trace

```typescript
interface CandidateDecisionTrace {
  modules: ModuleCandidateTrace[];
  exercises: ExerciseCandidateTrace[];

  totalModuleCandidates: number;
  selectedModuleCount: number;

  totalExerciseCandidates: number;
  eligibleExerciseCount: number;
  selectedExerciseCount: number;
  excludedExerciseCount: number;
}
```

---

# Module Candidate Trace

```typescript
interface ModuleCandidateTrace {
  moduleId: CapabilityModuleId;

  requested: boolean;
  selected: boolean;

  role?:
    | "PRIMARY"
    | "SECONDARY"
    | "MAINTENANCE"
    | "SUPPORT"
    | "EXCLUDED";

  primaryAdaptation: AdaptationDomain;

  priorityScore?: number;
  confidence: ConfidenceLevel;

  selectionReason?: string;
  rejectionReason?: string;

  constraintsApplied: string[];
  conflictIds: Identifier[];
}
```

---

# Exercise Candidate Trace

```typescript
interface ExerciseCandidateTrace {
  exerciseId: Identifier;
  exerciseName: string;

  moduleId: CapabilityModuleId;

  retrieved: boolean;

  eligibility:
    | "ELIGIBLE"
    | "INELIGIBLE";

  eligibilityReasons: string[];

  mandatoryCriteriaPassed?: boolean;
  mandatoryCriterionFailures?: MandatoryCriterionFailure[];

  scoringProfile?: string;
  criterionScores?: CriterionScoreTrace[];

  baseSuitabilityScore?: number;
  modifiers?: ScoreModifierTrace[];
  finalSuitabilityScore?: number;

  confidence?: ConfidenceLevel;
  rank?: number;

  selected: boolean;
  selectionReason?: string;
  rejectionReason?: string;

  conflictIds: Identifier[];
}
```

---

# Mandatory Criterion Failure

```typescript
interface MandatoryCriterionFailure {
  criterion: string;
  score: number;
  requiredMinimum: number;

  reason: string;
  ruleReference: string;
}
```

---

# Criterion Score Trace

```typescript
interface CriterionScoreTrace {
  criterionId: string;
  criterionName: string;

  score: number;
  weight: number;
  contribution: number;

  evidenceReferences: string[];
  rationale: string;
}
```

---

# Score Modifier Trace

```typescript
interface ScoreModifierTrace {
  modifierId: string;

  type:
    | "POSITIVE"
    | "NEGATIVE";

  value: number;
  reason: string;

  sourceReference?: string;
  ruleReference?: string;
}
```

The trace must allow reviewers to verify that a factor was not counted twice.

---

# Conflict Decision Trace

```typescript
interface ConflictDecisionTrace {
  conflicts: ConflictTraceRecord[];

  totalConflictCount: number;

  minorConflictCount: number;
  moderateConflictCount: number;
  majorConflictCount: number;
  criticalConflictCount: number;

  unresolvedConflictCount: number;
}
```

A generated valid session requires:

```text
unresolvedConflictCount = 0
```

for all Major and Critical conflicts.

---

# Conflict Trace Record

```typescript
interface ConflictTraceRecord {
  conflictId: Identifier;

  detectedAtStage: PipelineStageName;

  type: string;
  scope:
    | "CANDIDATE"
    | "SESSION"
    | "MICROCYCLE"
    | "TRAINING_CYCLE"
    | "ATHLETE_STATE";

  level: ConflictLevel;

  probability?: number;
  consequence?: number;
  exposure?: number;
  conflictScore?: number;

  affectedElements: ConflictElementReference[];

  evidence: EvidenceReference[];

  protectedPriority: string;
  lowerPriorityCost: string;

  resolutionStatus:
    | "RESOLVED"
    | "UNRESOLVED"
    | "ACCEPTED_WITH_MONITORING";

  resolution?: ConflictResolutionTrace;

  ruleReferences: RuleReference[];
}
```

---

# Conflict Level

```typescript
type ConflictLevel =
  | "NONE"
  | "MINOR"
  | "MODERATE"
  | "MAJOR"
  | "CRITICAL";
```

---

# Conflict Element Reference

```typescript
interface ConflictElementReference {
  elementType:
    | "ADAPTATION"
    | "MODULE"
    | "EXERCISE"
    | "PRESCRIPTION"
    | "SESSION"
    | "COMBAT_SESSION"
    | "ATHLETE_STATE"
    | "CONSTRAINT";

  elementId?: Identifier;
  elementName: string;
}
```

---

# Conflict Resolution Trace

```typescript
interface ConflictResolutionTrace {
  action:
    | "REORDER"
    | "REDUCE_DENSITY"
    | "REDUCE_VOLUME"
    | "REDUCE_INTENSITY"
    | "MODIFY_PRESCRIPTION"
    | "SUBSTITUTE_EXERCISE"
    | "REMOVE_EXERCISE"
    | "CHANGE_MODULE_ROLE"
    | "REMOVE_MODULE"
    | "SEPARATE_SESSIONS"
    | "CHANGE_OBJECTIVE"
    | "REPLACE_SESSION"
    | "STOP_GENERATION";

  originalPlan: string;
  adjustedPlan: string;

  reason: string;
  expectedTradeOff?: string;

  affectedDecisionEventIds: Identifier[];

  recalculationRequired: boolean;
  recalculationCompleted: boolean;

  result:
    | "RESOLVED"
    | "PARTIALLY_RESOLVED"
    | "FAILED";
}
```

---

# Adjustment Decision Trace

```typescript
interface AdjustmentDecisionTrace {
  adjustments: AdjustmentTraceRecord[];

  objectiveAdjustmentCount: number;
  moduleAdjustmentCount: number;
  exerciseAdjustmentCount: number;
  prescriptionAdjustmentCount: number;

  substitutionCount: number;
}
```

---

# Adjustment Trace Record

```typescript
interface AdjustmentTraceRecord {
  adjustmentId: Identifier;

  type:
    | "OBJECTIVE_REDUCTION"
    | "OBJECTIVE_CHANGE"
    | "MODULE_ADDED"
    | "MODULE_REMOVED"
    | "MODULE_ROLE_CHANGED"
    | "EXERCISE_SUBSTITUTED"
    | "EXERCISE_REMOVED"
    | "EXERCISE_ADDED"
    | "ORDER_CHANGED"
    | "VOLUME_REDUCED"
    | "VOLUME_INCREASED"
    | "INTENSITY_REDUCED"
    | "INTENSITY_INCREASED"
    | "REST_INCREASED"
    | "REST_REDUCED"
    | "DURATION_REDUCED"
    | "RECOVERY_FALLBACK"
    | "OTHER";

  stage: PipelineStageName;

  originalValue?: unknown;
  adjustedValue?: unknown;

  reason: string;
  protectedPriority: string;

  triggeringConflictId?: Identifier;
  ruleReferences: RuleReference[];

  objectivePreserved: boolean;
  primaryAdaptationPreserved: boolean;
  modulePreserved?: boolean;

  tradeOff?: string;
}
```

---

# Substitution Trace

A substitution should use an Adjustment Trace and may also include a specialized record.

```typescript
interface SubstitutionTraceRecord {
  substitutionId: Identifier;

  originalExerciseId: Identifier;
  originalExerciseName: string;

  substituteExerciseId: Identifier;
  substituteExerciseName: string;

  reason: string;

  primaryAdaptationPreserved: boolean;
  modulePreserved: boolean;

  preservedFeatures: string[];
  changedFeatures: string[];
  lostFeatures: string[];

  originalScore?: number;
  substituteScore?: number;

  confidence: ConfidenceLevel;

  ruleReferences: RuleReference[];
}
```

A substitution that does not preserve the primary adaptation must be described as a program modification.

---

# Backtracking Trace

Every pipeline return to an earlier stage must be recorded.

```typescript
interface BacktrackingRecord {
  backtrackingId: Identifier;

  fromStage: PipelineStageName;
  toStage: PipelineStageName;

  trigger:
    | "NO_ELIGIBLE_CANDIDATE"
    | "MODULE_INCOMPATIBILITY"
    | "CONFLICT"
    | "DURATION_OVERFLOW"
    | "FATIGUE_OVERFLOW"
    | "VALIDATION_FAILURE"
    | "MISSING_DATA"
    | "OTHER";

  reason: string;

  affectedElements: string[];

  iteration: number;

  outcome:
    | "RESOLVED"
    | "UNRESOLVED"
    | "BLOCKING_FAILURE";
}
```

Backtracking records may be stored within relevant Decision Events and Pipeline Stage traces.

---

# Validation Decision Trace

```typescript
interface ValidationDecisionTrace {
  validationStatus:
    | "VALID"
    | "VALID_WITH_WARNINGS"
    | "INVALID";

  rulesChecked: ValidationRuleTrace[];

  blockingErrors: ValidationTraceIssue[];
  warnings: ValidationTraceIssue[];
  recommendations: ValidationTraceIssue[];

  validatedAt: ISODateTime;
  validationRulesVersion: string;
}
```

---

# Validation Rule Trace

```typescript
interface ValidationRuleTrace {
  ruleId: string;
  ruleVersion: string;

  category: string;

  result:
    | "PASSED"
    | "FAILED"
    | "NOT_APPLICABLE";

  checkedValues: string[];
  message?: string;
}
```

---

# Validation Trace Issue

```typescript
interface ValidationTraceIssue {
  issueId: Identifier;
  ruleId: string;

  severity:
    | "BLOCKING"
    | "WARNING"
    | "RECOMMENDATION";

  message: string;

  affectedElements: string[];
  suggestedResolution?: string;
}
```

---

# Assumptions

```typescript
interface TraceAssumption {
  assumptionId: Identifier;

  type:
    | "INFERENCE"
    | "SAFE_DEFAULT"
    | "CONSERVATIVE_ASSUMPTION"
    | "NORMALIZATION";

  fieldPath?: string;

  originalValue?: unknown;
  resultingValue?: unknown;

  reason: string;

  sourceReferences: string[];
  ruleReference?: string;

  confidence: ConfidenceLevel;

  decisionImpact:
    | "NONE"
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "CRITICAL";
}
```

Every safe default used by the engine must appear in the trace.

Example:

```yaml
assumptionId: "assumption_001"
type: "SAFE_DEFAULT"
fieldPath: "supervisionContext.mode"
resultingValue: "UNSUPERVISED"
reason: "No coach presence was confirmed."
confidence: "HIGH"
decisionImpact: "MODERATE"
```

---

# Unresolved Uncertainty

```typescript
interface TraceUncertainty {
  uncertaintyId: Identifier;

  description: string;
  affectedDecision: string;

  source:
    | "MISSING_DATA"
    | "LOW_QUALITY_DATA"
    | "CONFLICTING_DATA"
    | "LIMITED_EVIDENCE"
    | "UNMEASURED_OUTPUT"
    | "OTHER";

  confidenceImpact:
    | "LOW"
    | "MODERATE"
    | "HIGH";

  safetyImpact:
    | "NONE"
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "CRITICAL";

  mitigation: string;

  remainsAfterGeneration: boolean;
}
```

A valid session may contain unresolved uncertainty only when:

* safety impact is not blocking;
* the session remains conservative;
* the uncertainty is visible;
* appropriate monitoring is prescribed.

---

# Confidence

```typescript
type ConfidenceLevel =
  | "VERY_HIGH"
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "VERY_LOW";
```

The trace must explain why Confidence received its value.

Confidence must remain separate from:

* suitability score;
* eligibility;
* conflict severity;
* validation status.

---

# Final Decision Record

```typescript
interface FinalDecisionRecord {
  generationStatus:
    | "SESSION_GENERATED"
    | "SESSION_GENERATED_WITH_WARNINGS"
    | "NO_VALID_SESSION"
    | "INPUT_INVALID"
    | "SYSTEM_FAILURE";

  primaryDecision: string;

  selectedSessionId?: Identifier;

  finalObjective?: string;
  primaryAdaptation?: AdaptationDomain;

  selectedModules: CapabilityModuleId[];
  selectedExercises: Identifier[];

  mainConstraints: string[];
  mainConflicts: string[];
  mainResolutions: string[];

  objectiveChanged: boolean;
  primaryAdaptationPreserved: boolean;

  safeDefaultsUsed: number;
  manualOverridesUsed: number;

  finalValidationStatus:
    | "VALID"
    | "VALID_WITH_WARNINGS"
    | "INVALID";

  overallConfidence: ConfidenceLevel;

  userFacingConclusion: string;
}
```

---

# Trace Integrity

```typescript
interface TraceIntegrityRecord {
  eventCount: number;

  sequenceComplete: boolean;
  timestampsComplete: boolean;
  ruleReferencesComplete: boolean;
  outputReferencesComplete: boolean;

  finalDecisionMatchesOutput: boolean;
  validationMatchesOutput: boolean;

  integrityStatus:
    | "VALID"
    | "VALID_WITH_WARNINGS"
    | "INVALID";

  integrityWarnings: string[];

  checksum?: string;
}
```

The Decision Trace must agree with the Engine Output.

Examples of integrity failures include:

* trace says an exercise was rejected but the output prescribes it;
* trace says validation passed while output says invalid;
* trace records no objective change while the output changes the objective;
* selected modules differ between trace and output.

---

# Decision Explanation Rules

---

## Rule 1 — Explain Material Decisions

The trace must explain decisions that materially affect:

* adaptation;
* safety;
* fatigue;
* duration;
* module selection;
* exercise selection;
* exercise order;
* progression;
* substitutions;
* validation.

Minor implementation details do not require athlete-facing explanation.

---

## Rule 2 — Evidence Before Conclusion

Every technical decision should reference the evidence used.

Example:

```text
Evidence:
Low right-shoulder readiness

Rule:
Upper-body fatigue must not compromise key combat practice

Decision:
Reduce bench-press volume
```

The trace must not contain unsupported conclusions.

---

## Rule 3 — Rule Identification

Material decisions must identify:

* rule identifier;
* rule system;
* rule version;
* rule result.

---

## Rule 4 — Scoring Transparency

When scoring influences a selection, the trace must record:

* active profile;
* active criteria;
* criterion scores;
* weights;
* modifiers;
* final score;
* Confidence;
* rank;
* tie-break rule when applicable.

---

## Rule 5 — No Score-Only Explanation

A score alone is not a sufficient rationale.

Bad:

> Trap Bar Deadlift was selected because it scored 84.

Required:

> Trap Bar Deadlift was selected because it provided a strong Strength stimulus, reliable loading and lower predicted interference with the upcoming kicking session. Its final score was 84.

---

## Rule 6 — Explain High-Ranking Rejections

A rejected candidate must receive a detailed explanation when it:

* ranked within the top three;
* scored within three points of the selected candidate;
* was explicitly requested by the athlete;
* was part of the previous prescription;
* was excluded by a hard constraint;
* was removed during conflict resolution.

---

## Rule 7 — Explain Objective Changes

When the final objective differs from the request, the trace must record:

* requested objective;
* final objective;
* reason for change;
* protected priority;
* expected trade-off.

The change must also appear in the user-facing explanation.

---

## Rule 8 — Explain Module Omissions

A high-priority or explicitly requested module that is omitted must have a reason.

Possible reasons include:

* insufficient recovery;
* time limit;
* conflict;
* no valid implementation;
* weekly exposure already sufficient;
* competition proximity;
* lower priority than another selected module.

---

## Rule 9 — Explain Substitutions

Every substitution must identify:

* the original exercise;
* the substitute;
* the triggering constraint;
* preserved characteristics;
* changed characteristics;
* lost characteristics;
* whether the primary adaptation remains preserved.

---

## Rule 10 — Explain Warnings

Every warning must identify:

* the triggering evidence;
* the affected element;
* the athlete action;
* the engine action;
* the relevant rule.

---

## Rule 11 — Explain Safe Failure

When no valid session is generated, the trace must explain:

* what was requested;
* which stages were attempted;
* what blocked generation;
* which alternatives were considered;
* why those alternatives failed;
* what safe action is recommended.

---

## Rule 12 — Preserve Raw and Derived Data

The trace must distinguish between:

* raw athlete input;
* normalized input;
* inferred value;
* derived constraint;
* engine decision.

Example:

```text
Raw input:
Sleep duration = 5 hours

Inferred value:
Neural readiness reduced

Derived constraint:
High-risk ballistic work restricted

Decision:
Depth jumps excluded
```

---

# Manual Override Trace

A manual override must be recorded as a dedicated Decision Event.

```typescript
interface ManualOverrideTrace {
  overrideId: Identifier;

  authorizedBy: string;
  authorizedAt: ISODateTime;

  originalDecision: string;
  overriddenDecision: string;

  reason: string;
  expectedBenefit: string;
  knownRisk: string;

  reviewDate?: ISODate;

  hardSafetyRuleBypassed: false;
}
```

A manual override must never bypass:

* medical restrictions;
* critical pain rules;
* hard safety exclusions;
* blocking validation errors.

---

# Trace Filtering

The complete Technical Trace may contain more information than should be shown in the athlete interface.

The application may filter the view.

It must not alter the underlying trace.

Recommended views:

```text
USER
COACH
TECHNICAL
AUDIT
```

---

## User View

Displays:

* User-Level Trace;
* main warnings;
* primary objective;
* selected exercises;
* main adjustment;
* final validation status.

---

## Coach View

Displays:

* Coach-Level Trace;
* adaptation and module decisions;
* selected and rejected candidates;
* conflict resolution;
* load estimates;
* confidence;
* validation.

---

## Technical View

Displays:

* complete Pipeline Trace;
* Decision Events;
* score breakdowns;
* rule references;
* backtracking;
* assumptions;
* trace integrity.

---

## Audit View

Displays:

* Technical Trace;
* version history;
* provenance;
* manual overrides;
* calibration references;
* athlete outcome links.

---

# Data Minimization

The Decision Trace should contain only information relevant to the training decision.

It should not unnecessarily duplicate:

* complete medical records;
* unrelated personal information;
* full athlete-profile history;
* confidential technical infrastructure data.

Sensitive input values may be referenced through field paths rather than repeated in full.

---

# Trace Retention

The Decision Trace should be linked to:

* Engine Input;
* Engine Output;
* generated session;
* completed session;
* athlete feedback;
* future calibration data.

Retention rules belong to the broader CAS data-governance system.

The trace schema does not define legal retention duration.

---

# Example Decision Trace

```yaml
traceVersion: "0.1"

traceId: "trace_2026_07_15_001"
requestId: "request_2026_07_15_001"
outputId: "output_2026_07_15_001"
athleteId: "athlete_001"

startedAt: "2026-07-15T07:15:00+02:00"
completedAt: "2026-07-15T07:16:30+02:00"
timezone: "Europe/Paris"

processingStatus: "COMPLETE_WITH_WARNINGS"

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

inputSummary:
  requestedObjective: "Improve striking power"
  requestedSessionType: "DEVELOPMENT"
  requestedDurationMinutes: 60

  athleteStateSummary: "Good general readiness with moderate muscular readiness."
  painStatusSummary: "No current pain."
  medicalStatusSummary: "Cleared without active medical restrictions."

  equipmentSummary:
    - "Barbell available"
    - "Bench available"
    - "Pull-up bar available"
    - "Medicine ball available"
    - "Heavy bag available"

  environmentSummary: "Large combat-gym space with safe floor."
  supervisionSummary: "Unsupervised session."

  combatContextSummary: "Key technical Krav Maga session scheduled in 48 hours."
  trainingCycleSummary: "Power development with maximum-strength maintenance."

  criticalInputWarnings:
    - "Low right-shoulder soreness reported."

provenanceSummary:
  directAthleteInputs: 8
  coachInputs: 0
  medicalInputs: 1
  measuredInputs: 0
  importedInputs: 0
  inferredValues: 1
  safeDefaults: 1

  lowQualityDataCount: 0
  unknownCriticalDataCount: 0

  materialProvenanceRecords:
    - fieldPath: "athleteState.generalReadiness"
      source: "ATHLETE_SELF_REPORT"
      quality: "MODERATE"
      confidence: "HIGH"
      decisionImpact: "HIGH"
      usedByRules:
        - "MODULE_PRIORITY_READINESS_001"
        - "POWER_READINESS_001"

    - fieldPath: "supervisionContext.mode"
      source: "SAFE_DEFAULT"
      quality: "MODERATE"
      confidence: "HIGH"
      decisionImpact: "MODERATE"
      usedByRules:
        - "SUPERVISION_COMPATIBILITY_001"

userTrace:
  title: "Why this session was selected"

  primaryGoal: "Develop high-quality striking Power."

  sessionLogic: "Explosive rotational work is placed first while fresh, followed by controlled upper-body Strength maintenance."

  mainPriorities:
    - "Power development"
    - "Strength maintenance"
    - "Readiness for the next Krav Maga session"

  mainConstraints:
    - "60-minute duration"
    - "Mild right-shoulder soreness"
    - "Key combat session in 48 hours"

  whyTheseExercises:
    - exerciseId: "rotational_medicine_ball_throw"
      exerciseName: "Rotational Medicine-Ball Throw"
      reason: "Provides high-velocity rotational force with controlled fatigue."
      role: "Primary Power exercise"

    - exerciseId: "weighted_pull_up"
      exerciseName: "Weighted Pull-Up"
      reason: "Maintains upper-body pulling Strength with reliable progression."
      role: "Strength maintenance"

  mainAdjustment: "Bench-press volume was reduced to limit shoulder and triceps fatigue."

  mainWarning: "Stop upper-body work if right-shoulder symptoms increase."

  expectedOutcome: "A high-quality Power stimulus without unnecessary interference with combat practice."

coachTrace:
  interpretedObjective: "Improve rapid striking force expression while maintaining upper-body Strength."
  primaryAdaptation: "POWER"

  adaptationPriorities:
    - adaptation: "POWER"
      role: "PRIMARY"
      reason: "Direct match with the request and Training Cycle."
      priorityScore: 91

    - adaptation: "MAXIMUM_STRENGTH"
      role: "MAINTENANCE"
      reason: "Important long-term quality maintained at reduced volume."
      priorityScore: 74

  moduleDecisions:
    - moduleId: "POWER"
      selected: true
      role: "PRIMARY"
      purpose: "Develop rapid rotational force."
      reason: "Highest-priority adaptation."
      modulePriorityScore: 91

    - moduleId: "CONDITIONING"
      selected: false
      reason: "Excluded to preserve Power quality and recovery."

  exerciseDecisions:
    - exerciseId: "rotational_medicine_ball_throw"
      exerciseName: "Rotational Medicine-Ball Throw"
      selected: true
      moduleId: "POWER"
      finalSuitabilityScore: 92
      confidence: "HIGH"
      reason: "Best rotational Power option with low fatigue."

    - exerciseId: "landmine_push_press"
      exerciseName: "Landmine Push Press"
      selected: false
      moduleId: "POWER"
      reason: "Landmine equipment was not confirmed."

  mainConflicts:
    - conflictType: "UPPER_BODY_LOCAL_FATIGUE"
      level: "MODERATE"
      affectedElements:
        - "Explosive heavy-bag strikes"
        - "Bench press"
      protectedPriority: "Power quality and combat readiness"
      resolution: "Bench-press volume reduced."

  mainAdjustments:
    - adjustmentType: "VOLUME_REDUCTION"
      originalPlan: "Bench press: 4 sets"
      finalPlan: "Bench press: 3 sets"
      reason: "Limit shoulder and triceps fatigue."
      tradeOff: "Slightly lower Strength-maintenance volume."

  estimatedSessionLoad: "Moderate neural and muscular load with low metabolic fatigue."
  estimatedRecovery: "Approximately 24 to 36 hours."

  validationSummary: "Valid with one non-blocking shoulder-monitoring warning."
  confidenceSummary: "High overall Confidence; bag impact output is not instrumented."

  reviewPoints:
    - "Monitor right-shoulder response."
    - "Record next-day soreness."
    - "Check quality of the next combat session."

pipelineTrace:
  completedStageCount: 19
  warningStageCount: 2
  failedStageCount: 0
  backtrackingOccurred: true
  backtrackingCount: 1
  maximumBacktrackingLimit: 5

  stages:
    - stageId: "stage_001"
      stageName: "INPUT_VALIDATION"
      order: 1
      startedAt: "2026-07-15T07:15:00+02:00"
      completedAt: "2026-07-15T07:15:02+02:00"
      status: "SUCCESS"
      inputReferences:
        - "EngineInput"
      outputReferences:
        - "InputValidationResult"
      rulesEvaluated:
        - "INPUT_SCHEMA_REQUIRED_FIELDS_001"
        - "INPUT_SCHEMA_PAIN_CONSISTENCY_001"
      warnings: []
      errors: []
      decisionEventIds:
        - "event_001"
      nextStage: "ATHLETE_STATE_EVALUATION"

    - stageId: "stage_002"
      stageName: "ATHLETE_STATE_EVALUATION"
      order: 2
      startedAt: "2026-07-15T07:15:02+02:00"
      completedAt: "2026-07-15T07:15:05+02:00"
      status: "SUCCESS_WITH_WARNINGS"
      inputReferences:
        - "athleteState"
      outputReferences:
        - "evaluatedAthleteState"
      rulesEvaluated:
        - "READINESS_GENERAL_001"
        - "READINESS_SHOULDER_001"
      warnings:
        - "Low right-shoulder soreness requires monitoring."
      errors: []
      decisionEventIds:
        - "event_002"
        - "event_003"
      nextStage: "CONSTRAINT_EXTRACTION"

decisionEvents:
  - eventId: "event_001"
    sequence: 1
    timestamp: "2026-07-15T07:15:02+02:00"
    stage: "INPUT_VALIDATION"
    eventType: "INPUT_ACCEPTED"
    subjectType: "INPUT"
    decision: "Accept Engine Input."
    rationale: "All required fields are valid and critical safety data are available."
    inputEvidence:
      - sourceType: "ENGINE_INPUT"
        reference: "EngineInput"
        valueSummary: "Complete required input"
    rulesApplied:
      - ruleId: "INPUT_SCHEMA_REQUIRED_FIELDS_001"
        ruleVersion: "0.1"
        ruleSystem: "INPUT_SCHEMA"
        result: "PASSED"
        effect: "Input may enter the pipeline."
    confidence: "HIGH"
    result: "ACCEPTED"

  - eventId: "event_004"
    sequence: 4
    timestamp: "2026-07-15T07:15:12+02:00"
    stage: "OBJECTIVE_INTERPRETATION"
    eventType: "OBJECTIVE_INTERPRETED"
    subjectType: "OBJECTIVE"
    decision: "Interpret the request as a Power-priority session."
    rationale: "The requested outcome is improved rapid striking force expression."
    inputEvidence:
      - sourceType: "ENGINE_INPUT"
        reference: "trainingRequest.primaryObjective"
        valueSummary: "Improve striking power"
      - sourceType: "ENGINE_INPUT"
        reference: "trainingCycle.adaptationPriorities"
        valueSummary: "Power = PRIMARY"
    rulesApplied:
      - ruleId: "OBJECTIVE_POWER_001"
        ruleVersion: "0.1"
        ruleSystem: "SESSION_PIPELINE"
        result: "TRIGGERED"
        effect: "Primary Adaptation Domain set to POWER."
    confidence: "HIGH"
    result: "ACCEPTED"

  - eventId: "event_009"
    sequence: 9
    timestamp: "2026-07-15T07:15:35+02:00"
    stage: "EXERCISE_ELIGIBILITY_FILTERING"
    eventType: "CANDIDATE_EXCLUDED"
    subjectType: "EXERCISE"
    subjectId: "landmine_push_press"
    subjectName: "Landmine Push Press"
    decision: "Exclude candidate."
    rationale: "The required landmine attachment was not confirmed."
    inputEvidence:
      - sourceType: "ENGINE_INPUT"
        reference: "equipmentContext.availableEquipment"
        valueSummary: "No confirmed landmine attachment"
    rulesApplied:
      - ruleId: "EQUIPMENT_ELIGIBILITY_001"
        ruleVersion: "0.1"
        ruleSystem: "EXERCISE_SELECTION"
        result: "FAILED"
        effect: "Candidate becomes ineligible."
    confidence: "HIGH"
    result: "REJECTED"

  - eventId: "event_014"
    sequence: 14
    timestamp: "2026-07-15T07:15:55+02:00"
    stage: "CONFLICT_DETECTION"
    eventType: "CONFLICT_DETECTED"
    subjectType: "CONFLICT"
    subjectId: "conflict_001"
    decision: "Detect moderate upper-body local-fatigue conflict."
    rationale: "Heavy-bag Power work and bench-press volume overlap in shoulder and triceps demand."
    inputEvidence:
      - sourceType: "SCORING_RESULT"
        reference: "explosive_heavy_bag_single_strike"
      - sourceType: "SCORING_RESULT"
        reference: "bench_press"
      - sourceType: "ENGINE_INPUT"
        reference: "athleteState.soreness[SHOULDER_RIGHT]"
    rulesApplied:
      - ruleId: "STRIKING_PRESSING_CONFLICT_001"
        ruleVersion: "0.1"
        ruleSystem: "CONFLICT"
        result: "TRIGGERED"
        effect: "Conflict resolution required."
    conflictReference: "conflict_001"
    confidence: "HIGH"
    result: "ACCEPTED"

  - eventId: "event_015"
    sequence: 15
    timestamp: "2026-07-15T07:15:58+02:00"
    stage: "CONFLICT_RESOLUTION"
    eventType: "VOLUME_REDUCED"
    subjectType: "PRESCRIPTION"
    subjectId: "bench_press_prescription"
    subjectName: "Bench Press"
    decision: "Reduce bench-press volume from four sets to three."
    rationale: "Preserve Power quality and combat readiness while retaining Strength maintenance."
    inputEvidence:
      - sourceType: "CONFLICT_RESULT"
        reference: "conflict_001"
    rulesApplied:
      - ruleId: "MINIMAL_EFFECTIVE_CONFLICT_RESOLUTION_001"
        ruleVersion: "0.1"
        ruleSystem: "CONFLICT"
        result: "TRIGGERED"
        effect: "Reduce lower-priority volume before removing the Strength module."
    confidence: "HIGH"
    result: "MODIFIED"

conflictTrace:
  totalConflictCount: 1
  minorConflictCount: 0
  moderateConflictCount: 1
  majorConflictCount: 0
  criticalConflictCount: 0
  unresolvedConflictCount: 0

  conflicts:
    - conflictId: "conflict_001"
      detectedAtStage: "CONFLICT_DETECTION"
      type: "UPPER_BODY_LOCAL_FATIGUE"
      scope: "SESSION"
      level: "MODERATE"
      probability: 4
      consequence: 3
      exposure: 3
      conflictScore: 36

      affectedElements:
        - elementType: "EXERCISE"
          elementId: "explosive_heavy_bag_single_strike"
          elementName: "Explosive Heavy-Bag Single Strike"

        - elementType: "EXERCISE"
          elementId: "bench_press"
          elementName: "Bench Press"

      evidence:
        - sourceType: "ENGINE_INPUT"
          reference: "athleteState.soreness[SHOULDER_RIGHT]"
          valueSummary: "Low soreness"

      protectedPriority: "Power quality and combat-practice readiness"
      lowerPriorityCost: "One set of bench-press maintenance volume"

      resolutionStatus: "RESOLVED"

      resolution:
        action: "REDUCE_VOLUME"
        originalPlan: "Bench Press: 4 sets"
        adjustedPlan: "Bench Press: 3 sets"
        reason: "Reduce shoulder and triceps fatigue."
        expectedTradeOff: "Slightly reduced Strength-maintenance volume."
        affectedDecisionEventIds:
          - "event_015"
        recalculationRequired: true
        recalculationCompleted: true
        result: "RESOLVED"

      ruleReferences:
        - ruleId: "STRIKING_PRESSING_CONFLICT_001"
          ruleVersion: "0.1"
          ruleSystem: "CONFLICT"
          result: "TRIGGERED"
          effect: "Upper-body overlap requires adjustment."

adjustmentTrace:
  objectiveAdjustmentCount: 0
  moduleAdjustmentCount: 0
  exerciseAdjustmentCount: 0
  prescriptionAdjustmentCount: 1
  substitutionCount: 0

  adjustments:
    - adjustmentId: "adjustment_001"
      type: "VOLUME_REDUCED"
      stage: "CONFLICT_RESOLUTION"
      originalValue: 4
      adjustedValue: 3
      reason: "Limit shoulder and triceps fatigue."
      protectedPriority: "Power quality and combat readiness"
      triggeringConflictId: "conflict_001"
      ruleReferences:
        - ruleId: "MINIMAL_EFFECTIVE_CONFLICT_RESOLUTION_001"
          ruleVersion: "0.1"
          ruleSystem: "CONFLICT"
          result: "TRIGGERED"
          effect: "Reduce lower-priority volume."
      objectivePreserved: true
      primaryAdaptationPreserved: true
      modulePreserved: true
      tradeOff: "Reduced Strength-maintenance volume."

validationTrace:
  validationStatus: "VALID_WITH_WARNINGS"
  validatedAt: "2026-07-15T07:16:20+02:00"
  validationRulesVersion: "0.1"

  rulesChecked:
    - ruleId: "VALIDATION_PRIMARY_ADAPTATION_001"
      ruleVersion: "0.1"
      category: "OBJECTIVE"
      result: "PASSED"
      checkedValues:
        - "POWER"

    - ruleId: "VALIDATION_DURATION_001"
      ruleVersion: "0.1"
      category: "DURATION"
      result: "PASSED"
      checkedValues:
        - "Estimated duration = 58"
        - "Available duration = 60"

    - ruleId: "VALIDATION_SHOULDER_WARNING_001"
      ruleVersion: "0.1"
      category: "READINESS"
      result: "PASSED"
      checkedValues:
        - "Shoulder soreness = LOW"
      message: "Non-blocking monitoring warning added."

  blockingErrors: []

  warnings:
    - issueId: "validation_warning_001"
      ruleId: "VALIDATION_SHOULDER_WARNING_001"
      severity: "WARNING"
      message: "Monitor right-shoulder soreness."
      affectedElements:
        - "Explosive Heavy-Bag Single Strike"
        - "Bench Press"
      suggestedResolution: "Stop or reduce upper-body work if symptoms increase."

  recommendations:
    - issueId: "validation_recommendation_001"
      ruleId: "VALIDATION_FEEDBACK_001"
      severity: "RECOMMENDATION"
      message: "Record next-day shoulder response."
      affectedElements:
        - "Session"

assumptions:
  - assumptionId: "assumption_001"
    type: "SAFE_DEFAULT"
    fieldPath: "supervisionContext.mode"
    resultingValue: "UNSUPERVISED"
    reason: "No coach presence was confirmed."
    sourceReferences:
      - "supervisionContext"
    ruleReference: "SAFE_DEFAULT_SUPERVISION_001"
    confidence: "HIGH"
    decisionImpact: "MODERATE"

unresolvedUncertainties:
  - uncertaintyId: "uncertainty_001"
    description: "Heavy-bag impact output is not directly measured."
    affectedDecision: "Heavy-bag Power exercise selection and progression."
    source: "UNMEASURED_OUTPUT"
    confidenceImpact: "MODERATE"
    safetyImpact: "LOW"
    mitigation: "Use technical quality and visible impact consistency as stopping criteria."
    remainsAfterGeneration: true

finalDecision:
  generationStatus: "SESSION_GENERATED_WITH_WARNINGS"

  primaryDecision: "Generate a Power-priority session with controlled Strength-maintenance volume."

  selectedSessionId: "session_2026_07_15_001"

  finalObjective: "Improve rapid striking force expression while maintaining upper-body Strength."
  primaryAdaptation: "POWER"

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
    - "Key combat session in 48 hours"
    - "Unsupervised session"

  mainConflicts:
    - "Upper-body local-fatigue overlap"

  mainResolutions:
    - "Power placed before Strength"
    - "Bench-press volume reduced"
    - "Only one Core exercise retained"

  objectiveChanged: false
  primaryAdaptationPreserved: true

  safeDefaultsUsed: 1
  manualOverridesUsed: 0

  finalValidationStatus: "VALID_WITH_WARNINGS"
  overallConfidence: "HIGH"

  userFacingConclusion: "The session is valid, with reduced pressing volume and shoulder monitoring."

integrity:
  eventCount: 19

  sequenceComplete: true
  timestampsComplete: true
  ruleReferencesComplete: true
  outputReferencesComplete: true

  finalDecisionMatchesOutput: true
  validationMatchesOutput: true

  integrityStatus: "VALID"
  integrityWarnings: []
```

---

# Safe-Failure Trace Example

When no valid session is generated, the Decision Trace must still be complete.

```yaml
finalDecision:
  generationStatus: "NO_VALID_SESSION"

  primaryDecision: "Reject the requested lower-body Power session."

  selectedModules: []
  selectedExercises: []

  mainConstraints:
    - "Acute knee pain"
    - "Pain alters landing control"

  mainConflicts:
    - "Critical safety conflict between pain state and ballistic lower-body work"

  mainResolutions:
    - "All ballistic candidates excluded"
    - "No pain-free Power substitute found"
    - "Recovery alternative proposed"

  objectiveChanged: false
  primaryAdaptationPreserved: false

  safeDefaultsUsed: 0
  manualOverridesUsed: 0

  finalValidationStatus: "INVALID"
  overallConfidence: "HIGH"

  userFacingConclusion: "No lower-body Power session was generated because current symptoms make ballistic work unsafe."
```

A safe-failure trace must identify:

* the blocking stage;
* the blocking evidence;
* the rule that stopped generation;
* attempted resolutions;
* why they failed;
* safe alternatives.

---

# Trace Consistency Rules

---

## Rule 1 — Input and Output Continuity

The trace must use the same:

* `requestId`;
* `athleteId`;
* `outputId`

as the corresponding Engine Input and Engine Output.

---

## Rule 2 — Chronological Sequence

Decision Events must use a continuous chronological sequence.

No event may reference a future event as its parent.

---

## Rule 3 — Pipeline Consistency

A stage marked `SKIPPED` must explain why it was unnecessary.

A later stage must not execute when a blocking earlier-stage failure remains unresolved.

---

## Rule 4 — Candidate Consistency

A selected exercise must:

* have been retrieved;
* have passed eligibility;
* have passed mandatory criteria;
* have been scored or selected by an explicit non-scoring rule;
* have no unresolved blocking conflict.

---

## Rule 5 — Module Consistency

Every selected exercise must belong to a selected canonical Capability Module.

---

## Rule 6 — Objective Consistency

The final primary adaptation in the trace must match:

* the generated session;
* the Engine Output;
* the validation result.

---

## Rule 7 — Conflict Consistency

Every Major or Critical conflict must be:

* resolved;
* or produce an invalid result.

---

## Rule 8 — Adjustment Consistency

Every material difference between the initial and final plan must appear in `adjustmentTrace`.

---

## Rule 9 — Warning Consistency

Warnings in the Engine Output must be supported by:

* evidence;
* rule reference;
* Decision Event or Validation Trace.

---

## Rule 10 — Assumption Consistency

Every material safe default or inference in the Engine Output must appear in the Decision Trace.

---

## Rule 11 — Validation Consistency

The Decision Trace validation status must match the Engine Output validation status.

---

## Rule 12 — Final Decision Consistency

The `finalDecision` record must accurately summarize the detailed trace.

It must not omit a material objective change, blocking issue or manual override.

---

# Trace Validation

The Decision Trace itself must be validated.

Possible results:

```text
VALID
VALID_WITH_WARNINGS
INVALID
```

A trace is invalid when:

* identifiers do not match;
* event sequence is broken;
* material decisions have no rule reference;
* selected exercises have no selection event;
* final output contradicts the trace;
* validation status is inconsistent;
* blocking conflicts are hidden;
* manual overrides are unrecorded.

A valid session should not be released when its trace is structurally invalid.

---

# Performance and Storage

The Technical-Level Trace may be large.

The engine may store:

* a complete structured trace;
* a compact summary in the Engine Output;
* indexed references to detailed scoring records;
* indexed references to candidate lists.

The trace must remain reconstructable.

Compression or storage optimization must not remove material decision information.

---

# Determinism

When deterministic mode is active, the same:

* Engine Input;
* rule versions;
* exercise-library version;
* engine options

should produce the same:

* decision sequence;
* eligibility results;
* scores;
* ranking;
* conflict resolutions;
* final decision.

Trace identifiers and timestamps may differ.

Decision content should remain equivalent.

---

# Relationship With Other Engine Documents

The Decision Trace records the application of:

* `MODULE_ENGINE.md`;
* `SESSION_GENERATION_PIPELINE.md`;
* `14_EXERCISE_SELECTION_RULES.md`;
* `15_SUBSTITUTION_RULES.md`;
* `16_SCORING_MODEL.md`;
* `17_CONFLICT_RULES.md`;
* `19_ENGINE_INPUT_SCHEMA.md`;
* `20_ENGINE_OUTPUT_SCHEMA.md`;
* `22_VALIDATION_RULES.md`.

Those documents define the rules.

The Decision Trace records:

* when they were used;
* which inputs triggered them;
* what results they produced.

---

# Implementation Principle

The implementation should create Decision Events during processing.

It should not attempt to reconstruct them after the final session is built.

Recommended pattern:

```text
receive input
→ create input event

interpret objective
→ create objective event

select module
→ create module event

exclude candidate
→ create eligibility event

score candidate
→ create scoring event

detect conflict
→ create conflict event

resolve conflict
→ create adjustment event

validate session
→ create validation event

return output
→ create final decision event
```

Each pipeline function should return:

* its structured result;
* warnings;
* errors;
* Decision Events.

---

# Definition of Success

The Decision Trace succeeds when it allows an authorized reviewer to determine:

* what the engine knew;
* what the engine did not know;
* what the engine inferred;
* which rules it applied;
* which options it considered;
* why it rejected alternatives;
* how it resolved conflicts;
* whether the final session was valid;
* how confident the engine was;
* whether the Engine Output faithfully represents the decision.

The trace does not succeed merely because it contains a natural-language explanation.

It succeeds only when the decision can be reconstructed from structured evidence.

---

# Final Principle

The Combat Athlete System must never ask the athlete to trust an invisible decision process.

Every important decision must leave a trace.

> The Engine Input records what CAS knew.

> The Decision Trace records what CAS decided.

> The Engine Output records what CAS delivered.
