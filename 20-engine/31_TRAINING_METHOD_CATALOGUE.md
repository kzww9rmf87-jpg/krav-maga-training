# TRAINING METHOD CATALOGUE

Version 0.1

---

# Purpose

The Training Method Catalogue defines the finite set of training methods that the Combat Athlete System may use when generating exercise prescriptions.

Its purpose is to ensure that every method used by the prescription engine is:

- explicitly named;
- structurally defined;
- linked to one or more Capability Modules;
- compatible with specific Exercise Roles;
- compatible with specific prescription structures;
- bounded by documented volume, intensity, rest and tempo rules;
- associated with explicit stop-condition requirements;
- deterministic;
- traceable;
- and safe to implement.

The catalogue does not authorize the engine to use every known training method.

CAS V0.1 must support only methods that are fully documented and testable.

---

# Core Principle

> A Training Method is an executable adaptation strategy, not a generic workout label.

A method defines how work is organized.

It does not merely describe the exercise.

The same exercise may use different methods depending on:

- the Capability Module;
- the session objective;
- the Exercise Role;
- the athlete context;
- the combat schedule;
- and the intended adaptation.

The engine must never infer a method from the exercise name alone.

---

# Scope

This catalogue defines:

- method identifiers;
- method families;
- supported volume structures;
- supported Capability Modules;
- supported Exercise Roles;
- required prescription fields;
- forbidden prescription fields;
- allowed intensity types;
- rest policy;
- tempo policy;
- stop-condition policy;
- minimum implementation requirements;
- compatibility requirements;
- and safe-failure behaviour.

This catalogue does not yet define every numerical target.

Exact values belong in later numerical prescription tables.

---

# Method Contract

Every method must satisfy a contract equivalent to:

```ts
interface TrainingMethodDefinition {
  methodId: string;
  name: string;
  family: TrainingMethodFamily;
  version: string;

  supportedModules: CapabilityModuleId[];
  supportedRoles: ExerciseRole[];

  volumeStructure: VolumeStructure;

  requiredVolumeFields: PrescriptionField[];
  optionalVolumeFields: PrescriptionField[];
  forbiddenVolumeFields: PrescriptionField[];

  allowedIntensityTypes: IntensityType[];
  requiredIntensityTypes: IntensityType[];

  restPolicy: MethodRestPolicy;
  tempoPolicy: TempoPolicy;
  stopConditionPolicy: StopConditionPolicy;

  minimumDoseRuleId: string;
  maximumDoseRuleId: string | null;

  requiredExerciseCapabilities: string[];
  sourceRuleIds: string[];

  status: MethodStatus;
}
```

The exact TypeScript structure may evolve, but every method must expose equivalent information.

---

# Method Status

A method may use:

```ts
type MethodStatus =
  | "documented"
  | "implemented"
  | "experimental"
  | "deprecated"
  | "unsupported";
```

CAS V0.1 may execute only methods with status:

```text
documented
implemented
```

A documented method may be present before code implementation.

An experimental or unsupported method must never reach executable output.

---

# Initial Method Families

The initial CAS method-family vocabulary is:

```ts
type TrainingMethodFamily =
  | "repetition_sets"
  | "timed_sets"
  | "distance_sets"
  | "power_sets"
  | "combat_rounds"
  | "intervals"
  | "continuous_work"
  | "mobility_control"
  | "recovery_work";
```

Additional families require a versioned catalogue update.

---

# Initial CAS V0.1 Method Set

The first prescription implementation should support the following finite method set:

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

These methods form the minimum representative set required to cover:

- strength;
- hypertrophy-oriented repetition work;
- isometric core or robustness work;
- carries;
- ballistic power;
- combat-specific rounds;
- conditioning intervals;
- aerobic work;
- mobility;
- and recovery.

---

# Method 1 — Straight Sets Repetitions

## Identifier

```text
straight_sets_repetitions
```

