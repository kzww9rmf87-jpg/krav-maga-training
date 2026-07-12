import Foundation

/// The outcome of checking one exercise against an athlete's
/// `availableEquipment` — see `SessionAvailabilityResolver`.
enum ExerciseResolution: Sendable, Equatable {
    /// The exercise's own equipment requirement is satisfied — nothing changes.
    case original(Exercise)
    /// The requirement isn't satisfied, but a documented substitution exists.
    case substituted(original: Exercise, replacement: Exercise, equivalence: EquivalenceLevel, note: String)
    /// The requirement isn't satisfied and no reliable substitution exists
    /// (or the exercise's equipment requirement isn't documented at all).
    case unavailable(reason: String)
}
