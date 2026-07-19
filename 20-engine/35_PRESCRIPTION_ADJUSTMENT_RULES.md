# PRESCRIPTION ADJUSTMENT RULES

Version 0.1

---

> Status: Prospective specification — Not implemented in CAS V0.1.
>
> CAS V0.1 already exposes the adjustment data structures described by
> this document, including `PrescriptionAdjustmentReason`,
> `IntensityAdjustment` and `RestAdjustment`.
>
> However, the active prescription resolvers currently emit empty
> adjustment collections and do not yet apply dynamic prescription
> adjustments.
>
> This document defines the future deterministic contract that any
> implementation must follow. It does not describe behaviour currently
> executed by the engine.

---

# Purpose

The Prescription Adjustment Rules define how the Combat Athlete System may modify a valid base prescription in response to athlete and session context.

Their purpose is to ensure that adjustments are:

- triggered by validated inputs;
- limited to documented fields;
- bounded by minimum and maximum dose rules;
- ordered by priority;
- deterministic;
- reversible in the Decision Trace;
- compatible with the Capability Module;
- compatible with the Training Method;
- compatible with the selected exercise;
- safe;
- and explainable.

The adjustment layer must never be used to repair an invalid base prescription.

A base prescription must already be structurally valid before any contextual adjustment is applied.

---

# Core Principle

> Adjust the dose without changing the adaptation identity.

An adjustment may modify:

- volume;
- intensity;
- rest;
- tempo;
- exercise complexity;
- exercise selection;
- method;
- or module inclusion

only when a documented rule permits it.

An adjustment must preserve:

1. safety;
2. Hard Constraints;
3. the primary session objective;
4. the selected module’s intended adaptation;
5. the method’s minimum valid dose;
6. technical quality;
7. protected combat sessions;
8. and session-duration compatibility.

If these cannot all be preserved, the engine must substitute, remove or fail safely.

---

# Scope

The Prescription Adjustment Rules govern:

- readiness adjustments;
- medical and safety adjustments;
- combat schedule adjustments;
- recovery-protection adjustments;
- session-duration adjustments;
- equipment adjustments;
- training-history adjustments;
- progression and regression boundaries;
- conflict priority;
- minimum-dose protection;
- maximum-dose protection;
- safe failure;
- and Decision Trace requirements.

These rules do not authorize arbitrary coaching changes.

---

# Current V0.1 Implementation Status

`PrescriptionAdjustmentReason` already exists in `types.ts`, with exactly the ten values this document governs: `readiness`, `medical_constraint`, `safety_constraint`, `combat_schedule`, `recovery_protection`, `session_duration`, `equipment`, `training_history`, `progression`, `regression`.

`IntensityAdjustment` and `RestAdjustment` already exist in `types.ts` as well, each carrying a `reason: PrescriptionAdjustmentReason`, the previous and adjusted value, and a `sourceRuleId`.

However, no dynamic adjustment rule is active today:

- `resolveIntensity.ts` and `resolveRest.ts` currently return `adjustments: []` unconditionally;
- `resolveTempo.ts` currently returns `adjustments: []` unconditionally;
- `resolveVolume.ts` does not expose an `adjustments` field at all and applies no adjustment of any kind.

No value described in this document — no reduction percentage, progression increment, regression step, rest change or substitution — may be generated automatically until a documented business rule, its exact source citation, and dedicated tests all exist for it, consistent with the No Invention Rule below.

---

# Canonical Adjustment Structure

Every adjustment must use a structure equivalent to:

```ts
interface PrescriptionAdjustment {
  adjustmentId: string;
  prescriptionId: string;

  category: PrescriptionAdjustmentCategory;
  reasonCode: string;
  triggerSourceId: string;

  targetField: PrescriptionAdjustmentTarget;
  previousValue: unknown;
  adjustedValue: unknown;

  priority: AdjustmentPriority;
  reversible: boolean;

  sourceRuleIds: string[];
  validationStatus: "passed" | "failed";
}
```

The exact TypeScript implementation may evolve, but equivalent information must exist.

---

# Adjustment Categories

The initial CAS vocabulary is:

```ts
type PrescriptionAdjustmentCategory =
  | "readiness"
  | "medical_constraint"
  | "safety_constraint"
  | "combat_schedule"
  | "recovery_protection"
  | "session_duration"
  | "equipment"
  | "training_history"
  | "progression"
  | "regression";
```

