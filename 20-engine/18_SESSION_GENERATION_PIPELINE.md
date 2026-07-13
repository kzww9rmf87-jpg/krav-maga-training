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
