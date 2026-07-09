import Foundation

/// An ordered collection of `SessionExercise`. See
/// `20-engine/01_MODULE_ENGINE.md`: a training session's objective is to
/// maximize useful adaptation, not to maximize fatigue.
struct TrainingSession: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let title: String
    let subtitle: String
    let exercises: [SessionExercise]
}