Only documented categories may be implemented.

---

# Adjustment Targets

Adjustments may target:

```ts
type PrescriptionAdjustmentTarget =
  | "sets"
  | "repetitions"
  | "duration"
  | "distance"
  | "rounds"
  | "work_intervals"
  | "intensity"
  | "rest"
  | "tempo"
  | "instructions"
  | "stop_conditions"
  | "method"
  | "exercise"
  | "module";
```

An adjustment rule must identify exactly which targets it may modify.

---

# Adjustment Priority

Adjustment priority is:

```text
Emergency Medical
→ Medical Constraint
→ Safety Constraint
→ Hard Constraint
→ Readiness
→ Combat Schedule
→ Recovery Protection
→ Session Duration
→ Equipment
→ Training History
→ Progression
→ Preference
```

A lower-priority rule must not override a higher-priority adjustment.

---

# Adjustment Preconditions

An adjustment may be applied only when:

- the base prescription is valid;
- the triggering input is validated;
- the rule applies to the module;
- the rule applies to the method;
- the rule applies to the Exercise Role;
- the target field exists;
- the adjusted value remains compatible;
- the minimum valid dose remains satisfied;
- the maximum valid dose is not exceeded;
- required stop conditions remain present;
- and the adjustment is traceable.

---

# Adjustment Order

The engine must apply adjustments in this order:

```text
1. Medical and Safety
2. Readiness
3. Combat Schedule
4. Recovery Protection
5. Session Duration
6. Equipment
7. Training History
8. Progression or Regression
9. Final Validation
```

If an earlier adjustment changes the method or exercise, the prescription must be reconstructed before later adjustments continue.

---

# No Repair Rule

Adjustments must not be used to repair:

- missing methods;
- missing numerical profiles;
- missing athlete references;
- incompatible exercises;
- unsupported intensity types;
- missing stop conditions;
- or invalid units.

These are prescription-generation failures, not adjustment opportunities.

---

# Readiness Model

Readiness adjustments may use only the validated readiness state already produced by the engine.

The prescription layer must not independently infer readiness from free text.

A canonical readiness vocabulary may include:

```text
high
normal
reduced
low
blocked
```

The exact current engine vocabulary remains authoritative.

---

# Readiness — Normal

When readiness is normal:

- use the normal value from the numerical profile;
- apply no readiness adjustment;
- preserve base intensity;
- preserve base rest;
- preserve base tempo.

Expected prescription status:

```text
complete
```

---

# Readiness — High

High readiness does not automatically authorize progression.

When readiness is high:

- preserve the normal base prescription by default;
- allow the high boundary only when a documented progression rule is active;
- require no protected combat conflict;
- require sufficient session duration;
- require valid recent training history;
- require no medical or recovery cap.

Without all progression conditions, no increase is permitted.

---

# Readiness — Reduced

Reduced readiness may select the lower valid boundary of a numerical range.

Default order:

```text
reduce optional volume
→ select lower set boundary
→ select lower repetition, duration or distance boundary
→ select lower intensity boundary
→ increase rest within profile limits
→ simplify tempo or execution only if documented
```

The method and minimum valid dose must remain valid.

---

# Readiness — Low

Low readiness requires stronger protection.

Default hierarchy:

```text
preserve medical and safety rules
→ preserve the primary module only if safely possible
→ remove optional exercises
→ reduce accessory work to minimum dose
→ reduce secondary work to minimum dose
→ reduce primary work to minimum dose
→ use a documented lower-fatigue method
→ substitute exercise
→ remove module if permitted
→ fail safely
```

Low readiness must not be treated as a universal percentage reduction.

---

# Readiness — Blocked

When readiness is blocked:

- no normal training prescription may be generated;
- only a documented recovery or medical pathway may remain available;
- otherwise the session outcome must be blocked.

The prescription layer must not override the existing engine blocked state.

---

# Readiness Adjustment Table

## Normal Context

```text
sets: normal profile value
repetitions or duration: normal profile value
intensity: normal profile value
rest: normal profile value
```

## Reduced Context

```text
sets: lower boundary
repetitions or duration: normal or lower boundary
intensity: lower boundary
rest: normal or upper boundary
```

## Low Context

