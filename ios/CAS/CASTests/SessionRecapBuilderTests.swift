import Foundation
import Testing
@testable import CAS

@MainActor
private final class FakeHistoryStore: SessionHistoryStore {
    var priorBestByExercise: [String: SetLog] = [:]

    func save(_ log: SessionLog) throws {}
    func recentLogs(limit: Int) -> [SessionLog] { [] }
    func lastPerformance(ofExerciseNamed exerciseName: String) -> [SetLog]? { nil }
    func bestPerformance(ofExerciseNamed exerciseName: String) -> SetLog? {
        priorBestByExercise[exerciseName]
    }
}

@MainActor
struct SessionRecapBuilderTests {

    @Test func countsExercisesSetsAndReps() {
        let sets = [
            SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 60, unit: .kg), plannedReps: "8", actualReps: "8"),
            SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 60, unit: .kg), plannedReps: "8", actualReps: "6"),
            SetLog(exerciseName: "Rowing", groupKind: .work, plannedLoad: .qualitative(.moderate), plannedReps: "10", actualReps: "10"),
        ]
        let recap = SessionRecapBuilder.build(setLogs: sets, historyStore: FakeHistoryStore())
        #expect(recap.exerciseCount == 2)
        #expect(recap.setCount == 3)
        #expect(recap.totalReps == 24)
    }

    @Test func volumeIsNilWhenNothingIsWeighted() {
        let sets = [SetLog(exerciseName: "Farmer carry", groupKind: .work, plannedLoad: .qualitative(.heavy), plannedReps: "10", actualReps: "10")]
        let recap = SessionRecapBuilder.build(setLogs: sets, historyStore: FakeHistoryStore())
        #expect(recap.volumeKg == nil)
    }

    @Test func volumeSumsWeightedLoadTimesReps() throws {
        let sets = [
            SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 60, unit: .kg), plannedReps: "8", actualLoad: .weighted(value: 60, unit: .kg), actualReps: "8"),
            SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 60, unit: .kg), plannedReps: "8", actualLoad: .weighted(value: 65, unit: .kg), actualReps: "5"),
        ]
        let recap = SessionRecapBuilder.build(setLogs: sets, historyStore: FakeHistoryStore())
        let volume = try #require(recap.volumeKg)
        #expect(abs(volume - 805.0) < 0.001)
    }

    @Test func personalRecordFiresWhenThisSessionBeatsThePriorBest() {
        let store = FakeHistoryStore()
        store.priorBestByExercise["Squat"] = SetLog(
            exerciseName: "Squat", groupKind: .work,
            plannedLoad: .weighted(value: 80, unit: .kg), plannedReps: "5",
            actualLoad: .weighted(value: 80, unit: .kg), actualReps: "5"
        )
        let sets = [
            SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 85, unit: .kg), plannedReps: "5", actualLoad: .weighted(value: 85, unit: .kg), actualReps: "5"),
        ]
        let recap = SessionRecapBuilder.build(setLogs: sets, historyStore: store)
        #expect(recap.personalRecords == [PersonalRecord(exerciseName: "Squat", newBest: .weighted(value: 85, unit: .kg))])
    }

    @Test func noRecordWhenThisSessionDoesNotBeatThePriorBest() {
        let store = FakeHistoryStore()
        store.priorBestByExercise["Squat"] = SetLog(
            exerciseName: "Squat", groupKind: .work,
            plannedLoad: .weighted(value: 80, unit: .kg), plannedReps: "5",
            actualLoad: .weighted(value: 80, unit: .kg), actualReps: "5"
        )
        let sets = [
            SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 75, unit: .kg), plannedReps: "5", actualLoad: .weighted(value: 75, unit: .kg), actualReps: "5"),
        ]
        let recap = SessionRecapBuilder.build(setLogs: sets, historyStore: store)
        #expect(recap.personalRecords.isEmpty)
    }

    @Test func firstTimePerformingAnExerciseIsNeverARecord() {
        // No prior best exists — beating nothing isn't a record.
        let sets = [SetLog(exerciseName: "New exercise", groupKind: .work, plannedLoad: .weighted(value: 20, unit: .kg), plannedReps: "10", actualLoad: .weighted(value: 20, unit: .kg), actualReps: "10")]
        let recap = SessionRecapBuilder.build(setLogs: sets, historyStore: FakeHistoryStore())
        #expect(recap.personalRecords.isEmpty)
    }

    @Test func qualitativeExercisesNeverProduceARecord() {
        let store = FakeHistoryStore()
        let sets = [SetLog(exerciseName: "Farmer carry", groupKind: .work, plannedLoad: .qualitative(.heavy), plannedReps: "10", actualReps: "10")]
        let recap = SessionRecapBuilder.build(setLogs: sets, historyStore: store)
        #expect(recap.personalRecords.isEmpty)
    }

    @Test func progressionSuggestionsCoverEachDistinctExerciseInOrder() {
        let sets = [
            SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 60, unit: .kg), plannedReps: "8", actualLoad: .weighted(value: 60, unit: .kg), actualReps: "8"),
            SetLog(exerciseName: "Rowing", groupKind: .work, plannedLoad: .qualitative(.moderate), plannedReps: "8", actualReps: "8"),
            SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 60, unit: .kg), plannedReps: "8", actualLoad: .weighted(value: 60, unit: .kg), actualReps: "8"),
        ]
        let recap = SessionRecapBuilder.build(setLogs: sets, historyStore: FakeHistoryStore())
        #expect(recap.progressionSuggestions.map(\.exerciseName) == ["Squat", "Rowing"])
        #expect(recap.progressionSuggestions[0].suggestion == .increase(.weighted(value: 62.5, unit: .kg)))
        #expect(recap.progressionSuggestions[1].suggestion == .hold(.qualitative(.moderate)))
    }
}
