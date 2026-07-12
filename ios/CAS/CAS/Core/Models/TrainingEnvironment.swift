import Foundation

/// Where an athlete actually trains — the first personalization axis
/// requested for Beta 1.0, because it determines what's realistic to
/// suggest long before any exercise-selection engine exists to act on it.
enum TrainingEnvironment: String, Codable, CaseIterable, Sendable {
    case bodyweightOnly
    case commercialGym
    case combatGym
    case homeGym
    case mixed
}

extension TrainingEnvironment {
    /// A starting point for `availableEquipment`, not a constraint — the
    /// onboarding screen presents this as an editable preselection, never
    /// as the final word. `.bodyweightOnly` suggests nothing: a pull-up
    /// bar or resistance bands are common enough that assuming them would
    /// misrepresent what "bodyweight only" is meant to declare, so those
    /// stay opt-in.
    var suggestedEquipment: Set<Equipment> {
        switch self {
        case .bodyweightOnly:
            return []
        case .homeGym:
            return [.pullUpBar, .dumbbells, .kettlebell, .resistanceBands]
        case .commercialGym:
            return [.barbell, .rack, .bench, .dumbbells, .cableMachine, .pullUpBar, .dipBars, .cardioMachine]
        case .combatGym:
            return [.heavyBag, .medicineBall, .kettlebell, .pullUpBar]
        case .mixed:
            return [.pullUpBar, .dumbbells, .kettlebell, .barbell]
        }
    }
}
