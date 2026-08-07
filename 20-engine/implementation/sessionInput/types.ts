/**
 * Combat Athlete System — Public Session Input Contract
 * Version 1 ("cas-session-input.v1")
 *
 * The other half of the boundary `cas-session-output.v1` already defines.
 * Together they state, in types, what the platform and the engine each own:
 *
 *   CasSessionInputV1  →  adapt  →  EngineInput  →  runEngine
 *                                                       ↓
 *                                              CasSessionOutputV1
 *
 * A caller constructs a `CasSessionInputV1` and reads a `CasSessionOutputV1`.
 * It never imports `EngineInput` or any type reachable only from it.
 *
 * These are DTOs, not re-exports — every shape is re-declared here under a
 * `Cas*V1` name instead of aliasing its internal counterpart, so an internal
 * engine refactor can never silently change what callers must send. Closed
 * vocabularies (string-literal unions with no object shape) are the one
 * exception and are imported, exactly as the output contract does and for
 * the same reason: they carry no computation to protect, and pinning them
 * would force a version bump every time the exercise library documents a new
 * body region or movement pattern.
 *
 * WHAT THIS CONTRACT DELIBERATELY DOES NOT CONTAIN, and why each absence is
 * a decision rather than an omission. Every item below is something the
 * engine derives for itself, and accepting it here would hand a
 * training-domain decision back to the platform:
 *
 * - EQUIPMENT CAPABILITIES (`EquipmentCapabilityId`). The caller declares
 *   the equipment it has (`CasAvailableEquipmentV1.type`); CAS translates
 *   that into prescription capabilities, including the equivalence groups
 *   and the deliberately disjoint pairs (a climbing rope is not a battle
 *   rope, a wall rated for a thrown ball is not a wall to wrestle against).
 * - RANGE CONTEXT (`reduced`/`normal`/`high`). The caller reports readiness;
 *   CAS decides whether that readiness lowers the dose, and by the
 *   documented rule rather than the platform's judgement.
 * - PRESCRIPTION SOURCES, registry entries, numerical profiles, training
 *   method ids, load-rounding policy. All of it is registry-internal, and
 *   `runEngine` resolves it from the input alone.
 * - SCORING, conflict, substitution or selection internals. The caller
 *   states intent and constraints; which exercise satisfies them is the
 *   engine's answer, not its question.
 *
 * The one place this contract carries a measurement rather than a
 * preference is `CasPerformanceReferenceV1` — a tested one-rep max is an
 * athlete FACT the platform records, and CAS cannot invent it. Note it is
 * re-declared here rather than imported from the prescription layer: a
 * caller must be able to send a measured max without importing prescription
 * types.
 *
 * CONTRACT EVOLUTION POLICY, stated in the same terms as
 * `cas-session-output.v1` so the two halves cannot drift apart:
 *
 * - SHAPES are re-declared under `Cas*V1` names, which freezes them.
 *   Each of the following is a BREAKING change that requires `cas-session-input.v2`:
 *     - removing a field;
 *     - retyping a field;
 *     - making an existing optional field required;
 *     - adding a REQUIRED field.
 *   Adding a NEW OPTIONAL field is the one additive shape change and stays
 *   within v1.
 *   Adding a required field is breaking even though a lenient JSON reader
 *   would accept it, because `Cas*V1` is an exported TypeScript type and a
 *   caller that constructs one stops compiling. On the input side the
 *   consequence is sharper than on the output side: a caller that cannot
 *   compile cannot call CAS at all.
 * - CLOSED VOCABULARIES are imported, not re-declared, so they track the
 *   engine. Adding a member is ADDITIVE and stays within v1; removing or
 *   renaming one is breaking and requires v2.
 *
 * The consequence for callers, stated plainly: a `Cas*V1` object always has
 * the fields this file declares, but a vocabulary-typed field may accept a
 * member that did not exist when the caller was written. Callers should
 * therefore treat vocabularies as open-ended when reading them back from
 * the output, and send only members they know when writing.
 *
 * v1 additive history:
 * - 2026-08-04 — initial contract.
 */

