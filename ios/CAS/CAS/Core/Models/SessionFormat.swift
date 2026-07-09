import Foundation

/// How a session's exercises are organized. This is the extension point
/// requested for Sprint 1: the execution engine (`SessionExecutionViewModel`
/// and its views) depends only on `[ExecutionStep]`, produced by
/// `makeSteps()`. Adding a future format (EMOM, AMRAP, intervals,
/// complexes...) means adding one case here and one branch in
/// `makeSteps()` — nothing in `Features/SessionExecution` changes.
///
/// Sprint 1.5: both cases are now expressed in terms of Capability
/// Modules rather than raw exercises — see `20-engine/01_MODULE_ENGINE.md`.
/// A session is an assembly of modules; it does not own exercises
/// directly.
enum SessionFormat: Codable, Hashable, Sendable {
    /// An ordered assembly of Capability Modules, each implemented by a
    /// set of exercises (séances A, B, D, Bras).
    case standard(modules: [SessionModule])
    /// A fixed list of exercises chained with no rest, repeated for a
    /// number of rounds with rest only between rounds, all implementing
    /// a single Capability Module (séance C — the circuit isn't
    /// decomposed into several modules in the source data).
    case circuit(module: CapabilityModule, spec: CircuitSpec)
}

extension SessionFormat {
    func makeSteps() -> [ExecutionStep] {
        switch self {
        case .standard(let modules):
            return modules.flatMap { $0.makeSteps() }
        case .circuit(_, let spec):
            return spec.makeSteps()
        }
    }
}
