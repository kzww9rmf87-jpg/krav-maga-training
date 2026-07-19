# STOP CONDITIONS

Version 0.1

---

# Purpose

The Stop Conditions specification defines how the Combat Athlete System recognizes, classifies and reacts to signals that require ending a repetition, a set, an exercise or a session before the originally planned work is complete.

A stop condition is not a suggestion.

It is a deterministic trigger, attached to a prescription, that the athlete or the system must act on when detected.

This document describes the stop conditions actually implemented in `stopConditionRegistry.ts` and `resolveStopConditions.ts`, the four Training Methods that currently require them, and the categories that remain documented but unimplemented.

Nothing in this document may be treated as active unless it is also present in the code cited alongside it.

---

# Core Principle

> CAS never leaves a prescription without an explicit answer to "when must this stop?"

A stop condition exists to protect, in order:

* immediate safety;
* the athlete's recoverability;
* the technical quality of the adaptation being trained;
* the honesty of the recorded session (a set that was actually stopped must never be recorded as completed as planned).

A prescription with zero stop conditions is not a valid CAS prescription, regardless of how complete its volume, intensity, rest or tempo are.

---

# Scope

This document covers, for the current implementation:

* the canonical stop-condition data model;
* the eight stop-condition categories with an active factory;
* the four Training Methods that currently require stop conditions (all nine method contracts declare `stopConditionPolicy: "required"`, but only four are used by an active exercise);
* how stop conditions are resolved, validated and represented in the Decision Trace;
* fallback behaviour when a required category is missing;
* the nine categories that exist in the vocabulary or are required by contracts but have no active factory yet.

It does not cover module selection, scoring, volume resolution, intensity resolution or rest/tempo resolution — those are documented in `26_INTENSITY_MODEL.md`, `27_REST_TEMPO_RULES.md`, `31_TRAINING_METHOD_CATALOGUE.md`, `32_MODULE_PRESCRIPTION_PROFILES.md` and `33_EXERCISE_PRESCRIPTION_CAPABILITIES.md`.

## Terms That Must Not Be Confused

* **Stop condition** — a resolved `StopCondition` object (Section 5), attached to one exercise's prescription, carrying a category, a scope, a trigger and an action. It is what fires.
* **Instruction technique** — a `StopConditionInstruction` (Section 5) or a general `InstructionDefinition` (`resolveInstructions.ts`). It is what to say once something applies — a stop condition, or an ordinary coaching cue with no stop attached. An instruction is never itself a trigger.
* **Critère de substitution** — `substitutionCapabilityTags` and `ConflictResolution`, resolved by `substitutionEngine.ts` for `combat_schedule` conflicts on a fully assembled session draft. A separate code path; a stop condition never triggers an automatic substitution.
* **Hard Constraint** — named only in the documentation-only "Operational protection hierarchy" comment of `conflictResolver.ts`. It is not a coded type in the prescription layer and is not a `StopConditionCategory`.
* **Réduction de volume** — `reduce_load` / `reduce_repetitions` / `reduce_sets` / `reduce_duration` / `reduce_distance` are `StopConditionAction` values that exist in the vocabulary but are emitted by none of the eight active factories, all of which use `end_set` or `stop_exercise` (Sections 8-9).
* **Échec de prescription** — a deterministic failure to produce a prescription at all, recorded as an `ExercisePrescriptionFailureStage` (one value of which is `"stop_conditions"`, Section 19). This happens before or during resolution, never during actual training.
* **Fin de set** — the `StopConditionAction` value `end_set` specifically (Section 9). Ends the current set only.
* **Arrêt d'exercice** — the `StopConditionAction` value `stop_exercise` specifically (Section 7). Ends the whole exercise, not just the current set.
* **Arrêt immédiat de séance** — the `StopConditionAction` value `stop_session`. Exists in the vocabulary; not yet emitted by any active factory (Section 6).

---

# Stop Condition Vocabulary

The full `StopConditionCategory` vocabulary, as declared in `types.ts`, has seventeen values:

```ts
type StopConditionCategory =
  | "medical"
  | "pain"
  | "acute_symptom"
  | "technical_failure"
  | "intensity_limit"
  | "velocity_loss"
  | "pace_loss"
  | "range_of_motion_loss"
  | "balance_loss"
  | "coordination_loss"
  | "fatigue_limit"
  | "impact_limit"
  | "equipment_failure"
  | "environmental_hazard"
  | "completion"
  | "time_limit"
  | "manual_termination";
```

