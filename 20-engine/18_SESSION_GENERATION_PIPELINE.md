# SESSION GENERATION PIPELINE

Version 0.1

---

# Purpose

The Session Generation Pipeline defines the complete decision sequence used by the Combat Athlete System to generate a training session.

Its purpose is to transform:

* athlete data;
* training objectives;
* current athlete state;
* medical and practical constraints;
* available equipment;
* recent training history;
* Training Cycle priorities;
* combat-practice demands;
* available session duration

into a structured, safe, explainable and physiologically coherent training session.

The pipeline does not begin by choosing exercises from a general exercise list.

It progressively narrows the decision space through:

1. input validation;
2. athlete-state evaluation;
3. constraint extraction;
4. objective interpretation;
5. adaptation prioritization;
6. Capability Module selection;
7. module compatibility analysis;
8. exercise candidate retrieval;
9. eligibility filtering;
10. candidate scoring;
11. conflict detection;
12. conflict resolution;
13. session assembly;
14. prescription generation;
15. load and duration estimation;
16. final validation;
17. Decision Trace generation.

The fundamental principle is:

> Every generated session must be the visible result of an explicit and traceable decision process.

---

# Core Principle

The Session Generation Pipeline follows one immutable rule:

> Determine the required adaptation first, determine the appropriate training module second, and select exercises only after both decisions have been made.

The pipeline must never begin with exercise selection.

Exercises are implementation methods.

Capability Modules are reusable training blocks.

Adaptations are the objective.

---

# Architectural Sequence

The CAS decision architecture is:

```text
Adaptation Domains
        ↓
Training Cycle Priorities
        ↓
Session Objective
        ↓
Capability Module Selection
        ↓
Exercise Selection
        ↓
Prescription
        ↓
Validation
        ↓
Generated Session
```

The direction must not be reversed.

Available exercises may constrain implementation.

They must not determine the athlete's physiological objective.

---

# Pipeline Overview

The complete session-generation sequence is:

```text
Athlete Profile
        ↓
Training Request
        ↓
Input Validation
        ↓
Athlete State Evaluation
        ↓
Constraint Extraction
        ↓
Objective Interpretation
        ↓
Adaptation Priority Calculation
        ↓
Capability Module Selection
        ↓
Module Compatibility Check
        ↓
Exercise Candidate Retrieval
        ↓
Exercise Eligibility Filtering
        ↓
Exercise Scoring
        ↓
Initial Candidate Selection
        ↓
Conflict Detection
        ↓
Conflict Resolution
        ↓
Session Assembly
        ↓
Prescription Generation
        ↓
Load and Duration Estimation
        ↓
Final Session Validation
        ↓
Decision Trace Generation
        ↓
Generated Training Session
```

Each stage must return structured output.

Each stage must also be capable of returning:

* success;
* warning;
* recoverable failure;
* blocking failure.

---

# Stage 1 — Receive Athlete Profile

The pipeline receives a structured Athlete Profile.

The profile may include:

* athlete identifier;
* age;
* sex when relevant to the decision;
* body mass;
* height;
* combat discipline;
* combat level;
* physical-training age;
* technical competence;
* current Training Cycle;
* long-term objectives;
* injury history;
* medical restrictions;
* recurring pain areas;
* equipment access;
* training environment;
* weekly availability;
* specific-practice schedule;
* competition schedule;
* exercise history;
* progression history;
* athlete preferences.

The Athlete Profile represents relatively stable information.

Temporary information belongs to Athlete State.

---

# Stage 2 — Receive Training Request

The Training Request describes the session the system is being asked to generate.

It may include:

* requested date;
* available duration;
* primary objective;
* secondary objectives;
* requested session type;
* preferred environment;
* available equipment;
* requested body region;
* requested Capability Module;
* desired intensity;
* competition proximity;
* next combat session;
* coach instructions;
* user preferences.

The Training Request does not automatically become the final session objective.

It must first be interpreted and checked against:

* athlete state;
* Training Cycle priorities;
* safety constraints;
* recovery capacity;
* recent training exposure.

---

# Stage 3 — Input Validation

The engine validates the Athlete Profile and Training Request before making training decisions.

Validation must verify:

* required fields are present;
* values use valid formats;
* values fall within accepted ranges;
* referenced identifiers exist;
* dates and durations are coherent;
* equipment values are recognized;
* objectives are interpretable;
* medical restrictions are represented explicitly;
* contradictory inputs are identified;
* critical safety information is available.

Possible results are:

```text
VALID
VALID_WITH_WARNINGS
INVALID
```

An invalid input must not proceed silently.

Examples of blocking input failures include:

* missing session duration;
* unknown athlete identifier;
* invalid objective identifier;
* impossible date values;
* contradictory medical restrictions;
* missing critical pain information for a high-risk request.

Detailed input rules are defined in:

`19_ENGINE_INPUT_SCHEMA.md`

---

# Stage 4 — Athlete State Evaluation

The engine evaluates the athlete's current state.

Athlete State may include:

* sleep;
* general energy;
* motivation;
* psychological stress;
* muscular soreness;
* joint symptoms;
* pain;
* recent illness;
* resting heart rate;
* recent training load;
* recent combat load;
* previous-session response;
* perceived readiness;
* local body-region readiness;
* competition-related fatigue.

The engine should distinguish between:

* general readiness;
* neural readiness;
* muscular readiness;
* connective-tissue readiness;
* metabolic readiness;
* region-specific readiness.

A single global readiness score must not conceal meaningful local limitations.

For example:

* general energy may be good while shoulder readiness is poor;
* metabolic readiness may be acceptable while neural readiness is low;
* lower-body readiness may be high while grip readiness is poor.

The Athlete State Evaluation may:

* preserve the requested objective;
* reduce the planned demand;
* change module priority;
* remove high-risk candidates;
* trigger a recovery-oriented session;
* block session generation.

---

# Stage 5 — Constraint Extraction

The engine converts profile, request and state information into explicit constraints.

Constraints may include:

* medical restrictions;
* pain restrictions;
* prohibited movements;
* required regressions;
* unavailable equipment;
* environmental limitations;
* time limits;
* technical-level limits;
* supervision limits;
* recovery limits;
* upcoming combat-practice constraints;
* competition constraints;
* body-mass constraints;
* exercise-exposure limits.

Constraints are classified as:

```text
HARD
SOFT
```

Hard Constraints cannot be violated.

Soft Constraints may influence:

* scoring;
* module selection;
* exercise selection;
* volume;
* intensity;
* order;
* substitutions.

Example:

```text
constraint:
  type: equipment
  value: no_pull_up_bar
  severity: HARD
```

Example:

```text
constraint:
  type: shoulder_soreness
  value: moderate
  severity: SOFT
```

A soft constraint may become hard when:

* symptoms worsen;
* technique changes;
* safety is compromised;
* a medical rule applies.

---

# Stage 6 — Objective Interpretation

The engine translates the Training Request into a precise physical objective.

A request may initially be expressed as:

* strike harder;
* become more explosive;
* improve conditioning;
* become stronger;
* reduce injury risk;
* prepare for a fight;
* improve movement;
* recover.

The engine must convert this request into:

* performance outcome;
* primary Adaptation Domain;
* relevant secondary Adaptation Domains;
* supported physical capabilities;
* measurable training objective;
* non-objectives.

Example:

```text
requested_goal:
  strike_harder
```

May be interpreted as:

```text
performance_outcome:
  improve_striking_force_expression

primary_adaptation:
  Power

secondary_adaptations:
  - Maximum Strength
  - Movement

supported_capabilities:
  - transmit_force
  - rotate
  - accelerate
  - maintain_balance
```

Specific Skill must remain external to the physical preparation engine.

The engine may support physical qualities relevant to striking.

It must not claim to replace striking instruction.

---

# Stage 7 — Adaptation Priority Calculation

The engine ranks the adaptations relevant to the current session.

Each adaptation may receive a role:

```text
PRIMARY
SECONDARY
MAINTENANCE
SUPPORT
EXCLUDED
```

The calculation may consider:

* Training Cycle priorities;
* current deficits;
* athlete state;
* recent exposure;
* recovery capacity;
* available time;
* combat-practice schedule;
* competition proximity;
* long-term objectives.

Every session must have exactly one primary adaptation.

Secondary adaptations may be included only when they do not compromise the primary adaptation.

Example:

```text
adaptation_priorities:
  - adaptation: Power
    role: PRIMARY

  - adaptation: Maximum Strength
    role: SECONDARY

  - adaptation: Movement
    role: SUPPORT

  - adaptation: Functional Hypertrophy
    role: EXCLUDED
```

The calculation must not assign development-level priority to every adaptation simultaneously.

---

# Stage 8 — Capability Module Selection

The engine selects Capability Modules capable of operationalizing the prioritized adaptations.

Only modules from the canonical catalog may be selected:

1. Preparation
2. Movement
3. Power
4. Strength
5. Functional Hypertrophy
6. Robustness
7. Grip
8. Core
9. Conditioning
10. Recovery

Modules must not be invented dynamically for individual sessions.

For example:

```text
ballistic_rotational_power
```

is not a Capability Module.

It may describe a Power-module implementation, but the selected module remains:

```text
Power
```

Likewise:

```text
trunk_stiffness
```

may describe the purpose of an exercise inside the Core module.

It is not a new canonical module.

Each selected module must include:

* module identifier;
* role;
* primary adaptation;
* purpose within the session;
* expected cost;
* selection reason;
* omission consequences;
* required duration range.

Example:

```text
selected_modules:
  - module: Preparation
    role: SUPPORT

  - module: Power
    role: PRIMARY

  - module: Strength
    role: SECONDARY

  - module: Core
    role: SUPPORT

  - module: Recovery
    role: SUPPORT
```

Module selection uses the Module Priority Score defined in:

`16_SCORING_MODEL.md`

---

# Stage 9 — Module Compatibility Check

The engine evaluates whether selected modules can coexist within:

* the same session;
* the available duration;
* the athlete's fatigue budget;
* the current microcycle;
* the specific-practice schedule.

The check must consider:

* canonical module order;
* neural demand;
* muscular fatigue;
* connective-tissue stress;
* metabolic fatigue;
* redundancy;
* interaction cost;
* competition proximity;
* combat-practice interference.

Possible results include:

```text
COMPATIBLE
COMPATIBLE_WITH_ADJUSTMENT
INCOMPATIBLE
```

When modules are incompatible, the engine may:

* remove a lower-priority module;
* reduce the role of a module;
* change a development module to maintenance;
* reduce module duration;
* move a module to another session;
* change the session objective.

The engine must not retrieve exercises for an unresolved incompatible module structure.

Detailed rules are defined in:

`17_CONFLICT_RULES.md`

---

# Stage 10 — Exercise Candidate Retrieval

Once modules are selected and compatible, the engine retrieves possible exercise implementations.

Candidates must come from the validated Exercise Library.

Retrieval filters may include:

* selected Capability Module;
* primary adaptation;
* supported capability;
* movement function;
* force direction;
* contraction profile;
* velocity profile;
* athlete level;
* equipment;
* environment;
* pain restrictions;
* injury history;
* supervision;
* progression stage;
* recent exercise history.

Candidate retrieval must favor recall.

It should initially retrieve all plausible candidates before strict eligibility filtering.

The engine must not select an exercise during retrieval.

Retrieval creates the candidate set.

Selection occurs later.

---

# Stage 11 — Exercise Eligibility Filtering

Every retrieved candidate passes through hard eligibility rules.

The engine verifies:

* safety;
* medical compatibility;
* pain compatibility;
* equipment availability;
* environmental feasibility;
* technical feasibility;
* module compatibility;
* primary-adaptation compatibility;
* supervision compatibility;
* athlete-state compatibility.

Possible results are:

```text
ELIGIBLE
INELIGIBLE
```

An ineligible exercise:

* receives no final numerical score;
* cannot be selected;
* must retain an exclusion reason.

Example:

```text
candidate:
  exercise: depth_jump

eligibility:
  status: INELIGIBLE

reasons:
  - significant_calf_soreness
  - reduced_landing_control
```

The engine must not retain an unsafe exercise because it scores highly in other criteria.

---

# Stage 12 — Exercise Scoring

Eligible candidates are scored using the relevant module-specific Exercise Selection profile.

The scoring process must:

1. select the correct scoring profile;
2. verify mandatory criteria;
3. assign criterion scores;
4. apply criterion weights;
5. normalize the Base Suitability Score;
6. apply limited contextual modifiers;
7. assess Confidence separately;
8. rank candidates.

The engine must preserve:

* criterion scores;
* weights;
* modifiers;
* confidence reasons;
* ranking;
* tie-break decisions.

The scoring rules are defined in:

`16_SCORING_MODEL.md`

A high score does not guarantee final selection.

The candidate must still pass:

* conflict detection;
* session assembly;
* final validation.

---

# Stage 13 — Initial Candidate Selection

The engine creates an initial set of selected exercises.

The selection must satisfy:

* module requirements;
* primary objective;
* available duration;
* exercise-count limits;
* equipment constraints;
* athlete constraints;
* progression requirements;
* minimum effective dose.

The initial selection is provisional.

It may still be changed by:

* conflict resolution;
* budget validation;
* duration validation;
* final validation.

Every selected exercise must have one explicit role.

Possible roles include:

```text
PRIMARY
SECONDARY
SUPPORT
PREPARATION
RECOVERY
```

An exercise must not be retained merely because time remains available.

---

# Stage 14 — Conflict Detection

The engine evaluates conflicts between:

* selected exercises;
* selected modules;
* progression choices;
* session order;
* athlete state;
* combat practice;
* weekly schedule;
* competition demands.

Conflict detection considers:

* same-muscle overlap;
* same-joint stress;
* shared fatigue dimensions;
* module incompatibility;
* technical fatigue;
* redundant exercise functions;
* session-duration pressure;
* interaction cost;
* recent exposure;
* next-session interference.

Conflicts are classified by:

* type;
* level;
* scope;
* probability;
* consequence;
* protected priority.

A session must not proceed with an unresolved Major or Critical conflict.

Detailed conflict rules are defined in:

`17_CONFLICT_RULES.md`

---

# Stage 15 — Conflict Resolution

The engine applies the smallest effective change capable of resolving the conflict.

Default resolution order:

1. Reorder
2. Reduce Density
3. Reduce Volume
4. Reduce Intensity
5. Modify Prescription
6. Substitute Exercise
7. Remove Exercise
8. Reduce Module Role
9. Remove Module
10. Separate Across Sessions
11. Replace Session Objective
12. Stop Generation

The engine must protect priorities in this order:

1. safety;
2. medical restrictions;
3. competition readiness;
4. combat-practice quality;
5. primary adaptation;
6. technical quality;
7. recovery capacity;
8. long-term development;
9. continuity;
10. preference;
11. optional volume.

