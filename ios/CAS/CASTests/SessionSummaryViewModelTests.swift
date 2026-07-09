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
        TrainingSession(id: "seance-a", title: "Séance A", subtitle: "", format: .standard(exercises: []))
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

    @Test func aStorageFailureSurfacesAnErrorInsteadOfCrashing() {
        let store = FakeSessionHistoryStore()
        store.shouldThrow = true
        let viewModel = SessionSummaryViewModel(session: makeSession(), setLogs: [], historyStore: store)

        viewModel.save()

        #expect(viewModel.isSaved == false)
        #expect(viewModel.saveError != nil)
    }
}
