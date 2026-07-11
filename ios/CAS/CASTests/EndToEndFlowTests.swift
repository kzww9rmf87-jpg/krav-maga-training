import Foundation
import SwiftData
import Testing
@testable import CAS

@MainActor
struct EndToEndFlowTests {

    @Test func walkingSeanceAEndToEndPersistsAllTwentyFiveSetLogs() throws {
        let session = SeanceA.session
        // Fake notification scheduler — RestTimerService()'s default
        // reaches the real UNUserNotificationCenter, which crashes the
        // unit test host across ~26 steps' worth of rest periods.
        let viewModel = SessionExecutionViewModel(
            session: session,
            restTimer: RestTimerService(notificationScheduler: FakeRestNotificationScheduler())
        )

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
