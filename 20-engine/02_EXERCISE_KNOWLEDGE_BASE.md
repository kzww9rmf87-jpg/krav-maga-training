# EXERCISE KNOWLEDGE BASE

Version 0.1

---

# Purpose

The Exercise Knowledge Base is the central repository of all exercises used by the Combat Athlete System.

Its purpose is not to catalogue movements.

Its purpose is to describe the physiological value of each exercise so the Decision Engine can select the right tool for the right athlete, at the right time.

Exercises are never chosen because they are popular.

They are selected because they produce the desired adaptation at the lowest acceptable physiological cost.

---

# Core Principle

Exercises are interchangeable.

Adaptations are not.

If two exercises produce the same adaptation, the Decision Engine selects the one that best fits the athlete's context.

The Knowledge Base therefore describes adaptations rather than preferences.

---

# Exercise Identity

Every exercise must contain the following information.

## General

- Name
- Version
- Category
- Description

---

## Primary Adaptation

Exactly one.

Examples

- Maximum Strength
- Power
- Functional Hypertrophy
- Movement
- Robustness
- Conditioning
- Recovery
- Specific Skill

---

## Secondary Adaptations

Additional adaptations that may occur.

These adaptations never justify choosing the exercise alone.

---

# Physiological Cost

Each exercise must be evaluated across several independent dimensions.

## Neural Cost

Required neural demand.

Scale

1–5

---

## Muscular Cost

Local muscular fatigue.

Scale

1–5

---

## Connective Tissue Cost

Stress applied to tendons, ligaments and joints.

Scale

1–5

---

## Metabolic Cost

Cardiovascular and energetic demand.

Scale

1–5

---

## Recovery Cost

Estimated recovery required before repeating the same stimulus.

Measured in hours.

---

# Technical Complexity

Every exercise has a learning cost.

Levels

1 — Natural movement

2 — Basic technique

3 — Intermediate

4 — Advanced

5 — Expert

Complexity influences when and for whom the exercise may be prescribed.

---

# Transfer Score

Exercises are evaluated according to their transfer toward the target activity.

Transfer is always context-dependent.

Examples

Krav Maga

General Physical Preparedness

Combat Sports

Healthy Aging

Occupational Performance

Transfer Scores are therefore dynamic rather than absolute.

---

# Risk Profile

Risk is never evaluated in isolation.

It always considers

- technical complexity
- fatigue
- athlete experience
- recovery state
- load

The Knowledge Base stores relative risk rather than fixed risk.

---

# Compatibility

Each exercise specifies

Compatible Modules

Compatible Adaptation Domains

Compatible Training Phases

Compatible Athlete Profiles

---

# Contraindications

Exercises may become temporarily unavailable because of

Pain

Injury

Fatigue

Equipment limitations

Training phase

Movement restrictions

The Decision Engine must automatically select alternatives.

---

# Alternatives

Every exercise should provide

Regression

Equivalent

Progression

The athlete should never lose a planned adaptation because one exercise cannot be performed.

---

# Progression Model

Each exercise defines

Entry Level

Progression Strategy

Regression Strategy

Performance Indicators

Exit Criteria

---

# Exercise Metadata

Optional information includes

Equipment Required

Estimated Setup Time

Estimated Session Time

Space Requirements

Indoor / Outdoor

Partner Required

Coach Required

---

# Scientific Evidence

Every exercise must reference the evidence supporting its use.

Evidence is classified according to the CAS Evidence Framework.

Level 1

Scientific consensus.

Level 2

Expert practice.

Level 3

Internal CAS experimentation.

The system always displays the evidence level associated with an exercise recommendation.

---

# Decision Philosophy

The Exercise Knowledge Base never decides.

It only describes.

Selection belongs exclusively to the Decision Engine.

This separation guarantees that scientific knowledge remains independent from programming logic.

---

# Minimum Viable Catalogue — Coverage as of Lot H2.2

## The question this section answers

Lots H2 and H2.1 left the engine honest: an inadequate session is detected, and
selection secures a prescribable adaptation driver before accessories. What
remained was a CATALOGUE question — for most equipment an athlete actually owns,
no exercise exists that can drive the requested adaptation.