Of these seventeen, **eight have an active factory** in `stopConditionRegistry.ts` and are used by the 35 active exercises (Section 4). The remaining nine are either unused anywhere, or required by a method contract that no active exercise currently uses (Section 20).

`StopConditionScope` has eight values:

```ts
type StopConditionScope =
  | "repetition"
  | "set"
  | "cluster"
  | "round"
  | "interval"
  | "exercise"
  | "block"
  | "session";
```

`StopConditionAction` has twenty values, from `end_repetition` to `stop_session` and `seek_medical_review`. `StopConditionPriority` has four values: `critical`, `high`, `medium`, `low`. `StopConditionRecoverability` has five values, from `not_recoverable` to `recoverable_next_session_only`.

---

# Canonical Data Model

```ts
interface StopCondition {
  conditionId: Identifier;
  category: StopConditionCategory;
  scope: StopConditionScope;
  trigger: StopConditionTrigger;
  threshold: StopConditionThreshold | null;
  action: StopConditionAction;
  priority: StopConditionPriority;
  recoverability: StopConditionRecoverability;
  instructions: StopConditionInstruction[];
  sourceRuleIds: Identifier[];
}

interface StopConditionTrigger {
  type: string;
  metric: string | null;
  operator: StopTriggerOperator;
  expectedValue: number | string | boolean | null;
  unit: string | null;
  evaluationTiming: StopEvaluationTiming;
}

type StopConditionThreshold =
  | { type: "numeric"; value: number; unit: string }
  | { type: "range"; min: number; max: number; unit: string }
  | { type: "category"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "event"; eventId: Identifier };

interface StopConditionInstruction {
  instructionId: Identifier;
  audience: "athlete" | "coach" | "system";
  text: string;
  sourceRuleId: Identifier;
}
```

For all eight active categories (Section 4), `threshold` is currently always `null` — no numeric threshold is implemented in V0.1, only presence/absence detection (`trigger.operator: "detected"`). Inventing a numeric threshold today would violate the no-invented-value principle; a threshold may only appear once a specific document defines the number.

---

# Session-Level Stop Conditions

No active stop-condition category currently has `scope: "session"`. `StopConditionAction` includes `stop_session`, and `StopConditionScope` includes `session`, but neither is emitted by any of the eight active factories. A session-level stop condition would require a documented trigger (for example, a combination of exercise-level stops, or a session-wide safety signal) that does not exist yet. This is a gap in V0.1, not a removed feature — see Section 20.

---

# Exercise-Level Stop Conditions

Three of the eight active categories resolve at `scope: "exercise"`:

| Category | Action | Meaning |
|---|---|---|
| `pain` | `stop_exercise` | Any reported pain ends the exercise entirely, not just the current set |
| `completion` | `stop_exercise` | The prescribed work (sets, reps, duration or distance) was finished as planned |
| `fatigue_limit` | `stop_exercise` | Cumulative fatigue across sets, not a single-repetition technical break |

---

# Set-Level Stop Conditions

Five of the eight active categories resolve at `scope: "set"`:

| Category | Action | Meaning |
|---|---|---|
| `technical_failure` | `end_set` | Repeated technical breakdown of the movement pattern |
| `balance_loss` | `end_set` | Loss of balance, stance or footing during the set |
| `equipment_failure` | `end_set` | Loss of secure control of the implement (grip, dropped load, rack failure) |
| `velocity_loss` | `end_set` | Measurable or visible decline in movement velocity across the set |
| `impact_limit` | `end_set` | Landing/impact quality degradation (surface contact, joint loading) |

A set-level stop ends the current set only; the exercise may continue with the next set unless a higher-priority, exercise-level or session-level condition also fires.

---

# Technique Degradation

`technical_failure` is the sole active category for technique degradation.

```text
category: "technical_failure"
scope: "set"
trigger.type: "technical_breakdown"
action: "end_set"
priority: "high"
recoverability: "recoverable_same_exercise"
```

It is required by all four active methods (Section 13) — every prescription CAS currently generates must be able to detect and act on a technical breakdown.

---

# Pain and Safety

`pain` is the highest-priority active category:

```text
category: "pain"
scope: "exercise"
trigger.type: "pain_report"
action: "stop_exercise"
priority: "critical"
recoverability: "not_recoverable"
```

It is the only active category with `priority: "critical"` and `recoverability: "not_recoverable"` — resolution ordering (Section 16) places it first whenever it is present. It is required by all four active methods.

