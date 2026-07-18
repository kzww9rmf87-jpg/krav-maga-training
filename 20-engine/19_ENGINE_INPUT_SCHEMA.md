# ENGINE INPUT SCHEMA

Version 0.1

---

# Purpose

The Engine Input Schema defines the structured data accepted by the Combat Athlete System Engine.

Its purpose is to ensure that every training session is generated from explicit, validated and traceable information.

The schema defines the input contract between:

* the CAS application;
* the athlete profile;
* the training planner;
* the Session Generation Pipeline;
* the Scoring Model;
* the Conflict Rules;
* the Validation Rules;
* the Decision Trace.

The engine must never depend on hidden, undefined or silently assumed input data.

---

# Core Principle

> Every decision made by the CAS Engine must originate from structured, validated and traceable input data.

Input values may be:

* provided by the athlete;
* provided by a coach;
* calculated from training history;
* imported from another service;
* inferred by an authorized engine rule;
* replaced by an explicit safe default.

The source of every decision-relevant value must remain identifiable.

An inferred or default value must never be presented as directly observed athlete data.

---

# Scope

The Engine Input Schema defines:

* the root input object;
* stable athlete-profile data;
* current athlete-state data;
* the Training Request;
* Training Cycle context;
* combat-practice context;
* competition context;
* equipment and environment;
* medical and pain constraints;
* recent training history;
* coach instructions;
* data provenance;
* confidence and data quality;
* validation requirements;
* safe-default rules.

The schema does not define:

* the generated session;
* the final prescription;
* scoring results;
* conflict resolutions;
* validation results;
* Decision Trace output.

Those structures are defined in:

* `20_ENGINE_OUTPUT_SCHEMA.md`;
* `21_DECISION_TRACE.md`;
* `22_VALIDATION_RULES.md`.

---

# Root Input Object

The root input object is named:

```typescript
EngineInput
```

Its canonical Version 0.1 structure is:

```typescript
interface EngineInput {
  schemaVersion: "0.1";
  requestId: string;
  generatedAt: ISODateTime;
  locale?: LocaleCode;
  timezone: IANATimeZone;

  athleteProfile: AthleteProfile;
  athleteState: AthleteState;
  trainingRequest: TrainingRequest;

  trainingCycle?: TrainingCycleContext;
  recentTraining?: RecentTrainingContext;
  combatContext?: CombatContext;
  competitionContext?: CompetitionContext;

  equipmentContext: EquipmentContext;
  environmentContext: EnvironmentContext;
  supervisionContext: SupervisionContext;

  medicalContext: MedicalContext;
  painContext: PainContext;

  coachInstructions?: CoachInstructions;
  athletePreferences?: AthletePreferences;

  dataProvenance: DataProvenanceRecord[];
  engineOptions?: EngineOptions;
}
```

---

# Root-Level Requirements

The following root fields are required:

```text
schemaVersion
requestId
generatedAt
timezone
athleteProfile
athleteState
trainingRequest
equipmentContext
environmentContext
supervisionContext
medicalContext
painContext
dataProvenance
```

The following fields are optional:

```text
locale
trainingCycle
recentTraining
combatContext
competitionContext
coachInstructions
athletePreferences
engineOptions
```

An optional object that is absent must be treated as unknown.

It must not automatically be treated as empty, normal or favourable.

---

# Primitive Types

```typescript
type ISODate = string;
type ISODateTime = string;
type IANATimeZone = string;
type LocaleCode = string;
type Identifier = string;
type Percentage = number;
type Minutes = number;
type Hours = number;
type Kilograms = number;
type Centimeters = number;
type Count = number;
```

Dates and times must use ISO 8601-compatible representations.

Examples:

```text
2026-07-15
2026-07-15T08:30:00+02:00
```

The engine must not rely on ambiguous date formats such as:

```text
07/08/26
```

---

# Enumerations

## Data Source

```typescript
type DataSource =
  | "ATHLETE_SELF_REPORT"
  | "COACH_INPUT"
  | "MEDICAL_INPUT"
  | "TRAINING_HISTORY"
  | "DIRECT_MEASUREMENT"
  | "WEARABLE"
  | "IMPORTED_SERVICE"
  | "ENGINE_INFERENCE"
  | "SAFE_DEFAULT";
```

---

## Data Quality

```typescript
type DataQuality =
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "UNKNOWN";
```

---

## Confidence Level

```typescript
type ConfidenceLevel =
  | "VERY_HIGH"
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "VERY_LOW";
```

---

## Constraint Severity

```typescript
type ConstraintSeverity =
  | "HARD"
  | "SOFT"
  | "INFORMATIONAL";
```

---

## Readiness Level

```typescript
type ReadinessLevel =
  | "EXCELLENT"
  | "GOOD"
  | "MODERATE"
  | "LOW"
  | "VERY_LOW"
  | "UNKNOWN";
```

---

## Pain Severity

```typescript
type PainSeverity =
  | "NONE"
  | "MINIMAL"
  | "MILD"
  | "MODERATE"
  | "SIGNIFICANT"
  | "SEVERE"
  | "UNKNOWN";
```

---

## Symptom Behaviour

```typescript
type SymptomBehaviour =
  | "STABLE"
  | "IMPROVING"
  | "WORSENING"
  | "INTERMITTENT"
  | "UNKNOWN";
```

---

## Training Role

```typescript
type TrainingRole =
  | "PRIMARY"
  | "SECONDARY"
  | "MAINTENANCE"
  | "SUPPORT"
  | "EXCLUDED";
```

---

## Adaptation Domain

```typescript
type AdaptationDomain =
  | "MAXIMUM_STRENGTH"
  | "POWER"
  | "FUNCTIONAL_HYPERTROPHY"
  | "CONDITIONING"
  | "ROBUSTNESS"
  | "MOVEMENT"
  | "RECOVERY";
```

Specific Skill is not a physical Adaptation Domain in Engine Version 0.1.

Combat practice is represented through `CombatContext`.

---

## Capability Module

```typescript
type CapabilityModuleId =
  | "PREPARATION"
  | "MOVEMENT"
  | "POWER"
  | "STRENGTH"
  | "FUNCTIONAL_HYPERTROPHY"
  | "ROBUSTNESS"
  | "GRIP"
  | "CORE"
  | "CONDITIONING"
  | "RECOVERY";
```

Only canonical modules may be referenced.

Ad hoc values such as:

```text
BALLISTIC_ROTATIONAL_POWER
TRUNK_STIFFNESS
STRIKING_STRENGTH
```

are not valid Capability Module identifiers.

They may be represented as:

* supported capabilities;
* exercise tags;
* objective descriptors;
* prescription intents.

---

# Athlete Profile

`AthleteProfile` contains relatively stable athlete information.

