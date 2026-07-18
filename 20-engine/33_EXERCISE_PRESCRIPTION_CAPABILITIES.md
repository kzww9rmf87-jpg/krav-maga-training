# EXERCISE PRESCRIPTION CAPABILITIES

Version 0.1

---

# Purpose

The Exercise Prescription Capabilities define what prescription structures, intensity metrics, loading modes, tempo policies, laterality rules and stop conditions each exercise may support.

Their purpose is to prevent the Combat Athlete System from assigning a structurally valid but exercise-incompatible prescription.

The Capability Module defines why the athlete trains.

The Training Method defines how work is organized.

The Exercise Prescription Capabilities define what the selected exercise can safely and meaningfully support.

An exercise is prescribable only when its capabilities satisfy all mandatory requirements of the selected module-method-role profile.

---

# Core Principle

> The exercise constrains implementation; it does not define the adaptation.

The engine must never infer a prescription solely from:

- exercise name;
- common gym practice;
- display label;
- or exercise category.

Every selected exercise must expose a structured capability profile.

No capability may be assumed implicitly.

---

# Scope

The Exercise Prescription Capabilities govern:

- supported Training Methods;
- supported volume structures;
- supported intensity types;
- supported loading modes;
- supported tempo structures;
- laterality;
- unilateral volume interpretation;
- supported measurement units;
- required equipment;
- required athlete references;
- required instructions;
- required stop conditions;
- duration-estimation requirements;
- substitution compatibility;
- and safe failure.

This document defines the schema and exercise-family profiles.

Exact numerical values belong in:

```text
34_NUMERICAL_PRESCRIPTION_TABLES.md
```

---

# Canonical Capability Structure

Each Exercise Definition used by the prescription engine must contain or reference a structure equivalent to:

```ts
interface ExercisePrescriptionCapabilities {
  exerciseId: string;
  version: string;

  supportedMethodIds: string[];
  supportedVolumeStructures: VolumeStructure[];

  supportedIntensityTypes: IntensityType[];
  preferredIntensityTypes: IntensityType[];

  supportedLoadingModes: LoadingMode[];
  supportedTempoTypes: TempoType[];

  laterality: ExerciseLaterality;
  volumeInterpretation: VolumeInterpretation[];

  supportedUnits: PrescriptionUnit[];

  requiredEquipmentCapabilities: string[];
  requiredAthleteReferenceTypes: string[];

  requiredInstructionIds: string[];
  requiredStopConditionIds: string[];

  durationEstimationProfileId: string;

  substitutionCapabilityTags: string[];

  sourceRuleIds: string[];
  status: ExerciseCapabilityStatus;
}
```

The exact TypeScript implementation may evolve, but equivalent information must exist.

---

# Capability Status

A capability profile may use:

```ts
type ExerciseCapabilityStatus =
  | "documented"
  | "implemented"
  | "experimental"
  | "deprecated"
  | "unsupported";
```

Only documented and implemented profiles may reach executable prescription output.

---

# Loading Mode Vocabulary

The initial loading-mode vocabulary may include:

```ts
type LoadingMode =
  | "bodyweight"
  | "added_external_load"
  | "assisted_bodyweight"
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "cable"
  | "machine"
  | "resistance_band"
  | "medicine_ball"
  | "sandbag"
  | "sled"
  | "plate"
  | "rope"
  | "partner_resistance"
  | "impact_equipment"
  | "ergometer"
  | "locomotion_only";
```

Additional modes require a versioned update.

---

# Laterality Vocabulary

The initial laterality vocabulary may include:

```ts
type ExerciseLaterality =
  | "bilateral"
  | "unilateral"
  | "alternating"
  | "asymmetrical"
  | "not_applicable";
```

Laterality must be explicit.

---

# Volume Interpretation Vocabulary

The initial vocabulary may include:

```ts
type VolumeInterpretation =
  | "total_repetitions"
  | "repetitions_per_side"
  | "alternating_total_repetitions"
  | "duration_per_side"
  | "total_duration"
  | "distance_per_side"
  | "total_distance"
  | "load_per_hand"
  | "load_per_side"
  | "combined_external_load"
  | "system_load"
  | "round_total"
  | "interval_total";
```

At least one valid interpretation must exist for every supported volume structure.

---

# Supported Unit Vocabulary

