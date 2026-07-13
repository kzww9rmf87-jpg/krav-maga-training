# SCORING MODEL

Version 0.1

---

# Purpose

The Scoring Model defines how the Combat Athlete System evaluates, compares and ranks training options.

It converts qualitative coaching rules into structured decision criteria.

The model may be used to score:

* exercises,
* exercise variations,
* substitutions,
* Capability Modules,
* session structures,
* conditioning modalities,
* progression options,
* and recovery adjustments.

The Scoring Model does not replace coaching logic.

It supports coaching logic by making decisions:

* consistent,
* explainable,
* reproducible,
* athlete-specific,
* and auditable.

The fundamental principle is:

> A high score does not make an option valid if it violates a mandatory rule.

Scoring ranks valid options.

It does not authorize unsafe or incoherent options.

---

# Core Principle

Every training option is evaluated through three layers:

1. Eligibility
2. Suitability
3. Priority

## Eligibility

Eligibility determines whether the option may be used at all.

It includes hard constraints such as:

* safety,
* contraindications,
* equipment availability,
* technical feasibility,
* environmental feasibility,
* and compatibility with the current session objective.

An ineligible option is excluded before scoring.

## Suitability

Suitability determines how well the option fits:

* the desired adaptation,
* the athlete,
* the session,
* and the current context.

Suitability is expressed through weighted criteria.

## Priority

Priority determines whether the option should be selected now rather than later.

It considers:

* current training phase,
* weekly priorities,
* recovery status,
* recent exposure,
* adaptation needs,
* and interference risk.

---

# Scoring Architecture

The scoring process follows this sequence:

```text
Training Objective
        ↓
Candidate Generation
        ↓
Hard Eligibility Filter
        ↓
Criterion Scoring
        ↓
Weight Application
        ↓
Context Modifiers
        ↓
Penalty Application
        ↓
Confidence Adjustment
        ↓
Final Score
        ↓
Ranking
        ↓
Selection or Manual Review
```

No candidate should receive a final score before passing the eligibility filter.

---

# Rule 1 — Scores Support Decisions

Scores are decision-support tools.

They must not be treated as absolute biological truths.

A score represents the quality of an option according to the information currently available.

Scores may change when:

* athlete readiness changes,
* pain appears,
* equipment changes,
* training priorities change,
* new feedback is recorded,
* a competition approaches,
* or the system receives better data.

The score belongs to a context.

It is not a permanent property of an exercise.

---

# Rule 2 — Scoring Scale

The default criterion scale is:

| Score | Meaning                 |
| ----- | ----------------------- |
| 0     | Completely incompatible |
| 1     | Very poor fit           |
| 2     | Poor fit                |
| 3     | Acceptable fit          |
| 4     | Strong fit              |
| 5     | Excellent fit           |

Half-point values may be used when greater precision is justified.

Examples:

* 2.5
* 3.5
* 4.5

The system should avoid false precision.

A score such as 4.173 should not be used unless it results from measurable normalized data.

---

# Rule 3 — Hard Filters Before Scores

A candidate must be excluded before scoring when it violates a hard rule.

Hard exclusion conditions include:

* significant pain,
* medical contraindication,
* unsafe environment,
* unavailable mandatory equipment,
* technical level clearly insufficient,
* excessive risk under current fatigue,
* conflict with the primary adaptation,
* unacceptable interference with combat practice,
* or inability to execute the exercise correctly.

Hard filters return:

```text
Eligibility = FALSE
Final Score = NOT APPLICABLE
```

The system must not assign a low score to an option that should be prohibited.

It must exclude it.

---

# Rule 4 — Mandatory Criteria

Certain criteria are mandatory.

A candidate may only proceed if it reaches the minimum threshold in each mandatory criterion.

Default mandatory criteria are:

* Safety
* Primary Adaptation Match
* Athlete Compatibility
* Technical Feasibility
* Equipment Feasibility
* Environmental Feasibility

Default minimum threshold:

```text
Minimum Mandatory Criterion Score = 3 out of 5
```

The threshold may be increased for:

* maximum-strength exercises,
* high-impact plyometrics,
* sprinting,
* ballistic exercises,
* high-intensity combat work,
* or unsupervised sessions.

---

# Rule 5 — Criterion Groups

The model uses six main criterion groups:

1. Adaptation Value
2. Athlete Compatibility
3. Execution Quality
4. Fatigue and Recovery
5. Context Compatibility
6. Long-Term Development

Each group contains several criteria.

---

# Group 1 — Adaptation Value

Adaptation Value measures how effectively the option supports the intended physiological or technical objective.

Criteria include:

* Primary Adaptation Match
* Secondary Adaptation Contribution
* Movement Pattern Match
* Force Direction Match
* Contraction Type Match
* Velocity Profile Match
* Range of Motion Relevance
* Combat Transfer
* Specificity to Training Phase

---

# Primary Adaptation Match

This criterion measures how directly the option develops the primary target adaptation.

Examples:

## Score 5

The exercise is highly effective and directly aligned with the target.

## Score 4

The exercise strongly supports the target with minor limitations.

## Score 3

The exercise can develop the target but is not the best available option.

## Score 2

The exercise has only a partial effect.

## Score 1

The relationship is weak.

## Score 0

The exercise does not support or directly conflicts with the target.

Primary Adaptation Match is one of the highest-weighted criteria.

---

# Secondary Adaptation Contribution

This criterion measures useful additional benefits.

Examples include:

* trunk stiffness during loaded carries,
* grip strength during pulling work,
* tendon loading during controlled strength exercises,
* coordination during unilateral work,
* aerobic contribution during technical bag rounds.

Secondary benefits must not compensate for poor primary adaptation match.

---

# Movement Pattern Match

This criterion evaluates whether the candidate matches the required movement function.

Examples:

* vertical pull,
* horizontal push,
* squat,
* hinge,
* lunge,
* rotation,
* anti-rotation,
* sprint,
* jump,
* punch,
* kick,
* clinch,
* ground transition.

