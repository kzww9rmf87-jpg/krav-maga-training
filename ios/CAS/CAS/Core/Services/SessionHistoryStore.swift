import Foundation
import SwiftData

/// Where completed sessions are saved and read back from. ViewModels
/// depend on this protocol, never on `ModelContext` directly — SwiftData
/// stays an implementation detail of `Core/Persistence`.
@MainActor
protocol SessionHistoryStore {
    func save(_ log: SessionLog) throws
    func recentLogs(limit: Int) -> [SessionLog]
}

@MainActor
final class SwiftDataSessionHistoryStore: SessionHistoryStore {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func save(_ log: SessionLog) throws {
        context.insert(log)
        try context.save()
    }

    func recentLogs(limit: Int) -> [SessionLog] {
        var descriptor = FetchDescriptor<SessionLog>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        descriptor.fetchLimit = limit
        return (try? context.fetch(descriptor)) ?? []
    }
}