```text
sets: minimum valid dose
repetitions or duration: minimum valid dose
intensity: minimum valid effective boundary
rest: upper valid boundary
```

This table applies only when the profile does not define a stricter rule.

---

# Medical Constraint Adjustments

Medical constraints have absolute priority over performance goals.

They may require:

- exercise prohibition;
- method prohibition;
- load cap;
- intensity cap;
- reduced impact;
- reduced range of motion;
- longer rest;
- conditional rest;
- additional stop conditions;
- exercise substitution;
- module removal;
- or session termination.

The engine must not reinterpret medical instructions.

---

# Medical Exercise Prohibition

When an exercise is medically prohibited:

```text
selected exercise
→ documented compatible substitute
→ remove exercise if module remains valid
→ remove module if permitted
→ fail safely
```

No numerical adjustment may make a prohibited exercise valid.

---

# Medical Intensity Cap

When a validated medical rule caps intensity:

- the cap overrides the base intensity;
- the cap must remain compatible with the method;
- if the capped value falls below minimum effective intensity, the method must change or fail;
- stop conditions must be updated.

---

# Medical Rest Adjustment

A medical rule may increase rest or require a conditional recovery criterion.

Session duration must adapt around the medical rest requirement.

Medical rest must not be shortened to fit the session.

---

# Medical Range-of-Motion Adjustment

Range-of-motion modification is permitted only when:

- the medical rule explicitly authorizes it;
- an approved exercise variation exists;
- the module objective remains valid;
- the adjusted range is documented;
- and pain is not being ignored.

---

# Safety Constraint Adjustments

Safety constraints may originate from:

- environment;
- equipment;
- exercise complexity;
- technical ability;
- impact exposure;
- supervision requirements;
- or another validated safety rule.

Safety adjustments may be temporary and session-specific.

---

# Technical Complexity Regression

When the athlete cannot safely execute the selected exercise complexity:

```text
reduce technical complexity
→ select documented regression
→ preserve module and method where possible
→ re-prescribe from the beginning
```

The engine must not reduce numerical load alone when the main problem is skill incompatibility.

---

# Impact Reduction

When impact exposure must be reduced:

- lower impact intent where permitted;
- reduce contacts or rounds within the minimum valid dose;
- select a lower-impact exercise;
- change method;
- or remove the exercise.

Impact volume must not be increased to compensate for lower impact intensity.

---

# Combat Schedule Adjustments

Combat schedule adjustments must use normalized upstream conflict data.

The prescription layer must not infer protected sessions from raw text.

A conflict must identify:

- protected combat session;
- time window;
- affected body region or capacity;
- conflict severity;
- and applicable rule.

---

# Combat Schedule Severity

A canonical severity vocabulary may include:

```text
none
low
moderate
high
critical
```

The existing conflict engine vocabulary remains authoritative when different.

---

# Combat Conflict — None

No combat-schedule adjustment is applied.

---

# Combat Conflict — Low

Permitted actions may include:

- select the lower normal volume boundary;
- avoid the highest intensity boundary;
- preserve normal rest;
- remove optional local-fatigue work.

The primary module remains unchanged.

---

# Combat Conflict — Moderate

Default hierarchy:

```text
remove optional exercises affecting the protected capacity
→ reduce accessory volume
→ reduce secondary volume
→ select lower intensity boundary
→ increase rest
→ substitute lower-fatigue exercise
```

The primary module must remain above minimum dose.

---

# Combat Conflict — High

Default hierarchy:

```text
remove all optional conflicting work
→ reduce secondary conflicting work to minimum dose
→ reduce primary conflicting work to minimum dose
→ use a lower-fatigue compatible method
→ substitute exercise
→ remove conflicting module if permitted
```

No progression is allowed.

---

# Combat Conflict — Critical

When the CAS session would directly compromise a protected combat session:

- conflicting high-fatigue work must be removed;
- the module may be replaced only through a documented upstream rule;
- otherwise the session must fail or become a recovery session if already authorized.

The prescription layer must not silently change the session objective.

---

# Combat Region-Specific Adjustment

Adjustments must target only the conflicting capacity when possible.

Examples:

- grip conflict affects grip-intensive work;
- lower-body power conflict affects jumps, sprints and heavy lower-body work;
- striking conflict affects upper-body impact and shoulder fatigue;
- grappling conflict may affect grip, trunk and pulling fatigue.