After every material resolution, the engine must return to the latest stage capable of confirming that the plan remains coherent.

---

# Pipeline Backtracking

The engine must support controlled backtracking.

It should not restart the entire pipeline after every failure.

The return stage depends on the problem detected.

---

## Exercise-Level Failure

Examples:

* selected exercise becomes ineligible;
* exercise creates local conflict;
* equipment becomes unavailable.

Return to:

```text
Exercise Candidate Retrieval
or
Exercise Eligibility Filtering
```

---

## Module-Level Failure

Examples:

* no valid exercise can implement the module;
* module cost exceeds the budget;
* module conflicts with combat practice.

Return to:

```text
Capability Module Selection
or
Module Compatibility Check
```

---

## Objective-Level Failure

Examples:

* requested objective is incompatible with athlete state;
* competition proximity prevents development work;
* medical restrictions prevent all valid implementations.

Return to:

```text
Objective Interpretation
or
Adaptation Priority Calculation
```

---

## Input-Level Failure

Examples:

* missing critical data;
* contradictory medical information;
* invalid request.

Return to:

```text
Input Validation
```

The engine should always return to the latest stage capable of solving the problem.

It should not restart the complete pipeline unnecessarily.

---

# Stage 16 — Session Assembly

The engine assembles the selected modules and exercises into an ordered session.

The canonical relative module order is:

1. Preparation
2. Movement
3. Power
4. Strength
5. Functional Hypertrophy
6. Robustness
7. Grip
8. Core
9. Conditioning
10. Recovery

Only selected modules appear.

A session is not required to contain every module.

The assembly process must protect:

* primary-module quality;
* high-velocity work;
* high-skill work;
* maximal-force work;
* technical consistency;
* appropriate rest;
* realistic transitions.

Any deviation from the canonical order must include a justification.

The engine must not invent a separate `Technical Skill` module.

Specific Skill practice remains external.

Physical exercises using combat implements remain classified according to their actual physical module.

---

# Stage 17 — Prescription Generation

The engine generates a complete prescription for each exercise.

Depending on the module, prescription fields may include:

* sets;
* repetitions;
* duration;
* distance;
* load;
* intensity;
* percentage;
* RPE;
* RIR;
* tempo;
* velocity target;
* work interval;
* rest interval;
* range of motion;
* execution intent;
* technical cues;
* stopping criteria;
* progression condition;
* regression condition;
* substitution options.

Every prescription must be sufficient for execution.

An output such as:

```text
Bench Press — 4 sets
```

is incomplete.

A valid prescription should specify, where relevant:

```text
Bench Press
4 × 4
RPE 7.5
Rest 3 minutes
Stop the set if technical position deteriorates
```

Power prescriptions must include:

* maximal intent;
* sufficient rest;
* velocity or quality stopping criteria.

Conditioning prescriptions must include:

* work-to-rest structure;
* target intensity;
* technical sustainability requirements.

Recovery prescriptions must remain low enough in cost to serve Recovery.

---

# Stage 18 — Load Estimation

The engine estimates the total session cost.

The estimate must remain consistent with the Module Engine's four fatigue dimensions:

* Neural Fatigue;
* Muscular Fatigue;
* Connective Tissue Stress;
* Metabolic Fatigue.

The engine may also estimate:

* local muscle exposure;
* joint stress;
* impact contacts;
* technical complexity;
* exercise novelty;
* recovery time.

Cost estimates are comparative planning values.

They are not direct physiological measurements.

The engine must evaluate:

* exercise cost;
* module cost;
* interaction cost;
* cumulative session cost;
* weekly cost.

If the estimated cost exceeds the athlete's available capacity, the engine must backtrack and modify the session.

---

# Stage 19 — Duration Estimation

The engine estimates realistic session duration.

Duration must include:

* preparation;
* exercise setup;
* sets;
* repetitions;
* work intervals;
* rest intervals;
* transitions;
* equipment changes;
* Recovery work;
* reasonable execution margin.

The engine must not estimate duration using exercise work time alone.

A valid session must satisfy:

```text
Estimated Duration ≤ Available Duration
```

A small implementation tolerance may be defined by validation rules.

When the session exceeds available time, content should be removed in this order:

1. optional accessories;
2. redundant exercises;
3. low-priority volume;
4. tertiary work;
5. secondary modules;
6. support modules when non-essential.

The primary objective must not be removed first.

Rest intervals must not be shortened when that would change the intended adaptation.

---

# Stage 20 — Final Session Validation

The assembled session passes through final validation.

Validation verifies:

* valid inputs;
* one primary objective;
* valid selected modules;
* one primary adaptation per module;
* explicit purpose for every exercise;
* exercise eligibility;
* module-exercise compatibility;
* resolved conflicts;
* coherent order;
* realistic duration;
* acceptable fatigue cost;
* equipment feasibility;
* environmental feasibility;
* pain and medical compliance;
* combat-practice compatibility;
* progression coherence;
* complete prescriptions;
* output-schema compliance;
* Decision Trace completeness.

Possible results are:

```text
VALID
VALID_WITH_WARNINGS
INVALID
```

