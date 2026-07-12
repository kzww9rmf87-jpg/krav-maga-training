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

/// Fixed rotation over CAS V0.1's five conceptual slots: Force →
/// Puissance → Hypertrophie fonctionnelle → Robustesse → Base aérobie →
/// Force. Not derived from anything physiological — purely "what's next
/// in a fixed list," using `CASSessionID`'s declaration order as the
/// single source of that order.
///
/// Beta 1.0: each slot's implementation is chosen by
/// `SessionImplementationSelector`, never the gym version directly — a
/// slot only becomes a genuine skip when neither its gym version, its
/// bodyweight-native counterpart (if any) nor a gym substitution table
/// resolves it. CAS Puissance is the only candidate ever evaluated with a
/// substitution table (`CASPuissanceSubstitutions`); every other
/// candidate is checked for feasibility (gym, then bodyweight) only, per
/// the validated audit.
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
            let lastSlot = SessionImplementationSelector.rotationSlot(forSessionId: lastCompletedSessionId),
            let lastIndex = order.firstIndex(of: lastSlot.rawValue)
        {
            startIndex = (lastIndex + 1) % order.count
            lastSessionTitle = Self.title(forSessionId: lastCompletedSessionId, gymSessions: sessions)
        } else {
            startIndex = 0
            lastSessionTitle = nil
        }

        var skippedCount = 0
        for offset in 0..<order.count {
            let index = (startIndex + offset) % order.count
            let slot = CASSessionID.allCases[index]
            guard let candidate = sessions.first(where: { $0.id == slot.rawValue }) else { continue }

            let substitutions = slot == .power
                ? CASPuissanceSubstitutions.byExerciseId
                : [:]
            let availability = SessionImplementationSelector.select(
                sessionId: slot,
                gymSession: candidate,
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

    /// `lastCompletedSessionId` may be a gym id or a bodyweight-native
    /// id — the reason text always names whichever was actually
    /// completed, not the slot's gym title.
    private static func title(forSessionId sessionId: String, gymSessions: [TrainingSession]) -> String? {
        if let gymSession = gymSessions.first(where: { $0.id == sessionId }) {
            return gymSession.title
        }
        return SessionImplementationSelector.bodyweightCounterpart.values.first { $0.id == sessionId }?.title
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