These mappings must be documented in the conflict rules or knowledge base before implementation.

---

# Recovery Protection

Recovery protection addresses accumulated fatigue even when readiness is not blocked.

Potential validated inputs may include:

- recent training load;
- consecutive high-intensity days;
- local muscular fatigue;
- impact exposure;
- eccentric exposure;
- grip exposure;
- sleep or recovery status already normalized upstream.

The prescription layer must not create new recovery scores.

---

# Recovery Protection Hierarchy

```text
remove optional volume
→ reduce density
→ reduce accessory volume
→ reduce secondary volume
→ lower intensity within valid range
→ increase rest
→ use lower-fatigue method
→ substitute
→ remove module if permitted
```

The engine must preserve the primary adaptation whenever safely possible.

---

# Density Reduction

Density reduction may be achieved by:

- increasing rest;
- reducing work intervals;
- reducing rounds;
- reducing sets;
- or selecting a lower-density method.

The engine must not increase intensity to compensate for lower density unless a documented profile authorizes it.

---

# Eccentric Stress Protection

When recovery rules identify excessive eccentric stress:

- avoid slow eccentric overrides;
- avoid high-volume eccentric-dominant exercises;
- reduce affected volume;
- substitute a lower-eccentric option;
- or remove the exercise.

The engine must not infer eccentric stress from exercise name alone unless the knowledge base documents it.

---

# Session Duration Adjustment

Duration adjustment occurs only after medical, readiness, combat and recovery adjustments.

The engine must compare:

```text
estimated session duration
≤ allowed session duration
```

If the session fits, no duration adjustment is applied.

---

# Duration Reduction Hierarchy

The default hierarchy is:

```text
1. remove optional exercises
2. reduce accessory work to minimum valid dose
3. reduce corrective or recovery work when optional
4. reduce secondary work to minimum valid dose
5. use documented shorter method
6. substitute lower-overhead exercise
7. remove lowest-priority secondary module
8. reduce primary work within valid boundaries
9. fail safely
```

Quality-preserving rest must not be reduced below its minimum.

---

# Duration Adjustment Prohibitions

The engine must not:

- shorten medical rest;
- remove mandatory stop conditions;
- remove required warm-up or preparation rules;
- increase density beyond method limits;
- combine exercises into supersets without a documented method;
- reduce work below minimum dose;
- remove the primary module silently;
- or truncate an exercise mid-prescription.

---

# Duration Adjustment by Role

Default removal or reduction order:

```text
optional recovery
→ corrective
→ accessory
→ robustness
→ conditioning secondary
→ secondary
→ technical non-primary
→ primer
→ primary
```

Module-specific duration rules may override this order.

---

# Shorter Method Substitution

A shorter method may replace the base method only when:

- the module authorizes it;
- the exercise supports it;
- the new method has a complete numerical profile;
- the adaptation remains valid;
- the minimum dose fits;
- and the entire prescription is regenerated.

Values from the old method must not be copied.

---

# Equipment Adjustments

Equipment adjustment applies when:

- required equipment is unavailable;
- exact calculated load is unavailable;
- a safety capability is missing;
- measurement equipment is missing;
- or available space is insufficient.

---

# Load Rounding

When a calculated external load is unavailable, the engine must apply the equipment-specific rounding rule.

Allowed rounding modes:

```text
nearest
down
up
```

The mode must be documented.

Safety ceilings must round down.

Progression targets may use nearest only when the result remains within allowed intensity.

---

# Missing Exact Load

When no exact load can be achieved:

```text
apply documented rounding
→ use a valid load range with RPE or RIR control
→ use compatible equipment
→ substitute exercise
→ fail safely
```

The engine must not display unavailable load.

---

# Missing Measurement Equipment

When a method requires:

- velocity sensor;
- heart-rate monitor;
- ergometer output;
- or another measurement tool

and that tool is unavailable:

```text
use documented non-device fallback
→ select another method
→ substitute exercise
→ fail safely
```

The engine must not present intended effort as measured output.

---

# Missing Safety Equipment

When required safety equipment is unavailable:

- the exercise is ineligible;
- no load reduction can compensate unless an explicit safe variation exists;
- substitution or failure is required.

---

# Space Limitation

