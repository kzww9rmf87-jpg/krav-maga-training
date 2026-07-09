import Foundation

/// Ported from src/data/bras.js.
enum Bras {
    static let session = TrainingSession(
        id: "bras",
        title: "Bras (optionnel)",
        subtitle: "À ajouter en fin de séance si la récupération le permet",
        format: .standard(exercises: [
            SessionExercise(
                exercise: Exercise(
                    id: "hammer-curl",
                    name: "Hammer curls",
                    primaryAdaptation: .functionalHypertrophy,
                    secondaryAdaptations: [.robustness]
                ),
                restGuidance: "90 sec",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "14kg", reps: "10"),
                        SetSpec(load: "16kg", reps: "10"),
                        SetSpec(load: "18kg", reps: "8"),
                        SetSpec(load: "20kg", reps: "8"),
                    ]),
                ],
                note: "Prise marteau = sollicite le brachial et l'avant-bras, utile pour la "
                    + "force de préhension."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "curl-barre-ez",
                    name: "Curl barre EZ",
                    primaryAdaptation: .functionalHypertrophy
                ),
                restGuidance: "90 sec",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "25kg", reps: "8"),
                        SetSpec(load: "30kg", reps: "8"),
                        SetSpec(load: "35kg", reps: "6"),
                    ]),
                ],
                note: "Exercice d'isolation biceps — volume d'accessoire, non prioritaire sur "
                    + "les mouvements de force/explosivité."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "extension-triceps-poulie",
                    name: "Extensions triceps poulie",
                    primaryAdaptation: .functionalHypertrophy
                ),
                restGuidance: "60-90 sec",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "30kg", reps: "12"),
                        SetSpec(load: "35kg", reps: "10"),
                        SetSpec(load: "40kg", reps: "8"),
                    ]),
                ],
                note: "Complète le travail de poussée du développé-couché de la séance A."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "wrist-extension-curl",
                    name: "Wrist extensions + curls",
                    primaryAdaptation: .robustness
                ),
                restGuidance: "45 sec entre super-sets",
                groups: [
                    SetGroup(kind: .option, sets: [
                        SetSpec(label: "Super-set 1", load: "Léger", reps: "15 + 15"),
                        SetSpec(label: "Super-set 2", load: "Léger", reps: "15 + 15"),
                        SetSpec(label: "Super-set 3", load: "Léger", reps: "15 + 15"),
                    ]),
                ],
                note: "Enchaînement extension puis flexion du poignet sans repos — prévention "
                    + "des blessures et renforcement de la préhension pour les saisies et les "
                    + "frappes."
            ),
        ])
    )
}
