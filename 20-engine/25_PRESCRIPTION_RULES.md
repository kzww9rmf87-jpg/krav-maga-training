# PRESCRIPTION RULES

Version 0.1

---

# Purpose

The Prescription Rules define how the Combat Athlete System transforms a selected exercise into a structured exercise prescription.

Their purpose is to determine:

- which prescription structure must be used;
- which fields are required;
- which fields are optional;
- which fields are forbidden;
- how the selected Capability Module influences the prescription;
- how the selected Training Method constrains the prescription;
- how the Exercise Role modifies the prescription;
- how athlete and session context may adjust the prescription;
- and when prescription generation must fail safely.

The Prescription Rules do not define the full numerical intensity model, rest model, tempo model or stop-condition thresholds.

Those elements are defined in separate documents.

---

# Core Principle

> Prescription begins with the intended adaptation, not with the exercise name.

The engine must never prescribe an exercise solely because a familiar set and repetition scheme is commonly associated with it.

Every prescription must be derived from:

```text
Session Objective
→ Capability Module
→ Training Method
→ Exercise Role
→ Exercise Prescription Capabilities
→ Athlete Context
→ Session Context
→ Final Prescription
```

The selected exercise constrains what is possible.

The Capability Module and Training Method determine what is required.

---

# Scope

The Prescription Rules govern:

- prescription structure selection;
- method contract selection;
- required field resolution;
- exercise-method compatibility;
- volume structure resolution;
- laterality handling;
- contextual adjustment order;
- duration compatibility;
- prescription completeness;
- safe failure;
- and Decision Trace requirements.

The Prescription Rules do not yet define:

- exact set values;
- exact repetition values;
- exact duration values;
- exact distance values;
- exact round values;
- exact intensity values;
- exact rest values;
- exact tempo values;
- or exact stop thresholds.

These values must come from documented rules introduced in this file or later supporting documents.

---

# Position in the Engine Pipeline

Prescription generation occurs after the exercise list has been finalized.