No other active category is safety-specific in the same sense; `balance_loss`, `equipment_failure` and `impact_limit` are safety-adjacent but are not classified as `pain`.

---

# Fatigue and Velocity Loss

Two active categories track output degradation rather than a single event:

| Category | Scope | Priority | Recoverability |
|---|---|---|---|
| `velocity_loss` | set | medium | recoverable_same_exercise |
| `fatigue_limit` | exercise | medium | recoverable_next_session_only |

`velocity_loss` is required only by `power_repetition_sets`, consistent with that method's `movement_intent`-driven scoring. `fatigue_limit` is required by `power_repetition_sets`; it is also required by two methods not yet used by an active exercise (`work_rest_intervals`, `recovery_duration_work` — see Section 20).

---

# Time and Duration Limits

No active category currently enforces a time or duration limit. `time_limit` exists in the vocabulary and is required by two method contracts (`continuous_aerobic_duration`, `recovery_duration_work`), but neither method is used by an active exercise, and no factory exists for it yet — see Section 20.

---

# Method-Specific Stop Conditions

Of the nine Training Method contracts in `contracts.ts` (all declaring `stopConditionPolicy: "required"`), exactly four are used by an active exercise. For each, `requiredStopConditionCategories` and the resulting expected scope mix, taken directly from `contracts.ts`:

## `straight_sets_repetitions`

```text
required: technical_failure, pain, completion
expected scope: set (technical_failure) + exercise (pain, completion)
```

## `timed_isometric_sets`

```text
required: technical_failure, pain, completion
expected scope: set (technical_failure) + exercise (pain, completion)
```

## `distance_carry_sets`

```text
required: technical_failure, balance_loss, equipment_failure, pain, completion
expected scope: set (technical_failure, balance_loss, equipment_failure) + exercise (pain, completion)
```

## `power_repetition_sets`

```text
required: technical_failure, velocity_loss, fatigue_limit, impact_limit, balance_loss, pain, completion
expected scope: set (technical_failure, velocity_loss, impact_limit, balance_loss) + exercise (fatigue_limit, pain, completion)
```

**Resolution behaviour (identical for all four)**: `resolveStopConditions` (`resolveStopConditions.ts`) validates identifiers, checks every exercise-declared required condition has a matching definition, checks the selected conditions' categories cover every category the method requires, then orders the result by `priority` (`critical` → `high` → `medium` → `low`), ties broken by request order.

**Behaviour when a required category is missing**: `resolveStopConditions` returns `{ ok: false, failureCode: "STOP_CONDITION_CATEGORY_MISSING", missingCategories: [...] }` — a deterministic, non-recoverable resolution failure, identical in shape for all four methods. Independently, `validatePrescription.ts` performs the same category check a second time on the already-resolved prescription and raises `REQUIRED_STOP_CATEGORY_MISSING` (`recoverable: false`) if it is ever reached with a gap. Neither path invents a substitute condition.

---

# Module-Specific Stop Conditions

`MODULE_PRESCRIPTION_CONTRACTS` (`contracts.ts`) also declares `requiredStopConditionCategories` per Capability Module, independently of the method-level requirement. These module-level lists are broader than what any of the 35 active exercises currently exercises through their `moduleId` (`core`, `grip`, `power`, `strength`), and several reference categories from Section 20 (`intensity_limit`, `range_of_motion_loss`, `coordination_loss`, `acute_symptom`). No active exercise has ever failed resolution because of a module-level requirement beyond what its method already requires — the method-level check (Section 13) is the binding constraint for every currently prescribable exercise.

---

# Exercise-Specific Stop Conditions

Every active exercise entry in `exercisePrescriptionRegistry.ts` builds its own `StopConditionDefinition[]` by calling the Section 4 factories with an exercise-specific `conditionId`, a description grounded in that exercise's own chapter under `50-exercises/`, and `sourceRuleIds` pointing to that chapter. The mechanical shape (`scope`, `trigger.type`, `action`, `priority`, `recoverability`) is never overridden per exercise — only the identifier, the human-readable instruction text and the source citation vary. This is why Sections 8-12 describe the shape exhaustively: it is identical for every exercise using a given category.

---

# Priority and Conflict Resolution

Resolved stop conditions are ordered by `StopConditionPriority`:

```ts
const priorityRank = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
```

