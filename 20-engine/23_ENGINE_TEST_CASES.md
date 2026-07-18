# ENGINE TEST CASES

Version 0.1

---

# Purpose

The Engine Test Cases define the minimum scenarios required to verify the behaviour of the Combat Athlete System Engine.

Their purpose is to ensure that the engine:

* validates input correctly;
* interprets objectives correctly;
* applies Hard and Soft Constraints correctly;
* prioritizes adaptations correctly;
* selects canonical Capability Modules;
* selects eligible exercises;
* applies the correct scoring profile;
* resolves conflicts deterministically;
* generates complete prescriptions;
* respects duration and load limits;
* protects recovery and combat practice;
* applies substitutions transparently;
* fails safely;
* produces a complete and consistent Decision Trace;
* produces an Engine Output compliant with the Output Schema.

The test suite must verify both:

* expected successful behaviour;
* expected warning behaviour;
* expected safe-failure behaviour;
* expected System Failure behaviour.

---

# Core Principle

> The CAS Engine is valid only when its decisions remain coherent, reproducible, safe and explainable across representative athlete scenarios.

A test does not pass merely because the engine returns a session.

A test passes only when:

* the correct decision hierarchy is respected;
* no Hard Constraint is violated;
* the final objective is coherent;
* the selected modules are canonical;
* every selected exercise is eligible;
* prescriptions are complete;
* conflicts are resolved;
* duration and fatigue limits are respected;
* the output structure is valid;
* the Decision Trace explains the actual decision process.

A session that appears plausible but violates one invariant must fail the test.

---

# Test Suite Scope

The CAS Engine Version 0.1 test suite contains the following categories:

1. Input Validation Tests
2. Athlete-State and Readiness Tests
3. Safety and Medical Tests
4. Objective Interpretation Tests
5. Adaptation Prioritization Tests
6. Capability Module Selection Tests
7. Exercise Eligibility Tests
8. Scoring Tests
9. Conflict Detection Tests
10. Conflict Resolution Tests
11. Session Assembly Tests
12. Prescription Tests
13. Load and Recovery Tests
14. Duration Tests
15. Substitution Tests
16. Progression Tests
17. Engine Output Tests
18. Decision Trace Tests
19. Determinism Tests
20. Backtracking Tests
21. Safe-Failure Tests
22. End-to-End Tests

---

# Test Priorities

```typescript
type TestPriority =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";
```

Interpretation:

| Priority | Meaning                                                 |
| -------- | ------------------------------------------------------- |
| CRITICAL | Failure may allow unsafe or invalid training            |
| HIGH     | Failure compromises core engine coherence               |
| MEDIUM   | Failure reduces quality, explainability or reliability  |
| LOW      | Failure affects optimization or non-essential behaviour |

All `CRITICAL` and `HIGH` tests must pass before a CAS Engine version may be considered releasable.

---

# Test Types

```typescript
type TestType =
  | "UNIT"
  | "INTEGRATION"
  | "END_TO_END"
  | "REGRESSION"
  | "PROPERTY"
  | "SNAPSHOT";
```

---

# Test Categories

```typescript
type TestCategory =
  | "INPUT_VALIDATION"
  | "ATHLETE_STATE"
  | "SAFETY_MEDICAL"
  | "OBJECTIVE_INTERPRETATION"
  | "ADAPTATION_PRIORITY"
  | "MODULE_SELECTION"
  | "EXERCISE_ELIGIBILITY"
  | "SCORING"
  | "CONFLICT_DETECTION"
  | "CONFLICT_RESOLUTION"
  | "SESSION_ASSEMBLY"
  | "PRESCRIPTION"
  | "LOAD_RECOVERY"
  | "DURATION"
  | "SUBSTITUTION"
  | "PROGRESSION"
  | "OUTPUT_SCHEMA"
  | "DECISION_TRACE"
  | "DETERMINISM"
  | "BACKTRACKING"
  | "SAFE_FAILURE"
  | "END_TO_END";
```

---

# Test Case Model

```typescript
interface EngineTestCase {
  testId: string;
  title: string;

  category: TestCategory;
  type: TestType;
  priority: TestPriority;

  purpose: string;

  preconditions?: TestPrecondition[];

  input: EngineInput | PartialEngineInput | InvalidEngineInput;

  expected: ExpectedEngineBehaviour;

  assertions: TestAssertion[];
  forbiddenOutcomes: ForbiddenOutcome[];

  expectedTraceEvents?: ExpectedTraceEvent[];
  expectedValidationIssues?: ExpectedValidationIssue[];

  tags?: string[];
  notes?: string[];
}
```

---

# Test Preconditions

```typescript
interface TestPrecondition {
  description: string;

  requiredVersions?: Partial<EngineVersionSet>;
  requiredExerciseLibraryEntries?: string[];
  requiredScoringProfiles?: string[];
}
```

---

# Expected Engine Behaviour

```typescript
interface ExpectedEngineBehaviour {
  processingStatus?:
    | "COMPLETED"
    | "COMPLETED_WITH_WARNINGS"
    | "FAILED";

  generationStatus:
    | "SESSION_GENERATED"
    | "SESSION_GENERATED_WITH_WARNINGS"
    | "NO_VALID_SESSION"
    | "INPUT_INVALID"
    | "SYSTEM_FAILURE";

  validationStatus:
    | "VALID"
    | "VALID_WITH_WARNINGS"
    | "INVALID";

  primaryAdaptation?: AdaptationDomain;

  expectedModules?: ExpectedModuleResult[];
  excludedModules?: CapabilityModuleId[];

  selectedExercises?: string[];
  excludedExercises?: string[];

  expectedWarnings?: string[];
  expectedBlockingErrors?: string[];

  expectedObjectiveChange?: boolean;
  expectedBacktracking?: boolean;

  expectedMaximumDurationMinutes?: number;
  expectedConfidence?: ConfidenceLevel;
}
```

---

# Expected Module Result

```typescript
interface ExpectedModuleResult {
  moduleId: CapabilityModuleId;

  selected: boolean;

  role?:
    | "PRIMARY"
    | "SECONDARY"
    | "MAINTENANCE"
    | "SUPPORT";

  requiredExerciseCountMinimum?: number;
  requiredExerciseCountMaximum?: number;
}
```

---

# Test Assertion

```typescript
interface TestAssertion {
  assertionId: string;

  target:
    | "INPUT_VALIDATION"
    | "PROCESSING_STATUS"
    | "GENERATION_STATUS"
    | "OBJECTIVE"
    | "ADAPTATION"
    | "MODULE"
    | "EXERCISE"
    | "SCORING"
    | "CONFLICT"
    | "PRESCRIPTION"
    | "LOAD"
    | "DURATION"
    | "OUTPUT"
    | "TRACE";

  operator:
    | "EQUALS"
    | "NOT_EQUALS"
    | "CONTAINS"
    | "NOT_CONTAINS"
    | "EXISTS"
    | "NOT_EXISTS"
    | "GREATER_THAN"
    | "GREATER_THAN_OR_EQUAL"
    | "LESS_THAN"
    | "LESS_THAN_OR_EQUAL"
    | "MATCHES"
    | "ALL_MATCH"
    | "NONE_MATCH";

  path: string;
  expectedValue?: unknown;

  message: string;
}
```