The required pipeline is:

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
→ Prescription Structure Resolution
→ Prescription Value Resolution
→ Prescription Adjustment
→ Prescription Validation
→ Final Session Output
→ Decision Trace
```

Prescription rules must not change the selected exercise unless a documented incompatibility is discovered.

When an incompatibility is discovered, the engine must use the existing substitution or failure mechanisms.

---

# Required Inputs

The prescription phase may use only validated data.

At minimum, it requires:

- session objective;
- selected Capability Module;
- selected exercise;
- selected or resolved Training Method;
- Exercise Role;
- Exercise Definition;
- athlete profile;
- athlete readiness;
- medical and safety constraints;
- available equipment;
- combat schedule;
- session duration;
- and applicable rule identifiers.

Missing required inputs must produce an explicit prescription failure.

The engine must not infer missing values from the exercise name.

---

# Prescription Resolution Order

The prescription engine must resolve each exercise in the following order:

1. verify the selected exercise;
2. identify the parent Capability Module;
3. resolve the Training Method;
4. confirm the Exercise Role;
5. load the method contract;
6. load the exercise prescription capabilities;
7. verify method-exercise compatibility;
8. select the volume structure;
9. identify required prescription dimensions;
10. resolve laterality;
11. generate the base prescription;
12. apply athlete adjustments;
13. apply combat schedule adjustments;
14. apply session-duration adjustments;
15. attach instructions;
16. attach stop conditions;
17. validate the prescription;
18. write the Decision Trace.

The order is mandatory.

A lower-priority adjustment must not override a higher-priority safety rule.

---

# Rule Priority

Prescription decisions must follow this priority order:

```text
Medical and Safety Constraints
→ Hard Constraints
→ Session Objective
→ Capability Module
→ Training Method
→ Exercise Role
→ Exercise Capabilities
→ Athlete Readiness
→ Combat Schedule
→ Session Duration
→ Athlete Preference
→ Presentation Preference
```

When two rules conflict, the higher-priority rule wins.

If the conflict cannot be resolved without invalidating the prescription, prescription generation must fail safely.

---

# Training Method Resolution

Each prescribed exercise must have one documented `methodId`.

The method may come from:

- the selected Capability Module;
- an explicit session template;
- a module-specific rule;
- an exercise-role rule;
- or a documented fallback method.

The engine must not dynamically invent a new method.

---

# Method Resolution Hierarchy

The method must be resolved using this hierarchy:

```text
Explicit method selected by a validated upstream rule
→ Module-specific required method
→ Exercise-role-specific allowed method
→ Documented default method for the module
→ Safe failure
```

A fallback method may be used only when:

- it is explicitly documented;
- it remains compatible with the module objective;
- it is compatible with the Exercise Definition;
- and the substitution is recorded in the Decision Trace.

---

# Method Contract

Every Training Method must define a contract.

The contract must identify:

- required volume fields;
- optional volume fields;
- forbidden volume fields;
- allowed intensity types;
- required intensity types;
- allowed rest fields;
- required rest fields;
- tempo policy;
- instruction requirements;
- stop-condition policy;
- supported Exercise Roles;
- and supported exercise capabilities.

A method without a valid contract must not be used.

---

# Method Contract Validation

Before generating values, the engine must confirm that:

- the method exists;
- the method is permitted for the selected module;
- the method supports the Exercise Role;
- the selected exercise supports the required volume structure;
- the selected exercise supports the required intensity type;
- the selected exercise supports any required tempo;
- the required athlete data exists;
- and no constraint forbids the method.

If one of these conditions fails, the method is invalid for that exercise instance.

---

# Exercise Role Resolution

Every selected exercise must have one explicit Exercise Role.

The initial CAS V0.1 role vocabulary may include:

```text
primary
secondary
accessory
technical
primer
contrast
conditioning
robustness
recovery
corrective
```

Only roles already documented in the existing CAS knowledge base may be implemented.

If the current upstream schema already uses a different role vocabulary, that vocabulary remains authoritative.

The prescription layer must not create duplicate role concepts.

---

# Role Influence

The Exercise Role may influence:

- prescription volume;
- intensity method;
- rest structure;
- tempo requirement;
- instruction priority;
- stop-condition strictness;
- and session-duration reduction priority.

The role must not independently determine the entire prescription.

The prescription must still remain consistent with:

- the Capability Module;
- the Training Method;
- and the Exercise Definition.

---

# Role Priority Within a Session

When session duration or recovery protection requires prescription reduction, the default preservation priority is:

```text
primary
→ technical objective-critical work
→ secondary
→ robustness
→ conditioning
→ accessory
→ corrective
→ optional recovery work
```

This order must not be applied blindly.

A module-specific rule or safety rule may define a different order.

The final duration-resolution hierarchy must remain documented and deterministic.

---

# Exercise Prescription Capabilities

Every Exercise Definition used by the prescription engine must declare its prescription capabilities.

At minimum, capabilities must define:

- supported volume structures;
- supported intensity types;
- whether external load is supported;
- whether body-mass loading is supported;
- whether tempo is supported;
- whether unilateral prescription is required or supported;
- whether distance is supported;
- whether duration is supported;
- whether rounds are supported;
- and mandatory stop conditions.

An exercise without prescription capabilities is not prescribable.

---

# Compatibility Rule

A prescription is structurally eligible only when:

```text
Method Requirements
∩ Exercise Capabilities
= Complete Compatible Prescription
```

Partial compatibility is insufficient when a required field cannot be represented.

For example:

- a round-based method requires round support;
- a loaded carry method requires distance or duration support;
- a percentage-based strength method requires external load and valid reference strength;
- a timed isometric method requires duration support;
- a controlled-tempo method requires tempo support.

If required compatibility is absent, the engine must use a documented alternative or fail safely.

---

# Volume Structure Resolution

Each prescription must use one primary volume structure.

The supported initial structures are:

```text
sets_reps
sets_duration
sets_distance
rounds_duration
intervals
continuous_duration
continuous_distance
```

Additional structures may be introduced only through a versioned schema update.

The engine must not combine structures unless a documented method explicitly requires a compound structure.

---

# Volume Structure Selection Hierarchy

The volume structure must be selected in this order:

1. use the structure required by the Training Method;
2. confirm that the Exercise Definition supports it;
3. confirm that the Exercise Role permits it;
4. confirm that the required athlete data exists;
5. confirm that the structure fits the session constraints;
6. otherwise use a documented compatible alternative;
7. otherwise fail safely.

The engine must not choose the most familiar structure for the exercise.

---

# Sets and Repetitions Structure

`sets_reps` may be used only when:

- the method uses discrete sets;
- the exercise produces countable repetitions;
- repetition quality can be operationally defined;
- and the Exercise Definition supports repetition-based prescription.

A `sets_reps` prescription requires:

- sets;
- repetitions;
- applicable intensity;
- rest between sets when required;
- instructions when required;
- and stop conditions when required.

Duration and distance must be `null` unless the method explicitly permits an additional documented constraint.

---

# Sets and Duration Structure

`sets_duration` may be used for exercises such as:

- isometric holds;
- timed technical drills;
- controlled locomotion;
- or other documented timed efforts.

It requires:

- sets;
- duration per set;
- rest between sets when required;
- intensity where applicable;
- and stop conditions.

Repetitions and distance must be `null` unless explicitly required by the method.

---

# Sets and Distance Structure

`sets_distance` may be used for:

- loaded carries;
- sled work;
- short locomotion efforts;
- or other documented distance-based work.

It requires:

- sets;
- distance per set;
- applicable intensity or loading method;
- rest between sets;
- laterality where relevant;
- and stop conditions.

Duration may be recorded as an estimate or cap only when the method contract explicitly permits it.

---

# Rounds and Duration Structure

`rounds_duration` may be used for:

- bag work;
- pad work;
- technical combat practice;
- combat conditioning;
- or other documented round-based work.

It requires:

- number of rounds;
- duration per round;
- rest between rounds;
- technical or effort instructions;
- and stop conditions.

Sets and repetitions must be `null`.

---

# Interval Structure

`intervals` may be used when the method defines repeated work and recovery periods.

It requires:

- number of intervals;
- work target;
- recovery target;
- work duration or distance;
- intensity or pace where required;
- and stop conditions.

The engine must distinguish interval count from set count.

---

# Continuous Duration Structure

`continuous_duration` may be used only when the method requires uninterrupted work for a total time.

It requires:

- total duration;
- applicable intensity or pace;
- instructions;
- and stop conditions.

Sets, repetitions, rounds and interval count must be `null`.

---

# Continuous Distance Structure

`continuous_distance` may be used only when the method requires uninterrupted work for a total distance.

It requires:

- total distance;
- applicable intensity or pace;
- instructions;
- and stop conditions.

Sets, repetitions, rounds and interval count must be `null`.

---

# Compound Methods

A method containing multiple phases must not be represented as one ambiguous prescription.

It must be represented as either:

- multiple prescribed exercise instances;
- a documented compound prescription structure;
- or a parent block containing multiple child prescriptions.

The engine must not place incompatible values into one flat prescription object.

---

# Base Prescription

The base prescription is the prescription generated before contextual adjustments.

It must be derived from:

- module rules;
- method rules;
- exercise-role rules;
- and exercise capabilities.

The base prescription must already be structurally valid.

Contextual adjustments must not be used to repair an invalid base prescription.

---

# Base Prescription Source

Every base prescription field must reference at least one source rule.

The trace must identify:

- the rule that selected the method;
- the rule that selected the volume structure;
- the rule that generated each numerical value;
- the rule that selected the intensity type;
- the rule that selected the rest structure;
- the rule that selected the tempo policy;
- and the rule that required stop conditions.

No base value may be generated from undocumented general knowledge.

---

# Numerical Value Resolution

Numerical values must be resolved from documented prescription tables or deterministic formulas.

Permitted sources include:

- fixed values;
- bounded ranges;
- module-specific tables;
- method-specific tables;
- role-specific tables;
- validated athlete metrics;
- deterministic percentages;
- or deterministic calculations.

The engine must not interpolate between undocumented values.

---

# Fixed Values

A fixed value may be used when a rule defines one exact target.

Examples include:

- a fixed number of sets;
- a fixed round duration;
- a fixed rest period;
- or a fixed repetition target.

The value must remain traceable to its source rule.

---

# Ranged Values

A ranged prescription may be used only when the rule defines:

- the minimum;
- the maximum;
- and the selection logic inside the range.

A range without a selection rule is incomplete.

The engine must not randomly choose a value within a range.

---

# Range Selection

When a documented range exists, the engine must resolve it using a deterministic hierarchy.

Possible documented factors may include:

- Exercise Role;
- athlete training age;
- readiness;
- session duration;
- training history;
- current phase;
- combat schedule;
- or progression status.

Only factors explicitly defined by the rule may be used.

---

# Athlete-Specific Calculations

Athlete-specific values may be calculated only when:

- the required input exists;
- the input has passed validation;
- the formula is documented;
- rounding rules are documented;
- and the resulting value remains within allowed boundaries.

The trace must preserve:

- input value;
- formula identifier;
- unrounded result when relevant;
- rounded result;
- and final prescribed value.

---

# Missing Athlete Data

When required athlete data is missing, the engine must follow this hierarchy:

```text
Use a documented non-dependent alternative metric
→ Use a documented alternative method
→ Use a documented alternative exercise
→ Fail safely
```

The engine must not estimate:

- one-repetition maximum;
- body mass;
- maximum heart rate;
- maximum aerobic speed;
- sprint capacity;
- or training history.

---

# Laterality Rules

Laterality must be resolved for every unilateral or asymmetrical exercise.

The prescription must explicitly state whether volume applies:

- per side;
- alternating sides;
- to both sides combined;
- to the weaker side first;
- or according to another documented rule.

Laterality must be machine-readable.

The engine must not rely on a display instruction alone when laterality affects volume.

---

# Per-Side Volume

When the prescription is defined per side:

- the volume value represents work for one side;
- the total estimated work must account for both sides;
- session-duration estimation must account for both sides;
- and the output must clearly display `per side`.

The engine must not interpret `8 repetitions` ambiguously for a unilateral exercise.

---

# Alternating Repetitions

When repetitions alternate sides:

- the total repetition count must be explicit;
- the starting side rule must be documented when relevant;
- and the display layer must identify that repetitions are total alternating repetitions.

---

# Bilateral Imbalance Rules

The weaker side may receive priority only when a documented corrective, rehabilitation or asymmetry rule requires it.

The prescription engine must not diagnose asymmetry from incomplete data.

---

# Readiness Adjustment Order

Readiness adjustments occur after generation of the base prescription.

They may modify only fields explicitly permitted by readiness rules.

The default adjustment order is:

```text
Preserve safety
→ Preserve module objective
→ Reduce optional volume
→ Reduce required volume within documented limits
→ Reduce intensity within documented limits
→ Increase rest within documented limits
→ Simplify method if documented
→ Substitute if documented
→ Fail safely
```

The engine must not apply arbitrary percentage reductions.

---

# Readiness Adjustment Boundaries

Every readiness adjustment rule must define:

- triggering input;
- affected field;
- permitted adjustment;
- minimum valid dose;
- maximum valid dose;
- priority;
- and failure behavior.

An adjustment that produces a dose below the minimum valid dose invalidates the prescription.

---

# Medical and Safety Adjustments

Medical and safety constraints take priority over all performance rules.

They may require:

- method prohibition;
- exercise prohibition;
- reduced impact;
- reduced range of motion;
- reduced external load;
- additional rest;
- stricter stop conditions;
- substitution;
- or session termination.

The prescription engine must not weaken upstream medical restrictions.

---

# Combat Schedule Adjustments

Combat schedule adjustments occur after readiness adjustments unless an existing higher-priority engine rule specifies otherwise.

They may modify:

- local muscular fatigue;
- impact exposure;
- grip fatigue;
- eccentric stress;
- conditioning density;
- training volume;
- intensity;
- or recovery demand.

The adjustment must reference the validated combat schedule conflict already detected upstream.

The prescription layer must not create a new combat schedule interpretation from free text.

---

# Combat Schedule Preservation Principle

> The prescription must support combat practice rather than reduce its quality.

When a conflict exists, the engine must preserve:

1. athlete safety;
2. priority combat session quality;
3. the central adaptation of the CAS session;
4. essential primary work;
5. secondary work;
6. optional work.

A prescription that knowingly compromises a protected combat session is invalid.

---

# Session Duration Estimation

Every prescription must have a deterministic duration estimate.

The estimate may include:

- work duration;
- expected repetition duration;
- rest duration;
- setup time;
- transition time;
- unilateral duplication;
- round transitions;
- and exercise-specific overhead.

All estimation constants must be documented.

The engine must not use hidden or arbitrary time assumptions.

---

# Duration Compatibility

After all prescriptions are generated, the engine must compare:

```text
Estimated Session Duration
≤ Allowed Session Duration
```

When the estimate exceeds the allowed duration, the engine must apply documented duration-resolution rules.

The engine must not silently truncate the session.

---

# Duration Resolution Hierarchy

Unless a module-specific rule overrides it, duration conflicts must be resolved in this order:

1. remove optional instructions that add no execution time only at the display layer;
2. reduce optional transition overhead where operationally possible;
3. remove optional exercises;
4. reduce accessory volume within documented limits;
5. reduce secondary volume within documented limits;
6. use a documented shorter compatible method;
7. substitute with a documented lower-overhead exercise;
8. remove the lowest-priority module if permitted;
9. fail safely.

Primary work must not be reduced before lower-priority work unless required by safety or a module-specific rule.

---

# Minimum Effective Dose

Every module and method must define a minimum valid prescription.

A duration adjustment must not reduce work below that threshold.

When the remaining prescription would fall below the minimum effective dose, the engine must:

- use a documented alternative;
- remove the exercise or module if permitted;
- or fail safely.

The engine must not present sub-threshold work as a valid completed prescription.

---

# Maximum Allowed Dose

Every prescription rule must define maximum boundaries where necessary.

The engine must reject any contextual adjustment that produces:

- excessive volume;
- excessive intensity;
- excessive duration;
- excessive density;
- insufficient rest;
- or another documented overload condition.

---

# Progression Rules

Progression must not be inferred during single-session prescription unless progression rules and athlete history are available.

A progression decision may use only:

- previous validated prescriptions;
- previous completion status;
- performance data;
- technique status;
- readiness;
- and documented progression rules.

The engine must not increase load or volume because the exercise was previously selected.

---

# Regression Rules

Regression may be applied only through documented rules.

Possible regression targets include:

- load;
- repetitions;
- sets;
- duration;
- distance;
- method complexity;
- exercise complexity;
- or impact level.

Every regression must preserve traceability and module intent.

---

# Instructions Resolution

Instructions must be selected from documented exercise, method or module rules.

Instruction priority is:

```text
Safety
→ Technical execution
→ Method intent
→ Module intent
→ Breathing
→ Setup
→ Transition
→ Presentation
```

Lower-priority instructions must not contradict higher-priority instructions.

---

# Instruction Deduplication

The engine must remove duplicate instructions while preserving:

- the highest-priority version;
- the most specific compatible version;
- and all distinct safety requirements.

Two instructions with different rule identifiers may be merged only when their semantic meaning is equivalent.

The trace must preserve the source rules used.

---

# Instruction Conflict

If two mandatory instructions conflict, the engine must resolve them using the rule priority hierarchy.

If the conflict cannot be resolved, the prescription must fail.

The engine must not output both contradictory instructions.

---

# Stop Condition Resolution

Stop conditions must be attached after the base prescription and contextual adjustments are resolved.

They may originate from:

- medical constraints;
- Exercise Definition;
- Training Method;
- intensity method;
- readiness rules;
- combat schedule protection;
- or module rules.

Mandatory stop conditions must never be removed by a lower-priority rule.

---

# Stop Condition Priority

Stop conditions follow this order:

```text
Emergency medical
→ Pain or acute symptom
→ Safety or equipment failure
→ Technical failure
→ Method-specific quality threshold
→ Intensity threshold
→ Volume completion
```

A higher-priority trigger ends or modifies work regardless of whether the planned volume has been completed.

---

# Prescription Validation Order

Each prescription must be validated in this order:

1. identifier validity;
2. parent module validity;
3. method validity;
4. role validity;
5. exercise capability validity;
6. volume structure validity;
7. required field completeness;
8. forbidden field absence;
9. numerical validity;
10. unit validity;
11. intensity compatibility;
12. rest compatibility;
13. tempo compatibility;
14. laterality validity;
15. instruction compatibility;
16. stop-condition completeness;
17. adjustment traceability;
18. source-rule completeness;
19. Hard Constraint compliance;
20. session-duration compatibility.

The first failure may stop validation when later checks depend on earlier validity.

All detected independent failures should be recorded when possible.

---

# Prescription Completion Rule

A prescription may receive `status: "complete"` only when:

- no contextual adjustment was required;
- all fields pass validation;
- and no warning affects execution.

A prescription may receive `status: "adjusted"` only when:

- one or more documented adjustments were applied;
- the final prescription remains valid;
- and all adjustments are recorded.

`incomplete`, `invalid` and `failed` prescriptions must not appear as executable final session exercises.

---

# Prescription Failure Codes

The implementation should use finite reason codes.

Initial categories may include:

```text
PRESCRIPTION_METHOD_MISSING
PRESCRIPTION_METHOD_INCOMPATIBLE
PRESCRIPTION_ROLE_MISSING
PRESCRIPTION_CAPABILITIES_MISSING
PRESCRIPTION_VOLUME_STRUCTURE_UNSUPPORTED
PRESCRIPTION_REQUIRED_FIELD_MISSING
PRESCRIPTION_FORBIDDEN_FIELD_PRESENT
PRESCRIPTION_ATHLETE_DATA_MISSING
PRESCRIPTION_INTENSITY_UNRESOLVED
PRESCRIPTION_REST_UNRESOLVED
PRESCRIPTION_TEMPO_UNRESOLVED
PRESCRIPTION_LATERALITY_UNRESOLVED
PRESCRIPTION_STOP_CONDITION_MISSING
PRESCRIPTION_RULE_SOURCE_MISSING
PRESCRIPTION_DURATION_EXCEEDED
PRESCRIPTION_BELOW_MINIMUM_DOSE
PRESCRIPTION_HARD_CONSTRAINT_VIOLATION
PRESCRIPTION_RULE_CONFLICT
```

The final vocabulary must be centralized and tested.

---

# Recoverable Failures

A failure is recoverable only when a documented resolution path exists.

Possible recoverable actions include:

- use an alternative intensity type;
- use an alternative method;
- use an alternative compatible exercise;
- reduce volume within allowed limits;
- increase rest within allowed limits;
- or remove optional work.

The engine must not mark a failure recoverable merely because another plausible option exists.

---

# Non-Recoverable Failures

A failure is non-recoverable when:

- required safety data is missing;
- no valid method exists;
- no compatible exercise exists;
- a Hard Constraint cannot be respected;
- minimum valid dose cannot fit;
- conflicting mandatory rules cannot be resolved;
- or a required prescription field has no documented source.

A non-recoverable failure must prevent execution of the affected prescription.

---

# Substitution Interaction

Prescription failure may trigger substitution only through existing substitution rules.

The prescription engine must provide the substitution layer with:

- failed exercise identifier;
- failed method identifier;
- failure code;
- required prescription capabilities;
- prohibited characteristics;
- and source rule identifiers.

The substitute must be re-prescribed from the beginning.

Prescription values from the failed exercise must not be copied automatically to the substitute.

---

# Reconstruction Interaction

When substitution changes the exercise list, the prescription stage must operate on the reconstructed final draft.

If prescription failure triggers a new substitution, the affected section must be reconstructed and revalidated.

The engine must prevent infinite substitution loops.

The maximum number of prescription-triggered substitution attempts must be documented in implementation rules.

---

# Decision Trace Requirements

For each exercise, the Decision Trace must record:

- selected exercise;
- parent module;
- Exercise Role;
- resolved Training Method;
- method source;
- selected volume structure;
- base prescription;
- required athlete data;
- contextual adjustments;
- session-duration adjustments;
- instructions added;
- stop conditions added;
- validation result;
- final status;
- and failure reason where applicable.

The trace must show why each value exists.

---

# Trace Granularity

The trace must be detailed enough to answer:

- Why was this method selected?
- Why was this volume structure used?
- Why were these fields populated?
- Why were other fields `null`?
- Which rule generated each value?
- Which adjustment changed the base prescription?
- Why was the final prescription considered valid?
- Why did prescription generation fail?

The trace must not expose undocumented reasoning.

---

# Determinism

Given identical:

- validated input;
- selected modules;
- selected exercises;
- rule version;
- and knowledge-base version,

the prescription engine must produce identical prescriptions.

Random selection is forbidden unless a future version explicitly introduces a seeded deterministic variation mechanism.

---

# Rule Versioning

Every prescription rule set must have a version identifier.

The final engine output should record:

- Prescription Model version;
- Prescription Rules version;
- Intensity Model version;
- Rest and Tempo Rules version;
- Stop Conditions version;
- and exercise knowledge-base version.

A prescription generated under one rule version must remain auditable later.

---

# No Free-Text Rule Creation

Free-text instructions from the user may not directly create prescription rules.

They must first be:

- validated;
- normalized;
- mapped to an existing rule;
- or rejected as unsupported.

The engine must not convert a preference such as `make it hard` into an undocumented intensity increase.

---

# No Implicit Defaults

No prescription field may use an implicit default unless that default is explicitly documented.

This includes:

- sets;
- repetitions;
- duration;
- distance;
- rounds;
- intensity;
- rest;
- tempo;
- laterality;
- instructions;
- and stop conditions.

A code-level default is not sufficient documentation.

---

# Output Rule

The final prescription output must contain structured values.

Human-readable summaries may be generated after validation.

The display layer must not:

- modify values;
- add undocumented advice;
- remove stop conditions;
- hide laterality;
- or merge fields in a way that changes meaning.

---

# Initial Implementation Boundary

CAS V0.1 prescription implementation should initially support only methods for which all of the following exist:

- documented method contract;
- compatible Exercise Definitions;
- documented numerical rules;
- documented intensity rules;
- documented rest rules;
- documented tempo policy;
- documented stop conditions;
- and complete tests.

Unsupported methods must fail safely.

Partial implementation must not be presented as universal prescription support.

---

# Required Supporting Documents

The Prescription Rules depend on:

```text
24_PRESCRIPTION_MODEL.md
26_INTENSITY_MODEL.md
27_REST_TEMPO_RULES.md
28_STOP_CONDITIONS.md
29_PRESCRIPTION_TEST_CASES.md
```

The implementation must not begin until the minimum required numerical and validation rules are documented.

---

# Acceptance Criteria

The Prescription Rules V0.1 are valid only if:

- prescription remains adaptation-driven;
- method resolution is deterministic;
- every method has a contract;
- exercise-method compatibility is enforced;
- one primary volume structure is selected;
- all values originate from documented rules;
- laterality is explicit;
- readiness adjustments are bounded;
- combat schedule adjustments are traceable;
- duration conflicts follow a deterministic hierarchy;
- minimum and maximum dose boundaries are protected;
- unsupported prescriptions fail safely;
- substitution does not reuse invalid prescription values;
- every final value is explainable;
- and identical inputs produce identical prescriptions.

---

# Final Principle

> CAS must never generate a plausible prescription when it cannot generate a justified prescription.

A prescription is valid only when its structure, values, adjustments and stop conditions can all be traced to documented CAS rules.