import Foundation

/// Exercises that appear identically in more than one séance (ported from
/// src/data/*.js) — defined once and referenced from each session so the
/// same exercise carries the same identity everywhere, per
/// 20-engine/01_MODULE_ENGINE.md: "the same module may appear in different
/// sessions and different cycles."
enum SharedExercises {
    static let kneeStrikeOnAllFours = Exercise(
        id: "coup-de-genou-4-pattes",
        name: "Coups de genou à quatre pattes",
        primaryAdaptation: .specificSkill,
        secondaryAdaptations: [.power]
    )

    static let lyingTrunkRotation = Exercise(
        id: "rotation-buste-allonge",
        name: "Rotations du buste allongé",
        primaryAdaptation: .movement,
        secondaryAdaptations: [.power]
    )
}

/// Coaching notes reused verbatim across séances in the source data.
enum SeedNotes {
    static let stopAndGo =
        "Stop & Go : chaque répétition part à l'arrêt complet (pas de rebond, pas d'élan). "
        + "Cela supprime l'énergie élastique du mouvement et force le muscle à produire toute "
        + "la force lui-même — clé pour développer la force de démarrage explosive utile en combat."
}
