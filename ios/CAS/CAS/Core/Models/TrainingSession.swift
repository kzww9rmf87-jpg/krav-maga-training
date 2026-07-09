import Foundation

/// A training session: identity plus a `SessionFormat`. See
/// `20-engine/01_MODULE_ENGINE.md`: a training session's objective is to
/// maximize useful adaptation, not to maximize fatigue.
struct TrainingSession: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let title: String
    let subtitle: String
    let format: SessionFormat

    /// The ordered steps the execution engine walks through, whatever the
    /// underlying format. See `SessionFormat.makeSteps()`.
    var steps: [ExecutionStep] { format.makeSteps() }
}

extension TrainingSession {
    /// A rough estimate for Home's "how long will it take?" (UX.md) —
    /// not a scientific claim, and deliberately not a per-session
    /// hand-authored number either (that would just be a different kind
    /// of fragile magic constant, drifting silently if a session's sets
    /// change later). Instead it's computed from data already in
    /// `steps`: the actual prescribed rest time is real, concrete data;
    /// on top of that, `assumedSecondsPerStep` is one disclosed,
    /// intentionally rough assumption for the time spent actually doing
    /// each step (loading a weight, performing the reps). Nothing in CAS
    /// measures real execution time yet — this should be revisited once
    /// `SessionLog` start/end timestamps give us actual data instead of
    /// a guess.
    private static let assumedSecondsPerStep = 30

    var estimatedDurationMinutes: Int {
        let restSeconds = steps.compactMap(\.restAfter?.seconds).reduce(0, +)
        let executionSeconds = steps.count * Self.assumedSecondsPerStep
        let totalMinutes = (restSeconds + executionSeconds) / 60
        // Rounded to the nearest 5 minutes — a precise-looking number
        // would overstate the confidence of this estimate.
        return max(5, (totalMinutes + 2) / 5 * 5)
    }
}
