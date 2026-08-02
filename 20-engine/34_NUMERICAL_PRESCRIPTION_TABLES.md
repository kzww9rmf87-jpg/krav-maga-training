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
exerciseRole: secondary, accessory, or robustness
```

This role list previously opened with `primary`, which `timed_isometric_sets` does not support (`31_TRAINING_METHOD_CATALOGUE.md`, Method 2 — Timed Isometric Sets: secondary, accessory, robustness, corrective, recovery). Any entry declaring it failed `validateMethodModuleRoleContract` with `METHOD_ROLE_INCOMPATIBLE` before a single number was read. `primary` is removed rather than added to the method, because the Grip module's own primary role is already served by `distance_carry_sets` (Table Group 5).

`corrective` and `recovery` are NOT added merely because the method permits them: this table documents an intensity band of RPE 7–9, which is not corrective or recovery work.

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

Normal:

```text
RPE 8
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

### Tempo

```text
type: isometric_hold
```

This section was missing. `timed_isometric_sets` declares `tempoPolicy: required`, so a profile without a tempo rule can never prescribe — `resolveTempo` fails with `TEMPO_REQUIRED_BUT_UNDOCUMENTED` on every input, exactly as `conditioning_short_intervals_v0_1` fails on intensity. The value is the same one ISO-CORE-ROBUSTNESS already documents in this table group, and it carries no number: a timed isometric set IS an isometric hold, and `isometric_hold` is the only one of the method's two permitted tempo types that needs no additional movement intent.

### Minimum Dose

```text
2 sets × 10 seconds
```

### Maximum Dose

```text
4 sets × 30 seconds
```

### Exercise-Specific Narrowing

```text
plate_pinch:  sets 3–4   hold 15–30 s   rest 90–150 s
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

# Table Group 11 — Robustness

## Profile ROBUSTNESS-ACCESSORY

```text
profileId: robustness_accessory_straight_sets_v0_1
moduleId: robustness
methodId: straight_sets_repetitions
exerciseRole: accessory
```

### Volume

```text
sets: 2–5
repetitions: 10–30
```

Normal:

```text
3 sets × 20 repetitions
```

### Intensity

```text
RPE 3–8
```

or:

```text
technical_effort: high_quality
```

Normal:

```text
RPE 5
```

### Rest

```text
45–90 seconds
```

Normal:

```text
60 seconds
```

### Tempo

```text
type: global_intent
globalIntent: controlled
```

### Minimum Dose

```text
2 sets × 10 repetitions
```

### Maximum Dose

```text
5 sets × 30 repetitions
```

### Stop Conditions

- technical breakdown (loss of position, compensation, momentum, bouncing or incomplete range of motion, as documented per exercise);
- pain;
- completion.

### Exercise-Specific Narrowing

This shared envelope deliberately covers two distinct business categories documented across the four exercises using it. Each exercise narrows the shared RPE and repetition range to its own documented bounds via `exerciseIntensityConstraints`/`exerciseDoseConstraints` — this profile is never widened per exercise, only narrowed:

```text
tibialis_raise:          RPE 5–6–8   reps 12–30
rotator_cuff_training:   RPE 3–4–6   reps 12–25
wrist_strengthening:     RPE 3–4–6   reps 10–30
soleus_raise:            RPE 5–6–8   reps 15–30
```

Rest (45–60–90 seconds) is identical across all four exercises and is not narrowed for any of them. `wrist_strengthening` represents its repetitions variant only — its documented isometric-hold variant is out of scope and is structurally excluded, since this profile's method (`straight_sets_repetitions`) and volume structure (`sets_reps`) cannot represent a timed hold.

---

# Table Group 12 — Strength Accessory (Extended Repetitions)

## Profile STRENGTH-ACCESSORY

```text
profileId: strength_accessory_straight_sets_v0_1
moduleId: strength
methodId: straight_sets_repetitions
exerciseRole: accessory
```

### Volume

```text
sets: 2–6
repetitions: 4–15
```

Normal:

```text
3 sets × 8 repetitions
```

### Intensity

```text
RPE 6–8
```

Normal:

```text
RPE 7
```

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
2 sets × 4 repetitions
```

### Maximum Dose

```text
6 sets × 15 repetitions
```

### Stop Conditions

- technical breakdown (documented per exercise);
- pain;
- completion.

### Exercise-Specific Narrowing

```text
hip_thrust:    reps 4–10   sets 3–6
chin_up:       reps 4–15   sets 2–6  (matches the shared envelope exactly)
barbell_row:   reps 5–12   sets 3–6
```

