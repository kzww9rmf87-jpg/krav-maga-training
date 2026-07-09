import Foundation
import SwiftData
import Testing
@testable import CAS

@MainActor
struct EndToEndFlowTests {

    @Test func walkingSeanceAEndToEndPersistsAllTwentyFiveSetLogs() throws {
        let session = SeanceA.session
        let viewModel = SessionExecutionViewModel(session: session)

        var finished: [SetLog]?
        viewModel.onFinish = { finished = $0 }

        while finished == nil {
            viewModel.advance()
            if viewModel.isResting {
                viewModel.finishResting()
            }
        }

        let logs = try #require(finished)
        #expect(logs.count == 25) // 26 steps, 1 freeText ("Finition") has no SetLog

        let context = ModelContext(PersistenceController.makeContainer(inMemory: true))
        let store = SwiftDataSessionHistoryStore(context: context)
        let summaryViewModel = SessionSummaryViewModel(session: session, setLogs: logs, historyStore: store)
        summaryViewModel.save()

        let fetched = store.recentLogs(limit: 10)
        #expect(fetched.count == 1)
        #expect(fetched[0].sets.count == 25)
    }
}
