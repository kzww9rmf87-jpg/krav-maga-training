/**
 * Combat Athlete System — Engine Types
 * Version 0.1
 *
 * Canonical TypeScript structures shared by every CAS Engine component.
 *
 * This file contains no decision logic.
 * It only defines the contracts used by the deterministic engine.
 */

// `EngineSessionPrescriptionOutcome` is a type-only import: `prescribeEngineSession.ts`
// imports back from this file (also type-only), so this reference is a
// type-level cycle only — erased at compile time, no runtime dependency.
import type { EngineSessionPrescriptionOutcome } from "./prescription/prescribeEngineSession";

// -----------------------------------------------------------------------------
// Generic primitives
// -----------------------------------------------------------------------------

export type Identifier = string;

export type Sex = "female" | "male" | "other" | "not_specified";

export type AthleteLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "elite";

export type TechnicalLevel = 1 | 2 | 3 | 4 | 5;

export type Rating5 = 1 | 2 | 3 | 4 | 5;

export type Score100 = number;

export type ConfidenceLevel =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

export type SeverityLevel =
  | "none"
  | "minor"
  | "moderate"
  | "major"
  | "critical";

export type Laterality =
  | "bilateral"
  | "left"
  | "right"
  | "alternating"
  | "not_applicable";

export type BodyRegion =
  | "head"
  | "neck"
  | "cervical_spine"
  | "thoracic_spine"
  | "lumbar_spine"
  | "shoulder"
  | "upper_arm"
  | "elbow"
  | "forearm"
  | "wrist"
  | "hand"
  | "finger"
  | "ribcage"
  | "chest"
  | "abdomen"
  | "pelvis"
  | "hip"
  | "groin"
  | "thigh"
  | "knee"
  | "lower_leg"
  | "ankle"
  | "foot"
  | "whole_body"
  | "other";

// -----------------------------------------------------------------------------
// Combat sport context
// -----------------------------------------------------------------------------

export type CombatSport =
  | "boxing"
  | "kickboxing"
  | "muay_thai"
  | "mma"
  | "wrestling"
  | "judo"
  | "brazilian_jiu_jitsu"
  | "krav_maga"
  | "other";

export type CombatSessionType =
  | "technical"
  | "sparring"
  | "grappling"
  | "striking"
  | "bag_work"
  | "competition"
  | "grading"
  | "mixed"
  | "other";

export type SessionIntensity =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high"
  | "maximal";

// -----------------------------------------------------------------------------
// Adaptations and capabilities
// -----------------------------------------------------------------------------

export type AdaptationDomain =
  | "maximum_strength"
  | "power"
  | "functional_hypertrophy"
  | "conditioning"
  | "robustness"
  | "movement"
  | "recovery"
  | "specific_skill";

export type PhysicalQuality =
  | "absolute_strength"
  | "relative_strength"
  | "explosive_strength"
  | "reactive_strength"
  | "rate_of_force_development"
  | "speed"
  | "acceleration"
  | "deceleration"
  | "agility"
  | "aerobic_capacity"
  | "aerobic_power"
  | "anaerobic_capacity"
  | "repeat_effort_capacity"
  | "muscular_endurance"
  | "mobility"
  | "stability"
  | "coordination"
  | "balance"
  | "grip_strength"
  | "trunk_strength"
  | "tissue_capacity"
  | "general_work_capacity";

export type CapabilityModule =
  | "preparation"
  | "movement"
  | "power"
  | "strength"
  | "functional_hypertrophy"
  | "robustness"
  | "grip"
  | "core"
  | "conditioning"
  | "recovery";

// -----------------------------------------------------------------------------
// Movement and exercise classification
// -----------------------------------------------------------------------------

export type MovementPattern =
  | "squat"
  | "hinge"
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "carry"
  | "locomotion"
  | "rotation"
  | "anti_rotation"
  | "anti_extension"
  | "anti_flexion"
  | "anti_lateral_flexion"
  | "jump"
  | "throw"
  | "sprint"
  | "isometric"
  | "mixed";

