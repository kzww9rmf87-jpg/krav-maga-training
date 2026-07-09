import Foundation

/// CAS V0.1 — Sprint 3.
///
/// Module choice: three exercises target rapid force production directly,
/// so they assemble under `power`. `core` follows because the same
/// kinetic-chain logic as CAS Force applies at higher velocity — a loose
/// trunk leaks power before it reaches the target. `movement` closes the
/// session deliberately: power without movement quality is an injury
/// risk, so the last block is coordination, not load.
enum CASPuissance {
    static let session = TrainingSession(
        id: CASSessionID.power.rawValue,
        title: "CAS Puissance",
        subtitle: "Produire une force rapidement",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.power,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-puissance-epaule-jete",
                            name: "Épaulé-jeté haltères (ou swing kettlebell)",
                            primaryAdaptation: .power
                        ),
                        restGuidance: "2 min",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "Léger-modéré", reps: "3-5"),
                                SetSpec(load: "Léger-modéré", reps: "3-5"),
                                SetSpec(load: "Léger-modéré", reps: "3-5"),
                                SetSpec(load: "Léger-modéré", reps: "3-5"),
                                SetSpec(load: "Léger-modéré", reps: "3-5"),
                            ]),
                        ],
                        note: "Vitesse maximale à chaque répétition — dès que ça ralentit, on arrête la série."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-puissance-squat-saute",
                            name: "Squat sauté (ou squat partiel explosif)",
                            primaryAdaptation: .power
                        ),
                        restGuidance: "2 min",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "Léger", reps: "5"),
                                SetSpec(load: "Léger", reps: "5"),
                                SetSpec(load: "Léger", reps: "5"),
                                SetSpec(load: "Léger", reps: "5"),
                            ]),
                        ],
                        note: "Explosivité en sortie, réception contrôlée."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-puissance-lancers-medecine-ball",
                            name: "Lancers medicine ball",
                            primaryAdaptation: .power
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "Léger", reps: "8-10"),
                                SetSpec(load: "Léger", reps: "8-10"),
                                SetSpec(load: "Léger", reps: "8-10"),
                                SetSpec(load: "Léger", reps: "8-10"),
                            ]),
                        ],
                        note: "Transfert jambes → bras, pas juste les bras."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-puissance-rotation-tronc",
                            name: "Rotation du tronc (câble ou medicine ball)",
                            primaryAdaptation: .movement,
                            secondaryAdaptations: [.power]
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(label: "Contrôlé", load: "—", reps: "10 / côté"),
                                SetSpec(label: "Rapide", load: "—", reps: "10 / côté"),
                                SetSpec(label: "Explosif", load: "—", reps: "10 / côté"),
                            ]),
                        ],
                        note: "Même chaîne cinétique que Force, mais à vitesse plus élevée."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.movement,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-puissance-deplacements-lateraux",
                            name: "Déplacements latéraux / changements de direction",
                            primaryAdaptation: .movement
                        ),
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "—", reps: "30 sec"),
                                SetSpec(load: "—", reps: "30 sec"),
                                SetSpec(load: "—", reps: "30 sec"),
                            ]),
                        ],
                        note: "La puissance sans qualité de mouvement devient un risque de blessure."
                    ),
                ]
            ),
        ]),
        primaryActionCapability: "Produire une force rapidement"
    )
}
