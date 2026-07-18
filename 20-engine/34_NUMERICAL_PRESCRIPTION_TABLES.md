# NUMERICAL PRESCRIPTION TABLES

Version 0.1

---

# Purpose

The Numerical Prescription Tables define the initial bounded numerical rules that the Combat Athlete System may use to generate exercise prescriptions.

Their purpose is to provide deterministic values or bounded ranges for:

- sets;
- repetitions;
- duration;
- distance;
- rounds;
- work intervals;
- intensity;
- rest;
- tempo;
- minimum valid dose;
- maximum valid dose;
- and normal completion conditions.

These tables are deliberately limited.

CAS V0.1 must not generate numerical prescriptions outside the profiles documented here.

---

# Evidence and Design Principle

The tables are based on three levels of authority:

1. current evidence-based consensus or position statements;
2. combat-sport-specific prescription literature;
3. explicit CAS design decisions required to convert broad evidence into deterministic engine rules.

Every rule must declare its source type.

A CAS design decision must remain inside the boundaries supported by the external evidence.

It must not be presented as a universal scientific law.

---

# Core Principle

> A numerical prescription must be bounded enough to be deterministic and broad enough to respect individual variation.

The engine must not:

- select arbitrary values;
- use hidden defaults;
- extrapolate beyond documented ranges;
- treat all exercises in a module identically;
- or generate false precision when athlete reference data is unavailable.

---

# Scope

The initial tables support:

```text
straight_sets_repetitions
timed_isometric_sets
distance_carry_sets
power_repetition_sets
combat_rounds
work_rest_intervals
continuous_aerobic_duration
controlled_mobility_sets
recovery_duration_work
```

Only the module-method-role combinations defined in this document may be implemented.

---

# Rule Source Types

Each numerical profile must use one of:

```ts
type NumericalRuleSourceType =
  | "external_consensus"
  | "external_combat_specific"
  | "cas_bounded_decision";
```

## External Consensus

A range or principle directly supported by an identified position stand or consensus document.

## External Combat-Specific

A range or structure supported by combat-sport-specific research or review literature.

## CAS Bounded Decision

A deterministic choice made by CAS within externally supported boundaries.

CAS-bounded decisions must be versioned and testable.

---

# Canonical Numerical Profile

A numerical profile should use a structure equivalent to:

```ts
interface NumericalPrescriptionProfile {
  profileId: string;
  version: string;

  moduleId: CapabilityModuleId;
  methodId: string;
  exerciseRole: ExerciseRole;

  volume: NumericalVolumeRule;
  intensity: NumericalIntensityRule | null;
  rest: NumericalRestRule | null;
  tempo: NumericalTempoRule | null;

  minimumDose: MinimumDoseRule;
  maximumDose: MaximumDoseRule;

  completionConditionIds: string[];
  qualityStopConditionIds: string[];

  sourceType: NumericalRuleSourceType;
  sourceRuleIds: string[];
}
```

---

# Deterministic Range Selection

When a table contains a range, the engine must not choose randomly.

Unless a profile defines a different rule, use:

```text
Low boundary
→ reduced readiness, protected combat schedule, novice status, or time pressure

Middle value
→ normal readiness and standard session context

High boundary
→ high priority role, advanced status, sufficient duration, and no recovery conflict
```

When multiple factors conflict, use the lower valid value.

The exact readiness and combat-schedule modifiers are defined in:

```text
35_PRESCRIPTION_ADJUSTMENT_RULES.md
```

---

# Integer Resolution

For an integer range:

```text
2–4
```

the normal middle value is:

```text
3
```

For an even-width range such as:

```text
3–4
```

the normal value is the lower integer unless a documented progression state selects the upper value.

---

# Percentage Resolution

Percentage ranges must be resolved using:

```text
lower boundary
→ reduced context

midpoint rounded down to the nearest permitted increment
→ normal context

upper boundary
→ progression-authorized context
```

Equipment-aware load rounding occurs after percentage resolution.

---

# Table Group 1 — Strength

## Profile STR-PRIMARY-STRAIGHT

```text
profileId: strength_primary_straight_sets_v0_1
moduleId: strength
methodId: straight_sets_repetitions
exerciseRole: primary
```

### Volume

```text
sets: 2–4
repetitions: 3–6
```

Normal V0.1 resolution:

```text
sets: 3
repetitions: 5
```

### Intensity

Preferred:

```text
80–90% 1RM
```

Alternative when a valid 1RM reference is unavailable:

```text
RPE 7.5–9
```

RIR may be used only when the endpoint definition is documented:

```text
1–3 RIR
```

### Rest

```text
180–300 seconds between sets
```

Normal value:

```text
180 seconds
```

Use the higher boundary when:

- repetitions are at the low end;
- intensity is at the high end;
- technical quality requires it;
- or the exercise is highly systemically demanding.

### Tempo

```text
eccentric: controlled
bottom: method-specific
concentric: maximal safe acceleration intent
top: method-specific
```

No fixed eccentric duration is imposed unless an exercise-specific rule requires it.

### Minimum Dose

```text
2 sets × 3 repetitions
```

### Maximum Dose

```text
4 sets × 6 repetitions
```

Maximum dose does not authorize use of the highest volume and highest intensity simultaneously unless a future profile explicitly permits it.

---

## Profile STR-SECONDARY-STRAIGHT

```text
profileId: strength_secondary_straight_sets_v0_1
moduleId: strength
methodId: straight_sets_repetitions
exerciseRole: secondary
```

### Volume

```text
sets: 2–3
repetitions: 4–8
```

Normal:

```text
3 sets × 6 repetitions
```

### Intensity

```text
70–85% 1RM
```

or:

```text
RPE 7–8.5
```

or:

```text
2–3 RIR
```

### Rest

```text
120–240 seconds
```

Normal:

```text
150 seconds
```

### Minimum Dose

```text
2 sets × 4 repetitions
```

### Maximum Dose

```text
3 sets × 8 repetitions
```

---

## Profile STR-ACCESSORY-STRAIGHT

```text
profileId: strength_accessory_straight_sets_v0_1
moduleId: strength
methodId: straight_sets_repetitions
exerciseRole: accessory
```

### Volume

```text
sets: 2–3
repetitions: 6–12
```

Normal:

```text
2 sets × 8 repetitions
```

### Intensity

```text
RPE 6.5–8
```

or:

```text
2–4 RIR
```

### Rest

```text
60–120 seconds
```

Normal:

```text
90 seconds
```

### Minimum Dose

```text
2 sets × 6 repetitions
```

### Maximum Dose

```text
3 sets × 12 repetitions
```

---

# Table Group 2 — Functional Hypertrophy

## Profile HYP-PRIMARY-STRAIGHT

```text
profileId: functional_hypertrophy_primary_v0_1
moduleId: functional_hypertrophy
methodId: straight_sets_repetitions
exerciseRole: primary
```

### Volume

```text
sets: 3–4
repetitions: 6–12
```

Normal:

```text
3 sets × 8 repetitions
```

### Intensity

Preferred:

```text
RPE 7–9
```

or:

```text
1–3 RIR
```

Load-based alternative:

```text
60–80% 1RM
```

### Rest

```text
90–180 seconds
```

Normal:

```text
120 seconds
```

### Tempo

```text
eccentric: controlled
concentric: purposeful, non-deliberately-slow
```

No universal fixed phase duration is imposed.

### Minimum Dose

```text
3 sets × 6 repetitions
```

### Maximum Dose

```text
4 sets × 12 repetitions
```

---

## Profile HYP-SECONDARY-STRAIGHT

```text
profileId: functional_hypertrophy_secondary_v0_1
moduleId: functional_hypertrophy
methodId: straight_sets_repetitions
exerciseRole: secondary
```

### Volume

```text
sets: 2–4
repetitions: 8–15
```

Normal:

```text
3 sets × 10 repetitions
```

### Intensity

```text
RPE 7–8.5
```

or:

```text
2–3 RIR
```

### Rest

```text
60–120 seconds
```

Normal:

```text
90 seconds
```

### Minimum Dose

```text
2 sets × 8 repetitions
```

### Maximum Dose

```text
4 sets × 15 repetitions
```

---

## Profile HYP-ACCESSORY-STRAIGHT

```text
profileId: functional_hypertrophy_accessory_v0_1
moduleId: functional_hypertrophy
methodId: straight_sets_repetitions
exerciseRole: accessory
```

### Volume

```text
sets: 2–3
repetitions: 10–20
```

Normal:

```text
2 sets × 12 repetitions
```

### Intensity

```text
RPE 6.5–8
```

or:

```text
2–4 RIR
```

### Rest

```text
45–90 seconds
```

Normal:

```text
60 seconds
```

### Minimum Dose

```text
2 sets × 10 repetitions
```

### Maximum Dose

```text
3 sets × 20 repetitions
```

---