### Documented But Inactive Capability — percentage_1rm

`hip_thrust` and `barbell_row` document a loading range of 60–90% of the one-repetition maximum in their own chapters. This range is acknowledged here as a real, sourced documentary fact, but `percentage_1rm` is **not activated** in their CAS V0.1 prescription. No conversion from this documented percentage range into an RPE value is performed anywhere in this profile or in either exercise's Registry entry — the RPE range above is an independent CAS V0.1 business decision, not a derivation of the percentage range.

This exclusion is deliberate: `resolveVolume` and `resolveIntensity` currently resolve volume and intensity independently, with no coupling between them. A wide repetition range (4–15) combined with a wide `percentage_1rm` range (60–90%) could produce an incoherent pair — for example, 15 repetitions at 90% of the one-repetition maximum, which is not achievable. A future evolution must model a coupled relationship between resolved repetitions and load intensity before `percentage_1rm` can be safely activated for exercises using this profile.

---

# Table Group 13 — Core Repetition Work

Table Group 4 covers Core work prescribed as a timed hold. This group covers the other half of the Core module: Core work prescribed in repetitions.

`50-exercises/62_CORE/00_OVERVIEW.md`, "Volume Principles", names the preferred volume unit of every V0.1 Core exercise and identifies the repetition-prescribed family directly:

```text
Ab Wheel          → repetitions
Pallof Press      → repetitions or duration
Dead Bug          → repetitions per side or controlled breaths
Hanging Leg Raise → repetitions
Dragon Flag       → repetitions or controlled eccentrics
```

That named family — not any single exercise — is the scope of this group.

## Profile CORE-REPETITION-ROBUSTNESS

```text
profileId: core_robustness_straight_sets_v0_1
moduleId: core
methodId: straight_sets_repetitions
exerciseRole: robustness, secondary, accessory, or corrective
```

The role list mirrors ISO-CORE-ROBUSTNESS (Table Group 4), the only other Core profile: `62_CORE/00_OVERVIEW.md`, "Exercise Position Within a Session", places Core at position 8 of the default session order, after Assistance and after Robustness or Grip. Core repetition work is not primary strength work, and no role above `robustness` is claimed for it.

### Volume

```text
sets: 2–5
repetitions: 3–15
```

Normal:

```text
3 sets × 10 repetitions
```

The set floor and normal are taken unchanged from ISO-CORE-ROBUSTNESS (2–4, normal 3) — the established Core set doctrine, which this group does not restate differently for the sake of restating it. The ceiling is raised to 5 because the repetition family's own records document 5 (Ab Wheel: "Valid Set Range — 2 to 5 sets"; Pallof Press: "Valid Set Range — 2 to 5 sets"); the isometric family's ceiling of 4 is not imposed on a family that documents 5.

The repetition range is an envelope covering the named family, constructed exactly as ROBUSTNESS-ACCESSORY's own 10–30 envelope covers its four exercises: the floor is the lowest documented in the family (Ab Wheel, "Valid Repetition Range — 3 to 12 repetitions"), the ceiling the highest (Pallof Press, "Valid Repetition Range — 6 to 15 repetitions per side"). Every exercise then narrows it to its own documented bounds. The envelope is never widened per exercise.

The repetition normal is stated rather than derived from the range: `62_CORE/00_OVERVIEW.md`, "Prescription Requirements", gives the only worked Core prescription example in the documentation, and it reads `repetitions: 10`. That value lies inside every documented range in the family and equals the ceiling of Ab Wheel's own "Standard V0.1 Range — 3 to 4 sets of 5 to 10 controlled repetitions". Stating a normal instead of taking the arithmetic middle follows Table Group 4, which states 20 seconds as the normal of a 10–40 second range.

### Intensity

```text
RPE 6–8
```

Normal:

```text
RPE 7
```

or:

```text
technical_effort: high_quality
```

The RPE band is taken unchanged from ISO-CORE-ROBUSTNESS and is independently corroborated by two records of this family, each stating "Approximately RPE 6 to 8" (Ab Wheel and Pallof Press, "Recommended Effort"). The normal follows Integer Resolution. `technical_effort: high_quality` is offered as the alternative metric, matching Table Group 4 and the Core module's own preferred intensity types (`technical_effort`, `rpe` — `32_MODULE_PRESCRIPTION_PROFILES.md`, Module 8).