A high movement match is especially important for substitutions.

---

# Force Direction Match

This criterion evaluates whether force is applied in a relevant direction.

Directions may include:

* vertical,
* horizontal,
* rotational,
* lateral,
* diagonal,
* anterior-posterior,
* upward,
* downward.

Force direction receives more weight in:

* power training,
* sprint preparation,
* striking development,
* and combat-specific work.

---

# Contraction Type Match

This criterion evaluates the similarity or relevance of the dominant muscular contraction.

Possible contraction profiles include:

* concentric,
* eccentric,
* isometric,
* ballistic,
* stretch-shortening cycle,
* yielding isometric,
* overcoming isometric.

This criterion is particularly important for:

* robustness,
* rehabilitation,
* plyometrics,
* and exercise substitution.

---

# Velocity Profile Match

This criterion evaluates whether the option permits the intended movement speed.

Velocity profiles include:

* maximal velocity,
* high velocity,
* moderate velocity,
* controlled velocity,
* slow eccentric,
* isometric.

Power and speed exercises require a high Velocity Profile Match.

A movement performed too slowly cannot receive a high power score only because it uses the same muscles.

---

# Range of Motion Relevance

This criterion evaluates whether the range of motion:

* trains the intended positions,
* is safe for the athlete,
* provides useful tissue exposure,
* and matches the adaptation.

A reduced range may score highly when it is strategically selected.

A full range is not automatically superior in every context.

---

# Combat Transfer

Combat Transfer evaluates the expected contribution to combat performance.

Transfer may occur through:

* greater force production,
* faster force expression,
* stronger force transmission,
* rotational power,
* unilateral stability,
* impact tolerance,
* conditioning,
* grip strength,
* movement efficiency,
* or tissue robustness.

Visual similarity alone does not justify a high transfer score.

---

# Specificity to Training Phase

This criterion evaluates whether the option is appropriate for the current phase.

Examples:

* general preparation,
* strength accumulation,
* power conversion,
* sport-specific preparation,
* competition preparation,
* taper,
* return to training,
* recovery phase.

An exercise may be highly effective in general but poorly timed within the current phase.

---

# Group 2 — Athlete Compatibility

Athlete Compatibility measures how well the option fits the individual.

Criteria include:

* Training Age Compatibility
* Technical Skill Compatibility
* Mobility Compatibility
* Morphological Compatibility
* Injury History Compatibility
* Pain Compatibility
* Confidence
* Adherence Probability
* Previous Athlete Response

---

# Training Age Compatibility

This criterion evaluates whether the option fits the athlete’s experience.

A beginner usually benefits from:

* simpler exercises,
* stable movement patterns,
* low setup complexity,
* and easy progression.

An advanced athlete may benefit from:

* more specific loading,
* higher technical demand,
* greater variation,
* or advanced velocity methods.

Complexity alone does not indicate advancement.

---

# Technical Skill Compatibility

This criterion measures whether the athlete can execute the option with sufficient control.

The score considers:

* movement understanding,
* coordination,
* consistency,
* ability under fatigue,
* and need for supervision.

A technically effective exercise may score poorly if the athlete cannot yet execute it safely.

---

# Mobility Compatibility

This criterion evaluates whether the athlete has the mobility required for the movement.

It should distinguish between:

* mobility limitation,
* motor-control limitation,
* fear,
* pain,
* and unfamiliarity.

The system should not automatically exclude an exercise when a safe regression exists.

---

# Morphological Compatibility

This criterion evaluates the relationship between the exercise and the athlete’s proportions.

Relevant factors may include:

* limb length,
* torso length,
* shoulder structure,
* hip structure,
* joint orientation,
* and body mass.

Morphology should guide variation selection rather than create rigid assumptions.

---

# Injury History Compatibility

This criterion evaluates whether the option is appropriate given previous injuries or recurring vulnerable areas.

The score should consider:

* recurrence risk,
* tissue tolerance,
* current restrictions,
* and previous response.

Past injury does not automatically prohibit an exercise.

---

# Pain Compatibility

Pain Compatibility evaluates whether the movement is currently symptom-free and tolerated.

Default interpretation:

| Score | Pain response                                     |
| ----- | ------------------------------------------------- |
| 5     | No pain or symptoms                               |
| 4     | Minimal, stable and acceptable discomfort         |
| 3     | Mild discomfort requiring monitoring              |
| 2     | Clear discomfort affecting confidence or movement |
| 1     | Significant symptoms                              |
| 0     | Severe, sharp, neurological or worsening symptoms |

A score below the mandatory threshold normally excludes the option.

The system does not diagnose pain.

---

# Confidence

This criterion evaluates the athlete’s confidence when performing the exercise.

Low confidence may:

* reduce force output,
* alter technique,
* increase hesitation,
* and reduce adherence.

Confidence may improve through regression, coaching and repeated exposure.

---

# Adherence Probability

This criterion estimates whether the athlete is likely to perform the option consistently.

Factors include:

* preference,
* setup burden,
* enjoyment,
* complexity,
* time requirement,
* environment,
* and previous compliance.

Adherence has a lower weight than safety or adaptation quality, but it remains relevant.

---

# Previous Athlete Response

This criterion uses recorded athlete-specific history.

Positive indicators include:

* measurable progression,
* good technique,
* low pain,
* appropriate fatigue,
* positive feedback,
* and good recovery.

Negative indicators include:

* repeated pain,
* poor progression,
* excessive soreness,
* technical inconsistency,
* or repeated substitution requests.

Athlete-specific response should progressively replace generic assumptions.

---

# Group 3 — Execution Quality

Execution Quality evaluates how reliably the option can be prescribed and performed.

Criteria include:

* Technical Repeatability
* Loadability
* Progression Potential
* Measurability
* Setup Reliability
* Supervision Requirement
* Error Tolerance

---

# Technical Repeatability