---

# Forbidden Outcome

```typescript
interface ForbiddenOutcome {
  code: string;
  description: string;
}
```

Examples:

```yaml
code: "SELECT_INELIGIBLE_EXERCISE"
description: "An exercise excluded by a Hard Constraint appears in the final session."
```

```yaml
code: "HIDDEN_OBJECTIVE_CHANGE"
description: "The final objective differs from the request without explicit trace."
```

---

# Expected Trace Event

```typescript
interface ExpectedTraceEvent {
  eventType: DecisionEventType;

  subjectId?: string;
  result?: string;

  ruleId?: string;
  rationaleContains?: string;
}
```

---

# Expected Validation Issue

```typescript
interface ExpectedValidationIssue {
  code: string;

  severity:
    | "BLOCKING"
    | "WARNING"
    | "RECOMMENDATION";

  affectedElement?: string;
}
```

---

# Test Data Conventions

Unless a test overrides these values, the default valid athlete input is:

```yaml
schemaVersion: "0.1"
requestId: "test_request_default"
generatedAt: "2026-07-15T08:00:00+02:00"
timezone: "Europe/Paris"

athleteProfile:
  athleteId: "test_athlete_001"
  profileVersion: "0.1"
  ageYears: 30
  bodyMassKg: 80
  primarySport: "KRAV_MAGA"
  combatLevel: "INTERMEDIATE"
  physicalTrainingLevel: "INTERMEDIATE"
  trainingAgeYears: 3
  combatTrainingAgeYears: 2

athleteState:
  assessedAt: "2026-07-15T07:55:00+02:00"

  generalReadiness:
    level: "GOOD"
    score: 75
    confidence: "HIGH"
    source: "ATHLETE_SELF_REPORT"

  neuralReadiness:
    level: "GOOD"
    score: 75
    confidence: "MODERATE"
    source: "ENGINE_INFERENCE"

  muscularReadiness:
    level: "GOOD"
    score: 72
    confidence: "HIGH"
    source: "ATHLETE_SELF_REPORT"

  connectiveTissueReadiness:
    level: "GOOD"
    score: 75
    confidence: "MODERATE"
    source: "ATHLETE_SELF_REPORT"

  metabolicReadiness:
    level: "GOOD"
    score: 76
    confidence: "MODERATE"
    source: "ATHLETE_SELF_REPORT"

  sleep:
    durationHours: 7.5
    quality: "GOOD"
    subjectiveRestoration: "GOOD"
    source: "ATHLETE_SELF_REPORT"
    confidence: "HIGH"

  energy:
    score: 7
    level: "HIGH"
    source: "ATHLETE_SELF_REPORT"
    confidence: "HIGH"

  motivation:
    score: 7
    level: "HIGH"
    source: "ATHLETE_SELF_REPORT"
    confidence: "HIGH"

  psychologicalStress:
    score: 3
    level: "LOW"
    source: "ATHLETE_SELF_REPORT"
    confidence: "MODERATE"

  soreness: []

  illness:
    status: "NONE"

trainingRequest:
  requestedAt: "2026-07-15T08:00:00+02:00"
  requestedSessionDate: "2026-07-15"
  durationMinutes: 60

  primaryObjective:
    description: "Improve maximum strength"
    targetAdaptation: "MAXIMUM_STRENGTH"
    priority: "PRIMARY"
    source: "ATHLETE_SELF_REPORT"

  requestedSessionType: "DEVELOPMENT"

  desiredIntensity:
    mode: "AUTO"

  requestSource: "ATHLETE_SELF_REPORT"

equipmentContext:
  assessedAt: "2026-07-15T07:56:00+02:00"
  source: "ATHLETE_SELF_REPORT"

  availableEquipment:
    - type: "BODYWEIGHT"
      available: true
      functional: true

    - type: "BARBELL"
      available: true
      functional: true
      maximumLoadKg: 200

    - type: "PLATES"
      available: true
      functional: true

    - type: "RACK"
      available: true
      functional: true

    - type: "SAFETY_ARMS"
      available: true
      functional: true

    - type: "BENCH"
      available: true
      functional: true

    - type: "DUMBBELLS"
      available: true
      functional: true

    - type: "PULL_UP_BAR"
      available: true
      functional: true

    - type: "MEDICINE_BALL"
      available: true
      functional: true

    - type: "HEAVY_BAG"
      available: true
      functional: true

environmentContext:
  environmentType: "COMBAT_GYM"
  availableSpace: "LARGE"
  floorSafe: true
  ceilingHeightAdequate: true
  lightingAdequate: true
  crowding: "LOW"
  noiseRestrictions: false
  environmentalHazards: []

supervisionContext:
  mode: "UNSUPERVISED"
  spottingAvailable: false
  emergencySupportAvailable: true

medicalContext:
  medicalClearanceStatus: "CLEARED"
  activeRestrictions: []

painContext:
  assessedAt: "2026-07-15T07:55:00+02:00"
  painStatusKnown: true
  currentPain: []
  neurologicalSymptomsPresent: false
  instabilityPresent: false
  source: "ATHLETE_SELF_REPORT"

dataProvenance:
  - fieldPath: "trainingRequest.primaryObjective"
    source: "ATHLETE_SELF_REPORT"
    quality: "MODERATE"
    confidence: "HIGH"
    recordedAt: "2026-07-15T08:00:00+02:00"

  - fieldPath: "athleteState.generalReadiness"
    source: "ATHLETE_SELF_REPORT"
    quality: "MODERATE"
    confidence: "HIGH"
    recordedAt: "2026-07-15T07:55:00+02:00"

  - fieldPath: "painContext.currentPain"
    source: "ATHLETE_SELF_REPORT"
    quality: "MODERATE"
    confidence: "HIGH"
    recordedAt: "2026-07-15T07:55:00+02:00"

  - fieldPath: "equipmentContext.availableEquipment"
    source: "ATHLETE_SELF_REPORT"
    quality: "MODERATE"
    confidence: "HIGH"
    recordedAt: "2026-07-15T07:56:00+02:00"

engineOptions:
  deterministicMode: true
  allowSafeDefaults: true
  allowRecoveryFallback: true
  allowObjectiveReduction: true
  includeAlternativeExercises: true
  includeDetailedDecisionTrace: true
  maximumAlternativeCount: 3
  maximumBacktrackingIterations: 5
  manualReviewAvailable: false
```

Individual tests may use partial overrides of this default fixture.

---

# Global Assertions

The following assertions should be applied to every successful generated session.

