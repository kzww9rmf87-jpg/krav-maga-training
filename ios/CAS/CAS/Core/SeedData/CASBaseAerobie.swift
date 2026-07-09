import Foundation

/// CAS V0.1 — Sprint 3. Enters the main rotation for now (validated
/// decision — no bonus/optional branch in Sprint 3, to avoid the extra
/// rotation logic that would require).
///
/// Module choice: a single continuous effort trains work capacity
/// directly (`conditioning`) — Krav Maga is already a powerful
/// intermittent stimulus (`10-science/01_THE_PHYSICAL_MODEL.md`), so this
/// session deliberately does not duplicate it with intervals. `recovery`
/// closes every session in this catalog that reaches it; here it's an
/// active cool-down rather than a separate module block's worth of
/// content.
///
/// Both exercises are `.freeText` duration blocks, not sets/reps — see
/// `TrainingSession.estimatedDurationMinutes`'s `executionSeconds(for:)`
/// for why the displayed duration still reflects the stated minutes
/// instead of the flat per-step assumption.
enum CASBaseAerobie {
    static let session = TrainingSession(
        id: CASSessionID.aerobicBase.rawValue,
        title: "CAS Base aérobie",
        subtitle: "Améliorer la capacité à récupérer et à répéter les efforts",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.conditioning,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-base-aerobie-effort-continu",
                            name: "Effort continu à allure modérée (vélo, rameur, course facile)",
                            primaryAdaptation: .conditioning
                        ),
                        note: "Le but n'est pas la fatigue, c'est la base aérobie — le Krav Maga couvre déjà l'intermittent.",
                        freeText: "15-20 min, zone 2 (allure conversationnelle), pas de fractionné."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.recovery,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-base-aerobie-retour-au-calme",
                            name: "Retour au calme + mobilité légère",
                            primaryAdaptation: .recovery
                        ),
                        note: "Clôture active plutôt qu'un arrêt brutal.",
                        freeText: "5 min."
                    ),
                ]
            ),
        ]),
        primaryActionCapability: "Répéter un effort sans dégradation"
    )
}
