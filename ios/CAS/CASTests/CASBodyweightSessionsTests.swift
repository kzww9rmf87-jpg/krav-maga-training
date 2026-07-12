import Testing
@testable import CAS

struct CASBodyweightSessionsTests {

    @Test func bodyweightNativeContainsExactlyTheThreeSessions() {
        let ids = SeedSessions.bodyweightNative.map(\.id)
        #expect(ids == ["cas-force-bodyweight", "cas-hypertrophie-bodyweight", "cas-robustesse-bodyweight"])
    }

    @Test func bodyweightSessionIdsAreUniqueAcrossTheWholeCatalog() {
        // Not part of `.all` yet, but their ids must still never collide
        // with anything already reachable — a future wiring step will
        // rely on this.
        let ids = (SeedSessions.all + SeedSessions.bodyweightNative).map(\.id)
        #expect(Set(ids).count == ids.count)
    }

    @Test func everyBodyweightNativeSessionProducesAtLeastOneExecutionStep() {
        for session in SeedSessions.bodyweightNative {
            #expect(!session.steps.isEmpty, "\(session.title) has no steps")
        }
    }

    @Test func everyBodyweightNativeSessionIsAssembledFromCanonicalCatalogModules() {
        for session in SeedSessions.bodyweightNative {
            guard case .standard(let modules) = session.format else { continue }
            for sessionModule in modules {
                #expect(
                    CapabilityModuleCatalog.all.contains(sessionModule.module),
                    "\(session.title) uses a module not in the canonical catalog: \(sessionModule.module.name)"
                )
            }
        }
    }

    /// The one guarantee this whole content design turned on: an Action
    /// Capability is an invariant of the intention, not of a given
    /// environment's implementation of it.
    @Test func bodyweightSessionsPreserveTheirLoadedCounterpartsActionCapability() {
        #expect(CASForceBodyweight.session.primaryActionCapability == CASForce.session.primaryActionCapability)
        #expect(CASHypertrophieBodyweight.session.primaryActionCapability == CASHypertrophie.session.primaryActionCapability)
        #expect(CASRobustesseBodyweight.session.primaryActionCapability == CASRobustesse.session.primaryActionCapability)
    }

    /// The core content constraint: nothing in any of the three sessions
    /// may require external load. Checked structurally, not just by
    /// convention — a future edit that accidentally introduces a
    /// `.weighted`/`.qualitative` load would fail this immediately.
    @Test func everyBodyweightNativeExerciseUsesOnlyBodyweightLoad() {
        for session in SeedSessions.bodyweightNative {
            for step in session.steps {
                guard case .setRow(let load, _) = step.instruction else { continue }
                #expect(load == .bodyweight, "\(session.title) — \(step.exerciseName) uses a non-bodyweight load")
            }
        }
    }

    @Test func casForceBodyweightUsesTheValidatedModuleSequence() {
        #expect(CASForceBodyweight.session.moduleNames == ["Force maximale", "Hypertrophie fonctionnelle", "Robustesse", "Gainage"])
    }

    @Test func casHypertrophieBodyweightUsesTheValidatedModuleSequence() {
        #expect(CASHypertrophieBodyweight.session.moduleNames == ["Hypertrophie fonctionnelle", "Gainage"])
    }

    @Test func casRobustesseBodyweightUsesTheValidatedModuleSequence() {
        #expect(CASRobustesseBodyweight.session.moduleNames == ["Robustesse", "Gainage", "Récupération"])
    }

    @Test func casForceBodyweightHasSixExercisesMatchingTheFrozenContent() {
        #expect(CASForceBodyweight.session.exerciseCount == 6)
    }

    @Test func casHypertrophieBodyweightHasSixExercisesMatchingTheFrozenContent() {
        #expect(CASHypertrophieBodyweight.session.exerciseCount == 6)
    }

    @Test func casRobustesseBodyweightHasFiveExercisesMatchingTheFrozenContent() {
        #expect(CASRobustesseBodyweight.session.exerciseCount == 5)
    }

    // MARK: - Beta 1.0: bodyweight sessions are equipment-verified, not assumed

    /// Every exercise these three sessions reference must have an
    /// explicit `[]` entry in `ExerciseEquipmentRequirements` — the
    /// documentation `SessionImplementationSelector` actually checks
    /// instead of assuming zero-equipment membership.
    @Test func everyBodyweightNativeExerciseHasAnExplicitEquipmentRequirementEntry() {
        for session in SeedSessions.bodyweightNative {
            guard case .standard(let modules) = session.format else { continue }
            for module in modules {
                for sessionExercise in module.exercises {
                    #expect(
                        ExerciseEquipmentRequirements.byExerciseId[sessionExercise.exercise.id] != nil,
                        "\(sessionExercise.exercise.id) has no entry in ExerciseEquipmentRequirements"
                    )
                }
            }
        }
    }

    /// Fail-closed at the resolver level: a bodyweight session with one
    /// exercise missing from `requirements` is `.unavailable`, exactly
    /// like an undocumented gym exercise — never assumed feasible just
    /// because it's bodyweight content.
    @Test func aBodyweightSessionWithAnUndocumentedExerciseIsUnavailable() {
        let reducedRequirements = ExerciseEquipmentRequirements.byExerciseId
            .filter { $0.key != "cas-force-bodyweight-pistol-squat" }
        let availability = SessionAvailabilityResolver.evaluate(
            CASForceBodyweight.session,
            availableEquipment: [],
            requirements: reducedRequirements
        )
        guard case .unavailable = availability else {
            Issue.record("Expected .unavailable when an exercise is undocumented"); return
        }
    }
}