This criterion evaluates whether execution can remain consistent across:

* sets,
* sessions,
* fatigue levels,
* and different environments.

Highly repeatable exercises improve progression tracking.

---

# Loadability

Loadability measures whether exercise difficulty can be increased or decreased precisely.

Progression tools may include:

* external load,
* assistance,
* range of motion,
* tempo,
* leverage,
* velocity,
* and density.

Loadability is important for strength and hypertrophy.

---

# Progression Potential

This criterion measures how long the option can support useful progression.

An exercise scores highly when it offers:

* clear regressions,
* clear progressions,
* measurable overload,
* and sufficient long-term development potential.

---

# Measurability

Measurability evaluates whether performance can be tracked objectively or consistently.

Possible metrics include:

* load,
* repetitions,
* velocity,
* distance,
* time,
* power,
* heart rate,
* work rate,
* strike count,
* impact quality,
* and technical accuracy.

A method may remain valid even when exact measurement is unavailable.

---

# Setup Reliability

This criterion evaluates whether the setup can be reproduced safely and efficiently.

Relevant factors include:

* equipment adjustment,
* anchoring,
* space,
* spotting,
* surface,
* and transition time.

Unsafe improvised setups receive a score of 0.

---

# Supervision Requirement

This criterion measures how dependent the option is on direct coaching or spotting.

High-supervision exercises receive lower scores when the athlete trains alone.

The same exercise may score differently in:

* a supervised facility,
* a commercial gym,
* a home gym,
* or an outdoor environment.

---

# Error Tolerance

Error Tolerance evaluates the consequence of imperfect execution.

An exercise with low error tolerance may remain useful, but it requires:

* greater competence,
* lower fatigue,
* supervision,
* and stricter stopping criteria.

Ballistic and high-load exercises often have lower error tolerance.

---

# Group 4 — Fatigue and Recovery

This group evaluates the cost of the option.

Criteria include:

* Local Fatigue Cost
* Systemic Fatigue Cost
* Eccentric Damage
* Joint Stress
* Technical Fatigue
* Recovery Time
* Interference Risk
* Stimulus-to-Fatigue Ratio

---

# Local Fatigue Cost

Local Fatigue Cost evaluates fatigue in the primary muscles and tissues used.

A high local cost may be acceptable for hypertrophy but undesirable before combat practice.

---

# Systemic Fatigue Cost

Systemic Fatigue Cost evaluates whole-body recovery demand.

Contributors include:

* heavy loading,
* large muscle mass involvement,
* high cardiovascular stress,
* axial loading,
* and high psychological effort.

---

# Eccentric Damage

This criterion evaluates the likelihood of soreness and muscle damage.

High eccentric cost may be useful during certain phases but inappropriate:

* before competition,
* before technical combat sessions,
* during high-frequency training,
* or after a layoff.

---

# Joint Stress

Joint Stress evaluates repeated or peak stress on relevant joints.

It must be individualized.

A movement that is tolerated well by one athlete may be inappropriate for another.

---

# Technical Fatigue

Technical Fatigue measures how rapidly execution quality deteriorates.

High-skill movements generally tolerate less fatigue.

---

# Recovery Time

Recovery Time estimates how long the athlete may need before performing similar work again.

The score should consider:

* total volume,
* intensity,
* novelty,
* training age,
* sleep,
* nutrition,
* and concurrent combat practice.

---

# Interference Risk

Interference Risk evaluates whether the option may compromise another important session.

Examples:

* heavy leg eccentric work before kicking practice,
* high-volume pulling before grappling,
* intense pressing before striking,
* sprinting before lower-body power work,
* exhaustive bag rounds before technical learning.

Lower interference receives a higher suitability score.

---

# Stimulus-to-Fatigue Ratio

This criterion evaluates the useful adaptation generated relative to the total recovery cost.

A high score means:

* strong target stimulus,
* controlled fatigue,
* good technical repeatability,
* and limited disruption to the training week.

Stimulus-to-Fatigue Ratio is always athlete- and context-specific.

---

# Group 5 — Context Compatibility

Context Compatibility evaluates practical feasibility.

Criteria include:

* Equipment Compatibility
* Environment Compatibility
* Time Compatibility
* Session Order Compatibility
* Weekly Schedule Compatibility
* Combat Practice Compatibility
* Competition Proximity Compatibility

---

# Equipment Compatibility

This criterion measures whether the required equipment:

* exists,
* is available,
* is functional,
* supports sufficient loading,
* and can be used safely.

No equipment availability produces a score of 0 when the equipment is essential.

---

# Environment Compatibility

This criterion evaluates:

* available space,
* floor,
* ceiling,
* weather,
* noise restrictions,
* crowding,
* and safety.

---

# Time Compatibility

This criterion evaluates whether the option fits the available session duration.

It includes:

* setup time,
* warm-up requirement,
* rest intervals,
* transitions,
* and total duration.

A time-efficient exercise does not automatically receive a high score if it compromises the adaptation.

---

# Session Order Compatibility

This criterion evaluates whether the option fits logically into the current session.

Examples:

* speed work before fatigue,
* power before high-volume strength,
* technical work before conditioning,
* robustness work after primary training,
* recovery work at the end.

---

# Weekly Schedule Compatibility

This criterion evaluates the option in relation to the complete microcycle.

It considers:

* previous training,
* next training,
* combat sessions,
* recovery days,
* work schedule,
* and competition demands.

---

# Combat Practice Compatibility

This criterion evaluates whether the option supports or disrupts technical combat training.

Combat practice generally receives priority when it is the athlete’s primary sport.

---

# Competition Proximity Compatibility

This criterion evaluates the option relative to the next competition or performance test.

As competition approaches, the score may decrease for options with:

* high soreness,
* high injury risk,
* unfamiliar technique,
* excessive volume,
* or long recovery demand.

---

# Group 6 — Long-Term Development

This group evaluates the role of the option beyond the current session.

