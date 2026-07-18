# PRESCRIPTION TEST CASES

Version 0.1

---

# Purpose

The Prescription Test Cases define the minimum scenarios required to verify the behaviour of the Combat Athlete System prescription layer.

Their purpose is to ensure that the engine:

- resolves a valid Training Method;
- selects a compatible prescription structure;
- generates complete volume fields;
- selects a valid intensity representation;
- resolves rest and tempo correctly;
- attaches required instructions;
- attaches required stop conditions;
- applies contextual adjustments deterministically;
- respects medical and safety constraints;
- respects combat schedule protection;
- respects session duration;
- fails safely when required data or rules are missing;
- and produces a complete Decision Trace.

The test suite must verify both:

- successful prescription generation;
- and safe prescription failure.

A test does not pass merely because the engine returns numerical values.

A test passes only when every value is:

- structurally valid;
- compatible with the method and exercise;
- traceable to documented rules;
- safe;
- deterministic;
- and explainable.

---

# Core Principle

> The prescription layer is valid only when identical validated inputs produce identical justified prescriptions and unsupported cases fail safely.

The test suite must reject plausible-looking prescriptions that cannot be traced to documented rules.

---

# Scope

The Prescription Test Cases cover:

1. Prescription Input Validation
2. Method Resolution
3. Exercise-Method Compatibility
4. Volume Structure Resolution
5. Numerical Volume Resolution
6. Intensity Resolution
7. Athlete Reference Handling
8. Rest Resolution
9. Tempo Resolution
10. Laterality
11. Instructions
12. Stop Conditions
13. Readiness Adjustments
14. Medical and Safety Constraints
15. Combat Schedule Adjustments
16. Session Duration Resolution
17. Substitution and Reconstruction
18. Prescription Validation
19. Safe Failure
20. Decision Trace
21. Determinism
22. EngineRunResult Integration

---

# Test Suite Requirements

The prescription test suite must contain:

- unit tests for isolated resolvers;
- integration tests for complete exercise prescriptions;
- session-level integration tests;
- failure-path tests;
- regression tests;
- and determinism tests.

Tests must use explicit fixtures.

Tests must not depend on undocumented defaults.

Tests must not use random values unless a future seeded deterministic mechanism is introduced.

---

# Fixture Requirements

Prescription fixtures must define all required validated inputs.

A fixture may include:

```ts
interface PrescriptionTestFixture {
  fixtureId: string;

  engineInput: ValidatedEngineInput;
  selectedModule: SelectedModule;
  selectedExercise: SelectedExercise;
  exerciseDefinition: ExerciseDefinition;
  methodDefinition: PrescriptionMethodContract;
  athleteReferences: AthleteReferenceFixture[];
  expectedResult: ExpectedPrescriptionResult;
}
```

The exact implementation may differ, but each fixture must make its dependencies explicit.

---

# Expected Result Structure

Expected results should define:

```ts
interface ExpectedPrescriptionResult {
  status:
    | "complete"
    | "adjusted"
    | "failed";

  expectedMethodId?: string;
  expectedVolumeStructure?: VolumeStructure;
  expectedIntensityType?: IntensityType | null;
  expectedRestType?: RestType | null;
  expectedTempoType?: TempoType | null;

  expectedAdjustmentReasons?: string[];
  expectedStopConditionCategories?: string[];
  expectedFailureCode?: string;

  expectedSourceRuleIds: string[];
}
```

Tests must verify complete structured output, not only selected fields.

---

# Test Category 1 — Prescription Input Validation

## Test 1.1 — Valid Prescription Input

Given:

- a valid selected exercise;
- a valid parent module;
- a documented Training Method;
- a valid Exercise Role;
- complete exercise prescription capabilities;
- valid athlete data;
- and no Hard Constraint violation;

the engine must accept the prescription input.

Expected result:

- input validation passes;
- prescription generation begins;
- no missing-input failure is produced.

---

## Test 1.2 — Missing Selected Exercise

Given:

- a selected module;
- but no selected exercise;

the engine must reject prescription generation.

Expected result:

- status is `failed`;
- failure code identifies the missing exercise;
- no prescription object reaches final output;
- Decision Trace records the failure.