```typescript
interface AthleteProfile {
  athleteId: Identifier;
  profileVersion: string;

  dateOfBirth?: ISODate;
  ageYears?: number;

  biologicalSex?: "MALE" | "FEMALE" | "NOT_SPECIFIED";
  heightCm?: Centimeters;
  bodyMassKg?: Kilograms;

  primarySport: CombatSport;
  additionalSports?: CombatSport[];

  combatLevel: ExperienceLevel;
  physicalTrainingLevel: ExperienceLevel;

  trainingAgeYears?: number;
  combatTrainingAgeYears?: number;

  dominantSide?: "LEFT" | "RIGHT" | "MIXED" | "UNKNOWN";

  longTermGoals?: AthleteGoal[];
  supportedCapabilities?: string[];

  weeklyAvailability?: WeeklyAvailability;
  normalCombatSchedule?: PlannedCombatSession[];

  exerciseHistorySummary?: ExerciseHistorySummary;
}
```

---

## Experience Level

```typescript
type ExperienceLevel =
  | "BEGINNER"
  | "NOVICE"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT"
  | "UNKNOWN";
```

Combat level and physical-training level must remain separate.

Expertise in combat sport must not imply advanced competence in:

* strength training;
* sprinting;
* plyometrics;
* ballistic lifting;
* exercise technique.

---

## Combat Sport

```typescript
type CombatSport =
  | "KRAV_MAGA"
  | "BOXING"
  | "KICKBOXING"
  | "MUAY_THAI"
  | "MMA"
  | "BRAZILIAN_JIU_JITSU"
  | "GRAPPLING"
  | "JUDO"
  | "WRESTLING"
  | "KARATE"
  | "TAEKWONDO"
  | "OTHER";
```

When `OTHER` is used, a description is required.

```typescript
interface OtherCombatSport {
  value: "OTHER";
  description: string;
}
```

---

## Athlete Goal

```typescript
interface AthleteGoal {
  goalId: Identifier;
  description: string;

  targetOutcome?: string;
  targetAdaptation?: AdaptationDomain;

  priority:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM"
    | "LOW";

  targetDate?: ISODate;
  measurableTarget?: MeasurableTarget;

  status:
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED"
    | "ABANDONED";
}
```

---

## Measurable Target

```typescript
interface MeasurableTarget {
  metric: string;
  currentValue?: number;
  targetValue: number;
  unit: string;
}
```

Examples:

```yaml
metric: bench_press_1rm
currentValue: 110
targetValue: 140
unit: kg
```

```yaml
metric: repeated_heavy_bag_power_output
targetValue: 10
unit: high_quality_strikes
```

---

# Athlete State

`AthleteState` contains temporary information relevant to the current generation request.

```typescript
interface AthleteState {
  assessedAt: ISODateTime;

  generalReadiness: ReadinessValue;
  neuralReadiness?: ReadinessValue;
  muscularReadiness?: ReadinessValue;
  connectiveTissueReadiness?: ReadinessValue;
  metabolicReadiness?: ReadinessValue;

  regionalReadiness?: RegionalReadiness[];

  sleep?: SleepState;
  energy?: SubjectiveState;
  motivation?: SubjectiveState;
  psychologicalStress?: SubjectiveState;

  soreness?: SorenessReport[];
  illness?: IllnessState;

  restingHeartRate?: MeasuredMetric;
  heartRateVariability?: MeasuredMetric;

  previousSessionResponse?: PreviousSessionResponse;

  stateNotes?: string[];
}
```

---

## Readiness Value

```typescript
interface ReadinessValue {
  level: ReadinessLevel;
  score?: number;
  confidence: ConfidenceLevel;
  source: DataSource;
}
```

When used, readiness scores must use:

```text
0 to 100
```

The score and categorical level must remain consistent.

Suggested mapping:

|  Score | Level     |
| -----: | --------- |
| 85–100 | EXCELLENT |
|  70–84 | GOOD      |
|  50–69 | MODERATE  |
|  30–49 | LOW       |
|   0–29 | VERY_LOW  |

The categorical value remains authoritative when no numerical score exists.

---

## Regional Readiness

```typescript
interface RegionalReadiness {
  region: BodyRegion;
  readiness: ReadinessValue;
  limitingFactors?: string[];
}
```

The engine must not apply a local readiness issue identically to every exercise.

Example:

* low shoulder readiness affects striking and pressing;
* low calf readiness affects sprinting, jumping and kicking;
* low grip readiness affects pulling and grappling preparation.

---

## Sleep State

```typescript
interface SleepState {
  durationHours?: number;
  quality:
    | "VERY_GOOD"
    | "GOOD"
    | "AVERAGE"
    | "POOR"
    | "VERY_POOR"
    | "UNKNOWN";

  interruptions?: number;
  subjectiveRestoration?: ReadinessLevel;

  source: DataSource;
  confidence: ConfidenceLevel;
}
```

---

## Subjective State

```typescript
interface SubjectiveState {
  score?: number;
  level:
    | "VERY_HIGH"
    | "HIGH"
    | "MODERATE"
    | "LOW"
    | "VERY_LOW"
    | "UNKNOWN";

  source: DataSource;
  confidence: ConfidenceLevel;
}
```

Subjective scores must use:

```text
0 to 10
```

unless the field explicitly defines another scale.

---

## Illness State

```typescript
interface IllnessState {
  status:
    | "NONE"
    | "POSSIBLE"
    | "CONFIRMED"
    | "RECOVERING"
    | "UNKNOWN";

  symptoms?: string[];
  feverPresent?: boolean;
  medicalAdvice?: string;
}
```

The engine must not diagnose illness.

A confirmed or suspected illness may trigger:

* blocking validation;
* Recovery selection;
* safe failure;
* professional-assessment recommendation.

---

# Body Regions

```typescript
type BodyRegion =
  | "HEAD"
  | "NECK"
  | "CERVICAL_SPINE"
  | "SHOULDER_LEFT"
  | "SHOULDER_RIGHT"
  | "ELBOW_LEFT"
  | "ELBOW_RIGHT"
  | "WRIST_LEFT"
  | "WRIST_RIGHT"
  | "HAND_LEFT"
  | "HAND_RIGHT"
  | "THORACIC_SPINE"
  | "LUMBAR_SPINE"
  | "TRUNK"
  | "HIP_LEFT"
  | "HIP_RIGHT"
  | "GROIN"
  | "ADDUCTORS"
  | "HAMSTRINGS"
  | "QUADRICEPS"
  | "KNEE_LEFT"
  | "KNEE_RIGHT"
  | "CALF_LEFT"
  | "CALF_RIGHT"
  | "ANKLE_LEFT"
  | "ANKLE_RIGHT"
  | "FOOT_LEFT"
  | "FOOT_RIGHT"
  | "GENERAL"
  | "OTHER";
```

When `OTHER` is used, a description is required.

---

# Training Request

`TrainingRequest` describes the session requested by the user, coach or planner.

```typescript
interface TrainingRequest {
  requestedAt: ISODateTime;
  requestedSessionDate: ISODate;

  durationMinutes: Minutes;

  primaryObjective: TrainingObjective;
  secondaryObjectives?: TrainingObjective[];

  requestedModules?: RequestedModule[];
  excludedModules?: CapabilityModuleId[];

  requestedSessionType?: SessionType;

  desiredIntensity?: DesiredIntensity;
  desiredBodyRegions?: BodyRegion[];
  excludedBodyRegions?: BodyRegion[];

  nextImportantSessionAt?: ISODateTime;
  requestNotes?: string[];

  requestSource: DataSource;
}
```

