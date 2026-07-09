import Foundation

/// A training session: identity plus a `SessionFormat`. See
/// `20-engine/01_MODULE_ENGINE.md`: a training session's objective is to
/// maximize useful adaptation, not to maximize fatigue.
struct TrainingSession: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let title: String
    let subtitle: String
    let format: SessionFormat
    /// The dominant real-world action this session trains — see
    /// `10-science/03_ACTION_CAPABILITIES.md` ("a capacity is always
    /// expressed as a verb"). Free text, like `subtitle`: no `Capability`
    /// type exists in the engine (see `01_MODULE_ENGINE.md`'s Capability
    /// vs Capability Module note) — Home's card is this field's only
    /// consumer today, and a single display string is all that needs.
    /// Defaults to empty for sessions authored before Sprint 3 (the
    /// legacy A/B/C/D/Bras content), which were never designed around an
    /// Action Capability and aren't shown on Home anymore anyway.
    let primaryActionCapability: String

    init(
        id: String,
        title: String,
        subtitle: String,
        format: SessionFormat,
        primaryActionCapability: String = ""
    ) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.format = format
        self.primaryActionCapability = primaryActionCapability
    }

    /// The ordered steps the execution engine walks through, whatever the
    /// underlying format. See `SessionFormat.makeSteps()`.
    var steps: [ExecutionStep] { format.makeSteps() }

    /// The Capability Modules this session assembles, in order — see
    /// `01_MODULE_ENGINE.md`: "a training session is an ordered
    /// collection of Capability Modules." Shown on Home (Sprint 3).
    var moduleNames: [String] {
        switch format {
        case .standard(let modules):
            return modules.map { $0.module.name }
        case .circuit(let module, _):
            return [module.name]
        }
    }
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
        let executionSeconds = steps.reduce(0) { $0 + Self.executionSeconds(for: $1) }
        let totalMinutes = (restSeconds + executionSeconds) / 60
        // Rounded to the nearest 5 minutes — a precise-looking number
        // would overstate the confidence of this estimate.
        return max(5, (totalMinutes + 2) / 5 * 5)
    }

    /// Most steps get the flat `assumedSecondsPerStep` guess. A `.freeText`
    /// step (Sprint 3: how Conditioning/Recovery duration blocks like
    /// "15-20 min, zone 2" are represented — see
    /// `CASBaseAerobie.swift`) can describe a much longer continuous
    /// effort than a normal set; reusing `RestAfter.parse` against that
    /// same text catches the stated duration instead of silently
    /// underestimating it by 30 seconds. Not a new type — just applying
    /// the parser this file already depends on to one more piece of free
    /// text it happens to describe.
    private static func executionSeconds(for step: ExecutionStep) -> Int {
        guard
            case .freeText(let text) = step.instruction,
            let parsed = RestAfter.parse(text).seconds
        else {
            return assumedSecondsPerStep
        }
        return max(assumedSecondsPerStep, parsed)
    }
}
