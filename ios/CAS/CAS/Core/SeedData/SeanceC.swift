import Foundation

/// Ported from src/data/seanceC.js. Circuit format — see CircuitSpec's
/// documentation for why only week 1's parameters are captured here.
///
/// Module choice: the whole circuit assembles under `conditioning` — the
/// source data doesn't decompose a circuit round by exercise-level
/// adaptation, and the note itself frames the block as "endurance de
/// force" (work-capacity), which is `conditioning`'s canonical primary.
enum SeanceC {
    static let session = TrainingSession(
        id: SeedSessionID.seanceC.rawValue,
        title: "Séance C — Circuit conditioning",
        subtitle: "Circuit enchaîné sans repos entre exercices",
        format: .circuit(module: CapabilityModuleCatalog.conditioning, spec: CircuitSpec(
            exercises: [
                CircuitExercise(name: "Coups de poing poulie", detail: "Vitesse max"),
                CircuitExercise(name: "Squats partiels", detail: "60kg"),
                CircuitExercise(name: "Rowing", detail: "Charge modérée"),
                CircuitExercise(name: "Sit-ups", detail: "Rythme soutenu"),
                CircuitExercise(name: "Lancers medicine ball", detail: "4-6kg"),
                CircuitExercise(name: "Gonflements thoraciques", detail: "50+ reps"),
            ],
            rounds: 3,
            restBetweenRounds: "30 sec entre circuits",
            note: "Antinomie puissance-endurance : ce circuit développe la capacité à répéter "
                + "l'effort (endurance de force), physiologiquement en tension avec le travail de "
                + "force maximale et d'explosivité pure (séances A et B). On le place en fin de "
                + "cycle et on ne l'enchaîne jamais juste avant une séance A ou B, pour ne pas "
                + "parasiter les gains de force pure."
        ))
    )
}