The initial supported-unit vocabulary may include:

```text
repetitions
seconds
minutes
meters
kilograms
percentage
rpe_scale_1_10
repetitions_in_reserve
meters_per_second
beats_per_minute
minutes_per_kilometer
category
```

The exact implementation must use the unit types defined in the canonical prescription model.

---

# Capability Validation Rule

An exercise is compatible with a prescription profile only when:

```text
Required Method
∈ Supported Methods

Required Volume Structure
∈ Supported Volume Structures

Required Intensity Type
∈ Supported Intensity Types

Required Loading Mode
∈ Supported Loading Modes

Required Tempo Type
∈ Supported Tempo Types

Required Units
⊆ Supported Units

Required Equipment
⊆ Available Equipment

Required Athlete References
⊆ Valid Athlete References

Required Stop Conditions
⊆ Resolved Stop Conditions
```

All mandatory checks must pass.

---

# No Partial Compatibility

Partial compatibility is insufficient.

Examples:

- supporting repetitions does not imply support for percentage-based loading;
- supporting duration does not imply support for isometric holds;
- supporting external load does not imply support for one-repetition maximum percentages;
- supporting unilateral execution does not resolve whether volume is per side or total;
- supporting explosive intent does not imply measurable velocity support;
- supporting combat rounds does not imply maximal impact support.

The engine must validate each dimension independently.

---

# Exercise Family 1 — Barbell Strength Exercises

## Examples

Potential examples include:

```text
back squat
front squat
bench press
overhead press
deadlift
barbell row
```

Only exercises already present in the validated CAS knowledge base may receive profiles.

## Supported Methods

```text
straight_sets_repetitions
power_repetition_sets
```

Power use must be explicitly authorized for the exact exercise.

## Supported Volume Structures

```text
sets_reps
```

## Supported Intensity Types

Potentially:

```text
absolute_load
percentage_1rm
percentage_training_max
rpe
rir
movement_intent
velocity
```

## Supported Loading Modes

```text
barbell
added_external_load
```

## Supported Tempo Types

Potentially:

```text
phase_timed
phase_intent
global_intent
mixed
```

## Laterality

Normally:

```text
bilateral
```

## Volume Interpretation

```text
total_repetitions
combined_external_load
system_load
```

## Required Equipment Capabilities

May include:

- barbell;
- compatible plates;
- rack where required;
- bench where required;
- collars;
- safety supports where required.

## Required Athlete References

Percentage-based methods may require:

```text
one_rep_max
training_max
```

## Required Stop Conditions

At minimum:

- technical failure;
- pain;
- equipment failure;
- intensity limit where relevant;
- planned completion.

---

# Exercise Family 2 — Dumbbell and Kettlebell Repetition Exercises

## Supported Methods

```text
straight_sets_repetitions
power_repetition_sets
```

Power method support must be exercise-specific.

## Supported Volume Structures

```text
sets_reps
```

## Supported Intensity Types

```text
absolute_load
rpe
rir
resistance_category
movement_intent
```

## Supported Loading Modes

```text
dumbbell
kettlebell
added_external_load
```

## Supported Tempo Types

```text
phase_timed
phase_intent
global_intent
mixed
```

## Laterality

May be:

```text
bilateral
unilateral
alternating
asymmetrical
```

The exact value must be defined per exercise.

## Volume Interpretation

May include:

```text
total_repetitions
repetitions_per_side
alternating_total_repetitions
load_per_hand
load_per_side
combined_external_load
```

## Required Stop Conditions

- technical failure;
- loss of implement control;
- balance loss where relevant;
- pain;
- planned completion.

---

# Exercise Family 3 — Bodyweight Strength Exercises

## Examples

Potentially:

```text
pull-up
chin-up
dip
push-up
inverted row
single-leg squat variation
```

## Supported Methods

```text
straight_sets_repetitions
timed_isometric_sets
```

## Supported Volume Structures

```text
sets_reps
sets_duration
```

## Supported Intensity Types

```text
rpe
rir
assistance_level
percentage_body_mass
absolute_load
technical_effort
```

Absolute load applies only to added external load.

## Supported Loading Modes

```text
bodyweight
added_external_load
assisted_bodyweight
resistance_band
machine
```

## Supported Tempo Types

```text
phase_timed
phase_intent
isometric_hold
mixed
```

## Laterality