`__tests__/catalogueCoverage.test.ts` measures this per equipment profile and
adaptation, and asserts it. A zero below is not an engine defect. It is a
statement about what this repository has documented.

## Initial target user

A combat-sport amateur training two to four times per week, wanting two or three
physical-preparation sessions.

## Coverage matrix — prescribable drivers

Measured by `__tests__/catalogueCoverage.test.ts`. The hypertrophy column is the
one Lot H2.2B changed; every other number is untouched.

| Equipment profile | max strength | hypertrophy | power | conditioning | robustness | skill |
| --- | --- | --- | --- | --- | --- | --- |
| bodyweight | **0** | 3 | 5 | **0** | 4 | 2 |
| bodyweight + pull-up bar | 1 | 3 | 5 | **0** | 5 | 2 |
| bands | **0** | 3 | 5 | **0** | 5 | 2 |
| dumbbells | **0** | 6 | 5 | **0** | 4 | 2 |
| kettlebell | **0** | 4 | 5 | **0** | 4 | 2 |
| medicine ball | **0** | 3 | 11 | **0** | 4 | 2 |
| full gym | 10 | 7 | 17 | 2 | 7 | 7 |

## What the matrix says

**The `functional_hypertrophy` module is empty catalogue-wide.** Not one
exercise, at any equipment level. This is the largest single gap and the one
that needs no engine work: `functional_hypertrophy_primary_v0_1` already exists
in the numerical tables (3-4 sets, 6-12 repetitions, RPE 7-9 or RIR 1-3,
`requiresExerciseSpecificLoadRule: false`), so a hypertrophy exercise would be
prescribable WITHOUT any athlete loading reference.

**No home profile can drive strength or hypertrophy**, with one exception. An
athlete with dumbbells, a kettlebell or bands can currently be served jumps,
robustness work and shadow boxing — nothing else.

**Conditioning requires a machine.** Both conditioning drivers are ergometers.

## Bodyweight maximum-strength doctrine

CAS DOES support bodyweight maximum-strength drivers, and `pull_up` is the proof.

`strength_primary_straight_sets_v0_1` offers THREE intensity options —
`percentage_1rm` (80-90%), `rpe` (7.5-9) and `rir` (1-3) — at 3-6 repetitions.
Which one is used is decided by the EXERCISE's own
`supportedIntensityTypes`. `bench_press` prefers `percentage_1rm` and therefore
needs a recorded 1RM; `pull_up` declares `["rpe", "rir"]` and is prescribed
without one.

So the test for a bodyweight maximum-strength driver is not "is it bodyweight"
but:

```text
Does the movement's documented repetition capacity, for this population,
overlap 3-6 repetitions at RPE 7.5-9?
```

A pull-up does, for most amateurs. A standard push-up does not: an athlete who
performs twenty is nowhere near RPE 8 at six. A push-up is therefore
NOT a maximum-strength driver, and classifying it as one would be a false
adaptation claim — `functional_hypertrophy` (6-12 at RPE 7-9) is its honest
module, and `strength`/`accessory` (4-15 at RPE) its honest alternative.

This is stated in advance of any push-up entry so that the classification is
decided by doctrine rather than by whichever module makes a session look full.

## Why no exercise was added in Lot H2.2

Every exercise in this catalogue carries `sourceRuleIds` pointing at a real
chapter, and every field — muscular profile, contraindications, fatigue ratings,
technical level, dose constraints, stop conditions — is quoted from it.

**There is no source material for the exercises that would close the gaps
above.** `50-exercises/` documents 37 chapters; all 37 are already in the
catalogue. There is no chapter for a push-up, a dumbbell press, a goblet squat,
a kettlebell swing, an inverted row or any band movement.

Writing those entries would mean inventing physiological facts, dose constraints
and source identifiers. `CLAUDE.md` forbids it, and it is the one thing a
knowledge base cannot recover from: a fabricated contraindication is invisible
until it injures somebody.

The catalogue therefore stays as it is, and the gap is now measured instead of
felt.

