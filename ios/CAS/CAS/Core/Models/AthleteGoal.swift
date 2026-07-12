import Foundation

/// What the athlete says they want, in their own terms — not a physical
/// quality, not an `AdaptationDomain`. Deliberately kept as a separate
/// vocabulary: `AdaptationDomain` is the current engine's internal
/// taxonomy and may change after the ongoing scientific audits, while
/// `AthleteProfile` is meant to outlive any one version of the engine. A
/// future decision engine translates `AthleteGoal → capacités →
/// adaptations`; this type never encodes that translation itself.
enum AthleteGoal: String, Codable, CaseIterable, Sendable {
    case generalCombatPerformance
    case maximalStrength
    case explosiveness
    case conditioning
    case functionalMuscleGain
    case robustness
    case gradePreparation
    case returnToTraining
}