Exercise-specific.

## Volume Interpretation

May include:

```text
total_repetitions
repetitions_per_side
duration_per_side
total_duration
system_load
```

## Required Athlete References

Percentage-of-body-mass methods require:

```text
body_mass
```

## Required Stop Conditions

- technical failure;
- pain;
- loss of required range;
- equipment failure;
- planned completion.

---

# Exercise Family 4 — Machine and Cable Exercises

## Supported Methods

```text
straight_sets_repetitions
timed_isometric_sets
```

## Supported Volume Structures

```text
sets_reps
sets_duration
```

## Supported Intensity Types

```text
absolute_load
rpe
rir
resistance_category
technical_effort
```

## Supported Loading Modes

```text
machine
cable
```

## Supported Tempo Types

```text
phase_timed
phase_intent
isometric_hold
mixed
```

## Laterality

Exercise-specific.

## Volume Interpretation

May include:

```text
total_repetitions
repetitions_per_side
duration_per_side
total_duration
load_per_side
combined_external_load
```

## Required Stop Conditions

- technical failure;
- pain;
- machine or cable failure;
- planned completion.

---

# Exercise Family 5 — Isometric Core and Robustness Exercises

## Examples

Potentially:

```text
plank
side plank
Pallof hold
split squat isometric
wall sit
isometric neck exercise
```

## Supported Methods

```text
timed_isometric_sets
controlled_mobility_sets
```

## Supported Volume Structures

```text
sets_duration
```

## Supported Intensity Types

```text
rpe
technical_effort
absolute_load
percentage_body_mass
resistance_category
```

## Supported Loading Modes

May include:

```text
bodyweight
added_external_load
cable
resistance_band
plate
partner_resistance
```

## Supported Tempo Types

```text
isometric_hold
global_intent
```

## Laterality

Exercise-specific.

## Volume Interpretation

```text
total_duration
duration_per_side
```

## Required Stop Conditions

- loss of required position;
- pain;
- acute symptom;
- breathing or bracing failure where documented;
- planned duration completion.

---

# Exercise Family 6 — Loaded Carries

## Examples

Potentially:

```text
farmer carry
front rack carry
sandbag carry
zercher carry
suitcase carry
```

## Supported Methods

```text
distance_carry_sets
work_rest_intervals
```

## Supported Volume Structures

```text
sets_distance
intervals
```

## Supported Intensity Types

```text
absolute_load
percentage_body_mass
rpe
resistance_category
```

## Supported Loading Modes

```text
dumbbell
kettlebell
barbell
sandbag
plate
machine
```

Only relevant modes may be assigned per exercise.

## Supported Tempo Types

```text
global_intent
```

Formal phase timing is unsupported.

## Laterality

May be:

```text
bilateral
unilateral
asymmetrical
```

## Volume Interpretation

```text
total_distance
distance_per_side
load_per_hand
load_per_side
combined_external_load
```

## Required Stop Conditions

- loss of implement control;
- unsafe posture;
- grip failure;
- repeated balance loss;
- pain;
- planned distance completion.

---

# Exercise Family 7 — Grip Repetition Exercises

## Examples

Potentially:

```text
towel pull-up
plate pinch
rope pull
wrist or finger resistance exercise
```

## Supported Methods

```text
straight_sets_repetitions
timed_isometric_sets
work_rest_intervals
```

## Supported Volume Structures

```text
sets_reps
sets_duration
intervals
```

## Supported Intensity Types

```text
absolute_load
rpe
rir
resistance_category
technical_effort
```

## Supported Loading Modes

May include:

```text
bodyweight
plate
rope
cable
resistance_band
added_external_load
```

## Supported Tempo Types

```text
phase_timed
phase_intent
isometric_hold
global_intent
```

## Laterality

Exercise-specific.

## Required Stop Conditions

- grip failure;
- technical failure;
- equipment failure;
- pain;
- planned completion.

---

# Exercise Family 8 — Medicine-Ball Ballistics

## Examples

Potentially:

```text
medicine-ball chest pass
overhead throw
rotational throw
scoop toss
slam
shot-put throw
reverse throw
```

## Supported Methods

```text
power_repetition_sets
work_rest_intervals
```

## Supported Volume Structures

```text
sets_reps
intervals
```

## Supported Intensity Types