Percentage of a one-repetition maximum is not offered. `62_CORE/00_OVERVIEW.md`, "Intensity Principles", regulates Core intensity through lever length, range of motion, base of support, asymmetry, complexity, tempo and resistance — not through a percentage of a maximal lift.

### Rest

```text
45–120 seconds
```

Normal:

```text
60 seconds
```

Taken unchanged from ISO-CORE-ROBUSTNESS, and corroborated exactly by Ab Wheel's own "Rest Range — 45 to 120 seconds". The Core module's rest policy is qualitative ("Rest must preserve trunk position and execution quality"), so the numeric envelope comes from the Core table doctrine rather than from the module profile.

### Tempo

```text
type: global_intent
globalIntent: controlled
```

The Core module's tempo policy is "Controlled or hold-based tempo is often required". Hold-based tempo belongs to Table Group 4; the repetition family therefore takes the controlled form, encoded exactly as ROBUSTNESS-ACCESSORY encodes it.

Individual records in this family document phase-timed tempos (Ab Wheel: `3-1-2`, `2-0-2`, `4-1-2`). Phase timing is **not representable** by a numerical profile's tempo rule, which admits only `global_intent`, `phase_intent`, `isometric_hold` or `none`. This is a documented precision loss, not a silent approximation: an exercise's documented phase timings belong in its own instructions until a phase-timed tempo rule exists.

### Minimum Dose

```text
2 sets × 3 repetitions
```

### Maximum Dose

```text
5 sets × 15 repetitions
```

The maximum boundaries must not be combined automatically.

### Bilateral and Per-Side Exercises

The repetition range above is expressed **per set as prescribed**, not as a whole-body total.

An exercise whose own record prescribes repetitions per side (Dead Bug: "repetitions per side"; Pallof Press: "6 to 15 repetitions per side") declares that fact in its own registry entry through its laterality and volume interpretation. The same numeric range then applies to each side.

No doubling, halving or other conversion between a per-side count and a total count is performed anywhere — by this profile, by any resolver, or by any registry entry.

### Limits of Use

This profile must not be used for:

- timed Core holds — Table Group 4 covers those, and converting repetitions into seconds is forbidden;
- high-repetition, fatigue-driven accessory work — ROBUSTNESS-ACCESSORY's 10–30 envelope covers that, and it belongs to the robustness module;
- externally loaded Core work requiring an exact implement mass, a percentage of body mass or a load per side, which remain exercise-specific numerical requirements (see below).

### Exercise-Specific Narrowing

```text
ab_wheel:  sets 2–5 (matches the shared envelope exactly)   reps 3–12
```

---

# Table Group 14 — Power Intervals

Table Group 8 covers three general work-rest interval families: short aerobic-power intervals (INT-SHORT), long aerobic intervals (INT-LONG) and repeated sprints (INT-REPEATED-SPRINT). None of them covers a fourth, distinct structure the exercise library documents: a small number of short, maximal-INTENT efforts against a resistance the athlete drives, separated by incomplete recovery.

That structure does not fit any existing group, and the gap is arithmetic rather than editorial:

- INT-SHORT prescribes 10–20 intervals. The documented power-interval records run 3–12, so INT-SHORT's interval count does not intersect the shorter of them at all. INT-SHORT is also non-executable, documenting no encodable intensity;
- INT-LONG prescribes 60–180 second efforts, which no power-interval record reaches;
- INT-REPEATED-SPRINT prescribes 3–8 second efforts, which every power-interval record exceeds;
- INT-SPRINT prescribes 120–240 seconds of rest, above the ceiling of every power-interval record.

## Profile INT-POWER

```text
profileId: power_intervals_v0_1
moduleId: conditioning
methodId: work_rest_intervals
exerciseRole: conditioning
```

This triple is shared with the three Table Group 8 profiles. Any registry entry on it must declare an explicit `numericalProfileId`; implicit resolution refuses the triple and never picks by array order.

### Scope

The power-interval family, as documented by the exercise library:

```text
Heavy Bag Power Intervals   3–8 rounds    work 10–30 s   recovery 30–90 s
Battle Ropes                5–12 rounds   work 10–40 s   recovery 20–90 s
```

Both records share a Primary Classification of "Combat-Specific Conditioning", the same ATP-PC plus anaerobic-glycolysis energy systems, and a Velocity Profile containing "Maximum Intent". That shared framing — not any single exercise — is the scope of this group.

Each member narrows the envelope below to its own documented bounds. The envelope is never widened per exercise.

### Volume

```text
work intervals: 3–12
work duration: 10–40 seconds per interval
```

Normal:

```text
7 intervals × 25 seconds
```

