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