import type {
  AdaptationDomain,
  AthleteLevel,
  BodyRegion,
  CapabilityModule,
  CombatSessionType,
  CombatSport,
  EquipmentType,
  Identifier,
  Laterality,
  MovementPattern,
  PhysicalQuality,
  Rating5,
  RestrictionType,
  Sex,
  SessionIntensity,
  TechnicalLevel,
} from "../types";
import type { IntensityReferenceType } from "../prescription/types";
import type {
  CapabilityObservationProvenance,
  CapabilityObservationSide,
  CapabilityObservationType,
} from "../athleteCapability";

// -----------------------------------------------------------------------------
// Athlete — identity, experience, goals, preferences
// -----------------------------------------------------------------------------

export interface CasAthleteIdentityV1 {
  athleteId: Identifier;
  displayName?: string;
  age: number;
  sex?: Sex;
  heightCm?: number;
  bodyMassKg?: number;
}

export interface CasAthleteExperienceV1 {
  generalTrainingLevel: AthleteLevel;
  strengthTrainingYears?: number;
  combatTrainingYears?: number;
  primaryCombatSport?: CombatSport;
  secondaryCombatSports?: readonly CombatSport[];
  /**
   * The athlete's demonstrated technical level per movement pattern. Used as
   * a SAFETY gate: an exercise whose minimum exceeds the documented level is
   * ruled out. An undocumented pattern is permissive — CAS never treats
   * missing data as incompetence.
   */
  technicalLevelByPattern?: Partial<Record<MovementPattern, TechnicalLevel>>;
}

export interface CasAthleteGoalV1 {
  id: Identifier;
  name: string;
  adaptationDomain: AdaptationDomain;
  physicalQualities?: readonly PhysicalQuality[];
  priority: "primary" | "secondary" | "tertiary";
  targetDate?: string;
  notes?: string;
}

export interface CasAthletePreferenceV1 {
  preferredExerciseIds?: readonly Identifier[];
  dislikedExerciseIds?: readonly Identifier[];
  /** A hard exclusion the athlete asked for — never overridden by scoring. */
  excludedExerciseIds?: readonly Identifier[];
  preferredEquipment?: readonly EquipmentType[];
  coachingNotes?: readonly string[];
}

/**
 * A measured performance reference — a tested one-rep max, a training max, a
 * baseline velocity.
 *
 * Re-declared here rather than imported from `prescription/types.ts` so a
 * caller can send a measured max without importing prescription internals.
 * The reference TYPE comes from the engine's closed vocabulary, so a
 * measurement cannot arrive as a free-form label.
 *
 * `validUntil` is honoured: a reference that expired before
 * `request.requestedAt` is not used, and the exercise that needed it is
 * reported as unprescribed rather than dosed from a stale maximum. CAS never
 * estimates one of these from training history.
 */
/**
 * One piece of evidence about what the athlete can currently DO.
 *
 * Added by Lot H2.5A. Additive and optional under the policy above: a request
 * that omits `capabilityObservations` behaves exactly as before.
 *
 * DISTINCT FROM `CasPerformanceReferenceV1`, deliberately. A performance
 * reference is a LOAD (a tested one-rep max, a training max) and feeds intensity
 * resolution. A capability observation is a REPETITION CAPACITY for one named
 * exercise, and must never reach a load calculation. Keeping them apart is what
 * stops "20 push-ups" from ever becoming a number of kilograms.
 *
 * BINDING IS BY EXACT CANONICAL EXERCISE. A `push_up` observation is evidence
 * about push-ups — not about bench pressing, not a horizontal-push score. CAS
 * performs no transfer between exercises, because no chapter documents one.
 *
 * VITA collects these. CAS interprets them. VITA must never decide what a
 * number means.
 */
