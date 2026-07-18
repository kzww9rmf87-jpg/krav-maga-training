# REST AND TEMPO RULES

Version 0.1

---

# Purpose

The Rest and Tempo Rules define how the Combat Athlete System represents, selects, calculates, validates and adjusts recovery periods and movement tempo.

Their purpose is to ensure that rest and tempo are:

- compatible with the selected Capability Module;
- compatible with the selected Training Method;
- compatible with the selected exercise;
- compatible with the Exercise Role;
- derived from documented rules;
- adjusted only through documented contextual logic;
- structurally explicit;
- deterministic;
- safe;
- and explainable through the Decision Trace.

The Rest and Tempo Rules do not define every numerical rest duration or every tempo prescription for every exercise.

They define:

- the supported rest structures;
- the supported tempo structures;
- the selection hierarchy;
- the compatibility rules;
- the use of fixed, ranged and conditional recovery;
- the representation of movement phases;
- the distinction between measured tempo and movement intent;
- the interaction with intensity, volume, readiness and combat schedule;
- the validation rules;
- and the conditions under which generation must fail safely.

Exact values must be introduced only through documented module-specific, method-specific or exercise-specific rules.

---

# Core Principle

> Rest and tempo are prescription variables, not presentation details.

Rest controls recovery between efforts.

Tempo controls how movement phases are executed.

Both influence:

- fatigue;
- force production;
- power expression;
- technical quality;
- metabolic demand;
- tissue stress;
- total session duration;
- and adaptation specificity.

The engine must not assign default rest or tempo values merely because they are commonly used.

---

# Scope

These rules govern:

- rest type selection;
- rest scope;
- rest duration structure;
- conditional rest;
- recovery readiness conditions;
- rest adjustment;
- tempo applicability;
- tempo phase representation;
- qualitative movement intent;
- tempo-intensity compatibility;
- tempo-volume compatibility;
- session-duration interaction;
- validation;
- safe failure;
- and Decision Trace requirements.

These rules do not yet define:

- exact rest durations for every method;
- exact tempo phase values for every exercise;
- exact heart-rate recovery thresholds;
- exact breathing recovery thresholds;
- or exact readiness adjustment values.

Those values must be documented separately before implementation.

---

# Position in Prescription Generation

Rest and tempo resolution occur after:

- the exercise is selected;
- the Capability Module is known;
- the Training Method is resolved;
- the Exercise Role is known;
- the volume structure is selected;
- intensity is resolved where required;
- and exercise prescription capabilities are verified.

The expected sequence is:

```text
Exercise Selection
→ Method Resolution
→ Volume Resolution
→ Intensity Resolution
→ Rest Resolution
→ Tempo Resolution
→ Instructions
→ Stop Conditions
→ Contextual Adjustment
→ Validation
→ Final Prescription
```

Rest and tempo must not be generated before the method contract is known.

---

# Rest Definition

Rest is the prescribed recovery period between work efforts.

It may apply:

- between repetitions;
- between clusters;
- between sets;
- between rounds;
- between intervals;
- between exercises;
- or after a complete block.

Rest may be:

- fixed;
- ranged;
- conditional;
- or combined when explicitly documented.

Rest must always define its scope.

---

# Canonical Rest Structure

A rest prescription must use a structure equivalent to:

```ts
interface PrescriptionRest {
  type: RestType;

  betweenReps: RestTarget | null;
  betweenClusters: RestTarget | null;
  betweenSets: RestTarget | null;
  betweenRounds: RestTarget | null;
  betweenIntervals: RestTarget | null;
  betweenExercises: RestTarget | null;
  afterBlock: RestTarget | null;

  adjustments: RestAdjustment[];
  sourceRuleIds: string[];
  status: RestStatus;
}
```

Only fields relevant to the selected Training Method may be populated.

---

# Rest Types

The initial CAS rest vocabulary may include:

```ts
type RestType =
  | "fixed"
  | "range"
  | "conditional"
  | "fixed_with_condition"
  | "range_with_condition";
```

Additional types require a versioned schema update.

---

# Rest Target

A rest target may use:

```ts
type RestTarget =
  | {
      type: "fixed";
      duration: DurationTarget;
    }
  | {
      type: "range";
      min: DurationTarget;
      max: DurationTarget;
      selectionRuleId: string;
    }
  | {
      type: "conditional";
      conditionId: string;
      minimum: DurationTarget | null;
      maximum: DurationTarget | null;
    }
  | {
      type: "fixed_with_condition";
      duration: DurationTarget;
      conditionId: string;
    }
  | {
      type: "range_with_condition";
      min: DurationTarget;
      max: DurationTarget;
      conditionId: string;
      selectionRuleId: string;
    };
```

A ranged rest without a selection rule is incomplete.

A conditional rest without an observable condition is invalid.

---

# Rest Scope

Every rest target must define where it applies.

Possible scopes include:

```ts
type RestScope =
  | "between_repetitions"
  | "between_clusters"
  | "between_sets"
  | "between_rounds"
  | "between_intervals"
  | "between_exercises"
  | "after_block";
```

The engine must not infer scope from field position alone.

---

# Fixed Rest

Fixed rest defines one exact duration.

It may be used only when:

- the method contract requires or permits fixed rest;
- the duration is documented;
- the selected exercise and intensity are compatible;
- and the resulting session duration remains valid.

The engine must not create a fixed duration from an undocumented default.

---

# Rest Range

A rest range defines a minimum and maximum duration.

It may be used only when:

- both boundaries are documented;
- the rule explains how the athlete selects a value;
- the range remains compatible with the method;
- and the lower boundary does not compromise quality or safety.

The engine must not randomly select a value inside a rest range.

---

# Conditional Rest

Conditional rest ends when a documented observable criterion is satisfied.

Possible criteria may include:

- breathing control restored;
- heart rate returned to a defined threshold;
- technical readiness restored;
- grip recovered to a defined condition;
- pain or symptom absent;
- or another documented measurable criterion.

Vague conditions such as `rest until ready` are invalid unless readiness is operationally defined.

---

# Conditional Rest Boundaries

A conditional rest rule may define:

- a minimum duration;
- a maximum duration;
- both;
- or neither only when the method explicitly permits it.

A maximum may be required to preserve session duration.

A minimum may be required to protect quality or recovery.

---

# Rest Selection Hierarchy

Rest must be resolved using this hierarchy:

```text
Method-required rest structure
→ Module-specific rest rule
→ Intensity-specific rest requirement
→ Exercise-role-specific rule
→ Exercise-specific requirement
→ Documented fallback
→ Safe failure
```

The engine must not choose the shortest rest merely to fit the session.

---

# Method Contract for Rest

Every Training Method must define:

- whether rest is required;
- supported rest scopes;
- required rest scopes;
- allowed rest types;
- minimum and maximum documented boundaries;
- interaction with intensity;
- interaction with volume;
- and fallback behavior.

A method requiring rest is invalid when no compatible rest rule exists.

---

# Exercise Compatibility for Rest

An Exercise Definition may define:

- mandatory recovery after high-impact efforts;
- mandatory reset time between repetitions;
- equipment transition requirements;
- side-switch recovery;
- grip recovery requirements;
- or other exercise-specific needs.

Exercise-specific rest requirements may increase rest.

They must not reduce a higher-priority safety requirement.

---

# Role Influence on Rest

The Exercise Role may influence rest structure.

For example:

- primary work may require quality-preserving recovery;
- primer work may require low fatigue;
- technical work may require recovery sufficient to preserve execution quality;
- accessory work may permit shorter documented recovery;
- conditioning work may use work-to-rest structures;
- recovery work may require minimal or no formal rest.

These examples are structural only.

Actual rules must be documented.

---

# Intensity and Rest Compatibility

Rest must be compatible with prescribed intensity.

The engine must detect conflicts such as:

- high relative load with rest below the documented minimum;
- maximal movement intent with insufficient recovery;
- technical work with recovery too short to preserve execution quality;
- conditioning intervals with recovery exceeding the method contract;
- or high-impact efforts without required recovery.

The engine must not silently preserve incompatible values.

---