---

## Test 1.3 — Unknown Exercise Identifier

Given:

- an `exerciseId` absent from the validated knowledge base;

the engine must fail safely.

Expected result:

- no exercise is invented;
- no free-text replacement is generated;
- failure is explicit;
- source lookup failure is traceable.

---

## Test 1.4 — Missing Parent Module

Given:

- a selected exercise;
- but no valid parent `moduleId`;

the engine must reject prescription generation.

Expected result:

- status is `failed`;
- the prescription is not detached from adaptation intent;
- no fallback module is inferred.

---

## Test 1.5 — Missing Exercise Role

Given:

- a valid module;
- a valid exercise;
- a valid method;
- but no Exercise Role;

the engine must fail unless the role is resolved by an explicit upstream documented rule.

Expected result:

- no implicit role default is used;
- failure code identifies missing role when unresolved.

---

# Test Category 2 — Method Resolution

## Test 2.1 — Explicit Upstream Method

Given:

- a validated upstream `methodId`;
- a compatible module;
- a compatible exercise;

the engine must preserve the selected method.

Expected result:

- the same `methodId` appears in the final prescription;
- method source is recorded;
- no fallback is used.

---

## Test 2.2 — Module-Required Method

Given:

- no explicit upstream method;
- a module with one documented required method;
- a compatible exercise;

the engine must resolve that method.

Expected result:

- method is selected deterministically;
- source rule is attached;
- method contract is loaded.

---

## Test 2.3 — Documented Default Method

Given:

- no explicit method;
- no module-required method;
- one documented module default;
- a compatible Exercise Role and exercise;

the engine must use the documented default.

Expected result:

- fallback is traceable;
- no invented method is created.

---

## Test 2.4 — Multiple Methods Without Resolution Rule

Given:

- multiple allowed methods;
- no priority rule;
- no deterministic selection rule;

the engine must fail safely.

Expected result:

- no random method is selected;
- failure code identifies unresolved method selection.

---

## Test 2.5 — Missing Method Contract

Given:

- a resolved `methodId`;
- but no method contract;

the engine must fail.

Expected result:

- no prescription fields are generated from assumptions;
- failure code is `PRESCRIPTION_METHOD_MISSING` or equivalent.

---

# Test Category 3 — Exercise-Method Compatibility

## Test 3.1 — Compatible Method and Exercise

Given:

- a method requiring `sets_reps`;
- an exercise supporting `sets_reps`;
- compatible intensity and tempo capabilities;

the engine must continue.

Expected result:

- compatibility validation passes;
- required fields are resolved.

---

## Test 3.2 — Unsupported Volume Structure

Given:

- a round-based method;
- an exercise that does not support rounds;

the engine must reject the combination.

Expected result:

- failure code identifies unsupported volume structure;
- no round prescription is fabricated.

---

## Test 3.3 — Unsupported Intensity Type

Given:

- a method requiring `percentage_1rm`;
- an exercise that does not support relative external load;

the engine must reject the combination or use a documented alternative.

Expected result:

- only documented recovery path is allowed;
- otherwise status is `failed`.

---

## Test 3.4 — Required Tempo Unsupported

Given:

- a method requiring phase-timed tempo;
- an exercise with `supportsTempo: false`;

the engine must fail or use a documented compatible substitute.

Expected result:

- tempo is not silently set to `null`;
- incompatibility appears in the trace.

---

## Test 3.5 — Forbidden Field Present

Given:

- a continuous-duration method;
- a generated prescription containing sets and repetitions;

validation must fail.

Expected result:

- forbidden fields are detected;
- the invalid prescription does not reach final output.

---

# Test Category 4 — Volume Structure Resolution

## Test 4.1 — Sets and Repetitions

Given:

- a compatible repetition-based method;
- a compatible exercise;

the engine must generate:

- `structure: "sets_reps"`;
- non-null sets;
- non-null repetitions;
- null duration;
- null distance;
- null rounds;
- null intervals unless explicitly supported.

---

## Test 4.2 — Sets and Duration

Given:

- a timed-hold method;
- a compatible isometric exercise;

the engine must generate:

- `structure: "sets_duration"`;
- non-null sets;
- non-null duration;
- null repetitions;
- null distance;
- null rounds.

