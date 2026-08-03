# MODULE PRESCRIPTION PROFILES

Version 0.1

---

# Purpose

The Module Prescription Profiles define how each Combat Athlete System Capability Module may use the Training Methods documented in the Training Method Catalogue.

Their purpose is to establish deterministic mappings between:

- Capability Module;
- allowed Training Methods;
- allowed Exercise Roles;
- prescription priorities;
- required prescription dimensions;
- minimum valid dose;
- maximum valid dose;
- required intensity families;
- rest policy;
- tempo policy;
- stop-condition requirements;
- duration-reduction priority;
- and safe-failure behaviour.

The profiles do not yet define every exact numerical value.

Exact sets, repetitions, durations, distances, rounds, intensity targets, rest periods and tempo values belong in the Numerical Prescription Tables.

---

# Core Principle

> A Training Method becomes executable only when a Capability Module explicitly authorizes it.

The Training Method Catalogue defines what methods exist.

The Module Prescription Profiles define where those methods may be used.

A method being structurally compatible with an exercise does not mean that it is appropriate for every module.

The module remains the primary adaptation driver.

---

# Scope

The Module Prescription Profiles govern:

- module-method compatibility;
- role-method compatibility;
- module prescription priorities;
- required prescription structures;
- allowed intensity families;
- minimum-dose requirements;
- maximum-dose constraints;
- rest and tempo expectations;
- stop-condition categories;
- duration-reduction order;
- and module-level safe failure.

The profiles do not define exercise-level capabilities.

Those belong in:

```text
33_EXERCISE_PRESCRIPTION_CAPABILITIES.md
```

---

# Canonical Module Profile Structure

A module profile should use a structure equivalent to:

```ts
interface ModulePrescriptionProfile {
  moduleId: CapabilityModuleId;
  version: string;

  primaryObjective: string;

  allowedMethods: ModuleMethodRule[];
  forbiddenMethods: string[];

  allowedRoles: ExerciseRole[];
  requiredRoles: ExerciseRole[];

  requiredPrescriptionDimensions: string[];
  optionalPrescriptionDimensions: string[];

  allowedIntensityTypes: IntensityType[];
  preferredIntensityTypes: IntensityType[];

  restPolicy: ModuleRestPolicy;
  tempoPolicy: TempoPolicy;
  stopConditionCategories: StopConditionCategory[];

  minimumDoseRuleId: string;
  maximumDoseRuleId: string | null;

  durationReductionPriority: ExerciseRole[];
  substitutionPolicy: ModuleSubstitutionPolicy;

  sourceRuleIds: string[];
}
```

The exact implementation may evolve, but equivalent information must exist.

---

# Module Method Rule

Each module-method relationship must define:

```ts
interface ModuleMethodRule {
  methodId: string;
  allowedRoles: ExerciseRole[];
  priority: number;
  required: boolean;
  conditions: string[];
  sourceRuleIds: string[];
}
```

Lower numerical priority values represent stronger preference only if the implementation explicitly defines that convention.

The selection rule must remain deterministic.

---

# Module Vocabulary

The current CAS V0.1 module vocabulary includes:

```text
preparation
movement
power
strength
functional_hypertrophy
robustness
grip
core
conditioning
recovery
```

If the existing engine uses a different exact identifier, the existing identifier remains authoritative.

No new module identifier may be introduced silently.

---

# Global Module Rules

Every module profile must define:

- at least one allowed method;
- at least one allowed Exercise Role;
- one minimum-dose rule;
- one stop-condition policy;
- one duration-reduction hierarchy;
- and at least one source rule.

A module without a complete profile is not prescribable.

---

# Module 1 — Preparation

## Identifier

```text
preparation
```

## Primary Objective

Prepare the athlete physically and neurologically for the main session while minimizing unnecessary fatigue.

## Allowed Methods

```text
controlled_mobility_sets
power_repetition_sets
recovery_duration_work
```

## Preferred Method Order

```text
controlled_mobility_sets
→ power_repetition_sets
→ recovery_duration_work
```

The actual method depends on the preparation objective.

## Allowed Roles

```text
primer
technical
corrective
recovery
```

## Required Roles

At least one of:

```text
primer
technical
```

when the module is selected for active preparation.

## Required Prescription Dimensions

Depending on method:

- sets and duration;
- or sets and repetitions;
- technical intent;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
technical_effort
movement_intent
rpe
heart_rate
```

## Preferred Intensity Types

```text
technical_effort
movement_intent
```

## Rest Policy

Rest must preserve readiness and must not create fatigue.

## Tempo Policy

Tempo or movement intent is normally required.

## Stop-Condition Categories

```text
pain
acute_symptom
technical_failure
range_of_motion_loss
balance_loss
completion
time_limit
```

## Duration Reduction Priority

```text
recovery
→ corrective
→ technical
→ primer
```

Primer work may be reduced only if the minimum preparation effect remains valid.

---

# Module 2 — Movement

## Identifier

```text
movement
```

## Primary Objective

Improve movement quality, control, coordination, mobility and transferable movement capacity.

## Allowed Methods

```text
controlled_mobility_sets
straight_sets_repetitions
power_repetition_sets
recovery_duration_work
timed_isometric_sets
partner_grappling_rounds
```

## Preferred Method Order

```text
controlled_mobility_sets
→ straight_sets_repetitions
→ power_repetition_sets
→ recovery_duration_work
→ timed_isometric_sets
→ partner_grappling_rounds
```

`partner_grappling_rounds` is last on purpose. Resisted partner work is the most specialized and most fatiguing way this module can be prescribed, and it must never be selected ahead of controlled mobility or repetition work when both are authorized.

## Forbidden Methods

```text
distance_carry_sets
combat_rounds
work_rest_intervals
continuous_aerobic_duration
```

`combat_rounds` remains forbidden. `partner_grappling_rounds` exists so that this prohibition does not have to move: striking rounds stay unreachable from this module.

## Allowed Roles

```text
technical
corrective
primer
secondary
accessory
recovery
```

## Required Prescription Dimensions

- explicit structure;
- technical intent;
- laterality where applicable;
- tempo when required;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
technical_effort
movement_intent
rpe
resistance_category
```

## Preferred Intensity Types

```text
technical_effort
movement_intent
```

## Rest Policy

Rest is method-dependent and must preserve movement quality.

## Tempo Policy

Tempo is normally required for controlled methods and global intent is required for explosive methods.

## Stop-Condition Categories

```text
pain
technical_failure
range_of_motion_loss
balance_loss
coordination_loss
completion
```

## Duration Reduction Priority

```text
recovery
→ accessory
→ corrective
→ secondary
→ technical
→ primer
```

---

## Partner Grappling Rounds

This section is a module rule, not an exercise description. It states how CAS prescribes resisted standing grappling, generically, for any exercise that qualifies. It is written from the shared structure of a documented family and must not be read as a description of any single drill.

### Objective

Develop positional control, tactile decision-making and technical efficiency against a resisting human opponent, organized in rounds, without prescribing a strike.

The adaptation is technical and neuromotor first. Conditioning is a documented consequence in some members of the family, never the reason this method is selected.

### Partner Is Mandatory

The work does not exist without a second person. A training partner is required, and the requirement is structural rather than per-exercise: it is declared on the method contract (`partner_resistance`), so every exercise using this method inherits it and none can waive it.

The knowledge base's own `human_assistance: partner` requirement governs whether an exercise is ELIGIBLE at all. These are two gates on two layers and both apply; neither replaces the other.

### Admissible Exercises

An exercise may use this rule when its own chapter documents all of the following:

- a standing partner drill with continuous engagement;
- resistance supplied by the partner rather than by an implement;
- a volume expressed as rounds × duration;
- a technical standard the work must preserve.

### Excluded Exercises

- anything prescribing a strike, a throw to the ground or an impact target — those belong to `combat_rounds` and to a sport-specific subtype;
- ground grappling, which no chapter in this family documents and whose safety and stop conditions differ;
- unresisted technical drills, which are movement work in sets, not rounds;
- work requiring impact equipment;
- work whose volume is documented in sets, repetitions or distance rather than rounds.

### Structure

```text
rounds × duration per round
```

Rounds and round duration are both required. Sets, repetitions, distance and intervals are forbidden, and so is laterality: a clinch exchange is not allocated per side.

### Controlled Resistance

Resistance is the defining variable of this method and CAS does not dose it.

Exercise chapters in this family describe resistance as a PROGRESSION axis — the thing that increases as the athlete advances — and none of them defines resistance levels. Converting a progression axis into a prescribed value would invent a scale the library does not have.

CAS therefore prescribes the technical standard the exchange must preserve, and treats resistance that exceeds the level the drill is being run at as a reason to end the round, not as a number in the prescription. A future `resistance_category` scale may change this; until one is documented generically, none is used.

