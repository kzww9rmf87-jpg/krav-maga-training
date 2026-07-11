import Foundation

/// CAS V0.1 — Sprint 3.
///
/// Module choice: farmer carry and hip isometrics train tolerance to
/// sustained mechanical stress directly (`robustness`). `grip` is the
/// literal namesake of this session's Action Capability — the module
/// that most directly determines whether a grip can be maintained under
/// resistance at all. `core` stabilizes the trunk during grip/carry
/// efforts so compensation doesn't come from the back. `recovery` closes
/// deliberately: per `10-science/02_THE_COMBAT_ATHLETE.md`, recovering
/// quickly is itself one of the combat athlete's permanent constraints,
/// not an optional add-on.
enum CASRobustesse {
    static let session = TrainingSession(
        id: CASSessionID.robustness.rawValue,
        title: "CAS Robustesse",
        subtitle: "Résister aux contraintes mécaniques et préserver l'intégrité physique",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.robustness,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-farmer-carry",
                            name: "Marche du fermier (farmer carry)",
                            primaryAdaptation: .robustness
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.heavy), reps: "30-40 m"),
                                SetSpec(load: .qualitative(.heavy), reps: "30-40 m"),
                                SetSpec(load: .qualitative(.heavy), reps: "30-40 m"),
                                SetSpec(load: .qualitative(.heavy), reps: "30-40 m"),
                            ]),
                        ],
                        note: "Gainage rigide, pas de bascule des hanches."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-isometrie-hanche",
                            name: "Isométrie hanche (adduction/abduction) ou planche latérale",
                            primaryAdaptation: .robustness
                        ),
                        restGuidance: "45 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                            ]),
                        ],
                        note: "La robustesse conditionne la capacité à continuer à s'entraîner pendant des années."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.grip,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-suspension-lestee",
                            name: "Suspension lestée (ou pinch grip)",
                            primaryAdaptation: .robustness
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "Tenue max"),
                                SetSpec(load: .bodyweight, reps: "Tenue max"),
                                SetSpec(load: .bodyweight, reps: "Tenue max"),
                            ]),
                        ],
                        note: "Le module qui donne son nom à la capacité de cette séance."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-gainage-rotatoire",
                            name: "Gainage rotatoire (Pallof press)",
                            primaryAdaptation: .movement,
                            secondaryAdaptations: [.robustness]
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "12 / côté"),
                                SetSpec(load: .bodyweight, reps: "12 / côté"),
                                SetSpec(load: .bodyweight, reps: "12 / côté"),
                            ]),
                        ],
                        note: "Stabilise le tronc pendant l'effort de préhension — la compensation ne vient pas du dos."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.recovery,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-retour-au-calme",
                            name: "Étirements / mobilité guidée ou respiration diaphragmatique",
                            primaryAdaptation: .recovery
                        ),
                        note: "La récupération fait partie de l'entraînement, pas une option.",
                        freeText: "5-8 min, faible intensité."
                    ),
                ]
            ),
        ]),
        primaryActionCapability: "Maintenir une prise malgré une résistance"
    )
}
