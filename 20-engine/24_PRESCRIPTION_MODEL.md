# PRESCRIPTION MODEL

Version 0.1

---

# Purpose

The Prescription Model defines how the Combat Athlete System represents the execution requirements of a selected exercise.

Its purpose is to transform an exercise selection into a complete, structured and machine-readable prescription.

A prescription describes how an exercise must be performed within a specific session context.

It may define:

* sets,
* repetitions,
* duration,
* distance,
* rounds,
* intensity,
* rest,
* tempo,
* execution instructions,
* and stop conditions.

The Prescription Model does not determine the numerical prescription rules by itself.

It defines:

* the canonical data structure,
* the meaning of each field,
* the allowed units,
* the relationships between fields,
* the distinction between required and optional values,
* and the validation principles that every generated prescription must respect.

Numerical ranges and decision rules are defined in separate rule documents.

---

# Core Principle

> An exercise is not fully selected until its execution conditions are prescribed.

An Exercise Definition describes what an exercise is.

A Prescription describes how that exercise must be performed in a specific session.

The same exercise may receive different prescriptions depending on:

* the selected Capability Module,
* the intended adaptation,
* the selected training method,
* the role of the exercise,
* athlete readiness,
* available equipment,
* session duration,
* fatigue constraints,
* safety constraints,
* and the wider combat schedule.

The engine must never generate a prescription from the exercise name alone.

---

# Position in the Engine Pipeline

The prescription phase occurs after exercise selection and before final session validation.

The expected pipeline is:

```text
Validated Engine Input
→ Module Selection
→ Exercise Eligibility
→ Exercise Scoring
→ Exercise Selection
→ Draft Generation
→ Conflict Detection
→ Substitution
→ Draft Reconstruction
→ Exercise Prescription
→ Prescription Validation
→ Final Session Output
→ Decision Trace
```

Prescription generation must use only validated information produced by previous engine stages and documented prescription rules.

---

# Prescription Decision Hierarchy

Every prescription must be derived through the following hierarchy:

```text
Session Objective
→ Capability Module
→ Training Method
→ Exercise Role
→ Exercise Prescription Capabilities
→ Contextual Adjustments
→ Final Prescription
```

The hierarchy is mandatory.

Lower-level data must not override higher-level intent.

For example:

* exercise characteristics must not override the selected training method;
* athlete preferences must not override safety constraints;
* available time must not produce an invalid training dose;
* readiness adjustments must not change the fundamental purpose of the module;
* missing data must not be replaced with invented assumptions.

---

# Definition of a Prescription

A Prescription is the complete set of execution parameters assigned to one selected exercise instance within one generated session.

A prescription must identify:

* the exercise being prescribed;
* its role in the session;
* the method through which it is performed;
* the quantity of work;
* the intended intensity;
* the recovery structure;
* the execution constraints;
* and the conditions requiring termination or modification.

A prescription is session-specific.

It is not a permanent attribute of the exercise.

---

# Prescription and Exercise Definition

The Exercise Definition and the Prescription must remain separate.

## Exercise Definition

The Exercise Definition may contain stable properties such as:

* exercise identifier;
* exercise name;
* movement pattern;
* equipment requirements;
* eligible Capability Modules;
* contraindications;
* complexity;
* impact level;
* loading options;
* supported prescription dimensions;
* and substitution relationships.

## Prescription

The Prescription contains contextual properties such as:

* number of sets;
* number of repetitions;
* work duration;
* prescribed distance;
* round duration;
* load target;
* RPE or RIR target;
* rest duration;
* tempo;
* exercise-specific instructions;
* and stop conditions.

An Exercise Definition defines what can be prescribed.

A Prescription defines what is prescribed now.

---

# Prescription and Training Method

A Training Method defines the structure through which an adaptation is pursued.

Examples may include:

* straight sets;
* cluster sets;
* intervals;
* repeated efforts;
* timed holds;
* continuous work;
* density blocks;
* technical rounds;
* loaded carries;
* jumps or throws;
* and controlled rehabilitation work.