```text
movement_intent
velocity
absolute_load
resistance_category
impact_intent
technical_effort
```

## Supported Loading Modes

```text
medicine_ball
```

## Supported Tempo Types

```text
global_intent
```

## Laterality

May be:

```text
bilateral
unilateral
alternating
asymmetrical
```

## Volume Interpretation

```text
total_repetitions
repetitions_per_side
alternating_total_repetitions
combined_external_load
```

## Required Equipment Capabilities

- appropriate medicine ball;
- safe throwing area;
- safe target or wall where relevant;
- suitable floor;
- sufficient clearance.

## Required Stop Conditions

- loss of explosive intent;
- unsafe release;
- loss of balance;
- technical deterioration;
- equipment or environmental hazard;
- pain;
- planned completion.

---

# Exercise Family 9 — Jumps and Plyometrics

## Supported Methods

```text
power_repetition_sets
work_rest_intervals
```

## Supported Volume Structures

```text
sets_reps
intervals
```

## Supported Intensity Types

```text
movement_intent
velocity
technical_effort
impact_intent
rpe
```

## Supported Loading Modes

```text
bodyweight
added_external_load
locomotion_only
```

Added load must be explicitly permitted per exercise.

## Supported Tempo Types

```text
global_intent
```

## Laterality

Exercise-specific.

## Required Stop Conditions

- loss of landing quality;
- repeated balance loss;
- loss of explosive intent;
- pain;
- unsafe surface;
- impact-limit threshold where documented;
- planned completion.

---

# Exercise Family 10 — Sprints and Locomotion

## Supported Methods

```text
power_repetition_sets
work_rest_intervals
continuous_aerobic_duration
recovery_duration_work
```

The exact method set depends on the exercise.

## Supported Volume Structures

Potentially:

```text
sets_distance
intervals
continuous_duration
continuous_distance
```

## Supported Intensity Types

```text
pace
velocity
heart_rate
rpe
movement_intent
technical_effort
```

## Supported Loading Modes

```text
locomotion_only
sled
resistance_band
```

## Supported Tempo Types

```text
global_intent
```

## Laterality

Normally:

```text
not_applicable
```

## Required Stop Conditions

- pace or velocity loss;
- technical deterioration;
- pain;
- acute symptom;
- environmental hazard;
- planned completion.

---

# Exercise Family 11 — Ergometer Conditioning

## Examples

Potentially:

```text
bike
rower
ski ergometer
air bike
```

## Supported Methods

```text
work_rest_intervals
continuous_aerobic_duration
recovery_duration_work
```

## Supported Volume Structures

```text
intervals
continuous_duration
continuous_distance
```

## Supported Intensity Types

```text
heart_rate
pace
rpe
velocity
resistance_category
```

## Supported Loading Modes

```text
ergometer
machine
```

## Supported Tempo Types

```text
global_intent
```

## Laterality

```text
not_applicable
```

## Required Stop Conditions

- acute symptom;
- inability to maintain target pace;
- pain;
- equipment failure;
- planned completion.

---

# Exercise Family 12 — Combat Bag and Pad Work

## Examples

Potentially:

```text
heavy bag striking
speed bag
focus mitt work
kick shield work
technical shadowboxing
```

Only exercises already documented in the knowledge base may be prescribed.

## Supported Methods

```text
combat_rounds
work_rest_intervals
power_repetition_sets
```

## Supported Volume Structures

```text
rounds_duration
intervals
sets_reps
```

## Supported Intensity Types

```text
technical_effort
impact_intent
movement_intent
rpe
heart_rate
pace
velocity
```

## Supported Loading Modes

```text
impact_equipment
partner_resistance
locomotion_only
```

## Supported Tempo Types

```text
global_intent
```

Formal phase timing is unsupported.

## Laterality

May be:

```text
bilateral
unilateral
alternating
asymmetrical
not_applicable
```

## Volume Interpretation

```text
round_total
interval_total
total_repetitions
repetitions_per_side
alternating_total_repetitions
```

## Required Equipment Capabilities

Depending on exercise:

- heavy bag;
- secure bag mounting;
- pads or mitts;
- qualified partner where required;
- gloves;
- appropriate striking space;
- safe floor.

## Required Stop Conditions

- technical deterioration;
- unsafe alignment;
- pain;
- dizziness or acute symptom;
- equipment failure;
- impact-limit threshold;
- planned round or interval completion.