## One catalogued exercise that cannot be prescribed

`turkish_get_up` is catalogued, sourced, and eligible for exactly the two
profiles with the fewest drivers — dumbbell and kettlebell. It has no
prescription entry, and cannot be given one from the documented tables:

* its chapter documents 2-5 sets of 1-5 REPETITIONS per side;
* the only repetition-based `movement` profile counts partner rounds;
* `controlled_mobility_sets_v0_1` is a 20-60 second HOLD and would contradict
  the chapter.

Prescribing it as a timed hold would misrepresent a documented movement; adding
a repetition-based movement profile would mean inventing dose numbers
`34_NUMERICAL_PRESCRIPTION_TABLES.md` does not carry. Both were refused.

## Source material required, in priority order

1. ~~**A hypertrophy family**~~ — **DELIVERED by Lot H2.2A.** Seven chapters in
   `50-exercises/68_HYPERTROPHY/`, with a family overview and comparison
   document: Push-Up, Split Squat, Single-Leg Hip Thrust, Goblet Squat,
   Dumbbell Bench Press, One-Arm Dumbbell Row, Dumbbell Romanian Deadlift.
   They cover horizontal push, horizontal pull, squat and hinge across the
   bodyweight and dumbbell profiles, and every one prescribes through
   `functional_hypertrophy_primary_v0_1` — RPE 7-9 or RIR 1-3, no athlete
   loading reference required.
   NOT YET INTEGRATED: the knowledge base and prescription registry are
   unchanged, so the coverage matrix below still reads zero. Integration is a
   separate lot.
2. **Dumbbell and kettlebell strength** — press, row, squat, hinge, carry.
3. **A repetition-based movement profile**, which would also unlock
   `turkish_get_up`.
4. **Band movements**, the cheapest equipment an athlete can add.

Two documented families exist and were NOT added, because neither closes a gap
above: `61-CABLE-COMBAT` (six sheets, loaded striking resistance — the full-gym
profile already has 17 power drivers) and the medicine-ball family, which is
already fully catalogued.

Lot H2.2A has since written the hypertrophy source chapters that were missing.
The statement above remains accurate for the catalogue itself: no exercise has
been added to `exerciseKnowledgeBase.ts`, and the matrix is unchanged until an
integration lot consumes those chapters.

## Unsupported combinations

A request is honestly `inadequate` — not a defect — when the matrix shows zero:

* bodyweight-only maximum strength (the Lot H2 regression);
* any home-profile hypertrophy;
* any home-profile conditioning.

---

# Hypertrophy Runtime Integration — Lot H2.2B

## Status

The seven chapters in `50-exercises/68_HYPERTROPHY/` are live. Every hypertrophy
request that previously returned `blocked` now returns a session.

| Exercise | Pattern | Equipment | Laterality |
| --- | --- | --- | --- |
| `push_up` | horizontal push | none | bilateral |
| `split_squat` | squat | none | unilateral |
| `single_leg_hip_thrust` | hinge | none | unilateral |
| `goblet_squat` | squat | dumbbell **or** kettlebell | bilateral |
| `dumbbell_bench_press` | horizontal push | dumbbells + bench | bilateral |
| `one_arm_dumbbell_row` | horizontal pull | dumbbell | unilateral |
| `dumbbell_romanian_deadlift` | hinge | dumbbells | bilateral |

All seven are `module: functional_hypertrophy`, `role: primary`, and resolve
`functional_hypertrophy_primary_v0_1`: 3-4 sets, 6-12 repetitions, RPE 7-9 or
RIR 1-3, 90-180 s rest.

## No athlete reference is required

Every entry declares an empty `requiredAthleteReferenceTypes`, and the profile
declares `requiresExerciseSpecificLoadRule: false`. An athlete who has never
tested a one-repetition maximum can be prescribed this entire family on the day
they install the application.

Nothing in the family supports `percentage_1rm`, and a generated session's
prescription contains neither the string `one_rep_max` nor `percentage_1rm` —
asserted, not assumed.

## Canonicalization

Each of these is a SEPARATE canonical exercise rather than a second prescription
on an existing one, and the reason is the contract rather than preference:

* `ExerciseDefinition` carries ONE `module` and ONE `primaryAdaptation`;
* `EXERCISE_PRESCRIPTION_REGISTRY` holds ONE entry per exercise id.

A single canonical exercise therefore cannot carry both a maximum-strength and a
hypertrophy prescription. `goblet_squat` is not `back_squat` at a different
intensity; it is a different entity with a different adaptation, a different
equipment requirement and a different load ceiling.

`split_squat` is distinct from `bulgarian_split_squat` on the source's own terms:
the rear foot is grounded, and `06_BULGARIAN_SPLIT_SQUAT` names the Split Squat
as its regression.

## Movement patterns and loaded regions

Transcribed strictly, and this is load-bearing rather than cosmetic. No chapter
lists `isometric` as a movement pattern — the isometric work each describes is a
CONTRACTION profile, and the brace is carried by `anti_extension` or
`anti_rotation`. `bodyRegionsLoaded` takes each chapter's Primary and Secondary
muscles only; Stabilizers are excluded, so a push-up does not claim to load the
abdomen.

Rule 32 calls two exercises redundant when they share an adaptation, a movement
pattern AND a loaded region. Carrying `isometric` and `abdomen` on every entry
made the whole family mutually redundant, and a 30-minute bodyweight session
composed ONE exercise where three were available.

## Equipment modelling

`requiredEquipmentCapabilities` is a conjunction, so an exercise usable with
either of two implements cannot express that there. Two mechanisms carry it:

* the alternative lives in `supportedLoadingModes`, and
* eligibility has already checked the athlete owns one, because the knowledge
  base carries the `any_of` clause.

The Goblet Squat additionally required a new equivalence group,
`dumbbell_or_kettlebell` — the chapter's `dumbbell | kettlebell` restated as one
id, on the `cable_or_band_resistance` precedent. It is EXACT, not coarser, so it
authorizes nothing the exercise's own requirement does not already allow.
`EquipmentCapabilityId` is deliberately not part of the public contract, so this
is not a contract change.

The three bodyweight entries require NOTHING. Declaring `open_space` would make
them selectable but unprescribable for an athlete who has not declared it — the
failure mode `hollow_body_hold` already demonstrates.

## Representative sessions

Produced by the engine under domain rules, not hardcoded:

```text
bodyweight / 30 min   push_up + single_leg_hip_thrust + split_squat     27 min
bodyweight / 20 min   push_up + single_leg_hip_thrust                   17 min
dumbbells  / 30 min   one_arm_dumbbell_row + push_up + hip_thrust       27 min
kettlebell / 30 min   push_up + single_leg_hip_thrust + goblet_squat    25 min
```

The 20-minute session holds two exercises rather than three because the time
budget removed the third — not because a rule caps it.

## What is still unsupported

**Bodyweight horizontal pull.** A horizontal pull needs something to pull
against. No exercise in this family provides it without equipment, and CAS does
not substitute a vertical pull and call it equivalent.

**Bodyweight maximum strength.** Unchanged by this lot and still correctly
`inadequate`. A hypertrophy exercise cannot establish maximum-strength coverage:
coverage is decided by the exercise's own adaptation.

**Progression level.** The chapters document progressions — decline push-ups,
weighted variations, rear-foot elevation — but CAS collects no athlete input that
could choose between them, so none is prescribed. Where bodyweight becomes too
easy, the chapter's progression list is advice for a coach, not a decision the
engine may take. This is the single largest limitation of the family, and
closing it needs an input, not an exercise.

**Vertical push, and bands.** No overhead press and no band movement exists at
any equipment level.

## Remaining catalogue gaps

Unchanged by this lot: `conditioning` still needs a machine, `recovery` still has
no exercise, and `turkish_get_up` remains catalogued but unprescribable for want
of a repetition-based `movement` profile.

---

# Definition of Success

The Exercise Knowledge Base succeeds when every exercise can answer one simple question.

"What adaptation does this exercise produce, and at what physiological cost?"

If this question cannot be answered clearly, the exercise does not belong in the Combat Athlete System.