The Prescription Model must support multiple methods without assuming that all exercises use repetitions and sets.

The selected method determines which prescription fields are applicable.

---

# Canonical Prescription Structure

A prescribed exercise must use a structure equivalent to:

```ts
interface ExercisePrescription {
  prescriptionId: string;
  exerciseId: string;
  moduleId: string;
  methodId: string;
  exerciseRole: ExerciseRole;

  volume: PrescriptionVolume;
  intensity: PrescriptionIntensity | null;
  rest: PrescriptionRest | null;
  tempo: PrescriptionTempo | null;

  instructions: PrescriptionInstruction[];
  stopConditions: StopCondition[];

  adjustments: PrescriptionAdjustment[];
  sourceRuleIds: string[];

  status: PrescriptionStatus;
}
```

The exact TypeScript implementation may evolve, but the semantic structure must remain stable.

---

# Prescription Identifier

Each prescribed exercise instance must have a unique `prescriptionId`.

The identifier must distinguish between:

* the Exercise Definition;
* the selected exercise instance;
* and the final prescription assigned to that instance.

The same exercise may appear more than once in a session only when explicitly permitted by the engine rules.

Each occurrence must receive a distinct prescription identifier.

---

# Exercise Identifier

The `exerciseId` must reference an existing validated Exercise Definition.

The prescription engine must not:

* create a new exercise;
* rename an exercise;
* infer an exercise from free text;
* or prescribe an exercise absent from the validated knowledge base.

If the selected exercise cannot be resolved, prescription generation must fail safely.

---

# Module Identifier

The `moduleId` identifies the Capability Module responsible for the prescription.

The module is required because prescription logic must remain adaptation-driven.

The engine must preserve the relationship:

```text
Prescription
→ Selected Exercise
→ Selected Capability Module
→ Session Objective
```

A prescription without a valid parent module is invalid.

---

# Method Identifier

The `methodId` identifies the documented training method used for the exercise.

The method determines the structural interpretation of the prescription.

For example, the method may determine whether the prescribed work is expressed through:

* sets and repetitions;
* sets and duration;
* rounds and duration;
* sets and distance;
* intervals and recovery;
* or another documented structure.

The method must exist in the knowledge base or engine rules.

The prescription engine must not invent a method dynamically.

---

# Exercise Role

Each prescribed exercise must have a defined role within the module or session.

The supported role vocabulary must be documented elsewhere and may include roles such as:

* primary;
* secondary;
* accessory;
* technical;
* primer;
* contrast;
* conditioning;
* robustness;
* recovery;
* or corrective.

The role influences prescription decisions but does not independently determine them.

The same exercise may receive a different prescription when assigned a different role.

---

# Volume Model

The `volume` field defines the quantity and organization of work.

It must support different prescription structures.

A canonical representation may use:

```ts
interface PrescriptionVolume {
  structure: VolumeStructure;
  sets: number | null;
  reps: RepetitionTarget | null;
  duration: DurationTarget | null;
  distance: DistanceTarget | null;
  rounds: number | null;
  workIntervals: number | null;
}
```

Only fields relevant to the selected method may be populated.

---

# Volume Structure

The `structure` field identifies how work is organized.

Supported structures may include:

```ts
type VolumeStructure =
  | "sets_reps"
  | "sets_duration"
  | "sets_distance"
  | "rounds_duration"
  | "intervals"
  | "continuous_duration"
  | "continuous_distance";
```

The final supported vocabulary must remain finite and explicitly documented.

The engine must not generate an undocumented volume structure.

---

# Sets

The `sets` field represents the number of discrete work sets.

It must be:

* an integer;
* greater than zero;
* compatible with the selected method;
* and derived from a documented rule.

`sets` may be `null` when the method does not use sets.

Examples include:

* continuous work;
* a single uninterrupted duration block;
* or another documented non-set structure.

