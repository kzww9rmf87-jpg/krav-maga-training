# VALIDATION RULES

Version 0.1

---

# Purpose

The Validation Rules define how the Combat Athlete System verifies that:

* Engine Input is usable;
* intermediate decisions remain coherent;
* selected exercises are valid;
* the assembled session is safe and physiologically coherent;
* prescriptions are complete;
* Engine Output is structurally consistent;
* the Decision Trace accurately reflects the decision process.

Their purpose is to ensure that every CAS result is:

* safe;
* coherent;
* complete;
* compatible with the athlete;
* compatible with medical and pain constraints;
* compatible with the environment;
* aligned with the final objective;
* realistic in duration;
* compatible with recovery capacity;
* explainable;
* technically usable by the application.

Validation is not a cosmetic final check.

It is a continuous process applied throughout the Session Generation Pipeline.

---

# Core Principle

> A CAS session is valid only when safety, physiological coherence, practical feasibility, prescription completeness, traceability and output integrity are all satisfied.

A session must never be approved solely because:

* its exercises are individually valid;
* its average score is high;
* the athlete requested a difficult session;
* the session appears plausible;
* no single rule obviously failed;
* the session resembles a conventional workout.

The complete training decision must be valid as a system.

---

# Authority of Validation

Validation is the final authority over session delivery.

Scoring determines preference.

Conflict Rules determine compatibility.

Exercise Selection determines candidate suitability.

Substitution Rules determine acceptable replacements.

Validation determines whether the resulting session may be returned as valid.

A session with a high score remains invalid when a blocking validation rule fails.

A manual override cannot bypass a blocking safety or medical validation rule.

---

# Validation Scope

Validation occurs at six levels:

1. Input Validation
2. Intermediate Decision Validation
3. Candidate and Exercise Validation
4. Session Validation
5. Output Validation
6. Decision Trace Validation

Each level may:

* pass;
* pass with warnings;
* request regeneration;
* trigger controlled backtracking;
* produce a safe fallback;
* block the session;
* report a System Failure.

---

# Validation Sequence

```text
Input Validation
        ↓
Athlete-State Validation
        ↓
Constraint Validation
        ↓
Objective Validation
        ↓
Adaptation-Priority Validation
        ↓
Module Validation
        ↓
Exercise Eligibility Validation
        ↓
Scoring-Process Validation
        ↓
Conflict Validation
        ↓
Session-Assembly Validation
        ↓
Prescription Validation
        ↓
Load Validation
        ↓
Duration Validation
        ↓
Output-Schema Validation
        ↓
Decision-Trace Validation
        ↓
Final Validation Result
```

Validation may trigger backtracking to the latest pipeline stage capable of correcting the failure.

---

# Validation Result Levels

Every validation issue uses one of three levels:

1. Blocking Error
2. Warning
3. Recommendation

---

## Blocking Error

A Blocking Error means the current result must not be delivered as a valid training session.

Possible consequences include:

* reject a candidate;
* regenerate part of the session;
* remove an exercise;
* change the module structure;
* change the objective;
* return `NO_VALID_SESSION`;
* return `INPUT_INVALID`;
* return `SYSTEM_FAILURE`.

A Blocking Error cannot be accepted through numerical compensation.

---

## Warning

A Warning identifies a valid but meaningful limitation.

The session may still be delivered when:

* safety remains acceptable;
* the primary adaptation remains coherent;
* the warning is visible;
* monitoring or adjustment instructions are included.

Warnings must not conceal unresolved Major or Critical conflicts.

---

## Recommendation

A Recommendation identifies an opportunity to improve:

* monitoring;
* data quality;
* progression;
* athlete feedback;
* exercise selection;
* long-term planning.

A recommendation does not invalidate the session.

---

# Validation Status

Each validation scope returns one of:

```typescript
type ValidationStatus =
  | "VALID"
  | "VALID_WITH_WARNINGS"
  | "INVALID";
```

Interpretation:

| Status              | Meaning                                 |
| ------------------- | --------------------------------------- |
| VALID               | No Blocking Error or Warning            |
| VALID_WITH_WARNINGS | No Blocking Error, one or more Warnings |
| INVALID             | At least one unresolved Blocking Error  |

Recommendations do not change `VALID` to `VALID_WITH_WARNINGS`.

---

# Validation Issue Structure

```typescript
interface ValidationIssue {
  issueId: Identifier;
  ruleId: string;
  ruleVersion: string;

  category: ValidationCategory;

  severity:
    | "BLOCKING"
    | "WARNING"
    | "RECOMMENDATION";

  code: string;
  message: string;

  fieldPath?: string;
  affectedElements?: Identifier[];

  expected?: string;
  actual?: unknown;

  evidenceReferences: string[];
  ruleReferences: string[];

  suggestedResolution?: string;

  backtrackStage?: PipelineStageName;
}
```

---

# Validation Categories

```typescript
type ValidationCategory =
  | "INPUT"
  | "ATHLETE_STATE"
  | "MEDICAL"
  | "PAIN"
  | "OBJECTIVE"
  | "ADAPTATION"
  | "MODULE"
  | "EXERCISE"
  | "SCORING"
  | "CONFLICT"
  | "ORDER"
  | "PRESCRIPTION"
  | "FATIGUE"
  | "RECOVERY"
  | "DURATION"
  | "EQUIPMENT"
  | "ENVIRONMENT"
  | "SUPERVISION"
  | "COMBAT_PRACTICE"
  | "COMPETITION"
  | "PROGRESSION"
  | "OUTPUT"
  | "DECISION_TRACE"
  | "SYSTEM";
```

---

# Root Validation Result

```typescript
interface ValidationResult {
  status: ValidationStatus;

  blockingErrors: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: ValidationIssue[];

  blockingErrorCount: number;
  warningCount: number;
  recommendationCount: number;

  rulesChecked: number;
  rulesPassed: number;
  rulesFailed: number;
  rulesNotApplicable: number;

  validatedAt: ISODateTime;
  validationRulesVersion: "0.1";

  safeToDeliver: boolean;
  requiredBacktracking?: PipelineStageName;
}
```

Required consistency:

```text
status = VALID
→ blockingErrorCount = 0
→ warningCount = 0
→ safeToDeliver = true
```

```text
status = VALID_WITH_WARNINGS
→ blockingErrorCount = 0
→ warningCount ≥ 1
→ safeToDeliver = true
```

```text
status = INVALID
→ blockingErrorCount ≥ 1
→ safeToDeliver = false
```

---

# Validation Rule Structure

Every validation rule should be represented as:

```typescript
interface ValidationRuleDefinition {
  ruleId: string;
  version: string;

  name: string;
  category: ValidationCategory;

  scope:
    | "INPUT"
    | "INTERMEDIATE"
    | "CANDIDATE"
    | "SESSION"
    | "OUTPUT"
    | "TRACE";

  defaultSeverity:
    | "BLOCKING"
    | "WARNING"
    | "RECOMMENDATION";

  condition: string;
  expectedResult: string;

  failureCode: string;
  suggestedResolution?: string;

  backtrackStage?: PipelineStageName;
}
```

Rule severity may be increased by context when the rule explicitly allows it.

A rule must not be downgraded dynamically merely to preserve a session.

---

# Level 1 — Input Validation

Input Validation confirms that `EngineInput` is structurally and semantically usable.

Detailed structural requirements are defined in:

`19_ENGINE_INPUT_SCHEMA.md`

---

## Rule INPUT-001 — Supported Schema Version

Required:

```text
schemaVersion = "0.1"
```

Failure:

```text
Severity: BLOCKING
Code: UNSUPPORTED_INPUT_SCHEMA_VERSION
```

---

## Rule INPUT-002 — Request Identifier

Required:

* non-empty `requestId`;
* valid identifier format.

Failure:

```text
Severity: BLOCKING
Code: INVALID_REQUEST_IDENTIFIER
```

---

## Rule INPUT-003 — Athlete Identifier

Required:

* non-empty `athleteProfile.athleteId`.

Failure:

```text
Severity: BLOCKING
Code: INVALID_ATHLETE_IDENTIFIER
```

---

## Rule INPUT-004 — Primary Objective Present

Exactly one primary Training Request objective must be present.

Failure:

```text
Severity: BLOCKING
Code: MISSING_OR_MULTIPLE_PRIMARY_OBJECTIVES
```

---

## Rule INPUT-005 — Session Duration Present

Required:

```text
durationMinutes > 0
```

Default supported range:

```text
5 to 240 minutes
```

Out-of-range values require explicit support or review.

Failure below or equal to zero:

```text
Severity: BLOCKING
Code: INVALID_SESSION_DURATION
```

Unusually high but positive value:

```text
Severity: WARNING
Code: UNUSUAL_SESSION_DURATION
```

---

## Rule INPUT-006 — Pain Status Explicit

For normal training generation:

```text
painStatusKnown = true
```

Unknown pain status may remain acceptable only for low-risk conservative sessions.

High-risk requests require known pain status.

High-risk examples:

* sprinting;
* plyometrics;
* maximal Strength;
* ballistic work;
* heavy-bag Power;
* high-impact Conditioning.

Failure for high-risk generation:

```text
Severity: BLOCKING
Code: PAIN_STATUS_REQUIRED
```

---

## Rule INPUT-007 — Medical Context Present

`medicalContext` is required.

When medical clearance is unknown, high-risk training must not be generated automatically.

Possible result:

```text
Severity: BLOCKING
Code: MEDICAL_STATUS_INSUFFICIENT_FOR_HIGH_RISK_TRAINING
```

For low-risk conservative work:

```text
Severity: WARNING
Code: MEDICAL_STATUS_UNKNOWN
```

---

## Rule INPUT-008 — Restricted Clearance Consistency

When:

```text
medicalClearanceStatus = CLEARED_WITH_RESTRICTIONS
```

at least one active restriction or rehabilitation instruction must exist.

Failure:

```text
Severity: BLOCKING
Code: MISSING_MEDICAL_RESTRICTION_DETAILS
```

---

## Rule INPUT-009 — Not Cleared

When:

```text
medicalClearanceStatus = NOT_CLEARED
```

normal training generation is blocked.

Failure:

```text
Severity: BLOCKING
Code: ATHLETE_NOT_MEDICALLY_CLEARED
```

CAS must not generate a normal training session.

---

## Rule INPUT-010 — Equipment Context Present

Equipment context must identify the available equipment relevant to the request.

Missing equipment certainty may:

* block equipment-dependent candidates;
* trigger conservative bodyweight retrieval;
* generate a Warning.

---

## Rule INPUT-011 — Environment Safety Known

Safety-critical environment values must be known for:

* sprinting;
* jumping;
* throwing;
* high-impact work;
* heavy-bag work;
* loaded exercise.

Unknown floor safety for such work produces:

```text
Severity: BLOCKING
Code: ENVIRONMENT_SAFETY_UNKNOWN
```

---

## Rule INPUT-012 — Supervision Explicit

Supervision must be explicit or replaced by the safe default:

```text
UNSUPERVISED
```

The default must be recorded in:

* assumptions;
* Decision Trace.

---

## Rule INPUT-013 — Numerical Ranges

Values must remain within their defined ranges.

Examples:

```text
Readiness = 0–100
Pain = 0–10
RPE = 1–10
RIR = 0–10
Percentage = 0–100
```

Out-of-range decision-critical data produce a Blocking Error.

---

## Rule INPUT-014 — Date Consistency

Dates must be chronologically coherent.

Examples:

* cycle end cannot precede cycle start;
* restriction end cannot precede restriction start;
* competition date must be coherent with weigh-in date;
* requested session date must be interpretable in the declared timezone.

---

## Rule INPUT-015 — Contradictory Data

Material contradictions must not be resolved silently.

Examples:

* `painStatusKnown = true` with no pain, but a severe active Pain Event exists;
* equipment is both unavailable and required;
* medical status is `CLEARED` while a conflicting active prohibition exists.

Failure response depends on whether the contradiction can be resolved safely.

Critical contradiction:

```text
Severity: BLOCKING
Code: CONTRADICTORY_CRITICAL_INPUT
```

Non-critical contradiction:

```text
Severity: WARNING
Code: CONTRADICTORY_NONCRITICAL_INPUT
```

---

## Rule INPUT-016 — Data Provenance

Decision-critical input must have identifiable provenance.

Critical values include:

* objective;
* pain;
* medical restrictions;
* readiness;
* equipment;
* session duration;
* competition;
* combat schedule.

Missing provenance may produce:

```text
Severity: WARNING
Code: MISSING_DATA_PROVENANCE
```

When provenance uncertainty affects safety:

```text
Severity: BLOCKING
```

---

# Level 2 — Athlete-State Validation

Athlete-State Validation verifies whether the requested training demand is compatible with the current athlete state.

---

## Rule STATE-001 — Severe or Worsening Pain

Severe, sharp, radiating, neurological or worsening symptoms create a Blocking Error for affected training.

```text
Code: PAIN_BLOCKS_TRAINING_DEMAND
```

The engine must not diagnose the condition.