An invalid session must not be returned as a normal training session.

Blocking rules are defined in:

`22_VALIDATION_RULES.md`

---

# Stage 21 — Decision Trace Generation

The engine generates a structured Decision Trace.

The trace must describe the actual decision process.

It must include:

* input summary;
* athlete-state interpretation;
* extracted constraints;
* objective interpretation;
* adaptation priorities;
* selected modules;
* rejected modules when relevant;
* candidate exercises;
* eligibility exclusions;
* scoring results;
* conflicts;
* resolutions;
* substitutions;
* final ordering;
* load adjustments;
* duration adjustments;
* warnings;
* validation result;
* confidence level;
* safe-failure reasons when applicable.

The Decision Trace must not invent a retrospective explanation unrelated to the rules actually used.

Its structure is defined in:

`21_DECISION_TRACE.md`

---

# Stage 22 — Output Generation

The final engine output contains:

* session metadata;
* declared objective;
* adaptation priorities;
* selected Capability Modules;
* ordered exercises;
* complete prescriptions;
* substitutions;
* progression instructions;
* warnings;
* estimated duration;
* estimated fatigue;
* validation status;
* Decision Trace reference or summary.

The definitive output format is defined in:

`20_ENGINE_OUTPUT_SCHEMA.md`

---

# Safe Failure Handling

The engine must fail safely.

When a valid session cannot be generated, it must not invent unsupported solutions or bypass hard rules.

Possible safe-failure outcomes include:

* request additional critical information;
* generate a Recovery session;
* reduce the objective;
* change development work to maintenance;
* recommend postponement;
* recommend appropriate professional assessment;
* state that no valid exercise implementation exists;
* state that no valid session can be generated.

Example:

```text
status:
  NO_VALID_SESSION

reason:
  Acute knee pain prevents high-intensity lower-body Power work, and no pain-free ballistic alternative is currently available.

recommended_action:
  Replace the requested session with a low-intensity Recovery session and seek appropriate assessment if symptoms persist or worsen.
```

The engine must never describe a failed generation as a valid completion.

---

# Failure Classification

Pipeline failures may be classified as:

## Recoverable Failure

The engine can solve the problem by returning to an earlier stage.

Examples:

* one exercise becomes ineligible;
* one module exceeds the duration;
* an equipment item is unavailable;
* one conflict requires substitution.

---

## Blocking Failure

The current request cannot produce a valid session.

Examples:

* critical medical restriction;
* unsafe environment;
* missing critical safety data;
* no valid exercise for the primary module;
* severe unresolved conflict;
* athlete state incompatible with requested demand.

Blocking failure produces a safe-failure output.

---

## System Failure

The pipeline cannot complete because of a technical or data problem.

Examples:

* missing rule version;
* corrupted exercise metadata;
* scoring profile unavailable;
* invalid schema mapping;
* unexpected internal exception.

A System Failure must be reported explicitly.

It must not be presented as an athlete-related training decision.

---

# Deterministic and Adaptive Behaviour

The pipeline must balance consistency with controlled variation.

---

## Deterministic Behaviour

The same:

* input;
* athlete history;
* rule version;
* scoring version;
* exercise-library version

should generally produce the same:

* eligibility decisions;
* priority hierarchy;
* scoring results;
* conflict resolutions;
* validation result.

Determinism supports:

* debugging;
* testing;
* auditing;
* comparison;
* scientific review.

Random selection must never influence:

* safety;
* eligibility;
* primary adaptation;
* conflict priority;
* validation.

---

## Adaptive Behaviour

The engine may vary selection when several candidates are practically equivalent.

Controlled variation may consider:

* recent exercise exposure;
* athlete preference;
* exercise continuity;
* monotony;
* progression stage;
* equipment;
* training history.

Variation is permitted only among valid candidates that remain within the defined tie margin or equivalent decision class.

Adaptability must never override:

* safety;
* mandatory criteria;
* primary-adaptation relevance;
* conflict rules;
* progression rules;
* validation.

---

# Minimum Effective Session Principle

The engine should generate the smallest coherent session capable of delivering the required adaptation.

Additional exercises or modules must not be added only because:

* time remains;
* variety is desirable;
* fatigue appears too low;
* the session looks visually incomplete.

The engine must prefer:

```text
Minimum Effective Structure
```

over:

```text
Maximum Tolerable Structure
```

A shorter valid session is superior to a longer incoherent session.

---

# Minimum Viable Pipeline

CAS Engine Version 0.1 must support at minimum:

* one Athlete Profile;
* one Training Request;
* explicit equipment constraints;
* explicit duration;
* Athlete State Evaluation;
* objective interpretation;
* adaptation prioritization;
* Capability Module selection;
* module compatibility checking;
* exercise candidate retrieval;
* eligibility filtering;
* exercise scoring;
* conflict detection;
* conflict resolution;
* session assembly;
* prescription generation;
* duration estimation;
* fatigue estimation;
* final validation;
* readable Decision Trace;
* safe-failure output.

Advanced features may be added later, including:

* long-term adaptive periodization;
* automated Training Cycle generation;
* athlete-response learning;
* advanced competition peaking;
* population-specific models;
* predictive fatigue modelling.

These future features must not alter the core pipeline order.

---

# Example Pipeline Execution

## Input

```yaml
athlete:
  sport: Krav Maga
  combat_level: intermediate
  physical_training_age: intermediate

athlete_state:
  general_readiness: moderate
  pain: none
  muscular_soreness: low

equipment:
  - barbell
  - dumbbells
  - cable
  - medicine_ball
  - heavy_bag

request:
  duration_minutes: 60
  primary_objective: improve_striking_power
  secondary_objective: maintain_maximum_strength
  next_combat_session_hours: 48
```

---

## Objective Interpretation

```yaml
performance_outcome:
  - improve rapid force expression during striking
  - improve force transmission

primary_adaptation:
  Power

secondary_adaptations:
  - Maximum Strength
  - Movement

supported_capabilities:
  - rotate
  - transmit_force
  - accelerate
  - maintain_balance
```

---

## Adaptation Priorities

```yaml
adaptation_priorities:
  - adaptation: Power
    role: PRIMARY

  - adaptation: Maximum Strength
    role: SECONDARY

  - adaptation: Movement
    role: SUPPORT
```

---

## Selected Capability Modules

```yaml
selected_modules:
  - module: Preparation
    role: SUPPORT

  - module: Power
    role: PRIMARY

  - module: Strength
    role: SECONDARY

  - module: Core
    role: SUPPORT

  - module: Recovery
    role: SUPPORT
```

---

## Candidate Exercises

```yaml
Power:
  - rotational_medicine_ball_throw
  - explosive_heavy_bag_single_strike
  - landmine_push_press

Strength:
  - weighted_pull_up
  - bench_press
  - landmine_press

Core:
  - pallof_press
  - suitcase_carry
  - dead_bug
```

---

## Eligibility Filtering

```yaml
ineligible_candidates:
  - exercise: landmine_push_press
    reason: no_landmine_attachment_confirmed

eligible_candidates:
  - rotational_medicine_ball_throw
  - explosive_heavy_bag_single_strike
  - weighted_pull_up
  - bench_press
  - landmine_press
  - pallof_press
  - suitcase_carry
  - dead_bug
```

---

## Initial Selection

```yaml
initial_selection:
  - rotational_medicine_ball_throw
  - explosive_heavy_bag_single_strike
  - weighted_pull_up
  - bench_press
  - pallof_press
```

---

## Conflict Detection

```yaml
conflicts:
  - type: upper_body_local_fatigue
    elements:
      - explosive_heavy_bag_single_strike
      - bench_press
    level: MODERATE

  - type: session_duration
    level: MINOR
```

---

## Conflict Resolution

```yaml
resolutions:
  - retain rotational_medicine_ball_throw as primary Power exercise
  - retain explosive_heavy_bag_single_strike at low volume
  - reduce bench_press volume
  - retain weighted_pull_up
  - retain one Core exercise only
```

---

## Final Session Structure

```yaml
session:
  - module: Preparation
    exercise: dynamic_movement_preparation

  - module: Power
    exercise: rotational_medicine_ball_throw

  - module: Power
    exercise: explosive_heavy_bag_single_strike

  - module: Strength
    exercise: weighted_pull_up

  - module: Strength
    exercise: bench_press

  - module: Core
    exercise: pallof_press

  - module: Recovery
    exercise: breathing_downregulation
```

---

## Decision Summary

```text
Rotational medicine-ball throws were selected as the primary Power exercise because they permit maximal rotational intent with controlled fatigue.

Explosive heavy-bag strikes were retained at low volume as a Power implementation because the athlete has sufficient specific experience and a combat session is not scheduled for another 48 hours.

Strength work was placed after Power to preserve velocity and technical quality.

Bench-press volume was reduced to limit shoulder and triceps fatigue.

Only one Core exercise was retained to keep the session within the available duration.
```

---

# Pipeline Invariants

The following conditions must always remain true:

1. Adaptation selection occurs before exercise selection.
2. Training Cycle priorities influence session generation.
3. Every session has one primary adaptation.
4. Every Capability Module has one primary adaptation.
5. Only canonical Capability Modules may be selected.
6. Hard Constraints cannot be violated.
7. Medical restrictions override performance objectives.
8. Safety overrides scoring.
9. Primary adaptations are protected before secondary adaptations.
10. High-skill and high-velocity work must not follow avoidable fatigue.
11. Exercise score alone cannot override conflict rules.
12. Specific Skill remains external to the physical preparation engine.
13. The final session must fit the available duration.
14. Every selected exercise must have an explicit purpose.
15. Every rejected high-ranking candidate must have an explanation.
16. Every material conflict must have a recorded resolution.
17. Every generated session must pass validation.
18. Every generation must produce a Decision Trace.
19. The engine must fail safely when no valid session exists.
20. The system must optimize adaptation rather than exhaustion.

---

# Relationship With Other Engine Documents

This document orchestrates the following rule systems:

* `MODULE_ENGINE.md`
* `14_EXERCISE_SELECTION_RULES.md`
* `15_SUBSTITUTION_RULES.md`
* `16_SCORING_MODEL.md`
* `17_CONFLICT_RULES.md`
* `19_ENGINE_INPUT_SCHEMA.md`
* `20_ENGINE_OUTPUT_SCHEMA.md`
* `21_DECISION_TRACE.md`
* `22_VALIDATION_RULES.md`
* `23_ENGINE_TEST_CASES.md`

The Session Generation Pipeline defines:

* when each rule system is called;
* what information enters each stage;
* what information each stage must return;
* when the engine must backtrack;
* when the engine must stop.

The specialized documents define how each decision is made.

When specifications conflict, the hierarchy is:

1. Safety and medical constraints
2. Module Engine doctrine
3. Conflict Rules
4. Validation Rules
5. Scoring Model
6. Exercise Selection Rules
7. Substitution Rules
8. Athlete preference

Schema documents define representation.

They do not override physiological or safety doctrine.

---

# Implementation Principle

The software implementation should represent each pipeline stage as an independent function, service or clearly isolated processing unit.

Example:

```text
validateInput()
evaluateAthleteState()
extractConstraints()
interpretObjective()
calculateAdaptationPriorities()
selectCapabilityModules()
checkModuleCompatibility()
retrieveExerciseCandidates()
filterEligibleExercises()
scoreExerciseCandidates()
selectInitialCandidates()
detectConflicts()
resolveConflicts()
assembleSession()
generatePrescription()
estimateSessionLoad()
estimateSessionDuration()
validateSession()
generateDecisionTrace()
buildEngineOutput()
```

Each processing unit must:

* receive structured input;
* return structured output;
* identify the rule version used;
* declare errors explicitly;
* declare warnings explicitly;
* avoid hidden side effects;
* avoid silently changing objectives;
* record relevant decision information;
* be independently testable.

---

# Stage Result Structure

Each stage should return a structure similar to:

```yaml
stage:
status:
input_reference:
output:
warnings:
errors:
decision_events:
next_stage:
backtrack_stage:
```

Possible status values include:

```text
SUCCESS
SUCCESS_WITH_WARNINGS
RECOVERABLE_FAILURE
BLOCKING_FAILURE
SYSTEM_FAILURE
```

This common structure supports:

* debugging;
* testing;
* Decision Trace generation;
* safe backtracking;
* auditability.

---

# Versioning

Every generated session should record the versions of:

* Module Engine;
* Session Generation Pipeline;
* Scoring Model;
* Conflict Rules;
* Exercise Selection Rules;
* Substitution Rules;
* Validation Rules;
* Input Schema;
* Output Schema;
* Exercise Library.

The same inputs may produce different results after a rule update.

Version information makes this change explicit and auditable.

---

# Definition of Success

The Session Generation Pipeline succeeds when it consistently transforms valid athlete and training data into a session that is:

* adaptation-driven;
* safe;
* athlete-specific;
* compatible with combat practice;
* physiologically coherent;
* realistic in duration;
* appropriate in fatigue;
* fully prescribed;
* validated;
* explainable;
* reproducible;
* auditable.

The pipeline does not succeed merely because it returns a list of exercises.

It succeeds only when the returned session is the valid result of the complete decision process.

---

# Session Adequacy

## Why this stage exists

A real request through VITA — maximum strength, 30 minutes, bodyweight only, no
recorded 1RM — returned a contract-valid draft containing one exercise: Neck
Training, approximately 8 minutes of work, no conflict and no warning.

Every stage had done its job. Neck Training is genuinely eligible, genuinely
prescribable, and its knowledge-base entry genuinely declares
`primaryAdaptation: maximum_strength`. No stage was in a position to ask whether
the finished session was still the session that had been requested.

Session Adequacy is that question, asked once, at the end.

## Four distinct questions

The pipeline previously collapsed four questions into two.

| Question | Meaning | Stage |
| --- | --- | --- |
| Exercise eligibility | Can this athlete perform this exercise under the current constraints? | eligibility filtering |
| Prescription feasibility | Can CAS safely and deterministically prescribe it? | prescription generation |
| Adaptation coverage | Does the resulting session still meaningfully train the requested adaptation? | final validation |
| Composition adequacy | Is the whole session coherent and useful? | final validation |

A session can pass the first two and fail the last two. That is exactly what
happened.

## Adaptation coverage

An exercise DRIVES an adaptation when its prescription role is a driving role.

The role is read from the prescription registry — the same value the finished
prescription carries. It is never inferred from a display name, and never from
the knowledge-base `primaryAdaptation` field, which describes what an exercise
trains rather than whether it can carry a session.

Non-driving roles:

```text
accessory
robustness
```

Every other role drives a session of its own kind: `conditioning` drives a
conditioning session, `technical` a skill session, `recovery` a recovery
session, `primary` and `secondary` by definition.

The list is deliberately narrow. Adding a role to it declares that no session
can be built out of that role alone, which is a domain decision — never a way to
make a test pass.