A missing set value must not be represented as zero.

`null` means not applicable.

Zero means invalid.

---

# Repetitions

The `reps` field defines the repetition target within each set or effort.

It must support both fixed and ranged repetition prescriptions.

A canonical representation may use:

```ts
interface RepetitionTarget {
  type: "fixed" | "range";
  value: number | null;
  min: number | null;
  max: number | null;
  unit: "repetitions";
}
```

For a fixed target:

```ts
{
  type: "fixed",
  value: 5,
  min: null,
  max: null,
  unit: "repetitions"
}
```

For a ranged target:

```ts
{
  type: "range",
  value: null,
  min: 6,
  max: 8,
  unit: "repetitions"
}
```

The engine must not use ambiguous strings such as:

```text
"6-8 reps"
```

within the internal model.

Display formatting belongs to the output presentation layer.

---

# Duration

The `duration` field defines a work duration.

It may represent:

* duration per set;
* duration per hold;
* duration per round;
* duration per interval;
* or total continuous work duration.

A canonical representation may use:

```ts
interface DurationTarget {
  value: number;
  unit: "seconds" | "minutes";
  scope:
    | "per_set"
    | "per_rep"
    | "per_round"
    | "per_interval"
    | "total";
}
```

Duration values must always include:

* a numerical value;
* a unit;
* and a scope.

The engine must not rely on implicit units.

---

# Distance

The `distance` field defines a movement distance.

It may be used for:

* loaded carries;
* sprints;
* locomotion drills;
* sled work;
* or other documented exercise types.

A canonical representation may use:

```ts
interface DistanceTarget {
  value: number;
  unit: "meters";
  scope:
    | "per_set"
    | "per_rep"
    | "per_interval"
    | "total";
}
```

Distance must not be represented as free text.

Imperial units must not be used internally unless explicitly introduced in a future schema version.

---

# Rounds

The `rounds` field defines the number of repeated work periods.

It may be used for:

* combat conditioning;
* technical bag work;
* pad work;
* circuits;
* or other documented round-based methods.

A round prescription must normally be associated with:

* round duration;
* rest between rounds;
* and relevant intensity or technical instructions.

A number of rounds without a defined round structure is invalid.

---

# Work Intervals

The `workIntervals` field defines the number of repeated work intervals when the selected structure is interval-based.

Each interval must have a documented:

* work target;
* rest target;
* intensity target where applicable;
* and termination rule.

The engine must not confuse intervals with sets unless the selected method explicitly treats them as equivalent.

---

# Intensity Model

The `intensity` field defines the intended effort or external load.

Intensity is not a single universal value.

Different exercises and methods may require different intensity representations.

A canonical representation may use:

```ts
interface PrescriptionIntensity {
  primaryMetric: IntensityMetric;
  secondaryMetrics: IntensityMetric[];
}
```

An intensity metric may use:

```ts
interface IntensityMetric {
  type: IntensityType;
  value: number | string | null;
  min: number | null;
  max: number | null;
  unit: IntensityUnit;
}
```

The exact supported intensity types are defined in the Intensity Model document.

---

# Supported Intensity Dimensions

The Prescription Model must be able to represent documented intensity dimensions such as:

* percentage of one-repetition maximum;
* RPE;
* repetitions in reserve;
* absolute external load;
* percentage of body mass;
* movement velocity;
* technical intensity;
* effort classification;
* heart-rate target;
* pace;
* or exercise-specific loading categories.

Not every dimension is applicable to every exercise.

The Exercise Definition must indicate which intensity dimensions it supports.

The selected training method must indicate which dimensions it requires or permits.

---

# Primary and Secondary Intensity

A prescription may contain one primary intensity metric and one or more secondary metrics.

For example:

* primary: percentage of one-repetition maximum;
* secondary: target RPE;
* secondary: repetitions in reserve.

The engine must not generate redundant or contradictory intensity targets.

If multiple intensity metrics are present, their relationship must be documented.