---

## Rule STATE-002 — Pain Alters Technique

When pain alters technique:

```text
Affected exercise = INVALID
```

When pain affects every valid implementation of the primary module:

```text
Session = INVALID
```

---

## Rule STATE-003 — Neurological Symptoms

Reported neurological symptoms create a safety-critical Blocking Error.

```text
Code: NEUROLOGICAL_SYMPTOMS_REPORTED
```

The engine should produce an appropriate professional-assessment recommendation.

---

## Rule STATE-004 — Instability

Reported joint or positional instability blocks exercises requiring stability in the affected region unless explicitly authorized by medical or rehabilitation instructions.

---

## Rule STATE-005 — Illness

Possible outcomes:

### Confirmed illness with systemic symptoms or fever

```text
Severity: BLOCKING
Code: ILLNESS_BLOCKS_TRAINING
```

### Recovering or mild uncertain symptoms

```text
Severity: WARNING
```

High-intensity work should normally be excluded.

---

## Rule STATE-006 — Very Low General Readiness

When general readiness is `VERY_LOW`, development-level high-intensity training is invalid unless a specific safe rule authorizes it.

Default response:

* reduce objective;
* generate Recovery;
* return `NO_VALID_SESSION`.

---

## Rule STATE-007 — Regional Readiness

Regional readiness must affect only relevant exercises and modules.

A low shoulder-readiness score must not automatically invalidate lower-body aerobic work.

The engine must avoid inappropriate global penalties.

---

## Rule STATE-008 — Sleep and High-Risk Work

Severely reduced sleep combined with:

* maximal Strength;
* high-impact Power;
* sprinting;
* complex ballistic work

may create a Blocking Error or Warning depending on severity and context.

---

## Rule STATE-009 — Readiness-to-Demand Compatibility

When relevant athlete readiness is materially below candidate demand, the candidate must be:

* reduced;
* modified;
* replaced;
* excluded.

A severe mismatch left unresolved is Blocking.

---

# Level 3 — Constraint Validation

Constraint Validation verifies that extracted constraints are:

* explicit;
* correctly classified;
* actually applied;
* reflected in the Decision Trace.

---

## Rule CONSTRAINT-001 — Hard Constraint Enforcement

Every Hard Constraint must be enforced.

Failure:

```text
Severity: BLOCKING
Code: HARD_CONSTRAINT_VIOLATION
```

---

## Rule CONSTRAINT-002 — Medical Constraint Priority

Medical restrictions override:

* scoring;
* requested exercise;
* requested module;
* progression;
* athlete preference;
* coach preference unless medically authorized.

---

## Rule CONSTRAINT-003 — Soft Constraint Visibility

Material Soft Constraints must influence:

* scoring;
* prescription;
* warnings;
* or conflict resolution.

A Soft Constraint that has no effect must be explicitly classified as non-material.

---

## Rule CONSTRAINT-004 — Derived Constraint Traceability

Every constraint inferred from input must appear in the Decision Trace with:

* source data;
* inference rule;
* Confidence;
* decision impact.

---

# Level 4 — Objective Validation

Objective Validation verifies that the engine is solving the correct training problem.

---

## Rule OBJECTIVE-001 — One Final Primary Adaptation

Every generated session must contain exactly one final primary Adaptation Domain.

Failure:

```text
Severity: BLOCKING
Code: INVALID_PRIMARY_ADAPTATION_COUNT
```

---

## Rule OBJECTIVE-002 — Canonical Adaptation Domain

The primary adaptation must use one of:

* Maximum Strength;
* Power;
* Functional Hypertrophy;
* Conditioning;
* Robustness;
* Movement;
* Recovery.

Specific Skill must not appear as the physical primary Adaptation Domain.

---

## Rule OBJECTIVE-003 — Objective Interpretation

The final objective must be sufficiently precise to guide:

* module selection;
* exercise selection;
* prescription;
* success criteria.

Invalid example:

```text
Get fitter
```

without interpretation.

Valid interpretation:

```text
Improve aerobic work capacity at low local muscular fatigue.
```

---

## Rule OBJECTIVE-004 — Objective Change Transparency

When the final objective differs from the request:

* `objectiveChanged` must be `true`;
* the reason must be recorded;
* the protected priority must be recorded;
* the athlete-facing explanation must mention the change.

Failure:

```text
Severity: BLOCKING
Code: HIDDEN_OBJECTIVE_CHANGE
```

---

## Rule OBJECTIVE-005 — Primary Objective Protection

Secondary and Support work must not materially compromise the primary adaptation.

An unresolved violation is Blocking.

---

## Rule OBJECTIVE-006 — Measurable Outcome

Development sessions should include at least one observable success criterion.

Missing objective measurement is normally a Recommendation.

For Power or high-skill work, missing quality criteria may become Blocking.

---

# Level 5 — Adaptation Priority Validation

---

## Rule ADAPTATION-001 — Priority Roles Valid

Adaptation roles must use:

* PRIMARY;
* SECONDARY;
* MAINTENANCE;
* SUPPORT;
* EXCLUDED.

---

## Rule ADAPTATION-002 — One Primary Role

Exactly one selected adaptation has role `PRIMARY`.

---

## Rule ADAPTATION-003 — Development Overload

The session must not assign development-level resources to too many adaptations simultaneously.

When the structure exceeds realistic recovery or duration, validation fails.

---

## Rule ADAPTATION-004 — Cycle Compatibility

The session should remain consistent with Training Cycle priorities.

A justified deviation may pass with:

* explicit reason;
* Decision Trace event.

An unexplained major deviation produces a Warning or Blocking Error depending on impact.

---

# Level 6 — Capability Module Validation

---

## Rule MODULE-001 — Canonical Module Identifier

Every selected module must belong to the canonical catalog:

1. Preparation
2. Movement
3. Power
4. Strength
5. Functional Hypertrophy
6. Robustness
7. Grip
8. Core
9. Conditioning
10. Recovery

Failure:

```text
Severity: BLOCKING
Code: NON_CANONICAL_MODULE
```

---

## Rule MODULE-002 — One Primary Adaptation per Module

Every module must have exactly one primary adaptation.

Failure:

```text
Severity: BLOCKING
Code: INVALID_MODULE_PRIMARY_ADAPTATION
```

---

## Rule MODULE-003 — Explicit Module Purpose

Every selected module must include:

* role;
* purpose;
* selection reason.

Missing purpose:

```text
Severity: BLOCKING
Code: MODULE_PURPOSE_MISSING
```

---

## Rule MODULE-004 — Module-Objective Match

Every selected module must contribute to:

* the primary adaptation;
* a valid Secondary adaptation;
* Maintenance;
* necessary Support;
* Recovery.

A module with no valid contribution is invalid.

---

## Rule MODULE-005 — Module Compatibility

No unresolved Major or Critical module conflict may remain.

---

## Rule MODULE-006 — Minimum Effective Module Set

The engine should not add modules without a clear purpose.

Unnecessary module inflation produces:

```text
Severity: WARNING
Code: UNNECESSARY_MODULE
```

Severe inflation causing duration or fatigue failure becomes Blocking.

---

## Rule MODULE-007 — Requested Module Rejection

An explicitly requested module that is omitted must have a Decision Trace explanation.

Missing explanation:

```text
Severity: WARNING
```

---

# Level 7 — Exercise Validation

---

## Rule EXERCISE-001 — Exercise Exists

Every exercise must exist in the validated Exercise Library.

Failure:

```text
Severity: BLOCKING
Code: UNKNOWN_EXERCISE
```

---

## Rule EXERCISE-002 — Exercise Eligibility

Every final exercise must have:

```text
eligibility = ELIGIBLE
```

Failure:

```text
Severity: BLOCKING
Code: INELIGIBLE_EXERCISE_SELECTED
```

---

## Rule EXERCISE-003 — Mandatory Criteria Passed

Every selected exercise must pass all applicable mandatory scoring criteria.

Failure:

```text
Severity: BLOCKING
Code: MANDATORY_CRITERION_FAILED
```

---

## Rule EXERCISE-004 — Module Match

Every exercise must validly implement its assigned Capability Module.

Examples:

* slow exhaustive jumps must not be classified as Power;
* high-density heavy-bag rounds must not be classified as Power when Conditioning dominates;
* abdominal fatigue alone does not validate a Core exercise.

Failure:

```text
Severity: BLOCKING
Code: EXERCISE_MODULE_MISMATCH
```

---

## Rule EXERCISE-005 — Explicit Exercise Purpose

Every selected exercise must have one explicit purpose.

Failure:

```text
Severity: BLOCKING
Code: EXERCISE_PURPOSE_MISSING
```

---

## Rule EXERCISE-006 — Equipment Available and Functional

Every exercise must use equipment that is:

* available;
* functional;
* safe;
* capable of the prescribed load.

Failure:

```text
Severity: BLOCKING
Code: EQUIPMENT_INCOMPATIBLE
```

---

## Rule EXERCISE-007 — Environment Compatible

Every exercise must be feasible in the declared environment.

Unsafe environment:

```text
Severity: BLOCKING
```

Minor inconvenience:

```text
Severity: WARNING
```

---

## Rule EXERCISE-008 — Supervision Compatible

Exercises requiring supervision or spotting must not be prescribed as unsupervised unless:

* appropriate safeties exist;
* the exercise is modified;
* risk remains acceptable.

---

## Rule EXERCISE-009 — Technical Feasibility

The athlete must possess the required technical competence.

Unknown competence for a high-risk exercise is Blocking.

---

## Rule EXERCISE-010 — Pain Compatibility

An exercise must not:

* worsen pain;
* reproduce sharp or neurological symptoms;
* alter technique;
* violate medical restrictions.

---

## Rule EXERCISE-011 — Selection Reason

Every final exercise must have a selection reason linked to:

* objective;
* module;
* athlete;
* context.

A score alone is not enough.

---

## Rule EXERCISE-012 — High-Ranking Rejection Explanation

A rejected candidate must be explained when it:

* ranked in the top three;
* was within the tie margin;
* was explicitly requested;
* was previously prescribed;
* was excluded by a Hard Constraint.

Missing explanation produces a Warning in trace validation.

---

# Level 8 — Scoring Validation

Scoring Validation verifies the process, not only the numerical result.

---

## Rule SCORING-001 — Correct Scoring Profile

The active scoring profile must match the decision:

* Module Priority;
* Exercise Selection;
* Substitution;
* Session Quality;
* Progression.

Using the wrong profile is Blocking.

---

## Rule SCORING-002 — Hard Filters Before Scoring

An ineligible candidate must not receive a final suitability score.

Failure:

```text
Severity: BLOCKING
Code: INELIGIBLE_CANDIDATE_SCORED
```

---

## Rule SCORING-003 — Mandatory Thresholds Before Ranking

Candidates failing mandatory criteria must not enter the valid ranking.

---

## Rule SCORING-004 — Score Range

All normalized and final suitability scores must remain within:

```text
0 to 100
```

---

## Rule SCORING-005 — Weight Range

Active weights must remain within:

```text
1 to 5
```

A weight of `0` is allowed only for an irrelevant criterion.

Mandatory criteria may not have weight `0`.

---

## Rule SCORING-006 — Modifier Limits

Default modifier limits:

```text
Positive total ≤ +5
Negative total ≥ -15
```

Exceeding these limits requires explicit rule support or indicates incorrect eligibility classification.

---

## Rule SCORING-007 — Confidence Separate

Confidence must not be multiplied into the Final Suitability Score.

Failure:

```text
Severity: BLOCKING
Code: CONFIDENCE_SCORE_MIXING
```

---

## Rule SCORING-008 — No Double Counting

The same factor must not be fully applied through several criteria or modifiers.

Detected probable double counting produces:

```text
Severity: WARNING
Code: POSSIBLE_SCORE_DOUBLE_COUNTING
```

Material distortion produces Blocking.

---

## Rule SCORING-009 — Tie-Break Integrity

When candidates fall within the defined tie margin, the engine must apply:

* documented tie-break rules;
* or retain several valid alternatives.

False precision must not be used to invent a winner.

---

# Level 9 — Conflict Validation

---

## Rule CONFLICT-001 — Conflict Detection Completed

Conflict detection must be executed for every assembled session.

Failure:

```text
Severity: BLOCKING
Code: CONFLICT_CHECK_MISSING
```

---

## Rule CONFLICT-002 — Critical Conflict

A Critical conflict must produce:

* exclusion;
* session rejection;
* or safe failure.

A Critical conflict cannot remain under monitoring.

---

## Rule CONFLICT-003 — Major Conflict

Every Major conflict must be resolved before delivery.

Unresolved:

```text
Severity: BLOCKING
Code: UNRESOLVED_MAJOR_CONFLICT
```

---

## Rule CONFLICT-004 — Moderate Conflict

A Moderate conflict may pass only when:

* resolved;
* or explicitly accepted with monitoring;
* and the primary objective remains protected.

---

## Rule CONFLICT-005 — Resolution Recalculation

After material conflict resolution, the engine must reassess:

* scores when relevant;
* duration;
* load;
* order;
* validation.

Failure:

```text
Severity: BLOCKING
Code: CONFLICT_RESOLUTION_NOT_RECALCULATED
```

---

## Rule CONFLICT-006 — Objective Change After Resolution

When conflict resolution changes the primary adaptation or session objective, the change must be explicit.

---

## Rule CONFLICT-007 — Protected Priority Recorded

Every material conflict resolution must identify the protected priority.

Missing protected priority produces a Warning.

---

# Level 10 — Session Assembly Validation

---

## Rule SESSION-001 — Ordered Phases

Every session phase must have:

* unique phase identifier;
* unique order value;
* canonical module;
* explicit role.

---

## Rule SESSION-002 — Canonical Relative Order

Selected modules should follow the canonical relative order:

1. Preparation
2. Movement
3. Power
4. Strength
5. Functional Hypertrophy
6. Robustness
7. Grip
8. Core
9. Conditioning
10. Recovery

A deviation may pass only when:

* justified;
* recorded in the Decision Trace;
* compatible with the objective.

Unexplained deviation:

```text
Severity: WARNING
```

Deviation that compromises Power, safety or technical quality:

```text
Severity: BLOCKING
```

---

## Rule SESSION-003 — Power Before Avoidable Fatigue

Power work must not follow avoidable:

* muscular fatigue;
* metabolic fatigue;
* neural fatigue;
* technical degradation.

Violation:

```text
Severity: BLOCKING
```

unless the explicit validated objective is controlled Power under fatigue.

---

## Rule SESSION-004 — Primary Module Receives Priority

The primary module must receive sufficient:

* time;
* quality;
* fatigue budget;
* appropriate exercise order.

---

## Rule SESSION-005 — No Unnecessary Exhaustion

A session must not include additional work solely to increase fatigue.

Unnecessary low-impact work may produce a Warning.

Material interference produces Blocking.

---

## Rule SESSION-006 — Redundancy

The session must not contain unjustified high redundancy across:

* adaptation;
* movement function;
* tissue stress;
* joint stress;
* fatigue profile.

Moderate redundancy:

```text
Severity: WARNING
```

High redundancy causing fatigue or duration issues:

```text
Severity: BLOCKING
```

---

## Rule SESSION-007 — Combat-Practice Compatibility

The session must not materially compromise the next key combat-practice session.

Examples:

* grip failure before grappling;
* shoulder failure before striking;
* lower-body soreness before kicking;
* exhaustive Conditioning before technical learning.

---

## Rule SESSION-008 — Competition Compatibility

Near competition, the session must respect:

* readiness;
* recovery;
* low unnecessary soreness;
* low novelty;
* low injury risk.

Material violation:

```text
Severity: BLOCKING
```

---

## Rule SESSION-009 — Easy-Day Integrity

A Recovery or low-intensity session must remain low in:

* fatigue;
* impact;
* complexity;
* psychological demand.

A Recovery session that becomes a hidden Conditioning session is invalid.

---

# Level 11 — Prescription Validation

Every prescribed exercise must contain enough information for execution.

---

## Rule PRESCRIPTION-001 — Prescription Type

Every exercise must declare a valid prescription type:

* SETS_REPS;
* TIME;
* DISTANCE;
* INTERVALS;
* CONTINUOUS;
* CONTACTS;
* CUSTOM.

---

## Rule PRESCRIPTION-002 — Required Fields by Type

### SETS_REPS

Requires:

* sets;
* repetitions;
* load or effort target when relevant;
* rest;
* stopping criteria.

### TIME

Requires:

* duration;
* intensity;
* purpose.

### INTERVALS

Requires:

* rounds;
* work time;
* rest time;
* intensity;
* stopping or completion rule.

### DISTANCE

Requires:

* distance;
* sets or repetitions when relevant;
* intensity;
* rest.

### CONTACTS

Requires:

* contact count;
* set structure;
* rest;
* quality criteria.

Missing execution-critical fields produce a Blocking Error.

---

## Rule PRESCRIPTION-003 — Valid Load

Exact load may be prescribed only when supported by:

* recent performance;
* valid progression logic;
* reliable history;
* appropriate exercise metadata.

Otherwise the engine should prescribe:

* RPE;
* RIR;
* percentage;
* velocity;
* implement mass;
* safe range.

Unsupported exact load:

```text
Severity: WARNING
```

Potentially unsafe exact load:

```text
Severity: BLOCKING
```

---

## Rule PRESCRIPTION-004 — Rest Compatibility

Rest intervals must preserve the intended adaptation.

Examples:

* Power requires sufficient recovery;
* Maximum Strength requires sufficient recovery;
* Conditioning rest must match the target energy system.

Rest cannot be shortened merely to fit duration when this changes the objective.

---

## Rule PRESCRIPTION-005 — Power Intent

Every Power prescription must include:

* maximal or high intent;
* low enough repetition count;
* sufficient rest;
* Power or velocity stopping criterion.

Missing these fields:

```text
Severity: BLOCKING
Code: INVALID_POWER_PRESCRIPTION
```

---

## Rule PRESCRIPTION-006 — Conditioning Structure

Every Conditioning prescription must define:

* modality;
* work structure;
* rest structure;
* target intensity;
* technical sustainability criterion.

---

## Rule PRESCRIPTION-007 — Recovery Intensity

Every Recovery prescription must remain compatible with Recovery.

A prescription with high metabolic or muscular cost is invalid as Recovery.

---

## Rule PRESCRIPTION-008 — Technical Cues

High-risk or technically demanding exercises require at least one critical technique or safety instruction.

---

## Rule PRESCRIPTION-009 — Stopping Criteria

Exercises involving:

* pain risk;
* technical breakdown;
* Power;
* velocity;
* high impact;
* high fatigue

must contain stopping criteria.

---

## Rule PRESCRIPTION-010 — Progression Coherence

A progression instruction must be supported by:

* technical readiness;
* recent performance;
* pain compatibility;
* recovery.

The engine should not progress several major variables simultaneously by default.

---

## Rule PRESCRIPTION-011 — Regression Availability

High-risk or variable-readiness exercises should include a regression or modification rule.

Missing regression is normally a Recommendation.

---

# Level 12 — Load Validation

Load Validation uses the four canonical dimensions:

* Neural Fatigue;
* Muscular Fatigue;
* Connective Tissue Stress;
* Metabolic Fatigue.

---

## Rule LOAD-001 — Four Dimensions Present

Every complete generated session must estimate all four fatigue dimensions.

Missing dimension:

```text
Severity: BLOCKING
Code: INCOMPLETE_LOAD_ESTIMATE
```

