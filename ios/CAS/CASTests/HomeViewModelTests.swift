import Testing
@testable import CAS

@MainActor
struct HomeViewModelTests {

    @Test func exposesAllSessionsFromTheRepository() {
        let viewModel = HomeViewModel()
        #expect(viewModel.sessions.map(\.id) == SeedSessions.primary.map(\.id))
    }

    @Test func recommendationDelegatesToTheRecommendationService() {
        let viewModel = HomeViewModel()
        let recommendation = viewModel.recommendation(afterLastCompletedSessionId: CASSessionID.force.rawValue)
        #expect(recommendation?.session.id == CASSessionID.power.rawValue)
    }
}