If compatibility cannot be established, the prescription must fail validation.

---

# Unknown Athlete Capacity

The engine must not invent athlete performance values.

If a prescription method requires data such as:

* one-repetition maximum;
* training maximum;
* body mass;
* sprint time;
* maximum aerobic speed;
* heart-rate maximum;
* or another athlete-specific reference,

the engine must verify that the required data exists and is valid.

When required capacity data is missing, the engine must:

1. use a documented alternative intensity method, if permitted;
2. select a compatible alternative method, if permitted;
3. or fail safely.

It must not calculate from unsupported assumptions.

---

# Rest Model

The `rest` field defines the recovery allowed between work efforts.

A canonical representation may use:

```ts
interface PrescriptionRest {
  betweenReps: DurationTarget | null;
  betweenSets: DurationTarget | null;
  betweenRounds: DurationTarget | null;
  betweenIntervals: DurationTarget | null;
  afterExercise: DurationTarget | null;
  type: "fixed" | "range" | "conditional";
}
```

Only relevant fields may be populated.

Rest values must be expressed using explicit durations and scopes.

---

# Fixed Rest

A fixed rest prescription defines one exact recovery duration.

Example:

```ts
{
  betweenReps: null,
  betweenSets: {
    value: 180,
    unit: "seconds",
    scope: "per_set"
  },
  betweenRounds: null,
  betweenIntervals: null,
  afterExercise: null,
  type: "fixed"
}
```

The display layer may render this as three minutes.

The internal model must preserve the canonical value and unit.

---

# Rest Range

A rest range defines an allowed minimum and maximum duration.

When ranges are supported, they must use a dedicated range structure rather than free text.

The prescription must also define how the athlete chooses a value inside the range.

A rest range without a decision rule is incomplete.

---

# Conditional Rest

Conditional rest depends on a documented readiness or performance condition.

Examples may include recovery until:

* breathing is controlled;
* technique is restored;
* heart rate enters a defined range;
* or another measurable condition is met.

Conditional rest must not rely on vague language.

Every condition must be observable or measurable.

A maximum rest duration may also be required when defined by the method.

---

# Tempo Model

The `tempo` field defines the intended timing of movement phases.

Tempo is applicable only when the exercise and method support controlled movement timing.

A canonical representation may use:

```ts
interface PrescriptionTempo {
  eccentric: TempoPhase;
  pauseBottom: TempoPhase;
  concentric: TempoPhase;
  pauseTop: TempoPhase;
}
```

A tempo phase may use:

```ts
type TempoPhase =
  | {
      type: "timed";
      seconds: number;
    }
  | {
      type: "intent";
      intent: "controlled" | "explosive" | "maximal_acceleration";
    }
  | {
      type: "none";
    };
```

The implementation must avoid ambiguous tempo strings where possible.

---

# Tempo Applicability

Tempo must be `null` when:

* the method does not require tempo;
* the exercise does not support meaningful phase control;
* or no documented tempo rule applies.

The engine must not assign bodybuilding-style tempo notation automatically to all resistance exercises.

Tempo prescriptions must reflect the intended adaptation.

---

# Execution Instructions

The `instructions` field contains execution requirements that cannot be represented through numerical fields alone.

A canonical structure may use:

```ts
interface PrescriptionInstruction {
  instructionId: string;
  category: InstructionCategory;
  text: string;
  sourceRuleId: string;
  priority: InstructionPriority;
}
```

Instruction categories may include:

```ts
type InstructionCategory =
  | "setup"
  | "execution"
  | "breathing"
  | "technical_intent"
  | "safety"
  | "transition"
  | "equipment"
  | "laterality";
```

The instruction vocabulary must remain structured and traceable.

---

# Instruction Requirements

Instructions must be:

* specific;
* relevant to the prescribed method;
* compatible with the Exercise Definition;
* compatible with athlete constraints;
* and derived from documented knowledge.

The engine must not generate generic coaching language merely to fill the field.

