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

    @Test func sessionAvailabilitiesMarksForceHypertrophyAndRobustnessUnavailableWithNoEquipment() {
        let viewModel = HomeViewModel()
        let availabilities = viewModel.sessionAvailabilities(for: [])
        let unavailableIds = availabilities.compactMap { item -> String? in
            if case .unavailable = item.availability { return item.session.id }
            return nil
        }
        #expect(Set(unavailableIds) == [
            CASSessionID.force.rawValue,
            CASSessionID.functionalHypertrophy.rawValue,
            CASSessionID.robustness.rawValue,
        ])
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
