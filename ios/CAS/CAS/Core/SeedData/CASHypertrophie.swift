import Foundation

/// CAS V0.1 — Sprint 3.
///
/// Module choice: four push/pull/leg exercises at moderate volume build
/// useful mass without maximal loading, matching the objective
/// ("sans dégrader ni la mobilité ni la récupération") — assembled under
/// `functionalHypertrophy`. Grip and finishing accessory work close the
/// session without adding structural load; `core` maintains bracing
/// quality during a volume-oriented session, where the trunk is
/// otherwise the first thing to break down.
enum CASHypertrophie {
    static let session = TrainingSession(
        id: CASSessionID.functionalHypertrophy.rawValue,
        title: "CAS Hypertrophie fonctionnelle",
        subtitle: "Construire de la masse utile sans dégrader la mobilité ni la récupération",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.functionalHypertrophy,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-developpe-incline",
                            name: "Développé incliné haltères",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                            ]),
                        ],
                        note: "Amplitude complète, contrôle en descente."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-tractions",
                            name: "Tractions (ou tirage vertical)",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                                SetSpec(load: .qualitative(.moderate), reps: "8-10"),
                            ]),
                        ],
                        note: "Tirer avec le dos, amplitude complète."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-fentes-marchees",
                            name: "Fentes marchées",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.moderate), reps: "10-12"),
                                SetSpec(load: .qualitative(.moderate), reps: "10-12"),
                                SetSpec(load: .qualitative(.moderate), reps: "10-12"),
                            ]),
                        ],
                        note: "Pas long, contrôle sur la descente du genou arrière."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-elevations-laterales",
                            name: "Élévations latérales",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .qualitative(.light), reps: "12-15"),
                                SetSpec(load: .qualitative(.light), reps: "12-15"),
                                SetSpec(load: .qualitative(.light), reps: "12-15"),
                            ]),
                        ],
                        note: "Amplitude contrôlée, pas d'élan."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.grip,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-superset-bras",
                            name: "Superset curl marteau + extension triceps poulie",
                            primaryAdaptation: .functionalHypertrophy,
                            secondaryAdaptations: [.robustness]
                        ),
                        restGuidance: "60 sec entre supersets",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(label: "Superset 1", load: .qualitative(.moderate), reps: "10-12 + 10-12"),
                                SetSpec(label: "Superset 2", load: .qualitative(.moderate), reps: "10-12 + 10-12"),
                                SetSpec(label: "Superset 3", load: .qualitative(.moderate), reps: "10-12 + 10-12"),
                            ]),
                        ],
                        note: "Accessoire de préhension et de finition, sans charge structurale lourde."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-releve-jambes",
                            name: "Relevé de jambes suspendu",
                            primaryAdaptation: .movement,
                            secondaryAdaptations: [.robustness]
                        ),
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "12-15"),
                                SetSpec(load: .bodyweight, reps: "12-15"),
                                SetSpec(load: .bodyweight, reps: "12-15"),
                            ]),
                        ],
                        note: "Maintient la qualité de gainage pendant une séance orientée volume."
                    ),
                ]
            ),
        ]),
        primaryActionCapability: "Déplacer une charge à répétition"
    )
}