# Weekly Hypertrophy Boundary

The 2026 ACSM guidance identifies approximately ten weekly sets per muscle group as a useful optimization target for hypertrophy.

CAS V0.1 must treat this as a weekly planning reference, not as a mandatory single-session dose.

The prescription layer must not generate weekly volume without validated weekly training context.

---

# Table Group 3 — Power and Ballistics

## Profile PWR-PRIMARY-REPETITIONS

```text
profileId: power_primary_repetition_sets_v0_1
moduleId: power
methodId: power_repetition_sets
exerciseRole: primary
```

### Volume

```text
sets: 3–5
repetitions: 2–5
```

Normal:

```text
4 sets × 3 repetitions
```

### Intensity

For loaded resistance exercises where percentage loading is valid:

```text
30–70% 1RM
```

For upper-body ballistic resistance exercises, a narrower exercise-specific rule may be required.

For medicine-ball throws:

```text
movement_intent: maximal_acceleration
resistance: exercise-specific available implement category
```

The engine must not infer a medicine-ball mass from this generic profile.

### Rest

```text
120–300 seconds
```

Normal:

```text
180 seconds
```

### Tempo

```text
globalIntent: maximal_acceleration
```

### Minimum Dose

```text
3 sets × 2 repetitions
```

### Maximum Dose

```text
5 sets × 5 repetitions
```

### Stop Conditions

End the set before planned repetition completion when:

- explosive intent is visibly lost under a documented proxy;
- measured velocity loss exceeds an exercise-specific threshold;
- landing or release quality deteriorates;
- or technical safety is lost.

No universal velocity-loss percentage is defined in V0.1.

---

## Profile PWR-PRIMER-REPETITIONS

```text
profileId: power_primer_repetition_sets_v0_1
moduleId: power
methodId: power_repetition_sets
exerciseRole: primer
```

### Volume

```text
sets: 2–3
repetitions: 2–4
```

Normal:

```text
2 sets × 3 repetitions
```

### Intensity

```text
movement_intent: maximal_acceleration
fatigue target: low
```

External load must use an exercise-specific profile.

### Rest

```text
90–180 seconds
```

Normal:

```text
120 seconds
```

### Minimum Dose

```text
2 sets × 2 repetitions
```

### Maximum Dose

```text
3 sets × 4 repetitions
```

---

## Profile PWR-SECONDARY-REPETITIONS

```text
profileId: power_secondary_repetition_sets_v0_1
moduleId: power
methodId: power_repetition_sets
exerciseRole: secondary
```

### Volume

```text
sets: 2–4
repetitions: 3–6
```

Normal:

```text
3 sets × 4 repetitions
```

### Rest

```text
90–180 seconds
```

Normal:

```text
120 seconds
```

---

# Table Group 4 — Timed Isometrics

## Profile ISO-CORE-ROBUSTNESS

```text
profileId: timed_isometric_core_robustness_v0_1
moduleId: core or robustness
methodId: timed_isometric_sets
exerciseRole: robustness, secondary, accessory, or corrective
```

### Volume

```text
sets: 2–4
duration: 10–40 seconds per set
```

Normal:

```text
3 sets × 20 seconds
```

### Intensity

```text
RPE 6–8
```

or:

```text
technical_effort: high_quality
```

### Rest

```text
45–120 seconds
```

Normal:

```text
60 seconds
```

### Tempo

```text
type: isometric_hold
```

### Minimum Dose

```text
2 sets × 10 seconds
```

### Maximum Dose

```text
4 sets × 40 seconds
```

### Stop Conditions

End the hold when:

- the required position is lost;
- compensatory movement crosses the documented exercise threshold;
- pain occurs;
- or planned duration is completed.

---

## Profile ISO-GRIP

```text
profileId: timed_isometric_grip_v0_1
moduleId: grip
methodId: timed_isometric_sets
exerciseRole: primary, secondary, accessory, or robustness
```

### Volume

```text
sets: 2–4
duration: 10–30 seconds
```

Normal:

```text
3 sets × 20 seconds
```

### Intensity

```text
RPE 7–9
```

or an exercise-specific external-load rule.

### Rest

```text
60–150 seconds
```

Normal:

```text
90 seconds
```

### Minimum Dose

```text
2 sets × 10 seconds
```

### Maximum Dose

```text
4 sets × 30 seconds
```

---

# Table Group 5 — Loaded Carries

## Profile CARRY-STRENGTH-GRIP

