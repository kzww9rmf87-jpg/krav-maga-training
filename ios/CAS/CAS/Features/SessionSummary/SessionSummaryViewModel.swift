import Foundation
import Observation

/// UX.md "Session Completion": ask only the minimum needed to improve
/// future decisions — energy before, difficulty, pain, comment. Nothing
/// more.
@MainActor
@Observable
final class SessionSummaryViewModel {
    private let session: TrainingSession
    private let setLogs: [SetLog]
    private let historyStore: SessionHistoryStore

    var energyBefore = 3
    var difficulty = 3
    var pain = false
    var painNote = ""
    var comment = ""
    private(set) var isSaved = false
    private(set) var saveError: String?

    init(session: TrainingSession, setLogs: [SetLog], historyStore: SessionHistoryStore) {
        self.session = session
        self.setLogs = setLogs
        self.historyStore = historyStore
    }

    func save() {
        // Idempotent on purpose: setLogs are shared, already-tracked SetLog
        // instances once historyStore.save() runs once. A second call
        // (e.g. a double tap on "Terminer" before the sheet dismisses)
        // would build a second SessionLog reusing those same SetLog
        // instances — since SetLog.session is a to-one inverse, that
        // reassigns each set away from the first SessionLog, silently
        // emptying it. Guarding here is cheaper and more certain than
        // trying to make every possible double-submission path race-free.
        guard !isSaved else { return }
        let log = SessionLog(
            sessionId: session.id,
            sessionTitle: session.title,
            energyBefore: energyBefore,
            difficulty: difficulty,
            pain: pain,
            painNote: pain && !painNote.isEmpty ? painNote : nil,
            comment: comment.isEmpty ? nil : comment,
            sets: setLogs
        )
        do {
            try historyStore.save(log)
            isSaved = true
        } catch {
            saveError = "Impossible d'enregistrer la séance. Réessaie."
        }
    }
}