`critical` (`pain`) always sorts first when present. Ties within the same priority preserve the order the exercise declared its required/optional condition identifiers in. This ordering is presentational and deterministic — it does not itself resolve a genuine conflict between two simultaneously-firing conditions; the athlete or coach acts on the highest-priority one first, per `StopConditionInstruction`.

This is distinct from Session Conflict Detection (`conflictResolver.ts`, `17_CONFLICT_RULES.md`), which operates on a fully assembled session draft, not on a single exercise's stop conditions.

---

# Validation Rules

`validatePrescription.ts` enforces, independently of resolution:

* `STOP_CONDITIONS_MISSING` (`recoverable: false`) — the resolved prescription has zero stop conditions;
* `REQUIRED_STOP_CATEGORY_MISSING` (`recoverable: false`) — the method's `requiredStopConditionCategories` are not all covered;
* `DUPLICATE_STOP_CONDITION_ID` (`recoverable: true`) — the same `conditionId` appears more than once.

`resolveStopConditions.ts` enforces, before validation is ever reached:

* `STOP_CONDITION_IDENTIFIER_INVALID` — an empty or non-string identifier was requested or defined;
* `STOP_CONDITION_RULE_SOURCE_MISSING` — a definition has no valid `sourceRuleIds`;
* `REQUIRED_STOP_CONDITION_MISSING` — an exercise-required `conditionId` has no matching definition;
* `STOP_CONDITION_CATEGORY_MISSING` — the method's required categories are not all covered by the selected definitions.

---

# Decision Trace Requirements

`prescriptionDecisionTrace.ts` records, for every exercise whose prescription trace includes a `stopConditions` result:

* on success: `"<n> stop condition(s) resolved for exercise "<exerciseId>"."`, plus the count of omitted optional conditions;
* on failure: the resolver's own `message`, unchanged;
* `sourceRuleIds` copied from the resolution result in both cases.

No Decision Trace entry may claim a stop condition was resolved when `resolveStopConditions` returned `ok: false`.

---

# Fallback Behaviour

There is no fallback that invents a stop condition. If a required category or identifier is missing, resolution fails deterministically (Section 17) and the exercise's prescription fails at the `"stop_conditions"` stage (`ExercisePrescriptionFailureStage`) — it is never silently completed without one. A prescription is only ever returned as complete when every required stop-condition category is genuinely covered by real, sourced definitions.

---

# Future Stop Condition Extensions

The following nine categories exist in the `StopConditionCategory` vocabulary, or are required by at least one Training Method or Capability Module contract, but have **no active factory** in `stopConditionRegistry.ts` today:

```text
acute_symptom
coordination_loss
intensity_limit
pace_loss
range_of_motion_loss
environmental_hazard
time_limit
medical
manual_termination
```

For each:

* it already exists in the `StopConditionCategory` vocabulary (`types.ts`), and/or is already named in `requiredStopConditionCategories` for one of the five method contracts not yet used by an active exercise (`combat_rounds`, `work_rest_intervals`, `continuous_aerobic_duration`, `controlled_mobility_sets`, `recovery_duration_work`) or for a module-level contract;
* no factory for it exists in `stopConditionRegistry.ts`;
* none of the 35 currently active exercises depends on it — every active exercise resolves through one of the four methods in Section 13, whose combined required categories are exactly the eight in Section 4;
* it must not be generated automatically. A factory, its exact `scope`/`trigger.type`/`action`/`priority`/`recoverability`, and dedicated tests must all be established from a real source (a method's documented behaviour, a module profile, or an exercise chapter) before any exercise may declare it.

This document intentionally does not propose scope, action, priority or recoverability values for these nine categories — doing so without a documented source would be exactly the kind of invention CAS prohibits.

---

# Test Cases

`resolveStopConditions.test.ts` covers, for the resolver described in Sections 13 and 17:

1. resolving every required stop condition, ordered by priority (critical first);
2. failing safely when a category the method requires is missing from the selected stop conditions;
3. failing safely when a required exercise stop condition has no matching definition;
4. silently omitting an optional stop condition that has no matching definition;
5. determinism: identical input produces an identical result;
6. the resolver does not mutate its input.

Extending this document to a new category (Section 20) must be accompanied by equivalent tests before that category may be treated as active.

---

# Final Principle

> A CAS prescription that does not know when to stop is not a prescription. It is a guess with numbers attached.

Every stop condition documented here as active is already implemented, tested and traceable to a real exercise chapter. Every category documented as a future extension stays inert until it earns the same three things.