export type ForceVector =
  | "vertical"
  | "horizontal"
  | "diagonal"
  | "rotational"
  | "lateral"
  | "forward"
  | "backward"
  | "upward"
  | "downward"
  | "mixed"
  | "not_applicable";

export type EquipmentType =
  | "bodyweight"
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "medicine_ball"
  | "sandbag"
  | "cable_machine"
  | "resistance_band"
  | "pull_up_bar"
  | "dip_bars"
  | "bench"
  | "rack"
  | "plates"
  | "sled"
  | "rope"
  | "towel"
  | "box"
  | "mat"
  | "heavy_bag"
  | "cardio_machine"
  // A rowing ergometer specifically, not the generic `cardio_machine`
  // above. Added because ROWERG_INTERVALS's own "# Equipment Requirements —
  // Required: Concept2 RowErg, or Equivalent Rowing Ergometer" names one
  // precise apparatus, and equipment matching in `exerciseRequirements.ts`
  // is exact: an air bike or a treadmill satisfies `cardio_machine` but not
  // this identifier, which is exactly the distinction that fiche documents.
  // `cardio_machine` deliberately stays in the vocabulary — every other
  // machine-based conditioning exercise (ASSAULT_BIKE_INTERVALS) still
  // uses it, and no equipment hierarchy or substitution rule is introduced
  // between the two.
  | "rowing_ergometer"
  | "open_space"
  | "wall"
  | "other"
  | "trap_bar"
  | "plyometric_box"
  | "pinch_grip_implement"
  | "slam_ball"
  | "rigid_anchor_support"
  | "knee_protection_pad"
  | "farmer_handle";

export type ExerciseComplexity =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

export type FatigueType =
  | "neural"
  | "muscular"
  | "metabolic"
  | "connective_tissue"
  | "technical"
  | "grip"
  | "impact"
  | "systemic";

export type EvidenceLevel =
  | "level_1"
  | "level_2"
  | "level_3"
  | "unknown";

// -----------------------------------------------------------------------------
// Athlete profile
// -----------------------------------------------------------------------------

export interface AthleteIdentity {
  athleteId: Identifier;
  displayName?: string;
  age: number;
  sex?: Sex;
  heightCm?: number;
  bodyMassKg?: number;
}

export interface AthleteExperience {
  generalTrainingLevel: AthleteLevel;
  strengthTrainingYears?: number;
  combatTrainingYears?: number;
  primaryCombatSport?: CombatSport;
  secondaryCombatSports?: CombatSport[];
  technicalLevelByPattern?: Partial<
    Record<MovementPattern, TechnicalLevel>
  >;
}

export interface AthleteGoal {
  id: Identifier;
  name: string;
  adaptationDomain: AdaptationDomain;
  physicalQualities?: PhysicalQuality[];
  priority: "primary" | "secondary" | "tertiary";
  targetDate?: string;
  notes?: string;
}

export interface AthletePreference {
  preferredExerciseIds?: Identifier[];
  dislikedExerciseIds?: Identifier[];
  excludedExerciseIds?: Identifier[];
  preferredEquipment?: EquipmentType[];
  coachingNotes?: string[];
}

export interface AthleteProfile {
  identity: AthleteIdentity;
  experience: AthleteExperience;
  goals: AthleteGoal[];
  preferences?: AthletePreference;
}

// -----------------------------------------------------------------------------
// Health, injuries and restrictions
// -----------------------------------------------------------------------------

export type RestrictionType =
  | "medical"
  | "injury"
  | "pain"
  | "mobility"
  | "technical"
  | "temporary"
  | "permanent";

export interface PainReport {
  region: BodyRegion;
  side?: Laterality;
  intensity: number;
  status: "acute" | "persistent" | "intermittent" | "resolved";
  aggravatedBy?: MovementPattern[];
  notes?: string;
}

