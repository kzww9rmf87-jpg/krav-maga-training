import Foundation

/// An exercise, described by the adaptation it produces rather than by how
/// it looks. See `20-engine/02_EXERCISE_KNOWLEDGE_BASE.md`: "Exercises are
/// interchangeable. Adaptations are not."
///
/// Sprint 1 deliberately omits physiological cost, technical complexity,
/// transfer score and evidence level — nothing in the app yet consumes them
/// (there is no Decision Engine), and inventing numbers with no analysis
/// behind them would violate "Never invent physiological facts". Only the
/// adaptation identity is modeled now, because it costs nothing to port
/// from the existing data and it is the exercise's core identity per the
/// Manifesto: "Adaptations are the product."
struct Exercise: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let name: String
    let primaryAdaptation: AdaptationDomain
    let secondaryAdaptations: [AdaptationDomain]
    let coachNote: String?

    init(
        id: String,
        name: String,
        primaryAdaptation: AdaptationDomain,
        secondaryAdaptations: [AdaptationDomain] = [],
        coachNote: String? = nil
    ) {
        self.id = id
        self.name = name
        self.primaryAdaptation = primaryAdaptation
        self.secondaryAdaptations = secondaryAdaptations
        self.coachNote = coachNote
    }
}
