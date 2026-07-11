import Foundation

/// One thing the athlete does, in order, during a session — the single
/// seam the execution engine depends on. Every `SessionFormat`, however it
/// is structured internally (sets and reps, a circuit, and later EMOM,
/// AMRAP, intervals, complexes...), expands into a `[ExecutionStep]`.
/// `SessionExecutionViewModel` only ever walks this list; it never
/// switches on session format. Adding a new format later means adding one
/// case to `SessionFormat.makeSteps()` — the execution engine itself does
/// not change.
///
/// Not `Codable`: steps are derived on the fly from a `TrainingSession`,
/// never persisted directly. What gets persisted is the athlete's actual
/// performance (`SetLog`), built from a step at execution time.
struct ExecutionStep: Identifiable, Hashable, Sendable {
    let id: UUID
    let exerciseName: String
    let groupKind: SetGroupKind
    /// Row-level context the source data carries alongside load/reps —
    /// e.g. "1 — Position 6-7", "Explosif", "Tour 2/3". Optional because
    /// most standard sets don't have one.
    let label: String?
    let instruction: StepInstruction
    let coachNote: String?
    let restAfter: RestAfter?

    init(
        id: UUID = UUID(),
        exerciseName: String,
        groupKind: SetGroupKind,
        label: String? = nil,
        instruction: StepInstruction,
        coachNote: String? = nil,
        restAfter: RestAfter? = nil
    ) {
        self.id = id
        self.exerciseName = exerciseName
        self.groupKind = groupKind
        self.label = label
        self.instruction = instruction
        self.coachNote = coachNote
        self.restAfter = restAfter
    }
}

enum StepInstruction: Hashable, Sendable {
    case setRow(load: LoadValue, reps: String)
    case freeText(String)
}

/// The rest guidance that follows a step, kept as the original free text
/// for display plus a best-effort parsed duration for the rest timer.
struct RestAfter: Hashable, Sendable {
    let label: String
    /// `nil` when no duration could be parsed (e.g. "Aucun — enchaîné") —
    /// the execution flow then skips the timer and continues immediately.
    let seconds: Int?

    /// Parses free-text rest guidance such as "3-4 min entre séries
    /// lourdes" or "90 sec". Ranges use their upper bound as the default
    /// countdown — the athlete can always skip early, so overestimating is
    /// the safer default.
    static func parse(_ label: String) -> RestAfter {
        let numbers = label
            .split(whereSeparator: { !$0.isNumber })
            .compactMap { Int($0) }
        guard let maxNumber = numbers.max() else {
            return RestAfter(label: label, seconds: nil)
        }
        let seconds = label.lowercased().contains("min") ? maxNumber * 60 : maxNumber
        return RestAfter(label: label, seconds: seconds)
    }
}
