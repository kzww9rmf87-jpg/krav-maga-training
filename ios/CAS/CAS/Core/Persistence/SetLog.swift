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
    /// Stored as `LoadValue.encoded` strings, not the enum directly —
    /// deliberately keeps this column's name and type exactly as they
    /// were before Alpha 1.1's structured load model, so nothing here
    /// requires a SwiftData schema migration. Every `SetLog` already
    /// saved on a real device decodes through `plannedLoadValue`/
    /// `actualLoadValue` below; anything written before `LoadValue`
    /// existed degrades to `.custom(text:)` automatically.
    var plannedLoad: String
    var plannedReps: String
    var actualLoad: String
    var actualReps: String
    var completed: Bool
    /// Inverse of `SessionLog.sets`. Required for SwiftData to reliably
    /// cascade-insert new SetLog instances when their parent SessionLog is
    /// saved to a persistent (on-disk) store — without it, an in-memory
    /// store can appear to work in tests while the real store silently
    /// drops the children.
    var session: SessionLog?

    /// The `LoadValue` view onto `plannedLoad`/`actualLoad`. Everything
    /// outside this file should read/write these, not the raw strings.
    var plannedLoadValue: LoadValue {
        get { LoadValue(decoding: plannedLoad) }
        set { plannedLoad = newValue.encoded }
    }

    var actualLoadValue: LoadValue {
        get { LoadValue(decoding: actualLoad) }
        set { actualLoad = newValue.encoded }
    }

    init(
        id: UUID = UUID(),
        exerciseName: String,
        groupKind: SetGroupKind,
        label: String? = nil,
        plannedLoad: LoadValue,
        plannedReps: String,
        actualLoad: LoadValue? = nil,
        actualReps: String? = nil,
        completed: Bool = false
    ) {
        self.id = id
        self.exerciseName = exerciseName
        self.groupKind = groupKind
        self.label = label
        self.plannedLoad = plannedLoad.encoded
        self.plannedReps = plannedReps
        self.actualLoad = (actualLoad ?? plannedLoad).encoded
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