```text
profileId: distance_carry_strength_grip_v0_1
moduleId: grip, core, strength, or robustness
methodId: distance_carry_sets
exerciseRole: primary, secondary, accessory, or robustness
```

### Volume

```text
sets: 2–4
distance: 15–40 meters per set
```

Normal:

```text
3 sets × 25 meters
```

### Intensity

Preferred:

```text
RPE 7–9
```

Load may also be expressed as:

```text
absolute_load
percentage_body_mass
resistance_category
```

only when an exercise-specific loading table exists.

### Rest

```text
60–180 seconds
```

Normal:

```text
120 seconds
```

### Tempo

```text
globalIntent: controlled
```

### Minimum Dose

```text
2 sets × 15 meters
```

### Maximum Dose

```text
4 sets × 40 meters
```

### Laterality

Unilateral or asymmetrical carries must define whether distance is:

- per side;
- alternating by set;
- or total.

---

# Table Group 6 — Controlled Mobility

## Profile MOB-CONTROLLED

```text
profileId: controlled_mobility_sets_v0_1
moduleId: preparation, movement, robustness, or recovery
methodId: controlled_mobility_sets
exerciseRole: primer, technical, corrective, recovery, or accessory
```

### Volume

```text
sets: 1–3
duration: 20–60 seconds per set or side
```

Normal:

```text
2 sets × 30 seconds
```

### Intensity

```text
technical_effort: easy_technical to high_quality
RPE: 2–5
```

### Rest

```text
0–45 seconds
```

Zero formal rest is allowed only when the method defines immediate controlled transition.

Normal:

```text
15 seconds
```

### Tempo

```text
globalIntent: controlled or technical_precision
```

### Minimum Dose

```text
1 set × 20 seconds
```

### Maximum Dose

```text
3 sets × 60 seconds
```

### Stop Conditions

- pain;
- loss of controlled range;
- repeated compensation;
- planned completion.

---

# Table Group 7 — Continuous Aerobic Work

## Profile AER-CONTINUOUS-STANDARD

```text
profileId: continuous_aerobic_conditioning_v0_1
moduleId: conditioning
methodId: continuous_aerobic_duration
exerciseRole: conditioning or secondary
```

### Duration

```text
20–45 minutes
```

Normal:

```text
30 minutes
```

### Intensity

Preferred when valid reference data exists:

```text
moderate documented heart-rate or pace zone
```

Fallback:

```text
RPE 3–6
```

CAS V0.1 must not calculate an age-predicted maximum heart rate unless a later validated formula is explicitly adopted.

### Rest

```text
not applicable
```

### Minimum Dose

```text
20 minutes
```

### Maximum Dose

```text
45 minutes
```

This is a session profile, not a weekly public-health target.

---

## Profile AER-RECOVERY

```text
profileId: continuous_aerobic_recovery_v0_1
moduleId: recovery
methodId: recovery_duration_work or continuous_aerobic_duration
exerciseRole: recovery
```

### Duration

```text
10–30 minutes
```

Normal:

```text
20 minutes
```

### Intensity

```text
RPE 2–4
```

or a documented low heart-rate zone.

### Minimum Dose

```text
10 minutes
```

### Maximum Dose

```text
30 minutes
```

---

# Table Group 8 — General Work-Rest Intervals

## Profile INT-SHORT

```text
profileId: conditioning_short_intervals_v0_1
moduleId: conditioning
methodId: work_rest_intervals
exerciseRole: conditioning
```

### Work Intervals

```text
10–20 intervals
```

Normal:

```text
12 intervals
```

### Work Duration

```text
15–60 seconds
```

Normal general profile:

```text
30 seconds
```

### Rest Duration

```text
15–60 seconds
```

Normal:

```text
30 seconds
```

### Work-to-Rest Ratio

```text
1:1 to 2:1
```

### Intensity

Requires one of:

- percentage of a validated maximal aerobic or sport-specific reference;
- pace;
- power;
- heart rate when appropriate;
- or documented RPE.

Without a valid intensity profile, the engine must not prescribe this method numerically.

### Minimum Dose

```text
10 intervals × 15 seconds
```

### Maximum Dose

```text
20 intervals × 60 seconds
```

The maximum boundaries must not be combined automatically.

---

## Profile INT-LONG

```text
profileId: conditioning_long_intervals_v0_1
moduleId: conditioning
methodId: work_rest_intervals
exerciseRole: conditioning
```

### Work Intervals

```text
4–10 intervals
```

Normal:

```text
6 intervals
```