# Volume and Rest Compatibility

Rest must also be compatible with volume.

A rule may define different rest requirements based on:

- number of repetitions;
- duration of effort;
- distance;
- round duration;
- interval density;
- or cumulative set count.

The engine must use only documented relationships.

---

# Rest and Session Duration

Rest contributes to estimated session duration.

The engine must include:

- all between-set rest;
- all between-round rest;
- all between-interval rest;
- all cluster rest;
- documented between-exercise rest;
- and documented after-block rest.

Rest must not be omitted from duration estimation.

---

# Duration Conflict Rule

When session duration is exceeded, rest may be reduced only when:

- the method permits reduction;
- the new value remains above the documented minimum;
- intensity and technical quality remain compatible;
- safety is preserved;
- and the adjustment is traceable.

The engine must normally reduce optional work before reducing quality-preserving rest.

---

# Readiness Adjustment for Rest

Readiness may modify rest only through documented rules.

Possible actions may include:

- increasing rest;
- switching from fixed to conditional rest;
- lowering density;
- or selecting a lower-fatigue method.

Low readiness must not automatically reduce rest.

High readiness must not automatically reduce rest.

---

# Combat Schedule Adjustment for Rest

Combat schedule protection may require:

- increased recovery;
- lower density;
- removal of incomplete-recovery methods;
- or substitution of the exercise or method.

The engine must not shorten rest when doing so could impair a protected combat session.

---

# Medical Adjustment for Rest

Medical or safety rules may require:

- longer rest;
- symptom-based conditional rest;
- heart-rate recovery criteria;
- blood-pressure or dizziness-related stop rules;
- or complete exercise termination.

Medical requirements take priority over session duration.

---

# Rest Adjustment Structure

A rest adjustment may use:

```ts
interface RestAdjustment {
  adjustmentId: string;
  reason:
    | "readiness"
    | "medical_constraint"
    | "combat_schedule"
    | "recovery_protection"
    | "session_duration"
    | "equipment_transition"
    | "method_substitution";
  field: RestScope;
  previousValue: RestTarget | null;
  adjustedValue: RestTarget | null;
  sourceRuleId: string;
}
```

Every rest adjustment must remain traceable.

---

# Rest Status

A resolved rest prescription may use:

```ts
type RestStatus =
  | "complete"
  | "adjusted"
  | "incomplete"
  | "invalid"
  | "failed";
```

`rest: null` is valid only when the method explicitly defines rest as not applicable.

It must not represent unresolved rest.

---

# Tempo Definition

Tempo defines the timing or intent of movement phases.

Tempo may describe:

- eccentric phase;
- bottom transition or pause;
- concentric phase;
- top transition or pause;
- hold duration;
- or global movement intent.

Tempo may be:

- phase-timed;
- phase-intent-based;
- hold-based;
- global-intent-based;
- or not applicable.

---

# Canonical Tempo Structure

A tempo prescription must use a structure equivalent to:

```ts
interface PrescriptionTempo {
  type: TempoType;

  eccentric: TempoPhase | null;
  bottom: TempoPhase | null;
  concentric: TempoPhase | null;
  top: TempoPhase | null;
  hold: TempoPhase | null;
  globalIntent: MovementIntent | null;

  adjustments: TempoAdjustment[];
  sourceRuleIds: string[];
  status: TempoStatus;
}
```

Only relevant fields may be populated.

---

# Tempo Types

The initial CAS tempo vocabulary may include:

```ts
type TempoType =
  | "phase_timed"
  | "phase_intent"
  | "isometric_hold"
  | "global_intent"
  | "mixed";
```

The engine must not generate undocumented tempo types.

---

# Tempo Phase

A tempo phase may use:

```ts
type TempoPhase =
  | {
      type: "timed";
      seconds: number;
    }
  | {
      type: "intent";
      intent: MovementIntent;
    }
  | {
      type: "hold";
      seconds: number;
    }
  | {
      type: "none";
    };
```

The engine must distinguish between:

- exact time;
- qualitative intent;
- and no prescribed phase.

---

# Movement Intent

A finite vocabulary may include:

```ts
type MovementIntent =
  | "controlled"
  | "smooth"
  | "deliberate"
  | "explosive"
  | "maximal_acceleration"
  | "maximal_safe_speed"
  | "technical_precision";
```

Only documented values may be implemented.

Qualitative intent must not be presented as measured velocity.

---

# Tempo Applicability

Tempo may be required, optional or forbidden.

Every method contract must define:

```ts
type TempoPolicy =
  | "required"
  | "optional"
  | "forbidden";
```

The Exercise Definition must also declare whether tempo is supported.

A tempo prescription is valid only when both the method and exercise permit it.

---

# Phase-Timed Tempo

Phase-timed tempo may be used only when:

- the movement has identifiable phases;
- the method requires controlled timing;
- the exercise supports phase control;
- the values are documented;
- and the timing does not contradict the intensity target.

The engine must not assign a four-phase tempo to exercises without meaningful four-phase structure.

---

# Isometric Hold Tempo

An isometric hold may be represented through:

- volume duration;
- tempo hold;
- or both only when their scopes are distinct and documented.

The engine must avoid duplicating the same duration in multiple fields without semantic purpose.

---

# Global Movement Intent

Global intent may be used for:

- jumps;
- throws;
- sprints;
- striking;
- ballistic lifts;
- or other movements where exact phase timing is not appropriate.

The engine must not force timed eccentric or concentric phases onto ballistic work unless explicitly documented.

---

# Tempo Selection Hierarchy

Tempo must be resolved using:

```text
Method-required tempo
→ Module-specific tempo rule
→ Intensity-specific tempo compatibility
→ Exercise-role-specific rule
→ Exercise-specific rule
→ Explicit null when optional and unsupported
→ Safe failure when required
```

The engine must not add tempo because the field exists.

---

# Tempo and Intensity Compatibility

Tempo must remain compatible with intensity.

The engine must detect contradictions such as:

- maximal acceleration with a slow timed concentric phase;
- maximal safe speed with prolonged pauses that invalidate the method;
- very high external load with an unsupported prolonged eccentric;
- technical precision with uncontrolled maximal intent;
- or recovery work with high-impact explosive intent.

Conflicts must be resolved by rule priority.

---

# Tempo and Volume Compatibility

Tempo changes repetition duration and session duration.

When phase timing is prescribed, the engine must account for it when estimating:

- set duration;
- time under tension;
- total exercise duration;
- and session duration.

The engine must not use a default repetition duration when explicit tempo exists.

---

# Tempo and Exercise Role

Role may influence tempo.

Examples may include:

- primer: quality and acceleration intent;
- primary: method-specific timing;
- accessory: controlled execution where documented;
- technical: precision-oriented timing;
- robustness: controlled tissue-loading timing;
- recovery: smooth low-demand movement.

These examples do not authorize implementation without documented rules.

---

# Tempo Adjustment

Tempo may be adjusted only when a documented rule permits it.

Possible reasons include:

- medical constraint;
- technical regression;
- readiness;
- exercise substitution;
- or method substitution.

Tempo should not normally be altered solely to fit session duration.

---

# Tempo Adjustment Structure

A tempo adjustment may use:

```ts
interface TempoAdjustment {
  adjustmentId: string;
  reason:
    | "readiness"
    | "medical_constraint"
    | "technical_regression"
    | "method_substitution"
    | "exercise_substitution";
  field:
    | "eccentric"
    | "bottom"
    | "concentric"
    | "top"
    | "hold"
    | "global_intent";
  previousValue: TempoPhase | MovementIntent | null;
  adjustedValue: TempoPhase | MovementIntent | null;
  sourceRuleId: string;
}
```

Every adjustment must be traceable.

---

# Tempo Status

A resolved tempo prescription may use:

```ts
type TempoStatus =
  | "complete"
  | "adjusted"
  | "incomplete"
  | "invalid"
  | "failed";
```

`tempo: null` is valid when:

- the method permits it;
- the exercise does not require controlled tempo;
- and execution remains sufficiently defined through intensity, instructions and stop conditions.

---

# No Ambiguous Tempo Strings

