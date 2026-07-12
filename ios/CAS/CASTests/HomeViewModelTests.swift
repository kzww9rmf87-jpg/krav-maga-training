import Testing
@testable import CAS

@MainActor
struct HomeViewModelTests {

    @Test func exposesAllSessionsFromTheRepository() {
        let viewModel = HomeViewModel()
        #expect(viewModel.sessions.map(\.id) == SeedSessions.primary.map(\.id))
    }

    @Test func recommendationDelegatesToTheRecommendationServiceWithTheSuppliedEquipment() {
        let viewModel = HomeViewModel()
        let fullyEquippedGym: Set<Equipment> = [
            .barbell, .rack, .bench, .cableMachine, .pullUpBar,
            .dumbbells, .kettlebell, .medicineBall, .resistanceBands, .externalLoad,
        ]
        let recommendation = viewModel.recommendation(afterLastCompletedSessionId: CASSessionID.force.rawValue, availableEquipment: fullyEquippedGym)
        #expect(recommendation?.resolved.session.id == CASSessionID.power.rawValue)
    }

    @Test func sessionAvailabilitiesAlwaysReturnsAllFiveSessions() {
        let viewModel = HomeViewModel()
        let availabilities = viewModel.sessionAvailabilities(for: [])
        #expect(availabilities.map(\.session.id) == SeedSessions.primary.map(\.id))
    }

    /// Beta 1.0: Force/Hypertrophie fonctionnelle/Robustesse are no
    /// longer unavailable with no equipment — they resolve via their
    /// bodyweight-native counterpart. The row's identity (`session.id`)
    /// stays the gym id (the emplacement key), but the *displayed*
    /// implementation (`ResolvedTrainingSession.session`) is the
    /// bodyweight one — locking in that "Toutes les séances" shows the
    /// selected implementation's own title, not the gym title, for an
    /// available row.
    @Test func sessionAvailabilitiesShowsBodyweightNativeForForceHypertrophyAndRobustnessWithNoEquipment() {
        let viewModel = HomeViewModel()
        let availabilities = viewModel.sessionAvailabilities(for: [])

        let expectations: [(slot: CASSessionID, bodyweightId: String)] = [
            (.force, CASForceBodyweight.session.id),
            (.functionalHypertrophy, CASHypertrophieBodyweight.session.id),
            (.robustness, CASRobustesseBodyweight.session.id),
        ]
        for expectation in expectations {
            let item = availabilities.first { $0.session.id == expectation.slot.rawValue }
            #expect(item?.session.id == expectation.slot.rawValue, "row identity should stay the gym id for \(expectation.slot)")
            guard case .available(let resolved) = item?.availability else {
                Issue.record("Expected .available (bodyweight native) for \(expectation.slot)")
                continue
            }
            #expect(resolved.session.id == expectation.bodyweightId)
        }
    }

    @Test func sessionAvailabilitiesMarksPuissanceWithCompromisesAndAerobicBaseAvailableWithNoEquipment() {
        let viewModel = HomeViewModel()
        let availabilities = viewModel.sessionAvailabilities(for: [])

        let puissance = availabilities.first { $0.session.id == CASSessionID.power.rawValue }
        guard case .availableWithCompromises = puissance?.availability else {
            Issue.record("Expected CAS Puissance availableWithCompromises with no equipment")
            return
        }

        let aerobicBase = availabilities.first { $0.session.id == CASSessionID.aerobicBase.rawValue }
        guard case .available = aerobicBase?.availability else {
            Issue.record("Expected CAS Base aérobie available with no equipment")
            return
        }
    }
}