---

## Rule LOAD-002 — Session Budget

The estimated session load must remain within the athlete's current session capacity.

Failure:

```text
Severity: BLOCKING
Code: SESSION_LOAD_BUDGET_EXCEEDED
```

---

## Rule LOAD-003 — Weekly Budget

When recent-training data are available, the session should remain within the weekly budget.

Material excess:

```text
Severity: BLOCKING
```

Uncertain or small excess:

```text
Severity: WARNING
```

---

## Rule LOAD-004 — Interaction Cost

The engine must account for interaction cost when exercises share:

* neural demand;
* muscle groups;
* joints;
* impact;
* technical fatigue.

Ignoring a material interaction is invalid.

---

## Rule LOAD-005 — Recovery-Time Compatibility

Estimated recovery must fit before the next important session or competition.

Failure:

```text
Severity: BLOCKING
Code: RECOVERY_WINDOW_INCOMPATIBLE
```

---

## Rule LOAD-006 — Primary Adaptation Before Fatigue

The session load structure must preserve the quality required by the primary module.

---

## Rule LOAD-007 — Load Confidence

Load estimates must include Confidence.

Low Confidence may pass for conservative sessions with a Warning.

Very Low Confidence is incompatible with high-risk or maximal prescriptions.

---

# Level 13 — Duration Validation

---

## Rule DURATION-001 — Complete Duration Estimate

Duration must include:

* active work;
* rest;
* setup;
* transitions;
* Preparation;
* Recovery.

Work time alone is not valid duration estimation.

---

## Rule DURATION-002 — Fit Available Duration

Required:

```text
estimatedDuration ≤ availableDuration + allowedTolerance
```

Default tolerance:

```text
0 minutes
```

A later implementation may authorize a small explicit tolerance.

---

## Rule DURATION-003 — No Adaptation-Distorting Compression

The engine must not fit the session by shortening:

* Power rest;
* Maximum Strength rest;
* necessary transitions;
* safety setup

when doing so changes the intended adaptation.

---

## Rule DURATION-004 — Reduction Priority

When time exceeds availability, content must be reduced from the lowest priority first:

1. optional accessories;
2. redundancy;
3. low-priority volume;
4. tertiary work;
5. secondary modules;
6. non-essential Support work.

The primary objective must not be removed first.

---

## Rule DURATION-005 — Duration Confidence

Duration estimate must include Confidence.

Low duration Confidence may produce a Warning.

---

# Level 14 — Substitution Validation

---

## Rule SUBSTITUTION-001 — Trigger Present

Every substitution must have an explicit reason.

---

## Rule SUBSTITUTION-002 — Primary Adaptation Preserved

A normal substitution must preserve the primary adaptation.

When it does not, the action must be classified as:

* objective adjustment;
* module adjustment;
* program modification.

---

## Rule SUBSTITUTION-003 — Module Preserved

A normal exercise substitution should preserve the Capability Module.

If the module changes, the change must be explicit.

---

## Rule SUBSTITUTION-004 — Trade-Off Transparency

Every substitution must record:

* preserved features;
* changed features;
* lost features.

Failure:

```text
Severity: WARNING
Code: SUBSTITUTION_TRADEOFF_MISSING
```

---

## Rule SUBSTITUTION-005 — Substitute Eligibility

The substitute must pass its own complete eligibility and mandatory criteria checks.

---

## Rule SUBSTITUTION-006 — Substitution Score Profile

A substitute must use the Substitution Scoring profile.

---

# Level 15 — Progression Validation

---

## Rule PROGRESSION-001 — Previous Performance

Progression requires sufficient previous performance data.

When missing, default action should normally be:

```text
REPEAT
or
ASSESS
```

---

## Rule PROGRESSION-002 — Technique Preserved

Progression is invalid when previous technique was unstable or unsafe.

---

## Rule PROGRESSION-003 — Pain Acceptable

Progression is invalid when pain appeared or worsened.

---

## Rule PROGRESSION-004 — Recovery Acceptable

Progression is invalid when the athlete did not recover adequately.

---

## Rule PROGRESSION-005 — Increment Reasonable

The progression amount must remain within the module's progression rules.

---

## Rule PROGRESSION-006 — One Primary Variable

The engine should normally progress one primary variable at a time.

Multiple-variable progression requires explicit justification.

---

# Level 16 — Output Validation

Output Validation verifies compliance with:

`20_ENGINE_OUTPUT_SCHEMA.md`

---

## Rule OUTPUT-001 — Supported Schema Version

Required:

```text
schemaVersion = "0.1"
```

---

## Rule OUTPUT-002 — Identifier Continuity

Output must match the processed:

* request identifier;
* athlete identifier.

---

## Rule OUTPUT-003 — Status Consistency

Valid combinations are:

| Generation status               | Result type       | Validation          |
| ------------------------------- | ----------------- | ------------------- |
| SESSION_GENERATED               | GENERATED_SESSION | VALID               |
| SESSION_GENERATED_WITH_WARNINGS | GENERATED_SESSION | VALID_WITH_WARNINGS |
| NO_VALID_SESSION                | NO_VALID_SESSION  | INVALID             |
| INPUT_INVALID                   | INPUT_FAILURE     | INVALID             |
| SYSTEM_FAILURE                  | SYSTEM_FAILURE    | INVALID             |

Any other combination is Blocking.

---

## Rule OUTPUT-004 — One Result Object

Exactly one result object must be present.

---

## Rule OUTPUT-005 — Version Metadata

Every required engine and rule version must be present.

Missing material version data:

```text
Severity: BLOCKING
Code: ENGINE_VERSION_METADATA_MISSING
```

---

## Rule OUTPUT-006 — Warnings Consistent

A valid generated session cannot contain a `BLOCKING` warning.

---

## Rule OUTPUT-007 — Assumptions Visible

Every material safe default or inference must appear in `assumptions`.

---

## Rule OUTPUT-008 — Confidence Present

Every engine result must include Output Confidence.

---

## Rule OUTPUT-009 — Safe Failure Integrity

`NO_VALID_SESSION` must not contain a disguised normal session prescription.

A Recovery alternative may be linked only if it independently passed the pipeline.

---

## Rule OUTPUT-010 — User Summary Consistency

The user-facing summary must match:

* final objective;
* selected modules;
* main adjustment;
* warning status;
* validation result.

Contradictory user-facing language is Blocking.

---

# Level 17 — Decision Trace Validation

Decision Trace Validation verifies compliance with:

`21_DECISION_TRACE.md`

---

## Rule TRACE-001 — Trace Present