export interface AthleteRestriction {
  id: Identifier;
  type: RestrictionType;
  region?: BodyRegion;
  side?: Laterality;
  description: string;
  prohibitedExerciseIds?: Identifier[];
  prohibitedPatterns?: MovementPattern[];
  prohibitedModules?: CapabilityModule[];
  maximumPainAllowed?: number;
  isHardConstraint: boolean;
  expiresAt?: string;
}

export interface MedicalState {
  trainingClearanceStatus: "cleared" | "not_cleared" | "unknown";
  painReports: PainReport[];
  restrictions: AthleteRestriction[];
  neurologicalSymptoms?: boolean;
  dizziness?: boolean;
  chestPain?: boolean;
  acuteIllness?: boolean;
  notes?: string[];
}

// -----------------------------------------------------------------------------
// Readiness
// -----------------------------------------------------------------------------

export interface ReadinessState {
  readinessScore?: Score100;
  energy: Rating5;
  motivation: Rating5;
  sleepQuality: Rating5;
  sleepHours?: number;
  stress: Rating5;
  soreness: Rating5;
  coordination?: Rating5;
  perceivedRecovery: Rating5;
  restingHeartRateBpm?: number;
  baselineRestingHeartRateBpm?: number;
  bodyMassKg?: number;
  notes?: string[];
}

// -----------------------------------------------------------------------------
// Training history
// -----------------------------------------------------------------------------

