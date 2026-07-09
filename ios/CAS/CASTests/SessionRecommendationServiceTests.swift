import Testing
@testable import CAS

struct SessionRecommendationServiceTests {

    @Test func withNoHistoryRecommendsCASForce() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: nil)
        #expect(recommendation?.session.id == CASSessionID.force.rawValue)
        #expect(recommendation?.reason.contains("Aucune séance récente") == true)
    }

    @Test func rotatesThroughTheFixedOrder() {
        let service = RotationRecommendationService()
        let order = CASSessionID.allCases.map(\.rawValue)
        for (index, id) in order.enumerated() {
            let expectedNextId = order[(index + 1) % order.count]
            let recommendation = service.recommend(lastCompletedSessionId: id)
            #expect(recommendation?.session.id == expectedNextId, "after \(id)")
        }
    }

    @Test func walksTheFullCycleForceToAerobicBaseAndBackToForce() throws {
        // The rotation as a single, readable end-to-end walk — complements
        // rotatesThroughTheFixedOrder's per-transition check with one test
        // that reads exactly like the rule it guarantees: Force →
        // Puissance → Hypertrophie fonctionnelle → Robustesse → Base
        // aérobie → Force.
        let service = RotationRecommendationService()
        var lastCompletedSessionId: String?
        var visited: [String] = []
        for _ in CASSessionID.allCases {
            let recommendation = service.recommend(lastCompletedSessionId: lastCompletedSessionId)
            let nextId = try #require(recommendation?.session.id)
            visited.append(nextId)
            lastCompletedSessionId = nextId
        }
        #expect(visited == [
            CASSessionID.force.rawValue,
            CASSessionID.power.rawValue,
            CASSessionID.functionalHypertrophy.rawValue,
            CASSessionID.robustness.rawValue,
            CASSessionID.aerobicBase.rawValue,
        ])
        // One more step wraps back to Force, closing the loop.
        #expect(service.recommend(lastCompletedSessionId: lastCompletedSessionId)?.session.id == CASSessionID.force.rawValue)
    }

    @Test func wrapsFromAerobicBaseBackToForce() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.aerobicBase.rawValue)
        #expect(recommendation?.session.id == CASSessionID.force.rawValue)
    }

    @Test func reasonNamesTheLastCompletedSession() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.force.rawValue)
        #expect(recommendation?.reason == "Recommandée car votre dernière séance était CAS Force.")
    }

    @Test func fallsBackToCASForceWhenTheLastSessionIdIsUnknown() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: "does-not-exist")
        #expect(recommendation?.session.id == CASSessionID.force.rawValue)
    }

    @Test func fallsBackToCASForceWhenTheLastSessionWasLegacyContent() {
        // Legacy ids are no longer part of the rotation, so completing
        // one shouldn't produce a recommendation keyed off it.
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: LegacySessionID.bras.rawValue)
        #expect(recommendation?.session.id == CASSessionID.force.rawValue)
    }
}
