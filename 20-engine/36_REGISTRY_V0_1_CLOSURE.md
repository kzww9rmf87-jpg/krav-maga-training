# PRESCRIPTION REGISTRY V0.1 CLOSURE

Version 0.1

---

> Status: Closure record — describes the state CAS V0.1 ships in.
>
> This document creates no method, no module rule, no Table Group and no
> numerical profile. It records a boundary that already exists in the
> code and states why it was not crossed.

---

# Purpose

The Prescription Registry V0.1 is closed.

This document records what "closed" means, which exercise sits outside
the boundary, why it sits there, and what a future version would have to
change in order to move it.

It exists so that the next contributor does not have to re-derive the
audit, and so that the gap between the Knowledge Base and the
Prescription Registry can never be mistaken for an oversight.

---

# Closing State

```text
ExercisePrescriptionRegistryEntry : 75
ExerciseDefinition                : 76
NumericalPrescriptionProfile      : 23
EquipmentCapability               : 33
```

Every one of these four counters is already asserted by the existing test
suite. This document adds no new authority over them; it explains the
first two.

The difference between 75 and 76 is one exercise:

```text
turkish_get_up
```

It is the only ExerciseDefinition in the catalogue with no registry
entry, and therefore the only exercise CAS V0.1 cannot prescribe
numerically.

---

# Core Principle

> A registry entry is a claim that CAS can state a complete, documented
> dose for an exercise.

An exercise with no entry is not an exercise CAS knows nothing about. It
is an exercise CAS refuses to put a number on.

Closing at 75 of 76 states that refusal in the counters themselves.
Closing at 76 of 76 would have required inventing the numbers the
refusal is about, and the counter would then have misreported the quality
of the system rather than its size.

---

# Three Layers, Three Different Questions

The absence of a registry entry closes exactly one layer. Conflating the
three is the error this section exists to prevent.

## Knowledge Base

```text
20-engine/implementation/exerciseKnowledgeBase.ts
```

Answers: *what is this exercise, physically?*

Module, primary adaptation, physical qualities, movement patterns, force
vectors, equipment requirements, technical level, complexity, laterality,
body regions loaded, contraindications, fatigue profile, evidence level,
combat-sport relevance, substitutions.

`turkish_get_up` is present here and complete.

## Selection

```text
capability selection, exercise selection, scoring, safety, substitution,
conflict resolution, explainability
```

Answers: *should this athlete do this exercise today?*

These engines read the Knowledge Base. They do not read the Prescription
Registry.

`turkish_get_up` is fully active at this layer. It can be selected,
scored, ranked, explained, and it is filtered out correctly by its four
acute contraindications — shoulder, wrist, hip and lumbar.

## Numerical Prescription

```text
20-engine/implementation/prescription/
```

Answers: *how many sets, how many repetitions, at what intensity, with
how much rest?*

This is the only layer requiring a registry entry, and the only layer
closed to `turkish_get_up`.

The consequence is bounded and precise: the exercise exists, it can be
chosen, and it cannot be dosed.

---

# The Excluded Exercise

## Source

```text
50-exercises/40_TURKISH_GET_UP
```

## What the Documentation Already Provides

None of the following would require invention. All of it is quoted from
the fiche or derived from contracts already implemented.

| Dimension | Value | Origin |
|---|---|---|
| Module | `movement` | Primary Classification: Integrated Athletic Movement |
| Method | `straight_sets_repetitions` | only contract-compatible method |
| Volume | 2–5 sets × 1–5 repetitions per side | Loading Profile, literal |
| Laterality | `unilateral` / `repetitions_per_side` | Movement Context AND Loading Profile |
| Intensity | `technical_effort: high_quality` | Velocity Profile + Coaching Cues |
| Equipment | `any_of[kettlebell, dumbbell]` | Equipment Requirements, literal "or" |
| Stop conditions | technical_failure, pain, completion | Common Errors, Safety Profile, Contraindications |
| Tempo | omitted | method declares tempo optional |
| Public contract | unchanged | no vocabulary member required |

Laterality deserves a note: it is documented twice and deduced nowhere,
and it resolves through `validateCompatibility.ts` without a single
conversion. On this dimension the exercise is better served by the
current architecture than any other movement exercise.

## Why the Method Is Not Negotiable

`controlled_mobility_sets` — the method every one of the eight existing
movement entries uses — declares `repetitions` a forbidden volume field.
This fiche counts its volume in repetitions per side. The two are
incompatible by contract, not by preference.

`timed_isometric_sets` would require a prescribed hold this fiche never
describes; its maximal isometric rating describes the demand of holding
position *during* a transition, not a hold that is prescribed.

`straight_sets_repetitions` is authorized for the movement module by both
`31_TRAINING_METHOD_CATALOGUE.md` and `32_MODULE_PRESCRIPTION_PROFILES.md`,
and its `sets_reps` structure with optional laterality matches the
documented volume exactly.

---

# Why the Blockage Is A Business Matter, Not A Technical One

Nothing below is a limitation of the type system, a missing resolver, a
contract that needs widening or work that engineering could complete on
its own. Each blocker is a value or a commitment that only a business
owner is entitled to supply.

## Blocker 1 — No Inter-Set Rest Is Documented

`straight_sets_repetitions` declares:

```text
restPolicy: required
```

and `31_TRAINING_METHOD_CATALOGUE.md` adds that the exact rest value must
be defined by the numerical profile.

The fiche's complete inventory of time-related statements:

| Statement | What it actually is |
|---|---|
| "Typical Recovery: 24 hours" | inter-session recovery |
| "Frequency: 1–3 sessions/week" | inter-session recovery |
| "Move slowly", "Own every transition", "Never rush" | intra-set technical guidance |
| — | no inter-set rest, in any form |