Coverage fails when the primary module holds prescribed work and none of it
drives. It also fails when the session could not be prescribed at all: a session
that holds no work covers nothing.

## Duration adequacy

Shortness is NOT the offence. The Minimum Effective Session Principle above
states that the engine produces the smallest coherent session capable of
delivering the adaptation, and never adds work because time remains. A
20-minute session that genuinely delivers maximum strength is a correct result.

Unused time is reported as EVIDENCE alongside a coverage verdict, never as a
verdict on its own.

Thresholds — engineering decisions, relative and absolute together, because a
single ratio is fragile at both ends of the range:

| Threshold | Value | Rationale |
| --- | --- | --- |
| `minimumDurationCoverageRatio` | 0.5 | Past half, "the engine judged less work sufficient" stops being a plausible reading of the gap. |
| `maximumUnusedMinutes` | 15 | The smallest gap that could hold another meaningful piece of work. |
| `shortRequestExemptionMinutes` | 20 | A short request is usually a deliberately narrow one. |
| `minimumProductiveMinutes` | 10 | Roughly one working exercise with its rests. |

Both the relative and the absolute test must fail before a session is reported
as underfilled. Requests at or below the short-request exemption are exempt from
the ratio rule; the absolute rule still applies.

## Outcomes

```text
adequate    the adaptation is driven and the time is used reasonably
partial     the adaptation IS driven, but a named gap remains
inadequate  CAS cannot claim to have fulfilled the primary objective
```

Coverage decides between usable and not-what-was-asked-for. Duration can only
downgrade a covered session to `partial`. A session that trains the right thing
is never rejected for being short.

## Repair hierarchy

When the primary module drives nothing, CAS may attempt ONE deterministic
repair before reporting: promote the highest-ranked candidate the module already
produced — already eligible, already scored, already ranked — that holds a
driving role and can be prescribed.

Repair may never:

* add work because time remains — the Minimum Effective Session Principle is not
  suspended for repair, and repair runs only on a session that drives nothing;
* widen the candidate pool beyond the module's own ranked bench;
* promote a candidate redundant with work the session already holds (Rule 32);
* push the session past the requested duration;
* grow a module past `EXERCISES_PER_MODULE_ROLE`;
* bypass a missing athlete reference, or invent a load, an intensity or a 1RM.

A module already at its cap is REPORTED, not reshaped. Dropping a composed
exercise to make room was considered and rejected: it silently reshaped sessions
across the engine, discarding work the composer had deliberately ranked. A
module full of support work is a ranking outcome, and correcting a ranking is
not this stage's business.

Every repair attempt — including one that adds nothing — appears in the Decision
Trace.

## Missing references

A missing 1RM or other required loading reference remains a SAFE PRESCRIPTION
FAILURE. Adequacy never works around one: a candidate that cannot be dosed is
skipped, and a session whose required exercise cannot be dosed is reported
`inadequate` with `PRIMARY_CANDIDATES_UNPRESCRIBABLE`, its cause staying where it
already was — in `missingSourceData`.

## Decision Trace

Every adequacy rule that fails emits a `final_validation` entry carrying its rule
id, its reason code and its source documents. One further entry always records
the verdict, the duration figures and what repair did or did not do.

Rule identifiers:

```text
adequacy_primary_adaptation_coverage
adequacy_duration_coverage
adequacy_minimum_productive_duration
adequacy_primary_candidates_unprescribable
```

Reason codes:

```text
PRIMARY_ADAPTATION_NOT_DRIVEN
PRIMARY_CANDIDATES_UNPRESCRIBABLE
DURATION_GROSSLY_UNDERFILLED
BELOW_MINIMUM_PRODUCTIVE_DURATION
```

## Manual-test regression scenario

```text
adaptation:  maximum_strength
duration:    30 minutes
equipment:   bodyweight only
references:  none
expected:    outcome draft, prescription prescribed, one accessory exercise,
             approximately 8 minutes, sessionAdequacy.status = inadequate,
             PRIMARY_ADAPTATION_NOT_DRIVEN raised as a major conflict
```

Conflicts and warnings are raised only for a session that WAS prescribed. When
prescription is unavailable the prescription layer has already reported the
cause, and restating it would duplicate an existing signal rather than add one;
`sessionAdequacy.status` still reports `inadequate`.

## Known limitation

For `maximum_strength` with the V0.1 catalogue, scoring frequently ranks
accessory work above compound lifts, filling the primary module to its cap with
accessories. Adequacy reports this correctly, and repair correctly declines to
reshape it. The ranking itself is a separate question, for the scoring model
rather than for this stage.

---

# Final Principle

The Session Generation Pipeline exists to ensure that a training session is never a random collection of exercises.

A CAS session is:

* a physiological objective;
* translated into Capability Modules;
* implemented through eligible exercises;
* ranked through explicit scoring;
* protected by Conflict Rules;
* constrained by reality;
* validated before delivery;
* explained through a Decision Trace.

> CAS does not generate workouts first and justify them afterward.

> CAS generates decisions first and translates them into training.
