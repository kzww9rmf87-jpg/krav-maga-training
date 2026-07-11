import Foundation
import SwiftData

/// Where completed sessions are saved and read back from. ViewModels
/// depend on this protocol, never on `ModelContext` directly — SwiftData
/// stays an implementation detail of `Core/Persistence`.
@MainActor
protocol SessionHistoryStore {
    func save(_ log: SessionLog) throws
    func recentLogs(limit: Int) -> [SessionLog]
    /// The sets logged for this exercise the last time it was performed
    /// (most recent `SessionLog` that contains it), in that session's
    /// order. Alpha 1.1, item 4 — shown under the exercise during
    /// execution, whatever kind of `LoadValue` it used (qualitative and
    /// custom text included: this is a textual history, not a
    /// calculation). `nil` when the exercise has never been logged.
    func lastPerformance(ofExerciseNamed exerciseName: String) -> [SetLog]?
    /// The single best-ever numeric performance for this exercise across
    /// all history — only ever considers sets whose `LoadValue` carries a
    /// reliable number (`progressionAnchor`); qualitative and custom
    /// loads never contribute one, so this is `nil` for an exercise
    /// that's only ever been logged that way.
    func bestPerformance(ofExerciseNamed exerciseName: String) -> SetLog?
}

@MainActor
final class SwiftDataSessionHistoryStore: SessionHistoryStore {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func save(_ log: SessionLog) throws {
        // Insert every SetLog explicitly rather than relying on SwiftData
        // to cascade-insert new (not-yet-tracked) relationship children —
        // that cascade proved intermittent on a persistent store: the same
        // code sometimes persisted all sets, sometimes none, with no
        // observable difference in the object graph being saved.
        // Explicit insertion is deterministic.
        for setLog in log.sets {
            context.insert(setLog)
        }
        context.insert(log)
        try context.save()
    }

    func recentLogs(limit: Int) -> [SessionLog] {
        var descriptor = FetchDescriptor<SessionLog>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        descriptor.fetchLimit = limit
        return (try? context.fetch(descriptor)) ?? []
    }

    func lastPerformance(ofExerciseNamed exerciseName: String) -> [SetLog]? {
        let descriptor = FetchDescriptor<SessionLog>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        guard let logs = try? context.fetch(descriptor) else { return nil }
        for log in logs {
            let matching = log.sets.filter { $0.exerciseName == exerciseName }
            if !matching.isEmpty {
                return matching
            }
        }
        return nil
    }

    func bestPerformance(ofExerciseNamed exerciseName: String) -> SetLog? {
        let descriptor = FetchDescriptor<SetLog>(
            predicate: #Predicate { $0.exerciseName == exerciseName }
        )
        guard let sets = try? context.fetch(descriptor) else { return nil }
        return sets
            .compactMap { set -> (SetLog, Double)? in
                guard let anchor = set.actualLoadValue.progressionAnchor else { return nil }
                return (set, anchor.value * anchor.unit.kilogramsPerUnit)
            }
            .max { $0.1 < $1.1 }?
            .0
    }
}
