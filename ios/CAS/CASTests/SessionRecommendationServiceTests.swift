import Testing
@testable import CAS

struct SessionRecommendationServiceTests {

    @Test func withNoHistoryRecommendsSeanceA() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: nil)
        #expect(recommendation?.session.id == "seance-a")
        #expect(recommendation?.reason.contains("Aucune séance récente") == true)
    }

    @Test func rotatesThroughTheFixedOrder() {
        let service = RotationRecommendationService()
        let order = ["seance-a", "seance-b", "seance-c", "seance-d", "bras"]
        for (index, id) in order.enumerated() {
            let expectedNextId = order[(index + 1) % order.count]
            let recommendation = service.recommend(lastCompletedSessionId: id)
            #expect(recommendation?.session.id == expectedNextId, "after \(id)")
        }
    }

    @Test func wrapsFromBrasBackToSeanceA() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: "bras")
        #expect(recommendation?.session.id == "seance-a")
    }

    @Test func reasonNamesTheLastCompletedSession() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: "seance-a")
        #expect(recommendation?.reason == "Recommandée car votre dernière séance était Séance A — Force maximale.")
    }

    @Test func fallsBackToSeanceAWhenTheLastSessionIdIsUnknown() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: "does-not-exist")
        #expect(recommendation?.session.id == "seance-a")
    }
}
