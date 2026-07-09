import Testing
@testable import CAS

@MainActor
struct HomeViewModelTests {

    @Test func exposesAllSessionsFromTheRepository() {
        let viewModel = HomeViewModel()
        #expect(viewModel.sessions.map(\.id) == SeedSessions.all.map(\.id))
    }

    @Test func recommendationDelegatesToTheRecommendationService() {
        let viewModel = HomeViewModel()
        let recommendation = viewModel.recommendation(afterLastCompletedSessionId: "seance-b")
        #expect(recommendation?.session.id == "seance-c")
    }
}
