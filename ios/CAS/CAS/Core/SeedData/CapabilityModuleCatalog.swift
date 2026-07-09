import Foundation

/// The canonical Capability Module catalog defined in
/// `20-engine/01_MODULE_ENGINE.md` ("Canonical Capability Module
/// Catalog"). These are stable business objects, not derived from the
/// five demo sessions — the sessions are assemblies of these modules,
/// never the other way around.
///
/// Secondary adaptations are left empty except where
/// `10-science/01_THE_PHYSICAL_MODEL.md` explicitly states them
/// (Strength → Power, Robustness). Inferring the others would violate
/// "Never invent physiological facts" — see the doc's rationale.
///
/// Specific Skill deliberately has no module: CAS is a physical
/// preparation engine, not a substitute for practicing the discipline.
enum CapabilityModuleCatalog {
    static let preparation = CapabilityModule(
        id: "module-preparation",
        name: "Préparation",
        primaryAdaptation: .movement
    )

    static let movement = CapabilityModule(
        id: "module-movement",
        name: "Mouvement",
        primaryAdaptation: .movement
    )

    static let power = CapabilityModule(
        id: "module-power",
        name: "Puissance",
        primaryAdaptation: .power
    )

    static let strength = CapabilityModule(
        id: "module-strength",
        name: "Force maximale",
        primaryAdaptation: .maximumStrength,
        secondaryAdaptations: [.power, .robustness]
    )

    static let functionalHypertrophy = CapabilityModule(
        id: "module-functional-hypertrophy",
        name: "Hypertrophie fonctionnelle",
        primaryAdaptation: .functionalHypertrophy
    )

    static let robustness = CapabilityModule(
        id: "module-robustness",
        name: "Robustesse",
        primaryAdaptation: .robustness
    )

    static let grip = CapabilityModule(
        id: "module-grip",
        name: "Grip",
        primaryAdaptation: .robustness
    )

    static let core = CapabilityModule(
        id: "module-core",
        name: "Gainage",
        primaryAdaptation: .movement
    )

    static let conditioning = CapabilityModule(
        id: "module-conditioning",
        name: "Conditionnement",
        primaryAdaptation: .conditioning
    )

    static let recovery = CapabilityModule(
        id: "module-recovery",
        name: "Récupération",
        primaryAdaptation: .recovery
    )

    static let all: [CapabilityModule] = [
        preparation, movement, power, strength, functionalHypertrophy,
        robustness, grip, core, conditioning, recovery,
    ]
}
