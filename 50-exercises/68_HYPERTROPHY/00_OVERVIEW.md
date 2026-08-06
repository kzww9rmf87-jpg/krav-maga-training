# HYPERTROPHY OVERVIEW

Version 1.0

---

# Purpose

This document defines the Hypertrophy exercise family in CAS: what it is for, which exercises belong to it, and — as importantly — which exercises do not.

The family exists to answer a request CAS could previously not answer at all: an athlete asking for muscular development.

---

# Philosophy

A combat athlete does not train muscle for its own sake.

Muscular development is pursued because it supports force production, protects tissue against repeated impact, and replaces mass lost to weight-making and high training volume.

The family is therefore built around three constraints that combat practice imposes:

- it must fit beside technical training rather than compete with it;
- it must work with the equipment an athlete actually owns;
- it must not require athlete data CAS cannot collect.

Every chapter in this family respects all three.

---

# Primary Classification

Hypertrophy

---

# Secondary Classifications

General Physical Preparation

Injury Prevention

Unilateral Strength

Athletic Development

---

# Primary Adaptation

Functional Hypertrophy

---

# Why This Family Exists

Before this family, the CAS catalogue contained no exercise whose primary adaptation was functional hypertrophy.

Not one, at any equipment level, including a fully equipped gym.

The consequence was measured in Lot H2.2: every hypertrophy request returned `blocked`, and every home-equipment strength request returned an accessory-only session that session adequacy correctly reported as inadequate.

The prescription layer was never the obstacle. `functional_hypertrophy_primary_v0_1` has existed in the numerical tables throughout, and it prescribes from RPE or RIR with `requiresExerciseSpecificLoadRule: false` — meaning a hypertrophy exercise needs no recorded one-repetition maximum, no training max and no estimated load.

The obstacle was that no exercise had been documented for it.

---

# Loading Doctrine

Every exercise in this family is prescribed through the same profile.

```text
profileId: functional_hypertrophy_primary_v0_1
moduleId:  functional_hypertrophy
methodId:  straight_sets_repetitions
role:      primary
sets:      3–4
reps:      6–12
intensity: RPE 7–9 or RIR 1–3
rest:      90–180 seconds
tempo:     controlled
```

Two consequences follow, and both are deliberate.

**No loading reference is required.** An athlete who has never tested a one-repetition maximum can be prescribed this entire family on the day they install the application. This is what makes the family viable for the initial target user.

**Proximity to failure is the intensity variable.** RPE and RIR are already documented members of the CAS intensity vocabulary and are already used by existing profiles. This family introduces no new intensity concept.

---

# The Bodyweight Strength Boundary

This family exists partly to hold a line that would otherwise be crossed for convenience.

CAS does support bodyweight maximum-strength drivers. `strength_primary_straight_sets_v0_1` offers three intensity options — percentage of one-repetition maximum, RPE and RIR — at three to six repetitions, and the exercise's own supported intensity types decide which is used. The Pull-Up is prescribed this way, without a recorded maximum.

So the question for a bodyweight movement is not whether it is bodyweight. It is:

> Does the movement's documented repetition capacity, for this population, overlap three to six repetitions at RPE 7.5–9?

A Pull-Up does, for most amateurs.

A Push-Up does not. An athlete who performs twenty repetitions is nowhere near RPE 8 at six, and no amount of classification changes that. The Push-Up is therefore documented here, as hypertrophy, and not in the strength family.

This boundary is recorded before any of these exercises reach the engine, so that classification is decided by doctrine rather than by whichever module makes a session look complete.

---

# Family Members

| Exercise | Pattern | Equipment | Unilateral |
|---|---|---|:-:|
| Push-Up | Horizontal Push | None | No |
| Split Squat | Squat | None | Yes |
| Single-Leg Hip Thrust | Hinge | None | Yes |
| Goblet Squat | Squat | Dumbbell or Kettlebell | No |
| Dumbbell Bench Press | Horizontal Push | Dumbbells, Bench | No |
| One-Arm Dumbbell Row | Horizontal Pull | Dumbbell | Yes |
| Dumbbell Romanian Deadlift | Hinge | Dumbbells | No |

---

# Coverage Intent

The family is sized to make two equipment profiles usable, not to be exhaustive.

**Bodyweight only** gains a horizontal push, a squat and a hinge — enough for a complete lower-body and pushing session.

**Bodyweight plus dumbbells** gains, in addition, a loaded squat, a loaded push, a horizontal pull and a loaded hinge — enough for a complete session in every fundamental pattern.

---

# What This Family Does Not Cover

**Bodyweight horizontal pull.** There is no honest way to train a horizontal pull with no equipment whatsoever. An inverted row requires a bar, a rack, rings or a sturdy support, and CAS should not pretend otherwise. An athlete with no equipment at all cannot train this pattern, and that limitation is recorded rather than papered over.

**Vertical push.** No exercise in this family presses overhead. The pattern is already served for equipped athletes and is deliberately left out of the minimum family.

**Progression-level variants.** Decline Push-Up, Diamond Push-Up, Pike Push-Up and Nordic Curl progressions were all considered and excluded. Each differs from its parent exercise only in leverage or progression level, and CAS currently collects no athlete input that could distinguish them. Prescribing a Decline Push-Up rather than a Push-Up would be a guess dressed as a decision.

They remain documented here as progressions within their parent chapters, which is where an athlete and a coach can use them, and where CAS does not have to choose between them.

---

# Interference With Combat Practice

Each chapter records a recovery profile and an explicit interference rating, because a hypertrophy session that ruins the next day's sparring has failed regardless of the muscle it built.

The family divides into two groups.

**Low interference** — Push-Up, Single-Leg Hip Thrust, One-Arm Dumbbell Row. Local fatigue, minimal systemic cost, and usable on the same day as technical work at reduced volume.

**Moderate interference** — Split Squat, Goblet Squat, Dumbbell Bench Press, Dumbbell Romanian Deadlift. These should not precede technical work on the same day.

The Dumbbell Romanian Deadlift carries the longest recovery window in the family, because eccentric loading through hamstring length produces delayed-onset soreness disproportionate to the apparent effort of the session.

---

# Evidence Position

The family follows the citation policy in `99-reference/REFERENCES.md`.

Where a claim rests on well-established resistance-training evidence — that loaded squatting develops the lower body, that horizontal pulling develops the upper back — it is stated plainly and graded four or five stars.

Where a claim concerns a specific variation rather than the pattern, the evidence is weaker and is recorded as such. The goblet position, the grounded split stance and the one-arm supported row are all treated as accessibility and technique decisions rather than as claims of distinct adaptation.

Where a claim concerns transfer to combat performance, it is labelled expert consensus. No chapter presents transfer as a demonstrated effect.

No chapter cites a study it does not name, and no chapter names a study.

---

# Interaction With CAS

The family informs:

Capability Mapping

Exercise Ontology

Decision Engine

Recovery Engine

Progression Engine

Safety Engine

Explainability Engine

---

# Final Principle

This family is small on purpose.

Seven exercises, four movement patterns, two equipment profiles, one prescription profile, and no athlete data that CAS cannot already collect.

It is the smallest set that turns "your session could not be generated" into a session worth doing.