Every Engine Output must contain a Decision Trace reference.

---

## Rule TRACE-002 — Identifier Continuity

Trace must match:

* request identifier;
* output identifier;
* athlete identifier.

---

## Rule TRACE-003 — Event Sequence

Decision Events must use a complete ordered sequence.

---

## Rule TRACE-004 — Material Decision Evidence

Every material decision must reference:

* evidence;
* rule;
* rationale;
* result.

---

## Rule TRACE-005 — Candidate Selection History

Every selected exercise must have:

* retrieval event;
* eligibility result;
* selection event.

---

## Rule TRACE-006 — Rejection Explanation

Required rejected candidates must have an explanation.

---

## Rule TRACE-007 — Conflict History

Every material conflict must have:

* detection event;
* level;
* protected priority;
* resolution;
* recalculation result.

---

## Rule TRACE-008 — Backtracking History

Every pipeline backtrack must be recorded.

---

## Rule TRACE-009 — Validation Agreement

Trace validation result must match Engine Output validation.

---

## Rule TRACE-010 — Final Decision Agreement

The final trace summary must match the delivered result.

---

## Rule TRACE-011 — Trace Integrity

Required integrity conditions:

```text
finalDecisionMatchesOutput = true
validationMatchesOutput = true
```

Failure:

```text
Severity: BLOCKING
Code: DECISION_TRACE_OUTPUT_MISMATCH
```

---

# Continuous Validation and Backtracking

Validation must occur during the pipeline, not only at the end.

Possible backtracking destinations include:

| Failure                           | Backtrack stage                         |
| --------------------------------- | --------------------------------------- |
| Invalid exercise                  | Exercise Candidate Retrieval            |
| Mandatory criterion failure       | Exercise Candidate Retrieval            |
| No valid exercise for module      | Capability Module Selection             |
| Module incompatibility            | Module Compatibility Check              |
| Objective incompatible with state | Objective Interpretation                |
| Load overflow                     | Conflict Resolution or Module Selection |
| Duration overflow                 | Session Assembly                        |
| Incomplete prescription           | Prescription Generation                 |
| Output mismatch                   | Output Generation                       |
| Missing critical input            | Input Validation                        |

The engine should return to the latest stage capable of solving the problem.

---

# Maximum Backtracking

The pipeline should enforce a maximum number of regeneration attempts.

Default:

```text
maximumBacktrackingIterations = 5
```

When the limit is reached without a valid result:

```text
generationStatus = NO_VALID_SESSION
```

or:

```text
generationStatus = SYSTEM_FAILURE
```

depending on whether the failure is physiological or technical.

The engine must not loop indefinitely.

---

# Safe Fallback Validation

A fallback option is not automatically valid because it is easier.

A fallback must pass:

* input compatibility;
* objective interpretation;
* module selection;
* exercise eligibility;
* conflict analysis;
* prescription;
* duration;
* load;
* final validation.

Examples:

* Recovery;
* low-intensity Movement;
* reduced Strength maintenance;
* low-impact Conditioning.

A fallback session must not be generated when:

* illness or medical status blocks training entirely;
* the environment is unsafe;
* critical pain data are absent;
* the fallback itself violates restrictions.

---

# Manual Override Validation

A manual override may pass only when:

* the authorized person is identified;
* the original decision is recorded;
* the override reason is recorded;
* expected benefit and known risk are recorded;
* no Hard Safety or Medical rule is bypassed;
* final validation still passes.

Invalid manual override:

```text
Severity: BLOCKING
Code: INVALID_MANUAL_OVERRIDE
```

---

# Validation Priorities

When validation rules compete, apply this hierarchy:

1. Immediate Safety
2. Medical and Rehabilitation Restrictions
3. Pain and Neurological Symptoms
4. Output Integrity
5. Primary Adaptation
6. Competition Readiness
7. Combat-Practice Quality
8. Technical Quality
9. Recovery Capacity
10. Duration and Practical Feasibility
11. Progression
12. Continuity
13. Preference
14. Optional Volume

A lower-priority benefit cannot override a higher-priority failure.

---

# Default Blocking Rules Summary

The following conditions are Blocking by default:

* unsupported schema version;
* missing athlete identifier;
* missing primary objective;
* invalid duration;
* contradictory critical input;
* medical status `NOT_CLEARED`;
* neurological symptoms;
* severe or worsening pain;
* pain altering technique;
* Hard Constraint violation;
* non-canonical Adaptation Domain;
* non-canonical Capability Module;
* several final primary adaptations;
* ineligible selected exercise;
* mandatory criterion failure;
* unavailable essential equipment;
* unsafe environment;
* unresolved Major or Critical conflict;
* invalid Power prescription;
* incomplete executable prescription;
* load budget exceeded;
* recovery window incompatible;
* duration exceeded;
* invalid output-status combination;
* Decision Trace mismatch;
* unresolved blocking validation error.

---

# Default Warning Summary

Common Warnings include:

* mild stable discomfort;
* moderate readiness;
* low-quality non-critical data;
* safe default used;
* unusual session duration;
* limited supervision;
* minor redundancy;
* Moderate conflict resolved with monitoring;
* low Confidence in load estimate;
* minor Training Cycle deviation;
* non-critical missing provenance;
* estimated duration close to limit;
* exercise output difficult to measure.

---

# Default Recommendation Summary

Common Recommendations include:

* record next-day soreness;
* record Session RPE;
* obtain more precise readiness data;
* confirm technical competence;
* update exercise history;
* review recurring conflict;
* reassess progression next exposure;
* improve equipment metadata;
* obtain coach review;
* update competition context;
* calibrate fatigue estimates.

---

# Validation Summary Output

The final validation result should use:

```typescript
interface ValidationSummary {
  status: ValidationStatus;

  blockingErrorCount: number;
  warningCount: number;
  recommendationCount: number;

  rulesChecked: number;
  rulesPassed: number;
  rulesFailed: number;
  rulesNotApplicable: number;

  blockingErrors: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: ValidationIssue[];

  validatedAt: ISODateTime;
  validationRulesVersion: "0.1";
}
```

---

# Example — Valid Session

```yaml
status: "VALID"

blockingErrorCount: 0
warningCount: 0
recommendationCount: 1

blockingErrors: []
warnings: []

recommendations:
  - issueId: "recommendation_001"
    ruleId: "FEEDBACK-001"
    ruleVersion: "0.1"
    category: "PROGRESSION"
    severity: "RECOMMENDATION"
    code: "RECORD_NEXT_DAY_RECOVERY"
    message: "Record next-day recovery before the next Power exposure."
    evidenceReferences:
      - "session.estimatedLoad"
    ruleReferences:
      - "VALIDATION_RULES_V0.1"
```

