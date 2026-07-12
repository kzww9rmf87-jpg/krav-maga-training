import Foundation

/// Describes the quality of a substitution that was actually proposed —
/// there is no case for "no reliable equivalence exists": that outcome is
/// the absence of a substitution (`ExerciseResolution.unavailable`), not a
/// level of one.
enum EquivalenceLevel: String, Codable, Sendable, Equatable {
    /// Automatic substitution is allowed — never flagged as a compromise.
    case strong
    /// A substitution may be offered, but must always be surfaced to the
    /// athlete as a compromise, never applied silently.
    case partial
}
