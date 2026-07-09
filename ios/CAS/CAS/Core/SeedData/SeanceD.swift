import Foundation

/// Ported from src/data/seanceD.js.
enum SeanceD {
    static let session = TrainingSession(
        id: "seance-d",
        title: "Séance D — Spécialisation pieds",
        subtitle: "Renforcement ciblé des chaînes musculaires du coup de pied",
        format: .standard(exercises: [
            SessionExercise(
                exercise: Exercise(
                    id: "presse-cuisses-amplitude",
                    name: "Presse à cuisses pleine amplitude",
                    primaryAdaptation: .movement,
                    secondaryAdaptations: [.functionalHypertrophy]
                ),
                restGuidance: "2-3 min",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "Progressive", reps: "12"),
                        SetSpec(load: "Progressive", reps: "10"),
                        SetSpec(load: "Progressive", reps: "10"),
                        SetSpec(load: "Progressive", reps: "8"),
                    ]),
                ],
                note: "Amplitude complète (à l'inverse des squats partiels de la séance A) : on "
                    + "travaille ici la mobilité et la force sur toute l'amplitude de la hanche, "
                    + "essentielle pour la hauteur et l'amplitude des coups de pied."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "releve-jambe-leste",
                    name: "Relevés de jambe lestés",
                    primaryAdaptation: .power,
                    secondaryAdaptations: [.specificSkill]
                ),
                restGuidance: "90 sec",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "2-3kg", reps: "8"),
                        SetSpec(load: "3-4kg", reps: "8"),
                        SetSpec(load: "4-5kg", reps: "8"),
                    ]),
                ],
                note: SeedNotes.stopAndGo
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "sdt-genoux",
                    name: "SDT à genoux",
                    primaryAdaptation: .maximumStrength
                ),
                restGuidance: "2-3 min",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "60kg", reps: "8"),
                        SetSpec(load: "65kg", reps: "6"),
                        SetSpec(load: "70kg", reps: "5"),
                    ]),
                ],
                note: "Position à genoux : supprime la contribution des jambes, isole les "
                    + "lombaires et le grand dorsal — variante stricte du soulevé de terre classique."
            ),
            SessionExercise(
                exercise: SharedExercises.kneeStrikeOnAllFours,
                restGuidance: "60 sec",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "—", reps: "10 / jambe"),
                        SetSpec(load: "—", reps: "10 / jambe"),
                        SetSpec(load: "—", reps: "10 / jambe"),
                        SetSpec(load: "—", reps: "10 / jambe"),
                    ]),
                ],
                note: "Volume plus élevé qu'en séance B (4 séries) pour ancrer le mouvement en "
                    + "spécialisation pieds."
            ),
            SessionExercise(
                exercise: SharedExercises.lyingTrunkRotation,
                restGuidance: "60 sec",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "—", reps: "15 / côté"),
                        SetSpec(load: "—", reps: "15 / côté"),
                        SetSpec(load: "—", reps: "15 / côté"),
                    ]),
                ],
                note: "Renforce le gainage rotatoire, nécessaire à la stabilité du bassin lors "
                    + "des coups de pied circulaires."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "adduction-isometrique",
                    name: "Adductions isométriques",
                    primaryAdaptation: .robustness
                ),
                restGuidance: "45 sec",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "—", reps: "30 sec"),
                        SetSpec(load: "—", reps: "30 sec"),
                        SetSpec(load: "—", reps: "30 sec"),
                        SetSpec(load: "—", reps: "30 sec"),
                        SetSpec(load: "—", reps: "30 sec"),
                    ]),
                ],
                note: "Tenue isométrique : renforce la stabilité de la hanche en "
                    + "abduction/adduction, zone très sollicitée et souvent blessée dans les "
                    + "sports pieds-poings."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "extension-mollet-debout",
                    name: "Extensions mollets debout",
                    primaryAdaptation: .functionalHypertrophy,
                    secondaryAdaptations: [.power]
                ),
                restGuidance: "60 sec",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "Progressive", reps: "12-15"),
                        SetSpec(load: "Progressive", reps: "12-15"),
                        SetSpec(load: "Progressive", reps: "12-15"),
                        SetSpec(load: "Progressive", reps: "12-15"),
                    ]),
                ],
                note: "Force des mollets = transmission finale de la puissance au sol sur "
                    + "l'appui du coup de pied."
            ),
        ])
    )
}
