# SCORING MODEL

Version 0.1

---

# Purpose

The Scoring Model defines how the Combat Athlete System evaluates, compares and ranks valid training options.

It converts qualitative coaching principles into structured, explainable and reproducible decision criteria.

The model may be used to evaluate:

* Capability Modules;
* exercises;
* exercise variations;
* substitutions;
* progression options;
* conditioning methods;
* recovery adjustments;
* session structures.

The Scoring Model does not replace the Module Engine doctrine.

It operates within that doctrine.

The Module Engine determines:

* which adaptation is required;
* which Capability Module may serve that adaptation;
* which constraints must be respected;
* which decisions require explanation.

The Scoring Model then compares the valid options available within those boundaries.

Its fundamental principle is:

> Scoring ranks valid options. It never makes an invalid option valid.

A high score cannot override:

* a contraindication;
* a safety rule;
* a blocking conflict;
* an unavailable resource;
* an incompatible athlete state;
* a failed validation rule.

---

# Scope

The Scoring Model supports four distinct decision levels:

1. Module Priority Scoring
2. Exercise Selection Scoring
3. Substitution Scoring
4. Session Quality Scoring

These decision levels use the same general scoring architecture but do not use identical criteria or weights.

A score calculated for one decision level must not be compared directly with a score calculated for another decision level.

For example:

* an Exercise Selection Score cannot be compared with a Module Priority Score;
* a Session Quality Score cannot be used to rank individual exercises;
* a Substitution Score cannot replace the normal Exercise Selection Score outside a substitution context.

---

# Core Decision Layers

Every candidate passes through four layers:

1. Eligibility
2. Mandatory Thresholds
3. Weighted Suitability
4. Selection Priority

---

## Layer 1 — Eligibility

Eligibility determines whether a candidate may enter the scoring process.

Eligibility is binary:

```text
ELIGIBLE
INELIGIBLE
```

An ineligible candidate is excluded before weighted scoring.

It receives:

```text
Eligibility = INELIGIBLE
Final Score = NOT APPLICABLE
Selection Status = EXCLUDED
```

Eligibility is governed by hard rules.

Typical hard exclusions include:

* medical contraindication;
* significant or worsening pain;
* pain that alters technique;
* neurological symptoms;
* unsafe environment;
* unavailable essential equipment;
* insufficient space;
* clearly inadequate technical competence;
* unacceptable risk under current fatigue;
* direct conflict with the primary adaptation;
* unresolved blocking conflict;
* prohibited training exposure;
* inability to perform the movement safely;
* missing critical safety information.

An ineligible candidate must not receive a low numerical score.

It must be excluded.

---

## Layer 2 — Mandatory Thresholds

An eligible candidate must reach the minimum acceptable level in every mandatory criterion.

Mandatory criteria protect the integrity of the decision without turning every limitation into a hard exclusion.

Default mandatory criteria for exercise selection are:

* Safety;
* Primary Adaptation Match;
* Athlete Compatibility;
* Technical Feasibility;
* Pain Compatibility;
* Equipment Feasibility;
* Environmental Feasibility.

Default minimum:

```text
Mandatory Criterion Minimum = 3 out of 5
```

A candidate scoring below the threshold in any mandatory criterion is rejected unless a dedicated rule defines a valid modification or regression.

Possible result:

```text
Eligibility = ELIGIBLE
Mandatory Criteria Passed = FALSE
Selection Status = REJECTED
```

The mandatory threshold may be increased for:

* maximum-strength attempts;
* sprinting;
* ballistic exercises;
* high-impact plyometrics;
* complex Olympic-lifting variations;
* high-intensity bag work;
* unsupervised high-risk training;
* competition-proximity sessions.

A high score in one criterion may never compensate for failure in another mandatory criterion.

---

## Layer 3 — Weighted Suitability

Weighted Suitability measures how well a valid candidate fits:

* the target adaptation;
* the athlete;
* the session;
* the weekly context;
* long-term progression.

Each relevant criterion receives:

* a score from 0 to 5;
* a weight from 1 to 5.

The weighted results are normalized to a score from 0 to 100.

---

## Layer 4 — Selection Priority

Selection Priority determines which valid and suitable option should be selected now.

It accounts for contextual factors such as:

* current Training Cycle priority;
* readiness;
* recent exposure;
* upcoming combat practice;
* competition proximity;
* exercise continuity;
* athlete-specific history;
* time constraints;
* interference risk.

Priority modifiers may adjust the Base Suitability Score within strict limits.

They must not override eligibility or mandatory thresholds.

---

# Scoring Process

The complete scoring process is:

```text
Declared Objective
        ↓
Required Adaptation Domain
        ↓
Required Capability Module
        ↓
Candidate Generation
        ↓
Hard Eligibility Filter
        ↓
Mandatory Criterion Check
        ↓
Decision-Level Scoring Profile
        ↓
Weighted Criterion Scoring
        ↓
Normalization
        ↓
Context Modifiers
        ↓
Final Suitability Score
        ↓
Confidence Assessment
        ↓
Ranking
        ↓
Tie-Breaking
        ↓
Selection or Review
        ↓
Validation
```

No candidate may reach ranking before passing:

* eligibility;
* mandatory thresholds.

No selected candidate may be returned to the athlete before final validation.

---

# Contextual Nature of Scores

A score is not a permanent property of:

* an exercise;
* a module;
* a progression;
* a session.

It represents the expected suitability of an option for a specific:

* athlete;
* objective;
* date;
* Training Cycle;
* session;
* readiness state;
* equipment context;
* weekly schedule.

The same exercise may receive different scores when:

* the athlete changes;
* readiness changes;
* pain appears;
* equipment changes;
* the primary adaptation changes;
* training experience develops;
* competition approaches;
* recent exposure changes;
* combat workload changes.

The system must never state that one exercise is universally superior based only on a contextual score.

---

# Criterion Scale

The default criterion scale is:

| Score | Meaning                 |
| ----: | ----------------------- |
|     0 | Completely incompatible |
|     1 | Very poor fit           |
|     2 | Poor fit                |
|     3 | Acceptable fit          |
|     4 | Strong fit              |
|     5 | Excellent fit           |

Half-point scores may be used when justified:

* 2.5;
* 3.5;
* 4.5.

The engine must avoid false precision.

Values with more than one decimal place should only be generated from objective normalized data.

Human-defined criterion scores should normally use:

```text
0
0.5
1
1.5
2
2.5
3
3.5
4
4.5
5
```

---

# Criterion Weight Scale

The default weight scale is:

| Weight | Meaning             |
| -----: | ------------------- |
|      1 | Low influence       |
|      2 | Secondary influence |
|      3 | Important           |
|      4 | High influence      |
|      5 | Critical influence  |

Default limits:

```text
Minimum Active Weight = 1
Maximum Weight = 5
```

A criterion may receive a weight of `0` only when it is not relevant to the current decision profile.

Mandatory criteria may never receive a weight of `0`.

Weights must be defined by the decision profile.

They must not be changed during scoring simply to justify a preferred candidate.

---

# Criterion Families

The model uses six criterion families:

1. Adaptation Fit
2. Athlete Fit
3. Execution Quality
4. Fatigue and Recovery
5. Context Fit
6. Long-Term Value

These families organize the criteria.

They are not scored directly unless a decision profile explicitly defines a family-level score.

---

# Family 1 — Adaptation Fit

Adaptation Fit measures how directly the candidate supports the intended physiological objective.

Possible criteria include:

* Primary Adaptation Match;
* Module Match;
* Movement Function Match;
* Force Direction Match;
* Contraction Profile Match;
* Velocity Profile Match;
* Range-of-Motion Relevance;
* Physical Transfer;
* Training-Phase Relevance.

---

## Primary Adaptation Match

Primary Adaptation Match measures how directly the candidate supports the declared primary adaptation.

| Score | Interpretation                         |
| ----: | -------------------------------------- |
|     5 | Direct and highly effective match      |
|     4 | Strong match with minor limitations    |
|     3 | Acceptable match                       |
|     2 | Partial or indirect match              |
|     1 | Weak relationship                      |
|     0 | No meaningful match or direct conflict |

Primary Adaptation Match is mandatory.

Secondary benefits may never compensate for a weak Primary Adaptation Match.

---

## Module Match

Module Match measures whether the candidate correctly implements the selected Capability Module.

Examples:

* a heavy controlled squat variation may strongly match Strength;
* a low-load maximal-intent jump may strongly match Power;
* a prolonged exhaustive jump circuit may not match Power even if jumps are used;
* controlled loaded carries may match Grip or Robustness depending on the declared purpose and parameters.

An exercise name does not determine Module Match by itself.

The engine must evaluate:

* intent;
* intensity;
* volume;
* velocity;
* rest;
* execution;
* stopping criteria.

---

## Movement Function Match

Movement Function Match measures whether the candidate trains the required human movement function.

Examples include:

* horizontal push;
* vertical push;
* horizontal pull;
* vertical pull;
* squat;
* hinge;
* lunge;
* carry;
* rotate;
* resist rotation;
* accelerate;
* decelerate;
* jump;
* strike;
* maintain grip;
* transmit force.

This criterion is especially important for substitutions.

---

## Force Direction Match

Force Direction Match measures whether force is applied in a direction relevant to the intended adaptation or capability.

Possible directions include:

* vertical;
* horizontal;
* lateral;
* rotational;
* diagonal;
* anterior-posterior;
* upward;
* downward.

Force-direction similarity supports selection but does not prove transfer by itself.

---

## Contraction Profile Match

Contraction Profile Match measures compatibility with the required dominant muscular action.

Possible profiles include:

* concentric;
* eccentric;
* isometric;
* ballistic;
* stretch-shortening cycle;
* yielding isometric;
* overcoming isometric.

This criterion is particularly relevant for:

* Power;
* Robustness;
* Movement;
* rehabilitation-compatible constraints;
* substitutions.

---

## Velocity Profile Match

Velocity Profile Match measures whether the candidate can be performed at the movement speed required by the module.

Possible profiles include:

* maximal velocity;
* high velocity;
* moderate velocity;
* controlled velocity;
* slow eccentric;
* isometric.

Power candidates require a high Velocity Profile Match.

An exercise does not qualify as Power merely because it uses muscles relevant to explosive movement.

---

## Range-of-Motion Relevance

Range-of-Motion Relevance measures whether the prescribed range:

* exposes the intended positions;
* remains safe;
* can be controlled;
* supports the target adaptation;
* fits the athlete's current capacity.

A full range is not automatically superior.

A partial range may score highly when it is deliberately selected for:

* overload;
* tissue tolerance;
* pain-free exposure;
* position-specific strength;
* progression toward a larger range.

---

## Physical Transfer

Physical Transfer measures the expected contribution to target-sport performance through physical qualities.

Possible transfer mechanisms include:

* force production;
* rapid force production;
* force transmission;
* deceleration;
* rotational capacity;
* unilateral control;
* grip capacity;
* impact tolerance;
* work capacity;
* movement efficiency.

Visual similarity alone must not produce a high Physical Transfer score.

Specific Skill remains external to the physical preparation engine.

A heavy-bag exercise may score highly for Power or Conditioning when its primary purpose and execution parameters match those modules.

---

## Training-Phase Relevance

Training-Phase Relevance measures compatibility with the current phase.

Possible phases include:

* general preparation;
* accumulation;
* maximum-strength development;
* functional hypertrophy;
* power conversion;
* conditioning development;
* competition preparation;
* taper;
* return to training;
* recovery.

A valid exercise may receive a lower score when used at the wrong time.

---

# Family 2 — Athlete Fit

Athlete Fit measures compatibility with the individual athlete.

Possible criteria include:

* Training Age Compatibility;
* Technical Feasibility;
* Mobility Compatibility;
* Morphological Compatibility;
* Injury-History Compatibility;
* Pain Compatibility;
* Athlete Confidence;
* Adherence Probability;
* Previous Athlete Response.

---

## Training Age Compatibility

This criterion evaluates whether the option fits the athlete's training experience.

Beginners generally benefit from:

* simple setup;
* stable movement patterns;
* clear technique;
* repeatable execution;
* low unnecessary complexity;
* easy progression.

Advanced athletes may justify:

* greater specificity;
* more precise loading;
* more complex velocity methods;
* specialized variations;
* narrower progression targets.

Complexity alone does not indicate advanced training value.

---

## Technical Feasibility

Technical Feasibility measures whether the athlete can currently execute the candidate with sufficient quality.

It considers:

* understanding;
* coordination;
* repeatability;
* control;
* stability;
* competence under the expected fatigue level;
* supervision requirements.

Technical Feasibility is mandatory.

A theoretically effective candidate must be rejected or regressed when the athlete cannot execute it safely.

---

## Mobility Compatibility

Mobility Compatibility measures whether the athlete can access and control the required positions.

The engine should distinguish between:

* insufficient active range;
* insufficient passive range;
* motor-control limitations;
* fear;
* unfamiliarity;
* pain.

A limitation does not automatically exclude the entire exercise family when a safe variation or regression exists.

---

## Morphological Compatibility

Morphological Compatibility considers individual proportions and structure.

Relevant factors may include:

* limb length;
* torso length;
* shoulder structure;
* hip structure;
* joint orientation;
* body mass;
* center-of-mass distribution.

Morphology should guide variation and setup selection.

It must not create rigid assumptions or universal prohibitions.

---

## Injury-History Compatibility

This criterion measures compatibility with previous injury and recurrent vulnerability.

It considers:

* recurrence history;
* current tissue tolerance;
* prior response;
* medical restrictions;
* exposure history;
* relevant movement sensitivity.

A previous injury is not automatically a contraindication.

Current restrictions and actual response take priority.

---

## Pain Compatibility

Pain Compatibility measures current symptom response.

| Score | Interpretation                                               |
| ----: | ------------------------------------------------------------ |
|     5 | No pain or symptoms                                          |
|     4 | Minimal, stable and acceptable discomfort                    |
|     3 | Mild discomfort requiring monitoring                         |
|     2 | Discomfort affecting confidence or execution                 |
|     1 | Significant symptoms                                         |
|     0 | Severe, sharp, radiating, neurological or worsening symptoms |