No band can be read off this fiche, and none can be adopted from
elsewhere: unlike Loaded Locomotion Power, which adopted the Power
overview's own documented Peak Power band, the movement module publishes
no rest figure at all — its Rest Policy states only that rest "is
method-dependent and must preserve movement quality".

## Blocker 2 — The Session Role Is Undecidable

```text
straight_sets_repetitions roles : primary, secondary, accessory,
                                  robustness, corrective
movement module roles          : technical, corrective, primer,
                                  secondary, accessory, recovery
intersection                   : secondary, accessory, corrective
```

`technical` — the role all eight existing movement entries use — is not
available, so this entry would also be the module's first non-technical
one.

The fiche does not choose between the three that remain. Its only
placement statement, "Can be integrated into warm-ups, strength sessions
or recovery days", spans three different roles and therefore determines
none.

The contrast is exact: `grip_repetition_strength_v0_1` grounds its
`secondary` role in `65_GRIP/00_OVERVIEW.md`'s own "Placement Within the
Session" section. This fiche has no such section.

## Blocker 3 — No Doctrine Can Honestly Carry It

No numerical profile exists on the triple:

```text
movement / straight_sets_repetitions / *
```

CAS explicitly permits creating a doctrine before its second consumer.
Two Table Groups say so in writing. But both meet conditions this
exercise does not.

| | Table Group 15 | Table Group 19 | Table Group 18 | turkish_get_up |
|---|---|---|---|---|
| Doctrine | Grip Repetition Strength | Loaded Locomotion Power | Partner Grappling Rounds | — |
| Members at creation | 1 | 1 | 3 | 1 |
| Owning chapter | `65_GRIP/00_OVERVIEW.md` | `64_POWER/00_OVERVIEW.md` | none — written from a real family | **none exists** |
| Future consumers named | yes | yes (prowler push, sled drag) | yes | **none nameable** |
| Rest band origin | documented in chapter | adopted from chapter | invented, bounded by 3 members | **nothing to read, adopt or bound** |

Two structural facts close this off.

First, the movement module has no chapter. `50-exercises/` holds
`62_CORE`, `63_PLYOMETRICS`, `64_POWER`, `65_GRIP`, `66_CARRIES` and
`67_BALLISTICS`. There is no movement chapter, so there is no document
that could own a movement doctrine the way the Grip and Power overviews
own theirs.

Second, no second member exists among the 76. Of the twelve movement
exercises, `turkish_get_up` is the only one that is unilateral and the
only one requiring an external implement rather than a mat, a partner, a
wall or floor space. The eleven others share with it only the fact that
some of them count repetitions — which Table Group 15's own "Units
Excluded" section forbids as a grouping criterion, in those terms.

A doctrine written today would have one member, no owning document, no
nameable successor and a rest band validated against nothing. Its only
motivation would be to move the counter from 75 to 76.

---

# Conditions For A Future Integration

Integration becomes legitimate when **either** path below is complete.
Both are business paths; neither is unlocked by engineering work alone.

## Path 1 — A Second Member Appears

A documented exercise sharing the same mechanics: an external load held
in an unstable position, a transition between distinct postures, volume
in repetitions per side, and a governing technical standard.

The family then becomes real, and the rest band can be bounded by the
intersection of two documented Loading Profiles — the method Partner
Grappling Rounds used with three.

## Path 2 — A Movement Chapter Is Created

A `50-exercises/6X_MOVEMENT/00_OVERVIEW.md` on the model of `65_GRIP` and
`64_POWER`, giving the module a document able to own prescription ranges.

This is the deeper structural gap. The movement module is the only active
module without a chapter, and that will block every future movement
exercise whose prescription falls outside `controlled_mobility_sets` —
not only this one.

## Path 3 — An Explicit Business Decision

A business owner may instead decide, on the record:

1. the inter-set rest band — floor, ceiling and normal — carried by its
   own rule id, on the model of `MOVEMENT_PARTNER_GRAPPLING_REST_V0_1`,
   and never attributed to the exercise chapter;
2. the session role, among `secondary`, `accessory` and `corrective`;
3. that a category with a single consumer and no owning chapter is
   accepted, with the absence of nameable future consumers stated in
   writing rather than implied.

This decision is available and legitimate. It has simply not been taken,
and it must not be taken in order to reach 76 of 76.

---

# What Must Never Be Done

- do not read "# Physiological Profile — Typical Set Duration: 20–60
  seconds" as a prescribed volume. That field appears in 32 fiches,
  `01_BACK_SQUAT` and `10_PULL_UP` both carry "5–40 seconds", it is cited
  as a volume source nowhere in the registry, and
  `42_ROTATOR_CUFF_TRAINING` carries the identical "20–60 seconds" while
  being prescribed in sets × repetitions. Using it here would silently
  reclassify that field for all 32;
- do not convert repetitions into duration to reach
  `controlled_mobility_sets`;
- do not invent an RPE, an RIR or a load figure — none appears in the
  fiche;
- do not encode "Typical Intensity: Light to Moderate" as a
  `resistance_category`. `IntensityCategoryRule` admits only
  `movement_intent`, `technical_effort` and `impact_intent`, so no profile
  rule can carry it whatever the module permits;
- do not group this exercise with other movement exercises merely because
  they count repetitions;
- do not create a resolver branch or a special case keyed on this
  ExerciseId;
- do not remove the test asserting this exercise's absence from the
  registry. That test is the executable form of this document.

---

# Final Principle

> 75 of 76 is a measurement. 76 of 76 would have been a claim.

The registry closes at 75 because one exercise is documented well enough
to be selected and not well enough to be dosed, and CAS states that
distinction instead of dissolving it.
