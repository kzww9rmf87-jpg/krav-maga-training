import Testing
@testable import CAS

struct SeedSessionsTests {

    @Test func allFiveRealSessionsArePresent() {
        let ids = SeedSessions.all.map(\.id)
        #expect(ids == SeedSessionID.allCases.map(\.rawValue))
    }

    @Test func sessionIdsAreUnique() {
        let ids = SeedSessions.all.map(\.id)
        #expect(Set(ids).count == ids.count)
    }

    @Test func everySessionProducesAtLeastOneExecutionStep() {
        for session in SeedSessions.all {
            #expect(!session.steps.isEmpty, "\(session.title) has no steps")
        }
    }

    @Test func seanceCUsesTheCircuitFormatWithWeekOneParameters() {
        guard case .circuit(let module, let spec) = SeanceC.session.format else {
            Issue.record("Séance C should use the circuit format")
            return
        }
        #expect(module == CapabilityModuleCatalog.conditioning)
        #expect(spec.rounds == 3)
        #expect(spec.exercises.count == 6)
        // 6 exercises x 3 rounds.
        #expect(SeanceC.session.steps.count == 18)
    }

    @Test func sharedExercisesKeepTheSameIdentityAcrossSessions() {
        guard
            case .standard(let bModules) = SeanceB.session.format,
            case .standard(let dModules) = SeanceD.session.format
        else {
            Issue.record("Séances B and D should use the standard format")
            return
        }
        let bExercises = bModules.flatMap(\.exercises)
        let dExercises = dModules.flatMap(\.exercises)
        let kneeStrikeInB = bExercises.first { $0.exercise.id == "coup-de-genou-4-pattes" }
        let kneeStrikeInD = dExercises.first { $0.exercise.id == "coup-de-genou-4-pattes" }
        #expect(kneeStrikeInB?.exercise == kneeStrikeInD?.exercise)
    }

    @Test func everyStandardSessionIsAssembledFromCanonicalCatalogModules() {
        // "Sessions are temporary assemblies of these modules" —
        // 01_MODULE_ENGINE.md. No session should introduce a module that
        // isn't part of the canonical catalog.
        for session in SeedSessions.all {
            guard case .standard(let modules) = session.format else { continue }
            for sessionModule in modules {
                #expect(
                    CapabilityModuleCatalog.all.contains(sessionModule.module),
                    "\(session.title) uses a module not in the canonical catalog: \(sessionModule.module.name)"
                )
            }
        }
    }
}