The bounds are the family's documented extremes, the same envelope-then-narrow construction Table Groups 11 and 13 already use. The normals follow the Integer Resolution convention above: 3–12 resolves to 7 (the lower integer of an even-width range, exactly as INT-REPEATED-SPRINT's own 3–8 resolves to 5), and 10–40 resolves to 25.

### Intensity

Two documented rules. Neither record states an RPE figure anywhere, and neither is asked to.

```text
impact_intent: maximal_safe_power
```

for power intervals whose resistance is struck. `26_INTENSITY_MODEL.md` sanctions this directly — "bag work may support technical effort or impact intent", and `impact_intent` "represents the intended force of striking, throwing, landing or contact". `maximal_safe_power` is the finite impact vocabulary's maximal value, mapped from a record's own "Maximum Power" exactly as INT-REPEATED-SPRINT maps "all-out" to `movement_intent: maximal_safe_speed`.

```text
movement_intent: explosive
```

for power intervals that are not impact work. `explosive` is a literal member of the documented movement-intent vocabulary and a literal word in the Battle Ropes Velocity Profile.

An exercise claims whichever of the two its own record and capability family document — never both, and never one it does not document.

Heart rate, pace, velocity and power output remain unencodable here for the same reason they are unencodable in INT-SHORT: `IntensityRangeRule` admits no unit or reference type for them. Records listing power meters or heart-rate monitors list them as optional instrumentation, never as a prescribed target.

### Rest

```text
20–90 seconds
```

Normal:

```text
55 seconds
```

Between intervals. Bounds are the family's documented extremes; the normal follows Integer Resolution.

### Tempo

Forbidden. `work_rest_intervals` declares `tempoPolicy: forbidden`, so this group documents no tempo rule, exactly like the three Table Group 8 profiles.

### Minimum Dose

```text
3 intervals × 10 seconds
```

### Maximum Dose

```text
12 intervals × 40 seconds
```

The maximum boundaries must not be combined automatically.

### Limits of Use

This profile must not be used for:

- aerobic interval work — INT-LONG covers that, at RPE 7–9 over 60–180 second efforts;
- repeated maximal sprints — INT-REPEATED-SPRINT covers those, at 3–8 seconds;
- sport-specific combat rounds — Table Group 9 covers those, and COMBAT-CONDITIONING-ROUNDS explicitly refuses to prescribe without a sport-specific subtype.

A record using the word "rounds" for its interval count does not by itself belong to Table Group 9. A combat round is a sport-defined competition period; a 10–40 second maximal effort with incomplete recovery is an interval, whatever the record calls it.

### Exercise-Specific Narrowing

```text
heavy_bag_power_intervals:  intervals 3–8   work 10–30 s   rest 30–90 s
```

---

# Table Group 15 — Grip Repetition Strength

## Objective

Grip-integrated pulling and pressing strength, counted in complete
repetitions, where grip difficulty rather than the prime movers sets the
repetition ceiling.

## Profile GRIP-REPETITION-STRENGTH

```text
profileId: grip_repetition_strength_v0_1
moduleId: grip
methodId: straight_sets_repetitions
exerciseRole: secondary
```

This triple is unique in the profile set; implicit resolution already
selects it. Consumers declare the id explicitly all the same, so the
selection is auditable in the Decision Trace rather than inferred.

The role is `secondary` because `65_GRIP/00_OVERVIEW.md`'s own "Placement
Within the Session" states that grip work "is usually placed after primary
technical and strength work", and "may be placed earlier only when grip
strength is the primary objective". A primary-role variant would be a
separate profile.

## Module Source

This group does NOT claim a pre-existing family discovered across several
records. It implements a module rule that `65_GRIP/00_OVERVIEW.md` now
states directly, under "General Prescription Ranges → Grip Repetition
Strength": purpose, admissible and excluded exercises, sets, repetitions,
intensity, rest, tempo, progression and limits of use.

Every number below is that section's, not any single exercise's. The
doctrine is owned by the module; an exercise narrows it.

Why the module needed the rule: the chapter's other five prescription
ranges count short maximal efforts, seconds of holding, or controlled
repetitions at low to moderate loading for tissue exposure. None describes
a near-maximal whole movement whose repetition ceiling is set by the hands.

## Admissible Exercises

Exercises whose prescribed unit is a complete repetition of the whole
movement and whose limiting factor is grip security.

`towel_pull_up` is the first consumer. It is an example of the category,
never its definition.

## Units Included

```text
complete repetitions of the whole movement (total_repetitions)
```