### Intensity

```text
technical_effort
```

RPE and RIR are permitted by the module but must not be supplied unless an exercise chapter documents one. No chapter in this family does.

`movement_intent` is permitted but must not be used generically: members of this family disagree about velocity, some documenting explosive action and others prioritizing quality over speed.

### Rest Between Rounds

```text
60–180 seconds
```

Normal:

```text
120 seconds
```

```text
ruleId: MOVEMENT_PARTNER_GRAPPLING_REST_V0_1
```

**This band is an engineering decision made here, and it is stated as one.** No exercise chapter in this family documents inter-round rest — their only time values are round duration and inter-session recovery. The band must never be attributed to an exercise chapter, and it is not copied from Table Group 9, whose striking band is different and whose own rule forbids reusing one ratio across sports.

The decision and its reasoning:

- rest exists to restore TECHNICAL quality and grip, not to reach full metabolic recovery — every chapter in this family names sustained technical quality as its success criterion;
- the floor is 60 seconds, because below one minute a pair cannot reset grips and position, and the round boundary becomes nominal: the work would be continuous, which is a different structure and a different method;
- the ceiling is 180 seconds, because beyond three minutes the tactile and positional adaptation that justifies the drill decays and the session becomes intermittent conditioning;
- the normal value follows the Integer Resolution convention of `34_NUMERICAL_PRESCRIPTION_TABLES.md`.

An exercise chapter that does document its own inter-round rest overrides this band by narrowing, exactly as any other exercise-specific constraint does.

### Tempo

Tempo is forbidden.

The rhythm of a resisted exchange is set by the opponent, not by the athlete. A tempo prescription would describe something the athlete cannot control.

### Permitted Contact

Contact is continuous, controlled and non-striking: grips, clinch, pressure and positional control.

Striking, submission to failure and takedowns finished on the ground are outside this rule. An exercise documenting them needs a different method and its own safety analysis.

### Safety

- both athletes must know the drill's objective and its agreed level of resistance before the round starts;
- either athlete may end the round at any moment, for any reason, without justifying it;
- a documented contraindication in either athlete removes the exercise; it is never scaled down to fit;
- resistance is agreed before the round, not negotiated during it.

### Stop Conditions

Required categories:

```text
technical_failure
coordination_loss
balance_loss
intensity_limit
pain
acute_symptom
manual_termination
completion
```

`intensity_limit` carries excessive partner resistance. `manual_termination` carries a stop requested by either athlete — a signal no other category expresses, because it names no cause and the engine must not infer one.

`impact_limit` and `equipment_failure` must not be declared: this rule prescribes no impact and requires no implement.

`range_of_motion_loss` is not required generically — no chapter in this family documents a range-of-motion concern — but an exercise whose own chapter documents one may declare it.

### Limits of Use

- never for a drill without a resisting partner;
- never to prescribe a number for partner resistance;
- never as a substitute for sport-specific round structures, which belong to `combat_rounds` and require a sport subtype;
- never to accumulate rounds once technical quality has stopped being maintained — the technical standard is the governing constraint, not the round count.

---

# Module 3 — Power

## Identifier

```text
power
```

## Primary Objective

Develop rapid force expression, acceleration, ballistic output and combat-relevant explosiveness while preserving high movement quality.

## Allowed Methods

```text
power_repetition_sets
combat_rounds
work_rest_intervals
```

## Preferred Method Order

```text
power_repetition_sets
→ combat_rounds
→ work_rest_intervals
```

## Allowed Roles

```text
primary
primer
contrast
technical
secondary
```

## Required Roles

At least one:

```text
primary
primer
contrast
```

when power is the primary session objective.

## Required Prescription Dimensions

