import Testing
@testable import CAS

struct SeedSessionsTests {

    @Test func primaryIsTheFiveCASV0SessionsInRotationOrder() {
        let ids = SeedSessions.primary.map(\.id)
        #expect(ids == CASSessionID.allCases.map(\.rawValue))
    }

    @Test func legacyIsTheFiveOriginalSessions() {
        let ids = SeedSessions.legacy.map(\.id)
        #expect(ids == LegacySessionID.allCases.map(\.rawValue))
    }

    @Test func sessionIdsAreUniqueAcrossPrimaryAndLegacy() {
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

    @Test func everyPrimarySessionDeclaresANonEmptyActionCapability() {
        // Sprint 3: Home shows this per session — an empty string would
        // silently hide the row rather than fail loudly, so this test is
        // the actual guarantee.
        for session in SeedSessions.primary {
            #expect(!session.primaryActionCapability.isEmpty, "\(session.title) has no Action Capability")
        }
    }

    @Test func casForceUsesTheValidatedModuleSequence() {
        #expect(CASForce.session.moduleNames == ["Force maximale", "Hypertrophie fonctionnelle", "Grip", "Gainage"])
    }

    @Test func casPuissanceUsesTheValidatedModuleSequence() {
        #expect(CASPuissance.session.moduleNames == ["Puissance", "Gainage", "Mouvement"])
    }

    @Test func casHypertrophieUsesTheValidatedModuleSequence() {
        #expect(CASHypertrophie.session.moduleNames == ["Hypertrophie fonctionnelle", "Grip", "Gainage"])
    }

    @Test func casRobustesseUsesTheValidatedModuleSequence() {
        #expect(CASRobustesse.session.moduleNames == ["Robustesse", "Grip", "Gainage", "Récupération"])
    }

    @Test func casBaseAerobieUsesTheValidatedModuleSequence() {
        #expect(CASBaseAerobie.session.moduleNames == ["Conditionnement", "Récupération"])
    }
}
