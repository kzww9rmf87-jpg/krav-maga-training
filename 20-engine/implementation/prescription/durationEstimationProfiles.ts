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