---

# Exercise Family 13 — Controlled Mobility Exercises

## Supported Methods

```text
controlled_mobility_sets
recovery_duration_work
```

## Supported Volume Structures

```text
sets_duration
continuous_duration
```

## Supported Intensity Types

```text
technical_effort
movement_intent
rpe
```

## Supported Loading Modes

```text
bodyweight
resistance_band
cable
partner_resistance
```

## Supported Tempo Types

```text
phase_timed
phase_intent
global_intent
mixed
```

## Laterality

Exercise-specific.

## Required Stop Conditions

- pain;
- loss of controlled range;
- compensatory movement;
- balance loss where relevant;
- planned completion.

---

# Exercise Family 14 — Recovery Exercises

## Supported Methods

```text
recovery_duration_work
continuous_aerobic_duration
controlled_mobility_sets
```

## Supported Volume Structures

```text
continuous_duration
sets_duration
```

## Supported Intensity Types

```text
rpe
heart_rate
technical_effort
movement_intent
```

## Supported Loading Modes

Exercise-specific, normally low demand.

## Supported Tempo Types

```text
global_intent
phase_intent
```

## Required Stop Conditions

- pain;
- acute symptom;
- intensity exceeding recovery target;
- planned completion.

---

# Exercise-Specific Overrides

An exercise-specific capability profile may be stricter than its family profile.

It may:

- remove supported methods;
- remove intensity types;
- restrict loading modes;
- require laterality;
- require specific equipment;
- require additional stop conditions;
- or forbid tempo.

An exercise-specific profile must not be broader than its validated evidence supports.

---

# Family Profiles Are Not Executable Alone

A family profile is a template.

It does not make every exercise in that family executable.

Each selected exercise must have:

- an explicit `exerciseId`;
- an explicit capability profile;
- source rule identifiers;
- and documented compatibility.

The engine must not classify an unknown exercise into a family dynamically from its name.

---

# Equipment Capability Validation

The engine must verify all required equipment capabilities.

Examples include:

- exact loading increment;
- safety rack;
- bench;
- stable anchor;
- safe throwing wall;
- suitable floor;
- enough carry distance;
- bag attachment;
- heart-rate monitor;
- velocity sensor;
- ergometer display.

A generic equipment label may be insufficient when the method requires a specific capability.

---

# Athlete Reference Validation

Capabilities may require athlete references.

Examples:

```text
percentage_1rm → one_rep_max
percentage_training_max → training_max
percentage_body_mass → body_mass
heart_rate → max_heart_rate or another documented reference
velocity → baseline_velocity when required
pace → baseline_pace when required
```

If the required reference is missing, the engine must use a documented alternative or fail safely.

---

# Laterality Validation

Every unilateral, alternating or asymmetrical exercise must define:

- laterality;
- volume interpretation;
- display requirement;
- duration-estimation effect;
- loading interpretation;
- side-switch rule where required;
- and stop-condition implications.

Unresolved laterality invalidates the prescription.

---

# Load Interpretation Validation

The engine must distinguish between:

- load per hand;
- load per side;
- combined external load;
- added external load;
- total system load;
- assistance level;
- and equipment resistance category.

A single ambiguous `loadKg` field is insufficient.

---

# Tempo Capability Validation

An exercise may support:

- phase timing;
- isometric hold;
- phase intent;
- global intent;
- mixed tempo;
- or no tempo.

The engine must not assign phase timing to exercises that support only global intent.

---

# Measured Versus Intended Output

The capability profile must distinguish:

- measurable velocity;
- intended movement speed;
- measurable pace;
- subjective technical effort;
- measurable heart rate;
- qualitative impact intent.

The engine must not substitute a subjective intent for a required measured metric unless a documented fallback exists.

---

# Required Instructions

Capability profiles may require instruction identifiers such as:

- setup;
- breathing;
- bracing;
- grip;
- laterality;
- landing;
- release;
- striking alignment;
- equipment use;
- or environmental setup.

The prescription engine must resolve these instructions from documented sources.

---

# Required Stop Conditions

Every capability profile must list mandatory stop conditions.

Exercise-level conditions are inherited into the final prescription.

They may be supplemented by:

- method conditions;
- module conditions;
- intensity conditions;
- medical conditions;
- readiness conditions;
- and environmental conditions.

