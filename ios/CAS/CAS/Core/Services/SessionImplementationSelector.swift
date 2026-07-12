import Foundation

/// Beta 1.0: for a given Action Capability (`CASSessionID`), decides which
/// single implementation to show — the gym version, its bodyweight-native
/// counterpart, or the gym version resolved with substitutions. Sessions
/// are environment-specific implementations of an invariant intention (see
/// `CASForceBodyweight.swift`'s doc comment); this is the one place that
/// picks between them, so nothing downstream ever has to show two
/// implementations of the same capability at once.
///
/// Priority, validated explicitly: gym-as-authored (fully feasible) >
/// bodyweight-native (fully feasible) > gym-with-substitutions > none.
/// Both the gym and the bodyweight session are checked through
/// `SessionAvailabilityResolver.evaluate` — a bodyweight session is never
/// assumed available just because it belongs to the bodyweight catalog;
/// an undocumented exercise inside it is caught the same way an
/// undocumented gym exercise would be.
enum SessionImplementationSelector {

    /// The bodyweight-native counterpart per rotation slot, when the
    /// content team has designed one. `.power` and `.aerobicBase`
    /// intentionally have none: CAS Puissance's native reconstruction is
    /// deferred to backlog, and CAS Base aérobie never needed one — its
    /// two exercises already require no equipment.
    static let bodyweightCounterpart: [CASSessionID: TrainingSession] = [
        .force: CASForceBodyweight.session,
        .functionalHypertrophy: CASHypertrophieBodyweight.session,
        .robustness: CASRobustesseBodyweight.session,
    ]

    /// Maps any session id an athlete could actually be shown — gym or
    /// bodyweight-native — back to the rotation slot it implements. The
    /// reverse of `bodyweightCounterpart`, used so a completed bodyweight
    /// session counts as the same conceptual slot as its gym version for
    /// rotation purposes.
    static func rotationSlot(forSessionId sessionId: String) -> CASSessionID? {
        if let direct = CASSessionID(rawValue: sessionId) { return direct }
        return bodyweightCounterpart.first { $0.value.id == sessionId }?.key
    }

    /// Selects exactly one implementation for `sessionId`'s Action
    /// Capability. `requirements` and `substitutions` are forwarded
    /// as-is to every `evaluate` call this makes (gym and, if reached,
    /// bodyweight) — overridable for tests, defaulting to the real
    /// catalog for every production call site.
    static func select(
        sessionId: CASSessionID,
        gymSession: TrainingSession,
        availableEquipment: Set<Equipment>,
        requirements: [String: EquipmentRequirement] = ExerciseEquipmentRequirements.byExerciseId,
        substitutions: [String: ExerciseSubstitution] = [:]
    ) -> SessionAvailability {
        let gymAvailability = SessionAvailabilityResolver.evaluate(
            gymSession,
            availableEquipment: availableEquipment,
            requirements: requirements,
            substitutions: substitutions
        )
        if case .available = gymAvailability {
            return gymAvailability
        }

        if let bodyweight = bodyweightCounterpart[sessionId] {
            let bodyweightAvailability = SessionAvailabilityResolver.evaluate(
                bodyweight,
                availableEquipment: availableEquipment,
                requirements: requirements
            )
            if case .available = bodyweightAvailability {
                return bodyweightAvailability
            }
        }

        if case .availableWithCompromises = gymAvailability {
            return gymAvailability
        }
        return gymAvailability
    }
}
