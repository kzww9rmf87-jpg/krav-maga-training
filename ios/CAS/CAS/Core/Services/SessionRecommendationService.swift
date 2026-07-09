import Foundation

/// The recommended session plus the one-line explanation UX.md requires
/// Home to show ("Why today?").
struct SessionRecommendation: Sendable {
    let session: TrainingSession
    let reason: String
}

/// A placeholder for the real Decision Engine described in
/// `20-engine/04_DECISION_ENGINE.md`. That engine reasons over athlete
/// profile, current state, training history and environment through a
/// six-level safety-first hierarchy (Safety → Recovery → Movement Quality
/// → Primary Adaptation → Secondary Adaptations → Performance), selects
/// Capability Modules before exercises, and explains itself. This
/// protocol is deliberately none of that.
///
/// Sprint 2's only goal is to prove Home can be a decision screen (UX.md:
/// "What should I do today? Why today?"), not to build intelligence. Pain,
/// fatigue, physiological cost, module selection and athlete profile are
/// explicitly out of scope — the rule below only ever looks at the id of
/// the last completed session. Naming this type `DecisionEngine` would
/// overclaim what it does; when the real engine described in
/// `04_DECISION_ENGINE.md` is built, it becomes a new implementation of
/// this same protocol (or replaces it), and `Features/Home` doesn't
/// change — the same seam `SessionRepository` already proved in Sprint 1.
protocol SessionRecommendationService: Sendable {
    func recommend(lastCompletedSessionId: String?) -> SessionRecommendation?
}

/// Fixed rotation: A → B → C → D → Bras → A. Not derived from anything
/// physiological — purely "what's next in a fixed list," using
/// `SeedSessionID`'s declaration order as the single source of that
/// order. Falls back to the first session in the rotation when there's
/// no history yet, or when the last completed session isn't part of the
/// rotation (e.g. seed data changed since that session was logged).
struct RotationRecommendationService: SessionRecommendationService {
    private let repository: SessionRepository
    private let order = SeedSessionID.allCases.map(\.rawValue)

    init(repository: SessionRepository = SeedSessionRepository()) {
        self.repository = repository
    }

    func recommend(lastCompletedSessionId: String?) -> SessionRecommendation? {
        let sessions = repository.allSessions()

        guard
            let lastCompletedSessionId,
            let lastIndex = order.firstIndex(of: lastCompletedSessionId),
            let lastSession = sessions.first(where: { $0.id == lastCompletedSessionId })
        else {
            guard let first = sessions.first(where: { $0.id == order[0] }) else { return nil }
            return SessionRecommendation(
                session: first,
                reason: "Aucune séance récente — on commence par \(first.title)."
            )
        }

        let nextId = order[(lastIndex + 1) % order.count]
        guard let next = sessions.first(where: { $0.id == nextId }) else { return nil }
        return SessionRecommendation(
            session: next,
            reason: "Recommandée car votre dernière séance était \(lastSession.title)."
        )
    }
}
