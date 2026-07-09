import Foundation
import Observation

/// UX.md wants Home to answer "what should I do today?" with one card.
/// Sprint 2: Home shows a single recommendation from
/// `SessionRecommendationService` — a fixed rotation placeholder, not the
/// real Decision Engine (see that protocol's doc comment). `sessions` is
/// kept only for the secondary "Toutes les séances" escape hatch.
///
/// `recommendation` takes the last completed session id as a parameter
/// rather than reading `SessionHistoryStore` itself, so this ViewModel
/// stays a pure function of its inputs — no SwiftData dependency, fully
/// testable. `HomeView` supplies that id from a `@Query`, the same
/// pattern `HistoryView` already uses for read-only SwiftData access.
@MainActor
@Observable
final class HomeViewModel {
    private(set) var sessions: [TrainingSession]
    private let recommendationService: SessionRecommendationService

    init(
        repository: SessionRepository = SeedSessionRepository(),
        recommendationService: SessionRecommendationService = RotationRecommendationService()
    ) {
        self.sessions = repository.allSessions()
        self.recommendationService = recommendationService
    }

    func recommendation(afterLastCompletedSessionId lastCompletedSessionId: String?) -> SessionRecommendation? {
        recommendationService.recommend(lastCompletedSessionId: lastCompletedSessionId)
    }
}