- sets and repetitions, rounds and duration, or intervals;
- explosive intent;
- quality-preserving rest;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
movement_intent
velocity
absolute_load
percentage_1rm
percentage_body_mass
resistance_category
impact_intent
technical_effort
rpe
```

## Preferred Intensity Types

```text
movement_intent
velocity
impact_intent
```

## Rest Policy

Rest is required and must preserve output quality.

## Tempo Policy

Global explosive or maximal-acceleration intent is required.

Slow concentric tempo is forbidden unless explicitly defined by a special method profile.

## Stop-Condition Categories

```text
technical_failure
velocity_loss
fatigue_limit
impact_limit
balance_loss
equipment_failure
pain
acute_symptom
completion
```

## Duration Reduction Priority

```text
secondary
→ technical
→ contrast
→ primary
→ primer
```

Primary explosive quality must not be degraded to preserve optional work.

---

# Module 4 — Strength

## Identifier

```text
strength
```

## Primary Objective

Develop the athlete’s capacity to produce high force against external resistance.

## Allowed Methods

```text
straight_sets_repetitions
distance_carry_sets
timed_isometric_sets
```

## Preferred Method Order

```text
straight_sets_repetitions
→ distance_carry_sets
→ timed_isometric_sets
```

## Allowed Roles

```text
primary
secondary
accessory
robustness
```

## Required Roles

At least one:

```text
primary
```

when strength is the main objective.

## Required Prescription Dimensions

- sets;
- repetitions, distance or duration;
- intensity;
- rest;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
absolute_load
percentage_1rm
percentage_training_max
percentage_body_mass
rpe
rir
resistance_category
```

## Preferred Intensity Types

```text
percentage_1rm
percentage_training_max
absolute_load
rpe
```

## Rest Policy

Rest is required and must preserve force production and technique.

## Tempo Policy

Method-dependent.

Tempo may be optional for standard strength work and required for specific controlled or isometric profiles.

## Stop-Condition Categories

```text
medical
pain
technical_failure
intensity_limit
fatigue_limit
range_of_motion_loss
balance_loss
equipment_failure
completion
```

## Duration Reduction Priority

```text
accessory
→ robustness
→ secondary
→ primary
```

Primary strength work must be preserved above lower-priority work whenever safe and valid.

---

# Module 5 — Functional Hypertrophy

## Identifier

```text
functional_hypertrophy
```

## Primary Objective

Develop useful muscular tissue while preserving movement quality, combat transfer and recovery compatibility.

## Allowed Methods

```text
straight_sets_repetitions
timed_isometric_sets
```

## Preferred Method Order

```text
straight_sets_repetitions
→ timed_isometric_sets
```

## Allowed Roles

```text
primary
secondary
accessory
robustness
```

## Required Prescription Dimensions

- sets;
- repetitions or duration;
- intensity;
- rest;
- tempo when required;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
absolute_load
percentage_1rm
percentage_training_max
rpe
rir
assistance_level
resistance_category
```

## Preferred Intensity Types

```text
rpe
rir
absolute_load
```

## Rest Policy

Rest is required and must remain compatible with the intended fatigue and volume profile.

## Tempo Policy

Optional by default.

A profile may require controlled execution.

## Stop-Condition Categories

```text
pain
technical_failure
intensity_limit
fatigue_limit
range_of_motion_loss
completion
```

## Duration Reduction Priority

```text
accessory
→ robustness
→ secondary
→ primary
```

---

# Module 6 — Robustness

## Identifier

```text
robustness
```

## Primary Objective

Increase tolerance, structural capacity and resilience without creating avoidable injury risk or excessive fatigue.

## Allowed Methods

```text
straight_sets_repetitions
timed_isometric_sets
distance_carry_sets
controlled_mobility_sets
```

## Preferred Method Order

```text
timed_isometric_sets
→ straight_sets_repetitions
→ distance_carry_sets
→ controlled_mobility_sets
```

## Allowed Roles

```text
robustness
corrective
secondary
accessory
```

## Required Prescription Dimensions

- sets;
- repetitions, duration or distance;
- explicit technical standard;
- rest;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
rpe
rir
absolute_load
percentage_body_mass
technical_effort
resistance_category
```

## Preferred Intensity Types

```text
rpe
technical_effort
```

## Rest Policy

Rest is required when needed to preserve control and tissue tolerance.

## Tempo Policy

Controlled tempo is frequently required, but must remain profile-specific.

## Stop-Condition Categories

```text
pain
acute_symptom
technical_failure
range_of_motion_loss
balance_loss
fatigue_limit
completion
```

## Duration Reduction Priority

```text
accessory
→ corrective
→ secondary
→ robustness
```

---

# Module 7 — Grip

## Identifier

```text
grip
```

## Primary Objective

Develop gripping strength, endurance, control and transfer to combat and loaded movement tasks.

## Allowed Methods

```text
straight_sets_repetitions
timed_isometric_sets
distance_carry_sets
work_rest_intervals
```

## Preferred Method Order