Criteria include:

* Strategic Priority
* Limitation Correction
* Robustness Contribution
* Skill Development
* Variation Need
* Exercise Continuity
* Long-Term Transfer

---

# Strategic Priority

This criterion evaluates whether the option develops a currently prioritized quality.

Examples:

* force deficit,
* rate-of-force-development deficit,
* aerobic limitation,
* repeated-effort limitation,
* tissue weakness,
* movement restriction,
* striking-power objective.

---

# Limitation Correction

This criterion evaluates whether the option addresses an identified weak point.

A limitation must be based on:

* assessment,
* repeated observation,
* performance data,
* or athlete feedback.

The system should not invent weaknesses to justify variety.

---

# Robustness Contribution

This criterion evaluates whether the option improves tolerance in:

* tendons,
* muscles,
* joints,
* connective tissue,
* impact positions,
* and repeated combat movements.

---

# Skill Development

This criterion evaluates the opportunity to improve a useful motor or technical skill.

Skill development may justify maintaining an exercise even when a simpler option has a slightly better immediate score.

---

# Variation Need

This criterion evaluates whether variation is currently beneficial.

Variation may be justified by:

* plateau,
* overuse,
* loss of motivation,
* phase transition,
* equipment change,
* or new adaptation needs.

Variation should score low when the current exercise remains effective and progressing.

---

# Exercise Continuity

This criterion rewards keeping effective exercises long enough to:

* learn them,
* adapt tissues,
* track progress,
* and determine effectiveness.

Continuity prevents unnecessary exercise rotation.

---

# Long-Term Transfer

This criterion evaluates the expected contribution to future performance rather than immediate fatigue or session output.

---

# Default Weighting Model

The default weighting model for exercise selection is:

| Criterion                 | Weight |
| ------------------------- | -----: |
| Safety                    |      5 |
| Primary Adaptation Match  |      5 |
| Athlete Compatibility     |      5 |
| Technical Feasibility     |      5 |
| Pain Compatibility        |      5 |
| Movement Pattern Match    |      4 |
| Recovery Compatibility    |      4 |
| Interference Risk         |      4 |
| Stimulus-to-Fatigue Ratio |      4 |
| Progression Potential     |      3 |
| Velocity Profile Match    |      3 |
| Force Direction Match     |      3 |
| Loadability               |      3 |
| Previous Athlete Response |      3 |
| Equipment Compatibility   |      2 |
| Environment Compatibility |      2 |
| Combat Transfer           |      2 |
| Time Compatibility        |      2 |
| Athlete Preference        |      1 |

Weights may be changed according to the Capability Module.

---

# Normalized Scoring Formula

The basic weighted score is:

```text
Weighted Score =
Σ(Criterion Score × Criterion Weight)
```

The normalized score is:

```text
Normalized Score =
Weighted Score
÷ Maximum Possible Weighted Score
× 100
```

The result is expressed from 0 to 100.

Example:

```text
Weighted Score = 210
Maximum Possible Weighted Score = 250

Normalized Score =
210 ÷ 250 × 100
= 84
```

---

# Final Score Formula

The complete final score may be calculated as:

```text
Final Score =
Base Normalized Score
+ Context Bonuses
- Context Penalties
× Confidence Factor
```

To avoid mathematical ambiguity, the engine should implement it as:

```text
Adjusted Score =
Base Normalized Score
+ Total Bonuses
- Total Penalties

Final Score =
Adjusted Score × Confidence Factor
```

The final result must be limited to:

```text
Minimum = 0
Maximum = 100
```

---

# Context Bonuses

Bonuses reward options that are particularly suitable in the current context.

Possible bonuses include:

| Situation                                      | Suggested Bonus |
| ---------------------------------------------- | --------------: |
| Successfully used by this athlete before       |        +2 to +5 |
| Directly addresses current priority            |        +2 to +5 |
| Requires minimal setup in a short session      |        +1 to +3 |
| Reduces interference with combat practice      |        +1 to +4 |
| Maintains useful exercise continuity           |        +1 to +3 |
| Appropriate competition-phase specificity      |        +1 to +5 |
| Improves adherence without reducing adaptation |        +1 to +3 |

Bonuses should remain limited.

They must not overpower primary criteria.

---

# Context Penalties

Penalties reduce the score when an option carries additional cost.

Possible penalties include:

| Situation                        | Suggested Penalty |
| -------------------------------- | ----------------: |
| High novelty                     |          -1 to -5 |
| Residual soreness in target area |         -2 to -10 |
| Poor sleep or low readiness      |         -2 to -10 |
| Combat session within 24 hours   |          -2 to -8 |
| High setup burden                |          -1 to -4 |
| Previous poor response           |         -2 to -10 |
| High interference risk           |         -3 to -12 |
| Competition proximity            |         -2 to -15 |
| Repeated recent exposure         |          -1 to -5 |
| Reduced supervision              |          -1 to -8 |

Penalties are applied only when the option remains eligible.

A dangerous option must be excluded rather than heavily penalized.

---

# Confidence Factor

The Confidence Factor reflects the reliability of the score.

Default values:

| Confidence Level | Factor |
| ---------------- | -----: |
| Very High        |   1.00 |
| High             |   0.97 |
| Moderate         |   0.92 |
| Low              |   0.85 |
| Very Low         |   0.75 |

Confidence depends on:

* completeness of athlete data,
* reliability of exercise metadata,
* quality of readiness data,
* previous athlete exposure,
* scientific support,
* and clarity of the session objective.

Example:

```text
Adjusted Score = 88
Confidence Factor = 0.92

Final Score =
88 × 0.92
= 80.96
```

The displayed result may be rounded to 81.

---

# Confidence Rules

Confidence should decrease when:

* athlete history is incomplete,
* pain information is unclear,
* the exercise is novel,
* the substitution is indirect,
* equipment details are uncertain,
* the training objective is ambiguous,
* or the evidence base is limited.

