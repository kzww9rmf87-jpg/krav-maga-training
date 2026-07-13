# SESSION GENERATION PIPELINE

Version 0.1

---

# Purpose

The Session Generation Pipeline defines the complete decision sequence used by the Combat Athlete System to generate a training session.

Its purpose is to transform:

- athlete data,
- training objectives,
- current constraints,
- available equipment,
- recent training history,
- and combat-sport demands

into a structured, safe, explainable and physiologically coherent training session.

The pipeline does not directly choose exercises from a general list.

It progressively narrows the decision space through:

1. input validation,
2. objective interpretation,
3. adaptation prioritization,
4. Capability Module selection,
5. exercise candidate retrieval,
6. scoring,
7. conflict detection,
8. conflict resolution,
9. session assembly,
10. prescription generation,
11. final validation,
12. and decision trace generation.

The fundamental principle is:

> Every generated session must be the visible result of an explicit decision process.

---

# Core Principle

The Session Generation Pipeline follows one immutable rule:

> The system must first determine what adaptation is required, then determine how that adaptation should be trained, and only then select the exercises.

The pipeline must never begin with exercise selection.

Exercises are implementation tools.

Adaptations are the objective.

---

# Pipeline Overview

The complete session generation sequence is:

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
Conflict Detection
      ↓
Conflict Resolution
      ↓
Session Structure Assembly
      ↓
Prescription Generation
      ↓
Fatigue and Load Validation
      ↓
Final Session Validation
      ↓
Decision Trace Generation
      ↓
Generated Training Session

Puis vérifie que le fichier est bien rempli :

