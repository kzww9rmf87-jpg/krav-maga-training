import Foundation

/// The recommended session plus the one-line explanation UX.md requires
/// Home to show ("Why today?"). Carries the already-resolved session
/// (substitutions, if any, already applied) rather than a bare
/// `TrainingSession` — nothing downstream re-resolves it.
struct SessionRecommendation: Sendable {
    let resolved: ResolvedTrainingSession
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
/// Beta 1.0: `availableEquipment` is the one piece of athlete-profile
/// state this placeholder consumes — via `SessionAvailabilityResolver`,
/// never by inventing its own equipment logic. Everything else (pain,
/// fatigue, physiological cost, module selection) stays out of scope.
protocol SessionRecommendationService: Sendable {
    func recommend(lastCompletedSessionId: String?, availableEquipment: Set<Equipment>) -> SessionRecommendation?
}

/// Fixed rotation over CAS V0.1: Force → Puissance → Hypertrophie
/// fonctionnelle → Robustesse → Base aérobie → Force. Not derived from
/// anything physiological — purely "what's next in a fixed list," using
/// `CASSessionID`'s declaration order as the single source of that
/// order.
///
/// Beta 1.0: a candidate the resolver marks `.unavailable` for
/// `availableEquipment` is skipped, never recommended — the rotation
/// order itself never changes, only which candidates in it currently
/// qualify. CAS Puissance is the only candidate ever evaluated with a
/// substitution table (`CASPuissanceSubstitutions`); every other
/// candidate is checked for feasibility only, per the validated
/// audit — substituting for them isn't part of this increment's scope.
struct RotationRecommendationService: SessionRecommendationService {
    private let repository: SessionRepository
    private let order = CASSessionID.allCases.map(\.rawValue)

    init(repository: SessionRepository = SeedSessionRepository()) {
        self.repository = repository
    }

    func recommend(lastCompletedSessionId: String?, availableEquipment: Set<Equipment>) -> SessionRecommendation? {
        let sessions = repository.allSessions()

        let startIndex: Int
        let lastSessionTitle: String?
        if
            let lastCompletedSessionId,
            let lastIndex = order.firstIndex(of: lastCompletedSessionId),
            let lastSession = sessions.first(where: { $0.id == lastCompletedSessionId })
        {
            startIndex = (lastIndex + 1) % order.count
            lastSessionTitle = lastSession.title
        } else {
            startIndex = 0
            lastSessionTitle = nil
        }

        var skippedCount = 0
        for offset in 0..<order.count {
            let index = (startIndex + offset) % order.count
            guard let candidate = sessions.first(where: { $0.id == order[index] }) else { continue }

            let substitutions = candidate.id == CASSessionID.power.rawValue
                ? CASPuissanceSubstitutions.byExerciseId
                : [:]
            let availability = SessionAvailabilityResolver.evaluate(
                candidate,
                availableEquipment: availableEquipment,
                substitutions: substitutions
            )

            let resolved: ResolvedTrainingSession
            switch availability {
            case .available(let r), .availableWithCompromises(let r):
                resolved = r
            case .unavailable:
                skippedCount += 1
                continue
            }

            return SessionRecommendation(
                resolved: resolved,
                reason: Self.reason(skippedCount: skippedCount, lastSessionTitle: lastSessionTitle, chosenTitle: resolved.session.title)
            )
        }

        // Every candidate in the rotation was unavailable.
        return nil
    }

    /// A skip is always explained in one short, count-based sentence —
    /// never by naming every skipped session on Home's single
    /// recommendation card. The full per-session reasons live in "Toutes
    /// les séances," not here.
    private static func reason(skippedCount: Int, lastSessionTitle: String?, chosenTitle: String) -> String {
        if skippedCount > 0 {
            let plural = skippedCount > 1
            return "Prochaine séance disponible dans votre rotation. "
                + "\(skippedCount) séance\(plural ? "s" : "") \(plural ? "sont" : "est") incompatible\(plural ? "s" : "") avec votre équipement actuel."
        }
        if let lastSessionTitle {
            return "Recommandée car votre dernière séance était \(lastSessionTitle)."
        }
        return "Aucune séance récente — on commence par \(chosenTitle)."
    }
}
