# INTENSITY MODEL

Version 0.1

---

# Purpose

The Intensity Model defines how the Combat Athlete System represents, selects, calculates, validates and adjusts exercise intensity.

Its purpose is to ensure that every prescribed intensity target is:

- structurally explicit;
- compatible with the selected Training Method;
- compatible with the selected exercise;
- supported by validated athlete data;
- derived from documented rules;
- safe;
- deterministic;
- and explainable through the Decision Trace.

The Intensity Model does not define every numerical intensity target for every Capability Module.

It defines:

- the supported intensity dimensions;
- the canonical data structures;
- the compatibility rules;
- the hierarchy for selecting an intensity method;
- the handling of missing athlete data;
- the interaction between multiple intensity metrics;
- the calculation and rounding principles;
- the contextual adjustment rules;
- and the conditions under which intensity resolution must fail safely.

Exact numerical ranges must be introduced only through documented module-specific, method-specific or exercise-specific rules.

---

# Core Principle

> Intensity is the level of demand required to produce the intended adaptation while preserving safety, technical quality and recovery.

Intensity must never be selected from the exercise name alone.

The same exercise may require different intensity structures depending on:

- the Capability Module;
- the Training Method;
- the Exercise Role;
- the athlete’s validated capacity;
- readiness;
- medical constraints;
- combat schedule;
- training phase;
- and session objective.

The prescription engine must select the intensity representation that best matches the intended adaptation and the available validated data.

---

# Scope

The Intensity Model governs:

- intensity representation;
- intensity type selection;
- primary and secondary intensity metrics;
- athlete-reference requirements;
- intensity calculation;
- intensity range resolution;
- intensity compatibility;
- contextual adjustment;
- load rounding;
- intensity validation;
- safe failure;
- and Decision Trace requirements.

The Intensity Model does not yet define:

- all module-specific percentages;
- all method-specific RPE targets;
- all RIR targets;
- all heart-rate zones;
- all velocity thresholds;
- all pace targets;
- or all technical-intensity classifications.

These values must be documented separately before implementation.

---

# Position in Prescription Generation

Intensity resolution occurs after:

- the exercise has been selected;
- the Capability Module is known;
- the Training Method is resolved;
- the Exercise Role is known;
- the volume structure is selected;
- and exercise prescription capabilities are verified.

The expected sequence is:

```text
Exercise Selection
→ Method Resolution
→ Volume Structure Resolution
→ Intensity Type Resolution
→ Athlete Reference Resolution
→ Base Intensity Calculation
→ Contextual Adjustment
→ Rounding
→ Intensity Validation
→ Final Prescription
```

The engine must not calculate intensity before confirming that the selected method and exercise support the required intensity type.

---

# Definition of Intensity

Intensity is the level of effort, resistance, speed, pace, technical demand or physiological demand assigned to a prescribed exercise.

Intensity may be represented through:

- external load;
- relative load;
- subjective effort;
- repetition reserve;
- movement velocity;
- heart rate;
- pace;
- body-mass relationship;
- technical intent;
- impact intent;
- or another explicitly documented metric.

No single metric is universally valid.

The selected metric must match the exercise and method.

---

# Canonical Intensity Structure

A prescribed intensity must use a structured representation equivalent to:

```ts
interface PrescriptionIntensity {
  primaryMetric: IntensityMetric;
  secondaryMetrics: IntensityMetric[];
  calculation: IntensityCalculation | null;
  adjustments: IntensityAdjustment[];
  sourceRuleIds: string[];
  status: IntensityStatus;
}
```

The exact TypeScript implementation may evolve, but the semantic structure must remain stable.

---

# Intensity Metric Structure

An intensity metric may use:

```ts
interface IntensityMetric {
  type: IntensityType;
  target: IntensityTarget;
  unit: IntensityUnit;
  scope: IntensityScope;
  reference: IntensityReference | null;
}
```

The model must not encode intensity as an ambiguous free-text string.

---

# Supported Intensity Types