They must not be weakened by lower-priority rules.

---

# Duration Estimation Profile

Each exercise must reference a duration-estimation profile.

The profile may define:

- setup time;
- repetition-duration model;
- side-switch time;
- equipment-change time;
- walking return time;
- throw retrieval time;
- round transition time;
- or another documented overhead.

Without a duration-estimation profile, the exercise cannot participate in deterministic session-duration validation.

---

# Substitution Capability Tags

Capability tags may support substitution matching.

Potential tags include:

```text
bilateral_lower_strength
unilateral_lower_strength
horizontal_push
vertical_push
horizontal_pull
vertical_pull
hinge
squat
carry
rotation
anti_rotation
anti_extension
grip_support
grip_crush
grip_pinch
ballistic_push
ballistic_rotation
combat_striking
aerobic_cyclical
mobility_hip
mobility_shoulder
```

Only documented tags may be implemented.

The substitution engine must still respect all upstream eligibility and scoring rules.

---

# Capability Failure Codes

The implementation should use finite failure codes.

Initial categories may include:

```text
EXERCISE_CAPABILITIES_MISSING
EXERCISE_CAPABILITIES_UNSUPPORTED
EXERCISE_METHOD_UNSUPPORTED
EXERCISE_VOLUME_STRUCTURE_UNSUPPORTED
EXERCISE_INTENSITY_TYPE_UNSUPPORTED
EXERCISE_LOADING_MODE_UNSUPPORTED
EXERCISE_TEMPO_UNSUPPORTED
EXERCISE_LATERALITY_UNRESOLVED
EXERCISE_VOLUME_INTERPRETATION_UNRESOLVED
EXERCISE_UNIT_UNSUPPORTED
EXERCISE_EQUIPMENT_CAPABILITY_MISSING
EXERCISE_ATHLETE_REFERENCE_MISSING
EXERCISE_INSTRUCTION_SOURCE_MISSING
EXERCISE_STOP_CONDITION_MISSING
EXERCISE_DURATION_PROFILE_MISSING
EXERCISE_RULE_SOURCE_MISSING
```

---

# Safe Failure

Exercise capability resolution must fail safely when:

- no capability profile exists;
- the required method is unsupported;
- the required volume structure is unsupported;
- required intensity is unsupported;
- required loading mode is unavailable;
- tempo is required but unsupported;
- laterality is unresolved;
- required equipment is absent;
- a required athlete reference is missing;
- required instructions are unavailable;
- required stop conditions are unavailable;
- or duration estimation cannot be resolved.

The engine must not create missing capabilities dynamically.

---

# Decision Trace Integration

The Decision Trace must record:

- capability profile identifier;
- capability version;
- supported methods;
- selected method compatibility;
- volume compatibility;
- intensity compatibility;
- loading compatibility;
- tempo compatibility;
- laterality resolution;
- equipment checks;
- athlete-reference checks;
- required instructions;
- required stop conditions;
- duration-profile resolution;
- rejected capability paths;
- and final compatibility outcome.

---

# Determinism

Given identical:

- exercise definition;
- method;
- module;
- Exercise Role;
- equipment;
- athlete references;
- rule version;
- and knowledge-base version,

capability validation must produce the same result.

---

# Implementation Boundary

This document defines exercise-level capability requirements.

It does not yet define exact prescription values.

CAS still requires:

```text
34_NUMERICAL_PRESCRIPTION_TABLES.md
35_PRESCRIPTION_ADJUSTMENT_RULES.md
```

before numerical prescription implementation.

---

# Acceptance Criteria

The Exercise Prescription Capabilities V0.1 are valid only if:

- every prescribable exercise has an explicit capability profile;
- supported methods are finite;
- volume structures are explicit;
- intensity types are explicit;
- loading modes are explicit;
- tempo capabilities are explicit;
- laterality is explicit;
- volume interpretation is unambiguous;
- equipment capabilities are validated;
- athlete-reference requirements are explicit;
- instructions are traceable;
- stop conditions are inherited;
- duration estimation is possible;
- unsupported combinations fail safely;
- and identical inputs produce identical compatibility outcomes.

---

# Final Principle

> CAS may prescribe an exercise only through capabilities that are explicitly documented for that exact exercise.

Familiarity is not evidence, and plausibility is not compatibility.