Instructions must not contradict:

* the selected tempo;
* the selected intensity;
* the stop conditions;
* medical restrictions;
* or exercise safety rules.

---

# Laterality

Exercises performed unilaterally or asymmetrically must define how the prescription applies to each side.

The model must distinguish between:

* repetitions per side;
* duration per side;
* distance per side;
* alternating repetitions;
* and total repetitions distributed across both sides.

Laterality must not be left implicit.

A canonical laterality field may be added either to the volume model or to instructions.

The chosen implementation must remain machine-readable.

---

# Stop Conditions

The `stopConditions` field defines the conditions under which:

* a set must end;
* an interval must end;
* the exercise must be modified;
* the exercise must be substituted;
* or the entire session must stop.

Stop conditions are mandatory whenever required by:

* the training method;
* the exercise risk profile;
* athlete medical constraints;
* readiness rules;
* velocity or quality thresholds;
* pain rules;
* or fatigue management rules.

A prescription without required stop conditions is incomplete.

---

# Stop Condition Structure

A canonical representation may use:

```ts
interface StopCondition {
  conditionId: string;
  scope: StopConditionScope;
  trigger: StopConditionTrigger;
  action: StopConditionAction;
  threshold: StopConditionThreshold | null;
  sourceRuleId: string;
  priority: StopConditionPriority;
}
```

Possible scopes may include:

```ts
type StopConditionScope =
  | "repetition"
  | "set"
  | "round"
  | "interval"
  | "exercise"
  | "session";
```

Possible actions may include:

```ts
type StopConditionAction =
  | "end_set"
  | "end_round"
  | "end_interval"
  | "reduce_load"
  | "reduce_volume"
  | "increase_rest"
  | "substitute_exercise"
  | "stop_exercise"
  | "stop_session";
```

---

# Stop Condition Triggers

Triggers must be based on documented and observable events.

Examples may include:

* technical failure;
* inability to maintain the required velocity;
* exceeding the prescribed RPE;
* reaching the lower boundary of repetitions in reserve;
* pain;
* dizziness;
* loss of balance;
* inability to maintain target pace;
* excessive impact discomfort;
* equipment failure;
* or another documented safety condition.

Vague triggers such as `when tired` are invalid unless operationally defined elsewhere.

---

# Pain and Medical Stop Conditions

Pain-related stop conditions must have higher priority than performance targets.

The prescription engine must never instruct the athlete to continue through pain unless a specific medical rehabilitation protocol explicitly defines an acceptable symptom response.

Medical stop conditions must be inherited from validated athlete constraints.

They must not be weakened by:

* session objectives;
* athlete preferences;
* scoring;
* exercise importance;
* or available time.

---

# Adjustments

The `adjustments` field records modifications made to the default prescription due to contextual factors.

A canonical representation may use:

```ts
interface PrescriptionAdjustment {
  adjustmentId: string;
  reason:
    | "readiness"
    | "fatigue"
    | "combat_schedule"
    | "session_duration"
    | "equipment"
    | "medical_constraint"
    | "training_history"
    | "recovery_protection";
  field: string;
  previousValue: unknown;
  adjustedValue: unknown;
  sourceRuleId: string;
}
```

Every adjustment must be traceable.

The engine must not silently alter a prescription.

---

# Readiness Adjustments

Readiness may modify a prescription only through documented rules.

Possible adjustment targets may include:

* volume;
* intensity;
* rest;
* exercise complexity;
* impact exposure;
* or stop conditions.

Readiness adjustments must preserve the central purpose of the selected module.

If the module purpose cannot be preserved safely, the module or exercise must be replaced or removed according to documented engine rules.

---

# Combat Schedule Adjustments

The prescription must respect the athlete’s combat training schedule.

Combat schedule adjustments may affect:

* lower-body fatigue;
* upper-body fatigue;
* impact exposure;
* eccentric stress;
* grip fatigue;
* conditioning density;
* total session volume;
* or recovery demands.

