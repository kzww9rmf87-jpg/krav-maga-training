import Foundation
import Testing
@testable import CAS

struct CapabilityModuleTests {

    @Test func moduleHasExactlyOnePrimaryAdaptation() {
        let module = CapabilityModule(
            id: "module-strength",
            name: "Force maximale",
            primaryAdaptation: .maximumStrength,
            secondaryAdaptations: [.power]
        )
        #expect(module.primaryAdaptation == .maximumStrength)
        #expect(!module.secondaryAdaptations.contains(.maximumStrength))
    }

    @Test func moduleRoundTripsThroughJSON() throws {
        let original = CapabilityModule(
            id: "module-grip",
            name: "Grip",
            primaryAdaptation: .robustness,
            description: "Tendon and forearm resilience."
        )
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(CapabilityModule.self, from: data)
        #expect(decoded == original)
    }

    @Test func catalogHasTenCanonicalModulesWithUniqueIds() {
        #expect(CapabilityModuleCatalog.all.count == 10)
        let ids = CapabilityModuleCatalog.all.map(\.id)
        #expect(Set(ids).count == ids.count)
    }

    @Test func catalogNeverUsesSpecificSkillAsAnAdaptation() {
        // CAS is a physical preparation engine; specific skill is
        // developed by practicing the discipline itself, not by a
        // Capability Module.
        for module in CapabilityModuleCatalog.all {
            #expect(module.primaryAdaptation != .specificSkill)
            #expect(!module.secondaryAdaptations.contains(.specificSkill))
        }
    }

    @Test func onlyStrengthDeclaresSecondaryAdaptationsInTheCatalog() {
        // Every other secondary is left empty rather than inferred — see
        // CapabilityModuleCatalog's rationale.
        for module in CapabilityModuleCatalog.all where module.id != CapabilityModuleCatalog.strength.id {
            #expect(module.secondaryAdaptations.isEmpty, "\(module.name) should have no secondary adaptation")
        }
        #expect(CapabilityModuleCatalog.strength.secondaryAdaptations == [.power, .robustness])
    }

    @Test func sessionModuleAggregatesStepsFromAllItsExercises() {
        let exerciseA = Exercise(id: "a", name: "A", primaryAdaptation: .maximumStrength)
        let exerciseB = Exercise(id: "b", name: "B", primaryAdaptation: .maximumStrength)
        let sessionModule = SessionModule(
            module: CapabilityModuleCatalog.strength,
            exercises: [
                SessionExercise(
                    exercise: exerciseA,
                    groups: [SetGroup(kind: .work, sets: [SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5")])],
                    note: ""
                ),
                SessionExercise(
                    exercise: exerciseB,
                    groups: [SetGroup(kind: .work, sets: [SetSpec(load: .weighted(value: 40, unit: .kg), reps: "6")])],
                    note: ""
                ),
            ]
        )
        #expect(sessionModule.makeSteps().map(\.exerciseName) == ["A", "B"])
    }
}
