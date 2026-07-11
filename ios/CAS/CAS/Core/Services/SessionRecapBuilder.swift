import Foundation

/// An exercise whose best-ever numeric performance was just beaten.
/// Never appears for an exercise's first time logged — beating nothing
/// isn't a record, it's a first attempt.
struct PersonalRecord: Equatable {
    let exerciseName: String
    let newBest: LoadValue
}

/// One exercise's `ProgressionSuggestion`, named for display.
struct ExerciseProgressionRecap: Equatable {
    let exerciseName: String
    let suggestion: ProgressionSuggestion
}

/// Alpha 1.1, item 6's end-of-session numbers. Every count here comes
/// straight from `setLogs`; `volumeKg` follows the same "only when a
/// real number exists" rule as `TrainingSession.estimatedVolumeKg`, just
/// computed from what was actually performed instead of what was
/// planned.
struct SessionRecap: Equatable {
    let exerciseCount: Int
    let setCount: Int
    let totalReps: Int
    let volumeKg: Double?
    let personalRecords: [PersonalRecord]
    let progressionSuggestions: [ExerciseProgressionRecap]
}

/// Builds a `SessionRecap` from the just-completed session's logs plus
/// history for comparison. Must be called before `historyStore.save()`
/// persists this session — otherwise `bestPerformance` would compare the
/// session against itself. `SessionSummaryViewModel` builds it at init,
/// before `save()` can run.
@MainActor
enum SessionRecapBuilder {
    static func build(setLogs: [SetLog], historyStore: SessionHistoryStore) -> SessionRecap {
        let exerciseNames = orderedDistinctNames(setLogs)
        let totalReps = setLogs.compactMap { RepCount.parse($0.actualReps) }.reduce(0, +)

        let volumeContributions = setLogs.compactMap { set -> Double? in
            guard
                let (value, unit) = set.actualLoadValue.volumeContribution,
                let reps = RepCount.parse(set.actualReps)
            else {
                return nil
            }
            return value * unit.kilogramsPerUnit * Double(reps)
        }
        let volumeKg = volumeContributions.isEmpty ? nil : volumeContributions.reduce(0, +)

        var personalRecords: [PersonalRecord] = []
        var progressionSuggestions: [ExerciseProgressionRecap] = []

        for name in exerciseNames {
            let setsForExercise = setLogs.filter { $0.exerciseName == name }
            progressionSuggestions.append(
                ExerciseProgressionRecap(exerciseName: name, suggestion: ExerciseProgressionAdvisor.suggestion(for: setsForExercise))
            )

            if let record = personalRecord(forExerciseNamed: name, setsForExercise: setsForExercise, historyStore: historyStore) {
                personalRecords.append(record)
            }
        }

        return SessionRecap(
            exerciseCount: exerciseNames.count,
            setCount: setLogs.count,
            totalReps: totalReps,
            volumeKg: volumeKg,
            personalRecords: personalRecords,
            progressionSuggestions: progressionSuggestions
        )
    }

    private static func personalRecord(
        forExerciseNamed name: String,
        setsForExercise: [SetLog],
        historyStore: SessionHistoryStore
    ) -> PersonalRecord? {
        let bestThisSession = setsForExercise
            .compactMap { set -> (LoadValue, Double)? in
                guard let anchor = set.actualLoadValue.progressionAnchor else { return nil }
                return (set.actualLoadValue, anchor.value * anchor.unit.kilogramsPerUnit)
            }
            .max { $0.1 < $1.1 }

        guard let bestThisSession else { return nil }
        // No prior best at all isn't a record broken — it's a first
        // attempt with nothing to compare against.
        guard
            let priorBest = historyStore.bestPerformance(ofExerciseNamed: name),
            let priorAnchor = priorBest.actualLoadValue.progressionAnchor
        else {
            return nil
        }

        let priorKg = priorAnchor.value * priorAnchor.unit.kilogramsPerUnit
        guard bestThisSession.1 > priorKg else { return nil }
        return PersonalRecord(exerciseName: name, newBest: bestThisSession.0)
    }

    private static func orderedDistinctNames(_ setLogs: [SetLog]) -> [String] {
        var seen = Set<String>()
        var order: [String] = []
        for log in setLogs where !seen.contains(log.exerciseName) {
            seen.insert(log.exerciseName)
            order.append(log.exerciseName)
        }
        return order
    }
}
