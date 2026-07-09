import Foundation

/// Ported from src/data/seanceA.js.
enum SeanceA {
    static let session = TrainingSession(
        id: "seance-a",
        title: "Séance A — Force maximale",
        subtitle: "Demi-pyramide montante · Stop & Go sur toutes les répétitions",
        format: .standard(exercises: [
            SessionExercise(
                exercise: Exercise(
                    id: "developpe-couche-mains-serrees",
                    name: "Développé-couché mains serrées",
                    primaryAdaptation: .maximumStrength,
                    secondaryAdaptations: [.power]
                ),
                restGuidance: "3-4 min entre séries lourdes",
                groups: [
                    SetGroup(kind: .warmup, sets: [
                        SetSpec(load: "50kg", reps: "15"),
                        SetSpec(load: "65kg", reps: "8"),
                    ]),
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "75kg", reps: "5"),
                        SetSpec(load: "80kg", reps: "4"),
                        SetSpec(load: "85kg", reps: "3"),
                        SetSpec(load: "88-90kg", reps: "2-3"),
                    ]),
                ],
                note: SeedNotes.stopAndGo
                    + " Prise serrée = sollicitation triceps/coude, essentielle pour la puissance "
                    + "de poussée directe (coup de poing, garde)."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "squat-partiel-force",
                    name: "Squats partiels",
                    primaryAdaptation: .maximumStrength
                ),
                restGuidance: "3-4 min",
                groups: [
                    SetGroup(kind: .warmup, sets: [
                        SetSpec(load: "60kg", reps: "15"),
                        SetSpec(load: "80kg", reps: "8"),
                    ]),
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "90kg", reps: "6"),
                        SetSpec(load: "95kg", reps: "5"),
                        SetSpec(load: "98kg", reps: "4"),
                        SetSpec(load: "100kg", reps: "3"),
                    ]),
                ],
                note: "Amplitude partielle (quart/demi-squat) dans la zone de force maximale des "
                    + "jambes — permet de charger bien au-delà du 1RM complet et de développer la "
                    + "force de poussée au sol utilisée en projection et en ancrage."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "sdt-jambes-semi-tendues",
                    name: "SDT jambes semi-tendues",
                    primaryAdaptation: .maximumStrength,
                    secondaryAdaptations: [.robustness]
                ),
                restGuidance: "3-4 min",
                groups: [
                    SetGroup(kind: .warmup, sets: [
                        SetSpec(load: "60kg", reps: "15"),
                        SetSpec(load: "80kg", reps: "8"),
                    ]),
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "90kg", reps: "5"),
                        SetSpec(load: "95kg", reps: "5"),
                        SetSpec(load: "100kg", reps: "4"),
                    ]),
                ],
                note: "Jambes semi-tendues = tension continue sur la chaîne postérieure "
                    + "(ischios/lombaires) sans relâchement complet — renforce la posture de "
                    + "combat et la résistance aux tractions/déséquilibres."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "rowing-lourd",
                    name: "Rowing lourd",
                    primaryAdaptation: .maximumStrength,
                    secondaryAdaptations: [.functionalHypertrophy]
                ),
                restGuidance: "2-3 min",
                groups: [
                    SetGroup(kind: .warmup, sets: [
                        SetSpec(load: "Léger", reps: "15"),
                    ]),
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "Base", reps: "6"),
                        SetSpec(load: "+2kg", reps: "5"),
                        SetSpec(load: "+4kg", reps: "5"),
                        SetSpec(load: "+6kg", reps: "4"),
                    ]),
                ],
                note: "Séries montantes de +2kg : on augmente la charge à chaque série tout en "
                    + "acceptant une baisse progressive des reps. Construit le dos et la force de "
                    + "traction (saisies, contrôle au sol)."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "shrugs",
                    name: "Shrugs",
                    primaryAdaptation: .functionalHypertrophy,
                    secondaryAdaptations: [.robustness]
                ),
                restGuidance: "2 min",
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: "Base", reps: "6"),
                        SetSpec(load: "+2kg", reps: "6"),
                        SetSpec(load: "+4kg", reps: "5"),
                    ]),
                ],
                note: "Renforce trapèzes et cervicales — zone critique pour l'absorption des "
                    + "chocs et frappes en sport de combat."
            ),
            SessionExercise(
                exercise: Exercise(
                    id: "finition-sac-frappe-suspension",
                    name: "Finition",
                    primaryAdaptation: .specificSkill,
                    secondaryAdaptations: [.robustness]
                ),
                restGuidance: "Aucun — enchaîné",
                note: "Travail de fatigue technique et de gainage de préhension en fin de séance de force.",
                freeText: "5 min de sac de frappe + suspension à la barre (temps maximal tenu)."
            ),
        ])
    )
}