---

# Example — Valid With Warnings

```yaml
status: "VALID_WITH_WARNINGS"

blockingErrorCount: 0
warningCount: 1
recommendationCount: 1

warnings:
  - issueId: "warning_001"
    ruleId: "STATE-007"
    ruleVersion: "0.1"
    category: "ATHLETE_STATE"
    severity: "WARNING"
    code: "LOW_SHOULDER_SORENESS"
    message: "Low right-shoulder soreness requires monitoring."
    affectedElements:
      - "explosive_heavy_bag_single_strike"
      - "bench_press"
    evidenceReferences:
      - "athleteState.soreness[SHOULDER_RIGHT]"
    ruleReferences:
      - "STATE-007"
    suggestedResolution: "Stop or reduce upper-body work if symptoms increase."

recommendations:
  - issueId: "recommendation_001"
    ruleId: "FEEDBACK-001"
    ruleVersion: "0.1"
    category: "PROGRESSION"
    severity: "RECOMMENDATION"
    code: "RECORD_NEXT_DAY_SHOULDER_RESPONSE"
    message: "Record next-day shoulder response."
    evidenceReferences:
      - "session.sessionWarnings"
    ruleReferences:
      - "VALIDATION_RULES_V0.1"
```

---

# Example — Invalid Session

```yaml
status: "INVALID"

blockingErrorCount: 2
warningCount: 0
recommendationCount: 1

blockingErrors:
  - issueId: "blocking_001"
    ruleId: "EXERCISE-010"
    ruleVersion: "0.1"
    category: "PAIN"
    severity: "BLOCKING"
    code: "PAIN_ALTERS_TECHNIQUE"
    message: "The selected lower-body Power exercise is invalid because pain alters landing mechanics."
    affectedElements:
      - "depth_jump"
    evidenceReferences:
      - "painContext.currentPain[KNEE_RIGHT]"
    ruleReferences:
      - "EXERCISE-010"
    suggestedResolution: "Remove the exercise and retrieve pain-compatible alternatives."
    backtrackStage: "EXERCISE_CANDIDATE_RETRIEVAL"

  - issueId: "blocking_002"
    ruleId: "CONFLICT-003"
    ruleVersion: "0.1"
    category: "CONFLICT"
    severity: "BLOCKING"
    code: "UNRESOLVED_MAJOR_CONFLICT"
    message: "A Major safety conflict remains unresolved."
    affectedElements:
      - "POWER"
      - "KNEE_RIGHT"
    evidenceReferences:
      - "conflictTrace.conflict_001"
    ruleReferences:
      - "CONFLICT-003"
    suggestedResolution: "Change the session objective or return no valid session."
    backtrackStage: "OBJECTIVE_INTERPRETATION"

recommendations:
  - issueId: "recommendation_001"
    ruleId: "STATE-003"
    ruleVersion: "0.1"
    category: "PAIN"
    severity: "RECOMMENDATION"
    code: "PROFESSIONAL_ASSESSMENT"
    message: "Seek appropriate assessment if symptoms persist or worsen."
    evidenceReferences:
      - "painContext"
    ruleReferences:
      - "STATE-003"
```

---

# Validation Invariants

The following conditions must always remain true:

1. Validation runs throughout the pipeline.
2. Every validation issue has a level.
3. Blocking Errors cannot be compensated by scores.
4. Blocking Errors prevent session delivery.
5. Warnings remain visible.
6. Recommendations do not change validity status.
7. Every generated session has exactly one primary adaptation.
8. Every selected module is canonical.
9. Every selected exercise is eligible.
10. Every selected exercise passes mandatory criteria.
11. Every exercise has an explicit purpose.
12. Every exercise has an executable prescription.
13. Power prescriptions protect quality and velocity.
14. Every Major and Critical conflict is resolved.
15. The session fits the available duration.
16. Session load fits current recovery capacity.
17. Recovery time fits the next key demand.
18. Every objective change is explicit.
19. Every substitution is transparent.
20. Every material assumption is visible.
21. Output status matches result type.
22. Engine Output matches the Decision Trace.
23. Safe fallbacks pass full validation.
24. Manual overrides cannot bypass Hard Safety rules.
25. Invalid sessions are never delivered as valid.

---

# Relationship With Other Engine Documents

Validation applies rules and data defined by:

* `MODULE_ENGINE.md`;
* `SESSION_GENERATION_PIPELINE.md`;
* `14_EXERCISE_SELECTION_RULES.md`;
* `15_SUBSTITUTION_RULES.md`;
* `16_SCORING_MODEL.md`;
* `17_CONFLICT_RULES.md`;
* `19_ENGINE_INPUT_SCHEMA.md`;
* `20_ENGINE_OUTPUT_SCHEMA.md`;
* `21_DECISION_TRACE.md`.

Those documents define:

* architecture;
* selection;
* scoring;
* conflicts;
* schemas;
* traceability.

The Validation Rules determine whether the combined result is acceptable.

---

# Implementation Principle

Validation should be implemented as independent, testable rules.

Example:

```text
validateInputSchema()
validateAthleteState()
validateConstraints()
validateObjective()
validateAdaptationPriorities()
validateModules()
validateExerciseEligibility()
validateScoringProcess()
validateConflicts()
validateSessionOrder()
validatePrescriptions()
validateLoad()
validateDuration()
validateSubstitutions()
validateProgression()
validateOutputSchema()
validateDecisionTrace()
buildValidationSummary()
```

Each validator should:

* receive structured input;
* return structured issues;
* identify its rule version;
* avoid changing data silently;
* identify the appropriate backtrack stage;
* remain independently testable.

Validation functions should normally report issues.

Pipeline orchestration decides how to resolve them.

---

# Definition of Success

The Validation Rules succeed when they prevent CAS from delivering a session that is:

* unsafe;
* medically incompatible;
* physiologically incoherent;
* impossible to execute;
* incomplete;
* excessively fatiguing;
* incompatible with recovery;
* incompatible with combat practice;
* inconsistent with its objective;
* structurally invalid;
* unexplained;
* inconsistent with its Decision Trace.

Validation does not succeed merely because it detects errors.

It succeeds when every delivered session has passed a complete and auditable quality gate.

---

# Final Principle

A plausible session is not necessarily a valid session.

A high-scoring session is not necessarily a valid session.

A requested session is not necessarily a valid session.

> Scoring asks which option is preferable.

> Conflict Rules ask which demands can coexist.

> Validation asks whether the final decision is allowed to leave the engine.
