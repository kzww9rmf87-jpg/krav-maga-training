import Foundation

/// One exercise within a circuit round. Circuits describe intensity as a
/// single free-text detail ("Vitesse max", "60kg") rather than load/reps
/// pairs, matching the source data (`seanceC.js`) — there is no duration
/// or rep count to invent.
struct CircuitExercise: Codable, Hashable, Sendable {
    let name: String
    let detail: String
}

/// A circuit: a fixed list of exercises performed back to back with no
/// rest between them, repeated for a number of rounds with rest only
/// between rounds.
///
/// The source data (`seanceC.js`) also defines an 8-week progression table
/// (more rounds, less rest, week over week). That table is a scheduling
/// concern — it belongs to the Adaptation Planning Engine, which is out of
/// scope for Sprint 1. `CircuitSpec` deliberately captures only a single
/// week's parameters (here, week 1: 3 rounds, 30s rest between rounds).
/// When the Adaptation Planning Engine lands, it becomes the thing that
/// picks which week's `CircuitSpec` to hand to the execution engine —
/// `CircuitSpec` itself does not need to change.
struct CircuitSpec: Codable, Hashable, Sendable {
    let exercises: [CircuitExercise]
    let rounds: Int
    let restBetweenRounds: String?
    let note: String?
}

extension CircuitSpec {
    /// The circuit format's contribution to `SessionFormat.makeSteps()`.
    /// Rest is attached only after the last exercise of a round, and never
    /// after the final round (nothing left to rest for within this format).
    func makeSteps() -> [ExecutionStep] {
        guard rounds > 0, !exercises.isEmpty else { return [] }
        let restAfter = restBetweenRounds.map(RestAfter.parse)

        var steps: [ExecutionStep] = []
        for round in 1...rounds {
            for (index, exercise) in exercises.enumerated() {
                let isLastExerciseOfRound = index == exercises.count - 1
                let isLastRound = round == rounds
                steps.append(
                    ExecutionStep(
                        exerciseName: exercise.name,
                        groupKind: .work,
                        label: "Tour \(round)/\(rounds)",
                        instruction: .freeText(exercise.detail),
                        coachNote: isLastExerciseOfRound ? note : nil,
                        restAfter: (isLastExerciseOfRound && !isLastRound) ? restAfter : nil
                    )
                )
            }
        }
        return steps
    }
}
