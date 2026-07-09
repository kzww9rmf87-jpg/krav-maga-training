import Foundation

/// Ported from src/data/seanceB.js. Sprint 1.5: reassembled as Capability
/// Modules — see `20-engine/01_MODULE_ENGINE.md`.
///
/// Module choice: the six speed/explosive-intent exercises assemble under
/// `power`. The two trunk exercises (hanging leg raise, lying trunk
/// rotation) are explicitly described as "gainage" (core bracing) in
/// their notes, so they assemble under `core` — even though "Relevés de
/// jambe barre fixe" carries `.robustness` as its own exercise-level
/// adaptation. That's expected: the exercise's Knowledge Base tag and its
/// module placement in a given session answer different questions (see
/// `CapabilityModule.swift`).
enum SeanceB {
    static let session = TrainingSession(
        id: LegacySessionID.seanceB.rawValue,
        title: "Séance B — Explosivité + Pieds",
        subtitle: "Vitesse d'exécution maximale sur chaque répétition",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.power,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "epaule-jete-halteres",
                            name: "Épaulés-jetés haltères",
                            primaryAdaptation: .power
                        ),
                        restGuidance: "2-3 min",
                        groups: [
                            SetGroup(kind: .warmup, sets: [SetSpec(load: "20kg", reps: "8")]),
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "30kg", reps: "6"),
                                SetSpec(load: "35kg", reps: "6"),
                                SetSpec(load: "38kg", reps: "6"),
                            ]),
                        ],
                        note: "Mouvement complet hanche-épaule à vitesse maximale — transfert direct vers "
                            + "la puissance de percussion et l'explosivité générale."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "coup-de-poing-poulie",
                            name: "Coups de poing poulie",
                            primaryAdaptation: .power,
                            secondaryAdaptations: [.specificSkill]
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(label: "1 — Position 6-7", load: "—", reps: "10 vitesse max"),
                                SetSpec(label: "2 — Position 6-7", load: "—", reps: "10 vitesse max"),
                                SetSpec(label: "3 — Position 6-7", load: "—", reps: "10 vitesse max"),
                                SetSpec(label: "4 — Position 7-8", load: "—", reps: "10 vitesse max"),
                                SetSpec(label: "5 — Position 7-8", load: "—", reps: "10 vitesse max"),
                            ]),
                        ],
                        note: "Réglage de poulie en position 6-7 puis 7-8 : la résistance/l'angle "
                            + "augmente progressivement. Chaque répétition à vitesse maximale — c'est un "
                            + "exercice de puissance, pas d'endurance."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "lancer-medicine-ball",
                            name: "Lancers medicine ball",
                            primaryAdaptation: .power
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "4-6kg", reps: "15"),
                                SetSpec(load: "4-6kg", reps: "15"),
                                SetSpec(load: "4-6kg", reps: "15"),
                                SetSpec(load: "4-6kg", reps: "15"),
                            ]),
                        ],
                        note: "Lancer complet du buste — transfert de puissance des jambes vers les bras, "
                            + "similaire à la chaîne cinétique d'un coup de poing."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "releve-jambe-debout-leste",
                            name: "Relevés de jambe debout lestés",
                            primaryAdaptation: .power,
                            secondaryAdaptations: [.specificSkill]
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "2-3kg", reps: "6"),
                                SetSpec(load: "3-4kg", reps: "6"),
                                SetSpec(load: "4-5kg", reps: "6"),
                                SetSpec(load: "4-5kg", reps: "6"),
                            ]),
                        ],
                        note: SeedNotes.stopAndGo
                            + " Ici appliqué au relevé de jambe lesté — clé pour la puissance de coup de "
                            + "pied/genou."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "squat-partiel-explosif",
                            name: "Squats partiels explosifs",
                            primaryAdaptation: .power
                        ),
                        restGuidance: "2-3 min",
                        groups: [
                            SetGroup(kind: .warmup, sets: [SetSpec(load: "50kg", reps: "10")]),
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "65kg", reps: "8"),
                                SetSpec(load: "70kg", reps: "8"),
                                SetSpec(load: "75kg", reps: "6"),
                            ]),
                        ],
                        note: "Même mouvement que la séance A mais orienté vitesse de sortie plutôt que "
                            + "charge maximale — développe la puissance de détente des jambes."
                    ),
                    SessionExercise(
                        exercise: SharedExercises.kneeStrikeOnAllFours,
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(label: "1 — Contrôlé", load: "—", reps: "10 / jambe"),
                                SetSpec(label: "2 — Rapide", load: "—", reps: "10 / jambe"),
                                SetSpec(label: "3 — Explosif", load: "—", reps: "10 / jambe"),
                            ]),
                        ],
                        note: "Progression contrôlé → rapide → explosif : on apprend d'abord la "
                            + "trajectoire, puis on l'accélère au maximum. Directement transférable au "
                            + "coup de genou en combat."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "releve-jambe-barre-fixe",
                            name: "Relevés de jambe barre fixe",
                            primaryAdaptation: .robustness
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: "—", reps: "15-20"),
                                SetSpec(load: "—", reps: "15-20"),
                                SetSpec(load: "—", reps: "15-20"),
                            ]),
                            SetGroup(kind: .option, sets: [
                                SetSpec(label: "MAX", load: "—", reps: "Max reps"),
                            ]),
                        ],
                        note: "Gainage suspendu — renforce la sangle abdominale basse et la préhension "
                            + "en même temps."
                    ),
                    SessionExercise(
                        exercise: SharedExercises.lyingTrunkRotation,
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(label: "1 — Contrôlé", load: "—", reps: "15 / côté"),
                                SetSpec(label: "2 — Rapide", load: "—", reps: "15 / côté"),
                                SetSpec(label: "3 — Explosif", load: "—", reps: "15 / côté"),
                            ]),
                        ],
                        note: "Rotation du tronc = transmission de la force entre le bas et le haut du "
                            + "corps, essentielle pour la puissance de frappe en rotation."
                    ),
                ]
            ),
        ])
    )
}