## Purpose

Organize an exercise into repeated discrete sets containing a prescribed number or range of repetitions.

## Family

```text
repetition_sets
```

## Volume Structure

```text
sets_reps
```

## Supported Modules

Potentially supported modules include:

```text
strength
functional_hypertrophy
robustness
grip
core
movement
```

A module may use this method only when a later module profile explicitly authorizes it.

## Supported Roles

```text
primary
secondary
accessory
robustness
corrective
```

## Required Volume Fields

```text
sets
repetitions
```

## Forbidden Volume Fields

```text
rounds
workIntervals
continuousDuration
continuousDistance
```

Duration or distance may be added only when a later documented compound rule explicitly permits it.

## Allowed Intensity Types

Potentially:

```text
absolute_load
percentage_1rm
percentage_training_max
percentage_body_mass
rpe
rir
assistance_level
resistance_category
technical_effort
```

The module and numerical profile determine which type is valid.

## Rest Policy

Rest is normally required between sets.

The exact rest type and value must be defined by the numerical profile.

## Tempo Policy

```text
optional
```

Tempo may become required for a specific module-method profile.

## Stop-Condition Policy

```text
required
```

At minimum, the profile must define:

- planned completion;
- technical failure;
- pain or acute symptom;
- and intensity-limit behaviour where relevant.

---

# Method 2 — Timed Isometric Sets

## Identifier

```text
timed_isometric_sets
```

## Purpose

Organize an isometric exercise into repeated timed holds.

## Family

```text
timed_sets
```

## Volume Structure

```text
sets_duration
```

## Supported Modules

Potentially:

```text
core
robustness
grip
movement
recovery
```

## Supported Roles

```text
secondary
accessory
robustness
corrective
recovery
```

## Required Volume Fields

```text
sets
duration
```

## Forbidden Volume Fields

```text
repetitions
distance
rounds
workIntervals
```

## Allowed Intensity Types

Potentially:

```text
rpe
technical_effort
resistance_category
absolute_load
percentage_body_mass
```

## Rest Policy

Rest between sets is normally required unless a profile explicitly defines continuous alternating execution.

## Tempo Policy

```text
required
```

The hold structure must be explicit.

## Stop-Condition Policy

```text
required
```

At minimum:

- loss of required position;
- pain;
- acute symptom;
- grip or postural failure where relevant;
- planned duration completion.

---

# Method 3 — Distance Carry Sets

## Identifier

```text
distance_carry_sets
```

## Purpose

Organize loaded or resisted carries into repeated distance-based efforts.

## Family

```text
distance_sets
```

## Volume Structure

```text
sets_distance
```

## Supported Modules

Potentially:

```text
grip
core
strength
robustness
conditioning
```

## Supported Roles

```text
primary
secondary
accessory
conditioning
robustness
```

## Required Volume Fields

```text
sets
distance
```

## Required Additional Fields

```text
laterality when applicable
loading mode
rest between sets
```

## Allowed Intensity Types

Potentially:

```text
absolute_load
percentage_body_mass
rpe
resistance_category
```

## Rest Policy

Rest between sets is required.

## Tempo Policy

```text
forbidden
```

A global execution intent or posture instruction may be used instead.

## Stop-Condition Policy

```text
required
```

At minimum:

- loss of implement control;
- unsafe posture;
- repeated balance loss;
- grip failure;
- pain;
- planned distance completion.

---

# Method 4 — Power Repetition Sets

## Identifier

```text
power_repetition_sets
```

## Purpose

Organize explosive repetitions into low-fatigue sets where movement quality and acceleration remain primary.

## Family

```text
power_sets
```

## Volume Structure

```text
sets_reps
```

## Supported Modules

Potentially:

```text
power
preparation
movement
```

## Supported Roles

```text
primary
primer
contrast
secondary
technical
```

## Required Volume Fields

```text
sets
repetitions
```

## Allowed Intensity Types

