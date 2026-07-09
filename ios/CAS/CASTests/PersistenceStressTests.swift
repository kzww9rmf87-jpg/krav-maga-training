import Foundation
import SwiftData
import Testing
@testable import CAS

/// Reproduces the exact condition that exposed the original bug: an
/// on-disk (not in-memory) store, saved from one context, then read back
/// from a completely fresh context/container pointing at the same file —
/// simulating an app relaunch. In-memory containers didn't catch the
/// original cascade-insert race; this does.
@MainActor
struct PersistenceStressTests {

    private func makeOnDiskContainer(at url: URL) -> ModelContainer {
        let schema = Schema([SessionLog.self, SetLog.self])
        let configuration = ModelConfiguration(schema: schema, url: url)
        return try! ModelContainer(for: schema, configurations: [configuration])
    }

    @Test func savingAndRereadingFromAFreshContextNeverDropsSets() throws {
        let storeURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("stress-\(UUID().uuidString).store")
        defer {
            try? FileManager.default.removeItem(at: storeURL)
            try? FileManager.default.removeItem(at: storeURL.appendingPathExtension("shm"))
            try? FileManager.default.removeItem(at: storeURL.appendingPathExtension("wal"))
        }

        for iteration in 0..<20 {
            // Fresh container each time, exactly like a new app launch.
            let writeContainer = makeOnDiskContainer(at: storeURL)
            let writeContext = ModelContext(writeContainer)
            let store = SwiftDataSessionHistoryStore(context: writeContext)

            let setLogs = (0..<5).map { i in
                SetLog(exerciseName: "Exercise \(i)", groupKind: .work, plannedLoad: "10kg", plannedReps: "10")
            }
            let log = SessionLog(
                sessionId: "stress-\(iteration)",
                sessionTitle: "Stress \(iteration)",
                energyBefore: 3,
                difficulty: 3,
                pain: false,
                sets: setLogs
            )
            try store.save(log)

            // Fresh container again to read back — no shared in-memory state.
            let readContainer = makeOnDiskContainer(at: storeURL)
            let readContext = ModelContext(readContainer)
            let descriptor = FetchDescriptor<SessionLog>(
                predicate: #Predicate { $0.sessionId == "stress-\(iteration)" }
            )
            let fetched = try readContext.fetch(descriptor)
            #expect(fetched.count == 1, "iteration \(iteration): session not found")
            #expect(fetched.first?.sets.count == 5, "iteration \(iteration): expected 5 sets, got \(fetched.first?.sets.count ?? -1)")
        }
    }
}
