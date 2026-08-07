/**
 * Combat Athlete System — Duration Estimation Coverage
 * Version 0.1
 *
 * Which exercises the duration model covers, and under which volume
 * structure.
 *
 * THIS FILE HOLDS NO NUMBERS, on purpose. It used to declare a full set of
 * per-exercise timing fields — average repetition seconds, setup, transition,
 * per-set, per-round, per-interval, technical margin — every one of them
 * `null`, because no source document gives them. That shape invited a second
 * duration model to grow beside the real one, 75 independently-invented
 * numbers deep.
 *
 * There is now exactly one duration model:
 *
 *   `durationEstimationModel.ts`      the engineering constants, one table
 *   `estimatePrescriptionDuration.ts` the estimator, generic over structure
 *                                     and method, reading the RESOLVED
 *                                     prescription
 *
 * The estimator never reads this file. A profile here is a coverage record:
 * it states that the exercise's prescription can be estimated, and names the
 * volume structure it estimates under. `status: "resolved"` means exactly
 * that — the exercise is covered — and no longer implies that per-exercise
 * timing data was found, because none was and none was invented.
 *
 * The original refusal to fabricate timing data was right and is preserved.
 * What changed is the recognition that most of a session's duration is not
 * timing data at all: for 22 of the 75 entries the working time is a value
 * the prescription itself resolves (a hold, a round, an interval), and the
 * rest between efforts is prescribed for all 75. Only per-repetition time,
 * per-metre time and setup remain genuinely undocumented, and those three
 * live in one labelled engineering table rather than scattered here.
 */

import type { Identifier } from "../types";
import type { VolumeStructure } from "./types";
import { SOURCE_DURATION_MODEL } from "./durationEstimationModel";

export type DurationEstimationProfileStatus = "resolved" | "unresolved";

export interface DurationEstimationProfile {
  profileId: Identifier;
  exerciseId: Identifier;
  /**
   * `"resolved"` means the duration model covers this exercise. It does NOT
   * mean per-exercise timing data was found — see the file header.
   */
  status: DurationEstimationProfileStatus;
  /** The structure the estimator branches on for this exercise. */
  volumeStructure: VolumeStructure;
  sourceRuleIds: readonly Identifier[];
}

/**
 * A coverage record. `sourceRuleIds` names the exercise chapter the
 * prescription was built from, plus the duration model that supplies
 * whatever the chapter does not.
 */