Confidence should increase when:

* the athlete has used the option successfully,
* performance data are available,
* the adaptation is clearly defined,
* exercise metadata are complete,
* and the context is stable.

A low-confidence high score may require manual review.

---

# Score Interpretation

Default final-score interpretation:

| Final Score | Interpretation                                   |
| ----------- | ------------------------------------------------ |
| 90–100      | Exceptional option                               |
| 80–89       | Strong option                                    |
| 70–79       | Valid option                                     |
| 60–69       | Acceptable with limitations                      |
| 50–59       | Weak option                                      |
| Below 50    | Reject or use only under exceptional constraints |

These ranges apply only after hard filters have been passed.

---

# Selection Thresholds

Default thresholds:

```text
Automatic Selection Threshold = 80
Valid Candidate Threshold = 70
Manual Review Range = 60 to 69
Default Rejection Threshold = Below 60
```

The thresholds may change depending on context.

For example:

* competition preparation may require a higher selection threshold,
* travel training may tolerate lower equipment compatibility,
* emergency substitutions may accept a lower specificity score,
* recovery sessions may prioritize safety and low fatigue over direct performance transfer.

---

# Tie-Breaking Rules

When two options receive similar scores, the system uses tie-breakers.

Default tie-break order:

1. Higher Safety score
2. Higher Primary Adaptation Match
3. Better Athlete Compatibility
4. Lower Interference Risk
5. Better Stimulus-to-Fatigue Ratio
6. Better Previous Athlete Response
7. Greater Progression Potential
8. Better Exercise Continuity
9. Higher Athlete Preference
10. Lower Setup Complexity

Two options are considered approximately tied when their final scores differ by less than 3 points.

---

# Exercise Selection Score

For normal exercise selection:

```text
Exercise Selection Score =
Adaptation Value
+ Athlete Compatibility
+ Execution Quality
+ Recovery Compatibility
+ Context Compatibility
+ Long-Term Value
```

Recommended high-priority criteria:

* Safety
* Adaptation Match
* Pain Compatibility
* Technical Feasibility
* Recovery Compatibility
* Stimulus-to-Fatigue Ratio

---

# Substitution Score

For substitution decisions, the weights change.

Recommended substitution criteria:

| Criterion                 | Weight |
| ------------------------- | -----: |
| Safety                    |      5 |
| Primary Adaptation Match  |      5 |
| Athlete Compatibility     |      5 |
| Movement Pattern Match    |      4 |
| Technical Feasibility     |      4 |
| Force Direction Match     |      3 |
| Contraction Type Match    |      3 |
| Velocity Match            |      3 |
| Fatigue Compatibility     |      3 |
| Equipment Compatibility   |      3 |
| Previous Athlete Response |      2 |
| Combat Transfer           |      2 |
| Athlete Preference        |      1 |

The substitution score must also report:

* what is preserved,
* what is changed,
* and what adaptation may be lost.

---

# Capability Module Score

Capability Modules may be scored according to:

* relevance to the current goal,
* athlete limitation,
* training-phase compatibility,
* readiness,
* weekly load,
* combat-practice interference,
* recovery demand,
* and recent module exposure.

Example formula:

```text
Module Priority Score =
Goal Relevance × 5
+ Limitation Relevance × 5
+ Phase Compatibility × 4
+ Readiness Compatibility × 4
+ Recovery Compatibility × 4
+ Combat Schedule Compatibility × 4
+ Long-Term Priority × 3
- Recent Exposure Penalty
- Interference Penalty
```

---

# Session Score

A complete session may be evaluated through:

* primary objective clarity,
* module compatibility,
* exercise order,
* total fatigue,
* session duration,
* redundancy,
* athlete readiness,
* weekly interference,
* and expected adaptation.

Recommended session criteria:

| Criterion               | Weight |
| ----------------------- | -----: |
| Objective Coherence     |      5 |
| Safety                  |      5 |
| Readiness Compatibility |      5 |
| Module Compatibility    |      4 |
| Exercise Order          |      4 |
| Fatigue Control         |      4 |
| Weekly Integration      |      4 |
| Duration Feasibility    |      3 |
| Redundancy Control      |      3 |
| Athlete Adherence       |      2 |

A session containing individually high-scoring exercises may still receive a low session score if the combination is incoherent.

---

# Exercise Order Score

Exercise order may be scored according to whether it protects:

* technical quality,
* movement velocity,
* maximum force,
* safety,
* and session priority.

Default order preference:

1. Preparation
2. Technical Skill
3. Speed
4. Plyometrics
5. Ballistic Power
6. Maximum Strength
7. Secondary Strength
8. Hypertrophy
9. Robustness
10. Conditioning
11. Recovery

Deviations are allowed when the session objective justifies them.

---

# Progression Score

A progression option may be evaluated through:

* adaptation relevance,
* technical readiness,
* recent performance,
* recovery response,
* load increase,
* complexity increase,
* risk increase,
* and long-term value.

A progression must not be selected only because the athlete completed the previous session.

The system should verify:

* target repetitions achieved,
* technical quality maintained,
* pain absent or acceptable,
* velocity appropriate,
* recovery satisfactory,
* and progression size reasonable.

---

# Readiness Modifier

Readiness may modify the score of an option.

Readiness inputs may include:

* sleep,
* soreness,
* motivation,
* stress,
* pain,
* resting heart rate,
* subjective energy,
* recent training load,
* and combat workload.

Example readiness categories:

| Readiness |             Score Modifier |
| --------- | -------------------------: |
| Excellent |                         +3 |
| Good      |                          0 |
| Moderate  |                         -3 |
| Low       |                         -8 |
| Very Low  | -15 or session replacement |

Readiness should not automatically reduce every exercise equally.

Examples:

* poor lower-body readiness mainly affects lower-body high-intensity work,
* poor shoulder readiness affects striking and pressing,
* general sleep deprivation affects complex and high-risk exercises more heavily.

---