Potentially:

```text
movement_intent
velocity
absolute_load
percentage_1rm
percentage_body_mass
resistance_category
impact_intent
technical_effort
```

## Rest Policy

Rest is required and must preserve explosive quality.

## Tempo Policy

```text
required
```

Tempo must normally be represented through global explosive or maximal-acceleration intent rather than slow phase timing.

## Stop-Condition Policy

```text
required
```

At minimum:

- loss of explosive intent;
- velocity-loss threshold when measured;
- technical deterioration;
- unsafe landing or implement control;
- pain;
- planned repetition completion.

---

# Method 5 — Combat Rounds

## Identifier

```text
combat_rounds
```

## Purpose

Organize combat-specific technical or conditioning work into repeated rounds.

## Family

```text
combat_rounds
```

## Volume Structure

```text
rounds_duration
```

## Supported Modules

Potentially:

```text
specific_skill
conditioning
power
movement
```

The exact module vocabulary must follow the current CAS module identifiers.

## Supported Roles

```text
technical
conditioning
primary
secondary
```

## Required Volume Fields

```text
rounds
duration
```

## Required Additional Fields

```text
rest between rounds
technical or effort instruction
stop conditions
```

## Allowed Intensity Types

Potentially:

```text
technical_effort
impact_intent
rpe
heart_rate
movement_intent
pace
```

## Rest Policy

Rest between rounds is required.

## Tempo Policy

```text
forbidden
```

Movement rhythm or technical intent belongs in structured instructions or intensity metrics.

## Stop-Condition Policy

```text
required
```

At minimum:

- planned round completion;
- technical deterioration;
- loss of safe striking or movement alignment;
- pain;
- dizziness or acute symptom;
- equipment failure;
- impact-limit rule where applicable.

---

# Method 6 — Work-Rest Intervals

## Identifier

```text
work_rest_intervals
```

## Purpose

Organize repeated work periods separated by prescribed recovery periods.

## Family

```text
intervals
```

## Volume Structure

```text
intervals
```

## Supported Modules

Potentially:

```text
conditioning
power
grip
specific_skill
```

## Supported Roles

```text
conditioning
secondary
accessory
technical
```

## Required Volume Fields

```text
workIntervals
duration or distance per interval
```

## Required Additional Fields

```text
rest between intervals
intensity or pace when required
stop conditions
```

## Allowed Intensity Types

Potentially:

```text
rpe
heart_rate
pace
velocity
technical_effort
impact_intent
movement_intent
resistance_category
```

## Rest Policy

Rest between intervals is required.

## Tempo Policy

```text
forbidden
```

unless a specific interval exercise requires phase timing and a later profile explicitly permits it.

## Stop-Condition Policy

```text
required
```

At minimum:

- planned interval completion;
- pace or power loss where applicable;
- technical deterioration;
- acute symptom;
- pain;
- inability to meet the documented work target.

---

# Method 7 — Continuous Aerobic Duration

## Identifier

```text
continuous_aerobic_duration
```

## Purpose

Organize uninterrupted cyclical work for a prescribed total duration.

## Family

```text
continuous_work
```

## Volume Structure

```text
continuous_duration
```

## Supported Modules

Potentially:

```text
conditioning
recovery
preparation
```

## Supported Roles

```text
conditioning
recovery
secondary
```

## Required Volume Fields

```text
duration
```

## Forbidden Volume Fields

```text
sets
repetitions
rounds
workIntervals
distance unless used only as recorded output
```

## Allowed Intensity Types

Potentially:

```text
heart_rate
pace
rpe
technical_effort
```

## Rest Policy

```text
not_applicable
```

Formal intra-exercise rest is absent.

## Tempo Policy

```text
forbidden
```

## Stop-Condition Policy

```text
required
```

At minimum:

- planned duration completion;
- inability to maintain target intensity;
- pain;
- dizziness or acute symptom;
- unsafe environmental condition.

