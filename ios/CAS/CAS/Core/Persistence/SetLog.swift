import Foundation
import SwiftData

/// The athlete's actual performance on one set, persisted. Pre-filled with
/// the planned load/reps when a `SessionExecutionView` step is reached,
/// then editable — the native equivalent of the web prototype's Carnet,
/// integrated into the execution flow instead of a separate free-text log.
///
/// This is the only place `SetGroupKind` (a plain `Core/Models` enum)
/// meets SwiftData — that's fine: `Core/Persistence` is allowed to depend
/// on `Core/Models`, just never the other way around.
@Model
final class SetLog {
    var id: UUID
    var exerciseName: String
    var groupKind: SetGroupKind
    var label: String?
    var plannedLoad: String
    var plannedReps: String
    var actualLoad: String
    var actualReps: String
    var completed: Bool

    init(
        id: UUID = UUID(),
        exerciseName: String,
        groupKind: SetGroupKind,
        label: String? = nil,
        plannedLoad: String,
        plannedReps: String,
        actualLoad: String? = nil,
        actualReps: String? = nil,
        completed: Bool = false
    ) {
        self.id = id
        self.exerciseName = exerciseName
        self.groupKind = groupKind
        self.label = label
        self.plannedLoad = plannedLoad
        self.plannedReps = plannedReps
        self.actualLoad = actualLoad ?? plannedLoad
        self.actualReps = actualReps ?? plannedReps
        self.completed = completed
    }
}

extension SetLog {
    /// Builds a pre-filled, not-yet-completed log entry from a plan step.
    /// `ExecutionStep` covers both standard sets and circuit passes, but
    /// only `.setRow` steps carry a load/reps pair worth logging —
    /// `.freeText` steps (a circuit round, "5 min de sac de frappe") are
    /// displayed and rested-after like any other step, they just have
    /// nothing numeric for the athlete to record.
    convenience init?(step: ExecutionStep) {
        guard case .setRow(let load, let reps) = step.instruction else { return nil }
        self.init(
            exerciseName: step.exerciseName,
            groupKind: step.groupKind,
            label: step.label,
            plannedLoad: load,
            plannedReps: reps
        )
    }
}
