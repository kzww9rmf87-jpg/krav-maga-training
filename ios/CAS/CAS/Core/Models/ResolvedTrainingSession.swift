import Foundation

/// A `TrainingSession` after equipment resolution, plus the full trace of
/// what was substituted to get there. `substitutions` only ever contains
/// entries for exercises that were actually changed — an exercise left as
/// `.original` has nothing to trace and doesn't appear here.
struct ResolvedTrainingSession: Sendable, Equatable {
    let session: TrainingSession
    let substitutions: [AppliedSubstitution]
}
