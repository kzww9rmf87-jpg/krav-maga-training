import Foundation

/// A full replacement prescription for a substituted exercise — every
/// field the resolver needs to build the new `SessionExercise` from
/// scratch. Deliberately exhaustive: nothing here is inherited from the
/// original `SessionExercise` (see `SessionAvailabilityResolver`), because
/// a substitution's whole point is that the original prescription was
/// designed for a different exercise and can't be assumed to still fit.
struct SubstitutePrescription: Sendable, Equatable {
    let groups: [SetGroup]
    let restGuidance: String?
    let note: String
    let freeText: String?

    init(groups: [SetGroup], restGuidance: String? = nil, note: String, freeText: String? = nil) {
        self.groups = groups
        self.restGuidance = restGuidance
        self.note = note
        self.freeText = freeText
    }
}

/// One documented substitution for a specific exercise — the unit of data
/// held in a session's substitution table (e.g. `CASPuissanceSubstitutions`).
struct ExerciseSubstitution: Sendable, Equatable {
    let replacement: Exercise
    let equivalence: EquivalenceLevel
    let prescription: SubstitutePrescription
}