---

## Session Type

```typescript
type SessionType =
  | "DEVELOPMENT"
  | "MAINTENANCE"
  | "RECOVERY"
  | "ASSESSMENT"
  | "RETURN_TO_TRAINING"
  | "COMPETITION_PREPARATION"
  | "GENERAL_PHYSICAL_PREPARATION";
```

The requested session type may be modified by the pipeline when:

* athlete state is incompatible;
* competition proximity requires another priority;
* medical or pain constraints apply;
* recovery capacity is insufficient.

Any modification must be recorded.

---

## Training Objective

```typescript
interface TrainingObjective {
  objectiveId?: Identifier;

  description: string;

  targetAdaptation?: AdaptationDomain;
  targetCapability?: string;
  targetPerformanceOutcome?: string;

  priority?: TrainingRole;
  measurableTarget?: MeasurableTarget;

  source: DataSource;
}
```

A natural-language description may be accepted.

However, the Objective Interpretation stage must convert it into a structured adaptation before module selection.

Examples:

```yaml
description: strike harder
targetPerformanceOutcome: improve_striking_force_expression
```

```yaml
description: improve lower-body maximum strength
targetAdaptation: MAXIMUM_STRENGTH
```

---

## Requested Module

```typescript
interface RequestedModule {
  module: CapabilityModuleId;
  requestedRole?: TrainingRole;
  required: boolean;
  reason?: string;
}
```

A requested module is not automatically selected.

It remains subject to:

* Module Engine doctrine;
* athlete state;
* constraints;
* conflict analysis;
* validation.

---

## Desired Intensity

```typescript
interface DesiredIntensity {
  mode:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "VERY_HIGH"
    | "AUTO";

  targetRpe?: number;
  targetRir?: number;
}
```

Valid ranges:

```text
RPE: 1 to 10
RIR: 0 to 10
```

A user-requested intensity does not override safety or recovery rules.

---

# Training Cycle Context

```typescript
interface TrainingCycleContext {
  cycleId: Identifier;
  cycleVersion: string;

  cycleType:
    | "GENERAL_PREPARATION"
    | "ACCUMULATION"
    | "MAXIMUM_STRENGTH"
    | "FUNCTIONAL_HYPERTROPHY"
    | "POWER_CONVERSION"
    | "CONDITIONING"
    | "COMPETITION_PREPARATION"
    | "TAPER"
    | "RETURN_TO_TRAINING"
    | "RECOVERY"
    | "CUSTOM";

  startDate: ISODate;
  endDate?: ISODate;

  adaptationPriorities: CycleAdaptationPriority[];

  plannedWeeklySessions?: number;
  currentWeekIndex?: number;

  cycleConstraints?: ExplicitConstraint[];
  cycleNotes?: string[];
}
```

---

## Cycle Adaptation Priority

```typescript
interface CycleAdaptationPriority {
  adaptation: AdaptationDomain;
  role: TrainingRole;

  targetExposurePerWeek?: number;
  minimumMaintenanceExposure?: number;

  rationale?: string;
}
```

Only one adaptation should normally hold the primary development role within one session.

The Training Cycle may contain several priorities across the week.

---

# Recent Training Context

```typescript
interface RecentTrainingContext {
  lookbackDays: number;

  sessions: TrainingHistoryEntry[];

  cumulativeLoad?: CumulativeLoad;
  recentExerciseExposure?: ExerciseExposure[];
  recentModuleExposure?: ModuleExposure[];

  unresolvedRecoveryIssues?: RecoveryIssue[];
}
```

Recommended default lookback:

```text
7 to 28 days
```

The exact period may depend on the decision.

---

## Training History Entry

```typescript
interface TrainingHistoryEntry {
  sessionId: Identifier;
  date: ISODateTime;

  source:
    | "CAS"
    | "COMBAT_PRACTICE"
    | "OTHER_TRAINING"
    | "MANUAL_ENTRY"
    | "IMPORTED_SERVICE";

  sessionType: string;

  modules?: CapabilityModuleId[];
  exercises?: PerformedExercise[];

  durationMinutes?: Minutes;
  sessionRpe?: number;

  neuralCost?: CostLevel;
  muscularCost?: CostLevel;
  connectiveTissueCost?: CostLevel;
  metabolicCost?: CostLevel;

  athleteFeedback?: SessionFeedback;
}
```

---

## Cost Level

```typescript
type CostLevel =
  | "NONE"
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH"
  | "UNKNOWN";
```

---

## Performed Exercise

```typescript
interface PerformedExercise {
  exerciseId: Identifier;
  exerciseName: string;

  module?: CapabilityModuleId;

  sets?: number;
  repetitions?: number;
  durationSeconds?: number;
  loadKg?: number;

  rpe?: number;
  rir?: number;

  completed: boolean;
  techniqueQuality?: QualityRating;
  painResponse?: PainSeverity;
}
```

---

## Quality Rating

```typescript
type QualityRating =
  | "EXCELLENT"
  | "GOOD"
  | "ACCEPTABLE"
  | "POOR"
  | "UNSAFE"
  | "UNKNOWN";
```

---

## Session Feedback

```typescript
interface SessionFeedback {
  sessionQuality?: QualityRating;
  perceivedFatigue?: CostLevel;
  sorenessNextDay?: CostLevel;
  painEvents?: PainEvent[];
  recoveryTimeHours?: number;
  combatPracticeImpact?: string;
  notes?: string[];
}
```

---

# Combat Context

`CombatContext` represents specific-skill practice outside the physical preparation engine.

```typescript
interface CombatContext {
  primaryDiscipline: CombatSport;

  recentSessions?: CombatSession[];
  upcomingSessions?: PlannedCombatSession[];

  weeklyCombatVolumeMinutes?: number;
  currentTechnicalPriority?: string;

  combatLoadSummary?: CombatLoadSummary;
}
```

---

## Combat Session

```typescript
interface CombatSession {
  sessionId?: Identifier;
  date: ISODateTime;

  discipline: CombatSport;

  sessionType:
    | "TECHNICAL"
    | "PAD_WORK"
    | "HEAVY_BAG"
    | "SPARRING_LIGHT"
    | "SPARRING_HARD"
    | "GRAPPLING_TECHNICAL"
    | "GRAPPLING_LIVE"
    | "WRESTLING"
    | "CLINCH"
    | "MIXED"
    | "COMPETITION"
    | "OTHER";

  durationMinutes: Minutes;
  intensity: CostLevel;

  strikingVolume?: CostLevel;
  kickingVolume?: CostLevel;
  grapplingVolume?: CostLevel;
  gripDemand?: CostLevel;
  impactDemand?: CostLevel;

  fatigueResponse?: CostLevel;
  notes?: string[];
}
```

---

## Planned Combat Session

```typescript
interface PlannedCombatSession {
  scheduledAt: ISODateTime;

  discipline?: CombatSport;
  sessionType?: string;

  expectedDurationMinutes?: Minutes;
  expectedIntensity?: CostLevel;

  priority:
    | "KEY"
    | "NORMAL"
    | "OPTIONAL";

  expectedDemands?: CombatDemandProfile;
}
```