export interface CasAthleteCapabilityObservationV1 {
  /** Canonical CAS exercise id. */
  exerciseId: Identifier;
  observationType: CapabilityObservationType;
  /** Whole repetitions performed. */
  repetitions: number;
  /** External load for `repetitions_at_load`; `null` for bodyweight work. */
  loadValue: number | null;
  /** Unit of `loadValue` — required whenever a load is given. */
  loadUnit: string | null;
  /** Repetitions in reserve at the end of the set, when actually observed. */
  repetitionsInReserve: number | null;
  side: CapabilityObservationSide;
  provenance: CapabilityObservationProvenance;
  /** ISO-8601 instant, or `null` when the platform recorded none. */
  observedAt: string | null;
}

export interface CasPerformanceReferenceV1 {
  referenceType: IntensityReferenceType;
  value: number | string;
  unit: string;
  sourceId: Identifier;
  measuredAt: string | null;
  validUntil: string | null;
  confidence: "validated" | "estimated" | "provisional";
}

export interface CasAthleteProfileV1 {
  identity: CasAthleteIdentityV1;
  experience: CasAthleteExperienceV1;
  goals: readonly CasAthleteGoalV1[];
  preferences?: CasAthletePreferenceV1;
  performanceReferences?: readonly CasPerformanceReferenceV1[];
  /**
   * What the athlete can currently do, per exercise. Optional: Lot H2.5A added
   * it, and every request written before it stays valid.
   */
  capabilityObservations?: readonly CasAthleteCapabilityObservationV1[];
}

// -----------------------------------------------------------------------------
// Medical state
// -----------------------------------------------------------------------------

export interface CasPainReportV1 {
  region: BodyRegion;
  side?: Laterality;
  /** 0–10. Out-of-range values are rejected by validation, never clamped. */
  intensity: number;
  status: "acute" | "persistent" | "intermittent" | "resolved";
  aggravatedBy?: readonly MovementPattern[];
  notes?: string;
}

export interface CasAthleteRestrictionV1 {
  id: Identifier;
  type: RestrictionType;
  region?: BodyRegion;
  side?: Laterality;
  description: string;
  prohibitedExerciseIds?: readonly Identifier[];
  prohibitedPatterns?: readonly MovementPattern[];
  prohibitedModules?: readonly CapabilityModule[];
  maximumPainAllowed?: number;
  /** `true` makes this an absolute exclusion; `false` only informs scoring. */
  isHardConstraint: boolean;
  expiresAt?: string;
}

export interface CasMedicalStateV1 {
  trainingClearanceStatus: "cleared" | "not_cleared" | "unknown";
  painReports: readonly CasPainReportV1[];
  restrictions: readonly CasAthleteRestrictionV1[];
  neurologicalSymptoms?: boolean;
  dizziness?: boolean;
  chestPain?: boolean;
  acuteIllness?: boolean;
  notes?: readonly string[];
}

// -----------------------------------------------------------------------------
// Readiness
// -----------------------------------------------------------------------------

/**
 * Self-reported readiness on the 1–5 scale.
 *
 * The caller reports; CAS interprets. Which of these fields affect the dose,
 * how `soreness` and `stress` are inverted, and where the band boundaries
 * fall are all engine decisions — see `deriveRangeContext`. A caller that
 * pre-computed a "reduced session" would be taking that decision itself.
 */
export interface CasReadinessStateV1 {
  /** Optional 0–100 summary. Recorded, but not used to select the dose in v1. */
  readinessScore?: number;
  energy: Rating5;
  motivation: Rating5;
  sleepQuality: Rating5;
  sleepHours?: number;
  /** Higher is worse. CAS inverts it before aggregating. */
  stress: Rating5;
  /** Higher is worse. CAS inverts it before aggregating. */
  soreness: Rating5;
  coordination?: Rating5;
  perceivedRecovery: Rating5;
  restingHeartRateBpm?: number;
  baselineRestingHeartRateBpm?: number;
  bodyMassKg?: number;
  notes?: readonly string[];
}

// -----------------------------------------------------------------------------
// Training history
// -----------------------------------------------------------------------------

