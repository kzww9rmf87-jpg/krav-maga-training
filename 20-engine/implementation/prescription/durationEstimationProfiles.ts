/**
 * Combat Athlete System — Duration Estimation Profile Contract
 * Version 0.1
 *
 * Before this file, `ExercisePrescriptionCapabilities.durationEstimationProfileId`
 * was an opaque string (`"duration_profile_bench_press"`, ...) that only
 * ever had to be non-null — nothing in the pipeline resolved it to real
 * timing data, because no such data is documented anywhere in
 * `50-exercises/` or `20-engine/`.
 *
 * This file makes that gap explicit instead of hiding it behind a string.
 * A `DurationEstimationProfile` can represent, per documented volume
 * structure: average repetition time, average setup time, transition
 * time, rest time, per-set time, per-round time, per-interval time, and
 * an optional technical margin — but every pilot exercise's profile below
 * has every one of those fields set to `null` and `status: "unresolved"`,
 * because no source document gives real seconds for any of them. No
 * value here is invented. `getDurationEstimationProfile` refuses to
 * present an unresolved profile as usable — callers must check `status`
 * explicitly.
 */

import type { Identifier } from "../types";
import type { VolumeStructure } from "./types";

export type DurationEstimationProfileStatus = "resolved" | "unresolved";

export interface DurationEstimationProfile {
  profileId: Identifier;
  exerciseId: Identifier;
  status: DurationEstimationProfileStatus;
  volumeStructure: VolumeStructure;
  averageRepetitionSeconds: number | null;
  averageSetupSeconds: number | null;
  transitionSeconds: number | null;
  restSeconds: number | null;
  perSetSeconds: number | null;
  perRoundSeconds: number | null;
  perIntervalSeconds: number | null;
  technicalMarginSeconds: number | null;
  sourceRuleIds: readonly Identifier[];
}

const unresolvedProfile = (
  exerciseId: Identifier,
  volumeStructure: VolumeStructure,
  sourceRuleIds: readonly Identifier[],
): DurationEstimationProfile => ({
  profileId: `duration_profile_${exerciseId}`,
  exerciseId,
  status: "unresolved",
  volumeStructure,
  averageRepetitionSeconds: null,
  averageSetupSeconds: null,
  transitionSeconds: null,
  restSeconds: null,
  perSetSeconds: null,
  perRoundSeconds: null,
  perIntervalSeconds: null,
  technicalMarginSeconds: null,
  sourceRuleIds,
});

/**
 * Every pilot exercise's profile, all `"unresolved"`: no chapter in
 * `50-exercises/` or engine document gives per-repetition, setup,
 * transition or technical-margin timing in seconds for any of the seven
 * pilot exercises.
 *
 * Keyed by `profileId` (`duration_profile_<exerciseId>`) — the same
 * identifier already used as `ExercisePrescriptionCapabilities.durationEstimationProfileId`
 * in `exercisePrescriptionRegistry.ts`, so no existing entry needed
 * renaming.
 */
