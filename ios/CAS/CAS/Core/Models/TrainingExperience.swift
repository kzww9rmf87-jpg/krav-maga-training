import Foundation

/// How long an athlete has actually been training a given practice —
/// deliberately coarse (3 levels, no numeric years) because Beta 1.0's
/// onboarding needs something quick to answer, not a precise measurement.
/// `AthleteProfile` tracks this separately for combat and strength
/// training: a practitioner can be advanced in Krav Maga and a complete
/// beginner in strength training, or the reverse.
enum TrainingExperience: String, Codable, CaseIterable, Sendable {
    case beginner
    case intermediate
    case advanced

    var displayName: String {
        switch self {
        case .beginner: return "Débutant"
        case .intermediate: return "Intermédiaire"
        case .advanced: return "Avancé"
        }
    }
}