The initial CAS intensity vocabulary may include:

```ts
type IntensityType =
  | "absolute_load"
  | "percentage_1rm"
  | "percentage_training_max"
  | "percentage_body_mass"
  | "rpe"
  | "rir"
  | "velocity"
  | "heart_rate"
  | "pace"
  | "technical_effort"
  | "movement_intent"
  | "impact_intent"
  | "assistance_level"
  | "resistance_category";
```

Only intensity types that are fully documented and supported by the current knowledge base may be implemented.

Additional types require a versioned schema update.

---

# Intensity Targets

An intensity target must be one of:

- fixed;
- range;
- maximum;
- minimum;
- category;
- or conditional.

A canonical structure may use:

```ts
type IntensityTarget =
  | {
      type: "fixed";
      value: number;
    }
  | {
      type: "range";
      min: number;
      max: number;
    }
  | {
      type: "maximum";
      value: number;
    }
  | {
      type: "minimum";
      value: number;
    }
  | {
      type: "category";
      value: string;
    }
  | {
      type: "conditional";
      conditionId: string;
    };
```

Ranges must always define both boundaries.

Categories must come from a finite documented vocabulary.

---

# Intensity Scope

Every intensity target must define its scope.

Possible scopes may include:

```ts
type IntensityScope =
  | "per_repetition"
  | "per_set"
  | "per_round"
  | "per_interval"
  | "per_exercise"
  | "total_block";
```

The engine must not assume scope from context.

---

# Intensity Units

Supported units may include:

```ts
type IntensityUnit =
  | "kilograms"
  | "percentage"
  | "rpe_scale_1_10"
  | "repetitions"
  | "meters_per_second"
  | "beats_per_minute"
  | "seconds_per_meter"
  | "minutes_per_kilometer"
  | "category"
  | "body_mass_multiple";
```

The unit must be compatible with the selected intensity type.

For example:

- `percentage_1rm` uses `percentage`;
- `absolute_load` uses `kilograms`;
- `rpe` uses `rpe_scale_1_10`;
- `rir` uses `repetitions`;
- `velocity` may use `meters_per_second`;
- `technical_effort` uses `category`.

Invalid type-unit combinations must fail validation.

---

# Primary Intensity Metric

Every prescription requiring intensity must have one primary intensity metric.

The primary metric is the metric that directly governs execution.

Examples may include:

- percentage of one-repetition maximum for a strength method;
- RPE for an autoregulated resistance method;
- repetitions in reserve for a hypertrophy method;
- movement velocity for ballistic work;
- heart-rate range for aerobic conditioning;
- technical-effort category for skill work;
- or movement intent for explosive exercises.

The primary metric must be sufficient to guide the athlete.

---

# Secondary Intensity Metrics

Secondary metrics may be used to:

- constrain execution;
- verify compatibility;
- provide autoregulation;
- protect technical quality;
- or define a stop threshold.

Examples may include:

- primary: percentage of one-repetition maximum;
- secondary: maximum RPE;
- secondary: minimum repetitions in reserve.

Secondary metrics must not contradict the primary metric.

A secondary metric must have a documented purpose.

The engine must not add secondary metrics merely because they are available.

---

# Intensity Selection Hierarchy

The primary intensity type must be resolved using this hierarchy:

```text
Method-required intensity type
→ Module-specific intensity type
→ Exercise-role-specific allowed intensity type
→ Exercise-supported documented fallback
→ Safe failure
```

The engine must not choose an intensity type based on convenience alone.

---

# Method Requirement

Every Training Method must define:

- required intensity types;
- allowed intensity types;
- forbidden intensity types;
- required athlete references;
- allowed secondary metrics;
- and fallback behavior.

A method requiring a specific intensity type is invalid when the exercise or athlete data cannot support it.

---

# Exercise Compatibility

Each Exercise Definition must specify which intensity types it supports.

Examples may include:

- externally loaded barbell exercises support absolute and relative load;
- bodyweight exercises may support assistance level, body-mass relationship, RPE or RIR;
- jumps and throws may support movement intent or velocity;
- bag work may support technical effort or impact intent;
- continuous conditioning may support heart rate, pace or RPE;
- carries may support absolute load, body-mass percentage or resistance category.

These examples are structural only.

The actual compatibility must be documented in each Exercise Definition.

---

# Exercise Role Compatibility

The Exercise Role may restrict intensity selection.

For example:

- a primer may require low fatigue and high movement quality;
- a primary strength exercise may require a load-based metric;
- a technical exercise may prioritize quality over fatigue;
- an accessory exercise may allow RPE or RIR;
- a recovery exercise may forbid high-intensity targets.

No role-specific rule may override medical or safety constraints.

---

# Absolute Load

`absolute_load` represents an external resistance expressed in kilograms.

It may be used only when:

- the exercise supports external loading;
- the equipment supports measurable loading;
- the load can be prescribed deterministically;
- and the selected method permits absolute load.

A valid absolute-load metric must define:

- target load;
- unit;
- scope;
- equipment or loading mode when relevant;
- calculation source;
- and rounding rule.

The engine must not invent a kilogram value.

---

# Relative Load Based on One-Repetition Maximum

`percentage_1rm` represents load relative to a validated one-repetition maximum.

It may be used only when:

- the exercise supports this metric;
- the method permits it;
- a valid one-repetition maximum exists;
- the one-repetition maximum applies to the exact exercise or a documented equivalent;
- and the measurement remains sufficiently current according to documented rules.

The engine must not use a one-repetition maximum from an unrelated exercise.

---

# One-Repetition Maximum Validity

A one-repetition maximum reference must contain:

- exercise identifier;
- value;
- unit;
- measurement date;
- measurement type;
- confidence or validation status;
- and source.

Possible measurement types may include:

- direct test;
- validated estimated one-repetition maximum;
- training maximum conversion;
- or another documented method.

The current CAS implementation must use only measurement types already documented.

---

# Estimated One-Repetition Maximum

An estimated one-repetition maximum may be used only when:

- the estimation formula is documented;
- the source performance set is valid;
- the repetition range is permitted by the formula;
- the set was completed under acceptable technical conditions;
- the estimate has not been invalidated by age or context;
- and the method allows estimated references.

The engine must record the formula identifier in the Decision Trace.

The engine must not estimate one-repetition maximum from incomplete or unsupported data.

---

# Training Maximum

`percentage_training_max` represents load relative to a documented training maximum.

The training maximum must be:

- explicitly stored;
- derived through a documented rule;
- linked to the exercise;
- versioned or dated;
- and validated.

The engine must not silently treat a one-repetition maximum as a training maximum.

---

# Percentage of Body Mass

`percentage_body_mass` represents external resistance relative to validated athlete body mass.

It may be used only when:

- athlete body mass exists;
- the measurement is considered valid;
- the exercise supports this intensity type;
- and the calculation rule is documented.

The engine must not use an outdated or inferred body mass without an explicit validity rule.

---

# Rate of Perceived Exertion

`rpe` represents subjective effort using a documented scale.

CAS V0.1 should use one normalized scale only.

If the `rpe_scale_1_10` unit is used:

- 1 is the lowest defined effort;
- 10 is the highest defined effort;
- decimal values are permitted only if explicitly supported;
- and all targets must remain within the documented scale.

The model must not mix different RPE scales.

---

# RPE Applicability

RPE may be used when:

- the exercise and method support subjective autoregulation;
- the athlete can reasonably assess effort;
- no higher-priority objective metric is required;
- and the rule defines how RPE interacts with volume and stop conditions.

RPE must not replace missing safety data.

---

# Repetitions in Reserve

`rir` represents the estimated number of technically valid repetitions remaining before the defined limit.

The rule must specify whether the limit means:

- technical failure;
- concentric failure;
- velocity threshold;
- or another documented endpoint.

RIR is invalid when the endpoint is undefined.

RIR targets must use non-negative values.

---