The prescription layer must use the already validated combat schedule information.

It must not reinterpret or reconstruct unavailable schedule data.

---

# Session Duration Adjustments

The prescription engine may adjust work only through documented duration-resolution rules.

It must not reduce values arbitrarily to fit the session.

When the estimated session duration exceeds the allowed duration, the engine must follow a defined hierarchy such as:

```text
remove optional work
→ reduce documented accessory volume
→ use an approved shorter method
→ replace with a compatible exercise
→ fail safely
```

The exact hierarchy must be defined in the Prescription Rules document.

The Prescription Model only requires that all changes remain traceable.

---

# Source Rules

Every prescription must contain `sourceRuleIds`.

These identifiers link the final prescription to the documented rules that produced it.

Sources may include:

* module prescription rules;
* method rules;
* intensity rules;
* rest rules;
* tempo rules;
* stop-condition rules;
* readiness adjustments;
* combat schedule adjustments;
* or safety constraints.

A prescription without at least one source rule is invalid.

---

# Prescription Status

The prescription must include an explicit status.

A canonical status vocabulary may use:

```ts
type PrescriptionStatus =
  | "complete"
  | "adjusted"
  | "incomplete"
  | "invalid"
  | "failed";
```

## Complete

All required fields are present, valid and unmodified.

## Adjusted

All required fields are valid, but one or more contextual adjustments were applied.

## Incomplete

The prescription lacks required information but has not yet reached final validation.

An incomplete prescription must not appear in the final session output.

## Invalid

The prescription contains incompatible or structurally invalid values.

## Failed

The engine could not generate a valid prescription using documented rules.

---

# Null, Missing and Zero Values

The model must distinguish between:

* `null`;
* missing;
* zero;
* and unknown.

## Null

`null` means the field is not applicable to the selected method.

Example:

```ts
reps: null
```

for a continuous-duration method.

## Missing

A missing required field means prescription generation is incomplete or invalid.

Required fields must never be silently omitted.

## Zero

Zero is invalid for any work quantity such as:

* sets;
* repetitions;
* duration;
* distance;
* rounds;
* or intervals.

Zero must not be used to represent non-applicability.

## Unknown

Unknown athlete data must be represented explicitly at the input or validation level.

It must not be encoded as `null` inside a completed prescription when the field is required.

---

# Field Compatibility

The Prescription Model must enforce compatibility between fields.

Examples of valid combinations include:

```text
sets + repetitions
sets + duration
sets + distance
rounds + duration
interval count + interval duration
continuous duration
continuous distance
```

Examples of potentially invalid combinations include:

```text
continuous duration + sets
rounds without round duration
distance without unit
repetitions with continuous-only method
percentage 1RM without valid reference strength
tempo for an exercise that does not support controlled phases
```

Compatibility rules must be explicit and testable.

---

# Required and Optional Fields

Required fields depend on the selected method.

Every method definition must specify:

* required fields;
* optional fields;
* forbidden fields;
* supported intensity types;
* supported rest structures;
* supported tempo structures;
* and required stop conditions.

The prescription engine must validate the final object against the selected method contract.

---

# Method Contract Example

A method contract may use a structure equivalent to:

```ts
interface PrescriptionMethodContract {
  methodId: string;

  requiredVolumeFields: string[];
  optionalVolumeFields: string[];
  forbiddenVolumeFields: string[];

  allowedIntensityTypes: IntensityType[];
  requiredIntensityTypes: IntensityType[];

  allowedRestFields: string[];
  requiredRestFields: string[];

  tempoPolicy:
    | "required"
    | "optional"
    | "forbidden";

  stopConditionPolicy:
    | "required"
    | "conditional"
    | "optional";
}
```

A prescription must satisfy its method contract before final output.

---

# Exercise Prescription Capabilities

Each Exercise Definition must expose its prescription capabilities.

A canonical representation may include:

```ts
interface ExercisePrescriptionCapabilities {
  supportedVolumeStructures: VolumeStructure[];
  supportedIntensityTypes: IntensityType[];
  supportsTempo: boolean;
  supportsExternalLoad: boolean;
  supportsUnilateralPrescription: boolean;
  supportedDistanceUnits: string[];
  requiredStopConditionIds: string[];
}
```

The method contract and exercise capabilities must be compatible.

If they are incompatible, the exercise must not be prescribed through that method.

---

# Prescription Completeness

A prescription is complete only when:

* the exercise exists;
* the module exists;
* the method exists;
* the exercise role is valid;
* the volume structure is valid;
* all required volume fields are present;
* forbidden fields are absent or `null`;
* intensity is valid when required;
* rest is valid when required;
* tempo is valid when required;
* instructions are traceable;
* mandatory stop conditions are present;
* contextual adjustments are recorded;
* source rules are present;
* and no Hard Constraint is violated.

Completeness is structural and semantic.

A syntactically valid object may still be an invalid prescription.

---

# Prescription Validation

Prescription validation must occur after all prescription fields and adjustments have been generated.

Validation must verify:

1. identifier integrity;
2. parent module integrity;
3. method existence;
4. exercise-method compatibility;
5. volume structure compatibility;
6. numerical validity;
7. unit validity;
8. intensity validity;
9. athlete-data availability;
10. rest validity;
11. tempo compatibility;
12. instruction traceability;
13. stop-condition completeness;
14. constraint compliance;
15. source-rule completeness;
16. session-duration compatibility;
17. and output-schema compatibility.

A failed validation must prevent final session generation.

---

# Numerical Validation

All numerical values must be:

* finite;
* non-negative where structurally appropriate;
* strictly greater than zero for work quantities;
* within documented rule boundaries;
* and expressed using the correct unit.

The engine must reject:

* `NaN`;
* infinite values;
* negative durations;
* fractional set counts;
* fractional repetition counts unless explicitly supported;
* and invalid range boundaries.

For a range:

```text
minimum ≤ maximum
```

must always be true.

---

# Unit Validation

Every measurable value must use an allowed unit.

Supported units must be finite and versioned.

Initial unit categories may include:

## Time

* seconds;
* minutes.

## Distance

* meters.

## Repetitions

* repetitions.

## Load

* kilograms;
* percentage of one-repetition maximum;
* percentage of body mass.

## Effort

* RPE;
* repetitions in reserve.

No value may rely on an implicit unit.

---

# Rounding

Rounding rules must be documented separately.

The Prescription Model requires that:

* rounding is deterministic;
* rounding respects available equipment;
* rounding does not violate intensity limits;
* and the unrounded source value may be preserved in the Decision Trace when relevant.

The engine must not apply arbitrary rounding based on presentation preferences.

---

# Prescription Failure

Prescription generation must fail safely when:

* no documented prescription rule exists;
* the selected method is incompatible with the exercise;
* required athlete data is missing;
* mandatory units cannot be resolved;
* required stop conditions are unavailable;
* a Hard Constraint would be violated;
* contextual adjustments produce an invalid dose;
* or conflicting rules cannot be resolved.

Failure must be explicit.

The engine must not return a plausible-looking but unsupported prescription.

---

# Safe Failure Output

A failed prescription should return a structured result equivalent to:

```ts
interface PrescriptionFailure {
  prescriptionId: string;
  exerciseId: string;
  status: "failed";
  reasonCode: string;
  message: string;
  sourceRuleIds: string[];
  recoverable: boolean;
}
```

When `recoverable` is true, the engine may attempt:

* a documented alternative method;
* a documented alternative exercise;
* or a documented substitution.

When `recoverable` is false, session generation must stop or remove the affected module according to engine rules.

---

# No Rule Invention

The prescription engine must never invent:

* set ranges;
* repetition ranges;
* duration targets;
* intensity targets;
* rest periods;
* tempo values;
* coaching instructions;
* or stop conditions.