---

## Test 4.3 — Sets and Distance

Given:

- a loaded-carry method;
- a compatible carry exercise;

the engine must generate:

- `structure: "sets_distance"`;
- non-null sets;
- non-null distance;
- applicable intensity;
- explicit laterality when required.

---

## Test 4.4 — Rounds and Duration

Given:

- a documented bag-work method;
- a compatible bag exercise;

the engine must generate:

- `structure: "rounds_duration"`;
- non-null rounds;
- duration per round;
- rest between rounds;
- technical or effort instructions;
- stop conditions.

---

## Test 4.5 — Intervals

Given:

- a documented interval method;
- a compatible exercise;

the engine must generate:

- interval count;
- work target;
- recovery target;
- applicable intensity;
- stop conditions.

Sets must not be used as a hidden synonym for intervals.

---

## Test 4.6 — Continuous Duration

Given:

- a continuous-duration method;

the engine must generate:

- total duration;
- null sets;
- null reps;
- null rounds;
- null intervals.

---

## Test 4.7 — Continuous Distance

Given:

- a continuous-distance method;

the engine must generate:

- total distance;
- null sets;
- null reps;
- null rounds;
- null intervals.

---

# Test Category 5 — Numerical Volume Resolution

## Test 5.1 — Fixed Set Value

Given:

- a rule defining an exact set value;

the engine must return that exact value.

Expected result:

- value is traceable to the rule;
- no range is introduced.

---

## Test 5.2 — Fixed Repetition Value

Given:

- a rule defining an exact repetition value;

the engine must generate a fixed repetition target.

Expected result:

- `type: "fixed"`;
- `value` populated;
- `min` and `max` null.

---

## Test 5.3 — Repetition Range

Given:

- a documented range;
- a deterministic selection rule;

the engine must generate a valid ranged target or resolve a deterministic fixed value according to the schema.

Expected result:

- boundaries are valid;
- selection rule is traceable.

---

## Test 5.4 — Range Without Selection Logic

Given:

- a numerical range;
- no documented method for selecting or using a value inside it;

the engine must fail.

Expected result:

- no random value is selected.

---

## Test 5.5 — Zero Work Quantity

Given:

- a generated value of zero sets, reps, duration, distance, rounds or intervals;

validation must fail.

---

## Test 5.6 — Negative Work Quantity

Given:

- any negative work quantity;

validation must fail.

---

## Test 5.7 — Fractional Set Count

Given:

- a set count with a non-integer value;

validation must fail unless a future schema explicitly supports it.

---

## Test 5.8 — Inverted Range

Given:

- minimum greater than maximum;

validation must fail.

---

# Test Category 6 — Intensity Resolution

## Test 6.1 — Percentage 1RM

Given:

- a method requiring percentage of one-repetition maximum;
- a compatible exercise;
- a valid reference;
- a documented percentage;
- a documented rounding rule;

the engine must calculate the prescribed load deterministically.

Expected result:

- reference is attached;
- formula is attached;
- raw result is recorded;
- rounded result is valid;
- final load is available in the equipment context.

---

## Test 6.2 — RPE-Based Intensity

Given:

- a method permitting RPE;
- a documented RPE target;

the engine must generate:

- `type: "rpe"`;
- valid scale unit;
- valid target;
- compatible stop condition where required.

---

## Test 6.3 — RIR-Based Intensity

Given:

- a method permitting RIR;
- a defined endpoint;
- a documented target;

the engine must generate a valid RIR metric.

Expected result:

- RIR is non-negative;
- endpoint definition is traceable.

---

## Test 6.4 — Movement Intent

Given:

- a ballistic or explosive method;
- a compatible exercise;
- a documented intent category;

the engine must generate qualitative movement intent.

Expected result:

- no measured velocity is invented;
- category belongs to the finite vocabulary.

---

## Test 6.5 — Technical Effort

Given:

- a technical exercise;
- a documented technical-effort category;

the engine must preserve technical quality as the governing metric.

---

## Test 6.6 — Heart-Rate Intensity

Given:

- a heart-rate-based method;
- valid measurement capability;
- valid reference;
- documented target;