---

## Combat Demand Profile

```typescript
interface CombatDemandProfile {
  shoulderDemand?: CostLevel;
  gripDemand?: CostLevel;
  lowerBodyDemand?: CostLevel;
  neckDemand?: CostLevel;
  impactDemand?: CostLevel;
  metabolicDemand?: CostLevel;
  technicalPrecisionDemand?: CostLevel;
}
```

---

## Combat Load Summary

```typescript
interface CombatLoadSummary {
  totalSessionsLast7Days?: number;
  totalMinutesLast7Days?: number;

  hardSessionsLast7Days?: number;
  sparringSessionsLast7Days?: number;

  strikingLoad?: CostLevel;
  kickingLoad?: CostLevel;
  grapplingLoad?: CostLevel;
  gripLoad?: CostLevel;
  impactLoad?: CostLevel;
}
```

Specific-practice information influences physical preparation.

It does not create a `Specific Skill` Capability Module.

---

# Competition Context

```typescript
interface CompetitionContext {
  competitionScheduled: boolean;

  competitionDate?: ISODateTime;
  competitionType?: string;
  discipline?: CombatSport;

  priority?:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  weightClassKg?: number;
  targetCompetitionMassKg?: number;

  taperStartDate?: ISODate;
  weighInDate?: ISODateTime;

  currentPhase?:
    | "FAR"
    | "MODERATE_PROXIMITY"
    | "CLOSE"
    | "TAPER"
    | "POST_COMPETITION";

  competitionNotes?: string[];
}
```

When `competitionScheduled` is `true`, `competitionDate` is required.

CAS must not use this input to prescribe dangerous weight-cutting practices.

---

# Equipment Context

```typescript
interface EquipmentContext {
  locationId?: Identifier;
  assessedAt: ISODateTime;

  availableEquipment: EquipmentItem[];
  unavailableEquipment?: EquipmentType[];

  temporaryLimitations?: EquipmentLimitation[];

  source: DataSource;
}
```

---

## Equipment Item

```typescript
interface EquipmentItem {
  equipmentId?: Identifier;
  type: EquipmentType;

  available: boolean;
  functional: boolean;

  quantity?: number;

  maximumLoadKg?: number;
  minimumLoadKg?: number;
  incrementKg?: number;

  properties?: Record<string, string | number | boolean>;

  notes?: string[];
}
```

---

## Equipment Type

```typescript
type EquipmentType =
  | "BODYWEIGHT"
  | "BARBELL"
  | "PLATES"
  | "RACK"
  | "SAFETY_ARMS"
  | "BENCH"
  | "DUMBBELLS"
  | "KETTLEBELLS"
  | "CABLE_MACHINE"
  | "LAT_PULLDOWN"
  | "PULL_UP_BAR"
  | "DIP_BARS"
  | "TRAP_BAR"
  | "LANDMINE"
  | "MEDICINE_BALL"
  | "PLYOMETRIC_BOX"
  | "RESISTANCE_BANDS"
  | "SLED"
  | "ROWER"
  | "AIR_BIKE"
  | "STATIONARY_BIKE"
  | "TREADMILL"
  | "HEAVY_BAG"
  | "STRIKING_PADS"
  | "MAT"
  | "FOAM_ROLLER"
  | "OTHER";
```

When `OTHER` is used, a description is required.

Essential unavailable equipment produces exercise ineligibility.

The engine must not assume that similar equipment is equivalent.

---

# Environment Context

```typescript
interface EnvironmentContext {
  environmentType:
    | "COMMERCIAL_GYM"
    | "HOME_GYM"
    | "COMBAT_GYM"
    | "OUTDOOR"
    | "HOTEL"
    | "TRAVEL"
    | "CLINICAL"
    | "OTHER";

  availableSpace:
    | "VERY_LIMITED"
    | "LIMITED"
    | "MODERATE"
    | "LARGE"
    | "UNKNOWN";

  floorSafe: boolean | null;
  ceilingHeightAdequate?: boolean | null;
  lightingAdequate?: boolean | null;

  temperatureCelsius?: number;
  weatherConditions?: string;

  crowding?: CostLevel;
  noiseRestrictions?: boolean;

  environmentalHazards?: string[];
  notes?: string[];
}
```

Unknown safety-critical environment values must not automatically be treated as safe.

---

# Supervision Context

```typescript
interface SupervisionContext {
  mode:
    | "UNSUPERVISED"
    | "REMOTE"
    | "COACH_PRESENT"
    | "MEDICAL_PROFESSIONAL_PRESENT"
    | "SPOTTER_AVAILABLE";

  supervisorId?: Identifier;
  supervisorQualifications?: string[];

  spottingAvailable: boolean;
  emergencySupportAvailable?: boolean;
}
```

The engine should assume no supervision unless explicitly confirmed.

---

# Medical Context

```typescript
interface MedicalContext {
  medicalClearanceStatus:
    | "CLEARED"
    | "CLEARED_WITH_RESTRICTIONS"
    | "NOT_CLEARED"
    | "UNKNOWN";

  activeRestrictions: MedicalRestriction[];

  rehabilitationPlan?: RehabilitationInstruction[];
  medicationsAffectingTraining?: MedicationTrainingEffect[];

  clinicianNotes?: string[];
}
```

---

## Medical Restriction

```typescript
interface MedicalRestriction {
  restrictionId: Identifier;

  description: string;
  severity: ConstraintSeverity;

  prohibitedActivities?: string[];
  prohibitedBodyRegions?: BodyRegion[];
  allowedActivities?: string[];

  startDate?: ISODate;
  endDate?: ISODate;

  issuedBy?: string;
  source: DataSource;
}
```

Medical restrictions override:

* athlete preference;
* requested objectives;
* scoring;
* progression;
* module priority.

The engine must not reinterpret or bypass a medical instruction.

---

## Rehabilitation Instruction

```typescript
interface RehabilitationInstruction {
  instructionId: Identifier;

  description: string;

  requiredExercises?: Identifier[];
  prohibitedExercises?: Identifier[];

  requiredParameters?: Record<string, string | number>;
  progressionLimits?: string[];

  issuedBy?: string;
  validUntil?: ISODate;
}
```

---

# Pain Context

```typescript
interface PainContext {
  assessedAt: ISODateTime;

  currentPain: PainEvent[];
  painStatusKnown: boolean;

  neurologicalSymptomsPresent?: boolean;
  instabilityPresent?: boolean;

  source: DataSource;
}
```

---

## Pain Event

```typescript
interface PainEvent {
  painId?: Identifier;

  region: BodyRegion;
  side?: "LEFT" | "RIGHT" | "BILATERAL" | "NOT_APPLICABLE";

  severity: PainSeverity;
  score0To10?: number;

  behaviour: SymptomBehaviour;

  quality?: string[];

  triggeredBy?: string[];
  relievedBy?: string[];

  altersTechnique: boolean;
  altersForceOutput?: boolean;
  reducesConfidence?: boolean;

  radiating?: boolean;
  neurological?: boolean;
  instability?: boolean;

  durationDays?: number;
  notes?: string[];
}
```

Valid pain score range:

```text
0 to 10
```

