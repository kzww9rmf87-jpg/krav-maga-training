import Foundation

/// One exercise as it appears within a specific training session: the
/// exercise identity plus the session-specific prescription (rest guidance,
/// set groups, coaching note, optional free-form instructions).
struct SessionExercise: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    let exercise: Exercise
    let restGuidance: String?
    let groups: [SetGroup]
    let note: String
    let freeText: String?

    init(
        id: UUID = UUID(),
        exercise: Exercise,
        restGuidance: String? = nil,
        groups: [SetGroup] = [],
        note: String,
        freeText: String? = nil
    ) {
        self.id = id
        self.exercise = exercise
        self.restGuidance = restGuidance
        self.groups = groups
        self.note = note
        self.freeText = freeText
    }
}

extension SessionExercise {
    /// The standard format's contribution to `SessionFormat.makeSteps()`.
    /// One step per prescribed set, plus one free-text step if present.
    func makeSteps() -> [ExecutionStep] {
        let restAfter = restGuidance.map(RestAfter.parse)

        var steps = groups.flatMap { group in
            group.sets.map { set in
                ExecutionStep(
                    exerciseName: exercise.name,
                    groupKind: group.kind,
                    label: set.label,
                    instruction: .setRow(load: set.load, reps: set.reps),
                    coachNote: note,
                    restAfter: restAfter
                )
            }
        }

        if let freeText {
            steps.append(
                ExecutionStep(
                    exerciseName: exercise.name,
                    groupKind: .work,
                    instruction: .freeText(freeText),
                    coachNote: note,
                    restAfter: restAfter
                )
            )
        }

        return steps
    }
}
