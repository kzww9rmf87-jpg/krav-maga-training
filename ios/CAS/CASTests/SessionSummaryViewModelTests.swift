import Foundation
import Testing
@testable import CAS

@MainActor
private final class FakeSessionHistoryStore: SessionHistoryStore {
    private(set) var savedLogs: [SessionLog] = []
    var shouldThrow = false

    func save(_ log: SessionLog) throws {
        if shouldThrow {
            throw NSError(domain: "test", code: 1)
        }
        savedLogs.append(log)
    }

    func recentLogs(limit: Int) -> [SessionLog] {
        Array(savedLogs.prefix(limit))
    }
}

@MainActor
struct SessionSummaryViewModelTests {

    private func makeSession() -> TrainingSession {
        TrainingSession(id: "seance-a", title: "Séance A", subtitle: "", format: .standard(modules: []))
    }

    @Test func savingPersistsASessionLogWithTheEnteredFeedback() {
        let store = FakeSessionHistoryStore()
        let viewModel = SessionSummaryViewModel(session: makeSession(), setLogs: [], historyStore: store)
        viewModel.energyBefore = 4
        viewModel.difficulty = 5
        viewModel.pain = true
        viewModel.painNote = "Épaule droite"
        viewModel.comment = "Bonne séance"

        viewModel.save()

        #expect(viewModel.isSaved == true)
        #expect(store.savedLogs.count == 1)
        #expect(store.savedLogs[0].sessionId == "seance-a")
        #expect(store.savedLogs[0].energyBefore == 4)
        #expect(store.savedLogs[0].painNote == "Épaule droite")
        #expect(store.savedLogs[0].comment == "Bonne séance")
    }

    @Test func emptyCommentAndPainNoteAreStoredAsNil() {
        let store = FakeSessionHistoryStore()
        let viewModel = SessionSummaryViewModel(session: makeSession(), setLogs: [], historyStore: store)
        viewModel.save()
        #expect(store.savedLogs[0].comment == nil)
        #expect(store.savedLogs[0].painNote == nil)
    }

    @Test func callingSaveTwiceOnlyPersistsOnce() {
        // A double tap on "Terminer" (or any repeat call) must not build a
        // second SessionLog reusing the same SetLog instances — that would
        // reassign them away from the first SessionLog via the to-one
        // inverse relationship, silently emptying it.
        let store = FakeSessionHistoryStore()
        let setLog = SetLog(exerciseName: "A", groupKind: .work, plannedLoad: .weighted(value: 10, unit: .kg), plannedReps: "10")
        let viewModel = SessionSummaryViewModel(session: makeSession(), setLogs: [setLog], historyStore: store)

        viewModel.save()
        viewModel.save()

        #expect(store.savedLogs.count == 1)
        #expect(store.savedLogs[0].sets.count == 1)
    }

    @Test func aStorageFailureSurfacesAnErrorInsteadOfCrashing() {
        let store = FakeSessionHistoryStore()
        store.shouldThrow = true
        let viewModel = SessionSummaryViewModel(session: makeSession(), setLogs: [], historyStore: store)

        viewModel.save()

        #expect(viewModel.isSaved == false)
        #expect(viewModel.saveError != nil)
    }
}
