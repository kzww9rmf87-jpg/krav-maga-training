import Foundation

/// A structured record of one substitution that was actually applied while
/// resolving a session — kept regardless of `equivalence`, so even a
/// strong (silent, non-flagged) substitution stays explainable on demand.
struct AppliedSubstitution: Sendable, Equatable {
    let originalExerciseID: String
    let replacementExerciseID: String
    let equivalence: EquivalenceLevel
    let note: String
}