```text
distance_carry_sets
→ timed_isometric_sets
→ straight_sets_repetitions
→ work_rest_intervals
```

## Allowed Roles

```text
primary
secondary
accessory
robustness
conditioning
```

## Required Prescription Dimensions

- sets or intervals;
- repetitions, duration or distance;
- loading or resistance mode;
- rest;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
absolute_load
percentage_body_mass
rpe
rir
resistance_category
technical_effort
```

## Preferred Intensity Types

```text
absolute_load
rpe
resistance_category
```

## Rest Policy

Rest is required and must account for grip recovery and implement safety.

## Tempo Policy

Tempo is normally forbidden for carries and optional for repetition or isometric work.

## Stop-Condition Categories

```text
technical_failure
fatigue_limit
equipment_failure
pain
balance_loss
completion
```

## Duration Reduction Priority

```text
accessory
→ conditioning
→ robustness
→ secondary
→ primary
```

---

# Module 8 — Core

## Identifier

```text
core
```

## Primary Objective

Develop force transfer, trunk control, anti-movement capacity, rotation control and combat-relevant stability.

## Allowed Methods

```text
timed_isometric_sets
straight_sets_repetitions
distance_carry_sets
controlled_mobility_sets
```

## Preferred Method Order

```text
timed_isometric_sets
→ straight_sets_repetitions
→ distance_carry_sets
→ controlled_mobility_sets
```

## Allowed Roles

```text
primary
secondary
accessory
robustness
corrective
```

## Required Prescription Dimensions

- sets;
- duration, repetitions or distance;
- laterality where relevant;
- technical standard;
- rest;
- stop conditions.

## Allowed Intensity Types

```text
rpe
technical_effort
absolute_load
percentage_body_mass
resistance_category
```

## Preferred Intensity Types

```text
technical_effort
rpe
```

## Rest Policy

Rest must preserve trunk position and execution quality.

## Tempo Policy

Controlled or hold-based tempo is often required.

## Stop-Condition Categories

```text
pain
technical_failure
range_of_motion_loss
balance_loss
fatigue_limit
completion
```

## Duration Reduction Priority

```text
accessory
→ corrective
→ robustness
→ secondary
→ primary
```

---

# Module 9 — Conditioning

## Identifier

```text
conditioning
```

## Primary Objective

Develop energy-system capacity, repeatability, pace control and combat-relevant work tolerance.

## Allowed Methods

```text
work_rest_intervals
continuous_aerobic_duration
combat_rounds
distance_carry_sets
```

## Preferred Method Order

```text
work_rest_intervals
→ combat_rounds
→ continuous_aerobic_duration
→ distance_carry_sets
```

## Allowed Roles

```text
conditioning
primary
secondary
accessory
```

## Required Roles

At least one:

```text
conditioning
```

## Required Prescription Dimensions

- intervals, rounds, duration or distance;
- intensity or pace;
- rest where applicable;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
heart_rate
pace
rpe
technical_effort
impact_intent
movement_intent
velocity
resistance_category
```

## Preferred Intensity Types

```text
heart_rate
pace
rpe
```

## Rest Policy

Method-dependent.

Intervals and rounds require explicit recovery.

Continuous work has no intra-exercise rest.

## Tempo Policy

Normally forbidden.

## Stop-Condition Categories

```text
acute_symptom
pain
pace_loss
intensity_limit
technical_failure
fatigue_limit
environmental_hazard
completion
time_limit
```

## Duration Reduction Priority

```text
accessory
→ secondary
→ conditioning
→ primary
```

Density must not be increased arbitrarily to compensate for reduced duration.

---

# Module 10 — Recovery

## Identifier

```text
recovery
```

## Primary Objective

Support restoration, low-demand movement, circulation, relaxation and readiness without adding meaningful fatigue.

## Allowed Methods

```text
recovery_duration_work
continuous_aerobic_duration
controlled_mobility_sets
timed_isometric_sets
```

## Preferred Method Order

```text
recovery_duration_work
→ controlled_mobility_sets
→ continuous_aerobic_duration
→ timed_isometric_sets
```

## Allowed Roles

```text
recovery
corrective
```

## Required Prescription Dimensions

- duration or sets and duration;
- low-demand intensity;
- stop conditions;
- duration estimate.

## Allowed Intensity Types

```text
rpe
heart_rate
technical_effort
movement_intent
```

## Preferred Intensity Types

```text
rpe
technical_effort
```