const PILOT_PROFILES: readonly DurationEstimationProfile[] = [
  unresolvedProfile("bench_press", "sets_reps", ["50-exercises/07_BENCH_PRESS"]),
  unresolvedProfile("back_squat", "sets_reps", ["50-exercises/01_BACK_SQUAT"]),
  unresolvedProfile("trap_bar_deadlift", "sets_reps", ["50-exercises/03_TRAP_BAR_DEADLIFT"]),
  unresolvedProfile("pull_up", "sets_reps", ["50-exercises/10_PULL_UP"]),
  unresolvedProfile("farmer_carry", "sets_distance", ["50-exercises/66_CARRIES/10_FARMER_CARRY.md"]),
  unresolvedProfile("pallof_press", "sets_duration", ["50-exercises/62_CORE/11_PALLOF_PRESS.md"]),
  unresolvedProfile("box_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/10_BOX_JUMP.md"]),

  // Force
  unresolvedProfile("front_squat", "sets_reps", ["50-exercises/02_FRONT_SQUAT"]),
  unresolvedProfile("romanian_deadlift", "sets_reps", ["50-exercises/04_ROMANIAN_DEADLIFT"]),
  unresolvedProfile("overhead_press", "sets_reps", ["50-exercises/08_OVERHEAD_PRESS"]),
  unresolvedProfile("bulgarian_split_squat", "sets_reps", ["50-exercises/06_BULGARIAN_SPLIT_SQUAT"]),

  // Power
  unresolvedProfile("push_press", "sets_reps", ["50-exercises/64_POWER/10_PUSH_PRESS.md"]),
  unresolvedProfile("hang_high_pull", "sets_reps", ["50-exercises/64_POWER/11_HANG_HIGH_PULL.md"]),
  unresolvedProfile("jump_shrug", "sets_reps", ["50-exercises/64_POWER/13_JUMP_SHRUG.md"]),

  // Core
  unresolvedProfile("hollow_body_hold", "sets_duration", ["50-exercises/62_CORE/13_HOLLOW_BODY_HOLD.md"]),
  unresolvedProfile("dragon_flag", "sets_duration", ["50-exercises/62_CORE/15_DRAGON_FLAG.md"]),

  // Carries / Grip
  unresolvedProfile("front_rack_carry", "sets_distance", ["50-exercises/66_CARRIES/11_FRONT_RACK_CARRY.md"]),
  unresolvedProfile("sandbag_carry", "sets_distance", ["50-exercises/66_CARRIES/12_SANDBAG_CARRY.md"]),
  unresolvedProfile("zercher_carry", "sets_distance", ["50-exercises/66_CARRIES/13_ZERCHER_CARRY.md"]),
  unresolvedProfile("suitcase_carry", "sets_distance", ["50-exercises/62_CORE/17_SUITCASE_CARRY.md"]),
  unresolvedProfile("overhead_carry", "sets_distance", ["50-exercises/62_CORE/18_OVERHEAD_CARRY.md"]),
  unresolvedProfile("pinch_carry", "sets_distance", ["50-exercises/65_GRIP/12_PINCH_CARRY.md"]),

  // Plyometrics
  unresolvedProfile("depth_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/11_DEPTH_JUMP.md"]),
  unresolvedProfile("broad_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/12_BROAD_JUMP.md"]),
  unresolvedProfile("knee_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/13_KNEE_JUMP.md"]),
  unresolvedProfile("lateral_bound", "sets_reps", ["50-exercises/63_PLYOMETRICS/14_LATERAL_BOUND.md"]),
  unresolvedProfile("single_leg_hop", "sets_reps", ["50-exercises/63_PLYOMETRICS/15_SINGLE_LEG_HOP.md"]),
  unresolvedProfile("split_squat_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/16_SPLIT_SQUAT_JUMP.md"]),

  // Ballistics
  unresolvedProfile("med_ball_slam", "sets_reps", ["50-exercises/67_BALLISTICS/14_MED_BALL_SLAM.md"]),
  unresolvedProfile("med_ball_chest_pass", "sets_reps", ["50-exercises/67_BALLISTICS/10_MED_BALL_CHEST_PASS.md"]),
  unresolvedProfile("med_ball_overhead_throw", "sets_reps", [
    "50-exercises/67_BALLISTICS/11_MED_BALL_OVERHEAD_THROW.md",
  ]),
  unresolvedProfile("med_ball_shot_put_throw", "sets_reps", [
    "50-exercises/67_BALLISTICS/15_MED_BALL_SHOT_PUT_THROW.md",
  ]),
  unresolvedProfile("med_ball_reverse_throw", "sets_reps", [
    "50-exercises/67_BALLISTICS/16_MED_BALL_REVERSE_THROW.md",
  ]),
  unresolvedProfile("med_ball_rotational_throw", "sets_reps", [
    "50-exercises/67_BALLISTICS/12_MED_BALL_ROTATIONAL_THROW.md",
  ]),
  unresolvedProfile("med_ball_scoop_toss", "sets_reps", [
    "50-exercises/67_BALLISTICS/13_MED_BALL_SCOOP_TOSS.md",
  ]),

  // Robustness
  unresolvedProfile("tibialis_raise", "sets_reps", ["50-exercises/41_TIBIALIS_RAISE"]),
  unresolvedProfile("rotator_cuff_training", "sets_reps", ["50-exercises/42_ROTATOR_CUFF_TRAINING"]),
  unresolvedProfile("wrist_strengthening", "sets_reps", ["50-exercises/43_WRIST_STRENGTHENING"]),
  unresolvedProfile("soleus_raise", "sets_reps", ["50-exercises/44_SOLEUS_RAISE"]),

  // Force/Tirage — first unblocked sub-lot
  unresolvedProfile("countermovement_jump", "sets_reps", ["50-exercises/21_COUNTERMOVEMENT_JUMP"]),

  unresolvedProfile("copenhagen_plank", "sets_duration", ["50-exercises/19_COPENHAGEN_PLANK"]),

  // Force/Tirage — strength_accessory_straight_sets_v0_1 batch
  unresolvedProfile("hip_thrust", "sets_reps", ["50-exercises/05_HIP_THRUST"]),
  unresolvedProfile("chin_up", "sets_reps", ["50-exercises/11_CHIN_UP"]),
  unresolvedProfile("barbell_row", "sets_reps", ["50-exercises/12_BARBELL_ROW"]),

  // Registry Lot 1 — Strength immediate
  unresolvedProfile("chest_supported_row", "sets_reps", ["50-exercises/13_CHEST_SUPPORTED_ROW"]),
  unresolvedProfile("dip", "sets_reps", ["50-exercises/14_DIP"]),
  unresolvedProfile("landmine_press", "sets_reps", ["50-exercises/26_LANDMINE_PRESS"]),
  unresolvedProfile("weighted_pull_up", "sets_reps", ["50-exercises/09_WEIGHTED_PULL_UP"]),
  unresolvedProfile("neck_training", "sets_reps", ["50-exercises/34_NECK_TRAINING"]),
  unresolvedProfile("nordic_hamstring_curl", "sets_reps", ["50-exercises/18_NORDIC_HAMSTRING_CURL"]),

  // Registry Lot 2 — Power immediate (sled_push not integrated this lot; no
  // duration profile added for it)
  unresolvedProfile("hang_power_clean", "sets_reps", ["50-exercises/64_POWER/12_HANG_POWER_CLEAN.md"]),

  // Registry Lot 3 — Movement immediate
  unresolvedProfile("bear_crawl", "sets_duration", ["50-exercises/37_BEAR_CRAWL"]),
  unresolvedProfile("bridging", "sets_duration", ["50-exercises/39_BRIDGING"]),
  unresolvedProfile("footwork_drills", "sets_duration", ["50-exercises/29_FOOTWORK_DRILLS"]),
  unresolvedProfile("shadow_boxing", "sets_duration", ["50-exercises/28_SHADOW_BOXING"]),
  unresolvedProfile("technical_stand_up", "sets_duration", ["50-exercises/35_TECHNICAL_STAND_UP"]),
  unresolvedProfile("shrimping", "sets_duration", ["50-exercises/38_SHRIMPING"]),

  // Registry Lot 4 — Combat movement immediate
  unresolvedProfile("sprawl", "sets_duration", ["50-exercises/30_SPRAWL"]),
  unresolvedProfile("shot_entries", "sets_duration", ["50-exercises/36_SHOT_ENTRIES"]),

  // Registry Lot 5 — Conditioning intervals (first `intervals` structure).
  //
  // Still `"unresolved"`, for the same reason as every profile above: the
  // RowErg chapter documents per-interval work and recovery ranges (which
  // the numerical profile already encodes as prescription targets), but no
  // setup, transition or technical-margin seconds — the very fields a
  // duration ESTIMATE needs. Deriving a total session duration by
  // multiplying the prescribed intervals is not estimation from documented
  // timing data, and is not done here.
  unresolvedProfile("rowerg_intervals", "intervals", ["50-exercises/49_ROWERG_INTERVALS"]),

  // Registry Lot 6 — Sprint intervals.
  //
  // `"unresolved"` like every profile above. The Sprint Intervals chapter
  // documents work and recovery ranges per effort, but no setup time, no
  // transition time, no technical margin and no total session duration —
  // and its own "Typical Recovery: 20-90 seconds" is deliberately not read
  // as a duration-estimation `restSeconds`: that field feeds a timing
  // ESTIMATE, while the prescribed rest is resolved separately from the
  // numerical profile. Multiplying intervals by their duration to invent a
  // session length is not estimation from documented timing data.
  unresolvedProfile("sprint_intervals", "intervals", ["50-exercises/47_SPRINT_INTERVALS"]),

  // Registry Lot 7 — Core repetition work (first `core` +
  // `straight_sets_repetitions` entry).
  //
  // `"unresolved"` like every profile above. The Ab Wheel chapter is one of
  // the most quantified in the library — sets, repetitions, rest, RPE and
  // even phase tempos — yet it documents no setup time, no transition time
  // and no technical margin, and gives no average seconds per repetition.
  // Its tempo options (`3-1-2`, `2-0-2`, `4-1-2`) sum to 6, 4 and 7 seconds
  // of movement respectively, but reading one of them as an
  // `averageRepetitionSeconds` would be choosing a tempo the prescription
  // never selects — the numerical profile encodes `global_intent:
  // controlled`, not a phase timing. No value is derived from them here.
  unresolvedProfile("ab_wheel", "sets_reps", ["50-exercises/62_CORE/10_AB_WHEEL.md"]),
];