### Work Duration

```text
60–180 seconds
```

Normal:

```text
120 seconds
```

### Passive Rest

```text
30–120 seconds
```

### Active Rest

```text
120–240 seconds
```

The active-versus-passive choice must be defined by the method profile.

### Work-to-Rest Ratio

```text
1:1 to 4:1
```

### Intensity

Requires a validated aerobic or sport-specific reference.

General fallback RPE:

```text
RPE 7–9
```

may be used only when an explicit RPE-controlled profile is selected.

---

## Profile INT-REPEATED-SPRINT

```text
profileId: repeated_sprint_intervals_v0_1
moduleId: conditioning or power
methodId: work_rest_intervals
exerciseRole: conditioning or secondary
```

### Work Intervals

```text
10–20 intervals
```

### Work Duration

```text
3–8 seconds
```

### Rest Duration

```text
20–60 seconds
```

### Work-to-Rest Ratio

```text
greater than 1:8
```

### Intensity

Requires:

```text
all-out or validated supramaximal reference
```

This profile is unavailable when:

- the exercise is not sprint-compatible;
- safety conditions are missing;
- recovery protection forbids it;
- or the combat schedule contains a protected high-intensity session.

---

## Profile INT-SPRINT

```text
profileId: sprint_interval_training_v0_1
moduleId: conditioning
methodId: work_rest_intervals
exerciseRole: conditioning
```

### Work Intervals

```text
4–8 intervals
```

### Work Duration

```text
20–30 seconds
```

### Rest Duration

```text
120–240 seconds
```

### Work-to-Rest Ratio

```text
greater than 1:8
```

### Intensity

```text
all-out
```

This method creates high metabolic stress and must not be used as a generic combat-specific default.

---

# Table Group 9 — Combat Rounds

## Profile COMBAT-TECHNICAL-ROUNDS

```text
profileId: combat_technical_rounds_v0_1
moduleId: specific_skill
methodId: combat_rounds
exerciseRole: technical
```

### Rounds

```text
2–5 rounds
```

Normal:

```text
3 rounds
```

### Round Duration

```text
60–180 seconds
```

Normal:

```text
120 seconds
```

### Rest

```text
60–120 seconds
```

Normal:

```text
60 seconds
```

### Intensity

```text
technical_effort: easy_technical to high_quality
RPE: 4–7
impact_intent: technical_contact to moderate_power
```

Impact intent must be exercise- and equipment-specific.

### Minimum Dose

```text
2 rounds × 60 seconds
```

### Maximum Dose

```text
5 rounds × 180 seconds
```

---

## Profile COMBAT-CONDITIONING-ROUNDS

```text
profileId: combat_conditioning_rounds_v0_1
moduleId: conditioning or specific_skill
methodId: combat_rounds
exerciseRole: conditioning
```

### Required Specificity Rule

This profile must not use one universal work-to-rest ratio.

The ratio must come from:

1. the athlete’s combat sport;
2. the selected training objective;
3. validated sport-specific time-motion data;
4. or a documented sport-specific test.

### Generic Structural Boundary

```text
rounds: 3–6
round duration: 60–180 seconds
rest: 30–120 seconds
```

These boundaries authorize structure only.

They do not authorize a final executable profile without a sport-specific subtype.

### Combat-Specific Examples

Documented high-level competition structures vary substantially:

- striking and grappling sports do not share one universal ratio;
- high-intensity action-to-pause structure may differ from total work-to-rest structure;
- boxing, karate, taekwondo, judo and wrestling require distinct profiles.

Therefore, CAS V0.1 must create a separate subtype before prescribing a specific combat-conditioning round.

---

# Table Group 10 — Recovery Duration Work

## Profile REC-DURATION

```text
profileId: recovery_duration_work_v0_1
moduleId: recovery
methodId: recovery_duration_work
exerciseRole: recovery
```

### Duration

```text
10–30 minutes
```

Normal:

```text
15 minutes
```

### Intensity

```text
RPE 1–4
```

or:

```text
technical_effort: rehearsal or easy_technical
```

### Rest

```text
not applicable
```

### Minimum Dose

```text
10 minutes
```

### Maximum Dose

```text
30 minutes
```

---

# Exercise-Specific Numerical Requirement

The generic profiles above are insufficient for final execution when an exercise requires:

- exact implement mass;
- percentage of body mass;
- load per hand;
- load per side;
- assistance setting;
- band category;
- sprint pace;
- velocity threshold;
- impact count;
- jump contact count;
- medicine-ball mass;
- specific combat action frequency;
- or equipment-specific resistance.

