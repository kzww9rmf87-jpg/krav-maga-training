import Foundation

/// The eight fundamental physical qualities CAS trains for.
/// See `10-science/01_THE_PHYSICAL_MODEL.md` — "The body does not adapt to
/// exercises. It adapts to constraints." These domains are the constraints'
/// target, not the exercises used to apply them.
enum AdaptationDomain: String, Codable, CaseIterable, Hashable, Sendable {
    case maximumStrength
    case power
    case functionalHypertrophy
    case conditioning
    case robustness
    case movement
    case recovery
    case specificSkill

    var displayName: String {
        switch self {
        case .maximumStrength: return "Force maximale"
        case .power: return "Puissance"
        case .functionalHypertrophy: return "Hypertrophie fonctionnelle"
        case .conditioning: return "Conditionnement"
        case .robustness: return "Robustesse"
        case .movement: return "Mouvement"
        case .recovery: return "Récupération"
        case .specificSkill: return "Compétence spécifique"
        }
    }
}
