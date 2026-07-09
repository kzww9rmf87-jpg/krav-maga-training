import Foundation

/// One Capability Module as it appears within a specific training
/// session: the module identity plus the exercises that implement it
/// here. See `20-engine/01_MODULE_ENGINE.md`: "A training session is an
/// ordered collection of Capability Modules."
///
/// The module/exercise link deliberately lives here, not on `Exercise`
/// itself — "one exercise may serve different modules depending on
/// execution parameters" (`01_MODULE_ENGINE.md`), so binding a module
/// permanently onto an exercise would contradict the doctrine.
///
/// Order is simply the array position in `SessionFormat.standard`.
/// Sprint 1.5 introduces no assembly algorithm — session authors
/// (currently: the seed data) order modules by hand, the same way
/// `SessionExercise` order within a module is hand-authored today.
struct SessionModule: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    let module: CapabilityModule
    let exercises: [SessionExercise]

    init(id: UUID = UUID(), module: CapabilityModule, exercises: [SessionExercise]) {
        self.id = id
        self.module = module
        self.exercises = exercises
    }
}

extension SessionModule {
    /// The standard format's contribution to `SessionFormat.makeSteps()`,
    /// one level up from `SessionExercise.makeSteps()`.
    func makeSteps() -> [ExecutionStep] {
        exercises.flatMap { $0.makeSteps() }
    }
}