Pain status is safety-critical for:

* ballistic work;
* sprinting;
* jumping;
* maximal strength;
* heavy bag work;
* high-impact work.

When critical pain data are missing, the engine must not assume absence of pain.

---

# Soreness Report

```typescript
interface SorenessReport {
  region: BodyRegion;

  severity:
    | "NONE"
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "VERY_HIGH";

  affectsMovement: boolean;
  affectsConfidence?: boolean;

  onsetDate?: ISODate;
  source: DataSource;
}
```

Soreness and pain must remain distinct.

The engine must not treat all soreness as injury.

It must also not treat all symptoms as harmless soreness.

---

# Coach Instructions

```typescript
interface CoachInstructions {
  coachId?: Identifier;
  issuedAt: ISODateTime;

  requiredObjectives?: TrainingObjective[];
  requiredModules?: RequestedModule[];

  prohibitedModules?: CapabilityModuleId[];
  requiredExercises?: Identifier[];
  prohibitedExercises?: Identifier[];

  volumeLimits?: TrainingLimit[];
  intensityLimits?: TrainingLimit[];

  schedulingInstructions?: string[];
  rationale?: string;
}
```

Coach instructions may influence selection.

They cannot override:

* medical restrictions;
* critical safety rules;
* blocking validation rules.

---

# Athlete Preferences

```typescript
interface AthletePreferences {
  preferredExercises?: Identifier[];
  dislikedExercises?: Identifier[];

  preferredModalities?: string[];
  preferredSessionLengthMinutes?: number;

  preferredComplexity?:
    | "SIMPLE"
    | "MODERATE"
    | "ADVANCED"
    | "NO_PREFERENCE";

  preferredVariationLevel?:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "NO_PREFERENCE";

  adherenceNotes?: string[];
}
```

Preferences influence selection only among valid options.

They must not override:

* safety;
* adaptation match;
* technical feasibility;
* medical restrictions;
* recovery constraints.

---

# Explicit Constraints

```typescript
interface ExplicitConstraint {
  constraintId: Identifier;

  type:
    | "MEDICAL"
    | "PAIN"
    | "EQUIPMENT"
    | "ENVIRONMENT"
    | "TIME"
    | "TECHNICAL_LEVEL"
    | "SUPERVISION"
    | "RECOVERY"
    | "COMPETITION"
    | "COMBAT_PRACTICE"
    | "BODY_MASS"
    | "EXERCISE_EXPOSURE"
    | "OTHER";

  description: string;
  severity: ConstraintSeverity;

  affectedModules?: CapabilityModuleId[];
  affectedExercises?: Identifier[];
  affectedBodyRegions?: BodyRegion[];

  startDate?: ISODateTime;
  endDate?: ISODateTime;

  source: DataSource;
}
```

Constraints may be supplied directly or derived during the Constraint Extraction stage.

Derived constraints belong in the Decision Trace.

They should not be silently written back as original user input.

---

# Training Limits

```typescript
interface TrainingLimit {
  target:
    | "SESSION"
    | "MODULE"
    | "EXERCISE"
    | "BODY_REGION"
    | "FATIGUE_DIMENSION";

  targetId?: string;

  metric:
    | "DURATION_MINUTES"
    | "SETS"
    | "REPETITIONS"
    | "LOAD_KG"
    | "RPE"
    | "RIR"
    | "CONTACTS"
    | "ROUNDS"
    | "NEURAL_COST"
    | "MUSCULAR_COST"
    | "CONNECTIVE_TISSUE_COST"
    | "METABOLIC_COST";

  minimum?: number;
  maximum?: number;

  severity: ConstraintSeverity;
}
```

---

# Previous Session Response

```typescript
interface PreviousSessionResponse {
  sessionId?: Identifier;
  sessionDate?: ISODateTime;

  completedAsPlanned?: boolean;

  perceivedDifficulty?: number;
  techniqueQuality?: QualityRating;

  painResponse?: PainEvent[];
  sorenessResponse?: SorenessReport[];

  recoveryStatus:
    | "FULLY_RECOVERED"
    | "MOSTLY_RECOVERED"
    | "PARTIALLY_RECOVERED"
    | "NOT_RECOVERED"
    | "UNKNOWN";

  progressionOutcome?:
    | "PROGRESSED"
    | "MAINTAINED"
    | "REGRESSED"
    | "FAILED"
    | "NOT_APPLICABLE";

  notes?: string[];
}
```

---

# Exercise History Summary

```typescript
interface ExerciseHistorySummary {
  knownExercises?: ExerciseExperience[];
  recurringSuccessfulExercises?: Identifier[];
  recurringPoorResponseExercises?: Identifier[];
  exerciseRestrictions?: Identifier[];
}
```

---

## Exercise Experience

```typescript
interface ExerciseExperience {
  exerciseId: Identifier;

  experienceLevel: ExperienceLevel;
  lastPerformedAt?: ISODateTime;

  successfulExposures?: number;
  unsuccessfulExposures?: number;

  currentPrescriptionReference?: string;

  bestRecordedPerformance?: MeasuredMetric;
  recentPerformanceTrend?:
    | "IMPROVING"
    | "STABLE"
    | "DECLINING"
    | "UNKNOWN";

  typicalPainResponse?: PainSeverity;
  typicalRecoveryCost?: CostLevel;

  confidence: ConfidenceLevel;
}
```

---

# Measured Metric

```typescript
interface MeasuredMetric {
  metric: string;
  value: number;
  unit: string;

  measuredAt?: ISODateTime;
  source: DataSource;
  quality: DataQuality;
}
```

---

# Weekly Availability

```typescript
interface WeeklyAvailability {
  availableDays: WeeklyAvailabilityDay[];
  maximumSessionsPerWeek?: number;
  preferredRestDays?: DayOfWeek[];
}
```

---

## Weekly Availability Day

```typescript
interface WeeklyAvailabilityDay {
  day: DayOfWeek;

  available: boolean;
  availableWindows?: TimeWindow[];

  maximumDurationMinutes?: number;
}
```

---

## Day and Time Types

```typescript
type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface TimeWindow {
  startTime: string;
  endTime: string;
}
```

---

# Data Provenance

Every decision-relevant input should have a provenance record.

```typescript
interface DataProvenanceRecord {
  fieldPath: string;

  source: DataSource;
  quality: DataQuality;
  confidence: ConfidenceLevel;

  recordedAt: ISODateTime;

  originalValue?: unknown;
  transformedValue?: unknown;

  transformationRule?: string;
  sourceReference?: string;

  notes?: string[];
}
```

Example:

```yaml
fieldPath: athleteState.generalReadiness
source: ENGINE_INFERENCE
quality: MODERATE
confidence: MODERATE
recordedAt: 2026-07-15T07:00:00+02:00
transformationRule: readiness_rule_v0.1
```

Example:

```yaml
fieldPath: painContext.currentPain[0].severity
source: ATHLETE_SELF_REPORT
quality: MODERATE
confidence: HIGH
recordedAt: 2026-07-15T06:55:00+02:00
```

---

# Inferred Values

An inferred value must include:

* the original inputs used;
* the rule or model used;
* the inferred value;
* the confidence level;
* the inference timestamp.