Pain Compatibility is mandatory.

Default behavior:

```text
Score 3 to 5
→ Candidate may continue according to context

Score 2
→ Candidate rejected or modified

Score 0 to 1
→ Candidate excluded
```

Pain that alters technique creates a hard exclusion.

The engine does not diagnose pain or injury.

---

## Athlete Confidence

Athlete Confidence measures the athlete's perceived ability to perform the candidate safely and effectively.

Low confidence may reduce:

* output;
* technical consistency;
* adherence;
* willingness to express maximal intent.

Confidence should normally be improved through:

* regression;
* instruction;
* familiarization;
* controlled exposure.

It must not override objective safety or technical criteria.

---

## Adherence Probability

Adherence Probability estimates whether the athlete is likely to execute the prescription consistently.

It may consider:

* preference;
* enjoyment;
* setup burden;
* time;
* environment;
* exercise complexity;
* previous compliance.

Adherence is relevant but receives lower weight than:

* safety;
* adaptation match;
* technical feasibility;
* recovery compatibility.

---

## Previous Athlete Response

Previous Athlete Response uses athlete-specific history.

Positive indicators include:

* progression;
* good technical quality;
* acceptable fatigue;
* good recovery;
* no adverse symptoms;
* positive feedback;
* reliable completion.

Negative indicators include:

* repeated pain;
* excessive soreness;
* poor progression;
* technical inconsistency;
* disproportionate fatigue;
* repeated substitution;
* poor adherence.

When reliable athlete-specific data exist, they should take priority over generic assumptions.

---

# Family 3 — Execution Quality

Execution Quality measures how reliably the candidate can be prescribed, performed and progressed.

Possible criteria include:

* Technical Repeatability;
* Loadability;
* Progression Potential;
* Measurability;
* Setup Reliability;
* Supervision Compatibility;
* Error Tolerance.

---

## Technical Repeatability

Technical Repeatability measures whether execution can remain consistent across:

* repetitions;
* sets;
* sessions;
* moderate changes in fatigue;
* different training environments.

High repeatability improves progression tracking and prescription reliability.

---

## Loadability

Loadability measures whether exercise difficulty can be adjusted precisely.

Possible progression tools include:

* external load;
* assistance;
* leverage;
* range of motion;
* tempo;
* repetition count;
* movement velocity;
* density.

Loadability is especially important for Strength and Functional Hypertrophy.

---

## Progression Potential

Progression Potential measures how well the candidate can support continued development.

A high score requires:

* clear regression options;
* clear progression options;
* measurable overload;
* sufficient long-term usefulness;
* compatibility with the module's progression model.

---

## Measurability

Measurability evaluates whether performance can be tracked consistently.

Possible metrics include:

* load;
* repetitions;
* velocity;
* distance;
* time;
* work completed;
* heart rate;
* power;
* strike count;
* technical consistency;
* symptom response.

Lack of sophisticated measurement does not automatically invalidate a useful method.

---

## Setup Reliability

Setup Reliability measures whether the training configuration can be reproduced safely and efficiently.

It considers:

* equipment adjustment;
* anchoring;
* surface;
* space;
* spotting;
* transition time;
* environmental stability.

Unsafe improvised setups are ineligible.

---

## Supervision Compatibility

Supervision Compatibility measures whether the candidate fits the supervision actually available.

A technically demanding or high-risk exercise may score well under direct coaching and poorly when performed alone.

The engine must not assume a coach or spotter is present unless that information is confirmed.

---

## Error Tolerance

Error Tolerance measures the consequences of imperfect execution.

Low error tolerance may require:

* higher technical competence;
* greater freshness;
* direct supervision;
* lower volume;
* stricter stopping rules.

Low error tolerance is not automatically disqualifying.

It must be compatible with the athlete and context.

---

# Family 4 — Fatigue and Recovery

Fatigue and Recovery criteria measure the cost of a candidate relative to its expected benefit.

The Module Engine recognizes four fatigue dimensions:

* Neural Fatigue;
* Muscular Fatigue;
* Connective Tissue Stress;
* Metabolic Fatigue.

The Scoring Model must remain consistent with these dimensions.

Possible criteria include:

* Neural Cost Compatibility;
* Muscular Cost Compatibility;
* Connective-Tissue Cost Compatibility;
* Metabolic Cost Compatibility;
* Technical Fatigue Risk;
* Recovery-Time Compatibility;
* Interference Risk;
* Stimulus-to-Fatigue Ratio.

---

## Cost Compatibility

Cost criteria are scored positively.

A high score means the cost is compatible with the current context.

For example:

| Score | Interpretation                      |
| ----: | ----------------------------------- |
|     5 | Very low or highly appropriate cost |
|     4 | Controlled and appropriate cost     |
|     3 | Acceptable cost                     |
|     2 | High cost requiring adjustment      |
|     1 | Excessive cost                      |
|     0 | Incompatible cost                   |

This positive-direction convention prevents mathematical confusion.

High fatigue cost must not receive a high suitability score.

---

## Neural Cost Compatibility

This criterion measures compatibility between neural demand and:

* current readiness;
* recent high-intensity exposure;
* upcoming power work;
* technical practice;
* competition proximity.

---

## Muscular Cost Compatibility

This criterion measures compatibility between local muscular fatigue and the broader schedule.

It is especially relevant before:

* striking practice;
* kicking practice;
* grappling;
* repeated training of the same region.

---

## Connective-Tissue Cost Compatibility

This criterion measures compatibility with:

* tendon exposure;
* joint stress;
* impact;
* stretch-shortening-cycle volume;
* recent tissue loading;
* injury history.

---

## Metabolic Cost Compatibility

This criterion measures compatibility between metabolic demand and:

* the module objective;
* the rest of the session;
* upcoming combat practice;
* weekly conditioning load;
* recovery capacity.

---

## Technical Fatigue Risk

Technical Fatigue Risk measures how likely execution quality is to deteriorate during the prescribed dose.

A high suitability score means low or controlled technical breakdown risk.

---

## Recovery-Time Compatibility

Recovery-Time Compatibility measures whether the predicted recovery period fits:

* the next CAS session;
* combat practice;
* competition;
* occupational demands;
* the current Training Cycle.

---

## Interference Risk

Interference Risk measures the risk that the candidate will compromise another priority adaptation or practice.

A high suitability score means low interference.

Examples of potential interference include:

* heavy eccentric lower-body work before kicking;
* high-volume pulling before grappling;
* shoulder fatigue before striking;
* exhaustive bag work before technical practice;
* conditioning that compromises strength development;
* high-impact work before lower-body Power.

---

## Stimulus-to-Fatigue Ratio

Stimulus-to-Fatigue Ratio measures the expected target adaptation relative to total recovery cost.

A high score indicates:

* strong target stimulus;
* controlled fatigue;
* acceptable recovery;
* reliable technical execution;
* limited disruption to the week.

This criterion is always athlete- and context-specific.

---

# Family 5 — Context Fit

Context Fit measures practical and scheduling compatibility.

Possible criteria include:

* Equipment Compatibility;
* Environment Compatibility;
* Time Compatibility;
* Session-Order Compatibility;
* Weekly-Schedule Compatibility;
* Combat-Practice Compatibility;
* Competition-Proximity Compatibility.

---

## Equipment Compatibility

Equipment Compatibility measures whether the required equipment:

* exists;
* is available;
* is functional;
* permits the required loading;
* can be used safely.

When essential equipment is unavailable, the candidate is ineligible.

---

## Environment Compatibility

Environment Compatibility considers:

* space;
* floor;
* ceiling height;
* weather;
* noise restrictions;
* crowding;
* surface;
* safety.

---

## Time Compatibility

Time Compatibility considers:

* setup;
* preparation;
* rest intervals;
* transitions;
* total execution time.

Time efficiency must not override the required adaptation.

The engine should remove lower-priority work rather than distort essential work into an inappropriate density.

---

## Session-Order Compatibility

Session-Order Compatibility measures whether the candidate fits the selected module's place within the session.

The canonical module order is:

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

Only selected modules appear in the session.

Exceptions require explicit justification and a Decision Trace entry.

---

## Weekly-Schedule Compatibility

Weekly-Schedule Compatibility considers:

* previous training;
* upcoming training;
* combat practice;
* recovery days;
* work schedule;
* competition demands;
* accumulated exposure.

---

## Combat-Practice Compatibility

Combat-Practice Compatibility measures whether the candidate supports or disrupts the athlete's technical and tactical practice.

When combat sport is the athlete's primary discipline, specific practice generally takes priority over optional physical-preparation volume.

---

## Competition-Proximity Compatibility

Competition-Proximity Compatibility measures whether the candidate is appropriate at the current distance from competition.

Near competition, suitability decreases for options involving:

* high soreness;
* unfamiliar technique;
* high injury risk;
* long recovery time;
* excessive volume;
* unnecessary connective-tissue stress.

---

# Family 6 — Long-Term Value

Long-Term Value measures the candidate's contribution beyond the current session.

Possible criteria include:

* Strategic Priority;
* Limitation Relevance;
* Robustness Contribution;
* Exercise Continuity;
* Variation Justification;
* Long-Term Progression Value;
* Athlete-Specific Learning Value.

---

## Strategic Priority

Strategic Priority measures alignment with the current Training Cycle.

Examples include:

* maximum-strength development;
* rate-of-force-development improvement;
* functional hypertrophy;
* aerobic development;
* repeated-effort capacity;
* tissue tolerance;
* movement restoration;
* striking-power development.

---

## Limitation Relevance

Limitation Relevance measures whether the candidate addresses an identified limiting factor.

A limitation must be supported by:

* assessment;
* repeated observation;
* performance data;
* athlete feedback;
* training history.

The system must not invent limitations to justify variety.

---

## Robustness Contribution

Robustness Contribution measures whether the candidate supports tolerance in relevant:

* muscles;
* tendons;
* joints;
* positions;
* impact exposures;
* repeated sport demands.

This criterion must not duplicate the primary adaptation when the selected module is already Robustness.

In that case, it may be omitted from the scoring profile.

---

## Exercise Continuity

Exercise Continuity rewards maintaining an effective exercise long enough to:

* learn it;
* adapt tissues;
* track progression;
* determine its effectiveness.

Continuity should receive a high score when:

* progression continues;
* technique remains stable;
* symptoms remain acceptable;
* context remains compatible.

---

## Variation Justification

Variation Justification measures whether changing the current exercise is useful.

Variation may be justified by:

* plateau;
* overuse;
* pain;
* equipment change;
* phase transition;
* loss of adherence;
* changed adaptation requirements.

Variation should score low when the current exercise remains effective.

Variation is not automatically beneficial.

---

## Long-Term Progression Value

Long-Term Progression Value measures whether the candidate can contribute to sustainable development over multiple sessions or cycles.

---

# Weighted Scoring Formula

For every active criterion:

```text
Criterion Contribution =
Criterion Score × Criterion Weight
```

The total weighted score is:

```text
Weighted Score =
Σ(Criterion Score × Criterion Weight)
```

The maximum possible score is:

```text
Maximum Weighted Score =
Σ(5 × Criterion Weight)
```

The Base Suitability Score is:

```text
Base Suitability Score =
Weighted Score
÷ Maximum Weighted Score
× 100
```

The Base Suitability Score is limited to:

```text
0 to 100
```

---

# Context Modifiers

Context modifiers represent temporary factors not fully expressed through the standard criteria.

They should be used sparingly.

Modifiers must not duplicate factors already scored.

Possible positive modifiers include:

| Situation                                           | Modifier |
| --------------------------------------------------- | -------: |
| Strong successful athlete-specific history          | +1 to +3 |
| Exceptional alignment with immediate cycle priority | +1 to +3 |
| Preserves a highly valuable progression sequence    | +1 to +2 |
| Major practical advantage without adaptation loss   | +1 to +2 |

Possible negative modifiers include:

| Situation                                       | Modifier |
| ----------------------------------------------- | -------: |
| Recent repeated exposure requiring variation    | -1 to -4 |
| Residual soreness not already fully represented | -1 to -5 |
| Reduced readiness specific to the candidate     | -1 to -6 |
| Upcoming combat session                         | -1 to -6 |
| Competition proximity                           | -1 to -8 |
| Unusual setup burden                            | -1 to -3 |
| Previous poor response                          | -1 to -6 |

Default limits:

```text
Maximum Total Positive Modifier = +5
Maximum Total Negative Modifier = -15
```

The Final Suitability Score is:

```text
Final Suitability Score =
Base Suitability Score
+ Total Positive Modifiers
- Total Negative Modifiers
```

The result is clamped to:

```text
Minimum = 0
Maximum = 100
```

Modifiers may only be applied when:

* the candidate remains eligible;
* mandatory criteria remain passed;
* the modifier is not already represented by another criterion;
* the reason is recorded.

An apparent need for a penalty greater than 15 should trigger a review of eligibility or mandatory thresholds.

---

# Confidence

Confidence measures the reliability of the scoring result.

Confidence is not part of the Final Suitability Score.

It must not be used as a hidden mathematical penalty.

A candidate may have:

* a high score with low confidence;
* a moderate score with high confidence.

These are different situations and must remain visible.

Confidence levels are:

| Level     | Meaning                                      |
| --------- | -------------------------------------------- |
| Very High | Extensive reliable athlete-specific data     |
| High      | Good data and stable context                 |
| Moderate  | Sufficient data with meaningful uncertainty  |
| Low       | Important information is incomplete          |
| Very Low  | Major uncertainty limits automatic selection |

Confidence depends on:

* athlete-history completeness;
* exercise-metadata quality;
* readiness-data quality;
* pain-data quality;
* previous athlete exposure;
* clarity of objective;
* evidence quality;
* equipment certainty;
* schedule certainty.

---

# Confidence Rules

Confidence decreases when:

* pain status is unclear;
* readiness data are incomplete;
* technical level is uncertain;
* the candidate is novel;
* the substitution is indirect;
* equipment details are uncertain;
* athlete history is missing;
* the primary objective is ambiguous;
* evidence is limited.

Confidence increases when:

* the athlete has used the option successfully;
* performance data are available;
* recent readiness data are complete;
* exercise metadata are complete;
* the context is stable;
* the objective is clearly defined;
* previous response is consistent.

Default automation behavior:

```text
Very High or High Confidence
→ Automatic selection allowed if score threshold is met

Moderate Confidence
→ Automatic selection allowed for low-risk options

Low Confidence
→ Conservative option or manual review

Very Low Confidence
→ No automatic selection for high-risk options
```

Missing critical safety information may create ineligibility rather than merely low confidence.

---

# Scientific Evidence Classification

Methods may receive an evidence classification:

| Classification | Meaning                                       |
| -------------- | --------------------------------------------- |
| Established    | Strong physiological and practical support    |
| Supported      | Reasonable support with contextual dependence |
| Emerging       | Promising but uncertain                       |
| Speculative    | Weak or indirect support                      |
| Unsupported    | Insufficient basis for automatic selection    |

Evidence classification contributes to Confidence.

It must not be applied as a second numerical multiplier after Confidence.

Evidence strength does not replace athlete-specific response.

An Established method may still be inappropriate for a particular athlete.

An Emerging method may be considered when:

* risk is low;
* purpose is explicit;
* uncertainty is recorded;
* monitoring is possible.

Unsupported methods must not be selected automatically.

---

# Score Interpretation

Default Final Suitability Score interpretation:

|    Score | Interpretation                 |
| -------: | ------------------------------ |
|   90–100 | Exceptional contextual fit     |
|    80–89 | Strong option                  |
|    70–79 | Valid option                   |
|    60–69 | Acceptable with limitations    |
|    50–59 | Weak option                    |
| Below 50 | Reject under normal conditions |

These ranges apply only after:

* eligibility;
* mandatory thresholds.

A score above 80 does not guarantee automatic selection when confidence is low or session validation fails.

---

# Selection Thresholds

Default thresholds are:

```text
Automatic Selection Threshold = 80
Valid Candidate Threshold = 70
Conditional Candidate Range = 60 to 69
Default Rejection Threshold = Below 60
```

Selection behavior:

```text
80 to 100
→ Selectable automatically when confidence and validation allow

70 to 79
→ Valid alternative or selectable when no stronger option exists

60 to 69
→ Use only with documented limitation, constraint or review

Below 60
→ Reject under normal conditions
```

Thresholds may be raised for:

* competition proximity;
* high-impact work;
* ballistic work;
* maximal loading;
* unsupervised sessions;
* low confidence.

Thresholds may be adapted for constrained environments, but mandatory criteria must never be lowered below safe limits.

---

# Tie-Breaking Rules

Candidates are considered approximately tied when their Final Suitability Scores differ by less than:

```text
Tie Margin = 3 points
```

Default tie-break order:

1. Higher Safety
2. Higher Primary Adaptation Match
3. Higher Technical Feasibility
4. Higher Athlete Compatibility
5. Higher Recovery Compatibility
6. Lower Interference Risk
7. Better Stimulus-to-Fatigue Ratio
8. Better Previous Athlete Response
9. Better Exercise Continuity
10. Higher Adherence Probability
11. Lower Setup Burden

If candidates remain tied after these rules, both may be retained as valid alternatives.

The engine should not invent false precision to force a single winner.

---

# Scoring Profiles

The Scoring Model uses dedicated profiles for each decision level.

---

# Profile 1 — Module Priority Score

Module Priority Scoring determines which Capability Modules deserve session resources.

It does not determine the exercise.

Default criteria:

| Criterion                       | Weight |
| ------------------------------- | -----: |
| Primary Goal Relevance          |      5 |
| Training Cycle Priority         |      5 |
| Identified Limitation Relevance |      4 |
| Athlete Readiness Compatibility |      4 |
| Recovery Capacity Compatibility |      4 |
| Combat-Practice Compatibility   |      4 |
| Recent Exposure Need            |      3 |
| Long-Term Development Value     |      3 |
| Available Time Compatibility    |      2 |

The Module Priority Score uses the standard normalized formula.

Recent Exposure Need is scored positively:

| Score | Meaning                                      |
| ----: | -------------------------------------------- |
|     5 | Module is due and underexposed               |
|     4 | Appropriate exposure                         |
|     3 | Neutral                                      |
|     2 | Recently exposed                             |
|     1 | Repeated exposure with limited justification |
|     0 | Clearly excessive exposure                   |

Module inclusion remains subject to:

* conflicts;
* recovery limits;
* time budget;
* session purpose;
* validation.

A high-priority module may still be postponed when the athlete cannot currently express the intended adaptation.

---

# Profile 2 — Exercise Selection Score

Exercise Selection Scoring ranks exercises capable of implementing a selected module.

Default criteria:

| Criterion                  | Weight |
| -------------------------- | -----: |
| Safety                     |      5 |
| Primary Adaptation Match   |      5 |
| Module Match               |      5 |
| Technical Feasibility      |      5 |
| Pain Compatibility         |      5 |
| Athlete Compatibility      |      4 |
| Movement Function Match    |      4 |
| Recovery Compatibility     |      4 |
| Interference Compatibility |      4 |
| Stimulus-to-Fatigue Ratio  |      4 |
| Progression Potential      |      3 |
| Previous Athlete Response  |      3 |
| Exercise Continuity        |      3 |
| Velocity Profile Match     |      2 |
| Force Direction Match      |      2 |
| Loadability                |      2 |
| Equipment Compatibility    |      2 |
| Environment Compatibility  |      2 |
| Time Compatibility         |      2 |
| Adherence Probability      |      1 |

Not every criterion must remain active for every module.

Module-specific profiles may set irrelevant criteria to `0`.

Examples:

* Velocity Profile Match should receive high weight for Power;
* Loadability should receive high weight for Strength;
* Energy-system compatibility should replace Loadability for Conditioning;
* tissue relevance should receive high weight for Robustness.

All profile changes must be predefined and documented.

---

# Profile 3 — Substitution Score

Substitution Scoring compares alternatives when the original exercise cannot or should not be used.

Its first objective is to preserve the primary adaptation.

Default criteria:

| Criterion                       | Weight |
| ------------------------------- | -----: |
| Safety                          |      5 |
| Primary Adaptation Preservation |      5 |
| Module Preservation             |      5 |
| Athlete Compatibility           |      5 |
| Technical Feasibility           |      4 |
| Movement Function Preservation  |      4 |
| Fatigue-Profile Compatibility   |      4 |
| Force Direction Match           |      3 |
| Contraction Profile Match       |      3 |
| Velocity Profile Match          |      3 |
| Range-of-Motion Relevance       |      3 |
| Equipment Compatibility         |      3 |
| Previous Athlete Response       |      2 |
| Physical Transfer               |      2 |
| Adherence Probability           |      1 |

Substitution output must identify:

* what is preserved;
* what changes;
* what is lost;
* why the substitute remains acceptable.

A substitute that changes the primary adaptation is not a true substitution.

It is a program modification and must be recorded as such.

---

# Profile 4 — Session Quality Score

Session Quality Scoring evaluates the complete assembled session.

It does not average exercise scores mechanically.

A session containing several strong exercises may still be incoherent.

Default criteria:

| Criterion                       | Weight |
| ------------------------------- | -----: |
| Primary Objective Coherence     |      5 |
| Safety                          |      5 |
| Athlete Readiness Compatibility |      5 |
| Module Selection Coherence      |      4 |
| Module Order Coherence          |      4 |
| Fatigue Control                 |      4 |
| Recovery Compatibility          |      4 |
| Weekly Integration              |      4 |
| Combat-Practice Compatibility   |      4 |
| Duration Feasibility            |      3 |
| Redundancy Control              |      3 |
| Progression Coherence           |      3 |
| Athlete Adherence               |      2 |

Session Quality Scoring occurs after assembly.

Final Validation remains authoritative.

A session with a blocking validation error is invalid regardless of its Session Quality Score.

---

# Module-Specific Criterion Adjustments

Each Capability Module may define a specialized Exercise Selection profile.

The weights below describe priorities, not complete profiles.

---

## Preparation

Increase weight for:

* Session-Objective Relevance;
* Technical Simplicity;
* Low Fatigue;
* Time Compatibility;
* Transition Value.

Preparation must not score highly because it creates fatigue.

---

## Movement

Increase weight for:

* Movement Relevance;
* Active Control;
* Technical Clarity;
* Low Fatigue;
* Transfer to Required Positions;
* Measurability.

Movement work must not be scored by exhaustion or calorie expenditure.

---

## Power

Increase weight for:

* Velocity Profile Match;
* Maximal Intent Compatibility;
* Technical Feasibility;
* Neural Readiness;
* Low Technical Fatigue;
* Force Direction Match;
* Stopping-Criterion Reliability.

Power candidates must be rejected or modified when significant velocity or technical loss is expected.

---

## Strength

Increase weight for:

* Primary Adaptation Match;
* Loadability;
* Technical Repeatability;
* Progression Potential;
* Measurability;
* Recovery Compatibility.

---

## Functional Hypertrophy

Increase weight for:

* Target-Tissue Relevance;
* Productive Volume Potential;
* Loadability;
* Technical Repeatability;
* Stimulus-to-Fatigue Ratio;
* Recovery Compatibility.

---

## Robustness

Increase weight for:

* Target-Tissue Relevance;
* Pain Compatibility;
* Load-Tolerance Progression;
* Position Relevance;
* Control;
* Recovery Compatibility;
* Consistency.

Robustness work prioritizes progressive tolerance, not maximal fatigue.

---

## Grip

Increase weight for:

* Grip-Function Match;
* Tissue Compatibility;
* Progression Potential;
* Combat-Practice Compatibility;
* Local Fatigue Control;
* Measurability.

---

## Core

Increase weight for:

* Trunk-Function Match;
* Force-Transmission Relevance;
* Postural Control;
* Movement Integration;
* Technical Repeatability;
* Low Unnecessary Fatigue.

Core work must not score highly solely because it produces abdominal fatigue.

---

## Conditioning

Increase weight for:

* Energy-System Match;
* Work-to-Rest Compatibility;
* Output Measurability;
* Local-Limitation Compatibility;
* Recovery Cost;
* Combat-Practice Compatibility;
* Technical Sustainability.

A conditioning method receives a lower score when local muscular failure prevents the intended cardiovascular or energetic stimulus.

---

## Recovery

Increase weight for:

* Recovery Objective Match;
* Low Physiological Cost;
* Readiness Improvement Potential;
* Symptom Compatibility;
* Simplicity;
* Athlete Adherence.

A Recovery option must not create a disproportionate recovery cost.

---

# Heavy-Bag Work

Heavy-bag work is scored according to its selected Capability Module.

It does not use one universal heavy-bag score.

---

## Heavy-Bag Power Work

High-priority criteria include:

* Power Intent Match;
* Velocity and Impact Quality;
* Technical Control;
* Full-Recovery Compatibility;
* Output Consistency;
* Low Repetition Degradation;
* Shoulder and Lower-Body Readiness.

The set or round must stop when:

* impact quality falls;
* speed falls significantly;
* technique degrades;
* maximal intent cannot be maintained.

---

## Heavy-Bag Conditioning Work

High-priority criteria include:

* Energy-System Match;
* Work-to-Rest Ratio;
* Sustainable Output;
* Technical Sustainability;
* Recovery Cost;
* Weekly Compatibility.

Conditioning bag work must not be described as Power when fatigue accumulation is the main execution characteristic.

---

## Heavy-Bag Movement Work

Controlled bag or footwork drills may implement Movement when the objective is:

* positioning;
* controlled displacement;
* coordination;
* force-transfer organization;
* low-fatigue movement quality.

The engine must not claim that such work replaces discipline-specific technical coaching.

---

# Readiness

Readiness affects candidates according to their demands.

Readiness must not be applied as one identical penalty to every exercise.

Relevant readiness dimensions may include:

* general energy;
* sleep;
* motivation;
* stress;
* neural readiness;
* local soreness;
* pain;
* resting heart rate;
* recent workload;
* combat workload.

Examples:

* poor lower-body readiness primarily affects high-demand lower-body work;
* shoulder soreness affects pressing and striking;
* poor sleep affects complex, ballistic and high-risk work more heavily;
* local muscular fatigue may not prohibit low-intensity Recovery work.

Readiness may influence:

* eligibility;
* mandatory criteria;
* criterion scores;
* contextual modifiers.

The same readiness factor must not be counted repeatedly without justification.

---

# Readiness-to-Demand Check

The engine may use a Readiness-to-Demand Check as a supporting rule.

Both readiness and demand must be normalized to the same scale.

```text
Readiness-to-Demand Ratio =
Relevant Athlete Readiness
÷ Candidate Demand
```

Suggested interpretation:

|         Ratio | Meaning                                           |
| ------------: | ------------------------------------------------- |
| 1.20 or above | Strong readiness margin                           |
|     1.00–1.19 | Appropriate demand                                |
|     0.85–0.99 | Adjustment may be required                        |
|     0.70–0.84 | Significant reduction required                    |
|    Below 0.70 | High-demand candidate should normally be replaced |

This ratio is not a medical assessment.

It must not replace the detailed fatigue dimensions.

---

# Competition Proximity

Competition proximity changes scoring priorities.

---

## Far From Competition

The engine may tolerate:

* higher volume;
* higher fatigue;
* planned tissue loading;
* controlled novelty;
* demanding development work.

---

## Moderate Proximity

The engine should increasingly prioritize:

* stable exercises;
* technical quality;
* controlled fatigue;
* sport-relevant output;
* predictable recovery.

---

## Close to Competition

The engine should prioritize:

* readiness;
* speed;
* confidence;
* low soreness;
* low injury risk;
* low unnecessary fatigue;
* familiar exercise selection.

High-eccentric, unfamiliar or high-damage options receive lower compatibility scores.

A candidate may become ineligible when its recovery time conflicts directly with competition.

---

# Combat-Practice Integration

Combat practice is an external training demand that must influence scoring.

Relevant inputs include:

* practice type;
* session intensity;
* expected contact;
* striking volume;
* kicking volume;
* grappling volume;
* technical priority;
* session timing.

---

## Before Hard Sparring