the engine must generate a valid heart-rate target.

---

## Test 6.7 — Null Intensity When Explicitly Allowed

Given:

- a method contract where intensity is not required;

the engine may return `intensity: null`.

Expected result:

- null is explicit;
- no intensity failure is hidden;
- method contract justifies the null.

---

## Test 6.8 — Missing Required Intensity

Given:

- a method requiring intensity;
- no valid intensity value;

the engine must fail.

---

# Test Category 7 — Athlete Reference Handling

## Test 7.1 — Valid Direct Reference

Given:

- a recent validated direct measurement;

the engine must use it according to priority rules.

---

## Test 7.2 — Valid Estimated Reference

Given:

- no direct measurement;
- a documented estimated reference;
- a method permitting estimated values;

the engine may use the estimate.

Expected result:

- estimation formula and confidence are recorded.

---

## Test 7.3 — Missing Required Reference

Given:

- percentage-based intensity required;
- no valid reference;
- no documented alternative;

the engine must fail safely.

---

## Test 7.4 — Expired Reference

Given:

- an athlete reference outside its validity window;

the engine must reject it.

Expected result:

- no outdated value is silently reused.

---

## Test 7.5 — Wrong Exercise Reference

Given:

- a one-repetition maximum for a different exercise;
- no documented equivalence rule;

the engine must reject the reference.

---

## Test 7.6 — Missing Body Mass

Given:

- percentage-of-body-mass loading required;
- no validated body mass;

the engine must use a documented alternative or fail.

---

## Test 7.7 — Undocumented Maximum Heart-Rate Estimate

Given:

- no measured maximum heart rate;
- only athlete age;
- no documented formula;

the engine must not estimate maximum heart rate.

---

# Test Category 8 — Rest Resolution

## Test 8.1 — Fixed Rest

Given:

- a method requiring fixed rest;
- a documented duration;

the engine must generate the exact rest target and scope.

---

## Test 8.2 — Rest Range

Given:

- a documented minimum and maximum;
- a documented selection rule;

the engine must generate a valid ranged rest target.

---

## Test 8.3 — Conditional Rest

Given:

- a documented observable recovery condition;

the engine must generate conditional rest with the correct condition identifier.

---

## Test 8.4 — Vague Conditional Rest

Given:

- a condition equivalent to `rest until ready`;
- no operational definition;

the engine must fail validation.

---

## Test 8.5 — Missing Required Rest

Given:

- a method requiring between-set rest;
- no resolved value;

the prescription must fail.

---

## Test 8.6 — Rest Below Minimum

Given:

- a session-duration adjustment that reduces rest below the documented minimum;

the adjustment must be rejected.

---

## Test 8.7 — Rest and Intensity Conflict

Given:

- high intensity;
- rest incompatible with the documented minimum;

the engine must resolve the conflict or fail.

---

## Test 8.8 — Rest Null When Not Required

Given:

- a method where formal rest is not applicable;

the engine may return `rest: null`.

---

# Test Category 9 — Tempo Resolution

## Test 9.1 — Phase-Timed Tempo

Given:

- a method requiring phase timing;
- an exercise supporting tempo;
- documented phase values;

the engine must generate a valid phase structure.

---

## Test 9.2 — Global Explosive Intent

Given:

- a ballistic method;
- a compatible exercise;
- documented explosive intent;

the engine must use global intent rather than inventing phase timing.

---

## Test 9.3 — Isometric Hold

Given:

- a timed isometric method;

the engine must represent duration without semantically duplicating the same value in incompatible fields.

---

## Test 9.4 — Tempo Forbidden

Given:

- a method forbidding tempo;
- a generated non-null tempo;

validation must fail.

---

## Test 9.5 — Tempo Required but Missing

Given:

- a method requiring tempo;
- no resolved tempo;

the prescription must fail.

---

## Test 9.6 — Tempo and Intensity Conflict

Given:

- maximal acceleration intent;
- slow timed concentric phase;

the engine must detect the contradiction.

---

## Test 9.7 — Tempo Duration Integration

Given:

- explicit timed phases;
- a repetition count;

the session-duration estimate must account for the documented tempo.

---

# Test Category 10 — Laterality

