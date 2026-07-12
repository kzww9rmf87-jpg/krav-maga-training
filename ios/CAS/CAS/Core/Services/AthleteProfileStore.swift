import Foundation
import SwiftData

/// Where the athlete's profile is saved and read back from. ViewModels
/// depend on this protocol, never on `ModelContext` directly — SwiftData
/// stays an implementation detail of `Core/Persistence`, the same seam
/// `SessionHistoryStore` already established.
///
/// Errors propagate rather than being swallowed: a persistence failure
/// here means the athlete's profile — the one thing a future decision
/// engine reasons from — may not be what the caller thinks it is, which
/// is never safe to paper over with a silent `try?`.
@MainActor
protocol AthleteProfileStore {
    func load() throws -> AthleteProfile?
    func save(_ profile: AthleteProfile) throws
}

/// Enforces "one profile per installation" itself, rather than leaving it
/// as a convention callers have to honor: both `load()` and `save(_:)`
/// route through `resolveSingleton()`, which keeps only the most recently
/// updated record and deletes any others it finds — so even if duplicates
/// were ever created outside this store (a bug, a manual edit, a future
/// migration), the very next read or write cleans them up deterministically.
@MainActor
final class SwiftDataAthleteProfileStore: AthleteProfileStore {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func load() throws -> AthleteProfile? {
        try resolveSingleton()?.profile
    }

    func save(_ profile: AthleteProfile) throws {
        if let existing = try resolveSingleton() {
            // `createdAt` identifies when the profile first came into
            // being, not when this particular save happened — preserved
            // regardless of what the caller's `profile.createdAt` says.
            // `updatedAt` is this store's responsibility to stamp, not the
            // caller's, so it can't be forgotten on a future call site.
            var updated = profile
            updated.createdAt = existing.createdAt
            updated.updatedAt = .now
            existing.profile = updated
        } else {
            context.insert(AthleteProfileRecord(profile: profile))
        }
        try context.save()
    }

    /// Fetches every stored record, most recently updated first. When more
    /// than one exists, every record but the first is deleted — the
    /// context is saved immediately so the cleanup isn't left pending on
    /// whatever `save(_:)`/`load()` does next. Returns the surviving
    /// record, or `nil` when none existed.
    private func resolveSingleton() throws -> AthleteProfileRecord? {
        let descriptor = FetchDescriptor<AthleteProfileRecord>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        let records = try context.fetch(descriptor)
        guard records.count > 1 else { return records.first }

        for duplicate in records.dropFirst() {
            context.delete(duplicate)
        }
        try context.save()
        return records.first
    }
}