export interface CompletedExerciseSummary {
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

export interface CompletedSession {
  sessionId: Identifier;
  completedAt: string;
  sessionType: "cas" | "combat" | "other";
  combatSessionType?: CombatSessionType;
  intensity: SessionIntensity;
  durationMinutes: number;
  modules?: CapabilityModule[];
  exercises?: CompletedExerciseSummary[];
  lowerBodyLoad?: Rating5;
  upperBodyLoad?: Rating5;
  gripLoad?: Rating5;
  impactLoad?: Rating5;
  metabolicLoad?: Rating5;
  notes?: string[];
}

export interface TrainingHistory {
  recentSessions: CompletedSession[];
  lastSevenDaysTrainingMinutes?: number;
  lastSevenDaysCombatMinutes?: number;
  lastSevenDaysHighIntensitySessions?: number;
}

// -----------------------------------------------------------------------------
// Environment and equipment
// -----------------------------------------------------------------------------

export interface AvailableEquipment {
  type: EquipmentType;
  quantity?: number;
  maximumLoadKg?: number;
  details?: string;
}

export interface TrainingEnvironment {
  locationType: "gym" | "home" | "outdoor" | "combat_club" | "other";
  availableEquipment: AvailableEquipment[];
  availableSpace:
    | "very_limited"
    | "limited"
    | "moderate"
    | "large"
    | "open";
  ceilingHeightMeters?: number;
  throwingAllowed?: boolean;
  jumpingAllowed?: boolean;
  sprintingAllowed?: boolean;
  floorSafe?: boolean;
  // Exercise Requirements Model additions — reused as the sole source of
  // environmental context for "usable_wall"/"partner" atoms, per the locked
  // decision not to represent either as an `EquipmentType` member.
  usableWall?: boolean;
  partnerAvailable?: boolean;
  temperatureCelsius?: number;
  environmentNotes?: string[];
}

/**
 * `TrainingEnvironment["availableSpace"]`, named on its own so the Exercise
 * Requirements Model's `sufficient_space` atom and `isAvailableSpaceSufficient`
 * can reference it without duplicating the literal union.
 */
export type AvailableSpaceLevel = TrainingEnvironment["availableSpace"];

// -----------------------------------------------------------------------------
// Training request
// -----------------------------------------------------------------------------

export interface SessionObjective {
  adaptationDomain: AdaptationDomain;
  physicalQualities?: PhysicalQuality[];
  requestedModules?: CapabilityModule[];
  description?: string;
}

export interface TrainingRequest {
  requestId: Identifier;
  requestedAt: string;
  durationMinutes: number;
  primaryObjective: SessionObjective;
  secondaryObjectives?: SessionObjective[];
  excludedModules?: CapabilityModule[];
  requiredModules?: CapabilityModule[];
  sessionIntensityPreference?: SessionIntensity;
  competitionDate?: string;
  nextCombatSessionAt?: string;
  notes?: string[];
}

// -----------------------------------------------------------------------------
// Canonical engine input
// -----------------------------------------------------------------------------

export interface EngineInput {
  schemaVersion: "0.1";
  athleteProfile: AthleteProfile;
  medicalState: MedicalState;
  readiness: ReadinessState;
  trainingHistory: TrainingHistory;
  environment: TrainingEnvironment;
  request: TrainingRequest;
}

// -----------------------------------------------------------------------------
// Capability Module selection
// -----------------------------------------------------------------------------

export interface SelectedModule {
  module: CapabilityModule;
  role: "primary" | "secondary" | "support";
  primaryAdaptation: AdaptationDomain;
  reason: string;
}

export interface ModuleSelectionResult {
  selectedModules: SelectedModule[];
}

// -----------------------------------------------------------------------------
// Exercise knowledge-base model
// -----------------------------------------------------------------------------

export interface ExerciseContraindication {
  region?: BodyRegion;
  prohibitedPatterns?: MovementPattern[];
  description: string;
  absolute: boolean;
}

export interface ExerciseFatigueProfile {
  types: FatigueType[];
  neural: Rating5;
  muscular: Rating5;
  metabolic: Rating5;
  connectiveTissue: Rating5;
  technical: Rating5;
  recoveryHours?: number;
}

export type EnvironmentCapability =
  | "safe_landing_surface"
  | "usable_wall"
  | "throwing_allowed"
  | "jumping_allowed"
  | "sprinting_allowed"
  | "floor_safe"
  | "sufficient_space";

export type HumanAssistanceCapability = "partner";

export type ExerciseRequirementAtom =
  | {
      kind: "equipment";
      equipment: EquipmentType;
    }
  | {
      kind: "environment";
      capability: Exclude<EnvironmentCapability, "sufficient_space">;
    }
  | {
      kind: "environment";
      capability: "sufficient_space";
      minimumSpace: AvailableSpaceLevel;
    }
  | {
      kind: "human_assistance";
      assistance: HumanAssistanceCapability;
    };

export type ExerciseRequirementClause =
  | {
      kind: "all_of";
      items: readonly ExerciseRequirementAtom[];
    }
  | {
      kind: "any_of";
      items: readonly ExerciseRequirementAtom[];
    };

export interface ExerciseRequirements {
  required: readonly ExerciseRequirementClause[];
  optional?: readonly ExerciseRequirementClause[];
}

export interface ExerciseDefinition {
  id: Identifier;
  name: string;
  module: CapabilityModule;
  primaryAdaptation: AdaptationDomain;
  secondaryAdaptations?: AdaptationDomain[];
  physicalQualities: PhysicalQuality[];
  movementPatterns: MovementPattern[];
  forceVectors?: ForceVector[];
  requiredEquipment: EquipmentType[];
  optionalEquipment?: EquipmentType[];
  requirements?: ExerciseRequirements;
  minimumTechnicalLevel: TechnicalLevel;
  complexity: ExerciseComplexity;
  unilateral: boolean;
  bodyRegionsLoaded: BodyRegion[];
  contraindications: ExerciseContraindication[];
  fatigueProfile: ExerciseFatigueProfile;
  evidenceLevel: EvidenceLevel;
  combatSportRelevance?: Partial<Record<CombatSport, Rating5>>;
  setupTimeMinutes?: number;
  defaultExerciseDurationMinutes?: number;
  substitutionExerciseIds?: Identifier[];
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

export type ValidationErrorCode =
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_VALUE"
  | "INVALID_DURATION"
  | "INVALID_PAIN_SCORE"
  | "INVALID_READINESS_SCORE"
  | "NO_PRIMARY_GOAL"
  | "NO_AVAILABLE_EQUIPMENT"
  | "MEDICAL_CLEARANCE_REQUIRED"
  | "CRITICAL_HEALTH_SIGNAL"
  | "CONTRADICTORY_INPUT"
  | "UNSUPPORTED_SCHEMA_VERSION";

export interface ValidationIssue {
  code: ValidationErrorCode;
  path: string;
  message: string;
  severity: "warning" | "error" | "critical";
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// -----------------------------------------------------------------------------
// Eligibility and scoring
// -----------------------------------------------------------------------------

export type ExerciseRejectionReasonCode =
  | "MEDICAL_CONTRAINDICATION"
  | "ACTIVE_PAIN"
  | "EQUIPMENT_UNAVAILABLE"
  | "INSUFFICIENT_SPACE"
  | "UNSAFE_ENVIRONMENT"
  | "TECHNICAL_LEVEL_TOO_LOW"
  | "READINESS_TOO_LOW"
  | "MODULE_EXCLUDED"
  | "EXERCISE_EXCLUDED"
  | "RECOVERY_CONFLICT"
  | "COMBAT_LOAD_CONFLICT"
  | "DURATION_CONFLICT"
  | "OTHER";

export interface ExerciseRejectionReason {
  code: ExerciseRejectionReasonCode;
  message: string;
  hardConstraint: boolean;
}

export interface ExerciseEligibilityResult {
  exerciseId: Identifier;
  eligible: boolean;
  rejectionReasons: ExerciseRejectionReason[];
}

export interface ExerciseScoreBreakdown {
  objectiveRelevance: Score100;
  athleteCompatibility: Score100;
  transferValue: Score100;
  equipmentCompatibility: Score100;
  progressionValue: Score100;
  preferenceBonus: number;
  safety: Score100;
  fatigueCostPenalty: number;
  technicalRiskPenalty: number;
  redundancyPenalty: number;
  interferencePenalty: number;
  confidenceFactor: number;
}

export interface ScoredExercise {
  exercise: ExerciseDefinition;
  eligible: true;
  rawScore: number;
  finalScore: number;
  confidence: ConfidenceLevel;
  breakdown: ExerciseScoreBreakdown;
  reasons: string[];
}

// -----------------------------------------------------------------------------
// Final exercise selection (post-scoring, pre-prescription)
// -----------------------------------------------------------------------------

export interface SelectedExerciseCandidate {
  scoredExercise: ScoredExercise;
  selected: boolean;
  selectionReasons: string[];
}

export interface ExerciseSelectionResult {
  module: CapabilityModule;
  role: SelectedModule["role"];
  candidates: SelectedExerciseCandidate[];
}

// -----------------------------------------------------------------------------
// Substitution search
// -----------------------------------------------------------------------------

export type SubstitutionSearchResult =
  | {
      outcome: "found";
      candidate: SelectedExerciseCandidate;
    }
  | {
      outcome: "unavailable";
      reason: string;
    };

// -----------------------------------------------------------------------------
// Initial session draft (post-selection, pre-prescription)
// -----------------------------------------------------------------------------

export interface InitialGeneratedModule {
  order: number;
  selectedModule: SelectedModule;
  exerciseSelection: ExerciseSelectionResult;
  estimatedDurationMinutes?: number;
}

export interface InitialSessionDraft {
  sessionId: Identifier;
  generatedAt: string;
  engineVersion: "0.1";
  title: string;
  primaryObjective: SessionObjective;
  secondaryObjectives: SessionObjective[];
  modules: InitialGeneratedModule[];
  estimatedDurationMinutes?: number;
  confidence: ConfidenceLevel;
}

/**
 * Stable, typed identifier for each of `sessionGenerator.ts`'s two blocking
 * conditions. Added alongside the pre-existing free-text `reason` — never
 * derived from it by string-matching downstream — so a public consumer
 * (see `sessionOutput/`) can rely on a closed code instead of parsing
 * prose. Extending `sessionGenerator.ts` with a new blocking condition
 * must add its code here first; this type carries no default case.
 */
export type SessionBlockedReasonCode =
  | "NO_PRIMARY_MODULE_SELECTED"
  | "NO_PRIMARY_MODULE_EXERCISE_AVAILABLE";

export type InitialSessionGenerationResult =
  | {
      outcome: "draft";
      draft: InitialSessionDraft;
    }
  | {
      outcome: "blocked";
      reasonCode: SessionBlockedReasonCode;
      reason: string;
      blockedModules: CapabilityModule[];
    };

// -----------------------------------------------------------------------------
// Prescription
// -----------------------------------------------------------------------------

/**
 * Flat, pre-prescription-layer sketch of an exercise prescription (sets,
 * repetitions, load, RPE, rest, tempo as free-form fields). Nothing in the
 * engine currently constructs this type or `SelectedExercise` — both remain
 * placeholders for a future final-assembly stage (see `sessionGenerator.ts`
 * and `index.ts`, which document not producing `GeneratedSession`,
 * `SelectedExercise` or this type yet).
 *
 * This is deliberately NOT the canonical prescription model. The real,
 * deterministic, tested prescription output is
 * `ExercisePrescription` in `prescription/prescribeExercise.ts` — this type
 * was renamed from `ExercisePrescription` to `DeferredExercisePrescription`
 * to remove that name collision. Reconciling the two (or replacing this
 * sketch outright) is future work for the runEngine integration task.
 */
export interface DeferredExercisePrescription {
  sets?: number;
  repetitions?: number;
  repetitionsPerSide?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  loadKg?: number;
  loadDescription?: string;
  intensity?: SessionIntensity;
  targetRpe?: number;
  restSeconds?: number;
  tempo?: string;
  stopConditions?: string[];
  coachingCues?: string[];
}

export interface SelectedExercise {
  exerciseId: Identifier;
  exerciseName: string;
  module: CapabilityModule;
  order: number;
  score?: number;
  prescription: DeferredExercisePrescription;
  selectionReasons: string[];
  substitutionsConsidered?: Identifier[];
  estimatedDurationMinutes: number;
}

// -----------------------------------------------------------------------------
// Generated session
// -----------------------------------------------------------------------------

export interface GeneratedModule {
  module: CapabilityModule;
  order: number;
  objective: SessionObjective;
  exercises: SelectedExercise[];
  estimatedDurationMinutes: number;
}

export interface SessionLoadEstimate {
  neural: Rating5;
  muscular: Rating5;
  metabolic: Rating5;
  connectiveTissue: Rating5;
  technical: Rating5;
  grip: Rating5;
  impact: Rating5;
  overall: Rating5;
}

export interface GeneratedSession {
  sessionId: Identifier;
  generatedAt: string;
  engineVersion: "0.1";
  title: string;
  primaryObjective: SessionObjective;
  secondaryObjectives: SessionObjective[];
  modules: GeneratedModule[];
  estimatedDurationMinutes: number;
  estimatedLoad: SessionLoadEstimate;
  confidence: ConfidenceLevel;
  status: "valid" | "modified" | "rejected";
}

// -----------------------------------------------------------------------------
// Conflict management
// -----------------------------------------------------------------------------

export type ConflictType =
  | "medical"
  | "safety"
  | "recovery"
  | "volume"
  | "intensity"
  | "redundancy"
  | "interference"
  | "exercise_order"
  | "duration"
  | "equipment"
  | "environment"
  | "technical_level"
  | "combat_schedule"
  | "missing_data";

export interface DetectedConflict {
  id: Identifier;
  type: ConflictType;
  severity: SeverityLevel;
  probability: "low" | "moderate" | "high";
  description: string;
  affectedExerciseIds?: Identifier[];
  affectedModules?: CapabilityModule[];
  resolutionRequired: boolean;
}

export interface ConflictResolution {
  conflictId: Identifier;
  action:
    | "none"
    | "monitor"
    | "reorder"
    | "reduce_volume"
    | "reduce_intensity"
    | "substitute_exercise"
    | "remove_exercise"
    | "remove_module"
    | "change_objective"
    | "reject_session";
  description: string;
  removedExerciseIds?: Identifier[];
  addedExerciseIds?: Identifier[];
}

// -----------------------------------------------------------------------------
// Decision trace
// -----------------------------------------------------------------------------

export type DecisionStage =
  | "input_validation"
  | "athlete_state_evaluation"
  | "constraint_extraction"
  | "objective_interpretation"
  | "adaptation_prioritization"
  | "module_selection"
  | "exercise_retrieval"
  | "eligibility_filtering"
  | "exercise_scoring"
  | "session_assembly"
  | "prescription_generation"
  | "conflict_detection"
  | "conflict_resolution"
  | "duration_validation"
  | "fatigue_validation"
  | "final_validation";

export interface DecisionTraceEntry {
  id: Identifier;
  timestamp: string;
  stage: DecisionStage;
  decision: string;
  reasons: string[];
  inputReferences?: string[];
  affectedExerciseIds?: Identifier[];
  affectedModules?: CapabilityModule[];
  confidence?: ConfidenceLevel;
  /**
   * Source rule identifiers backing this entry's decision (e.g. a
   * prescription resolver's `sourceRuleIds`). Optional and additive: no
   * existing `DecisionTraceEntry` producer sets it today.
   */
  sourceRuleIds?: readonly Identifier[];
}

export interface DecisionTrace {
  traceId: Identifier;
  engineVersion: "0.1";
  entries: DecisionTraceEntry[];
  rejectedExercises: Array<{
    exerciseId: Identifier;
    reasons: ExerciseRejectionReason[];
  }>;
  detectedConflicts: DetectedConflict[];
  conflictResolutions: ConflictResolution[];
  warnings: string[];
}

// -----------------------------------------------------------------------------
// Engine run result (V0.1 orchestrator — honest intermediate outcome, not EngineOutput)
// -----------------------------------------------------------------------------

export type EngineRunResult =
  | {
      outcome: "invalid_input";
      validation: ValidationResult;
      decisionTrace: DecisionTrace;
    }
  | {
      outcome: "blocked";
      validation: ValidationResult;
      selectedModules: SelectedModule[];
      eligibilityResults: ExerciseEligibilityResult[];
      scoredExercises: ScoredExercise[];
      sessionResult: Extract<InitialSessionGenerationResult, { outcome: "blocked" }>;
      decisionTrace: DecisionTrace;
    }
  | {
      outcome: "draft";
      validation: ValidationResult;
      selectedModules: SelectedModule[];
      eligibilityResults: ExerciseEligibilityResult[];
      scoredExercises: ScoredExercise[];
      sessionDraft: InitialSessionDraft;
      conflicts: DetectedConflict[];
      conflictResolutions: ConflictResolution[];
      decisionTrace: DecisionTrace;
      /**
       * Whether the final (post-substitution, post-reconstruction)
       * `sessionDraft` could also be prescribed — see
       * `prescription/prescribeEngineSession.ts`. Present only when
       * `runEngine` was called with a `prescriptionSources` argument
       * (opting into prescription); a historical two-argument call never
       * gains this field, keeping `decisionTrace.entries` and every other
       * property byte-for-byte identical to before prescription existed.
       * `sessionDraft` itself never depends on this field's status — an
       * `"unavailable"` or `"failed"` prescription never removes or alters
       * the pre-prescription draft above.
       */
      prescription?: EngineSessionPrescriptionOutcome;
    };

// -----------------------------------------------------------------------------
// Canonical engine output
// -----------------------------------------------------------------------------

export interface EngineSuccessOutput {
  success: true;
  session: GeneratedSession;
  decisionTrace: DecisionTrace;
  validation: ValidationResult;
}

export interface EngineFailureOutput {
  success: false;
  session?: GeneratedSession;
  decisionTrace: DecisionTrace;
  validation: ValidationResult;
  failureReason: string;
}

export type EngineOutput = EngineSuccessOutput | EngineFailureOutput;
