import Foundation
import Observation

/// UX.md wants Home to answer "what should I do today?" with one card.
/// Without a Decision Engine, CAS cannot yet make that call — so, honestly,
/// Home shows the list of real sessions instead. `SessionRepository` is the
/// seam: when the Decision Engine exists, a different implementation picks
/// one session (or ranks them), and this ViewModel doesn't change.
@MainActor
@Observable
final class HomeViewModel {
    private(set) var sessions: [TrainingSession]

    init(repository: SessionRepository = SeedSessionRepository()) {
        self.sessions = repository.allSessions()
    }
}
