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
}