```bash
sed -n '1,80p' 20-engine/18_SESSION_GENERATION_PIPELIN.E
git add 20-engine/18_SESSION_GENERATION_PIPELINE.md
git commit -m "docs: define CAS session generation pipeline"
Pipeline Inputs
The pipeline receives four main input groups.
1. Athlete Profile
The Athlete Profile contains relatively stable information about the athlete.
Examples include:
athlete identifier,
age,
sex when physiologically relevant,
body mass,
height,
training age,
strength level,
conditioning level,
movement competency,
injury history,
current limitations,
combat sport,
combat style,
competitive level,
technical experience,
exercise experience,
preferred training methods,
unavailable exercises,
and known contraindications.
The Athlete Profile must not be treated as fully static.
Relevant fields may evolve over time.
2. Athlete Current State
The Athlete Current State contains short-term readiness information.
Examples include:
current fatigue,
perceived recovery,
sleep quality,
muscle soreness,
pain,
motivation,
psychological stress,
previous-session load,
recent combat-practice load,
recent resistance-training load,
recent conditioning load,
days since last high-intensity session,
and current medical restrictions.
The current state may override the theoretical training plan.
A planned session is never more important than the athlete's current capacity to tolerate it.
3. Training Request
The Training Request defines what the user or planning system is asking the engine to generate.
Examples include:
session date,
session type,
available duration,
primary objective,
secondary objective,
training phase,
weekly frequency,
preferred emphasis,
competition proximity,
required combat specificity,
desired session difficulty,
and whether the session is isolated or part of a larger plan.
A Training Request may contain incomplete or conflicting objectives.
The engine must interpret and resolve them before generating the session.
4. Environmental Constraints
Environmental Constraints define what is practically possible.
Examples include:
available equipment,
available space,
training location,
number of athletes,
presence of a coach,
available partners,
noise limitations,
impact limitations,
session duration,
exercise setup time,
and facility restrictions.
An exercise that is physiologically appropriate but impossible in the current environment is not eligible.
Stage 1 — Input Validation
The first stage verifies that the minimum required information is available and internally consistent.
The engine must validate:
athlete profile existence,
session duration,
declared objective,
equipment availability,
active injuries,
medical restrictions,
recent training information when required,
and valid value ranges.
Examples of invalid inputs include:
negative session duration,
unknown primary objective,
an exercise restriction contradicting a mandatory session request,
unavailable equipment marked as required,
incompatible competition dates,
or missing recovery information before a high-intensity session.
Input Validation Outcomes
Possible outcomes are:
VALID
The pipeline may continue.
VALID_WITH_DEFAULTS
The pipeline may continue using safe default values.
All defaults must appear in the Decision Trace.
REQUIRES_CLARIFICATION
The system cannot generate a reliable session without additional information.
REJECTED
The request is unsafe, impossible or structurally invalid.
Stage 2 — Athlete State Evaluation
The engine evaluates whether the athlete is currently able to perform the requested session.
This stage estimates a Session Readiness State.
Possible readiness states are:
READY,
READY_WITH_MODIFICATIONS,
LOW_READINESS,
RECOVERY_ONLY,
MEDICAL_REVIEW_REQUIRED.
The evaluation may use:
fatigue level,
sleep quality,
soreness,
pain,
recent training density,
recent high-intensity exposure,
recent combat practice,
illness indicators,
motivation,
and injury status.
The engine must distinguish:
normal training discomfort,
excessive fatigue,
acute pain,
and possible medical risk.
The engine must never reinterpret medical restrictions as optional.
Stage 3 — Constraint Extraction
The system converts all relevant limits into explicit machine-readable constraints.
Constraints may be classified as:
Hard Constraints
Hard Constraints cannot be violated.
Examples include:
medical contraindications,
active injury restrictions,
unavailable equipment,
prohibited exercises,
maximum session duration,
competition-day restrictions,
and mandatory recovery requirements.
Soft Constraints
Soft Constraints may be violated only when justified by a higher-priority objective.
Examples include:
exercise preferences,
preferred training order,
preferred equipment,
desired variety,
optional combat specificity,
and minor setup limitations.
Contextual Constraints
Contextual Constraints depend on the current session.
Examples include:
avoiding lower-body fatigue before combat practice,
limiting eccentric load before competition,
preserving grip before grappling,
reducing rotational volume after heavy striking work,
and limiting impact exposure during recovery periods.
Every constraint must be assigned:
a type,
a priority,
a source,
and a resolution rule.
Stage 4 — Objective Interpretation
The engine translates the Training Request into explicit physiological and performance objectives.
A user objective such as:
Improve punching power
must not be treated as a single exercise request.
It may be decomposed into:
lower-body force production,
rapid force development,
intermuscular coordination,
trunk force transfer,
rotational power,
upper-body ballistic output,
technical striking exposure,
and movement sequencing.
A user objective such as:
Become stronger for grappling
may be decomposed into:
maximal pulling strength,
isometric strength,
grip endurance,
trunk stiffness,
hip extension strength,
unilateral lower-body strength,
and local muscular robustness.
The engine must separate:
performance outcome,
physiological adaptation,
training method,
and exercise implementation.
Stage 5 — Adaptation Priority Calculation
The engine ranks the adaptations relevant to the current session.
Each adaptation receives a priority value based on:
primary objective,
secondary objective,
long-term plan,
current weakness,
competition proximity,
fatigue state,
recovery needs,
recent exposure,
adaptation interference,
and combat-sport relevance.
Possible priority levels are:
CRITICAL,
HIGH,
MODERATE,
LOW,
DEFERRED,
PROHIBITED.
The system must not attempt to maximize every quality simultaneously.
When two valid adaptations compete, the higher-priority adaptation must be protected.
Adaptation Priority Output
Each prioritized adaptation must include:
adaptation identifier,
adaptation domain,
target quality,
priority level,
rationale,
minimum effective dose,
maximum tolerable dose,
and conflict sensitivity.
Stage 6 — Capability Module Selection
The engine selects Capability Modules that can produce the prioritized adaptations.
Modules are selected according to:
adaptation relevance,
training phase,
athlete level,
available duration,
readiness,
equipment,
recent training exposure,
and recovery cost.
Examples of Capability Modules may include:
Maximum Strength,
Explosive Strength,
Ballistic Power,
Rotational Power,
Functional Hypertrophy,
Aerobic Capacity,
Anaerobic Power,
Repeat Sprint Ability,
Trunk Stiffness,
Neck Robustness,
Grip Capacity,
Movement Quality,
Recovery,
Technical Bag Work,
and Combat-Specific Conditioning.
Each selected module must have an explicit role.
Possible roles are:
PRIMARY,
SECONDARY,
SUPPORT,
PREPARATORY,
RECOVERY,
OPTIONAL.
A session should normally contain:
one primary module,
zero to two secondary modules,
and a limited number of support modules.
The exact number depends on duration, athlete level and recovery state.
Stage 7 — Module Compatibility Check
Before exercises are retrieved, the engine checks whether the selected modules can coexist in the same session.
The system evaluates:
neural compatibility,
metabolic compatibility,
mechanical compatibility,
local muscular overlap,
technical interference,
fatigue interaction,
session-order requirements,
and weekly recovery cost.
Examples of compatible combinations include:
explosive power followed by maximal strength,
maximal strength followed by limited accessory hypertrophy,
movement preparation followed by power,
aerobic conditioning followed by low-intensity mobility,
and technical bag work followed by low-volume trunk work.
Examples of potentially incompatible combinations include:
high-volume hypertrophy before ballistic power,
exhaustive conditioning before maximal strength,
heavy grip work before grappling practice,
high eccentric lower-body volume before kicking practice,
and repeated high-impact striking during recovery from lower-limb pain.
Possible outcomes are:
COMPATIBLE,
COMPATIBLE_WITH_ORDERING,
COMPATIBLE_WITH_VOLUME_REDUCTION,
REQUIRES_SUBSTITUTION,
INCOMPATIBLE.
Stage 8 — Exercise Candidate Retrieval
For each selected Capability Module, the engine retrieves eligible exercises from the validated exercise library.
Candidate retrieval must use structured exercise metadata.
Relevant metadata may include:
adaptation domain,
primary quality,
secondary qualities,
movement pattern,
force direction,
contraction type,
velocity profile,
loadability,
stability demand,
coordination demand,
complexity,
injury risk,
equipment requirement,
combat transfer,
fatigue cost,
setup cost,
progression options,
regression options,
and athlete-level requirements.
The engine must retrieve a candidate pool.
It must not immediately select the first matching exercise.
Stage 9 — Exercise Eligibility Filtering
The candidate pool is filtered using the Exercise Selection Rules.
An exercise is removed when it violates a Hard Constraint.
Filtering criteria include:
injury compatibility,
medical compatibility,
equipment availability,
athlete competency,
movement restrictions,
session duration,
exercise order,
fatigue state,
competition proximity,
and known contraindications.
An exercise may also be removed when:
its technical complexity is excessive,
its setup cost is disproportionate,
it duplicates another selected stimulus,
its fatigue cost is too high,
its transfer is too low,
or a superior alternative exists.
Filtering produces:
ELIGIBLE exercises,
CONDITIONALLY_ELIGIBLE exercises,
and REJECTED exercises.
Every rejected exercise must have a reason code.
Stage 10 — Exercise Scoring
Eligible exercises are scored according to the Scoring Model.
The scoring stage compares exercises within the same functional decision context.
Possible scoring dimensions include:
objective relevance,
adaptation specificity,
combat-sport transfer,
athlete suitability,
progression potential,
load precision,
safety,
fatigue efficiency,
technical accessibility,
equipment fit,
time efficiency,
novelty value,
and compatibility with the rest of the session.
The total score must not be treated as the only decision criterion.
An exercise with the highest raw score may still be rejected because of:
redundancy,
conflict,
excessive fatigue,
poor ordering,
or a Hard Constraint.
The scoring output must include:
total score,
dimension scores,
bonuses,
penalties,
uncertainty level,
and ranking position.
Stage 11 — Conflict Detection
The engine detects conflicts between:
exercises,
Capability Modules,
training methods,
physical qualities,
local tissues,
fatigue demands,
combat practice,
weekly sessions,
and recovery requirements.
Conflict detection must occur at several levels.
Exercise-Level Conflicts
Examples include:
excessive movement duplication,
identical tissue stress,
conflicting technical demands,
or repeated high-impact exposure.
Module-Level Conflicts
Examples include:
maximal strength and exhaustive glycolytic conditioning,
ballistic power and excessive local fatigue,
or recovery work combined with high-intensity loading.
Weekly Conflicts
Examples include:
heavy lower-body strength before intense kicking practice,
high grip volume before grappling,
repeated high-impact jumping,
or excessive posterior-chain loading.
Athlete-State Conflicts
Examples include:
high neural demand during low readiness,
high eccentric loading during severe soreness,
or impact work during active pain.
Each conflict must receive:
a conflict type,
a severity,
affected elements,
a resolution priority,
and possible corrective actions.
Stage 12 — Conflict Resolution
Conflicts are resolved using the Conflict Rules.
Possible resolution actions include:
remove an exercise,
substitute an exercise,
reduce volume,
reduce intensity,
change exercise order,
change training method,
reduce module priority,
defer a module,
split the session,
move work to another day,
or replace the session with recovery work.
The fundamental rule is:
Protect the highest-priority adaptation while minimizing the lowest-value cost.
Conflict resolution must never optimize only for exercise variety or user preference.
The system must preserve:
safety,
medical restrictions,
primary adaptation,
recovery capacity,
long-term progression,
secondary adaptation,
preferences,
variety.
Stage 13 — Session Structure Assembly
After conflicts are resolved, the engine assembles the session structure.
The standard session architecture may include:
Readiness Check
General Preparation
Specific Preparation
Neural or Technical Primer
Primary Capability Module
Secondary Capability Module
Support Work
Conditioning
Recovery or Downregulation
Session Summary
Not every session requires every section.
The system must include only elements that contribute meaningful value.
Session Ordering Principles
The default ordering priority is:
Technical precision
      ↓
Speed
      ↓
Explosive power
      ↓
Maximum strength
      ↓
Hypertrophy
      ↓
Conditioning
      ↓
Recovery
This order may be modified when justified by:
session objective,
contrast training,
complex training,
sport practice,
competition phase,
or athlete-specific needs.
High-skill and high-velocity work should generally occur before high-fatigue work.
Stage 14 — Prescription Generation
The engine generates the exact training prescription for each exercise.
Prescription variables may include:
sets,
repetitions,
duration,
distance,
intensity,
percentage of maximum,
RPE,
repetitions in reserve,
velocity target,
tempo,
rest interval,
side allocation,
technical cue,
stop condition,
progression rule,
and regression rule.
Prescription must depend on:
Capability Module,
training method,
athlete level,
adaptation target,
readiness,
competition proximity,
and total session load.
The engine must avoid false precision.
When exact load data is unavailable, it should use valid autoregulation methods such as:
RPE,
repetitions in reserve,
velocity intent,
technical quality,
or percentage ranges.
Stage 15 — Load and Fatigue Estimation
The engine estimates the expected cost of the assembled session.
Relevant cost dimensions include:
neural load,
metabolic load,
mechanical load,
eccentric load,
joint load,
tissue-specific load,
grip load,
impact load,
technical fatigue,
and total recovery demand.
The engine compares the estimated session cost with:
athlete readiness,
recent training load,
upcoming combat practice,
upcoming sessions,
and current phase objectives.
Possible outputs are:
LOAD_ACCEPTABLE,
LOAD_HIGH_BUT_JUSTIFIED,
LOAD_REQUIRES_REDUCTION,
LOAD_INCOMPATIBLE.
The engine must reduce low-value volume before reducing the primary stimulus.
Stage 16 — Session Duration Validation
The total estimated duration must remain within the available session duration.
Duration estimation should include:
warm-up time,
setup time,
exercise execution,
rest intervals,
equipment transitions,
coaching explanation,
and recovery work.
When the session is too long, the reduction order is:
remove optional work,
reduce redundant accessory work,
reduce secondary-module volume,
simplify exercise setup,
reduce warm-up redundancy,
preserve the primary adaptation,
preserve essential safety preparation.
The engine must not compress rest intervals when doing so would alter the intended adaptation.
Stage 17 — Final Session Validation
The final session must pass all validation checks before being returned.
The validation must confirm:
no Hard Constraint is violated,
the primary objective is meaningfully represented,
the exercise order is coherent,
the total duration is acceptable,
fatigue is tolerable,
prescriptions are complete,
equipment is available,
no unresolved severe conflict remains,
substitutions exist when required,
and the session is explainable.
Possible outcomes are:
APPROVED
The session may be delivered.
APPROVED_WITH_WARNINGS
The session may be delivered with explicit warnings.
REQUIRES_REGENERATION
The engine must return to an earlier pipeline stage.
REJECTED
No safe or coherent session can be generated from the current request.
Stage 18 — Decision Trace Generation
Every generated session must include a Decision Trace.
The Decision Trace explains:
what the athlete requested,
how the request was interpreted,
which adaptations were prioritized,
which modules were selected,
which exercises were considered,
why exercises were rejected,
how exercises were scored,
which conflicts were detected,
how conflicts were resolved,
why the final exercises were selected,
and what assumptions or defaults were used.
The Decision Trace must support two levels.
User-Level Explanation
A concise and understandable explanation.
Example:
Rotational medicine-ball throws were selected before strength work because the primary goal is striking power and high-velocity work must be performed while fresh.
Technical-Level Explanation
A structured engine trace containing:
rule identifiers,
scores,
penalties,
constraint codes,
conflict codes,
and resolution actions.
The system must be capable of explaining its own decisions without exposing irrelevant internal complexity.
Regeneration Logic
The pipeline may return to a previous stage when validation fails.
Examples include:
no eligible exercise remains,
session duration is exceeded,
a severe conflict cannot be resolved,
the session cost exceeds readiness,
or the primary objective is insufficiently represented.
Possible regeneration paths include:
Final Validation Failure
      ↓
Conflict Resolution
      ↓
Exercise Re-Scoring
      ↓
Exercise Candidate Retrieval
      ↓
Module Re-Selection
      ↓
Adaptation Re-Prioritization
The engine should return to the latest stage capable of solving the problem.
It should not restart the entire pipeline unnecessarily.
Failure Handling
The engine must fail safely.
When a valid session cannot be generated, it must not invent unsupported solutions.
Possible safe failure outputs include:
request additional information,
recommend a recovery session,
reduce the session objective,
recommend professional assessment,
or state that no valid exercise selection exists under the current constraints.
Example:
No high-intensity lower-body power session was generated because the athlete reported acute knee pain and no pain-free ballistic alternative was available.
Deterministic and Adaptive Behaviour
The pipeline must balance consistency and adaptability.
Deterministic Behaviour
The same inputs and same rule version should generally produce the same decision hierarchy.
This is required for:
debugging,
validation,
comparison,
and scientific review.
Adaptive Behaviour
The engine may vary exercise selection when multiple equivalent options exist.
Variation may consider:
recent exercise exposure,
athlete preference,
equipment,
monotony,
progression stage,
and training history.
Adaptation must never override safety or primary-objective relevance.
Minimum Viable Pipeline
The CAS Engine V0.1 must at minimum support:
one Athlete Profile,
one Training Request,
explicit equipment constraints,
adaptation prioritization,
Capability Module selection,
exercise candidate retrieval,
eligibility filtering,
exercise scoring,
conflict resolution,
session assembly,
prescription generation,
duration validation,
and a readable Decision Trace.
Advanced periodization and long-term adaptation modelling may be added later.
Example Pipeline Execution
Input
athlete:
  sport: Krav Maga
  level: intermediate
  fatigue: moderate
  injuries: none
  available_equipment:
    - barbell
    - dumbbells
    - cable
    - medicine_ball
    - heavy_bag

request:
  duration_minutes: 60
  primary_objective: striking_power
  secondary_objective: maximum_strength
  next_combat_session_hours: 48
Objective Interpretation
performance_outcome:
  - increase striking velocity
  - increase striking force

target_adaptations:
  - rate_of_force_development
  - rotational_power
  - lower_body_force
  - trunk_force_transfer
  - upper_body_strength
Selected Modules
modules:
  - module: ballistic_rotational_power
    role: PRIMARY

  - module: maximum_strength
    role: SECONDARY

  - module: trunk_stiffness
    role: SUPPORT
Candidate Exercises
ballistic_rotational_power:
  - rotational_medicine_ball_throw
  - cable_punch
  - cable_rotational_press

maximum_strength:
  - weighted_pull_up
  - bench_press
  - landmine_press

trunk_stiffness:
  - pallof_press
  - suitcase_carry
  - dead_bug
Conflict Detection
conflicts:
  - type: local_fatigue
    elements:
      - cable_punch
      - cable_rotational_press
    severity: moderate

  - type: session_duration
    severity: low
Resolution
actions:
  - retain rotational_medicine_ball_throw
  - remove cable_rotational_press
  - retain cable_punch as low-volume specific work
  - reduce support module to one exercise
Final Session Structure
session:
  - phase: preparation
    exercise: dynamic_movement_preparation

  - phase: power
    exercise: rotational_medicine_ball_throw

  - phase: specific_power
    exercise: cable_punch

  - phase: strength
    exercise: weighted_pull_up

  - phase: strength
    exercise: bench_press

  - phase: support
    exercise: pallof_press

  - phase: recovery
    exercise: breathing_downregulation
Decision Summary
Rotational medicine-ball throws were selected as the primary exercise because they provide high-velocity rotational intent with low fatigue cost. Cable punches were retained at low volume for striking-specific force application. Maximum-strength exercises were placed after ballistic work to preserve movement velocity and technical quality.
Pipeline Invariants
The following rules must always remain true:
Adaptation selection occurs before exercise selection.
Hard Constraints cannot be violated.
Medical restrictions override performance objectives.
Primary adaptations are protected before secondary adaptations.
High-skill and high-velocity work must not be placed after avoidable fatigue.
Exercise score alone cannot override conflict rules.
The final session must fit the available duration.
Every final exercise must have an explicit purpose.
Every rejected high-ranking exercise must have an explanation.
Every session must produce a Decision Trace.
The engine must fail safely when no valid session exists.
The system must optimize adaptation, not exhaustion.
Relationship With Other Engine Documents
This document orchestrates the following rule systems:
14_EXERCISE_SELECTION_RULES.md
15_SUBSTITUTION_RULES.md
16_SCORING_MODEL.md
17_CONFLICT_RULES.md
19_ENGINE_INPUT_SCHEMA.md
20_ENGINE_OUTPUT_SCHEMA.md
21_DECISION_TRACE.md
22_VALIDATION_RULES.md
23_ENGINE_TEST_CASES.md
The Session Generation Pipeline defines when each system is called.
The specialized documents define how each decision is made.
Implementation Principle
The software implementation should represent each pipeline stage as an independent function or service.
Example:
validateInput()
evaluateReadiness()
extractConstraints()
interpretObjectives()
calculateAdaptationPriorities()
selectCapabilityModules()
checkModuleCompatibility()
retrieveExerciseCandidates()
filterEligibleExercises()
scoreExercises()
detectConflicts()
resolveConflicts()
assembleSession()
generatePrescription()
estimateSessionLoad()
validateDuration()
validateSession()
generateDecisionTrace()
Each function must:
receive structured input,
return structured output,
declare errors explicitly,
avoid hidden side effects,
and record relevant decision information.
Final Principle
The Session Generation Pipeline exists to ensure that a training session is never a random collection of exercises.
A CAS session is a structured physiological decision, translated into exercises, constrained by reality, protected by safety rules and explained by a traceable engine.