## Test 10.1 — Repetitions Per Side

Given:

- a unilateral exercise;
- a per-side rule;

the prescription must explicitly mark repetitions as per side.

---

## Test 10.2 — Alternating Total Repetitions

Given:

- an alternating exercise;
- total repetition rule;

the engine must distinguish total repetitions from repetitions per side.

---

## Test 10.3 — Unresolved Laterality

Given:

- a unilateral exercise;
- no laterality rule;

the engine must fail.

---

## Test 10.4 — Duration Estimate for Both Sides

Given:

- per-side execution;

session-duration estimation must account for work on both sides.

---

# Test Category 11 — Instructions

## Test 11.1 — Required Safety Instruction

Given:

- an exercise with a mandatory safety instruction;

the final prescription must include it.

---

## Test 11.2 — Method Intent Instruction

Given:

- a method requiring a documented technical intent;

the final instruction list must include it.

---

## Test 11.3 — Duplicate Instruction

Given:

- equivalent instructions from method and exercise rules;

the engine must deduplicate them while preserving source rule identifiers.

---

## Test 11.4 — Conflicting Instructions

Given:

- two mandatory incompatible instructions;

the engine must resolve by priority or fail.

---

## Test 11.5 — Generic Invented Instruction

Given:

- no documented instruction rule;

the engine must not add generic coaching text merely to populate the field.

---

# Test Category 12 — Stop Conditions

## Test 12.1 — Planned Completion Condition

Given:

- a valid sets-and-repetitions prescription;

the engine must include or structurally represent normal completion.

---

## Test 12.2 — Technical Failure Condition

Given:

- a method requiring termination on technical failure;

the condition must include:

- observable trigger;
- scope;
- action;
- priority;
- source rule.

---

## Test 12.3 — Pain Condition

Given:

- a standard non-clinical exercise prescription;

pain must trigger the documented modification or termination action.

Expected result:

- pain overrides planned completion.

---

## Test 12.4 — Medical Condition

Given:

- a validated athlete medical constraint;

the inherited stop condition must be present and retain highest priority.

---

## Test 12.5 — Velocity-Loss Condition

Given:

- a velocity-based method;
- valid measurement equipment;
- a documented threshold;

the engine must generate a measurable velocity-loss condition.

---

## Test 12.6 — Velocity Condition Without Equipment

Given:

- velocity threshold required;
- no measurement capability;
- no documented proxy;

the prescription must fail or use a documented alternative method.

---

## Test 12.7 — Vague Stop Condition

Given:

- an instruction equivalent to `stop when tired`;

validation must fail.

---

## Test 12.8 — Unsupported Stop Action

Given:

- a stop action the engine cannot execute or communicate;

validation must fail.

---

## Test 12.9 — Stop Condition Deduplication

Given:

- equivalent stop conditions from multiple sources;

the engine must preserve the strictest compatible condition and all sources.

---

## Test 12.10 — Stop Condition Conflict

Given:

- one rule permits continuation;
- a higher-priority medical rule requires termination;

the medical rule must win.

---

# Test Category 13 — Readiness Adjustments

## Test 13.1 — Normal Readiness

Given:

- normal readiness;
- no adjustment trigger;

the base prescription must remain unchanged.

Expected result:

- status is `complete`;
- no adjustment is recorded.

---

## Test 13.2 — Low Readiness Volume Reduction

Given:

- a documented low-readiness rule;
- a permitted volume adjustment;

the engine must apply the exact documented adjustment.

Expected result:

- status is `adjusted`;
- previous and adjusted values are recorded.

---

## Test 13.3 — Low Readiness Intensity Reduction

Given:

- a documented intensity reduction rule;

the engine must reduce intensity within valid boundaries.

---

## Test 13.4 — Adjustment Below Minimum Dose

Given:

- a readiness adjustment that would reduce work below the method minimum;

the engine must reject the adjusted prescription and use a documented alternative or fail.

---

## Test 13.5 — High Readiness Without Progression Rule

Given:

- high readiness;
- no progression rule;

the engine must not increase intensity or volume.

---

## Test 13.6 — Arbitrary Readiness Percentage

Given:

- a readiness state;
- no documented numerical adjustment;