```text
GLOBAL-001
Engine Output schema is valid.

GLOBAL-002
Generation Status and Result Type are consistent.

GLOBAL-003
Exactly one primary Adaptation Domain is selected.

GLOBAL-004
All selected Capability Modules are canonical.

GLOBAL-005
Every selected exercise is eligible.

GLOBAL-006
Every selected exercise passes mandatory criteria.

GLOBAL-007
Every selected exercise has an explicit purpose.

GLOBAL-008
Every selected exercise has a complete prescription.

GLOBAL-009
No unresolved Major or Critical conflict remains.

GLOBAL-010
Estimated duration does not exceed available duration.

GLOBAL-011
All four fatigue dimensions are estimated.

GLOBAL-012
Validation status is VALID or VALID_WITH_WARNINGS.

GLOBAL-013
Decision Trace exists.

GLOBAL-014
Decision Trace final decision matches Engine Output.

GLOBAL-015
Every material assumption is recorded.

GLOBAL-016
No Blocking Warning exists in a generated session.

GLOBAL-017
The primary objective is protected.

GLOBAL-018
The session does not optimize fatigue as an objective.
```

---

# Category 1 — Input Validation Tests

---

## TEST INPUT-001 — Valid Minimum Input

```yaml
testId: "INPUT-001"
title: "Accept a minimum valid low-risk input"
category: "INPUT_VALIDATION"
type: "INTEGRATION"
priority: "CRITICAL"
```

Purpose:

Verify that the engine accepts a structurally valid minimum input.

Expected:

```text
processingStatus = COMPLETED or COMPLETED_WITH_WARNINGS
generationStatus = SESSION_GENERATED or SESSION_GENERATED_WITH_WARNINGS
validation.status ≠ INVALID
```

Assertions:

* required identifiers are preserved;
* the pipeline reaches Objective Interpretation;
* no missing-input Blocking Error is produced.

Forbidden outcomes:

* `INPUT_INVALID`;
* silent insertion of medical clearance;
* silent assumption of no pain.

---

## TEST INPUT-002 — Missing Athlete Identifier

Input modification:

```yaml
athleteProfile:
  athleteId: ""
```

Expected:

```text
generationStatus = INPUT_INVALID
validation.status = INVALID
```

Expected issue:

```text
INVALID_ATHLETE_IDENTIFIER
```

Forbidden:

* session generation;
* automatic replacement of the identifier.

---

## TEST INPUT-003 — Missing Primary Objective

Input modification:

```yaml
trainingRequest:
  primaryObjective: null
```

Expected:

```text
generationStatus = INPUT_INVALID
```

Expected issue:

```text
MISSING_OR_MULTIPLE_PRIMARY_OBJECTIVES
```

---

## TEST INPUT-004 — Invalid Duration

Input modification:

```yaml
trainingRequest:
  durationMinutes: 0
```

Expected:

```text
generationStatus = INPUT_INVALID
validation.status = INVALID
```

Expected issue:

```text
INVALID_SESSION_DURATION
```

---

## TEST INPUT-005 — Unsupported Schema Version

Input modification:

```yaml
schemaVersion: "9.9"
```

Expected issue:

```text
UNSUPPORTED_INPUT_SCHEMA_VERSION
```

Expected generation status:

```text
INPUT_INVALID
```

---

## TEST INPUT-006 — Contradictory Pain Input

Input modification:

```yaml
painContext:
  painStatusKnown: true
  currentPain:
    - region: "KNEE_RIGHT"
      severity: "SEVERE"
      behaviour: "WORSENING"
      altersTechnique: true
```

while another input explicitly states:

```text
no_current_pain = true
```

Expected:

```text
CONTRADICTORY_CRITICAL_INPUT
```

The contradiction must not be resolved silently.

---

# Category 2 — Athlete-State and Readiness Tests

---

## TEST STATE-001 — Good Readiness Preserves Development Objective

Input:

* good general readiness;
* no pain;
* no meaningful soreness;
* sufficient recovery.

Expected:

* requested development objective preserved;
* no unnecessary intensity reduction;
* no Recovery fallback.

---

## TEST STATE-002 — Very Low General Readiness

Input modification:

```yaml
athleteState:
  generalReadiness:
    level: "VERY_LOW"
    score: 20
```

Request:

```text
Maximum Strength development
```

Expected:

* normal high-intensity development session not generated;
* objective reduced, Recovery fallback generated, or `NO_VALID_SESSION`;
* Decision Trace explains the readiness conflict.

Forbidden:

* maximal loading;
* failure work;
* unchanged development prescription.

---

## TEST STATE-003 — Low Shoulder Readiness Is Region-Specific

Input modification:

```yaml
athleteState:
  regionalReadiness:
    - region: "SHOULDER_RIGHT"
      readiness:
        level: "LOW"
        score: 35
```

Request:

```text
Lower-body aerobic Conditioning
```

Expected:

* shoulder readiness does not invalidate all lower-body Conditioning candidates;
* no inappropriate global readiness penalty;
* upper-body demanding candidates may be excluded.

---

## TEST STATE-004 — Poor Sleep Reduces High-Risk Power

Input:

* sleep duration: 4 hours;
* poor sleep quality;
* Power request involving high-impact plyometrics.

Expected:

* high-impact candidates reduced, substituted or excluded;
* low-risk Power or Movement alternative may be selected;
* Warning or Blocking issue recorded according to demand.

Forbidden:

* unchanged high-impact maximal prescription;
* no Decision Trace event.

---

# Category 3 — Safety and Medical Tests

---

## TEST SAFETY-001 — Pain Alters Technique

Input:

```yaml
painContext:
  painStatusKnown: true
  currentPain:
    - region: "KNEE_RIGHT"
      severity: "MODERATE"
      behaviour: "WORSENING"
      altersTechnique: true
```

Request:

```text
Lower-body Power
```

Expected:

* affected ballistic exercises ineligible;
* no selected exercise requires painful landing or jumping;
* session changed or rejected.

Expected issue:

```text
PAIN_ALTERS_TECHNIQUE
```

---

## TEST SAFETY-002 — Neurological Symptoms

Input:

```yaml
painContext:
  neurologicalSymptomsPresent: true
```

Expected:

```text
generationStatus = NO_VALID_SESSION
validation.status = INVALID
```

Expected issue:

```text
NEUROLOGICAL_SYMPTOMS_REPORTED
```

Expected recommendation:

* appropriate professional assessment.

Forbidden:

* normal training prescription;
* diagnostic statement.

---

## TEST SAFETY-003 — Medical Restriction Overrides Request

Input:

```yaml
medicalContext:
  medicalClearanceStatus: "CLEARED_WITH_RESTRICTIONS"
  activeRestrictions:
    - restrictionId: "restriction_001"
      description: "No loaded overhead pressing"
      severity: "HARD"
      prohibitedActivities:
        - "OVERHEAD_PRESSING"
      source: "MEDICAL_INPUT"
```

Request:

```text
Overhead pressing Strength
```

Expected:

* overhead pressing candidates excluded;
* no athlete preference or score overrides restriction;
* alternative Strength implementation may be selected if valid.

---

## TEST SAFETY-004 — Not Medically Cleared