## Rest Policy

Formal rest is normally not applicable or minimal.

## Tempo Policy

Optional or controlled.

## Stop-Condition Categories

```text
pain
acute_symptom
intensity_limit
technical_failure
completion
time_limit
```

## Duration Reduction Priority

```text
corrective
→ recovery
```

Recovery work may be removed if session duration is exceeded and it is not required by a higher-priority rule.

---

# Cross-Module Method Conflicts

The engine must detect cases where:

- a method is allowed by the catalogue but not by the selected module;
- the Exercise Role is incompatible with the module-method pair;
- the intensity type is not allowed by the module;
- the rest policy conflicts with module intent;
- the tempo policy conflicts with module intent;
- or the minimum valid dose cannot be met.

Such conflicts must fail or trigger documented substitution.

---

# Multi-Module Exercises

An exercise selected for more than one module must not receive an ambiguous blended prescription.

The engine must either:

- assign one primary parent module;
- create separate prescription instances;
- or use a future documented compound profile.

CAS V0.1 should prefer one primary parent module per prescription.

---

# Module Priority and Session Objective

When multiple modules are selected, the session objective must identify:

- primary module;
- secondary modules;
- optional modules.

Prescription duration and adjustment rules must preserve that priority.

A secondary module must not consume resources required by the primary module.

---

# Minimum Dose Rule

Every module-method profile must reference a minimum valid dose.

The minimum dose must define:

- minimum work quantity;
- minimum intensity where applicable;
- minimum rest requirement;
- required stop conditions;
- and whether the module remains valid after adjustment.

No module may be marked successfully prescribed below its minimum valid dose.

---

# Maximum Dose Rule

Maximum dose may constrain:

- total sets;
- total repetitions;
- total duration;
- total distance;
- total rounds;
- total intervals;
- total impact exposure;
- total local fatigue;
- or total session contribution.

The maximum must be documented before implementation.

---

# Duration Reduction Across Modules

When the session exceeds duration, the engine must reduce work according to:

```text
optional module work
→ lowest-priority roles inside secondary modules
→ lowest-priority roles inside the primary module
→ secondary modules
→ primary module only within documented limits
→ fail safely
```

Medical, safety and recovery-protection rules may override this order.

---

# Module Substitution Policy

A module may allow:

```ts
type ModuleSubstitutionPolicy =
  | "exercise_only"
  | "method_then_exercise"
  | "module_removal_allowed"
  | "module_removal_forbidden";
```

Each module must define its substitution policy before implementation.

---

# Safe Failure

Module prescription must fail safely when:

- no allowed method exists;
- no method supports the required role;
- no compatible exercise exists;
- the required intensity type cannot be resolved;
- the minimum valid dose cannot fit;
- stop conditions are unavailable;
- or the module objective cannot be preserved.

The engine must not silently convert one module into another.

---

# Decision Trace Integration

The Decision Trace must record:

- module identifier;
- module priority;
- candidate methods;
- allowed roles;
- selected method;
- selected role;
- rejected alternatives;
- minimum-dose rule;
- duration adjustments;
- substitutions;
- final module validity;
- and source rule identifiers.

---

# Determinism

Given identical:

- validated input;
- selected module;
- module priority;
- selected exercise;
- Exercise Role;
- rule version;
- and knowledge-base version,

the module profile must produce the same allowed-method set and prescription requirements.

---

# Implementation Boundary

These profiles define module-method relationships.

They do not yet authorize numerical generation.

CAS still requires:

```text
33_EXERCISE_PRESCRIPTION_CAPABILITIES.md
34_NUMERICAL_PRESCRIPTION_TABLES.md
35_PRESCRIPTION_ADJUSTMENT_RULES.md
```

before prescription logic may generate executable values.

---

# Acceptance Criteria

The Module Prescription Profiles V0.1 are valid only if:

- every module has a profile;
- every module has at least one allowed method;
- method priority is deterministic;
- allowed roles are explicit;
- required prescription dimensions are explicit;
- allowed intensity types are finite;
- rest policy is explicit;
- tempo policy is explicit;
- stop-condition categories are explicit;
- minimum dose is mandatory;
- duration reduction order is explicit;
- module substitution does not alter adaptation identity;
- unsupported profiles fail safely;
- and every rule is traceable.

---

# Final Principle

> The module decides why the athlete trains; the method decides how the work is organized.

A valid prescription must preserve both.