When available space is insufficient for:

- carries;
- sprints;
- throws;
- combat movement;
- or another spatial requirement

the engine may:

- use a documented shorter-distance variant;
- use a compatible timed method;
- substitute exercise;
- or fail.

The method must be regenerated.

---

# Training History Adjustments

Training history may influence range selection only when:

- history is validated;
- the rule defines the relevant time window;
- the exercise or method matches;
- and no higher-priority constraint applies.

Training history must not be inferred from general training experience alone.

---

# Novice Adjustment

A novice-specific rule may:

- select the lower volume boundary;
- select a moderate intensity target;
- prioritize technical effort;
- increase rest;
- use a simpler exercise;
- and apply stricter technical stop conditions.

The exact classification rule must be documented upstream.

---

# Advanced Adjustment

Advanced status does not automatically authorize the upper boundary.

Upper-bound selection also requires:

- normal or high readiness;
- no conflict;
- adequate duration;
- valid progression state;
- and recent successful completion.

---

# Progression Rules

Progression is allowed only when:

- the previous prescription was completed;
- technical quality met the required standard;
- stop conditions were not triggered for failure;
- perceived effort remained within target;
- athlete reference data remains valid;
- no medical or combat conflict exists;
- and the progression rule identifies the target field.

---

# Progression Target Order

Unless method-specific rules differ:

```text
repetition progression within range
→ duration or distance progression within range
→ set progression within range
→ load progression
→ method progression
```

The engine must not increase multiple prescription dimensions simultaneously unless explicitly documented.

---

# Load Progression

Load may increase only when:

- the repetition or duration target was completed;
- RPE or RIR criteria were met;
- technical quality was valid;
- the next available load remains inside the intensity range;
- and equipment supports it.

The increment must be equipment-aware.

---

# Volume Progression

Volume may increase only within the profile maximum.

When the maximum is reached, the engine must not exceed it.

A new profile, method or progression phase is required.

---

# Regression Rules

Regression may be triggered by:

- repeated technical failure;
- excessive RPE;
- RIR below target;
- pain-free but poor movement control;
- failed completion;
- low readiness;
- or recovery conflict.

Medical or pain triggers follow their own higher-priority rules.

---

# Regression Target Order

Default hierarchy:

```text
reduce load
→ reduce repetitions, duration or distance
→ reduce sets
→ increase rest
→ simplify tempo
→ select exercise regression
→ select lower-demand method
→ remove exercise
```

The exact order may be overridden by the failure type.

---

# Failed Completion

One failed completion does not automatically authorize a permanent regression.

The rule must distinguish:

- isolated failure;
- repeated failure;
- technical failure;
- readiness-related failure;
- and medical failure.

---

# Adjustment Interaction Rules

When multiple adjustments target the same field:

1. apply the highest-priority rule;
2. use the stricter safe boundary when compatible;
3. reject contradictory adjustments;
4. reconstruct if method or exercise changes;
5. validate final minimum dose.

---

# Volume and Intensity Interaction

The engine must avoid simultaneously selecting:

- maximum volume;
- maximum intensity;
- minimum rest;
- and highest density

unless a specific profile explicitly authorizes that combination.

When volume is reduced for readiness or conflict, intensity must not automatically increase.

---

# Rest and Duration Interaction

Rest may increase due to readiness, medical or recovery rules.

When this causes a duration conflict, reduce lower-priority work first.

Do not reverse the higher-priority rest adjustment.

---

# Tempo and Safety Interaction

Tempo may be changed only when:

- a technical or medical rule permits it;
- the new tempo remains method-compatible;
- duration is recalculated;
- and exercise capability supports it.

---

# Stop-Condition Adjustment

Adjustments may add or strengthen stop conditions.

They must not remove mandatory conditions.

A medical or readiness adjustment may:

- lower a maximum intensity threshold;
- require earlier technical termination;
- require longer recovery before continuation;
- or make a previously recoverable trigger non-recoverable.

---

# Minimum Dose Protection

After every adjustment, validate:

```text
adjusted dose ≥ minimum valid dose
```

When false:

```text
alternative method
→ alternative exercise
→ remove optional module
→ fail safely
```

The engine must not label a below-minimum prescription as complete.

---

# Maximum Dose Protection

After every adjustment, validate:

```text
adjusted dose ≤ maximum valid dose
```