Those values must be stored in an exercise-specific numerical profile.

---

# Exercise-Specific Profile Structure

```ts
interface ExerciseNumericalOverride {
  exerciseId: string;
  profileId: string;

  allowedSetRange?: NumericRange;
  allowedRepetitionRange?: NumericRange;
  allowedDurationRange?: DurationRange;
  allowedDistanceRange?: DistanceRange;

  loadingRuleId?: string;
  restOverrideRuleId?: string;
  tempoOverrideRuleId?: string;
  stopThresholdRuleIds: string[];

  sourceRuleIds: string[];
}
```

Exercise-specific rules may narrow generic ranges.

They must not broaden them without a versioned evidence review.

---

# Weekly Context Rules

The prescription layer must not calculate total weekly training dose unless it has validated information about:

- other CAS sessions;
- combat sessions;
- independent resistance training;
- recovery sessions;
- and the relevant time window.

Single-session tables must not be interpreted as weekly targets.

---

# Concurrent Training Rule

When strength, power, conditioning and combat work coexist, the engine must not independently maximize every profile.

The adjustment layer must preserve:

- the primary objective;
- protected combat sessions;
- minimum effective dose;
- recovery capacity;
- and total session duration.

---

# Failure Codes

Initial numerical failure codes may include:

```text
NUMERICAL_PROFILE_MISSING
NUMERICAL_PROFILE_UNSUPPORTED
NUMERICAL_RANGE_INVALID
NUMERICAL_SELECTION_RULE_MISSING
NUMERICAL_INTENSITY_REFERENCE_MISSING
NUMERICAL_EXERCISE_OVERRIDE_REQUIRED
NUMERICAL_MINIMUM_DOSE_MISSING
NUMERICAL_MAXIMUM_DOSE_MISSING
NUMERICAL_LOAD_UNRESOLVED
NUMERICAL_REST_UNRESOLVED
NUMERICAL_TEMPO_UNRESOLVED
NUMERICAL_COMBAT_SUBTYPE_REQUIRED
NUMERICAL_RULE_SOURCE_MISSING
```

---

# Safe Failure

Numerical generation must fail safely when:

- no profile exists for the module-method-role combination;
- a range cannot be resolved deterministically;
- required athlete reference data is missing;
- an exercise-specific load rule is required but absent;
- required equipment increments are unknown;
- a combat-specific subtype is required but absent;
- minimum dose cannot fit;
- or the result violates a higher-priority constraint.

---

# Decision Trace Integration

The Decision Trace must record:

- numerical profile identifier;
- source type;
- initial range;
- context used for range selection;
- selected value;
- athlete reference;
- formula;
- raw calculated value;
- rounded value;
- minimum dose;
- maximum dose;
- rejected alternatives;
- and validation outcome.

---

# Reference Basis

The initial resistance-training boundaries use current ACSM guidance and the earlier ACSM progression framework where the newer summary does not define all implementation dimensions.

The initial combat HIIT boundaries use the combat-sport-specific framework summarized by Franchini, including distinctions among:

- long intervals;
- short intervals;
- repeated-sprint training;
- sprint interval training;
- and sport-specific time-motion structures.

The tables must be reviewed whenever the referenced consensus or CAS evidence standard changes.

---

# Implementation Boundary

These tables provide the first bounded numerical profiles.

They still require:

```text
35_PRESCRIPTION_ADJUSTMENT_RULES.md
```

before contextual prescription implementation begins.

The first TypeScript implementation should support only profiles with:

- complete exercise capabilities;
- complete source identifiers;
- complete adjustment behaviour;
- and passing tests.

---

# Acceptance Criteria

The Numerical Prescription Tables V0.1 are valid only if:

- every executable value comes from a profile;
- every range has deterministic selection logic;
- strength, hypertrophy and power remain distinct;
- power prioritizes movement intent and quality;
- isometric duration is explicit;
- carries define distance and laterality;
- interval types remain distinct;
- combat rounds require sport-specific refinement;
- aerobic work does not invent heart-rate references;
- minimum and maximum doses are explicit;
- generic profiles do not invent exercise-specific loads;
- unsupported cases fail safely;
- every selected value is traceable;
- and identical inputs produce identical values.

---

# Final Principle

> CAS must prefer a defensible range with a deterministic selection rule over an unjustified exact number.

Numerical precision is valid only when the underlying reference, context and exercise capability are equally precise.