Example:

```typescript
interface InferredValue<T> {
  value: T;
  ruleId: string;
  ruleVersion: string;
  inputReferences: string[];
  confidence: ConfidenceLevel;
  inferredAt: ISODateTime;
}
```

The engine must not overwrite raw athlete data with inferred values.

Both must remain distinguishable.

---

# Safe Defaults

A safe default may be used only when:

* the missing field is not safety-critical;
* the default is explicitly defined;
* confidence is reduced;
* the use of the default is recorded.

Default safe assumptions may include:

```text
supervision = UNSUPERVISED
spottingAvailable = false
generalReadiness = MODERATE
technicalCompetence = MODERATE
recoveryCapacity = NORMAL_NOT_EXCEPTIONAL
```

The engine must not default to:

```text
no pain
no injury
medical clearance
advanced technical ability
full equipment availability
excellent recovery
competition not scheduled
```

Unknown and negative are not identical.

---

# Critical Missing Data

Critical missing data may block generation.

Examples include:

* pain status for high-risk training;
* active medical restrictions;
* available session duration;
* essential equipment availability;
* technical competence for high-risk exercises;
* competition date when competition preparation is requested;
* recent combat load when high-intensity concurrent work is requested.

Possible result:

```text
INPUT_INVALID
MISSING_CRITICAL_DATA
```

The engine may either:

* request the missing information;
* generate a conservative low-risk session;
* return a safe-failure output.

The selected behaviour must be defined by Validation Rules.

---

# Input Validation Rules

The root object must pass structural validation before the Session Generation Pipeline begins.

---

## Rule 1 — Schema Version

`schemaVersion` is required.

Supported Version 0.1 value:

```text
0.1
```

Unsupported versions produce:

```text
UNSUPPORTED_SCHEMA_VERSION
```

---

## Rule 2 — Request Identifier

`requestId` is required and must be unique within the relevant storage scope.

---

## Rule 3 — Athlete Identifier

`athleteProfile.athleteId` is required.

An empty identifier is invalid.

---

## Rule 4 — Session Duration

`trainingRequest.durationMinutes` is required.

Valid default range:

```text
5 to 240 minutes
```

Values outside this range require explicit system support or manual review.

---

## Rule 5 — Primary Objective

One primary objective is required.

The input must not contain several objectives marked as equally primary.

An ambiguous natural-language objective may enter Objective Interpretation.

A completely uninterpretable objective is invalid.

---

## Rule 6 — Adaptation Identifiers

When an Adaptation Domain is supplied, it must use a canonical value.

---

## Rule 7 — Capability Module Identifiers

Requested or excluded modules must use the canonical module catalog.

---

## Rule 8 — Equipment Consistency

An equipment item cannot be simultaneously:

```text
available = true
functional = false
```

and treated as usable.

Non-functional equipment is unavailable for selection.

---

## Rule 9 — Medical Status

When:

```text
medicalClearanceStatus = CLEARED_WITH_RESTRICTIONS
```

at least one active restriction or rehabilitation instruction is required.

When:

```text
medicalClearanceStatus = NOT_CLEARED
```

normal training-session generation is blocked unless a medically authorized mode explicitly applies.

---

## Rule 10 — Pain Consistency

When:

```text
painStatusKnown = false
```

`currentPain` must not be interpreted as an authoritative empty list.

When:

```text
painStatusKnown = true
currentPain = []
```

the athlete is reporting no current pain.

---

## Rule 11 — Neurological Symptoms

When neurological symptoms are reported, the engine must create a safety-critical constraint.

The input schema records the data.

The Validation Rules determine the blocking response.

---

## Rule 12 — Date Consistency

The following date relationships must be coherent:

* requested session date;
* current assessment date;
* competition date;
* weigh-in date;
* cycle start and end dates;
* restriction start and end dates.

Examples of invalid relationships include:

* cycle end before cycle start;
* competition date before weigh-in date when not explicitly supported;
* restriction end before restriction start.

---

## Rule 13 — Numerical Ranges

Default valid ranges include:

```text
readiness score: 0–100
pain score: 0–10
RPE: 1–10
RIR: 0–10
session RPE: 1–10
percentage values: 0–100
duration: greater than 0
body mass: greater than 0
height: greater than 0
```

---

## Rule 14 — Source Requirement

Every critical value must have either:

* an inline source field;
* a matching Data Provenance record.

Critical values include:

* pain;
* medical restrictions;
* readiness;
* equipment;
* objective;
* session duration;
* competition date;
* combat schedule.

---

## Rule 15 — Contradictory Data

Contradictory values must not be resolved silently.

Examples:

```text
medical clearance = CLEARED
active restriction = no loaded lower-body training
```

```text
equipment available = false
requested required exercise uses that equipment
```

```text
pain status = no pain
current pain event = severe knee pain
```

Contradictions must produce:

* an input error;
* a warning;
* or an explicit conflict record.

---

# Input Error Structure

```typescript
interface InputError {
  code: string;
  fieldPath?: string;

  severity:
    | "WARNING"
    | "ERROR"
    | "BLOCKING";

  message: string;
  receivedValue?: unknown;
  expected?: string;

  suggestedAction?: string;
}
```

Examples:

```yaml
code: MISSING_SESSION_DURATION
fieldPath: trainingRequest.durationMinutes
severity: BLOCKING
message: A session duration is required.
```

```yaml
code: UNKNOWN_PAIN_STATUS
fieldPath: painContext.painStatusKnown
severity: WARNING
message: Pain status is unknown. High-impact candidates will be restricted.
```

---

# Input Validation Result

```typescript
interface InputValidationResult {
  status:
    | "VALID"
    | "VALID_WITH_WARNINGS"
    | "INVALID";

  errors: InputError[];
  warnings: InputError[];

  criticalDataComplete: boolean;
  safeToContinue: boolean;
}
```

The Session Generation Pipeline may continue only when:

```text
safeToContinue = true
```

---

# Engine Options

`EngineOptions` controls authorized processing behaviour.

It does not override physiological or safety doctrine.

```typescript
interface EngineOptions {
  deterministicMode?: boolean;

  allowSafeDefaults?: boolean;
  allowRecoveryFallback?: boolean;
  allowObjectiveReduction?: boolean;

  includeAlternativeExercises?: boolean;
  includeDetailedDecisionTrace?: boolean;

  maximumAlternativeCount?: number;
  maximumBacktrackingIterations?: number;

  manualReviewAvailable?: boolean;
}
```

Recommended defaults:

```yaml
deterministicMode: true
allowSafeDefaults: true
allowRecoveryFallback: true
allowObjectiveReduction: true
includeAlternativeExercises: true
includeDetailedDecisionTrace: true
maximumAlternativeCount: 3
maximumBacktrackingIterations: 5
manualReviewAvailable: false
```

Engine options cannot authorize:

* medical-rule bypass;
* safety-rule bypass;
* invalid exercises;
* unresolved blocking conflicts;
* invalid final sessions.

---

# Minimal Valid Input

The minimum valid input for a basic low-risk session is:

```typescript
interface MinimalEngineInput {
  schemaVersion: "0.1";
  requestId: string;
  generatedAt: ISODateTime;
  timezone: IANATimeZone;

  athleteProfile: {
    athleteId: string;
    profileVersion: string;
    primarySport: CombatSport;
    combatLevel: ExperienceLevel;
    physicalTrainingLevel: ExperienceLevel;
  };

  athleteState: {
    assessedAt: ISODateTime;
    generalReadiness: ReadinessValue;
  };

  trainingRequest: {
    requestedAt: ISODateTime;
    requestedSessionDate: ISODate;
    durationMinutes: number;
    primaryObjective: TrainingObjective;
    requestSource: DataSource;
  };

  equipmentContext: EquipmentContext;
  environmentContext: EnvironmentContext;
  supervisionContext: SupervisionContext;
  medicalContext: MedicalContext;
  painContext: PainContext;
  dataProvenance: DataProvenanceRecord[];
}
```

High-risk training requires additional information.

Examples include:

* regional readiness;
* technical competence;
* recent training load;
* pain certainty;
* supervision;
* equipment safety;
* combat schedule.

---

# Complete Example

```yaml
schemaVersion: "0.1"
requestId: "request_2026_07_15_001"
generatedAt: "2026-07-15T07:15:00+02:00"
locale: "fr-FR"
timezone: "Europe/Paris"

athleteProfile:
  athleteId: "athlete_001"
  profileVersion: "0.3"
  ageYears: 39
  heightCm: 186
  bodyMassKg: 80.5
  primarySport: "KRAV_MAGA"
  combatLevel: "INTERMEDIATE"
  physicalTrainingLevel: "INTERMEDIATE"
  trainingAgeYears: 4
  combatTrainingAgeYears: 2
  dominantSide: "RIGHT"

  longTermGoals:
    - goalId: "goal_striking_power"
      description: "Increase striking speed and force"
      targetAdaptation: "POWER"
      priority: "HIGH"
      status: "ACTIVE"

    - goalId: "goal_bench_press"
      description: "Bench press 140 kg"
      targetAdaptation: "MAXIMUM_STRENGTH"
      priority: "HIGH"
      measurableTarget:
        metric: "bench_press_1rm"
        currentValue: 110
        targetValue: 140
        unit: "kg"
      status: "ACTIVE"

athleteState:
  assessedAt: "2026-07-15T07:00:00+02:00"

  generalReadiness:
    level: "GOOD"
    score: 74
    confidence: "HIGH"
    source: "ATHLETE_SELF_REPORT"

  neuralReadiness:
    level: "GOOD"
    score: 72
    confidence: "MODERATE"
    source: "ENGINE_INFERENCE"

  muscularReadiness:
    level: "MODERATE"
    score: 63
    confidence: "HIGH"
    source: "ATHLETE_SELF_REPORT"

  sleep:
    durationHours: 7.2
    quality: "GOOD"
    subjectiveRestoration: "GOOD"
    source: "ATHLETE_SELF_REPORT"
    confidence: "HIGH"

  energy:
    score: 7
    level: "HIGH"
    source: "ATHLETE_SELF_REPORT"
    confidence: "HIGH"

  motivation:
    score: 8
    level: "HIGH"
    source: "ATHLETE_SELF_REPORT"
    confidence: "HIGH"

  psychologicalStress:
    score: 4
    level: "MODERATE"
    source: "ATHLETE_SELF_REPORT"
    confidence: "MODERATE"

  soreness:
    - region: "SHOULDER_RIGHT"
      severity: "LOW"
      affectsMovement: false
      source: "ATHLETE_SELF_REPORT"

  illness:
    status: "NONE"

trainingRequest:
  requestedAt: "2026-07-15T07:15:00+02:00"
  requestedSessionDate: "2026-07-15"
  durationMinutes: 60

  primaryObjective:
    description: "Improve striking power"
    targetAdaptation: "POWER"
    targetCapability: "transmit_force"
    targetPerformanceOutcome: "improve_striking_force_expression"
    priority: "PRIMARY"
    source: "ATHLETE_SELF_REPORT"

  secondaryObjectives:
    - description: "Maintain upper-body maximum strength"
      targetAdaptation: "MAXIMUM_STRENGTH"
      priority: "MAINTENANCE"
      source: "ATHLETE_SELF_REPORT"

  requestedSessionType: "DEVELOPMENT"

  desiredIntensity:
    mode: "AUTO"

  nextImportantSessionAt: "2026-07-17T19:00:00+02:00"
  requestSource: "ATHLETE_SELF_REPORT"

trainingCycle:
  cycleId: "cycle_power_001"
  cycleVersion: "0.1"
  cycleType: "POWER_CONVERSION"
  startDate: "2026-07-06"
  endDate: "2026-08-02"

  adaptationPriorities:
    - adaptation: "POWER"
      role: "PRIMARY"
      targetExposurePerWeek: 2

    - adaptation: "MAXIMUM_STRENGTH"
      role: "MAINTENANCE"
      targetExposurePerWeek: 2

    - adaptation: "FUNCTIONAL_HYPERTROPHY"
      role: "EXCLUDED"

recentTraining:
  lookbackDays: 7

  sessions:
    - sessionId: "combat_2026_07_13"
      date: "2026-07-13T18:30:00+02:00"
      source: "COMBAT_PRACTICE"
      sessionType: "TECHNICAL_KRAV_MAGA"
      durationMinutes: 90
      sessionRpe: 6
      neuralCost: "MODERATE"
      muscularCost: "MODERATE"
      connectiveTissueCost: "LOW"
      metabolicCost: "MODERATE"

combatContext:
  primaryDiscipline: "KRAV_MAGA"

  upcomingSessions:
    - scheduledAt: "2026-07-17T19:00:00+02:00"
      discipline: "KRAV_MAGA"
      sessionType: "TECHNICAL"
      expectedDurationMinutes: 90
      expectedIntensity: "MODERATE"
      priority: "KEY"
      expectedDemands:
        shoulderDemand: "MODERATE"
        gripDemand: "LOW"
        lowerBodyDemand: "MODERATE"
        impactDemand: "LOW"
        metabolicDemand: "MODERATE"
        technicalPrecisionDemand: "HIGH"

competitionContext:
  competitionScheduled: false

equipmentContext:
  assessedAt: "2026-07-15T07:05:00+02:00"
  source: "ATHLETE_SELF_REPORT"

  availableEquipment:
    - type: "BODYWEIGHT"
      available: true
      functional: true

    - type: "BARBELL"
      available: true
      functional: true
      maximumLoadKg: 200

    - type: "BENCH"
      available: true
      functional: true

    - type: "RACK"
      available: true
      functional: true

    - type: "PULL_UP_BAR"
      available: true
      functional: true

    - type: "MEDICINE_BALL"
      available: true
      functional: true
      properties:
        availableWeightsKg: "3,5,7"

    - type: "HEAVY_BAG"
      available: true
      functional: true

environmentContext:
  environmentType: "COMBAT_GYM"
  availableSpace: "LARGE"
  floorSafe: true
  ceilingHeightAdequate: true
  lightingAdequate: true
  crowding: "LOW"
  noiseRestrictions: false
  environmentalHazards: []

supervisionContext:
  mode: "UNSUPERVISED"
  spottingAvailable: false
  emergencySupportAvailable: true

medicalContext:
  medicalClearanceStatus: "CLEARED"
  activeRestrictions: []

painContext:
  assessedAt: "2026-07-15T07:00:00+02:00"
  painStatusKnown: true
  currentPain: []
  neurologicalSymptomsPresent: false
  instabilityPresent: false
  source: "ATHLETE_SELF_REPORT"

athletePreferences:
  preferredExercises:
    - "rotational_medicine_ball_throw"
    - "weighted_pull_up"
    - "bench_press"

  preferredComplexity: "MODERATE"
  preferredVariationLevel: "LOW"

dataProvenance:
  - fieldPath: "athleteState.generalReadiness"
    source: "ATHLETE_SELF_REPORT"
    quality: "MODERATE"
    confidence: "HIGH"
    recordedAt: "2026-07-15T07:00:00+02:00"

  - fieldPath: "athleteState.neuralReadiness"
    source: "ENGINE_INFERENCE"
    quality: "MODERATE"
    confidence: "MODERATE"
    recordedAt: "2026-07-15T07:10:00+02:00"
    transformationRule: "neural_readiness_rule_v0.1"

  - fieldPath: "painContext.currentPain"
    source: "ATHLETE_SELF_REPORT"
    quality: "MODERATE"
    confidence: "HIGH"
    recordedAt: "2026-07-15T07:00:00+02:00"

  - fieldPath: "equipmentContext.availableEquipment"
    source: "ATHLETE_SELF_REPORT"
    quality: "MODERATE"
    confidence: "HIGH"
    recordedAt: "2026-07-15T07:05:00+02:00"

engineOptions:
  deterministicMode: true
  allowSafeDefaults: true
  allowRecoveryFallback: true
  allowObjectiveReduction: true
  includeAlternativeExercises: true
  includeDetailedDecisionTrace: true
  maximumAlternativeCount: 3
  maximumBacktrackingIterations: 5
  manualReviewAvailable: false
```