## Units Excluded

The chapter's own "Volume Metrics" section requires this, stating that
"CAS must avoid combining incompatible volume measures without context"
and listing total repetitions, maximal closes and finger contacts as
distinct metrics:

- rope ascents (a climb is a bout of many hand transitions);
- hand-over-hand pulls (a repetition of one hand, not of the movement);
- distance — Table Group 5 covers loaded carries;
- timed holds and isometric variations — Table Group 4 covers those;
- timed work intervals;
- gripper closes and finger contacts.

No future entry may absorb any of these by declaring a different
`volumeInterpretation`. The three REPETITION interpretations
(`total_repetitions`, `repetitions_per_side`,
`alternating_total_repetitions`) express LATERALITY, not unit, so none of
them can turn a repetition into something else.

Climbs and hand pulls were subsequently given their own vocabulary members
— an additive `cas-session-output.v1` change, recorded in that contract's
own additive history — and Table Groups 16 and 17 own them. They remain
outside THIS group: a separate interpretation is what puts an exercise in a
separate family, never what lets it join this one.

### Volume

```text
sets: 3–5
repetitions: 2–8
```

Normal:

```text
4 sets × 5 repetitions
```

Normals follow the Integer Resolution convention above (3–5 → 4; 2–8 → 5).

### Intensity

```text
1–3 RIR
```

Normal:

```text
2 RIR
```

Repetitions in reserve, not RPE and not a load percentage. The chapter's
own "Intensity Determinants" section states that "Grip intensity is not
represented accurately by external load alone" and lists handle diameter,
surface friction, finger position and proximity to grip failure among its
determinants — none of which is encodable as a numeric target. A reserve
counted against grip security is the one documented quantity that is.

The range is encoded `min: 1, normal: 2, max: 3`, the same form Table
Group 1's STR-PRIMARY and Table Group 2's HYP-PRIMARY already use for
their own documented RIR ranges. Range-context selection therefore behaves
identically to those two profiles: `reduced` takes the low end, `high` the
high end of the documented range. That is a range-position convention, not
a difficulty dial, and it is not re-interpreted here.

### Rest

```text
90–240 seconds
```

Normal:

```text
165 seconds
```

Between sets.

### Tempo

```text
type: global_intent
globalIntent: controlled
```

The module rule states "Controlled throughout, with a controlled descent."
`controlled` is a literal member of the movement-intent vocabulary.

Phase timing is **not representable** by a numerical profile's tempo rule,
which admits only `global_intent`, `phase_intent`, `isometric_hold` or
`none`. An exercise record documenting a specific eccentric duration keeps
that figure in its own instructions — the same documented precision loss
Table Group 13 already records for phase-timed core work.

### Minimum Dose

```text
3 sets × 2 repetitions
```

### Maximum Dose

```text
5 sets × 8 repetitions
```

The maximum boundaries must not be combined automatically.

### Exercise-Specific Narrowing

An exercise narrows this envelope to its own documented prescriptions and
never widens it. Where a record documents several prescriptions counted in
complete repetitions, their union is what it may declare.

```text
towel_pull_up:  sets 3–5   repetitions 2–8   rest 90–240 s
```

### Limits of Use

This profile must not be used:

- when the prescribed unit is anything other than a complete repetition;
- when the limiting factor is the prime movers rather than the grip — that
  is ordinary strength work, and Table Groups 1, 2 and 12 cover it;
- for an isometric variation of the same exercise — Table Group 4 covers
  timed grip holds, and `plate_pinch` already consumes it;
- to keep accumulating volume once grip security is lost. The module rule
  terminates the set at that point regardless of the repetitions
  remaining, which is why every consumer must declare a technical-failure
  and an equipment-failure stop condition.

---

# Table Group 16 — Grip Climb Strength

## Objective

Grip-integrated climbing strength, counted in complete ascents.

## Profile GRIP-CLIMB-STRENGTH

```text
profileId: grip_climb_strength_v0_1
moduleId: grip
methodId: straight_sets_repetitions
exerciseRole: secondary
```

This triple is now shared with Table Group 15's GRIP-REPETITION-STRENGTH and
Table Group 17's GRIP-HAND-PULL-WORK. Any registry entry on it must declare
an explicit `numericalProfileId`; implicit resolution refuses the triple and
never picks by array order.

The role is `secondary`, from `65_GRIP/00_OVERVIEW.md`'s own "Placement
Within the Session" — grip work "is usually placed after primary technical
and strength work" — the same source Table Group 15 uses.

