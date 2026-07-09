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