The internal model must not rely on strings such as:

```text
3-1-X-0
slow eccentric
fast up
controlled
```

unless they have already been normalized into structured fields.

The display layer may generate conventional notation from structured data.

---

# Tempo Display

The presentation layer may render structured tempo as:

```text
3-second descent
1-second pause
explosive ascent
no pause at the top
```

The display must not alter the canonical tempo.

---

# Rest and Tempo Conflict Priority

When rest or tempo rules conflict, the engine must apply:

```text
Medical and Safety Constraints
→ Hard Constraints
→ Module Objective
→ Training Method
→ Intensity Compatibility
→ Exercise Role
→ Exercise Definition
→ Readiness
→ Combat Schedule
→ Session Duration
→ Preference
```

If the conflict cannot be resolved, generation must fail safely.

---

# Rest Validation

Rest validation must verify:

1. whether rest is required;
2. rest type validity;
3. scope validity;
4. duration validity;
5. range validity;
6. condition validity;
7. method compatibility;
8. exercise compatibility;
9. intensity compatibility;
10. volume compatibility;
11. medical compliance;
12. adjustment traceability;
13. session-duration compatibility;
14. and source-rule completeness.

---

# Tempo Validation

Tempo validation must verify:

1. tempo policy;
2. tempo type validity;
3. phase validity;
4. value validity;
5. method compatibility;
6. exercise compatibility;
7. intensity compatibility;
8. role compatibility;
9. volume compatibility;
10. adjustment traceability;
11. duration estimation compatibility;
12. and source-rule completeness.

---

# Numerical Validation

Rest and timed tempo values must be:

- finite;
- strictly greater than zero when present;
- expressed in supported units;
- within documented boundaries;
- and valid for their scope.

The engine must reject:

- zero-duration required rest;
- negative rest;
- negative tempo;
- NaN;
- infinite values;
- inverted ranges;
- and unsupported fractional values where integers are required.

---

# Conditional Validation

A conditional rest is valid only when:

- the condition exists;
- the condition is observable or measurable;
- the athlete can apply it;
- the condition is compatible with the method;
- and required minimum or maximum boundaries are present.

---

# Rest Failure Codes

The implementation should use finite reason codes.

Initial categories may include:

```text
REST_NOT_REQUIRED
REST_REQUIRED_MISSING
REST_TYPE_UNSUPPORTED
REST_SCOPE_INVALID
REST_DURATION_INVALID
REST_RANGE_INVALID
REST_SELECTION_RULE_MISSING
REST_CONDITION_MISSING
REST_CONDITION_UNMEASURABLE
REST_METHOD_INCOMPATIBLE
REST_EXERCISE_INCOMPATIBLE
REST_INTENSITY_INCOMPATIBLE
REST_BELOW_MINIMUM
REST_ABOVE_MAXIMUM
REST_DURATION_CONFLICT
REST_MEDICAL_CONSTRAINT
REST_RULE_SOURCE_MISSING
```

`REST_NOT_REQUIRED` is not a failure when `rest: null` is explicitly valid.

---

# Tempo Failure Codes

Initial categories may include:

```text
TEMPO_NOT_REQUIRED
TEMPO_REQUIRED_MISSING
TEMPO_TYPE_UNSUPPORTED
TEMPO_PHASE_INVALID
TEMPO_VALUE_INVALID
TEMPO_METHOD_INCOMPATIBLE
TEMPO_EXERCISE_INCOMPATIBLE
TEMPO_INTENSITY_CONFLICT
TEMPO_VOLUME_CONFLICT
TEMPO_ROLE_INCOMPATIBLE
TEMPO_DURATION_CONFLICT
TEMPO_RULE_SOURCE_MISSING
```

`TEMPO_NOT_REQUIRED` is not a failure when `tempo: null` is explicitly valid.

---

# Recoverable Rest Failure

A rest failure is recoverable only when a documented alternative exists.

Possible actions include:

- use another allowed rest type;
- increase rest within allowed limits;
- use a compatible lower-density method;
- reduce volume within documented limits;
- substitute the exercise;
- or remove optional work.