---

# Invalid Input Example

```yaml
schemaVersion: "0.1"
requestId: "invalid_request"

athleteProfile:
  athleteId: ""
  primarySport: "KRAV_MAGA"

trainingRequest:
  durationMinutes: 0
  primaryObjective:
    description: ""

medicalContext:
  medicalClearanceStatus: "CLEARED_WITH_RESTRICTIONS"
  activeRestrictions: []

painContext:
  painStatusKnown: false
  currentPain: []

equipmentContext:
  availableEquipment:
    - type: "BARBELL"
      available: true
      functional: false
```

Expected errors include:

```text
MISSING_GENERATED_AT
MISSING_TIMEZONE
MISSING_ATHLETE_IDENTIFIER
MISSING_PROFILE_VERSION
INVALID_SESSION_DURATION
MISSING_PRIMARY_OBJECTIVE
MISSING_MEDICAL_RESTRICTIONS
UNKNOWN_PAIN_STATUS
INCONSISTENT_EQUIPMENT_STATUS
MISSING_ENVIRONMENT_CONTEXT
MISSING_SUPERVISION_CONTEXT
MISSING_DATA_PROVENANCE
```

---

# Schema Invariants

The following conditions must always remain true:

1. Every input uses an explicit schema version.
2. Every request has a unique identifier.
3. Every request identifies one athlete.
4. Every session request contains one primary objective.
5. Every request contains an available duration.
6. Adaptation values use the canonical Adaptation Domains.
7. Module values use the canonical Capability Module catalog.
8. Combat practice is represented as external context.
9. Athlete Profile and Athlete State remain separate.
10. Pain and soreness remain separate.
11. Unknown data are not treated as favourable data.
12. Critical values have identifiable provenance.
13. Inferred data remain distinguishable from reported data.
14. Safe defaults are explicit and traceable.
15. Medical restrictions cannot be overridden by request options.
16. Athlete preferences cannot override hard constraints.
17. Equipment must be confirmed before use.
18. Supervision must not be assumed.
19. Contradictory data must be surfaced.
20. Invalid input must fail safely.

---

# Relationship With the Session Generation Pipeline

The Engine Input Schema supplies information to the following stages:

```text
Athlete Profile
        ↓
Athlete State Evaluation
        ↓
Constraint Extraction
        ↓
Objective Interpretation
        ↓
Adaptation Priority Calculation
        ↓
Capability Module Selection
```

Different input objects support different stages:

| Input object          | Primary pipeline use             |
| --------------------- | -------------------------------- |
| AthleteProfile        | Long-term athlete context        |
| AthleteState          | Current readiness                |
| TrainingRequest       | Requested session objective      |
| TrainingCycleContext  | Adaptation priority              |
| RecentTrainingContext | Exposure and recovery            |
| CombatContext         | Specific-practice integration    |
| CompetitionContext    | Readiness and taper constraints  |
| EquipmentContext      | Exercise feasibility             |
| EnvironmentContext    | Practical and safety feasibility |
| SupervisionContext    | Technical and safety feasibility |
| MedicalContext        | Hard restrictions                |
| PainContext           | Eligibility and safety           |
| CoachInstructions     | Authorized planning constraints  |
| AthletePreferences    | Low-priority candidate selection |
| DataProvenance        | Traceability and confidence      |

---

# Relationship With the Decision Trace

The Decision Trace must distinguish between:

* raw input;
* normalized input;
* inferred values;
* safe defaults;
* constraints derived from input;
* decisions produced by the engine.

Example:

```text
Raw input:
Sleep duration = 5.5 hours

Derived constraint:
Reduced neural readiness

Engine decision:
High-impact Power candidates excluded
```

The engine must not represent the derived constraint as though the athlete explicitly reported it.

---

# Versioning

Every input object must record:

```text
schemaVersion
```

Relevant nested profile and cycle objects should record their own versions.

Input validation must use the rules associated with the supplied schema version.

A future schema version must not silently reinterpret Version 0.1 fields.

---

# Security and Privacy Principle

The Engine Input Schema should contain only data necessary for training decisions.

The engine should avoid collecting unrelated personal information.

Sensitive data must be:

* purpose-limited;
* access-controlled;
* traceable;
* stored only when required;
* excluded from user-facing explanations unless relevant.

The schema defines the data contract.

It does not define storage duration or legal compliance procedures.

Those concerns belong to the broader CAS data-governance system.

---

# Definition of Success

The Engine Input Schema succeeds when it ensures that every generated session is based on input that is:

* explicit;
* structured;
* validated;
* contextual;
* athlete-specific;
* safety-aware;
* source-identifiable;
* confidence-aware;
* compatible with deterministic processing;
* sufficient for Decision Trace generation.

The schema does not succeed merely because the engine accepts a JSON object.

It succeeds only when the accepted data are sufficient to produce a safe and explainable decision.

---

# Final Principle

The CAS Engine must never invent the athlete context required to justify a session.

It may infer.

It may use safe defaults.

It may act conservatively under uncertainty.

But every inference, default and limitation must remain visible.

> No hidden input.

> No silent assumption.

> No untraceable decision.