# RPE and RIR Relationship

RPE and RIR may be used together only when a documented mapping exists.

The engine must not assume a universal mathematical equivalence.

When both are present:

- one must be primary;
- the other must have a defined validation or stop role;
- and contradictions must fail validation.

---

# Velocity

`velocity` represents measured or intended movement speed.

Measured velocity may be used only when:

- compatible measurement equipment exists;
- the exercise supports reliable measurement;
- the metric and unit are documented;
- and the method defines target and stop thresholds.

Intended velocity may instead be represented through `movement_intent`.

The engine must not present intended maximal speed as measured velocity.

---

# Movement Intent

`movement_intent` represents the intended execution speed or acceleration.

Documented categories may include:

```text
controlled
smooth
explosive
maximal_acceleration
maximal_safe_speed
```

The final vocabulary must be finite and documented.

Movement intent is qualitative.

It must not be represented as an objective velocity value.

---

# Technical Effort

`technical_effort` represents the level of challenge allowed while preserving technical execution.

Documented categories may include:

```text
rehearsal
easy_technical
moderate_technical
high_quality
competition_specific
```

Only documented categories may be used.

Technical effort must be paired with clear execution and stop conditions when required.

---

# Impact Intent

`impact_intent` represents the intended force of striking, throwing, landing or contact.

It may be used only for exercises where impact is a meaningful prescription dimension.

Documented categories may include:

```text
no_impact
light_contact
technical_contact
moderate_power
high_power
maximal_safe_power
```

The engine must not prescribe maximal impact without compatible equipment, exercise definition, athlete readiness and safety rules.

---

# Heart Rate

`heart_rate` may be used only when:

- heart-rate data is available during execution;
- the athlete reference is valid;
- the method defines the target model;
- and the selected exercise supports heart-rate prescription.

The target may be expressed as:

- absolute beats per minute;
- percentage of validated maximum heart rate;
- percentage of heart-rate reserve;
- or another documented method.

The engine must not mix heart-rate models.

---

# Maximum Heart Rate

Maximum heart rate must not be estimated from age unless CAS explicitly documents and validates the chosen formula.

When a validated measured value is unavailable, the engine must use a documented alternative intensity method or fail safely.

---

# Pace

`pace` may be used for cyclical or distance-based work when pace is measurable and method-compatible.

A pace prescription must define:

- value or range;
- unit;
- scope;
- reference basis;
- and adjustment rules.

The engine must not convert between pace units without a documented deterministic conversion.

---

# Assistance Level

`assistance_level` may be used for exercises where assistance changes difficulty.

It may include:

- machine assistance;
- band assistance;
- counterweight;
- partner assistance;
- or another documented support.

The assistance target must be measurable or selected from a finite equipment-specific category.

The engine must not use vague instructions such as `use some assistance`.

---

# Resistance Category

`resistance_category` may be used when precise load measurement is not possible but a finite documented resistance system exists.

Examples may include:

- band category;
- sled resistance category;
- medicine-ball class;
- cable-stack setting;
- or implement class.

Each category must map to a known equipment definition.

The engine must not create generic categories without a documented equipment reference.

---

# Athlete Reference Structure

Intensity calculations that depend on athlete data must reference a structured object equivalent to:

```ts
interface IntensityReference {
  referenceType:
    | "one_rep_max"
    | "training_max"
    | "body_mass"
    | "max_heart_rate"
    | "heart_rate_reserve"
    | "max_aerobic_speed"
    | "baseline_velocity"
    | "baseline_pace"
    | "equipment_setting";
  value: number | string;
  unit: string;
  sourceId: string;
  measuredAt: string | null;
  validUntil: string | null;
  confidence: "validated" | "estimated" | "provisional";
}
```

A completed intensity calculation must not reference unknown data.

---

# Reference Priority

When multiple valid references exist, the engine must follow a documented priority.

A default hierarchy may be:

```text
Recent validated direct measurement
→ Recent validated field estimate
→ Valid training maximum
→ Valid provisional estimate explicitly permitted by the method
→ Alternative intensity type
→ Safe failure
```