Input:

```yaml
medicalContext:
  medicalClearanceStatus: "NOT_CLEARED"
```

Expected:

```text
generationStatus = NO_VALID_SESSION
validation.status = INVALID
```

Forbidden:

* Recovery session generated automatically without explicit medically authorized mode;
* normal exercise prescription.

---

## TEST SAFETY-005 — Unsafe Floor Blocks Jumping

Input:

```yaml
environmentContext:
  floorSafe: false
```

Request:

```text
Lower-body Power through jumping
```

Expected:

* all jump candidates ineligible;
* throwing, non-impact Power or another valid module implementation may be considered;
* no jumping prescription.

---

# Category 4 — Objective Interpretation Tests

---

## TEST OBJECTIVE-001 — Interpret “Strike Harder”

Request:

```yaml
primaryObjective:
  description: "Strike harder"
```

Expected interpretation:

```text
primaryAdaptation = POWER
```

Possible supported capabilities:

* transmit force;
* rotate;
* accelerate;
* maintain balance.

Forbidden:

* `Specific Skill` as physical Adaptation Domain;
* automatic claim that technical striking is trained.

---

## TEST OBJECTIVE-002 — Interpret “Improve Cardio”

Request:

```text
Improve cardio
```

Additional context:

* repeated fatigue during long combat sessions.

Expected:

* Objective Interpretation produces a precise Conditioning objective;
* energy-system or work-capacity target is stated;
* engine does not select arbitrary exhausting circuits solely from the phrase “cardio”.

---

## TEST OBJECTIVE-003 — Hidden Objective Change Is Forbidden

Request:

```text
Maximum Strength development
```

Athlete State:

* poor readiness;
* competition in 48 hours.

Expected:

* if objective changes to maintenance or Recovery, `objectiveChanged = true`;
* change reason appears in Output and Trace.

Forbidden:

* final maintenance session presented as unchanged Strength development.

---

# Category 5 — Adaptation Prioritization Tests

---

## TEST ADAPTATION-001 — Exactly One Primary Adaptation

Input includes:

* Power objective;
* Strength secondary objective;
* Conditioning tertiary objective.

Expected:

```text
POWER = PRIMARY
MAXIMUM_STRENGTH = SECONDARY or MAINTENANCE
CONDITIONING = SUPPORT or EXCLUDED
```

Forbidden:

* several adaptations marked `PRIMARY`.

---

## TEST ADAPTATION-002 — Lower Priorities Removed First

Input:

* 35-minute duration;
* primary Power;
* secondary Strength;
* tertiary Core;
* optional Conditioning.

Expected:

* Conditioning removed before Power;
* Core may be reduced;
* Power receives sufficient time and rest.

---

## TEST ADAPTATION-003 — Cycle Priority Influences Session

Training Cycle:

```text
Power = PRIMARY
Strength = MAINTENANCE
Hypertrophy = EXCLUDED
```

Request:

```text
Upper-body session
```

Expected:

* Power prioritized;
* Strength maintained;
* no high-volume Functional Hypertrophy module unless objective is explicitly changed.

---

# Category 6 — Capability Module Selection Tests

---

## TEST MODULE-001 — Canonical Module Only

Engine candidate attempts to create:

```text
BALLISTIC_ROTATIONAL_POWER
```

Expected:

* rejected as non-canonical;
* represented as a purpose or exercise tag inside `POWER`.

Expected issue:

```text
NON_CANONICAL_MODULE
```

---

## TEST MODULE-002 — Specific Skill Is Not a Module

Request:

```text
Improve boxing technique
```

Expected:

* engine states that Specific Skill practice is external;
* it may generate supporting physical preparation only if objective can be interpreted safely;
* no `SPECIFIC_SKILL` Capability Module.

---

## TEST MODULE-003 — Core Classified as Movement

Request:

```text
Improve trunk force transmission
```

Expected:

* `CORE` module selected;
* primary Adaptation Domain for Core remains `MOVEMENT`;
* exercise purpose describes force transmission or trunk control.

---

## TEST MODULE-004 — Recovery Module Does Not Become Conditioning

Request:

```text
Recovery session
```

Expected:

* `RECOVERY` primary or principal module;
* low physiological cost;
* no high-intensity intervals;
* session finishes within Recovery constraints.

---

# Category 7 — Exercise Eligibility Tests

---

## TEST ELIGIBILITY-001 — Unavailable Equipment

Candidate:

```text
Weighted Pull-Up
```

Input:

```text
Pull-up bar unavailable
```

Expected:

* candidate ineligible;
* no final suitability score;
* substitute candidates retrieved.

Forbidden:

* weighted pull-up selected;
* equipment absence represented only as a small penalty.

---

## TEST ELIGIBILITY-002 — Non-Functional Equipment

Input:

```yaml
equipment:
  type: "BENCH"
  available: true
  functional: false
```

Expected:

* bench treated as unavailable;
* bench-dependent exercises excluded.

---

## TEST ELIGIBILITY-003 — Technical Level Too Low

Candidate:

```text
Depth Jump
```

Athlete:

```text
Beginner plyometric experience
```

Expected:

* Depth Jump ineligible or regressed;
* low-impact landing drill or jump regression may be considered.

---

## TEST ELIGIBILITY-004 — Exercise Fits Equipment but Not Module

Candidate:

```text
High-repetition slow medicine-ball circuit
```

Selected module:

```text
POWER
```

Expected:

* candidate rejected for Module mismatch or rescored under Conditioning;
* not selected as Power.

---

# Category 8 — Scoring Tests

---

## TEST SCORING-001 — Hard Filter Before Score

Candidate has:

* strong adaptation match;
* severe pain incompatibility.

Expected:

```text
eligibility = INELIGIBLE
finalScore = NOT_APPLICABLE
```

Forbidden:

* high average score;
* rank among eligible candidates.

---

## TEST SCORING-002 — Correct Exercise Selection Profile

Selected module:

```text
POWER
```

Expected scoring emphasis:

* Primary Adaptation Match;
* Module Match;
* Velocity Profile;
* technical feasibility;
* neural readiness;
* low technical fatigue.

Forbidden:

* Functional Hypertrophy profile used.

---

## TEST SCORING-003 — Confidence Does Not Change Score

Candidate:

```text
Base Suitability Score = 85
Final contextual score = 83
Confidence = LOW
```

Expected:

```text
Final Suitability Score = 83
Confidence = LOW
```

Forbidden:

```text
83 × confidence factor
```

---

## TEST SCORING-004 — Modifier Limits

Input designed to create many positive modifiers.

Expected:

```text
Total Positive Modifier ≤ +5
```

Input designed to create many negative modifiers.

Expected:

```text
Total Negative Modifier ≥ -15
```

If more reduction appears necessary, eligibility or constraint classification must be reviewed.

---

## TEST SCORING-005 — Tie Break

Two valid candidates differ by fewer than three points.

Expected tie-break order begins with:

