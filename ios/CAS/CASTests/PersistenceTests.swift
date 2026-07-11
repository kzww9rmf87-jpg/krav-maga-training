import Foundation
import SwiftData
import Testing
@testable import CAS

struct PersistenceTests {

    @MainActor
    private func makeInMemoryContext() -> ModelContext {
        ModelContext(PersistenceController.makeContainer(inMemory: true))
    }

    @Test @MainActor
    func savedSessionLogRoundTripsWithItsSets() throws {
        let context = makeInMemoryContext()
        let log = SessionLog(
            sessionId: "seance-a",
            sessionTitle: "Séance A — Force maximale",
            energyBefore: 4,
            difficulty: 3,
            pain: false,
            sets: [
                SetLog(exerciseName: "Développé-couché mains serrées", groupKind: .work, plannedLoad: .weighted(value: 80, unit: .kg), plannedReps: "5"),
            ]
        )
        context.insert(log)
        try context.save()

        let fetched = try context.fetch(FetchDescriptor<SessionLog>())
        #expect(fetched.count == 1)
        #expect(fetched[0].sets.count == 1)
        #expect(fetched[0].sets[0].actualLoadValue == .weighted(value: 80, unit: .kg))
    }

    @Test @MainActor
    func setLogPrefillsActualValuesFromAnExecutionStep() throws {
        let step = ExecutionStep(
            exerciseName: "Squats partiels",
            groupKind: .work,
            instruction: .setRow(load: .weighted(value: 90, unit: .kg), reps: "6")
        )
        let setLog = try #require(SetLog(step: step))
        #expect(setLog.plannedLoadValue == .weighted(value: 90, unit: .kg))
        #expect(setLog.actualLoadValue == .weighted(value: 90, unit: .kg))
        #expect(setLog.completed == false)
    }

    @Test @MainActor
    func aSetLogStringWrittenBeforeLoadValueExistedDecodesAsCustomText() {
        // Simulates a SetLog saved by a build before Alpha 1.1 — the raw
        // column holds a plain free-text string with no structured
        // encoding prefix. Must never crash and must never be
        // reinterpreted as a number.
        let setLog = SetLog(exerciseName: "Old exercise", groupKind: .work, plannedLoad: .custom("ignored"), plannedReps: "5")
        setLog.plannedLoad = "80kg"
        #expect(setLog.plannedLoadValue == .custom("80kg"))
    }

    @Test func freeTextStepsProduceNoSetLog() {
        let step = ExecutionStep(
            exerciseName: "Finition",
            groupKind: .work,
            instruction: .freeText("5 min de sac de frappe")
        )
        #expect(SetLog(step: step) == nil)
    }

    @Test @MainActor
    func deletingASessionLogCascadesToItsSets() throws {
        let context = makeInMemoryContext()
        let log = SessionLog(
            sessionId: "bras",
            sessionTitle: "Bras (optionnel)",
            energyBefore: 3,
            difficulty: 2,
            pain: false,
            sets: [SetLog(exerciseName: "Hammer curls", groupKind: .work, plannedLoad: .weighted(value: 14, unit: .kg), plannedReps: "10")]
        )
        context.insert(log)
        try context.save()

        context.delete(log)
        try context.save()

        let remainingSets = try context.fetch(FetchDescriptor<SetLog>())
        #expect(remainingSets.isEmpty)
    }
}