Reduce suitability for:

* exhaustive conditioning;
* high-volume lower-body work;
* high shoulder fatigue;
* high-impact plyometrics;
* work producing significant soreness.

---

## Before Technical Practice

Reduce suitability for:

* work that impairs coordination;
* excessive grip fatigue;
* local muscular failure;
* significant neural fatigue.

---

## After Hard Combat Practice

Reduce suitability for:

* maximal attempts;
* high-risk ballistic work;
* complex technical lifts;
* high-impact work;
* additional exhaustive conditioning.

---

# Missing Data

The system must not silently assume ideal conditions.

When data are missing, it must:

1. identify the missing information;
2. assess whether it is safety-critical;
3. reduce confidence;
4. use conservative assumptions;
5. avoid high-risk candidates;
6. prefer simple and controllable options.

Examples of missing information include:

* pain status;
* equipment;
* technical level;
* recent training;
* specific-practice workload;
* competition date;
* current readiness.

Missing critical safety information may make high-risk candidates ineligible.

---

# Default Conservative Assumptions

When non-critical data are incomplete, the engine may assume:

* no direct supervision;
* no spotter;
* moderate technical competence;
* average readiness;
* normal but not exceptional recovery;
* uncertain equipment beyond confirmed items.

The engine must not assume:

* advanced technical mastery;
* medical clearance;
* perfect recovery;
* unlimited equipment;
* absence of pain;
* absence of previous injury.

---

# Double-Counting Prevention

The same underlying factor must not be rewarded or penalized repeatedly.

Examples:

* pain must not be fully penalized under Safety, Pain Compatibility and Injury History simultaneously;
* combat interference must not be duplicated across multiple criteria and modifiers;
* missing equipment must be an eligibility decision, not several penalties;
* technical complexity must be separated clearly from supervision and error tolerance;
* recent exposure must not be penalized under both continuity and variation without an explicit distinction.

Rules:

1. Use the most direct criterion for the factor.
2. Apply a modifier only when the factor is not already represented adequately.
3. Record which criterion owns the factor.
4. Review strongly correlated criteria during calibration.

---

# Continuity and Variation

The model must balance exercise continuity and useful variation.

Continuity is preferred when:

* progression continues;
* technique remains strong;
* pain remains acceptable;
* fatigue remains appropriate;
* the exercise still serves the Training Cycle.

Variation may be justified by:

* plateau;
* overuse;
* adverse response;
* changed objective;
* changed equipment;
* phase transition;
* adherence decline.

Repeated exposure must not create an automatic penalty when the exercise remains productive.

A repetition penalty may apply only when repetition creates a specific concern.

Suggested maximum repetition modifier:

```text
Minor concern = -1
Moderate concern = -2
Clear overexposure concern = -4
```

---

# Redundancy

Redundancy is primarily a session-level issue.

Exercises may be redundant when they duplicate:

* primary adaptation;
* movement function;
* joint stress;
* target tissues;
* fatigue profile;
* progression purpose.

Suggested session-level modifiers:

```text
Minor Redundancy = -2
Moderate Redundancy = -5
High Redundancy = -10
```

Redundancy may be deliberate during specialization.

Intentional redundancy must be justified in the Decision Trace.

---

# Session and Weekly Budgets

The engine may track internal comparative budgets for:

* neural fatigue;
* muscular fatigue;
* connective-tissue stress;
* metabolic fatigue;
* impact contacts;
* technical complexity;
* time.

Budget values are internal planning units.

They are not direct physiological measurements.

A session exceeding a budget must be:

* reduced;
* reorganized;
* substituted;
* or rejected.

The same logic applies to weekly exposure.

Possible weekly categories include:

* lower-body high-intensity exposure;
* upper-body pressing exposure;
* pulling exposure;
* grip exposure;
* sprint exposure;
* plyometric contacts;
* impact exposure;
* maximal-strength work;
* high-intensity conditioning.

Budget logic belongs to constraints and validation.

It should influence scores only when candidates remain valid alternatives.

---

# Progression Scoring

A progression option must be evaluated before selection.

Default progression criteria include:

| Criterion            | Weight |
| -------------------- | -----: |
| Technical Readiness  |      5 |
| Recent Performance   |      5 |
| Pain Compatibility   |      5 |
| Recovery Response    |      4 |
| Adaptation Relevance |      4 |
| Progression Size     |      4 |
| Risk Compatibility   |      4 |
| Long-Term Value      |      3 |

Completing the previous session does not automatically authorize progression.

The engine should verify:

* target work completed;
* technical quality maintained;
* symptoms acceptable;
* velocity appropriate when relevant;
* recovery satisfactory;
* progression increment reasonable.

Possible progression outcomes include:

* increase load;
* increase repetitions;
* increase velocity target;
* increase range of motion;
* increase volume;
* improve density;
* increase complexity;
* repeat current prescription;
* regress;
* deload.

---

# Manual Override

A qualified coach or authorized system rule may override a numerical ranking.

An override must record:

* original highest-ranked candidate;
* selected candidate;
* reason;
* expected benefit;
* known compromise;
* review condition or date.

Valid reasons may include:

* coaching observation not represented in data;
* competition strategy;
* rehabilitation instruction;
* psychological exposure;
* deliberate technical teaching;
* planned assessment.

Manual override must never bypass:

* hard safety exclusions;
* medical contraindications;
* blocking validation errors.

---

# Transparency

Every recommendation must be explainable.

Internal scoring output should include:

```text
Decision Type:
Candidate:
Eligibility:
Eligibility Reasons:
Mandatory Criteria:
Mandatory Criteria Passed:
Active Scoring Profile:
Criterion Scores:
Criterion Weights:
Base Suitability Score:
Positive Modifiers:
Negative Modifiers:
Final Suitability Score:
Confidence Level:
Confidence Reasons:
Rank:
Selection Status:
```

User-facing output may include:

```text
Selected Option:
Why It Was Selected:
Main Benefit:
Main Limitation:
Relevant Adjustment:
```

The user-facing explanation does not need to display every numerical criterion unless requested.

---

# Decision Trace Integration

The Scoring Model must provide the Decision Trace with:

* candidates considered;
* candidates excluded;
* exclusion reasons;
* mandatory-threshold failures;
* active criteria;
* active weights;
* applied modifiers;
* final ranking;
* confidence level;
* tie-break rules used;
* override information.

The Decision Trace must reflect the actual calculation and rules applied.

It must not create a retrospective narrative unrelated to the real decision process.

---

# Scoring Consistency

Criterion meanings must remain stable across the engine.

For example:

* Safety `5` must represent the same safety quality in selection and substitution;
* Primary Adaptation Match `5` must represent a direct and strong match;
* Technical Feasibility `3` must represent acceptable current execution;
* Recovery Compatibility `2` must represent a meaningful recovery concern.

Definitions must not change between candidates to favor a preferred result.

---

# Calibration

The Scoring Model must be calibrated against actual athlete outcomes.

Calibration data may include:

* performance progression;
* technical quality;
* pain response;
* fatigue;
* soreness;
* adherence;
* recovery;
* session completion;
* exercise substitution frequency;
* combat-practice quality.

Calibration may adjust:

* criterion definitions;
* default weights;
* module-specific profiles;
* modifier ranges;
* confidence rules;
* athlete-specific preferences.

Calibration must not weaken hard safety rules.

---

# Athlete-Specific Adaptation

The default model may become athlete-specific over time.

Examples:

## Athlete With Recurrent Injury Concerns

Increase priority for:

* Pain Compatibility;
* Previous Athlete Response;
* Connective-Tissue Cost Compatibility;
* Recovery Compatibility;
* Technical Repeatability.

## Advanced Athlete

Increase priority for:

* Phase Relevance;
* Velocity Profile Match;
* Force Direction Match;
* Measurability;
* athlete-specific response.

## Beginner Athlete

Increase priority for:

* Technical Feasibility;
* Error Tolerance;
* Setup Reliability;
* Exercise Continuity;
* Progression Potential.

## Combat Athlete With High Specific-Practice Volume

Increase priority for:

* Interference Compatibility;
* Recovery Compatibility;
* Combat-Practice Compatibility;
* Stimulus-to-Fatigue Ratio;
* weekly integration.

Personalized weights must remain within:

```text
1 to 5
```

Mandatory criteria remain mandatory.

Personalization must not distort the model enough to make poor-adaptation or unsafe options rank highly.

---

# Data Quality

Data quality supports Confidence assessment.

Data may be classified as:

## High Quality

* direct measurement;
* repeated observation;
* validated testing;
* consistent training history.

## Moderate Quality

* structured athlete feedback;
* coach observation;
* recent self-report;
* repeated but non-instrumented observation.

## Low Quality

* incomplete memory;
* isolated subjective impression;
* unverified assumption;
* outdated information.

Low data quality must be visible.

It must not be presented as certainty.

---

# Model Audit

The system should periodically audit:

* high-scoring selections;
* excluded candidates;
* substitution outcomes;
* progression decisions;
* pain events;
* fatigue predictions;
* recovery predictions;
* exercise continuity;
* athlete adherence;
* confidence accuracy.

Audit questions include:

* Did high-scoring options produce the expected adaptation?
* Were fatigue costs underestimated?
* Were valid candidates rejected?
* Are some criteria duplicated?
* Are preferences overpowering adaptation?
* Is the engine changing exercises too often?
* Are combat sessions sufficiently protected?
* Are confidence levels realistic?
* Do manual overrides produce better outcomes?

---

# Model Learning

Future versions of CAS may refine scores using athlete data.

Possible inputs include:

* completed sessions;
* skipped exercises;
* substitutions;
* pain reports;
* RPE;
* RIR;
* velocity;
* load progression;
* heart rate;
* session duration;
* recovery;
* soreness;
* readiness;
* combat-practice feedback.

Learning must remain constrained by:

* safety rules;
* physiological doctrine;
* explainability;
* data quality;
* the one-primary-adaptation rule.

The system must not learn unsafe behavior merely because the athlete repeatedly chooses it.

---

# Example — Exercise Selection

Objective:

```text
Develop lower-body maximum strength while limiting interference with kick training.
```

Selected module:

```text
Strength
```

Candidates:

* Back Squat;
* Front Squat;
* Trap Bar Deadlift;
* Bulgarian Split Squat;
* Leg Press.

Illustrative result:

| Candidate             | Final Score | Confidence |
| --------------------- | ----------: | ---------- |
| Trap Bar Deadlift     |          84 | High       |
| Front Squat           |          81 | High       |
| Back Squat            |          78 | High       |
| Bulgarian Split Squat |          74 | High       |
| Leg Press             |          71 | Moderate   |

Selected candidate:

```text
Trap Bar Deadlift
```

Reason:

```text
It provides a strong maximum-strength stimulus with reliable loading and a lower predicted interference cost for the upcoming kick session.
```

This result is contextual.

It does not establish universal superiority.

---

# Example — Substitution

Original exercise:

```text
Weighted Pull-Up
```

Constraint:

```text
No pull-up bar available
```

Candidates:

* Heavy Lat Pulldown;
* Kneeling Band Pulldown;
* Inverted Row;
* Chest-Supported Row.

Illustrative result:

| Candidate              | Final Score | Confidence |
| ---------------------- | ----------: | ---------- |
| Heavy Lat Pulldown     |          88 | High       |
| Kneeling Band Pulldown |          76 | Moderate   |
| Inverted Row           |          69 | High       |
| Chest-Supported Row    |          64 | High       |

Selected substitute:

```text
Heavy Lat Pulldown
```

Preserved:

* vertical pulling function;
* high-force intent;
* progressive loading;
* primary Strength adaptation.

Changed:

* body position;
* stabilization demand.

Reduced:

* relative-strength specificity.

---

# Example — Hard Exclusion

Planned candidate:

```text
Depth Jump
```

Current athlete data:

* poor sleep;
* significant calf soreness;
* hard sparring during the previous evening;
* reduced landing control.

Result:

```text
Eligibility = INELIGIBLE
Final Score = NOT APPLICABLE
Selection Status = EXCLUDED
```

The candidate is not assigned a low score.

A lower-demand landing drill or Recovery option must be evaluated separately.

---

# Recommended Engine Output

```text
decision_type:
candidate_id:
candidate_name:

eligibility:
eligibility_reasons:

mandatory_criteria:
mandatory_criteria_passed:

scoring_profile:
criterion_scores:
criterion_weights:

base_suitability_score:
positive_modifiers:
negative_modifiers:
final_suitability_score:

confidence_level:
confidence_reasons:

rank:
selection_status:
tie_break_applied:
override_applied:
```

The definitive implementation format is governed by:

* `19_ENGINE_INPUT_SCHEMA.md`;
* `20_ENGINE_OUTPUT_SCHEMA.md`;
* `21_DECISION_TRACE.md`.

---

# Decision Logic Summary

```text
Is the candidate allowed?
        ↓
No → Exclude without score
        ↓
Yes
        ↓
Does every mandatory criterion pass?
        ↓
No → Reject or evaluate a regression
        ↓
Yes
        ↓
Select the correct scoring profile
        ↓
Score active criteria
        ↓
Apply predefined weights
        ↓
Normalize to 0–100
        ↓
Apply limited contextual modifiers
        ↓
Assess confidence separately
        ↓
Rank valid candidates
        ↓
Apply tie-break rules
        ↓
Select the highest-value coherent option
        ↓
Run final validation
```

---

# Final Principles

The Combat Athlete System does not select the option with the greatest theoretical performance potential in isolation.

It selects the valid option with the highest expected value for the specific:

* athlete;
* adaptation;
* Capability Module;
* session;
* Training Cycle;
* recovery state;
* combat schedule;
* practical context.

Expected value includes:

* adaptation quality;
* safety;
* technical execution;
* fatigue control;
* recovery;
* progression;
* adherence;
* long-term development.

The model must remain:

* explainable;
* contextual;
* conservative when critical data are incomplete;
* consistent across decisions;
* subordinate to hard rules;
* compatible with final validation.

> Eligibility decides what is allowed.

> Scoring decides what is preferable.

> Confidence describes how certain the engine is.

> Validation decides whether the final result may be delivered.