the engine must not invent a percentage reduction.

---

# Test Category 14 — Medical and Safety Constraints

## Test 14.1 — Medical Exercise Prohibition

Given:

- a medical rule prohibiting the selected exercise;

the prescription must not be generated.

Expected result:

- substitution or failure follows documented rules.

---

## Test 14.2 — Medical Intensity Cap

Given:

- a medical cap lower than the base intensity;

the cap must override the base prescription.

---

## Test 14.3 — Medical Rest Requirement

Given:

- a medical rule requiring longer or conditional rest;

the final rest prescription must respect it.

---

## Test 14.4 — Medical Stop Condition Preservation

Given:

- a mandatory medical stop condition;
- a lower-priority method rule;

the medical condition must remain unchanged.

---

## Test 14.5 — Safety Constraint Conflict

Given:

- the session objective requests a prescription incompatible with a safety constraint;

safety must win.

---

# Test Category 15 — Combat Schedule Adjustments

## Test 15.1 — No Combat Conflict

Given:

- no protected combat session conflict;

the base prescription must remain unchanged.

---

## Test 15.2 — Documented Combat Conflict

Given:

- a validated combat schedule conflict;
- a documented adjustment rule;

the engine must apply the exact adjustment.

---

## Test 15.3 — Protected Combat Session

Given:

- a CAS prescription that would compromise a protected combat session;

the engine must preserve the combat session according to the priority hierarchy.

---

## Test 15.4 — No Free-Text Interpretation

Given:

- raw combat schedule text not normalized upstream;

the prescription layer must not invent a conflict interpretation.

---

## Test 15.5 — Adjustment Removes Module Purpose

Given:

- a combat-schedule adjustment that would invalidate the module objective;

the engine must use a documented substitute, remove the module if permitted, or fail.

---

# Test Category 16 — Session Duration Resolution

## Test 16.1 — Prescription Fits Duration

Given:

- total estimated duration within the allowed session duration;

no duration adjustment must occur.

---

## Test 16.2 — Accessory Reduction

Given:

- a session exceeding duration;
- documented accessory-volume reduction available;

the engine must reduce accessory work before primary work.

---

## Test 16.3 — Optional Exercise Removal

Given:

- an optional exercise;
- a duration conflict;

the optional exercise may be removed according to rule priority.

---

## Test 16.4 — Rest Protection

Given:

- a duration conflict;
- quality-preserving rest already at its minimum;

the engine must not shorten rest further.

---

## Test 16.5 — Tempo-Aware Duration

Given:

- explicit tempo;
- unilateral work;
- multiple sets;

the duration estimate must include:

- work time;
- both sides;
- rest;
- transitions;
- documented overhead.

---

## Test 16.6 — Minimum Effective Dose Violation

Given:

- duration reduction would move a method below its minimum valid dose;

the reduction must be rejected.

---

## Test 16.7 — Duration Cannot Be Resolved

Given:

- no optional work;
- no valid reduction;
- no valid substitute;
- session still exceeds allowed duration;

the engine must fail safely.

---

# Test Category 17 — Substitution and Reconstruction

## Test 17.1 — Prescription-Triggered Substitution

Given:

- selected exercise incompatible with required method;
- documented substitute exists;

the engine must request substitution.

Expected result:

- substitute is selected;
- session section is reconstructed;
- substitute is prescribed from the beginning.

---

## Test 17.2 — No Value Copying

Given:

- a failed exercise replaced by another exercise;

the old prescription values must not be copied automatically.

---

## Test 17.3 — Substitute Still Invalid

Given:

- first substitute also incompatible;

the engine must follow the documented attempt limit and fail safely if unresolved.

---

## Test 17.4 — Infinite Loop Prevention

Given:

- cyclic substitution relationships;

the engine must stop after the documented maximum number of attempts.

---

# Test Category 18 — Prescription Validation

## Test 18.1 — Complete Prescription

Given:

- all required fields present;
- all compatibility checks passed;
- all sources attached;

status must be `complete` or `adjusted`.

---

## Test 18.2 — Missing Required Field

Given:

- a method-required field absent;

validation must fail.

---

## Test 18.3 — Invalid Unit

Given:

- a valid value with an unsupported or incompatible unit;

validation must fail.

---

## Test 18.4 — Missing Source Rule

Given:

- one generated field without a source rule;

validation must fail.

---

## Test 18.5 — Hard Constraint Violation

Given:

- a structurally complete prescription violating a Hard Constraint;

validation must fail.

---

## Test 18.6 — Incomplete Prescription in Final Output

Given:

- status `incomplete`;

the engine must prevent the prescription from entering final executable session output.

---

# Test Category 19 — Safe Failure

## Test 19.1 — No Numerical Rule

Given:

- valid method and exercise;
- no documented numerical volume rule;

the engine must fail rather than invent values.

---

## Test 19.2 — No Intensity Rule

Given:

- intensity required;
- no documented intensity target;

the engine must fail.

---

## Test 19.3 — No Rest Rule

Given:

- rest required;
- no documented rest target;

the engine must fail.

---

## Test 19.4 — No Tempo Rule

Given:

- tempo required;
- no documented tempo target;

the engine must fail.

---

## Test 19.5 — No Required Stop Rule

Given:

- a method or exercise requiring a stop condition;
- no documented condition;

the engine must fail.

---

## Test 19.6 — Unsupported Plausible Prescription

Given:

- a common exercise;
- a familiar but undocumented set and repetition scheme;

the engine must not use that scheme.

---

## Test 19.7 — Failure Structure

Every prescription failure must include:

- prescription identifier;
- exercise identifier;
- failure code;
- message;
- source rule identifiers where applicable;
- recoverability;
- and trace entry.

---

# Test Category 20 — Decision Trace

## Test 20.1 — Complete Successful Trace

For a successful prescription, the trace must include:

- module;
- method;
- role;
- volume structure;
- base values;
- intensity source;
- athlete reference;
- rest;
- tempo;
- instructions;
- stop conditions;
- adjustments;
- validation outcome;
- final prescription.

---

## Test 20.2 — Adjusted Prescription Trace

For an adjusted prescription, the trace must include:

- previous values;
- adjusted values;
- adjustment reason;
- source rule;
- priority;
- final validation result.

---

## Test 20.3 — Failed Prescription Trace

For a failed prescription, the trace must include:

- stage of failure;
- failure code;
- failed compatibility or missing rule;
- attempted recovery;
- final recoverability status.

---

## Test 20.4 — Trace Explains Null Fields

The trace must explain why intensity, rest or tempo is `null` when null is valid.

---

## Test 20.5 — Trace Does Not Expose Undocumented Reasoning

The trace must contain documented engine decisions only.

---

# Test Category 21 — Determinism

## Test 21.1 — Identical Inputs

Given identical:

- validated engine input;
- selected module;
- selected exercise;
- method;
- rule version;
- knowledge-base version;

two runs must produce deeply equal prescription results.

---

## Test 21.2 — Range Determinism

Given a documented range and deterministic selection rule;

repeated runs must resolve the same result.

---

## Test 21.3 — Rounding Determinism

Given the same raw load and equipment availability;

repeated runs must return the same rounded load.

---

## Test 21.4 — Adjustment Determinism

Given the same readiness and combat schedule context;

repeated runs must apply the same adjustments.

---

## Test 21.5 — No Random Fallback

Given multiple possible but unranked alternatives;

the engine must fail rather than choose randomly.

---

# Test Category 22 — EngineRunResult Integration

## Test 22.1 — Prescriptions Attached to Final Exercises

Given a successful full engine run;

each final executable exercise must contain a complete prescription.

---

## Test 22.2 — Existing Selection Preserved

The prescription layer must not alter a valid selected exercise unless a documented prescription incompatibility triggers substitution.

---

## Test 22.3 — Decision Trace Extended

The existing Decision Trace must remain valid and include prescription-stage entries.

---

## Test 22.4 — Failed Prescription Prevents Executable Output

A failed required prescription must prevent the engine from returning an apparently executable complete session.

---

## Test 22.5 — Output Schema Validation

The final `EngineRunResult` must pass the updated output schema.

---

# Minimum V0.1 Prescription Integration Suite

Before prescription implementation is considered valid, the integration suite must contain at least the following representative scenarios:

1. valid sets-and-repetitions prescription;
2. valid timed prescription;
3. valid distance-based carry prescription;
4. valid round-based combat prescription;
5. valid interval prescription;
6. valid percentage-based intensity calculation;
7. valid RPE or RIR prescription;
8. valid qualitative explosive intent;
9. required rest generation;
10. required tempo generation;
11. unilateral laterality handling;
12. mandatory technical stop condition;
13. readiness-adjusted prescription;
14. combat-schedule-adjusted prescription;
15. session-duration adjustment;
16. missing athlete-reference failure;
17. exercise-method incompatibility failure;
18. missing numerical-rule failure;
19. substitution and reconstruction;
20. deterministic repeated run.

The exact number of tests may exceed twenty because each scenario may require multiple assertions and failure variants.

---

# Required Assertions for Every Successful Prescription

Every successful prescription test must verify:

- `prescriptionId` exists;
- `exerciseId` matches;
- `moduleId` matches;
- `methodId` matches;
- Exercise Role is valid;
- volume structure is valid;
- required volume fields are populated;
- forbidden fields are null or absent according to schema;
- intensity is valid or explicitly null;
- rest is valid or explicitly null;
- tempo is valid or explicitly null;
- laterality is explicit where required;
- instructions are structured;
- stop conditions are structured;
- source rule identifiers are present;
- status is valid;
- Decision Trace entry exists;
- no Hard Constraint is violated.

---

# Required Assertions for Every Failed Prescription

Every failed prescription test must verify:

- status is `failed`;
- failure code is finite and expected;
- no unsupported values are returned;
- no executable prescription enters final output;
- recoverability is explicit;
- attempted fallback is documented when applicable;
- Decision Trace records the failure;
- identical reruns produce the same failure.

---

# Regression Testing

Every prescription bug discovered after implementation must produce:

1. a failing regression test;
2. the smallest valid fixture reproducing the issue;
3. a documented expected behaviour;
4. a code fix;
5. a passing regression test.

No prescription bug should be fixed without a corresponding test.

---

# Property-Based Validation

Property-based tests may later verify invariants such as:

- work quantities are always greater than zero;
- range minimum never exceeds maximum;
- required fields are never null;
- forbidden fields are never populated;
- percentages always identify their reference;
- status `complete` never contains validation errors;
- failed prescriptions never enter executable output;
- all generated values contain source rules;
- and repeated identical inputs remain deterministic.

Property-based testing must not replace representative scenario tests.

---

# Snapshot Testing

Snapshot tests may be used for:

- final prescription objects;
- Decision Trace structures;
- or full `EngineRunResult` fixtures.

Snapshots must not be the only assertions.

Critical semantic fields must be asserted directly.

---

# Test Data Isolation

Prescription tests must use isolated fixtures.

They must not depend on:

- the order of unrelated knowledge-base entries;
- mutable global state;
- current date unless explicitly fixed;
- external services;
- network access;
- or nondeterministic identifiers.

Generated identifiers must be deterministic in tests or normalized before comparison.

---

# Version Testing

Tests must record the rule versions used.

When a prescription rule version changes:

- expected outputs must be reviewed;
- changed behaviour must be intentional;
- regression implications must be documented;
- and old fixtures may be preserved for compatibility tests.

---

# Acceptance Criteria

The Prescription Test Cases V0.1 are complete only if they verify that:

- method resolution is deterministic;
- exercise-method compatibility is enforced;
- volume structures are valid;
- numerical values are documented;
- athlete references are validated;
- intensity selection is compatible;
- rest is explicit when required;
- tempo is explicit when required;
- laterality is unambiguous;
- instructions are traceable;
- stop conditions are operational;
- readiness adjustments are bounded;
- medical and safety rules have priority;
- combat schedule is protected;
- duration resolution is deterministic;
- substitution restarts prescription correctly;
- unsupported cases fail safely;
- Decision Trace is complete;
- identical inputs produce identical outputs;
- and final prescriptions integrate correctly into `EngineRunResult`.

---

# Final Principle

> A prescription test passes only when the engine proves not only what it prescribed, but why that prescription is valid.

The prescription layer must be tested as a deterministic decision system, not as a text generator.