The final hierarchy must be documented per metric.

---

# Reference Freshness

Every athlete-reference type must define freshness rules.

A reference may become invalid due to:

- age of measurement;
- injury;
- detraining;
- significant body-mass change;
- major change in technique;
- equipment change;
- or another documented factor.

The engine must not assume indefinite validity.

---

# Base Intensity Calculation

The base intensity is calculated before contextual adjustments.

It must be derived from:

- module rule;
- method rule;
- Exercise Role;
- athlete reference;
- and exercise capabilities.

The base intensity must already satisfy all structural requirements.

---

# Calculation Structure

A deterministic intensity calculation may use:

```ts
interface IntensityCalculation {
  calculationId: string;
  formulaId: string;
  inputs: IntensityCalculationInput[];
  rawResult: number | null;
  roundedResult: number | null;
  outputUnit: IntensityUnit;
  sourceRuleIds: string[];
}
```

Every calculated load must remain reproducible.

---

# Formula Requirements

A formula may be used only when:

- it is documented;
- its inputs are defined;
- its domain is defined;
- its rounding rule is defined;
- its minimum and maximum boundaries are defined;
- and tests cover representative cases.

The engine must reject calculations outside the valid formula domain.

---

# Percentage Calculation

A percentage-based external load may be calculated as:

```text
Reference Load × Prescribed Percentage
```

This general relationship is structural only.

The prescribed percentage and reference type must come from documented rules.

The result must then pass equipment-specific rounding and boundary validation.

---

# Rounding Principle

Rounding must be deterministic and equipment-aware.

Rounding may depend on:

- smallest available plate increment;
- dumbbell increments;
- kettlebell availability;
- machine-stack increments;
- band categories;
- medicine-ball availability;
- or another documented equipment constraint.

The engine must not round to a load that is unavailable.

---

# Rounding Direction

The rounding rule must specify whether to use:

- nearest available load;
- round down;
- round up;
- or another deterministic rule.

Safety-critical or ceiling-based prescriptions must not round above the permitted intensity.

The trace must record the raw and rounded values.

---

# Bilateral and Unilateral Load

For unilateral exercises, the prescription must specify whether load is:

- per hand;
- per side;
- total external load;
- combined implement load;
- or asymmetrical.

The engine must not display a single ambiguous kilogram value.

---

# Bodyweight and Added Load

For loaded bodyweight exercises, the intensity model must distinguish between:

- body mass;
- added external load;
- assistance;
- and effective system load.

The engine must not treat added load as total system load unless the method explicitly defines that calculation.

---

# Range Resolution

An intensity range may be prescribed only when:

- both boundaries are documented;
- the range has a defined selection or autoregulation rule;
- the athlete can operationally choose within it;
- and the stop conditions prevent exceeding the intended demand.

The engine must not output a range without explaining how to use it.

---

# Fixed Versus Autoregulated Intensity

A fixed intensity uses one exact target.

An autoregulated intensity allows adjustment within documented boundaries using a defined metric such as:

- RPE;
- RIR;
- velocity;
- heart rate;
- pace;
- or technical quality.

Autoregulation must not mean unrestricted athlete choice.

---

# Autoregulation Requirements

Every autoregulated prescription must define:

- primary control metric;
- allowed range;
- starting rule;
- adjustment step;
- upper boundary;
- lower boundary;
- stop condition;
- and post-set or post-interval decision rule.

Without these elements, the autoregulated prescription is incomplete.

---

# Contextual Adjustment Order

Intensity adjustments must be applied in this order:

```text
Medical and Safety Constraints
→ Hard Constraints
→ Readiness
→ Combat Schedule
→ Recovery Protection
→ Session Duration
→ Equipment Availability
→ Athlete Preference
```

Higher-priority adjustments may override lower-priority targets.

No adjustment may exceed documented boundaries.

---

# Readiness Adjustment

Readiness may modify intensity only through documented rules.