export interface CasCompletedExerciseSummaryV1 {
  exerciseId: Identifier;
  setsCompleted?: number;
  repetitionsCompleted?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  loadKg?: number;
  perceivedExertion?: number;
  painDuringExercise?: number;
  technicalQuality?: Rating5;
}

export interface CasCompletedSessionV1 {
  sessionId: Identifier;
  completedAt: string;
  sessionType: "cas" | "combat" | "other";
  combatSessionType?: CombatSessionType;
  intensity: SessionIntensity;
  durationMinutes: number;
  modules?: readonly CapabilityModule[];
  exercises?: readonly CasCompletedExerciseSummaryV1[];
  lowerBodyLoad?: Rating5;
  upperBodyLoad?: Rating5;
  gripLoad?: Rating5;
  impactLoad?: Rating5;
  metabolicLoad?: Rating5;
  notes?: readonly string[];
}

export interface CasTrainingHistoryV1 {
  recentSessions: readonly CasCompletedSessionV1[];
  lastSevenDaysTrainingMinutes?: number;
  lastSevenDaysCombatMinutes?: number;
  lastSevenDaysHighIntensitySessions?: number;
}

// -----------------------------------------------------------------------------
// Environment
// -----------------------------------------------------------------------------

export interface CasAvailableEquipmentV1 {
  /**
   * What the athlete HAS, in the engine's equipment vocabulary — never a
   * prescription capability. CAS derives capabilities from this list.
   */
  type: EquipmentType;
  quantity?: number;
  maximumLoadKg?: number;
  details?: string;
}

export interface CasTrainingEnvironmentV1 {
  locationType: "gym" | "home" | "outdoor" | "combat_club" | "other";
  availableEquipment: readonly CasAvailableEquipmentV1[];
  availableSpace: "very_limited" | "limited" | "moderate" | "large" | "open";
  ceilingHeightMeters?: number;
  throwingAllowed?: boolean;
  jumpingAllowed?: boolean;
  sprintingAllowed?: boolean;
  /**
   * Safety-critical. Absent is never read as permission: an undeclared floor
   * blocks floor-sensitive work exactly as a declared-unsafe one does.
   */
  floorSafe?: boolean;
  usableWall?: boolean;
  partnerAvailable?: boolean;
  temperatureCelsius?: number;
  environmentNotes?: readonly string[];
}

// -----------------------------------------------------------------------------
// Request — user intent and metadata
// -----------------------------------------------------------------------------

export interface CasSessionObjectiveV1 {
  adaptationDomain: AdaptationDomain;
  physicalQualities?: readonly PhysicalQuality[];
  /** Modules the athlete explicitly asked for, on top of the objective's own. */
  requestedModules?: readonly CapabilityModule[];
  description?: string;
}

export interface CasTrainingRequestV1 {
  requestId: Identifier;
  /** Drives every timestamp in the result. CAS never reads the system clock. */
  requestedAt: string;
  durationMinutes: number;
  primaryObjective: CasSessionObjectiveV1;
  secondaryObjectives?: readonly CasSessionObjectiveV1[];
  excludedModules?: readonly CapabilityModule[];
  requiredModules?: readonly CapabilityModule[];
  sessionIntensityPreference?: SessionIntensity;
  competitionDate?: string;
  nextCombatSessionAt?: string;
  notes?: readonly string[];
}

// -----------------------------------------------------------------------------
// Envelope
// -----------------------------------------------------------------------------

/**
 * Everything CAS needs to produce a session, and nothing it can decide for
 * itself.
 *
 * `contractVersion` is the input contract's own version and is deliberately
 * NOT the engine version: the engine may move from 0.1 to 0.2 without the
 * shape a caller sends changing at all.
 */
export interface CasSessionInputV1 {
  contractVersion: "cas-session-input.v1";
  athleteProfile: CasAthleteProfileV1;
  medicalState: CasMedicalStateV1;
  readiness: CasReadinessStateV1;
  trainingHistory: CasTrainingHistoryV1;
  environment: CasTrainingEnvironmentV1;
  request: CasTrainingRequestV1;
}