Every value must originate from:

* a documented rule;
* a validated athlete input;
* a deterministic calculation defined by a documented rule;
* or a documented contextual adjustment.

General training knowledge is not sufficient unless it has been explicitly incorporated into the CAS knowledge base.

---

# Decision Trace Integration

Every prescription decision must be explainable through the Decision Trace.

The trace must record:

* the selected exercise;
* the selected method;
* the exercise role;
* the base prescription rule;
* the initial prescription;
* contextual adjustments;
* conflicts detected;
* conflict-resolution rules;
* the final prescription;
* and validation outcome.

A trace entry may use a structure equivalent to:

```ts
interface PrescriptionTraceEntry {
  prescriptionId: string;
  exerciseId: string;
  methodId: string;
  sourceRuleIds: string[];

  initialPrescription: ExercisePrescription;
  adjustments: PrescriptionAdjustment[];
  finalPrescription: ExercisePrescription;

  validationStatus: "passed" | "failed";
  validationMessages: string[];
}
```

The trace must explain why the prescription was generated.

It must not merely repeat the final values.

---

# Output Presentation

The canonical prescription model is independent from the user interface.

The internal model may later be displayed as:

```text
Back Squat
4 sets × 5 repetitions
Intensity: 80% 1RM
Rest: 3 minutes
Tempo: controlled descent, maximal concentric intent
Stop if technical failure occurs
```

However, formatted strings must not replace structured prescription data inside the engine.

The application layer is responsible for:

* human-readable labels;
* localization;
* unit formatting;
* pluralization;
* and concise coaching display.

---

# Backward Compatibility

The Prescription Model must integrate with the existing `EngineRunResult`.

The first implementation must avoid unnecessary changes to validated engine stages.

Prescription data should be introduced as a new structured layer attached to selected session exercises.

Existing exercise selection and Decision Trace behavior must remain stable unless a prescription requirement reveals a documented incompatibility.

Any change to an existing schema must be versioned and covered by tests.

---

# Minimum Prescription Output

For CAS V0.1, every successfully prescribed exercise must contain at minimum:

```text
prescriptionId
exerciseId
moduleId
methodId
exerciseRole
volume
intensity or explicit null
rest or explicit null
tempo or explicit null
instructions
stopConditions
sourceRuleIds
status
```

Additional fields may be added when required by later documents.

No required field may be replaced by free text.

---

# Initial Scope Limitations

The Prescription Model V0.1 defines structure only.

It does not yet define:

* exact set ranges;
* exact repetition ranges;
* exact duration ranges;
* intensity percentages;
* RPE or RIR targets;
* rest durations;
* tempo prescriptions;
* readiness reduction percentages;
* combat schedule adjustment values;
* or method-specific stop thresholds.

These values must be defined in subsequent documents before implementation.

---

# Required Supporting Documents

The Prescription Model depends on the future completion of:

```text
25_PRESCRIPTION_RULES.md
26_INTENSITY_MODEL.md
27_REST_TEMPO_RULES.md
28_STOP_CONDITIONS.md
29_PRESCRIPTION_TEST_CASES.md
```

These documents will define the rules that populate and validate the model established here.

---

# Acceptance Criteria

The Prescription Model V0.1 is valid only if:

* exercise definitions and prescriptions remain separate;
* prescriptions are adaptation-driven;
* every field has a clear semantic meaning;
* units are explicit;
* non-applicable values use `null`;
* required values cannot be silently omitted;
* method-field compatibility is enforceable;
* unsupported prescriptions fail safely;
* every prescription is traceable to documented rules;
* contextual adjustments are recorded;
* stop conditions are structurally represented;
* and the model can be integrated into `EngineRunResult` without weakening existing engine guarantees.

---

# Final Principle

> CAS must prescribe only what it can justify, validate and explain.

A complete prescription is not the most detailed prescription possible.

It is the most precise prescription supported by validated athlete data, documented CAS rules and the current session context.