export const DURATION_ESTIMATION_PROFILES: Record<Identifier, DurationEstimationProfile> = Object.fromEntries(
  PILOT_PROFILES.map((profile) => [profile.profileId, profile]),
);

export type DurationEstimationProfileFailureCode = "DURATION_PROFILE_NOT_FOUND" | "DURATION_PROFILE_UNRESOLVED";

export type DurationEstimationProfileResult =
  | { ok: true; profile: DurationEstimationProfile }
  | { ok: false; failureCode: DurationEstimationProfileFailureCode; profile: DurationEstimationProfile | null };

/**
 * Returns the profile only when it exists AND is `"resolved"`. An
 * `"unresolved"` profile is never returned as `ok: true` — the caller
 * still gets the profile object (for inspection/reporting) but must not
 * treat it as usable timing data.
 */
export function getDurationEstimationProfile(profileId: Identifier): DurationEstimationProfileResult {
  const profile = DURATION_ESTIMATION_PROFILES[profileId];

  if (profile === undefined) {
    return { ok: false, failureCode: "DURATION_PROFILE_NOT_FOUND", profile: null };
  }

  if (profile.status !== "resolved") {
    return { ok: false, failureCode: "DURATION_PROFILE_UNRESOLVED", profile };
  }

  return { ok: true, profile };
}