const modelBackedProfile = (
  exerciseId: Identifier,
  volumeStructure: VolumeStructure,
  sourceRuleIds: readonly Identifier[],
): DurationEstimationProfile => ({
  profileId: `duration_profile_${exerciseId}`,
  exerciseId,
  status: "resolved",
  volumeStructure,
  sourceRuleIds: [...sourceRuleIds, SOURCE_DURATION_MODEL],
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
  modelBackedProfile("bench_press", "sets_reps", ["50-exercises/07_BENCH_PRESS"]),
  modelBackedProfile("back_squat", "sets_reps", ["50-exercises/01_BACK_SQUAT"]),
  modelBackedProfile("trap_bar_deadlift", "sets_reps", ["50-exercises/03_TRAP_BAR_DEADLIFT"]),
  modelBackedProfile("pull_up", "sets_reps", ["50-exercises/10_PULL_UP"]),
  modelBackedProfile("farmer_carry", "sets_distance", ["50-exercises/66_CARRIES/10_FARMER_CARRY.md"]),
  modelBackedProfile("pallof_press", "sets_duration", ["50-exercises/62_CORE/11_PALLOF_PRESS.md"]),
  modelBackedProfile("box_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/10_BOX_JUMP.md"]),

  // Force
  modelBackedProfile("front_squat", "sets_reps", ["50-exercises/02_FRONT_SQUAT"]),
  modelBackedProfile("romanian_deadlift", "sets_reps", ["50-exercises/04_ROMANIAN_DEADLIFT"]),
  modelBackedProfile("overhead_press", "sets_reps", ["50-exercises/08_OVERHEAD_PRESS"]),
  modelBackedProfile("bulgarian_split_squat", "sets_reps", ["50-exercises/06_BULGARIAN_SPLIT_SQUAT"]),

  // Power
  modelBackedProfile("push_press", "sets_reps", ["50-exercises/64_POWER/10_PUSH_PRESS.md"]),
  modelBackedProfile("hang_high_pull", "sets_reps", ["50-exercises/64_POWER/11_HANG_HIGH_PULL.md"]),
  modelBackedProfile("jump_shrug", "sets_reps", ["50-exercises/64_POWER/13_JUMP_SHRUG.md"]),

  // Core
  modelBackedProfile("hollow_body_hold", "sets_duration", ["50-exercises/62_CORE/13_HOLLOW_BODY_HOLD.md"]),
  modelBackedProfile("dragon_flag", "sets_duration", ["50-exercises/62_CORE/15_DRAGON_FLAG.md"]),

  // Carries / Grip
  modelBackedProfile("front_rack_carry", "sets_distance", ["50-exercises/66_CARRIES/11_FRONT_RACK_CARRY.md"]),
  modelBackedProfile("sandbag_carry", "sets_distance", ["50-exercises/66_CARRIES/12_SANDBAG_CARRY.md"]),
  modelBackedProfile("zercher_carry", "sets_distance", ["50-exercises/66_CARRIES/13_ZERCHER_CARRY.md"]),
  modelBackedProfile("suitcase_carry", "sets_distance", ["50-exercises/62_CORE/17_SUITCASE_CARRY.md"]),
  modelBackedProfile("overhead_carry", "sets_distance", ["50-exercises/62_CORE/18_OVERHEAD_CARRY.md"]),
  modelBackedProfile("pinch_carry", "sets_distance", ["50-exercises/65_GRIP/12_PINCH_CARRY.md"]),

  // Plyometrics
  modelBackedProfile("depth_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/11_DEPTH_JUMP.md"]),
  modelBackedProfile("broad_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/12_BROAD_JUMP.md"]),
  modelBackedProfile("knee_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/13_KNEE_JUMP.md"]),
  modelBackedProfile("lateral_bound", "sets_reps", ["50-exercises/63_PLYOMETRICS/14_LATERAL_BOUND.md"]),
  modelBackedProfile("single_leg_hop", "sets_reps", ["50-exercises/63_PLYOMETRICS/15_SINGLE_LEG_HOP.md"]),
  modelBackedProfile("split_squat_jump", "sets_reps", ["50-exercises/63_PLYOMETRICS/16_SPLIT_SQUAT_JUMP.md"]),

  // Ballistics
  modelBackedProfile("med_ball_slam", "sets_reps", ["50-exercises/67_BALLISTICS/14_MED_BALL_SLAM.md"]),
  modelBackedProfile("med_ball_chest_pass", "sets_reps", ["50-exercises/67_BALLISTICS/10_MED_BALL_CHEST_PASS.md"]),
  modelBackedProfile("med_ball_overhead_throw", "sets_reps", [
    "50-exercises/67_BALLISTICS/11_MED_BALL_OVERHEAD_THROW.md",
  ]),
  modelBackedProfile("med_ball_shot_put_throw", "sets_reps", [
    "50-exercises/67_BALLISTICS/15_MED_BALL_SHOT_PUT_THROW.md",
  ]),
  modelBackedProfile("med_ball_reverse_throw", "sets_reps", [
    "50-exercises/67_BALLISTICS/16_MED_BALL_REVERSE_THROW.md",
  ]),
  modelBackedProfile("med_ball_rotational_throw", "sets_reps", [
    "50-exercises/67_BALLISTICS/12_MED_BALL_ROTATIONAL_THROW.md",
  ]),
  modelBackedProfile("med_ball_scoop_toss", "sets_reps", [
    "50-exercises/67_BALLISTICS/13_MED_BALL_SCOOP_TOSS.md",
  ]),

  // Robustness
  modelBackedProfile("tibialis_raise", "sets_reps", ["50-exercises/41_TIBIALIS_RAISE"]),
  modelBackedProfile("rotator_cuff_training", "sets_reps", ["50-exercises/42_ROTATOR_CUFF_TRAINING"]),
  modelBackedProfile("wrist_strengthening", "sets_reps", ["50-exercises/43_WRIST_STRENGTHENING"]),
  modelBackedProfile("soleus_raise", "sets_reps", ["50-exercises/44_SOLEUS_RAISE"]),

  // Force/Tirage — first unblocked sub-lot
  modelBackedProfile("countermovement_jump", "sets_reps", ["50-exercises/21_COUNTERMOVEMENT_JUMP"]),

  modelBackedProfile("copenhagen_plank", "sets_duration", ["50-exercises/19_COPENHAGEN_PLANK"]),

  // Force/Tirage — strength_accessory_straight_sets_v0_1 batch
  modelBackedProfile("hip_thrust", "sets_reps", ["50-exercises/05_HIP_THRUST"]),
  modelBackedProfile("chin_up", "sets_reps", ["50-exercises/11_CHIN_UP"]),
  modelBackedProfile("barbell_row", "sets_reps", ["50-exercises/12_BARBELL_ROW"]),

  // Registry Lot 1 — Strength immediate
  modelBackedProfile("chest_supported_row", "sets_reps", ["50-exercises/13_CHEST_SUPPORTED_ROW"]),
  modelBackedProfile("dip", "sets_reps", ["50-exercises/14_DIP"]),
  modelBackedProfile("landmine_press", "sets_reps", ["50-exercises/26_LANDMINE_PRESS"]),
  modelBackedProfile("weighted_pull_up", "sets_reps", ["50-exercises/09_WEIGHTED_PULL_UP"]),
  modelBackedProfile("neck_training", "sets_reps", ["50-exercises/34_NECK_TRAINING"]),
  modelBackedProfile("nordic_hamstring_curl", "sets_reps", ["50-exercises/18_NORDIC_HAMSTRING_CURL"]),

  // Registry Lot 2 — Power immediate (sled_push not integrated this lot; no
  // duration profile added for it)
  modelBackedProfile("hang_power_clean", "sets_reps", ["50-exercises/64_POWER/12_HANG_POWER_CLEAN.md"]),

  // Registry Lot 3 — Movement immediate
  modelBackedProfile("bear_crawl", "sets_duration", ["50-exercises/37_BEAR_CRAWL"]),
  modelBackedProfile("bridging", "sets_duration", ["50-exercises/39_BRIDGING"]),
  modelBackedProfile("footwork_drills", "sets_duration", ["50-exercises/29_FOOTWORK_DRILLS"]),
  modelBackedProfile("shadow_boxing", "sets_duration", ["50-exercises/28_SHADOW_BOXING"]),
  modelBackedProfile("technical_stand_up", "sets_duration", ["50-exercises/35_TECHNICAL_STAND_UP"]),
  modelBackedProfile("shrimping", "sets_duration", ["50-exercises/38_SHRIMPING"]),

  // Registry Lot 4 — Combat movement immediate
  modelBackedProfile("sprawl", "sets_duration", ["50-exercises/30_SPRAWL"]),
  modelBackedProfile("shot_entries", "sets_duration", ["50-exercises/36_SHOT_ENTRIES"]),

  // Registry Lot 5 — Conditioning intervals (first `intervals` structure).
  //
  // Still `"unresolved"`, for the same reason as every profile above: the
  // RowErg chapter documents per-interval work and recovery ranges (which
  // the numerical profile already encodes as prescription targets), but no
  // setup, transition or technical-margin seconds — the very fields a
  // duration ESTIMATE needs. Deriving a total session duration by
  // multiplying the prescribed intervals is not estimation from documented
  // timing data, and is not done here.
  modelBackedProfile("rowerg_intervals", "intervals", ["50-exercises/49_ROWERG_INTERVALS"]),

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
  modelBackedProfile("sprint_intervals", "intervals", ["50-exercises/47_SPRINT_INTERVALS"]),

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
  modelBackedProfile("ab_wheel", "sets_reps", ["50-exercises/62_CORE/10_AB_WHEEL.md"]),

  // Registry Lot 8 — second Core repetition entry.
  //
  // `"unresolved"`, like every profile above. The Dead Bug chapter comes
  // closer than most — "# Setup Time: Less Than 1 Minute", "# Loading
  // Profile — Tempo: 2-4 seconds of controlled limb extension. Pause: 1-2
  // seconds near end range" — but none of it is an estimate this field can
  // hold honestly: "less than 1 minute" is a bound, not a duration, and the
  // tempo figures describe one limb extension under a phase timing the
  // prescription does not select (the profile encodes `global_intent:
  // controlled`). Deriving seconds per repetition from them, then a total
  // from the repetition count, would be inventing timing data twice over.
  modelBackedProfile("dead_bug", "sets_reps", ["50-exercises/62_CORE/12_DEAD_BUG.md"]),

  // Registry Lot 9 — third Core repetition entry.
  //
  // `"unresolved"`, and this one is the closest any chapter has come to
  // resolvable timing data: "# Setup Time — Typical Setup Duration: 10-30
  // seconds" is a real, bounded setup figure, and the Velocity Profile
  // gives "Typical Concentric Duration: 1-2 seconds", "Typical Eccentric
  // Duration: 2-4 seconds", "Bottom Pause: 0-1 second", "Top Pause: 0-2
  // seconds".
  //
  // It stays unresolved all the same. Those velocity figures describe a
  // phase-timed execution the prescription does not select — the numerical
  // profile encodes `global_intent: controlled`, not a phase timing — so
  // summing them into an `averageRepetitionSeconds` would attribute a tempo
  // the athlete was never prescribed. Populating `averageSetupSeconds`
  // alone would leave a profile that is half-real and still unusable, since
  // `getDurationEstimationProfile` refuses anything but a fully resolved
  // one. The honest state is unresolved until a documented model exists.
  modelBackedProfile("hanging_leg_raise", "sets_reps", ["50-exercises/62_CORE/14_HANGING_LEG_RAISE.md"]),

  // Registry Lot 10 — first Grip isometric entry.
  //
  // `"unresolved"`, and the distinction matters here more than anywhere:
  // this chapter documents a HOLD DURATION ("15 to 30 second holds") and
  // that is a prescription target, resolved by `resolveVolume` from the
  // numerical profile. It is not an estimate of how long the exercise
  // takes. The fields below want setup time, transition time, a
  // per-set time and a technical margin — and the chapter gives none of
  // them: no setup duration, nothing for aligning the plates, nothing for
  // the change between hands. Copying the prescribed hold into
  // `perSetSeconds` would restate a prescription as an estimate.
  modelBackedProfile("plate_pinch", "sets_duration", ["50-exercises/65_GRIP/11_PLATE_PINCH.md"]),

  // Registry Lot 11 — first combat bag entry.
  //
  // `"unresolved"`. This fiche quantifies the WORK and the RECOVERY
  // ("Work: 10-30 seconds. Recovery: 30-90 seconds") and both are
  // prescription targets, resolved by `resolveVolume` and `resolveRest`
  // from the numerical profile — not estimates of how long the exercise
  // takes. Nothing in the chapter gives the fields below: no time to wrap
  // hands and put gloves on, no time to set up at the bag, no transition
  // time, no technical margin. Deriving a session duration by summing
  // work and recovery would understate it by exactly the preparation this
  // exercise demands most.
  modelBackedProfile("heavy_bag_power_intervals", "intervals", ["50-exercises/27_HEAVY_BAG_POWER_INTERVALS"]),

  // Registry Lot 12 — second battle-rope-family entry.
  //
  // `"unresolved"`. This fiche quantifies WORK and RECOVERY ("Work: 10-40
  // seconds. Recovery: 20-90 seconds") and both are prescription targets
  // resolved by `resolveVolume` and `resolveRest` from the numerical
  // profile — not estimates of how long the exercise takes. The fields
  // below want a setup duration, a transition duration, a per-set time and
  // a technical margin, and this chapter gives none of them: nothing for
  // securing the ropes to the anchor, nothing for laying them out, nothing
  // for the change between rope movements. Summing work and recovery would
  // restate a prescription as an estimate. "Frequency: 1-3 sessions/week"
  // and "Typical Recovery: 24 hours" are planning-layer figures, not
  // session timing.
  modelBackedProfile("battle_ropes", "intervals", ["50-exercises/46_BATTLE_ROPES.md"]),

  // Registry Lot 13 — air-bike intervals, the last conditioning modality.
  //
  // `"unresolved"`. This fiche quantifies WORK and RECOVERY ("Work: 10-60
  // seconds. Recovery: 20-180 seconds") and both are prescription targets
  // resolved by `resolveVolume` and `resolveRest` from the numerical
  // profile — not estimates of how long the exercise takes. The chapter
  // gives none of the fields below: no time to set the machine up, no
  // transition time, no per-set time, no technical margin. Summing work and
  // recovery would restate a prescription as an estimate, and would also
  // ignore the warm-up this fiche names as a documented risk.
  // "Frequency: 1-3 sessions/week" is a planning-layer figure, not session
  // timing.
  modelBackedProfile("assault_bike_intervals", "intervals", ["50-exercises/48_ASSAULT_BIKE_INTERVALS"]),

  // Registry Lot 14 — first Grip repetition entry.
  //
  // `"unresolved"`. This chapter quantifies sets, repetitions, rest and an
  // eccentric phase, and every one of them is a prescription target
  // resolved by `resolveVolume`, `resolveRest` or carried in the
  // instructions — none is an estimate of how long the exercise takes.
  // Nothing here gives the fields below: no time to drape and check the
  // towel, no transition time, no per-set time, no technical margin.
  // Multiplying repetitions by the eccentric duration would restate a
  // prescription as an estimate, and would ignore the setup this exercise
  // demands most: confirming the bar and the towel before every set.
  modelBackedProfile("towel_pull_up", "sets_reps", ["50-exercises/65_GRIP/10_TOWEL_PULL_UP.md"]),

  // Registry Lot 15 — the two rope entries.
  //
  // Both `"unresolved"`. Each chapter quantifies sets, its own unit and
  // rest, and every one of those is a prescription target resolved by
  // `resolveVolume` or `resolveRest` — none estimates how long the exercise
  // takes. Neither gives the fields below: no time to inspect and verify
  // the rope and its anchor, no transition time, no per-set time, no
  // technical margin. Rope Climb's documented height and Rope Pull's
  // documented distance and duration are prescription VARIABLES of those
  // exercises, not session timing, and deriving a duration from them would
  // convert one unrepresented unit into another.
  modelBackedProfile("rope_climb", "sets_reps", ["50-exercises/65_GRIP/13_ROPE_CLIMB.md"]),
  modelBackedProfile("rope_pull", "sets_reps", ["50-exercises/65_GRIP/14_ROPE_PULL.md"]),

  // Registry Lot 20 — the three partner grappling drills.
  //
  // All three `"unresolved"`, and for a reason specific to this family
  // rather than the usual one. Each chapter quantifies rounds and round
  // duration, and both are prescription targets resolved by `resolveVolume`;
  // inter-round rest is resolved by `resolveRest` from Table Group 18, which
  // states in writing that the band is an engineering decision no chapter
  // supports. None of that is an estimate of how long the exercise takes.
  //
  // What is missing here is also structural, not merely undocumented: a
  // partner drill's real elapsed time includes finding and pairing with a
  // partner, agreeing the constraint and the resistance level, and resetting
  // position between exchanges — and no chapter gives a figure for any of
  // them (checked directly). `perRoundSeconds` in particular must not be
  // back-filled from the prescribed round duration: that would restate a
  // prescription as an estimate, the error already refused for towel_pull_up
  // and the two rope entries.
  modelBackedProfile("pummeling", "rounds_duration", ["50-exercises/31_PUMMELING"]),
  modelBackedProfile("wall_wrestling", "rounds_duration", ["50-exercises/32_WALL_WRESTLING"]),
  modelBackedProfile("grip_fighting", "rounds_duration", ["50-exercises/33_GRIP_FIGHTING"]),

  // Registry Lot 21 — the first loaded locomotion entry.
  //
  // `"unresolved"`, and the temptation to resolve it is stronger here than
  // anywhere else in this file, which is exactly why it is refused. This
  // chapter quantifies efforts, metres AND seconds, so a per-interval time
  // looks available — but the 5-40 s it documents is the prescribed work
  // duration resolved by `resolveVolume`, not an estimate of elapsed session
  // time. Copying it into `perIntervalSeconds` would restate a prescription
  // as an estimate, the error already refused for towel_pull_up, the rope
  // entries and the three partner drills.
  //
  // What the chapter genuinely does not give: the time to load the sled and
  // verify the surface, the time to walk it back to the start between
  // efforts — which for a 40 m push is a real and unavoidable cost — and any
  // technical margin. None of them is documented, and none is invented.
  modelBackedProfile("sled_push", "intervals", ["50-exercises/17_SLED_PUSH"]),

  // Functional hypertrophy (Lot H2.2B). Every entry is `sets_reps`, so the
  // estimator's existing repetition branch covers them with no new number.
  modelBackedProfile("push_up", "sets_reps", ["50-exercises/68_HYPERTROPHY/10_PUSH_UP.md"]),
  modelBackedProfile("split_squat", "sets_reps", ["50-exercises/68_HYPERTROPHY/11_SPLIT_SQUAT.md"]),
  modelBackedProfile("single_leg_hip_thrust", "sets_reps", ["50-exercises/68_HYPERTROPHY/12_SINGLE_LEG_HIP_THRUST.md"]),
  modelBackedProfile("goblet_squat", "sets_reps", ["50-exercises/68_HYPERTROPHY/13_GOBLET_SQUAT.md"]),
  modelBackedProfile("dumbbell_bench_press", "sets_reps", ["50-exercises/68_HYPERTROPHY/14_DUMBBELL_BENCH_PRESS.md"]),
  modelBackedProfile("one_arm_dumbbell_row", "sets_reps", ["50-exercises/68_HYPERTROPHY/15_ONE_ARM_DUMBBELL_ROW.md"]),
  modelBackedProfile("dumbbell_romanian_deadlift", "sets_reps", ["50-exercises/68_HYPERTROPHY/16_DUMBBELL_ROMANIAN_DEADLIFT.md"]),
];

export const DURATION_ESTIMATION_PROFILES: Record<Identifier, DurationEstimationProfile> = Object.fromEntries(
  PILOT_PROFILES.map((profile) => [profile.profileId, profile]),
);

export type DurationEstimationProfileFailureCode = "DURATION_PROFILE_NOT_FOUND" | "DURATION_PROFILE_UNRESOLVED";

export type DurationEstimationProfileResult =
  | { ok: true; profile: DurationEstimationProfile }
  | { ok: false; failureCode: DurationEstimationProfileFailureCode; profile: DurationEstimationProfile | null };

/**
 * Returns the profile only when it exists AND is `"resolved"`, i.e. when the
 * duration model covers the exercise. An `"unresolved"` profile is never
 * returned as `ok: true`; the caller still receives the object for
 * reporting but must not treat the exercise as estimable.
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
