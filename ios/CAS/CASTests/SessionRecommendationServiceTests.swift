import Testing
@testable import CAS

struct SessionRecommendationServiceTests {

    @Test func withNoHistoryRecommendsSeanceA() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: nil)
        #expect(recommendation?.session.id == SeedSessionID.seanceA.rawValue)
        #expect(recommendation?.reason.contains("Aucune séance récente") == true)
    }

    @Test func rotatesThroughTheFixedOrder() {
        let service = RotationRecommendationService()
        let order = SeedSessionID.allCases.map(\.rawValue)
        for (index, id) in order.enumerated() {
            let expectedNextId = order[(index + 1) % order.count]
            let recommendation = service.recommend(lastCompletedSessionId: id)
            #expect(recommendation?.session.id == expectedNextId, "after \(id)")
        }
    }

    @Test func walksTheFullCycleAToBrasAndBackToA() throws {
        // The rotation as a single, readable end-to-end walk — complements
        // rotatesThroughTheFixedOrder's per-transition check with one test
        // that reads exactly like the rule it guarantees: A → B → C → D →
        // Bras → A.
        let service = RotationRecommendationService()
        var lastCompletedSessionId: String?
        var visited: [String] = []
        for _ in SeedSessionID.allCases {
            let recommendation = service.recommend(lastCompletedSessionId: lastCompletedSessionId)
            let nextId = try #require(recommendation?.session.id)
            visited.append(nextId)
            lastCompletedSessionId = nextId
        }
        #expect(visited == [
            SeedSessionID.seanceA.rawValue,
            SeedSessionID.seanceB.rawValue,
            SeedSessionID.seanceC.rawValue,
            SeedSessionID.seanceD.rawValue,
            SeedSessionID.bras.rawValue,
        ])
        // One more step wraps back to A, closing the loop.
        #expect(service.recommend(lastCompletedSessionId: lastCompletedSessionId)?.session.id == SeedSessionID.seanceA.rawValue)
    }

    @Test func wrapsFromBrasBackToSeanceA() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: SeedSessionID.bras.rawValue)
        #expect(recommendation?.session.id == SeedSessionID.seanceA.rawValue)
    }

    @Test func reasonNamesTheLastCompletedSession() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: SeedSessionID.seanceA.rawValue)
        #expect(recommendation?.reason == "Recommandée car votre dernière séance était Séance A — Force maximale.")
    }

    @Test func fallsBackToSeanceAWhenTheLastSessionIdIsUnknown() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: "does-not-exist")
        #expect(recommendation?.session.id == SeedSessionID.seanceA.rawValue)
    }
}
