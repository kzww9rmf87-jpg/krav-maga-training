import Foundation
import SwiftData
import Testing
@testable import CAS

@MainActor
struct SessionHistoryStoreTests {

    private func makeStore() -> SwiftDataSessionHistoryStore {
        let context = ModelContext(PersistenceController.makeContainer(inMemory: true))
        return SwiftDataSessionHistoryStore(context: context)
    }

    @Test func savedLogsAreReturnedMostRecentFirst() throws {
        let store = makeStore()
        let older = SessionLog(
            sessionId: "seance-a", sessionTitle: "A", date: Date(timeIntervalSinceNow: -3600),
            energyBefore: 3, difficulty: 3, pain: false
        )
        let newer = SessionLog(
            sessionId: "seance-b", sessionTitle: "B", date: Date(),
            energyBefore: 4, difficulty: 4, pain: false
        )
        try store.save(older)
        try store.save(newer)

        let logs = store.recentLogs(limit: 10)
        #expect(logs.map(\.sessionId) == ["seance-b", "seance-a"])
    }

    @Test func recentLogsRespectsTheLimit() throws {
        let store = makeStore()
        for i in 0..<5 {
            try store.save(SessionLog(
                sessionId: "seance-a", sessionTitle: "A", date: Date(timeIntervalSinceNow: Double(i)),
                energyBefore: 3, difficulty: 3, pain: false
            ))
        }
        #expect(store.recentLogs(limit: 2).count == 2)
    }

    @Test func lastPerformanceReturnsSetsFromTheMostRecentSessionOnly() throws {
        let store = makeStore()
        try store.save(SessionLog(
            sessionId: "seance-a", sessionTitle: "A", date: Date(timeIntervalSinceNow: -3600),
            energyBefore: 3, difficulty: 3, pain: false,
            sets: [SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 60, unit: .kg), plannedReps: "8")]
        ))
        try store.save(SessionLog(
            sessionId: "seance-a", sessionTitle: "A", date: Date(),
            energyBefore: 3, difficulty: 3, pain: false,
            sets: [SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 62.5, unit: .kg), plannedReps: "8")]
        ))

        let last = try #require(store.lastPerformance(ofExerciseNamed: "Squat"))
        #expect(last.count == 1)
        #expect(last[0].actualLoadValue == .weighted(value: 62.5, unit: .kg))
    }

    @Test func lastPerformanceReturnsNilForAnUnknownExercise() {
        let store = makeStore()
        #expect(store.lastPerformance(ofExerciseNamed: "Never logged") == nil)
    }

    @Test func bestPerformanceFindsTheHighestNumericLoadAcrossSessions() throws {
        let store = makeStore()
        try store.save(SessionLog(
            sessionId: "seance-a", sessionTitle: "A", date: Date(timeIntervalSinceNow: -3600),
            energyBefore: 3, difficulty: 3, pain: false,
            sets: [SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 80, unit: .kg), plannedReps: "5")]
        ))
        try store.save(SessionLog(
            sessionId: "seance-a", sessionTitle: "A", date: Date(),
            energyBefore: 3, difficulty: 3, pain: false,
            sets: [SetLog(exerciseName: "Squat", groupKind: .work, plannedLoad: .weighted(value: 70, unit: .kg), plannedReps: "5")]
        ))

        let best = try #require(store.bestPerformance(ofExerciseNamed: "Squat"))
        #expect(best.actualLoadValue == .weighted(value: 80, unit: .kg))
    }

    @Test func bestPerformanceIgnoresQualitativeAndCustomLoads() throws {
        let store = makeStore()
        try store.save(SessionLog(
            sessionId: "seance-a", sessionTitle: "A", date: Date(),
            energyBefore: 3, difficulty: 3, pain: false,
            sets: [SetLog(exerciseName: "Farmer carry", groupKind: .work, plannedLoad: .qualitative(.heavy), plannedReps: "30 m")]
        ))
        #expect(store.bestPerformance(ofExerciseNamed: "Farmer carry") == nil)
    }
}
