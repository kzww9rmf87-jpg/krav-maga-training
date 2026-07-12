import Testing
@testable import CAS

struct SessionImplementationSelectorTests {

    private static let fullyEquippedGym: Set<Equipment> = [
        .barbell, .rack, .bench, .cableMachine, .pullUpBar,
        .dumbbells, .kettlebell, .medicineBall, .resistanceBands, .externalLoad,
    ]

    /// Satisfies every CAS Robustesse exercise except farmer carry
    /// (suspension lestée via pull-up bar + external load, gainage
    /// rotatoire via the cable machine, the two `[]` exercises need
    /// nothing) — the fixture equipment for tests that need the gym
    /// version to resolve via exactly one substitution, not collapse to
    /// `.unavailable` because of the other equipment-dependent exercises.
    private static let robustesseGymMissingOnlyFarmerCarry: Set<Equipment> = [.pullUpBar, .externalLoad, .cableMachine]

    private static let farmerCarrySubstitution: [String: ExerciseSubstitution] = [
        "cas-robustesse-farmer-carry": ExerciseSubstitution(
            replacement: Exercise(id: "test-farmer-carry-substitute", name: "Test substitute", primaryAdaptation: .robustness),
            equivalence: .partial,
            prescription: SubstitutePrescription(groups: [], note: "test")
        ),
    ]

    @Test func selectReturnsGymVersionUnchangedWhenFullyFeasible() {
        let availability = SessionImplementationSelector.select(
            sessionId: .force,
            gymSession: CASForce.session,
            availableEquipment: Self.fullyEquippedGym
        )
        guard case .available(let resolved) = availability else {
            Issue.record("Expected .available"); return
        }
        #expect(resolved.session.id == CASForce.session.id)
        #expect(resolved.substitutions.isEmpty)
    }

    @Test func selectFallsBackToBodyweightNativeWhenGymIsInfeasible() {
        let availability = SessionImplementationSelector.select(
            sessionId: .force,
            gymSession: CASForce.session,
            availableEquipment: []
        )
        guard case .available(let resolved) = availability else {
            Issue.record("Expected .available (bodyweight native)"); return
        }
        #expect(resolved.session.id == CASForceBodyweight.session.id)
    }

    /// The one guarantee the priority order turns on: even when a gym
    /// substitution *would* resolve the slot, a fully feasible
    /// bodyweight-native counterpart wins. Uses a synthetic substitution
    /// table local to this test — no real content is touched.
    @Test func selectPrefersBodyweightNativeOverGymWithSubstitutions() {
        let availability = SessionImplementationSelector.select(
            sessionId: .robustness,
            gymSession: CASRobustesse.session,
            availableEquipment: Self.robustesseGymMissingOnlyFarmerCarry,
            substitutions: Self.farmerCarrySubstitution
        )
        guard case .available(let resolved) = availability else {
            Issue.record("Expected .available (bodyweight native, not gym-with-substitutions)"); return
        }
        #expect(resolved.session.id == CASRobustesseBodyweight.session.id)
    }

    @Test func selectUsesGymSubstitutionsWhenNoBodyweightNativeCounterpartExists() {
        let availability = SessionImplementationSelector.select(
            sessionId: .power,
            gymSession: CASPuissance.session,
            availableEquipment: [],
            substitutions: CASPuissanceSubstitutions.byExerciseId
        )
        guard case .availableWithCompromises(let resolved) = availability else {
            Issue.record("Expected .availableWithCompromises"); return
        }
        #expect(resolved.session.id == CASPuissance.session.id)
        #expect(resolved.substitutions.filter { $0.equivalence == .partial }.count == 3)
    }

    @Test func selectMarksUnavailableWhenNothingWorks() {
        let availability = SessionImplementationSelector.select(
            sessionId: .power,
            gymSession: CASPuissance.session,
            availableEquipment: []
        )
        guard case .unavailable = availability else {
            Issue.record("Expected .unavailable"); return
        }
    }

    /// The fail-closed guarantee the architecture correction introduced:
    /// a bodyweight-native session isn't available just because it
    /// belongs to the bodyweight catalog — an undocumented exercise
    /// inside it still makes it `.unavailable`, and the selector must
    /// then fall through to a gym-with-substitutions result rather than
    /// picking the broken bodyweight version.
    @Test func selectFallsBackToGymSubstitutionsWhenBodyweightNativeExerciseIsUndocumented() {
        let reducedRequirements = ExerciseEquipmentRequirements.byExerciseId
            .filter { $0.key != "cas-robustesse-bodyweight-l-sit" }
        let availability = SessionImplementationSelector.select(
            sessionId: .robustness,
            gymSession: CASRobustesse.session,
            availableEquipment: Self.robustesseGymMissingOnlyFarmerCarry,
            requirements: reducedRequirements,
            substitutions: Self.farmerCarrySubstitution
        )
        guard case .availableWithCompromises(let resolved) = availability else {
            Issue.record("Expected .availableWithCompromises (gym), not the undocumented bodyweight version"); return
        }
        #expect(resolved.session.id == CASRobustesse.session.id)
    }

    @Test func bodyweightCounterpartCoversOnlyForceHypertrophieAndRobustesse() {
        #expect(Set(SessionImplementationSelector.bodyweightCounterpart.keys) == [.force, .functionalHypertrophy, .robustness])
    }

    @Test func rotationSlotRecognizesGymAndBodyweightIds() {
        #expect(SessionImplementationSelector.rotationSlot(forSessionId: "cas-force") == .force)
        #expect(SessionImplementationSelector.rotationSlot(forSessionId: "cas-force-bodyweight") == .force)
        #expect(SessionImplementationSelector.rotationSlot(forSessionId: "cas-hypertrophie-bodyweight") == .functionalHypertrophy)
        #expect(SessionImplementationSelector.rotationSlot(forSessionId: "cas-robustesse-bodyweight") == .robustness)
        #expect(SessionImplementationSelector.rotationSlot(forSessionId: "does-not-exist") == nil)
    }
}