# Pain Modifier

Pain should not be managed only through a numerical penalty.

The model must first apply pain eligibility rules.

Possible outcomes:

```text
No Pain
→ Normal scoring

Mild Stable Discomfort
→ Score reduction and monitoring

Pain Alters Technique
→ Exercise excluded

Sharp, Radiating or Neurological Pain
→ Session stopped or referred for appropriate assessment
```

Pain affecting execution creates a hard exclusion.

---

# Competition Proximity Modifier

Competition proximity changes scoring priorities.

## Far From Competition

The system may tolerate:

* higher fatigue,
* more volume,
* greater novelty,
* and heavier loading.

## Moderate Proximity

The system should prioritize:

* specificity,
* quality,
* controlled fatigue,
* and stable exercise selection.

## Close to Competition

The system should prioritize:

* readiness,
* speed,
* technical quality,
* low soreness,
* low injury risk,
* and confidence.

High-eccentric or unfamiliar exercises receive stronger penalties near competition.

---

# Combat Practice Modifier

Combat training is integrated into the scoring model.

The score must account for:

* combat session type,
* session intensity,
* expected contact,
* striking volume,
* grappling volume,
* technical priority,
* and proximity.

Examples:

## Before Hard Sparring

Penalize:

* exhaustive conditioning,
* high-volume leg work,
* heavy shoulder fatigue,
* and high-impact plyometrics.

## Before Technical Training

Penalize:

* work that reduces coordination,
* grip fatigue,
* and local muscular failure.

## After Hard Combat Training

Penalize:

* high-risk ballistic exercises,
* maximal strength attempts,
* and complex technical lifts.

---

# Scientific Evidence Modifier

Methods may receive an evidence-confidence classification.

## Established

Supported by strong scientific principles and broad practical evidence.

Confidence modifier:

```text
1.00
```

## Supported

Reasonably supported but dependent on context.

Confidence modifier:

```text
0.95
```

## Emerging

Promising but less certain.

Confidence modifier:

```text
0.85 to 0.90
```

## Speculative

Weak evidence or unclear practical value.

Confidence modifier:

```text
0.70 to 0.80
```

## Unsupported

Should not be selected automatically.

Evidence strength does not replace athlete-specific response.

---

# Missing Data Rules

The system must not silently assume ideal conditions.

When data are missing, it should:

1. identify the missing criterion,
2. lower confidence,
3. use conservative assumptions,
4. avoid high-risk options,
5. select simpler and safer candidates.

Examples of missing data:

* unknown pain status,
* unknown equipment,
* unknown technical level,
* unknown recent training,
* unknown competition date.

Missing critical safety data may make a candidate temporarily ineligible.

---

# Default Conservative Assumptions

When information is incomplete, the system should assume:

* no direct supervision,
* moderate technical competence,
* no spotter,
* average readiness,
* limited equipment certainty,
* and normal but not exceptional recovery.

The system must not assume:

* advanced technical mastery,
* medical clearance,
* unlimited equipment,
* perfect sleep,
* or absence of injury.

---

# Scoring Transparency

Every final recommendation should be explainable.

The system should be able to provide:

```text
Selected Option:
Final Score:
Confidence Level:
Main Strengths:
Main Limitations:
Reason for Selection:
Reason Other Options Were Rejected:
```

Example:

```text
Selected Option: Trap Bar Deadlift

Final Score: 87/100
Confidence Level: High

Main Strengths:
- Strong maximum-strength adaptation
- High athlete compatibility
- Reliable load progression
- Lower technical demand than conventional deadlift

Main Limitations:
- Moderate systemic fatigue
- Requires trap bar access

Reason for Selection:
Best balance between force development, technical consistency and recovery cost.
```

---

# Score Breakdown

The system should retain the detailed score internally.

Example:

```text
Safety: 5/5 × 5 = 25
Primary Adaptation Match: 5/5 × 5 = 25
Athlete Compatibility: 4/5 × 5 = 20
Movement Pattern Match: 5/5 × 4 = 20
Recovery Compatibility: 3/5 × 4 = 12
Stimulus-to-Fatigue Ratio: 4/5 × 4 = 16
Progression Potential: 5/5 × 3 = 15
Equipment Compatibility: 5/5 × 2 = 10
Athlete Preference: 3/5 × 1 = 3
```

The user-facing explanation does not need to display every criterion unless requested.

---

# Scoring Consistency

The same criterion definitions must be used across the system.

For example:

* Safety 5 must mean the same level of safety across exercise selection and substitution.
* Adaptation Match 5 must represent a direct and strong match.
* Technical Feasibility 3 must represent acceptable but imperfect execution readiness.

Criterion definitions should not change to justify a preferred answer.

---

# Score Calibration

The scoring model must be calibrated over time.

Calibration compares predicted suitability with actual athlete response.

Relevant outcomes include:

* performance progression,
* pain response,
* fatigue,
* soreness,
* adherence,
* technical quality,
* recovery,
* and combat performance.

Calibration may adjust:

* criterion weights,
* confidence factors,
* athlete-specific modifiers,
* and substitution rankings.

---

# Athlete-Specific Weighting

The default model may be personalized.

Examples:

## Injury-Prone Athlete

Increase weight for:

* Safety
* Joint Stress
* Recovery Compatibility
* Previous Response
* Robustness Contribution

## Advanced Athlete

Increase weight for:

* Specificity
* Velocity Profile
* Force Direction
* Phase Compatibility
* Measurability

## Beginner Athlete

Increase weight for:

* Technical Feasibility
* Error Tolerance
* Progression Potential
* Setup Reliability
* Exercise Continuity

## Combat Athlete With High Skill Volume

Increase weight for:

* Interference Risk
* Recovery Compatibility
* Combat Practice Compatibility
* Stimulus-to-Fatigue Ratio

Personalized weights must remain within defined limits to prevent extreme distortion.

---

# Weight Limits

Recommended criterion weights range from:

```text
Minimum Weight = 1
Maximum Weight = 5
```

A criterion may receive a weight of 0 only when it is genuinely irrelevant to the decision.

Mandatory criteria may never receive a weight of 0.

---

# Double-Counting Prevention

The model must avoid rewarding or penalizing the same factor multiple times.

Examples:

* pain should not be fully counted under Safety, Pain Compatibility and Injury History without adjustment,
* combat interference should not be duplicated across Recovery and Weekly Compatibility,
* equipment absence should be a hard exclusion, not several separate penalties,
* complexity should not be duplicated under Technical Feasibility, Supervision and Error Tolerance without clear distinctions.

Related criteria should be reviewed for correlation.

---

# Maximum Penalty Limits

Context penalties should not reduce an otherwise eligible option by more than:

```text
Default Maximum Total Penalty = 25 points
```

When a penalty greater than 25 appears necessary, the system should reconsider whether the option should instead be excluded.

---

# Maximum Bonus Limits

Bonuses should not increase the score by more than:

```text
Default Maximum Total Bonus = 10 points
```

Bonuses must not convert a weak option into a strong option.

An option with a Base Normalized Score below 60 should not normally exceed the automatic selection threshold through bonuses.

---

# Score Stability

Minor changes in data should not cause extreme changes in recommendations.

The system should avoid unstable rankings caused by:

* excessive weighting,
* duplicate criteria,
* overly large bonuses,
* or false precision.

When two options remain close, both may be presented as valid alternatives.

---

# Diversity Constraint

The highest-scoring option should not always be selected if repeated exposure creates:

* overuse,
* monotony,
* adaptation stagnation,
* or excessive local stress.

The system may apply a controlled repetition penalty.

Example:

```text
Repeated Exposure Penalty:
0 recent exposures = 0
1 recent exposure = 0
2 recent exposures = -1
3 recent exposures = -3
4 or more recent exposures = -5
```

Continuity should still be rewarded when progress remains positive.

The model must balance continuity and variation.

---

# Redundancy Penalty

Within a session, exercises may receive a redundancy penalty when they duplicate:

* the same movement pattern,
* the same adaptation,
* the same joint stress,
* the same muscle emphasis,
* and the same fatigue profile.

Suggested penalty:

```text
Minor Redundancy = -2
Moderate Redundancy = -5
High Redundancy = -10
```

Redundancy may be intentional in specialization phases.

---

# Session Budget Model

A session may have limited budgets for:

* systemic fatigue,
* local fatigue,
* joint stress,
* high-impact contacts,
* technical complexity,
* and time.

Each exercise consumes part of these budgets.

Example:

```text
Session Fatigue Budget = 100 units

Primary Power Exercise = 15
Primary Strength Exercise = 30
Secondary Strength Exercise = 20
Hypertrophy Accessory = 15
Conditioning Block = 25

Total = 105
```

The session exceeds the fatigue budget and must be adjusted.

Fatigue units are internal comparative values, not physiological measurements.

---

# Weekly Budget Model

The same logic applies across the week.

Possible weekly budgets include:

* lower-body high-intensity exposure,
* upper-body pressing exposure,
* pulling exposure,
* impact exposure,
* sprint exposure,
* plyometric contacts,
* high-intensity conditioning,
* and maximal-strength work.

The scoring model should reduce the score of options that exceed the weekly budget.

---

# Priority Score

Training priorities may be scored separately.

Example:

```text
Priority Score =
Importance × 5
+ Current Deficit × 5
+ Goal Relevance × 5
+ Phase Relevance × 4
+ Opportunity for Progress × 3
- Interference Cost × 4
- Recovery Cost × 3
```

The Priority Score determines which adaptations receive the greatest session resources.

---

# Readiness-to-Demand Ratio

The system may compare athlete readiness with exercise demand.

```text
Readiness-to-Demand Ratio =
Athlete Readiness Score
÷ Exercise Demand Score
```

Interpretation:

| Ratio         | Meaning                            |
| ------------- | ---------------------------------- |
| 1.20 or above | Athlete is highly ready            |
| 1.00–1.19     | Appropriate demand                 |
| 0.85–0.99     | Caution and possible adjustment    |
| 0.70–0.84     | Significant reduction required     |
| Below 0.70    | Replace or cancel high-demand work |

This ratio is a decision-support value.

It is not a medical assessment.

---

# Demand Score

Exercise Demand may combine:

* load intensity,
* volume,
* eccentric stress,
* impact,
* technical complexity,
* cardiovascular demand,
* and psychological demand.

Example:

```text
Exercise Demand Score =
Intensity Demand
+ Volume Demand
+ Technical Demand
+ Impact Demand
+ Recovery Demand
```

The score must be normalized before comparison with readiness.

---

# Scoring Model for Heavy Bag Work

Heavy bag drills require specific criteria.

Recommended criteria include:

* Technical Objective Match
* Speed Intent Match
* Power Intent Match
* Combination Complexity
* Impact Demand
* Conditioning Demand
* Shoulder Fatigue
* Lower-Body Fatigue
* Technical Breakdown Risk
* Combat Transfer
* Equipment Availability

Example:

## Power Bag Round

High weights:

* power intent,
* impact quality,
* technical control,
* full recovery,
* low repetition degradation.

## Conditioning Bag Round

High weights:

* energy-system match,
* work-to-rest ratio,
* sustainable technique,
* output consistency.

## Speed Bag Round

High weights:

* velocity,
* relaxation,
* technical precision,
* low fatigue,
* stopping before speed loss.

---

# Scoring Model for Conditioning

Conditioning modalities should be scored according to:

* energy-system match,
* interval compatibility,
* cardiovascular demand,
* local muscular limitation,
* impact,
* technical complexity,
* recovery cost,
* sport specificity,
* and equipment.

A modality that causes local muscular failure before the cardiovascular target is reached receives a lower score.

---

# Scoring Model for Robustness

Robustness exercises should be scored according to:

* target tissue relevance,
* load tolerance,
* control,
* pain response,
* progression potential,
* recovery cost,
* joint-position relevance,
* and interference.

Robustness work usually prioritizes consistency over maximal fatigue.

---

# Scoring Model for Movement

Movement exercises should be scored according to:

* movement-quality relevance,
* coordination demand,
* technical clarity,
* fatigue cost,
* transfer to target movement,
* and athlete limitation.

Movement work must not be scored primarily by caloric cost or muscular exhaustion.

---

# Manual Override

A qualified coach or authorized system rule may override the ranking.

An override must record:

* original highest-scoring option,
* selected option,
* reason,
* expected benefit,
* known compromise,
* and review date.

Valid override reasons include:

* coaching observation not represented in data,
* competition strategy,
* rehabilitation instruction,
* psychological preparation,
* deliberate exercise exposure,
* or technical teaching priority.

Manual overrides must not bypass hard safety exclusions.

---

# Model Audit

The system should periodically audit:

* selected scores,
* rejected candidates,
* actual athlete outcomes,
* substitution success,
* pain events,
* progression,
* and recovery.

Audit questions include:

* Did high-scoring exercises produce good outcomes?
* Were low-scoring options incorrectly rejected?
* Are certain criteria overweighted?
* Are athlete preferences being ignored?
* Are fatigue costs underestimated?
* Are combat sessions sufficiently protected?
* Is the model rotating exercises too often?
* Are confidence levels realistic?

---

# Model Learning

Future versions of CAS may use athlete data to refine scores.

Possible athlete-specific learning inputs include:

* completed sessions,
* skipped exercises,
* pain reports,
* RPE,
* RIR,
* velocity,
* load progression,
* heart rate,
* session duration,
* recovery,
* soreness,
* and combat performance.

Learning must remain constrained by:

* safety rules,
* physiological principles,
* explainability,
* and data quality.

The system must not learn unsafe behavior from athlete preferences.

---

# Data Quality Rules

Data may be classified as:

## High Quality

* direct measurement,
* repeated observation,
* validated testing,
* consistent logged history.

## Moderate Quality

* structured athlete feedback,
* coach observation,
* recent self-report.

## Low Quality

* incomplete memory,
* unverified assumption,
* isolated subjective impression.

Lower data quality reduces confidence.

---

# Example Exercise Comparison

Objective:

```text
Develop lower-body maximum strength while minimizing fatigue before kick training.
```

Candidates:

* Back Squat
* Front Squat
* Trap Bar Deadlift
* Bulgarian Split Squat
* Leg Press

Example result:

| Exercise              | Base Score | Penalties | Confidence | Final Score |
| --------------------- | ---------: | --------: | ---------: | ----------: |
| Front Squat           |         86 |        -6 |       0.97 |          78 |
| Back Squat            |         88 |       -10 |       0.97 |          76 |
| Trap Bar Deadlift     |         84 |        -4 |       1.00 |          80 |
| Bulgarian Split Squat |         82 |        -8 |       0.97 |          72 |
| Leg Press             |         78 |        -2 |       0.95 |          72 |

Selected option:

```text
Trap Bar Deadlift
```

Reason:

```text
Best balance between high force production, technical reliability and lower interference with upcoming kick training.
```

This example is contextual.

It does not mean the trap bar deadlift is universally superior.

---

# Example Substitution Comparison

Original exercise:

```text
Weighted Pull-Up
```

Constraint:

```text
No pull-up bar available
```

Candidates:

* Heavy Lat Pulldown
* Kneeling Band Pulldown
* Chest-Supported Row
* Inverted Row

Example result:

| Substitute             | Score | Confidence |
| ---------------------- | ----: | ---------: |
| Heavy Lat Pulldown     |    88 |       High |
| Kneeling Band Pulldown |    75 |   Moderate |
| Inverted Row           |    68 |       High |
| Chest-Supported Row    |    64 |       High |

Selected option:

```text
Heavy Lat Pulldown
```

Preserved:

* vertical pulling,
* high-force intent,
* progressive loading.

Reduced:

* bodyweight stabilization,
* relative-strength specificity.

---

# Example Readiness Adjustment

Planned exercise:

```text
Depth Jump
```

Current data:

* poor sleep,
* high calf soreness,
* hard sparring previous evening,
* reduced landing quality.

Result:

```text
Eligibility = FALSE
```

The exercise is not given a low score.

It is excluded.

Possible substitute:

```text
Low-Intensity Landing Drill
```

The substitute is scored separately.

---

# Recommended Output Format

Internal output:

```text
Candidate:
Eligibility:
Mandatory Criteria Passed:
Base Weighted Score:
Normalized Score:
Bonuses:
Penalties:
Confidence Factor:
Final Score:
Rank:
Selection Status:
```

User-facing output:

```text
Selected exercise:
Why:
Main benefit:
Main limitation:
Prescription adjustment:
```

---

# Decision Logic Summary

```text
Is the option safe and feasible?
        ↓
No → Exclude
        ↓
Yes
        ↓
Does it sufficiently match the primary adaptation?
        ↓
No → Exclude or downgrade to secondary candidate
        ↓
Yes
        ↓
Score athlete compatibility
        ↓
Score execution quality
        ↓
Score fatigue and recovery cost
        ↓
Score context compatibility
        ↓
Apply bonuses and penalties
        ↓
Adjust for confidence
        ↓
Rank valid candidates
        ↓
Select the highest-value coherent option
```

---

# Final Principle

The Combat Athlete System does not select the option with the highest theoretical performance potential.

It selects the valid option with the highest expected value for the specific athlete, objective and context.

Expected value includes:

* adaptation,
* safety,
* execution,
* recovery,
* adherence,
* and long-term development.

The model must always remain:

* explainable,
* contextual,
* conservative when data are incomplete,
* and subordinate to hard safety rules.

The score guides the decision.

It does not replace judgment.