---

# Method 8 — Controlled Mobility Sets

## Identifier

```text
controlled_mobility_sets
```

## Purpose

Organize controlled mobility or movement-quality work into repeated timed or repetition-based sets.

## Family

```text
mobility_control
```

## Primary Volume Structure

```text
sets_duration
```

A repetition-based variant may be introduced later as a separate method if needed.

## Supported Modules

Potentially:

```text
movement
preparation
recovery
robustness
```

## Supported Roles

```text
primer
corrective
recovery
technical
accessory
```

## Required Volume Fields

```text
sets
duration
```

## Allowed Intensity Types

Potentially:

```text
technical_effort
movement_intent
rpe
```

## Rest Policy

Rest may be optional or minimal according to the numerical profile.

## Tempo Policy

```text
required
```

The method must define controlled execution or technical precision.

## Stop-Condition Policy

```text
required
```

At minimum:

- pain;
- loss of controlled range;
- compensatory movement beyond the documented threshold;
- planned duration completion.

---

# Method 9 — Recovery Duration Work

## Identifier

```text
recovery_duration_work
```

## Purpose

Organize low-demand recovery work for a prescribed total duration.

## Family

```text
recovery_work
```

## Volume Structure

```text
continuous_duration
```

## Supported Modules

```text
recovery
```

Potentially also:

```text
preparation
movement
```

when explicitly authorized.

## Supported Roles

```text
recovery
corrective
```

## Required Volume Fields

```text
duration
```

## Allowed Intensity Types

Potentially:

```text
rpe
heart_rate
technical_effort
movement_intent
```

Only low-demand documented targets may be permitted.

## Rest Policy

```text
not_applicable
```

## Tempo Policy

```text
optional
```

## Stop-Condition Policy

```text
required
```

At minimum:

- pain;
- acute symptom;
- inability to maintain recovery intensity;
- planned duration completion.

---

# Unsupported Methods

CAS V0.1 must not generate methods that are absent from this catalogue.

Unsupported examples may include:

- drop sets;
- rest-pause;
- forced repetitions;
- undulating density blocks;
- complex contrast sequences;
- wave loading;
- accommodating resistance;
- blood-flow restriction;
- advanced plyometric shock methods;
- sport-specific reactive methods;
- or any other undocumented method.

Their exclusion does not imply that they are ineffective.

It means they are not yet validated for deterministic CAS prescription.

---

# Method Selection Rules

The method-selection hierarchy is:

```text
Explicit validated upstream method
→ Module-required method
→ Module-and-role profile
→ Documented default method
→ Safe failure
```

The engine must not select a method solely because it is compatible with the exercise.

---

# One Method per Prescription

Each exercise prescription must have one primary `methodId`.

If work requires multiple distinct methods, it must be represented as:

- multiple exercise prescription instances;
- multiple blocks;
- or a future documented compound method.

The engine must not merge incompatible methods into one ambiguous prescription.

---

# Method and Module Compatibility

A method may be used only when a later Module Prescription Profile explicitly maps:

```text
moduleId
→ methodId
→ allowed Exercise Roles
```

The broad potential module lists in this catalogue do not independently authorize execution.

They define the possible design space.

---

# Method and Exercise Compatibility

An exercise is compatible with a method only when its Exercise Prescription Capabilities support:

- the required volume structure;
- the required intensity type;
- the tempo policy;
- the loading mode;
- laterality handling;
- and mandatory stop conditions.

Partial compatibility is insufficient.

---

# Method and Role Compatibility

The Exercise Role must belong to the method’s supported-role set.

If the same exercise is assigned a different role, another method or numerical profile may be required.

---

# Minimum Dose

Every method must reference a documented minimum-dose rule.

The minimum dose must define the smallest prescription that remains valid for the intended adaptation.

The engine must not reduce a method below its minimum dose to fit session duration.

---

