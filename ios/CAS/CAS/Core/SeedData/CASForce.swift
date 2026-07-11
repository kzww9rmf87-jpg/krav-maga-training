import Foundation

/// CAS V0.1 — Sprint 3. Built top-down from an Action Capability, not
/// from a list of exercises — see `10-science/04_CAPABILITY_MAPPING.md`.
///
/// Module choice: Squat, Développé couché and Rowing all target maximum
/// force production directly, so they assemble under `strength`. Fentes
/// adds useful mass in support of that force without becoming the
/// session's purpose (`functionalHypertrophy`). Force produced by the
/// legs and back is lost if the grip fails first, so `grip` closes the
/// chain; `core` is last because trunk stability is what actually
/// transmits force between the lower and upper body — without it,
/// nothing above transfers.
enum CASForce {
    static let session = TrainingSession(
        id: CASSessionID.force.rawValue,
        title: "CAS Force",
        subtitle: "Produire une force importante et la transférer efficacement",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.strength,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-squat",
                            name: "Squat (ou presse à cuisses)",
                            primaryAdaptation: .maximumStrength
                        ),
                        restGuidance: "3 min",
                        groups: [
                            SetGroup(kind: .warmup, sets: [
                                SetSpec(load: .qualitative(.light), reps: "10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8"),
                            ]),
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.heavy), reps: "4-6"),
                                SetSpec(load: .qualitative(.heavy), reps: "4-6"),
                                SetSpec(load: .qualitative(.heavy), reps: "4-6"),
                                SetSpec(load: .qualitative(.heavy), reps: "4-6"),
                            ]),
                        ],
                        note: "Descente contrôlée, remontée puissante — technique avant charge."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-developpe-couche",
                            name: "Développé couché",
                            primaryAdaptation: .maximumStrength,
                            secondaryAdaptations: [.power]
                        ),
                        restGuidance: "3 min",
                        groups: [
                            SetGroup(kind: .warmup, sets: [
                                SetSpec(load: .qualitative(.light), reps: "10"),
                            ]),
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.heavy), reps: "4-6"),
                                SetSpec(load: .qualitative(.heavy), reps: "4-6"),
                                SetSpec(load: .qualitative(.heavy), reps: "4-6"),
                                SetSpec(load: .qualitative(.heavy), reps: "4-6"),
                            ]),
                        ],
                        note: "Trajectoire stable, coudes ni trop ouverts ni collés."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-rowing",
                            name: "Rowing horizontal (barre ou machine)",
                            primaryAdaptation: .maximumStrength,
                            secondaryAdaptations: [.functionalHypertrophy]
                        ),
                        restGuidance: "2-3 min",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.heavy), reps: "6-8"),
                                SetSpec(load: .qualitative(.heavy), reps: "6-8"),
                                SetSpec(load: .qualitative(.heavy), reps: "6-8"),
                            ]),
                        ],
                        note: "Tirer avec le dos, pas avec les bras."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.functionalHypertrophy,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-fentes",
                            name: "Fentes (ou presse à cuisses, angle différent du squat)",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                            ]),
                        ],
                        note: "Amplitude complète, contrôle en descente."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.grip,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-suspension",
                            name: "Suspension à la barre (dead hang)",
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
                        note: "Épaules engagées, pas juste pendu passivement."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-gainage",
                            name: "Gainage (planche) ou Pallof press",
                            primaryAdaptation: .movement,
                            secondaryAdaptations: [.robustness]
                        ),
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                            ]),
                        ],
                        note: "Le tronc transmet la force entre le bas et le haut du corps."
                    ),
                ]
            ),
        ]),
        primaryActionCapability: "Produire une force importante et la transmettre efficacement"
    )
}
