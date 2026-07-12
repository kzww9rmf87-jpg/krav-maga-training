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

    /// Beta 1.0: mandatory-onboarding orchestration. Kept here rather than
    /// as `@State` directly on `HomeView` so the state machine itself —
    /// the `.idle` guard against a duplicate load, the distinction between
    /// "missing" and "failed" — is testable without SwiftUI, the same way
    /// `recommendation(afterLastCompletedSessionId:)` already is.
    private(set) var profileLoadState: AthleteProfileLoadState = .idle

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

    /// No-ops outside `.idle` — called from `HomeView.task`, which can in
    /// principle re-run more than once across the view's lifetime; this is
    /// what actually prevents a second concurrent load or a second
    /// onboarding presentation, not anything on the view side.
    func loadProfileIfNeeded(using store: AthleteProfileStore) {
        guard case .idle = profileLoadState else { return }
        profileLoadState = .loading
        do {
            if let profile = try store.load() {
                profileLoadState = .loaded(profile)
            } else {
                profileLoadState = .missing
            }
        } catch {
            profileLoadState = .failed("Impossible de charger votre profil.")
        }
    }

    /// Explicit re-entry point for the "Réessayer" action on a `.failed`
    /// state — bypasses the `.idle` guard on purpose, since retrying is
    /// exactly what should be allowed from `.failed`.
    func retryLoadingProfile(using store: AthleteProfileStore) {
        profileLoadState = .idle
        loadProfileIfNeeded(using: store)
    }

    /// Called after onboarding or editing finishes successfully. Takes the
    /// just-saved profile directly rather than re-reading the store — the
    /// caller already has the authoritative value, so there's nothing a
    /// fresh SwiftData fetch would add beyond a redundant round trip.
    func profileSaved(_ profile: AthleteProfile) {
        profileLoadState = .loaded(profile)
    }
}