The engine must not improvise a recovery value.

---

# Recoverable Tempo Failure

A tempo failure is recoverable only when a documented alternative exists.

Possible actions include:

- use global movement intent instead of phase timing;
- remove optional tempo;
- use another compatible method;
- substitute the exercise;
- or use a documented regression.

---

# Non-Recoverable Failure

Failure is non-recoverable when:

- mandatory rest cannot be resolved;
- mandatory tempo cannot be resolved;
- safety boundaries cannot be met;
- intensity remains incompatible;
- no valid method exists;
- or no documented source justifies the value.

The prescription must not reach final output.

---

# Decision Trace Integration

The Decision Trace must record for rest:

- whether rest was required;
- selected rest type;
- selected scopes;
- base values;
- conditional criteria;
- contextual adjustments;
- duration impact;
- conflicts;
- resolution;
- final values;
- and validation result.

The Decision Trace must record for tempo:

- whether tempo was required;
- selected tempo type;
- selected phases;
- movement intent;
- base values;
- adjustments;
- compatibility checks;
- duration impact;
- conflicts;
- final values;
- and validation result.

---

# Trace Example Structure

A trace entry may use:

```ts
interface RestTempoTraceEntry {
  prescriptionId: string;
  exerciseId: string;
  methodId: string;

  restRequired: boolean;
  tempoPolicy: TempoPolicy;

  baseRest: PrescriptionRest | null;
  restAdjustments: RestAdjustment[];
  finalRest: PrescriptionRest | null;

  baseTempo: PrescriptionTempo | null;
  tempoAdjustments: TempoAdjustment[];
  finalTempo: PrescriptionTempo | null;

  sourceRuleIds: string[];

  validationStatus: "passed" | "failed";
  validationMessages: string[];
}
```

---

# Determinism

Given identical:

- validated input;
- selected module;
- selected method;
- selected exercise;
- Exercise Role;
- intensity;
- volume;
- readiness;
- combat schedule;
- equipment;
- rule version;
- and knowledge-base version,

the engine must produce identical rest and tempo prescriptions.

Random selection is forbidden.

---

# No Invention Rule

The engine must never invent:

- a rest duration;
- a rest range;
- a recovery condition;
- a tempo phase;
- a tempo duration;
- a movement intent;
- a fallback rest structure;
- or a fallback tempo structure.

Every value must originate from:

- a documented rule;
- a validated athlete condition;
- a documented method contract;
- a documented exercise requirement;
- or a documented contextual adjustment.

---

# Minimum Implementation Boundary

CAS V0.1 should implement only rest and tempo structures for which all of the following exist:

- canonical schema;
- method contract;
- exercise capability rules;
- compatibility rules;
- numerical rules;
- conditional criteria where applicable;
- adjustment rules;
- session-duration integration;
- validation rules;
- and tests.

Unsupported structures must remain unavailable.

---

# Required Supporting Documents

The Rest and Tempo Rules depend on:

```text
24_PRESCRIPTION_MODEL.md
25_PRESCRIPTION_RULES.md
26_INTENSITY_MODEL.md
28_STOP_CONDITIONS.md
29_PRESCRIPTION_TEST_CASES.md
```

Method-specific numerical tables must exist before implementation.

---

# Acceptance Criteria

The Rest and Tempo Rules V0.1 are valid only if:

- rest is method-driven;
- tempo is applied only when relevant;
- all scopes are explicit;
- fixed, ranged and conditional rest are distinguishable;
- ranges include deterministic selection rules;
- conditions are observable or measurable;
- rest remains compatible with intensity and volume;
- tempo remains compatible with intensity and exercise structure;
- explicit tempo affects duration estimation;
- medical and safety rules have priority;
- contextual adjustments are bounded and traceable;
- null values cannot hide unresolved fields;
- unsupported prescriptions fail safely;
- every decision is traceable;
- and identical inputs produce identical results.

---

# Final Principle

> CAS must prescribe enough recovery to preserve the intended adaptation and enough movement control to preserve the intended execution.

Rest and tempo are valid only when they support the method, the athlete and the session objective without relying on undocumented defaults.