1. Safety;
2. Primary Adaptation Match;
3. Technical Feasibility;
4. Athlete Compatibility;
5. Recovery Compatibility.

Decision Trace must identify the applied tie-break rule.

---

## TEST SCORING-006 — Preference Cannot Override Adaptation

Athlete prefers Exercise A.

Exercise A:

* lower Primary Adaptation Match;
* higher fatigue;
* score 68.

Exercise B:

* strong match;
* score 86.

Expected:

* Exercise B selected;
* preference may be mentioned but does not reverse ranking.

---

# Category 9 — Conflict Detection Tests

---

## TEST CONFLICT-001 — Power and Exhaustive Conditioning

Session includes:

* Power block;
* exhaustive Conditioning before Power.

Expected:

* Major or Moderate conflict detected;
* order changed or Conditioning removed;
* Power not performed after avoidable exhaustion.

---

## TEST CONFLICT-002 — Grip Fatigue Before Grappling

Input:

* key grappling session in 12 hours;
* proposed high-volume Grip module.

Expected:

* Combat Practice conflict detected;
* Grip volume reduced, postponed or excluded.

---

## TEST CONFLICT-003 — Pressing Before Striking

Input:

* high-volume pressing;
* hard striking session next day;
* mild shoulder soreness.

Expected:

* upper-body fatigue conflict detected;
* pressing volume reduced or exercise changed;
* shoulder monitoring warning.

---

## TEST CONFLICT-004 — Same-Joint Stress

Selected exercises:

* heavy bench press;
* weighted dips;
* high-volume bag punching.

Expected:

* shoulder and elbow overlap detected;
* redundancy or joint-stress conflict;
* at least one element reduced or removed.

---

## TEST CONFLICT-005 — Recovery-Day Contamination

Requested session:

```text
Recovery
```

Proposed plan includes:

* mobility;
* strength accessories;
* hard bag intervals.

Expected:

* conflict detected;
* hard bag intervals removed;
* final Recovery session remains low cost.

---

# Category 10 — Conflict Resolution Tests

---

## TEST RESOLUTION-001 — Smallest Effective Resolution

Conflict:

* Power and Strength are both valid;
* Strength volume slightly too high.

Expected resolution:

* reduce Strength volume first;
* do not remove the entire Strength module unnecessarily.

---

## TEST RESOLUTION-002 — Recalculate After Resolution

Initial duration:

```text
68 minutes
```

Available duration:

```text
60 minutes
```

Resolution:

* remove optional accessory.

Expected:

* duration recalculated;
* final duration no more than 60;
* Decision Trace records the recalculation.

---

## TEST RESOLUTION-003 — Critical Conflict Stops Generation

Conflict:

* severe worsening knee pain;
* requested ballistic lower-body Power.

Expected:

* no penalty-only resolution;
* affected work excluded;
* `NO_VALID_SESSION` or safe alternative.

---

## TEST RESOLUTION-004 — Objective Change Is Explicit

Initial objective:

```text
Power development
```

Resolution:

```text
Movement and Recovery
```

Expected:

* objective change event;
* primary adaptation changes explicitly;
* final output does not claim equivalent Power stimulus.

---

# Category 11 — Session Assembly Tests

---

## TEST ASSEMBLY-001 — Canonical Relative Order

Selected modules:

* Preparation;
* Power;
* Strength;
* Core;
* Recovery.

Expected order:

```text
Preparation
Power
Strength
Core
Recovery
```

---

## TEST ASSEMBLY-002 — Only Selected Modules Appear

Selected modules:

* Preparation;
* Strength;
* Recovery.

Expected:

* no automatic Movement, Power, Hypertrophy, Grip or Conditioning phase;
* session contains only justified modules.

---

## TEST ASSEMBLY-003 — Primary Module Receives Priority

Input:

* Power primary;
* 40-minute session.

Expected:

* Power receives appropriate preparation and sufficient rest;
* secondary work reduced first.

---

## TEST ASSEMBLY-004 — Unexplained Order Deviation

Final order:

```text
Conditioning
Power
Strength
```

No special objective.

Expected:

* validation Blocking Error or regeneration;
* Power must not remain after exhaustive Conditioning.

---

# Category 12 — Prescription Tests

---

## TEST PRESCRIPTION-001 — Complete Strength Prescription

Selected exercise:

```text
Bench Press
```

Expected fields:

* sets;
* repetitions;
* load, RPE, RIR or percentage;
* rest;
* stopping criterion;
* purpose.

Forbidden:

```text
Bench Press — 4 sets
```

---

## TEST PRESCRIPTION-002 — Complete Power Prescription

Selected exercise:

```text
Rotational Medicine-Ball Throw
```

Expected fields:

* sets;
* repetitions per side;
* implement mass or safe selection rule;
* maximal intent;
* sufficient rest;
* velocity or quality stopping criteria.

---

## TEST PRESCRIPTION-003 — Complete Conditioning Prescription

Selected method:

```text
Heavy-Bag Conditioning
```

Expected fields:

* rounds;
* work time;
* rest time;
* target intensity;
* technical sustainability;
* stopping criteria.

---

## TEST PRESCRIPTION-004 — Power Must Not Use Failure

Power prescription includes:

```text
Perform repetitions until muscular failure
```

Expected:

* validation failure;
* prescription regenerated.

---

## TEST PRESCRIPTION-005 — Unsupported Exact Load

No recent performance data.

Output prescribes:

```text
Bench Press at exactly 92.5 kg
```

Expected:

* Warning or Blocking Error depending on risk;
* RPE, RIR or estimated range preferred.

---

# Category 13 — Load and Recovery Tests

---

## TEST LOAD-001 — Four Fatigue Dimensions Present

Generated session must estimate:

* Neural Fatigue;
* Muscular Fatigue;
* Connective Tissue Stress;
* Metabolic Fatigue.

Missing one dimension:

```text
validation.status = INVALID
```

---

## TEST LOAD-002 — Session Budget Exceeded

Initial plan:

* Power;
* heavy Strength;
* high-volume Hypertrophy;
* hard Conditioning.

Athlete readiness:

```text
MODERATE
```

Expected:

* load overflow detected;
* lower-priority work removed;
* unchanged plan forbidden.

---

## TEST LOAD-003 — Recovery Window Conflict

Input:

* estimated session recovery: 48 hours;
* key competition in 24 hours.

Expected:

* session invalid or substantially reduced;
* competition readiness protected.

---

## TEST LOAD-004 — Interaction Cost

Exercises:

* Nordic curls;
* maximal sprinting;
* high-volume kicking.

Expected:

* combined hamstring and lower-limb cost greater than simple sum;
* conflict or load adjustment.

---

# Category 14 — Duration Tests

---

## TEST DURATION-001 — Session Fits Exactly

Available:

```text
60 minutes
```

Estimated:

```text
60 minutes
```

Expected:

```text
fitsAvailableDuration = true
```

---

## TEST DURATION-002 — Rest Included

Strength session:

* four heavy sets;
* three-minute rests.

Expected:

* duration estimate includes all rests;
* engine does not calculate only active lifting time.

---

## TEST DURATION-003 — Do Not Shorten Power Rest

Initial session exceeds duration.

Forbidden resolution:

* reduce Power rest from 120 seconds to 20 seconds.

Expected:

* optional volume removed first.

---

## TEST DURATION-004 — Short Session

Input:

```text
duration = 20 minutes
primary objective = Power
```

Expected:

* minimal effective session;
* Preparation + Power;
* optional modules removed;
* complete valid prescription.

---

# Category 15 — Substitution Tests

---

## TEST SUBSTITUTION-001 — Equipment Substitution

Original:

```text
Weighted Pull-Up
```

Constraint:

```text
No Pull-Up Bar
```

Available:

```text
Lat Pulldown
```

Expected:

* Heavy Lat Pulldown may be selected;
* vertical pulling and Strength preserved;
* lost relative-strength specificity recorded.

---

## TEST SUBSTITUTION-002 — Pain-Compatible Substitution

Original:

```text
Back Squat
```

Constraint:

* lumbar discomfort under axial load;
* medical clearance allows belt squat.

Expected:

* Belt Squat may substitute;
* Strength module preserved;
* spinal-loading difference recorded.

---

## TEST SUBSTITUTION-003 — False Substitution

Original:

```text
Weighted Pull-Up for Maximum Strength
```

Proposed substitute:

```text
Light walking
```

Expected:

* rejected as substitution;
* primary adaptation not preserved;
* may be classified only as objective or session modification.

---

## TEST SUBSTITUTION-004 — Substitute Must Be Eligible

Original exercise is unavailable.

Proposed substitute violates pain constraints.

Expected:

* substitute rejected;
* next candidate evaluated;
* no shortcut around eligibility.

---

# Category 16 — Progression Tests

---

## TEST PROGRESSION-001 — Successful Load Progression

Previous exposure:

* all repetitions completed;
* stable technique;
* no pain;
* acceptable recovery;
* RPE below limit.

Expected:

* reasonable load increase may be selected;
* Decision Trace cites previous performance.

---

## TEST PROGRESSION-002 — Repeat After Borderline Performance

Previous exposure:

* target completed;
* final set at excessive RPE;
* technique slightly unstable.

Expected:

```text
next decision = REPEAT or ASSESS
```

Forbidden:

* automatic load increase.

---

## TEST PROGRESSION-003 — Pain Blocks Progression

Previous exposure:

* pain appeared.

Expected:

* no progression;
* repeat, regress or substitute.

---

## TEST PROGRESSION-004 — Multiple Variables

Proposed progression:

* increase load;
* increase sets;
* reduce rest;
* increase range of motion.

Expected:

* validation Warning or Blocking Error;
* one primary progression variable selected unless justified.

---

# Category 17 — Engine Output Tests

---

## TEST OUTPUT-001 — Status Consistency

Expected valid combinations only:

```text
SESSION_GENERATED
+ GENERATED_SESSION
+ VALID
```

```text
SESSION_GENERATED_WITH_WARNINGS
+ GENERATED_SESSION
+ VALID_WITH_WARNINGS
```

```text
NO_VALID_SESSION
+ NO_VALID_SESSION
+ INVALID
```

All other combinations fail.

---

## TEST OUTPUT-002 — No Blocking Warning in Valid Session

Output:

```text
generationStatus = SESSION_GENERATED
```

contains:

```text
warning.severity = BLOCKING
```

Expected:

* Output Validation fails.

---

## TEST OUTPUT-003 — Version Metadata

Expected:

* all required rule versions present;
* Exercise Library version present.

Missing version metadata:

```text
validation.status = INVALID
```

---

## TEST OUTPUT-004 — Assumption Visibility

Input lacks supervision information.

Safe default:

```text
UNSUPERVISED
```

Expected:

* assumption appears in Output;
* assumption appears in Decision Trace.

---

# Category 18 — Decision Trace Tests

---

## TEST TRACE-001 — Selected Exercise Has Full History

Every selected exercise must have:

* candidate retrieval;
* eligibility result;
* scoring or explicit rule selection;
* final selection event.

Missing event causes trace validation failure.

---

## TEST TRACE-002 — High-Ranking Rejection Explained

A candidate ranks second and is within two points of the selected exercise.

Expected:

* reason not selected appears in Technical or Coach Trace.

---

## TEST TRACE-003 — Conflict Resolution Trace

A Moderate conflict is resolved by reducing volume.

Expected Trace:

* Conflict Detected event;
* protected priority;
* original prescription;
* adjusted prescription;
* recalculation;
* resolution status.

---

## TEST TRACE-004 — Final Decision Matches Output

Trace lists:

```text
selected exercise = Front Squat
```

Output lists:

```text
selected exercise = Trap Bar Deadlift
```

Expected:

```text
trace.integrity = INVALID
validation.status = INVALID
```

---

## TEST TRACE-005 — Inference Distinction

Raw input:

```text
sleep = 5 hours
```

Engine infers:

```text
reduced neural readiness
```

Expected:

* raw value and inference remain separate;
* inference rule referenced.

---

# Category 19 — Determinism Tests

---

## TEST DETERMINISM-001 — Identical Input and Versions

Run the engine twice with:

* identical Engine Input;
* identical rule versions;
* identical Exercise Library;
* deterministic mode enabled.

Expected:

* same eligibility decisions;
* same adaptation priorities;
* same modules;
* same scores;
* same selected exercises;
* same conflict resolutions;
* same validation status.

Allowed differences:

* timestamps;
* unique identifiers.

---

## TEST DETERMINISM-002 — Rule Version Change

Same input, but Scoring Model version changes.

Expected:

* result may change;
* version difference recorded;
* no claim of exact deterministic equivalence across versions.

---

## TEST DETERMINISM-003 — Controlled Variation

Several candidates are tied.

Deterministic mode disabled.

Expected:

* variation only among valid candidates inside tie margin;
* safety and primary adaptation unchanged.

---

# Category 20 — Backtracking Tests

---

## TEST BACKTRACK-001 — Exercise Failure Returns to Candidate Retrieval

Selected exercise becomes ineligible after conflict check.

Expected:

```text
backtrack to EXERCISE_CANDIDATE_RETRIEVAL
```

The complete pipeline must not restart unnecessarily.

---

## TEST BACKTRACK-002 — No Valid Exercise Returns to Module Selection

All exercises for one optional module are ineligible.

Expected:

* return to Capability Module Selection;
* optional module removed or replaced;
* primary module preserved.

---

## TEST BACKTRACK-003 — Objective-Level Failure

Requested Power is incompatible with current pain and readiness.

Expected:

* return to Objective Interpretation or Adaptation Priority Calculation;
* objective reduced or generation stopped.

---

## TEST BACKTRACK-004 — Maximum Iterations

Engine repeatedly fails to resolve duration overflow.

Input option:

```text
maximumBacktrackingIterations = 5
```

Expected:

* no sixth backtracking loop;
* `NO_VALID_SESSION` or `SYSTEM_FAILURE`;
* failure type reflects physiological versus technical cause.

---

# Category 21 — Safe-Failure Tests

---

## TEST FAILURE-001 — No Valid Power Exercise

Request:

```text
Lower-body Power
```

Constraints:

* acute bilateral knee pain;
* pain alters jumping, sprinting and loaded lower-body movement;
* no valid pain-free ballistic alternative.

Expected:

```text
generationStatus = NO_VALID_SESSION
```

Expected safe alternatives:

* postpone;
* Recovery or low-intensity Movement only if independently valid;
* professional assessment recommendation when appropriate.

---

## TEST FAILURE-002 — Missing Critical Pain Data

Request:

```text
High-impact plyometric session
```

Input:

```text
painStatusKnown = false
```

Expected:

* high-risk session not generated;
* required information identified.

---

## TEST FAILURE-003 — Unsafe Environment

Request:

```text
Sprint session
```

Environment:

* slippery surface;
* insufficient space.

Expected:

* no sprint session;
* low-risk alternative may be considered;
* safety conflict trace.

---

## TEST FAILURE-004 — System Failure

Exercise Library metadata are corrupted.

Expected:

```text
generationStatus = SYSTEM_FAILURE
```

Forbidden:

* athlete-related explanation;
* invented valid session.

---

# Category 22 — End-to-End Tests

---

## TEST E2E-001 — Standard Strength Session

Athlete:

* good readiness;
* no pain;
* confirmed rack and safety arms;
* Strength development objective;
* 60 minutes.

Expected modules:

* Preparation;
* Strength;
* optional Core or Robustness;
* Recovery when justified.

Expected:

* complete Strength prescription;
* load and duration valid;
* Decision Trace complete.

---

## TEST E2E-002 — Striking Power Session

Athlete:

* Krav Maga;
* intermediate;
* good readiness;
* medicine ball and heavy bag available;
* technical combat session in 48 hours.

Objective:

```text
Improve striking Power
```

Expected primary adaptation:

```text
POWER
```

Expected possible modules:

* Preparation;
* Power;
* Strength Maintenance;
* Core;
* Recovery.

Expected behaviour:

* explosive work first;
* bag work remains low-volume and high-quality;
* no exhaustive Conditioning;
* pressing volume controlled;
* technical limits stated.

---

## TEST E2E-003 — Fatigued Athlete With Recovery Fallback

Athlete:

* very low readiness;
* poor sleep;
* high soreness;
* no acute pain;
* no illness.

Request:

```text
Maximum Strength
```

Expected:

* requested development session rejected or reduced;
* Recovery or Movement fallback may be generated;
* objective change explicit;
* no high-intensity loading.

---

## TEST E2E-004 — No Equipment Travel Session

Athlete:

* travel environment;
* bodyweight only;
* 30 minutes;
* Strength maintenance objective.

Expected:

* only bodyweight-compatible candidates;
* exact adaptation limitations acknowledged;
* no unavailable equipment referenced;
* duration respected.

---

## TEST E2E-005 — Shoulder Pain Before Striking

Athlete:

* mild to moderate shoulder pain;
* pain does not alter lower-body movement;
* key striking session in 24 hours.

Request:

```text
Upper-body Strength
```

Expected:

* painful pressing candidates excluded;
* low-interference alternative or objective change;
* striking readiness protected;
* pain warning visible.

---

## TEST E2E-006 — Grappler With Grip Fatigue

Athlete:

* hard grappling previous evening;
* forearm soreness;
* another grappling session next day.

Request:

```text
Grip Strength
```

Expected:

* Grip development reduced, postponed or replaced;
* Recovery or lower-cost work considered;
* total pulling and grip exposure included.

---

## TEST E2E-007 — Competition Taper

Athlete:

* competition in four days;
* good readiness;
* Power and Strength background.

Expected:

* low volume;
* familiar exercises;
* low soreness;
* high quality;
* no novelty;
* no maximal attempts;
* competition readiness protected.

---

## TEST E2E-008 — Short Mixed Session

Duration:

```text
35 minutes
```

Objective:

```text
Power primary
Strength maintenance
```

Expected:

* Preparation;
* one Power exercise;
* one Strength exercise;
* optional short Recovery;
* no unnecessary accessories;
* full prescription and valid duration.

---

# Property-Based Tests

Property-Based Tests verify invariants across many generated inputs.

---

## PROPERTY-001 — No Ineligible Exercise Is Selected

For every generated valid session:

```text
selected exercise eligibility = ELIGIBLE
```

---

## PROPERTY-002 — Exactly One Primary Adaptation

For every generated session:

```text
count(selected adaptation with role PRIMARY) = 1
```

---

## PROPERTY-003 — All Modules Are Canonical

For every selected module:

```text
module ∈ canonical Capability Module catalog
```

---

## PROPERTY-004 — Duration Is Respected

For every valid generated session:

```text
estimatedDuration ≤ availableDuration
```

---

## PROPERTY-005 — No Blocking Error in Valid Output

For every valid output:

```text
blockingErrorCount = 0
```

---

## PROPERTY-006 — Major Conflicts Are Resolved

For every valid generated session:

```text
unresolved Major conflicts = 0
unresolved Critical conflicts = 0
```

---

## PROPERTY-007 — Output and Trace Agree

For every result:

```text
trace.finalDecision = output.result
trace.validation = output.validation
```

---

## PROPERTY-008 — Hard Constraints Always Win

For every candidate violating a Hard Constraint:

```text
candidate is not selected
```

regardless of score or preference.

---

## PROPERTY-009 — Confidence Is Separate

For every scored candidate:

```text
Final Suitability Score does not include Confidence multiplication
```

---

## PROPERTY-010 — Objective Changes Are Visible

For every result where requested objective differs from final objective:

```text
objectiveChanged = true
changeReason exists
Decision Trace event exists
```

---

# Regression Tests

Every confirmed engine defect must create a permanent regression test.

A Regression Test must include:

* the original failing input;
* the incorrect historical output;
* the corrected expected output;
* the rule or implementation change;
* the engine version where the defect was fixed.

```typescript
interface RegressionTestMetadata {
  defectId: string;
  discoveredAt: ISODateTime;
  fixedInVersion: string;

  originalFailure: string;
  expectedCorrection: string;
}
```

A resolved defect must not be considered complete until its regression test passes.

---

# Snapshot Tests

Snapshot tests may be used for:

* Engine Output structure;
* Decision Trace structure;
* validation summaries;
* deterministic End-to-End outputs.

Snapshots must ignore non-deterministic fields such as:

* generated identifiers;
* timestamps;
* processing duration.

Snapshot tests must not replace semantic assertions.

A structurally identical but physiologically invalid session must still fail.

---

# Test Execution Order

Recommended execution order:

```text
1. Schema and Input Validation
2. Unit Rules
3. Eligibility
4. Scoring
5. Conflict Detection
6. Conflict Resolution
7. Prescription
8. Load and Duration
9. Output Validation
10. Decision Trace Validation
11. Integration Tests
12. End-to-End Tests
13. Property-Based Tests
14. Regression Tests
```

---

# Release Gate

A CAS Engine version may be released only when:

```text
All CRITICAL tests pass
All HIGH tests pass
No known Hard Constraint bypass exists
No known invalid-session delivery exists
No unresolved Trace/Output mismatch exists
```

Recommended release threshold:

```text
CRITICAL pass rate = 100%
HIGH pass rate = 100%
MEDIUM pass rate ≥ 95%
LOW pass rate documented
```

A flaky Critical or High test counts as failed.

---

# Test Result Model

```typescript
interface EngineTestResult {
  testId: string;

  status:
    | "PASSED"
    | "FAILED"
    | "SKIPPED"
    | "ERROR";

  startedAt: ISODateTime;
  completedAt: ISODateTime;

  engineVersions: EngineVersionSet;

  assertionResults: AssertionResult[];

  unexpectedWarnings: string[];
  unexpectedErrors: string[];

  outputReference?: string;
  traceReference?: string;

  notes?: string[];
}
```

---

# Assertion Result

```typescript
interface AssertionResult {
  assertionId: string;

  passed: boolean;

  expected?: unknown;
  actual?: unknown;

  message: string;
}
```

---

# Failure Reporting

A failed test report must identify:

* failing assertion;
* expected value;
* actual value;
* pipeline stage;
* relevant rule;
* Engine Output reference;
* Decision Trace reference;
* reproducibility status.

Example:

```yaml
testId: "CONFLICT-001"
status: "FAILED"

failingAssertion:
  assertionId: "CONFLICT-001-A3"
  expected: "POWER before CONDITIONING"
  actual: "CONDITIONING before POWER"

pipelineStage: "SESSION_ASSEMBLY"
ruleReference: "SESSION-003"

message: "Power was placed after avoidable metabolic fatigue."
```

---

# Test Data Isolation

Tests must not depend on mutable production athlete data.

Each test should use:

* isolated fixtures;
* explicit versions;
* deterministic dates;
* a fixed Exercise Library snapshot;
* a fixed scoring-profile version.

Tests must remain reproducible.

---

# Scientific and Coaching Review

Some test expectations require expert review.

Review is recommended when tests concern:

* competition taper;
* return to training;
* pain-related conservative programming;
* advanced plyometrics;
* heavy-bag Power;
* concurrent Strength and Conditioning;
* combat-practice interference;
* weekly fatigue budgets.

Expert review should not replace executable assertions.

It should validate the rule expectations encoded by the tests.

---

# Minimum V0.1 Test Set

The minimum releasable Version 0.1 suite must include at least:

```text
6 Input Validation tests
4 Athlete-State tests
5 Safety and Medical tests
3 Objective Interpretation tests
3 Adaptation Priority tests
4 Module Selection tests
4 Exercise Eligibility tests
6 Scoring tests
5 Conflict Detection tests
4 Conflict Resolution tests
4 Session Assembly tests
5 Prescription tests
4 Load and Recovery tests
4 Duration tests
4 Substitution tests
4 Progression tests
4 Output Schema tests
5 Decision Trace tests
3 Determinism tests
4 Backtracking tests
4 Safe-Failure tests
8 End-to-End tests
10 Property-Based tests
```

This represents a minimum of:

```text
103 defined tests or test properties
```

Not every test must initially contain a large fixture.

However, every listed behaviour must eventually have an executable assertion.

---

# Test Suite Invariants

The following conditions must always remain true:

1. Tests verify decisions, not only outputs.
2. Hard Constraints are tested explicitly.
3. Safe failure is tested as a valid result.
4. No test considers a session successful only because exercises were returned.
5. Every successful End-to-End test checks Decision Trace integrity.
6. Every successful End-to-End test checks duration.
7. Every successful End-to-End test checks all four fatigue dimensions.
8. Every medical and pain test forbids unsafe output.
9. Every substitution test checks preserved and lost features.
10. Every objective-change test checks transparency.
11. Every conflict-resolution test checks recalculation.
12. Every deterministic test fixes rule and library versions.
13. Every confirmed defect creates a Regression Test.
14. Critical tests cannot be skipped for release.
15. Snapshot equality cannot override semantic failure.
16. Test fixtures must remain isolated.
17. Expected outputs must use canonical modules and adaptations.
18. Specific Skill must not appear as a physical Capability Module.
19. Validation and Decision Trace must agree with Engine Output.
20. The suite must protect adaptation rather than exhaustion.

---

# Relationship With Other Engine Documents

The Test Cases verify the correct implementation of:

* `MODULE_ENGINE.md`;
* `SESSION_GENERATION_PIPELINE.md`;
* `14_EXERCISE_SELECTION_RULES.md`;
* `15_SUBSTITUTION_RULES.md`;
* `16_SCORING_MODEL.md`;
* `17_CONFLICT_RULES.md`;
* `19_ENGINE_INPUT_SCHEMA.md`;
* `20_ENGINE_OUTPUT_SCHEMA.md`;
* `21_DECISION_TRACE.md`;
* `22_VALIDATION_RULES.md`.

Those documents define the expected behaviour.

This document defines how that behaviour is verified.

When a specification changes:

1. affected tests must be identified;
2. expected behaviour must be reviewed;
3. obsolete expectations must be removed explicitly;
4. new regression coverage must be added;
5. the relevant version metadata must be updated.

---

# Implementation Principle

The implementation should support test helpers such as:

```text
buildValidEngineInput()
overrideAthleteState()
overridePainContext()
overrideEquipmentContext()
overrideTrainingRequest()
runEngine()
assertGenerationStatus()
assertPrimaryAdaptation()
assertSelectedModules()
assertExerciseEligible()
assertExerciseExcluded()
assertConflictDetected()
assertConflictResolved()
assertDurationValid()
assertPrescriptionComplete()
assertValidationStatus()
assertTraceEvent()
assertTraceMatchesOutput()
```

Test helpers must not hide the essential assertion logic.

---

# Definition of Success

The Engine Test Cases succeed when they can detect:

* unsafe exercise selection;
* invalid module creation;
* hidden objective change;
* scoring-rule misuse;
* missed conflicts;
* invalid substitutions;
* incomplete prescriptions;
* excessive fatigue;
* duration overflow;
* unresolved backtracking;
* invalid safe fallback;
* Output Schema inconsistency;
* Decision Trace inconsistency;
* non-deterministic core decisions;
* regressions after rule changes.

The test suite does not succeed merely because it runs without technical errors.

It succeeds only when it prevents invalid engine behaviour from reaching the athlete.

---

# Final Principle

The CAS Engine must not be trusted because its output appears intelligent.

It must be trusted because its decisions are repeatedly tested against explicit rules and known failure conditions.

> Specifications define what CAS should do.

> The Decision Trace records what CAS did.

> Tests prove whether CAS behaved correctly.