## Module Source

Created, not discovered. `65_GRIP/00_OVERVIEW.md` states the rule under
"General Prescription Ranges → Grip Climb Strength": purpose, admissible and
excluded exercises, sets, climbs, intensity, rest, tempo, progression and
limits of use. Every number below is that section's.

## Units Included

```text
complete ascents (climbs)
```

## Units Excluded

- hand-over-hand pulls — Table Group 17 covers those;
- complete repetitions of a whole movement — Table Group 15 covers those;
- climbed height, which is a described variable and never a volume
  dimension: an ascent is counted, its height is not converted into a count;
- distance, timed holds and timed intervals.

### Volume

```text
sets: 3–5
climbs: 1–5
```

Normal:

```text
4 sets × 3 climbs
```

The climb count travels in the profile's `repetitions` field, because that
is the only integer-count field the `sets_reps` structure has. It is NOT a
repetition, and the consuming entry says so by declaring
`volumeInterpretation: climbs` — the vocabulary member added for exactly
this purpose. Normals follow the Integer Resolution convention (3–5 → 4;
1–5 → 3).

### Intensity

```text
technical_effort: high_quality
```

No RIR and no RPE. An ascent cannot be left partly in reserve — a climb
abandoned mid-rope is a descent under compromised grip, which this
category's own safety rule forbids — so the module rule prescribes the
technical standard the effort must preserve instead.

### Rest

```text
120–300 seconds
```

Normal:

```text
210 seconds
```

Between sets.

### Tempo

```text
type: global_intent
globalIntent: controlled
```

The module rule states "Controlled ascent and controlled descent."

### Minimum Dose

```text
3 sets × 1 climb
```

### Maximum Dose

```text
5 sets × 5 climbs
```

The maximum boundaries must not be combined automatically.

### Exercise-Specific Narrowing

```text
rope_climb:  sets 3–5   climbs 1–5   rest 120–300 s
```

### Limits of Use

- never for a unit other than a complete ascent;
- never to prescribe partial climbs counted as hand transitions;
- never to keep accumulating volume once grip security is lost.

---

# Table Group 17 — Grip Hand-Pull Work

## Objective

Grip-integrated hand-over-hand pulling, counted in individual pulls.

## Profile GRIP-HAND-PULL-WORK

```text
profileId: grip_hand_pull_work_v0_1
moduleId: grip
methodId: straight_sets_repetitions
exerciseRole: secondary
```

Third profile on the same shared triple; the explicit-id rule above applies
identically.

## Module Source

Created, not discovered, and stated in `65_GRIP/00_OVERVIEW.md` under
"General Prescription Ranges → Grip Hand-Pull Work".

## Units Included

```text
hand-over-hand pulls (hand_pulls)
```

## Units Excluded

- complete ascents — Table Group 16 covers those;
- complete repetitions of a whole movement — Table Group 15 covers those;
- the same exercise prescribed by distance travelled — Table Group 5 covers
  loaded carries;
- the same exercise prescribed as timed work intervals.

A record may contribute its pull-counted prescriptions to this group while
its distance-based and interval-based prescriptions stay outside it.

### Volume

```text
sets: 3–5
hand pulls: 6–20
```

Normal:

```text
4 sets × 13 hand pulls
```

The pull count travels in the `repetitions` field for the same structural
reason as Table Group 16, and the consuming entry declares
`volumeInterpretation: hand_pulls`. Normals follow Integer Resolution
(3–5 → 4; 6–20 → 13).

### Intensity

```text
technical_effort: high_quality
```

External resistance is a documented determinant — sled weight, rope angle,
friction, rope diameter, pulling position — but the records qualify it in
words, never in figures, and the chapter states that grip intensity is not
represented accurately by external load alone. No qualitative resistance
level is converted into a number.

### Rest

```text
90–240 seconds
```

Normal:

```text
165 seconds
```

Between sets.

### Tempo

```text
type: global_intent
globalIntent: controlled
```

The module rule states "Controlled throughout, at a consistent cadence."

### Minimum Dose

```text
3 sets × 6 hand pulls
```

### Maximum Dose

```text
5 sets × 20 hand pulls
```

The maximum boundaries must not be combined automatically.

### Exercise-Specific Narrowing

```text
rope_pull:  sets 3–5   hand pulls 6–20   rest 90–240 s
```

### Limits of Use

- never for a unit other than a hand-over-hand pull;
- never to prescribe the same exercise by distance or by timed interval;
- never to keep accumulating volume once grip security is lost.

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