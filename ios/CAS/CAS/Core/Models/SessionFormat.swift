import Foundation

/// How a session's exercises are organized. This is the extension point
/// requested for Sprint 1: the execution engine (`SessionExecutionViewModel`
/// and its views) depends only on `[ExecutionStep]`, produced by
/// `makeSteps()`. Adding a future format (EMOM, AMRAP, intervals,
/// complexes...) means adding one case here and one branch in
/// `makeSteps()` — nothing in `Features/SessionExecution` changes.
enum SessionFormat: Codable, Hashable, Sendable {
    /// Sets and reps, organized in warm-up/work/option groups per
    /// exercise (séances A, B, D, Bras).
    case standard(exercises: [SessionExercise])
    /// A fixed list of exercises chained with no rest, repeated for a
    /// number of rounds with rest only between rounds (séance C).
    case circuit(CircuitSpec)
}

extension SessionFormat {
    func makeSteps() -> [ExecutionStep] {
        switch self {
        case .standard(let exercises):
            return exercises.flatMap { $0.makeSteps() }
        case .circuit(let spec):
            return spec.makeSteps()
        }
    }
}