Progression and context must never push the prescription above the profile maximum.

---

# Adjustment Limit

A single prescription must have a finite number of reconstruction attempts.

Recommended V0.1 limit:

```text
3 reconstruction attempts
```

This is a CAS implementation decision and must be tested.

After the limit:

```text
PRESCRIPTION_ADJUSTMENT_LIMIT_REACHED
```

must be returned.

---

# Failure Codes

Initial adjustment failure codes may include:

```text
ADJUSTMENT_TRIGGER_INVALID
ADJUSTMENT_RULE_MISSING
ADJUSTMENT_TARGET_INVALID
ADJUSTMENT_VALUE_INVALID
ADJUSTMENT_PRIORITY_CONFLICT
ADJUSTMENT_METHOD_INCOMPATIBLE
ADJUSTMENT_EXERCISE_INCOMPATIBLE
ADJUSTMENT_BELOW_MINIMUM_DOSE
ADJUSTMENT_ABOVE_MAXIMUM_DOSE
ADJUSTMENT_MEDICAL_CONFLICT
ADJUSTMENT_COMBAT_CONFLICT_UNRESOLVED
ADJUSTMENT_DURATION_UNRESOLVED
ADJUSTMENT_EQUIPMENT_UNRESOLVED
ADJUSTMENT_PROGRESSION_NOT_AUTHORIZED
ADJUSTMENT_REGRESSION_UNRESOLVED
PRESCRIPTION_ADJUSTMENT_LIMIT_REACHED
ADJUSTMENT_RULE_SOURCE_MISSING
```

---

# Safe Failure

Adjustment must fail safely when:

- the trigger is not validated;
- no documented rule exists;
- the adjusted value is incompatible;
- minimum dose cannot be preserved;
- a medical or safety constraint cannot be respected;
- the session cannot fit;
- required equipment is absent;
- combat conflict remains unresolved;
- or reconstruction exceeds the allowed limit.

---

# Decision Trace Integration

The Decision Trace must record:

- base prescription;
- adjustment category;
- trigger;
- priority;
- target field;
- previous value;
- adjusted value;
- source rule;
- interaction with other adjustments;
- reconstruction events;
- minimum-dose check;
- maximum-dose check;
- final validation;
- and failure code when applicable.

---

# Determinism

Given identical:

- base prescription;
- readiness;
- medical constraints;
- combat schedule;
- recovery state;
- duration;
- equipment;
- training history;
- rule version;
- and knowledge-base version,

the engine must produce identical adjustments.

---

# No Invention Rule

The engine must never invent:

- a reduction percentage;
- a progression increment;
- a regression step;
- a rest increase;
- a substitute method;
- an equipment equivalent;
- a combat conflict response;
- or a duration shortcut.

Every adjustment must originate from a documented rule.

---

# Implementation Boundary

With this document, the minimum documentation sequence required before TypeScript implementation is complete:

```text
31_TRAINING_METHOD_CATALOGUE.md
32_MODULE_PRESCRIPTION_PROFILES.md
33_EXERCISE_PRESCRIPTION_CAPABILITIES.md
34_NUMERICAL_PRESCRIPTION_TABLES.md
35_PRESCRIPTION_ADJUSTMENT_RULES.md
```

Implementation may now begin only for the subset of methods, modules and exercises with complete profiles.

---

# Acceptance Criteria

The Prescription Adjustment Rules V0.1 are valid only if:

- every adjustment has a validated trigger;
- every target field is explicit;
- priority is deterministic;
- normal readiness preserves the base prescription;
- high readiness does not automatically progress;
- reduced and low readiness remain bounded;
- medical rules override performance;
- combat schedule is protected;
- recovery adjustments reduce fatigue without changing adaptation identity;
- duration adjustments preserve minimum dose;
- equipment adjustments remain capability-aware;
- progression requires successful prior data;
- regression is failure-specific;
- stop conditions may be strengthened but not removed;
- reconstruction is finite;
- unsupported cases fail safely;
- every change is traceable;
- and identical inputs produce identical adjusted prescriptions.

---

# Final Principle

> CAS may adapt the prescription to the athlete’s context, but it must never adapt the rules to make an unsupported prescription look valid.

A contextual adjustment is valid only when the original value, trigger, transformation and final value can all be justified.