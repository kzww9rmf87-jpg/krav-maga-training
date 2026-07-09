import Foundation

/// The smallest reusable training unit CAS assembles sessions from. See
/// `20-engine/01_MODULE_ENGINE.md`: a Capability Module is not an
/// Adaptation Domain — a domain describes a physiological finality, a
/// module describes an operational, reusable building block. Several
/// modules may share the same primary adaptation (Grip and Robustness
/// both serve Robustness) because they represent different operational
/// moments, not different finalities.
///
/// Modules are stable business data: they exist independently of any
/// session and are not derived from one. The canonical catalog lives in
/// `Core/SeedData/CapabilityModuleCatalog.swift`; the five demo sessions
/// are assemblies of that catalog, not the other way around.
///
/// Sprint 1.5 models identity + adaptation only. `01_MODULE_ENGINE.md`
/// also specifies Physiological Cost, Training Parameters, Constraints
/// and Progression — omitted for the same reason `Exercise` omits them
/// (see `Exercise.swift`): nothing consumes them yet (no Decision
/// Engine), and populating them now means inventing numbers with no
/// analysis behind them, which violates "Never invent physiological
/// facts".
struct CapabilityModule: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let name: String
    let primaryAdaptation: AdaptationDomain
    /// Documentation/analysis only for now — the Decision Engine reasons
    /// on `primaryAdaptation`. See `01_MODULE_ENGINE.md`: secondaries
    /// exist to represent physiological reality, never to widen what a
    /// module is selected for.
    let secondaryAdaptations: [AdaptationDomain]
    let description: String?

    init(
        id: String,
        name: String,
        primaryAdaptation: AdaptationDomain,
        secondaryAdaptations: [AdaptationDomain] = [],
        description: String? = nil
    ) {
        self.id = id
        self.name = name
        self.primaryAdaptation = primaryAdaptation
        self.secondaryAdaptations = secondaryAdaptations
        self.description = description
    }
}