# Maximum Dose

A maximum-dose rule is required when excessive work would create a predictable validation risk.

The maximum may constrain:

- sets;
- repetitions;
- duration;
- distance;
- rounds;
- intervals;
- intensity;
- density;
- or total exposure.

---

# Rest Policy Vocabulary

A method rest policy may use:

```ts
type MethodRestPolicy =
  | "required"
  | "optional"
  | "forbidden"
  | "not_applicable";
```

A required rest policy must later reference numerical rest rules.

---

# Stop-Condition Policy Vocabulary

A method stop-condition policy may use:

```ts
type StopConditionPolicy =
  | "required"
  | "conditional"
  | "optional";
```

A method with `required` policy must identify the categories required by its numerical or method profile.

---

# Method Failure Codes

The implementation should use finite method failure codes.

Initial categories may include:

```text
METHOD_ID_MISSING
METHOD_UNKNOWN
METHOD_UNSUPPORTED
METHOD_NOT_IMPLEMENTED
METHOD_MODULE_INCOMPATIBLE
METHOD_ROLE_INCOMPATIBLE
METHOD_EXERCISE_INCOMPATIBLE
METHOD_VOLUME_STRUCTURE_INCOMPATIBLE
METHOD_INTENSITY_UNRESOLVED
METHOD_REST_POLICY_UNRESOLVED
METHOD_TEMPO_POLICY_UNRESOLVED
METHOD_STOP_POLICY_UNRESOLVED
METHOD_MINIMUM_DOSE_MISSING
METHOD_RULE_SOURCE_MISSING
```

---

# Safe Failure

Method resolution must fail safely when:

- no method is mapped to the module;
- multiple methods exist without a deterministic resolution rule;
- the Exercise Role is unsupported;
- the exercise is incompatible;
- required prescription fields cannot be resolved;
- the minimum-dose rule is absent;
- or the method is not implemented.

The engine must not replace an unknown method with a familiar method.

---

# Decision Trace Integration

The Decision Trace must record:

- candidate methods;
- rejected methods;
- rejection reasons;
- selected method;
- selection hierarchy level;
- module compatibility;
- role compatibility;
- exercise compatibility;
- source rule identifiers;
- and final method status.

---

# Determinism

Given identical:

- validated input;
- module;
- Exercise Role;
- exercise;
- rule version;
- and knowledge-base version,

method resolution must return the same result.

Random method selection is forbidden.

---

# Versioning

Each method must include a version.

Any change to:

- required fields;
- supported modules;
- supported roles;
- intensity compatibility;
- rest policy;
- tempo policy;
- stop-condition policy;
- minimum dose;
- or maximum dose

requires a documented version update and test review.

---

# Implementation Boundary

This catalogue defines the initial finite method vocabulary.

It does not yet provide enough information to generate numerical prescriptions.

Before implementation, CAS still requires:

```text
32_MODULE_PRESCRIPTION_PROFILES.md
33_EXERCISE_PRESCRIPTION_CAPABILITIES.md
34_NUMERICAL_PRESCRIPTION_TABLES.md
35_PRESCRIPTION_ADJUSTMENT_RULES.md
```

---

# Acceptance Criteria

The Training Method Catalogue V0.1 is valid only if:

- every method has a unique identifier;
- every method has one primary volume structure;
- supported modules are explicit;
- supported Exercise Roles are explicit;
- required and forbidden fields are explicit;
- allowed intensity types are finite;
- rest policy is explicit;
- tempo policy is explicit;
- stop-condition policy is explicit;
- unsupported methods fail safely;
- method selection is deterministic;
- every method references documented source rules;
- and numerical implementation remains blocked until complete profiles exist.

---

# Final Principle

> CAS must implement a small number of complete methods before attempting to support a large number of incomplete methods.

A Training Method becomes executable only when its structure, numerical profile, compatibility rules, adjustments and stop conditions are all documented and tested.