A readiness rule must define:

- triggering readiness state;
- affected intensity type;
- allowed reduction or alternative;
- minimum valid intensity;
- preservation requirement;
- and failure behavior.

The engine must not invent a readiness reduction percentage.

---

# Low Readiness

When low readiness affects intensity, the engine must follow a documented hierarchy such as:

```text
Preserve technique and safety
→ Use lower documented intensity within the same method
→ Use an approved autoregulated metric
→ Use a lower-fatigue compatible method
→ Substitute the exercise
→ Remove the exercise or module if permitted
→ Fail safely
```

The exact action must be rule-driven.

---

# High Readiness

High readiness must not automatically increase intensity.

An increase may occur only when:

- a progression rule exists;
- current phase permits progression;
- recent performance data supports it;
- no combat schedule conflict exists;
- and upper boundaries remain respected.

Readiness alone is not sufficient evidence for progression.

---

# Combat Schedule Adjustment

Combat schedule may require intensity reduction when the CAS session could impair a protected combat session.

The rule must define:

- conflicting combat session;
- affected region or quality;
- protected time window;
- allowed intensity adjustment;
- and failure behavior.

The engine must not apply generic reductions to all exercises.

---

# Recovery Protection

Recovery constraints may cap intensity even when readiness is acceptable.

Recovery protection may consider:

- accumulated training load;
- recent high-intensity exposure;
- local muscular fatigue;
- impact exposure;
- grip fatigue;
- eccentric stress;
- or another documented factor.

Every cap must be traceable.

---

# Session Duration Interaction

Session-duration constraints should normally modify:

- exercise count;
- optional volume;
- transition structure;
- or rest structure within documented limits

before modifying intensity.

Intensity must not be increased to compensate for reduced volume unless a documented method rule explicitly permits it.

Intensity must not be reduced merely to shorten a session unless the method and minimum effective dose remain valid.

---

# Equipment Adjustment

When the exact calculated load is unavailable, the engine may:

- round according to documented rules;
- select a documented equipment-equivalent variation;
- switch to a compatible intensity type;
- substitute the exercise;
- or fail safely.

It must not prescribe unavailable equipment.

---

# Medical Constraints

Medical constraints may:

- prohibit an intensity type;
- cap intensity;
- require subjective control;
- require technical-only execution;
- require additional stop conditions;
- or prohibit the exercise entirely.

Medical constraints take priority over all adaptation targets.

---

# Pain

Pain must not be used as an intensity target.

A prescription must never instruct the athlete to reach a pain threshold unless a documented clinical protocol explicitly permits and defines it.

Pain is normally a stop or modification trigger.

---

# Technical Quality

Technical quality may cap intensity.

When the required technical standard cannot be maintained:

- the load must not be increased;
- the current set or effort may need to stop;
- the load may need to be reduced;
- or the exercise may need substitution.

The exact response must come from documented stop-condition rules.

---

# Fatigue and Intensity

The engine must distinguish between:

- intended effort;
- accumulated fatigue;
- and failure.

A high RPE caused by poor readiness is not automatically equivalent to successful high-intensity work.

The prescription must evaluate intensity against technical quality and method intent.

---

# Intensity Conflict Detection

The engine must detect contradictions such as:

- high percentage of one-repetition maximum with high repetitions beyond documented compatibility;
- fixed load that exceeds a medical cap;
- RPE target incompatible with RIR target;
- maximal movement intent with controlled slow concentric tempo;
- heart-rate target incompatible with the method;
- maximal impact intent during a technical-only session;
- or load rounded above a documented ceiling.

Conflicting intensity rules must not be silently merged.

---

# Conflict Resolution

Intensity conflicts must be resolved using:

```text
Safety
→ Hard Constraint
→ Module Objective
→ Method Contract
→ Exercise Role
→ Athlete Context
→ Equipment
→ Preference
```

If no valid resolution exists, intensity generation must fail.

---

# Intensity Validation

Intensity validation must verify:

1. intensity requirement;
2. primary metric presence;
3. type validity;
4. unit validity;
5. target validity;
6. scope validity;
7. method compatibility;
8. exercise compatibility;
9. role compatibility;
10. athlete-reference validity;
11. calculation validity;
12. rounding validity;
13. boundary compliance;
14. secondary-metric compatibility;
15. adjustment traceability;
16. medical compliance;
17. stop-condition compatibility;
18. and source-rule completeness.

---

# Numerical Validation

All numerical intensity values must be:

- finite;
- within documented metric boundaries;
- compatible with the selected unit;
- and valid for the selected method.

The engine must reject:

- negative loads;
- invalid percentages;
- RPE outside the documented scale;
- negative RIR;
- negative velocity;
- negative heart rate;
- invalid pace;
- inverted ranges;
- NaN;
- and infinite values.

---

# Percentage Validation

Percentage values must define their reference.

A percentage without a valid reference is incomplete.

The engine must distinguish between:

- percentage of one-repetition maximum;
- percentage of training maximum;
- percentage of body mass;
- percentage of maximum heart rate;
- and other percentage-based models.

The display value `80%` is insufficient internally.

---

# RPE Validation

RPE must:

- use the documented scale;
- remain within scale boundaries;
- match the selected method;
- and be interpretable by the athlete.

When a range is used, minimum must not exceed maximum.

---

# RIR Validation

RIR must:

- be a whole number unless decimal values are explicitly introduced;
- remain non-negative;
- define the failure endpoint;
- and be compatible with the repetition target.

A prescribed RIR greater than or equal to an impossible repetition context must fail semantic validation when such a rule is documented.

---

# Velocity Validation

Velocity targets must define:

- measured or intended status;
- unit;
- equipment requirement;
- target or range;
- and stop threshold when required.

The engine must not create velocity prescriptions without a measurable execution method when measurement is required.

---

# Heart-Rate Validation

Heart-rate targets must define:

- absolute or relative model;
- reference value;
- valid range;
- and measurement availability.

The lower boundary must not exceed the upper boundary.

---

# Category Validation

Qualitative intensity categories must come from finite enumerations.

Free-text categories are invalid.

Each category must have a documented operational meaning.

---

# Intensity Status

A resolved intensity may use:

```ts
type IntensityStatus =
  | "complete"
  | "adjusted"
  | "incomplete"
  | "invalid"
  | "failed";
```

## Complete

The intensity was resolved without contextual modification and passed validation.

## Adjusted

The intensity was modified by one or more documented contextual rules and passed validation.

## Incomplete

Required intensity information is missing.

## Invalid

The intensity contains incompatible or structurally invalid data.

## Failed

No valid intensity could be generated.

---

# Intensity Failure Codes

The implementation should use finite failure codes.

Initial categories may include:

```text
INTENSITY_NOT_REQUIRED
INTENSITY_TYPE_MISSING
INTENSITY_TYPE_UNSUPPORTED
INTENSITY_REFERENCE_MISSING
INTENSITY_REFERENCE_INVALID
INTENSITY_REFERENCE_EXPIRED
INTENSITY_CALCULATION_FAILED
INTENSITY_FORMULA_UNSUPPORTED
INTENSITY_TARGET_INVALID
INTENSITY_RANGE_INVALID
INTENSITY_UNIT_INVALID
INTENSITY_SCOPE_INVALID
INTENSITY_ROUNDING_UNRESOLVED
INTENSITY_EQUIPMENT_UNAVAILABLE
INTENSITY_METRICS_CONFLICT
INTENSITY_MEDICAL_CONSTRAINT
INTENSITY_HARD_CONSTRAINT_VIOLATION
INTENSITY_BELOW_MINIMUM
INTENSITY_ABOVE_MAXIMUM
INTENSITY_RULE_SOURCE_MISSING
```

`INTENSITY_NOT_REQUIRED` is not a failure when the selected method explicitly permits `intensity: null`.

---

# Null Intensity

Intensity may be `null` only when:

- the method contract explicitly states that intensity is not required;
- the exercise does not require an intensity target;
- and execution remains fully defined through other prescription fields.

The engine must not use `null` because intensity resolution failed.

---

# Recoverable Intensity Failure

An intensity failure is recoverable only when a documented alternative exists.

Possible alternatives include:

- different supported intensity metric;
- lower documented target;
- approved autoregulated target;
- compatible method;
- compatible exercise;
- or equipment-equivalent loading method.

Every recovery action must be recorded.

---

# Non-Recoverable Intensity Failure

Intensity failure is non-recoverable when:

- the method requires intensity and no valid metric exists;
- required athlete data is unavailable;
- a medical cap cannot be respected;
- no compatible equipment exists;
- mandatory rules conflict;
- or no documented source can justify the value.

The affected prescription must not reach final output.

---

# Decision Trace Integration

The Decision Trace must record:

- why intensity was required or not required;
- selected primary intensity type;
- allowed alternatives;
- athlete reference used;
- reference validity;
- formula used;
- raw calculation;
- rounding rule;
- rounded value;
- secondary metrics;
- contextual adjustments;
- conflicts;
- resolution;
- final intensity;
- validation result;
- and failure code when applicable.

The trace must explain the decision, not merely repeat the final target.

---

# Trace Example Structure

A trace entry may use:

```ts
interface IntensityTraceEntry {
  prescriptionId: string;
  exerciseId: string;
  methodId: string;

  required: boolean;
  selectedType: IntensityType | null;
  sourceRuleIds: string[];

  reference: IntensityReference | null;
  calculation: IntensityCalculation | null;

  baseIntensity: PrescriptionIntensity | null;
  adjustments: IntensityAdjustment[];
  finalIntensity: PrescriptionIntensity | null;

  validationStatus: "passed" | "failed";
  validationMessages: string[];
}
```

---

# Determinism

Given identical:

- validated athlete data;
- exercise;
- method;
- role;
- equipment;
- contextual constraints;
- rule version;
- and knowledge-base version,

the engine must produce the same intensity target.

Random intensity selection is forbidden.

---

# No Invention Rule

The engine must never invent:

- a percentage;
- a load;
- an RPE target;
- an RIR target;
- a velocity target;
- a heart-rate target;
- a pace;
- an effort category;
- a rounding rule;
- or a fallback metric.

Every intensity element must originate from:

- a documented rule;
- validated athlete data;
- a documented formula;
- a documented equipment constraint;
- or a documented contextual adjustment.

---

# Minimum Implementation Boundary

CAS V0.1 should implement only intensity types for which all of the following exist:

- canonical schema;
- method compatibility rules;
- exercise capability rules;
- athlete-reference rules;
- calculation rules where applicable;
- rounding rules;
- adjustment rules;
- stop-condition integration;
- validation rules;
- and tests.

Unsupported intensity types must remain unavailable.

---

# Required Supporting Documents

The Intensity Model depends on:

```text
24_PRESCRIPTION_MODEL.md
25_PRESCRIPTION_RULES.md
27_REST_TEMPO_RULES.md
28_STOP_CONDITIONS.md
29_PRESCRIPTION_TEST_CASES.md
```

Module-specific intensity tables or rules must also exist before numerical implementation.

---

# Acceptance Criteria

The Intensity Model V0.1 is valid only if:

- intensity is method-driven;
- one primary metric is explicit;
- secondary metrics have documented purposes;
- type-unit compatibility is enforceable;
- athlete references are validated;
- formulas are documented;
- rounding is deterministic and equipment-aware;
- medical constraints have priority;
- readiness adjustments are bounded;
- combat schedule adjustments are traceable;
- qualitative categories use finite vocabularies;
- unsupported values fail safely;
- every intensity decision is traceable;
- and identical inputs produce identical results.

---

# Final Principle

> CAS must prescribe the most appropriate justified intensity, not the most precise-looking number.

A precise numerical target is invalid when its reference, calculation or application cannot be validated.